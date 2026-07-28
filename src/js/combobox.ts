import {clamp} from '@oscarpalmer/atoms/number';
import {getString, join} from '@oscarpalmer/atoms/string';
import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {dispatch, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {setProperty} from '@oscarpalmer/toretto/property';
import {setStyle} from '@oscarpalmer/toretto/style';
import {createEmbeddedFloatable, type OuiFloatable} from './floatable/floatable.embedded';
import {getData, setData} from '@oscarpalmer/toretto/data';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[TAGNAME]: OuiComboboxElement;
	}
}

type CreateAnchor = {
	element: HTMLElement;
	selection?: HTMLElement;
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

	static observedAttributes = ['disabled', 'max', 'min', 'readonly', 'required', 'value'];

	readonly #internals: ElementInternals;

	#state!: OuiComboboxState;

	/**
	 * Is the combobox disabled?
	 */
	get disabled(): boolean {
		return this.hasAttribute('disabled');
	}

	/**
	 * Should the combobox be disabled?
	 */
	set disabled(value: boolean) {
		if (typeof value === 'boolean' && value !== this.#state.disabled) {
			setDisabled(this, this.#state, value);
		}
	}

	/**
	 * Maximum number of selected options
	 */
	get max(): number | undefined {
		return this.#state.max;
	}

	/**
	 * Set the maximum number of selected options
	 */
	set max(value: number) {
		setLimit('max', this, this.#state, value);
	}

	/**
	 * Minimum number of selected options
	 */
	get min(): number | undefined {
		return this.#state.min;
	}

	/**
	 * Set the minimum number of selected options
	 */
	set min(value: number) {
		setLimit('min', this, this.#state, value);
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
		return this.hasAttribute('readonly');
	}

	/**
	 * Should the combobox be readonly?
	 */
	set readonly(value: boolean) {
		if (typeof value === 'boolean' && value !== this.#state.readonly) {
			setReadonly(this, this.#state, value);
		}
	}

	/**
	 * Is the combobox required?
	 */
	get required(): boolean {
		return this.hasAttribute('required');
	}

	/**
	 * Should the combobox be required?
	 */
	set required(value: boolean) {
		if (typeof value === 'boolean' && value !== this.#state.required) {
			setRequired(this, this.#state, value);
		}
	}

	/**
	 * Selected options
	 */
	get selected(): HTMLElement[] {
		return this.#state.selected.slice();
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
		setNext('set', this, this.#state, findOption(this.#state, value));
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
		setValues(this, this.#state, value);
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
			case 'disabled':
			case 'readonly':
			case 'required':
				this[name] = this.hasAttribute(name);
				break;

			case 'max':
			case 'min':
				setLimit(name, this, this.#state, value);
				break;

			case 'value':
				this.value = value ?? '';
				break;

			default:
				break;
		}
	}

	clear(): void {
		setValues(this, this.#state, []);
	}

	connectedCallback(): void {
		if (this.#state == null) {
			this.#initialize();
		} else {
			attachCombobox(this, this.#state);
		}
	}

	disconnectedCallback(): void {
		detachCombobox(this, this.#state);
	}

	formDisabledCallback(disabled: boolean): void {
		setDisabled(this, this.#state, disabled);
	}

	formResetCallback(): void {
		this.#state.touched = false;

		setValues(this, this.#state, this.#state.values.initial);
	}

	formStateRestoreCallback(
		state: string | File | FormData,
		reason: 'autocomplete' | 'restore',
	): void {
		// ?
	}

	#initialize(): void {
		this.tabIndex = -1;

		this.#state = createState(this, this.#internals);

		setMaps(this, this.#state);
	}
}

type OuiComboboxAutoComplete = Record<OuiComboboxAutoCompleteType, boolean> & {
	value: OuiComboboxAutoCompleteType;
};

type OuiComboboxAutoCompleteType = 'both' | 'inline' | 'list' | 'none';

type OuiComboboxGroup = {
	element: HTMLElement;
	header: HTMLElement;
	options: HTMLElement[];
};

type OuiComboboxState = {
	active?: HTMLElement;
	anchor: HTMLElement;
	autocomplete: OuiComboboxAutoComplete;
	content: HTMLElement;
	disabled: boolean;
	empty: HTMLElement;
	filter: HTMLInputElement;
	floatable: OuiFloatable;
	groups?: OuiComboboxGroup[];
	id: string;
	internals: ElementInternals;
	label: HTMLLabelElement;
	listeners: RemovableEventListener[];
	max?: number;
	min?: number;
	name: string;
	multiple: boolean;
	options: HTMLElement[];
	readonly: boolean;
	required: boolean;
	select: HTMLSelectElement;
	selected: HTMLElement[];
	selection?: HTMLElement;
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

function attachCombobox(element: OuiComboboxElement, state: OuiComboboxState): void {
	const {anchor, content, filter, listeners, select} = state;

	select.insertAdjacentElement('afterend', anchor);
	anchor.insertAdjacentElement('afterend', content);

	select.remove();

	state.floatable = createEmbeddedFloatable(anchor, content, {
		position: 'below-start',
		reusable: false,
	});

	state.floatable.update();

	setStyle(content, 'minWidth', 'anchor-size(width)');

	listeners.push(
		on(element, 'focusout', () => {
			state.touched = true;
		}),
		on(content, 'click', event => {
			onClickContent(event, content);
		}),
		on(content, 'toggle', () => {
			setAria(anchor, 'expanded', state.floatable.open);
			setAria(filter, 'activedescendant', state.floatable.open ? state.active?.id : undefined);

			if (state.floatable.open) {
				filter.focus();
			}
		}),
	);

	setMaps(element, state);
}

function createAnchor(
	type: OuiComboboxType,
	id: string,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	autocomplete: OuiComboboxAutoComplete,
	multiple: boolean,
): CreateAnchor {
	let element: HTMLElement;
	let selection: HTMLElement | undefined;

	if (type === 'autocomplete') {
		element = createInput(
			type,
			id,
			label,
			autocomplete.value,
			select.selectedOptions[0]?.textContent ?? '',
		);
	} else {
		({element, selection} = createButton(id, label, select, multiple));
	}

	setAttribute(element, ATTRIBUTE_ANCHOR, '');

	return {element, selection};
}

function createButton(
	id: string,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	multiple: boolean,
): CreateAnchor {
	const element = createElement('div', {
		aria: {
			controls: `${id}_content`,
			labelledby: label.id,
		},
		property: {
			role: 'button',
			tabIndex: 0,
			textContent: multiple ? '' : (select.selectedOptions[0]?.textContent ?? ''),
		},
	});

	let selection: HTMLElement | undefined;

	if (multiple) {
		selection = createSelection(id, select);

		setAria(element, 'describedby', selection.id);

		element.append(selection);
	}

	return {element, selection};
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

	if (filter?.container != null) {
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

function createSelection(id: string, select: HTMLSelectElement): HTMLElement {
	const selection = createElement('ul', {
		attribute: {
			[ATTRIBUTE_SELECTION]: '',
		},
		property: {
			id: `${id}_selection`,
		},
	});

	for (const option of select.selectedOptions) {
		selection.append(createSelectionItem(option));
	}

	return selection;
}

function createSelectionItem(option: HTMLElement): HTMLElement {
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

	const item = createElement('li', {
		attribute: {
			[ATTRIBUTE_SELECTION_ITEM]: '',
		},
		data: {
			option: option.id,
		},
	});

	item.append(icon, label);

	return item;
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

	select.hidden = true;

	element.id = select.id;

	setAttribute(element, 'name', select.name === '' ? select.id : select.name);

	const disabled = element.disabled || select.disabled;
	const multiple = element.multiple || select.multiple;
	const readonly = element.readonly;
	const required = element.required || select.required;

	const id = getId();
	const type = multiple ? 'select' : getAttributeValue(element, 'type', TYPES, 'select');

	const autocomplete = getAutoComplete(element, type === 'select');

	label.htmlFor = id;
	label.id = `${id}_label`;

	generateIds(
		id,
		[...select.options],
		[...select.querySelectorAll('optgroup')].flatMap(
			group => [...group.children] as HTMLOptionElement[],
		),
	);

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
		anchor: anchor.element,
		active: content.list.selected[0],
		content: content.element,
		empty: content.empty,
		filter: content.filter?.element ?? (anchor.element as HTMLInputElement),
		floatable: undefined as never,
		groups: content.list.groups,
		listeners: [],
		name: element.name,
		options: content.list.options,
		selected: content.list.selected.slice(),
		selection: anchor.selection,
		touched: false,
		values: {
			current: values.slice(),
			initial: values.slice(),
		},
	};

	attachCombobox(element, state);

	setDisabled(element, state, disabled);
	setLimit('max', element, state, getAttribute(element, 'max'));
	setLimit('min', element, state, getAttribute(element, 'min'));
	setReadonly(element, state, readonly);
	setRequired(element, state, required);

	if (content.list.selected.length > 0) {
		setNext('none', element, state, content.list.selected[0]);
	}

	return state;
}

function detachCombobox(element: OuiComboboxElement, state: OuiComboboxState): void {
	const listeners = state.listeners.splice(0);

	for (const listener of listeners) {
		listener();
	}

	state.floatable.destroy();

	state.anchor.insertAdjacentElement('beforebegin', state.select);

	state.anchor.remove();
	state.content.remove();

	comboboxes.delete(state.content);

	states.delete(element);
	states.delete(state.content);
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
		state.filter.value = '';
	}

	const value = state.filter.value.toLocaleLowerCase();

	const visible: HTMLElement[] = [];

	if (state.groups == null) {
		filter(state.options);
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

	let match: HTMLElement | undefined;

	for (const option of state.options) {
		if (getData(option, 'value')?.toString().toLocaleLowerCase() === valueAsString) {
			match = option;

			break;
		}
	}

	return match;
}

function generateIds(
	prefix: string,
	options: HTMLOptionElement[],
	groupOptions?: HTMLOptionElement[],
): void {
	const elements = [...options, ...(groupOptions ?? [])];
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

function getFormValue(state: OuiComboboxState, values: string[]): string {
	if (values.length === 0 || !state.multiple) {
		return values[0];
	}

	let formValues: string[] = [];

	for (const value of values) {
		formValues.push(`${state.name}=${value}`);
	}

	return join(formValues, '&');
}

function getFormValues(state: OuiComboboxState, added?: boolean): [string[], boolean] {
	let values: string[];

	if (state.multiple) {
		values =
			typeof added === 'boolean'
				? state.selected.map(option => getData(option, 'value')?.toString() ?? '')
				: state.values.current;
	} else {
		values = [getData(state.selected[0], 'value')?.toString() ?? ''];
	}

	const previous = getFormValue(state, state.values.current);
	const next = getFormValue(state, values);

	return [values, next !== previous];
}

function getId(): string {
	index += 1;

	return `oui_combobox_${index}`;
}

function getVisible(state: OuiComboboxState): HTMLElement[] {
	return state.options.filter(option => !option.hidden);
}

function getSelected(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	element: HTMLElement,
	next?: HTMLElement,
): boolean {
	if (state.autocomplete.none) {
		return false;
	}

	const selected = getAria(element, 'selected') === true;

	if (update === 'navigation') {
		if (state.autocomplete.both) {
			return element === next;
		}

		return selected;
	}

	if (update === 'none') {
		return selected;
	}

	if (update === 'set') {
		if (next == null) {
			return selected;
		}

		if (state.multiple) {
			return element === next ? !selected : selected;
		}

		return element === next;
	}

	return selected;
}

function hasTextSelection(element: HTMLElement): element is HTMLInputElement {
	return element instanceof HTMLInputElement && element.selectionStart !== element.selectionEnd;
}

function onClickContent(event: PointerEvent, content: HTMLElement): void {
	const combobox = comboboxes.get(content);
	const state = states.get(content);

	if (combobox == null || state == null) {
		return;
	}

	const option = findAncestor(event, SELECTOR_OPTION);

	if (option instanceof HTMLElement) {
		setNext('set', combobox, state, option);
	}

	state.filter.focus();
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
			state.anchor.focus();

			state.floatable.show();
		}

		return;
	}

	const selection = findAncestor(event, `[${ATTRIBUTE_SELECTION_ITEM}]`);

	if (selection != null) {
		const option = state.selected.find(option => option.id === getData(selection, 'option'));

		setValue('set', combobox, state, option);

		return;
	}

	const anchor = findAncestor(event, SELECTOR_ANCHOR);

	if (anchor != null) {
		state.floatable.show();

		return;
	}
}

function onEnter(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	if (hasTextSelection(state.anchor)) {
		onSelection(combobox, state);
	} else {
		setNext('set', combobox, state, state.active);
	}
}

function onEscape(state: OuiComboboxState): void {
	state.floatable.hide();
}

function onInput(event: InputEvent): void {
	const combobox = findAncestor(event, TAGNAME);
	const state = states.get(combobox!);

	if (combobox == null || state == null || event.target !== state.filter) {
		return;
	}

	if (!state.autocomplete.inline && state.filter.value.length > 0) {
		state.floatable.show();
	}

	const option = state.autocomplete.none
		? (state.active ?? state.options[0])
		: filterOptions(state);

	let update: OuiComboboxUpdate | undefined;

	if (event.inputType.includes('delete')) {
		update = 'remove';
	} else if (event.inputType.includes('insert')) {
		update = 'typed';
	}

	if (update != null) {
		setNext(update, combobox, state, option);
	}
}

function onKeydown(event: KeyboardEvent): void {
	const combobox = findAncestor(event, TAGNAME);
	const state = states.get(combobox!);

	if (combobox == null || state == null) {
		return;
	}

	const isSelect = state.type === 'select';

	let preventDefault = true;

	switch (true) {
		case event.key === ' ': {
			preventDefault = !state.floatable.open;

			state.floatable.show();

			break;
		}

		case event.key === 'Enter': {
			preventDefault = state.floatable.open;

			if (preventDefault) {
				onEnter(combobox, state);
			} else {
				// state.internals.form?.requestSubmit();
			}

			break;
		}

		case event.key === 'Escape':
			onEscape(state);
			break;

		case !isSelect && KEYS_SELECTION.has(event.key): {
			preventDefault = false;

			if (hasTextSelection(state.anchor)) {
				onSelection(combobox, state);
			}

			break;
		}

		case KEYS_NAVIGATION.has(event.key):
			onNavigation(event, combobox, state);
			break;

		default: {
			preventDefault = false;

			if (event.key === 'Tab') {
				onTab(combobox, state);
			}

			break;
		}
	}

	if (preventDefault) {
		event.preventDefault();
		event.stopPropagation();
	}
}

function onNavigation(
	event: KeyboardEvent,
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
): void {
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

	setNext(state.autocomplete.none ? 'none' : 'navigation', combobox, state, next);
}

function onSelection(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	state.filter.value = state.anchor instanceof HTMLInputElement ? state.anchor.value : '';

	filterOptions(state);

	setNext('set', combobox, state, state.active);
}

function onTab(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	if (combobox !== document.activeElement && !combobox.contains(document.activeElement)) {
		state.floatable.hide();
	}
}

function setDisabled(combobox: OuiComboboxElement, state: OuiComboboxState, value: boolean): void {
	setProperties('disabled', combobox, state, value);
}

function setLimit(
	type: 'max' | 'min',
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
	value?: unknown,
): void {
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

		setAttribute(combobox, type, actual);

		updateValidity(state);
	}
}

function setMaps(element: OuiComboboxElement, state: OuiComboboxState): void {
	comboboxes.set(state.content, element);

	states.set(element, state);
	states.set(state.content, state);
}

function setNext(
	update: OuiComboboxUpdate,
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
	next?: HTMLElement,
): void {
	for (const option of state.options) {
		setAttribute(option, ATTRIBUTE_OPTION_ACTIVE, option === next ? '' : undefined);
	}

	state.active = next;

	setAria(state.anchor, 'activedescendant', next?.id);

	next?.scrollIntoView(scrollOptions);

	// TODO: offset scroll to prevent options under headers

	setValue(update, combobox, state, next);
}

function setProperties(
	key: 'disabled' | 'readonly' | 'required',
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
	value: boolean,
): void {
	state[key] = value;

	const elements = [combobox, state.anchor, state.filter];

	for (const element of elements) {
		setAria(element, key, value);
		setProperty(element, key as never, value as never);
	}
}

function setReadonly(combobox: OuiComboboxElement, state: OuiComboboxState, value: boolean): void {
	setProperties('readonly', combobox, state, value);
}

function setRequired(combobox: OuiComboboxElement, state: OuiComboboxState, value: boolean): void {
	setProperties('required', combobox, state, value);
	updateValidity(state);
}

function setValue(
	update: OuiComboboxUpdate,
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
	next?: HTMLElement,
): void {
	if (state.disabled || state.readonly || (state.type === 'select' && update !== 'set')) {
		return;
	}

	let added: boolean | undefined;
	let shouldUpdate: boolean;
	let values: string[];

	if (update === 'set' || !(state.anchor instanceof HTMLInputElement)) {
		added = updateSelected(update, state, next);

		[values, shouldUpdate] = getFormValues(state, added);
	} else {
		for (const option of state.options) {
			setAria(option, 'selected', false);
		}

		const input = state.anchor.value;

		const content = next?.textContent ?? '';
		const value = next == null ? '' : (getData(next, 'value')?.toString() ?? '');

		let selected: HTMLElement | undefined;

		if (content.toLocaleLowerCase() === input.toLocaleLowerCase()) {
			values = [value];

			if (next != null) {
				selected = next;

				setAria(next, 'selected', true);
			}
		} else {
			values = [state.autocomplete.none ? input : ''];
		}

		state.selected = selected == null ? [] : [selected];

		shouldUpdate = state.values.current[0] !== values[0];
	}

	if (shouldUpdate) {
		updateForm(combobox, state, values);
	}

	if (next == null) {
		return;
	}

	if (state.type === 'select') {
		updateSelect(update, state, next, added);
	} else if (update !== 'remove') {
		updateAutoComplete(update, state, next);
	}

	if (update === 'set' && !state.multiple) {
		state.floatable.hide();
	}
}

function setValues(combobox: OuiComboboxElement, state: OuiComboboxState, value: unknown): void {
	if (!Array.isArray(value)) {
		return;
	}

	const strings = (state.multiple ? value : value.slice(0, 1)).map(value =>
		getString(value).toLocaleLowerCase(),
	);

	const selected: HTMLElement[] = [];
	const values: string[] = [];

	let next: HTMLElement | undefined;

	for (const option of state.options) {
		const value = getData(option, 'value')?.toString() ?? '';

		if (value == null || !strings.includes(value.toLocaleLowerCase())) {
			continue;
		}

		selected.push(option);
		values.push(value);

		next ??= option;
	}

	for (const option of state.selected) {
		setAria(option, 'selected', false);

		state.selection?.querySelector(`[data-option="${option.id}"]`)?.remove();
	}

	for (const option of selected) {
		setAria(option, 'selected', true);

		state.selection?.append(createSelectionItem(option));
	}

	state.selected = selected.slice();

	setNext('navigation', combobox, state, next);

	updateForm(combobox, state, values);
}

function updateAutoComplete(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	next: HTMLElement,
): void {
	if (!(update === 'set' || state.autocomplete.both || state.autocomplete.inline)) {
		return;
	}

	const content = next.textContent ?? '';

	if (
		update === 'typed' &&
		!content.toLocaleLowerCase().startsWith(state.filter.value.toLocaleLowerCase())
	) {
		return;
	}

	if (state.anchor instanceof HTMLInputElement) {
		const contentLength = content.length;
		const filterLength = state.filter.value.length;

		state.anchor.value = content;

		state.anchor.setSelectionRange(
			update === 'typed' ? filterLength : contentLength,
			contentLength,
		);
	} else {
		state.anchor.textContent = content;
	}
}

function updateForm(combobox: OuiComboboxElement, state: OuiComboboxState, values: string[]): void {
	const formValues = values.length === 0 ? [''] : values;

	const formData = new FormData();

	for (const value of formValues) {
		formData.append(state.name, value);
	}

	state.values.current = formValues;

	state.internals.setFormValue(formData);

	updateValidity(state);

	dispatch(combobox, 'change');
	dispatch(combobox, 'input');
}

function updateSelect(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	next: HTMLElement,
	added?: boolean,
): void {
	if (update !== 'set') {
		return;
	}

	if (!state.multiple) {
		state.anchor.textContent = next.textContent ?? '';

		return;
	}

	if (added === true) {
		state.selection?.append(createSelectionItem(next));
	} else if (added === false) {
		state.selection?.querySelector(`[data-option="${next.id}"]`)?.remove();
	}
}

function updateSelected(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	next?: HTMLElement,
): boolean | undefined {
	for (const option of state.options) {
		setAria(option, 'selected', getSelected(update, state, option, next));
	}

	if (next == null) {
		return;
	}

	if (state.type !== 'select') {
		state.selected = [next];

		return;
	}

	if (update !== 'set') {
		return;
	}

	if (!state.multiple) {
		state.selected = [next];

		return;
	}

	const index = state.selected.indexOf(next);
	const added = index === -1;

	if (added) {
		state.selected.push(next);
	} else {
		state.selected.splice(index, 1);
	}

	return added;
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

	const rangeOverflow =
		state.multiple && typeof state.max === 'number' && state.selected.length > state.max;

	const rangeUnderflow =
		state.multiple && typeof state.min === 'number' && state.selected.length < state.min;

	const badInput = state.required && state.selected.length === 0;

	state.internals.setValidity(
		{
			badInput,
			rangeOverflow,
			rangeUnderflow,
		},
		join(
			[
				badInput ? INVALID_BAD : undefined,
				rangeOverflow ? INVALID_OVERFLOW.replace('{max}', state.max!.toString()) : undefined,
				rangeUnderflow ? INVALID_UNDERFLOW.replace('{min}', state.min!.toString()) : undefined,
			],
			'; ',
		),
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

const KEYS_NAVIGATION = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

const KEYS_SELECTION = new Set(['ArrowRight', 'End']);

const MESSAGE_LABEL = `<${TAGNAME}> must contain a <label> element for the <select> element`;

const MESSAGE_SELECT = `<${TAGNAME}> must contain a valid <select> element`;

const SELECTOR_ANCHOR = `[${ATTRIBUTE_ANCHOR}]`;

const SELECTOR_OPTION = `[${ATTRIBUTE_OPTION}]`;

const TYPES = new Set<OuiComboboxType>(['autocomplete', 'select']);

const comboboxes = new WeakMap<HTMLElement, OuiComboboxElement>();

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
