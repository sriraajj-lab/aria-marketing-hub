/**
 * X12 EDI MCP Server for Denials Doctor
 * 
 * This MCP server provides tools for parsing and validating X12 EDI
 * healthcare transactions (837 claims, 835 remittances) that can be
 * used by any MCP-compatible AI agent (Codex CLI, Claude Code, etc.)
 * 
 * This is the first commercial MCP server product from the Codex Deep Dive research.
 * 
 * Install: npm install @modelcontextprotocol/sdk
 * Run: node x12-mcp-server.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// ============================================================
// X12 EDI Parsing Utilities
// ============================================================

interface X12Segment {
  segmentId: string;
  elements: string[];
}

interface Claim837 {
  claimId: string;
  patientName: string;
  subscriberId: string;
  providerNpi: string;
  cptCodes: string[];
  icd10Codes: string[];
  dateOfService: string;
  billedAmount: number;
  diagnosisCodes: string[];
  placeOfService: string;
}

interface Remittance835 {
  claimId: string;
  payerClaimNumber: string;
  paidAmount: number;
  chargedAmount: number;
  carcCodes: string[];
  rarcCodes: string[];
  adjustmentReasons: string[];
  payerId: string;
  payerName: string;
  checkNumber: string;
  checkDate: string;
}

/**
 * Parse an X12 document into segments
 */
function parseX12Segments(x12Content: string): X12Segment[] {
  // Detect delimiters from ISA segment
  const isaSegment = x12Content.substring(0, 106);
  const elementDelimiter = isaSegment[3];
  const segmentDelimiter = isaSegment[105];

  const segments: X12Segment[] = [];
  const segmentStrings = x12Content.split(segmentDelimiter).filter(s => s.trim());

  for (const segStr of segmentStrings) {
    const elements = segStr.split(elementDelimiter).filter(e => e.trim());
    if (elements.length > 0) {
      segments.push({
        segmentId: elements[0],
        elements,
      });
    }
  }

  return segments;
}

/**
 * Parse an 837 (Professional Claim) transaction
 */
function parse837Claim(x12Content: string): Claim837[] {
  const segments = parseX12Segments(x12Content);
  const claims: Claim837[] = [];

  let currentClaim: Partial<Claim837> = {};
  let inClaim = false;

  for (const segment of segments) {
    switch (segment.segmentId) {
      case 'CLM':
        // Claim information
        inClaim = true;
        currentClaim.claimId = segment.elements[1] || '';
        currentClaim.billedAmount = parseFloat(segment.elements[2]) || 0;
        currentClaim.placeOfService = segment.elements[5] || '';
        break;

      case 'NM1':
        // Name - check qualifier
        const qualifier = segment.elements[1];
        if (qualifier === 'QC') {
          // Patient name
          currentClaim.patientName = `${segment.elements[3] || ''}, ${segment.elements[4] || ''}`;
        } else if (qualifier === 'IL') {
          // Subscriber
          currentClaim.subscriberId = segment.elements[9] || '';
        } else if (qualifier === '82') {
          // Provider
          // NPI would be in element 9 when element 10 = 'XX'
          if (segment.elements[10] === 'XX') {
            currentClaim.providerNpi = segment.elements[9] || '';
          }
        }
        break;

      case 'SV1':
        // Professional service
        if (!currentClaim.cptCodes) currentClaim.cptCodes = [];
        const cptComposite = segment.elements[1] || '';
        const cptCode = cptComposite.split(':')[1] || cptComposite;
        currentClaim.cptCodes.push(cptCode);
        
        if (!currentClaim.icd10Codes) currentClaim.icd10Codes = [];
        // ICD-10 pointers are in elements[7]
        break;

      case 'HI':
        // Diagnosis codes
        if (!currentClaim.diagnosisCodes) currentClaim.diagnosisCodes = [];
        for (let i = 1; i < segment.elements.length; i++) {
          const codeComposite = segment.elements[i];
          if (codeComposite) {
            const parts = codeComposite.split(':');
            const code = parts[parts.length - 1] || parts[0];
            currentClaim.diagnosisCodes.push(code);
          }
        }
        break;

      case 'DTP':
        // Date
        if (segment.elements[1] === '472') {
          // Date of service
          currentClaim.dateOfService = segment.elements[3] || '';
        }
        break;

      case 'SE':
        // Transaction set trailer - save the claim
        if (inClaim && currentClaim.claimId) {
          claims.push({
            claimId: currentClaim.claimId || '',
            patientName: currentClaim.patientName || '',
            subscriberId: currentClaim.subscriberId || '',
            providerNpi: currentClaim.providerNpi || '',
            cptCodes: currentClaim.cptCodes || [],
            icd10Codes: currentClaim.icd10Codes || [],
            dateOfService: currentClaim.dateOfService || '',
            billedAmount: currentClaim.billedAmount || 0,
            diagnosisCodes: currentClaim.diagnosisCodes || [],
            placeOfService: currentClaim.placeOfService || '',
          });
        }
        currentClaim = {};
        inClaim = false;
        break;
    }
  }

  return claims;
}

