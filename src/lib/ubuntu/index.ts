import { computeUbuntuModel } from "./ubuntuEngine";
import { computeTraditionalModel } from "./traditionalEngine";
import { getCachedUbuntu, setCachedUbuntu } from "./cache";
import { UbuntuInputs } from "./types";

export * from "./types";

export function runUbuntuComparison(
    inputs: UbuntuInputs
) {
    const cached = getCachedUbuntu(inputs);

    if (cached) {
        return {
            ubuntu: cached,
            traditional: computeTraditionalModel(inputs),
            cached: true
        };
    }

    const ubuntuResult = computeUbuntuModel(inputs);
    setCachedUbuntu(inputs, ubuntuResult);

    return {
        ubuntu: ubuntuResult,
        traditional: computeTraditionalModel(inputs),
        cached: false
    };
}
