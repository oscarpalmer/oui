import type {PlainObject} from '@oscarpalmer/atoms/models';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import type {OuiLocalizations, OuiLocalizationsValues} from '../l10n/l10n.model';

// #region Types

export type CreateOptionListContent = {
	element: HTMLDivElement;
	filter?: CreateOptionListFilter;
	list: CreateOptionListList;
	message: HTMLDivElement;
	value: HTMLSpanElement;
};

export type CreateOptionListContentParameters = {
	attributes: OptionListAttributes;
	autocomplete: OptionListAutoComplete;
	element: Element;
	id: string;
	label: HTMLLabelElement;
	listbox: boolean;
	multiple: boolean;
	select: HTMLSelectElement;
	type: OptionListType;
};

export type CreateOptionListFilter = {
	container: Element;
	element: HTMLInputElement;
};

export type CreateOptionListGroupParameters = {
	group: HTMLOptGroupElement;
	groupOptions: HTMLOptionElement[];
	original: CreateOptionListContentParameters;
	selected: Element[];
	type: OptionListType;
};

export type CreateOptionListList = {
	element: HTMLUListElement;
	groups?: OptionListGroup[];
	options: OptionListOptions;
};

export type CreateOptionListOptionParameters = {
	group?: string;
	index: number;
	option: HTMLOptionElement;
	original: CreateOptionListContentParameters;
	type: OptionListType;
};

export type CreateOptionListOptionsParameters = {
	group?: string;
	list: Element;
	options: HTMLOptionElement[];
	original: CreateOptionListContentParameters;
	selected: Element[];
	type: OptionListType;
};

export type OptionListAttributes = {
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

export type OptionListAutoComplete = Record<OptionListAutoCompleteType, boolean> & {
	value?: OptionListAutoCompleteType;
};

export type OptionListAutoCompleteType = 'both' | 'inline' | 'list' | 'none';

export type OptionListCallbacks<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = {
	data: OptionListCallbacksData<State, Localizations>;
	keydown: OptionListCallbacksKeydown<State, Localizations>;
};

type OptionListCallbacksData<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = {
	onApply: OptionListCallbacksDataOnApply<State, Localizations>;
	onFilter: OptionListCallbacksDataOnFilter<State, Localizations>;
	onForm: (state: OptionListState<State, Localizations>) => void;
	onPreview: OptionListCallbacksDataOnPreview<State, Localizations>;
	onToggle: (state: OptionListState<State, Localizations>) => void;
};

type OptionListCallbacksDataOnApply<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = (
	state: OptionListState<State, Localizations>,
	option: Element | undefined,
	values: string[],
	added: boolean,
	selected?: Element[],
	emit?: boolean,
) => void;

type OptionListCallbacksDataOnFilter<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = (
	preview: OptionListPreview,
	state: OptionListState<State, Localizations>,
	update: boolean,
	active?: Element,
	emit?: boolean,
) => void;

type OptionListCallbacksDataOnPreview<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = (
	preview: OptionListPreview,
	state: OptionListState<State, Localizations>,
	active?: Element,
) => void;

type OptionListCallbacksKeydown<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = {
	onActivation?: (state: OptionListState<State, Localizations>) => void;
	onEnter?: (state: OptionListState<State, Localizations>) => void;
	onEscape?: (state: OptionListState<State, Localizations>) => void;
	onNavigation: OptionListCallbacksDataOnNavigation<State, Localizations>;
	onSelection?: (state: OptionListState<State, Localizations>) => void;
	onTab?: (state: OptionListState<State, Localizations>) => void;
	onToggle?: (state: OptionListState<State, Localizations>) => void;
	preventActivation?: (state: OptionListState<State, Localizations>) => boolean;
	skipNavigation?: (state: OptionListState<State, Localizations>) => boolean;
};

type OptionListCallbacksDataOnNavigation<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = (
	preview: OptionListPreview,
	state: OptionListState<State, Localizations>,
	active?: HTMLElement,
) => void;

type OptionListFilter = {
	element: HTMLInputElement;
	value: string;
};

export type OptionListGroup = {
	element: HTMLElement;
	header: HTMLElement;
	options: HTMLElement[];
};

type OptionListLabel = {
	element: HTMLLabelElement;
	id: string;
};

export type OptionListLocalizationValues = {
	empty: string | (() => string);
	input: string | (() => string);
	invalid: string | (() => string);
	max: string | ((max: number) => string);
	min: string | ((min: number) => string);
	remove: string | ((label: string, value: string) => string);
	results: string | ((amount: number) => string);
	selected: string | ((amount: number) => string);
};

export type OptionListOptions = {
	all: HTMLElement[];
	selected: HTMLElement[];
};

export type OptionListPreview = 'none' | 'set' | 'typed';

export type OptionListState<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = {
	component: OptionListStateComponent<State, Localizations>;
	form: OptionListStateForm;
};

type OptionListStateComponent<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = {
	active?: HTMLElement;
	attributes: OptionListAttributes;
	autocomplete: OptionListAutoComplete;
	callbacks: OptionListCallbacks<State, Localizations>;
	content: HTMLDivElement;
	disabled: boolean;
	elements: Array<Element | undefined>;
	filter: OptionListFilter;
	groups?: OptionListGroup[];
	host: Element;
	id: string;
	label: OptionListLabel;
	list: HTMLUListElement;
	listbox: boolean;
	listeners: RemovableEventListener[];
	localizations: OuiLocalizations<OptionListLocalizationValues & Localizations>;
	max?: number;
	min?: number;
	message: HTMLElement;
	multiple: boolean;
	name: string;
	options: OptionListOptions;
	readonly: boolean;
	required: boolean;
	select: HTMLSelectElement;
	type: OptionListType;
	values: OptionListValues;
} & State;

type OptionListStateForm = {
	internals: ElementInternals;
	restored?: unknown[];
};

export type OptionListType = 'autocomplete' | 'select';

type OptionListValues = {
	current: string[];
	initial: string[];
	label: Element;
};

// #endregion