/**
 * Parse an 835 (Remittance Advice) transaction
 */
function parse835Remittance(x12Content: string): Remittance835[] {
  const segments = parseX12Segments(x12Content);
  const remittances: Remittance835[] = [];

  let currentRemit: Partial<Remittance835> = {};

  for (const segment of segments) {
    switch (segment.segmentId) {
      case 'CLP':
        // Claim level data
        currentRemit.claimId = segment.elements[1] || '';
        currentRemit.chargedAmount = parseFloat(segment.elements[3]) || 0;
        currentRemit.paidAmount = parseFloat(segment.elements[4]) || 0;
        if (!currentRemit.carcCodes) currentRemit.carcCodes = [];
        if (!currentRemit.rarcCodes) currentRemit.rarcCodes = [];
        if (!currentRemit.adjustmentReasons) currentRemit.adjustmentReasons = [];
        break;

      case 'CAS':
        // Claim adjustments - contains CARC/RARC codes
        for (let i = 2; i < segment.elements.length; i += 3) {
          const carcCode = segment.elements[i];
          if (carcCode) {
            currentRemit.carcCodes?.push(carcCode);
            const amount = segment.elements[i + 1] || '';
            currentRemit.adjustmentReasons?.push(`CARC ${carcCode}: $${amount}`);
          }
        }
        break;

      case 'N1':
        // Payer identification
        if (segment.elements[1] === 'PR') {
          currentRemit.payerName = segment.elements[2] || '';
          if (segment.elements[4] === 'XV') {
            currentRemit.payerId = segment.elements[3] || '';
          }
        }
        break;

      case 'TRN':
        // Trace number (check number)
        if (segment.elements[1] === '1') {
          currentRemit.checkNumber = segment.elements[2] || '';
        }
        break;

      case 'DTM':
        // Date
        if (segment.elements[1] === '405') {
          currentRemit.checkDate = segment.elements[3] || '';
        }
        break;

      case 'SE':
        // Save the remittance
        if (currentRemit.claimId) {
          remittances.push({
            claimId: currentRemit.claimId || '',
            payerClaimNumber: currentRemit.payerClaimNumber || '',
            paidAmount: currentRemit.paidAmount || 0,
            chargedAmount: currentRemit.chargedAmount || 0,
            carcCodes: currentRemit.carcCodes || [],
            rarcCodes: currentRemit.rarcCodes || [],
            adjustmentReasons: currentRemit.adjustmentReasons || [],
            payerId: currentRemit.payerId || '',
            payerName: currentRemit.payerName || '',
            checkNumber: currentRemit.checkNumber || '',
            checkDate: currentRemit.checkDate || '',
          });
        }
        currentRemit = {};
        break;
    }
  }

  return remittances;
}

/**
 * Validate CARC (Claim Adjustment Reason Code)
 */
function validateCarcCode(carcCode: string): {
  isValid: boolean;
  category: string;
  description: string;
} {
  const carcMap: Record<string, { category: string; description: string }> = {
    '1': { category: 'deductible', description: 'Deductible amount' },
    '2': { category: 'coinsurance', description: 'Coinsurance amount' },
    '4': { category: 'coding', description: 'Procedure code inconsistent with modifier or not covered' },
    '5': { category: 'authorization', description: 'Service requires prior authorization' },
    '11': { category: 'coding', description: 'Diagnosis inconsistent with procedure' },
    '15': { category: 'authorization', description: 'Authorization number missing/invalid' },
    '16': { category: 'missing_info', description: 'Claim lacks information or substandard' },
    '18': { category: 'duplicate', description: 'Exact duplicate claim' },
    '22': { category: 'coordination', description: 'Payment adjusted - COB' },
    '23': { category: 'impact', description: 'Impact of prior payer(s) adjudication' },
    '26': { category: 'expenses', description: 'Expenses incurred prior to coverage' },
    '27': { category: 'eligibility', description: 'Expenses incurred after coverage terminated' },
    '29': { category: 'timely_filing', description: 'Time limit for filing has expired' },
    '31': { category: 'coding', description: 'Patient cannot be identified' },
    '39': { category: 'coding', description: 'Services denied at time of authorization' },
    '45': { category: 'noncovered', description: 'Charges exceed fee schedule/maximum allowable' },
    '50': { category: 'noncovered', description: 'Non-covered services' },
    '51': { category: 'noncovered', description: 'Non-covered services because not deemed medical necessity' },
    '53': { category: 'noncovered', description: 'Non-covered service - not a covered benefit' },
    '55': { category: 'coding', description: 'Procedure/treatment/drug deemed experimental/investigational' },
    '58': { category: 'coding', description: 'Treatment deemed not medically necessary' },
    '96': { category: 'noncovered', description: 'Non-covered charge(s) - patient responsible' },
    '97': { category: 'payment', description: 'Payment adjusted - bundled or included in another service' },
    '111': { category: 'noncovered', description: 'Not covered unless provider accepts assignment' },
    '167': { category: 'coding', description: 'Diagnosis missing/invalid' },
    '170': { category: 'payment', description: 'Payment denied - no authorization' },
    '176': { category: 'coding', description: 'Prescription incomplete/invalid' },
    '197': { category: 'eligibility', description: 'Precertification/authorization not obtained' },
    '204': { category: 'coding', description: 'Service inconsistent with diagnosis' },
    '207': { category: 'coding', description: 'National provider identifier missing' },
    '236': { category: 'coding', description: 'Procedure/procedure code modifier inconsistent' },
    '242': { category: 'coding', description: 'Services not provided by network/primary care provider' },
    '256': { category: 'coding', description: 'Service not payable per managed care contract' },
  };

  const entry = carcMap[carcCode];
  if (entry) {
    return { isValid: true, category: entry.category, description: entry.description };
  }

  // Generic validation
  const codeNum = parseInt(carcCode, 10);
  if (isNaN(codeNum) || codeNum < 1 || codeNum > 9999) {
    return { isValid: false, category: 'invalid', description: `Invalid CARC code format: ${carcCode}` };
  }

  return { isValid: true, category: 'unknown', description: `CARC code ${carcCode} - description not in local database` };
}

