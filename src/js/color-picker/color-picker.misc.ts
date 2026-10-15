import {
	getForegroundColor,
	isHexColor,
	isHslaColor,
	isHslColor,
	isHwbaColor,
	isHwbColor,
	isRgbaColor,
	isRgbColor,
} from '@oscarpalmer/atoms/color';
import {setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute} from '@oscarpalmer/toretto/attribute';
import {setProperty} from '@oscarpalmer/toretto/property';
import {COLOR_PICKER_OUTPUTS, colorPickerLocalizations} from './color-picker.constants';
import {updateColorPickerForm, updateColorPickerValidity} from './color-picker.form';
import type {
	GenericOuiColorPickerElement,
	OuiColorPickerLocalizations,
	OuiColorPickerOutputType,
	OuiColorPickerState,
	OuiColorPickerValueType,
} from './color-picker.model';
import {updateColorPickerOutputInputs, updateColorPickerOutputLabels} from './color-picker.output';

// #region Functions

export function getColorPickerId(): string {
	index += 1;

	return `oui_color_picker_${index}`;
}

export function getColorPickerOutput(
	element: GenericOuiColorPickerElement,
): OuiColorPickerOutputType {
	const attribute = getAttribute(element, 'output');

	return COLOR_PICKER_OUTPUTS.has(attribute as never) ? (attribute as never) : 'none';
}

export function getColorPickerValueType(
	state: OuiColorPickerState,
	value: unknown,
): OuiColorPickerValueType | undefined {
	const {alpha} = state.component;

	switch (true) {
		case isHexColor(value, alpha):
			return alpha ? 'hexa' : 'hex';

		case isHslColor(value):
			return 'hsl';

		case isHslaColor(value):
			return 'hsla';

		case isHwbColor(value):
			return 'hwb';

		case isHwbaColor(value):
			return 'hwba';

		case isRgbColor(value):
			return 'rgb';

		case isRgbaColor(value):
			return 'rgba';

		default:
			break;
	}

	return undefined;
}

/**
 * Set localizations for a specific language
 *
 * @param language Language code
 * @param localizations Localizations for language
 */
export function setColorPickerLocalizations(
	language: string,
	localizations: Partial<OuiColorPickerLocalizations>,
): void;

/**
 * Set default localizations
 *
 * @param localizations Default localizations
 */
export function setColorPickerLocalizations(
	localizations: Partial<OuiColorPickerLocalizations>,
	defaults: true,
): void;

/**
 * Set localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setColorPickerLocalizations(
	localizations: Record<string, Partial<OuiColorPickerLocalizations>>,
): void;

export function setColorPickerLocalizations(
	first:
		| string
		| Partial<OuiColorPickerLocalizations>
		| Record<string, Partial<OuiColorPickerLocalizations>>,
	second?: true | Partial<OuiColorPickerLocalizations>,
): void {
	if (second === true) {
		void colorPickerLocalizations.setDefaults(first as never);
	} else {
		void colorPickerLocalizations.setLanguages(first as never, second as never);
	}
}

export function setColorPickerDisabled(
	state: OuiColorPickerState,
	type: 'disabled' | 'readonly',
	value: boolean,
): void {
	const {component} = state;

	component[type] = value;

	setAria(component.host, type, value);

	component.anchor.input.readOnly = value;

	setAria(component.anchor.input, type, value);
	setProperty(component.content.hue.input, 'disabled', component.disabled || component.readonly);

	if (component.anchor.toggle != null) {
		setAria(component.anchor.toggle, 'disabled', component.disabled);
	}

	if (component.content.opacity != null) {
		setProperty(
			component.content.opacity.input,
			'disabled',
			component.disabled || component.readonly,
		);
	}
}

export function setColorPickerRequired(state: OuiColorPickerState, value: boolean): void {
	const {component} = state;

	component.required = value;

	setAria(component.host, 'required', value);
	setAria(component.anchor.input, 'required', value);

	updateColorPickerValidity(state, isHexColor(component.value.current, component.alpha));
}

export function setColorPickerValue<Type extends OuiColorPickerValueType>(
	state: OuiColorPickerState,
	value: unknown,
	type?: Type,
): void {
	if (state == null) {
		return;
	}

	const actual = type ?? getColorPickerValueType(state, value);

	if (actual == null || (type != null && type !== actual)) {
		return;
	}

	state.component.color.value[actual] = value as never;

	setColorPickerValues(state, true);
}

export function setColorPickerValues(
	state: OuiColorPickerState,
	focus: boolean,
	input?: string,
): void {
	const {component} = state;
	const {anchor, color, content, host, style} = component;

	color.foreground = getForegroundColor(color.value).hex;

	const {alpha, hex, hsl, rgb} = color.value;
	const {hue, lightness, saturation} = hsl;
	const {blue, green, red} = rgb;

	const value = input ?? color.value.toHexString(component.alpha);

	anchor.input.value = value;
	content.hue.input.valueAsNumber = hue;

	if (content.opacity != null) {
		content.opacity.input.valueAsNumber = alpha;
	}

	component.value.current = value;

	style.textContent = `#${host.id} {
	--oui-color-picker-alpha: ${alpha};
	--oui-color-picker-blue: ${blue};
	--oui-color-picker-green: ${green};
	--oui-color-picker-foreground: #${color.foreground};
	--oui-color-picker-hex: #${hex};
	--oui-color-picker-hue: ${hue};
	--oui-color-picker-lightness: ${lightness};
	--oui-color-picker-red: ${red};
	--oui-color-picker-saturation: ${saturation};
}`;

	updateColorPickerForm(state, isHexColor(component.value.current, component.alpha));
	updateColorPickerOutputInputs(state);
	updateColorPickerWell(state);

	if (focus) {
		content.well.knob.focus();
	}
}

export function updateColorPickerLabels(state: OuiColorPickerState): void {
	const {anchor, content, host, localizations} = state.component;

	if (anchor.toggle != null) {
		setAria(
			anchor.toggle,
			'label',
			localizations.localize('toggle', {
				element: host,
			}),
		);
	}

	content.hue.label.textContent = localizations.localize('hue', {
		element: host,
	});

	content.well.label.textContent = localizations.localize('wellLabel', {
		element: host,
	});

	updateColorPickerOutputLabels(state);
	updateColorPickerWell(state);

	if (content.opacity != null) {
		content.opacity.label.textContent = localizations.localize('opacity', {
			element: host,
		});
	}
}

function updateColorPickerWell(state: OuiColorPickerState): void {
	const {color, content, host, localizations} = state.component;
	const {lightness, saturation} = color.value.hsl;

	setAria(
		content.well.knob,
		'valuetext',
		localizations.localize('wellValue', {
			arguments: [lightness, saturation],
			element: host,
		}),
	);
}

// #endregion

// #region Variables

let index = 0;

// #endregion
