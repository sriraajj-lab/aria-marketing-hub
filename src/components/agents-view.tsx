'use client';

import { useEffect, useState } from 'react';
import {
  Bot,
  Wrench,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  BrainCircuit,
  Search,
  Users,
  ShieldAlert,
  FileSearch,
  HeartPulse,
  Timer,
  DollarSign,
  TrendingUp,
  ShieldQuestion,
  Eye,
  Lock,
  Cpu,
  Route,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';

// ─── AGENT ICON MAP ───────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ReactNode> = {
  'triage-router': <Route className="h-6 w-6" />,
  'denial-analyzer': <BrainCircuit className="h-6 w-6" />,
  'correction-engine': <Wrench className="h-6 w-6" />,
  'quality-checker': <ShieldCheck className="h-6 w-6" />,
  'appeal-strategist': <ShieldAlert className="h-6 w-6" />,
  'evidence-retrieval': <FileSearch className="h-6 w-6" />,
  'eligibility-cob': <Users className="h-6 w-6" />,
  'prior-authorization': <ShieldQuestion className="h-6 w-6" />,
  'medical-necessity': <HeartPulse className="h-6 w-6" />,
  'timely-filing-watchdog': <Timer className="h-6 w-6" />,
  'underpayment-detector': <DollarSign className="h-6 w-6" />,
  'payer-behavior-learner': <TrendingUp className="h-6 w-6" />,
  'root-cause-prevention': <Eye className="h-6 w-6" />,
  'compliance-audit': <ShieldAlert className="h-6 w-6" />,
  'human-in-the-loop': <Cpu className="h-6 w-6" />,
};

const AGENT_COLORS: Record<string, string> = {
  'triage-router': 'text-cyan',
  'denial-analyzer': 'text-primary',
  'correction-engine': 'text-orange-400',
  'quality-checker': 'text-emerald',
  'appeal-strategist': 'text-amber-500',
  'evidence-retrieval': 'text-sky-400',
  'eligibility-cob': 'text-teal-500',
  'prior-authorization': 'text-violet-400',
  'medical-necessity': 'text-rose-400',
  'timely-filing-watchdog': 'text-red-400',
  'underpayment-detector': 'text-yellow-400',
  'payer-behavior-learner': 'text-indigo-400',
  'root-cause-prevention': 'text-lime-400',
  'compliance-audit': 'text-pink-400',
  'human-in-the-loop': 'text-primary',
};

const CATEGORY_COLORS: Record<string, string> = {
  Routing: 'bg-cyan/10 border-cyan/20',
  'Core Pipeline': 'bg-primary/10 border-primary/20',
  Specialist: 'bg-violet-500/10 border-violet-500/20',
  Watchdog: 'bg-red-500/10 border-red-500/20',
  Learning: 'bg-indigo-500/10 border-indigo-500/20',
  Compliance: 'bg-pink-500/10 border-pink-500/20',
  'EHR Integration': 'bg-emerald/10 border-emerald/20',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AgentInfo {
  name: string;
  description: string;
  capabilities: string[];
  tools: string[];
  level: number;
  category: string;
}

interface SystemStatus {
  agents: AgentInfo[];
  pendingTasks: number;
  runningTasks: number;
  recentCompletions: number;
  workflows: {
    l1: { name: string; description: string; steps: Array<{ agent: string; task: string; description: string; requiredLevel: number }> };
    l2: { name: string; description: string; steps: Array<{ agent: string; task: string; description: string; requiredLevel: number }> };
    l3: { name: string; description: string; steps: Array<{ agent: string; task: string; description: string; requiredLevel: number }> };
  };
}

export function AgentsView() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessLevel } = useAppStore();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/conductor');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching agent status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
        <p>Failed to load agent system status</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  const agents = status.agents || [];
  const categories = [...new Set(agents.map((a) => a.category))];
  const totalRuns = status.recentCompletions;
  const activeAgents = agents.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Agent System</h2>
        <p className="text-muted-foreground mt-1">
          Conductor-orchestrated agent pipeline with level-gated access and schema validation
        </p>
      </div>

      {/* Agent Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{activeAgents}</p>
            <p className="text-xs text-muted-foreground">Active Agents</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="h-6 w-6 text-emerald" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalRuns}</p>
            <p className="text-xs text-muted-foreground">Completed (24h)</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
              <Activity className="h-6 w-6 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{status.runningTasks}</p>
            <p className="text-xs text-muted-foreground">Running Now</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-cyan/10 flex items-center justify-center mx-auto mb-2">
              <Zap className="h-6 w-6 text-cyan" />
            </div>
            <p className="text-2xl font-bold text-foreground">{status.pendingTasks}</p>
            <p className="text-xs text-muted-foreground">Pending Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards by Category */}
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents
              .filter((a) => a.category === category)
              .map((agent) => (
                <AgentCard key={agent.name} agent={agent} currentLevel={accessLevel} />
              ))}
          </div>
        </div>
      ))}

      {/* Workflow Architecture */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Workflow Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* L1 Workflow */}
          <WorkflowDiagram
            level={1}
            name="L1: Scan & Score"
            steps={status.workflows?.l1?.steps || []}
            color="cyan"
            currentLevel={accessLevel}
          />

          {/* L2 Workflow */}
          <WorkflowDiagram
            level={2}
            name="L2: Fix & Appeal"
            steps={status.workflows?.l2?.steps || []}
            color="emerald"
            currentLevel={accessLevel}
          />

          {/* L3 Workflow */}
          <WorkflowDiagram
            level={3}
            name="L3: Auto-Fix"
            steps={status.workflows?.l3?.steps || []}
            color="primary"
            currentLevel={accessLevel}
          />

          <Separator className="bg-border" />

          {/* Conductor Config */}
          <div className="p-4 rounded-lg bg-secondary">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Conductor Configuration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pattern</span>
                <span className="font-mono text-primary">GStack/Conductor</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Validation</span>
                <span className="font-mono text-emerald">Zod Schema Gates</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Level Gating</span>
                <span className="font-mono text-foreground">Enforced</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fallback</span>
                <span className="font-mono text-foreground">Rule-Based</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── AGENT CARD COMPONENT ─────────────────────────────────────────────────────

