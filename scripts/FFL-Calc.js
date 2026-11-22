import { MAX_WEIGHT, weightStatus, computeBolus, computeInfusion, verifyInfusion } from './dose.js';
import { bolusView, infusionView, verifyView } from './format.js';
import { createResultsTable } from './results-table.js';
import { MEDICATIONS } from '../data/medications.js';
import { protocolFor, entriesFor, validateRegistry } from './registry.js';

/* 
======================================================
	 GLOBAL PROFILE STATE
====================================================== 
*/
let currentProfile = null;

// Section filter state – null means show all sections
let currentSectionFilter = null;

// All section IDs present in the page (including seizures)
const ALL_SECTIONS = [
	'supportive-body',
	'induction-body',
	'paralytic-body',
	'pain-body',
	'sedation-body',
	'vent-bolus-body',
	'vent-inf-body',
	'seizures-first-body',
	'seizures-second-body',
	'seizures-third-body'
];

/**
 * Show or hide section cards based on the current filter.
 * When `currentSectionFilter` is null, all sections are shown.
 */
function updateSectionVisibility() {
	ALL_SECTIONS.forEach(sectionId => {
		const tbody = document.getElementById(sectionId);
		if (!tbody) return;
		const card = tbody.closest('.section-card');
		if (!card) return;

		const shouldShow = !currentSectionFilter || currentSectionFilter.includes(sectionId);
		card.style.display = shouldShow ? '' : 'none';
	});
}

function getProtocol(med) {
	return protocolFor(med, currentProfile);
}


/* 
======================================================
		PROFILE SELECTION FUNCTION
====================================================== 
*/
document.querySelectorAll(".profile-select")
	.forEach(btn => {
		btn.onclick = () => {
			currentProfile = btn.dataset.profile;

			const labels = {adult: "Adult", geriatric: "Geriatric", pediatric: "Pediatric"};

			document.getElementById("profileLabel").textContent = labels[currentProfile];
			document.getElementById("start-page").style.display = "none";
			document.getElementById("calculator-page").style.display = "block";
			
			// Reset section filter – no tables shown until a button is chosen
			currentSectionFilter = [];
			updateSectionVisibility();
			clearAllOutputs();
			// Reset section filter – no tables shown until a button is chosen
			currentSectionFilter = [];
			updateSectionVisibility();
			clearAllOutputs();
			buildTables();
		};
	});

// Mapping of button labels to section IDs
const SECTION_MAP = {
	'RSI/DSI': ['supportive-body', 'induction-body', 'paralytic-body'],
	'Pain & Sed.': ['pain-body', 'sedation-body', 'vent-bolus-body', 'vent-inf-body'],
	'Seizures': ['seizures-first-body', 'seizures-second-body', 'seizures-third-body'],
	'Show me Everything': ALL_SECTIONS
};

// Attach click handlers to the new section buttons
document.querySelectorAll('.section-select').forEach(btn => {
	btn.onclick = () => {
		const key = btn.dataset.section;
		currentSectionFilter = SECTION_MAP[key] ? [...SECTION_MAP[key]] : [];
		updateSectionVisibility();
		clearAllOutputs();
		buildTables();
		// Recalculate doses for the selected sections
		calculateAll();
	};
});

/* 
======================================================
		RETURN TO START PAGE
====================================================== 
*/
function goHome() {
	const calc = document.getElementById("calculator-page");
	if (calc) calc.style.display="none";

	const start = document.getElementById("start-page");
	if (start) start.style.display = "block";

	const weightInput = document.getElementById("weightInput");
	if (weightInput) weightInput.value = "";

	clearAllOutputs();
}

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
	table.build(entriesFor(MEDICATIONS, currentProfile));
}

/* 
======================================================
		CALCULATION ENGINE 
				1. Calculation engine (math lives in dose.js)
				2. Pump Rate verification engine
====================================================== 
*/
document.getElementById("weightInput")
	.addEventListener("input", calculateAll);

function calculateAll() {

	const weight = parseFloat(document.getElementById("weightInput").value);

	if (!weight || weight <= 0) {
		clearAllOutputs();
		return;
	}

	if (weightStatus(currentProfile, weight) === 'over-max') {
		const override = confirm(`${weight} kg exceeds the ${currentProfile} profile maximum of ${MAX_WEIGHT[currentProfile]} kg.\n\nPress OK to proceed with entered weight\n or\n Press Cancel to re-enter weight.`);
		if (!override) {
			document.getElementById("weightInput").value = '';
			clearAllOutputs();
			return;
		}
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

	const weight = parseFloat(document.getElementById("weightInput").value) || 0;
	table.showVerify(name, verifyView(verifyInfusion(med, protocol, weight, dose)));
}

function clearAllOutputs() {
	table.clear();
}

/* 
======================================================
		TEMPORARY: module-scope glue (removed when the
		session module replaces goHome and currentProfile)
====================================================== 
*/
window.goHome = goHome;
export { calculateAll, MEDICATIONS };
export function setProfileForHarness(profile) { currentProfile = profile; }
