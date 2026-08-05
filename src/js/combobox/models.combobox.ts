import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import type {OuiFloatable} from '../floatable/floatable.embedded';
import type {OuiComboboxElement} from './index';

export type OuiComboboxAnchor = {
	container?: HTMLElement;
	element: HTMLElement;
};

export type OuiComboboxAutoComplete = Record<OuiComboboxAutoCompleteType, boolean> & {
	value: OuiComboboxAutoCompleteType;
};

export type OuiComboboxAutoCompleteType = 'both' | 'inline' | 'list' | 'none';

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

export type OuiComboboxLocalizations = {
	empty: string | (() => string);
	input: string | (() => string);
	invalid: string | (() => string);
	max: string | ((max: number) => string);
	min: string | ((min: number) => string);
	remove: string | ((label: string, value: string) => string);
	results: string | ((amount: number) => string);
	selected: string | ((amount: number) => string);
};

export type OuiComboboxOptions = {
	all: HTMLElement[];
	selected: HTMLElement[];
};

export type OuiComboboxPreview = 'none' | 'set' | 'typed';

export type OuiComboboxSelection = {
	container: HTMLElement;
	items: OuiComboboxSelectionItem[];
};

export type OuiComboboxSelectionItem = {
	button: HTMLButtonElement;
	element: HTMLElement;
};

export type OuiComboboxState = {
	active?: HTMLElement;
	anchor: OuiComboboxAnchor;
	autocomplete: OuiComboboxAutoComplete;
	content: HTMLElement;
	disabled: boolean;
	filter: OuiComboboxFilter;
	floatable: OuiFloatable;
	groups?: OuiComboboxGroup[];
	host: OuiComboboxElement;
	id: string;
	internals: ElementInternals;
	label: OuiComboboxLabel;
	listeners: RemovableEventListener[];
	localizations: Record<string, Partial<OuiComboboxLocalizations>>;
	max?: number;
	min?: number;
	message: HTMLElement;
	name: string;
	multiple: boolean;
	options: OuiComboboxOptions;
	readonly: boolean;
	required: boolean;
	select: HTMLSelectElement;
	selection?: OuiComboboxSelection;
	type: OuiComboboxType;
	values: OuiComboboxValues;
};

export type OuiComboboxType = 'autocomplete' | 'select';

export type OuiComboboxValues = {
	current: string[];
	initial: string[];
};
