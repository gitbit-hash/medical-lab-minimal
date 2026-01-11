// components/test-results-form.tsx - WITH DEFAULT VALUES
'use client';

import { useState, useEffect, useRef } from 'react';
import { TestParameter, TestTemplateWithCategoryAndParams } from '../types';
import { getGenderSpecificRange, hasGenderSpecificRanges } from '../lib/utils/gender-ranges';
import { shouldUseParameterDropdown } from '../lib/utils/parameter-options';
import { ParameterSpecificDropdown } from './parameter-specific-dropdown';
import { calculateCBCParameters, CBCInput } from '../lib/utils/cbc-calculator';

interface TestResultsFormProps {
  testTemplate: TestTemplateWithCategoryAndParams | null;
  initialResults?: Record<string, any>;
  onResultsChange: (results: Record<string, any>) => void;
  onNormalRangeChange?: (normalRange: Record<string, any>) => void;
  patientGender?: string;
}

const isGradedStagingRange = (rangeStr: string | null): boolean => {
  if (!rangeStr) return false;

  // Look for patterns like "G1", "G2", "Stage", "Category" with associated ranges
  const patterns = [
    /G\d+\s*\(.*\):\s*[><\d\s-]+/i,  // e.g., "G1 (Normal or High): > 90"
    /Stage\s*[IVXLCDM]+\s*:.*\d+/i,   // e.g., "Stage I: > 90"
    /Category\s*[A-Z]\s*:.*\d+/i,     // e.g., "Category A: > 90"
    /^[A-Z]\d*\s*\(.*\):/i            // e.g., "G1 (Normal or High):"
  ];

  // Also check for multiple lines with this pattern
  const lines = rangeStr.split('\n').filter(line => line.trim() !== '');
  if (lines.length > 1) {
    return patterns.some(pattern => pattern.test(lines[0]));
  }

  return patterns.some(pattern => pattern.test(rangeStr));
};

