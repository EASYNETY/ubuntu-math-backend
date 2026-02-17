import { UbuntuInputs } from "./types";

export function validateUbuntuInputs(inputs: UbuntuInputs): void {
    if (inputs.resourcesCaptured <= 0) {
        throw new Error("Resources must be greater than zero.");
    }

    if (inputs.communitySize <= 0) {
        throw new Error("Community size must be greater than zero.");
    }

    if (inputs.communitySize > 1_000_000_000) {
        throw new Error("Community size too large.");
    }

    if (inputs.resourcesCaptured > 1_000_000_000_000) {
        throw new Error("Resources value too large.");
    }

    if (!inputs.innovationType && (!inputs.innovations || inputs.innovations.length === 0)) {
        throw new Error("Must provide at least one innovation type.");
    }
}
