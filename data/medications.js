/*
======================================================
	 MEDICATION REGISTRY (data only)
------------------------------------------------------
	 Edit this file for guideline updates.
	 Lookup and validation live in scripts/registry.js;
	 `node --test tests/` checks every entry.
======================================================
*/

/* USER UPDATE GUIDE: the medication registry follows the guide comments below */

/*
------------------------------------------------------
Guide for updates to the medication registry
------------------------------------------------------
	- Central Configuration of calculator
	- Defines:
			 • section
			 • concentration
			 • Units
			 • Profile-specific protocols
					- only adult, geriatric, and pediatric available
					- "doseRange" to be used if bolus medication, "infusionRate" used if a gtt
					- "absolute: true" will remove weigh based calculations
					- if mindose = maxdose only one value displays
					- "maxTotal" implements a hard stop max dose on weight based dosing and adds dose warning
					- "description" section used for guideline summary
	- Add/Remove/Modify Medications in this section. 
	- Medications appear in tables in the order they appear here. 

======================================================
MEDICATION REGISTRY — CONFIGURATION & UPDATE GUIDE
======================================================

REQUIRED FIELDS (every entry must have these):
	 section        Array of table IDs where med appears.
									Available: "supportive-body", "induction-body",
									"paralytic-body", "pain-body", "sedation-body",
									"vent-bolus-body", "vent-inf-body"
									Example: section: ["pain-body"]
									Multiple sections: section: ["pain-body", "vent-bolus-body"]

	 concentration  Amount of drug per mL of solution (number).
									Example: concentration: 10  (= 10 mg/mL or 10 mcg/mL)
									Used to calculate volume (mL) from dose.

	 unit           Unit displayed in dose and volume outputs.
									Example: unit: "mg"  or  unit: "mcg"

	 protocols      Object containing at least one profile entry.
									Available profiles: adult | geriatric | pediatric
									Each profile must contain doseRange OR infusionRate
									plus a description field.

------------------------------------------------------
OPTIONAL FIELDS (medication level):
	 label          Display name shown in table. If omitted, the
									registry key name is used instead.
									Example: label: "Ketamine for RSI"

------------------------------------------------------
PROTOCOL FIELDS — doseRange (bolus medications):
	 Use for any medication given as a one-time or PRN bolus.
	 Generates "Dose" and "Volume" columns.

	 REQUIRED:
	 min            Low end of dose range.
	 max            High end of dose range.
									If min === max, only one value displays.

	 OPTIONAL:
	 absolute: true Removes weight-based math. Dose displays
									as entered (flat mg or mcg dose).
									Omit for weight-based dosing (mg/kg).

	 maxTotal       Hard cap on weight-based dose. Calculation
									is capped at this value and a ⚠️ Max Dose
									warning appears in the medication name cell.
									Example: maxTotal: 100

------------------------------------------------------
PROTOCOL FIELDS — infusionRate (continuous infusions):
	 Use for any medication run as a drip/gtt.
	 Generates Infusion and mL/hr columns.
	 Also generates a pump rate verify row automatically.

	 REQUIRED:
	 min            Low end of infusion rate range.
	 max            High end of infusion rate range.

	 OPTIONAL:
	 absolute: true Removes weight-based math. Rate is treated
									as a flat dose/hr (e.g. mcg/hr, mg/hr).
									Omit for weight-based rates (e.g. mg/kg/hr).

	 perMinute:true Applies per-minute math to display and
									verify calculator. Use for medications dosed
									in mcg/kg/min (e.g. Propofol).

	 maxRate        Sets a ceiling in the verify calculator.
									If entered dose exceeds this, a ⚠️ warning
									is included with the mL/hr output.
									Example: maxRate: 75

------------------------------------------------------
OPTIONAL FIELDS (protocol level — units override med level):
	 unit           Overrides the medication-level unit for a
									specific profile. Use when one profile uses
									a different unit (e.g. mcg vs mg).
									Example: pediatric: { unit: "mcg", infusionRate: {...} }

------------------------------------------------------
REQUIRED IN EVERY PROTOCOL:
	 description    Text is displayed below the dose row as a
									guideline summary. Supports HTML tags.
									Use <br> for line breaks within the text.
									Example: description: "1 mg/kg IV.<br>MR Q 30 min PRN"
									NOTE: Missing description will prevent the
									verify row from rendering for infusion meds.

------------------------------------------------------
BLANK ENTRY TEMPLATE:

	REGISTRY_KEY: {
		label: "",                        // optional
		section: ["section-id"],          // required
		concentration: 0,                 // required
		unit: "",                         // required
		protocols: {
			adult: {
				doseRange: {                  // use doseRange OR infusionRate
					absolute: true,             // optional — remove for weight-based
					min: 0,
					max: 0,
					maxTotal: 0,                // optional
				},
				description: ""              // required
			},
		}
	},

------------------------------------------------------
NOTES:
	 - Medications render in tables in the order listed here.
	 - To disable a medication temporarily, wrap it in comment character.
	 - Profiles not listed for a medication are simply skipped.
	 - validateMedications() logs console warnings for missing
		 or unrecognized fields on every profile selection.
======================================================
*/

