// src/lib/utils/range-indicator.ts
export type ResultIndicator = 'up' | 'down' | 'normal' | 'none';
export interface EvaluateResult {
  displayValue: string | number | null;
  indicator: ResultIndicator;
  isBold?: boolean;
  stage?: string; // Add stage information for staged ranges
  stageColor?: string; // Add color for stage display
  valueColor?: string;
  category?: string | null;
}

/**
 * Check if a range string represents a graded/staging range
 */
export const isGradedStagingRange = (rangeStr: string | null): boolean => {
  if (!rangeStr) return false;

  // Look for patterns like "G1", "G2", "Stage", "Category" with associated ranges
  const patterns = [
    /G\d+\s*\(.*\):\s*[><\d\s-]+/i,  // e.g., "G1 (Normal or High): > 90"
    /Stage\s*[IVXLCDM]+\s*:.*\d+/i,   // e.g., "Stage I: > 90"
    /Category\s*[A-Z]\s*:.*\d+/i,     // e.g., "Category A: > 90"
    /^[A-Z]\d*\s*\(.*\):/i            // e.g., "G1 (Normal or High):"
  ];

  // Check for multiple lines with this pattern
  const lines = rangeStr.split('\n').filter(line => line.trim() !== '');
  if (lines.length > 1) {
    return patterns.some(pattern => pattern.test(lines[0]));
  }

  return patterns.some(pattern => pattern.test(rangeStr));
};

// Helper to get color for each stage
const getStageColor = (stage: string): string => {
  const stageLower = stage.toLowerCase();

  if (stageLower.includes('g1')) return '#10B981'; // green
  if (stageLower.includes('g2')) return '#3B82F6'; // blue
  if (stageLower.includes('g3a')) return '#F59E0B'; // yellow
  if (stageLower.includes('g3b')) return '#F97316'; // orange
  if (stageLower.includes('g4')) return '#EF4444'; // red
  if (stageLower.includes('g5')) return '#7F1D1D'; // dark red

  return '#6B7280'; // gray
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

export const parseGradedStagingRange = (
  rangeStr: string,
  value: number
): {
  stage: string;
  description: string;
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

// Add this helper function to detect descriptive categorical ranges
export const isDescriptiveCategoricalRange = (rangeStr: string | null): boolean => {
  if (!rangeStr) return false;

  const text = rangeStr.trim();

  // Look for patterns with descriptive labels and numeric thresholds
  const patterns = [
    /\w+\s*:\s*[<>]\s*\d+/i, // e.g., "Normal : < 50"
    /\w+\s+values?\s*:\s*\d+\s*-\s*\d+/i, // e.g., "Slightly elevated values: 50 - 200"
    /^[\w\s]+:\s*[><\d\s-]+$/mi, // General pattern for labeled ranges
  ];

  // Check if it has multiple lines with this pattern
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length > 1) {
    // Check if at least two lines have the pattern
    const patternLines = lines.filter(line =>
      patterns.some(pattern => pattern.test(line))
    );
    return patternLines.length >= 2;
  }

  return patterns.some(pattern => pattern.test(text));
};

// Add this function to parse descriptive categorical ranges
export const parseDescriptiveCategoricalRange = (
  rangeStr: string,
  value: number
): {
  category: string | null;
  description: string | null;
  color: string;
  icon: string;
} | null => {
  if (!rangeStr || isNaN(value)) return null;

  const lines = rangeStr.split('\n').filter(line => line.trim() !== '');
  const categories: Array<{
    label: string;
    description: string;
    test: (val: number) => boolean;
    color: string;
    icon: string;
  }> = [];

  // Parse each line to extract category information
  lines.forEach(line => {
    const trimmed = line.trim();

    // Match patterns like:
    // "Normal : < 50"
    // "Slightly elevated values: 50 - 200"
    // "Significantly elevated values: > 200"
    const match = trimmed.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const [, label, range] = match;
      const cleanedLabel = label.trim();
      const test = createRangeTest(range.trim());
      if (test) {
        // Determine color and icon based on label
        const lowerLabel = cleanedLabel.toLowerCase();
        let color = '#6B7280'; // default gray
        let icon = '';

        if (lowerLabel.includes('normal')) {
          color = '#10B981'; // green
          icon = '✓';
        } else if (lowerLabel.includes('slightly')) {
          color = '#F59E0B'; // orange
          icon = '↑';
        } else if (lowerLabel.includes('significantly') ||
          lowerLabel.includes('high') ||
          lowerLabel.includes('elevated')) {
          color = '#EF4444'; // red
          icon = '↑↑';
        } else if (lowerLabel.includes('low') ||
          lowerLabel.includes('decreased')) {
          color = '#3B82F6'; // blue
          icon = '↓';
        } else if (lowerLabel.includes('borderline')) {
          color = '#F59E0B'; // orange
          icon = '⚠';
        }

        categories.push({
          label: cleanedLabel,
          description: `${cleanedLabel}: ${range.trim()}`,
          test,
          color,
          icon
        });
      }
    }
  });

  // Test value against each category in order
  for (const category of categories) {
    if (category.test(value)) {
      return {
        category: category.label,
        description: category.description,
        color: category.color,
        icon: category.icon
      };
    }
  }

  return null;
};

