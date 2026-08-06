import type {OuiListboxType} from './listbox.model';

// #region Variables

const keysActivation = new Set([' ', 'Backspace', 'Delete', 'Enter']);

const keysNavigation = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

const keysSelection = new Set(['ArrowRight', 'End']);

export const LISTBOX_KEYS = {
	activation: keysActivation,
	navigation: keysNavigation,
	selection: keysSelection,
};

export const LISTBOX_TYPES = new Set<OuiListboxType>(['autocomplete', 'select']);

export const listboxScrollOptions: ScrollIntoViewOptions = {
	behavior: 'auto',
	block: 'nearest',
	inline: 'nearest',
};

// #endregion
