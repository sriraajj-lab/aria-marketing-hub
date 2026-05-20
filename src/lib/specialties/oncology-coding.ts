/**
 * Oncology/Hematology Coding Intelligence Module
 *
 * Covers: Medical Oncology, Radiation Oncology, Hematology, Surgical Oncology
 * Code Ranges:
 *   - CPT: 96413-96549 (Chemotherapy Administration), 77385-77387 (Radiation), 38900-38970 (Surgical Oncology)
 *   - HCPCS/J-Codes: J0000-J9999 (Drugs administered), Q-codes, G-codes
 *   - ICD-10: C00-C96 (Malignant neoplasms), D00-D09 (In situ), Z51.x (Aftercare)
 *
 * Key Denial Triggers:
 *   - J-code wastage billing errors
 *   - Chemotherapy administration bundling (96413 + 96360/96361)
 *   - Infusion time coding errors
 *   - Missing NCD 110.x coverage criteria
 *   - Clinical trial billing non-compliance
 *   - Sequential vs concurrent infusion rules
 */

// ─── ONCOLOGY CPT CODE DEFINITIONS ──────────────────────────────────────────

export interface OncologyCPTCode {
  code: string;
  description: string;
  category: 'chemo_admin' | 'infusion' | 'radiation' | 'surgical' | 'consult' | 'imaging' | 'lab';
  timeBased?: { minutes: number; addOnCode?: string };
  bundlingRules: string[];
  commonDenialReasons: string[];
  requiredDocumentation: string[];
}

