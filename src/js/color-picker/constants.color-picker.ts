import {round} from '@oscarpalmer/atoms/math';
import {getLocalizations} from '../l10n';
import type {OuiColorPickerLocalizations, OuiColorPickerOutputType} from './models.color-picker';

// #region Variables

export const COLOR_PICKER_TAGNAME = 'oui-color-picker';

export const COLOR_PICKER_ATTRIBUTE_COPY = `${COLOR_PICKER_TAGNAME}-copy`;

export const COLOR_PICKER_ATTRIBUTE_COPY_ERROR = `${COLOR_PICKER_ATTRIBUTE_COPY}-error`;

export const COLOR_PICKER_ATTRIBUTE_COPY_SUCCESS = `${COLOR_PICKER_ATTRIBUTE_COPY}-success`;

export const COLOR_PICKER_ATTRIBUTE_INPUT = `${COLOR_PICKER_TAGNAME}-input`;

export const COLOR_PICKER_ATTRIBUTE_OUTPUT_INPUT = `${COLOR_PICKER_TAGNAME}-output-input`;

export const COLOR_PICKER_ATTRIBUTE_WELL = `${COLOR_PICKER_TAGNAME}-well`;

export const COLOR_PICKER_ATTRIBUTE_WELL_KNOB = `${COLOR_PICKER_TAGNAME}-well-knob`;

export const COLOR_PICKER_EXPRESSION_HEX_PREFIX = /^#/;

export const COLOR_PICKER_INPUT_TYPES = new Set(['color', 'text']);

export const COLOR_PICKER_KEYS = new Set([
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowUp',
	'End',
	'Home',
	'PageDown',
	'PageUp',
]);

export const COLOR_PICKER_MESSAGE_INPUT = `<${COLOR_PICKER_TAGNAME}> must contain a valid <input> element`;

export const COLOR_PICKER_MESSAGE_LABEL = `<${COLOR_PICKER_TAGNAME}> must contain a <label> element for the <input> element`;

export const COLOR_PICKER_OUTPUTS = new Set<OuiColorPickerOutputType>([
	'all',
	'none',
	'hsl',
	'rgb',
]);

export const COLOR_PICKER_SELECTOR_COPY = `[${COLOR_PICKER_ATTRIBUTE_COPY}]`;

export const COLOR_PICKER_SELECTOR_INPUT = `[${COLOR_PICKER_ATTRIBUTE_INPUT}]`;

export const COLOR_PICKER_SELECTOR_OUTPUT_INPUT = `[${COLOR_PICKER_ATTRIBUTE_OUTPUT_INPUT}]`;

export const COLOR_PICKER_SELECTOR_WELL = `[${COLOR_PICKER_ATTRIBUTE_WELL}]`;

export const COLOR_PICKER_SELECTOR_WELL_KNOB = `[${COLOR_PICKER_ATTRIBUTE_WELL_KNOB}]`;

export const colorPickerLocalizations = getLocalizations<OuiColorPickerLocalizations>({
	blackness: 'Blackness',
	blue: 'Blue',
	copy: 'Copy',
	green: 'Green',
	hex: 'Hex',
	hsl: 'HSL',
	hue: 'Hue',
	hwb: 'HWB',
	invalid: 'Please enter or select a color',
	lightness: 'Lightness',
	wellLabel: 'Lightness and saturation',
	wellValue: (lightness: number, saturation: number) =>
		`Lightness: ${round(lightness, 1)}%; saturation: ${round(saturation, 1)}%`,
	opacity: 'Opacity',
	output: 'Output format',
	red: 'Red',
	rgb: 'RGB',
	saturation: 'Saturation',
	toggle: 'Toggle color picker',
	whiteness: 'Whiteness',
});

// #endregion
