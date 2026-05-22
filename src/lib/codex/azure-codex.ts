/**
 * Azure AI Foundry Codex Integration for Denials Doctor
 * 
 * GPT-5.3-Codex deployed via Azure AI Foundry (Project-scoped endpoint)
 * 
 * DEPLOYMENT INFO (from Azure Foundry):
 * - Deployment Name: gpt-5.3-codex
 * - Model: gpt-5.3-codex (version 2026-02-24)
 * - Type: GlobalStandard
 * - Rate Limits: 250K TPM / 2500 RPM
 * - Status: Succeeded / GenerallyAvailable
 * 
 * ENDPOINT: Azure AI Foundry Project-scoped Responses API
 * - Base: https://sreeraajj-7693-resource.services.ai.azure.com/api/projects/sreeraajj-7693/openai/v1
 * - Responses: /responses (POST)
 * - Auth: api-key header
 * 
 * Usage:
 *   AZURE_FOUNDRY_API_KEY=<key> npx tsx azure-codex.ts
 */

// ============================================================
// Types
// ============================================================

export interface CodexResponse {
  id: string;
  object: string;
  status: 'completed' | 'failed' | 'in_progress' | 'queued';
  output?: CodexOutputItem[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_tokens_details?: { cached_tokens: number };
    output_tokens_details?: { reasoning_tokens: number };
  };
  error?: {
    code: string;
    message: string;
  };
  model: string;
  metadata?: Record<string, unknown>;
}

export interface CodexOutputItem {
  type: 'message' | 'code' | 'file';
  id?: string;
  role?: string;
  status?: string;
  content?: CodexContentPart[];
  // For code/file outputs
  code?: string;
  file_id?: string;
}

export interface CodexContentPart {
  type: 'output_text' | 'input_text' | 'refusal';
  text?: string;
  annotations?: unknown[];
}

export interface HealthcareCodeValidation {
  code: string;
  codeType: 'ICD-10' | 'CPT' | 'HCPCS';
  isValid: boolean;
  description: string;
  confidence: number;
  alternatives?: string[];
  issues?: string[];
}

export interface DenialAnalysis {
  carcCode: string;
  rarcCode?: string;
  category: string;
  rootCause: string;
  recommendedAction: string | string[];
  appealStrategy?: string | string[];
  confidence: number;
  model: string;
  latency: number;
}

export interface CrossValidationResult {
  consensus: string;
  confidence: number;
  discrepancies: string[];
  recommendation: 'approve' | 'flag_for_review' | 'reject';
  modelsUsed: string[];
}

export interface ProviderResult {
  response: string;
  provider: string;
  latency: number;
  tokensUsed?: number;
}

// ============================================================
// Configuration — Azure AI Foundry
// ============================================================

const AZURE_FOUNDRY_BASE = process.env.AZURE_FOUNDRY_BASE || 
  'https://sreeraajj-7693-resource.services.ai.azure.com/api/projects/sreeraajj-7693/openai/v1';

const AZURE_FOUNDRY_KEY = process.env.AZURE_FOUNDRY_API_KEY || '';

const AZURE_OPENAI_BASE = process.env.AZURE_OPENAI_BASE || 
  'https://sreeraajj-7693-resource.openai.azure.com/openai/v1';

const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY || '';

const CODEX_MODEL = 'gpt-5.3-codex';
const GPT4O_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

// ============================================================
// Azure Codex Client — Azure AI Foundry Responses API
// ============================================================

export class AzureCodexClient {
  private foundryBase: string;
  private foundryKey: string;
  private openaiBase: string;
  private openaiKey: string;

  constructor(config?: {
    foundryBase?: string;
    foundryKey?: string;
    openaiBase?: string;
    openaiKey?: string;
  }) {
    this.foundryBase = config?.foundryBase || AZURE_FOUNDRY_BASE;
    this.foundryKey = config?.foundryKey || AZURE_FOUNDRY_KEY;
    this.openaiBase = config?.openaiBase || AZURE_OPENAI_BASE;
    this.openaiKey = config?.openaiKey || AZURE_OPENAI_KEY;
  }

