import {round} from '@oscarpalmer/atoms/math';
import {setAria} from '@oscarpalmer/toretto/aria';
import {createElement} from '@oscarpalmer/toretto/create';
import {getLocalization, localize} from '../l10n/index';
import {
	COLOR_PICKER_ATTRIBUTE_OUTPUT_INPUT,
	COLOR_PICKER_TAGNAME,
	colorPickerLocalizations,
} from './color-picker.constants';
import type {
	OuiColorPickerContentOutput,
	OuiColorPickerCopy,
	OuiColorPickerCreateParameters,
	OuiColorPickerLocalizations,
	OuiColorPickerOutputColor,
	OuiColorPickerOutputColorProperty,
	OuiColorPickerState,
} from './color-picker.model';

// #region Functions

export function createColorPickerOutput(
	parameters: OuiColorPickerCreateParameters,
	copy: OuiColorPickerCopy | undefined,
): OuiColorPickerContentOutput | undefined {
	if (parameters.output === 'none') {
		return;
	}

	const container = createElement('div', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-output`]: '',
		},
	});

	let inputs: HTMLInputElement[] | undefined;
	let item: HTMLDivElement | undefined;
	let items: HTMLDivElement[] | undefined;
	let itemsContainer: HTMLDivElement | undefined;
	let toggle: HTMLSelectElement | undefined;
	let toggleContainer: HTMLDivElement | undefined;

	if (parameters.output === 'all') {
		[toggleContainer, toggle] = createOutputFormat(parameters, copy?.button);
		[itemsContainer, items, inputs] = createOutputItems(parameters, copy?.button);

		container.append(toggleContainer, itemsContainer);
	} else {
		[item, inputs] = createOutputItem(parameters.output, parameters, copy?.button, true, false);

		items = [item];

		container.append(item);
	}

	return {container, copy, inputs, items, toggle};
}

function createOutputFormat(
	parameters: OuiColorPickerCreateParameters,
	copy: HTMLButtonElement | undefined,
): [HTMLDivElement, HTMLSelectElement] {
	const container = createElement('div', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-output-format`]: '',
		},
	});

	const toggle = createElement('div', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-output-toggle`]: '',
		},
	});

	const id = `${parameters.id}_output_format`;

	const label = createElement('label', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-output-label`]: '',
			[`${COLOR_PICKER_TAGNAME}-output-format-label`]: '',
		},
		property: {
			htmlFor: id,
			textContent: colorPickerLocalizations.defaults.output,
		},
	});

	const select = createElement('select', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-output-format-value`]: '',
			form: '',
		},
		property: {
			id,
		},
	});

	select.append(
		...colors.map(color =>
			createElement('option', {
				property: {
					textContent: colorPickerLocalizations.defaults[color],
					value: color,
				},
			}),
		),
	);

	toggle.append(label, select);
	container.append(toggle);

	if (copy != null) {
		container.append(copy);
	}

	return [container, select];
}

function createOutputInput(
	color: OuiColorPickerOutputColor,
	property: OuiColorPickerOutputColorProperty,
	value: Record<string, number>,
	parameters: OuiColorPickerCreateParameters,
): [HTMLDivElement, HTMLInputElement] {
	const item = createElement('div', {});

	const id = `${parameters.id}_output_${color}_${property}`;

	const label = createElement('label', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-output-label`]: '',
			[`${COLOR_PICKER_ATTRIBUTE_OUTPUT_INPUT}-label`]: '',
		},
		data: {
			label: property,
		},
		property: {
			htmlFor: id,
			textContent: colorPickerLocalizations.defaults[property],
		},
	});

	const input = createElement('input', {
		attribute: {
			[COLOR_PICKER_ATTRIBUTE_OUTPUT_INPUT]: '',
			[`${COLOR_PICKER_TAGNAME}-output-${property}`]: '',
			autocomplete: 'off',
			autocorrect: 'off',
			form: '',
			inputmode: 'text',
			spellcheck: 'false',
		},
		data: {
			color,
			property,
		},
		property: {
			id,
			max: max[property],
			min: '0',
			type: 'number',
			valueAsNumber: value[property],
		},
	});

	item.append(label, input);

	return [item, input];
}

