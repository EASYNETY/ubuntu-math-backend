import { UbuntuInputs, TraditionalOutputs } from "./types";
import { roundToTwo } from "./utils";

export function computeTraditionalModel(
    inputs: UbuntuInputs
): TraditionalOutputs {
    const operatingCosts = inputs.operatingCosts ?? 0;

    const profit =
        inputs.resourcesCaptured - operatingCosts;

    const roiPercentage =
        (profit / inputs.resourcesCaptured) * 100;

    return {
        profit: roundToTwo(profit),
        roiPercentage: roundToTwo(roiPercentage)
    };
}