export const MEDICATIONS = {

	Epinephrine: {
		section: ["supportive-body"],
		concentration: 10,
		unit: "mcg",
		protocols: {
			adult: { doseRange: {absolute: true, min: 5, max: 20 }, description: "5-20 mcg IV, Q 2-5 min PRN" },
			geriatric: { doseRange: {absolute: true, min: 5, max: 20 }, description: "5-20 mcg IV, Q 2-5 min PRN" },
			pediatric: { doseRange: {min: 0.5, max: 1, maxTotal: 20 }, description: "0.5-1 mcg/kg IV, max 20 mcg/dose, Q 2-5 min PRN" },
		},
	},

	Atropine: {
		section: ["supportive-body"],
		concentration: 0.1, 
		unit: "mg", 
		protocols: {
			pediatric: { doseRange: { min: 0.02, max: 0.02, maxTotal: 2 }, description: "Consider for Peds that are bradycardic or who have a HR in the lower 25th percentile for their age" },
		},
	},

	Ketamine_RSI: {
		label: "Ketamine for RSI",
		section: ["induction-body"],
		concentration: 100,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 2, max: 2 }, description: "2 mg/kg slow IVP, Consider Etomidate if an increase in HR or BP would be detrimental" },
			geriatric: { doseRange: { min: 2, max: 2 }, description: "2 mg/kg slow IVP, Consider Etomidate if an increase in HR or BP would be detrimental" },
			pediatric: { doseRange: { min: 2, max: 2 }, description: "2 mg/kg slow IVP, give over 20-30 seconds" },
		},
	},

	Etomidate_RSI: {
		label: "Etomidate",
		section: ["induction-body"],
		concentration: 2,
		unit: "mg",
		protocols: {
			adult: { doseRange: {min: 0.3, max: 0.3, maxTotal: 30 }, description: "0.3 mg/kg, max single dose 30 mg" },
			geriatric: { doseRange: {min: 0.3, max: 0.3, maxTotal: 30 }, description: "0.3 mg/kg, max single dose 30 mg" },
			pediatric: { doseRange: {min: 0.3, max: 0.3, maxTotal: 30 }, description: "0.3 mg/kg, max single dose 30 mg" },
		},
	},

	Ketamine_DSI: {
		label: "Ketamine for DSI",
		section: ["induction-body"],
		concentration: 100,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 1, max: 1 }, description: `1 mg/kg slow IV push; In apx 45 seconds patient will tolerate ventilation support, continue preoxygenation for 2-3 then intubate<br>If needed, MR 0.5 mg/kg twice, at 2-4 min intervals` },
			geriatric: { doseRange: { min: 1, max: 1 }, description: `1 mg/kg slow IV push; In apx 45 seconds patient will tolerate ventilation support, continue preoxygenation for 2-3 then intubate<br>If needed, MR 0.5 mg/kg twice, at 2-4 min intervals` },
			pediatric: { doseRange: { min: 1, max: 1 }, description: `1 mg/kg slow IV push; In apx 45 seconds patient will tolerate ventilation support, continue preoxygenation for 2-3 then intubate<br>If needed, MR 0.5 mg/kg twice, at 2-4 min intervals` },
		},
	},

	Rocuronium: {
		section: ["paralytic-body"],
		concentration: 10,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 1, max: 1 }, description: `1 mg/kg<br>MR 0.5 mg / kg IV every 20 - 30 minutes PRN to maintain paralysis` },
			geriatric: { doseRange: { min: 1, max: 1 }, description: `1 mg/kg<br>MR 0.5 mg / kg IV every 20 - 30 minutes PRN to maintain paralysis` },
			pediatric: { doseRange: { min: 1, max: 1 }, description: `1 mg/kg<br>MR 0.5 mg / kg IV every 20 - 30 minutes PRN to maintain paralysis` },
		},
	},

	Fentanyl_pain: {
		label: "Fentanyl",
		section: ["pain-body"],
		concentration: 50,
		unit: "mcg",
		protocols: {
			adult: { doseRange: { min: 1, max: 2, maxTotal: 100 }, description: `1–2 mcg/kg, max 100 mcg/dose, MR Q 20-30 min PRN<br>(For Acute MI: 50–100 mcg IV Q 15 min PRN)` },
			pediatric: { doseRange: { min: 0.5, max: 1, maxTotal: 100 }, description: "0.5-1 mcg/kg IV over 2-3 minutes, max 100 mcg/dose, MR Q 30 minutes PRN"},
		},
	},

	Fentanyl_geriatric: {
		label: "Fentanyl",
		section: ["pain-body", "vent-bolus-body"],
		concentration: 50,
		unit: "mcg",
		protocols: {
			geriatric: { doseRange: { min: 0.5, max: 1, maxTotal: 100 }, description: "0.5-1 mcg/kg, max 100 mcg/dose, MR Q 30-60 min PRN" },
		},
	},

	Morphine: {
		section: ["pain-body"],
		concentration: 10,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 4, max: 4 }, description: "4 mg IV, MR Q 30-60 min PRN" },
			geriatric: { doseRange: { absolute: true, min: 2, max: 2 }, description: "2 mg IV, MR in 15 min ONCE, thereafter MR 2-4 mg Q 30-60 min PRN" },
			pediatric: { doseRange: { min: 0.1, max: 0.1, maxTotal: 4 }, description: "0.1 mg/kg IV, max 4 mg, MR Q 30-60 min PRN" },
		},
	},