function AgentCard({
  agent,
  currentLevel,
}: {
  agent: AgentInfo;
  currentLevel: number | null;
}) {
  const locked = currentLevel !== null && currentLevel < agent.level;

  return (
    <Card
      className={`border-border bg-card hover:border-primary/30 transition-smooth ${
        locked ? 'opacity-60' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={AGENT_COLORS[agent.name] || 'text-foreground'}>
            {AGENT_ICONS[agent.name] || <Bot className="h-6 w-6" />}
          </div>
          <div className="flex items-center gap-2">
            {locked && (
              <Badge variant="outline" className="bg-cyan/10 text-cyan border-cyan/30 text-[10px]">
                <Lock className="h-3 w-3 mr-1" /> L{agent.level}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`${
                agent.level === 1
                  ? 'bg-cyan/10 text-cyan border-cyan/30'
                  : agent.level === 3
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-emerald/10 text-emerald border-emerald/30'
              } text-[10px]`}
            >
              L{agent.level}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-sm font-semibold mt-2">
          {agent.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {agent.description}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <Separator className="bg-border" />

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <Badge
              key={cap}
              variant="outline"
              className="text-[9px] bg-secondary border-border"
            >
              {cap.replace(/_/g, ' ')}
            </Badge>
          ))}
          {agent.capabilities.length > 3 && (
            <Badge
              variant="outline"
              className="text-[9px] bg-secondary border-border"
            >
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>

        {/* Tools */}
        {agent.tools.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Tools:</span>{' '}
            {agent.tools.slice(0, 3).join(', ')}
            {agent.tools.length > 3 ? ` +${agent.tools.length - 3}` : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── WORKFLOW DIAGRAM COMPONENT ───────────────────────────────────────────────

function WorkflowDiagram({
  level,
  name,
  steps,
  color,
  currentLevel,
}: {
  level: number;
  name: string;
  steps: Array<{ agent: string; task: string; description: string; requiredLevel: number }>;
  color: string;
  currentLevel: number | null;
}) {
  const locked = currentLevel !== null && currentLevel < level;
  const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    cyan: { bg: 'bg-cyan/10', border: 'border-cyan/20', text: 'text-cyan', badge: 'bg-cyan/20 text-cyan border-cyan/30' },
    emerald: { bg: 'bg-emerald/10', border: 'border-emerald/20', text: 'text-emerald', badge: 'bg-emerald/20 text-emerald border-emerald/30' },
    primary: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', badge: 'bg-primary/20 text-primary border-primary/30' },
  };
  const c = colorClasses[color] || colorClasses.primary;

  return (
    <div className={locked ? 'opacity-50' : ''}>
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className={c.badge}>
          {locked && <Lock className="h-3 w-3 mr-1" />}
          {name}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {steps.length} step{steps.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.task} className="flex items-center gap-2">
            <div
              className={`rounded-lg ${c.bg} border ${c.border} p-2 min-w-[100px] text-center`}
            >
              <div className={`text-[10px] font-medium ${c.text}`}>
                {step.agent.replace(/-/g, ' ').split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {step.task.replace(/_/g, ' ')}
              </div>
              {step.requiredLevel > level && (
                <Badge variant="outline" className="text-[8px] mt-1 bg-primary/10 text-primary border-primary/30">
                  L{step.requiredLevel}
                </Badge>
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className="text-muted-foreground text-xs hidden sm:block">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