  /**
   * Execute a Codex task via the Azure AI Foundry Responses API
   * This is the primary method for interacting with GPT-5.3-Codex
   * 
   * The Responses API is the new standard for Codex models:
   * POST {foundry_base}/responses
   * Body: { model, input, instructions, temperature, max_output_tokens, tools }
   */
  async executeTask(
    input: string,
    options?: {
      instructions?: string;
      temperature?: number;
      maxOutputTokens?: number;
      metadata?: Record<string, string>;
    }
  ): Promise<CodexResponse> {
    const url = `${this.foundryBase}/responses`;

    const body: Record<string, unknown> = {
      model: CODEX_MODEL,
      input,
      temperature: options?.temperature ?? 0.2, // Low temperature for healthcare accuracy
      max_output_tokens: options?.maxOutputTokens ?? 4096,
    };

    // Only include instructions if provided (API rejects null)
    if (options?.instructions) {
      body.instructions = options.instructions;
    }

    if (options?.metadata) {
      body.metadata = options.metadata;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': this.foundryKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Codex API error (${response.status}): ${error.error?.message || JSON.stringify(error)}`);
    }

    return response.json() as Promise<CodexResponse>;
  }

  /**
   * Execute a chat completion via the standard Azure OpenAI endpoint
   * Used for GPT-4o in the fallback chain
   */
  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const url = `${this.openaiBase}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': this.openaiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GPT4O_DEPLOYMENT,
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`GPT-4o chat API error (${response.status}): ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }
}

// ============================================================
// Singleton instance
// ============================================================

let codexClient: AzureCodexClient | null = null;

export function getCodexClient(): AzureCodexClient {
  if (!codexClient) {
    codexClient = new AzureCodexClient();
  }
  return codexClient;
}

// ============================================================
// Helper: Extract text from Codex Responses API output
// ============================================================

export function extractOutputText(response: CodexResponse): string {
  if (response.output) {
    for (const item of response.output) {
      if (item.content) {
        for (const part of item.content) {
          if (part.type === 'output_text' && part.text) {
            return part.text;
          }
        }
      }
    }
  }
  // Fallback: stringify the entire response
  return JSON.stringify(response);
}

/**
 * Parse JSON from Codex output, handling markdown code blocks
 * Codex sometimes wraps JSON in ```json ... ``` blocks
 */
export function parseJsonFromOutput(text: string): Record<string, unknown> | null {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {
        // continue
      }
    }
    // Try extracting the first JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // continue
      }
    }
    return null;
  }
}

// ============================================================
// Healthcare-Specific Codex Functions
// ============================================================

/**
 * Validate an ICD-10, CPT, or HCPCS code using Codex
 * This augments the L1 Rule-based validation in The Brain
 */
export async function validateHealthcareCode(
  code: string,
  codeType: 'ICD-10' | 'CPT' | 'HCPCS',
  context?: string
): Promise<HealthcareCodeValidation> {
  const client = getCodexClient();
  const start = Date.now();

  const input = `Validate the following ${codeType} code: "${code}"
${context ? `Clinical context: ${context}` : ''}

Provide:
1. Whether the code is valid and currently active
2. The official description
3. Your confidence level (0-1)
4. Any potential issues or concerns
5. Alternative codes if this one seems incorrect

Respond in JSON format only.`;

  try {
    const result = await client.executeTask(input, {
      instructions: `You are a medical coding expert with deep knowledge of ${codeType} coding systems. 
You validate codes against the latest CMS guidelines and coding standards.
Always respond with valid JSON. Be conservative - if you're not sure a code is valid, flag it.`,
      temperature: 0.1,
    });

    const outputText = extractOutputText(result);
    console.log(`[Codex] Code validation for ${code} completed in ${Date.now() - start}ms`);
    
    const parsed = parseJsonFromOutput(outputText);
    if (parsed) {
      return {
        code,
        codeType,
        isValid: (parsed.isValid as boolean) ?? false,
        description: (parsed.description as string) ?? '',
        confidence: (parsed.confidence as number) ?? 0.5,
        alternatives: parsed.alternatives as string[] | undefined,
        issues: parsed.issues as string[] | undefined,
      };
    } else {
      return {
        code,
        codeType,
        isValid: true,
        description: outputText.substring(0, 200),
        confidence: 0.6,
        issues: ['Codex response was not valid JSON - manual review recommended'],
      };
    }
  } catch (error) {
    console.error('[Codex] Validation failed:', error);
    return {
      code,
      codeType,
      isValid: false,
      description: 'Validation failed - API error',
      confidence: 0,
      issues: [`Codex API error: ${(error as Error).message}`],
    };
  }
}

/**
 * Analyze a denial using Codex (augments OrchestratorAgent + CodingAgent)
 * This is the L3 cross-validation with Codex as the 3rd model
 */
