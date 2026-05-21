/**
 * Specialty Coding Registry — Central hub for all medical specialty coding intelligence
 *
 * This module provides:
 * 1. Specialty auto-detection from CPT/ICD-10 codes
 * 2. Unified interface for specialty-specific coding rules
 * 3. NCCI pairs aggregated across all specialties
 * 4. Coverage rules indexed by CPT code
 * 5. CARC guidance by specialty
 * 6. Agent routing configuration by specialty
 *
 * Supported Specialties:
 *   - Oncology/Hematology (C00-C96, J-codes, chemo admin)
 *   - Cardiology (I00-I99, cath lab, EP, echo)
 *   - Orthopedics (M00-M99, surgical, PT)
 *   - Gastroenterology (K00-K95, endoscopy)
 *   - Neurosurgery/Neurology (G00-G99, M47-M48, spine)
 *   - Radiology/Imaging (70000-79999, all modalities)
 *   - Anesthesiology (00100-01999, time-based)
 *   - OB/GYN (O00-O9A, global delivery, ACOG)
 *   - Urology (N00-N99, surgical, biopsy)
 *   - Pulmonology (J00-J99, bronchoscopy, sleep)
 *   - Dermatology (L00-L99, Mohs, lesion removal)
 *   - Emergency Medicine (R00-R99, E/M complexity)
 *   - Pathology/Lab (80000-89999, bundling)
 *   - Behavioral Health (F00-F99, session limits)
 *   - Ophthalmology (H00-H59, eye codes, bilateral)
 *   - Nephrology (N00-N39, dialysis, ESRD)
 *   - General Surgery (surgical bundling, co-surgeon)
 *   - Physical Therapy (97000-97799, time-based, units)
 *   - Dental (CDT codes, frequency limits)
 *   - E/M (99201-99499, downcoding, modifier 25)
 */

import {
  ONCOLOGY_NCCI_PAIRS,
  ONCOLOGY_COVERAGE_RULES,
  ONCOLOGY_CARC_GUIDANCE,
  ONCOLOGY_CPT_CODES,
  ONCOLOGY_J_CODES,
  ONCOLOGY_CPT_RANGES,
  isOncologyCPT,
  isOncologyICD10,
  calculateInfusionTime,
  calculateJCodeBilling,
  WASTAGE_RULES,
  CLINICAL_TRIAL_BILLING_RULES,
} from './oncology-coding';

import {
  CARDIOLOGY_NCCI_PAIRS,
  CARDIOLOGY_COVERAGE_RULES,
  CARDIOLOGY_CPT_RANGES,
  CARDIOLOGY_CPT_CODES,
  isCardiologyCPT,
  isCardiologyICD10,
} from './cardiology-coding';

// ─── SPECIALTY DEFINITIONS ──────────────────────────────────────────────────

export type SpecialtyName =
  | 'oncology'
  | 'cardiology'
  | 'orthopedics'
  | 'gastroenterology'
  | 'neurosurgery'
  | 'radiology'
  | 'anesthesiology'
  | 'obgyn'
  | 'urology'
  | 'pulmonology'
  | 'dermatology'
  | 'emergency_medicine'
  | 'pathology_lab'
  | 'behavioral_health'
  | 'ophthalmology'
  | 'nephrology'
  | 'general_surgery'
  | 'physical_therapy'
  | 'dental'
  | 'eval_management'
  | 'general';

export interface SpecialtyDefinition {
  name: SpecialtyName;
  displayName: string;
  cptRanges: Array<[number, number]>;
  icd10Prefixes: string[];
  description: string;
  denialRiskLevel: 'critical' | 'high' | 'medium' | 'low';
  commonDenialCategories: string[];
  preferredAgents: string[];
  hasJCodes: boolean;
  hasTimeBasedCoding: boolean;
  hasGlobalPeriods: boolean;
}