/* 
======================================================
NEED TO FIND OUT WHAT/IF WE ARE GOING TO BE CARRYING FOR TYLENOL
======================================================
	Acetaminophen: {
		label: "Acetaminophen, Oral"
		section: ["pain-body"],
		concentration: 1,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 500, max: 1000 }, description: "1 gm over 15 minutes, MR Q 6 hours PRN"},
			geriatric: { doseRange: { absolute: true, min: 500, max: 1000 }, description: "1 gm over 15 minutes, MR Q 6 hours PRN"},
			pediatric: { doseRange: { min: 15, max: 15, maxTotal: 1000 }, description: "Peds <50 kg: 15 mg/kg, max of 1000 mg, MR Q 6 hours PRN"},
		}
	},
*/

	Ketamine_Pain: {
		label: "Ketamine",
		section: ["pain-body"],
		concentration: 100,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 0.1, max: 0.3 }, description: "0.1-0.3 mg/kg, MR Q 30-60 PRN" }, 
			geriatric: { doseRange: { min: 0.1, max: 0.3 }, description: "0.1-0.3 mg/kg, MR Q 30-60 PRN, but use with caution when combined with opioids as may produce profound respiratory depression" },
			pediatric: { doseRange: { min: 0.1, max: 0.3, maxTotal: 25 }, description: "0.1-0.3 mg/kg, max 25 mg/dose, MR Q 60 min PRN" },
		},
	},

	Hydromorphone: {
		section: ["pain-body"],
		concentration: 1, 
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 0.5, max: 1 }, description: "For Adults and Pediatrics over 60kg. 0.5-1 mg, MR Q 30 min PRN" },
			geriatric: { doseRange: { absolute: true, min: 0.5, max: 0.5 }, description: "0.5 mg, use with caution when combined with other opioids or sedatives" },
		},
	},

	Lorazepam: {
		label: "Lorazepam (Ativan)",
		section: ["sedation-body"],
		concentration: 2,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 1, max: 2 }, description: "1-2 mg over 2 min, MR Q 60 min PRN" },
			geriatric: { doseRange: { absolute: true, min: 0.5, max: 0.5 }, description: "0.5 mg over 2 min, MR in 5-10 min ONCE, thereafter MR 0.5-1 mg Q 60 min PRN" },
			pediatric: { doseRange: { min: 0.05, max: 0.05, maxTotal: 1 }, description: "0.05 mg/kg over 2–3 minutes, max 1 mg" },
		},
	},

	Midazolam: {
		label: "Midazolam (Versed)",
		section: ["sedation-body"],
		concentration: 5,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 1, max: 2 }, description: "1-2 mg, MR Q 3-5 min PRN" },
			geriatric: { doseRange: { absolute: true, min: 0.5, max: 1 }, description: "0.5-1 mg, MR Q 3-5 min PRN" },
			pediatric: { doseRange: { min: 0.05, max: 0.05, maxTotal: 2 }, description: "0.05 mg/kg over 2 min, max 2 mg/dose, MR Q 3-5 min PRN" },
		},
	},

	Ketamine_sed: {
		label: "Ketamine",
		section: ["sedation-body"],
		concentration: 100,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 0.5, max: 1 }, description: "Use higher dose for procedural sedation and acute agitation. Use lower dose range for comfort, such as BiPAP. 0.5–1 mg/kg slow IVP, MR 0.5 mg/kg Q 5-10 min PRN" }, 
			geriatric: { doseRange: { min: 0.5, max: 1 }, description: "Use higher dose for procedural sedation and acute agitation. Use lower dose range for comfort, such as BiPAP. 0.5–1 mg/kg slow IVP, MR 0.5 mg/kg Q 5-10 min PRN" },
			pediatric: { doseRange: { min: 0.5, max: 1 }, description: "Use higher dose for procedural sedation and acute agitation. Use lower dose range for comfort, such as BiPAP. 0.5-1 mg/kg, MR 0.5 mg/kg Q 5-10 min PRN" },
		},
	},

	Etomidate_sed: {
		label: "Etomidate",
		section: ["sedation-body"],
		concentration: 2,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 0.3, max: 0.3, maxTotal: 10 }, description: "0.3 mg/kg IV rapid, max 10 mg; Consider pre-treatment with low dose Fentanyl or Midazolam" },
			geriatric: { doseRange: { min: 0.3, max: 0.3, maxTotal: 10 }, description: "0.3 mg/kg IV rapid, max 10 mg; Consider pre-treatment with low dose Fentanyl or Midazolam" },
			pediatric: { doseRange: { min: 0.3, max: 0.3, maxTotal: 10 }, description: "0.3 mg/kg IV rapid, max 10 mg; Consider pre-treatment with low dose Fentanyl or Midazolam" },
		},
	},

	Droperidol_mild: {
		label: "Droperidol — Mild Sedation",
		section: ["sedation-body"],
		concentration: 2.5,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 0.625, max: 1.25 }, description: "0.625–1.25 mg (e.g. Geriatrics, NIPPV)" },
			geriatric: { doseRange: { absolute: true, min: 0.625, max: 1.25 }, description: "0.625–1.25 mg (e.g. Geriatrics, NIPPV)" },
			pediatric: { doseRange: { absolute: true, min: 0.625, max: 1.25 }, description: "For Peds ≥ 12yo: 0.625–1.25 mg" },
		},
	},

	Droperidol_mod: {
		label: "Droperidol — Moderate Sedation",
		section: ["sedation-body"],
		concentration: 2.5,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 2.5, max: 2.5 }, description: "2.5 mg over 1–2 minutes, MR PRN in 5–10 min ONCE" },
			geriatric: { doseRange: { absolute: true, min: 2.5, max: 2.5 }, description: "2.5 mg over 1–2 minutes, MR PRN in 5–10 min ONCE" },
			pediatric: { doseRange: { absolute: true, min: 2.5, max: 2.5 }, description: "For Peds ≥ 12yo: 2.5 mg over 1–2 minutes, MR PRN after 5–10 min ONCE" },
		},
	},

	Droperidol_agg: {
		label: "Droperidol — Aggressive Sedation",
		section: ["sedation-body"],
		concentration: 2.5,
		unit: "mg",
		protocols: {
			adult:	{ doseRange: { absolute: true, min: 5, max: 5 }, description: "5 mg IV or IM, MR PRN in 5–10 min ONCE" },
			geriatric: { doseRange: { absolute: true, min: 5, max: 5 }, description: "5 mg IV or IM, MR PRN in 5–10 min ONCE" },
			pediatric: { doseRange: { absolute: true, min: 5, max: 5 }, description: "For Peds ≥ 12yo: 5 mg IV or IM, MR PRN after 5–10 min ONCE" },
		},
	},

	Diphenhydramine: {
		section: ["sedation-body"],
		concentration: 25,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 50, max: 50 }, description: "50 mg slow IVP, ONCE" },
			geriatric: { doseRange: { absolute: true, min: 50, max: 50 }, description: "50 mg slow IVP, ONCE" },
			pediatric: { doseRange: { min: 1, max: 1, maxTotal: 50 }, description: "1 mg/kg slow IVP, ONCE, max 50 mg"}
		},
	},

