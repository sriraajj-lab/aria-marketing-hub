/**
 * API Route: /api/v1/codex/analyze
 * 
 * Denials Doctor — Codex-Powered Claim Denial Analysis
 * Uses GPT-5.3-Codex from Azure AI Foundry
 * 
 * POST /api/v1/codex/analyze
 * GET  /api/v1/codex/analyze (health check)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBrain } from '@/lib/brain';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST — Analyze a claim denial using Codex
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      claimId,
      cptCodes = [],
      icd10Codes = [],
      hcpcsCodes = [],
      carcCode,
      rarcCode,
      denialReason,
      payer,
      amount,
      patientName,
      subscriberId,
      dateOfService,
    } = body;

    // Validate required fields
    if (!carcCode) {
      return NextResponse.json(
        { error: 'Missing required field: carcCode' },
        { status: 400 }
      );
    }

    if (!claimId) {
      return NextResponse.json(
        { error: 'Missing required field: claimId' },
        { status: 400 }
      );
    }

    const brain = getBrain();

    // Build the analysis prompt
    const userMessage = `Analyze this medical claim denial:

CARC Code: ${carcCode}
${rarcCode ? `RARC Code: ${rarcCode}` : ''}
${denialReason ? `Denial Reason: ${denialReason}` : ''}
Claim Details:
- CPT Codes: ${cptCodes.join(', ') || 'N/A'}
- ICD-10 Codes: ${icd10Codes.join(', ') || 'N/A'}
${hcpcsCodes.length ? `- HCPCS Codes: ${hcpcsCodes.join(', ')}` : ''}
- Payer: ${payer || 'N/A'}
- Amount: $${amount || 'N/A'}

Respond with ONLY a flat JSON object using these EXACT keys:
{
  "category": "one of: eligibility, coding, authorization, timely_filing, medical_necessity, duplicate, coordination, missing_info, noncovered, payment, unknown",
  "rootCause": "string - detailed root cause analysis",
  "recommendedAction": "string - specific action to resolve the denial",
  "appealStrategy": "string - appeal strategy if applicable",
  "confidence": 0.0
}

Do NOT use nested objects. All values must be strings or numbers.`;

    const systemPrompt = `You are an expert medical claim denial analyst with 20+ years of experience in revenue cycle management.
You specialize in analyzing CARC/RARC codes, identifying root causes, and developing effective appeal strategies.
You have deep knowledge of Medicare, Medicaid, and commercial payer policies.
You understand CCI/NCCI edits, modifier usage, and LCD/NCD requirements.`;

    // Use The Brain to analyze — Codex will be used if AZURE_FOUNDRY_API_KEY is set
    const result = await brain.think({
      systemPrompt,
      userMessage,
      outputFormat: 'json',
      category: 'denial_analysis',
      highStakes: true, // Always cross-validate denial analysis
      temperature: 0.15,
      validationContext: {
        carcCode,
        payerName: payer,
        cptCode: cptCodes[0],
        icd10Code: icd10Codes[0],
      },
    });

    // Also generate appeal letter if denial reason is provided
    let appealLetter: string | undefined;
    if (denialReason) {
      try {
        const appealResult = await brain.think({
          systemPrompt: `You are an expert medical appeal writer with extensive knowledge of CMS Medicare policies, commercial payer appeal processes, CARC/RARC code interpretations, and medical necessity documentation standards. Write professional, evidence-based appeal letters that maximize overturn rates.`,
          userMessage: `Generate a first-level appeal letter for the following denied claim:
Patient: ${patientName || '[PATIENT_NAME]'}
Subscriber ID: ${subscriberId || '[SUBSCRIBER_ID]'}
Claim Number: ${claimId}
Date of Service: ${dateOfService || '[DOS]'}
Payer: ${payer || '[PAYER_NAME]'}
CARC Code: ${carcCode}
Denial Reason: ${denialReason}
CPT Codes: ${cptCodes.join(', ') || 'N/A'}
ICD-10 Codes: ${icd10Codes.join(', ') || 'N/A'}

Write a professional, compelling appeal letter in business letter format.`,
          outputFormat: 'text',
          category: 'appeal_letter',
          highStakes: false,
          temperature: 0.3,
        });
        appealLetter = appealResult.content;
      } catch (error) {
        console.error('[API] Appeal letter generation failed:', error);
      }
    }

    return NextResponse.json({
      claimId,
      analysis: result.parsedContent || { raw: result.content },
      confidence: result.confidence,
      providers: result.providers,
      crossValidated: result.crossValidated,
      validation: result.validation,
      requiresHumanReview: result.requiresHumanReview,
      appealLetter: appealLetter ? {
        length: appealLetter.length,
        content: appealLetter,
      } : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API] Codex analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET — Health check for the Codex endpoint
 */
export async function GET() {
  const brain = getBrain();
  const providers = brain.getAvailableProviders?.() || [];
  const codexAvailable = providers.includes('azure-codex');

  return NextResponse.json({
    service: 'Denials Doctor Codex API',
    status: codexAvailable ? 'ok' : 'degraded',
    codexAvailable,
    availableProviders: providers,
    model: 'gpt-5.3-codex',
    endpoint: 'Azure AI Foundry',
    timestamp: new Date().toISOString(),
  });
}
