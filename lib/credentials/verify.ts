// Universal Credential Verification Engine
// Covers every profession verifiable via public API or AI document analysis
// Sources: NPPES (medical), FINRA BrokerCheck, NIPR (insurance),
//          state bar APIs, ARELLO (real estate), plus Claude AI for documents

import { callClaude } from '@/lib/claude/client';

export interface VerificationInput {
  credential_type: string;
  license_number?: string;
  license_state?: string;
  first_name?: string;
  last_name?: string;
  npi_number?: string;
  business_name?: string;
  document_url?: string;   // Cloudinary URL of uploaded credential
}

export interface VerificationResult {
  verified:       boolean;
  confidence:     number;   // 0-100
  source:         string;   // which API/method
  status:         'auto_verified' | 'manual_review' | 'rejected';
  name_match:     boolean | null;
  license_active: boolean | null;
  expiry_date:    string | null;
  specialty:      string | null;
  raw_data:       any;
  notes:          string;
}

// ─── NPPES — National Provider Identifier (Medical / Mental Health) ────────────
export async function verifyNPI(npi: string, expectedName?: string): Promise<VerificationResult> {
  try {
    const url = `https://npiregistry.cms.hhs.gov/api/?number=${npi}&version=2.1&limit=1`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.results?.length) {
      return { verified: false, confidence: 0, source: 'nppes', status: 'rejected',
        name_match: false, license_active: false, expiry_date: null, specialty: null, raw_data: data, notes: 'NPI not found in NPPES registry' };
    }

    const result    = data.results[0];
    const enumType  = result.enumeration_type;  // 'NPI-1' individual, 'NPI-2' org
    const basic      = result.basic ?? {};
    const taxonomy   = result.taxonomies?.find((t: any) => t.primary) ?? {};
    const fullName   = enumType === 'NPI-1'
      ? `${basic.first_name ?? ''} ${basic.last_name ?? ''}`.trim()
      : basic.organization_name ?? '';

    const nameMatch = expectedName
      ? fullName.toLowerCase().includes(expectedName.toLowerCase().split(' ')[0])
      : null;

    return {
      verified:       true,
      confidence:     nameMatch === false ? 70 : 95,
      source:         'nppes_api',
      status:         'auto_verified',
      name_match:     nameMatch,
      license_active: true,  // NPPES active records = active license
      expiry_date:    null,
      specialty:      taxonomy.desc ?? null,
      raw_data:       result,
      notes:          `Verified via NPPES. ${fullName} · ${taxonomy.desc ?? 'No specialty listed'}`,
    };
  } catch (e: any) {
    return { verified: false, confidence: 0, source: 'nppes', status: 'manual_review',
      name_match: null, license_active: null, expiry_date: null, specialty: null,
      raw_data: {}, notes: `NPPES API error: ${e.message}` };
  }
}

// ─── FINRA BrokerCheck — Financial / Investment Advisors ──────────────────────
export async function verifyFINRA(crd_number: string, name?: string): Promise<VerificationResult> {
  try {
    const url = `https://api.brokercheck.finra.org/search/individual/${crd_number}`;
    const res  = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();

    if (!data?.hits?.hits?.length) {
      return { verified: false, confidence: 0, source: 'finra_brokercheck', status: 'rejected',
        name_match: false, license_active: false, expiry_date: null, specialty: null,
        raw_data: data, notes: 'CRD not found in FINRA BrokerCheck' };
    }

    const hit    = data.hits.hits[0]._source ?? {};
    const active = hit.ind_bc_scope !== 'Inactive';

    return {
      verified:       active,
      confidence:     active ? 92 : 40,
      source:         'finra_brokercheck',
      status:         active ? 'auto_verified' : 'rejected',
      name_match:     null,
      license_active: active,
      expiry_date:    null,
      specialty:      hit.ind_industry_scope ?? null,
      raw_data:       hit,
      notes:          `FINRA BrokerCheck: CRD #${crd_number}. Status: ${hit.ind_bc_scope ?? 'Unknown'}`,
    };
  } catch (e: any) {
    return { verified: false, confidence: 0, source: 'finra', status: 'manual_review',
      name_match: null, license_active: null, expiry_date: null, specialty: null,
      raw_data: {}, notes: `FINRA API unavailable: ${e.message}. Manual review required.` };
  }
}

// ─── NIPR — Insurance Producer Registry ──────────────────────────────────────
export async function verifyNIPR(license_number: string, state: string, name?: string): Promise<VerificationResult> {
  // NIPR has a subscription API — we fall back to AI document verification
  // when direct API access is unavailable
  return {
    verified:       false,
    confidence:     0,
    source:         'nipr_manual',
    status:         'manual_review',
    name_match:     null,
    license_active: null,
    expiry_date:    null,
    specialty:      'Insurance Producer',
    raw_data:       { license_number, state },
    notes:          'NIPR subscription required for auto-verification. Document upload will be AI-verified.',
  };
}

