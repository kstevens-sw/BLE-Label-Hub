import { STORAGE_KEYS } from './constants.js';
import {
  listDesignEntries,
  upsertDesignMetadata,
  removeDesignMetadata,
  designRecordExists,
  removeLegacyDesign,
  readLegacyDesigns,
} from './design-store.js';
import {
  putDesignRecord,
  getDesignRecord,
  deleteDesignRecord as deleteDesignPayload,
} from './design-db.js';

const MULTI_LABEL_PRESETS_KEY = STORAGE_KEYS.MULTI_LABEL_PRESETS;

/**
 * Save a design to localStorage
 * @param {string} name - Design name
 * @param {object} design - { elements: [], labelSize: { width, height } }
 */
export async function saveDesign(name, design) {
  if (!name || !name.trim()) {
    throw new Error('Design name is required');
  }

  const trimmed = name.trim();
  const record = {
    ...design,
    savedAt: Date.now(),
  };

  try {
    await putDesignRecord(trimmed, record);
  } catch (error) {
    console.error('Failed to save design payload:', error);
    throw new Error('Could not save design. Browser storage may be full or blocked.');
  }

  upsertDesignMetadata(trimmed, record);
  removeLegacyDesign(trimmed);

  return true;
}

/**
 * Load a design from localStorage
 * @param {string} name - Design name
 * @returns {object|null} - { elements: [], labelSize: { width, height }, savedAt: number }
 */
export async function loadDesign(name) {
  const trimmed = name?.trim?.();
  if (!trimmed) return null;

  try {
    const record = await getDesignRecord(trimmed);
    if (record) return record;
  } catch (error) {
    console.error('Failed to load design payload:', error);
  }

  const legacyDesigns = readLegacyDesigns();
  return legacyDesigns[trimmed] || null;
}

/**
 * Get list of saved design names with metadata
 * @returns {Array} - [{ name, savedAt, labelSize, elementCount, isTemplate, templateDataCount, isMultiLabel }]
 */
export function listDesigns() {
  return listDesignEntries();
}

/**
 * Delete a design from localStorage
 * @param {string} name - Design name
 */
export async function deleteDesign(name) {
  const trimmed = name?.trim?.();
  if (!trimmed) return false;

  try {
    await deleteDesignPayload(trimmed);
  } catch (error) {
    console.error('Failed to delete design payload:', error);
  }

  removeDesignMetadata(trimmed);
  removeLegacyDesign(trimmed);
  return true;
}

/**
 * Check if a design name exists
 * @param {string} name - Design name
 */
export function designExists(name) {
  return designRecordExists(name);
}

/**
 * Import design from JSON string
 * @param {string} jsonString - JSON data
 * @param {string} overrideName - Optional name override
 * @returns {object} - { name, hasTemplateData, hasMultiLabel }
 */
export async function importDesign(jsonString, overrideName = null) {
  try {
    const data = JSON.parse(jsonString);

    if (!data.elements || !Array.isArray(data.elements)) {
      throw new Error('Invalid design format: missing elements');
    }

    if (!data.labelSize || typeof data.labelSize.width !== 'number') {
      throw new Error('Invalid design format: missing label size');
    }

    const name = overrideName || data.name || `Imported ${new Date().toLocaleString()}`;

    const designData = {
      elements: data.elements,
      labelSize: data.labelSize,
    };

    // Import template data if present
    if (data.isTemplate) {
      designData.isTemplate = true;
    }
    if (data.templateFields && Array.isArray(data.templateFields)) {
      designData.templateFields = data.templateFields;
    }
    if (data.templateData && Array.isArray(data.templateData)) {
      designData.templateData = data.templateData;
    }

    // Import multi-label configuration if present
    if (data.multiLabel && typeof data.multiLabel === 'object') {
      designData.multiLabel = {
        enabled: data.multiLabel.enabled || false,
        labelWidth: data.multiLabel.labelWidth || 10,
        labelHeight: data.multiLabel.labelHeight || 20,
        labelsAcross: data.multiLabel.labelsAcross || 4,
        gapMm: data.multiLabel.gapMm || 2,
        cloneMode: data.multiLabel.cloneMode !== false, // Default to true
      };
    }

    await saveDesign(name, designData);

    return {
      name,
      hasTemplateData: (data.templateData?.length || 0) > 0,
      templateDataCount: data.templateData?.length || 0,
      hasMultiLabel: data.multiLabel?.enabled || false,
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw e;
  }
}

// =============================================================================
// MULTI-LABEL PRESETS
// =============================================================================

/**
 * Get all saved multi-label presets from localStorage
 * @returns {object} - { presetName: { labelWidth, labelHeight, labelsAcross, gapMm }, ... }
 */
export function getMultiLabelPresets() {
  try {
    const data = localStorage.getItem(MULTI_LABEL_PRESETS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to load multi-label presets:', e);
    return {};
  }
}

/**
 * Save a multi-label preset
 * @param {string} name - Preset name
 * @param {object} config - { labelWidth, labelHeight, labelsAcross, gapMm }
 */
export function saveMultiLabelPreset(name, config) {
  if (!name || !name.trim()) {
    throw new Error('Preset name is required');
  }

  const presets = getMultiLabelPresets();
  presets[name.trim()] = {
    labelWidth: config.labelWidth,
    labelHeight: config.labelHeight,
    labelsAcross: config.labelsAcross,
    gapMm: config.gapMm,
  };

  try {
    localStorage.setItem(MULTI_LABEL_PRESETS_KEY, JSON.stringify(presets));
    return true;
  } catch (e) {
    console.error('Failed to save multi-label preset:', e);
    throw new Error('Failed to save preset');
  }
}

/**
 * Delete a multi-label preset
 * @param {string} name - Preset name
 */
export function deleteMultiLabelPreset(name) {
  const presets = getMultiLabelPresets();
  if (!(name in presets)) {
    return false;
  }

  delete presets[name];
  try {
    localStorage.setItem(MULTI_LABEL_PRESETS_KEY, JSON.stringify(presets));
    return true;
  } catch (e) {
    console.error('Failed to delete multi-label preset:', e);
    return false;
  }
}
