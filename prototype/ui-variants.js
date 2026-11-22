/*
 PROTOTYPE (throwaway, wipe me): UI variants for the title screen, profile buttons and medication tables.
 Question: "What should the start page, section buttons and medication tables look like?"
 Variants on the existing page, switched by ?variant=0|A|B|C. No ?variant= means this file does nothing.
   0  Original      A  Stacked cards      B  Ledger rows      C  Banded tiles
 Pure presentation: no app logic, no data, no persistence. Arrow keys also cycle.
*/
(function () {
	const params = new URLSearchParams(location.search);
	if (!params.has('variant')) return;

	const VARIANTS = [
		['0', 'Original'],
		['A', 'Stacked cards'],
		['B', 'Ledger rows'],
		['C', 'Banded tiles'],
	];
	let current = (params.get('variant') || '0').toUpperCase();
	document.body.dataset.variant = current;

	/* --- Table annotation: label each cell and tag each row so CSS can lay out cards --- */
	function annotate() {
		document.querySelectorAll('.section-card table').forEach(table => {
			const heads = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
			table.querySelectorAll('tbody > tr').forEach(tr => {
				const only = tr.children.length === 1 ? tr.children[0] : null;
				// Description rows fold into the medication row above, so one entry is one element.
				if (only && only.colSpan > 1) {
					const prev = tr.previousElementSibling;
					if (prev && prev.classList.contains('med-row')) {
						only.classList.add('desc-cell');
						prev.classList.add('has-desc');
						prev.appendChild(only);
						tr.remove();
					}
					return;
				}
				tr.classList.add('med-row');
				if (tr.querySelector('.verify-input')) tr.classList.add('inf-row');
				[...tr.children].forEach((td, i) => {
					if (td.classList.contains('desc-cell')) return;
					if (i === 0) td.dataset.role = 'name';
					else if (!td.classList.contains('empty-cell')) td.dataset.label = heads[i] || '';
				});
			});
		});
	}
	let queued = false;
	new MutationObserver(() => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(() => { queued = false; annotate(); });
	}).observe(document.getElementById('calculator-page'), { childList: true, subtree: true });

	/* --- Section buttons: tag each with its colour family, mark the selected one --- */
	const SECTION_CLASS = { 'RSI/DSI': 'sb-rsi', 'Pain & Sed.': 'sb-pain', 'Seizures': 'sb-sz', 'Show me Everything': 'sb-all' };
	document.querySelectorAll('.section-select').forEach(btn => {
		btn.classList.add(SECTION_CLASS[btn.dataset.section] || '');
		btn.addEventListener('click', () => {
			document.querySelectorAll('.section-select').forEach(b => b.classList.remove('selected'));
			btn.classList.add('selected');
		});
	});
	document.querySelectorAll('[data-profile]').forEach(btn => btn.classList.add('pf-' + btn.dataset.profile));
	document.querySelectorAll('[data-action="home"]').forEach(btn => btn.classList.add('back-button'));
	document.querySelectorAll('#section-buttons > div').forEach((d, i) => d.classList.add(i === 0 ? 'sb-row' : 'sb-row-all'));
	document.querySelectorAll('[data-action="home"]').forEach(btn => btn.parentElement.classList.add('back-wrap'));
	document.querySelector('.patient-weight').classList.add('pw');

	/* --- Floating switcher --- */
	// Switch in place (no reload) so the chosen profile, weight and sections survive.
	const label = document.createElement('span');
	function show() {
		const v = VARIANTS.find(x => x[0] === current) || ['', ''];
		label.textContent = current + ' (' + v[1] + ')';
		document.body.dataset.variant = current;
		params.set('variant', current);
		history.replaceState(null, '', '?' + params.toString());
	}
	function go(delta) {
		const i = VARIANTS.findIndex(v => v[0] === current);
		current = VARIANTS[(i + delta + VARIANTS.length) % VARIANTS.length][0];
		show();
	}
	const bar = document.createElement('div');
	bar.id = 'proto-bar';
	bar.innerHTML = '<button data-d="-1" aria-label="Previous variant">←</button><button data-d="1" aria-label="Next variant">→</button>';
	bar.insertBefore(label, bar.lastChild);
	bar.addEventListener('click', e => { const d = e.target.dataset && e.target.dataset.d; if (d) go(Number(d)); });
	document.body.appendChild(bar);
	show();
	document.addEventListener('keydown', e => {
		if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
		if (e.key === 'ArrowLeft') go(-1);
		if (e.key === 'ArrowRight') go(1);
	});
})();
