import { UbuntuInputs, UbuntuOutputs } from "./types";

const ubuntuCache = new Map<string, UbuntuOutputs>();

function generateKey(inputs: UbuntuInputs): string {
    return JSON.stringify(inputs);
}

export function getCachedUbuntu(
    inputs: UbuntuInputs
): UbuntuOutputs | null {
    return ubuntuCache.get(generateKey(inputs)) ?? null;
}

export function setCachedUbuntu(
    inputs: UbuntuInputs,
    result: UbuntuOutputs
) {
    ubuntuCache.set(generateKey(inputs), result);
}