export function TestResultsForm({
  testTemplate,
  initialResults = {},
  onResultsChange,
  onNormalRangeChange,
  patientGender = 'Male'
}: TestResultsFormProps) {
  const [results, setResults] = useState<Record<string, any>>({});
  const [normalRange, setNormalRange] = useState<Record<string, any>>({});

  // Use refs to track initial values without causing re-renders
  const initialResultsRef = useRef(initialResults);
  const hasInitializedRef = useRef(false);
  const testTemplateRef = useRef(testTemplate);

  // Initialize only once when component mounts
  useEffect(() => {
    if (!hasInitializedRef.current && testTemplate) {
      // Only initialize with parameters from THIS specific template
      const initialResultsWithDefaults = { ...initialResultsRef.current };

      testTemplate.parameters.forEach(param => {
        const paramCode = param.code || `param_${param.id}`;

        // Only set default value if there's no existing value and default_value is not null
        if (!(paramCode in initialResultsWithDefaults) && param.default_value !== null) {
          initialResultsWithDefaults[paramCode] = param.default_value;
        }
      });

      setResults(initialResultsWithDefaults);
      onResultsChange(initialResultsWithDefaults);

      const initialNormalRange: Record<string, any> = {};
      testTemplate.parameters.forEach(param => {
        const paramCode = param.code || `param_${param.id}`;
        if (param.normal_range_min !== null || param.normal_range_max !== null || param.normal_range_text) {
          initialNormalRange[paramCode] = {
            min: param.normal_range_min,
            max: param.normal_range_max,
            text: param.normal_range_text
          };
        }
      });
      setNormalRange(initialNormalRange);
      onNormalRangeChange?.(initialNormalRange);

      hasInitializedRef.current = true;
    }
  }, [testTemplate]); // Only run when testTemplate changes

  // Handle external changes to initialResults
  useEffect(() => {
    const currentString = JSON.stringify(initialResults);
    const previousString = JSON.stringify(initialResultsRef.current);

    if (currentString !== previousString) {
      setResults(initialResults);
      initialResultsRef.current = initialResults;
    }
  }, [initialResults]);

  // Handle external changes to testTemplate
  useEffect(() => {
    if (testTemplate && testTemplate !== testTemplateRef.current) {
      testTemplateRef.current = testTemplate;

      // Update results with default values for new parameters
      const updatedResults = { ...results };
      let hasNewDefaults = false;

      testTemplate.parameters.forEach(param => {
        const paramCode = param.code || `param_${param.id}`;

        // Only set default value if there's no existing value and default_value is not null
        if (!(paramCode in updatedResults) && param.default_value !== null) {
          updatedResults[paramCode] = param.default_value;
          hasNewDefaults = true;
        }
      });

      if (hasNewDefaults) {
        setResults(updatedResults);
        onResultsChange(updatedResults);
      }

      const initialNormalRange: Record<string, any> = {};
      testTemplate.parameters.forEach(param => {
        const paramCode = param.code || `param_${param.id}`;
        if (param.normal_range_min !== null || param.normal_range_max !== null || param.normal_range_text) {
          initialNormalRange[paramCode] = {
            min: param.normal_range_min,
            max: param.normal_range_max,
            text: param.normal_range_text
          };
        }
      });
      setNormalRange(initialNormalRange);
      onNormalRangeChange?.(initialNormalRange);
    }
  }, [testTemplate, onResultsChange, onNormalRangeChange, results]);

  const handleResultChange = (parameterCode: string, value: any) => {
    let newResults = {
      ...results,
      [parameterCode]: value
    };

    // Check if this is a CBC test to run auto-calculations
    const isCBC = testTemplate?.name?.toLowerCase().includes('cbc') ||
      testTemplate?.category?.name?.toLowerCase().includes('cbc');

    if (isCBC && testTemplate) {
      newResults = runCBCCalculations(newResults, testTemplate);
    }

    setResults(newResults);
    onResultsChange(newResults);
  };

  /**
   * Helper to map current results to CBCInput, run calculation, 
   * and map back to results
   */
  const runCBCCalculations = (
    currentResults: Record<string, any>,
    template: TestTemplateWithCategoryAndParams
  ) => {
    // Helper to find parameter code by name (partial match)
    const findCode = (nameFragment: string) => {
      const param = template.parameters.find(p =>
        p.name.toLowerCase().includes(nameFragment.toLowerCase())
      );
      return param ? (param.code || `param_${param.id}`) : null;
    };

    // Helper to find exact matches or better guesses for common abbreviations
    const findCodePrecise = (abbreviations: string[]) => {
      const param = template.parameters.find(p => {
        const name = p.name.toLowerCase();
        // Check for exact word matches to avoid "mchc" matching "mch"
        return abbreviations.some(abbr => {
          const regex = new RegExp(`\\b${abbr}\\b`, 'i');
          return regex.test(name) || name === abbr;
        });
      });
      return param ? (param.code || `param_${param.id}`) : null;
    };

    // Refined finding for differentials to separate % vs Absolute
    // We assume the % inputs don't have "absolute" or "#" in their name usually, or we check specifically
    const findDiffCode = (baseName: string, isAbsolute: boolean) => {
      return template.parameters.find(p => {
        const n = p.name.toLowerCase();
        const hasAbs = n.includes('absolute') || n.includes('#');
        return n.includes(baseName) && (isAbsolute ? hasAbs : !hasAbs);
      })?.code;
    };

    const codeMap = {
      wbc: findCode('white blood') || findCode('wbc'),
      rbc: findCode('red blood') || findCode('rbc'),
      hgb: findCodePrecise(['hemoglobin', 'hgb', 'hb']),
      plt: findCode('platelet') || findCode('plt'),
      mcv: findCodePrecise(['mcv']), // Precise to avoid false matches
      mpv: findCodePrecise(['mpv']),

      neutrophilsPercent: findDiffCode('neutrophil', false),
      lymphocytesPercent: findDiffCode('lymphocyte', false),
      monocytesPercent: findDiffCode('monocyte', false),
      eosinophilsPercent: findDiffCode('eosinophil', false),
      basophilsPercent: findDiffCode('basophil', false),

      // Calculated Targets
      hct: findCode('hematocrit') || findCode('hct') || findCode('pcv'),
      // Fix for MCH: Ensure we don't accidentally pick MCHC if we just search "mch"
      mch: findCodePrecise(['mch']),
      mchc: findCodePrecise(['mchc']),

      neutrophilsAbsolute: findDiffCode('neutrophil', true),
      lymphocytesAbsolute: findDiffCode('lymphocyte', true),
      monocytesAbsolute: findDiffCode('monocyte', true),
      eosinophilsAbsolute: findDiffCode('eosinophil', true),
      basophilsAbsolute: findDiffCode('basophil', true),
      pct: findCode('plateletcrit') || findCode('pct'),
    };

    // Build Input
    const input: CBCInput = {
      wbc: parseFloat(currentResults[codeMap.wbc || ''] || '0'),
      rbc: parseFloat(currentResults[codeMap.rbc || ''] || '0'),
      hgb: parseFloat(currentResults[codeMap.hgb || ''] || '0'),
      plt: parseFloat(currentResults[codeMap.plt || ''] || '0'),

      neutrophilsPercent: parseFloat(currentResults[codeMap.neutrophilsPercent || ''] || '0'),
      lymphocytesPercent: parseFloat(currentResults[codeMap.lymphocytesPercent || ''] || '0'),
      monocytesPercent: parseFloat(currentResults[codeMap.monocytesPercent || ''] || '0'),
      eosinophilsPercent: parseFloat(currentResults[codeMap.eosinophilsPercent || ''] || '0'),
      basophilsPercent: parseFloat(currentResults[codeMap.basophilsPercent || ''] || '0'),

      mcv: parseFloat(currentResults[codeMap.mcv || ''] || '0'),
      mpv: parseFloat(currentResults[codeMap.mpv || ''] || '0'),
    };

    // Calculate
    const calculated = calculateCBCParameters(input);
    const updated = { ...currentResults };

    // Update Results if code exists. 
    // We strictly check if the calculated value is a valid number (>0 usually, or just not NaN)
    // to avoid overwriting with zeros if inputs are partial.
    if (codeMap.hct && calculated.hct) updated[codeMap.hct] = calculated.hct;
    if (codeMap.mch && calculated.mch) updated[codeMap.mch] = calculated.mch;
    if (codeMap.mchc && calculated.mchc) updated[codeMap.mchc] = calculated.mchc;

    if (codeMap.neutrophilsAbsolute && calculated.neutrophilsAbsolute) updated[codeMap.neutrophilsAbsolute] = calculated.neutrophilsAbsolute;
    if (codeMap.lymphocytesAbsolute && calculated.lymphocytesAbsolute) updated[codeMap.lymphocytesAbsolute] = calculated.lymphocytesAbsolute;
    if (codeMap.monocytesAbsolute && calculated.monocytesAbsolute) updated[codeMap.monocytesAbsolute] = calculated.monocytesAbsolute;
    if (codeMap.eosinophilsAbsolute && calculated.eosinophilsAbsolute) updated[codeMap.eosinophilsAbsolute] = calculated.eosinophilsAbsolute;
    if (codeMap.basophilsAbsolute && calculated.basophilsAbsolute) updated[codeMap.basophilsAbsolute] = calculated.basophilsAbsolute;

    if (codeMap.pct && calculated.pct) updated[codeMap.pct] = calculated.pct;

    return updated;
  };

  const handleNormalRangeChange = (parameterCode: string, field: string, value: any) => {
    const newNormalRange = {
      ...normalRange,
      [parameterCode]: {
        ...normalRange[parameterCode],
        [field]: value
      }
    };
    setNormalRange(newNormalRange);
    onNormalRangeChange?.(newNormalRange);
  };

  const getParameterValue = (parameter: TestParameter) => {
    const paramCode = parameter.code || `param_${parameter.id}`;
    return results[paramCode] ?? '';
  };

  const getParameterType = (parameter: TestParameter): 'number' | 'text' | 'report' => {
    // 0. SPECIAL CASES: Force WBCs and RBCs to be text inputs
    const paramCode = parameter.code.toLowerCase();

    if (
      paramCode.includes('wbcs_stool') ||
      paramCode.includes('puscells') ||
      paramCode.includes('rbc') ||
      paramCode.includes('parasites_stool') ||
      paramCode.includes('other_findings_stool')
    ) {
      return 'text';
    }

    // 1. First priority: Check for numeric ranges (min/max)
    if (parameter.normal_range_min !== null || parameter.normal_range_max !== null) {
      return 'number';
    }

    // 2. Second priority: Check normal_range_text content
    if (parameter.normal_range_text) {
      const text = parameter.normal_range_text.toLowerCase().trim();

      // If it contains "see report", use report textarea
      if (text.includes('see report')) {
        return 'report';
      }

      // Check for specific text patterns that should use text input
      if (/^\d+\s*-\s*\d+$/.test(text)) {
        return 'text';
      }

      // If it contains numbers, use number input
      if (/\d/.test(text)) {
        return 'number';
      }

      // Otherwise, use text input
      return 'text';
    }

    // 3. Default to number input for medical tests
    return 'report';
  };
  // ENHANCED: Get appropriate input options based on normal_range_text
  const getInputOptions = (parameter: TestParameter): string[] => {
    const normalText = parameter.normal_range_text?.toLowerCase().trim();

    // Check if this is a semi-quantitative parameter (like crystals, casts, etc.)
    if (parameter.name.toLowerCase().includes('crystal') ||
      parameter.name.toLowerCase().includes('cast') ||
      parameter.name.toLowerCase().includes('epithelial') ||
      parameter.name.toLowerCase().includes('bacteria') ||
      parameter.name.toLowerCase().includes('mucus') ||
      parameter.name.toLowerCase().includes('yeast')) {

      return ['None', 'Rare', '+', '++', '+++', '++++', 'Occasional', 'Few', 'Many'];
    }

    if (normalText && !normalText.includes('see report') && !/\d/.test(normalText)) {
      // For text inputs with specific normal range text, provide common options
      switch (normalText) {
        case 'non reactive':
        case 'reactive':
          return ['Non Reactive', 'Reactive', 'Weakly Reactive'];

        default:
          // For other text values, use the normal_range_text as the default "normal" value
          // Filter out null/undefined and ensure it's a string
          return parameter.normal_range_text ? [parameter.normal_range_text] : [];
      }
    }

    return [];
  };

  // Add this function to parse graded staging ranges
  const parseGradedStagingRange = (rangeStr: string, value: number): {
    stage: string | null;
    description: string | null;
    color: string;
    icon: string;
  } | null => {
    if (!rangeStr || isNaN(value)) return null;

    const lines = rangeStr.split('\n').filter(line => line.trim() !== '');
    const stages: Array<{
      pattern: RegExp;
      stage: string;
      description: string;
      test: (val: number) => boolean;
      color: string;
      icon: string;
    }> = [];

    // Parse each line to extract stage information
    lines.forEach(line => {
      const trimmed = line.trim();

      // Match patterns like:
      // "G1 (Normal or High): > 90"
      // "G2 (Mildly decreased): 60 - 89"
      // "G5 (Kidney failure): < 15"
      const match = trimmed.match(/([A-Z]\d*[a-z]*)\s*\((.*?)\):\s*(.+)/);
      if (match) {
        const [, stage, description, range] = match;
        const test = createRangeTest(range.trim());
        if (test) {
          stages.push({
            pattern: new RegExp(stage, 'i'),
            stage,
            description: `${stage} (${description})`,
            test,
            color: getStageColor(stage),
            icon: getStageIcon(stage)
          });
        }
      }
    });

    // Test value against each stage in order
    for (const stage of stages) {
      if (stage.test(value)) {
        return {
          stage: stage.stage,
          description: stage.description,
          color: stage.color,
          icon: stage.icon
        };
      }
    }

    return null;
  };

  // Helper to create test function for range strings
  const createRangeTest = (rangeStr: string): ((val: number) => boolean) | null => {
    rangeStr = rangeStr.trim();

    // Handle "> 90"
    if (rangeStr.startsWith('>')) {
      const threshold = parseFloat(rangeStr.slice(1).trim());
      return !isNaN(threshold) ? (val: number) => val > threshold : null;
    }

    // Handle "< 15"
    if (rangeStr.startsWith('<')) {
      const threshold = parseFloat(rangeStr.slice(1).trim());
      return !isNaN(threshold) ? (val: number) => val < threshold : null;
    }

    // Handle "60 - 89" or "30 - 44"
    if (rangeStr.includes('-')) {
      const parts = rangeStr.split('-').map(part => parseFloat(part.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return (val: number) => val >= parts[0] && val <= parts[1];
      }
    }

    return null;
  };

  // Helper to get color for each stage
  const getStageColor = (stage: string): string => {
    const stageLower = stage.toLowerCase();

    if (stageLower.includes('g1')) return 'text-green-600';
    if (stageLower.includes('g2')) return 'text-blue-600';
    if (stageLower.includes('g3a')) return 'text-yellow-600';
    if (stageLower.includes('g3b')) return 'text-orange-600';
    if (stageLower.includes('g4')) return 'text-red-600';
    if (stageLower.includes('g5')) return 'text-red-800';

    return 'text-gray-600';
  };

  // Helper to get icon for each stage
  const getStageIcon = (stage: string): string => {
    const stageLower = stage.toLowerCase();

    if (stageLower.includes('g1')) return '✓';
    if (stageLower.includes('g2')) return '↗';
    if (stageLower.includes('g3a')) return '⚠';
    if (stageLower.includes('g3b')) return '⚠';
    if (stageLower.includes('g4')) return '↑';
    if (stageLower.includes('g5')) return '↑↑';

    return '?';
  };

  // Enhanced range indicator that handles both numeric and text-based "<" or ">" ranges
  const getRangeIndicator = (parameter: TestParameter, value: any) => {
    if (!value || value === '') return null;

    const parameterType = getParameterType(parameter);
    const normalText = parameter.normal_range_text || '';

    // 1. First check for graded staging ranges (eGFR, etc.)
    if (isGradedStagingRange(normalText)) {
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      if (isNaN(numValue)) return null;

      const stageInfo = parseGradedStagingRange(normalText, numValue);
      if (stageInfo) {
        return {
          type: 'stage',
          stage: stageInfo.stage,
          icon: stageInfo.icon,
          color: stageInfo.color,
          tooltip: stageInfo.description
        };
      }
      return null;
    }

    // If this has age/gender specific ranges, return null - we can't evaluate without age
    if (hasAgeGenderSpecificRanges(normalText)) {
      return null;
    }

    // If the parameter has numeric min/max defined, use numeric logic
    if (parameterType === 'number' || /\d/.test(parameter.normal_range_text || '')) {
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      if (isNaN(numValue)) return null;

      let min: number | null = null;
      let max: number | null = null;

      // Handle gender-specific ranges if available
      if (hasGenderSpecificRanges(parameter.normal_range_text)) {
        const genderRange = getGenderSpecificRange(parameter.normal_range_text, patientGender);
        const parsedRange = parseRangeString(genderRange);
        min = parsedRange.min;
        max = parsedRange.max;
      } else {
        // Parse normal range text (like "<14", ">5", "10-20")
        const parsed = parseRangeString(parameter.normal_range_text || '');
        min = parameter.normal_range_min ?? parsed.min;
        max = parameter.normal_range_max ?? parsed.max;
      }

      if (min !== null && numValue < min) {
        return { type: 'below', icon: '↓', color: 'text-blue-600', tooltip: `Below normal (< ${min})` };
      }
      if (max !== null && numValue > max) {
        return { type: 'above', icon: '↑', color: 'text-red-600', tooltip: `Above normal (> ${max})` };
      }
      if (
        (min !== null || max !== null) &&
        numValue >= (min ?? -Infinity) &&
        numValue <= (max ?? Infinity)
      ) {
        return { type: 'normal', icon: '✓', color: 'text-green-600', tooltip: 'Within normal range' };
      }
    }

    // 🧩 Handle TEXT-based comparison when normal_range_text contains "<" or ">"
    const text = parameter.normal_range_text?.trim() || '';
    const val = String(value).trim();

    // For "<14", ">0.25", "<1:80" style
    const lessMatch = text.match(/^<\s*([\d:.]+)/);
    const greaterMatch = text.match(/^>\s*([\d:.]+)/);

    if (lessMatch) {
      const threshold = lessMatch[1];
      const numValue = parseFloat(val);
      const numThreshold = parseFloat(threshold);
      if (!isNaN(numValue) && !isNaN(numThreshold)) {
        return numValue > numThreshold
          ? { type: 'above', icon: '↑', color: 'text-red-600', tooltip: `Above allowed (<${numThreshold})` }
          : { type: 'normal', icon: '✓', color: 'text-green-600', tooltip: `Within range (<${numThreshold})` };
      }
    }

    if (greaterMatch) {
      const threshold = greaterMatch[1];
      const numValue = parseFloat(val);
      const numThreshold = parseFloat(threshold);
      if (!isNaN(numValue) && !isNaN(numThreshold)) {
        return numValue < numThreshold
          ? { type: 'below', icon: '↓', color: 'text-blue-600', tooltip: `Below required (>${numThreshold})` }
          : { type: 'normal', icon: '✓', color: 'text-green-600', tooltip: `Within range (>${numThreshold})` };
      }
    }

    // 🧩 Handle textual qualitative abnormalities ("Reactive", "Positive", etc.)
    if (text && val) {
      const normalText = text.toLowerCase();
      const resultText = val.toLowerCase();

      const abnormalPairs = [
        ['non reactive', 'reactive'],
        ['negative', 'positive'],
        ['absent', 'present'],
        ['normal', 'abnormal'],
      ];

      for (const [normal, abnormal] of abnormalPairs) {
        if (normalText.includes(normal) && resultText.includes(abnormal)) {
          return { type: 'abnormal', icon: '!', color: 'text-red-600', tooltip: `Abnormal (${abnormal})` };
        }
      }
    }

    return null;
  };

  const hasAgeGenderSpecificRanges = (rangeStr: string | null): boolean => {
    if (!rangeStr) return false;

    // Check for patterns that indicate complex age/gender ranges:
    // 1. Contains gender markers (M:, F:)
    // 2. Contains age units (W, M, Y for weeks, months, years)
    // 3. Multiple ranges separated by commas with age groups
    const patterns = [
      /\d+\s*-\s*\d+\s*[WMY]/i, // e.g., "1 - 4 W", "10 - 14 Y"
      // /[MF]\s*:/i,              // REMOVED: This was too broad and caught simple gender ranges
      /\d+\s*-\s*\d+\s*[Y]\s*[MF]\s*:/i, // e.g., "10 - 14 Y M :"
      />\s*\d+\s*[Y]\s*[MF]\s*:/i        // e.g., "> 75 Y M :"
    ];

    return patterns.some(pattern => pattern.test(rangeStr));
  };

  // Helper function to parse range strings like "1-2", ">5", "<10"
  const parseRangeString = (rangeStr: string): { min: number | null; max: number | null } => {
    if (!rangeStr) return { min: null, max: null };

    const cleaned = rangeStr.trim();

    if (hasAgeGenderSpecificRanges(cleaned)) {
      return { min: null, max: null };
    }

    // Handle greater than: ">5"
    if (cleaned.startsWith('>')) {
      const value = parseFloat(cleaned.slice(1));
      return { min: isNaN(value) ? null : value, max: null };
    }

    // Handle less than: "<10"  
    if (cleaned.startsWith('<')) {
      const value = parseFloat(cleaned.slice(1));
      return { min: null, max: isNaN(value) ? null : value };
    }
    // Handle range: "1-2"
    const rangeMatch = cleaned.match(/^\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?$/);

    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return {
        min: isNaN(min) ? null : min,
        max: isNaN(max) ? null : max
      };
    }

    // Handle single number (treat as exact value)
    const singleValue = parseFloat(cleaned);
    if (!isNaN(singleValue)) {
      return { min: singleValue, max: singleValue };
    }

    return { min: null, max: null };
  };

  // Get display text for normal range
  const getNormalRangeDisplay = (parameter: TestParameter) => {
    const normalText = parameter.normal_range_text || '';

    if (isGradedStagingRange(normalText)) {
      return 'eGFR Staging (see stages below)';
    }

    if (hasAgeGenderSpecificRanges(normalText)) {
      return `${parameter.normal_range_min ?? ''} - ${parameter.normal_range_max ?? ''}`.trim() ||
        'Age/Gender specific (see reference)';
    }

    const hasGenderRanges = hasGenderSpecificRanges(parameter.normal_range_text);

    if (hasGenderRanges) {
      // For gender-specific ranges, use the parsed gender-specific range
      const genderSpecificRange = getGenderSpecificRange(parameter.normal_range_text, patientGender);
      return genderSpecificRange;
    } else {
      // For simple ranges, use min/max
      const parameterType = getParameterType(parameter);
      if (parameterType === 'number') {
        const min = parameter.normal_range_min;
        const max = parameter.normal_range_max;
        if (min !== null || max !== null) {
          return `${min ?? ''} - ${max ?? ''}`.trim();
        }
      }
      return parameter.normal_range_text || '';
    }
  };

  if (!testTemplate) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select a test template to enter results
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* TABLE VERSION */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference Range
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {testTemplate.parameters.map((parameter) => (
              <TableParameterRow
                key={parameter.id}
                parameter={parameter}
                value={getParameterValue(parameter)}
                onChange={(value) => handleResultChange(parameter.code || `param_${parameter.id}`, value)}
                parameterType={getParameterType(parameter)}
                inputOptions={getInputOptions(parameter)}
                rangeIndicator={getRangeIndicator(parameter, getParameterValue(parameter))}
                patientGender={patientGender}
                normalRangeDisplay={getNormalRangeDisplay(parameter)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// TABLE ROW COMPONENT
interface TableParameterRowProps {
  parameter: TestParameter;
  value: any;
  onChange: (value: any) => void;
  parameterType: 'number' | 'text' | 'report';
  inputOptions: string[];
  rangeIndicator: any;
  patientGender: string;
  normalRangeDisplay: string;
}

// TABLE ROW COMPONENT - UPDATED
function TableParameterRow({
  parameter,
  value,
  onChange,
  parameterType,
  inputOptions,
  rangeIndicator,
  patientGender,
  normalRangeDisplay
}: TableParameterRowProps) {
  const hasGenderSpecificRange = hasGenderSpecificRanges(parameter.normal_range_text);
  const isGradedRange = isGradedStagingRange(parameter.normal_range_text);

  // Check if the current value is the default value from the database
  const isDefaultValue = parameter.default_value !== null && value === parameter.default_value;

  // Check if this is a semi-quantitative parameter
  const isSemiQuantitative = parameter.name.toLowerCase().includes('crystal') ||
    parameter.name.toLowerCase().includes('cast') ||
    parameter.name.toLowerCase().includes('epithelial') ||
    parameter.name.toLowerCase().includes('bacteria') ||
    parameter.name.toLowerCase().includes('yeast');

  const isTwoStepSemiQuantitative = parameter.name.toLowerCase().includes('crystal') ||
    parameter.name.toLowerCase().includes('epithelial');

  return (
    <tr className="hover:bg-gray-50">
      {/* Test Name Column */}
      <td className="px-6 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{parameter.name}</div>
        <div className="text-xs text-gray-500">
          Type: {
            parameterType === 'number' ? 'Numeric' :
              parameterType === 'text' ? 'Text' :
                isSemiQuantitative ? 'Semi-Quantitative' : 'Report'
          }
          {isGradedRange && (
            <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
              Staged
            </span>
          )}
          {isDefaultValue && (
            <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
              Default
            </span>
          )}
        </div>
      </td>

      {/* Result Column */}
      <td className="px-6">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            {/* NUMBER INPUT */}
            {parameterType === 'number' && (
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="any"
                    value={value ?? ''}  // ← Use nullish coalescing instead of logical OR
                    onChange={(e) => {
                      const newValue = e.target.value;
                      // Allow empty string, 0, and other numbers
                      if (newValue === '') {
                        onChange('');
                      } else {
                        const numValue = parseFloat(newValue);
                        onChange(isNaN(numValue) ? '' : numValue);
                      }
                    }}
                    className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${rangeIndicator ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                      } ${isDefaultValue ? 'bg-green-50 border-green-200' : ''} ${isGradedRange && rangeIndicator ? rangeIndicator.color.replace('text-', 'border-') : ''
                      }`}
                    placeholder={`Enter value`}
                  />
                  {isDefaultValue && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-green-600" title="Default value from database">
                        ●
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isSemiQuantitative && (
              <div>
                {isTwoStepSemiQuantitative ? (
                  // Use two-dropdown for crystals and epithelial
                  <CrystalTwoStepDropdown
                    value={value}
                    onChange={onChange}
                    isDefaultValue={isDefaultValue}
                    parameterName={parameter.name}
                  />
                ) : (
                  // Use single dropdown for other semi-quantitative parameters
                  <SemiQuantitativeDropdown
                    value={value}
                    onChange={onChange}
                    parameterName={parameter.name}
                    isDefaultValue={isDefaultValue}
                  />
                )}
              </div>
            )}

            {/* TEXT INPUT WITH OPTIONS */}
            {parameterType === 'text' && !isSemiQuantitative && (
              <div>
                {shouldUseParameterDropdown(parameter.code) ? (
                  <ParameterSpecificDropdown
                    parameterCode={parameter.code}
                    value={value}
                    onChange={onChange}
                    isDefaultValue={isDefaultValue}
                  />
                ) : inputOptions.length > 0 ? (
                  <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${isDefaultValue ? 'bg-green-50 border-green-200' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select result</option>
                    {inputOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${isDefaultValue ? 'bg-green-50 border-green-200' : 'border-gray-300'
                      }`}
                    placeholder={`Enter result`}
                  />
                )}
                {isDefaultValue && (
                  <div className="text-xs text-green-600 mt-1">
                    Default value: {parameter.default_value}
                  </div>
                )}
              </div>
            )}

            {/* REPORT TEXTAREA */}
            {parameterType === 'report' && (
              <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                rows={2}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${isDefaultValue ? 'bg-green-50 border-green-200' : 'border-gray-300'
                  }`}
                placeholder="Enter detailed report findings..."
              />
            )}
          </div>

          {/* Range Indicator */}
          {rangeIndicator && (
            <div
              className={`text-sm ${rangeIndicator.color} shrink-0`}
              title={rangeIndicator.tooltip}
            >
              {rangeIndicator.icon}
            </div>
          )}
        </div>

        {/* Enhanced Range Status Display */}
        {value !== null && value !== undefined && value !== '' && rangeIndicator && (
          <div className={`text-xs font-medium mt-1 ${rangeIndicator.color}`}>
            {rangeIndicator.type === 'stage' ? (
              <span>
                <strong>{rangeIndicator.stage}:</strong> {rangeIndicator.tooltip}
              </span>
            ) : (
              rangeIndicator.tooltip
            )}
          </div>
        )}
      </td>

      {/* Reference Range Column */}
      <td className="px-6">
        <div className="text-sm text-gray-900">
          {normalRangeDisplay}
          {isGradedRange && (
            <div className="mt-2 text-xs">
              <details className="cursor-pointer">
                <summary className="text-purple-600 hover:text-purple-800">
                  Show staging details
                </summary>
                <div className="mt-1 p-2 bg-gray-50 rounded text-gray-700">
                  {parameter.normal_range_text?.split('\n').map((line, idx) => (
                    <div key={idx} className="py-0.5">
                      {line.trim()}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
          {hasGenderSpecificRange && (
            <div className="text-xs text-purple-600 mt-1">
              {patientGender}-specific range
            </div>
          )}
          {isSemiQuantitative && !normalRangeDisplay && (
            <div className="text-xs text-gray-500 italic">
              Semi-quantitative scale
            </div>
          )}
        </div>
      </td>

      {/* Unit Column */}
      <td className="px-6 whitespace-nowrap text-sm text-gray-500">
        {parameter.units || (isSemiQuantitative ? 'Scale' : '-')}
      </td>
    </tr>
  );
}

// Enhanced SemiQuantitativeDropdown component with combined type and quantity
interface SemiQuantitativeDropdownProps {
  value: any;
  onChange: (value: any) => void;
  parameterName: string;
  isDefaultValue?: boolean;
}

// Updated SemiQuantitativeDropdown for non-crystal parameters
function SemiQuantitativeDropdown({
  value,
  onChange,
  parameterName,
  isDefaultValue = false
}: SemiQuantitativeDropdownProps) {
  const name = parameterName.toLowerCase();

  const getOptions = () => {
    if (name.includes('cast')) {
      return [
        { value: '', label: 'Select result' },
        { value: 'None', label: 'None' },
        { value: 'Rare', label: 'Rare' },
        { value: 'Hyaline +', label: 'Hyaline +' },
        { value: 'Hyaline ++', label: 'Hyaline ++' },
        { value: 'Hyaline +++', label: 'Hyaline +++' },
        { value: 'Granular +', label: 'Granular +' },
        { value: 'Granular ++', label: 'Granular ++' },
        { value: 'Granular +++', label: 'Granular +++' },
        { value: 'Waxy +', label: 'Waxy +' },
        { value: 'Waxy ++', label: 'Waxy ++' },
        { value: 'Waxy +++', label: 'Waxy +++' }
      ];
    }

    if (name.includes('epithelial')) {
      return [
        { value: '', label: 'Select result' },
        { value: 'None', label: 'None' },
        { value: 'Rare', label: 'Rare' },
        { value: 'Squamous +', label: 'Squamous +' },
        { value: 'Squamous ++', label: 'Squamous ++' },
        { value: 'Squamous +++', label: 'Squamous +++' },
        { value: 'Transitional +', label: 'Transitional +' },
        { value: 'Transitional ++', label: 'Transitional ++' },
        { value: 'Transitional +++', label: 'Transitional +++' }
      ];
    }

    if (name.includes('bacteria')) {
      return [
        { value: '', label: 'Select result' },
        { value: 'None', label: 'None' },
        { value: 'Rare', label: 'Rare' },
        { value: '+', label: '+' },
        { value: '++', label: '++' },
        { value: '+++', label: '+++' },
        { value: '++++', label: '++++' }
      ];
    }

    if (name.includes('yeast') || name.includes('fungus')) {
      return [
        { value: '', label: 'Select result' },
        { value: 'None', label: 'None' },
        { value: 'Rare', label: 'Rare' },
        { value: '+', label: '+' },
        { value: '++', label: '++' },
        { value: '+++', label: '+++' }
      ];
    }

    if (name.includes('mucus')) {
      return [
        { value: '', label: 'Select result' },
        { value: 'None', label: 'None' },
        { value: 'Scant', label: 'Scant' },
        { value: '+', label: '+' },
        { value: '++', label: '++' },
        { value: '+++', label: '+++' },
        { value: '++++', label: '++++' }
      ];
    }

    // Default options for other semi-quantitative parameters
    return [
      { value: '', label: 'Select result' },
      { value: 'None', label: 'None' },
      { value: 'Rare', label: 'Rare' },
      { value: '+', label: '+' },
      { value: '++', label: '++' },
      { value: '+++', label: '+++' },
      { value: '++++', label: '++++' }
    ];
  };

  const options = getOptions();

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${isDefaultValue ? 'bg-green-50 border-green-200' : 'border-gray-300'
          }`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Two-step Crystal Dropdown component
interface CrystalTwoStepDropdownProps {
  value: any;
  onChange: (value: any) => void;
  isDefaultValue?: boolean;
  parameterName?: string;
}

function CrystalTwoStepDropdown({
  value,
  onChange,
  isDefaultValue = false,
  parameterName = ''
}: CrystalTwoStepDropdownProps) {
  // Determine if this is for epithelial or crystals
  const isEpithelial = parameterName.toLowerCase().includes('epithelial');

  // Parse current value to extract type and quantity
  const parseCurrentValue = (currentValue: string) => {
    if (!currentValue) return { type: '', quantity: '' };

    if (currentValue === 'None' || currentValue === 'Rare') {
      return { type: currentValue, quantity: '' };
    }

    // Handle values like "Calcium Oxalate +", "Squamous ++", etc.
    const parts = currentValue.split(' ');
    if (parts.length >= 2) {
      const quantity = parts.pop(); // Get the last part (+, ++, etc.)
      const type = parts.join(' '); // Get everything else as the type
      return { type, quantity };
    }

    // If we can't parse properly, treat the whole thing as type
    return { type: currentValue, quantity: '' };
  };

  const { type: currentType, quantity: currentQuantity } = parseCurrentValue(value || '');

  // Define options based on whether this is for epithelial or crystals
  const typeOptions = isEpithelial ? [
    { value: '', label: 'Select epithelial type' },
    { value: 'None', label: 'None' },
    { value: 'Rare', label: 'Rare' },
    { value: 'Squamous', label: 'Squamous' },
    { value: 'Transitional', label: 'Transitional' },
    { value: 'Renal Tubular', label: 'Renal Tubular' }
  ] : [
    { value: '', label: 'Select crystal type' },
    { value: 'None', label: 'None' },
    { value: 'Rare', label: 'Rare' },
    { value: 'Calcium Oxalate', label: 'Calcium Oxalate' },
    { value: 'Uric Acid', label: 'Uric Acid' },
    { value: 'Triple Phosphate', label: 'Triple Phosphate' },
    { value: 'Calcium Phosphate', label: 'Calcium Phosphate' },
    { value: 'Cystine', label: 'Cystine' },
    { value: 'Cholesterol', label: 'Cholesterol' },
    { value: 'Bilirubin', label: 'Bilirubin' },
    { value: 'Tyrosine', label: 'Tyrosine' },
    { value: 'Leucine', label: 'Leucine' },
    { value: 'Amorphous Phosphate', label: 'Amorphous Phosphate' },
    { value: 'Amorphous Urates', label: 'Amorphous Urates' }
  ];

  const quantityOptions = [
    { value: '', label: 'Select quantity' },
    { value: '+', label: '+' },
    { value: '++', label: '++' },
    { value: '+++', label: '+++' },
    { value: '++++', label: '++++' }
  ];

  const handleTypeChange = (newType: string) => {
    if (newType === 'None' || newType === 'Rare') {
      // For "None" and "Rare", we don't need quantity
      onChange(newType);
    } else if (newType && currentQuantity) {
      // If we have both type and quantity, combine them
      onChange(`${newType} ${currentQuantity}`);
    } else {
      // Just set the type, wait for quantity selection
      onChange(newType);
    }
  };

  const handleQuantityChange = (newQuantity: string) => {
    if (currentType && newQuantity) {
      onChange(`${currentType} ${newQuantity}`);
    } else if (newQuantity) {
      // If we have quantity but no type, just set quantity (waiting for type)
      onChange(newQuantity);
    }
  };

  // Determine if quantity dropdown should be enabled
  const shouldShowQuantity = currentType && currentType !== 'None' && currentType !== 'Rare';

  return (
    <div className="space-y-2">
      {/* Type Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {isEpithelial ? 'Epithelial Type' : 'Crystal Type'}
        </label>
        <select
          value={currentType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${isDefaultValue ? 'bg-green-50 border-green-200' : 'border-gray-300'
            }`}
        >
          {typeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity Selection - Only show if a specific type is selected */}
      {shouldShowQuantity && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <select
            value={currentQuantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {quantityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Display current selection summary */}
      {(currentType || currentQuantity) && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selected:</strong> {value}
        </div>
      )}
    </div>
  );
}