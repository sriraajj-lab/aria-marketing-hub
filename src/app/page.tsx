"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { PaymentModal } from "@/components/payment-modal";
import {
  Shield,
  Brain,
  FileText,
  DollarSign,
  Activity,
  Zap,
  CheckCircle2,
  ArrowRight,
  Search,
  BarChart3,
  Clock,
  Users,
  Building2,
  TrendingUp,
  Lock,
  Stethoscope,
  HeartPulse,
  Bone,
  BrainCircuit,
  Pill,
  Baby,
  ScanLine,
  ClipboardList,
  Bot,
  Menu,
  X,
  Star,
  Sparkles,
  Target,
  Gauge,
  Database,
  Globe,
  Mail,
  Wind,
  Layers,
  Wand2,
  Cpu,
  Eye,
  Hand,
  CircleDollarSign,
  BadgeCheck,
  Minus,
  ChevronRight,
  Sparkle,
  ScanSearch,
  Wrench,
  Rocket,
} from "lucide-react";

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

/* ─── NAV ─── */
function Nav({ onCtaClick }: { onCtaClick?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "AI Agents", href: "#agents" },
    { label: "Attribution", href: "#attribution" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-border shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Denials<span className="text-primary">Doctor</span>
            </span>
          </a>

          {/* Desktop Links */}
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

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#pricing"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </a>
            <button
              onClick={onCtaClick}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-foreground"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
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
                <a href="#pricing" className="block px-4 py-2.5 text-sm font-medium text-muted-foreground">
                  Log In
                </a>
                <a
                  href="#pricing"
                  className="block px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg text-center"
                >
                  Get Started
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
function Hero({ onCtaClick }: { onCtaClick?: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/3 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary text-xs font-semibold mb-6">
                <Layers className="w-3.5 h-3.5" />
                3-Level Revenue Recovery
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6"
            >
              From Diagnosis to{" "}
              <span className="gradient-text">Full Recovery</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl">Choose Your Level</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl"
            >
              Scan your denials, fix every claim, or let AI handle it all. Three levels of AI-powered
              recovery — from <strong className="text-cyan-600">diagnostic insight</strong> to{" "}
              <strong className="text-emerald-600">guided fixes</strong> to{" "}
              <strong className="text-primary">full automation</strong>.
            </motion.p>

            {/* 3 Level pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-2.5 mb-8"
            >
              <a href="#how-it-works" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-sm font-semibold hover:bg-cyan-100 transition-colors">
                <ScanSearch className="w-4 h-4" />
                L1: Scan & Score
              </a>
              <a href="#how-it-works" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors">
                <Wrench className="w-4 h-4" />
                L2: Fix & Appeal
              </a>
              <a href="#how-it-works" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary text-sm font-semibold hover:bg-primary-100 transition-colors">
                <Rocket className="w-4 h-4" />
                L3: EHR Auto-Fix
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <button
                onClick={onCtaClick}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
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
              className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-4.5 h-4.5 text-primary" />
                HIPAA Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-primary" />
                2-min setup
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4.5 h-4.5 text-primary" />
                SOC 2 Certified
              </span>
            </motion.div>
          </div>

          {/* Interactive Dashboard Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative bg-card rounded-2xl border border-border shadow-2xl shadow-primary/5 overflow-hidden">
              {/* Dashboard Header */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground font-mono ml-2">denialsdoctor.com/dashboard</span>
              </div>

              {/* Dashboard Content */}
              <div className="p-5 space-y-4">
                {/* Top metrics row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Open Denials", value: "247", change: "-12%", icon: FileText, color: "text-cyan-600" },
                    { label: "Fix Rate", value: "89%", change: "+23%", icon: TrendingUp, color: "text-emerald-600" },
                    { label: "Recovered", value: "$1.2M", change: "+34%", icon: DollarSign, color: "text-primary" },
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                      className="bg-muted/60 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <m.icon className={`w-4 h-4 ${m.color}`} />
                        <span className="text-[11px] text-muted-foreground">{m.label}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold text-foreground">{m.value}</span>
                        <span className="text-[10px] font-semibold text-emerald-600">{m.change}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 3-Level Status */}
                <div className="bg-primary-50/50 rounded-xl p-4 border border-primary-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">Recovery Level Progress</span>
                    <span className="ml-auto text-[10px] text-primary bg-primary-100 px-2 py-0.5 rounded-full font-medium">Active</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { level: "L1 Scan", status: "Complete", pct: 100, color: "bg-cyan-500" },
                      { level: "L2 Fix", status: "Processing...", pct: 72, color: "bg-emerald-500" },
                      { level: "L3 Auto-Fix", status: "Ready", pct: 0, color: "bg-primary" },
                    ].map((a, i) => (
                      <motion.div
                        key={a.level}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + i * 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-[11px] text-foreground font-semibold flex-shrink-0 w-16">{a.level}</span>
                        <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${a.pct}%` }}
                            transition={{ duration: 1.5, delay: 1.4 + i * 0.2, ease: "easeOut" }}
                            className={`h-full rounded-full ${a.pct === 100 ? "bg-cyan-500" : a.pct > 0 ? a.color : "bg-gray-300"}`}
                          />
                        </div>
                        <span className={`text-[10px] font-medium w-16 text-right ${a.pct === 100 ? "text-cyan-600" : a.pct > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {a.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent claims */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Claims</span>
                  {[
                    { id: "CLM-2847", type: "Oncology J-Code", level: "L2", status: "Fix Ready", amount: "$4,250", levelColor: "text-emerald-600 bg-emerald-50" },
                    { id: "CLM-2846", type: "Cardiology CPT", level: "L3", status: "Auto-Fixed", amount: "$2,180", levelColor: "text-primary bg-primary-50" },
                  ].map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2 + i * 0.15 }}
                      className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-[11px]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-muted-foreground">{a.id}</span>
                        <span className="text-foreground">{a.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.levelColor}`}>{a.level}</span>
                        <span className={`font-semibold ${a.status === "Auto-Fixed" ? "text-primary" : "text-emerald-600"}`}>
                          {a.status}
                        </span>
                        <span className="font-bold text-foreground">{a.amount}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
            >
              3 Levels of Recovery
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-3 -left-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
            >
6 AI Agents Active
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST METRICS ─── */
function TrustMetrics() {
  const metrics = [
    { value: 80, suffix: "%", label: "Reduction in processing time", icon: Zap },
    { value: 40, suffix: "%", label: "Increase in appeal success", icon: TrendingUp },
    { value: 6, suffix: "", label: "Functional AI agents", icon: Brain },
    { value: 12, suffix: "+", label: "Medical specialties covered", icon: Stethoscope },
    { value: 95, suffix: "%", label: "Analysis accuracy rate", icon: Target },
  ];

  return (
    <section className="relative py-16 bg-muted/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
          {metrics.map((m, i) => (
            <FadeIn key={m.label} delay={i * 0.1}>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 mb-3 group-hover:bg-primary-100 transition-colors">
                  <m.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">
                  <Counter target={m.value} suffix={m.suffix} />
                </div>
                <div className="text-sm text-muted-foreground leading-snug">{m.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS — 3 LEVELS ─── */
function HowItWorks() {
  const levels = [
    {
      icon: ScanSearch,
      level: "Level 1",
      title: "Scan & Score",
      desc: "Upload your denial data. AI scans, scores, and identifies every pain point.",
      details: [
        "AI scans your entire denial dataset",
        "Practice health score (0–100)",
        "Pain point identification & ranking",
        "Denial patterns by payer, category, severity",
        "Recovery potential estimation",
      ],
      color: "cyan",
      accentBg: "bg-cyan-50",
      accentText: "text-cyan-600",
      accentBorder: "border-cyan-200",
      accentBgDark: "bg-cyan-500",
      glowColor: "shadow-cyan-500/20",
      cta: "Start Scanning",
    },
    {
      icon: Wrench,
      level: "Level 2",
      title: "Fix & Appeal",
      desc: "Get a complete fix report for every claim — AI generates corrected codes, appeal letters, and step-by-step instructions your staff executes.",
      details: [
        "AI works every claim individually",
        "Smart coding corrections + AI code generation",
        "Appeal letter generation per claim",
        "Step-by-step fix instructions",
        "Submission destination mapping",
      ],
      color: "emerald",
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      accentBorder: "border-emerald-200",
      accentBgDark: "bg-emerald-500",
      glowColor: "shadow-emerald-500/20",
      cta: "Start Fixing Claims",
      popular: true,
    },
    {
      icon: Rocket,
      level: "Level 3",
      title: "EHR Auto-Fix",
      desc: "AI agents connect to your EHR and fix everything autonomously.",
      details: [
        "Direct EHR/EMR integration",
        "Autonomous claim correction & resubmission",
        "Automated appeal filing & follow-up",
        "Real-time payment tracking",
        "Hands-free revenue recovery",
      ],
      color: "primary",
      accentBg: "bg-primary-50",
      accentText: "text-primary",
      accentBorder: "border-primary-200",
      accentBgDark: "bg-primary",
      glowColor: "shadow-primary/20",
      cta: "Contact Sales",
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
              Three Levels. One Mission.
            </h2>
            <p className="text-lg text-primary-100/70 max-w-2xl mx-auto">
              From diagnosis to full recovery — choose the level that fits your practice. Upgrade anytime.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {levels.map((lvl, i) => (
            <FadeIn key={lvl.title} delay={i * 0.15}>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group h-full flex flex-col">
                {/* Level badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${lvl.accentBg} ${lvl.accentText} border ${lvl.accentBorder}`}>
                    {lvl.level}
                  </span>
                  {lvl.popular && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${lvl.accentBg} ${lvl.accentText} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <lvl.icon className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-2">{lvl.title}</h3>
                <p className="text-sm text-primary-100/80 leading-relaxed mb-5">{lvl.desc}</p>

                {/* Details */}
                <ul className="space-y-2 mb-6 flex-1">
                  {lvl.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-primary-100/60">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${lvl.accentText}`} />
                      {d}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="#pricing"
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${lvl.accentBgDark} text-white hover:opacity-90 shadow-lg ${lvl.glowColor}`}
                >
                  {lvl.cta}
                  <ChevronRight className="w-4 h-4" />
                </a>

                {/* Connector arrow (desktop) */}
                {i < 2 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-white/30" />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Upgrade note */}
        <FadeIn delay={0.4}>
          <div className="text-center mt-10">
            <p className="text-primary-100/50 text-sm">
              Each level includes everything in the previous level. Start at any level — upgrade anytime.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── FEATURE COMPARISON MATRIX ─── */
function FeatureComparison() {
  const features = [
    { name: "AI Denial Pattern Recognition", l1: true, l2: true, l3: true },
    { name: "Practice Health Score (0–100)", l1: true, l2: true, l3: true },
    { name: "Pain Point Identification", l1: true, l2: true, l3: true },
    { name: "Payer-Specific Denial Analysis", l1: true, l2: true, l3: true },
    { name: "Recovery Potential Estimation", l1: true, l2: true, l3: true },
    { name: "Executive Report Download", l1: true, l2: true, l3: true },
    { name: "Individual Claim Analysis", l1: false, l2: true, l3: true },
    { name: "Smart Coding Corrections", l1: false, l2: true, l3: true },
    { name: "Appeal Letter Generation", l1: false, l2: true, l3: true },
    { name: "Pre-Authorization Letters", l1: false, l2: true, l3: true },
    { name: "Step-by-Step Fix Instructions", l1: false, l2: true, l3: true },
    { name: "Submission Destination Mapping", l1: false, l2: true, l3: true },
    { name: "Complete Fix Report Export", l1: false, l2: true, l3: true },
    { name: "Timely Filing Watchdog Alerts", l1: false, l2: true, l3: true },
    { name: "EHR/EMR Integration", l1: false, l2: false, l3: true },
    { name: "Autonomous Claim Correction", l1: false, l2: false, l3: true },
    { name: "Automated Resubmission", l1: false, l2: false, l3: true },
    { name: "Auto Appeal Filing & Follow-Up", l1: false, l2: false, l3: true },
    { name: "Real-Time Payment Tracking", l1: false, l2: false, l3: true },
    { name: "FHIR R4 & X12 EDI Support", l1: false, l2: false, l3: true },
    { name: "Dedicated Account Manager", l1: false, l2: false, l3: true },
  ];

  const specialties = [
    { name: "Oncology", icon: Pill },
    { name: "Cardiology", icon: HeartPulse },
    { name: "Orthopedics", icon: Bone },
    { name: "Neurology", icon: BrainCircuit },
    { name: "Radiology", icon: ScanLine },
    { name: "Pulmonology", icon: Wind },
    { name: "Emergency", icon: Activity },
    { name: "Pediatrics", icon: Baby },
  ];

  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Feature Comparison</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              What You Get at <span className="gradient-text">Each Level</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every level builds on the last. See exactly what&apos;s included at each tier.
            </p>
          </div>
        </FadeIn>

        {/* Desktop table */}
        <FadeIn>
          <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-muted-foreground font-semibold w-2/5">Feature</th>
                  <th className="px-4 py-4 text-center w-1/5">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">Level 1</span>
                      <span className="text-sm font-bold text-foreground">Scan & Score</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center w-1/5 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Star className="w-2.5 h-2.5" /> Popular
                    </div>
                    <div className="flex flex-col items-center gap-1 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Level 2</span>
                      <span className="text-sm font-bold text-foreground">Fix & Appeal</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center w-1/5">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Level 3</span>
                      <span className="text-sm font-bold text-foreground">EHR Auto-Fix</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={f.name} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'} hover:bg-muted/40 transition-colors`}>
                    <td className="px-6 py-3 text-muted-foreground font-medium">{f.name}</td>
                    <td className="px-4 py-3 text-center">
                      {f.l1 ? <CheckCircle2 className="w-5 h-5 text-cyan-500 mx-auto" /> : <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.l2 ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.l3 ? <CheckCircle2 className="w-5 h-5 text-primary mx-auto" /> : <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td className="px-6 py-4 font-bold text-foreground">Starting Price</td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-lg font-extrabold text-foreground">$149</span>
                    <span className="text-xs text-muted-foreground block">/100 claims</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-lg font-extrabold text-foreground">$349</span>
                    <span className="text-xs text-muted-foreground block">/100 claims</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-lg font-extrabold text-foreground">$699</span>
                    <span className="text-xs text-muted-foreground block">/100 claims</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </FadeIn>

        {/* Mobile cards */}
        <div className="md:hidden space-y-6">
          {[
            { level: "Level 1", name: "Scan & Score", color: "cyan", features: features.filter(f => f.l1) },
            { level: "Level 2", name: "Fix & Appeal", color: "emerald", features: features.filter(f => f.l2) },
            { level: "Level 3", name: "EHR Auto-Fix", color: "primary", features: features.filter(f => f.l3) },
          ].map((lvl, i) => (
            <FadeIn key={lvl.name} delay={i * 0.15}>
              <div className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    lvl.color === "cyan" ? "bg-cyan-50 text-cyan-600 border border-cyan-200" :
                    lvl.color === "emerald" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                    "bg-primary-50 text-primary border border-primary-200"
                  }`}>
                    {lvl.level}
                  </span>
                  <span className="text-lg font-bold text-foreground">{lvl.name}</span>
                </div>
                <ul className="space-y-2">
                  {lvl.features.map((f) => (
                    <li key={f.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                        lvl.color === "cyan" ? "text-cyan-500" :
                        lvl.color === "emerald" ? "text-emerald-500" :
                        "text-primary"
                      }`} />
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Specialty tags */}
        <FadeIn delay={0.3}>
          <div className="mt-10 bg-gradient-to-br from-primary-50 to-cyan-50/50 rounded-2xl p-7 border border-primary-100">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">Specialty-Specific Optimization</h3>
                <p className="text-muted-foreground mb-4">
                  AI agents trained on each specialty&apos;s unique denial patterns, coding requirements, and appeal strategies — available at every level.
                </p>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s) => (
                    <span
                      key={s.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-primary border border-primary-200 hover:bg-primary hover:text-white hover:border-primary transition-colors cursor-default"
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="w-full space-y-3">
                  {[
                    { label: "Oncology J-Codes", pct: 94 },
                    { label: "Cardiology CPT", pct: 91 },
                    { label: "Orthopedic Procedures", pct: 88 },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{b.label}</span>
                        <span className="font-bold text-foreground">{b.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${b.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── AI AGENTS ─── */
function AIAgents() {
  const agents = [
    {
      name: "Orchestrator",
      desc: "The brain of the system. When a denied claim enters, the Orchestrator classifies the denial type (eligibility, coding, demographic, billing, or appeal), then routes it to the right agents in the right order. It cross-validates every agent's output to catch contradictions before delivering the final result.",
      icon: Gauge,
      level: "L1+",
      tasks: ["Classify denial type automatically", "Route claim to the right specialist agents", "Cross-validate outputs between agents", "Enforce access level gates (L1 vs L2)"],
      output: "Classified denial + coordinated agent results",
      levelColor: "text-cyan-600 bg-cyan-50 border-cyan-200",
    },
    {
      name: "Demographics",
      desc: "First line of defense. Checks every patient field — name, DOB, insurance ID, payer ID, address, subscriber relationship — against payer requirements. Flags missing or malformed fields and outputs exactly which fields need correction. It never invents data — only validates what exists.",
      icon: ClipboardList,
      level: "L1+",
      tasks: ["Check all required demographic fields", "Validate formats (DOB, ZIP, State codes)", "Flag missing or mismatched data", "Score demographic completeness"],
      output: "Completeness score + list of fields to correct",
      levelColor: "text-cyan-600 bg-cyan-50 border-cyan-200",
    },
    {
      name: "Eligibility",
      desc: "Verifies whether the patient was actually covered on the date of service. Checks coverage status, coordination of benefits (COB), and whether prior authorization was required and obtained. Identifies the exact reason the payer denied on eligibility grounds and maps the resolution path.",
      icon: Shield,
      level: "L2+",
      tasks: ["Verify coverage status on date of service", "Analyze coordination of benefits issues", "Check prior authorization requirements", "Map the resolution path for each denial"],
      output: "Coverage status + COB analysis + resolution steps",
      levelColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      name: "Coding",
      desc: "The most powerful agent. It doesn't just flag bad codes — it generates corrected ones. First it checks NCCI edits, CPT-ICD pairings, and coverage criteria using rule-based logic. When rules aren't enough, AI proposes corrected codes with reason and guideline references. All AI corrections are flagged for human review with confidence scores.",
      icon: Wand2,
      level: "L2+",
      tasks: ["Check NCCI bundling edits (rule-based)", "Validate CPT-ICD-10 pairing", "Generate corrected codes when wrong", "Verify codes against coverage criteria"],
      output: "Original vs corrected codes + swap recommendations",
      levelColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      highlight: true,
    },
    {
      name: "Billing Scrubber",
      desc: "Pre-submission quality gate. Validates payer IDs, checks timely filing deadlines, detects duplicate submissions, compares against fee schedules, and flags underpayments. Outputs a scrubbed claim ready for resubmission with every billing field validated.",
      icon: ScanSearch,
      level: "L2+",
      tasks: ["Validate payer ID and filing indicators", "Check timely filing deadlines", "Detect duplicate submissions", "Compare against fee schedules"],
      output: "Scrubbed claim ready for resubmission",
      levelColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      name: "Appeals",
      desc: "Generates complete appeal letters with verified regulatory citations — 42 CFR, LCD, NCD, state-specific regulations. Each letter includes the legal argument, supporting evidence, and the specific regulation the payer violated. Never invents citations — only references real, verifiable regulations.",
      icon: FileText,
      level: "L2+",
      tasks: ["Determine the correct appeal level", "Build legal arguments with regulations", "Draft complete appeal letter text", "Cite real, verifiable regulations only"],
      output: "Complete appeal letter + submission instructions",
      levelColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  const pipelineSteps = [
    {
      step: 1,
      title: "Upload Denied Claims",
      desc: "Upload your ERA/835 files, spreadsheets, or connect your EHR. The system ingests denied claim data including patient info, codes, payer details, and denial reason codes.",
      icon: Database,
    },
    {
      step: 2,
      title: "Orchestrator Classifies",
      desc: "The Orchestrator Agent reads each denial, identifies the denial type (CARC/RARC codes), and routes it through the right agents. Not every claim needs every agent — a coding denial skips demographics; an eligibility denial skips coding.",
      icon: Gauge,
    },
    {
      step: 3,
      title: "Specialist Agents Analyze & Fix",
      desc: "Each agent performs its defined job: Demographics checks fields, Eligibility verifies coverage, Coding generates corrected codes, Scrubber validates billing, Appeals drafts letters. Every agent stays strictly within its scope.",
      icon: Wand2,
    },
    {
      step: 4,
      title: "Orchestrator Cross-Validates",
      desc: "The Orchestrator reviews all agent outputs, checks for contradictions (e.g., Coding suggests a code that Eligibility says isn't covered), and produces a consolidated fix report per claim with confidence scores.",
      icon: Shield,
    },
    {
      step: 5,
      title: "You Get the Fix Report",
      desc: "For each claim, you receive: what was wrong, the corrected codes or fields, the appeal letter (if applicable), where to submit, and step-by-step instructions. Your staff executes the fixes — or at L3, the system does it automatically.",
      icon: FileText,
    },
  ];

  return (
    <section id="agents" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">How Denials Doctor Works</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              6 Agents. <span className="gradient-text">One Clear Pipeline.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Each denied claim flows through a defined pipeline of specialist agents. Every agent has one job, strict scope boundaries, and anti-hallucination guardrails. No agent oversteps — the Coding agent never touches demographics, the Eligibility agent never suggests codes.
            </p>
          </div>
        </FadeIn>

        {/* How The Tool Works — Step-by-Step Pipeline */}
        <FadeIn delay={0.1}>
          <div className="mb-16">
            <h3 className="text-xl font-bold text-foreground mb-8 text-center">How a Denied Claim Becomes a Fixed Claim</h3>
            <div className="space-y-4">
              {pipelineSteps.map((step, i) => (
                <div key={step.step} className="relative">
                  <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/30 transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <step.icon className="w-5.5 h-5.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-bold text-primary bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">Step {step.step}</span>
                        <h4 className="text-base font-bold text-foreground">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ChevronRight className="w-5 h-5 text-muted-foreground/40 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Pipeline Flow — Visual */}
        <FadeIn delay={0.15}>
          <div className="mb-12 p-5 bg-gradient-to-r from-primary-50 via-cyan-50 to-emerald-50 rounded-2xl border border-primary-100">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Pipeline Flow</span>
            </div>
            <div className="flex items-center justify-center gap-1 flex-wrap text-sm font-semibold">
              <span className="px-3 py-1.5 bg-white rounded-lg border border-cyan-200 text-cyan-700">1. Orchestrator</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="px-3 py-1.5 bg-white rounded-lg border border-cyan-200 text-cyan-700">2. Demographics</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="px-3 py-1.5 bg-white rounded-lg border border-emerald-200 text-emerald-700">3. Eligibility</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="px-3 py-1.5 bg-white rounded-lg border border-emerald-200 text-emerald-700 ring-2 ring-emerald-300">4. Coding</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="px-3 py-1.5 bg-white rounded-lg border border-emerald-200 text-emerald-700">5. Scrubber</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="px-3 py-1.5 bg-white rounded-lg border border-emerald-200 text-emerald-700">6. Appeals</span>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">Not every claim needs every agent. The Orchestrator activates only the agents relevant to each denial type.</p>
          </div>
        </FadeIn>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent, i) => (
            <FadeIn key={agent.name} delay={i * 0.1}>
              <div className={`group bg-card rounded-xl p-5 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col ${agent.highlight ? 'border-emerald-300 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-200' : 'border-border hover:border-primary/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <agent.icon className="w-5.5 h-5.5 text-primary" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${agent.levelColor}`}>
                    {agent.level}
                  </span>
                </div>
                <h4 className="text-base font-bold text-foreground mb-2 font-mono">{agent.name} Agent</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{agent.desc}</p>
                <div className="space-y-1.5 mb-4">
                  {agent.tasks.map((task) => (
                    <div key={task} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {task}
                    </div>
                  ))}
                </div>
                {/* Output tag */}
                <div className="mt-auto pt-3 border-t border-border">
                  <div className="flex items-start gap-2">
                    <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outputs</span>
                      <p className="text-xs text-foreground font-medium leading-snug">{agent.output}</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Anti-hallucination + Prescriptive AI callout */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <FadeIn delay={0.3}>
            <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/50 h-full">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">Anti-Hallucination Guardrails</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every agent has strict scope boundaries — the eligibility agent can never suggest coding changes, the coding agent can never modify demographics.
                    AI-generated corrections are always flagged and require human review. The Orchestrator cross-validates outputs between agents to catch contradictions.
                    If confidence is below 60%, the system flags for human review. Below 30%, it refuses to output entirely.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.35}>
            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-200/50 h-full">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Wand2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">Prescriptive, Not Just Diagnostic</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Denials Doctor doesn't just tell you what's wrong — it tells you exactly how to fix it. The Coding agent generates corrected CPT/ICD-10 codes when the originals are wrong.
                    The Appeals agent drafts complete appeal letters with real regulatory citations. The Scrubber outputs claims ready for resubmission. Every agent produces actionable output, not just flags.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Example claim walkthrough */}
        <FadeIn delay={0.4}>
          <div className="mt-8 bg-card rounded-2xl p-6 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Example: How a Coding Denial Flows Through the Pipeline
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-cyan-50/50 rounded-lg border border-cyan-100">
                <span className="text-xs font-bold text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full flex-shrink-0">Orchestrator</span>
                <p className="text-muted-foreground">Receives denial with CARC 97 (payment adjusted — bundling). Classifies as <strong className="text-foreground">coding denial</strong>. Routes to Demographics → Coding → Scrubber (skips Eligibility and Appeals).</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-cyan-50/50 rounded-lg border border-cyan-100">
                <span className="text-xs font-bold text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full flex-shrink-0">Demographics</span>
                <p className="text-muted-foreground">Validates patient fields. All fields complete and correctly formatted. <strong className="text-foreground">Completeness score: 98%</strong>. Passes to next agent.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">Coding</span>
                <p className="text-muted-foreground">Finds NCCI bundling violation: CPT 99213 + 99214 billed together. Rule-based correction: <strong className="text-foreground">remove 99214, add modifier -25 to 99213</strong>. Confidence: 92%.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">Scrubber</span>
                <p className="text-muted-foreground">Validates corrected claim: payer ID correct, timely filing within deadline, no duplicates. <strong className="text-foreground">Claim scrubbed and ready for resubmission</strong>.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-primary-50/50 rounded-lg border border-primary-100">
                <span className="text-xs font-bold text-primary bg-primary-100 px-2 py-0.5 rounded-full flex-shrink-0">Result</span>
                <p className="text-muted-foreground">Your staff receives: <strong className="text-foreground">remove CPT 99214, add modifier -25 to 99213, resubmit to [payer] at [address]</strong>. Done in 2 minutes instead of 45 minutes of manual research.</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── 3-TIER ATTRIBUTION ─── */
function Attribution() {
  const tiers = [
    {
      icon: Cpu,
      title: "AI-Driven",
      pct: "3%",
      level: "Level 3",
      levelColor: "text-primary bg-primary-50 border-primary-200",
      desc: "AI found, fixed, and recovered the claim without any staff involvement. Fully autonomous — your team did nothing.",
      examples: [
        "AI auto-corrected coding errors and resubmitted",
        "AI filed appeal and tracked through to payment",
        "AI identified and recovered claim your team never touched",
      ],
      accentBg: "bg-primary-50",
      accentText: "text-primary",
      accentBorder: "border-primary-200",
      barColor: "bg-primary",
    },
    {
      icon: Hand,
      title: "AI-Assisted",
      pct: "1.5%",
      level: "Level 2",
      levelColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      desc: "AI identified the problem and provided step-by-step instructions. Your staff executed the fix using AI guidance.",
      examples: [
        "AI generated appeal letter, staff submitted it",
        "AI identified coding fix, staff made the change",
        "AI flagged the denial, staff followed the fix plan",
      ],
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      accentBorder: "border-emerald-200",
      barColor: "bg-emerald-500",
    },
    {
      icon: Eye,
      title: "AI-Informed",
      pct: "0.5%",
      level: "Level 1",
      levelColor: "text-cyan-600 bg-cyan-50 border-cyan-200",
      desc: "AI provided the diagnostic insights and data. Your staff used those insights to identify and resolve the denial independently.",
      examples: [
        "AI showed the denial pattern, staff investigated",
        "AI scored the practice health, staff took action",
        "AI identified the pain point, staff found the fix",
      ],
      accentBg: "bg-cyan-50",
      accentText: "text-cyan-600",
      accentBorder: "border-cyan-200",
      barColor: "bg-cyan-500",
    },
  ];

  return (
    <section id="attribution" className="py-20 lg:py-28 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Fair Attribution</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              You Only Pay for <span className="gradient-text">What AI Recovers</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our 3-tier attribution model ensures you pay fairly based on how much work AI actually did.
              The more AI does, the more value you get — and the fee reflects that.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.title} delay={i * 0.15}>
              <div className="h-full bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all group hover:shadow-lg">
                {/* Level badge */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${tier.levelColor} mb-4`}>
                  {tier.level}
                </span>

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl ${tier.accentBg} ${tier.accentText} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <tier.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{tier.title}</h3>
                    <span className={`text-2xl font-extrabold ${tier.accentText}`}>{tier.pct}</span>
                    <span className="text-sm text-muted-foreground ml-1">of recovered revenue</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{tier.desc}</p>

                {/* Examples */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Examples</span>
                  {tier.examples.map((ex) => (
                    <div key={ex} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${tier.accentText}`} />
                      {ex}
                    </div>
                  ))}
                </div>

                {/* Visual bar */}
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>AI involvement</span>
                    <span className={`font-bold ${tier.accentText}`}>
                      {tier.pct === "3%" ? "Full" : tier.pct === "1.5%" ? "Shared" : "Advisory"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: tier.pct === "3%" ? "100%" : tier.pct === "1.5%" ? "60%" : "25%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 + i * 0.15 }}
                      className={`h-full rounded-full ${tier.barColor}`}
                    />
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Bottom note */}
        <FadeIn delay={0.4}>
          <div className="mt-10 bg-gradient-to-r from-primary-50 to-cyan-50/50 rounded-2xl p-6 border border-primary-100 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CircleDollarSign className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">No Upfront Cost Option</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Choose the <strong className="text-foreground">collections-based</strong> payment model and pay only from recovered revenue.
              No upfront fees. No risk. We only get paid when you get paid.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── PERSONA ROUTING ─── */
function Personas() {
  const personas = [
    {
      icon: Users,
      title: "DSO Operations",
      headline: "Streamline Your Denial Workflow",
      desc: "Reduce denial processing time by 80% with automated routing, tracking, and reporting designed for DSO operations.",
      features: ["Real-time denial dashboard", "Automated team assignment", "Custom categorization", "Practice management integration", "Performance analytics"],
      cta: "Explore DSO Features",
    },
    {
      icon: BarChart3,
      title: "CFO / Finance",
      headline: "Recover Revenue, Not Just Denials",
      desc: "Transform denial management from a cost center to a revenue driver with financial insights and ROI tracking.",
      features: ["Revenue impact dashboard", "Cost-benefit analysis", "Cash flow projections", "Denial rate trending", "Financial reporting integration"],
      cta: "View Financial Tools",
      featured: true,
    },
    {
      icon: Building2,
      title: "Hospital Admin",
      headline: "System-Wide Denial Prevention",
      desc: "Enterprise-wide denial management that scales across departments while maintaining compliance and performance.",
      features: ["Multi-department dashboard", "Compliance monitoring", "Enterprise reporting", "Department-specific analytics", "Strategic planning tools"],
      cta: "See Enterprise Solution",
    },
  ];

  return (
    <section id="personas" className="py-20 lg:py-28 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Solutions</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Designed for <span className="gradient-text">Your Role</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Different solutions for different perspectives. See how Denials Doctor works for you.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.15}>
              <div className={`h-full rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                p.featured
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  : "bg-card border-border hover:border-primary/30"
              }`}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                  p.featured ? "bg-white/20" : "bg-primary-50"
                }`}>
                  <p.icon className={`w-7 h-7 ${p.featured ? "text-white" : "text-primary"}`} />
                </div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${p.featured ? "text-primary-100" : "text-primary"}`}>
                  {p.title}
                </h3>
                <h4 className={`text-xl font-bold mb-3 ${p.featured ? "text-white" : "text-foreground"}`}>
                  {p.headline}
                </h4>
                <p className={`text-sm mb-5 leading-relaxed ${p.featured ? "text-primary-100/80" : "text-muted-foreground"}`}>
                  {p.desc}
                </p>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${p.featured ? "text-primary-100/90" : "text-muted-foreground"}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${p.featured ? "text-primary-100" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#pricing"
                  className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
                    p.featured
                      ? "text-white hover:text-primary-100"
                      : "text-primary hover:text-primary-dark"
                  }`}
                >
                  {p.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
function Testimonials() {
  const testimonials = [
    {
      quote: "Denials Doctor recovered over $1.2M in the first quarter alone. The AI-generated appeals are consistently successful where our manual process failed.",
      name: "Sarah Jenkins",
      role: "Chief Financial Officer",
      org: "Dental Partners of America",
    },
    {
      quote: "As a multi-location practice, we needed a solution that could scale. The integration with our existing systems was seamless, and the results were immediate.",
      name: "Dr. Michael Torres",
      role: "Practice Administrator",
      org: "Bright Smile Dental Group",
    },
    {
      quote: "The analytics alone have transformed how we approach denial management. We're not just recovering revenue — we're preventing denials before they happen.",
      name: "Lisa Park",
      role: "Director of Operations",
      org: "Metropolitan Dental Services",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="grid-bg w-full h-full" style={{ filter: "invert(1)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary-200 text-sm font-semibold uppercase tracking-wider">Social Proof</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-3 mb-4">
              Trusted by Healthcare Leaders
            </h2>
            <p className="text-lg text-primary-100/60 max-w-2xl mx-auto">
              See how Denials Doctor is transforming revenue recovery for organizations like yours.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.15}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-7 border border-white/10 hover:border-white/20 transition-all h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/90 text-base leading-relaxed mb-6 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-white/10 pt-4">
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-primary-100/60">{t.role}</div>
                  <div className="text-sm text-primary-200 font-medium">{t.org}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── INTEGRATIONS ─── */
function Integrations() {
  const categories = [
    {
      title: "Electronic Health Records",
      desc: "Auto-import denied claims and patient data",
      logos: ["Epic", "Cerner", "athenahealth", "DentalXchange", "OpenDental"],
      icon: ClipboardList,
    },
    {
      title: "Claim Clearinghouses",
      desc: "Import denial data directly from your clearinghouse",
      logos: ["Change Healthcare", "Availity", "Waystar", "Navicure", "Emdeon"],
      icon: Globe,
    },
    {
      title: "Payer Connections",
      desc: "Submit appeals directly through secure connections",
      logos: ["UnitedHealth", "Aetna", "Cigna", "BCBS", "Medicare"],
      icon: Shield,
    },
  ];

  return (
    <section id="integrations" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Integrations</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Connect to Your <span className="gradient-text">Existing Systems</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Denials Doctor integrates with the tools you already use. No disruption, just connection.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <FadeIn key={cat.title} delay={i * 0.15}>
              <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <cat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{cat.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{cat.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.logos.map((logo) => (
                    <span
                      key={logo}
                      className="px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      {logo}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* API Integration CTA */}
        <FadeIn delay={0.3}>
          <div className="mt-8 bg-gradient-to-r from-primary-50 to-cyan-50/50 rounded-2xl p-8 border border-primary-100 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">Custom API Integration</h3>
              <p className="text-muted-foreground">
                Connect Denials Doctor to any custom system or workflow with our robust REST API, FHIR R4, and X12 837/835 support.
              </p>
            </div>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 flex-shrink-0"
            >
              View API Docs
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
function Pricing({ onPlanSelect }: { onPlanSelect?: (plan: string) => void }) {
  const plans = [
    {
      level: 1,
      name: "Scan & Score",
      subtitle: "Diagnostic Overview",
      price: "$149",
      period: "/100 claims",
      perClaim: "$1.49/claim",
      desc: "AI scans your billing data, identifies denial patterns, scores your practice health, and highlights pain points. Get a comprehensive diagnostic report.",
      features: [
        "AI-powered denial pattern recognition",
        "Practice health score (0-100)",
        "Pain point identification & ranking",
        "Payer-specific denial analysis",
        "Category breakdown with severity levels",
        "Recovery potential estimation",
        "Downloadable executive report",
        "No commitment — preview before you commit",
      ],
      cta: "Start Scanning",
      popular: false,
      color: "cyan",
    },
    {
      level: 2,
      name: "Fix & Appeal",
      subtitle: "Guided Recovery",
      price: "$349",
      period: "/100 claims",
      perClaim: "$3.49/claim",
      desc: "Everything in Level 1, plus AI works every claim individually. Get step-by-step fix instructions, appeal letters, and a complete execution report for your team.",
      features: [
        "Everything in Level 1",
        "AI analysis of every individual claim",
        "Smart coding corrections (NCCI, modifiers)",
        "Pre-authorization letter generation",
        "Submission destination mapping",
        "Step-by-step fix instructions per claim",
        "Appeal letter drafting (1st & 2nd level)",
        "Quality check before resubmission",
        "Complete fix report export (CSV)",
        "Timely filing watchdog alerts",
      ],
      cta: "Start Fixing Claims",
      popular: true,
      color: "emerald",
    },
    {
      level: 3,
      name: "EHR Auto-Fix",
      subtitle: "Full Autonomous Recovery",
      price: "$699",
      period: "/100 claims",
      perClaim: "$6.99/claim",
      desc: "Everything in Levels 1 & 2, plus direct EHR integration. AI agents automatically fix claims, submit corrections, and manage the entire recovery lifecycle.",
      features: [
        "Everything in Levels 1 & 2",
        "Direct EHR/EMR integration (Epic, Cerner)",
        "Autonomous claim correction & resubmission",
        "Automated prior authorization workflows",
        "Real-time payment tracking & posting",
        "Automatic appeal filing & follow-up",
        "FHIR R4 & X12 EDI compliant",
        "Clearinghouse API integration",
        "6 AI agents working 24/7 autonomously",
        "Dedicated account manager",
      ],
      cta: "Contact Sales",
      popular: false,
      color: "primary",
    },
  ];

  const paymentOptions = [
    { label: "Per 100 Claims", l1: "$149", l2: "$349", l3: "$699", highlight: false },
    { label: "Per Claim", l1: "$1.49", l2: "$3.49", l3: "$6.99", highlight: false },
    { label: "Collections %", l1: "5%", l2: "12%", l3: "20%", highlight: true },
    { label: "No Upfront", l1: "✓", l2: "✓", l3: "✓", highlight: true },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">3-Level Pricing</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4">
              Choose Your <span className="gradient-text">Recovery Level</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From diagnosis to full automation. Pay per claim, per hundred, or from recovered revenue with <strong className="text-foreground">no upfront cost</strong>.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.15}>
              <div className={`h-full rounded-2xl p-7 border transition-all relative flex flex-col ${
                plan.popular
                  ? "bg-card border-primary shadow-xl shadow-primary/10 md:scale-105"
                  : "bg-card border-border hover:border-primary/30"
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    plan.level === 1 ? 'text-cyan-600' : plan.level === 2 ? 'text-emerald-600' : 'text-primary'
                  }`}>Level {plan.level}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-0.5">{plan.name}</h3>
                <p className="text-xs text-muted-foreground font-medium mb-3">{plan.subtitle}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{plan.perClaim}</p>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{plan.desc}</p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.level === 1 ? 'text-cyan-500' : plan.level === 2 ? 'text-emerald-500' : 'text-primary'
                      }`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onPlanSelect?.(plan.level === 1 ? "l1-scan" : plan.level === 2 ? "l2-fix" : "l3-autofix")}
                  className={`block w-full text-center py-3 rounded-xl font-semibold transition-all text-sm ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25"
                      : plan.level === 1
                        ? "border-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300"
                        : plan.level === 3
                          ? "border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary"
                          : "border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Payment Options Comparison */}
        <FadeIn delay={0.3}>
          <div className="max-w-4xl mx-auto mt-14">
            <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Flexible Payment Options</h3>
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-muted-foreground font-medium">Payment Model</th>
                    <th className="px-4 py-3 text-center text-cyan-600 font-medium">L1: Scan & Score</th>
                    <th className="px-4 py-3 text-center text-emerald-600 font-medium">L2: Fix & Appeal</th>
                    <th className="px-4 py-3 text-center text-primary font-medium">L3: EHR Auto-Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentOptions.map((opt, i) => (
                    <tr key={opt.label} className={`border-b border-border/50 ${opt.highlight ? 'bg-primary-50/50' : i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <td className="px-4 py-3 text-muted-foreground font-medium">
                        {opt.label}
                        {opt.highlight && <span className="ml-2 text-[10px] font-bold text-primary bg-primary-100 px-1.5 py-0.5 rounded">POPULAR</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">{opt.l1}</td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">{opt.l2}</td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">{opt.l3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>

        {/* No upfront highlight */}
        <FadeIn delay={0.4}>
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50/50 rounded-xl p-5 border border-emerald-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CircleDollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-bold text-foreground mb-0.5">No Upfront Cost Option</h4>
                <p className="text-sm text-muted-foreground">
                  Choose the collections-based model and pay only from recovered revenue. Zero risk — we only get paid when you get paid.
                </p>
              </div>
              <a href="#" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all hover:shadow-lg flex-shrink-0">
                Learn More <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </FadeIn>

        {/* Trust badges */}
        <FadeIn delay={0.5}>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> HIPAA Compliant</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-primary" /> SOC 2 Certified</span>
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> FHIR R4 Compatible</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> No Long-Term Contracts</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function FinalCTA({ onPlanSelect }: { onPlanSelect?: (plan: string) => void }) {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="grid-bg w-full h-full" style={{ filter: "invert(1)" }} />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5">
            Ready to Turn Denials Into <span className="text-primary-200">Revenue</span>?
          </h2>
          <p className="text-lg text-primary-100/70 max-w-2xl mx-auto mb-4">
            Join healthcare organizations recovering millions in denied claims with AI-powered denial management.
          </p>

          {/* 3 Level quick pick */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <a href="#pricing" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-sm font-semibold hover:bg-cyan-500/30 transition-colors">
              <ScanSearch className="w-4 h-4" /> L1: Scan & Score
            </a>
            <a href="#pricing" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-sm font-semibold hover:bg-emerald-500/30 transition-colors">
              <Wrench className="w-4 h-4" /> L2: Fix & Appeal
            </a>
            <a href="#pricing" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-200 text-sm font-semibold hover:bg-primary-500/30 transition-colors">
              <Rocket className="w-4 h-4" /> L3: EHR Auto-Fix
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => onPlanSelect?.("l2-fix")}
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPlanSelect?.("custom")}
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/20 hover:border-white/40 rounded-xl transition-all"
            >
              Schedule a Demo
            </button>
          </div>
          <p className="text-sm text-primary-100/40">
            No credit card required. 14-day free trial. HIPAA compliant from day one.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  const footerLinks = {
    Product: ["Features", "AI Agents", "Integrations", "Pricing", "Changelog"],
    Solutions: ["DSO Operations", "CFO & Finance", "Hospital Admin", "Multi-Specialty", "Enterprise"],
    Resources: ["Documentation", "API Reference", "Blog", "Case Studies", "Webinars"],
    Company: ["About", "Careers", "Press", "Contact", "Partners"],
    Legal: ["Privacy Policy", "Terms of Service", "HIPAA Compliance", "BAA", "Security"],
  };

  return (
    <footer className="bg-foreground text-white/70 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Stethoscope className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Denials<span className="text-primary-200">Doctor</span>
              </span>
            </div>
            <p className="text-sm text-white/50 mb-4 leading-relaxed">
              AI-powered denial management and revenue recovery for healthcare organizations.
            </p>
            <div className="flex items-center gap-3 text-white/40">
              <Mail className="w-4 h-4" />
              <span className="text-xs">hello@denialsdoctor.com</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-white/40 hover:text-primary-200 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Denials Doctor. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> HIPAA</span>
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> SOC 2</span>
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> FHIR R4</span>
            <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> X12</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── MAIN PAGE ─── */
export default function LandingPage() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("l2-fix");

  const openPayment = useCallback((plan: string) => {
    setSelectedPlan(plan);
    setPaymentOpen(true);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <Nav onCtaClick={() => openPayment("l2-fix")} />
      <Hero onCtaClick={() => openPayment("l2-fix")} />
      <TrustMetrics />
      <HowItWorks />
      <FeatureComparison />
      <AIAgents />
      <Attribution />
      <Personas />
      <Testimonials />
      <Integrations />
      <Pricing onPlanSelect={openPayment} />
      <FinalCTA onPlanSelect={openPayment} />
      <Footer />
      <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} planId={selectedPlan} />
    </main>
  );
}
