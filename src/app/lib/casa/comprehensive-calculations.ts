// lib/casa/comprehensive-calculations.ts
export interface CASAComprehensiveInput {
  // Basic Collection Data
  collection_date: Date;
  abstinenceDays: number;
  collectionMethod: string;
  collectionComplete: boolean;

  // Physical Parameters
  volumeMl: number;
  appearance: string;
  viscosity: string;
  liquefactionTimeMin: number;
  ph: number;

  // Concentration Parameters
  spermCounted: number;
  dilutionFactor: number;
  chamberType: 'Makler' | 'Neubauer' | 'Microcell' | 'Other';
  chamberDepth: number; // in mm

  // Motility Counts
  gradeACount: number;  // Rapid progressive
  gradeBCount: number;  // Slow progressive
  gradeCCount: number;  // Non-progressive
  gradeDCount: number;  // Immotile

  // Morphology Counts (200 sperm minimum)
  normalForms: number;
  headDefects: {
    large: number;
    small: number;
    tapered: number;
    pyriform: number;
    round: number;
    amorphous: number;
    vacuolated: number;
    double: number;
  };
  midpieceDefects: {
    bent: number;
    thick: number;
    thin: number;
    irregular: number;
    absent: number;
  };
  tailDefects: {
    bent: number;
    coiled: number;
    short: number;
    multiple: number;
    broken: number;
  };
  cytoplasmicDroplets: number;

  // Vitality Counts
  liveSperm: number;
  deadSperm: number;

  // Leukocyte Counts
  leukocytesCounted: number;
  roundCellsCounted: number;

  // MAR Test Results
  marIgGBound: number;
  marIgATotal: number;

  vcl?: number;
  vsl?: number;
  vap?: number;
  lin?: number;
  str?: number;
  wob?: number;
  alh?: number;
  bcf?: number;

  // Biochemical Results
  fructoseMgPerDl?: number;
  zincUgPerMl?: number;
  acidPhosphataseUPerMl?: number;
  alphaGlucosidaseMuPerMl?: number;
}

export interface CASAComprehensiveResults {
  // ========== SUMMARY ==========
  summary: {
    whoClassification: string;
    fertilityPotential: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
    naturalConceptionProbability: string;
    iuiSuitability: string;
    icsiRecommendation: boolean;
  };

  // ========== BASIC PARAMETERS ==========
  basicParameters: {
    volume: { value: number; unit: string; status: 'Normal' | 'Low' | 'High' };
    appearance: string;
    viscosity: string;
    liquefactionTime: { value: number; unit: string; status: string };
    ph: { value: number; status: string };
    abstinenceDays: number;
  };

  // ========== CONCENTRATION PARAMETERS ==========
  concentration: {
    concentration: { value: number; unit: string; status: string };
    totalSpermNumber: { value: number; unit: string; status: string };
    oligozoospermiaGrade: 'Mild' | 'Moderate' | 'Severe' | 'None';
  };

  // ========== MOTILITY PARAMETERS ==========
  motility: {
    totalMotility: { value: number; unit: string; status: string };
    progressiveMotility: { value: number; unit: string; status: string };
    nonProgressive: { value: number; unit: string, status: string };
    immotile: { value: number; unit: string, status: string };

    // Grade Distribution
    gradeA: { value: number; unit: string; ideal: '>= 25%' };
    gradeB: { value: number; unit: string; };
    gradeC: { value: number; unit: string; ideal: '<= 20%' };
    gradeD: { value: number; unit: string; ideal: '<= 5%' };

    asthenozoospermiaGrade: 'Mild' | 'Moderate' | 'Severe' | 'None';
  };

  // ========== KINETIC PARAMETERS ==========
  kinetics: {
    vcl: { value: number; unit: string; reference: '>= 25 µm/s' };
    vsl: { value: number; unit: string; reference: '>= 20 µm/s' };
    vap: { value: number; unit: string; reference: '>= 22 µm/s' };
    lin: { value: number; unit: string; reference: '>= 50%' };
    str: { value: number; unit: string; reference: '>= 75%' };
    wob: { value: number; unit: string; reference: '>= 80%' };
    alh: { value: number; unit: string; reference: '2.5-7.0 µm' };
    bcf: { value: number; unit: string; reference: '10-16 Hz' };

    hyperactiveSperm: { value: number; unit: string; reference: '>= 5%' };
    velocityCategories: {
      rapid: number;
      medium: number;
      slow: number;
      static: number;
    };
  };

  // ========== MORPHOLOGY PARAMETERS ==========
  morphology: {
    normalForms: { value: number; unit: string; status: string };
    abnormalForms: { value: number; unit: string };

    // Defect Distribution
    headDefects: {
      total: number;
      largeHeads: number;
      smallHeads: number;
      tapered: number;
      pyriform: number;
      round: number;
      amorphous: number;
      vacuolated: number;
      doubleHeads: number;
    };

    midpieceDefects: {
      total: number;
      bent: number;
      thick: number;
      thin: number;
      irregular: number;
      absent: number;
    };

    tailDefects: {
      total: number;
      bent: number;
      coiled: number;
      short: number;
      multiple: number;
      broken: number;
    };

    cytoplasmicDroplets: { value: number; unit: string; reference: '≤0.5%' };

    // Indices
    teratozoospermiaIndex: number; // TZI = (cH + cM + cT)/cN
    multipleAnomalyIndex: number; // MAI = Total defects / Total sperm
    spermDeformityIndex: number; // SDI

    teratozoospermiaGrade: 'Mild' | 'Moderate' | 'Severe' | 'None';
  };

