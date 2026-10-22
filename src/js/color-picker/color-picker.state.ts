import {getColor, isHexColor} from '@oscarpalmer/atoms/color';
import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {setAttributes} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {on} from '@oscarpalmer/toretto/event';
import {createEmbeddedFloatable} from '../floatable/floatable.embedded';
import {createLocalizations} from '../internal/l10n/index';
import {
	COLOR_PICKER_INPUT_TYPES,
	COLOR_PICKER_MESSAGE_INPUT,
	COLOR_PICKER_MESSAGE_LABEL,
	COLOR_PICKER_SYMBOL,
	colorPickerLocalizations,
} from './color-picker.constants';
import {createColorPickerAnchor, createColorPickerContent} from './color-picker.dom';
import {
	colorPickerMovement,
	onColorPickerHue,
	onColorPickerInput,
	onColorPickerOpacity,
	onColorPickerOutputFormat,
	onColorPickerOutputValue,
} from './color-picker.event';
import {updateColorPickerValidity} from './color-picker.form';
import {
	getColorPickerId,
	getColorPickerOutput,
	setColorPickerDisabled,
	setColorPickerRequired,
	setColorPickerValues,
	updateColorPickerLabels,
} from './color-picker.misc';
import type {
	GenericOuiColorPickerElement,
	OuiColorPickerCreateParameters,
	OuiColorPickerState,
	OuiColorPickerStateComponent,
} from './color-picker.model';

// #region Functions

export function attachColorPicker(state: OuiColorPickerState): void {
	const {component} = state;
	const {anchor, content, host, id, inline, input, label, listeners, style} = state.component;

	if (!inline) {
		component.floatable = createEmbeddedFloatable(
			anchor.container ?? anchor.container,
			content.element,
			{
				position: 'below-start',
				reusable: false,
			},
		);

		component.floatable.update();
	}

	const labelId = `${id}_label`;

	setAria(host, {
		describedby: getAria(input, 'describedby'),
		labelledby: labelId,
	});

	setAttributes(host, {
		name: input.name === '' ? input.id : input.name,
	});

	label.element.htmlFor = anchor.input.id;
	label.element.id = labelId;

	if (anchor.toggle != null) {
		setAria(anchor.toggle, 'expanded', false);
	}

	input.before(style, anchor.container, content.element);

	input.remove();

	listeners.push(
		on(host, 'focusout', () => {
			setTimeout(() => {
				if (colorPickerMovement.parameters == null && !host.contains(document.activeElement)) {
					component.floatable?.hide();
				}
			});
		}),
		on(anchor.input, 'change', () => {
			onColorPickerInput(state);
		}),
		on(anchor.input, 'input', () => {
			onColorPickerInput(state);
		}),
		on(
			content.element,
			'beforetoggle',
			event => {
				if (component.disabled) {
					event.preventDefault();
				}
			},
			{
				passive: false,
			},
		),
		on(content.element, 'toggle', event => {
			const open = event.newState === 'open';

			if (anchor.toggle != null) {
				setAria(anchor.toggle, 'expanded', open);
			}

			if (open) {
				content.well.knob.focus();
			}
		}),
		on(content.hue.input, 'input', () => {
			onColorPickerHue(state);
		}),
	);

	if (content.opacity != null) {
		listeners.push(
			on(content.opacity.input, 'input', () => {
				onColorPickerOpacity(state, content.opacity!.input);
			}),
			on(content.opacity.range, 'input', () => {
				onColorPickerOpacity(state, content.opacity!.range);
			}),
		);
	}

	if (content.output?.toggle != null) {
		listeners.push(
			on(content.element, 'change', event => {
				onColorPickerOutputValue(event, state);
			}),
			on(content.element, 'input', event => {
				onColorPickerOutputValue(event, state);
			}),
			on(content.output.toggle, 'change', () => {
				onColorPickerOutputFormat(state);
			}),
		);
	}

	colorPickers.add(state);
}

export function detachColorPicker(state: OuiColorPickerState): void {
	const {component} = state;
	const {anchor, content, floatable, host, input, label, style} = component;

	floatable?.destroy();

	setAria(host, {
		describedby: undefined,
		labelledby: undefined,
	});

	setAttributes(host, {
		name: undefined,
	});

	label.element.htmlFor = input.id;
	label.element.id = label.id;

	anchor.container.before(input);

	anchor.container.remove();
	content.element.remove();
	style.remove();

	const listeners = component.listeners.splice(0);
	const {length} = listeners;

	for (let index = 0; index < length; index += 1) {
		listeners[index]();
	}

	colorPickers.delete(state);
}

export function initializeColorPicker(colorPicker: GenericOuiColorPickerElement): void {
	const state = colorPicker[COLOR_PICKER_SYMBOL];

	colorPicker[COLOR_PICKER_SYMBOL].component = initializeColorPickerComponent(colorPicker, state);

	if (state.form.restored != null) {
		colorPicker.value = state.form.restored;

		state.form.restored = undefined;
	}
}

export function initializeColorPickerComponent(
	element: GenericOuiColorPickerElement,
	state: OuiColorPickerState,
): OuiColorPickerStateComponent {
	const input = element.querySelector('input');

	if (input == null || !COLOR_PICKER_INPUT_TYPES.has(input.type)) {
		throw new Error(COLOR_PICKER_MESSAGE_INPUT);
	}

	const label = element.querySelector(`label[for="${input.id}"]`);

	if (!(label instanceof HTMLLabelElement)) {
		throw new TypeError(COLOR_PICKER_MESSAGE_LABEL);
	}

	element.id = input.id;

	const id = getColorPickerId();

	const labelId = label.id;

	const alpha = element.hasAttribute('alpha');
	const color = getColor(input.value);
	const copy = element.hasAttribute('copy');
	const disabled = element.hasAttribute('disabled') || input.disabled;
	const inline = element.hasAttribute('inline');
	const output = getColorPickerOutput(element);
	const readonly = element.hasAttribute('readonly') || input.readOnly;
	const required = element.hasAttribute('required') || input.required;

	const parameters: OuiColorPickerCreateParameters = {
		alpha,
		color,
		copy,
		id,
		inline,
		input,
		output,
	};

	const anchor = createColorPickerAnchor(parameters);
	const content = createColorPickerContent(parameters);

	const formatted = color.toHexString(alpha);

	state.component = {
		alpha,
		anchor,
		content,
		copy,
		disabled,
		id,
		inline,
		input,
		output,
		readonly,
		required,
		color: {
			foreground: '',
			value: color,
		},
		host: element,
		label: {
			element: label,
			id: labelId,
		},
		listeners: [],
		localizations: createLocalizations(colorPickerLocalizations),
		style: createElement('style'),
		value: {
			current: formatted,
			initial: formatted,
		},
	} satisfies OuiColorPickerStateComponent;

	attachColorPicker(state);

	setAttributes(element, {
		output,
		alpha: alpha ? '' : undefined,
		copy: copy ? '' : undefined,
		inline: inline ? '' : undefined,
	});

	setColorPickerDisabled(state, 'disabled', disabled);
	setColorPickerDisabled(state, 'readonly', readonly);
	setColorPickerRequired(state, required);

	setColorPickerValues(state, false);

	updateColorPickerLabels(state);
	updateColorPickerValidity(state, isHexColor(state.component.value.current, alpha));

	return state.component;
}

// #endregion

// #region Variables

export const colorPickers: Set<OuiColorPickerState> = new Set();

// #endregion
