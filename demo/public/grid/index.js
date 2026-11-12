import '/assets/js/index.mjs';

const grid = document.querySelector('oui-grid');

let checkboxes = document.querySelectorAll('input.toggle-attribute');

for (const checkbox of checkboxes) {
	checkbox.addEventListener('change', () => {
		if (checkbox.checked) {
			grid.setAttribute(checkbox.id, '');
		} else {
			grid.removeAttribute(checkbox.id);
		}
	});
}

checkboxes = document.querySelectorAll('input.toggle-input');

for (const checkbox of checkboxes) {
	const input = document.querySelector(`#${checkbox.id.replace('_checkbox', '')}`);
	const attribute = input.id.replace('_', '-');

	checkbox.addEventListener('change', () => {
		input.readOnly = !checkbox.checked;

		if (checkbox.checked) {
			grid.setAttribute(attribute, input.value);
		} else {
			grid.removeAttribute(attribute);
		}
	});

	input.addEventListener('input', () => {
		if (checkbox.checked) {
			grid.setAttribute(attribute, input.value);
		}
	});
}

document.querySelector('.grid__toolbar').hidden = false;