  // ========== VITALITY PARAMETERS ==========
  vitality: {
    liveSperm: { value: number; unit: string; status: string };
    deadSperm: { value: number; unit: string };
    necrozoospermia: boolean; // >50% dead sperm

    // HOS Test Results (if available)
    hosPositive?: { value: number; unit: string; reference: '>= 60%' };
    hosNegative?: { value: number; unit: string };
  };

  // ========== LEUKOCYTE & NON-SPERM CELLS ==========
  nonSpermCells: {
    leukocytes: { value: number; unit: string; status: string };
    roundCells: { value: number; unit: string };
    pyospermia: boolean; // >1×10⁶ leukocytes/mL

    // Additional cells
    epithelialCells: string; // Few, Moderate, Many
    macrophages: number;
    germCells: number;
  };

  // ========== IMMUNOLOGICAL PARAMETERS ==========
  immunology: {
    marTestIgG: { value: number; unit: string; status: string };
    marTestIgA: { value: number; unit: string };
    immunoinfertility: boolean; // >50% bound

    // Immunobead Test (if available)
    ibtResult?: { value: number; unit: string; reference: '<20%' };
    bindingPattern?: string; // Head, Tail, Mixed
  };

  // ========== BIOCHEMICAL PARAMETERS ==========
  biochemistry: {
    fructose?: { value: number; unit: string; reference: '>= 120 mg/dL' };
    zinc?: { value: number; unit: string; reference: '>= 80 µg/mL' };
    acidPhosphatase?: { value: number; unit: string; reference: '>= 200 U/mL' };
    alphaGlucosidase?: { value: number; unit: string; reference: '>= 20 mU/mL' };

    accessoryGlandFunction: 'Normal' | 'Possible Obstruction' | 'Secretory Dysfunction';
  };

  // ========== SPERM FUNCTION TESTS ==========
  functionTests: {
    dnaFragmentation?: { value: number; unit: string; reference: '<30%' };
    oxidativeStress?: { value: number; unit: string; reference: '<20×10³ cpm' };
    acrosomeReaction?: { value: number; unit: string; reference: '>= 15% induced' };

    functionalCompetence: 'Adequate' | 'Impaired' | 'Severely Impaired';
  };

  // ========== QUALITY CONTROL ==========
  qualityControl: {
    spermCounted: number;
    duplicateVariation: number; // %
    technician: string;
    analysisTime: number; // minutes
    chamberUsed: string;
    magnification: string;
    meetsWhoCriteria: boolean;
  };

  // ========== CLINICAL INTERPRETATION ==========
  interpretation: {
    primaryDiagnosis: string;
    secondaryFindings: string[];
    pathophysiology: string[]; // Possible causes
    clinicalCorrelation: string;

    // Treatment Recommendations
    lifestyleRecommendations: string[];
    medicalTherapies: string[];
    surgicalOptions: string[];
    assistedReproduction: {
      timingIntercourse: boolean;
      iui: boolean;
      ivf: boolean;
      icsi: boolean;
      tese: boolean;
    };

    // Follow-up
    repeatTesting: string;
    partnerEvaluation: string;
    geneticTesting: string[];
  };
}

export class ComprehensiveCASAProcessor {
  // WHO 2021 Reference Values (6th Edition)
  private static WHO_REFERENCE_VALUES = {
    volume: { min: 1.4, unit: 'mL' },
    concentration: { min: 16, unit: 'million/mL' },
    totalSpermNumber: { min: 39, unit: 'million' },
    totalMotility: { min: 42, unit: '%' },
    progressiveMotility: { min: 30, unit: '%' },
    normalForms: { min: 4, unit: '%' },
    vitality: { min: 54, unit: '%' },
    ph: { min: 7.2, max: 8.0 },
    liquefactionTime: { max: 60, unit: 'minutes' },
    leukocytes: { max: 1.0, unit: 'million/mL' },
    marTest: { max: 50, unit: '%' },
    fructose: { min: 120, unit: 'mg/dL' as const },
    zinc: { min: 80, unit: 'µg/mL' as const },
    acidPhosphatase: { min: 200, unit: 'U/mL' as const },
    alphaGlucosidase: { min: 20, unit: 'mU/mL' as const }
  };

  // Chamber Factors (sperm counted × dilution × factor = concentration/mL)
  private static CHAMBER_CONVERSION_FACTORS = {
    'Makler': { area: 1.0, depth: 0.01, factor: 0.1 }, // 0.1 µL volume per grid
    'Neubauer': { area: 0.0025, depth: 0.1, factor: 0.1 }, // 0.1 mm depth
    'Microcell': { area: 0.01, depth: 0.02, factor: 0.02 }, // 20 µm depth
    'Other': { area: 0.01, depth: 0.02, factor: 1 }
  };