export async function analyzeDenialWithCodex(
  denialData: {
    carcCode: string;
    rarcCode?: string;
    denialReason?: string;
    claimData?: {
      cptCodes?: string[];
      icd10Codes?: string[];
      payer?: string;
      amount?: number;
    };
  }
): Promise<DenialAnalysis> {
  const client = getCodexClient();
  const start = Date.now();

  const input = `Analyze this medical claim denial:

CARC Code: ${denialData.carcCode}
${denialData.rarcCode ? `RARC Code: ${denialData.rarcCode}` : ''}
${denialData.denialReason ? `Denial Reason: ${denialData.denialReason}` : ''}
${denialData.claimData ? `
Claim Details:
- CPT Codes: ${denialData.claimData.cptCodes?.join(', ') || 'N/A'}
- ICD-10 Codes: ${denialData.claimData.icd10Codes?.join(', ') || 'N/A'}
- Payer: ${denialData.claimData.payer || 'N/A'}
- Amount: $${denialData.claimData.amount || 'N/A'}
` : ''}

Respond with ONLY a flat JSON object using these EXACT keys:
{
  "category": "one of: eligibility, coding, authorization, timely_filing, medical_necessity, duplicate, coordination, missing_info, noncovered, payment, unknown",
  "rootCause": "string - detailed root cause analysis",
  "recommendedAction": "string - specific action to resolve the denial",
  "appealStrategy": "string - appeal strategy if applicable",
  "confidence": 0.0
}

Do NOT use nested objects. All values must be strings or numbers. Return ONLY the JSON object, no other text.`;

  try {
    const result = await client.executeTask(input, {
      instructions: `You are an expert medical claim denial analyst with 20+ years of experience in revenue cycle management.
You specialize in analyzing CARC/RARC codes, identifying root causes, and developing effective appeal strategies.
You have deep knowledge of Medicare, Medicaid, and commercial payer policies.
You understand CCI/NCCI edits, modifier usage, and LCD/NCD requirements.
Always respond with valid JSON. Be specific and actionable in your recommendations.`,
      temperature: 0.15,
    });

    const outputText = extractOutputText(result);
    const latency = Date.now() - start;
    console.log(`[Codex] Denial analysis completed in ${latency}ms`);
    
    const parsed = parseJsonFromOutput(outputText);
    if (parsed) {
      // Handle both flat and nested response formats from Codex
      const category = (parsed.category as string) 
        || (parsed.denial_category as Record<string, unknown>)?.primary as string
        || 'unknown';
      const rootCause = (parsed.rootCause as string) 
        || (parsed.root_cause_analysis as Record<string, unknown>)?.most_likely_root_causes as string
        || JSON.stringify(parsed.root_cause_analysis || parsed.rootCause || '').substring(0, 500);
      const confidence = (parsed.confidence as number) 
        || 0.75;

      return {
        carcCode: denialData.carcCode,
        rarcCode: denialData.rarcCode,
        category,
        rootCause: typeof rootCause === 'string' ? rootCause : JSON.stringify(rootCause),
        recommendedAction: (parsed.recommendedAction as string | string[]) 
          || (parsed.recommended_action as string | string[])
          || 'Review denial details and determine appropriate action',
        appealStrategy: (parsed.appealStrategy as string | string[] | undefined) 
          || (parsed.appeal_strategy as string | string[] | undefined),
        confidence,
        model: CODEX_MODEL,
        latency,
      };
    } else {
      return {
        carcCode: denialData.carcCode,
        rarcCode: denialData.rarcCode,
        category: 'unknown',
        rootCause: outputText.substring(0, 500),
        recommendedAction: 'Manual review recommended - Codex response parsing failed',
        confidence: 0.3,
        model: CODEX_MODEL,
        latency,
      };
    }
  } catch (error) {
    console.error('[Codex] Denial analysis failed:', error);
    return {
      carcCode: denialData.carcCode,
      rarcCode: denialData.rarcCode,
      category: 'error',
      rootCause: 'Codex API error',
      recommendedAction: 'Fall back to GPT-4o analysis',
      confidence: 0,
      model: CODEX_MODEL,
      latency: Date.now() - start,
    };
  }
}

/**
 * Generate an appeal letter using Codex (augments AppealAgent)
 */
