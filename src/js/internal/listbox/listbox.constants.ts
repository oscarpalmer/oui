import type {OuiListboxType} from './listbox.model';

// #region Variables

export const LISTBOX_KEYS_ACTIVATION: Set<string> = new Set([' ', 'Backspace', 'Delete', 'Enter']);

export const LISTBOX_KEYS_NAVIGATION: Set<string> = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

export const LISTBOX_KEYS_SELECTION: Set<string> = new Set(['ArrowRight', 'End']);

export const LISTBOX_TYPES: Set<OuiListboxType> = new Set(['autocomplete', 'select']);

export const listboxScrollOptions: ScrollIntoViewOptions = {
	behavior: 'auto',
	block: 'nearest',
	inline: 'nearest',
};

// #endregion
