import { NextRequest, NextResponse } from 'next/server';
import { getDenialById, updateDenial } from '@/lib/data';
import { analyzeAndCorrectCoding, getCARCSpecificGuidance } from '@/lib/coding-intelligence';
import { predictResubmissionSuccess } from '@/lib/resubmission-intelligence';
import { createAuditLog } from '@/lib/audit';
import {
  detectSpecialty,
  getSpecialtyDefinition,
  getSpecialtyAgentConfig,
  findCoverageRules,
  checkNCCIAcrossSpecialties,
  getSpecialtyCARCGuidance,
  type SpecialtyName,
} from '@/lib/specialties';
import {
  isOncologyJCode,
  calculateInfusionTime,
  calculateJCodeBilling,
  ONCOLOGY_CPT_CODES,
  ONCOLOGY_J_CODES,
  WASTAGE_RULES,
  ONCOLOGY_CARC_GUIDANCE,
} from '@/lib/specialties/oncology-coding';

/**
 * Smart Coding Correction API
 * Performs intelligent coding analysis using:
 * - Specialty auto-detection (oncology, cardiology, etc.)
 * - NCCI edit pair validation (specialty-specific + general)
 * - Modifier requirement checking
 * - CPT-ICD crosswalk (medical necessity)
 * - LCD/NCD coverage criteria
 * - Oncology-specific: J-code wastage, infusion time calculation, biosimilar detection
 * - Historical resubmission success prediction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const denial = await getDenialById(id);

    if (!denial) {
      return NextResponse.json({ error: 'Denial not found' }, { status: 404 });
    }

    // ─── Step 1: Auto-detect specialty ──────────────────────────────────
    const detectedSpecialty = detectSpecialty(denial.cptCode, denial.diagnosisCode);
    const specialtyDef = getSpecialtyDefinition(detectedSpecialty);
    const agentConfig = getSpecialtyAgentConfig(detectedSpecialty);

    // ─── Step 2: Run general smart coding analysis ──────────────────────
    const codingResult = analyzeAndCorrectCoding(denial);

    // ─── Step 3: Get specialty-specific CARC guidance ───────────────────
    const generalCarcGuidance = getCARCSpecificGuidance(denial.carcCode);
    const specialtyCarcGuidance = getSpecialtyCARCGuidance(denial.carcCode, detectedSpecialty);

    // ─── Step 4: Specialty-specific NCCI and coverage checks ────────────
    const specialtyNCCI = checkNCCIAcrossSpecialties(denial.cptCode, detectedSpecialty);
    const specialtyCoverage = findCoverageRules(denial.cptCode, detectedSpecialty);

    // ─── Step 5: Oncology-specific analysis (if applicable) ─────────────
    let oncologyAnalysis: Record<string, unknown> | null = null;

    if (detectedSpecialty === 'oncology' || isOncologyJCode(denial.cptCode)) {
      oncologyAnalysis = buildOncologyAnalysis(denial);
    }

    // ─── Step 6: Predict success if we apply the suggested corrections ──
    const primaryCorrectionType = codingResult.corrections.length > 0
      ? codingResult.corrections[0].type
      : 'review_required';
    const prediction = predictResubmissionSuccess(denial, primaryCorrectionType);

    // ─── Step 7: Audit log ──────────────────────────────────────────────
    createAuditLog({
      denialId: id,
      action: 'correct',
      entityType: 'denial',
      entityId: id,
      metadata: {
        analysisType: 'smart_coding_correction',
        specialty: detectedSpecialty,
        overallAssessment: codingResult.overallAssessment,
        correctionsCount: codingResult.corrections.length,
        predictedSuccess: prediction.predictedSuccessRate,
        oncologySpecific: !!oncologyAnalysis,
      },
    });

    // ─── Step 8: Update denial status ───────────────────────────────────
    if (codingResult.overallAssessment === 'correctable' || codingResult.overallAssessment === 'partially_correctable') {
      await updateDenial(id, {
        status: 'Corrected',
        specialty: detectedSpecialty,
      });
    }

    return NextResponse.json({
      denialId: id,
      specialty: {
        detected: detectedSpecialty,
        displayName: specialtyDef.displayName,
        denialRiskLevel: specialtyDef.denialRiskLevel,
        hasJCodes: specialtyDef.hasJCodes,
        hasTimeBasedCoding: specialtyDef.hasTimeBasedCoding,
        agentConfig,
      },
      codingAnalysis: codingResult,
      carcGuidance: {
        general: generalCarcGuidance,
        specialtySpecific: specialtyCarcGuidance,
      },
      specialtyNCCI,
      specialtyCoverage,
      oncologyAnalysis,
      prediction,
      summary: {
        assessment: codingResult.overallAssessment,
        specialty: detectedSpecialty,
        totalCorrections: codingResult.corrections.length,
        estimatedSuccessRate: codingResult.estimatedSuccessRate,
        predictedSuccessRate: prediction.predictedSuccessRate,
        recommendation: prediction.recommendation,
        resubmissionMethod: codingResult.resubmissionStrategy.method,
        estimatedDaysToResolution: codingResult.resubmissionStrategy.estimatedDaysToResolution,
        steps: codingResult.resubmissionStrategy.steps,
      },
    });
  } catch (error) {
    console.error('Error in smart correction:', error);
    return NextResponse.json({ error: 'Failed to perform smart coding correction' }, { status: 500 });
  }
}

/**
 * Build oncology-specific analysis for a denial
 */
