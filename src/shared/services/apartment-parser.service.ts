import { logger } from '../utils/logger';

export interface ApartmentUnit {
    dong?: number;
    ho?: number;
    floor?: number;
    rawText: string;
    confidence: number;
}

export interface ParsedLocation {
    units: ApartmentUnit[];
    hasLocation: boolean;
    rawMatches: string[];
}

export class ApartmentParserService {
    
    /**
     * Parse apartment unit information from Korean text
     */
    parseApartmentUnits(text: string): ParsedLocation {
        if (!text || typeof text !== 'string') {
            return { units: [], hasLocation: false, rawMatches: [] };
        }

        const units: ApartmentUnit[] = [];
        const rawMatches: string[] = [];

        try {
            // Normalize text for better parsing
            const normalizedText = this.normalizeText(text);
            
            // Parse different patterns
            const patterns = [
                this.parseDongHoPattern(normalizedText),
                this.parseNumberDongHoPattern(normalizedText),
                this.parseFloorUnitPattern(normalizedText),
                this.parseSimpleNumberPattern(normalizedText)
            ];

            // Combine results from all patterns
            patterns.forEach(result => {
                units.push(...result.units);
                rawMatches.push(...result.rawMatches);
            });

            // Remove duplicates and sort by confidence
            const uniqueUnits = this.deduplicateUnits(units);
            const sortedUnits = uniqueUnits.sort((a, b) => b.confidence - a.confidence);

            logger.info('Apartment units parsed', {
                inputText: text.substring(0, 100),
                unitsFound: sortedUnits.length,
                units: sortedUnits
            });

            return {
                units: sortedUnits,
                hasLocation: sortedUnits.length > 0,
                rawMatches: [...new Set(rawMatches)]
            };

        } catch (error) {
            logger.error('Error parsing apartment units', { error, text });
            return { units: [], hasLocation: false, rawMatches: [] };
        }
    }

    /**
     * Parse standard "X동 Y호" pattern
     */
    private parseDongHoPattern(text: string): ParsedLocation {
        const units: ApartmentUnit[] = [];
        const rawMatches: string[] = [];

        // Pattern: 101동 1502호, 5동 203호, etc.
        const dongHoRegex = /(\d{1,3})동\s*(\d{1,4})호/g;
        let match;

        while ((match = dongHoRegex.exec(text)) !== null) {
            const dong = parseInt(match[1]);
            const ho = parseInt(match[2]);
            const floor = Math.floor(ho / 100); // Extract floor from ho number
            
            units.push({
                dong,
                ho,
                floor: floor > 0 ? floor : undefined,
                rawText: match[0],
                confidence: 0.95 // High confidence for standard pattern
            });
            
            rawMatches.push(match[0]);
        }

        return { units, hasLocation: units.length > 0, rawMatches };
    }

    /**
     * Parse number-only patterns with context
     */
    private parseNumberDongHoPattern(text: string): ParsedLocation {
        const units: ApartmentUnit[] = [];
        const rawMatches: string[] = [];

        // Pattern: 101-1502, 5-203 (dong-ho format)
        const numberDongHoRegex = /(\d{1,3})-(\d{1,4})/g;
        let match;

        while ((match = numberDongHoRegex.exec(text)) !== null) {
            const dong = parseInt(match[1]);
            const ho = parseInt(match[2]);
            const floor = Math.floor(ho / 100);
            
            // Only if numbers make sense for apartment units
            if (dong >= 1 && dong <= 999 && ho >= 1 && ho <= 9999) {
                units.push({
                    dong,
                    ho,
                    floor: floor > 0 ? floor : undefined,
                    rawText: match[0],
                    confidence: 0.8 // Medium confidence
                });
                
                rawMatches.push(match[0]);
            }
        }

        return { units, hasLocation: units.length > 0, rawMatches };
    }

    /**
     * Parse floor and unit patterns
     */
    private parseFloorUnitPattern(text: string): ParsedLocation {
        const units: ApartmentUnit[] = [];
        const rawMatches: string[] = [];

        // Pattern: 15층 02호, 3층 101호
        const floorUnitRegex = /(\d{1,2})층\s*(\d{1,4})호/g;
        let match;

        while ((match = floorUnitRegex.exec(text)) !== null) {
            const floor = parseInt(match[1]);
            const ho = parseInt(match[2]);
            
            units.push({
                floor,
                ho,
                rawText: match[0],
                confidence: 0.85 // Good confidence for floor pattern
            });
            
            rawMatches.push(match[0]);
        }

        return { units, hasLocation: units.length > 0, rawMatches };
    }

    /**
     * Parse simple number patterns with apartment context
     */
    private parseSimpleNumberPattern(text: string): ParsedLocation {
        const units: ApartmentUnit[] = [];
        const rawMatches: string[] = [];

        // Look for apartment-related context words
        const apartmentContext = /(?:우리집|저희집|우리|저희|여기|이곳).*?(\d{3,4})/g;
        let match;

        while ((match = apartmentContext.exec(text)) !== null) {
            const number = parseInt(match[1]);
            
            // Likely a ho number if 3-4 digits
            if (number >= 100 && number <= 9999) {
                const floor = Math.floor(number / 100);
                
                units.push({
                    ho: number,
                    floor: floor > 0 ? floor : undefined,
                    rawText: match[0],
                    confidence: 0.6 // Lower confidence for context-based
                });
                
                rawMatches.push(match[1]);
            }
        }

        return { units, hasLocation: units.length > 0, rawMatches };
    }

    /**
     * Normalize Korean text for better parsing
     */
    private normalizeText(text: string): string {
        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0)) // Full-width to half-width numbers
            .trim();
    }

    /**
     * Remove duplicate units based on dong/ho combination
     */
    private deduplicateUnits(units: ApartmentUnit[]): ApartmentUnit[] {
        const seen = new Set<string>();
        const unique: ApartmentUnit[] = [];

        for (const unit of units) {
            const key = `${unit.dong || 'x'}-${unit.ho || 'x'}-${unit.floor || 'x'}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(unit);
            }
        }

        return unique;
    }

    /**
     * Format apartment unit for display
     */
    formatUnit(unit: ApartmentUnit): string {
        const parts: string[] = [];
        
        if (unit.dong) {
            parts.push(`${unit.dong}동`);
        }
        
        if (unit.ho) {
            parts.push(`${unit.ho}호`);
        } else if (unit.floor) {
            parts.push(`${unit.floor}층`);
        }

        return parts.join(' ') || unit.rawText;
    }

    /**
     * Get apartment unit summary
     */
    getUnitSummary(parsed: ParsedLocation): string {
        if (!parsed.hasLocation || parsed.units.length === 0) {
            return '위치 정보 없음';
        }

        const bestUnit = parsed.units[0]; // Highest confidence
        return this.formatUnit(bestUnit);
    }

    /**
     * Validate if parsed unit makes sense for Korean apartments
     */
    validateUnit(unit: ApartmentUnit): boolean {
        // Korean apartment validation rules
        if (unit.dong && (unit.dong < 1 || unit.dong > 999)) return false;
        if (unit.ho && (unit.ho < 1 || unit.ho > 9999)) return false;
        if (unit.floor && (unit.floor < 1 || unit.floor > 99)) return false;
        
        // Ho number should match floor if both exist
        if (unit.ho && unit.floor) {
            const expectedFloor = Math.floor(unit.ho / 100);
            if (expectedFloor !== unit.floor && expectedFloor > 0) return false;
        }

        return true;
    }
}

// Singleton instance
export const apartmentParser = new ApartmentParserService();