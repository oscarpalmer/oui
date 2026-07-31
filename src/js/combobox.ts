import {clamp} from '@oscarpalmer/atoms/number';
import {getString, parse} from '@oscarpalmer/atoms/string';
import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {getData, setData} from '@oscarpalmer/toretto/data';
import {dispatch, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {createEmbeddedFloatable, type OuiFloatable} from './floatable/floatable.embedded';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[TAGNAME]: OuiComboboxElement;
	}
}

type CreateAnchor = {
	container?: HTMLElement;
	element: HTMLElement;
	selection?: OuiComboboxSelection;
};

type CreateContent = {
	element: HTMLElement;
	empty: HTMLElement;
	filter?: CreateFilter;
	list: CreateList;
};

type CreateFilter = {
	container: HTMLElement;
	element: HTMLInputElement;
};

type CreateList = {
	element: HTMLElement;
	groups?: OuiComboboxGroup[];
	options: HTMLElement[];
	selected: HTMLElement[];
};

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
		const option = findOption(this.#state, value);

		if (this.#state.autocomplete.none || option != null) {
			setNext('set', this.#state, option);
		}
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
		this.#state.touched = false;

		setValues(this.#state, this.#state.values.initial);
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

	#initialize(): void {
		this.tabIndex = -1;

		this.#state = createState(this, this.#internals);

		if (this.#restored != null) {
			setValues(this.#state, this.#restored, false);

			this.#restored = undefined;
		}
	}
}

type OuiComboboxAnchor = {
	container?: HTMLElement;
	element: HTMLElement;
};

type OuiComboboxAutoComplete = Record<OuiComboboxAutoCompleteType, boolean> & {
	value: OuiComboboxAutoCompleteType;
};

type OuiComboboxAutoCompleteType = 'both' | 'inline' | 'list' | 'none';

type OuiComboboxGroup = {
	element: HTMLElement;
	header: HTMLElement;
	options: HTMLElement[];
};

type OuiComboboxFilter = {
	element: HTMLInputElement;
	value: string;
};

type OuiComboboxOptions = {
	all: HTMLElement[];
	selected: HTMLElement[];
};

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
	empty: HTMLElement;
	filter: OuiComboboxFilter;
	floatable: OuiFloatable;
	groups?: OuiComboboxGroup[];
	host: OuiComboboxElement;
	id: string;
	internals: ElementInternals;
	label: HTMLLabelElement;
	listeners: RemovableEventListener[];
	max?: number;
	min?: number;
	name: string;
	multiple: boolean;
	options: OuiComboboxOptions;
	readonly: boolean;
	required: boolean;
	select: HTMLSelectElement;
	selection?: OuiComboboxSelection;
	touched: boolean;
	type: OuiComboboxType;
	values: OuiComboboxValues;
};

type OuiComboboxType = 'autocomplete' | 'select';

type OuiComboboxUpdate = 'navigation' | 'none' | 'remove' | 'set' | 'typed';

type OuiComboboxValues = {
	current: string[];
	initial: string[];
};

// #endregion

// #region Functions

function attachCombobox(state: OuiComboboxState): void {
	const {anchor, content, filter, label, listeners, select} = state;

	label.htmlFor = filter.element.id;
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
			state.touched = true;
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

	states.set(state.host, state);
	states.set(state.content, state);
}

function createAnchor(
	type: OuiComboboxType,
	id: string,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	autocomplete: OuiComboboxAutoComplete,
	multiple: boolean,
): CreateAnchor {
	let container: HTMLElement | undefined;
	let element: HTMLElement;
	let selection: OuiComboboxSelection | undefined;

	if (type === 'autocomplete') {
		element = createInput(
			type,
			id,
			label,
			autocomplete.value,
			select.selectedOptions[0]?.textContent ?? '',
		);
	} else {
		({container, element, selection} = createButton(id, label, select, multiple));
	}

	setAttribute(container ?? element, ATTRIBUTE_ANCHOR, '');

	return {container, element, selection};
}

function createButton(
	id: string,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	multiple: boolean,
): CreateAnchor {
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

function createContent(
	type: OuiComboboxType,
	id: string,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	autocomplete: OuiComboboxAutoComplete,
	multiple: boolean,
): CreateContent {
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

	const filter = createFilter(type, id, label, autocomplete.value);
	const list = createList(id, label, select, autocomplete, multiple);
	const empty = createEmpty();

	if (filter != null) {
		element.append(filter.container);
	}

	element.append(list.element, empty);

	return {element, empty, filter, list};
}

function createEmpty(): HTMLElement {
	return createElement('div', {
		aria: {
			live: 'polite',
		},
		attribute: {
			[ATTRIBUTE_EMPTY]: '',
		},
		property: {
			hidden: true,
			role: 'status',
			textContent: 'No results found',
		},
	});
}

function createFilter(
	type: OuiComboboxType,
	id: string,
	label: HTMLLabelElement,
	autocomplete: OuiComboboxAutoCompleteType,
): CreateFilter | undefined {
	if (type === 'autocomplete') {
		return;
	}

	const container = createElement('div', {
		attribute: {
			[ATTRIBUTE_FILTER]: '',
		},
	});

	const element = createInput(type, id, label, autocomplete, '');

	setAttribute(element, ATTRIBUTE_FILTER_INPUT, '');

	container.append(element);

	return {container, element};
}

function createGroup(
	group: HTMLOptGroupElement,
	groupOptions: HTMLOptionElement[],
	selected: HTMLElement[],
	autocomplete: OuiComboboxAutoComplete,
	active: boolean,
): OuiComboboxGroup {
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
		options: createOptions(groupOptions, autocomplete, list, selected, active, header.id),
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

function createInput(
	type: OuiComboboxType,
	id: string,
	label: HTMLLabelElement,
	autocomplete: OuiComboboxAutoCompleteType,
	value: string,
): HTMLInputElement {
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

function createList(
	id: string,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	autocomplete: OuiComboboxAutoComplete,
	multiple: boolean,
): CreateList {
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

	const optionGroups = [...select.querySelectorAll('optgroup')];
	const optionGroupsLength = optionGroups.length;

	const options: HTMLElement[] = [];
	const selected: HTMLElement[] = [];

	let groups: OuiComboboxGroup[] | undefined;

	if (optionGroupsLength > 0) {
		groups = [];

		let firstGroup: number | undefined;

		for (let optionGroupIndex = 0; optionGroupIndex < optionGroupsLength; optionGroupIndex += 1) {
			const optionGroup = optionGroups[optionGroupIndex];
			const groupOptions = [...optionGroup.querySelectorAll('option')];
			const groupOptionsLength = groupOptions.length;

			if (groupOptionsLength === 0) {
				continue;
			}

			firstGroup ??= optionGroupIndex;

			const group = createGroup(
				optionGroup,
				groupOptions,
				selected,
				autocomplete,
				optionGroupIndex === firstGroup,
			);

			element.append(group.element);
			groups.push(group);
			options.push(...group.options);
		}
	} else {
		options.push(...createOptions([...select.options], autocomplete, element, selected, true));
	}

	return {element, groups, options, selected};
}

function createOption(
	index: number,
	option: HTMLOptionElement,
	autocomplete: OuiComboboxAutoComplete,
	active: boolean,
	group?: string,
): HTMLElement {
	const item = createElement('li', {
		aria: {
			selected: !autocomplete.none && option.selected,
		},
		attribute: {
			[ATTRIBUTE_OPTION]: '',
			[ATTRIBUTE_OPTION_ACTIVE]: active && index === 0 ? '' : undefined,
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

function createOptions(
	options: HTMLOptionElement[],
	autocomplete: OuiComboboxAutoComplete,
	list: HTMLElement,
	selected: HTMLElement[],
	active: boolean,
	group?: string,
): HTMLElement[] {
	const items: HTMLElement[] = [];

	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];

		const item = createOption(index, option, autocomplete, active, group);

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
	const active = options[0];

	const items: OuiComboboxSelectionItem[] = [];

	createSelectionItems(options, active, container, items);

	const {button} = items[0] ?? {};

	if (button != null) {
		button.tabIndex = 0;
	}

	return {
		items,
		container: container,
	};
}

function createSelectionItem(option: HTMLElement): OuiComboboxSelectionItem {
	const element = createElement('li');

	const button = createElement('button', {
		aria: {
			label: `Remove ${option.textContent}`,
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

function createSelectionItems(
	options: HTMLElement[],
	active: HTMLElement,
	container: HTMLElement,
	items: OuiComboboxSelectionItem[],
): void {
	const {length} = options;

	for (let index = 0; index < length; index += 1) {
		const option = options[index];

		const item = createSelectionItem(option);

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

	const disabled = getAria(element, 'disabled') === true || select.disabled;
	const multiple = element.multiple || select.multiple;
	const readonly = getAria(element, 'readonly') === true;
	const required = getAria(element, 'required') === true || select.required;

	const id = getId();
	const type = multiple ? 'select' : getAttributeValue(element, 'type', TYPES, 'select');

	const autocomplete = getAutoComplete(element, type === 'select');

	label.htmlFor = id;
	label.id = `${id}_label`;

	generateIds(id, select);

	const anchor = createAnchor(type, id, label, select, autocomplete, multiple);
	const content = createContent(type, id, label, select, autocomplete, multiple);

	const values =
		content.list.selected.length === 0
			? ['']
			: content.list.selected.map(option => getData(option, 'value')?.toString() ?? '');

	const state: OuiComboboxState = {
		autocomplete,
		disabled,
		id,
		internals,
		label,
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
		empty: content.empty,
		filter: {
			element: content.filter?.element ?? (anchor.element as HTMLInputElement),
			value: '',
		},
		floatable: undefined as never,
		groups: content.list.groups,
		host: element,
		listeners: [],
		name: element.name,
		options: {
			all: content.list.options,
			selected: content.list.selected,
		},
		selection: anchor.selection,
		touched: false,
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

	if (content.list.selected.length > 0) {
		setNext('none', state, content.list.selected[0]);
	}

	updateForm(state, state.values.current, false);

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

	label.htmlFor = select.id;
	select.hidden = false;

	states.delete(host);
	states.delete(content);
}

function filterOptions(state: OuiComboboxState, clear?: boolean): HTMLElement | undefined {
	function filter(options: HTMLElement[]): boolean {
		const {length} = options;

		let count = 0;

		for (let index = 0; index < length; index += 1) {
			const option = options[index];

			option.hidden = !option.textContent.toLocaleLowerCase().includes(value);

			if (!option.hidden) {
				count += 1;

				visible.push(option);
			}
		}

		return count === 0;
	}

	if (clear || state.autocomplete.none) {
		state.filter.element.value = '';
		state.filter.value = '';
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

	state.empty.hidden = visible.length > 0;

	if (state.empty.hidden) {
		return state.active != null && visible.includes(state.active) ? state.active : visible[0];
	}
}

function findOption(state: OuiComboboxState, value: unknown): HTMLElement | undefined {
	const valueAsString = getString(value).toLocaleLowerCase();

	filterOptions(state, true);

	const {length} = state.options.all;
	let match: HTMLElement | undefined;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		if (getData(option, 'value')?.toString().toLocaleLowerCase() === valueAsString) {
			match = option;

			break;
		}
	}

	return match;
}

function generateIds(prefix: string, select: HTMLSelectElement): void {
	const optionGroups = [...select.querySelectorAll('optgroup')];

	let elements: HTMLElement[];

	if (optionGroups.length === 0) {
		elements = [...select.options];
	} else {
		elements = optionGroups.flatMap(group => [group, ...group.children] as HTMLElement[]);
	}

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

function getFormValue(state: OuiComboboxState, added?: boolean): [string[], boolean] {
	let values: string[];

	if (state.multiple) {
		values =
			typeof added === 'boolean'
				? state.options.selected.map(option => getData(option, 'value')?.toString() ?? '')
				: state.values.current;
	} else {
		values = [getData(state.options.selected[0], 'value')?.toString() ?? ''];
	}

	const update =
		values.length === state.values.current.length
			? values.some(value => !state.values.current.includes(value))
			: true;

	return [values, update];
}

function getId(): string {
	index += 1;

	return `oui_combobox_${index}`;
}

function getVisible(state: OuiComboboxState): HTMLElement[] {
	return state.options.all.filter(option => !option.hidden);
}

function getSelected(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	element: HTMLElement,
	active?: HTMLElement,
): boolean {
	if (state.autocomplete.none) {
		return false;
	}

	const selected = getAria(element, 'selected') === true;

	if (update === 'navigation') {
		if (state.autocomplete.both) {
			return element === active;
		}

		return selected;
	}

	if (update === 'none') {
		return selected;
	}

	if (update === 'set') {
		if (active == null) {
			return selected;
		}

		if (state.multiple) {
			return element === active ? !selected : selected;
		}

		return element === active;
	}

	return selected;
}

function hasTextSelection(element: HTMLElement): element is HTMLInputElement {
	return element instanceof HTMLInputElement && element.selectionStart !== element.selectionEnd;
}

function onClickContent(event: PointerEvent, content: HTMLElement): void {
	const state = states.get(content);

	if (state == null) {
		return;
	}

	if (state.disabled) {
		return;
	}

	const option = findAncestor(event, SELECTOR_OPTION);

	if (option instanceof HTMLElement) {
		setNext(state.readonly ? 'navigation' : 'set', state, option);
	} else {
		state.filter.element.focus();
	}
}

function onClickDocument(event: PointerEvent): void {
	const combobox = findAncestor(event, TAGNAME);
	const state = states.get(combobox!);

	if (combobox == null || state == null) {
		return;
	}

	const label = findAncestor(event, 'label');

	if (label != null) {
		if (label === state.label && combobox.type === 'select') {
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
			option => option.id === getData(selection, 'option'),
		);

		if (state.disabled) {
			state.anchor.element.focus();
		} else if (state.readonly) {
			updateTabindices(state, option);
		} else {
			setValue('set', state, option);
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
		setNext('set', state, state.active);
	}
}

function onEscape(state: OuiComboboxState): void {
	state.floatable.hide();
}

function onFilter(type: InputEvent['inputType'], state: OuiComboboxState): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const emit = state.filter.value !== state.filter.element.value;

	if (!state.autocomplete.inline && state.filter.element.value.length > 0) {
		state.floatable.show();
	}

	const option = state.autocomplete.none
		? (state.active ?? state.options.all[0])
		: filterOptions(state);

	let update: OuiComboboxUpdate | undefined;

	if (type.includes('delete')) {
		update = 'remove';
	} else if (type.includes('insert')) {
		update = 'typed';
	}

	if (update != null) {
		setNext(update, state, option);
	}

	if (emit) {
		state.filter.value = state.filter.element.value;

		dispatch(state.host, 'input');
	}
}

function onInput(event: InputEvent): void {
	const combobox = findAncestor(event, TAGNAME);
	const state = states.get(combobox!);

	if (combobox != null && state != null && event.target === state.filter.element) {
		onFilter(event.inputType, state);
	}
}

function onKeydown(event: KeyboardEvent): void {
	const combobox = findAncestor(event, TAGNAME);
	const state = states.get(combobox!);

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

	setNext(state.autocomplete.none ? 'none' : 'navigation', state, next);
}

function onRemoveSelection(state: OuiComboboxState, item: HTMLElement): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const option = state.options.selected.find(option => option.id === getData(item, 'option'));

	if (option != null) {
		setNext('set', state, option);
	}
}

function onSelection(state: OuiComboboxState): void {
	state.filter.value = state.anchor instanceof HTMLInputElement ? state.anchor.value : '';

	filterOptions(state);

	setNext('set', state, state.active);
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

function setNext(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	next?: HTMLElement,
	selected?: HTMLElement[],
	emit?: boolean,
): void {
	const {length} = state.options.all;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		setAttribute(option, ATTRIBUTE_OPTION_ACTIVE, option === next ? '' : undefined);
	}

	state.active = next;

	setAria(state.filter.element, 'activedescendant', next?.id);

	next?.scrollIntoView(scrollOptions);

	// TODO: offset scroll to prevent options under headers

	setValue(update, state, next, selected, emit);
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

function setValue(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	current?: HTMLElement,
	selected?: HTMLElement[],
	emit?: boolean,
): void {
	if (state.disabled || state.readonly || (state.type === 'select' && update !== 'set')) {
		return;
	}

	let added: boolean | undefined;
	let shouldUpdate: boolean;
	let values: string[];

	if (update === 'set' || !(state.anchor instanceof HTMLInputElement)) {
		added = updateSelected(update, state, current, selected);

		[values, shouldUpdate] = getFormValue(state, added);
	} else {
		const {length} = state.options.all;

		for (let index = 0; index < length; index += 1) {
			setAria(state.options.all[index], 'selected', false);
		}

		const input = state.anchor.value;

		const content = current?.textContent ?? '';
		const value = current == null ? '' : (getData(current, 'value')?.toString() ?? '');

		let selected: HTMLElement | undefined;

		if (content.toLocaleLowerCase() === input.toLocaleLowerCase()) {
			values = [value];

			if (current != null) {
				selected = current;

				setAria(current, 'selected', true);
			}
		} else {
			values = [state.autocomplete.none ? input : ''];
		}

		state.options.selected = selected == null ? [] : [selected];

		shouldUpdate = state.values.current[0] !== values[0];
	}

	if (shouldUpdate) {
		updateForm(state, values, emit);
	}

	if (current == null) {
		return;
	}

	if (state.type === 'select') {
		updateSelect(update, state, current, selected, added);
	} else if (update !== 'remove') {
		updateAutoComplete(update, state, current);
	}

	if (update === 'set' && !state.multiple) {
		state.floatable.hide();
	}
}

function setValues(state: OuiComboboxState, value: unknown, emit?: boolean): void {
	if (!Array.isArray(value)) {
		return;
	}

	const values = (state.multiple ? value : value.slice(0, 1)).map(value =>
		getString(value).toLocaleLowerCase(),
	);

	const {length} = state.options.all;

	const selected: HTMLElement[] = [];

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		if (values.includes(getData(option, 'value')?.toString().toLocaleLowerCase() ?? '')) {
			selected.push(option);
		}
	}

	setNext('set', state, selected[0] ?? state.options.all[0], selected, emit);
}

function updateAnchor(state: OuiComboboxState): void {
	if (state.multiple) {
		setAria(state.anchor.element, 'label', `${state.options.selected.length} selected`);
	}
}

function updateAutoComplete(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	current: HTMLElement,
): void {
	if (!(update === 'set' || state.autocomplete.both || state.autocomplete.inline)) {
		return;
	}

	const content = current.textContent ?? '';

	if (
		update === 'typed' &&
		!content.toLocaleLowerCase().startsWith(state.filter.element.value.toLocaleLowerCase())
	) {
		return;
	}

	if (state.anchor.element instanceof HTMLInputElement) {
		const contentLength = content.length;
		const filterLength = state.filter.element.value.length;

		state.anchor.element.value = content;

		state.anchor.element.setSelectionRange(
			update === 'typed' ? filterLength : contentLength,
			contentLength,
		);
	} else {
		state.anchor.element.textContent = content;
	}
}

function updateForm(state: OuiComboboxState, values: string[], emit?: boolean): void {
	const formValues = values.length === 0 ? [''] : values;

	let formValue: string | FormData | null;

	if (!state.autocomplete.none && state.options.selected.length === 0) {
		formValue = null;
	} else if (state.multiple) {
		const {length} = formValues;

		formValue = new FormData();

		for (let index = 0; index < length; index += 1) {
			(formValue as FormData).append(state.name, formValues[index]);
		}
	} else {
		formValue = formValues[0];
	}

	state.values.current = formValues;

	state.internals.setFormValue(formValue, JSON.stringify(formValues));

	updateAnchor(state);
	updateValidity(state);

	if (emit !== false) {
		dispatch(state.host, 'change');
	}
}

function updateSelect(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	active: HTMLElement,
	selected?: HTMLElement[],
	added?: boolean,
): void {
	if (update !== 'set') {
		return;
	}

	if (!state.multiple) {
		state.anchor.element.textContent = active.textContent ?? '';

		return;
	}

	if (typeof added === 'boolean') {
		updateSelection(state, active, added, selected);
	}
}

function updateSelected(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	active?: HTMLElement,
	selected?: HTMLElement[],
): boolean | undefined {
	const {length} = state.options.all;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		setAria(
			option,
			'selected',
			selected?.includes(option) ?? getSelected(update, state, option, active),
		);
	}

	if (active == null) {
		return;
	}

	if (state.type !== 'select') {
		state.options.selected = selected ?? [active];

		return;
	}

	if (update !== 'set') {
		return;
	}

	if (!state.multiple) {
		state.options.selected = selected ?? [active];

		return;
	}

	if (selected != null) {
		state.options.selected = selected;

		return true;
	}

	const index = state.options.selected.indexOf(active);
	const added = index === -1;

	if (added) {
		state.options.selected.push(active);
	} else {
		state.options.selected.splice(index, 1);
	}

	return added;
}

function updateSelection(
	state: OuiComboboxState,
	active: HTMLElement,
	added: boolean,
	selected?: HTMLElement[],
): void {
	if (state.selection == null) {
		return;
	}

	let options = [active];

	if (selected != null) {
		options = selected;

		const {length} = state.selection.items;

		for (let index = 0; index < length; index += 1) {
			state.selection.items[index].element.remove();
		}

		state.selection.items.splice(0);
	}

	if (added) {
		createSelectionItems(options, active, state.selection.container, state.selection.items);

		return;
	}

	let current = state.selection.items.findIndex(
		item => getData(item.button, 'option') === active.id,
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

function updateTabindices(state: OuiComboboxState, active?: HTMLElement): void {
	if (active == null || state.selection == null) {
		return;
	}

	const next = state.selection.items.find(item => getData(item.button, 'option') === active.id);

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
		const valueMissing = state.required && state.values.current[0].length === 0;

		state.internals.setValidity(
			{
				valueMissing,
			},
			INVALID_INPUT,
		);

		state.internals.checkValidity();

		return;
	}

	let error: 'badInput' | 'rangeOverflow' | 'rangeUnderflow' | undefined;
	let message: string | undefined;

	switch (true) {
		case state.required && state.options.selected.length === 0:
			error = 'badInput';
			message = INVALID_BAD;
			break;

		case state.multiple &&
			typeof state.max === 'number' &&
			state.options.selected.length > state.max:
			error = 'rangeOverflow';
			message = INVALID_OVERFLOW.replace('{max}', state.max!.toString());
			break;

		case state.multiple &&
			typeof state.min === 'number' &&
			state.options.selected.length < state.min:
			error = 'rangeUnderflow';
			message = INVALID_UNDERFLOW.replace('{min}', state.min!.toString());
			break;

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

const ATTRIBUTE_EMPTY = `${TAGNAME}-empty`;

const ATTRIBUTE_FILTER = `${TAGNAME}-filter`;

const ATTRIBUTE_FILTER_INPUT = `${ATTRIBUTE_FILTER}-input`;

const ATTRIBUTE_HEADER = `${TAGNAME}-header`;

const ATTRIBUTE_LIST = `${TAGNAME}-list`;

const ATTRIBUTE_OPTION = `${TAGNAME}-option`;

const ATTRIBUTE_OPTION_ACTIVE = `${TAGNAME}-option-active`;

const ATTRIBUTE_SELECTION = `${TAGNAME}-selection`;

const ATTRIBUTE_SELECTION_ITEM = `${TAGNAME}-selection-item`;

const AUTOCOMPLETES = new Set<OuiComboboxAutoCompleteType>(['both', 'inline', 'list', 'none']);

const INVALID_BAD = 'Please select an option from the list';

const INVALID_INPUT = 'Please enter a value';

const INVALID_OVERFLOW = 'Please select fewer options (maximum is {max})';

const INVALID_UNDERFLOW = 'Please select more options (minimum is {min})';

const KEYS_ACTIVATION = new Set([' ', 'Backspace', 'Delete', 'Enter']);

const KEYS_NAVIGATION = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

const KEYS_SELECTION = new Set(['ArrowRight', 'End']);

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

const states = new WeakMap<HTMLElement, OuiComboboxState>();

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
