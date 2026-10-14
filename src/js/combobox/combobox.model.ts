import type {OuiFloatable} from '../floatable/floatable.model';
import type {OuiListboxState, OuiListboxType} from '../internal/listbox/listbox.model';

// #region Types

export type OuiComboboxAnchor = {
	container?: HTMLElement;
	element: HTMLElement;
};

export type OuiComboboxFilter = {
	element: HTMLInputElement;
	value: string;
};

export type OuiComboboxGroup = {
	element: HTMLElement;
	header: HTMLElement;
	options: HTMLElement[];
};

export type OuiComboboxLabel = {
	element: HTMLLabelElement;
	id: string;
};

export type OuiComboboxOptions = {
	all: HTMLElement[];
	selected: HTMLElement[];
};

export type OuiComboboxSelection = {
	container: HTMLElement;
	items: OuiComboboxSelectionItem[];
};

export type OuiComboboxSelectionItem = {
	button: HTMLButtonElement;
	element: HTMLElement;
};

export type OuiComboboxState = OuiListboxState<{
	anchor: OuiComboboxAnchor;
	floatable: OuiFloatable;
	selection?: OuiComboboxSelection;
	type: OuiListboxType;
}>;

export type OuiComboboxValues = {
	current: string[];
	initial: string[];
};

// #endregion