export const ONCOLOGY_CPT_CODES: Record<string, OncologyCPTCode> = {
  // ─── Chemotherapy Administration ────────────────────────────────────────
  '96413': {
    code: '96413',
    description: 'Chemotherapy IV infusion technique; up to 1 hour, single or initial substance/drug',
    category: 'chemo_admin',
    timeBased: { minutes: 60, addOnCode: '96415' },
    bundlingRules: ['Cannot bill with 96360 (hydration) without modifier 59/XU', 'Cannot bill with 96374 (IV push) same substance', 'Initial code - must have only one 96413 per date'],
    commonDenialReasons: ['Bundled with hydration', 'Multiple initial infusion codes same date', 'Missing start/stop times', 'Concurrent infusion not documented'],
    requiredDocumentation: ['Drug name and dosage', 'Start and stop times', 'Route of administration', 'Clinical indication'],
  },
  '96415': {
    code: '96415',
    description: 'Chemotherapy IV infusion technique; each additional hour (List separately in addition to code for primary procedure)',
    category: 'chemo_admin',
    timeBased: { minutes: 60 },
    bundlingRules: ['Must be billed with 96413', 'Cannot bill without primary 96413', 'Each additional hour = one unit of 96415', 'Time > 60 min but < 120 min = 1 unit of 96415'],
    commonDenialReasons: ['Billed without 96413', 'Incorrect time calculation', 'Rounded up incorrectly (>30 min past hour = additional unit)'],
    requiredDocumentation: ['Start and stop times', 'Total infusion time', 'Drug name and dosage'],
  },
  '96417': {
    code: '96417',
    description: 'Chemotherapy IV infusion technique; each additional sequential infusion (different substance/drug), up to 1 hour',
    category: 'chemo_admin',
    timeBased: { minutes: 60 },
    bundlingRules: ['Requires different substance/drug than 96413', 'Must be sequential, not concurrent', 'Cannot bill with 96413 for same drug'],
    commonDenialReasons: ['Same drug as 96413', 'Concurrent (not sequential) infusion', 'Missing documentation of sequential nature'],
    requiredDocumentation: ['Different drug name', 'Sequential start/stop times', 'Medical necessity for additional drug'],
  },
  '96416': {
    code: '96416',
    description: 'Chemotherapy IV infusion technique; each additional sequential infusion (different substance/drug), up to 1 hour',
    category: 'chemo_admin',
    bundlingRules: ['Infusion lasting > 90 minutes but < 4 hours', 'Cannot bill with 96413 for same session'],
    commonDenialReasons: ['Duration < 90 minutes', 'Same drug as initial infusion'],
    requiredDocumentation: ['Start/stop times showing > 90 min infusion', 'Drug name and dosage'],
  },
  '96411': {
    code: '96411',
    description: 'Chemotherapy administration, subcutaneous or intramuscular; hormonal agent',
    category: 'chemo_admin',
    bundlingRules: ['Cannot bill with 96372 for same injection', 'Hormonal agents only (e.g., Lupron, Firmagon)'],
    commonDenialReasons: ['Non-hormonal drug billed with this code', 'Billed with 96372 same injection'],
    requiredDocumentation: ['Drug name confirming hormonal agent', 'Route of administration (subQ or IM)', 'Injection site'],
  },
  '96521': {
    code: '96521',
    description: 'Chemotherapy administration, subcutaneous or intramuscular; non-hormonal anti-neoplastic',
    category: 'chemo_admin',
    bundlingRules: ['Cannot bill with 96411 for same injection', 'Non-hormonal anti-neoplastic drugs only'],
    commonDenialReasons: ['Hormonal drug billed with this code (use 96411)', 'Billed with 96372 same injection'],
    requiredDocumentation: ['Drug name confirming non-hormonal anti-neoplastic', 'Route of administration'],
  },
  '96523': {
    code: '96523',
    description: 'Chemotherapy administration, intra-arterial; non-radioactive agent',
    category: 'chemo_admin',
    bundlingRules: ['Cannot bill with 96413 for same session', 'Requires intra-arterial access documentation'],
    commonDenialReasons: ['Route not documented as intra-arterial', 'Billed with IV chemo same session'],
    requiredDocumentation: ['Intra-arterial access documentation', 'Drug name and dosage', 'Start/stop times'],
  },

  // ─── Hydration Administration (Oncology Context) ────────────────────────
  '96360': {
    code: '96360',
    description: 'IV hydration infusion; initial, up to 1 hour',
    category: 'infusion',
    timeBased: { minutes: 60, addOnCode: '96361' },
    bundlingRules: ['Bundled with 96413 unless modifier 59/XU', 'Cannot be initial service when chemo administered', 'Must be medically necessary (not just routine pre-hydration)'],
    commonDenialReasons: ['Bundled with chemotherapy', 'No medical necessity documented', 'Pre-medication hydration considered inclusive'],
    requiredDocumentation: ['Medical necessity for separate hydration', 'Separate start/stop times from chemo', 'Clinical indication (e.g., renal protection, dehydration)'],
  },
  '96361': {
    code: '96361',
    description: 'IV hydration infusion; each additional hour',
    category: 'infusion',
    timeBased: { minutes: 60 },
    bundlingRules: ['Must be billed with 96360', 'Cannot bill without primary 96360'],
    commonDenialReasons: ['Billed without 96360', 'Incorrect time calculation'],
    requiredDocumentation: ['Total hydration time', 'Start/stop times'],
  },

  // ─── IV Push (Oncology Context) ─────────────────────────────────────────
  '96374': {
    code: '96374',
    description: 'Therapeutic, prophylactic, or diagnostic injection (specify substance or drug); IV push, single or initial substance/drug',
    category: 'infusion',
    bundlingRules: ['Cannot be initial service when chemo (96413) is given', 'Push = 15 minutes or less', 'Cannot bill with 96360 for same substance'],
    commonDenialReasons: ['Push duration > 15 min (should be infusion)', 'Bundled with chemo administration', 'Same substance as chemo'],
    requiredDocumentation: ['Drug name', 'Push duration (must be <= 15 min)', 'Medical necessity'],
  },

  // ─── Radiation Oncology ─────────────────────────────────────────────────
  '77385': {
    code: '77385',
    description: 'Radiation treatment delivery, IMRT (intensity modulated), simple',
    category: 'radiation',
    bundlingRules: ['Cannot bill with 77401, 77402 (conventional) same session', 'Must have treatment planning (77301) documented', 'One unit per treatment session'],
    commonDenialReasons: ['Missing treatment planning documentation', 'Billed with conventional RT same session', 'Frequency exceeds treatment plan'],
    requiredDocumentation: ['Treatment plan reference', 'Number of fractions prescribed', 'Physician order for each session'],
  },
  '77386': {
    code: '77386',
    description: 'Radiation treatment delivery, IMRT, complex',
    category: 'radiation',
    bundlingRules: ['Cannot bill with 77385 same session', 'Complex = 2 or more treatment areas'],
    commonDenialReasons: ['Simple vs complex misclassification', 'Missing documentation of complexity'],
    requiredDocumentation: ['Treatment plan showing multiple areas', 'Complexity justification'],
  },
  '77387': {
    code: '77387',
    description: 'Radiation treatment delivery, stereotactic body radiation therapy (SBRT)',
    category: 'radiation',
    bundlingRules: ['Cannot bill with 77385/77386 same session', 'Requires stereotactic planning'],
    commonDenialReasons: ['Missing stereotactic planning documentation', 'Billed with IMRT same session'],
    requiredDocumentation: ['Stereotactic treatment plan', 'Number of fractions', 'Target volume documentation'],
  },
  '77427': {
    code: '77427',
    description: 'Radiation treatment management, 5 treatments',
    category: 'radiation',
    bundlingRules: ['One unit per 5 treatment fractions', 'Cannot bill more frequently than every 5 fractions', 'Requires physician management documentation'],
    commonDenialReasons: ['Billed for fewer than 5 fractions', 'No physician management documentation', 'Billed too frequently'],
    requiredDocumentation: ['Treatment dates covered', 'Physician management notes', 'Fraction count'],
  },
  '77470': {
    code: '77470',
    description: 'Special treatment procedure (e.g., total body irradiation, hyperthermia)',
    category: 'radiation',
    bundlingRules: ['Cannot bill routinely with standard RT', 'Requires special circumstances documentation'],
    commonDenialReasons: ['No special circumstances documented', 'Billed with every treatment session'],
    requiredDocumentation: ['Special treatment justification', 'Clinical indication for TBI/hyperthermia', 'Treatment parameters'],
  },

  // ─── Surgical Oncology ──────────────────────────────────────────────────
  '38900': {
    code: '38900',
    description: 'Intraoperative identification of sentinel lymph node(s) (List separately in addition to code for primary procedure)',
    category: 'surgical',
    bundlingRules: ['Add-on code - must be billed with primary surgical procedure', 'Cannot bill with 38792 (injection) same side same session'],
    commonDenialReasons: ['Billed without primary procedure', 'Both injection and identification billed', 'Missing pathology report for SLN'],
    requiredDocumentation: ['Primary procedure code', 'Injection technique used', 'Pathology results for sentinel node'],
  },
  '19301': {
    code: '19301',
    description: 'Mastectomy, partial (e.g., lumpectomy, tylectomy, quadrantectomy, segmentectomy)',
    category: 'surgical',
    bundlingRules: ['Cannot bill with 19303 (simple mastectomy) same breast', 'Includes localization if performed', 'SLN biopsy (38900) billable separately'],
    commonDenialReasons: ['Billed with 19303 same breast', 'Localization billed separately (included)', 'Missing pathology documentation'],
    requiredDocumentation: ['Tumor size and location', 'Specimen pathology', 'Margins status', 'SLN biopsy if performed'],
  },
  '19303': {
    code: '19303',
    description: 'Mastectomy, simple, complete',
    category: 'surgical',
    bundlingRules: ['Cannot bill with 19301 same breast', 'Includes axillary tail if removed', 'SLN biopsy (38900) billable separately'],
    commonDenialReasons: ['Billed with lumpectomy same breast', 'Axillary dissection included if simple mastectomy only'],
    requiredDocumentation: ['Extent of surgery', 'Specimen pathology', 'Lymph node status'],
  },
  '19307': {
    code: '19307',
    description: 'Mastectomy, modified radical, including axillary lymph nodes',
    category: 'surgical',
    bundlingRules: ['Includes axillary dissection - do not bill 38746 separately', 'Cannot bill with 19303 same breast'],
    commonDenialReasons: ['Axillary dissection billed separately (included)', 'Inadequate documentation of lymph node dissection'],
    requiredDocumentation: ['Number of lymph nodes removed', 'Surgical technique', 'Specimen pathology'],
  },

  // ─── Oncology Consultation ──────────────────────────────────────────────
  '99255': {
    code: '99255',
    description: 'Office or other outpatient consultation for a new or established patient, high complexity',
    category: 'consult',
    bundlingRules: ['Cannot bill if transfer of care (not true consultation)', 'Requires requesting physician documentation', 'Some payers have retired consultation codes'],
    commonDenialReasons: ['No consultation request documented', 'Transfer of care, not consultation', 'Payer does not accept consultation codes', 'Missing written request from referring physician'],
    requiredDocumentation: ['Written request from referring physician', 'Consultation findings communicated back', 'Independent medical decision making', '3 of 3 key components (history, exam, MDM)'],
  },

  // ─── CAR-T Cell Therapy CPT Codes ──────────────────────────────────────
  '0585T': {
    code: '0585T',
    description: 'CAR-T cell therapy; harvesting of blood-derived cells for manufacturing, including cell processing and cryopreservation',
    category: 'lab',
    bundlingRules: ['Includes leukapheresis collection, processing, and cryopreservation', 'Cannot bill 36514 (apheresis) separately when using 0585T', 'Cannot bill with 88387 (pathology consultation) for release testing - included'],
    commonDenialReasons: ['Billed with 36514 separately (included in 0585T)', 'Missing documentation of cell processing and cryopreservation', 'Manufacturing facility not documented', 'Release testing criteria not met per REMS'],
    requiredDocumentation: ['Leukapheresis collection date and volume', 'Cell processing methodology', 'Cryopreservation documentation', 'Manufacturing facility identification', 'Chain of custody documentation', 'Release testing results'],
  },
  '0586T': {
    code: '0586T',
    description: 'CAR-T cell therapy; preparation of blood-derived cells for therapeutic use, including thawing, washing, and/or count adjustment',
    category: 'lab',
    bundlingRules: ['Cannot bill with 0585T for same treatment episode', 'Includes thawing, washing, and cell count adjustment', 'Must be billed in conjunction with CAR-T administration'],
    commonDenialReasons: ['Missing documentation of cell preparation steps', 'Billed without corresponding CAR-T drug code (Q2042-Q2044)', 'Cell viability documentation not provided'],
    requiredDocumentation: ['Thawing procedure documentation', 'Cell washing steps', 'Cell count adjustment documentation', 'Viability testing results', 'Pre-infusion quality checks'],
  },
  '0587T': {
    code: '0587T',
    description: 'CAR-T cell therapy; autologous CAR-T cell administration, including pre-infusion conditioning and post-infusion monitoring',
    category: 'chemo_admin',
    bundlingRules: ['Includes pre-infusion conditioning (lymphodepleting chemo)', 'Includes post-infusion monitoring for CRS and neurotoxicity', 'Cannot bill conditioning chemo (J9055 + J9060 for Cy/Flu) separately with 0587T if inclusive', 'Must be billed with corresponding CAR-T drug code'],
    commonDenialReasons: ['Missing CRS monitoring documentation', 'Neurotoxicity monitoring not documented', 'Pre-infusion conditioning drugs billed separately when included', 'Missing REMS certification'],
    requiredDocumentation: ['Pre-infusion conditioning regimen (F/Cy)', 'Date and time of CAR-T infusion', 'CRS monitoring: vitals, cytokine levels, tocilizumab if given', 'Neurologic monitoring: ICE scoring, neurology consult if indicated', 'Post-infusion observation period documentation (minimum 7 days for inpatient)'],
  },

  // ─── Oncology Imaging ──────────────────────────────────────────────────
  '78815': {
    code: '78815',
    description: 'PET/CT, limited (single anatomical area)',
    category: 'imaging',
    bundlingRules: ['Cannot bill with 78816 (whole body) same session', 'Includes both PET and CT components - do not unbundle', 'Professional component (26) or TC modifier applies'],
    commonDenialReasons: ['Bundled with CT performed same session', 'Missing clinical indication for PET/CT', 'Frequency limits exceeded', 'Prior authorization not obtained'],
    requiredDocumentation: ['Clinical indication for PET/CT', 'Prior imaging results', 'Oncologist order specifying reason (staging, restaging, response assessment)', 'Comparison with prior PET if available'],
  },
  '78816': {
    code: '78816',
    description: 'PET/CT, whole body',
    category: 'imaging',
    bundlingRules: ['Cannot bill with 78815 (limited) same session', 'Includes both PET and CT components', 'Professional component (26) or TC modifier applies'],
    commonDenialReasons: ['Missing clinical indication', 'Billed with 78815 same date', 'Frequency limits exceeded', 'Restaging without interval from prior treatment'],
    requiredDocumentation: ['Clinical indication for whole-body PET/CT', 'Staging or restaging rationale', 'Oncologist order', 'Comparison with prior PET if available'],
  },

  // ─── Oncology Biopsy/Procedures ─────────────────────────────────────────
  '11102': {
    code: '11102',
    description: 'Tangential biopsy of skin (shave, punch, saucerize, curettage), single lesion',
    category: 'surgical',
    bundlingRules: ['Cannot bill with pathology exam separately for same lesion', 'Add-on code 11103 for each additional lesion', 'Pathology examination billed separately'],
    commonDenialReasons: ['Lesion not documented as suspicious for malignancy', 'Missing pathology report', 'Separate lesion biopsy billed without laterality', 'Cosmetic vs medical distinction not documented'],
    requiredDocumentation: ['Lesion description and location', 'Clinical suspicion for malignancy', 'Biopsy method used', 'Specimen sent to pathology', 'Pathology results'],
  },
};

