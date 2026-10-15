import {isHexColor} from '@oscarpalmer/atoms/color';
import {clamp} from '@oscarpalmer/atoms/number';
import {setAttribute, setAttributes} from '@oscarpalmer/toretto/attribute';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {toggleStyles} from '@oscarpalmer/toretto/style';
import {supportsTouch} from '@oscarpalmer/toretto/touch';
import {copyValue} from '../internal/misc';
import {
	COLOR_PICKER_ATTRIBUTE_COPY_ERROR,
	COLOR_PICKER_ATTRIBUTE_COPY_SUCCESS,
	COLOR_PICKER_EXPRESSION_HEX_PREFIX,
	COLOR_PICKER_KEYS,
	COLOR_PICKER_SELECTOR_COPY,
	COLOR_PICKER_SELECTOR_INPUT,
	COLOR_PICKER_SELECTOR_OUTPUT_INPUT,
	COLOR_PICKER_SELECTOR_WELL,
	COLOR_PICKER_SELECTOR_WELL_KNOB,
	COLOR_PICKER_SYMBOL,
	COLOR_PICKER_TAGNAME,
} from './color-picker.constants';
import {setColorPickerValues} from './color-picker.misc';
import {
	OuiColorPickerEvent,
	type OuiColorPickerCopy,
	type OuiColorPickerMovement,
	type OuiColorPickerMovementParameters,
	type OuiColorPickerOutputColor,
	type OuiColorPickerState,
} from './color-picker.model';
import {getColorPickerOutputFormat, updateColorPickerOutputCopyLabel} from './color-picker.output';

// #region Functions

function cancelMove(parameters: OuiColorPickerMovementParameters): void {
	parameters.state.component.color.value.hexa = parameters.value;

	setColorPickerValues(parameters.state, true);

	colorPickerMovement.parameters = undefined;

	styleToggler.remove();
}

function onClick(event: Event): void {
	const button = findAncestor(event, COLOR_PICKER_SELECTOR_COPY);

	if (!(button instanceof HTMLButtonElement)) {
		return;
	}

	setAttributes(button, {
		[COLOR_PICKER_ATTRIBUTE_COPY_ERROR]: undefined,
		[COLOR_PICKER_ATTRIBUTE_COPY_SUCCESS]: undefined,
	});

	const state = findAncestor(event, COLOR_PICKER_TAGNAME)?.[COLOR_PICKER_SYMBOL];

	if (state == null || state.component.disabled) {
		return;
	}

	const {component} = state;

	const copy =
		button.dataset.color == null ? component.content.output?.copy : component.anchor.copy;

	if (copy == null) {
		return;
	}

	if (copy.timer != null) {
		clearTimeout(copy.timer);

		copy.timer = undefined;
	}

	const color = button.dataset.color ?? getColorPickerOutputFormat(state);

	if (color == null) {
		return;
	}

	let value: string | undefined;

	switch (color) {
		case 'hex':
			value = component.color.value.toHexString(component.alpha);
			break;

		case 'hsl':
			value = component.color.value.toHslString(component.alpha);
			break;

		case 'hwb':
			value = component.color.value.toHwbString(component.alpha);
			break;

		case 'rgb':
			value = component.color.value.toRgbString(component.alpha);
			break;

		default:
			break;
	}

	if (value != null) {
		copyValue(
			value,
			() => {
				updateColorPickerCopy(copy, COLOR_PICKER_ATTRIBUTE_COPY_SUCCESS);
			},
			() => {
				updateColorPickerCopy(copy, COLOR_PICKER_ATTRIBUTE_COPY_ERROR);
			},
		);
	}
}

export function onColorPickerHue(state: OuiColorPickerState): void {
	const {component} = state;

	const hue = component.content.hue.input.valueAsNumber;

	component.color.value.hsla = {
		...component.color.value.hsla,
		hue,
	};

	setColorPickerValues(state, false);
}

export function onColorPickerInput(state: OuiColorPickerState): void {
	const {component} = state;
	const {alpha, anchor, color, host} = component;

	const value = anchor.input.value.replace(COLOR_PICKER_EXPRESSION_HEX_PREFIX, '');

	if (value.toLowerCase() === (alpha ? color.value.hexa : color.value.hex).toLowerCase()) {
		return;
	}

	component.value.current = anchor.input.value;

	const {length} = value;

	let valid: boolean;

	if (alpha) {
		valid = isHexColor(value, true) && (length === 4 || length === 8);
	} else {
		valid = isHexColor(value) && (length === 3 || length === 6);
	}

	if (valid) {
		if (length === 3 || length === 6) {
			color.value.hex = value;
		} else {
			color.value.hexa = value;
		}
	}

	setColorPickerValues(state, false, anchor.input.value);

	dispatch(host, new OuiColorPickerEvent('oui:input', color.value, valid));
}

export function onColorPickerOpacity(state: OuiColorPickerState, input: HTMLInputElement): void {
	state.component.color.value.alpha = input.valueAsNumber;

	setColorPickerValues(state, false);
}

export function onColorPickerOutputFormat(state: OuiColorPickerState): void {
	const {content} = state.component;
	const {items, toggle} = content.output ?? {};

	if (items == null || toggle == null) {
		return;
	}

	const attribute = `${COLOR_PICKER_TAGNAME}-output-${toggle.value}`;

	for (const item of items) {
		item.hidden = !item.hasAttribute(attribute);
	}

	if (content.output?.copy != null) {
		updateColorPickerOutputCopyLabel(state, content.output.copy.button);
	}
}