  // Kinetic Reference Ranges (WHO 2021)
  private static KINETIC_REFERENCE_RANGES = {
    vcl: { min: 25, ideal: 35, unit: 'µm/s' as const },
    vsl: { min: 20, ideal: 25, unit: 'µm/s' as const },
    vap: { min: 22, ideal: 28, unit: 'µm/s' as const },
    lin: { min: 50, ideal: 65, unit: '%' as const },
    str: { min: 75, ideal: 85, unit: '%' as const },
    wob: { min: 80, ideal: 90, unit: '%' as const },
    alh: { min: 2.5, max: 7.0, unit: 'µm' as const },
    bcf: { min: 10, max: 16, unit: 'Hz' as const }
  } as const;

  static calculateComprehensiveResults(input: CASAComprehensiveInput): CASAComprehensiveResults {
    const chamber = this.CHAMBER_CONVERSION_FACTORS[input.chamberType] ||
      this.CHAMBER_CONVERSION_FACTORS.Other;

    // ========== CONCENTRATION CALCULATIONS ==========
    const concentrationMillionPerMl = this.calculateConcentration(
      input.spermCounted,
      input.dilutionFactor,
      chamber.factor
    );

    const totalSpermNumber = concentrationMillionPerMl * input.volumeMl;

    // ========== MOTILITY CALCULATIONS ==========
    const totalSperm = input.gradeACount + input.gradeBCount +
      input.gradeCCount + input.gradeDCount;

    const totalMotility = ((input.gradeACount + input.gradeBCount + input.gradeCCount) / totalSperm) * 100;
    const progressiveMotility = ((input.gradeACount + input.gradeBCount) / totalSperm) * 100;

    // ========== MORPHOLOGY CALCULATIONS ==========
    const totalMorphologySperm = input.normalForms +
      Object.values(input.headDefects).reduce((a, b) => a + b, 0) +
      Object.values(input.midpieceDefects).reduce((a, b) => a + b, 0) +
      Object.values(input.tailDefects).reduce((a, b) => a + b, 0);

    const normalFormsPercent = (input.normalForms / totalMorphologySperm) * 100;

    // Teratozoospermia Index (TZI)
    const headDefectScore = Object.values(input.headDefects).reduce((a, b) => a + b, 0);
    const midpieceDefectScore = Object.values(input.midpieceDefects).reduce((a, b) => a + b, 0);
    const tailDefectScore = Object.values(input.tailDefects).reduce((a, b) => a + b, 0);
    const tzi = (headDefectScore + midpieceDefectScore + tailDefectScore) / input.normalForms;

    // ========== VITALITY CALCULATIONS ==========
    const livePercent = (input.liveSperm / (input.liveSperm + input.deadSperm)) * 100;

    // ========== LEUKOCYTE CALCULATIONS ==========
    const leukocytesPerMl = this.calculateConcentration(
      input.leukocytesCounted,
      1, // Usually no dilution for leukocytes
      chamber.factor
    );

    // ========== KINETIC CALCULATIONS (if provided) ==========
    let kineticResults: CASAComprehensiveResults['kinetics'] = {
      vcl: { value: 0, unit: 'µm/s', reference: '>= 25 µm/s' as const },
      vsl: { value: 0, unit: 'µm/s', reference: '>= 20 µm/s' as const },
      vap: { value: 0, unit: 'µm/s', reference: '>= 22 µm/s' as const },
      lin: { value: 0, unit: '%', reference: '>= 50%' as const },
      str: { value: 0, unit: '%', reference: '>= 75%' as const },
      wob: { value: 0, unit: '%', reference: '>= 80%' as const },
      alh: { value: 0, unit: 'µm', reference: '2.5-7.0 µm' as const },
      bcf: { value: 0, unit: 'Hz', reference: '10-16 Hz' as const },
      hyperactiveSperm: { value: 0, unit: '%', reference: '>= 5%' as const },
      velocityCategories: { rapid: 0, medium: 0, slow: 0, static: 0 }
    };

    // If flat kinetic inputs are provided, use them
    if (input.vcl !== undefined) kineticResults.vcl.value = input.vcl;
    if (input.vsl !== undefined) kineticResults.vsl.value = input.vsl;
    if (input.vap !== undefined) kineticResults.vap.value = input.vap;

    // Calculate derived if VSL/VCL exist
    if (input.vcl !== undefined && input.vsl !== undefined) {
      kineticResults.lin.value = parseFloat(((input.vsl / input.vcl) * 100).toFixed(1));
    }

    if (input.vcl !== undefined && input.vap !== undefined) {
      kineticResults.wob.value = parseFloat(((input.vap / input.vcl) * 100).toFixed(1));
    }

    if (input.vsl !== undefined && input.vap !== undefined) {
      kineticResults.str.value = parseFloat(((input.vsl / input.vap) * 100).toFixed(1));
    }

    if (input.alh !== undefined) kineticResults.alh.value = input.alh;
    if (input.bcf !== undefined) kineticResults.bcf.value = input.bcf;

    // ========== BIOCHEMISTRY LOGIC ==========
    // Just pass through or validate against defaults
    const biochemistry: CASAComprehensiveResults['biochemistry'] = {
      fructose: input.fructoseMgPerDl ? {
        value: input.fructoseMgPerDl,
        unit: 'mg/dL',
        reference: '>= 120 mg/dL' as const
      } : undefined,
      zinc: input.zincUgPerMl ? {
        value: input.zincUgPerMl,
        unit: 'µg/mL',
        reference: '>= 80 µg/mL' as const
      } : undefined,
      acidPhosphatase: input.acidPhosphataseUPerMl ? {
        value: input.acidPhosphataseUPerMl,
        unit: 'U/mL',
        reference: '>= 200 U/mL' as const
      } : undefined,
      alphaGlucosidase: input.alphaGlucosidaseMuPerMl ? {
        value: input.alphaGlucosidaseMuPerMl,
        unit: 'mU/mL',
        reference: '>= 20 mU/mL' as const
      } : undefined,
      accessoryGlandFunction: this.assessAccessoryGlandFunction(
        input.volumeMl,
        input.ph,
        input.fructoseMgPerDl,
        input.zincUgPerMl
      )
    };

    // ========== CLASSIFICATION ==========
    const whoClassification = this.determineWHOClassification({
      concentration: concentrationMillionPerMl,
      totalMotility,
      progressiveMotility,
      normalForms: normalFormsPercent,
      totalSpermNumber
    });

    const asthenozoospermiaGrade = this.gradeAsthenozoospermia(totalMotility, progressiveMotility);
    const oligozoospermiaGrade = this.gradeOligozoospermia(concentrationMillionPerMl);
    const teratozoospermiaGrade = this.gradeTeratozoospermia(normalFormsPercent);

    // ========== INTERPRETATION ==========
    const interpretation = this.generateComprehensiveInterpretation({
      concentration: concentrationMillionPerMl,
      totalMotility,
      progressiveMotility,
      normalForms: normalFormsPercent,
      vitality: livePercent,
      leukocytes: leukocytesPerMl,
      marTest: input.marIgGBound,
      whoClassification,
      abstinenceDays: input.abstinenceDays,
      volume: input.volumeMl
    });

    return {
      summary: {
        whoClassification,
        fertilityPotential: this.assessFertilityPotential({
          concentration: concentrationMillionPerMl,
          totalMotility,
          normalForms: normalFormsPercent
        }),
        naturalConceptionProbability: this.estimateConceptionProbability({
          concentration: concentrationMillionPerMl,
          totalMotility,
          normalForms: normalFormsPercent
        }),
        iuiSuitability: this.assessIUISuitability({
          totalSpermNumber,
          totalMotility,
          normalForms: normalFormsPercent
        }),
        icsiRecommendation: this.recommendICSI({
          concentration: concentrationMillionPerMl,
          totalMotility,
          normalForms: normalFormsPercent
        })
      },

      basicParameters: {
        volume: {
          value: parseFloat(input.volumeMl.toFixed(2)),
          unit: 'mL',
          status: input.volumeMl >= 1.4 ? 'Normal' : 'Low'
        },
        appearance: input.appearance,
        viscosity: input.viscosity,
        liquefactionTime: {
          value: input.liquefactionTimeMin,
          unit: 'minutes',
          status: input.liquefactionTimeMin <= 60 ? 'Normal' : 'Prolonged'
        },
        ph: {
          value: parseFloat(input.ph.toFixed(1)),
          status: input.ph >= 7.2 && input.ph <= 8.0 ? 'Normal' : 'Abnormal'
        },
        abstinenceDays: input.abstinenceDays
      },

      concentration: {
        concentration: {
          value: parseFloat(concentrationMillionPerMl.toFixed(2)),
          unit: 'million/mL',
          status: concentrationMillionPerMl >= 16 ? 'Normal' : 'Low'
        },
        totalSpermNumber: {
          value: parseFloat(totalSpermNumber.toFixed(1)),
          unit: 'million',
          status: totalSpermNumber >= 39 ? 'Normal' : 'Low'
        },
        oligozoospermiaGrade
      },

      motility: {
        totalMotility: {
          value: parseFloat(totalMotility.toFixed(1)),
          unit: '%',
          status: totalMotility >= 42 ? 'Normal' : 'Low'
        },
        progressiveMotility: {
          value: parseFloat(progressiveMotility.toFixed(1)),
          unit: '%',
          status: progressiveMotility >= 30 ? 'Normal' : 'Low'
        },
        nonProgressive: {
          value: parseFloat(((input.gradeCCount / totalSperm) * 100).toFixed(1)),
          unit: '%',
          status: input.gradeCCount >= 30 ? 'High' : 'Normal '
        },
        immotile: {
          value: parseFloat(((input.gradeDCount / totalSperm) * 100).toFixed(1)),
          unit: '%',
          status: input.gradeDCount >= 10 ? 'High' : 'Normal'
        },
        gradeA: {
          value: parseFloat(((input.gradeACount / totalSperm) * 100).toFixed(1)),
          unit: '%',
          ideal: '>= 25%'
        },
        gradeB: {
          value: parseFloat(((input.gradeBCount / totalSperm) * 100).toFixed(1)),
          unit: '%'
        },
        gradeC: {
          value: parseFloat(((input.gradeCCount / totalSperm) * 100).toFixed(1)),
          unit: '%',
          ideal: '<= 20%'
        },
        gradeD: {
          value: parseFloat(((input.gradeDCount / totalSperm) * 100).toFixed(1)),
          unit: '%',
          ideal: '<= 5%'
        },
        asthenozoospermiaGrade
      },

      kinetics: kineticResults,
      biochemistry,
      morphology: {
        normalForms: {
          value: parseFloat(normalFormsPercent.toFixed(1)),
          unit: '%',
          status: normalFormsPercent >= 4 ? 'Normal' : 'Low'
        },
        abnormalForms: {
          value: parseFloat((100 - normalFormsPercent).toFixed(1)),
          unit: '%'
        },
        headDefects: {
          total: headDefectScore,
          largeHeads: input.headDefects.large,
          smallHeads: input.headDefects.small,
          tapered: input.headDefects.tapered,
          pyriform: input.headDefects.pyriform,
          round: input.headDefects.round,
          amorphous: input.headDefects.amorphous,
          vacuolated: input.headDefects.vacuolated,
          doubleHeads: input.headDefects.double
        },
        midpieceDefects: {
          total: midpieceDefectScore,
          bent: input.midpieceDefects.bent,
          thick: input.midpieceDefects.thick,
          thin: input.midpieceDefects.thin,
          irregular: input.midpieceDefects.irregular,
          absent: input.midpieceDefects.absent
        },
        tailDefects: {
          total: tailDefectScore,
          bent: input.tailDefects.bent,
          coiled: input.tailDefects.coiled,
          short: input.tailDefects.short,
          multiple: input.tailDefects.multiple,
          broken: input.tailDefects.broken
        },
        cytoplasmicDroplets: {
          value: parseFloat(((input.cytoplasmicDroplets / totalMorphologySperm) * 100).toFixed(1)),
          unit: '%',
          reference: '≤0.5%'
        },
        teratozoospermiaIndex: parseFloat(tzi.toFixed(2)),
        multipleAnomalyIndex: parseFloat(((headDefectScore + midpieceDefectScore + tailDefectScore) / totalMorphologySperm).toFixed(2)),
        spermDeformityIndex: parseFloat((tzi * (100 - normalFormsPercent) / 100).toFixed(2)),
        teratozoospermiaGrade
      },

      vitality: {
        liveSperm: {
          value: parseFloat(livePercent.toFixed(1)),
          unit: '%',
          status: livePercent >= 54 ? 'Normal' : 'Low'
        },
        deadSperm: {
          value: parseFloat((100 - livePercent).toFixed(1)),
          unit: '%'
        },
        necrozoospermia: livePercent < 50
      },

      nonSpermCells: {
        leukocytes: {
          value: parseFloat(leukocytesPerMl.toFixed(2)),
          unit: 'million/mL',
          status: leukocytesPerMl <= 1.0 ? 'Normal' : 'Elevated'
        },
        roundCells: {
          value: parseFloat(this.calculateConcentration(
            input.roundCellsCounted,
            1,
            chamber.factor
          ).toFixed(2)),
          unit: 'million/mL'
        },
        pyospermia: leukocytesPerMl > 1.0,
        epithelialCells: this.assessEpithelialCells(input.roundCellsCounted),
        macrophages: 0, // Would need specific count
        germCells: 0 // Would need specific count
      },

      immunology: {
        marTestIgG: {
          value: parseFloat(((input.marIgGBound / input.marIgATotal) * 100).toFixed(1)),
          unit: '%',
          status: (input.marIgGBound / input.marIgATotal) * 100 < 50 ? 'Normal' : 'Positive'
        },
        marTestIgA: {
          value: parseFloat(((input.marIgGBound / input.marIgATotal) * 100).toFixed(1)),
          unit: '%'
        },
        immunoinfertility: (input.marIgGBound / input.marIgATotal) * 100 >= 50
      },

      functionTests: {
        functionalCompetence: this.assessFunctionalCompetence({
          concentration: concentrationMillionPerMl,
          totalMotility,
          normalForms: normalFormsPercent,
          vitality: livePercent
        })
      },

      qualityControl: {
        spermCounted: input.spermCounted,
        duplicateVariation: 0, // Would need duplicate counts
        technician: 'Technician Name', // From input
        analysisTime: 0, // From input
        chamberUsed: input.chamberType,
        magnification: '400x',
        meetsWhoCriteria: this.checkWhoCriteria({
          spermCounted: input.spermCounted,
          morphologyCounted: totalMorphologySperm
        })
      },

      interpretation
    };
  }