// ─── ONCOLOGY J-CODES (HCPCS Level II - Drug Administration) ─────────────────

export interface OncologyJCode {
  code: string;
  drugName: string;
  genericName: string;
  unitSize: string;
  billingUnit: string;
  wastageBillable: boolean;
  jwModifierRequired: boolean;
  commonDenialReasons: string[];
  ndcCrosswalk?: string[];
}

export const ONCOLOGY_J_CODES: Record<string, OncologyJCode> = {
  // ─── Chemotherapy Agents ────────────────────────────────────────────────
  'J9000': {
    code: 'J9000',
    drugName: 'Doxorubicin HCl',
    genericName: 'Adriamycin',
    unitSize: '10 mg',
    billingUnit: '1 unit = 10 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Dosage calculation error', 'Missing wastage documentation', 'NDC/J-code mismatch', 'Billed amount exceeds expected for weight-based dosing'],
    ndcCrosswalk: ['0069-3070-', '68001-270-'],
  },
  'J9035': {
    code: 'J9035',
    drugName: 'Bevacizumab',
    genericName: 'Avastin',
    unitSize: '10 mg',
    billingUnit: '1 unit = 10 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Off-label use without supporting literature', 'Compounding from multi-dose vial', 'NDC mismatch', 'Wastage not documented with JW modifier'],
    ndcCrosswalk: ['50242-062-', '50242-086-'],
  },
  'J9045': {
    code: 'J9045',
    drugName: 'Cisplatin',
    genericName: 'Cisplatin',
    unitSize: '10 mg',
    billingUnit: '1 unit = 10 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Dose calculation based on BSA error', 'Missing hydration documentation', 'Wastage documentation missing'],
  },
  'J9055': {
    code: 'J9055',
    drugName: 'Cyclophosphamide',
    genericName: 'Cytoxan',
    unitSize: '100 mg',
    billingUnit: '1 unit = 100 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Incorrect unit calculation', 'Oral vs IV route not documented'],
  },
  'J9060': {
    code: 'J9060',
    drugName: 'Cytarabine',
    genericName: 'Cytarabine/Ara-C',
    unitSize: '100 mg',
    billingUnit: '1 unit = 100 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['High-dose vs standard dosing confusion', 'Intrathecal route not separately coded'],
  },
  'J9070': {
    code: 'J9070',
    drugName: 'Cyclophosphamide oral',
    genericName: 'Cytoxan (oral)',
    unitSize: '25 mg',
    billingUnit: '1 unit = 25 mg',
    wastageBillable: false,
    jwModifierRequired: false,
    commonDenialReasons: ['Oral chemotherapy not covered under medical benefit', 'Should be pharmacy benefit', 'Missing tablet count'],
  },
  'J9185': {
    code: 'J9185',
    drugName: 'Fluorouracil (5-FU)',
    genericName: 'Adrucil/5-FU',
    unitSize: '500 mg',
    billingUnit: '1 unit = 500 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Infusion pump billing separate from drug', 'Incorrect dosing units', 'Pump not documented for continuous infusion'],
  },
  'J9260': {
    code: 'J9260',
    drugName: 'Oxaliplatin',
    genericName: 'Eloxatin',
    unitSize: '0.5 mg',
    billingUnit: '1 unit = 0.5 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Unit size confusion (0.5 mg not 5 mg)', 'BSA dosing calculation error', 'Missing pre-medication documentation'],
  },
  'J9263': {
    code: 'J9263',
    drugName: 'Paclitaxel',
    genericName: 'Taxol',
    unitSize: '30 mg',
    billingUnit: '1 unit = 30 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Albumin-bound vs standard paclitaxel code confusion', 'Infusion time documentation missing', 'Pre-medication required not documented'],
  },
  'J9264': {
    code: 'J9264',
    drugName: 'Paclitaxel, albumin bound',
    genericName: 'Abraxane',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Confused with J9263 (standard paclitaxel)', 'Incorrect unit calculation', 'Off-label use not supported'],
  },
  'J9290': {
    code: 'J9290',
    drugName: 'Rituximab',
    genericName: 'Rituxan',
    unitSize: '100 mg',
    billingUnit: '1 unit = 100 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Biosimilar vs reference drug code mismatch', 'Flat-dose vs weight-based dosing confusion', 'Missing infusion reaction documentation'],
  },
  'J9306': {
    code: 'J9306',
    drugName: 'Trastuzumab',
    genericName: 'Herceptin',
    unitSize: '10 mg',
    billingUnit: '1 unit = 10 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['HER2 testing not documented', 'Biosimilar substitution not coded correctly', 'Subcutaneous vs IV formulation code confusion'],
  },
  'J9312': {
    code: 'J9312',
    drugName: 'Pembrolizumab',
    genericName: 'Keytruda',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Off-label indication not supported by NCCN', 'Weight-based vs fixed dosing confusion', 'Missing biomarker testing documentation'],
  },
  'J9315': {
    code: 'J9315',
    drugName: 'Nivolumab',
    genericName: 'Opdivo',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Off-label use without NCCN compendium support', 'Weight-based dosing calculation error', 'Missing PD-L1 testing documentation'],
  },
  'J9340': {
    code: 'J9340',
    drugName: 'Carboplatin',
    genericName: 'Paraplatin',
    unitSize: '50 mg',
    billingUnit: '1 unit = 50 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Calvert formula dosing calculation error', 'AUC dosing not documented', 'GFR estimation not documented'],
  },

  // ─── Supportive Care Drugs ──────────────────────────────────────────────
  'J2405': {
    code: 'J2405',
    drugName: 'Ondansetron HCl',
    genericName: 'Zofran',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Oral anti-emetic available (step therapy required)', 'Prophylactic use not documented', 'Quantity exceeds protocol guidelines'],
  },
  'J0636': {
    code: 'J0636',
    drugName: 'Epoetin alfa',
    genericName: 'Epogen/Procrit',
    unitSize: '1,000 units',
    billingUnit: '1 unit = 1,000 units',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Hemoglobin > 10 g/dL (ESA policy)', 'Missing Hgb level documentation', '4-hour dosing not documented', 'ESRD vs chemotherapy-induced anemia code confusion'],
  },
  'J2355': {
    code: 'J2355',
    drugName: 'Leuprolide acetate',
    genericName: 'Lupron Depot',
    unitSize: '3.75 mg',
    billingUnit: '1 unit = 3.75 mg (varies by formulation)',
    wastageBillable: false,
    jwModifierRequired: false,
    commonDenialReasons: ['Incorrect formulation code (1-month vs 3-month vs 6-month depot)', 'Missing diagnosis supporting hormonal therapy', 'Frequency exceeds dosing interval'],
  },
  'J1950': {
    code: 'J1950',
    drugName: 'Filgrastim',
    genericName: 'Neupogen',
    unitSize: '1 mcg',
    billingUnit: '1 unit = 1 mcg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Biosimilar substitution not coded correctly', 'ANC level not documented', 'Prophylactic vs therapeutic use not specified'],
  },
  'J2505': {
    code: 'J2505',
    drugName: 'Pegfilgrastim',
    genericName: 'Neulasta',
    unitSize: '6 mg',
    billingUnit: '1 unit = 6 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Billed more than once per chemotherapy cycle', 'On-body injector code confusion', 'ANC not documented', 'Biosimilar (Fulphila/Udenyca) code not used'],
  },

  // ─── Immunotherapy Agents ───────────────────────────────────────────────
  'J9022': {
    code: 'J9022',
    drugName: 'Denileukin diftitox',
    genericName: 'Ontak',
    unitSize: '1 mcg',
    billingUnit: '1 unit = 1 mcg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['CD25 expression not documented', 'Limited FDA-approved indications'],
  },

  // ─── Immune Checkpoint Inhibitors (Additional) ─────────────────────────
  'J9310': {
    code: 'J9310',
    drugName: 'Atezolizumab',
    genericName: 'Tecentriq',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Off-label use without NCCN support', 'Missing PD-L1 testing', 'Fixed-dose vs weight-based confusion (840mg Q2W or 1200mg Q3W or 1680mg Q4W)', 'Combination regimen documentation incomplete'],
  },
  'J9299': {
    code: 'J9299',
    drugName: 'Durvalumab',
    genericName: 'Imfinzi',
    unitSize: '10 mg',
    billingUnit: '1 unit = 10 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Stage III NSCLC consolidation after chemoradiation - must document prior CRT', 'Missing PD-L1 testing for some indications', 'Weight-based dosing calculation error (10mg/kg)'],
  },
  'J9295': {
    code: 'J9295',
    drugName: 'Ipilimumab',
    genericName: 'Yervoy',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Combination therapy dosing confusion (1mg/kg vs 3mg/kg with nivolumab)', 'Missing CTLA-4 pathway documentation', 'Weight-based dosing calculation error', 'Hepatic toxicity monitoring not documented'],
  },
  'J9328': {
    code: 'J9328',
    drugName: 'Cemiplimab',
    genericName: 'Libtayo',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Cutaneous SCC vs other skin cancers coding', 'Missing PD-L1 testing for NSCLC indication', 'Fixed-dose (350mg Q3W) vs weight-based dosing'],
  },

  // ─── Antibody-Drug Conjugates (ADCs) ───────────────────────────────────
  'J9317': {
    code: 'J9317',
    drugName: 'Trastuzumab deruxtecan',
    genericName: 'Enhertu',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['HER2 testing not documented (IHC 3+ or IHC 2+/FISH+)', 'Indication-specific coverage: breast vs gastric vs NSCLC', 'Missing FDA-approved indication documentation', 'ILD monitoring not documented', 'Dosing: 5.4mg/kg vs 6.4mg/kg depends on indication'],
  },
  'J9327': {
    code: 'J9327',
    drugName: 'Sacituzumab govitecan',
    genericName: 'Trodelvy',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Indication confusion: TNBC vs HR+/HER2- breast vs urothelial', 'Missing prior therapy documentation (required progression on standard treatment)', 'Weight-based dosing (10mg/kg) calculation error', 'Neutropenia risk not documented'],
  },
  'J9325': {
    code: 'J9325',
    drugName: 'Enfortumab vedotin',
    genericName: 'Padcev',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Urothelial cancer diagnosis not documented', 'Missing prior PD-1/PD-L1 inhibitor and platinum therapy documentation', 'Weight-based dosing (1.25mg/kg) calculation error', 'Skin reaction monitoring not documented'],
  },
  'J9329': {
    code: 'J9329',
    drugName: 'Tisotumab vedotin',
    genericName: 'Tivdak',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Cervical cancer diagnosis required', 'Missing prior therapy documentation (doublet chemo + bevacizumab + anti-PD-1)', 'Ocular toxicity monitoring not documented', 'Weight-based dosing (2mg/kg) calculation error'],
  },

  // ─── Biosimilar J-Codes ────────────────────────────────────────────────
  'J9326': {
    code: 'J9326',
    drugName: 'Rituximab-arrx (biosimilar)',
    genericName: 'Riabnose',
    unitSize: '100 mg',
    billingUnit: '1 unit = 100 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Biosimilar vs reference product (Rituxan) code confusion - must use J9326 not J9290', 'Step therapy: payer may require trial of reference product first', 'Missing documentation supporting biosimilar selection', 'Interchangeability designation not documented'],
  },
  'J9318': {
    code: 'J9318',
    drugName: 'Trastuzumab-dkst (biosimilar)',
    genericName: 'Ogivri',
    unitSize: '10 mg',
    billingUnit: '1 unit = 10 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Biosimilar vs reference product (Herceptin) code confusion - must use J9318 not J9306', 'Missing HER2 testing documentation', 'Subcutaneous formulation (Herceptin Hylecta) uses different J-code', 'Step therapy requirements not met'],
  },
  'J9314': {
    code: 'J9314',
    drugName: 'Pegfilgrastim-cbqv (biosimilar)',
    genericName: 'Udenyca',
    unitSize: '6 mg',
    billingUnit: '1 unit = 6 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Biosimilar vs reference (Neulasta) code confusion', 'Billed more than once per chemotherapy cycle', 'ANC not documented', 'On-body injector variant uses different code'],
  },
  'J9047': {
    code: 'J9047',
    drugName: 'Bevacizumab-awwb (biosimilar)',
    genericName: 'Mvasi',
    unitSize: '10 mg',
    billingUnit: '1 unit = 10 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Biosimilar vs reference (Avastin) code confusion - must use J9047 not J9035', 'Off-label use without NCCN support', 'Missing documentation supporting biosimilar selection', 'Weight-based dosing calculation error'],
  },
  'J9048': {
    code: 'J9048',
    drugName: 'Bevacizumab-bvzr (biosimilar)',
    genericName: 'Zirabev',
    unitSize: '10 mg',
    billingUnit: '1 unit = 10 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Wrong J-code used (reference vs biosimilar)', 'Off-label indication documentation incomplete', 'Wastage documentation with JW modifier missing'],
  },

  // ─── Targeted Therapy / Tyrosine Kinase Inhibitors (IV) ────────────────
  'J8999': {
    code: 'J8999',
    drugName: 'Unclassified drug (oncology - new agents pending J-code assignment)',
    genericName: 'Various',
    unitSize: 'Not applicable',
    billingUnit: 'Varies by drug - check specific manufacturer billing guide',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['J8999 requires additional documentation: drug name, NDC, dosage', 'Payer may require prior auth for unclassified drugs', 'Missing invoice or cost documentation', 'Should not be used when dedicated J-code exists'],
  },

  // ─── Additional Supportive Care ────────────────────────────────────────
  'J2545': {
    code: 'J2545',
    drugName: 'Palonosetron HCl',
    genericName: 'Aloxi',
    unitSize: '0.25 mg',
    billingUnit: '1 unit = 0.25 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Oral anti-emetic available (step therapy)', 'Quantity exceeds protocol (single dose per chemo cycle)', 'Not billed with chemotherapy on same date'],
  },
  'J1453': {
    code: 'J1453',
    drugName: 'Fosaprepitant',
    genericName: 'Emend (IV)',
    unitSize: '1 mg',
    billingUnit: '1 unit = 1 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Oral aprepitant available (step therapy)', 'Not billed with highly emetogenic chemotherapy', 'Duplicate billing with oral aprepitant (should not bill both)'],
  },
  'J1745': {
    code: 'J1745',
    drugName: 'Dexrazoxane',
    genericName: 'Zinecard/Totect',
    unitSize: '250 mg',
    billingUnit: '1 unit = 250 mg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Indication must be cardioprotection with doxorubicin (not routine use)', 'Dexrazoxane for anthracycline extravasation uses different dosing', 'Missing cumulative doxorubicin dose documentation (>300 mg/m2)'],
  },
  'Q5101': {
    code: 'Q5101',
    drugName: 'Filgrastim-sndz (biosimilar)',
    genericName: 'Zarxio',
    unitSize: '1 mcg',
    billingUnit: '1 unit = 1 mcg',
    wastageBillable: true,
    jwModifierRequired: true,
    commonDenialReasons: ['Biosimilar vs reference (Neupogen) code confusion - use Q5101 not J1950', 'ANC level not documented', 'Duration exceeds protocol guidelines (>14 days typically)', 'Prophylactic vs therapeutic use not specified'],
  },

  // ─── CAR-T Cell Therapy Related Codes ───────────────────────────────────
  // Note: CAR-T drugs are typically paid via DRG or separate ASP + add-on,
  // but WAC (Wholesale Acquisition Cost) billing applies. These are critical high-value.
  'Q2042': {
    code: 'Q2042',
    drugName: 'Tisagenlecleucel',
    genericName: 'Kymriah',
    unitSize: '1',
    billingUnit: '1 unit = 1 treatment (patient-specific CAR-T)',
    wastageBillable: false,
    jwModifierRequired: false,
    commonDenialReasons: ['Must be billed as single unit per treatment episode', 'Missing documentation of manufacturing and release testing', 'Indication not supported: B-cell ALL (up to age 25) or DLBCL (adults) or FL (adults)', 'Missing documentation of prior therapies (must have failed 2+ lines for DLBCL)', 'Facility must be REMS-certified', 'CPT 0585T may also be billable for cell collection/processing'],
  },
  'Q2043': {
    code: 'Q2043',
    drugName: 'Axicabtagene ciloleucel',
    genericName: 'Yescarta',
    unitSize: '1',
    billingUnit: '1 unit = 1 treatment (patient-specific CAR-T)',
    wastageBillable: false,
    jwModifierRequired: false,
    commonDenialReasons: ['Must be billed as single unit per treatment episode', 'Indication: large B-cell lymphoma, FL after 2+ prior lines', 'Missing REMS certification documentation', 'Cytokine release syndrome monitoring not documented', 'CPT 0585T for cell processing may be separately billable', '2019+ expansion to second-line LBCL requires specific documentation'],
  },
  'Q2044': {
    code: 'Q2044',
    drugName: 'Brexucabtagene autoleucel',
    genericName: 'Tecartus',
    unitSize: '1',
    billingUnit: '1 unit = 1 treatment (patient-specific CAR-T)',
    wastageBillable: false,
    jwModifierRequired: false,
    commonDenialReasons: ['Must be billed as single unit per treatment episode', 'Indication: MCL (mantle cell lymphoma) or B-cell ALL (adults)', 'Missing documentation of prior therapy failures', 'REMS certification required', 'Neurologic toxicity monitoring not documented'],
  },
};