/*
----- Bolus Dose Subtable -----
*/

	Fentanyl_vent: {
		label: "Fentanyl",
		section: ["vent-bolus-body"],
		concentration: 50,
		unit: "mcg",
		protocols: {
			adult: { doseRange: { min: 1, max: 2 }, description: "1–2 mcg/kg, MR Q 20-30 min PRN" },			
			pediatric: { doseRange: { min: 1, max: 2 }, description: "1-2 mcg/kg, over 1-2 min, MR Q 30-60 min PRN; Dilute in Normal Saline to decrease chance of chest wall rigidity"},
		},
	},

	Lorazepam_vent: {
		label: "Lorazepam (Ativan)",
		section: ["vent-bolus-body"],
		concentration: 2,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 1, max: 2 }, description: "1-2 mg over 2 min, MR every hour PRN." },
			geriatric: { doseRange: { absolute: true, min: 0.5, max: 1 }, description: "Small incremental doses of 0.5-1 mg, MR in 5-10 min PRN, thereafter MR 0.5-1 mg Q 60 min PRN" },
			pediatric: {doseRange: { min: 0.05, max: 0.1, maxTotal: 2 }, description: "0.05–0.1 mg/kg over 2 min, max dose of 2 mg, MR in 5-10 min PRN, thereafter Q 60 min PRN"},
		},
	},

	Midazolam_vent: {
		label: "Midazolam (Versed)",
		section: ["vent-bolus-body"],
		concentration: 5,
		unit: "mg",
		protocols: {
			adult: { doseRange: { absolute: true, min: 1, max: 2 }, description: "1-2 mg, MR in 5-10 min PRN, thereafter Q 30 min PRN" },
			geriatric: { doseRange: { absolute: true, min: 0.5, max: 1 }, description: "0.5-1 mg, MR in 5 – 10 min PRN, thereafter Q 30 min PRN" },
			pediatric: { doseRange: { min: 0.05, max: 0.1, maxTotal: 2 }, description: "0.05-0.1 mg/kg, max dose 2 mg, MR in 5-10 min PRN, thereafter Q 30 min PRN" }, 
		},
	},

	Ketamine_vent: {
		label: "Ketamine",
		section: ["vent-bolus-body"],
		concentration: 100,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 1, max: 2 }, description: "1-2 mg/kg, MR Q 30-60 min PRN. Avoid partially dissociated dose range (0.5-1 mg/kg)" },
			geriatric: { doseRange: { min: 1, max: 2 }, description: "1-2 mg/kg, MR Q 30-60 min PRN. Avoid partially dissociated dose range (0.5-1 mg/kg)" },
			pediatric: { doseRange: { min: 1, max: 2 }, description: "1-2 mg/kg, MR Q 30-60 min PRN" },
		},
	},

	Propofol_load: {
		label: "Propofol Loading Dose",
		section: ["vent-bolus-body"],
		concentration: 10,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 0, max: 2 }, description: "Up to 2 mg/kg - titrate 40 mg IVP Q 30 sec to desired effect" },
			geriatric: { doseRange: { min: 0, max: 1 }, description: "Up to 1 mg/kg - titrate 20 mg IVP Q 30 sec to desired effect" },
			pediatric: { doseRange: { min: 0.5, max: 1 }, description: "0.5-1 mg/kg"}
		},
	},

	Propofol_bolus: { 
		label: "Propofol Bolus Dose",
		section: ["vent-bolus-body"],
		concentration: 10,
		unit: "mg",
		protocols: { 
			adult: { doseRange: { absolute: true, min: 25, max: 50 }, description: "25-50 mg for breakthrough agitation, as well as to aid in titrating infusion" },
			geriatric: { doseRange: { absolute: true, min: 10, max: 10 }, description: "10 mg for breakthrough agitation, as well as to aid in titrating infusion" },
			pediatric: { doseRange: {  min: 0.5, max: 1 }, description: "0.5-1 mg/kg for breakthrough agitation, as well as to aid in titrating infusion" },
		},
	},

	Rocuronium_vent: {
		label: "Rocuronium",
		section: ["vent-bolus-body"],
		concentration: 10,
		unit: "mg",
		protocols: {
			adult: { doseRange: { min: 1, max: 1 }, description: "1 mg/kg, Repeat dose: 0.5 mg-kg IV Q 20-30 min PRN to maintain paralysis" },
			geriatric: { doseRange: { min: 1, max: 1 }, description: "1 mg/kg, Repeat dose: 0.5 mg-kg IV Q 20-30 min PRN to maintain paralysis"},
			pediatric: { doseRange: { min: 0.5, max: 0.5 }, description: "0.5 mg/kg, Repeat dose: 0.5 mg-kg IV Q 20-30 min PRN to maintain paralysis"},
		},
	},

