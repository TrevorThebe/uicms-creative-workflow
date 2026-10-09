import { DepartmentId, QACheckItem } from '../types';
import { getRequestTypeConfig } from './briefSchemas';

export interface QATemplateSection {
  title: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

export function generateInitialQAChecklist(
  projectId: string,
  versionId: string,
  departmentId: DepartmentId,
  requestTypeId: string
): QACheckItem[] {
  const reqConfig = getRequestTypeConfig(requestTypeId);

  const baseItems: Array<{ id: string; title: string; desc: string }> = [
    { id: 'client_check', title: 'Correct Client & Sub-brand Entity', desc: 'Verified client logo, correct brand variant, and co-branding guidelines.' },
    { id: 'brief_match', title: 'Content Verbatim Matches Brief', desc: 'All copy, headlines, disclaimers and text blocks match the approved brief verbatim.' },
    { id: 'typography', title: 'Correct Fonts & Typographic Hierarchy', desc: 'Approved corporate fonts, weights, tracking and line heights strictly adhered to.' },
    { id: 'ci_colours', title: 'Brand CI Colours & Contrast Check', desc: 'Exact Pantone / CMYK / Hex palettes used; passes WCAG AA contrast standards.' },
    { id: 'dimensions_format', title: 'Correct Dimensions & Output Format', desc: 'Canvas pixel/print dimensions, bleed (if applicable), and file format verified.' },
    { id: 'spelling_grammar', title: 'Spelling, Grammar & Name Accuracy', desc: 'Zero spelling errors; executive, speaker, or attendee names verified against source.' },
    { id: 'links_cta', title: 'URLs, QR Codes & Call-to-Action Validation', desc: 'All hyperlinks, QR codes, dialing codes, and CTA triggers verified functional.' },
    { id: 'version_naming', title: 'File Naming & Version Conventions', desc: 'Naming strictly conforms to SOP standards (e.g., PRJ_Client_V1.0_Final.ext).' },
  ];

  const specificItems = (reqConfig?.defaultQaItems || []).map((itemStr, idx) => ({
    id: `spec_${idx}`,
    title: itemStr,
    desc: 'Department and request-type specific quality check requirement.',
  }));

  const combined = [...baseItems, ...specificItems];

  return combined.map((item, idx) => ({
    id: `qa_${versionId}_${item.id || idx}`,
    projectId,
    versionId,
    title: item.title,
    description: item.desc,
    checked: false,
    notes: '',
  }));
}

export const generateQAChecklist = generateInitialQAChecklist;
