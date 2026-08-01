export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const poundsToKilograms = (pounds: number) => pounds * KG_PER_LB;
export const kilogramsToPounds = (kilograms: number) => kilograms / KG_PER_LB;
export const inchesToCentimeters = (inches: number) => inches * CM_PER_IN;
export const centimetersToInches = (centimeters: number) => centimeters / CM_PER_IN;