// ─── ONCOLOGY NCCI EDIT PAIRS ──────────────────────────────────────────────

export const ONCOLOGY_NCCI_PAIRS: Array<[string, string, boolean, string]> = [
  // [column1 (comprehensive), column2 (component), modifier_allowed, rationale]
  // Chemo + Hydration bundling
  ['96413', '96360', true, 'Chemo infusion includes pre/post hydration unless separately identifiable and medically necessary'],
  ['96413', '96361', true, 'Additional hydration hours bundled with chemo unless distinct medical necessity'],
  ['96413', '96374', false, 'IV push of same substance as chemo infusion is bundled'],
  ['96415', '96361', true, 'Additional chemo hour includes hydration unless distinct reason documented'],

  // Sequential infusion rules
  ['96413', '96417', false, 'Sequential infusion of different drug - 96417 is an add-on code, not a component'],
  ['96413', '96416', false, 'Prolonged infusion is an add-on to 96413'],

  // Push vs Infusion
  ['96374', '96360', true, 'IV push and hydration same session - modifier allowed if distinct'],
  ['96375', '96360', true, 'Additional push with hydration - modifier allowed if distinct'],

  // Radiation therapy bundling
  ['77385', '77386', false, 'Cannot bill simple and complex IMRT same session'],
  ['77385', '77402', false, 'IMRT includes conventional RT delivery'],
  ['77387', '77385', false, 'SBRT and IMRT cannot be billed same session'],
  ['77427', '77427', false, 'One unit per 5 fractions - cannot double bill'],

  // Surgical oncology bundling
  ['19307', '38746', false, 'Modified radical mastectomy includes axillary dissection'],
  ['19307', '19303', false, 'Modified radical includes simple mastectomy'],
  ['19303', '19301', false, 'Cannot bill lumpectomy and mastectomy same breast'],
  ['38900', '38792', true, 'SLN identification and injection may be separate if different providers'],

  // Supportive care bundling
  ['96413', '96411', false, 'Hormonal injection and IV chemo same session - 96411 is separately reportable'],
  ['96413', '96523', false, 'Intra-arterial chemo separate from IV chemo'],

  // ADC and Immunotherapy bundling (2025 updates)
  ['96413', '96365', true, 'Therapeutic infusion bundled with chemo unless distinct substance and medical necessity'],
  ['96413', '96366', true, 'Additional therapeutic infusion hours bundled with chemo unless distinct'],
  ['96417', '96361', true, 'Sequential chemo + hydration: modifier allowed if separate clinical reason'],
  ['96523', '96360', true, 'Intra-arterial chemo with hydration - modifier allowed if distinct clinical need'],

  // CAR-T and cell therapy coding
  ['0585T', '36514', false, 'CAR-T cell collection and processing: 0585T includes apheresis collection'],
  ['0585T', '88387', false, 'CAR-T cell processing includes pathology services for release testing'],

  // Radiation therapy additional pairs
  ['77301', '77300', false, 'IMRT treatment plan includes basic radiation treatment plan'],
  ['77387', '77386', false, 'SBRT and complex IMRT cannot be billed same session'],
  ['77401', '77402', false, 'Cannot bill conventional and proton RT delivery same session'],

  // Oncology imaging bundling
  ['78816', '78815', false, 'PET/CT whole body includes PET/CT limited'],
  ['78815', '78814', false, 'PET/CT limited includes PET limited'],
];