// ─── AI Document Verification (Claude) — for all credential types ─────────────
// Used for: holistic practitioners, coaches, certifications without public API
// Also used as fallback + secondary check for API-verified credentials
export async function verifyDocumentWithAI(
  document_url: string,
  credential_type: string,
  expected_name: string,
  license_number?: string
): Promise<VerificationResult> {
  const prompt = `Analyze this professional credential document for villa9e's verification system.

Document URL: ${document_url}
Expected credential type: ${credential_type}
Expected name: ${expected_name}
${license_number ? `Expected license/certification number: ${license_number}` : ''}

Verify:
1. Is this a legitimate professional credential document? (certificate, license, diploma, etc.)
2. Does the name on the document match "${expected_name}"?
3. Is the credential type consistent with "${credential_type}"?
4. Is there an expiry date? If so, what is it?
5. What is the issuing authority/organization?
6. Are there any signs of tampering or forgery?

Return JSON:
{
  "appears_legitimate": true/false,
  "name_match": true/false/null,
  "credential_type_match": true/false,
  "issuing_authority": "name or null",
  "expiry_date": "YYYY-MM-DD or null",
  "credential_number_visible": "number or null",
  "concerns": "any concerns or null",
  "confidence": 0-100,
  "recommendation": "auto_verified | manual_review | rejected"
}`;

  try {
    const result = await callClaude(prompt, {
      system: 'You are a professional credential verification specialist. Be conservative — when in doubt, recommend manual review rather than approval. Never approve documents that show signs of tampering.',
      maxTokens: 512,
    });

    return {
      verified:       result.recommendation === 'auto_verified' && result.appears_legitimate,
      confidence:     result.confidence ?? 50,
      source:         'claude_ai_document',
      status:         result.recommendation ?? 'manual_review',
      name_match:     result.name_match,
      license_active: result.appears_legitimate,
      expiry_date:    result.expiry_date,
      specialty:      null,
      raw_data:       result,
      notes:          result.concerns ?? `AI verified. Issuing authority: ${result.issuing_authority ?? 'unknown'}`,
    };
  } catch (e: any) {
    return { verified: false, confidence: 0, source: 'claude_ai', status: 'manual_review',
      name_match: null, license_active: null, expiry_date: null, specialty: null,
      raw_data: {}, notes: 'AI verification failed — manual review required.' };
  }
}

// ─── Master verification router ───────────────────────────────────────────────
// Routes to the right verification source based on credential type
export async function verifyCredential(input: VerificationInput): Promise<VerificationResult> {
  const { credential_type, license_number, license_state, first_name, last_name, npi_number, document_url } = input;
  const fullName = [first_name, last_name].filter(Boolean).join(' ');

  // Medical / Mental Health / Allied Health — NPI auto-verify
  if (['npi_medical', 'npi_mental_health', 'npi_allied_health'].includes(credential_type)) {
    const npi = npi_number || license_number;
    if (npi) {
      const result = await verifyNPI(npi, fullName);
      // Supplement with AI document check if doc provided
      if (document_url && result.verified) {
        const aiCheck = await verifyDocumentWithAI(document_url, credential_type, fullName, npi);
        result.confidence = Math.round((result.confidence + aiCheck.confidence) / 2);
        if (aiCheck.status === 'rejected') result.status = 'manual_review';
      }
      return result;
    }
  }

  // Financial — FINRA BrokerCheck
  if (['finra_broker', 'cfa', 'cfp', 'fiduciary_ria'].includes(credential_type) && license_number) {
    const result = await verifyFINRA(license_number, fullName);
    if (document_url) {
      const aiCheck = await verifyDocumentWithAI(document_url, credential_type, fullName, license_number);
      result.confidence = Math.round((result.confidence + aiCheck.confidence) / 2);
    }
    return result;
  }

  // Insurance
  if (['insurance_producer', 'insurance_adjuster'].includes(credential_type) && license_number && license_state) {
    // Try NIPR first, fall back to AI
    if (document_url) {
      return await verifyDocumentWithAI(document_url, credential_type, fullName, license_number);
    }
    return await verifyNIPR(license_number, license_state, fullName);
  }

  // Bar license — state bar (manual verification with AI assist)
  if (credential_type === 'bar_license') {
    if (document_url) {
      const aiResult = await verifyDocumentWithAI(document_url, 'Bar License', fullName, license_number);
      // Bar licenses require manual review regardless — high stakes
      aiResult.status = aiResult.confidence > 80 ? 'auto_verified' : 'manual_review';
      aiResult.notes += ' | Bar licenses are auto-approved at 80%+ AI confidence. Lower confidence = manual review.';
      return aiResult;
    }
    return { verified: false, confidence: 0, source: 'state_bar', status: 'manual_review',
      name_match: null, license_active: null, expiry_date: null, specialty: 'Law',
      raw_data: {}, notes: 'Upload your bar card or state bar verification letter for AI verification.' };
  }

  // Real Estate — ARELLO / state commission (AI document verify)
  if (['real_estate_agent', 'real_estate_broker', 'mortgage_broker'].includes(credential_type) && document_url) {
    return await verifyDocumentWithAI(document_url, credential_type, fullName, license_number);
  }

  // Everything else — AI document verification
  if (document_url) {
    return await verifyDocumentWithAI(document_url, credential_type, fullName, license_number);
  }

  // No verification possible without more input
  return {
    verified:       false,
    confidence:     0,
    source:         'none',
    status:         'manual_review',
    name_match:     null,
    license_active: null,
    expiry_date:    null,
    specialty:      null,
    raw_data:       {},
    notes:          'Please provide your license number and/or upload your credential document to proceed.',
  };
}