// ============================================================
// MCP Server Definition
// ============================================================

const server = new Server(
  {
    name: 'denials-doctor-x12',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'parse_837_claim',
      description: 'Parse an X12 837 (Professional Claim) EDI file and extract structured claim data including CPT codes, ICD-10 codes, patient demographics, and provider information.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          x12_content: {
            type: 'string',
            description: 'The raw X12 837 EDI content',
          },
        },
        required: ['x12_content'],
      },
    },
    {
      name: 'parse_835_remittance',
      description: 'Parse an X12 835 (Remittance Advice) EDI file and extract payment data, CARC/RARC codes, adjustment reasons, and denial information.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          x12_content: {
            type: 'string',
            description: 'The raw X12 835 EDI content',
          },
        },
        required: ['x12_content'],
      },
    },
    {
      name: 'validate_carc_code',
      description: 'Validate a CARC (Claim Adjustment Reason Code) and return its category, description, and validity status.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          carc_code: {
            type: 'string',
            description: 'The CARC code to validate (e.g., "4", "50", "197")',
          },
        },
        required: ['carc_code'],
      },
    },
    {
      name: 'validate_claim_codes',
      description: 'Validate all CPT and ICD-10 codes in a claim against common denial patterns and coding rules.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cpt_codes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of CPT codes to validate',
          },
          icd10_codes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of ICD-10 codes to validate',
          },
        },
        required: ['cpt_codes', 'icd10_codes'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'parse_837_claim': {
      const x12Content = args?.x12_content as string;
      if (!x12Content) {
        throw new McpError(ErrorCode.InvalidParams, 'x12_content is required');
      }
      try {
        const claims = parse837Claim(x12Content);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ claims, count: claims.length }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Failed to parse 837: ${(error as Error).message}`);
      }
    }

    case 'parse_835_remittance': {
      const x12Content = args?.x12_content as string;
      if (!x12Content) {
        throw new McpError(ErrorCode.InvalidParams, 'x12_content is required');
      }
      try {
        const remittances = parse835Remittance(x12Content);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ remittances, count: remittances.length }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Failed to parse 835: ${(error as Error).message}`);
      }
    }

    case 'validate_carc_code': {
      const carcCode = args?.carc_code as string;
      if (!carcCode) {
        throw new McpError(ErrorCode.InvalidParams, 'carc_code is required');
      }
      const validation = validateCarcCode(carcCode);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(validation, null, 2),
          },
        ],
      };
    }

    case 'validate_claim_codes': {
      const cptCodes = (args?.cpt_codes as string[]) || [];
      const icd10Codes = (args?.icd10_codes as string[]) || [];
      
      const issues: string[] = [];
      
      // Validate CPT code format (5 digits, possibly with modifier)
      for (const code of cptCodes) {
        const baseCode = code.replace(/[A-Z]$/, ''); // Remove modifier
        if (!/^\d{4,5}$/.test(baseCode)) {
          issues.push(`Invalid CPT code format: ${code}`);
        }
      }
      
      // Validate ICD-10 code format
      for (const code of icd10Codes) {
        if (!/^[A-Z]\d{2}(\.\d{1,4})?$/.test(code)) {
          issues.push(`Invalid ICD-10 code format: ${code}`);
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              isValid: issues.length === 0,
              issues,
              cptCodesCount: cptCodes.length,
              icd10CodesCount: icd10Codes.length,
            }, null, 2),
          },
        ],
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

// ============================================================
// Start Server
// ============================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Denials Doctor X12 MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