// ─── ONCOLOGY-SPECIFIC COVERAGE RULES (NCD 110.x / LCD References) ──────────

export interface OncologyCoverageRule {
  cptCode: string;
  procedure: string;
  coveredDiagnoses: string[];
  uncoveredDiagnoses: string[];
  ncdReference?: string;
  lcdReference?: string;
  lcdId?: string;
  documentation: string[];
  specialRules: string[];
}

export const ONCOLOGY_COVERAGE_RULES: OncologyCoverageRule[] = [
  {
    cptCode: '96413',
    procedure: 'Chemotherapy IV infusion, initial',
    coveredDiagnoses: [
      'C00-C96', // Malignant neoplasms
      'Z51.11',  // Encounter for antineoplastic chemotherapy
      'Z51.12',  // Encounter for antineoplastic immunotherapy
      'D46.x',   // Myelodysplastic syndromes
      'C7A.x',   // Neuroendocrine tumors
    ],
    uncoveredDiagnoses: [
      'Z00.00',  // Routine exam
      'D50-D89', // Non-neoplastic blood disorders (without malignancy)
      'N18.x',   // Chronic kidney disease (unless for renal cell carcinoma)
    ],
    ncdReference: 'NCD 110.1',
    lcdReference: 'Chemotherapy Administration',
    documentation: [
      'Oncologist order specifying drug, dose, route',
      'Diagnosis confirming malignancy',
      'Treatment plan (curative, adjuvant, neoadjuvant, palliative)',
      'Informed consent for chemotherapy',
      'BSA/weight documentation for weight-based dosing',
      'Pre-treatment labs within protocol window',
    ],
    specialRules: [
      'Weight-based dosing must match BSA calculation',
      'Off-label use requires NCCN compendium support or peer-reviewed literature',
      'Clinical trial treatments may have separate billing rules',
    ],
  },
  {
    cptCode: '19301',
    procedure: 'Partial mastectomy (lumpectomy)',
    coveredDiagnoses: [
      'C50.0-C50.9',  // Malignant neoplasm of breast
      'D05.0', 'D05.1', 'D05.10', 'D05.11', // DCIS, LCIS
    ],
    uncoveredDiagnoses: [
      'N60-N64',  // Benign breast conditions
      'Z12.31',   // Screening (without confirmed diagnosis)
    ],
    ncdReference: 'NCD 110.4',
    lcdReference: 'Breast Cancer Surgical Management',
    lcdId: 'L35250',
    documentation: [
      'Biopsy-confirmed diagnosis before surgery',
      'Imaging (mammogram, MRI, ultrasound) correlating with surgical target',
      'Surgical pathology report',
      'Margin status documentation',
      'Multi-disciplinary treatment plan (breast conservation therapy)',
    ],
    specialRules: [
      'Breast conservation must include radiation therapy plan',
      'SLN biopsy standard of care for invasive carcinoma',
      'Oncoplastic techniques may require separate documentation',
    ],
  },
  {
    cptCode: '77385',
    procedure: 'IMRT radiation therapy delivery, simple',
    coveredDiagnoses: [
      'C00-C96',  // All malignant neoplasms
      'C7A.x',    // Neuroendocrine tumors
      'D00-D09',  // In situ neoplasms (specific sites per LCD)
    ],
    uncoveredDiagnoses: [
      'D10-D36',  // Benign neoplasms (generally not covered for RT)
      'M21-M95',  // Musculoskeletal deformities (unless specific LCD supports)',
    ],
    ncdReference: 'NCD 110.12',
    lcdReference: 'Intensity Modulated Radiation Therapy (IMRT)',
    lcdId: 'L35355',
    documentation: [
      'Radiation oncologist treatment plan',
      'CT simulation documentation',
      'DVH (Dose Volume Histogram) analysis',
      'Target volume and organ at risk delineation',
      'Number of fractions prescribed',
      'Prior radiation history to avoid overlap',
    ],
    specialRules: [
      'IMRT requires separate treatment planning (CPT 77301)',
      'Conventional RT must be documented as inadequate before IMRT for some payers',
      'Daily image guidance may be separately billable',
    ],
  },
  {
    cptCode: 'J9312',
    procedure: 'Pembrolizumab (Keytruda) infusion',
    coveredDiagnoses: [
      'C34.0-C34.92',  // Lung cancer (NSCLC)
      'C44.0-C44.999', // Melanoma (with specific subtypes)
      'C18-C20',       // Colorectal cancer (MSI-H/dMMR)
      'C56.x',         // Ovarian cancer (specific indications)
      'C61',           // Prostate cancer (specific indications)
      'C50.0-C50.9',   // Breast cancer (TNBC, specific indications)',
      'C64.x',         // Renal cell carcinoma
      'C71.x',         // Brain cancer (specific indications)',
    ],
    uncoveredDiagnoses: [
      'D00-D09',  // In situ (generally not covered for immunotherapy)',
      'C7A.x',    // Neuroendocrine (generally not first-line)',
    ],
    ncdReference: 'NCD 110.18',
    lcdReference: 'Immune Checkpoint Inhibitors',
    documentation: [
      'Biomarker testing results (PD-L1, MSI-H/dMMR, TMB, KRAS/NTRK)',
      'FDA-approved indication or NCCN compendium listing',
      'Prior therapy documentation (progression on first-line if applicable)',
      'Baseline imaging for response assessment',
      'IRB approval if clinical trial',
    ],
    specialRules: [
      'PD-L1 expression level may determine coverage',
      'Companion diagnostic required for certain indications',
      'Weight-based vs fixed dosing: 200mg Q3W or 400mg Q6W',
      'Treatment duration per NCCN guidelines or clinical trial protocol',
    ],
  },
  {
    cptCode: 'J9315',
    procedure: 'Nivolumab (Opdivo) infusion',
    coveredDiagnoses: [
      'C34.0-C34.92',  // NSCLC
      'C44.0-C44.999', // Melanoma
      'C64.x',         // Renal cell carcinoma
      'C22.x',         // Hepatocellular carcinoma
      'C56.x',         // Ovarian (specific)',
      'C67.x',         // Urothelial carcinoma
      'C15-C20',       // GI cancers (specific)',
      'C71.x',         // Glioblastoma (specific)',
    ],
    uncoveredDiagnoses: [
      'D00-D09',   // In situ
      'C80.1',     // Unknown primary (limited coverage)',
    ],
    ncdReference: 'NCD 110.18',
    lcdReference: 'Immune Checkpoint Inhibitors',
    documentation: [
      'PD-L1 testing (if required for indication)',
      'FDA-approved indication or NCCN compendium support',
      'Prior therapy and progression documentation',
      'Baseline imaging',
    ],
    specialRules: [
      'Combination therapy (nivolumab + ipilimumab) has separate dosing rules',
      'Weight-based vs flat dosing varies by indication',
      'Hepatic/renal dose adjustments may apply',
    ],
  },
  {
    cptCode: 'J9317',
    procedure: 'Trastuzumab deruxtecan (Enhertu) infusion - ADC',
    coveredDiagnoses: [
      'C50.0-C50.9',   // Breast cancer (HER2+)
      'C16.0-C16.9',   // Gastric cancer (HER2+)
      'C34.0-C34.92',  // NSCLC (HER2-mutant, specific indications)
    ],
    uncoveredDiagnoses: [
      'D05.0-D05.9',   // DCIS/LCIS (not covered for ADC)
      'C80.1',         // Unknown primary without HER2 testing
    ],
    ncdReference: 'NCD 110.18',
    lcdReference: 'Antibody-Drug Conjugates in Oncology',
    documentation: [
      'HER2 testing results: IHC 3+ or IHC 2+ with FISH amplification',
      'FDA-approved indication documentation',
      'Prior therapy documentation (progression on trastuzumab + taxane for breast)',
      'ILD (interstitial lung disease) monitoring and baseline chest imaging',
      'ECHO/MUGA for cardiac monitoring (LVEF baseline)',
      'Weight-based dosing: 5.4mg/kg (breast) or 6.4mg/kg (gastric)',
    ],
    specialRules: [
      'HER2-low (IHC 1+ or IHC 2+/FISH-) now approved for breast cancer (2022+)',
      'ILD monitoring required: hold for Grade 2, permanently discontinue for Grade 3+',
      'Do not substitute with trastuzumab (J9306) - different drug entirely',
    ],
  },
  {
    cptCode: 'Q2042',
    procedure: 'Tisagenlecleucel (Kymriah) - CAR-T cell therapy',
    coveredDiagnoses: [
      'C91.00-C91.02',  // B-cell ALL (acute lymphoblastic leukemia)
      'C85.1-C85.9',    // DLBCL (diffuse large B-cell lymphoma)
      'C82.x',          // Follicular lymphoma (FL)
    ],
    uncoveredDiagnoses: [
      'C91.10-C91.92',  // T-cell ALL (not approved)
      'C83.x',          // Mantle cell lymphoma (use Q2044 Tecartus instead)
      'C85.0',          // Other specified NHL without B-cell confirmation',
    ],
    ncdReference: 'NCD 110.24',
    lcdReference: 'CAR-T Cell Therapy',
    documentation: [
      'Confirmed B-cell ALL (age <=25) or DLBCL (adults, failed 2+ lines) or FL (adults, failed 2+ lines)',
      'Prior therapy documentation (chemotherapy, transplant, etc.)',
      'REMS-certified facility documentation',
      'Leukapheresis collection documentation (CPT 36514 or 0585T)',
      'Manufacturing and lot release documentation',
      'Lymphodepleting chemotherapy documentation (fludarabine + cyclophosphamide)',
      'CRS (cytokine release syndrome) monitoring protocol',
      'Neurologic toxicity monitoring protocol',
    ],
    specialRules: [
      'Single-unit billing: 1 unit = 1 complete CAR-T treatment',
      'WAC pricing may apply (not ASP) - document acquisition cost',
      'Facility must be REMS-certified for CAR-T administration',
      'CPT 0585T may be separately billable for cell processing/handling',
      'DRG payment for inpatient CAR-T: MS-DRG 016 or 017',
      'Outpatient: may be paid separately from OPPS bundled payment',
    ],
  },
  {
    cptCode: 'J9310',
    procedure: 'Atezolizumab (Tecentriq) infusion - PD-L1 inhibitor',
    coveredDiagnoses: [
      'C34.0-C34.92',   // NSCLC
      'C22.0-C22.9',    // Hepatocellular carcinoma
      'C67.0-C67.9',    // Urothelial carcinoma
      'C56.x-C57.x',    // Ovarian cancer (specific indications)
      'C18-C20',        // Colorectal cancer (MSI-H/dMMR)
    ],
    uncoveredDiagnoses: [
      'D00-D09',        // In situ
      'C80.1',          // Unknown primary
    ],
    ncdReference: 'NCD 110.18',
    lcdReference: 'Immune Checkpoint Inhibitors',
    documentation: [
      'PD-L1 testing results (if required for specific indication)',
      'FDA-approved indication or NCCN compendium support',
      'Prior therapy and progression documentation',
      'Combination therapy regimen documentation (if applicable)',
      'Baseline imaging for response assessment',
    ],
    specialRules: [
      'Multiple fixed-dose options: 840mg Q2W, 1200mg Q3W, or 1680mg Q4W',
      'Combination with bevacizumab + chemo for HCC requires separate J-code billing',
      'Combination with cobimetinib + vemurafenib for melanoma has specific sequencing rules',
    ],
  },
];