/*
----- Infusion Subtable -----
*/

	Fentanyl_inf: {
		label: "Fentanyl Infusion",
		section: ["vent-inf-body"],
		concentration: 10,
		unit: "mcg",
		protocols: {
			adult: { infusionRate: { absolute: true, min: 25, max: 200, maxRate: 200 }, description: "Provider mixed infusion: Mix 500 mcg in 50 mL D5W = 10 mcg/mL.<br>50-200 mcg/hr. Start at 25-50 mcg/hr. ± by 25 mcg/hr Q 5-10 min to target RASS" },
			geriatric: { infusionRate: { absolute: true, min: 25, max: 200, maxRate: 200 }, description: "Provider mixed infusion: Mix 500 mcg in 50 mL D5W = 10 mcg/mL.<br>50-200 mcg/hr. Start at 25-50 mcg/hr. ± by 25 mcg/hr Q 5-10 min to target RASS" },
			pediatric: { infusionRate: { min: 1, max: 3, maxRate: 3}, description: "Provider mixed infusion: Mix 500 mcg in 50 mL D5W = 10 mcg/mL.<br>1-3 mcg/kg/hr. Start at 1 mcg/kg/hr.<br>Increase slowly Q 5-10 min to target RASS" },
		},
	},

	Midazolam_inf: { 
		label: "Midazolam Infusion",
		section: ["vent-inf-body"],
		concentration: 0.1,
		unit: "mg",
		protocols: { 
			adult: { infusionRate: { absolute: true, min: 1, max: 10, maxRate: 10 }, description: "Provider mixed infusion: Mix 10 mg in 100 mL NS = 1 mg/10 mL.<br>Start at 1 mg/hr. ± 0.5 mg/hr Q 5-10 min PRN for target RASS. Max rate 10 mg/hr" },
			geriatric: { infusionRate: { absolute: true, min: 1, max: 6, maxRate: 6}, description: "Provider mixed infusion: Mix 10 mg in 100 mL NS = 1 mg/10 mL.<br>Start at 1 mg/hr. ± 0.5 mg/hr Q 5-10 min PRN for target RASS. Max rate 6 mg/hr" },
			pediatric: { unit: "mcg", infusionRate: { perMinute: true, min: 1, max: 6, maxRate: 6 }, description: "Provider mixed infusion: Mix 10 mg in 100 mL NS = 1 mg/10 mL.<br>Start at 1-2 mcg/kg/min. ± 0.5 mcg/kg/min Q 5-10 min PRN for target RASS. Max rate 6 mcg/kg/min" },
		},
	},

	Ketamine_inf: {
		label: "Ketamine Infusion",
		section: ["vent-inf-body"],
		concentration: 2,
		unit: "mg",
		protocols: {
			adult: { infusionRate: { min: 0.5, max: 3, maxRate: 3 }, description: "Provider mixed infusion: Mix 500 mg in 250 mL D5W = 2 mg/mL.<br>Administer 1 mg/kg bolus, start infusion at 0.5 mg/kg/hr. Titrate ± 0.5mg/kg/hr PRN for target RASS. Max rate 3 mg/kg/hr" },
			geriatric: { infusionRate: { min: 0.5, max: 3, maxRate: 3 }, description: "Provider mixed infusion: Mix 500 mg in 250 mL D5W = 2 mg/mL.<br>Administer 1 mg/kg bolus, start infusion at 0.5 mg/kg/hr. Titrate ± 0.5mg/kg/hr PRN for target RASS. Max rate 3 mg/kg/hr" },
			pediatric: { infusionRate: { min: 0.5, max: 3, maxRate: 3 }, description: "Provider mixed infusion: Mix 500 mg in 250 mL D5W = 2 mg/mL.<br>Administer 1 mg/kg bolus, start infusion at 0.5 mg/kg/hr. Titrate ± 0.5mg/kg/hr PRN for target RASS. Max rate 3 mg/kg/hr" }
		},
	},

	Propofol_inf: {
		label: "Propofol Infusion",
		section: ["vent-inf-body"],
		concentration: 10000,
		unit: "mcg",
		protocols: { 
			adult: { infusionRate: { perMinute: true, min: 10, max: 75, maxRate: 75 }, description: "10-75 mcg/kg/min (unless higher rate MD ordered). ± 5-10 mcg/kg/min Q 5-10 min to maintain sedation" },
			geriatric: { infusionRate: { perMinute: true, min: 10, max: 75, maxRate: 75  }, description: "10-75 mcg/kg/min (unless higher rate MD ordered). ± 5-10 mcg/kg/min Q 5-10 min to maintain sedation" },
			pediatric: { infusionRate: { perMinute: true, min: 10, max: 75, maxRate: 75 }, description: "10-75 mcg/kg/min (unless higher rate MD ordered). ± 5-10 mcg/kg/min Q 5-10 min to maintain sedation" },
		},
	},
	/* 
	======================================================
		SEIZURES SECTION
	====================================================== 
	*/
	Midazolam_seizure: {
		label: "Midazolam (Versed)",
		section: ["seizures-first-body"],
		concentration: 5,
		unit: "mg",
		protocols: {
			adult: { doseRange: {absolute: true, min: 5, max: 5 }, description: "5 mg IV or 10 mg IM / IN, MR Q 2-5 min PRN" },
			geriatric: { doseRange: {absolute: true, min: 5, max: 5 }, description: "5 mg IV or 10 mg IM / IN, MR Q 2-5 min PRN" },
			pediatric: { doseRange: {min: 0.1, max: 0.1, maxTotal: 5 }, description: "0.1 mg/kg IV, MR Q 2-5 min PRN" },
		},
	},

	Lorazepam_seizure: {
		label: "Lorazepam (Ativan)",
		section: ["seizures-first-body"],
		concentration: 2,
		unit: "mg",
		protocols: {
			adult: { doseRange: {absolute: true, min: 4, max: 4 }, description: "4 mg IV over 2 min, MR Q 5 min PRN" },
			geriatric: { doseRange: {absolute: true, min: 4, max: 4 }, description: "4 mg IV over 2 min, MR Q 5 min PRN" },
			pediatric: { doseRange: {min: 0.1, max: 0.1, maxTotal: 4 }, description: "0.1 mg/kg IV, max dose 4 mg, MR Q 5 min PRN" },
		},
	},

	Diazepam_seizure: {
		label: "Diazepam (Valium)",
		section: ["seizures-first-body"],
		concentration: 5,
		unit: "mg",
		protocols: {
			adult: { doseRange: {absolute: true, min: 10, max: 10 }, description: "10 mg IV at 2.5 mg/min, MR Q 5 min PRN" },
			geriatric: { doseRange: {absolute: true, min: 10, max: 10 }, description: "10 mg IV at 2.5 mg/min, MR Q 5 min PRN" },
			pediatric: { doseRange: {min: 0.2, max: 0.2, maxTotal: 10 }, description: "0.2 mg/kg IV, max dose 10 mg, at 2 mg/min, MR Q 5 min PRN" },
		},
	},

	Levetiracetam_active: {
		label: "Levetiracetam (Keppra) - Active Seizures",
		section: ["seizures-second-body"],
		concentration: 100,
		unit: "mg",
		protocols: {
			adult: { doseRange: {min: 60, max: 60, maxTotal: 4500 }, description: "60 mg/kg IV, over 15 min, max dose 4500 mg" },
			geriatric: { doseRange: {min: 60, max: 60, maxTotal: 4500 }, description: "60 mg/kg IV, over 15 min, max dose 4500 mg" },
			pediatric: { doseRange: {min: 60, max: 60, maxTotal: 4500 }, description: "60 mg/kg IV, over 15 min, max dose 4500 mg" },
		},
	},

	Levetiracetam_prophylaxis: {
		label: "Levetiracetam (Keppra) - Seizure Prophylaxis",
		section: ["seizures-second-body"],
		concentration: 100,
		unit: "mg",
		protocols: {
			adult: { doseRange: {min: 20, max: 20, maxTotal: 4500 }, description: "20 mg/kg IV, over 15 min, max dose 4500 mg" },
			geriatric: { doseRange: {min: 20, max: 20, maxTotal: 4500 }, description: "20 mg/kg IV, over 15 min, max dose 4500 mg" },
			pediatric: { doseRange: {min: 20, max: 20, maxTotal: 4500 }, description: "20 mg/kg IV, over 15 min, max dose 4500 mg" },
		},
	},

	Phenobarbital_seizure: {
		label: "Phenobarbital",
		section: ["seizures-third-body"],
		concentration: 130,
		unit: "mg",
		protocols: {
			adult: { doseRange: {min: 15, max: 15, maxTotal: 4500 }, description: "15 mg/kg IV, at 60 mg/min" },
			geriatric: { doseRange: {min: 15, max: 15, maxTotal: 4500 }, description: "15 mg/kg IV, at 60 mg/min" },
			pediatric: { doseRange: {min: 20, max: 20, maxTotal: 1000 }, description: "20 mg/kg IV, at 2 mg/kg/min. MR at 5 mg/kg Q 10-15 min to total of 40 mg/kg" },
		},
	},

	Propofol_seizure_bolus: {
		label: "Propofol - Loading Dose",
		section: ["seizures-third-body"],
		concentration: 10,
		unit: "mg",
		protocols: {
			adult: { doseRange: {min: 2, max: 2 }, description: "For intubated patients. Indicated for refractory status epileptics. 2 mg/kg loading dose followed by infusion" },
			geriatric: { doseRange: {min: 2, max: 2 }, description: "For intubated patients. Indicated for refractory status epileptics. 2 mg/kg loading dose followed by infusion" },
			pediatric: { doseRange: {min: 2, max: 2 }, description: "For intubated patients. Indicated for refractory status epileptics. 2 mg/kg loading dose followed by infusion" },
		},
	},

	Propofol_seizure_infusion: {
		label: "Propofol - Infusion",
		section: ["seizures-third-body"],
		concentration: 10000,
		unit: "mcg",
		protocols: {
			adult: { infusionRate: { perMinute: true, min: 10, max: 75, maxRate: 75 }, description: "10 mcg/kg/min to a max of 75 mcg/kg/min" },
			geriatric: { infusionRate: {perMinute: true, min: 10, max: 75, maxRate: 75 }, description: "10 mcg/kg/min to a max of 75 mcg/kg/min" },
			pediatric: { infusionRate: {perMinute: true, min: 10, max: 75, maxRate: 75 }, description: "10 mcg/kg/min to a max of 75 mcg/kg/min" },
		},
	},
};
