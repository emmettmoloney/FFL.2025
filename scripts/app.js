import { MAX_WEIGHT, weightDecision, computeBolus, computeInfusion, verifyInfusion } from './dose.js';
import { bolusView, infusionView, verifyView } from './format.js';
import { createResultsTable } from './results-table.js';
import { MEDICATIONS } from '../data/medications.js';
import { protocolFor, entriesFor, validateRegistry } from './registry.js';
import { initRelease } from './release.js';
import { createSession, ALL_SECTIONS } from './session.js';

/* 
======================================================
		SESSION (page, profile, visible sections)
------------------------------------------------------
	 - State lives in session.js
	 - handleSessionChange applies each transition to the page
====================================================== 
*/
const session = createSession({ onChange: (type) => handleSessionChange(type) });

const PROFILE_LABELS = { adult: "Adult", geriatric: "Geriatric", pediatric: "Pediatric" };

function getProtocol(med) {
	return protocolFor(med, session.profile);
}

/**
 * Show or hide section cards to match the session's visible sections.
 */
function updateSectionVisibility() {
	const visible = session.visibleSections;
	ALL_SECTIONS.forEach(sectionId => {
		const tbody = document.getElementById(sectionId);
		if (!tbody) return;
		const card = tbody.closest('.section-card');
		if (!card) return;

		card.style.display = visible.includes(sectionId) ? '' : 'none';
	});
}

function handleSessionChange(type) {
	if (type === 'start') {
		document.getElementById("profileLabel").textContent = PROFILE_LABELS[session.profile];
		document.getElementById("start-page").style.display = "none";
		document.getElementById("calculator-page").style.display = "block";
		confirmedWeight = null;

		// No tables shown until a section button is chosen
		updateSectionVisibility();
		clearAllOutputs();
		buildTables();
	}
	else if (type === 'sections') {
		updateSectionVisibility();
		clearAllOutputs();
		buildTables();
		// Recalculate doses for the selected sections
		calculateAll();
	}
	else if (type === 'home') {
		document.getElementById("calculator-page").style.display = "none";
		document.getElementById("start-page").style.display = "block";
		weightInput.value = "";
		confirmedWeight = null;
		clearAllOutputs();
	}
}

document.querySelectorAll(".profile-select")
	.forEach(btn => btn.addEventListener('click', () => session.start(btn.dataset.profile)));

document.querySelectorAll('.section-select')
	.forEach(btn => btn.addEventListener('click', () => session.showSections(btn.dataset.section)));

document.querySelectorAll('[data-action="home"]')
	.forEach(btn => btn.addEventListener('click', () => session.home()));


/*
======================================================
		CONSOLE ERROR LOG: VALIDATE MEDICATIONS
====================================================== 
*/
function validateMedications() {
	validateRegistry(MEDICATIONS, ALL_SECTIONS).forEach(problem => console.warn(`⚠️ ${problem}`));
}

/* 
======================================================
		RESULTS TABLE
------------------------------------------------------
	 - Rows, headers and cell updates live in results-table.js
	 - This file decides which medications appear and what they show
====================================================== 
*/
const table = createResultsTable({ onVerify: (id, dose) => verifyDose(id, dose) });

function buildTables() {
	// Ensure correct sections are visible before populating
	updateSectionVisibility();
	validateMedications();
	table.build(entriesFor(MEDICATIONS, session.profile));
}

/* 
======================================================
		CALCULATION ENGINE 
				1. Calculation engine (math lives in dose.js)
				2. Pump Rate verification engine
====================================================== 
*/
const weightInput = document.getElementById("weightInput");

// An over-maximum weight the user has confirmed. A different weight needs a new confirmation.
let confirmedWeight = null;

weightInput.addEventListener("input", calculateAll);
weightInput.addEventListener("change", confirmOverMaxWeight);

// Asked when the field is left or Enter is pressed, never on each keystroke.
function confirmOverMaxWeight() {
	const weight = parseFloat(weightInput.value);
	if (weightDecision(session.profile, weight, confirmedWeight) !== 'needs-confirm') return;

	const override = confirm(`${weight} kg exceeds the ${session.profile} profile maximum of ${MAX_WEIGHT[session.profile]} kg.\n\nPress OK to proceed with entered weight\n or\n Press Cancel to re-enter weight.`);
	if (override) {
		confirmedWeight = weight;
		calculateAll();
	} else {
		weightInput.value = '';
		clearAllOutputs();
	}
}

function calculateAll() {

	const weight = parseFloat(weightInput.value);

	// No weight, or an over-maximum weight not yet confirmed: no calculation shows
	if (weightDecision(session.profile, weight, confirmedWeight) !== 'ok') {
		clearAllOutputs();
		return;
	}

	Object.entries(MEDICATIONS).forEach(([name, med]) => {
		const protocol = getProtocol(med);

		if (!protocol) return;

		if (protocol.doseRange) {
			table.showBolus(name, bolusView(med.label || name, med.unit, computeBolus(med, protocol, weight)));
		}

		if (protocol.infusionRate) {
			table.showInfusion(name, infusionView(computeInfusion(med, protocol, weight)));
		}
	});

	table.verifyDoses().forEach(({ id, dose }) => verifyDose(id, dose));
}

function verifyDose(name, dose) {
	const med = MEDICATIONS[name];
	const protocol = getProtocol(med);

	if (!protocol || !protocol.infusionRate) return;

	const weight = parseFloat(weightInput.value);
	table.showVerify(name, verifyView(verifyInfusion(med, protocol, weight, dose)));
}

function clearAllOutputs() {
	table.clear();
}

initRelease({ navigator, window, document });