export async function generateAppealLetterWithCodex(
  denialInfo: {
    patientName?: string;
    subscriberId?: string;
    claimNumber?: string;
    dateOfService?: string;
    carcCode: string;
    denialReason: string;
    cptCodes?: string[];
    icd10Codes?: string[];
    payerName?: string;
    appealLevel?: 'first' | 'second' | 'external';
  }
): Promise<string> {
  const client = getCodexClient();
  
  const input = `Generate a ${denialInfo.appealLevel || 'first'}-level appeal letter for the following denied claim:

Patient: ${denialInfo.patientName || '[PATIENT_NAME]'}
Subscriber ID: ${denialInfo.subscriberId || '[SUBSCRIBER_ID]'}
Claim Number: ${denialInfo.claimNumber || '[CLAIM_NUMBER]'}
Date of Service: ${denialInfo.dateOfService || '[DOS]'}
Payer: ${denialInfo.payerName || '[PAYER_NAME]'}

Denial Details:
- CARC Code: ${denialInfo.carcCode}
- Reason: ${denialInfo.denialReason}
- CPT Codes: ${denialInfo.cptCodes?.join(', ') || 'N/A'}
- ICD-10 Codes: ${denialInfo.icd10Codes?.join(', ') || 'N/A'}

Write a professional, compelling appeal letter that:
1. References the specific CARC code and why the denial is incorrect
2. Cites relevant payer policies, LCD/NCD references, or CMS guidelines
3. Presents supporting clinical rationale
4. Is formatted as a proper business letter
5. Includes placeholders for any missing information in [BRACKETS]`;

  try {
    const result = await client.executeTask(input, {
      instructions: `You are an expert medical appeal writer with extensive knowledge of:
- CMS Medicare policies and LCD/NCD requirements
- Commercial payer appeal processes and timelines
- CARC/RARC code interpretations and counter-arguments
- Medical necessity documentation standards
- HIPAA-compliant letter formatting
- CCI/NCCI edit rules and modifier usage

Write professional, evidence-based appeal letters that maximize overturn rates.
Use formal business letter format. Be specific about policy references.`,
      temperature: 0.3,
      maxOutputTokens: 6000,
    });

    return extractOutputText(result);
  } catch (error) {
    console.error('[Codex] Appeal generation failed:', error);
    throw error;
  }
}

/**
 * Generate code using Codex (for the Codex CLI /goal equivalent)
 * This allows autonomous code generation for healthcare AI projects
 */
export async function generateCode(
  task: string,
  options?: {
    language?: string;
    framework?: string;
    existingCode?: string;
  }
): Promise<string> {
  const client = getCodexClient();
  
  const input = `${options?.existingCode ? `Existing code:\n\`\`\`${options.language || 'typescript'}\n${options.existingCode}\n\`\`\`\n\n` : ''}Task: ${task}

${options?.framework ? `Framework: ${options.framework}` : ''}
${options?.language ? `Language: ${options.language}` : ''}

Write clean, well-documented, production-ready code. Include error handling and TypeScript types.`;

  const result = await client.executeTask(input, {
    instructions: `You are a senior software engineer specializing in healthcare technology.
You write clean, HIPAA-compliant, well-tested code.
Follow TypeScript best practices, use proper error handling, and include JSDoc comments.
Never hardcode API keys or PHI in code.`,
    temperature: 0.2,
    maxOutputTokens: 8000,
  });

  return extractOutputText(result);
}

// ============================================================
// The Brain L3 Triple Cross-Validation
// ============================================================

/**
 * L3 Triple Cross-Validation: Compare GPT-4o, Claude, and Codex responses
 * This is the core enhancement to The Brain's anti-hallucination system
 * 
 * The Brain's 5 layers:
 *   L1: Rule-based validation
 *   L2: Single-model AI (GPT-4o)
 *   L3: Dual-model cross-validation (GPT + Claude) → NOW TRIPLE (GPT + Claude + Codex)
 *   L4: Deterministic validation
 *   L5: Human review
 */
export async function tripleCrossValidate(
  prompt: string,
  gptResponse: string,
  claudeResponse: string,
  context?: string
): Promise<CrossValidationResult> {
  const client = getCodexClient();
  const start = Date.now();

  const input = `You are performing a triple cross-validation of AI model outputs for a healthcare claim decision.

Original Prompt: ${prompt}

${context ? `Context: ${context}` : ''}

Model 1 (GPT-4o) Response:
${gptResponse}

Model 2 (Claude) Response:
${claudeResponse}

Your task:
1. Analyze both responses for consistency and accuracy
2. Identify any discrepancies or contradictions between the models
3. Determine the consensus position based on medical coding standards
4. Assess overall confidence
5. Recommend whether to approve, flag for human review, or reject

