/**
 * Agent Output Schema Validation
 *
 * Every agent must validate its output against a schema before returning results.
 * If validation fails, the agent falls back to rule-based logic.
 * This is the core anti-hallucination measure — no free-form parseJSONResponse output
 * reaches the next agent without conforming to a known shape.
 */
import { z } from 'zod';

// ─── DENIAL ANALYSIS OUTPUT SCHEMA ────────────────────────────────────────────

export const DenialAnalysisOutputSchema = z.object({
  denial_summary: z.string().min(10),
  root_cause_category: z.enum([
    'Coding Error',
    'Missing Information',
    'Duplicate Claim',
    'Bundling Issue',
    'Medical Necessity',
    'Authorization Required',
    'Timely Filing',
    'Patient Responsibility',
    'Eligibility',
    'Unknown',
  ]),
  root_cause_detail: z.string().min(10),
  denial_category: z.enum([
    'coding_error',
    'missing_information',
    'duplicate',
    'bundling',
    'medical_necessity',
    'authorization',
    'timely_filing',
    'eligibility',
    'other',
  ]),
  preventable: z.boolean(),
  correctable: z.boolean(),
  appeal_recommended: z.boolean(),
  confidence_score: z.number().min(0).max(1),
  recommended_next_action: z.string().min(5),
  required_information: z.array(
    z.object({
      item: z.string(),
      reason_needed: z.string(),
    })
  ),
  compliance_notes: z.array(z.string()),
});

export type DenialAnalysisOutput = z.infer<typeof DenialAnalysisOutputSchema>;

// ─── CORRECTION OUTPUT SCHEMA ─────────────────────────────────────────────────

export const CorrectionOutputSchema = z.object({
  correction_type: z.enum([
    'code_change',
    'modifier_add',
    'unbundle',
    'diagnosis_change',
    'demographic_fix',
    'authorization_add',
    'documentation_add',
    'resubmission',
  ]),
  correction_summary: z.string().min(10),
  correction_rationale: z.string().min(10),
  proposed_changes: z.array(
    z.object({
      field_path: z.string(),
      original_value: z.string(),
      proposed_value: z.string(),
      reason: z.string(),
      risk_level: z.enum(['low', 'medium', 'high']),
    })
  ),
  required_documents: z.array(
    z.object({
      document_type: z.string(),
      reason: z.string(),
    })
  ),
  resubmission_instructions: z.object({
    claim_frequency_code: z.string(),
    submission_type: z.string(),
    notes: z.string(),
  }),
  confidence_score: z.number().min(0).max(1),
  risk_level: z.enum(['low', 'medium', 'high']),
  compliance_notes: z.array(z.string()),
});

export type CorrectionOutput = z.infer<typeof CorrectionOutputSchema>;

// ─── QUALITY CHECK OUTPUT SCHEMA ──────────────────────────────────────────────

export const QualityCheckOutputSchema = z.object({
  overall_result: z.enum(['pass', 'fail', 'warning']),
  validation_findings: z.array(
    z.object({
      check: z.string(),
      result: z.string(),
      details: z.string(),
    })
  ),
  blocking_issues: z.array(
    z.object({
      issue: z.string(),
      required_resolution: z.string(),
    })
  ),
  warnings: z.array(
    z.object({
      warning: z.string(),
      recommended_action: z.string(),
    })
  ),
  recommendation: z.string(),
  confidence_score: z.number().min(0).max(1),
});

export type QualityCheckOutput = z.infer<typeof QualityCheckOutputSchema>;

// ─── APPEAL STRATEGY OUTPUT SCHEMA ────────────────────────────────────────────

export const AppealStrategyOutputSchema = z.object({
  appeal_level: z.enum(['first_level', 'second_level', 'external_review']),
  strategy: z.string().min(10),
  key_arguments: z.array(z.string().min(5)),
  required_documents: z.array(z.string()),
  estimated_success_rate: z.number().min(0).max(100),
  deadline_days: z.number().positive(),
  next_steps_if_denied: z.string(),
  letter_template: z.string().min(50),
});

export type AppealStrategyOutput = z.infer<typeof AppealStrategyOutputSchema>;

// ─── TRIAGE OUTPUT SCHEMA ─────────────────────────────────────────────────────

export const TriageOutputSchema = z.object({
  classification: z.object({
    category: z.string(),
    subcategory: z.string(),
    correctable: z.boolean(),
    appeal_recommended: z.boolean(),
  }),
  specialty: z.object({
    detected: z.string(),
    display_name: z.string(),
    risk_level: z.string(),
  }),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  recommended_agents: z.array(
    z.object({
      agent: z.string(),
      task: z.string(),
      reason: z.string(),
    })
  ),
  requires_human_approval: z.boolean(),
  estimated_value: z.number(),
  deadline_urgency: z.enum(['none', 'normal', 'urgent', 'critical']),
});

export type TriageOutput = z.infer<typeof TriageOutputSchema>;

// ─── GENERIC AGENT OUTPUT SCHEMA (fallback for agents without specific schemas) ─

export const GenericAgentOutputSchema = z.object({
  success: z.boolean(),
  output: z.record(z.unknown()),
  confidence: z.number().min(0).max(1),
});

// ─── VALIDATION HELPER ────────────────────────────────────────────────────────

export function validateAgentOutput<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: boolean; data?: T; errors?: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(
    (e) => `${e.path.join('.')}: ${e.message}`
  );
  return { success: false, errors };
}

// ─── SCHEMA REGISTRY ──────────────────────────────────────────────────────────
// Maps agent names to their output schemas for validation gates

export const AGENT_OUTPUT_SCHEMAS: Record<string, z.ZodType> = {
  'denial-analyzer': DenialAnalysisOutputSchema,
  'correction-engine': CorrectionOutputSchema,
  'quality-checker': QualityCheckOutputSchema,
  'triage-router': TriageOutputSchema,
  'appeal-strategist': AppealStrategyOutputSchema,
};
