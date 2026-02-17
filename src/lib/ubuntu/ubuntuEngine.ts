import { UbuntuInputs, UbuntuOutputs, InnovationWeight } from "./types";
import { validateUbuntuInputs } from "./validators";
import { getImpactMultiplier, getEnvironmentalScore } from "./multipliers";
import { roundToTwo } from "./utils";

export function computeUbuntuModel(
    inputs: UbuntuInputs
): UbuntuOutputs {
    validateUbuntuInputs(inputs);

    // 1. Handle Blending Logic
    let blendedMultiplier = 0;
    let blendedEnvScore = 0;

    const innovations: InnovationWeight[] = inputs.innovations ||
        (inputs.innovationType ? [{ innovationType: inputs.innovationType, weight: 1.0 }] : []);

    if (innovations.length === 0) {
        throw new Error("No innovation provided.");
    }

    // Normalize weights if necessary (simple sum check)
    const totalWeight = innovations.reduce((sum, item) => sum + item.weight, 0);

    innovations.forEach(item => {
        const normalizedWeight = item.weight / totalWeight;
        blendedMultiplier += getImpactMultiplier(item.innovationType) * normalizedWeight;
        blendedEnvScore += getEnvironmentalScore(item.innovationType) * normalizedWeight;
    });

    // 2. Core Snapshot Calculation (Year 0)
    const socialDividend =
        (inputs.resourcesCaptured * blendedMultiplier) /
        inputs.communitySize;

    const strategicReserves =
        inputs.resourcesCaptured * 0.3;

    const communalValueScore =
        socialDividend * 0.6 +
        strategicReserves * 0.4;

    // 3. Time-based Compounding & Growth Modeling
    const duration = inputs.durationYears || 5;
    const baseGrowthRate = inputs.initialGrowthRate || 0.05;

    let currentCommunitySize = inputs.communitySize;
    let currentResources = inputs.resourcesCaptured;
    let currentKeyVal = communalValueScore;

    const communityGrowthSeries: number[] = [currentCommunitySize];

    // Feedback Loop: Environmental Score boosts sustainability (growth retention)
    // Higher Env Score (max 10) reduces "churn" or waste, effectively boosting net growth slightly
    const sustainabilityFactor = 1 + (blendedEnvScore / 100);

    for (let i = 1; i <= duration; i++) {
        // Logic: Community grows based on base rate * sustainability
        // Resources grow based on innovation efficiency (multiplier) but constrained by community size

        const growthRate = baseGrowthRate * sustainabilityFactor;

        currentCommunitySize = currentCommunitySize * (1 + growthRate);

        // Resources grow, but diminishing returns if community is small? 
        // Let's assume innovation scales resources with community
        const resourceGrowth = growthRate * (blendedMultiplier * 0.5); // Innovation drives resource efficiency
        currentResources = currentResources * (1 + resourceGrowth);

        // Recalculate Dividend for Year i
        const projectedDiv = (currentResources * blendedMultiplier) / currentCommunitySize;
        const projectedReserves = currentResources * 0.3;

        currentKeyVal = (projectedDiv * 0.6) + (projectedReserves * 0.4);

        communityGrowthSeries.push(Math.round(currentCommunitySize));
    }

    return {
        socialDividend: roundToTwo(socialDividend),
        strategicReserves: roundToTwo(strategicReserves),
        communalValueScore: roundToTwo(communalValueScore),

        // New Extended Metrics
        impactMultiplier: roundToTwo(blendedMultiplier),
        environmentalScore: roundToTwo(blendedEnvScore),
        projectedCommunalValue: roundToTwo(currentKeyVal),
        communityGrowth: communityGrowthSeries
    };
}
