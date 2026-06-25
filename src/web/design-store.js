import { STORAGE_KEYS } from './constants.js';
import { safeStorageGet, safeStorageSet } from './utils/errors.js';

const DESIGN_INDEX_KEY = 'unified_ble_design_index';
const LEGACY_STORAGE_KEY = STORAGE_KEYS.DESIGNS;

function readJsonObject(key) {
  const raw = safeStorageGet(key);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error(`Failed to read ${key}:`, e);
    return {};
  }
}

function writeJsonObject(key, value) {
  return safeStorageSet(key, JSON.stringify(value));
}

function makeSummary(name, design) {
  return {
    name,
    savedAt: design.savedAt,
    labelSize: design.labelSize,
    elementCount: design.elements?.length || 0,
    isTemplate: design.isTemplate || false,
    templateFieldCount: design.templateFields?.length || 0,
    templateDataCount: design.templateData?.length || 0,
    hasImages: design.elements?.some((el) => el.type === 'image') || false,
    isMultiLabel: design.multiLabel?.enabled || false,
    multiLabel: design.multiLabel || null,
  };
}

export function readLegacyDesigns() {
  return readJsonObject(LEGACY_STORAGE_KEY);
}

export function writeLegacyDesigns(designs) {
  return writeJsonObject(LEGACY_STORAGE_KEY, designs);
}

export function removeLegacyDesign(name) {
  const trimmed = name?.trim?.();
  if (!trimmed) return false;
  const designs = readLegacyDesigns();
  if (!(trimmed in designs)) return false;
  delete designs[trimmed];
  return writeLegacyDesigns(designs);
}

export function readDesignIndex() {
  return readJsonObject(DESIGN_INDEX_KEY);
}

export function upsertDesignMetadata(name, design) {
  const trimmed = name?.trim?.();
  if (!trimmed) return false;
  const index = readDesignIndex();
  index[trimmed] = makeSummary(trimmed, design);
  return writeJsonObject(DESIGN_INDEX_KEY, index);
}

export function removeDesignMetadata(name) {
  const trimmed = name?.trim?.();
  if (!trimmed) return false;
  const index = readDesignIndex();
  if (!(trimmed in index)) return true;
  delete index[trimmed];
  return writeJsonObject(DESIGN_INDEX_KEY, index);
}

export function listDesignEntries() {
  const entries = new Map();

  const index = readDesignIndex();
  for (const [name, summary] of Object.entries(index)) {
    entries.set(name, { ...summary, name });
  }

  const legacy = readLegacyDesigns();
  for (const [name, design] of Object.entries(legacy)) {
    if (entries.has(name) || !design || typeof design !== 'object') continue;
    entries.set(name, makeSummary(name, design));
  }

  return Array.from(entries.values()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

export function designRecordExists(name) {
  const trimmed = name?.trim?.();
  if (!trimmed) return false;
  const index = readDesignIndex();
  if (trimmed in index) return true;
  const legacy = readLegacyDesigns();
  return trimmed in legacy;
}
