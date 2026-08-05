import type {GenericCallback} from '@oscarpalmer/atoms/models';
import {clamp} from '@oscarpalmer/atoms/number';
import {getString, parse} from '@oscarpalmer/atoms/string';
import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {getData, setData} from '@oscarpalmer/toretto/data';
import {dispatch, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {AnyAriaBooleanAttribute, RemovableEventListener} from '@oscarpalmer/toretto/models';
import {createEmbeddedFloatable, type OuiFloatable} from './floatable/floatable.embedded';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[TAGNAME]: OuiComboboxElement;
	}
}

type ApplySelectionParameters = {
	added: boolean;
	emit?: boolean;
	option?: HTMLElement;
	selected?: HTMLElement[];
	state: OuiComboboxState;
	values?: string[];
};

type CreateAnchor = {
	container?: HTMLElement;
	element: HTMLElement;
	selection?: OuiComboboxSelection;
};

type CreatAnchorParameters = {
	autocomplete: OuiComboboxAutoComplete;
	id: string;
	label: HTMLLabelElement;
	multiple: boolean;
	select: HTMLSelectElement;
	type: OuiComboboxType;
};

type CreateContent = {
	element: HTMLElement;
	filter?: CreateFilter;
	list: CreateList;
	message: HTMLElement;
};

type CreateContentParameters = {
	autocomplete: OuiComboboxAutoComplete;
	id: string;
	label: HTMLLabelElement;
	multiple: boolean;
	select: HTMLSelectElement;
	type: OuiComboboxType;
};

type CreateFilter = {
	container: HTMLElement;
	element: HTMLInputElement;
};

type CreateFilterParameters = {
	autocomplete: OuiComboboxAutoCompleteType;
	id: string;
	label: HTMLLabelElement;
	type: OuiComboboxType;
};

type CreateGroupParameters = {
	autocomplete: OuiComboboxAutoComplete;
	group: HTMLOptGroupElement;
	groupOptions: HTMLOptionElement[];
	selected: HTMLElement[];
};

type CreateInputParameters = {
	autocomplete: OuiComboboxAutoCompleteType;
	id: string;
	label: HTMLLabelElement;
	type: OuiComboboxType;
	value: string;
};

type CreateList = {
	element: HTMLElement;
	groups?: OuiComboboxGroup[];
	options: HTMLElement[];
	selected: HTMLElement[];
};

type CreateListParameters = {
	autocomplete: OuiComboboxAutoComplete;
	id: string;
	label: HTMLLabelElement;
	multiple: boolean;
	select: HTMLSelectElement;
};

type CreateOptionParameters = {
	autocomplete: OuiComboboxAutoComplete;
	group?: string;
	index: number;
	option: HTMLOptionElement;
};

type CreateOptionsParameters = {
	autocomplete: OuiComboboxAutoComplete;
	group?: string;
	list: HTMLElement;
	options: HTMLOptionElement[];
	selected: HTMLElement[];
};

type CreateSelectionItemsParameters = {
	container: HTMLElement;
	items: OuiComboboxSelectionItem[];
	options: HTMLElement[];
	state?: OuiComboboxState;
};

type OuiComboboxAnchor = {
	container?: HTMLElement;
	element: HTMLElement;
};

type OuiComboboxAutoComplete = Record<OuiComboboxAutoCompleteType, boolean> & {
	value: OuiComboboxAutoCompleteType;
};

type OuiComboboxAutoCompleteType = 'both' | 'inline' | 'list' | 'none';

export class OuiComboboxElement extends HTMLElement {
	static formAssociated = true;

	static observedAttributes = ['max', 'min', 'required', 'value'];

	readonly #internals: ElementInternals;

	#restored?: string[];

	#state!: OuiComboboxState;

	/**
	 * Is the combobox disabled?
	 */
	get disabled(): boolean {
		return this.#state?.disabled ?? false;
	}