  private static calculateConcentration(
    spermCounted: number,
    dilutionFactor: number,
    chamberFactor: number
  ): number {
    // Concentration (million/mL) = (Sperm counted × Dilution factor) / Chamber factor
    return (spermCounted * dilutionFactor) / (chamberFactor * 1000000);
  }

  private static determineWHOClassification(params: any): string {
    const { concentration, totalMotility, normalForms, totalSpermNumber } = params;

    // Azoospermia check
    if (concentration === 0) return 'Azoospermia';
    if (concentration < 0.1) return 'Cryptozoospermia';

    // Check individual parameters against WHO 2021
    const isOligo = concentration < this.WHO_REFERENCE_VALUES.concentration.min;
    const isAstheno = totalMotility < this.WHO_REFERENCE_VALUES.totalMotility.min;
    const isTerato = normalForms < this.WHO_REFERENCE_VALUES.normalForms.min;

    // Determine combined classification
    if (isOligo && isAstheno && isTerato) return 'OAT Syndrome (Oligo-Astheno-Teratozoospermia)';
    if (isOligo && isAstheno) return 'Oligoasthenozoospermia';
    if (isOligo && isTerato) return 'Oligoteratozoospermia';
    if (isAstheno && isTerato) return 'Asthenoteratozoospermia';
    if (isOligo) return 'Oligozoospermia';
    if (isAstheno) return 'Asthenozoospermia';
    if (isTerato) return 'Teratozoospermia';

    return 'Normozoospermia';
  }

