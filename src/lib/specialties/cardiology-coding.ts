/**
 * Cardiology Coding Intelligence Module
 *
 * Covers: Interventional Cardiology, Electrophysiology, Echocardiography,
 *         Nuclear Cardiology, Heart Failure, General Cardiology
 * Code Ranges:
 *   - CPT: 93000-93050 (ECG), 93350-93357 (Stress Echo), 93401-93990 (Cath/EP)
 *   - ICD-10: I00-I99 (Circulatory system), Z95.x (Cardiac devices)
 *
 * Key Denial Triggers:
 *   - Cath lab bundling (diagnostic + intervention)
 *   - Stent coding errors (DES vs BMS, vessel specificity)
 *   - Echocardiography frequency limits
 *   - Modifier issues (26, TC, 59 for same-session procedures)
 *   - Medical necessity for cardiac imaging
 */

export interface CardiologyCPTCode {
  code: string;
  description: string;
  category: 'cath' | 'intervention' | 'ep' | 'echo' | 'ecg' | 'nuclear' | 'heart_failure';
  bundlingRules: string[];
  commonDenialReasons: string[];
  requiredDocumentation: string[];
}

export const CARDIOLOGY_CPT_CODES: Record<string, CardiologyCPTCode> = {
  // ─── Cardiac Catheterization ────────────────────────────────────────────
  '93458': {
    code: '93458',
    description: 'Catheter placement in coronary artery(s) for coronary angiography, including intraprocedural injection(s) for coronary angiography, imaging supervision and interpretation',
    category: 'cath',
    bundlingRules: [
      'Includes left heart catheterization when performed',
      'Cannot bill 93458 + 93460 (right + left heart cath) separately',
      'Includes injection and imaging interpretation',
      'Modifier 26 if professional component only',
    ],
    commonDenialReasons: ['Duplicate billing with interventional cath', 'Missing clinical indication', 'Left heart cath billed separately', 'Missing supervision documentation'],
    requiredDocumentation: ['Clinical indication (chest pain, abnormal stress test, etc.)', 'Access site', 'Vessels visualized', 'Findings (stenosis percentages)', 'Physician interpretation and report'],
  },
  '93459': {
    code: '93459',
    description: 'Catheter placement in coronary artery(s) for coronary angiography with left heart catheterization including intraprocedural injection(s) for left ventriculography, imaging supervision and interpretation',
    category: 'cath',
    bundlingRules: [
      'Includes ventriculography',
      'Cannot bill 93458 + ventriculography separately',
      'Cannot bill with 93460 same session',
    ],
    commonDenialReasons: ['Billed with 93458 same session', 'Ventriculography billed separately (included)'],
    requiredDocumentation: ['Clinical indication', 'Access site', 'Coronary angiography findings', 'Ventriculography findings', 'LVEF measurement'],
  },
  '93460': {
    code: '93460',
    description: 'Right heart catheterization including fluoroscopy, imaging supervision and interpretation',
    category: 'cath',
    bundlingRules: [
      'Cannot bill with 93458/93459 for combined cath (use 93461 instead)',
      'Includes pressure measurements',
      'Includes oximetry if performed',
    ],
    commonDenialReasons: ['Should use 93461 for combined right+left cath', 'Missing hemodynamic data'],
    requiredDocumentation: ['Clinical indication', 'Hemodynamic measurements', 'Oximetry data if performed', 'Pressure waveforms'],
  },

  // ─── Percutaneous Coronary Intervention (PCI) ──────────────────────────
  '93472': {
    code: '93472',
    description: 'Percutaneous transluminal coronary atherectomy, each additional coronary artery (List separately in addition to code for primary procedure)',
    category: 'intervention',
    bundlingRules: [
      'Add-on code - requires primary PCI code',
      'One unit per additional vessel',
      'Diagnostic cath bundled into PCI when performed same session',
    ],
    commonDenialReasons: ['Missing primary PCI code', 'Vessel not documented separately', 'Diagnostic cath billed separately'],
    requiredDocumentation: ['Target vessel(s) with lesions', 'Atherectomy device used', 'Pre/post dilation percentages', 'Adjunctive devices'],
  },
  '93356': {
    code: '93356',
    description: 'Echocardiography, transesophageal (TEE) for monitoring purposes, including probe placement, real-time image acquisition, interpretation and report',
    category: 'echo',
    bundlingRules: [
      'Cannot bill with 93312 (diagnostic TEE) same session',
      'Monitoring TEE vs diagnostic TEE distinction critical',
      'Includes probe placement and interpretation',
    ],
    commonDenialReasons: ['Monitoring vs diagnostic TEE confusion', 'Billed with 93312 same session', 'Missing documentation of monitoring purpose'],
    requiredDocumentation: ['Indication for monitoring (structural heart, PCI guidance)', 'Findings during procedure', 'Physician interpretation'],
  },

  // ─── Echocardiography ───────────────────────────────────────────────────
  '93306': {
    code: '93306',
    description: 'Echocardiography, transthoracic, real-time with image documentation (2D), includes M-mode recording, when performed, during rest and cardiovascular stress test using treadmill, bicycle exercise and/or pharmacologically induced stress, with interpretation and report',
    category: 'echo',
    bundlingRules: [
      'Combines resting echo + stress echo + interpretation',
      'Do NOT bill 93307 + 93350 + 93351 separately',
      'Includes 2D, M-mode, and Doppler',
    ],
    commonDenialReasons: ['Unbundled into components', 'Frequency limits exceeded', 'Missing stress portion documentation', 'No clinical indication for stress testing'],
    requiredDocumentation: ['Clinical indication for stress echo', 'Resting echo findings', 'Stress protocol used', 'Stress echo findings', 'Comparison with prior echo if available'],
  },
  '93307': {
    code: '93307',
    description: 'Echocardiography, transthoracic, real-time with image documentation (2D), includes M-mode recording, when performed, with interpretation and report',
    category: 'echo',
    bundlingRules: [
      'Resting echo only',
      'Includes M-mode and 2D',
      'Doppler billed separately as 93320/93325 if performed',
      'Cannot bill with 93306 (which includes rest + stress)',
    ],
    commonDenialReasons: ['Billed with 93306', 'Frequency limits (more than 2 per year without clinical change)', 'Missing clinical indication'],
    requiredDocumentation: ['Clinical indication', 'LVEF', 'Valvular assessment', 'Chamber sizes', 'Comparison with prior study'],
  },

  // ─── Electrophysiology ──────────────────────────────────────────────────
  '93600': {
    code: '93600',
    description: 'Electrophysiological evaluation and treatment of supraventricular tachycardia',
    category: 'ep',
    bundlingRules: [
      'Includes diagnostic EP study and ablation',
      'Cannot bill EP study (93620) separately with ablation',
      'Includes mapping and stimulation',
    ],
    commonDenialReasons: ['EP study billed separately (included)', 'Missing documentation of SVT type', 'No symptom correlation documented'],
    requiredDocumentation: ['SVT mechanism identified', 'Ablation site(s)', 'Pre/post ablation pacing intervals', 'Complications if any'],
  },

  // ─── Nuclear Cardiology ─────────────────────────────────────────────────
  '78452': {
    code: '78452',
    description: 'Myocardial perfusion imaging, tomographic (SPECT) (including attenuation correction, qualitative or quantitative wall motion, ejection fraction by first pass or gated technique, additional quantification, when performed); multiple studies, at rest and/or stress (exercise or pharmacologic) and/or rest and stress redistribution',
    category: 'nuclear',
    bundlingRules: [
      'Includes rest + stress imaging',
      'Cannot bill 78451 + 78452 together',
      'Includes gating and attenuation correction',
    ],
    commonDenialReasons: ['Unbundled into rest + stress components', 'Missing stress protocol documentation', 'No clinical indication documented', 'Frequency limits exceeded'],
    requiredDocumentation: ['Clinical indication', 'Stress protocol (exercise vs pharmacologic)', 'Rest/stress images', 'LVEF', 'Perfusion defect description', 'Comparison with prior study'],
  },
};

