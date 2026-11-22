/*
======================================================
    FORMAT MODULE (pure, no DOM)
------------------------------------------------------
  Turns dose-module results into the text and markup the
  results table shows.

    formatDose(number)                       -> string
    bolusView(label, unit, result)           -> {label, dose, vol}
    infusionView(result)                     -> {rate}
    verifyView(result)                       -> {text} | {html}
                                                (no weight -> 'Enter weight')
======================================================
*/

export function formatDose(num) {
	return Number(num.toFixed(2)).toString();
}

const range = (min, max, fmt = formatDose) =>
	min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;

export function bolusView(baseLabel, unit, r) {
	return {
		label: r.capped
			? `${baseLabel} || <span style="color:red;"><span style="font-size:0.9em;">⚠️</span> Dose Cap <span style="font-size:0.9em;">⚠️</span></span>`
			: baseLabel,
		dose: `${range(r.min, r.max)} ${unit}`,
		vol: `${range(r.minMl, r.maxMl)} mL`,
	};
}

export function infusionView(r) {
	return { rate: `${formatDose(r.min)} – ${formatDose(r.max)} ${r.rateUnit}` };
}

export function verifyView(r) {
	if (r.status === 'needs-weight') return { text: 'Enter weight' };
	if (r.status === 'no-dose') return { text: '--' };
	if (r.status === 'over-max') {
		return { html: `
			<span style="color:red; font-size: 14px;">
				<span style="font-size:0.9em;">⚠️</span>
				${formatDose(r.mlHr)} mL/hr exceeds guideline max of: ${formatDose(r.maxMlHr)} mL/hr
				<span style="font-size:0.9em;">⚠️</span>
			</span>
		` };
	}
	return { text: `${formatDose(r.mlHr)} mL/hr` };
}
