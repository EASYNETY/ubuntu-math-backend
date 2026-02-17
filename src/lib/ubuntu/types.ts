export type InnovationType =
  | "drone_monitoring"
  | "oil_spill_prevention"
  | "illegal_fishing_prevention"
  | "agritech"
  | "custom";

export interface InnovationWeight {
  innovationType: InnovationType;
  weight: number; // 0.0 - 1.0 (Sum should be 1.0)
}

export interface UbuntuInputs {
  resourcesCaptured: number;
  communitySize: number;
  innovationType?: InnovationType; // Kept for backward compatibility
  innovations?: InnovationWeight[]; // New blending input
  operatingCosts?: number;
  durationYears?: number; // Time-based compounding (default: 5)
  initialGrowthRate?: number; // Community growth modeling (default: 0.05)
}

export interface UbuntuOutputs {
  socialDividend: number;
  strategicReserves: number;
  communalValueScore: number;
  impactMultiplier: number; // Blended or single
  environmentalScore: number; // New metric (0-10)
  projectedCommunalValue: number; // Time-based compounding result
  communityGrowth: number[]; // Community size over years
}

export interface TraditionalOutputs {
  profit: number;
  roiPercentage: number;
}
