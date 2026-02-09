/**
 * Simple intent parser interface
 * This can be replaced with NLP/ML-based parsing later
 */

export interface ParsedIntent {
  localities: string[];
  areaMin?: number;
  areaMax?: number;
  bhk?: number;
  budgetMin?: number;
  budgetMax?: number;
  amenities: string[];
}

export interface IntentParser {
  parse(rawText: string): ParsedIntent;
}

/**
 * Basic keyword-based parser
 * Simple regex and keyword matching - to be replaced with NLP later
 */
export class KeywordIntentParser implements IntentParser {
  parse(rawText: string): ParsedIntent {
    const text = rawText.toLowerCase();

    return {
      localities: this.extractLocalities(text),
      areaMin: this.extractAreaMin(text),
      areaMax: this.extractAreaMax(text),
      bhk: this.extractBHK(text),
      budgetMin: this.extractBudgetMin(text),
      budgetMax: this.extractBudgetMax(text),
      amenities: this.extractAmenities(text),
    };
  }

  private extractLocalities(text: string): string[] {
    const localities: string[] = [];
    
    // Common location keywords
    const locationKeywords = ['in', 'near', 'around', 'locality', 'area'];
    
    // Look for patterns like "in Indiranagar" or "near Koramangala"
    for (const keyword of locationKeywords) {
      const regex = new RegExp(`${keyword}\\s+([a-z]+(?:\\s+[a-z]+)?)`, 'gi');
      const matches = text.matchAll(regex);
      
      for (const match of matches) {
        if (match[1]) {
          localities.push(match[1].trim());
        }
      }
    }

    return [...new Set(localities)]; // Remove duplicates
  }

  private extractBHK(text: string): number | undefined {
    // Look for patterns like "2 bhk", "3bhk", "2-bhk"
    const bhkMatch = text.match(/(\d+)\s*[-]?\s*bhk/i);
    if (bhkMatch) {
      return parseInt(bhkMatch[1]);
    }

    // Look for patterns like "2 bedroom"
    const bedroomMatch = text.match(/(\d+)\s*bedroom/i);
    if (bedroomMatch) {
      return parseInt(bedroomMatch[1]);
    }

    return undefined;
  }

  private extractAreaMin(text: string): number | undefined {
    // Look for patterns like "minimum 1000 sqft" or "at least 1200 sq ft"
    const minMatch = text.match(/(?:minimum|min|at least)\s*(\d+)\s*(?:sq\s*ft|sqft|square feet)/i);
    if (minMatch) {
      return parseInt(minMatch[1]);
    }

    // Look for range patterns like "1000-1500 sqft"
    const rangeMatch = text.match(/(\d+)\s*[-to]\s*(\d+)\s*(?:sq\s*ft|sqft|square feet)/i);
    if (rangeMatch) {
      return parseInt(rangeMatch[1]);
    }

    return undefined;
  }

  private extractAreaMax(text: string): number | undefined {
    // Look for patterns like "maximum 1500 sqft" or "up to 2000 sq ft"
    const maxMatch = text.match(/(?:maximum|max|up to)\s*(\d+)\s*(?:sq\s*ft|sqft|square feet)/i);
    if (maxMatch) {
      return parseInt(maxMatch[1]);
    }

    // Look for range patterns like "1000-1500 sqft"
    const rangeMatch = text.match(/(\d+)\s*[-to]\s*(\d+)\s*(?:sq\s*ft|sqft|square feet)/i);
    if (rangeMatch) {
      return parseInt(rangeMatch[2]);
    }

    return undefined;
  }

