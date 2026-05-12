import personasIndex from '../data/personas/index.json';

import riskManager from '../data/personas/risk-manager-tier1.json';
import productOwner from '../data/personas/product-owner-challenger.json';
import internalAuditor from '../data/personas/internal-auditor.json';
import fca from '../data/personas/fca-supervision.json';
import govSro from '../data/personas/government-sro.json';
import gds from '../data/personas/gds-assessor.json';
import techRisk from '../data/personas/tech-risk-director.json';
import nhsDm from '../data/personas/delivery-manager-nhs.json';

const prebuilt = {
  'risk-manager-tier1': riskManager,
  'product-owner-challenger': productOwner,
  'internal-auditor': internalAuditor,
  'fca-supervision': fca,
  'government-sro': govSro,
  'gds-assessor': gds,
  'tech-risk-director': techRisk,
  'delivery-manager-nhs': nhsDm
};

export const STORAGE_KEY = 'agilefocus_custom_personas';

export function getPrebuiltPersonas() {
  return Object.values(prebuilt);
}

export function getPrebuiltPersona(id) {
  return prebuilt[id] || null;
}

export function getCustomPersonas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCustomPersona(persona) {
  const custom = getCustomPersonas().filter(p => p.id !== persona.id);
  custom.push(persona);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch {}
  return custom;
}

export function deleteCustomPersona(id) {
  const custom = getCustomPersonas().filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch {}
  return custom;
}

export function generatePersonaId(name) {
  return 'custom-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
}
