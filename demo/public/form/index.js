import '/assets/js/index.mjs';

const toggles = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');

for (const toggle of toggles) {
	toggle.addEventListener('change', event => {
		const ariaDisabled = event.target.getAttribute('aria-disabled') === 'true';

		if (ariaDisabled) {
			event.preventDefault();

			event.target.checked = !event.target.checked;
		}
	});
}