function buildOncologyAnalysis(denial: Record<string, string | number | boolean | null>): Record<string, unknown> {
  const cptCode = String(denial.cptCode || '');
  const result: Record<string, unknown> = {};

  // Check if CPT code is in oncology CPT database
  const oncCPTInfo = ONCOLOGY_CPT_CODES[cptCode];
  if (oncCPTInfo) {
    result.cptDetails = oncCPTInfo;
  }

  // Check if CPT code is a J-code in oncology database
  const oncJCodeInfo = ONCOLOGY_J_CODES[cptCode];
  if (oncJCodeInfo) {
    result.jCodeDetails = oncJCodeInfo;

    // Check wastage rules
    const wastageRule = WASTAGE_RULES.find(w => w.jCode === cptCode);
    if (wastageRule) {
      result.wastageGuidance = wastageRule;
    }

    // Detect biosimilar
    if (oncJCodeInfo.drugName.toLowerCase().includes('biosimilar')) {
      result.biosimilarAlert = {
        isBiosimilar: true,
        drugName: oncJCodeInfo.drugName,
        note: 'Biosimilar product detected. Ensure correct J-code is used (not reference product code). Document biosimilar selection rationale per payer requirements.',
        commonDenialReason: 'Biosimilar vs reference product code confusion is a top denial driver',
      };
    }
  }

  // Oncology-specific CARC guidance
  const oncCarcGuidance = ONCOLOGY_CARC_GUIDANCE[String(denial.carcCode)];
  if (oncCarcGuidance) {
    result.oncologyCarcGuidance = oncCarcGuidance;
  }

  // Infusion time calculation suggestion for time-based codes
  const timeBasedCodes = ['96413', '96415', '96360', '96361', '96365', '96366'];
  if (timeBasedCodes.includes(cptCode)) {
    result.infusionTimeGuidance = {
      code: cptCode,
      note: 'This is a time-based infusion code. Ensure start/stop times are documented. Use calculateInfusionTime() for correct add-on code calculation.',
      commonError: 'Infusion time rounding errors and missing start/stop time documentation are top denial reasons for oncology infusion codes.',
    };
  }

  // JW Modifier check for oncology J-codes
  if (oncJCodeInfo && oncJCodeInfo.jwModifierRequired) {
    result.jwModifierGuidance = {
      jCode: cptCode,
      drugName: oncJCodeInfo.drugName,
      jwRequired: true,
      instruction: 'Single-use vial wastage must be reported with JW modifier. Document: (1) total mg in vial, (2) mg administered, (3) mg discarded, (4) reason for wastage.',
      commonError: 'Missing JW modifier for drug wastage is a frequent denial reason. Ensure wastage units are calculated correctly.',
    };
  }

  // CAR-T therapy specific alerts
  if (['Q2042', 'Q2043', 'Q2044', '0585T', '0586T', '0587T'].includes(cptCode)) {
    result.cartTherapyAlert = {
      isCARTherapy: true,
      note: 'CAR-T cell therapy requires REMS-certified facility, single-unit billing, and comprehensive monitoring documentation (CRS, neurotoxicity). WAC pricing may apply instead of ASP.',
      requiredDocumentation: [
        'REMS certification',
        'Leukapheresis/cell collection documentation',
        'Manufacturing and lot release documentation',
        'CRS monitoring protocol',
        'Neurologic toxicity monitoring',
        'Lymphodepleting chemotherapy documentation',
      ],
    };
  }

  // ADC therapy specific alerts
  if (['J9317', 'J9327', 'J9325', 'J9329'].includes(cptCode)) {
    result.adcTherapyAlert = {
      isADC: true,
      note: 'Antibody-Drug Conjugate detected. These require specific biomarker testing documentation (e.g., HER2 for Enhertu, Trop-2 for Trodelvy). Ensure indication matches FDA-approved labeling or NCCN compendium.',
    };
  }

  return result;
}
