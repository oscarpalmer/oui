import {round} from '@oscarpalmer/atoms/math';
import {createDefaultLocalizations} from '../internal/l10n/index';
import type {OuiDefaultLocalizations} from '../internal/l10n/l10n.model';
import type {OuiColorPickerLocalizations, OuiColorPickerOutputType} from './color-picker.model';

// #region Variables

export const COLOR_PICKER_TAGNAME = 'oui-color-picker';

export const COLOR_PICKER_ATTRIBUTE_COPY: string = `${COLOR_PICKER_TAGNAME}-copy`;

export const COLOR_PICKER_ATTRIBUTE_COPY_ERROR: string = `${COLOR_PICKER_ATTRIBUTE_COPY}-error`;

export const COLOR_PICKER_ATTRIBUTE_COPY_SUCCESS: string = `${COLOR_PICKER_ATTRIBUTE_COPY}-success`;

export const COLOR_PICKER_ATTRIBUTE_INPUT: string = `${COLOR_PICKER_TAGNAME}-input`;

export const COLOR_PICKER_ATTRIBUTE_OPACITY: string = `${COLOR_PICKER_TAGNAME}-opacity`;

export const COLOR_PICKER_ATTRIBUTE_OUTPUT_INPUT: string = `${COLOR_PICKER_TAGNAME}-output-input`;

export const COLOR_PICKER_ATTRIBUTE_WELL: string = `${COLOR_PICKER_TAGNAME}-well`;

export const COLOR_PICKER_ATTRIBUTE_WELL_KNOB: string = `${COLOR_PICKER_TAGNAME}-well-knob`;

export const COLOR_PICKER_EXPRESSION_HEX_PREFIX: RegExp = /^#/;

export const COLOR_PICKER_INPUT_TYPES: Set<string> = new Set(['color', 'text']);

export const COLOR_PICKER_KEYS: Set<string> = new Set([
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowUp',
	'End',
	'Home',
	'PageDown',
	'PageUp',
]);

export const COLOR_PICKER_MESSAGE_INPUT: string = `<${COLOR_PICKER_TAGNAME}> must contain a valid <input> element`;

export const COLOR_PICKER_MESSAGE_LABEL: string = `<${COLOR_PICKER_TAGNAME}> must contain a <label> element for the <input> element`;

export const COLOR_PICKER_OUTPUTS: Set<OuiColorPickerOutputType> = new Set([
	'all',
	'none',
	'hsl',
	'hwb',
	'rgb',
]);

export const COLOR_PICKER_SELECTOR_COPY: string = `[${COLOR_PICKER_ATTRIBUTE_COPY}]`;

export const COLOR_PICKER_SELECTOR_INPUT: string = `[${COLOR_PICKER_ATTRIBUTE_INPUT}]`;

export const COLOR_PICKER_SELECTOR_OUTPUT_INPUT: string = `[${COLOR_PICKER_ATTRIBUTE_OUTPUT_INPUT}]`;

export const COLOR_PICKER_SELECTOR_WELL: string = `[${COLOR_PICKER_ATTRIBUTE_WELL}]`;

export const COLOR_PICKER_SELECTOR_WELL_KNOB: string = `[${COLOR_PICKER_ATTRIBUTE_WELL_KNOB}]`;

export const COLOR_PICKER_SYMBOL: unique symbol = Symbol(COLOR_PICKER_TAGNAME);

export const colorPickerLocalizations: OuiDefaultLocalizations<OuiColorPickerLocalizations> =
	createDefaultLocalizations<OuiColorPickerLocalizations>({
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
