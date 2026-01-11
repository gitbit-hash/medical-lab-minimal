// lib/utils/gender-ranges.ts
export interface GenderRange {
  male?: string;
  female?: string;
  default?: string;
}

/**
 * Parses gender-specific ranges from normal range text
 * Examples: 
 * - "M: 13.5-17.5 g/dL, F: 12.0-15.5 g/dL"
 * - "Male: 4.5-5.9 million/μL, Female: 4.1-5.1 million/μL"
 */
export function parseGenderRanges(rangeText: string | null): GenderRange {
  if (!rangeText) return { default: '' };

  const ranges: GenderRange = {};

  // Multiple patterns to catch different formats
  const patterns = [
    /(?:M|Male)\s*:\s*([^,F]+)(?:,\s*(?:F|Female)\s*:\s*([^,]+))?/i,
    /(?:F|Female)\s*:\s*([^,M]+)(?:,\s*(?:M|Male)\s*:\s*([^,]+))?/i
  ];

  for (const pattern of patterns) {
    const match = rangeText.match(pattern);
    if (match) {
      // Check which pattern matched and assign accordingly
      if (pattern.source.includes('(?:M|Male)')) {
        ranges.male = match[1]?.trim();
        ranges.female = match[2]?.trim();
      } else {
        ranges.female = match[1]?.trim();
        ranges.male = match[2]?.trim();
      }
      break;
    }
  }

  // If no gender-specific ranges found, use as default
  if (!ranges.male && !ranges.female) {
    ranges.default = rangeText;
  }

  return ranges;
}

/**
 * Gets the appropriate range based on patient gender
 */
export function getGenderSpecificRange(rangeText: string | null, gender: string | null): string {
  const ranges = parseGenderRanges(rangeText);

  if (gender === 'Male' && ranges.male) {
    return ranges.male;
  }

  if (gender === 'Female' && ranges.female) {
    return ranges.female;
  }

  return ranges.default || rangeText || '';
}

/**
 * Checks if a range text contains gender-specific ranges
 */
export function hasGenderSpecificRanges(rangeText: string | null): boolean {
  if (!rangeText) return false;
  return /(?:M|Male|F|Female)\s*:/i.test(rangeText);
}