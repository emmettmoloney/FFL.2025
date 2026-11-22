/*
======================================================
    RESULTS TABLE MODULE
------------------------------------------------------
  Owns every medication row on the calculator page.

    const table = createResultsTable({ onVerify })
    table.build(entries)            entries: [{id, label, unit, sections, protocol}]
    table.showBolus(id, view)       view: {label, dose, vol}
    table.showInfusion(id, view)    view: {rate}
    table.showVerify(id, view)      view: {text} | {html}
    table.clear()
    table.verifyDoses()             -> [{id, dose}] for verify inputs that hold a value
    onVerify(id, dose)              called when a verify input changes (dose is a number or NaN)

  Rows keep their own element references. Callers never look cells up by class name or id.
======================================================
*/

export function createResultsTable({ onVerify }) {
	const rows = new Map(); // id -> [{labelCell, label, doseCell, volCell, infSpan, verifyInput, verifyOut}]

	const refsFor = id => rows.get(id) || [];

	function sectionConfigFor(entries) {
		const config = {};
		entries.forEach(({ sections, protocol }) => {
			sections.forEach(sectionId => {
				config[sectionId] = config[sectionId] || { hasBolus: false, hasInfusion: false };
				if (protocol.doseRange) config[sectionId].hasBolus = true;
				if (protocol.infusionRate) config[sectionId].hasInfusion = true;
			});
		});
		return config;
	}

	function buildRow(entry, config) {
		const { id, label, unit, protocol } = entry;
		const row = document.createElement('tr');
		const ref = { label };

		if (protocol.infusionRate) {
			const rate = protocol.infusionRate;
			const doseUnit = rate.absolute
				? `${unit}/hr`
				: rate.perMinute
					? `${unit}/kg/min`
					: `${unit}/kg/hr`;

			row.innerHTML += `<td class="${id}-label" style="text-align: left;">
				${label}
				<br>
				<span class="${id}-inf" style="font-size: 11px; font-style: italic;">--</span>
			</td>`;

			if (config.hasBolus)
				row.innerHTML += `<td class="empty-cell"></td><td class="empty-cell"></td>`;

			row.innerHTML += `
				<td style="text-align: center;">
					<input type="number" class="verify-input" id="verify-${id}" placeholder="${doseUnit}">
				</td>
				<td style="text-align: center;">
					<span id="verify-out-${id}"></span>
				</td>
			`;
		} else {
			row.innerHTML += `<td class="${id}-label">${label}</td>`;

			if (config.hasBolus) {
				row.innerHTML += protocol.doseRange
					? `<td class="${id}-dose">--</td><td class="${id}-vol">--</td>`
					: `<td class="empty-cell"></td><td class="empty-cell"></td>`;
			}

			if (config.hasInfusion) {
				row.innerHTML += `<td class="empty-cell"></td><td class="empty-cell"></td>`;
			}
		}

		ref.labelCell = row.getElementsByClassName(`${id}-label`)[0];
		ref.doseCell = row.getElementsByClassName(`${id}-dose`)[0];
		ref.volCell = row.getElementsByClassName(`${id}-vol`)[0];
		ref.infSpan = row.getElementsByClassName(`${id}-inf`)[0];
		ref.verifyInput = row.querySelector('.verify-input');
		ref.verifyOut = row.querySelector('span[id^="verify-out-"]');

		return { row, ref };
	}

	function descriptionRow(protocol, config) {
		const descRow = document.createElement('tr');
		const totalCols = 1 + (config.hasBolus ? 2 : 0) + (config.hasInfusion ? 2 : 0);
		const td = document.createElement('td');

		td.colSpan = totalCols;
		td.innerHTML = protocol.description;
		td.style.textAlign = 'center';
		td.style.fontSize = '12px';

		descRow.appendChild(td);
		return descRow;
	}

	function buildHeaders(config) {
		Object.entries(config).forEach(([sectionId, c]) => {
			const thead = document.getElementById(sectionId).closest('table').querySelector('thead tr');

			thead.innerHTML = '<th>Medication</th>';

			if (c.hasBolus)
				thead.innerHTML += '<th>Dose</th><th>Volume</th>';

			if (c.hasInfusion)
				thead.innerHTML += c.hasBolus
					? '<th>Infusion</th><th>mL/hr</th>'
					: '<th>Current Dose</th><th>Pump Rate</th>';
		});
	}

	function build(entries) {
		document.querySelectorAll('tbody').forEach(t => t.innerHTML = '');
		rows.clear();

		const config = sectionConfigFor(entries);

		entries.forEach(entry => {
			entry.sections.forEach(sectionId => {
				const tbody = document.getElementById(sectionId);
				const { row, ref } = buildRow(entry, config[sectionId]);

				tbody.appendChild(row);
				rows.set(entry.id, [...refsFor(entry.id), ref]);

				if (ref.verifyInput) {
					ref.verifyInput.addEventListener('input', () => onVerify(entry.id, parseFloat(ref.verifyInput.value)));
				}

				if (entry.protocol.description) {
					tbody.appendChild(descriptionRow(entry.protocol, config[sectionId]));
				}
			});
		});

		buildHeaders(config);
	}

	function showBolus(id, view) {
		refsFor(id).forEach(ref => {
			if (ref.labelCell) ref.labelCell.innerHTML = view.label;
			if (ref.doseCell) ref.doseCell.textContent = view.dose;
			if (ref.volCell) ref.volCell.textContent = view.vol;
		});
	}

	function showInfusion(id, view) {
		refsFor(id).forEach(ref => { if (ref.infSpan) ref.infSpan.textContent = view.rate; });
	}

	function showVerify(id, view) {
		refsFor(id).forEach(ref => {
			if (!ref.verifyOut) return;
			if (view.html !== undefined) ref.verifyOut.innerHTML = view.html;
			else ref.verifyOut.textContent = view.text;
		});
	}

	function clear() {
		rows.forEach(refs => refs.forEach(ref => {
			if (ref.labelCell) ref.labelCell.innerHTML = ref.label;
			if (ref.doseCell) ref.doseCell.textContent = '--';
			if (ref.volCell) ref.volCell.textContent = '--';
			if (ref.infSpan) ref.infSpan.textContent = '--';
			if (ref.verifyInput) ref.verifyInput.value = '';
			if (ref.verifyOut) ref.verifyOut.textContent = '--';
		}));
	}

	function verifyDoses() {
		const doses = [];
		rows.forEach((refs, id) => refs.forEach(ref => {
			if (ref.verifyInput && ref.verifyInput.value) doses.push({ id, dose: parseFloat(ref.verifyInput.value) });
		}));
		return doses;
	}

	return { build, showBolus, showInfusion, showVerify, clear, verifyDoses };
}
