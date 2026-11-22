# Glossary

Domain terms used in this project. Code, tests and commit messages use these words with these meanings.

**Profile**: the patient category chosen on the start page: `adult`, `geriatric` or `pediatric`. Decides which Protocol of a Medication applies and the maximum weight.

**Medication**: one entry in the registry (`data/medications.js`). It has a concentration, a unit, the Sections it appears in, and one Protocol per Profile it covers. One drug can have several entries (for example Ketamine for RSI, DSI, pain, sedation).

**Protocol**: the guideline for one Medication in one Profile: either a Dose range or an Infusion rate, plus a description.

**Dose range**: a bolus dose, from `min` to `max`. Weight-based (per kg) unless `absolute`. May have a **Dose cap** (`maxTotal`).

**Dose cap**: the hard maximum on a weight-based dose. When it applies, the Medication name shows a warning.

**Infusion rate**: a continuous dose, from `min` to `max`, per hour or per minute (`perMinute`). May have a `maxRate`.

**Section**: one table of Medications on the calculator page (for example `induction-body`). Registry entries name the Sections they appear in.

**Section group**: what a section button selects: RSI/DSI, Pain & Sed., Seizures, or Show me Everything. A Section group is a list of Sections.

**Pump-rate verification**: the check where the crew types the dose they are running and the app returns the mL/hr, with a warning above the `maxRate`.

**Weight**: the patient weight in kg. With no Weight entered, no calculation is shown.

**Maximum weight**: the largest Weight normally expected for a Profile. A larger Weight needs a confirmation.

**Guideline version**: the released app version (`VERSION` in the service worker). It decides the cache name and the version footer.