export function onColorPickerOutputValue(event: Event, state: OuiColorPickerState): void {
	const input = findAncestor(event, COLOR_PICKER_SELECTOR_OUTPUT_INPUT);

	if (!(input instanceof HTMLInputElement)) {
		return;
	}

	const color = input.dataset.color as OuiColorPickerOutputColor | undefined;
	const property = input.dataset.property;

	if (color == null || property == null) {
		return;
	}

	if (outputTimer != null) {
		clearTimeout(outputTimer);
	}

	outputTimer = setTimeout(() => {
		outputTimer = undefined;

		state.component.color.value[color] = {
			...state.component.color.value[color],
			[property]: input.valueAsNumber,
		} as never;

		setColorPickerValues(state, false);
	});
}

function onEnter(state: OuiColorPickerState): void {
	const {component, form} = state;
	const {alpha, anchor, color} = component;

	const input = anchor.input.value.replace(COLOR_PICKER_EXPRESSION_HEX_PREFIX, '');

	const short = alpha ? input.length === 4 : input.length === 3;

	const valid = isHexColor(input, alpha) && short;

	if (valid) {
		anchor.input.value = color.value.toHexString(alpha);
	}

	form.internals.form?.requestSubmit();
}

function onKeydown(event: KeyboardEvent): void {
	if (colorPickerMovement.parameters != null && event.key === 'Escape') {
		cancelMove(colorPickerMovement.parameters);

		return;
	}

	const knob = findAncestor(event, COLOR_PICKER_SELECTOR_WELL_KNOB);

	if (
		!(
			(event.key === 'Enter' && findAncestor(event, COLOR_PICKER_SELECTOR_INPUT) != null) ||
			(COLOR_PICKER_KEYS.has(event.key) && knob != null)
		)
	) {
		return;
	}

	const state = findAncestor(event, COLOR_PICKER_TAGNAME)?.[COLOR_PICKER_SYMBOL];

	if (state == null || state.component.disabled || state.component.readonly) {
		return;
	}

	event.preventDefault();

	const {component} = state;

	if (event.key === 'Enter') {
		onEnter(state);

		return;
	}

	if (knob == null) {
		return;
	}

	const modifier = event.shiftKey ? 10 : 1;

	let {lightness, saturation} = component.color.value.hsl;

	switch (event.key) {
		case 'ArrowDown':
			lightness -= 1 * modifier;
			break;

		case 'ArrowLeft':
			saturation -= 1 * modifier;
			break;

		case 'ArrowRight':
			saturation += 1 * modifier;
			break;

		case 'ArrowUp':
			lightness += 1 * modifier;
			break;

		case 'End':
			lightness = 0;
			break;

		case 'Home':
			lightness = 100;
			break;

		case 'PageDown':
			lightness -= 10;
			break;

		case 'PageUp':
			lightness += 10;
			break;
	}

	component.color.value.hsl = {
		...state.component.color.value.hsl,
		lightness: clamp(lightness, 0, 100),
		saturation: clamp(saturation, 0, 100),
	};

	setColorPickerValues(state, false);
}

function onPointerdown(event: MouseEvent | TouchEvent): void {
	if (
		event.altKey ||
		event.ctrlKey ||
		event.metaKey ||
		event.shiftKey ||
		(supportsTouch.value
			? event.type === 'mousedown'
			: event.type === 'touchstart' || (event as MouseEvent).button !== 0)
	) {
		return;
	}

	const well = findAncestor(event, COLOR_PICKER_SELECTOR_WELL);

	if (well == null) {
		return;
	}

	const element = findAncestor(event, COLOR_PICKER_TAGNAME);

	if (element == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	const position = getEventPosition(event);

	if (position == null) {
		return;
	}

	const state = element?.[COLOR_PICKER_SYMBOL];

	if (state == null || state.component.disabled || state.component.readonly) {
		return;
	}

	colorPickerMovement.parameters = {
		state,
		rectangle: well.getBoundingClientRect(),
		value: state.component.color.value.hexa,
	};

	styleToggler.set();
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	if (colorPickerMovement.parameters == null) {
		return;
	}

	const position = getEventPosition(event);

	if (position != null) {
		updateColorPickerValues(colorPickerMovement.parameters, position);
	}
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	if (colorPickerMovement.parameters == null) {
		return;
	}

	const position = getEventPosition(event);

	if (position != null) {
		updateColorPickerValues(colorPickerMovement.parameters, position);
	}

	colorPickerMovement.parameters = undefined;

	styleToggler.remove();
}

function updateColorPickerCopy(copy: OuiColorPickerCopy, attribute: string): void {
	const {button} = copy;

	setAttribute(button, attribute, '');

	copy.timer = setTimeout(() => {
		copy.timer = undefined;

		setAttribute(button, attribute, undefined);
	}, styleTime);
}

function updateColorPickerValues(
	parameters: OuiColorPickerMovementParameters,
	position: EventPosition,
): void {
	const {rectangle, state} = parameters;
	const {x, y} = position;

	const top = clamp((y - rectangle.top) / rectangle.height, 0, 1);
	const left = clamp((x - rectangle.left) / rectangle.width, 0, 1);

	state.component.color.value.hsl = {
		...state.component.color.value.hsl,
		lightness: (1 - top) * 100,
		saturation: left * 100,
	};

	setColorPickerValues(state, true);
}

// #endregion

// #region Variables

const styleToggler = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

export const colorPickerMovement: OuiColorPickerMovement = {};

const styleTime = 2_500;

let outputTimer: number | undefined;

// #endregion

// #region Initialization

on(document, 'click', onClick);
on(document, 'keydown', onKeydown, {passive: false});
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup);
on(document, 'touchstart', onPointerdown, {passive: false});

// #endregion