// ─── CARDIOLOGY NCCI EDIT PAIRS ──────────────────────────────────────────────

export const CARDIOLOGY_NCCI_PAIRS: Array<[string, string, boolean, string]> = [
  ['93458', '93460', false, 'Right and left heart cath - use 93461 for combined procedure'],
  ['93459', '93460', false, 'Combined catheterization should use single code'],
  ['93306', '93307', false, 'Stress echo includes resting echo'],
  ['93306', '93350', false, 'Stress echo (93306) includes stress imaging component'],
  ['78452', '78451', false, 'Multiple study MPI includes single study MPI'],
  ['93600', '93620', false, 'EP study with ablation includes diagnostic EP study'],
  ['93000', '93010', false, 'ECG with interpretation includes interpretation-only code'],
  ['93040', '93041', false, 'Rhythm strip with interpretation includes tech-only'],
];

// ─── CARDIOLOGY COVERAGE RULES ───────────────────────────────────────────────

export interface CardiologyCoverageRule {
  cptCode: string;
  procedure: string;
  coveredDiagnoses: string[];
  uncoveredDiagnoses: string[];
  lcdReference?: string;
  documentation: string[];
  specialRules: string[];
}

export const CARDIOLOGY_COVERAGE_RULES: CardiologyCoverageRule[] = [
  {
    cptCode: '93306',
    procedure: 'Stress echocardiography',
    coveredDiagnoses: [
      'I20.0-I20.9',  // Angina
      'I25.10-I25.9', // Chronic ischemic heart disease
      'I42.0-I42.9',  // Cardiomyopathy
      'I50.0-I50.9',  // Heart failure
      'R07.9',        // Chest pain
      'Z95.0-Z95.5',  // Cardiac device status
      'I48.0-I48.92', // Atrial fibrillation (pre-cardioversion)',
    ],
    uncoveredDiagnoses: [
      'Z00.00',       // Routine exam
      'R93.1',        // Abnormal echocardiogram without clinical indication
      'Z13.6',        // Screening (without risk factors)',
    ],
    lcdReference: 'L35006',
    documentation: [
      'Clinical indication for stress testing',
      'Risk factors documented',
      'Prior cardiac workup results',
      'Functional capacity assessment',
      'Reason stress echo chosen over other modalities',
    ],
    specialRules: [
      'Frequency limited to 1 per year for stable patients',
      'Stress echo preferred over nuclear MPI for initial evaluation in many cases',
      'Pharmacologic stress requires documented contraindication to exercise',
    ],
  },
  {
    cptCode: '93458',
    procedure: 'Coronary angiography (left heart cath)',
    coveredDiagnoses: [
      'I20.0', 'I20.1', 'I20.8', 'I20.9',  // Angina
      'I21.0-I21.4',  // Acute MI
      'I22.x',         // Subsequent MI
      'I25.110-I25.9', // Chronic ischemic heart disease
      'R07.9',         // Chest pain with abnormal stress test
    ],
    uncoveredDiagnoses: [
      'Z00.00',   // Routine exam
      'R07.4',    // Chest pain unspecified without other workup
    ],
    lcdReference: 'L34841',
    documentation: [
      'Clinical indication (acute coronary syndrome, abnormal stress test, etc.)',
      'Prior non-invasive test results',
      'Risk stratification',
      'Planned intervention if lesion found',
    ],
    specialRules: [
      'Diagnostic cath + PCI same session: diagnostic cath is included in PCI code',
      'Emergency/urgent cath for ACS has fewer pre-authorization requirements',
      'Radial vs femoral approach does not affect coding',
    ],
  },
];

// ─── CARDIOLOGY CPT RANGE MAPPING ───────────────────────────────────────────

export const CARDIOLOGY_CPT_RANGES: Array<[number, number, string, string]> = [
  [93000, 93050, 'ecg', 'Electrocardiography'],
  [93220, 93299, 'ecg', 'ECG monitoring/Holter'],
  [93300, 93359, 'echo', 'Echocardiography'],
  [93401, 93599, 'cath', 'Cardiac catheterization'],
  [93600, 93662, 'ep', 'Electrophysiology'],
  [93700, 93799, 'cath', 'Cardiovascular diagnostic'],
  [75552, 75574, 'echo', 'Cardiac MRI'],
  [75580, 75580, 'nuclear', 'Cardiac CT'],
  [78451, 78499, 'nuclear', 'Nuclear cardiology'],
];

export function isCardiologyCPT(cptCode: string): boolean {
  const codeNum = parseInt(cptCode);
  return CARDIOLOGY_CPT_RANGES.some(([start, end]) => codeNum >= start && codeNum <= end);
}

export function isCardiologyICD10(code: string): boolean {
  return /^(I[0-9]{2}|Z95\.|I48|I50|I25|I42|I10|I11|I35|I34|I33|Z95)/.test(code);
}