  private extractBudgetMin(text: string): number | undefined {
    // Look for patterns like "budget 50 lakhs to 70 lakhs"
    const rangeMatch = text.match(/budget.*?(\d+\.?\d*)\s*(?:lakhs?|lacs?|l)\s*(?:to|[-])\s*(\d+\.?\d*)\s*(?:lakhs?|lacs?|l)/i);
    if (rangeMatch) {
      return parseFloat(rangeMatch[1]) * 100000;
    }

    // Look for Crore ranges
    const rangeMatchCr = text.match(/budget.*?(\d+\.?\d*)\s*(?:cr|crore|crores)\s*(?:to|[-])\s*(\d+\.?\d*)\s*(?:cr|crore|crores)/i);
    if (rangeMatchCr) {
      return parseFloat(rangeMatchCr[1]) * 10000000;
    }

    // Look for patterns like "minimum 50 lakhs"
    const minMatch = text.match(/(?:minimum|min|at least|above)\s*(?:budget\s*)?(\d+\.?\d*)\s*(?:lakhs?|lacs?|l)/i);
    if (minMatch) {
      return parseFloat(minMatch[1]) * 100000;
    }
    
    const minMatchCr = text.match(/(?:minimum|min|at least|above)\s*(?:budget\s*)?(\d+\.?\d*)\s*(?:cr|crore|crores)/i);
    if (minMatchCr) {
      return parseFloat(minMatchCr[1]) * 10000000;
    }

    return undefined;
  }

  private extractBudgetMax(text: string): number | undefined {
    // Look for patterns like "budget 50 lakhs to 70 lakhs"
    const rangeMatch = text.match(/budget.*?(\d+\.?\d*)\s*(?:lakhs?|lacs?|l)\s*(?:to|[-])\s*(\d+\.?\d*)\s*(?:lakhs?|lacs?|l)/i);
    if (rangeMatch) {
      return parseFloat(rangeMatch[2]) * 100000;
    }

    // Look for Crore ranges
    const rangeMatchCr = text.match(/budget.*?(\d+\.?\d*)\s*(?:cr|crore|crores)\s*(?:to|[-])\s*(\d+\.?\d*)\s*(?:cr|crore|crores)/i);
    if (rangeMatchCr) {
      return parseFloat(rangeMatchCr[2]) * 10000000;
    }

    // Look for patterns like "maximum 70 lakhs" or "under 80 lakhs" OR "around 1 crore" (treat around as a cap or target)
    // Adding "around" and "budget" (implied max)
    const maxMatch = text.match(/(?:maximum|max|up to|under|below|around)\s*(?:budget\s*)?(\d+\.?\d*)\s*(?:lakhs?|lacs?|l)/i);
    if (maxMatch) {
      return parseFloat(maxMatch[1]) * 100000;
    }

    const maxMatchCr = text.match(/(?:maximum|max|up to|under|below|around)\s*(?:budget\s*)?(\d+\.?\d*)\s*(?:cr|crore|crores)/i);
    if (maxMatchCr) {
      return parseFloat(maxMatchCr[1]) * 10000000;
    }
    
    // Fallback: if just "budget 1 crore" is said, treat as max
    const simpleBudgetCr = text.match(/budget\s*(?:is\s*)?(?:around\s*)?(\d+\.?\d*)\s*(?:cr|crore|crores)/i);
    if (simpleBudgetCr) {
       return parseFloat(simpleBudgetCr[1]) * 10000000;
    }
    
    const simpleBudgetLakh = text.match(/budget\s*(?:is\s*)?(?:around\s*)?(\d+\.?\d*)\s*(?:lakhs?|lacs?|l)/i);
    if (simpleBudgetLakh) {
       return parseFloat(simpleBudgetLakh[1]) * 100000;
    }

    return undefined;
  }

  private extractAmenities(text: string): string[] {
    const amenities: string[] = [];
    
    // Common amenities to look for
    const commonAmenities = [
      'parking',
      'gym',
      'swimming pool',
      'pool',
      'garden',
      'security',
      'lift',
      'elevator',
      'power backup',
      'clubhouse',
      'playground',
      'wifi',
      'internet',
      'ac',
      'air conditioning',
      'balcony',
      'terrace',
    ];

    for (const amenity of commonAmenities) {
      if (text.includes(amenity)) {
        amenities.push(amenity);
      }
    }

    return [...new Set(amenities)]; // Remove duplicates
  }
}
