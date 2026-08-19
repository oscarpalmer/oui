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
import {round} from '@oscarpalmer/atoms/math';
import {getAttribute, setAria, setProperty} from '@oscarpalmer/toretto';
import {
	getLocalization,
	getLocalizations,
	localize,
	OuiLocalizations,
	updateLocalizations,
} from '../l10n';
import {COLOR_PICKER_OUTPUTS} from './constants.color-picker';
import {updateColorPickerForm, updateColorPickerValidity} from './form.color-picker';
import type {OuiColorPickerElement} from './index';
import type {
	OuiColorPickerLocalizations,
	OuiColorPickerOutput,
	OuiColorPickerState,
	OuiColorPickerValueType,
} from './models.color-picker';
import {colorPickers} from './state.color-picker';

// #region Functions

export function getColorPickerId(): string {
	index += 1;

	return `oui_color_picker_${index}`;
}

export function getColorPickerOutput(element: OuiColorPickerElement): OuiColorPickerOutput {
	const attribute = getAttribute(element, 'output');

	return COLOR_PICKER_OUTPUTS.has(attribute as OuiColorPickerOutput)
		? (attribute as OuiColorPickerOutput)
		: 'none';
}

export function getColorPickerValueType(
	state: OuiColorPickerState,
	value: unknown,
): OuiColorPickerValueType | undefined {
	switch (true) {
		case isHexColor(value, state.alpha):
			return state.alpha ? 'hexa' : 'hex';

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
 * Set localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setColorPickerLocalizations(
	localizations: Record<string, Partial<OuiColorPickerLocalizations>>,
): void;

export function setColorPickerLocalizations(
	first: string | Record<string, Partial<OuiColorPickerLocalizations>>,
	second?: Partial<OuiColorPickerLocalizations>,
): void {
	updateColorPickerLocalizations(
		colorPickerLocalizations,
		colorPickerLocalizations.values,
		first,
		second,
	);
}

export function setColorPickerDisabled(
	state: OuiColorPickerState,
	type: 'disabled' | 'readonly',
	value: boolean,
): void {
	state[type] = value;

	setAria(state.host, type, value);

	state.anchor.input.readOnly = value;

	setAria(state.anchor.input, type, value);
	setProperty(state.content.hue.input, 'disabled', state.disabled || state.readonly);

	if (state.anchor.button != null) {
		setAria(state.anchor.button, 'disabled', state.disabled);
	}

	if (state.content.opacity != null) {
		setProperty(state.content.opacity.input, 'disabled', state.disabled || state.readonly);
	}
}

export function setColorPickerRequired(state: OuiColorPickerState, value: boolean): void {
	state.required = value;

	setAria(state.host, 'required', value);
	setAria(state.anchor.input, 'required', value);

	updateColorPickerValidity(state, isHexColor(state.value.current, state.alpha));
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

	state.color.value[actual] = value as never;

	setColorPickerValues(state, true);
}

export function setColorPickerValues(
	state: OuiColorPickerState,
	focus: boolean,
	input?: string,
): void {
	const {anchor, color, content, host, style} = state;

	color.foreground = getForegroundColor(color.value).hex;

	const {alpha, hex, hsl, rgb} = color.value;
	const {hue, lightness, saturation} = hsl;
	const {blue, green, red} = rgb;

	const value = input ?? color.value.toHexString(state.alpha);

	anchor.input.value = value;
	content.hue.input.valueAsNumber = hue;

	if (content.opacity != null) {
		content.opacity.input.valueAsNumber = alpha;
	}

	state.value.current = value;

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

	updateColorPickerForm(state, isHexColor(state.value.current, state.alpha));
	updateColorPickerWell(state);

	if (focus) {
		content.well.knob.focus();
	}
}

export function updateColorPickerLabels(state: OuiColorPickerState): void {
	const {anchor, content, host, localizations} = state;
	const {component, global} = localizations;

	if (anchor.button != null) {
		setAria(
			anchor.button,
			'label',
			localize(getLocalization(global, host, 'toggle', component), {}, []),
		);
	}

	content.hue.label.textContent = localize(getLocalization(global, host, 'hue', component), {}, []);

	content.well.label.textContent = localize(
		getLocalization(global, host, 'lightnessSaturationLabel', component),
		{},
		[],
	);

	updateColorPickerWell(state);

	if (content.opacity != null) {
		content.opacity.label.textContent = localize(
			getLocalization(global, host, 'opacity', component),
			{},
			[],
		);
	}
}

export function updateColorPickerLocalizations(
	instance: OuiLocalizations<OuiColorPickerLocalizations>,
	destination: Record<string, Partial<OuiColorPickerLocalizations>>,
	first: string | Record<string, Partial<OuiColorPickerLocalizations>>,
	second?: Partial<OuiColorPickerLocalizations>,
): void {
	updateLocalizations(
		instance,
		typeof first === 'string'
			? {
					[first]: second!,
				}
			: first,
		destination,
		() => {
			for (const state of colorPickers.set) {
				updateColorPickerLabels(state);
			}
		},
	);
}

export function updateColorPickerWell(state: OuiColorPickerState): void {
	const {color, content, host, localizations} = state;
	const {component, global} = localizations;
	const {lightness, saturation} = color.value.hsl;

	setAria(
		content.well.knob,
		'valuetext',
		localize(
			getLocalization(global, host, 'lightnessSaturationValue', component),
			{
				lightness,
				saturation,
			},
			[lightness, saturation],
		),
	);
}

// #endregion

// #region Variables

export const colorPickerLocalizations = getLocalizations<OuiColorPickerLocalizations>({
	hue: 'Hue',
	invalid: 'Please enter or select a color',
	lightnessSaturationLabel: 'Lightness and saturation',
	lightnessSaturationValue: (lightness: number, saturation: number) =>
		`Lightness: ${round(lightness, 1)}%, saturation: ${round(saturation, 1)}%`,
	opacity: 'Opacity',
	toggle: 'Toggle color picker',
});

let index = 0;

// #endregion
