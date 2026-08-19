import {getColor, isHexColor} from '@oscarpalmer/atoms/color';
import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {setAttributes} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {on} from '@oscarpalmer/toretto/event';
import {createEmbeddedFloatable} from '../floatable/floatable.embedded';
import {
	COLOR_PICKER_INPUT_TYPES,
	COLOR_PICKER_MESSAGE_INPUT,
	COLOR_PICKER_MESSAGE_LABEL,
} from './constants.color-picker';
import {createColorPickerAnchor, createColorPickerContent} from './dom.color-picker';
import {
	colorPickerMovement,
	onColorPickerHue,
	onColorPickerInput,
	onColorPickerOpacity,
} from './event.color-picker';
import {updateColorPickerValidity} from './form.color-picker';
import type {OuiColorPickerElement} from './index';
import {
	colorPickerLocalizations,
	getColorPickerId,
	getColorPickerOutput,
	setColorPickerDisabled,
	setColorPickerRequired,
	setColorPickerValues,
	updateColorPickerLabels,
} from './misc.color-picker';
import type {OuiColorPickerCreateParameters, OuiColorPickerState} from './models.color-picker';

// #region Functions

export function attachColorPicker(state: OuiColorPickerState): void {
	const {anchor, content, host, id, inline, input, label, listeners, style} = state;

	if (!inline) {
		state.floatable = createEmbeddedFloatable(
			anchor.container ?? anchor.container,
			content.element,
			{
				position: 'below-start',
				reusable: false,
			},
		);

		state.floatable.update();
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

	if (anchor.button != null) {
		setAria(anchor.button, 'expanded', false);
	}

	input.before(style, anchor.container, content.element);

	input.remove();

	listeners.push(
		on(host, 'focusout', () => {
			setTimeout(() => {
				if (colorPickerMovement.parameters == null && !host.contains(document.activeElement)) {
					state.floatable?.hide();
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
				if (state.disabled) {
					event.preventDefault();
				}
			},
			{
				passive: false,
			},
		),
		on(content.element, 'toggle', event => {
			const open = event.newState === 'open';

			if (anchor.button != null) {
				setAria(anchor.button, 'expanded', open);
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
				onColorPickerOpacity(state);
			}),
		);
	}

	colorPickers.map.set(host, state);
	colorPickers.set.add(state);
}

export function detachColorPicker(state: OuiColorPickerState): void {
	const {anchor, content, floatable, host, input, label, style} = state;

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

	const listeners = state.listeners.splice(0);
	const {length} = listeners;

	for (let index = 0; index < length; index += 1) {
		listeners[index]();
	}

	colorPickers.map.delete(state.host);
	colorPickers.set.delete(state);
}

export function initializeColorPicker(
	element: OuiColorPickerElement,
	internals: ElementInternals,
): OuiColorPickerState {
	const input = element.querySelector('input');

	if (input == null || !COLOR_PICKER_INPUT_TYPES.has(input.type)) {
		throw new Error(COLOR_PICKER_MESSAGE_INPUT);
	}

	const label = element.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement | null;

	if (label == null) {
		throw new Error(COLOR_PICKER_MESSAGE_LABEL);
	}

	element.id = input.id;

	const id = getColorPickerId();

	const labelId = label.id;

	const alpha = element.hasAttribute('alpha');
	const color = getColor(input.value);
	const disabled = element.hasAttribute('disabled') || input.disabled;
	const inline = element.hasAttribute('inline');
	const output = getColorPickerOutput(element);
	const readonly = element.hasAttribute('readonly') || input.readOnly;
	const required = element.hasAttribute('required') || input.required;

	const parameters: OuiColorPickerCreateParameters = {
		alpha,
		color,
		id,
		inline,
		input,
		output,
	};

	const anchor = createColorPickerAnchor(parameters);
	const content = createColorPickerContent(parameters);

	const formatted = color.toHexString(alpha);

	const state: OuiColorPickerState = {
		alpha,
		anchor,
		content,
		disabled,
		id,
		inline,
		input,
		internals,
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
		localizations: {
			component: {},
			global: colorPickerLocalizations,
		},
		style: createElement('style'),
		value: {
			current: formatted,
			initial: formatted,
		},
	};

	attachColorPicker(state);

	setAttributes(element, {
		output,
		alpha: alpha ? '' : undefined,
		inline: inline ? '' : undefined,
	});

	setColorPickerDisabled(state, 'disabled', disabled);
	setColorPickerDisabled(state, 'readonly', readonly);
	setColorPickerRequired(state, required);

	setColorPickerValues(state, false);

	updateColorPickerLabels(state);
	updateColorPickerValidity(state, isHexColor(state.value.current, alpha));

	return state;
}

// #endregion

// #region Variables

export const colorPickers = {
	map: new WeakMap<OuiColorPickerElement, OuiColorPickerState>(),
	set: new Set<OuiColorPickerState>(),
};

// #endregion
