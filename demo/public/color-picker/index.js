import '/assets/js/index.mjs';

/* Oui.setColorPickerLocalizations('en', {
	hue: 'Hue???',
	invalid: 'Please enter or select a color???',
	lightnessSaturation: 'Lightness and saturation???',
	opacity: 'Opacity???',
	toggle: 'Toggle color picker???',
}); */

function disable() {
	for (const colorPicker of colorPickers) {
		colorPicker.disabled = true;
	}
}

function editable() {
	for (const colorPicker of colorPickers) {
		colorPicker.readonly = false;
	}
}

function enable() {
	for (const colorPicker of colorPickers) {
		colorPicker.disabled = false;
	}
}

function readonly() {
	for (const colorPicker of colorPickers) {
		colorPicker.readonly = true;
	}
}

const colorPickers = document.querySelectorAll('oui-color-picker');
const form = document.querySelector('#color-pickers');

for (const colorPicker of colorPickers) {
	colorPicker.addEventListener('oui:change', event => {
		console.log(colorPicker.id, 'change', event.valid, event.value);
	});

	colorPicker.addEventListener('oui:input', event => {
		console.log(colorPicker.id, 'input', event.valid, event.value);
	});
}

form?.addEventListener('submit', event => {
	event.preventDefault();

	const formData = new FormData(form);

	console.log('form submit', Object.fromEntries(formData.entries()));
});

window.disable = disable;
window.editable = editable;
window.enable = enable;
window.form = form;
window.readonly = readonly;