// ─── ONCOLOGY-SPECIFIC CARC CODE GUIDANCE ──────────────────────────────────

export const ONCOLOGY_CARC_GUIDANCE: Record<string, {
  commonScenarios: string[];
  fixes: string[];
  oncologySpecific: boolean;
  successRate: number;
}> = {
  'CO-22': {
    commonScenarios: [
      'Chemo + hydration bundled (96413 + 96360)',
      'IV push bundled with infusion (96374 + 96413)',
      'SLN identification with injection (38900 + 38792)',
      'Radiation planning with delivery',
    ],
    fixes: [
      'Add modifier XU (unusual non-overlapping) for separately identifiable hydration with documented medical necessity',
      'Document distinct start/stop times for each infusion service',
      'For chemo + hydration: ensure hydration is for a separate clinical reason (e.g., renal protection with cisplatin)',
      'Use modifier 59 only when XE/XS/XP/XU do not apply',
      'Document sequential vs concurrent infusion clearly',
    ],
    oncologySpecific: true,
    successRate: 70,
  },
  'CO-27': {
    commonScenarios: [
      'Off-label chemotherapy use',
      'Immunotherapy without biomarker testing',
      'Radiation therapy for benign conditions',
      'Prophylactic surgeries without confirmed genetic mutations',
    ],
    fixes: [
      'Provide NCCN compendium listing for off-label use',
      'Submit peer-reviewed literature supporting off-label indication',
      'Document biomarker results (PD-L1, MSI-H, BRCA, etc.)',
      'Request peer-to-peer review with payer medical director',
      'Reference specific NCD/LCD that supports the indication',
      'Include genetic testing results for prophylactic procedures',
    ],
    oncologySpecific: true,
    successRate: 55,
  },
  'CO-50': {
    commonScenarios: [
      'Chemotherapy without prior authorization',
      'IMRT without prior auth',
      'PET/CT without prior auth for restaging',
      'Surgical procedures requiring auth',
    ],
    fixes: [
      'Obtain retrospective authorization if payer allows (usually 30-day window)',
      'Submit clinical documentation supporting emergent/urgent need',
      'Document attempted authorization (payer system down, weekend, etc.)',
      'Appeal with documentation of emergent clinical necessity',
      'Verify authorization covers the specific drug and dosage',
    ],
    oncologySpecific: true,
    successRate: 60,
  },
  'CO-4': {
    commonScenarios: [
      'Missing modifier on add-on chemotherapy hours (96415)',
      'Missing JW modifier for drug wastage',
      'Laterality not specified for breast procedures',
      'Bilateral modifier missing for bilateral procedures',
    ],
    fixes: [
      'Add modifier JW for single-use vial drug wastage with documentation of discarded amount',
      'Add modifier LT/RT for breast/surgical procedures specifying side',
      'Add modifier 50 for bilateral procedures when applicable',
      'Ensure 96415 is billed with modifier as add-on to 96413',
      'Document exact wastage amount in units and mg',
    ],
    oncologySpecific: true,
    successRate: 85,
  },
  'CO-11': {
    commonScenarios: [
      'Diagnosis does not support chemotherapy level',
      'Consultation code billed for transfer of care',
      'E/M level not supported by oncology documentation',
    ],
    fixes: [
      'Verify malignancy diagnosis is active and correctly coded',
      'For consultation codes: ensure written request from referring physician exists',
      'Ensure MDM level matches the complexity documented in notes',
      'Add secondary diagnoses (complications, comorbidities) that support complexity',
    ],
    oncologySpecific: true,
    successRate: 65,
  },
  'CO-97': {
    commonScenarios: [
      'J-code payment differs from billed amount',
      'Drug pricing at ASP vs AWP',
      'Wastage amount not paid at same rate',
      'Biosimilar substitution at lower reimbursement',
    ],
    fixes: [
      'Verify billing at ASP (Average Sales Price) rate per CMS quarterly update',
      'Document wastage separately with JW modifier for single-use vials',
      'Verify J-code units match the actual dosage administered',
      'If biosimilar was dispensed, ensure correct J-code for that biosimilar',
      'Check if payer uses AWP vs ASP pricing methodology',
    ],
    oncologySpecific: true,
    successRate: 50,
  },
};

