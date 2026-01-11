// lib/utils/parameter-options.ts

/**
 * Gets specific select options based on test parameter code
 */
export function getParameterOptions(parameterCode: string): string[] {
  const code = parameterCode.toLowerCase().trim();
  // Stool Examination Parameters
  if (code.includes('color_stool') && code.includes('stool')) {
    return ['Brown', 'Black', 'Green', 'Yellow', 'Red', 'White', 'Clay-colored', 'Other'];
  }

  if (code.includes('consistency_stool') && code.includes('stool')) {
    return ['Formed', 'Soft', 'Loose', 'Watery', 'Semi-formed', 'Hard', 'Mucoid', 'Bloody'];
  }

  if (code.includes('odour_stool')) {
    return ['Offensive', 'Very Offensive', 'Foul-Smelling'];
  }

  if (code.includes('mucus_stool')) {
    return ['None', 'Scant', '+', '++', '+++', '++++'];
  }

  if (code.includes('starch_stool') ||
    code.includes('fat_stool') ||
    code.includes('vegetable_cells_stool') ||
    code.includes('muscle_fibers_stool') ||
    code.includes('reducing_substances')
  ) {
    return ['Absent', '+', '++', '+++', '++++'];
  }

  if (code.includes('blood_stool')) {
    return ['Absent', 'Present', 'Hematochezia', 'Amoebic Dysentery'];
  }

  if (code.includes('parasite_stool')) {
    return ['NIL', 'Present'];
  }

  // Urine Examination Parameters
  if (code.includes('color_urine') && code.includes('urine')) {
    return ['Clear', 'Pale Yellow', 'Dark Yellow', 'Green', 'Orange', 'Red', 'Brown', 'Amber', 'Cloudy'];
  }

  if (code.includes('appearance_urine') && code.includes('urine')) {
    return ['Clear', 'Slightly Cloudy', 'Cloudy', 'Turbid', 'Hazy'];
  }

  if (code.includes('deposit_urine') && code.includes('urine')) {
    return ['Absent', 'Negative', 'Trace', '+', '++', '+++', '++++'];
  }

  if (code.includes('reaction_urine')) {
    return ['Acidic', 'Neutral', 'Alkaline'];
  }

  if (code.includes('specificgravity_urine')) {
    return ['-', '1.005', '1.010', '1.015', '1.020', '1.025', '1.030', '1.035'];
  }

  if (code.includes('ascorbicacid_urine') ||
    code.includes('bilirubin_urine') ||
    code.includes('ketones_urine')
  ) {
    return ['-', 'Negative', '+', ' ++', '+++'];
  }

  if (code.includes('blood_urine')) {
    return ['-', 'Negative', 'ca. 5–10', 'ca. 50 ', 'ca. 250'];
  }

  if (code.includes('glucose_urine')) {
    return ['-', 'Negative', 'Normal', '50', '150', '500', '≥1000'];
  }

  if (code.includes('leucocytes_urine')) {
    return ['-', 'Negative', 'ca. 25', 'ca. 75', 'ca. 500'];
  }

  if (code.includes('nitrite_urine')) {
    return ['-', 'Negative', 'Positive'];
  }

  if (code.includes('protein_urine')) {
    return ['-', 'Negative', '30', '100', '500'];
  }

  if (code.includes('urobilinogen_urine')) {
    return ['-', 'Normal', '2', '4', '8', '12'];
  }

  if (code.includes('epithelialcells_urine')) {
    return ['NIL', 'Normal: 0–5', 'Slightly elevated: 6–15', 'Abnormal: More than 15'];
  }

  if (code.includes('epithelialcells_urine')) {
    return ['NIL', 'Normal: 0–5', 'Slightly elevated: 6–15', 'Abnormal: More than 15'];
  }

  // Hematology Parameters
  if (code.includes('bloodgroup')) {
    return ['A +ve', 'A -ve', 'B +ve', 'B -ve', 'AB +ve', 'AB -ve', 'O +ve', 'O -ve', '--'];
  }

  if
    (code.includes('rhfactor') ||
    code.includes('drugs') ||
    code.includes('virus') ||
    code.includes('negative')
  ) {
    return ['--', 'Positive', 'Negative', 'Equivocal'];
  }

  // Microbiology Parameters
  if (code.includes('culture')) {
    return ['No Growth', 'Scanty Growth', 'Moderate Growth', 'Heavy Growth', 'Mixed Growth'];
  }

  if (code.includes('sensitivity')) {
    return ['Sensitive', 'Resistant', 'Intermediate'];
  }

  // Semen Analysis Parameters
  if (code.includes('viscosity')) {
    return ['Normal', 'Increased', 'High', 'Decreased'];
  }

  if (code.includes('liquefaction')) {
    return ['Complete', 'Incomplete', 'Delayed'];
  }

  // Common qualitative parameters
  if (code.includes('reaction') || code.includes('ph')) {
    return ['Acidic', 'Neutral', 'Alkaline'];
  }

  if (code.includes('blood')) {
    return ['Negative', 'Positive', 'Occult Positive'];
  }

  // Default options for common test types
  if (code.includes('present') || code.includes('detected')) {
    return ['--', 'Present', 'Absent', 'Not Detected', 'Detected'];
  }

  if (code.includes('reactive')) {
    return ['Reactive', 'Non-reactive', 'Weakly Reactive'];
  }

  if (code.includes('positive')) {
    return ['Positive', 'Negative', 'Weak Positive'];
  }

  return [];
}

/**
 * Gets parameter-specific placeholder text
 */
export function getParameterPlaceholder(parameterCode: string): string {
  const code = parameterCode.toLowerCase().trim();

  if (code.includes('color')) return 'Select color';
  if (code.includes('consistency')) return 'Select consistency';
  if (code.includes('appearance')) return 'Select appearance';
  if (code.includes('reaction')) return 'Select reaction';

  return 'Select result';
}

/**
 * Checks if a parameter should use the code-specific dropdown
 */
export function shouldUseParameterDropdown(parameterCode: string): boolean {
  return getParameterOptions(parameterCode).length > 0;
}