import type {OuiFloatable} from '../floatable/floatable.model';
import type {
	OptionListLocalizationValues,
	OptionListState,
	OptionListType,
} from '../internal/option-list/option-list.model';

// #region Types

export type OuiComboboxAnchor = {
	container?: Element;
	element: HTMLElement;
};

export type OuiComboboxFilter = {
	element: HTMLInputElement;
	value: string;
};

export type OuiComboboxGroup = {
	element: Element;
	header: Element;
	options: Element[];
};

export type OuiComboboxLabel = {
	element: HTMLLabelElement;
	id: string;
};

export type OuiComboboxLocalizations = OptionListLocalizationValues;

export type OuiComboboxOptions = {
	all: Element[];
	selected: Element[];
};

export type OuiComboboxSelection = {
	container: Element;
	items: OuiComboboxSelectionItem[];
};

export type OuiComboboxSelectionItem = {
	button: HTMLButtonElement;
	element: Element;
};

export type OuiComboboxState = OptionListState<OuiComboboxStateExtras, OuiComboboxLocalizations>;

export type OuiComboboxStateExtras = {
	anchor: OuiComboboxAnchor;
	floatable: OuiFloatable;
	selection?: OuiComboboxSelection;
	type: OptionListType;
};

export type OuiComboboxValues = {
	current: string[];
	initial: string[];
};

// #endregion