// ─── J-CODE WASTAGE TRACKING ───────────────────────────────────────────────

export interface WastageRule {
  jCode: string;
  drugName: string;
  singleUseVial: boolean;
  jwModifierRequired: boolean;
  documentationRequired: string[];
  calculationMethod: string;
}

export const WASTAGE_RULES: WastageRule[] = [
  {
    jCode: 'J9000',
    drugName: 'Doxorubicin',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Total mg in vial',
      'Mg administered to patient',
      'Mg discarded',
      'Reason for wastage (single-use vial policy)',
    ],
    calculationMethod: 'Units billed = mg administered / 10. JW units = mg discarded / 10.',
  },
  {
    jCode: 'J9035',
    drugName: 'Bevacizumab',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Total mg in vial (100 mg or 400 mg)',
      'Mg administered based on weight-based dosing',
      'Mg discarded',
    ],
    calculationMethod: 'Units billed = mg administered / 10. JW units = mg discarded / 10.',
  },
  {
    jCode: 'J9312',
    drugName: 'Pembrolizumab',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Vial size (100 mg)',
      'Mg administered (200 mg flat dose or weight-based)',
      'Mg discarded from each vial',
    ],
    calculationMethod: 'Units billed = mg administered / 1. JW units = mg discarded / 1. For 200mg dose from two 100mg vials, wastage may be zero.',
  },
  {
    jCode: 'J9340',
    drugName: 'Carboplatin',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Vial size (50 mg, 150 mg, 450 mg, or 600 mg)',
      'Calvert formula AUC dosing calculation',
      'Mg administered',
      'Mg discarded',
    ],
    calculationMethod: 'AUC dose (mg) = AUC x (GFR + 25). Units billed = mg administered / 50. JW units = mg discarded / 50.',
  },
  {
    jCode: 'J2505',
    drugName: 'Pegfilgrastim',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Vial size (6 mg/0.6 mL single-dose)',
      'Mg administered (6 mg fixed dose)',
      'Any discarded amount',
    ],
    calculationMethod: 'Fixed 6 mg dose = 1 unit. Wastage typically zero with prefilled syringe. On-body injector (J2506) separate code.',
  },
  {
    jCode: 'J9317',
    drugName: 'Trastuzumab deruxtecan (Enhertu)',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Vial size (100 mg or 200 mg)',
      'Mg administered (weight-based: 5.4mg/kg or 6.4mg/kg)',
      'Mg discarded from each vial',
      'HER2 status documentation',
    ],
    calculationMethod: 'Units billed = mg administered / 1. JW units = mg discarded / 1. Weight-based dosing: patient weight (kg) x dose (5.4 or 6.4) = total mg.',
  },
  {
    jCode: 'J9327',
    drugName: 'Sacituzumab govitecan (Trodelvy)',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Vial size (200 mg)',
      'Mg administered (weight-based: 10mg/kg on days 1 and 8 of 21-day cycle)',
      'Mg discarded',
    ],
    calculationMethod: 'Units billed = mg administered / 1. JW units = mg discarded / 1. Patient weight (kg) x 10 = total mg per dose.',
  },
  {
    jCode: 'J9310',
    drugName: 'Atezolizumab (Tecentriq)',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Vial size (1200 mg/20 mL)',
      'Mg administered (fixed dose: 840mg, 1200mg, or 1680mg)',
      'Mg discarded',
    ],
    calculationMethod: 'Units billed = mg administered / 1. JW units = mg discarded / 1. Fixed dose simplifies billing - wastage from single 1200mg vial is 0 for 1200mg dose.',
  },
  {
    jCode: 'J9047',
    drugName: 'Bevacizumab-awwb (Mvasi) - biosimilar',
    singleUseVial: true,
    jwModifierRequired: true,
    documentationRequired: [
      'Vial size (100 mg or 400 mg)',
      'Mg administered (weight-based: 5mg/kg or 15mg/kg)',
      'Mg discarded',
      'Document biosimilar selection rationale',
    ],
    calculationMethod: 'Units billed = mg administered / 10. JW units = mg discarded / 10. Same calculation method as reference bevacizumab (J9035).',
  },
];

