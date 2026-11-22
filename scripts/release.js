/*
======================================================
    RELEASE MODULE
------------------------------------------------------
  Registers the service worker, shows the "New Version" banner
  when an update is waiting, and fills the version footer.

    initRelease({ navigator, window, document })

  The page and the service worker talk through two messages:
  'getVersion' (worker replies {version, date}) and 'skipWaiting'.
======================================================
*/
export function initRelease({ navigator, window, document }) {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('./service-worker.js')
				.then(reg => {
					console.log('[SW] Registered:', reg.scope);

					// Check for updates every time the page loads
					reg.update();

					// Store reference to waiting worker and wire up banner
					function setWaitingWorker(worker) {
						document.getElementById('update-banner').style.display = 'block';
						document.getElementById('update-banner').onclick = () => {
							worker.postMessage('skipWaiting');
						};
					}

					// If a new service worker is already waiting on load
					if (reg.waiting) {
						setWaitingWorker(reg.waiting);
					}

					// Watch for a new service worker installing then waiting
					reg.addEventListener('updatefound', () => {
						const newWorker = reg.installing;
						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								setWaitingWorker(newWorker);
							};
						});
					});
				})
				.catch(err => console.error('[SW] Registration failed:', err));
		});

		// When new service worker takes control, reload to use it
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			window.location.reload();
		});

		// Request version info from service worker
		navigator.serviceWorker.addEventListener('message', event => {
			if (event.data.version) {
				document.getElementById('version-footer').textContent =
					`Version ${event.data.version}  |  Updated ${event.data.date}`;
			}
		});

		// Send the request once the service worker is active
		navigator.serviceWorker.ready.then(reg => {
			reg.active.postMessage('getVersion');
		});
	}
}