Respond in JSON format with: consensus, confidence (0-1), discrepancies (array of strings), recommendation (approve|flag_for_review|reject)`;

  try {
    const result = await client.executeTask(input, {
      instructions: `You are a healthcare AI validation expert. You cross-validate outputs from multiple AI models to ensure accuracy and safety in medical claim decisions. 
You have deep knowledge of ICD-10, CPT, HCPCS coding, CMS guidelines, and payer policies.
When models disagree, identify which is more likely correct based on medical coding standards.
Always respond with valid JSON.`,
      temperature: 0.1,
    });

    const outputText = extractOutputText(result);
    const latency = Date.now() - start;
    console.log(`[Codex] Triple cross-validation completed in ${latency}ms`);

    const parsed = parseJsonFromOutput(outputText);
    if (parsed) {
      return {
        consensus: (parsed.consensus as string) || '',
        confidence: (parsed.confidence as number) || 0.5,
        discrepancies: (parsed.discrepancies as string[]) || [],
        recommendation: (parsed.recommendation as 'approve' | 'flag_for_review' | 'reject') || 'flag_for_review',
        modelsUsed: ['gpt-4o', 'claude', CODEX_MODEL],
      };
    } else {
      return {
        consensus: outputText.substring(0, 500),
        confidence: 0.4,
        discrepancies: ['Codex cross-validation response was not valid JSON'],
        recommendation: 'flag_for_review' as const,
        modelsUsed: ['gpt-4o', 'claude', CODEX_MODEL],
      };
    }
  } catch (error) {
    console.error('[Codex] Cross-validation failed:', error);
    return {
      consensus: 'Validation failed - manual review required',
      confidence: 0,
      discrepancies: [`Codex cross-validation API error: ${(error as Error).message}`],
      recommendation: 'flag_for_review',
      modelsUsed: ['gpt-4o', 'claude'],
    };
  }
}

// ============================================================
// Provider Fallback Chain Integration
// ============================================================

/**
 * Enhanced provider fallback with Codex as a tier
 * Chain: Azure OpenAI GPT-4o → Azure Codex → z-ai-sdk → Rule-based
 */
export async function executeWithFallback(
  prompt: string,
  options?: {
    instructions?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ProviderResult> {
  const providers = [
    {
      name: 'azure-codex',
      execute: async (): Promise<{ response: string; tokensUsed?: number }> => {
        const client = getCodexClient();
        const result = await client.executeTask(prompt, {
          instructions: options?.instructions,
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        });
        return {
          response: extractOutputText(result),
          tokensUsed: result.usage?.total_tokens,
        };
      },
    },
    {
      name: 'azure-gpt4o',
      execute: async (): Promise<{ response: string; tokensUsed?: number }> => {
        const client = getCodexClient();
        const response = await client.chatCompletion([
          { role: 'system', content: options?.instructions || '' },
          { role: 'user', content: prompt },
        ], { temperature: options?.temperature, maxTokens: options?.maxTokens });
        return { response };
      },
    },
  ];

  for (const provider of providers) {
    const start = Date.now();
    try {
      const { response, tokensUsed } = await provider.execute();
      return {
        response,
        provider: provider.name,
        latency: Date.now() - start,
        tokensUsed,
      };
    } catch (error) {
      console.warn(`[Brain] Provider ${provider.name} failed:`, (error as Error).message);
      continue;
    }
  }

  // All providers failed - return rule-based fallback
  return {
    response: 'All AI providers failed. Rule-based analysis required.',
    provider: 'rule-based-fallback',
    latency: 0,
  };
}

// ============================================================
// Quick Health Check
// ============================================================

/**
 * Quick health check for the Codex endpoint
 */
export async function healthCheck(): Promise<{
  status: 'ok' | 'error';
  endpoint: string;
  model: string;
  latency: number;
  error?: string;
}> {
  const client = getCodexClient();
  const start = Date.now();

  try {
    const result = await client.executeTask('Say "ok"', {
      temperature: 0,
      maxOutputTokens: 16,
    });

    const text = extractOutputText(result);
    return {
      status: text.toLowerCase().includes('ok') ? 'ok' : 'degraded',
      endpoint: AZURE_FOUNDRY_BASE,
      model: CODEX_MODEL,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      endpoint: AZURE_FOUNDRY_BASE,
      model: CODEX_MODEL,
      latency: Date.now() - start,
      error: (error as Error).message,
    };
  }
}