// Helper to create test function for range strings
const createRangeTest = (rangeStr: string): ((val: number) => boolean) | null => {
  rangeStr = rangeStr.trim();

  // Handle "> 200" or ">200"
  if (rangeStr.startsWith('>')) {
    const threshold = parseFloat(rangeStr.slice(1).trim());
    return !isNaN(threshold) ? (val: number) => val > threshold : null;
  }

  // Handle "< 50" or "<50"
  if (rangeStr.startsWith('<')) {
    const threshold = parseFloat(rangeStr.slice(1).trim());
    return !isNaN(threshold) ? (val: number) => val < threshold : null;
  }

  // Handle "50 - 200" or "50-200"
  if (rangeStr.includes('-')) {
    const parts = rangeStr.split('-').map(part => parseFloat(part.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (val: number) => val >= parts[0] && val <= parts[1];
    }
  }

  // Handle ">= 100" or "<= 100"
  if (rangeStr.startsWith('>=')) {
    const threshold = parseFloat(rangeStr.slice(2).trim());
    return !isNaN(threshold) ? (val: number) => val >= threshold : null;
  }

  if (rangeStr.startsWith('<=')) {
    const threshold = parseFloat(rangeStr.slice(2).trim());
    return !isNaN(threshold) ? (val: number) => val <= threshold : null;
  }

  return null;
};

/**
 * Evaluate a single parameter value against its parameter definition.
 * - parameter: object containing normal_range_min/max and normal_range_text, units etc.
 * - rawValue: the value stored in the test.results for this parameter (may be number or string)
 */
export function evaluateTestResult(rawValue: any, parameter: any): EvaluateResult {
  const displayValue = rawValue ?? null;
  let indicator: ResultIndicator = 'none';
  let isBold = false;
  let stage: string | undefined = undefined;
  let stageColor: string | undefined = undefined;

  // Normalize text fields
  const textRange = (parameter?.normal_range_text || '').toString().trim();

  // Check for graded staging ranges FIRST (e.g., GFR)
  if (isGradedStagingRange(textRange)) {
    const numericValue = typeof rawValue === 'number' ? rawValue :
      (typeof rawValue === 'string' && rawValue.trim() !== '' && !isNaN(Number(rawValue)) ?
        Number(rawValue) : NaN);

    if (!isNaN(numericValue)) {
      const stageInfo = parseGradedStagingRange(textRange, numericValue);
      if (stageInfo) {
        // For staged ranges, we don't use arrows - we use stage indicators
        return {
          displayValue: `${numericValue} (${stageInfo.stage})`,
          indicator: 'none', // No arrows for staged ranges
          isBold: true, // Keep bold for visibility
          stage: stageInfo.stage,
          stageColor: stageInfo.color
        };
      }
    }
  }

  // 2. Check for descriptive categorical ranges (e.g., "Normal: < 50")
  if (isDescriptiveCategoricalRange(textRange)) {
    const numericValue = typeof rawValue === 'number' ? rawValue :
      (typeof rawValue === 'string' && rawValue.trim() !== '' && !isNaN(Number(rawValue)) ?
        Number(rawValue) : NaN);

    if (!isNaN(numericValue)) {
      const categoryInfo = parseDescriptiveCategoricalRange(textRange, numericValue);
      if (categoryInfo) {
        // Determine if we should show arrow based on category
        let indicator: ResultIndicator = 'none';
        if (categoryInfo.icon === '↑' || categoryInfo.icon === '↑↑') {
          indicator = 'up';
          isBold = true;
        } else if (categoryInfo.icon === '↓') {
          indicator = 'down';
          isBold = true;
        } else if (categoryInfo.icon === '✓') {
          indicator = 'normal';
          isBold = false;
        } else if (categoryInfo.icon === '⚠') {
          indicator = 'none';
          isBold = true;
        }

        return {
          displayValue: numericValue,
          indicator,
          isBold,
          valueColor: categoryInfo.color,
          category: categoryInfo.category,
          stage: undefined, // Explicitly undefined for this type of return
          stageColor: undefined // Explicitly undefined for this type of return
        };
      }
    }
  }


  // Helper: parse simple expressions in normal_range_text like "< 10", ">5", "1-2", "M: 0.5-1.5, F: 0.4-1.2"
  function parseRangeFromText(text: string) {
    // remove extra spaces
    const cleaned = text.replace(/\s+/g, ' ').trim();

    // gender-specific "M: x-y, F: a-b"
    const genderMatch = cleaned.match(/(?:M|Male)\s*:\s*([0-9.]+)\s*-\s*([0-9.]+).*?(?:F|Female)\s*:\s*([0-9.]+)\s*-\s*([0-9.]+)/i);
    if (genderMatch) {
      // return first pair as fallback (caller may supply gender later)
      return { min: parseFloat(genderMatch[1]), max: parseFloat(genderMatch[2]) };
    }

    // range like "1-2"
    const rangeMatch = cleaned.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
    if (rangeMatch) return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };

    // < or >
    const lessMatch = cleaned.match(/^<\s*([0-9.]+)/);
    if (lessMatch) return { max: parseFloat(lessMatch[1]) };

    const greaterMatch = cleaned.match(/^>\s*([0-9.]+)/);
    if (greaterMatch) return { min: parseFloat(greaterMatch[1]) };

    return null;
  }

  // If rawValue is null/empty -> nothing to evaluate
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return { displayValue, indicator: 'none', isBold: false };
  }

  // If numeric comparison possible
  const numericValue = typeof rawValue === 'number' ? rawValue :
    (typeof rawValue === 'string' && rawValue.trim() !== '' && !isNaN(Number(rawValue)) ?
      Number(rawValue) : NaN);

  const min = (parameter?.normal_range_min ?? null);
  const max = (parameter?.normal_range_max ?? null);

  // 1) Use explicit numeric min/max columns first
  if ((min !== null && min !== undefined) || (max !== null && max !== undefined)) {
    if (!Number.isNaN(numericValue)) {
      if (min !== null && numericValue < Number(min)) {
        indicator = 'down';
        isBold = true;
      }
      else if (max !== null && numericValue > Number(max)) {
        indicator = 'up';
        isBold = true;
      }
      else {
        indicator = 'normal';
        isBold = false;
      }
    } else {
      // can't evaluate numeric input but have numeric ranges -> treat as none
      indicator = 'none';
      isBold = false;
    }

    return { displayValue, indicator, isBold, stage, stageColor };
  }

  // 2) Parse normal_range_text for <, >, ranges
  if (textRange) {
    const parsed = parseRangeFromText(textRange);
    if (parsed) {
      if (!Number.isNaN(numericValue)) {
        if (parsed.min !== undefined && parsed.min !== null && numericValue < parsed.min) {
          indicator = 'down';
          isBold = true;
        }
        else if (parsed.max !== undefined && parsed.max !== null && numericValue > parsed.max) {
          indicator = 'up';
          isBold = true;
        }
        else {
          indicator = 'normal';
          isBold = false;
        }

        return { displayValue, indicator, isBold, stage, stageColor };
      }
    }

    // 3) Handle categorical comparisons (e.g., "Non Reactive", "Negative", "Absent", "See Report", etc.)
    // If normal text says "Non Reactive" and result is "Reactive" => bold abnormal
    // Normalize for comparison
    const normalizedText = textRange.toLowerCase();
    const normalizedValue = ('' + rawValue).toLowerCase();

    // common pairs -> if normal says 'non reactive' or 'negative' and value is 'reactive' / 'positive' => bold
    const negWords = ['non reactive', 'negative', 'not detected', 'absent', 'clear', 'clear and colorless', 'clear, pale yellow'];
    const posWords = ['reactive', 'positive', 'detected', 'present', 'brown', 'formed', 'high', 'variable'];

    // If normal is one of negWords but result is a pos word => bold
    if (negWords.some(s => normalizedText.includes(s)) && posWords.some(s => normalizedValue.includes(s))) {
      isBold = true;
      indicator = 'none';
      return { displayValue, indicator, isBold, stage, stageColor };
    }

    // If normal is 'see report' -> no automatic indicator
    if (normalizedText.includes('see report')) {
      return { displayValue, indicator: 'none', isBold: false, stage, stageColor };
    }

    // If normalText itself contains '<' or '>' we already parsed earlier; if the result is categorical and mismatches expect bold
    // e.g., normal: "Absent", result: "Present" => bold
    if (negWords.some(s => normalizedText.includes(s)) && !negWords.some(s => normalizedValue.includes(s))) {
      isBold = true;
      return { displayValue, indicator: 'none', isBold, stage, stageColor };
    }

    // If the normalText contains "high" or "low" terms and numericValue present, try to flag
    if ((normalizedText.includes('high') || normalizedText.includes('>')) && !Number.isNaN(numericValue)) {
      // if normal includes >X then parsed would have handled it; fallback: mark 'up' if value large (simple heuristic)
      // skip heuristic to avoid false positives. return none
      return { displayValue, indicator: 'none', isBold, stage, stageColor };
    }
  }

  // Default: no indicator
  return { displayValue, indicator: 'none', isBold: false, stage, stageColor };
}