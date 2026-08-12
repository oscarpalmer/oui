import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import type {OuiLocalizations, OuiLocalizationsValues} from '../../l10n';

// #region Types

export type OuiListboxAttributes = {
	active: string;
	content: string;
	empty: string;
	filter: string;
	group: string;
	header: string;
	hidden: string;
	input: string;
	list: string;
	message: string;
	option: string;
};

export type OuiListboxAutoComplete = Record<OuiListboxAutoCompleteType, boolean> & {
	value?: OuiListboxAutoCompleteType;
};

export type OuiListboxAutoCompleteType = 'both' | 'inline' | 'list' | 'none';

export type OuiListboxCallbacks<State extends OuiListboxState = OuiListboxState> = {
	data: OuiListboxCallbacksData<State>;
	keydown: OuiListboxCallbacksKeydown<State>;
};

type OuiListboxCallbacksData<State extends OuiListboxState = OuiListboxState> = {
	onApply: OuiListboxCallbacksDataOnApply<State>;
	onFilter: OuiListboxCallbacksDataOnFilter<State>;
	onForm: (state: State) => void;
	onPreview: OuiListboxCallbacksDataOnPreview<State>;
	onToggle: (state: State) => void;
};

type OuiListboxCallbacksDataOnApply<State extends OuiListboxState = OuiListboxState> = (
	state: State,
	option: HTMLElement | undefined,
	values: string[],
	added: boolean,
	selected?: HTMLElement[],
	emit?: boolean,
) => void;

type OuiListboxCallbacksDataOnFilter<State extends OuiListboxState = OuiListboxState> = (
	preview: OuiListboxPreview,
	state: State,
	update: boolean,
	active?: HTMLElement,
	emit?: boolean,
) => void;

type OuiListboxCallbacksDataOnPreview<State extends OuiListboxState = OuiListboxState> = (
	preview: OuiListboxPreview,
	state: State,
	active?: HTMLElement,
) => void;

type OuiListboxCallbacksKeydown<State extends OuiListboxState = OuiListboxState> = {
	onActivation?: (state: State) => void;
	onEnter?: (state: State) => void;
	onEscape?: (state: State) => void;
	onNavigation: OuiListboxCallbacksDataOnNavigation<State>;
	onSelection?: (state: State) => void;
	onTab?: (state: State) => void;
	onToggle?: (state: State) => void;
	preventActivation?: (state: State) => boolean;
	skipNavigation?: (state: State) => boolean;
};

type OuiListboxCallbacksDataOnNavigation<State extends OuiListboxState = OuiListboxState> = (
	preview: OuiListboxPreview,
	state: State,
	active?: HTMLElement,
) => void;

type OuiListboxFilter = {
	element: HTMLInputElement;
	value: string;
};

type OuiListboxFooter = {
	container: HTMLElement;
	message: HTMLElement;
};

export type OuiListboxGroup = {
	element: HTMLElement;
	header: HTMLElement;
	options: HTMLElement[];
};

type OuiListboxLabel = {
	element: HTMLLabelElement;
	id: string;
};

type OuiListboxLocalization<Localizations extends OuiLocalizationsValues> = {
	component: Record<string, Partial<Localizations>>;
	global: OuiLocalizations<Localizations>;
};

export type OuiListboxLocalizations = {
	empty: string | (() => string);
	input: string | (() => string);
	invalid: string | (() => string);
	max: string | ((max: number) => string);
	min: string | ((min: number) => string);
	remove: string | ((label: string, value: string) => string);
	results: string | ((amount: number) => string);
	selected: string | ((amount: number) => string);
};

export type OuiListboxOptions = {
	all: HTMLElement[];
	selected: HTMLElement[];
};

export type OuiListboxPreview = 'none' | 'set' | 'typed';

export type OuiListboxState = {
	active?: HTMLElement;
	attributes: OuiListboxAttributes;
	autocomplete: OuiListboxAutoComplete;
	callbacks: OuiListboxCallbacks;
	content: HTMLDivElement;
	disabled: boolean;
	elements: Array<HTMLElement | undefined>;
	filter: OuiListboxFilter;
	footer?: OuiListboxFooter;
	groups?: OuiListboxGroup[];
	host: HTMLElement;
	id: string;
	internals: ElementInternals;
	label: OuiListboxLabel;
	list: HTMLUListElement;
	listbox: boolean;
	listeners: RemovableEventListener[];
	localizations: OuiListboxLocalization<OuiListboxLocalizations>;
	max?: number;
	min?: number;
	message: HTMLElement;
	multiple: boolean;
	name: string;
	options: OuiListboxOptions;
	readonly: boolean;
	required: boolean;
	select: HTMLSelectElement;
	type: OuiListboxType;
	values: OuiListboxValues;
};

export type OuiListboxStates<State extends OuiListboxState = OuiListboxState> = {
	map: WeakMap<HTMLElement, State>;
	set: Set<State>;
};

export type OuiListboxType = 'autocomplete' | 'select';

type OuiListboxValues = {
	current: string[];
	initial: string[];
	label: HTMLElement;
};

// #endregion
