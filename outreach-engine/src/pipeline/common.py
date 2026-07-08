"""Shared utilities for the outreach engine.

Structured JSON logging to stdout, retry with exponential backoff,
config/profile loading, and HTTP helpers. Every script in the engine
imports from here so behavior is uniform and Claude Code can parse
every log line the same way.
"""
from __future__ import annotations

import json
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar

# Repo layout: this file lives at src/pipeline/common.py
ENGINE_ROOT: Path = Path(__file__).resolve().parents[2]

T = TypeVar("T")

USER_AGENTS: list[str] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]


def jlog(event: str, level: str = "info", **fields: Any) -> None:
    """Emit one structured JSON log line to stdout."""
    record: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "event": event,
    }
    record.update(fields)
    print(json.dumps(record, ensure_ascii=False, default=str), flush=True)


def load_config() -> dict[str, Any]:
    """Load config.json from the engine root."""
    with open(ENGINE_ROOT / "config.json", encoding="utf-8") as f:
        return json.load(f)


def load_product_profile(product_id: Optional[str] = None) -> dict[str, Any]:
    """Load a product profile. Defaults to config's active_product,
    overridable with the OUTREACH_PRODUCT env var."""
    cfg = load_config()
    pid = product_id or os.environ.get("OUTREACH_PRODUCT") or cfg["active_product"]
    path = ENGINE_ROOT / "product-profiles" / f"{pid}.json"
    with open(path, encoding="utf-8") as f:
        profile: dict[str, Any] = json.load(f)
    return profile


def get_secret(env_name: Optional[str]) -> str:
    """Read a secret from the environment. Returns '' when unset —
    callers decide whether that means skip or fail."""
    if not env_name:
        return ""
    return os.environ.get(env_name, "").strip()


def with_retries(
    fn: Callable[[], T],
    attempts: int = 3,
    base_delay: float = 2.0,
    what: str = "operation",
) -> T:
    """Run fn with retries: 3 attempts, exponential backoff (2s, 4s, 8s).
    Re-raises the last exception after the final attempt."""
    last_exc: Optional[BaseException] = None
    for i in range(1, attempts + 1):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 — log and retry every failure mode
            last_exc = exc
            delay = base_delay * (2 ** (i - 1))
            jlog("retry", level="warn", what=what, attempt=i,
                 max_attempts=attempts, error=str(exc),
                 next_delay_s=delay if i < attempts else None)
            if i < attempts:
                time.sleep(delay)
    assert last_exc is not None
    raise last_exc


def http_request(
    url: str,
    method: str = "GET",
    params: Optional[dict[str, Any]] = None,
    json_body: Optional[dict[str, Any]] = None,
    headers: Optional[dict[str, str]] = None,
    timeout: float = 30.0,
    rotate_ua: bool = False,
) -> tuple[int, str]:
    """Make one HTTP request using stdlib only. Returns (status, body_text).
    Raises urllib.error.URLError / HTTPError on transport failures so
    with_retries can catch and back off."""
    if params:
        sep = "&" if "?" in url else "?"
        url = url + sep + urllib.parse.urlencode(params, doseq=True)
    hdrs = dict(headers or {})
    if rotate_ua and "User-Agent" not in hdrs:
        hdrs["User-Agent"] = random.choice(USER_AGENTS)
    hdrs.setdefault("Accept", "application/json, text/html;q=0.9, */*;q=0.8")
    data: Optional[bytes] = None
    if json_body is not None:
        data = json.dumps(json_body).encode("utf-8")
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        # 4xx other than 429 won't improve on retry — return instead of raising
        if 400 <= e.code < 500 and e.code != 429:
            return e.code, body
        raise


def http_json(
    url: str,
    method: str = "GET",
    params: Optional[dict[str, Any]] = None,
    json_body: Optional[dict[str, Any]] = None,
    headers: Optional[dict[str, str]] = None,
    timeout: float = 30.0,
    what: str = "http",
) -> tuple[int, Any]:
    """HTTP request with retries; parses the body as JSON when possible."""
    status, text = with_retries(
        lambda: http_request(url, method=method, params=params,
                             json_body=json_body, headers=headers,
                             timeout=timeout),
        what=what,
    )
    try:
        return status, json.loads(text) if text else {}
    except json.JSONDecodeError:
        return status, {"_raw": text[:2000]}


def normalize_domain(url_or_domain: str) -> str:
    """'https://www.Foo.com/path' -> 'foo.com'."""
    s = (url_or_domain or "").strip().lower()
    if not s:
        return ""
    if "://" in s:
        s = urllib.parse.urlparse(s).netloc
    s = s.split("/")[0].split(":")[0]
    if s.startswith("www."):
        s = s[4:]
    return s


def dedupe_key(company_name: str, domain: str) -> str:
    """Normalized company name + domain — the cross-source identity of a lead."""
    name = "".join(c for c in (company_name or "").lower() if c.isalnum() or c == " ")
    for suffix in (" llc", " inc", " pllc", " pc", " pa", " md", " ltd", " corp",
                   " llp", " group", " associates"):
        if name.endswith(suffix):
            name = name[: -len(suffix)]
    name = " ".join(name.split())
    return f"{name}|{normalize_domain(domain)}"