	/**
	 * Should the combobox be disabled?
	 */
	set disabled(value: boolean) {
		if (typeof value === 'boolean' && value !== this.disabled) {
			setDisabled(this.#state, value);
		}
	}

	/**
	 * Current filter value
	 */
	get filter(): string {
		return this.#state.filter.element.value;
	}

	/**
	 * Set the filter value
	 */
	set filter(value: string) {
		setFilter(this.#state, value);
	}

	/**
	 * Maximum number of selected options
	 */
	get max(): number | undefined {
		return this.#state?.max;
	}

	/**
	 * Set the maximum number of selected options
	 */
	set max(value: number) {
		setLimit('max', this.#state, value);
	}

	/**
	 * Minimum number of selected options
	 */
	get min(): number | undefined {
		return this.#state?.min;
	}

	/**
	 * Set the minimum number of selected options
	 */
	set min(value: number) {
		setLimit('min', this.#state, value);
	}

	/**
	 * Does the combobox allow multiple values?
	 */
	get multiple(): boolean {
		return this.hasAttribute('multiple');
	}

	/**
	 * Name of the combobox
	 */
	get name(): string {
		return getAttribute(this, 'name') ?? '';
	}

	/**
	 * Is the combobox readonly?
	 */
	get readonly(): boolean {
		return this.#state?.readonly ?? false;
	}

	/**
	 * Should the combobox be readonly?
	 */
	set readonly(value: boolean) {
		if (typeof value === 'boolean' && value !== this.readonly) {
			setReadonly(this.#state, value);
		}
	}

	/**
	 * Is the combobox required?
	 */
	get required(): boolean {
		return this.#state?.required ?? false;
	}

	/**
	 * Should the combobox be required?
	 */
	set required(value: boolean) {
		if (typeof value === 'boolean' && value !== this.required) {
			setRequired(this.#state, value);
		}
	}

	/**
	 * Selected options
	 */
	get selected(): HTMLElement[] {
		return this.#state.options.selected.slice();
	}

	/**
	 * Type of combobox
	 */
	get type(): OuiComboboxType {
		return this.#state.type;
	}

	/**
	 * Current value
	 */
	get value(): string {
		return this.#state.values.current[0];
	}

	/**
	 * Set the value
	 */
	set value(value: unknown) {
		setValue(this.#state, value);
	}

	/**
	 * Current values
	 */
	get values(): string[] {
		return this.#state.values.current.slice();
	}

	/**
	 * Set the values
	 */
	set values(value: unknown[]) {
		setValues(this.#state, value);
	}

	constructor() {
		super();

		this.#internals = this.attachInternals();
	}

	attributeChangedCallback(name: string, _: string | null, value: string | null): void {
		if (this.#state == null) {
			return;
		}

		switch (name) {
			case 'required':
				this[name] = this.hasAttribute(name);
				break;

			case 'max':
			case 'min':
				setLimit(name, this.#state, value);
				break;

			case 'value':
				this.value = value ?? '';
				break;

			default:
				break;
		}
	}

	/**
	 * Clear all selected options
	 */
	clear(): void {
		setValues(this.#state, []);
	}

	connectedCallback(): void {
		if (this.#state == null) {
			this.#initialize();
		} else {
			attachCombobox(this.#state);
		}
	}

	disconnectedCallback(): void {
		if (this.#state != null) {
			detachCombobox(this.#state);
		}
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		setValues(this.#state, this.#state.values.initial, false);
	}

	formStateRestoreCallback(state: string | File | FormData, reason: unknown): void {
		if (reason !== 'restore') {
			return;
		}

		const parsed = typeof state === 'string' ? parse(state) : undefined;

		if (!Array.isArray(parsed)) {
			return;
		}

		if (this.#state == null) {
			this.#restored = parsed;
		} else {
			setValues(this.#state, parsed);
		}
	}

	/**
	 * Set combobox localizations for a specific language
	 *
	 * @param language Language code
	 * @param localizations Localizations for language
	 */
	setLocalizations(language: string, localizations: Partial<OuiComboboxLocalizations>): void;

	/**
	 * Set combobox localizations for one or more languages
	 *
	 * @param localizations Localizations for one or more languages
	 */
	setLocalizations(localizations: Record<string, Partial<OuiComboboxLocalizations>>): void;

	setLocalizations(
		first: string | Record<string, Partial<OuiComboboxLocalizations>>,
		second?: Partial<OuiComboboxLocalizations>,
	): void {
		updateLocalizations(
			typeof first === 'string'
				? {
						[first]: second!,
					}
				: first,
			this.#state.localizations,
		);
	}

	#initialize(): void {
		this.tabIndex = -1;

		this.#state = createState(this, this.#internals);

		if (this.#restored != null) {
			setValues(this.#state, this.#restored, false);

			this.#restored = undefined;
		}
	}
}

type OuiComboboxFilter = {
	element: HTMLInputElement;
	value: string;
};

type OuiComboboxGroup = {
	element: HTMLElement;
	header: HTMLElement;
	options: HTMLElement[];
};

type OuiComboboxLabel = {
	element: HTMLLabelElement;
	id: string;
};

type OuiComboboxLocalizations = {
	empty: string | (() => string);
	input: string | (() => string);
	invalid: string | (() => string);
	max: string | ((max: number) => string);
	min: string | ((min: number) => string);
	remove: string | ((label: string, value: string) => string);
	results: string | ((amount: number) => string);
	selected: string | ((amount: number) => string);
};

type OuiComboboxOptions = {
	all: HTMLElement[];
	selected: HTMLElement[];
};

type OuiComboboxPreview = 'none' | 'set' | 'typed';

type OuiComboboxSelection = {
	container: HTMLElement;
	items: OuiComboboxSelectionItem[];
};

type OuiComboboxSelectionItem = {
	button: HTMLButtonElement;
	element: HTMLElement;
};

type OuiComboboxState = {
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

type OuiComboboxType = 'autocomplete' | 'select';

type OuiComboboxValues = {
	current: string[];
	initial: string[];
};

// #endregion

// #region Functions

function applySelection(parameters: ApplySelectionParameters): void {
	const {added, emit, option, selected, state} = parameters;

	const {length} = state.options.all;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		setAria(option, 'selected', (selected ?? state.options.selected).includes(option));
	}

	const values =
		parameters.values ??
		(state.autocomplete.none
			? [state.filter.element.value]
			: (selected ?? state.options.selected).map(option => getData(option, 'value', false) ?? ''));

	if (values.length === 0) {
		values.push('');
	}

	if (selected != null) {
		state.options.selected = selected;
	}

	const update =
		values.length === state.values.current.length
			? values.some(value => !state.values.current.includes(value))
			: true;

	if (!update) {
		return;
	}

	updateForm(state, values, emit);
	updatePreview('set', state, option);
	updateSelection(state, option, added, selected);
}

function attachCombobox(state: OuiComboboxState): void {
	const {anchor, content, filter, label, listeners, select} = state;

	label.element.htmlFor = filter.element.id;
	label.element.id = `${state.id}_label`;

	select.hidden = true;

	select.insertAdjacentElement('afterend', anchor.container ?? anchor.element);
	(anchor.container ?? anchor.element).insertAdjacentElement('afterend', content);

	select.remove();

	state.floatable = createEmbeddedFloatable(anchor.container ?? anchor.element, content, {
		position: 'below-start',
		reusable: false,
	});

	state.floatable.update();

	listeners.push(
		on(state.host, 'focusout', () => {
			setTimeout(() => {
				onFocusout(state);
			});
		}),
		on(content, 'click', event => {
			onClickContent(event, content);
		}),
		on(content, 'toggle', () => {
			setAria(anchor.element, 'expanded', state.floatable.open);

			setAria(
				filter.element,
				'activedescendant',
				state.floatable.open ? state.active?.id : undefined,
			);

			if (state.floatable.open) {
				filter.element.focus();
			}
		}),
	);

	states.map.set(state.host, state);
	states.map.set(state.content, state);
	states.set.add(state);
}

function createAnchor(parameters: CreatAnchorParameters): CreateAnchor {
	const {autocomplete, id, label, select, type} = parameters;

	let container: HTMLElement | undefined;
	let element: HTMLElement;
	let selection: OuiComboboxSelection | undefined;

	if (parameters.type === 'autocomplete') {
		element = createInput({
			id,
			label,
			type,
			autocomplete: autocomplete.value,
			value: select.selectedOptions[0]?.textContent ?? '',
		});
	} else {
		({container, element, selection} = createButton(parameters));
	}

	setAttribute(container ?? element, ATTRIBUTE_ANCHOR, '');

	return {container, element, selection};
}

function createButton(parameters: CreatAnchorParameters): CreateAnchor {
	const {id, label, multiple, select} = parameters;

	const element = createElement('button', {
		aria: {
			controls: `${id}_content`,
			expanded: false,
			haspopup: 'listbox',
			labelledby: `${label.id} ${id}`,
		},
		property: {
			id,
			textContent: multiple ? '' : (select.selectedOptions[0]?.textContent ?? ''),
		},
	});

	if (!multiple) {
		return {element};
	}

	const container = createElement('div');
	const selection = createSelection(id, select);

	container.append(selection.container, element);

	return {container, element, selection};
}

function createContent(parameters: CreateContentParameters): CreateContent {
	const {autocomplete, id, label, multiple, select, type} = parameters;

	const element = createElement('div', {
		aria: {
			labelledby: label.id,
		},
		attribute: {
			[ATTRIBUTE_CONTENT]: '',
			popover: '',
		},
		property: {
			id: `${id}_content`,
			tabIndex: -1,
		},
	});

	const filter = createFilter({id, label, type, autocomplete: autocomplete.value});
	const list = createList({autocomplete, id, label, multiple, select});
	const message = createMessage();

	if (filter != null) {
		element.append(filter.container);
	}

	element.append(list.element, message);

	return {element, filter, list, message};
}

function createFilter(parameters: CreateFilterParameters): CreateFilter | undefined {
	const {autocomplete, id, label, type} = parameters;

	if (type === 'autocomplete') {
		return;
	}

	const container = createElement('div', {
		attribute: {
			[ATTRIBUTE_FILTER]: '',
		},
	});

	const element = createInput({autocomplete, id, label, type, value: ''});

	setAttribute(element, ATTRIBUTE_FILTER_INPUT, '');

	container.append(element);

	return {container, element};
}

function createGroup(parameters: CreateGroupParameters): OuiComboboxGroup {
	const {autocomplete, group, groupOptions, selected} = parameters;

	const element = createElement('li', {
		aria: {
			label: group.label,
		},
		property: {
			role: 'group',
		},
	});

	const list = createElement('ul', {
		property: {
			role: 'none',
		},
	});

	const header = createHeader(group);

	element.append(header, list);

	return {
		element,
		header,
		options: createOptions({
			autocomplete,
			list,
			selected,
			group: header.id,
			options: groupOptions,
		}),
	};
}

function createHeader(group: HTMLOptGroupElement): HTMLElement {
	return createElement('div', {
		aria: {
			hidden: true,
		},
		attribute: {
			[ATTRIBUTE_HEADER]: '',
		},
		property: {
			id: group.id,
			textContent: group.label,
		},
	});
}

function createInput(parameters: CreateInputParameters): HTMLInputElement {
	const {autocomplete, id, label, type, value} = parameters;

	return createElement('input', {
		aria: {
			autocomplete: autocomplete,
			controls: `${id}_list`,
			expanded: type === 'select',
			haspopup: 'listbox',
			labelledby: label.id,
		},
		attribute: {
			autocorrect: 'off',
			autocomplete: 'off',
			form: '',
			spellcheck: 'false',
			type: 'text',
		},
		property: {
			id,
			value,
			role: 'combobox',
		},
	});
}

function createList(parameters: CreateListParameters): CreateList {
	const {autocomplete, id, label, multiple, select} = parameters;

	const element = createElement('ul', {
		aria: {
			labelledby: label.id,
			multiselectable: multiple,
		},
		attribute: {
			[ATTRIBUTE_LIST]: '',
			tabindex: -1,
		},
		property: {
			id: `${id}_list`,
			role: 'listbox',
		},
	});

	const children = [...select.children];
	const childrenLength = children.length;

	const options: HTMLElement[] = [];
	const selected: HTMLElement[] = [];

	let groups: OuiComboboxGroup[] | undefined;

	for (let childIndex = 0; childIndex < childrenLength; childIndex += 1) {
		const child = children[childIndex];

		if (child instanceof HTMLOptionElement) {
			const option = createOption({
				autocomplete,
				index: childIndex,
				option: child,
			});

			element.append(option);
			options.push(option);

			if (child.selected) {
				selected.push(option);
			}

			continue;
		}

		if (!(child instanceof HTMLOptGroupElement)) {
			continue;
		}

		const group = createGroup({
			autocomplete,
			selected,
			group: child,
			groupOptions: [...child.children] as HTMLOptionElement[],
		});

		groups ??= [];

		element.append(group.element, ...group.options);
		groups.push(group);
		options.push(...group.options);
	}

	return {element, groups, options, selected};
}

function createMessage(): HTMLElement {
	return createElement('div', {
		aria: {
			live: 'polite',
		},
		attribute: {
			[ATTRIBUTE_MESSAGE]: '',
		},
		property: {
			hidden: true,
			role: 'status',
		},
	});
}

function createOption(parameters: CreateOptionParameters): HTMLElement {
	const {autocomplete, group, option} = parameters;

	const item = createElement('li', {
		aria: {
			selected: !autocomplete.none && option.selected,
		},
		attribute: {
			[ATTRIBUTE_OPTION]: '',
		},
		property: {
			id: option.id,
			role: 'option',
			textContent: option.textContent,
		},
	});

	setData(item, {
		group,
		value: option.value,
	});

	return item;
}

function createOptions(parameters: CreateOptionsParameters): HTMLElement[] {
	const {autocomplete, group, list, options, selected} = parameters;

	const items: HTMLElement[] = [];

	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];

		const item = createOption({autocomplete, group, index, option});

		items.push(item);

		if (option.selected) {
			selected.push(item);
		}

		list.append(item);
	}

	return items;
}

function createSelection(id: string, select: HTMLSelectElement): OuiComboboxSelection {
	const container = createElement('ul', {
		attribute: {
			[ATTRIBUTE_SELECTION]: '',
		},
		property: {
			id: `${id}_selection`,
		},
	});

	const options = [...select.selectedOptions];

	const items: OuiComboboxSelectionItem[] = [];

	createSelectionItems({container, items, options});

	const {button} = items[0] ?? {};

	if (button != null) {
		button.tabIndex = 0;
	}

	return {
		items,
		container: container,
	};
}

function createSelectionItem(
	option: HTMLElement,
	state?: OuiComboboxState,
): OuiComboboxSelectionItem {
	const element = createElement('li');

	const localization = state == null ? option.textContent : getLocalization('remove', state);

	const button = createElement('button', {
		aria: {
			label:
				typeof localization === 'function'
					? localization(option.textContent ?? '', getData(option, 'value', false) ?? '')
					: localization,
		},
		attribute: {
			[ATTRIBUTE_SELECTION_ITEM]: '',
			tabindex: -1,
		},
		data: {
			option: option.id,
		},
	});

	const icon = createElement('span', {
		aria: {
			hidden: true,
		},
		property: {
			innerHTML: '&times;',
		},
	});

	const label = createElement('span', {
		property: {
			textContent: option.textContent,
		},
	});

	button.append(icon, label);
	element.append(button);

	return {
		button,
		element,
	};
}

function createSelectionItems(parameters: CreateSelectionItemsParameters): void {
	const {container, items, options, state} = parameters;

	const {length} = options;

	for (let index = 0; index < length; index += 1) {
		const option = options[index];

		const item = createSelectionItem(option, state);

		container.append(item.element);
		items.push(item);
	}
}

function createState(element: OuiComboboxElement, internals: ElementInternals): OuiComboboxState {
	const select = element.querySelector('select');

	if (select == null || select.id === '') {
		throw new Error(MESSAGE_SELECT);
	}

	const label = element.querySelector(`label[for="${select.id}"]`) as HTMLLabelElement;

	if (label == null) {
		throw new Error(MESSAGE_LABEL);
	}

	element.id = select.id;

	setAttribute(element, 'name', select.name === '' ? select.id : select.name);

	const disabled = getBooleanAria(element, 'disabled') || select.disabled;
	const multiple = element.multiple || select.multiple;
	const readonly = getBooleanAria(element, 'readonly');
	const required = getBooleanAria(element, 'required') || select.required;

	const id = getId();
	const type = multiple ? 'select' : getAttributeValue(element, 'type', TYPES, 'select');

	const autocomplete = getAutoComplete(element, type === 'select');

	const labelId = label.id;

	label.htmlFor = id;
	label.id = `${id}_label`;

	generateIds(id, select);

	const anchor = createAnchor({autocomplete, id, label, multiple, select, type});
	const content = createContent({autocomplete, id, label, multiple, select, type});

	const values =
		content.list.selected.length === 0
			? ['']
			: content.list.selected.map(option => getData(option, 'value', false) ?? '');

	const state: OuiComboboxState = {
		autocomplete,
		disabled,
		id,
		internals,
		multiple,
		readonly,
		required,
		select,
		type,
		anchor: {
			container: anchor.container,
			element: anchor.element,
		},
		active: content.list.selected[0],
		content: content.element,
		filter: {
			element: content.filter?.element ?? (anchor.element as HTMLInputElement),
			value: '',
		},
		floatable: undefined as never,
		groups: content.list.groups,
		host: element,
		label: {
			element: label,
			id: labelId,
		},
		listeners: [],
		localizations: {},
		message: content.message,
		name: element.name,
		options: {
			all: content.list.options,
			selected: content.list.selected,
		},
		selection: anchor.selection,
		values: {
			current: values.slice(),
			initial: values.slice(),
		},
	};

	attachCombobox(state);

	setDisabled(state, disabled);
	setLimit('max', state, getAttribute(element, 'max'));
	setLimit('min', state, getAttribute(element, 'min'));
	setReadonly(state, readonly);
	setRequired(state, required);

	filterOptions(state);

	if (content.list.selected.length > 0) {
		updatePreview('set', state, content.list.selected[0]);
	}

	updateForm(state, state.values.current, false);
	updateMessage(state, getVisible(state).length);

	return state;
}

function detachCombobox(state: OuiComboboxState): void {
	const {content, floatable, host, label, select} = state;

	const listeners = state.listeners.splice(0);
	const {length} = listeners;

	for (let index = 0; index < length; index += 1) {
		listeners[index]();
	}

	floatable.destroy();

	const anchor = state.anchor.container ?? state.anchor.element;

	anchor.insertAdjacentElement('beforebegin', select);

	anchor.remove();
	content.remove();

	label.element.htmlFor = select.id;
	label.element.id = state.label.id;

	select.hidden = false;

	states.map.delete(host);
	states.map.delete(content);
	states.set.delete(state);
}

function filterOptions(state: OuiComboboxState): HTMLElement | undefined {
	function filter(options: HTMLElement[]): boolean {
		const {length} = options;

		let count = 0;

		for (let index = 0; index < length; index += 1) {
			const option = options[index];

			option.hidden =
				!state.autocomplete.none && !option.textContent.toLocaleLowerCase().includes(value);

			if (!option.hidden) {
				count += 1;

				visible.push(option);
			}
		}

		return count === 0;
	}

	const value = state.filter.element.value.toLocaleLowerCase();

	const visible: HTMLElement[] = [];

	if (state.groups == null) {
		filter(state.options.all);
	} else {
		const groupsLength = state.groups.length;

		for (let groupIndex = 0; groupIndex < groupsLength; groupIndex += 1) {
			const {element, options} = state.groups[groupIndex];

			element.hidden = filter(options);
		}
	}

	updateMessage(state, visible.length);

	return state.active != null && visible.includes(state.active) ? state.active : visible[0];
}

function filterOption(
	state: OuiComboboxState,
	value: unknown,
	textContent?: boolean,
): HTMLElement | undefined {
	const filterTextContent = textContent ?? false;

	const filter = getString(value).toLocaleLowerCase();

	filterOptions(state);

	const {length} = state.options.all;
	let match: HTMLElement | undefined;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		const value = (
			filterTextContent ? option.textContent : (getData(option, 'value', false) ?? '')
		).toLocaleLowerCase();

		if (value === filter) {
			match = option;

			break;
		}
	}

	return match;
}

function generateIds(prefix: string, select: HTMLSelectElement): void {
	const elements = [...select.children].flatMap(child =>
		child instanceof HTMLOptGroupElement
			? [
					child,
					...[...child.children].filter(groupChild => groupChild instanceof HTMLOptionElement),
				]
			: child instanceof HTMLOptionElement
				? [child]
				: [],
	);

	const {length} = elements;

	for (let index = 0; index < length; index += 1) {
		const element = elements[index];

		if (element.id === '') {
			element.id = `${prefix}${element instanceof HTMLOptGroupElement ? '_group_' : '_option_'}${index}`;
		}
	}
}

function getAttributeValue<Value>(
	element: HTMLElement,
	attribute: string,
	possible: Set<Value>,
	defaultValue: Value,
): Value {
	const value = getAttribute(element, attribute);

	return possible.has(value as Value) ? (value as Value) : defaultValue;
}

function getAutoComplete(element: OuiComboboxElement, select: boolean): OuiComboboxAutoComplete {
	let value: OuiComboboxAutoCompleteType;

	if (select) {
		value = 'list';
	} else {
		value = getAttributeValue(element, 'autocomplete', AUTOCOMPLETES, 'none');
	}

	return {
		value,
		both: value === 'both',
		inline: value === 'inline',
		list: value === 'list',
		none: value === 'none',
	};
}

function getBooleanAria(element: HTMLElement, attribute: AnyAriaBooleanAttribute): boolean {
	const value = getAria(element, attribute);

	return value === true || value === 'true';
}

function getId(): string {
	index += 1;

	return `oui_combobox_${index}`;
}

function getLanguage(state: OuiComboboxState): string {
	return (
		state.host.closest('[lang]')?.getAttribute('lang') ?? document.documentElement.lang
	).toLowerCase();
}

function getLocalization<Key extends keyof OuiComboboxLocalizations>(
	key: Key,
	state: OuiComboboxState,
): OuiComboboxLocalizations[Key] {
	const language = getLanguage(state);

	const allLocalizations = [state.localizations, LOCALIZATIONS.globals];
	const {length} = allLocalizations;

	let localization: OuiComboboxLocalizations[Key] | undefined;
	let shortLanguage: string | undefined;

	for (let index = 0; index < length; index += 1) {
		const localizations = allLocalizations[index];

		localization = localizations?.[language]?.[key];

		if (localization != null) {
			break;
		}

		shortLanguage ??= language.split('-')[0];

		if (shortLanguage === language) {
			continue;
		}

		localization = localizations?.[shortLanguage]?.[key];

		if (localization != null) {
			break;
		}
	}

	return localization ?? LOCALIZATIONS.defaults[key];
}

function getVisible(state: OuiComboboxState): HTMLElement[] {
	return state.options.all.filter(option => !option.hidden);
}

function hasTextSelection(element: HTMLElement): element is HTMLInputElement {
	return element instanceof HTMLInputElement && element.selectionStart !== element.selectionEnd;
}

function onClickContent(event: PointerEvent, content: HTMLElement): void {
	const state = states.map.get(content);

	if (state == null) {
		return;
	}

	if (state.disabled) {
		return;
	}

	const option = findAncestor(event, SELECTOR_OPTION);

	if (!(option instanceof HTMLElement)) {
		state.filter.element.focus();
	} else if (state.readonly) {
		updatePreview('set', state, option);
	} else {
		toggleOption(state, option);
	}
}

function onClickDocument(event: PointerEvent): void {
	const combobox = findAncestor(event, TAGNAME);
	const state = states.map.get(combobox!);

	if (combobox == null || state == null) {
		return;
	}

	const label = findAncestor(event, 'label');

	if (label != null) {
		if (label === state.label.element && combobox.type === 'select') {
			state.anchor.element.focus();

			if (!state.disabled) {
				state.floatable.show();
			}
		}

		return;
	}

	const selection = findAncestor(event, `[${ATTRIBUTE_SELECTION_ITEM}]`);

	if (selection != null) {
		const option = state.options.selected.find(
			option => option.id === getData(selection, 'option', false),
		);

		if (state.disabled) {
			state.anchor.element.focus();
		} else if (state.readonly) {
			updateTabindices(state, option);
		} else {
			toggleOption(state, option);
		}

		return;
	}

	const anchor = findAncestor(event, SELECTOR_ANCHOR);

	if (anchor != null && !state.disabled) {
		state.floatable.show();

		return;
	}
}

function onEnter(state: OuiComboboxState): void {
	if (state.disabled || state.readonly) {
		return;
	}

	if (hasTextSelection(state.anchor.element)) {
		onSelection(state);
	} else {
		toggleOption(state, state.active);
	}
}

function onEscape(state: OuiComboboxState): void {
	state.floatable.hide();
}

function onFilter(
	type: InputEvent['inputType'],
	state: OuiComboboxState,
	manual?: boolean,
	emit?: boolean,
): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const diff = state.filter.value !== state.filter.element.value;

	if (!state.autocomplete.inline && state.filter.element.value.length > 0 && !(manual ?? false)) {
		state.floatable.show();
	}

	const option = state.autocomplete.none
		? (state.active ?? state.options.all[0])
		: filterOptions(state);

	let update: OuiComboboxPreview | undefined;

	if (type.includes('delete')) {
		update = 'none';
	} else if (type.includes('insert')) {
		update = 'typed';
	}

	if (update != null) {
		if (state.autocomplete.none) {
			applySelection({state, added: false, emit: (emit ?? true) && diff});
		} else {
			updatePreview(update, state, option);
		}
	}

	if (diff) {
		state.filter.value = state.filter.element.value;

		dispatch(state.host, 'input');
	}
}

function onFocusout(state: OuiComboboxState): void {
	if (
		state.disabled ||
		state.readonly ||
		state.type === 'select' ||
		state.host === document.activeElement ||
		state.host.contains(document.activeElement)
	) {
		return;
	}

	const option = filterOption(state, state.filter.element.value, true);

	applySelection({
		option,
		state,
		added: false,
		selected: option == null ? [] : [option],
	});
}

function onInput(event: InputEvent): void {
	const combobox = findAncestor(event, TAGNAME);
	const state = states.map.get(combobox!);

	if (combobox != null && state != null && event.target === state.filter.element) {
		onFilter(event.inputType, state);
	}
}

function onKeydown(event: KeyboardEvent): void {
	const combobox = findAncestor(event, TAGNAME);
	const state = states.map.get(combobox!);

	if (combobox == null || state == null) {
		return;
	}

	const item = findAncestor(event, SELECTOR_SELECTION_ITEM);

	if (item instanceof HTMLElement) {
		onKeydownSelection(event, state, item);

		return;
	}

	onKeydownFilter(event, state);
}

function onKeydownFilter(event: KeyboardEvent, state: OuiComboboxState): void {
	const ignore = state.disabled || state.readonly;
	const isSelect = state.type === 'select';

	let preventDefault = ignore;

	switch (true) {
		case event.key === ' ': {
			if (!state.disabled) {
				state.floatable.show();
			}

			break;
		}

		case event.key === 'Enter': {
			preventDefault = state.floatable.open;

			if (preventDefault) {
				onEnter(state);
			} else if (!ignore && state.type === 'select') {
				state.floatable.show();
			} else if (!ignore) {
				state.internals.form?.requestSubmit();
			}

			break;
		}

		case event.key === 'Escape': {
			preventDefault = false;

			onEscape(state);

			break;
		}

		case !isSelect && KEYS_SELECTION.has(event.key): {
			if (!ignore && hasTextSelection(state.anchor.element)) {
				onSelection(state);
			}

			break;
		}

		case KEYS_NAVIGATION.has(event.key): {
			if (!state.disabled) {
				onNavigation(event, state);
			}

			break;
		}

		default: {
			preventDefault = false;

			if (event.key === 'Tab') {
				onTab(state);
			}

			break;
		}
	}

	if (preventDefault) {
		event.preventDefault();
		event.stopPropagation();
	}
}

function onKeydownSelection(
	event: KeyboardEvent,
	state: OuiComboboxState,
	item: HTMLElement,
): void {
	if (KEYS_ACTIVATION.has(event.key)) {
		event.preventDefault();

		onRemoveSelection(state, item);

		return;
	}

	if (state.disabled || state.selection == null) {
		return;
	}

	const {length} = state.selection.items;

	const index = state.selection.items.findIndex(selection => selection.button === item);

	let next: number | undefined;

	switch (event.key) {
		case 'ArrowDown':
			state.anchor.element.focus();
			state.anchor.element.click();
			return;

		case 'ArrowRight':
		case 'ArrowLeft':
			next = clamp(index + (event.key === 'ArrowRight' ? 1 : -1), 0, length - 1, true);
			break;

		case 'End':
			next = length - 1;
			break;

		case 'Home':
			next = 0;
			break;

		default:
			break;
	}

	if (next == null) {
		return;
	}

	event.preventDefault();

	for (let index = 0; index < length; index += 1) {
		const {button} = state.selection.items[index];
		const selected = index === next;

		button.tabIndex = selected ? 0 : -1;

		if (selected) {
			button.focus();
		}
	}
}

function onNavigation(event: KeyboardEvent, state: OuiComboboxState): void {
	let skip = false;

	if (!state.floatable.open) {
		skip = true;

		state.floatable.show();
	}

	const visible = getVisible(state);

	if (visible.length === 0) {
		return;
	}

	let next: HTMLElement | undefined;

	if (skip || state.active == null) {
		next = state.active ?? visible.at(event.key === 'ArrowDown' ? 0 : -1);
	} else {
		const current = visible.findIndex(option => option.id === state.active?.id);

		let index: number | undefined;

		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
				index = clamp(current + (event.key === 'ArrowDown' ? 1 : -1), 0, visible.length - 1, true);
				break;

			case 'End':
				index = visible.length - 1;
				break;

			case 'Home':
				index = 0;
				break;

			case 'PageDown':
			case 'PageUp':
				index = clamp(current + (event.key === 'PageDown' ? 10 : -10), 0, visible.length - 1);
				break;

			default:
				break;
		}

		if (index != null) {
			next = visible[index];
		}
	}

	let preview: OuiComboboxPreview;

	if (state.type === 'autocomplete' && (state.autocomplete.both || state.autocomplete.inline)) {
		preview = 'set';
	} else {
		preview = 'none';
	}

	updatePreview(preview, state, next ?? state.active ?? visible[0]);
}

function onRemoveSelection(state: OuiComboboxState, item: HTMLElement): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const option = state.options.selected.find(
		option => option.id === getData(item, 'option', false),
	);

	if (option != null) {
		toggleOption(state, option);
	}
}

function onSelection(state: OuiComboboxState): void {
	state.filter.value =
		state.anchor.element === state.filter.element ? state.filter.element.value : '';

	filterOptions(state);

	toggleOption(state, state.active);
}

function onTab(state: OuiComboboxState): void {
	setTimeout(() => {
		if (state.host === document.activeElement) {
			return;
		}

		if (
			state.selection?.container.contains(document.activeElement) ||
			!state.host.contains(document.activeElement)
		) {
			state.floatable.hide();
		}
	});
}

function setDisabled(state: OuiComboboxState, value: boolean): void {
	state.filter.element.readOnly = state.readonly || value;

	setProperties('disabled', state, value);
}

function setFilter(state: OuiComboboxState, value: unknown): void {
	if (typeof value !== 'string') {
		return;
	}

	const type: InputEvent['inputType'] =
		value.length < state.filter.element.value.length ? 'deleteContentBackward' : 'insertText';

	state.filter.element.value = value;

	onFilter(type, state);
}

function setLimit(type: 'max' | 'min', state: OuiComboboxState, value?: unknown): void {
	let actual = value;

	if (typeof actual === 'string') {
		actual = Number.parseInt(actual, 10);
	}

	const updateLimit =
		typeof actual === 'number' && !Number.isNaN(actual) && actual >= 0
			? actual !== state[type]
			: actual == null;

	if (updateLimit) {
		state[type] = actual as number | undefined;

		setAttribute(state.host, type, actual);

		updateValidity(state);
	}
}

/**
 * Set combobox localizations for a specific language
 *
 * @param language Language code
 * @param localizations Localizations for language
 */
export function setLocalizations(
	language: string,
	localizations: Partial<OuiComboboxLocalizations>,
): void;

/**
 * Set combobox localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setLocalizations(
	localizations: Record<string, Partial<OuiComboboxLocalizations>>,
): void;

export function setLocalizations(
	first: string | Record<string, Partial<OuiComboboxLocalizations>>,
	second?: Partial<OuiComboboxLocalizations>,
): void {
	updateLocalizations(
		typeof first === 'string'
			? {
					[first]: second!,
				}
			: first,
	);
}

function setProperties(
	key: 'disabled' | 'readonly' | 'required',
	state: OuiComboboxState,
	value: boolean,
): void {
	state[key] = value;

	const elements = [state.host, state.anchor.element, state.filter.element];
	const {length} = elements;

	for (let index = 0; index < length; index += 1) {
		const element = elements[index];

		setAria(
			element,
			key,
			key !== 'readonly' || !(element instanceof HTMLButtonElement) ? value : undefined,
		);
	}
}

function setReadonly(state: OuiComboboxState, value: boolean): void {
	state.filter.element.readOnly = state.disabled || value;

	setProperties('readonly', state, value);
}

function setRequired(state: OuiComboboxState, value: boolean): void {
	setProperties('required', state, value);
	updateValidity(state);
}

function setValue(state: OuiComboboxState, value: unknown, emit?: boolean): void {
	if (state.autocomplete.none) {
		state.filter.element.value = getString(value);

		onFilter('insertText', state, true, emit);

		return;
	}

	const option = filterOption(state, value);

	if (option != null) {
		setValues(state, [value], emit);
	}
}

function setValues(state: OuiComboboxState, value: unknown, emit?: boolean): void {
	if (!Array.isArray(value)) {
		return;
	}

	const values = (state.multiple ? value : value.slice(0, 1)).map(value =>
		getString(value).toLocaleLowerCase(),
	);

	if (values.length === 0) {
		values.push('');
	}

	if (state.autocomplete.none) {
		setValue(state, values[0], emit);

		return;
	}

	const {length} = state.options.all;

	const selected: HTMLElement[] = [];

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		if (values.includes(getData(option, 'value', false)?.toLocaleLowerCase() ?? '')) {
			selected.push(option);
		}
	}

	applySelection({
		emit,
		selected,
		state,
		added: true,
		option: selected[0] ?? state.options.all[0],
		values: state.autocomplete.none ? values : undefined,
	});
}

function toggleOption(state: OuiComboboxState, option?: HTMLElement): void {
	if (option == null || (!state.multiple && state.options.selected.includes(option))) {
		state.floatable.hide();

		return;
	}

	const selected = state.options.selected.slice();

	let added = true;

	if (state.multiple) {
		const index = selected.indexOf(option);

		if (index === -1) {
			selected.push(option);
		} else {
			added = false;

			selected.splice(index, 1);
		}
	} else {
		selected.splice(0, selected.length, option);
	}

	applySelection({
		added,
		option,
		selected,
		state,
		values: state.autocomplete.none && option != null ? [option.textContent] : undefined,
	});

	if (!state.multiple) {
		state.floatable.hide();
	}
}

function updateAnchor(state: OuiComboboxState): void {
	if (!state.multiple) {
		return;
	}

	const localization = getLocalization('selected', state);

	setAria(
		state.anchor.element,
		'label',
		typeof localization === 'function'
			? localization(state.options.selected.length)
			: localization.replace('{amount}', state.options.selected.length.toString()),
	);
}

function updateAutocomplete(
	preview: OuiComboboxPreview,
	state: OuiComboboxState,
	active?: HTMLElement,
): void {
	if (state.multiple) {
		return;
	}

	const content = active?.textContent ?? state.filter.element.value;

	if (
		preview === 'typed' &&
		!content.toLocaleLowerCase().startsWith(state.filter.element.value.toLocaleLowerCase())
	) {
		return;
	}

	if (state.anchor.element instanceof HTMLInputElement) {
		const contentLength = content.length;
		const filterLength = state.filter.element.value.length;

		if (preview === 'set' || preview === 'typed') {
			state.anchor.element.value = content;

			state.anchor.element.setSelectionRange(
				preview === 'typed' ? filterLength : contentLength,
				contentLength,
			);
		}
	} else {
		state.anchor.element.textContent = content;
	}
}

function updateForm(state: OuiComboboxState, values: string[], emit?: boolean): void {
	let value: string | FormData;

	if (state.multiple) {
		const {length} = values;

		value = new FormData();

		for (let index = 0; index < length; index += 1) {
			(value as FormData).append(state.name, values[index]);
		}
	} else {
		value = values[0];
	}

	state.values.current = values;

	state.internals.setFormValue(value, JSON.stringify(values));

	updateAnchor(state);
	updateValidity(state);

	if (emit ?? true) {
		dispatch(state.host, 'change');
	}
}

function updateLocalizations(
	values: Record<string, Partial<Record<string, string | GenericCallback>>>,
	destination?: Record<string, Partial<OuiComboboxLocalizations>>,
): void {
	if (typeof values !== 'object' || values == null) {
		return;
	}

	const localizations = destination ?? LOCALIZATIONS.globals;

	const languages = Object.keys(values);
	const languagesLength = languages.length;

	let updated = false;

	for (let languagesIndex = 0; languagesIndex < languagesLength; languagesIndex += 1) {
		const language = languages[languagesIndex];
		const languageValue = values[language];

		if (typeof languageValue !== 'object' || languageValue == null) {
			continue;
		}

		const normalizedLanguage = language.toLowerCase();

		localizations[normalizedLanguage] ??= {};

		const keys = Object.keys(languageValue);
		const keysLength = keys.length;

		for (let keysIndex = 0; keysIndex < keysLength; keysIndex += 1) {
			const key = keys[keysIndex];
			const keyValue = languageValue[key];

			const normalizedKey = key.toLowerCase() as keyof OuiComboboxLocalizations;

			if (
				LOCALIZATIONS.keys.has(normalizedKey) &&
				(typeof keyValue === 'string' || typeof keyValue === 'function')
			) {
				updated = true;

				localizations[normalizedLanguage][normalizedKey] = keyValue as never;
			}
		}
	}

	if (!updated) {
		return;
	}

	for (const state of states.set) {
		updateAnchor(state);
		updateMessage(state, getVisible(state).length);
		updateSelectionItems(state);
	}
}

function updateMessage(state: OuiComboboxState, visible: number): void {
	setAttribute(state.message, ATTRIBUTE_HIDDEN, visible > 0 ? '' : undefined);

	if (visible === 0) {
		const localization = getLocalization('empty', state);

		state.message.textContent = typeof localization === 'function' ? localization() : localization;
	} else {
		const localization = getLocalization('results', state);

		state.message.textContent =
			typeof localization === 'function'
				? localization(visible)
				: localization.replace('{amount}', visible.toString());
	}

	state.message.hidden = false;
}

function updatePreview(
	preview: OuiComboboxPreview,
	state: OuiComboboxState,
	active?: HTMLElement,
): void {
	const {length} = state.options.all;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		setAttribute(option, ATTRIBUTE_OPTION_ACTIVE, option === active ? '' : undefined);
	}

	state.active = active;

	setAria(state.filter.element, 'activedescendant', state.floatable.open ? active?.id : undefined);

	if (state.floatable.open) {
		active?.scrollIntoView(scrollOptions);
	}

	if (preview !== 'none') {
		updateAutocomplete(preview, state, active);
	}
}

function updateSelection(
	state: OuiComboboxState,
	active: HTMLElement | undefined,
	added: boolean,
	selected?: HTMLElement[],
): void {
	if (state.selection == null) {
		return;
	}

	let options = active == null ? [] : [active];

	if (selected != null) {
		options = selected;

		const {length} = state.selection.items;

		for (let index = 0; index < length; index += 1) {
			state.selection.items[index].element.remove();
		}

		state.selection.items.splice(0);
	}

	if (added) {
		createSelectionItems({
			options,
			state,
			container: state.selection.container,
			items: state.selection.items,
		});

		return;
	}

	let current = state.selection.items.findIndex(
		item => getData(item.button, 'option', false) === active?.id,
	);

	if (current === -1) {
		return;
	}

	const item = state.selection.items[current];

	item.element.remove();

	state.selection.items.splice(current, 1);

	if (state.selection.items.length === 0) {
		state.anchor.element.focus();

		return;
	}

	const {length} = state.selection.items;

	if (current < 0) {
		current = 0;
	} else if (current >= length) {
		current = length - 1;
	}

	for (let index = 0; index < length; index += 1) {
		const {button} = state.selection.items[index];

		button.tabIndex = index === current ? 0 : -1;
	}

	state.selection.items[current].button.focus();
}

function updateSelectionItems(state: OuiComboboxState): void {
	if (state.selection == null) {
		return;
	}

	const localization = getLocalization('remove', state);

	const {length} = state.selection.items;

	for (let index = 0; index < length; index += 1) {
		const item = state.selection.items[index];

		const option = state.options.selected.find(
			option => option.id === getData(item.button, 'option', false),
		);

		if (option == null) {
			continue;
		}

		setAria(
			item.button,
			'label',
			typeof localization === 'function'
				? localization(option?.textContent ?? '', getData(option, 'value', false) ?? '')
				: localization.replace('{label}', option?.textContent ?? ''),
		);
	}
}

function updateTabindices(state: OuiComboboxState, active?: HTMLElement): void {
	if (active == null || state.selection == null) {
		return;
	}

	const next = state.selection.items.find(
		item => getData(item.button, 'option', false) === active.id,
	);

	if (next == null) {
		return;
	}

	const {length} = state.selection.items;

	for (let index = 0; index < length; index += 1) {
		const item = state.selection.items[index];

		item.button.tabIndex = item === next ? 0 : -1;
	}

	next.button.focus();
}

function updateValidity(state: OuiComboboxState): void {
	if (state.autocomplete.none) {
		const valueMissing = state.required && state.filter.element.value.length === 0;

		const localization = getLocalization('input', state);

		state.internals.setValidity(
			{valueMissing},
			typeof localization === 'function' ? localization() : localization,
		);

		state.internals.checkValidity();

		return;
	}

	let error: 'badInput' | 'rangeOverflow' | 'rangeUnderflow' | undefined;
	let message: string | undefined;

	switch (true) {
		case state.required && state.options.selected.length === 0: {
			error = 'badInput';

			const localization = getLocalization('input', state);

			message = typeof localization === 'function' ? localization() : localization;

			break;
		}

		case state.multiple &&
			typeof state.max === 'number' &&
			state.options.selected.length > state.max: {
			error = 'rangeOverflow';

			const localization = getLocalization('max', state);

			message =
				typeof localization === 'function'
					? localization(state.max)
					: localization.replace('{max}', state.max.toString());

			break;
		}

		case state.multiple &&
			typeof state.min === 'number' &&
			state.options.selected.length < state.min: {
			error = 'rangeUnderflow';

			const localization = getLocalization('min', state);

			message =
				typeof localization === 'function'
					? localization(state.min)
					: localization.replace('{min}', state.min.toString());

			break;
		}

		default:
			break;
	}

	state.internals.setValidity(
		error == null
			? {}
			: {
					[error]: true,
				},
		message,
	);

	state.internals.checkValidity();
}

// #endregion

// #region Variables

const TAGNAME = 'oui-combobox';

const ATTRIBUTE_ANCHOR = `${TAGNAME}-anchor`;

const ATTRIBUTE_CONTENT = `${TAGNAME}-content`;

const ATTRIBUTE_FILTER = `${TAGNAME}-filter`;

const ATTRIBUTE_FILTER_INPUT = `${ATTRIBUTE_FILTER}-input`;

const ATTRIBUTE_HEADER = `${TAGNAME}-header`;

const ATTRIBUTE_HIDDEN = `${TAGNAME}-hidden`;

const ATTRIBUTE_LIST = `${TAGNAME}-list`;

const ATTRIBUTE_MESSAGE = `${TAGNAME}-message`;

const ATTRIBUTE_OPTION = `${TAGNAME}-option`;

const ATTRIBUTE_OPTION_ACTIVE = `${TAGNAME}-option-active`;

const ATTRIBUTE_SELECTION = `${TAGNAME}-selection`;

const ATTRIBUTE_SELECTION_ITEM = `${TAGNAME}-selection-item`;

const AUTOCOMPLETES = new Set<OuiComboboxAutoCompleteType>(['both', 'inline', 'list', 'none']);

const KEYS_ACTIVATION = new Set([' ', 'Backspace', 'Delete', 'Enter']);

const KEYS_NAVIGATION = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

const KEYS_SELECTION = new Set(['ArrowRight', 'End']);

const LOCALIZATIONS: {
	defaults: OuiComboboxLocalizations;
	globals: Record<string, Partial<OuiComboboxLocalizations>>;
	keys: Set<keyof OuiComboboxLocalizations>;
} = {
	defaults: {
		empty: 'No results found',
		input: 'Please enter a value',
		invalid: 'Please select an option from the list',
		max: max => `Please select fewer options (maximum is ${max})`,
		min: min => `Please select more options (minimum is ${min})`,
		remove: label => `Remove ${label}`,
		results: amount => `${amount} results available`,
		selected: amount => `${amount} selected`,
	},
	globals: {},
	keys: new Set<keyof OuiComboboxLocalizations>([
		'empty',
		'input',
		'invalid',
		'max',
		'min',
		'remove',
		'results',
		'selected',
	]),
};

const MESSAGE_LABEL = `<${TAGNAME}> must contain a <label> element for the <select> element`;

const MESSAGE_SELECT = `<${TAGNAME}> must contain a valid <select> element`;

const SELECTOR_ANCHOR = `[${ATTRIBUTE_ANCHOR}]`;

const SELECTOR_SELECTION_ITEM = `[${ATTRIBUTE_SELECTION_ITEM}]`;

const SELECTOR_OPTION = `[${ATTRIBUTE_OPTION}]`;

const TYPES = new Set<OuiComboboxType>(['autocomplete', 'select']);

const scrollOptions: ScrollIntoViewOptions = {
	behavior: 'auto',
	block: 'nearest',
	inline: 'nearest',
};

const states = {
	map: new WeakMap<HTMLElement, OuiComboboxState>(),
	set: new Set<OuiComboboxState>(),
};

let index = 0;

// #endregion

// #region Initialization

on(document, 'click', onClickDocument);

on(document, 'input', onInput, {
	passive: false,
});

on(document, 'keydown', onKeydown, {
	passive: false,
});

customElements.define(TAGNAME, OuiComboboxElement);

// #endregion
