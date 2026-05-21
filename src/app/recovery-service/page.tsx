"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Shield,
  Brain,
  FileText,
  DollarSign,
  Activity,
  Zap,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Clock,
  Users,
  Building2,
  TrendingUp,
  Lock,
  Stethoscope,
  Menu,
  X,
  ChevronRight,
  Send,
  Upload,
  Cpu,
  BadgeCheck,
  CircleDollarSign,
  HandCoins,
  Scale,
  FileCheck2,
  RefreshCcw,
  Eye,
  Target,
  Sparkles,
  HelpCircle,
  ChevronDown,
  HeartPulse,
  Briefcase,
  Hospital,
  UserCheck,
  Banknote,
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

/* ─── Animated Counter ─── */
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
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
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Results", href: "#results" },
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
              href="#pricing"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2"
            >
              Start Recovery
              <ArrowRight className="w-4 h-4" />
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
                  href="#pricing"
                  className="block px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg text-center"
                >
                  Start Recovery
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
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-500/3 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-6">
              <HandCoins className="w-3.5 h-3.5" />
              Done-For-You Recovery · No Upfront Cost
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6"
          >
            We Recover Your Denied Revenue.{" "}
            <span className="gradient-text">You Pay Nothing Upfront.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            Send us your denied claims. Our 6 AI agents analyze, fix, appeal, and recover your revenue.
            You only pay a percentage of what we actually recover. <strong className="text-foreground">No recovery = no fee.</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
          >
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              Start Recovery
              <ArrowRight className="w-4.5 h-4.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-primary border-2 border-primary/30 hover:border-primary hover:bg-primary-50 rounded-xl transition-all"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-4.5 h-4.5 text-primary" />
              HIPAA Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Banknote className="w-4.5 h-4.5 text-emerald-600" />
              Contingency Pricing
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-primary" />
              2-Week Turnaround
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorks() {
  const steps = [
    {
      step: 1,
      icon: Upload,
      title: "Send Us Your Denied Claims",
      desc: "Upload your 835/ERA files, spreadsheets, or connect your billing system. We ingest all denied claim data — patient info, codes, payer details, and denial reason codes.",
      color: "cyan",
    },
    {
      step: 2,
      icon: Cpu,
      title: "Our 6 AI Agents Analyze Every Claim",
      desc: "Each claim flows through our specialist agents — Demographics, Eligibility, Coding, Billing Scrubber, Appeals, and the Orchestrator. Every agent has strict scope boundaries and anti-hallucination guardrails.",
      color: "emerald",
    },
    {
      step: 3,
      icon: FileCheck2,
      title: "We Fix, Appeal, and Recover",
      desc: "Corrected codes, appeal letters with verified regulatory citations, eligibility resolution, claim resubmission — all handled by our team using AI-generated outputs.",
      color: "primary",
    },
    {
      step: 4,
      icon: CircleDollarSign,
      title: "You Pay Only From Recovered Revenue",
      desc: "No upfront fees. No monthly retainers. No hidden costs. We take a percentage of what we actually recover. If we don't recover, you don't pay. Period.",
      color: "emerald",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="grid-bg w-full h-full" style={{ filter: "invert(1)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-primary-200 text-sm font-semibold uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-3 mb-4">
              Send Claims. <span className="text-primary-200">Get Revenue Back.</span>
            </h2>
            <p className="text-lg text-primary-100/70 max-w-2xl mx-auto">
              Four simple steps. Zero upfront cost. We handle the hard part.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {steps.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.15}>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                    s.color === "cyan" ? "bg-cyan-500" :
                    s.color === "emerald" ? "bg-emerald-500" :
                    "bg-primary"
                  }`}>
                    <s.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        s.color === "cyan" ? "bg-cyan-500/20 text-cyan-300" :
                        s.color === "emerald" ? "bg-emerald-500/20 text-emerald-300" :
                        "bg-primary-500/20 text-primary-200"
                      }`}>
                        Step {s.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-primary-100/70 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
function Pricing() {
  const tiers = [
    {
      name: "Standard",
      subtitle: "Under 1,000 claims",
      rate: "25–35%",
      rateLabel: "of recovered revenue",
      features: [
        "Full AI analysis of every claim",
        "Appeal letter generation",
        "Coding corrections",
        "Eligibility resolution",
        "Claim resubmission",
        "Payment tracking & reporting",
        "Dedicated recovery specialist",
      ],
      popular: false,
      cta: "Start Recovery",
    },
    {
      name: "Volume",
      subtitle: "1,000+ claims",
      rate: "20–25%",
      rateLabel: "of recovered revenue",
      features: [
        "Everything in Standard, plus:",
        "Priority processing queue",
        "Dedicated account manager",
        "Custom reporting & dashboards",
        "Payer-specific strategy optimization",
        "Weekly recovery status calls",
        "EHR integration for claim ingestion",
      ],
      popular: true,
      cta: "Start Recovery",
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Contingency Pricing</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              No Recovery? <span className="gradient-text">No Fee.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We only get paid when you get paid. That&apos;s how confident we are in our AI-powered recovery process.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.name} delay={i * 0.15}>
              <div className={`relative bg-card rounded-2xl p-7 border transition-all hover:shadow-lg flex flex-col ${
                tier.popular ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/30" : "border-border hover:border-primary/30"
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Best Value
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">{tier.rate}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{tier.rateLabel}</p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="mailto:hello@denialsdoctor.com?subject=Recovery Service Inquiry"
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    tier.popular
                      ? "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25"
                      : "bg-primary-50 text-primary border border-primary-200 hover:bg-primary-100"
                  }`}
                >
                  {tier.cta}
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Guarantee badge */}
        <FadeIn delay={0.3}>
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-full">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Zero-Risk Guarantee: If we don&apos;t recover, you don&apos;t pay a cent.</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── RESULTS ─── */
function Results() {
  const stats = [
    { value: 65, suffix: "–80%", label: "Recovery Rate", icon: TrendingUp, desc: "Percentage of denied claims we successfully recover" },
    { value: 2, suffix: " Weeks", label: "Turnaround", icon: Clock, desc: "From claim submission to first recovery" },
    { value: 3, suffix: "–7", label: "$ Cost Per Claim", icon: DollarSign, desc: "vs $25–40 for manual recovery" },
    { value: 6, suffix: "", label: "AI Agents", icon: Brain, desc: "Working every claim simultaneously" },
  ];

  return (
    <section id="results" className="py-20 lg:py-28 bg-muted/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Results</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              What to <span className="gradient-text">Expect</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Proven metrics from our AI-powered recovery process.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div className="bg-card rounded-2xl p-6 border border-border text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-50 mb-4 group-hover:bg-primary-100 transition-colors">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-base font-semibold text-foreground mb-1">{s.label}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Cost comparison */}
        <FadeIn delay={0.4}>
          <div className="mt-12 bg-gradient-to-r from-primary-50 to-emerald-50/50 rounded-2xl p-7 border border-primary-100">
            <h3 className="text-xl font-bold text-foreground mb-4 text-center">Cost Comparison: AI Recovery vs Manual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">Manual Recovery</span>
                </div>
                <div className="text-3xl font-extrabold text-foreground mb-1">$25–40</div>
                <p className="text-sm text-muted-foreground">per claim · 30–60 day turnaround · 30–50% recovery rate</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-primary-200 ring-1 ring-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-primary">DenialsDoctor Recovery</span>
                </div>
                <div className="text-3xl font-extrabold text-foreground mb-1">$3–7</div>
                <p className="text-sm text-muted-foreground">per claim · 2-week turnaround · 65–80% recovery rate</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── WHAT'S INCLUDED ─── */
function WhatsIncluded() {
  const items = [
    { icon: Brain, title: "Full AI Analysis", desc: "Every claim analyzed by 6 specialist AI agents with anti-hallucination guardrails" },
    { icon: FileText, title: "Appeal Letters", desc: "Complete appeal letters with verified regulatory citations (42 CFR, LCD, NCD)" },
    { icon: RefreshCcw, title: "Coding Corrections", desc: "AI-generated corrected codes with NCCI edit checks and guideline references" },
    { icon: Shield, title: "Eligibility Resolution", desc: "Coverage verification, COB analysis, and prior authorization resolution" },
    { icon: Send, title: "Claim Resubmission", desc: "Scrubbed claims ready for resubmission with every field validated" },
    { icon: Eye, title: "Payment Tracking", desc: "Real-time tracking of recoveries, appeal statuses, and payment confirmations" },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">What's Included</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Everything You Need for <span className="gradient-text">Full Recovery</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
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

/* ─── WHO IT'S FOR ─── */
function WhoItsFor() {
  const personas = [
    { icon: Hospital, title: "Hospitals", desc: "High-volume denial recovery with AI-powered batch processing and dedicated account management" },
    { icon: Briefcase, title: "Billing Companies", desc: "Recover on behalf of your clients with white-label reports and multi-tenant dashboards" },
    { icon: BarChart3, title: "RCM Companies", desc: "Integrate our AI agents into your workflow for faster, more accurate denial resolution" },
    { icon: UserCheck, title: "Physician Practices", desc: "No minimum volume requirements. Send 10 claims or 10,000 — contingency pricing works the same" },
  ];

  return (
    <section className="py-20 lg:py-28 bg-muted/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Who It's For</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Built for <span className="gradient-text">Every Healthcare Organization</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.1}>
              <div className="bg-card rounded-xl p-5 border border-border text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-50 mb-4 group-hover:bg-primary-100 transition-colors">
                  <p.icon className="w-7 h-7 text-primary" />
                </div>
                <h4 className="text-base font-bold text-foreground mb-1.5">{p.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
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
      q: "How does contingency pricing work?",
      a: "We charge a percentage of the revenue we actually recover for you. If we recover $10,000 on a 25% contingency, you keep $7,500 and we receive $2,500. If we recover nothing, you pay nothing — no fees, no hidden costs, no retainers.",
    },
    {
      q: "What's the typical turnaround time?",
      a: "Most claims see initial recovery within 2 weeks. Complex appeals may take longer depending on payer response times, but our AI-generated appeal letters and corrected codes dramatically speed up the process compared to manual recovery.",
    },
    {
      q: "Is this HIPAA compliant?",
      a: "Absolutely. All data is encrypted in transit and at rest. We sign Business Associate Agreements (BAAs) with every client. Our infrastructure is SOC 2 Type II certified, and PHI never leaves our secure environment.",
    },
    {
      q: "What file formats do you accept?",
      a: "We accept 835/ERA files, CSV/Excel spreadsheets, and direct EHR integration via FHIR R4 or X12 EDI. Our onboarding team helps you set up the easiest ingestion method for your workflow.",
    },
    {
      q: "How is this different from the self-service platform?",
      a: "The self-service platform (Levels 1–3) gives you AI tools to analyze and fix claims yourself. The Recovery Service is done-for-you — we handle everything end-to-end. You just send the claims and receive the recovered revenue.",
    },
    {
      q: "Is there a minimum number of claims?",
      a: "No minimum for standard pricing. Volume pricing (20–25%) kicks in at 1,000+ claims. Whether you have 10 denied claims or 10,000, we can help.",
    },
    {
      q: "What's the recovery rate I can expect?",
      a: "Our clients typically see 65–80% recovery rates, compared to 30–50% with manual processes. Results vary by denial type, payer, and specialty, but our AI agents consistently outperform manual workflows.",
    },
    {
      q: "How do I get started?",
      a: "Simple — email us at hello@denialsdoctor.com or click the 'Start Recovery' button. We'll schedule a brief call to understand your denial volume, set up secure file transfer, and begin recovering within 48 hours.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Common <span className="gradient-text">Questions</span>
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
    <section className="py-20 lg:py-28 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="grid-bg w-full h-full" style={{ filter: "invert(1)" }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-6">
            <HandCoins className="w-3.5 h-3.5" />
            No Upfront Cost · Contingency Only
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            Stop Losing Revenue to Denials.
            <br />
            <span className="text-primary-200">Start Recovering Today.</span>
          </h2>

          <p className="text-lg text-primary-100/70 mb-8 max-w-2xl mx-auto">
            Every day you wait, denied revenue sits on the table. Our AI agents are ready to start recovering — and you only pay when we succeed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:hello@denialsdoctor.com?subject=Recovery Service Inquiry"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              Start Recovery Now
              <ArrowRight className="w-4.5 h-4.5" />
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white border-2 border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl transition-all"
            >
              See Pricing
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
export default function RecoveryServicePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <Hero />
      <HowItWorks />
      <Pricing />
      <Results />
      <WhatsIncluded />
      <WhoItsFor />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
