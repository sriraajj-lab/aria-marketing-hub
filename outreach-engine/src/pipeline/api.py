"""FastAPI backend for the outreach engine.

CRUD for leads, contacts, outreach, replies, meetings; approval
endpoints (the human-in-the-loop boundary); dashboard stats; the
CAN-SPAM unsubscribe endpoint; and the Vapi call-outcome webhook.

Run:
    uvicorn src.pipeline.api:app --host 0.0.0.0 --port 8080
"""
from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel, Field

from src.pipeline.common import ENGINE_ROOT, jlog, load_config
from src.pipeline import database as db

app = FastAPI(title="outreach-engine", version="1.0.0")

DASHBOARD_FILE = ENGINE_ROOT / "src" / "dashboard" / "index.html"


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(r) for r in rows]


# ------------------------------------------------------------------
# Dashboard
# ------------------------------------------------------------------

@app.get("/dashboard")
@app.get("/dashboard/")
def dashboard() -> FileResponse:
    return FileResponse(DASHBOARD_FILE, media_type="text/html")


@app.get("/api/stats")
def stats(product_id: Optional[str] = None) -> dict[str, Any]:
    conn = db.get_db()
    try:
        return db.dashboard_stats(conn, product_id)
    finally:
        conn.close()


@app.get("/api/products")
def products() -> list[dict[str, Any]]:
    conn = db.get_db()
    try:
        return rows_to_dicts(conn.execute(
            "SELECT product_id, product_name, active FROM products").fetchall())
    finally:
        conn.close()


# ------------------------------------------------------------------
# Leads
# ------------------------------------------------------------------

class LeadIn(BaseModel):
    product_id: str
    source: str = "manual"
    company_name: str
    domain: str = ""
    contact_name: str = ""
    title: str = ""
    specialty: str = ""
    email: str = ""
    phone: str = ""
    city: str = ""
    state: str = ""
    website: str = ""
    pain_signal: str = ""


class StatusIn(BaseModel):
    status: str = Field(pattern="^(new|enriched|scored|outreach_sent|replied|"
                                "meeting_booked|won|lost|unsubscribed)$")


@app.get("/api/leads")
def list_leads(status: Optional[str] = None,
               product_id: Optional[str] = None,
               min_score: int = 0,
               limit: int = Query(100, le=1000),
               offset: int = 0) -> list[dict[str, Any]]:
    conn = db.get_db()
    try:
        sql = "SELECT * FROM leads WHERE score >= ? AND status != 'duplicate'"
        args: list[Any] = [min_score]
        if status:
            sql += " AND status = ?"
            args.append(status)
        if product_id:
            sql += " AND product_id = ?"
            args.append(product_id)
        sql += " ORDER BY score DESC, created_at DESC LIMIT ? OFFSET ?"
        args.extend([limit, offset])
        return rows_to_dicts(conn.execute(sql, args).fetchall())
    finally:
        conn.close()


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: int) -> dict[str, Any]:
    conn = db.get_db()
    try:
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "lead not found")
        lead = dict(row)
        lead["sources"] = rows_to_dicts(conn.execute(
            "SELECT source, raw_json, created_at FROM lead_sources WHERE lead_id = ?",
            (lead_id,)).fetchall())
        lead["contacts"] = rows_to_dicts(conn.execute(
            "SELECT * FROM contacts WHERE lead_id = ?", (lead_id,)).fetchall())
        lead["outreach"] = rows_to_dicts(conn.execute(
            "SELECT * FROM outreach WHERE lead_id = ? ORDER BY created_at",
            (lead_id,)).fetchall())
        lead["replies"] = rows_to_dicts(conn.execute(
            "SELECT * FROM replies WHERE lead_id = ? ORDER BY created_at",
            (lead_id,)).fetchall())
        return lead
    finally:
        conn.close()


@app.post("/api/leads", status_code=201)
def create_lead(lead: LeadIn) -> dict[str, Any]:
    conn = db.get_db()
    try:
        lead_id, is_new = db.insert_lead(conn, {**lead.model_dump(), "raw": lead.model_dump()})
        return {"id": lead_id, "is_new": is_new}
    finally:
        conn.close()


@app.patch("/api/leads/{lead_id}/status")
def set_lead_status(lead_id: int, body: StatusIn) -> dict[str, str]:
    conn = db.get_db()
    try:
        if conn.execute("SELECT 1 FROM leads WHERE id = ?", (lead_id,)).fetchone() is None:
            raise HTTPException(404, "lead not found")
        db.update_lead_status(conn, lead_id, body.status)
        return {"status": body.status}
    finally:
        conn.close()


# ------------------------------------------------------------------
# Outreach + approvals (the human-in-the-loop boundary)
# ------------------------------------------------------------------

@app.get("/api/outreach")
def list_outreach(status: Optional[str] = None, channel: Optional[str] = None,
                  limit: int = Query(100, le=1000)) -> list[dict[str, Any]]:
    conn = db.get_db()
    try:
        sql = """SELECT o.*, l.company_name, l.email AS lead_email, l.score
                 FROM outreach o JOIN leads l ON l.id = o.lead_id WHERE 1=1"""
        args: list[Any] = []
        if status:
            sql += " AND o.status = ?"
            args.append(status)
        if channel:
            sql += " AND o.channel = ?"
            args.append(channel)
        sql += " ORDER BY o.created_at DESC LIMIT ?"
        args.append(limit)
        return rows_to_dicts(conn.execute(sql, args).fetchall())
    finally:
        conn.close()