// ─── ONCOLOGY CLINICAL TRIAL BILLING RULES ──────────────────────────────────

export interface ClinicalTrialBillingRule {
  ruleType: string;
  description: string;
  billableToPayer: boolean;
  billableToSponsor: boolean;
  cptCodeExamples: string[];
  requirements: string[];
}

export const CLINICAL_TRIAL_BILLING_RULES: ClinicalTrialBillingRule[] = [
  {
    ruleType: 'routine_costs',
    description: 'Items/services routinely provided absent clinical trial (covered by insurance)',
    billableToPayer: true,
    billableToSponsor: false,
    cptCodeExamples: ['99213-99215', '96413', '36415', '93000'],
    requirements: [
      'IRB-approved clinical trial',
      'Medicare-covered clinical trial (per NCD 310.1)',
      'Informed consent on file',
      'Routine care that would be provided regardless of trial participation',
    ],
  },
  {
    ruleType: 'research_costs',
    description: 'Items/services provided solely for the clinical trial (covered by sponsor)',
    billableToPayer: false,
    billableToSponsor: true,
    cptCodeExamples: ['Investigational drug J-codes', 'Extra imaging for protocol', 'Research lab draws'],
    requirements: [
      'Distinguish routine vs research costs in billing',
      'Investigational drug billed to sponsor, not insurer',
      'Protocol-mandated extra visits billed to sponsor',
      'Maintain clear audit trail of cost allocation',
    ],
  },
  {
    ruleType: 'investigational_drug',
    description: 'Investigational agent not yet FDA-approved',
    billableToPayer: false,
    billableToSponsor: true,
    cptCodeExamples: ['J8999 (Unclassified drug)', 'Q-codes for specific agents'],
    requirements: [
      'Cannot bill to Medicare/commercial payer',
      'Must use unclassified J-code (J8999) or Q-code if assigned',
      'Sponsor must provide drug at no cost or reimburse',
    ],
  },
];

// ─── ONCOLOGY INFUSION TIME CALCULATION HELPER ─────────────────────────────

export interface InfusionTimeCalculation {
  primaryCode: string;
  primaryMinutes: number;
  addOnCode: string;
  addOnUnits: number;
  totalMinutes: number;
  calculationNotes: string;
}

export function calculateInfusionTime(totalMinutes: number, infusionType: 'chemo' | 'hydration' | 'therapeutic'): InfusionTimeCalculation {
  let primaryCode: string;
  let primaryMinutes: number;
  let addOnCode: string;
  let addOnUnits: number;

  switch (infusionType) {
    case 'chemo':
      primaryCode = '96413';
      primaryMinutes = Math.min(totalMinutes, 60);
      addOnCode = '96415';
      addOnUnits = totalMinutes > 60 ? Math.floor((totalMinutes - 60) / 60) + ((totalMinutes - 60) % 60 > 30 ? 1 : 0) : 0;
      break;
    case 'hydration':
      primaryCode = '96360';
      primaryMinutes = Math.min(totalMinutes, 60);
      addOnCode = '96361';
      addOnUnits = totalMinutes > 60 ? Math.floor((totalMinutes - 60) / 60) + ((totalMinutes - 60) % 60 > 30 ? 1 : 0) : 0;
      break;
    case 'therapeutic':
      primaryCode = '96365';
      primaryMinutes = Math.min(totalMinutes, 60);
      addOnCode = '96366';
      addOnUnits = totalMinutes > 60 ? Math.floor((totalMinutes - 60) / 60) + ((totalMinutes - 60) % 60 > 30 ? 1 : 0) : 0;
      break;
  }

  return {
    primaryCode,
    primaryMinutes,
    addOnCode,
    addOnUnits,
    totalMinutes,
    calculationNotes: `Total ${totalMinutes} min: ${primaryCode} (first ${primaryMinutes} min) + ${addOnUnits} unit(s) of ${addOnCode} (>30 min past hour rounds up)`,
  };
}

// ─── J-CODE DOSAGE CALCULATION HELPER ──────────────────────────────────────

export interface JCodeCalculation {
  jCode: string;
  drugName: string;
  doseAdministered: number;
  unitSize: number;
  unitsToBill: number;
  wastageUnits: number;
  totalUnitsInVial: number;
  jwRequired: boolean;
  calculationNotes: string;
}

export function calculateJCodeBilling(
  jCode: string,
  doseMg: number,
  vialSizeMg: number,
  vialsUsed: number
): JCodeCalculation {
  const jCodeInfo = ONCOLOGY_J_CODES[jCode];
  if (!jCodeInfo) {
    return {
      jCode,
      drugName: 'Unknown',
      doseAdministered: doseMg,
      unitSize: 0,
      unitsToBill: 0,
      wastageUnits: 0,
      totalUnitsInVial: 0,
      jwRequired: false,
      calculationNotes: `J-code ${jCode} not found in oncology database`,
    };
  }

  // Parse unit size (e.g., "10 mg" → 10)
  const unitSizeMatch = jCodeInfo.unitSize.match(/[\d.]+/);
  const unitSize = unitSizeMatch ? parseFloat(unitSizeMatch[0]) : 1;

  const totalMgInVials = vialSizeMg * vialsUsed;
  const unitsToBill = Math.floor(doseMg / unitSize);
  const totalUnitsInVial = Math.floor(totalMgInVials / unitSize);
  const wastedMg = totalMgInVials - doseMg;
  const wastageUnits = Math.floor(wastedMg / unitSize);
  const jwRequired = jCodeInfo.jwModifierRequired && wastageUnits > 0;

  return {
    jCode,
    drugName: jCodeInfo.drugName,
    doseAdministered: doseMg,
    unitSize,
    unitsToBill,
    wastageUnits,
    totalUnitsInVial,
    jwRequired,
    calculationNotes: `${doseMg} mg administered from ${vialsUsed} vial(s) of ${vialSizeMg} mg. ${unitsToBill} units of ${jCode} for administered dose. ${wastageUnits} units with JW modifier for wastage. ${jwRequired ? 'JW modifier required.' : 'No JW modifier needed.'}`,
  };
}

// ─── ONCOLOGY CPT-TO-SPECIALTY MAPPING ──────────────────────────────────────

export const ONCOLOGY_CPT_RANGES: Array<[number, number, string, string]> = [
  // [start, end, subcategory, description]
  [96401, 96420, 'chemo_admin', 'Chemotherapy administration'],
  [96500, 96549, 'chemo_admin', 'Chemotherapy administration (other)'],
  [77300, 77399, 'radiation', 'Radiation treatment planning and delivery'],
  [77401, 77499, 'radiation', 'Radiation treatment management'],
  [77011, 77014, 'radiation', 'Radiation guidance and simulation'],
  [19301, 19307, 'surgical', 'Breast/mastectomy procedures'],
  [38900, 38970, 'surgical', 'Lymph node procedures (oncology)'],
  [31600, 31640, 'surgical', 'Endoscopic procedures (thoracic oncology)'],
  [41000, 41020, 'surgical', 'Intraoral/oropharyngeal oncology'],
  [32400, 32490, 'surgical', 'Lung resection (thoracic oncology)'],
  [50500, 50780, 'surgical', 'Kidney/ureter oncology'],
  [58900, 58960, 'surgical', 'Ovarian/female reproductive oncology'],
  [60500, 60680, 'surgical', 'Endocrine oncology'],
];

export function isOncologyCPT(cptCode: string): boolean {
  const codeNum = parseInt(cptCode);
  return ONCOLOGY_CPT_RANGES.some(([start, end]) => codeNum >= start && codeNum <= end);
}

export function isOncologyJCode(code: string): boolean {
  return code.startsWith('J') && (code in ONCOLOGY_J_CODES || /^J[0-9]{4}$/.test(code));
}

export function isOncologyICD10(code: string): boolean {
  return /^(C[0-9]{2}|C7A|D0[0-9]|D4[0-9]|Z51\.1|Z85\.)/.test(code) ||
    code.startsWith('C00') || code.startsWith('C0') || code.startsWith('C1') ||
    code.startsWith('C2') || code.startsWith('C3') || code.startsWith('C4') ||
    code.startsWith('C5') || code.startsWith('C6') || code.startsWith('C7') ||
    code.startsWith('C8') || code.startsWith('C9') ||
    code.startsWith('C7A') || code.startsWith('D46') ||
    code.startsWith('Z51.1') || code.startsWith('Z85');
}
