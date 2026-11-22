/*
======================================================
    DOSE MODULE (pure, no DOM)
------------------------------------------------------
  Interface:
    weightStatus(profile, weight)             -> 'ok' | 'over-max'
    computeBolus(med, protocol, weight)       -> {min, max, minMl, maxMl, capped}
    computeInfusion(med, protocol, weight)    -> {min, max, rateUnit, minMlHr, maxMlHr}
    verifyInfusion(med, protocol, weight, dose)
                                              -> {status, mlHr, maxMlHr}
                                                 status: 'ok' | 'over-max' | 'no-dose'

  All numbers are unrounded. Rounding and text belong to the caller.
  The medication's concentration is per mL in the medication's unit.
======================================================
*/

export const MAX_WEIGHT = {
	adult: 200,
	geriatric: 150,
	pediatric: 90,
};

export function weightStatus(profile, weight) {
	return weight > MAX_WEIGHT[profile] ? 'over-max' : 'ok';
}

// Only mcg-on-a-mg-medication is converted. The registry validator rejects other mismatches.
function unitFactor(med, protocol) {
	const activeUnit = protocol.unit || med.unit;
	return (activeUnit === 'mcg' && med.unit === 'mg') ? 0.001 : 1;
}

export function computeBolus(med, protocol, weight) {
	const dr = protocol.doseRange;
	let min = dr.absolute ? dr.min : weight * dr.min;
	let max = dr.absolute ? dr.max : weight * dr.max;
	let capped = false;

	if (typeof dr.maxTotal === 'number') {
		if (min > dr.maxTotal) { min = dr.maxTotal; capped = true; }
		if (max > dr.maxTotal) { max = dr.maxTotal; capped = true; }
	}

	return {
		min, max,
		minMl: min / med.concentration,
		maxMl: max / med.concentration,
		capped,
	};
}

export function computeInfusion(med, protocol, weight) {
	const rate = protocol.infusionRate;
	const activeUnit = protocol.unit || med.unit;
	const min = rate.absolute ? rate.min : weight * rate.min;
	const max = rate.absolute ? rate.max : weight * rate.max;
	const perHour = rate.absolute ? 1 : (rate.perMinute ? 60 : 1);
	const factor = unitFactor(med, protocol);

	return {
		min, max,
		rateUnit: rate.perMinute ? `${activeUnit}/min` : `${activeUnit}/hr`,
		minMlHr: (min * perHour * factor) / med.concentration,
		maxMlHr: (max * perHour * factor) / med.concentration,
	};
}

function doseToMlHr(med, protocol, weight, dose) {
	const rate = protocol.infusionRate;
	const factor = unitFactor(med, protocol);
	if (rate.absolute) return (dose * factor) / med.concentration;
	if (rate.perMinute) return (dose * factor * weight * 60) / med.concentration;
	return (dose * factor * weight) / med.concentration;
}

export function verifyInfusion(med, protocol, weight, dose) {
	if (!dose || dose <= 0) return { status: 'no-dose' };

	const rate = protocol.infusionRate;
	const mlHr = doseToMlHr(med, protocol, weight, dose);

	if (typeof rate.maxRate === 'number' && dose > rate.maxRate) {
		return { status: 'over-max', mlHr, maxMlHr: doseToMlHr(med, protocol, weight, rate.maxRate) };
	}
	return { status: 'ok', mlHr };
}