@app.post("/api/outreach/{outreach_id}/approve")
def approve_outreach(outreach_id: int) -> dict[str, str]:
    """Human approval. Moves queued -> approved; senders only touch approved."""
    conn = db.get_db()
    try:
        cur = conn.execute(
            "UPDATE outreach SET status = 'approved' WHERE id = ? AND status = 'queued'",
            (outreach_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(409, "outreach not found or not in 'queued' state")
        jlog("outreach_approved", outreach_id=outreach_id)
        return {"status": "approved"}
    finally:
        conn.close()


@app.post("/api/outreach/{outreach_id}/cancel")
def cancel_outreach(outreach_id: int) -> dict[str, str]:
    conn = db.get_db()
    try:
        cur = conn.execute(
            "UPDATE outreach SET status = 'cancelled' "
            "WHERE id = ? AND status IN ('queued','approved')", (outreach_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(409, "outreach not found or already sent")
        jlog("outreach_cancelled", outreach_id=outreach_id)
        return {"status": "cancelled"}
    finally:
        conn.close()


# ------------------------------------------------------------------
# Replies & meetings
# ------------------------------------------------------------------

class ReplyIn(BaseModel):
    lead_id: int
    body: str
    sentiment: str = Field(pattern="^(interested|not_interested|wrong_person|unsubscribe|other)$")
    channel: str = "email"
    outreach_id: Optional[int] = None


@app.post("/api/replies", status_code=201)
def create_reply(reply: ReplyIn) -> dict[str, int]:
    conn = db.get_db()
    try:
        rid = db.insert_reply(conn, reply.lead_id, reply.body, reply.sentiment,
                              reply.channel, reply.outreach_id)
        if reply.sentiment == "unsubscribe":
            row = conn.execute("SELECT email FROM leads WHERE id = ?",
                               (reply.lead_id,)).fetchone()
            if row and row["email"]:
                conn.execute(
                    "INSERT OR IGNORE INTO unsubscribes (email, lead_id) VALUES (?, ?)",
                    (row["email"], reply.lead_id))
                db.update_lead_status(conn, reply.lead_id, "unsubscribed")
        jlog("reply_recorded", reply_id=rid, sentiment=reply.sentiment)
        return {"id": rid}
    finally:
        conn.close()


class MeetingIn(BaseModel):
    lead_id: int
    scheduled_at: str
    calendar_link: str = ""
    source_channel: str = "email"
    notes: str = ""


@app.post("/api/meetings", status_code=201)
def create_meeting(m: MeetingIn) -> dict[str, int]:
    conn = db.get_db()
    try:
        mid = db.insert_meeting(conn, m.lead_id, m.scheduled_at,
                                m.calendar_link, m.source_channel, m.notes)
        jlog("meeting_booked", meeting_id=mid, lead_id=m.lead_id)
        return {"id": mid}
    finally:
        conn.close()


@app.get("/api/meetings")
def list_meetings(limit: int = Query(100, le=1000)) -> list[dict[str, Any]]:
    conn = db.get_db()
    try:
        return rows_to_dicts(conn.execute(
            """SELECT m.*, l.company_name, l.contact_name FROM meetings m
               JOIN leads l ON l.id = m.lead_id
               ORDER BY m.scheduled_at DESC LIMIT ?""", (limit,)).fetchall())
    finally:
        conn.close()


# ------------------------------------------------------------------
# CAN-SPAM unsubscribe (public, linked in every email footer)
# ------------------------------------------------------------------

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@app.get("/api/unsubscribe", response_class=PlainTextResponse)
def unsubscribe(email: str) -> str:
    email = email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "invalid email")
    conn = db.get_db()
    try:
        conn.execute("INSERT OR IGNORE INTO unsubscribes (email) VALUES (?)", (email,))
        conn.execute(
            "UPDATE leads SET status = 'unsubscribed', updated_at = datetime('now') "
            "WHERE email = ?", (email,))
        conn.commit()
        jlog("unsubscribed", email=email)
        return "You have been unsubscribed. You will not receive further emails."
    finally:
        conn.close()


# ------------------------------------------------------------------
# Vapi webhook — call outcomes land here
# ------------------------------------------------------------------

@app.post("/api/webhooks/vapi")
async def vapi_webhook(request: Request) -> dict[str, str]:
    try:
        payload = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(400, "invalid JSON")
    message = payload.get("message", {})
    mtype = message.get("type", "")
    call = message.get("call", {})
    metadata = (call.get("assistant") or {}).get("metadata") or call.get("metadata") or {}
    lead_id = metadata.get("lead_id")
    outreach_id = metadata.get("outreach_id")
    jlog("vapi_webhook", type=mtype, lead_id=lead_id, outreach_id=outreach_id)

    if mtype == "end-of-call-report" and lead_id:
        summary = message.get("summary", "") or message.get("analysis", {}).get("summary", "")
        ended_reason = call.get("endedReason", "") or message.get("endedReason", "")
        lowered = (summary + " " + ended_reason).lower()
        if any(k in lowered for k in ("booked", "demo scheduled", "meeting", "interested")):
            sentiment = "interested"
        elif "voicemail" in lowered:
            sentiment = "other"
        elif any(k in lowered for k in ("wrong number", "wrong person", "not the right")):
            sentiment = "wrong_person"
        elif any(k in lowered for k in ("not interested", "declined", "do not call")):
            sentiment = "not_interested"
        else:
            sentiment = "other"
        conn = db.get_db()
        try:
            db.insert_reply(conn, int(lead_id), body=summary[:2000],
                            sentiment=sentiment, channel="call",
                            outreach_id=int(outreach_id) if outreach_id else None)
        finally:
            conn.close()
    return {"status": "ok"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    cfg = load_config()["api"]
    uvicorn.run(app, host=cfg["host"], port=cfg["port"])
