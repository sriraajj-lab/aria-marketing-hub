export type AccessLevel = 1 | 2 | 3;
export type PracticeType = 'medical' | 'dental';
export type DenialStatus = 'New' | 'Analyzed' | 'Corrected' | 'Reviewed' | 'Resubmitted' | 'Appealed' | 'Closed';
export type DenialPriority = 'low' | 'normal' | 'high' | 'critical';
export type PaymentModel = 'per_hundred' | 'per_claim' | 'pay_as_you_grow' | 'collections_percentage';
export type DenialCategory = 'coding_error' | 'authorization' | 'eligibility' | 'medical_necessity' | 'timely_filing' | 'bundling';
export type AppView = 'landing' | 'dashboard' | 'denials' | 'denial-detail' | 'upload' | 'health-scan' | 'appeals' | 'fix-report';

export interface LevelConfig {
  level: AccessLevel;
  name: string;
  tagline: string;
  description: string;
  pricing: {
    per_hundred: number;
    per_claim: number;
    pay_as_you_grow: number;
    collections_percentage: number;
  };
  features: string[];
  lockedFeatures: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  popular?: boolean;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    name: 'Scan & Score',
    tagline: 'Diagnostic Overview',
    description: 'Identify denial patterns, score your revenue health, and see where money is leaking.',
    pricing: {
      per_hundred: 149,
      per_claim: 1.99,
      pay_as_you_grow: 0.99,
      collections_percentage: 5,
    },
    features: [
      'Health Scan & Score Report',
      'Denial pattern analysis',
      'Pain point identification',
      'Executive summary report',
      'Category breakdown',
      'Payer performance metrics',
      'Industry benchmarks',
    ],
    lockedFeatures: [
      'Individual claim analysis',
      'Smart correction suggestions',
      'Appeal letter generation',
      'Fix instructions',
      'Fix report export',
      'EHR integration',
      'Auto-resubmit',
    ],
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  {
    level: 2,
    name: 'Fix & Appeal',
    tagline: 'Guided Recovery',
    description: 'Get AI-powered fix instructions, appeal letters, and step-by-step guidance for every denied claim.',
    pricing: {
      per_hundred: 349,
      per_claim: 4.49,
      pay_as_you_grow: 2.99,
      collections_percentage: 12,
    },
    features: [
      'Everything in Scan & Score',
      'Individual claim AI analysis',
      'Smart correction suggestions',
      'Appeal letter generation',
      'Step-by-step fix instructions',
      'Fix report export (CSV)',
      'Where-to-submit guidance',
      'Payer-specific rules',
    ],
    lockedFeatures: [
      'EHR integration',
      'Autonomous processing',
      'Auto-resubmit',
      'Real-time EHR sync',
    ],
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    popular: true,
  },
  {
    level: 3,
    name: 'EHR Auto-Fix',
    tagline: 'Full Autonomous Recovery',
    description: 'Autonomous claim correction, auto-resubmission, and seamless EHR integration for zero-touch recovery.',
    pricing: {
      per_hundred: 699,
      per_claim: 8.99,
      pay_as_you_grow: 5.99,
      collections_percentage: 20,
    },
    features: [
      'Everything in Fix & Appeal',
      'EHR integration panel',
      'Autonomous processing toggle',
      'Auto-resubmit claims',
      'Real-time EHR sync',
      'Priority auto-processing',
      'Batch resubmission',
      'Dedicated success manager',
    ],
    lockedFeatures: [],
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
  },
];

export interface FieldCorrection {
  field: string;
  currentValue: string;
  correctedValue: string;
  reason: string;
}

export interface PayerRule {
  payerName: string;
  appealFax?: string;
  appealPortal?: string;
  appealAddress?: string;
  timelyFilingDays: number;
  specialRules?: string[];
}

export interface DenialRecord {
  id: string;
  claimNumber: string;
  patientName: string;
  patientDOB: string;
  dateOfService: string;
  submissionDate: string;
  denialDate: string;
  cptCode: string;
  cptDescription: string;
  icdCode: string;
  billedAmount: number;
  allowedAmount: number;
  deniedAmount: number;
  payerName: string;
  payerRule: PayerRule;
  carcCode: string;
  carcDescription: string;
  denialReason: string;
  denialCategory: DenialCategory;
  status: DenialStatus;
  priority: DenialPriority;
  appealDeadline: string;
  notes?: string;
  // L2+ fields
  analysis?: DenialAnalysis;
  correction?: DenialCorrection;
  appealLetter?: string;
  resubmissionInstructions?: string;
}

export interface DenialAnalysis {
  rootCause: string;
  confidence: number;
  category: DenialCategory;
  recommendation: string;
  estimatedRecoveryChance: number;
  suggestedAction: string;
  keyFindings: string[];
}

export interface DenialCorrection {
  fieldCorrections: FieldCorrection[];
  letterType: string;
  whereToSubmit: string;
  resubmissionSteps: string[];
  additionalDocumentation: string[];
  deadlineNote: string;
}

export interface HealthScanReport {
  overallScore: number;
  practiceName: string;
  scanDate: string;
  practiceType: PracticeType;
  totalClaims: number;
  deniedClaims: number;
  deniedAmount: number;
  recoverableAmount: number;
  dimensions: {
    denialRate: { score: number; value: number; benchmark: number; label: string };
    recoveryPotential: { score: number; value: number; benchmark: number; label: string };
    codingAccuracy: { score: number; value: number; benchmark: number; label: string };
    timelyFiling: { score: number; value: number; benchmark: number; label: string };
    payerMix: { score: number; value: number; benchmark: number; label: string };
  };
  categoryBreakdown: { category: DenialCategory; count: number; amount: number; percentage: number }[];
  payerBreakdown: { payer: string; count: number; amount: number; denialRate: number }[];
  executiveSummary: string;
  keyFindings: string[];
  improvementPlan: { priority: number; action: string; impact: string; timeline: string }[];
  painPoints: { title: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'; impact: string }[];
}

export interface FixReportExport {
  practiceName: string;
  practiceType: PracticeType;
  generatedDate: string;
  overallScore: number;
  totalDeniedAmount: number;
  totalRecoverableAmount: number;
  claims: FixReportClaim[];
}

export interface FixReportClaim {
  claimNumber: string;
  patientName: string;
  cptCode: string;
  cptDescription: string;
  denialReason: string;
  denialCategory: DenialCategory;
  deniedAmount: number;
  priority: DenialPriority;
  whatToChange: string;
  letterType: string;
  whereToSubmit: string;
  resubmissionInstructions: string;
  appealDeadline: string;
  recoveryChance: number;
}
