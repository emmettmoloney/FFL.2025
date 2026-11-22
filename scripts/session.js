/*
======================================================
    SESSION MODULE (state only, no DOM)
------------------------------------------------------
  Remembers which page is open, which Profile was chosen and
  which Sections are visible.

    const session = createSession({ onChange })
    session.start(profile)          open the calculator for a Profile
    session.showSections(group)     show the Sections of a Section group
    session.home()                  back to the start page (selection is kept)
    session.page                    'start' | 'calculator'
    session.profile                 'adult' | 'geriatric' | 'pediatric' | null
    session.visibleSections         copy of the visible Section ids
    onChange(type, state)           type: 'start' | 'sections' | 'home'
======================================================
*/

export const PROFILES = ['adult', 'geriatric', 'pediatric'];

// All Section ids on the calculator page
export const ALL_SECTIONS = [
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

// Section group (button label) -> Section ids
export const SECTION_GROUPS = {
	'RSI/DSI': ['supportive-body', 'induction-body', 'paralytic-body'],
	'Pain & Sed.': ['pain-body', 'sedation-body', 'vent-bolus-body', 'vent-inf-body'],
	'Seizures': ['seizures-first-body', 'seizures-second-body', 'seizures-third-body'],
	'Show me Everything': ALL_SECTIONS
};

export function createSession({ onChange }) {
	let page = 'start';
	let profile = null;
	let sections = [];

	const snapshot = () => ({ page, profile, visibleSections: [...sections] });
	const emit = type => onChange(type, snapshot());

	return {
		get page() { return page; },
		get profile() { return profile; },
		get visibleSections() { return [...sections]; },

		start(chosen) {
			if (!PROFILES.includes(chosen)) throw new Error(`unknown profile: ${chosen}`);
			profile = chosen;
			page = 'calculator';
			sections = [];
			emit('start');
		},

		showSections(group) {
			if (!profile) throw new Error('no profile chosen');
			sections = SECTION_GROUPS[group] ? [...SECTION_GROUPS[group]] : [];
			emit('sections');
		},

		home() {
			page = 'start';
			emit('home');
		},
	};
}