function createOutputItem(
	color: OuiColorPickerOutputColor,
	parameters: OuiColorPickerCreateParameters,
	copy: HTMLButtonElement | undefined,
	single: boolean,
	hidden: boolean,
): [HTMLDivElement, HTMLInputElement[]] {
	const item = createElement('div', {
		aria: {
			label: colorPickerLocalizations.defaults[color],
		},
		data: {
			label: color,
		},
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-output-item`]: '',
			[`${COLOR_PICKER_TAGNAME}-output-${color}`]: '',
		},
		property: {
			hidden,
		},
	});

	const value = parameters.color[color];

	const inputs: HTMLInputElement[] = [];

	for (const property of properties[color]) {
		const [container, input] = createOutputInput(color, property, value, parameters);

		inputs.push(input);

		item.append(container);
	}

	if (single && copy != null) {
		item.append(copy);
	}

	return [item, inputs];
}

function createOutputItems(
	parameters: OuiColorPickerCreateParameters,
	copy: HTMLButtonElement | undefined,
): [HTMLDivElement, HTMLDivElement[], HTMLInputElement[]] {
	const container = createElement('div', {});

	const inputs: HTMLInputElement[] = [];
	const items: HTMLDivElement[] = [];

	for (let index = 0; index < colors.length; index += 1) {
		const color = colors[index];

		const [item, itemInputs] = createOutputItem(color, parameters, copy, false, index > 0);

		inputs.push(...itemInputs);
		items.push(item);
	}

	container.append(...items);

	return [container, items, inputs];
}

export function getColorPickerOutputFormat(
	state: OuiColorPickerState,
): OuiColorPickerOutputColor | undefined {
	const {component} = state;

	if (component.output === 'none') {
		return;
	}

	let color: string | undefined;

	if (component.output === 'all') {
		color = component.content.output?.toggle?.value;
	} else {
		color = component.output;
	}

	return color as OuiColorPickerOutputColor | undefined;
}

export function updateColorPickerOutputCopyLabel(
	state: OuiColorPickerState,
	button: HTMLButtonElement,
): void {
	const {host, localizations} = state.component;

	const prefix = localize(
		getLocalization(localizations.global, host, 'copy', localizations.component),
		{},
		[],
	);

	const color = getColorPickerOutputFormat(state);

	let content: string;

	if (color == null) {
		content = prefix;
	} else {
		const suffix = localize(
			getLocalization(localizations.global, host, color, localizations.component),
			{},
			[],
		);

		content = `${prefix} ${suffix}`;
	}

	setAria(button, 'label', content);

	button.textContent = prefix;
}

export function updateColorPickerOutputInputs(state: OuiColorPickerState): void {
	const {component} = state;
	const {content} = component;

	if (content.output?.inputs == null) {
		return;
	}

	const inputs = content.output.inputs;
	const {length} = inputs;

	for (let index = 0; index < length; index += 1) {
		const input = inputs[index];

		const color = input.dataset.color as OuiColorPickerOutputColor | undefined;
		const property = input.dataset.property;

		if (color != null && property != null) {
			input.valueAsNumber =
				color in component.color.value && property in component.color.value[color]
					? round(component.color.value[color][property as never])
					: 0;
		}
	}
}

export function updateColorPickerOutputLabels(state: OuiColorPickerState): void {
	const {content, host, localizations} = state.component;

	if (content.output == null) {
		return;
	}

	if (content.output.copy?.button != null) {
		updateColorPickerOutputCopyLabel(state, content.output.copy.button);
	}

	for (let labelsIndex = 0; labelsIndex < labelsLength; labelsIndex += 1) {
		const label = labels[labelsIndex];

		const elements = [...content.element.querySelectorAll(`[data-label="${label}"]`)];
		const elementsLength = elements.length;

		if (elementsLength === 0) {
			return;
		}

		const textContent = localize(
			getLocalization(localizations.global, host, label, localizations.component),
			{},
			[],
		);

		for (let elementsIndex = 0; elementsIndex < elementsLength; elementsIndex += 1) {
			const element = elements[elementsIndex];

			if (element instanceof HTMLLabelElement) {
				element.textContent = textContent;
			} else {
				setAria(element, 'label', textContent);
			}
		}
	}
}

// #endregion

// #region Variables

const colors: OuiColorPickerOutputColor[] = ['hsl', 'hwb', 'rgb'];

const labels: Array<keyof OuiColorPickerLocalizations> = [
	'blackness',
	'blue',
	'green',
	'hsl',
	'hue',
	'hwb',
	'lightness',
	'output',
	'red',
	'rgb',
	'saturation',
	'whiteness',
];

const labelsLength = labels.length;

const max: Record<string, string> = {
	blackness: '100',
	blue: '255',
	green: '255',
	hue: '360',
	lightness: '100',
	red: '255',
	saturation: '100',
	whiteness: '100',
};

const properties: Record<OuiColorPickerOutputColor, OuiColorPickerOutputColorProperty[]> = {
	hsl: ['hue', 'saturation', 'lightness'],
	hwb: ['hue', 'whiteness', 'blackness'],
	rgb: ['red', 'green', 'blue'],
};

// #endregion
