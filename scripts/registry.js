/*
======================================================
    REGISTRY MODULE (pure, no DOM)
------------------------------------------------------
  Interface:
    protocolFor(med, profile)                -> Protocol | null
    entriesFor(medications, profile)         -> [{id, label, unit, sections, protocol}]
                                                (medications that have a protocol for the
                                                 profile, in registry order)
    validateRegistry(medications, sectionIds)-> string[]   (empty when the registry is sound)

  The data itself lives in data/medications.js.
======================================================
*/

export function protocolFor(med, profile) {
	return med.protocols[profile] || med.protocols.standard || null;
}

export function entriesFor(medications, profile) {
	return Object.entries(medications).flatMap(([name, med]) => {
		const protocol = protocolFor(med, profile);
		if (!protocol) return [];
		return [{
			id: name,
			label: med.label || name,
			unit: protocol.unit || med.unit,
			sections: med.section,
			protocol,
		}];
	});
}

const REQUIRED_FIELDS = ['section', 'concentration', 'unit', 'protocols'];
const KNOWN_PROTOCOL_KEYS = ['doseRange', 'infusionRate', 'description', 'label', 'unit'];

function convertible(medUnit, protocolUnit) {
	return protocolUnit === medUnit || (protocolUnit === 'mcg' && medUnit === 'mg');
}

function checkProtocol(name, profile, med, protocol, problems) {
	const where = `MEDICATIONS["${name}"].protocols.${profile}`;

	if (!protocol.doseRange && !protocol.infusionRate) {
		problems.push(`${where} has neither doseRange nor infusionRate`);
	}
	if (!protocol.description) {
		problems.push(`${where} is missing description — verify row will not render`);
	}
	Object.keys(protocol).forEach(key => {
		if (!KNOWN_PROTOCOL_KEYS.includes(key)) {
			problems.push(`${where} has unrecognized key: "${key}" — possible typo`);
		}
	});

	const activeUnit = protocol.unit || med.unit;
	if (med.unit !== undefined && !convertible(med.unit, activeUnit)) {
		problems.push(`${where} cannot convert unit "${activeUnit}" to "${med.unit}"`);
	}

	for (const kind of ['doseRange', 'infusionRate']) {
		const r = protocol[kind];
		if (r && r.min > r.max) problems.push(`${where}.${kind} min (${r.min}) is above max (${r.max})`);
	}
}

export function validateRegistry(medications, sectionIds) {
	const problems = [];

	Object.entries(medications).forEach(([name, med]) => {
		REQUIRED_FIELDS.forEach(field => {
			if (med[field] === undefined) problems.push(`MEDICATIONS["${name}"] missing: "${field}"`);
		});

		if (med.concentration !== undefined && !(med.concentration > 0)) {
			problems.push(`MEDICATIONS["${name}"] concentration must be a positive number`);
		}

		(med.section || []).forEach(id => {
			if (!sectionIds.includes(id)) problems.push(`MEDICATIONS["${name}"] has unknown section "${id}"`);
		});

		Object.entries(med.protocols || {}).forEach(([profile, protocol]) => {
			checkProtocol(name, profile, med, protocol, problems);
		});
	});

	return problems;
}
