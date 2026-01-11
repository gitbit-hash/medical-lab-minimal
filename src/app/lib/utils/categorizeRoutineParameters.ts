import { TestParameter } from '.././../types'; // Adjust import path as needed

// Define the return type interface
interface CategorizedParameters {
  physical: TestParameter[];
  chemical: TestParameter[];
  microscopic: TestParameter[];
  hematology: TestParameter[];
  differential: TestParameter[];
}

// Function to categorize parameters for Urine/Stool routine
export const categorizeRoutineParameters = (parameters: TestParameter[]): CategorizedParameters => {
  const sections: CategorizedParameters = {
    physical: [],
    chemical: [],
    microscopic: [],
    hematology: [],
    differential: [],
  };

  parameters.forEach(param => {
    const paramCode = param.code.toLowerCase();

    // Physical Examination parameters
    if (
      // Stool
      paramCode.includes('color_stool') ||
      paramCode.includes('consistency_stool') ||
      paramCode.includes('odour_stool') ||
      paramCode.includes('mucus_stool') ||
      paramCode.includes('blood_stool') ||
      paramCode.includes('parasite_stool') ||
      // Urine
      paramCode.includes('color_urine') ||
      paramCode.includes('appearance_urine') ||
      paramCode.includes('deposit_urine') ||
      paramCode.includes('specificgravity_urine') ||
      paramCode.includes('consistency') ||
      paramCode.includes('colour')
    ) {
      sections.physical.push(param);
    }
    // Chemical Examination parameters
    else if (
      paramCode.includes('reducing_substances_stool') ||
      paramCode.includes('occult_blood_stool') ||
      paramCode.includes('reaction_urine') ||
      paramCode.includes('ascorbicacid_urine') ||
      paramCode.includes('blood_urine') ||
      paramCode.includes('glucose_urine') ||
      paramCode.includes('ketones_urine') ||
      paramCode.includes('leucocytes_urine') ||
      paramCode.includes('nitrite_urine') ||
      paramCode.includes('protein_urine') ||
      paramCode.includes('urobilinogen_urine')
    ) {
      sections.chemical.push(param);
    }

    // Microscopic Examination parameters
    else if (
      // Stool
      paramCode.includes('wbcs_stool') ||
      paramCode.includes('rbcs_stool') ||
      paramCode.includes('ova_stool') ||
      paramCode.includes('cysts_stool') ||
      paramCode.includes('starch_stool') ||
      paramCode.includes('fat_stool') ||
      paramCode.includes('vegetable_cells_stool') ||
      paramCode.includes('muscle_fibers_stool') ||
      paramCode.includes('parasites_stool') ||
      paramCode.includes('other_findings_stool') ||
      // Urine

      paramCode.includes('epithelialcells_urine') ||
      paramCode.includes('puscells') ||
      paramCode.includes('rbc') ||
      paramCode.includes('crystals') ||
      paramCode.includes('casts') ||
      paramCode.includes('yeast') ||
      paramCode.includes('bacteria')
    ) {
      sections.microscopic.push(param);
    }

    else if (
      paramCode.includes('hb') || paramCode.includes('hemoglobin') ||
      paramCode.includes('red_count') || paramCode.includes('red') && !paramCode.includes('urine') ||
      paramCode.includes('wbc_count') || paramCode.includes('wbc') && !paramCode.includes('urine') ||
      paramCode.includes('platelet') || paramCode.includes('plt') ||
      paramCode.includes('hct') || paramCode.includes('hematocrit') ||
      paramCode.includes('mcv') || paramCode.includes('mpv') ||
      paramCode.includes('mch') || paramCode.includes('pdw') ||
      paramCode.includes('mchc') || paramCode.includes('pct') ||
      paramCode.includes('rdw')

    ) {
      sections.hematology.push(param);
    }

    else if (
      paramCode.includes('neut') ||
      paramCode.includes('lymph') ||
      paramCode.includes('mcytes') ||
      paramCode.includes('esphls') ||
      paramCode.includes('baso')
    ) {
      sections.differential.push(param);
    }
    // Default to chemical if not specifically categorized
    else {
      sections.chemical.push(param);
    }
  });

  return sections;
};