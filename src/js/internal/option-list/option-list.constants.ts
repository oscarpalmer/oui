import type {OptionListType} from './option-list.model';

// #region Variables

export const OPTION_LIST_KEYS_ACTIVATION: Set<string> = new Set([
	' ',
	'Backspace',
	'Delete',
	'Enter',
]);

export const LISTBOX_KEYS_NAVIGATION: Set<string> = new Set([
	'ArrowDown',
	'ArrowUp',
	'PageDown',
	'PageUp',
]);

export const OPTION_LIST_KEYS_SELECTION: Set<string> = new Set(['ArrowRight', 'End']);

export const OPTION_LIST_TYPES: Set<OptionListType> = new Set(['autocomplete', 'select']);

export const optionListScrollOptions: ScrollIntoViewOptions = {
	behavior: 'auto',
	block: 'nearest',
	inline: 'nearest',
};

// #endregion
