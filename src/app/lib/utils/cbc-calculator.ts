
/**
 * Interface representing the measured CBC input values.
 */
export interface CBCInput {
    wbc: number;          // White Blood Cells (10^3/µL)
    rbc: number;          // Red Blood Cells (10^6/µL)
    hgb: number;          // Hemoglobin (g/dL)
    hct?: number;         // Hematocrit (%) - optional, can be calculated
    plt: number;          // Platelets (10^3/µL)

    // Differential Percentages (%)
    neutrophilsPercent: number;
    lymphocytesPercent: number;
    monocytesPercent: number;
    eosinophilsPercent: number;
    basophilsPercent: number;

    // RBC Indices (Measured or Input)
    mcv?: number;         // Mean Corpuscular Volume (fL)

    // Platelet Indices
    mpv?: number;         // Mean Platelet Volume (fL) - optional, used for PCT
}

/**
 * Interface representing the full CBC result including calculated values.
 */
export interface CBCResult extends CBCInput {
    // Calculated Red Cell Indices
    hct: number;
    mch: number;          // Mean Corpuscular Hemoglobin (pg)
    mchc: number;         // Mean Corpuscular Hemoglobin Concentration (g/dL)

    // Calculated Absolute Counts (10^3/µL)
    neutrophilsAbsolute: number;
    lymphocytesAbsolute: number;
    monocytesAbsolute: number;
    eosinophilsAbsolute: number;
    basophilsAbsolute: number;

    // Calculated Platelet Indices
    pct?: number;         // Plateletcrit (%)
}

/**
 * Calculates derived CBC parameters from measured inputs.
 * 
 * @param input The measured CBC values.
 * @returns The full object containing both input and calculated values.
 */
export function calculateCBCParameters(input: CBCInput): CBCResult {
    const result = { ...input } as CBCResult;

    // 1. RBC Indices Calculations
    // HCT = (RBC * MCV) / 10
    if (!result.hct && result.mcv && result.rbc) {
        result.hct = parseFloat(((result.rbc * result.mcv) / 10).toFixed(1));
    }

    // MCH = (Hgb / RBC) * 10
    if (result.rbc > 0) {
        result.mch = parseFloat(((result.hgb / result.rbc) * 10).toFixed(1));
    }

    // MCHC = (Hgb / HCT) * 100
    if (result.hct && result.hct > 0) {
        result.mchc = parseFloat(((result.hgb / result.hct) * 100).toFixed(1));
    }

    // 2. Absolute Differential Counts Calculations
    // Absolute = (Percentage * WBC) / 100
    result.neutrophilsAbsolute = parseFloat(((input.neutrophilsPercent * input.wbc) / 100).toFixed(2));
    result.lymphocytesAbsolute = parseFloat(((input.lymphocytesPercent * input.wbc) / 100).toFixed(2));
    result.monocytesAbsolute = parseFloat(((input.monocytesPercent * input.wbc) / 100).toFixed(2));
    result.eosinophilsAbsolute = parseFloat(((input.eosinophilsPercent * input.wbc) / 100).toFixed(2));
    result.basophilsAbsolute = parseFloat(((input.basophilsPercent * input.wbc) / 100).toFixed(2));

    // 3. Platelet Indices Calculations
    // PCT = (PLT * MPV) / 10000
    if (input.mpv && input.plt) {
        result.pct = parseFloat(((input.plt * input.mpv) / 10000).toFixed(2));
    }

    return result;
}

/**
 * Helper to get display units and ranges for calculated parameters.
 * Useful for filling out report templates.
 */
export const CBC_REFERENCE_RANGES = {
    neutrophilsAbsolute: { unit: '10^3/µL', min: 1.8, max: 7.7 },
    lymphocytesAbsolute: { unit: '10^3/µL', min: 1.0, max: 4.8 },
    monocytesAbsolute: { unit: '10^3/µL', min: 0.2, max: 0.95 },
    eosinophilsAbsolute: { unit: '10^3/µL', min: 0.0, max: 0.5 },
    basophilsAbsolute: { unit: '10^3/µL', min: 0.0, max: 0.2 },
    pct: { unit: '%', min: 0.10, max: 0.28 },
    hct: { unit: '%', min: 40, max: 54 }, // Adult variable
    mch: { unit: 'pg', min: 27, max: 33 },
    mchc: { unit: 'g/dL', min: 32, max: 36 }
};
