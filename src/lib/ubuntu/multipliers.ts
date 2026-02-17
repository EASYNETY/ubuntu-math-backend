import { InnovationType } from "./types";

export const IMPACT_MULTIPLIERS: Record<InnovationType, number> = {
    drone_monitoring: 1.8,
    oil_spill_prevention: 2.2,
    illegal_fishing_prevention: 1.9,
    agritech: 1.6,
    custom: 1.5
};

export const ENVIRONMENTAL_SCORES: Record<InnovationType, number> = {
    drone_monitoring: 8.5, // Low impact, high monitoring
    oil_spill_prevention: 10.0, // Critical ecosystem restoration
    illegal_fishing_prevention: 9.0, // Marine life protection
    agritech: 7.5, // Sustainable farming
    custom: 5.0
};

export function getImpactMultiplier(type: InnovationType): number {
    return IMPACT_MULTIPLIERS[type] ?? IMPACT_MULTIPLIERS.custom;
}

export function getEnvironmentalScore(type: InnovationType): number {
    return ENVIRONMENTAL_SCORES[type] ?? ENVIRONMENTAL_SCORES.custom;
}