export const SPECIALTY_DEFINITIONS: Record<SpecialtyName, SpecialtyDefinition> = {
  oncology: {
    name: 'oncology',
    displayName: 'Oncology/Hematology',
    cptRanges: [[96401, 96549], [77300, 77499], [19301, 19307], [38900, 38970]],
    icd10Prefixes: ['C00', 'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C7A', 'D46', 'Z51.1', 'Z85'],
    description: 'Medical oncology, radiation oncology, hematology, surgical oncology. J-codes, chemotherapy administration, infusion billing, wastage tracking.',
    denialRiskLevel: 'critical',
    commonDenialCategories: ['bundling', 'medical_necessity', 'authorization', 'coding_error'],
    preferredAgents: ['eligibility-agent', 'coding-agent', 'appeal-agent', 'scrubber-agent'],
    hasJCodes: true,
    hasTimeBasedCoding: true,
    hasGlobalPeriods: true,
  },
  cardiology: {
    name: 'cardiology',
    displayName: 'Cardiology',
    cptRanges: [[93000, 93050], [93220, 93299], [93300, 93359], [93401, 93990], [93600, 93662], [75552, 75574], [78451, 78499]],
    icd10Prefixes: ['I00', 'I10', 'I11', 'I20', 'I21', 'I22', 'I25', 'I33', 'I34', 'I35', 'I42', 'I48', 'I49', 'I50', 'Z95'],
    description: 'Interventional cardiology, electrophysiology, echocardiography, nuclear cardiology. Cath lab bundling, stent coding, imaging frequency limits.',
    denialRiskLevel: 'critical',
    commonDenialCategories: ['bundling', 'medical_necessity', 'authorization', 'coding_error'],
    preferredAgents: ['eligibility-agent', 'coding-agent', 'scrubber-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: true,
  },
  orthopedics: {
    name: 'orthopedics',
    displayName: 'Orthopedics',
    cptRanges: [[20000, 29999], [27000, 27999], [97000, 97799]],
    icd10Prefixes: ['M00', 'M1', 'M2', 'M75', 'M76', 'M77', 'M79', 'S0', 'S1', 'S2', 'S7', 'S8'],
    description: 'Total joint replacement, arthroscopy, fracture care, spinal procedures. Global periods, bilateral rules, E/M with procedures.',
    denialRiskLevel: 'high',
    commonDenialCategories: ['medical_necessity', 'bundling', 'authorization'],
    preferredAgents: ['eligibility-agent', 'coding-agent', 'appeal-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: true,
  },
  gastroenterology: {
    name: 'gastroenterology',
    displayName: 'Gastroenterology',
    cptRanges: [[43200, 43259], [43270, 43299], [45300, 45392], [45398, 45399]],
    icd10Prefixes: ['K21', 'K25', 'K26', 'K29', 'K31', 'K35', 'K40', 'K50', 'K51', 'K57', 'K80', 'K82', 'R10', 'R11'],
    description: 'Upper/lower endoscopy, colonoscopy, ERCP, liver biopsy. Sedation bundling, biopsy with diagnostic scope, screening vs diagnostic.',
    denialRiskLevel: 'high',
    commonDenialCategories: ['bundling', 'coding_error', 'medical_necessity'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: true,
  },
  neurosurgery: {
    name: 'neurosurgery',
    displayName: 'Neurosurgery/Spine',
    cptRanges: [[61000, 61070], [61500, 61598], [63001, 63280], [63290, 63308], [63650, 63688]],
    icd10Prefixes: ['G43', 'G44', 'G47', 'G83', 'M47', 'M48', 'M50', 'M51', 'M54', 'S12', 'S22', 'S32'],
    description: 'Spinal decompression, fusion, craniotomy, DBS, intrathecal pumps. Complex bundling, add-on codes, co-surgeon rules.',
    denialRiskLevel: 'high',
    commonDenialCategories: ['bundling', 'medical_necessity', 'authorization'],
    preferredAgents: ['eligibility-agent', 'coding-agent', 'appeal-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: true,
  },
  radiology: {
    name: 'radiology',
    displayName: 'Radiology/Imaging',
    cptRanges: [[70000, 79999]],
    icd10Prefixes: ['R90', 'R91', 'R93', 'M80', 'M81', 'M85'],
    description: 'CT, MRI, ultrasound, X-ray, PET/CT, mammography. Professional/technical component, 26/TC modifiers, contrast bundling.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['medical_necessity', 'coding_error', 'bundling'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: false,
  },
  anesthesiology: {
    name: 'anesthesiology',
    displayName: 'Anesthesiology',
    cptRanges: [[100, 1999]],
    icd10Prefixes: ['Z90', 'Z96', 'I10', 'I50', 'J96', 'G89'],
    description: 'Time-based billing, base units, qualifying circumstances, physical status modifiers, concurrent medical direction.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['coding_error', 'bundling'],
    preferredAgents: ['coding-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: true,
    hasGlobalPeriods: false,
  },
  obgyn: {
    name: 'obgyn',
    displayName: 'OB/GYN',
    cptRanges: [[58999, 58999], [59000, 59076], [59100, 59430], [59450, 59614], [59812, 59899]],
    icd10Prefixes: ['O00', 'O0', 'O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'N70', 'N80', 'N83', 'N84', 'N85', 'N86', 'N87', 'N88', 'N89', 'Z3A', 'Z34', 'Z37'],
    description: 'Global delivery packages, prenatal care, C-section, hysterectomy, infertility. Global periods, multiple gestation, ACOG guidelines.',
    denialRiskLevel: 'high',
    commonDenialCategories: ['bundling', 'coding_error', 'medical_necessity'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: true,
  },
  urology: {
    name: 'urology',
    displayName: 'Urology',
    cptRanges: [[50010, 50549], [50700, 50980], [51000, 51999], [52000, 52355], [52601, 53899]],
    icd10Prefixes: ['N00', 'N10', 'N13', 'N18', 'N20', 'N30', 'N35', 'N36', 'N39', 'N40', 'N42', 'N43', 'C61', 'C64', 'C65', 'C66', 'C67', 'C68'],
    description: 'Prostate procedures, cystoscopy, lithotripsy, nephrectomy, urodynamic testing. Surgical bundling, biopsy coding.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['bundling', 'medical_necessity', 'coding_error'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: true,
  },
  pulmonology: {
    name: 'pulmonology',
    displayName: 'Pulmonology',
    cptRanges: [[31600, 31660], [94002, 94799], [95800, 95811]],
    icd10Prefixes: ['J00', 'J06', 'J09', 'J18', 'J20', 'J40', 'J44', 'J45', 'J47', 'J60', 'J84', 'J91', 'J96', 'R06', 'R09'],
    description: 'Bronchoscopy, pulmonary function testing, sleep studies, ventilation management, thoracentesis. Multiple procedure rules.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['medical_necessity', 'bundling', 'coding_error'],
    preferredAgents: ['eligibility-agent', 'coding-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: true,
    hasGlobalPeriods: false,
  },
  dermatology: {
    name: 'dermatology',
    displayName: 'Dermatology',
    cptRanges: [[10000, 11606], [17000, 17004], [17010, 17250], [17311, 17314], [29000, 29260], [40490, 40520], [54050, 54100], [67800, 67840]],
    icd10Prefixes: ['L00', 'L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'C43', 'C44', 'D03', 'D04', 'D22', 'Q82'],
    description: 'Lesion removal, Mohs surgery, destruction, biopsy, cosmetic vs medical distinction. Size-based coding, Mohs bundling.',
    denialRiskLevel: 'high',
    commonDenialCategories: ['medical_necessity', 'coding_error'],
    preferredAgents: ['eligibility-agent', 'coding-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: false,
  },
  emergency_medicine: {
    name: 'emergency_medicine',
    displayName: 'Emergency Medicine',
    cptRanges: [[99281, 99285]],
    icd10Prefixes: ['R00', 'R0', 'R1', 'R5', 'R6', 'R7', 'R8', 'R9', 'S0', 'S1', 'T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'V0', 'W0', 'X0'],
    description: 'ED E/M levels, critical care, observation, multiple procedure rules, modifier 25 with procedures, trauma coding.',
    denialRiskLevel: 'high',
    commonDenialCategories: ['coding_error', 'medical_necessity', 'bundling'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: true,
    hasGlobalPeriods: false,
  },
  pathology_lab: {
    name: 'pathology_lab',
    displayName: 'Pathology/Laboratory',
    cptRanges: [[80047, 80053], [80061, 80061], [80100, 80104], [81000, 81099], [82000, 89999]],
    icd10Prefixes: ['R69', 'R70', 'R71', 'R72', 'R73', 'R74', 'R75', 'R76', 'R77', 'R78', 'R79', 'E00', 'E0', 'E1', 'E7', 'D5', 'D6', 'D7'],
    description: 'Lab panel bundling, reflex testing, medical necessity for specific tests, organ disease panels vs individual components.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['bundling', 'medical_necessity', 'coding_error'],
    preferredAgents: ['coding-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: false,
  },
  behavioral_health: {
    name: 'behavioral_health',
    displayName: 'Behavioral Health',
    cptRanges: [[90785, 90899], [96116, 96133]],
    icd10Prefixes: ['F00', 'F01', 'F02', 'F03', 'F10', 'F11', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'G30', 'G40'],
    description: 'Psychotherapy, E/M with psychotherapy, psychological testing, session time-based coding, medical necessity for behavioral health.',
    denialRiskLevel: 'high',
    commonDenialCategories: ['medical_necessity', 'authorization', 'coding_error'],
    preferredAgents: ['eligibility-agent', 'scrubber-agent', 'coding-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: true,
    hasGlobalPeriods: false,
  },
  ophthalmology: {
    name: 'ophthalmology',
    displayName: 'Ophthalmology',
    cptRanges: [[92002, 92014], [92015, 92060], [92133, 92134], [92201, 92250], [92310, 92326], [65101, 68841]],
    icd10Prefixes: ['H00', 'H01', 'H02', 'H04', 'H05', 'H10', 'H11', 'H15', 'H16', 'H18', 'H20', 'H21', 'H25', 'H26', 'H30', 'H33', 'H34', 'H35', 'H36', 'H40', 'H43', 'H44', 'H47', 'H49', 'H50', 'H52', 'H53', 'H54', 'Q12', 'Q13', 'Q15'],
    description: 'Eye exam codes, bilateral procedures, modifier -50, retinal procedures, cataract surgery, glaucoma management.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['coding_error', 'bundling', 'medical_necessity'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: true,
  },
  nephrology: {
    name: 'nephrology',
    displayName: 'Nephrology',
    cptRanges: [[49999, 49999], [50300, 50380], [50543, 50543], [90935, 90999]],
    icd10Prefixes: ['N00', 'N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08', 'N10', 'N11', 'N12', 'N13', 'N14', 'N15', 'N16', 'N17', 'N18', 'N19', 'N25', 'Z49', 'Z91', 'Z99', 'T86'],
    description: 'Dialysis (hemodialysis/peritoneal), ESRD bundling, kidney transplant, vascular access, nephrostomy. ESRD QIP, PPS bundling.',
    denialRiskLevel: 'high',
    commonDenialCategories: ['bundling', 'medical_necessity', 'coding_error'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: true,
    hasGlobalPeriods: false,
  },
  general_surgery: {
    name: 'general_surgery',
    displayName: 'General Surgery',
    cptRanges: [[10005, 10012], [44000, 44979], [49000, 49999]],
    icd10Prefixes: ['K00', 'K0', 'K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'R10', 'C17', 'C18', 'C19', 'C20', 'C22', 'C24', 'C25'],
    description: 'Hernia repair, appendectomy, cholecystectomy, bowel resection. Co-surgeon, assistant surgeon, complex bundling.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['bundling', 'coding_error', 'medical_necessity'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: true,
  },
  physical_therapy: {
    name: 'physical_therapy',
    displayName: 'Physical Therapy',
    cptRanges: [[97000, 97799]],
    icd10Prefixes: ['M00', 'M1', 'M2', 'M5', 'M6', 'M7', 'M8', 'M9', 'S0', 'S8', 'S9', 'G89', 'R26', 'Z96'],
    description: 'Therapeutic exercise, manual therapy, modalities, time-based units (8-minute rule), PT/OT/SLP caps, KX modifier.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['medical_necessity', 'bundling', 'coding_error'],
    preferredAgents: ['eligibility-agent', 'coding-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: true,
    hasGlobalPeriods: false,
  },
  dental: {
    name: 'dental',
    displayName: 'Dental',
    cptRanges: [[41899, 41899]], // CDT codes handled separately
    icd10Prefixes: ['K00', 'K01', 'K02', 'K03', 'K04', 'K05', 'K06', 'K08'],
    description: 'CDT codes (D0000-D9999), dental frequency limits, missing tooth clause, CDT-to-CPT cross-coding, orthodontic lifetime maximums.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['eligibility', 'coding_error', 'authorization'],
    preferredAgents: ['eligibility-cob', 'coding-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: false,
  },
  eval_management: {
    name: 'eval_management',
    displayName: 'Evaluation & Management',
    cptRanges: [[99201, 99499]],
    icd10Prefixes: [], // E/M covers virtually all diagnoses
    description: 'Office visits, consultations, critical care, observation, hospital care. Modifier 25, downcoding, documentation guidelines, MDM-based leveling.',
    denialRiskLevel: 'medium',
    commonDenialCategories: ['coding_error', 'medical_necessity'],
    preferredAgents: ['coding-agent', 'eligibility-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: false,
  },
  general: {
    name: 'general',
    displayName: 'General/Unspecified',
    cptRanges: [],
    icd10Prefixes: [],
    description: 'Default specialty for uncategorized claims. Uses general coding rules and AI-powered analysis.',
    denialRiskLevel: 'low',
    commonDenialCategories: ['coding_error', 'missing_information'],
    preferredAgents: ['coding-agent', 'coding-agent'],
    hasJCodes: false,
    hasTimeBasedCoding: false,
    hasGlobalPeriods: false,
  },
};

// ─── SPECIALTY AUTO-DETECTION ───────────────────────────────────────────────

/**
 * Detect the medical specialty based on CPT code and ICD-10 diagnosis
 */
export function detectSpecialty(cptCode: string, diagnosisCode: string): SpecialtyName {
  const cptNum = parseInt(cptCode);

  // Check specialty-specific detection functions first
  if (isOncologyCPT(cptCode) || isOncologyICD10(diagnosisCode)) return 'oncology';
  if (isCardiologyCPT(cptCode) || isCardiologyICD10(diagnosisCode)) return 'cardiology';

  // J-code detection (always oncology/specialty drugs)
  if (/^J[0-9]{4}$/.test(cptCode)) return 'oncology';

  // Check CPT ranges for each specialty
  for (const [name, def] of Object.entries(SPECIALTY_DEFINITIONS)) {
    if (name === 'general' || name === 'oncology' || name === 'cardiology') continue; // Already checked
    for (const [start, end] of def.cptRanges) {
      if (cptNum >= start && cptNum <= end) {
        return name as SpecialtyName;
      }
    }
  }

  // Check ICD-10 prefixes
  for (const [name, def] of Object.entries(SPECIALTY_DEFINITIONS)) {
    if (name === 'general' || name === 'eval_management') continue;
    for (const prefix of def.icd10Prefixes) {
      if (diagnosisCode.startsWith(prefix)) {
        return name as SpecialtyName;
      }
    }
  }

  return 'general';
}

/**
 * Detect specialty from CPT code only
 */
export function detectSpecialtyFromCPT(cptCode: string): SpecialtyName {
  const cptNum = parseInt(cptCode);

  if (isOncologyCPT(cptCode)) return 'oncology';
  if (isCardiologyCPT(cptCode)) return 'cardiology';
  if (/^J[0-9]{4}$/.test(cptCode)) return 'oncology';

  for (const [name, def] of Object.entries(SPECIALTY_DEFINITIONS)) {
    if (name === 'general' || name === 'oncology' || name === 'cardiology') continue;
    for (const [start, end] of def.cptRanges) {
      if (cptNum >= start && cptNum <= end) {
        return name as SpecialtyName;
      }
    }
  }

  return 'general';
}

/**
 * Get the full specialty definition
 */
export function getSpecialtyDefinition(specialty: SpecialtyName): SpecialtyDefinition {
  return SPECIALTY_DEFINITIONS[specialty] || SPECIALTY_DEFINITIONS.general;
}

// ─── UNIFIED NCCI EDIT PAIRS (All Specialties) ──────────────────────────────

import { NCCI_EDIT_PAIRS } from '../coding-intelligence';

export interface UnifiedNCCIPair {
  column1: string;
  column2: string;
  modifierAllowed: boolean;
  rationale?: string;
  specialty: SpecialtyName;
}

function buildUnifiedNCCIPairs(): UnifiedNCCIPair[] {
  const pairs: UnifiedNCCIPair[] = [];

  // From existing coding-intelligence.ts (general)
  for (const [col1, col2, modAllowed] of NCCI_EDIT_PAIRS) {
    pairs.push({ column1: col1, column2: col2, modifierAllowed: modAllowed, specialty: 'general' });
  }

  // Oncology-specific NCCI pairs
  for (const [col1, col2, modAllowed, rationale] of ONCOLOGY_NCCI_PAIRS) {
    pairs.push({ column1: col1, column2: col2, modifierAllowed: modAllowed, rationale, specialty: 'oncology' });
  }

  // Cardiology-specific NCCI pairs
  for (const [col1, col2, modAllowed, rationale] of CARDIOLOGY_NCCI_PAIRS) {
    pairs.push({ column1: col1, column2: col2, modifierAllowed: modAllowed, rationale, specialty: 'cardiology' });
  }

  return pairs;
}

let _unifiedNCCIPairs: UnifiedNCCIPair[] | null = null;

export function getUnifiedNCCIPairs(): UnifiedNCCIPair[] {
  if (!_unifiedNCCIPairs) {
    _unifiedNCCIPairs = buildUnifiedNCCIPairs();
  }
  return _unifiedNCCIPairs;
}

/**
 * Check NCCI edits for a CPT code across all specialties
 */
export function checkNCCIAcrossSpecialties(cptCode: string, specialty?: SpecialtyName): UnifiedNCCIPair[] {
  const allPairs = getUnifiedNCCIPairs();

  return allPairs.filter(pair => {
    const matchesCode = pair.column1 === cptCode || pair.column2 === cptCode;
    const matchesSpecialty = !specialty || pair.specialty === specialty || pair.specialty === 'general';
    return matchesCode && matchesSpecialty;
  });
}

// ─── UNIFIED COVERAGE RULES (All Specialties) ───────────────────────────────

import { COVERAGE_RULES } from '../coding-intelligence';

export interface UnifiedCoverageRule {
  cptCodes: string[];
  procedure: string;
  coveredDiagnoses: string[];
  uncoveredDiagnoses: string[];
  lcdReference?: string;
  ncdReference?: string;
  documentation: string[];
  specialty: SpecialtyName;
  specialRules?: string[];
}

function buildUnifiedCoverageRules(): UnifiedCoverageRule[] {
  const rules: UnifiedCoverageRule[] = [];

  // From existing coding-intelligence.ts
  for (const rule of COVERAGE_RULES) {
    rules.push({
      cptCodes: rule.cptCodes,
      procedure: rule.cptCodes.join('/'),
      coveredDiagnoses: rule.coveredDiagnoses,
      uncoveredDiagnoses: rule.uncoveredDiagnoses,
      lcdReference: rule.lcdReference,
      ncdReference: rule.ncdReference,
      documentation: rule.documentation,
      specialty: 'general',
    });
  }

  // Oncology coverage rules
  for (const rule of ONCOLOGY_COVERAGE_RULES) {
    rules.push({
      cptCodes: [rule.cptCode],
      procedure: rule.procedure,
      coveredDiagnoses: rule.coveredDiagnoses,
      uncoveredDiagnoses: rule.uncoveredDiagnoses,
      lcdReference: rule.lcdReference,
      ncdReference: rule.ncdReference,
      documentation: rule.documentation,
      specialty: 'oncology',
      specialRules: rule.specialRules,
    });
  }

  // Cardiology coverage rules
  for (const rule of CARDIOLOGY_COVERAGE_RULES) {
    rules.push({
      cptCodes: [rule.cptCode],
      procedure: rule.procedure,
      coveredDiagnoses: rule.coveredDiagnoses,
      uncoveredDiagnoses: rule.uncoveredDiagnoses,
      lcdReference: rule.lcdReference,
      documentation: rule.documentation,
      specialty: 'cardiology',
      specialRules: rule.specialRules,
    });
  }

  return rules;
}

let _unifiedCoverageRules: UnifiedCoverageRule[] | null = null;

export function getUnifiedCoverageRules(): UnifiedCoverageRule[] {
  if (!_unifiedCoverageRules) {
    _unifiedCoverageRules = buildUnifiedCoverageRules();
  }
  return _unifiedCoverageRules;
}

/**
 * Find coverage rules for a specific CPT code
 */
export function findCoverageRules(cptCode: string, specialty?: SpecialtyName): UnifiedCoverageRule[] {
  const allRules = getUnifiedCoverageRules();
  return allRules.filter(rule => {
    const matchesCode = rule.cptCodes.includes(cptCode);
    const matchesSpecialty = !specialty || rule.specialty === specialty || rule.specialty === 'general';
    return matchesCode && matchesSpecialty;
  });
}

// ─── SPECIALTY-SPECIFIC CARC GUIDANCE ────────────────────────────────────────

import { getCARCSpecificGuidance } from '../coding-intelligence';

export interface SpecialtyCARCGuidance {
  carcCode: string;
  specialty: SpecialtyName;
  commonScenarios: string[];
  fixes: string[];
  successRate: number;
  oncologySpecific?: boolean;
}

export function getSpecialtyCARCGuidance(carcCode: string, specialty: SpecialtyName): SpecialtyCARCGuidance[] {
  const results: SpecialtyCARCGuidance[] = [];

  // General guidance
  const generalGuidance = getCARCSpecificGuidance(carcCode);
  results.push({
    carcCode,
    specialty: 'general',
    commonScenarios: [`${carcCode} denial`],
    fixes: generalGuidance.commonFixes,
    successRate: generalGuidance.successRate,
  });

  // Oncology-specific guidance
  if (ONCOLOGY_CARC_GUIDANCE[carcCode]) {
    const oncGuidance = ONCOLOGY_CARC_GUIDANCE[carcCode];
    results.push({
      carcCode,
      specialty: 'oncology',
      commonScenarios: oncGuidance.commonScenarios,
      fixes: oncGuidance.fixes,
      successRate: oncGuidance.successRate,
      oncologySpecific: oncGuidance.oncologySpecific,
    });
  }

  // Filter by specialty if specified
  if (specialty !== 'general') {
    const specialtyResult = results.find(r => r.specialty === specialty);
    if (specialtyResult) {
      return [specialtyResult, ...results.filter(r => r.specialty === 'general')];
    }
  }

  return results;
}

// ─── SPECIALTY-AWARE AGENT ROUTING ──────────────────────────────────────────

export interface SpecialtyAgentConfig {
  specialty: SpecialtyName;
  primaryAgents: string[];
  secondaryAgents: string[];
  escalationAgent: string;
  workflowPriority: string[];
  autoApproveThreshold: number;
  requiresHumanApproval: string[];
}

export function getSpecialtyAgentConfig(specialty: SpecialtyName): SpecialtyAgentConfig {
  const def = SPECIALTY_DEFINITIONS[specialty];

  const configs: Partial<Record<SpecialtyName, Partial<SpecialtyAgentConfig>>> = {
    oncology: {
      primaryAgents: ['eligibility-agent', 'coding-agent', 'scrubber-agent'],
      secondaryAgents: ['appeal-agent', 'evidence-retrieval', 'compliance-audit'],
      workflowPriority: ['prior_auth_check', 'medical_necessity', 'coding_correction', 'appeal'],
      autoApproveThreshold: 0.7,
      requiresHumanApproval: ['off_label_drug', 'clinical_trial', 'high_value_chemo', 'jw_modifier'],
    },
    cardiology: {
      primaryAgents: ['eligibility-agent', 'coding-agent', 'scrubber-agent'],
      secondaryAgents: ['appeal-agent', 'evidence-retrieval'],
      workflowPriority: ['prior_auth_check', 'bundling_correction', 'medical_necessity', 'appeal'],
      autoApproveThreshold: 0.75,
      requiresHumanApproval: ['pci_coding', 'device_implant', 'high_value_procedure'],
    },
  };

  const config = configs[specialty] || {};

  return {
    specialty,
    primaryAgents: config.primaryAgents || def.preferredAgents.slice(0, 3),
    secondaryAgents: config.secondaryAgents || def.preferredAgents.slice(3),
    escalationAgent: 'human-in-the-loop',
    workflowPriority: config.workflowPriority || ['analysis', 'correction', 'appeal'],
    autoApproveThreshold: config.autoApproveThreshold || 0.8,
    requiresHumanApproval: config.requiresHumanApproval || ['high_value', 'compliance_risk'],
  };
}

// ─── SPECIALTY STATISTICS ────────────────────────────────────────────────────

export function getSpecialtyStats(): {
  totalSpecialties: number;
  totalNCCIPairs: number;
  totalCoverageRules: number;
  totalCPTCodes: number;
  totalJCodes: number;
  specialtiesByRisk: Record<string, string[]>;
} {
  const allPairs = getUnifiedNCCIPairs();
  const allRules = getUnifiedCoverageRules();

  const specialtiesByRisk: Record<string, string[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  let totalCPTCodes = 0;
  for (const [name, def] of Object.entries(SPECIALTY_DEFINITIONS)) {
    specialtiesByRisk[def.denialRiskLevel].push(def.displayName);
    totalCPTCodes += def.cptRanges.reduce((sum, [start, end]) => sum + (end - start + 1), 0);
  }

  return {
    totalSpecialties: Object.keys(SPECIALTY_DEFINITIONS).length,
    totalNCCIPairs: allPairs.length,
    totalCoverageRules: allRules.length,
    totalCPTCodes,
    totalJCodes: Object.keys(ONCOLOGY_J_CODES).length,
    specialtiesByRisk,
  };
}

// Re-export all specialty modules
export * from './oncology-coding';
export * from './cardiology-coding';
