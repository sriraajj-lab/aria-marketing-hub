"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Shield,
  Brain,
  FileText,
  DollarSign,
  Zap,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Clock,
  Lock,
  Stethoscope,
  Menu,
  X,
  ChevronRight,
  Code2,
  Terminal,
  Globe,
  Cpu,
  Key,
  Webhook,
  Activity,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Copy,
  Check,
  Server,
  BookOpen,
  Boxes,
  Scale,
  Mail,
} from "lucide-react";

/* ─── Fade In Section ─── */
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Code Block with Copy ─── */
function CodeBlock({ code, language = "json", title = "" }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-[#0d1117] shadow-lg">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#8b949e]" />
            <span className="text-xs font-medium text-[#8b949e]">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-[#8b949e] uppercase">{language}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-[#30363d] transition-colors"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
              )}
            </button>
          </div>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[#c9d1d9] font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

/* ─── NAV ─── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Endpoint", href: "#endpoint" },
    { label: "Examples", href: "#examples" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integration", href: "#integration" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-border shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Denials<span className="text-primary">Doctor</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Home
            </a>
            <a
              href="mailto:hello@denialsdoctor.com?subject=API Access Request"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2"
            >
              Get API Key
              <Key className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-foreground"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-3 border-t border-border mt-2 space-y-2">
                <a href="/" className="block px-4 py-2.5 text-sm font-medium text-muted-foreground">
                  Back to Home
                </a>
                <a
                  href="mailto:hello@denialsdoctor.com?subject=API Access Request"
                  className="block px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg text-center"
                >
                  Get API Key
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─── HERO ─── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/3 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary text-xs font-semibold mb-6">
              <Code2 className="w-3.5 h-3.5" />
              AI API as a Service
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6"
          >
            Denial Analysis API —{" "}
            <span className="gradient-text">Send a Claim, Get Back Classification + Fix + Appeal Letter in 2 Seconds</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-3xl"
          >
            Integrate denial intelligence into your SaaS, EHR, or billing system. One API call returns denial classification,
            root cause, corrected codes, appeal letter, and confidence score — powered by 6 specialist AI agents.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <a
              href="mailto:hello@denialsdoctor.com?subject=API Access Request"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              Get API Key
              <Key className="w-4.5 h-4.5" />
            </a>
            <a
              href="#examples"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-primary border-2 border-primary/30 hover:border-primary hover:bg-primary-50 rounded-xl transition-all"
            >
              View Examples
            </a>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-primary" />
              &lt;2s Response Time
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4.5 h-4.5 text-primary" />
              HIPAA Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-4.5 h-4.5 text-primary" />
              FHIR R4 Compatible
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4.5 h-4.5 text-primary" />
              SOC 2 Certified
            </span>
          </motion.div>

          {/* Endpoint preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10"
          >
            <div className="bg-[#0d1117] rounded-xl border border-[#30363d] p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">POST</span>
                <code className="text-sm text-[#c9d1d9] font-mono">https://denialsdoctor.com/api/v1/analyze</code>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── ENDPOINT DETAILS ─── */
function Endpoint() {
  const requestExample = `{
  "claim": {
    "patient": {
      "id": "PT-28471",
      "dob": "1985-03-15",
      "insurance_id": "XYZ123456789"
    },
    "payer": {
      "name": "UnitedHealthcare",
      "id": "87726"
    },
    "denial": {
      "reason": "Denial matches NCCI bundling edit",
      "carc_code": "97",
      "rarc_code": "N380",
      "denied_date": "2025-01-15"
    },
    "service": {
      "cpt_codes": ["99213", "96372"],
      "icd10_codes": ["M54.5", "Z79.899"],
      "date_of_service": "2025-01-10",
      "billed_amount": 425.00,
      "allowed_amount": 0,
      "provider_npi": "1234567890"
    }
  }
}`;

  const responseExample = `{
  "analysis_id": "ANA-2025-28471",
  "denial_classification": {
    "type": "coding_bundling",
    "category": "NCCI Edit Violation",
    "severity": "medium",
    "recoverable": true
  },
  "root_cause": {
    "primary": "CPT 96372 bundled into E/M 99213 per NCCI Column 1/Column 2 edit",
    "secondary": "Modifier 25 may be applicable if documentation supports separate E/M",
    "confidence": 0.94
  },
  "corrected_codes": {
    "original": ["99213", "96372"],
    "recommended": ["99213-25", "96372"],
    "modifier_added": "25",
    "rationale": "Modifier 25 indicates significant, separately identifiable E/M service on same day as procedure"
  },
  "appeal_letter": "Dear UnitedHealthcare Claims Review Department...\\n\\nWe are writing to appeal the denial of CPT 96372 for patient PT-28471...\\n\\nPer CMS NCCI Policy Manual Chapter 1, Section E, when a significant and separately identifiable E/M service is performed...\\n\\n[Full appeal letter continues]",
  "confidence_score": 0.94,
  "recommended_actions": [
    {
      "action": "add_modifier",
      "detail": "Add modifier 25 to CPT 99213",
      "priority": "critical"
    },
    {
      "action": "resubmit_claim",
      "detail": "Resubmit with corrected codes to payer",
      "priority": "high"
    },
    {
      "action": "documentation_review",
      "detail": "Ensure E/M documentation supports separate service",
      "priority": "medium"
    }
  ],
  "processing_time_ms": 1823,
  "agents_used": ["orchestrator", "coding", "billing_scrubber", "appeals"]
}`;

  return (
    <section id="endpoint" className="py-20 lg:py-28 bg-muted/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">API Reference</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              One Endpoint. <span className="gradient-text">Complete Intelligence.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Send a denied claim, get back everything you need to fix it.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FadeIn delay={0.1}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-bold font-mono border border-blue-200">REQUEST</span>
                <span className="text-sm text-muted-foreground">POST /api/v1/analyze</span>
              </div>
              <CodeBlock code={requestExample} language="json" title="Request Body" />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold font-mono border border-emerald-200">RESPONSE</span>
                <span className="text-sm text-muted-foreground">200 OK</span>
              </div>
              <CodeBlock code={responseExample} language="json" title="Response Body" />
            </div>
          </FadeIn>
        </div>

        {/* Response fields breakdown */}
        <FadeIn delay={0.3}>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Cpu, title: "Denial Classification", desc: "Type, category, severity, and recoverability flag" },
              { icon: Brain, title: "Root Cause", desc: "Primary and secondary causes with confidence score" },
              { icon: Code2, title: "Corrected Codes", desc: "Original vs recommended codes with modifiers and rationale" },
              { icon: FileText, title: "Appeal Letter", desc: "Complete appeal letter with verified regulatory citations" },
              { icon: Activity, title: "Confidence Score", desc: "0–1 score indicating analysis reliability" },
              { icon: Zap, title: "Recommended Actions", desc: "Prioritized action items (critical, high, medium)" },
            ].map((field, i) => (
              <div key={field.title} className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <field.icon className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground">{field.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{field.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── CODE EXAMPLES ─── */
function Examples() {
  const [activeTab, setActiveTab] = useState<"python" | "javascript" | "curl">("python");

  const pythonCode = `import requests

API_KEY = "dd_live_your_api_key_here"
ENDPOINT = "https://denialsdoctor.com/api/v1/analyze"

payload = {
    "claim": {
        "patient": {
            "id": "PT-28471",
            "dob": "1985-03-15",
            "insurance_id": "XYZ123456789"
        },
        "payer": {
            "name": "UnitedHealthcare",
            "id": "87726"
        },
        "denial": {
            "reason": "Denial matches NCCI bundling edit",
            "carc_code": "97",
            "rarc_code": "N380"
        },
        "service": {
            "cpt_codes": ["99213", "96372"],
            "icd10_codes": ["M54.5"],
            "billed_amount": 425.00
        }
    }
}

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

response = requests.post(ENDPOINT, json=payload, headers=headers)
result = response.json()

print(f"Classification: {result['denial_classification']['type']}")
print(f"Confidence: {result['confidence_score']}")
print(f"Corrected codes: {result['corrected_codes']['recommended']}")
print(f"Actions: {[a['action'] for a in result['recommended_actions']]}")`;

  const jsCode = `const API_KEY = "dd_live_your_api_key_here";
const ENDPOINT = "https://denialsdoctor.com/api/v1/analyze";

const payload = {
  claim: {
    patient: {
      id: "PT-28471",
      dob: "1985-03-15",
      insurance_id: "XYZ123456789"
    },
    payer: {
      name: "UnitedHealthcare",
      id: "87726"
    },
    denial: {
      reason: "Denial matches NCCI bundling edit",
      carc_code: "97",
      rarc_code: "N380"
    },
    service: {
      cpt_codes: ["99213", "96372"],
      icd10_codes: ["M54.5"],
      billed_amount: 425.00
    }
  }
};

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

const result = await response.json();

console.log(\`Classification: \${result.denial_classification.type}\`);
console.log(\`Confidence: \${result.confidence_score}\`);
console.log(\`Corrected codes: \${result.corrected_codes.recommended}\`);`;

  const curlCode = `curl -X POST https://denialsdoctor.com/api/v1/analyze \\
  -H "Authorization: Bearer dd_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "claim": {
      "patient": {
        "id": "PT-28471",
        "dob": "1985-03-15",
        "insurance_id": "XYZ123456789"
      },
      "payer": {
        "name": "UnitedHealthcare",
        "id": "87726"
      },
      "denial": {
        "reason": "Denial matches NCCI bundling edit",
        "carc_code": "97",
        "rarc_code": "N380"
      },
      "service": {
        "cpt_codes": ["99213", "96372"],
        "icd10_codes": ["M54.5"],
        "billed_amount": 425.00
      }
    }
  }'`;

  const codes: Record<string, { code: string; lang: string }> = {
    python: { code: pythonCode, lang: "python" },
    javascript: { code: jsCode, lang: "javascript" },
    curl: { code: curlCode, lang: "bash" },
  };

  return (
    <section id="examples" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Code Examples</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Integrate in <span className="gradient-text">5 Minutes</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Copy, paste, and start analyzing denials from your application.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="max-w-4xl mx-auto">
            {/* Tab buttons */}
            <div className="flex items-center gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
              {(["python", "javascript", "curl"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "python" ? "Python" : tab === "javascript" ? "JavaScript" : "cURL"}
                </button>
              ))}
            </div>

            <CodeBlock
              code={codes[activeTab].code}
              language={codes[activeTab].lang}
              title={`${activeTab === "curl" ? "cURL" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Example`}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "$249",
      period: "/mo",
      calls: "1,000",
      perCall: "$0.25",
      overage: "$0.25/call after",
      features: [
        "1,000 API calls/month",
        "All 6 AI agents",
        "Full denial classification",
        "Code corrections + appeal letters",
        "Standard support (48h SLA)",
        "Sandbox environment",
        "Webhook notifications",
      ],
      popular: false,
      cta: "Get API Key",
    },
    {
      name: "Growth",
      price: "$1,499",
      period: "/mo",
      calls: "10,000",
      perCall: "$0.15",
      overage: "$0.15/call after",
      features: [
        "10,000 API calls/month",
        "Everything in Starter, plus:",
        "Priority processing queue",
        "FHIR R4 batch endpoints",
        "Custom denial categories",
        "Premium support (4h SLA)",
        "Rate limit: 100 req/sec",
        "Dedicated integration support",
      ],
      popular: true,
      cta: "Get API Key",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      calls: "Unlimited",
      perCall: "Volume pricing",
      overage: "No overage fees",
      features: [
        "Unlimited API calls",
        "Custom rate limits",
        "99.9% uptime SLA",
        "On-premise deployment option",
        "Custom model fine-tuning",
        "Dedicated success manager",
        "FHIR R4 + X12 EDI support",
        "HIPAA BAA included",
        "SSO & audit logging",
      ],
      popular: false,
      cta: "Contact Sales",
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="grid-bg w-full h-full" style={{ filter: "invert(1)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary-200 text-sm font-semibold uppercase tracking-wider">API Pricing</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-3 mb-4">
              Pay Per Call. <span className="text-primary-200">Scale As You Grow.</span>
            </h2>
            <p className="text-lg text-primary-100/70 max-w-2xl mx-auto">
              Transparent pricing with no hidden fees. Start small, scale to millions of claims.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.name} delay={i * 0.15}>
              <div className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border transition-all hover:bg-white/15 flex flex-col ${
                tier.popular ? "border-primary-400 ring-1 ring-primary-400/30" : "border-white/10 hover:border-white/20"
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-sm text-primary-100/60">{tier.calls} calls/month</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                    <span className="text-lg text-primary-100/60">{tier.period}</span>
                  </div>
                  <p className="text-sm text-primary-100/50 mt-1">{tier.perCall}/call · {tier.overage}</p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-primary-100/70">
                      <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.name === "Enterprise" ? "mailto:hello@denialsdoctor.com?subject=Enterprise API Pricing" : "mailto:hello@denialsdoctor.com?subject=API Access Request"}
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    tier.popular
                      ? "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/30"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  }`}
                >
                  {tier.cta}
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── INTEGRATION ─── */
function Integration() {
  return (
    <section id="integration" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Integration</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Built for <span className="gradient-text">Developers</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              REST API with standards-compliant integrations and developer-friendly tooling.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Server, title: "REST API", desc: "Standard RESTful API with JSON request/response. Compatible with any HTTP client in any language." },
            { icon: Webhook, title: "Webhooks", desc: "Real-time notifications for analysis completion, appeal status changes, and batch processing updates." },
            { icon: Globe, title: "FHIR R4", desc: "Healthcare-standard FHIR R4 resources for Claim, ClaimResponse, and ExplanationOfBenefit." },
            { icon: Shield, title: "Authentication", desc: "Bearer token authentication with API key rotation. OAuth 2.0 available for Enterprise plans." },
            { icon: Activity, title: "Rate Limiting", desc: "Starter: 10 req/sec. Growth: 100 req/sec. Enterprise: custom limits. Batch endpoints available." },
            { icon: BookOpen, title: "SDKs & Libraries", desc: "Official Python and JavaScript SDKs. OpenAPI 3.0 spec for auto-generating clients in any language." },
          ].map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.1}>
              <div className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all group hover:shadow-lg hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                  <item.icon className="w-5.5 h-5.5 text-primary" />
                </div>
                <h4 className="text-base font-bold text-foreground mb-1.5">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How fast is the API response?",
      a: "Average response time is under 2 seconds for a single claim analysis. Batch endpoints process up to 1,000 claims per request with async processing and webhook notifications.",
    },
    {
      q: "Is the API HIPAA compliant?",
      a: "Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We sign Business Associate Agreements (BAAs) with all API customers. PHI is never logged or stored beyond the analysis window.",
    },
    {
      q: "What happens if I exceed my monthly call limit?",
      a: "You'll be charged the per-call overage rate for your plan ($0.25 for Starter, $0.15 for Growth). We'll notify you at 80% and 100% usage. Enterprise plans have no overage fees.",
    },
    {
      q: "Can I fine-tune the AI models on my data?",
      a: "Enterprise plans include custom model fine-tuning on your historical denial and appeal data. This improves accuracy for your specific payer mix and specialties.",
    },
    {
      q: "Do you support batch processing?",
      a: "Yes. The /api/v1/batch endpoint accepts up to 1,000 claims per request. Results are delivered via webhook or polling. Batch processing is available on Growth and Enterprise plans.",
    },
    {
      q: "How do I get an API key?",
      a: "Click 'Get API Key' to request access. We'll set up your sandbox environment within 24 hours with test data and documentation. Production keys are issued after integration review.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-muted/50 border-y border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Developer <span className="gradient-text">Questions</span>
            </h2>
          </div>
        </FadeIn>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function FinalCTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary text-xs font-semibold mb-6">
            <Code2 className="w-3.5 h-3.5" />
            Developer-First API
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
            Start Analyzing Denials
            <br />
            <span className="gradient-text">in 5 Minutes</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get your API key, send your first claim, and receive a complete denial analysis with corrected codes and appeal letter — all in under 2 seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:hello@denialsdoctor.com?subject=API Access Request"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              Get API Key
              <Key className="w-4.5 h-4.5" />
            </a>
            <a
              href="#endpoint"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-primary border-2 border-primary/30 hover:border-primary hover:bg-primary-50 rounded-xl transition-all"
            >
              View Documentation
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="bg-primary-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Stethoscope className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Denials<span className="text-primary-200">Doctor</span>
            </span>
          </div>
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Denials Doctor. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> HIPAA</span>
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> SOC 2</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── MAIN PAGE ─── */
export default function APIDocsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <Hero />
      <Endpoint />
      <Examples />
      <Pricing />
      <Integration />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