  private static gradeOligozoospermia(concentration: number): 'Mild' | 'Moderate' | 'Severe' | 'None' { // ✅ Fixed
    if (concentration >= 16) return 'None';
    if (concentration >= 10) return 'Mild';
    if (concentration >= 5) return 'Moderate';
    return 'Severe';
  }

  private static gradeAsthenozoospermia(totalMotility: number, progressive: number): 'Mild' | 'Moderate' | 'Severe' | 'None' { // ✅ Fixed
    if (totalMotility >= 42 && progressive >= 30) return 'None';
    if (totalMotility >= 30) return 'Mild';
    if (totalMotility >= 20) return 'Moderate';
    return 'Severe';
  }

  private static gradeTeratozoospermia(normalForms: number): 'Mild' | 'Moderate' | 'Severe' | 'None' { // ✅ Fixed
    if (normalForms >= 4) return 'None';
    if (normalForms >= 2) return 'Mild';
    if (normalForms >= 1) return 'Moderate';
    return 'Severe';
  }

  private static assessFertilityPotential(params: {
    concentration: number;
    totalMotility: number;
    normalForms: number;
  }): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor' {  // ✅ Fixed return type
    const { concentration, totalMotility, normalForms } = params;

    const score =
      (concentration >= 16 ? 1 : 0) +
      (totalMotility >= 42 ? 1 : 0) +
      (normalForms >= 4 ? 1 : 0);

