import type {OuiComboboxAutoCompleteType, OuiComboboxType} from './models.combobox';

// #region Variables

export const COMBOBOX_TAGNAME = 'oui-combobox';

export const COMBOBOX_ATTRIBUTE_ANCHOR = `${COMBOBOX_TAGNAME}-anchor`;

export const COMBOBOX_ATTRIBUTE_CONTENT = `${COMBOBOX_TAGNAME}-content`;

export const COMBOBOX_ATTRIBUTE_FILTER = `${COMBOBOX_TAGNAME}-filter`;

export const COMBOBOX_ATTRIBUTE_FILTER_INPUT = `${COMBOBOX_ATTRIBUTE_FILTER}-input`;

export const COMBOBOX_ATTRIBUTE_HEADER = `${COMBOBOX_TAGNAME}-header`;

export const COMBOBOX_ATTRIBUTE_HIDDEN = `${COMBOBOX_TAGNAME}-hidden`;

export const COMBOBOX_ATTRIBUTE_LIST = `${COMBOBOX_TAGNAME}-list`;

export const COMBOBOX_ATTRIBUTE_MESSAGE = `${COMBOBOX_TAGNAME}-message`;

export const COMBOBOX_ATTRIBUTE_OPTION = `${COMBOBOX_TAGNAME}-option`;

export const COMBOBOX_ATTRIBUTE_OPTION_ACTIVE = `${COMBOBOX_TAGNAME}-option-active`;

export const COMBOBOX_ATTRIBUTE_SELECTION = `${COMBOBOX_TAGNAME}-selection`;

export const COMBOBOX_ATTRIBUTE_SELECTION_ITEM = `${COMBOBOX_TAGNAME}-selection-item`;

export const COMBOBOX_AUTOCOMPLETES = new Set<OuiComboboxAutoCompleteType>([
	'both',
	'inline',
	'list',
	'none',
]);

export const COMBOBOX_KEYS_ACTIVATION = new Set([' ', 'Backspace', 'Delete', 'Enter']);

export const COMBOBOX_KEYS_NAVIGATION = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

export const COMBOBOX_KEYS_SELECTION = new Set(['ArrowRight', 'End']);

export const COMBOBOX_MESSAGE_LABEL = `<${COMBOBOX_TAGNAME}> must contain a <label> element for the <select> element`;

export const COMBOBOX_MESSAGE_SELECT = `<${COMBOBOX_TAGNAME}> must contain a valid <select> element`;

export const COMBOBOX_SELECTOR_ANCHOR = `[${COMBOBOX_ATTRIBUTE_ANCHOR}]`;

export const COMBOBOX_SELECTOR_SELECTION_ITEM = `[${COMBOBOX_ATTRIBUTE_SELECTION_ITEM}]`;

export const COMBOBOX_SELECTOR_OPTION = `[${COMBOBOX_ATTRIBUTE_OPTION}]`;

export const COMBOBOX_TYPES = new Set<OuiComboboxType>(['autocomplete', 'select']);

export const comboboxScrollOptions: ScrollIntoViewOptions = {
	behavior: 'auto',
	block: 'nearest',
	inline: 'nearest',
};

// #endregion
