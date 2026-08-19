import type {OuiColorPickerOutput} from './models.color-picker';

// #region Variables

export const COLOR_PICKER_TAGNAME = 'oui-color-picker';

export const COLOR_PICKER_ATTRIBUTE_INPUT = `${COLOR_PICKER_TAGNAME}-input`;

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

export const COLOR_PICKER_OUTPUTS = new Set<OuiColorPickerOutput>(['all', 'none', 'hsl', 'rgb']);

export const COLOR_PICKER_SELECTOR_INPUT = `[${COLOR_PICKER_ATTRIBUTE_INPUT}]`;

export const COLOR_PICKER_SELECTOR_WELL = `[${COLOR_PICKER_ATTRIBUTE_WELL}]`;

export const COLOR_PICKER_SELECTOR_WELL_KNOB = `[${COLOR_PICKER_ATTRIBUTE_WELL_KNOB}]`;

// #endregion