    if (score === 3) return 'Excellent';
    if (score === 2) return 'Good';
    if (score === 1) return 'Fair';
    if (concentration < 5 || totalMotility < 20 || normalForms < 1) return 'Very Poor';
    return 'Poor';
  }

  private static estimateConceptionProbability(params: any): string {
    const { concentration, totalMotility, normalForms } = params;

    // Simplified probability estimation based on multiple studies
    let probability = 0;

    // Concentration contribution
    if (concentration >= 40) probability += 35;
    else if (concentration >= 16) probability += 25;
    else if (concentration >= 5) probability += 15;
    else probability += 5;

    // Motility contribution
    if (totalMotility >= 60) probability += 35;
    else if (totalMotility >= 42) probability += 25;
    else if (totalMotility >= 20) probability += 15;
    else probability += 5;

    // Morphology contribution
    if (normalForms >= 14) probability += 30;
    else if (normalForms >= 4) probability += 20;
    else if (normalForms >= 1) probability += 10;
    else probability += 5;

    // Adjust for multiple parameters
    const totalScore = (concentration >= 16 ? 1 : 0) +
      (totalMotility >= 42 ? 1 : 0) +
      (normalForms >= 4 ? 1 : 0);

    if (totalScore === 3) probability *= 1.2;
    else if (totalScore === 2) probability *= 1.0;
    else if (totalScore === 1) probability *= 0.8;
    else probability *= 0.5;

    // Cap at 90% (even with perfect parameters)
    probability = Math.min(probability, 90);

    if (probability >= 70) return `High (${Math.round(probability)}% within 1 year)`;
    if (probability >= 40) return `Moderate (${Math.round(probability)}% within 1 year)`;
    if (probability >= 20) return `Low (${Math.round(probability)}% within 1 year)`;
    return `Very Low (${Math.round(probability)}% within 1 year)`;
  }

  private static assessIUISuitability(params: any): string {
    const { totalSpermNumber, totalMotility, normalForms } = params;

    // IUI requires minimum parameters
    const totalMotileSperm = (totalSpermNumber * totalMotility) / 100;

    if (totalMotileSperm >= 10 && normalForms >= 4) return 'Excellent candidate for IUI';
    if (totalMotileSperm >= 5 && normalForms >= 2) return 'Good candidate for IUI';
    if (totalMotileSperm >= 1 && normalForms >= 1) return 'May consider IUI with expectations of lower success';
    return 'Not suitable for IUI; consider IVF/ICSI';
  }

  private static recommendICSI(params: any): boolean {
    const { concentration, totalMotility, normalForms } = params;

    // ICSI recommended for severe cases
    return (
      concentration < 1 ||
      totalMotility < 10 ||
      normalForms < 1 ||
      (concentration < 5 && totalMotility < 20) ||
      (totalMotility < 20 && normalForms < 2)
    );
  }

  private static generateComprehensiveInterpretation(params: any) {
    const {
      concentration, totalMotility, normalForms, vitality,
      leukocytes, marTest, whoClassification, abstinenceDays, volume
    } = params;

    // Build interpretation based on findings
    const findings: string[] = [];
    const pathophysiology: string[] = [];
    const recommendations: string[] = [];

    // Volume assessment
    if (volume < 1.4) {
      findings.push(`Low semen volume (${volume} mL, normal >= 1.4 mL)`);
      pathophysiology.push('Possible ejaculatory duct obstruction, retrograde ejaculation, or congenital absence of vas deferens');
      recommendations.push('Post-ejaculation urine analysis for retrograde ejaculation');
      recommendations.push('Transrectal ultrasound for ejaculatory duct evaluation');
    }

    // Concentration assessment
    if (concentration < 16) {
      findings.push(`Low sperm concentration (${concentration.toFixed(1)} million/mL, normal >= 16 million/mL)`);

      if (concentration < 5) {
        pathophysiology.push('Severe impairment of spermatogenesis');
        recommendations.push('Karyotype analysis and Y-chromosome microdeletion testing');
        recommendations.push('FSH, LH, Testosterone, Prolactin hormone panel');
      } else if (concentration < 10) {
        pathophysiology.push('Moderate impairment of spermatogenesis');
        recommendations.push('Scrotal ultrasound for varicocele detection');
        recommendations.push('Hormonal evaluation (FSH, Testosterone)');
      } else {
        pathophysiology.push('Mild impairment of spermatogenesis');
        recommendations.push('Repeat analysis after 3 months (spermatogenesis cycle)');
      }
    }

    // Motility assessment
    if (totalMotility < 42) {
      findings.push(`Reduced sperm motility (${totalMotility.toFixed(1)}%, normal >= 42%)`);

      if (totalMotility < 20) {
        pathophysiology.push('Severe asthenozoospermia, possible structural or metabolic defects');
        recommendations.push('Electron microscopy for structural evaluation if available');
        recommendations.push('Sperm function tests (hypo-osmotic swelling, acrosome reaction)');
      } else if (totalMotility < 30) {
        pathophysiology.push('Moderate asthenozoospermia');
        recommendations.push('Evaluate for genital tract infections/inflammation');
        recommendations.push('Antioxidant therapy trial (Vitamin C, E, CoQ10)');
      }
    }

    // Morphology assessment
    if (normalForms < 4) {
      findings.push(`Increased abnormal sperm forms (${normalForms.toFixed(1)}% normal, normal >= 4%)`);

      if (normalForms < 1) {
        pathophysiology.push('Severe teratozoospermia, possible genetic or environmental factors');
        recommendations.push('Genetic counseling and testing');
        recommendations.push('Evaluation for environmental/occupational exposures');
      }
    }

    // Vitality assessment
    if (vitality < 54) {
      findings.push(`Reduced sperm viability (${vitality.toFixed(1)}% live, normal >= 54%)`);
      if (vitality < 50) findings.push('Possible necrozoospermia');
      recommendations.push('Hypo-osmotic swelling test to confirm vitality');
    }

    // Leukocyte assessment
    if (leukocytes > 1.0) {
      findings.push(`Elevated leukocytes (${leukocytes.toFixed(2)} million/mL, normal ≤1.0 million/mL)`);
      pathophysiology.push('Genital tract inflammation/infection (leukocytospermia)');
      recommendations.push('Seminal culture and sensitivity testing');
      recommendations.push('Evaluation for prostatitis or other genital tract infections');
    }

    // MAR test assessment
    if (marTest >= 50) {
      findings.push(`Positive MAR test (${marTest.toFixed(1)}% bound, normal <50%)`);
      pathophysiology.push('Immunological infertility due to antisperm antibodies');
      recommendations.push('Corticosteroid trial (under medical supervision)');
      recommendations.push('Consider sperm washing for assisted reproduction');
    }

    // Abstinence period assessment
    if (abstinenceDays < 2) {
      findings.push(`Short abstinence period (${abstinenceDays} days, recommended 2-7 days)`);
      recommendations.push('Repeat analysis after proper abstinence period (3-5 days)');
    } else if (abstinenceDays > 7) {
      findings.push(`Prolonged abstinence period (${abstinenceDays} days, recommended 2-7 days)`);
      recommendations.push('Repeat analysis after optimal abstinence period (3-5 days)');
    }

    // Build clinical correlation
    let clinicalCorrelation = '';

    if (whoClassification === 'Normozoospermia') {
      clinicalCorrelation = 'All seminal parameters are within normal limits according to WHO 2021 criteria.';
    } else if (whoClassification.includes('OAT')) {
      clinicalCorrelation = 'Combined abnormalities in concentration, motility, and morphology suggest significant testicular dysfunction.';
    } else if (whoClassification.includes('Azoospermia')) {
      clinicalCorrelation = 'Complete absence of spermatozoa requires comprehensive evaluation to determine obstructive vs. non-obstructive cause.';
    } else {
      clinicalCorrelation = 'Isolated abnormality suggests specific pathophysiological mechanism.';
    }

    // Additional recommendations based on findings
    if (findings.length > 0) {
      recommendations.push('Lifestyle modifications: Avoid tobacco, alcohol, recreational drugs, hot baths/saunas');
      recommendations.push('Maintain healthy BMI (20-25 kg/m²)');
      recommendations.push('Consider antioxidant supplementation (Vitamin C 1000mg, Vitamin E 400IU, CoQ10 200mg daily)');
    }

    // Assisted reproduction recommendations
    const iuiSuitable = concentration >= 5 && totalMotility >= 30 && normalForms >= 1;
    const ivfSuitable = concentration >= 1 && totalMotility >= 10;

    const assistedReproduction = {
      timingIntercourse: concentration >= 16 && totalMotility >= 42,
      iui: iuiSuitable,
      ivf: ivfSuitable,
      icsi: !ivfSuitable || normalForms < 1,
      tese: whoClassification.includes('Azoospermia') || concentration < 0.1
    };

    return {
      primaryDiagnosis: whoClassification,
      secondaryFindings: findings,
      pathophysiology,
      clinicalCorrelation,
      lifestyleRecommendations: [
        'Maintain optimal weight (BMI 20-25)',
        'Regular moderate exercise (30 minutes, 5 days/week)',
        'Balanced diet rich in antioxidants (fruits, vegetables, nuts)',
        'Avoid exposure to toxins, pesticides, heavy metals',
        'Manage stress through relaxation techniques'
      ],
      medicalTherapies: this.suggestMedicalTherapies(params),
      surgicalOptions: this.suggestSurgicalOptions(params),
      assistedReproduction,
      repeatTesting: 'Repeat semen analysis after 3 months (spermatogenesis cycle)',
      partnerEvaluation: 'Complete fertility evaluation of female partner recommended',
      geneticTesting: this.suggestGeneticTesting(params)
    };
  }

  private static suggestMedicalTherapies(params: any): string[] {
    const therapies: string[] = [];
    const { concentration, totalMotility, normalForms, vitality } = params;

    if (concentration < 16) {
      therapies.push('Clomiphene citrate 25-50mg daily (if hypogonadotropic)');
      therapies.push('Human Chorionic Gonadotropin (hCG) injections');
      therapies.push('Aromatase inhibitors (if elevated estrogen)');
    }

    if (totalMotility < 42 || vitality < 54) {
      therapies.push('Antioxidant therapy: Vitamin C 1000mg, Vitamin E 400IU, CoQ10 200-300mg daily');
      therapies.push('Carnitine 2-3g daily');
    }

    if (normalForms < 4) {
      therapies.push('Zinc supplementation 50-100mg daily');
      therapies.push('Folic acid 5mg daily');
    }

    return therapies;
  }

  private static suggestSurgicalOptions(params: any): string[] {
    const options: string[] = [];
    const { concentration, leukocytes, whoClassification } = params;

    if (concentration < 5) {
      options.push('Varicocelectomy if clinically significant varicocele present');
    }

    if (leukocytes > 1.0) {
      options.push('Treatment of underlying infection/inflammation');
    }

    if (whoClassification.includes('Azoospermia')) {
      options.push('Testicular sperm extraction (TESE) or micro-TESE');
      options.push('Epididymal sperm aspiration (MESA, PESA)');
    }

    if (whoClassification.includes('Obstructive')) {
      options.push('Vasovasostomy or vasoepididymostomy for obstruction reversal');
    }

    return options;
  }

  private static suggestGeneticTesting(params: any): string[] {
    const tests: string[] = [];
    const { concentration, whoClassification } = params;

    if (concentration < 5) {
      tests.push('Karyotype analysis (46,XY)');
      tests.push('Y-chromosome microdeletion testing (AZFa, AZFb, AZFc)');
    }

    if (whoClassification.includes('Azoospermia') || concentration < 1) {
      tests.push('CFTR gene mutation analysis for CBAVD');
    }

    if (whoClassification.includes('Teratozoospermia') && params.normalForms < 1) {
      tests.push('AURKC gene mutation analysis for macrozoospermia');
    }

    return tests;
  }

  private static assessAccessoryGlandFunction(
    volume: number, ph: number, fructose?: number, zinc?: number
  ): 'Normal' | 'Possible Obstruction' | 'Secretory Dysfunction' { // ✅ Fixed
    let score = 0;

    if (volume >= 1.4) score++;
    if (ph >= 7.2 && ph <= 8.0) score++;
    if (fructose && fructose >= 120) score++;
    if (zinc && zinc >= 80) score++;

    if (score === 4) return 'Normal';
    if (score >= 2) return 'Possible Obstruction';
    return 'Secretory Dysfunction';
  }

  private static assessEpithelialCells(count: number): 'None' | 'Few' | 'Moderate' | 'Many' { // ✅ Fixed
    if (count === 0) return 'None';
    if (count < 5) return 'Few';
    if (count < 10) return 'Moderate';
    return 'Many';
  }

  private static assessFunctionalCompetence(params: {
    concentration: number;
    totalMotility: number;
    normalForms: number;
    vitality: number;
  }): 'Adequate' | 'Impaired' | 'Severely Impaired' { // ✅ Fixed
    const { concentration, totalMotility, normalForms, vitality } = params;

    const functionalScore =
      (concentration >= 16 ? 1 : 0) +
      (totalMotility >= 42 ? 1 : 0) +
      (normalForms >= 4 ? 1 : 0) +
      (vitality >= 54 ? 1 : 0);

    if (functionalScore >= 3) return 'Adequate';
    if (functionalScore >= 2) return 'Impaired';
    return 'Severely Impaired';
  }

  private static checkWhoCriteria(params: any): boolean {
    const { spermCounted, morphologyCounted } = params;

    // WHO recommends counting at least 200 sperm for motility
    // and 200 sperm for morphology (strict criteria)
    return spermCounted >= 200 && morphologyCounted >= 200;
  }
}