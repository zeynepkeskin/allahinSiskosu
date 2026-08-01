export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;
export const poundsToKilograms = (pounds: number) => pounds * KG_PER_LB;
export const kilogramsToPounds = (kilograms: number) =>
  roundToOneDecimal(kilograms / KG_PER_LB);
export const inchesToCentimeters = (inches: number) => inches * CM_PER_IN;
export const centimetersToInches = (centimeters: number) =>
  roundToOneDecimal(centimeters / CM_PER_IN);
