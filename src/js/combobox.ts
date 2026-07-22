import {clamp} from '@oscarpalmer/atoms/number';
import {getString, join} from '@oscarpalmer/atoms/string';
import {getAria, setAria, setRole} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {dispatch, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {setProperty} from '@oscarpalmer/toretto/property';
import {setStyle} from '@oscarpalmer/toretto/style';
import {createEmbeddedFloatable, type OuiFloatable} from './floatable/floatable.embedded';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[TAGNAME]: OuiComboboxElement;
	}
}

export class OuiComboboxElement extends HTMLElement {
	static formAssociated = true;

	static observedAttributes = ['disabled', 'max', 'min', 'readonly', 'required', 'value'];

	readonly #internals: ElementInternals;

	readonly #state: OuiComboboxState;

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
		return this.#state.values[0];
	}

	/**
	 * Set the value
	 */
	set value(value: unknown) {
		const [option, all] = getOption(this.#state, value);

		if (option != null) {
			setNext('set', this, this.#state, all, option);
		}
	}

	/**
	 * Current values
	 */
	get values(): string[] {
		return this.#state.values.slice();
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
		this.#state = getState(this, this.#internals);

		comboboxes.set(this.#state.content, this);

		states.set(this, this.#state);
		states.set(this.#state.content, this.#state);
	}

	attributeChangedCallback(name: string, _: string | null, value: string | null): void {
		switch (name) {
			case 'disabled':
			case 'readonly':
			case 'required':
			case 'value':
				this[name] = this.hasAttribute(name);
				break;

			case 'max':
			case 'min':
				setLimit(name, this, this.#state, value == null ? undefined : Number.parseInt(value, 10));
				break;

			default:
				break;
		}
	}

	clear(): void {
		setValues(this, this.#state, []);
	}

	formResetCallback(): void {
		this.#state.touched = false;

		this.clear();
	}
}

type OuiComboboxAutoComplete = Record<OuiComboboxAutoCompleteType, boolean> & {
	value: OuiComboboxAutoCompleteType;
};

type OuiComboboxAutoCompleteType = 'both' | 'inline' | 'list' | 'none';

type OuiComboboxState = {
	active?: HTMLElement;
	anchor: HTMLElement;
	autocomplete: OuiComboboxAutoComplete;
	content: HTMLElement;
	disabled: boolean;
	empty: HTMLElement;
	filter: string;
	floatable: OuiFloatable;
	id: string;
	internals: ElementInternals;
	label: HTMLLabelElement;
	listeners: RemovableEventListener[];
	max?: number;
	min?: number;
	name: string;
	multiple: boolean;
	readonly: boolean;
	required: boolean;
	select: HTMLSelectElement;
	selected: HTMLElement[];
	touched: boolean;
	type: OuiComboboxType;
	values: string[];
};

type OuiComboboxType = 'autocomplete' | 'select';

type OuiComboboxUpdate = 'navigation' | 'none' | 'remove' | 'set' | 'typed';

// #endregion

// #region Functions

function filterOptions(
	state: OuiComboboxState,
	options?: HTMLElement[],
	clear?: boolean,
): HTMLElement | undefined {
	if (clear || state.autocomplete.none) {
		state.filter = '';
	}

	const filter = state.filter.toLocaleLowerCase();

	const all = options ?? getOptions(state)[0];
	const {length} = all;

	const visible: HTMLElement[] = [];

	for (let index = 0; index < length; index += 1) {
		const option = all[index];

		option.hidden = option.textContent?.toLocaleLowerCase().includes(filter) === false;

		if (!option.hidden) {
			visible.push(option);
		}
	}

	state.empty.hidden = visible.length > 0;

	if (state.empty.hidden) {
		return state.active != null && visible.includes(state.active) ? state.active : visible[0];
	}
}

function generateIds(select: HTMLSelectElement, prefix: string): void {
	const options = [...select.options];
	const {length} = options;

	for (let index = 0; index < length; index += 1) {
		const option = options[index];

		if (option.id === '') {
			option.id = `${prefix}_option_${index}`;
		}
	}
}

function getAnchor(
	type: OuiComboboxType,
	id: string,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	autocomplete: OuiComboboxAutoComplete,
	multiple: boolean,
): HTMLElement {
	const anchor = type === 'autocomplete' ? getInput(id, select) : getBox(id, select, multiple);

	setAria(anchor, {
		autocomplete: type === 'autocomplete' ? autocomplete.value : undefined,
		controls: `${id}_content`,
		expanded: false,
		haspopup: 'listbox',
		labelledby: label.id,
	});

	setAttribute(anchor, ATTRIBUTE_ANCHOR, '');

	setRole(anchor, 'combobox');

	return anchor;
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

function getBox(id: string, select: HTMLSelectElement, multiple: boolean): HTMLElement {
	const box = createElement('div', {
		id,
		tabIndex: 0,
		textContent: multiple ? '' : (select.selectedOptions[0]?.textContent ?? ''),
	});

	if (multiple) {
		const selection = createElement(
			'ul',
			{
				// tabIndex: 0, TODO: handle navigation
			},
			{
				[ATTRIBUTE_SELECTION]: '',
			},
		);

		for (const option of select.selectedOptions) {
			selection.append(getSelectionItem(option));
		}

		box.append(selection);
	}

	return box;
}

function getContent(
	id: string,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	autocomplete: OuiComboboxAutoComplete,
	multiple: boolean,
): [HTMLElement, HTMLElement[], HTMLElement] {
	const content = createElement(
		'div',
		{
			id: `${id}_content`,
		},
		{
			[ATTRIBUTE_CONTENT]: '',
			popover: '',
			tabindex: -1,
			'aria-labelledby': label.id,
		},
	);

	const list = createElement(
		'ul',
		{
			role: 'listbox',
		},
		{
			[ATTRIBUTE_LIST]: '',
			'aria-labelledby': label.id,
			'aria-multiselectable': multiple,
		},
	);

	const options = [...select.options];

	const selected: HTMLElement[] = [];

	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];

		const item = createElement(
			'li',
			{
				id: option.id,
				textContent: option.textContent,
			},
			{
				[ATTRIBUTE_OPTION]: '',
				[ATTRIBUTE_OPTION_ACTIVE]: index === 0 ? '' : undefined,
				role: 'option',
				value: option.value,
				'aria-selected': !autocomplete.none && option.selected,
			},
		);

		if (option.selected) {
			selected.push(item);
		}

		list.append(item);
	}

	const empty = createElement(
		'div',
		{
			hidden: true,
			role: 'status',
			textContent: 'No results found',
		},
		{
			[ATTRIBUTE_EMPTY]: '',
			'aria-live': 'polite',
		},
	);

	content.append(list, empty);

	return [content, selected, empty];
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
				? state.selected.map(option => getAttribute(option, 'value') ?? '')
				: state.values;
	} else {
		values = [getAttribute(state.selected[0], 'value') ?? ''];
	}

	const previous = getFormValue(state, state.values);
	const next = getFormValue(state, values);

	return [values, next !== previous];
}

function getId(): string {
	index += 1;

	return `oui_combobox_${index}`;
}

function getInput(id: string, select: HTMLSelectElement): HTMLInputElement {
	return createElement(
		'input',
		{
			id,
			value: select.selectedOptions[0]?.textContent ?? '',
		},
		{
			[ATTRIBUTE_ANCHOR]: '',
			autocomplete: 'off',
			type: 'text',
		},
	);
}

function getOption(
	state: OuiComboboxState,
	value: unknown,
): [HTMLElement | undefined, HTMLElement[]] {
	const [all] = getOptions(state);
	const valueAsString = getString(value).toLocaleLowerCase();

	filterOptions(state, all, true);

	let match: HTMLElement | undefined;

	for (const option of all) {
		if (getAttribute(option, 'value')?.toLocaleLowerCase() === valueAsString) {
			match = option;

			break;
		}
	}

	return [match, all];
}

function getOptions(state: OuiComboboxState): HTMLElement[][] {
	const all = [...state.content.querySelectorAll(`[${ATTRIBUTE_OPTION}]`)].filter(
		option => option instanceof HTMLElement,
	);

	const visible = all.filter(option => !option.hidden);

	return [all, visible];
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

	const selected = getAria(element, 'selected') === 'true';

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

function getSelectionItem(option: HTMLElement): HTMLElement {
	const icon = createElement(
		'span',
		{
			innerHTML: '&times;',
		},
		{
			'aria-hidden': true,
		},
	);

	const label = createElement('span', {
		textContent: option.textContent,
	});

	const item = createElement(
		'li',
		{},
		{
			[ATTRIBUTE_SELECTION_ITEM]: '',
			option: option.id,
		},
	);

	item.append(icon, label);

	return item;
}

function getState(element: OuiComboboxElement, internals: ElementInternals): OuiComboboxState {
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

	generateIds(select, id);

	const anchor = getAnchor(type, id, label, select, autocomplete, multiple);

	const [content, selected, empty] = getContent(id, label, select, autocomplete, multiple);

	const values =
		selected.length === 0 ? [''] : selected.map(option => getAttribute(option, 'value') ?? '');

	const floatable = createEmbeddedFloatable(anchor, content, {
		position: 'below-start',
		reusable: false,
	});

	floatable.update();

	select.insertAdjacentElement('afterend', anchor);
	anchor.insertAdjacentElement('afterend', content);

	select.remove();

	const state: OuiComboboxState = {
		anchor,
		autocomplete,
		content,
		disabled,
		empty,
		floatable,
		id,
		internals,
		label,
		multiple,
		readonly,
		required,
		select,
		selected,
		type,
		values,
		filter: '',
		listeners: [],
		name: element.name,
		touched: false,
	};

	state.listeners.push(
		on(anchor, 'blur', () => {
			state.touched = true;

			updateValidity(state);
		}),
		on(content, 'click', event => {
			onContent(event, content);
		}),
		on(content, 'toggle', () => {
			setAria(anchor, {
				activedescendant: floatable.open ? state.active?.id : undefined,
				expanded: floatable.open,
			});

			if (floatable.open) {
				updateWidth(state);
			}
		}),
	);

	setDisabled(element, state, disabled);

	return state;
}

function hasTextSelection(element: HTMLElement): element is HTMLInputElement {
	return element instanceof HTMLInputElement && element.selectionStart !== element.selectionEnd;
}

function onAnchor(
	event: KeyboardEvent,
	handler: (event: KeyboardEvent, combobox: OuiComboboxElement, state: OuiComboboxState) => void,
): void {
	if (event.ctrlKey || event.metaKey || event.shiftKey) {
		return;
	}

	const combobox = findAncestor(event, TAGNAME);
	const state = states.get(combobox!);

	if (combobox == null || state == null) {
		return;
	}

	const anchor = findAncestor(event, SELECTOR_ANCHOR);

	if (anchor != null) {
		handler(event, combobox, state);
	}
}

function onAnchorKeydown(
	event: KeyboardEvent,
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
): void {
	const isSelect = state.type === 'select';

	let preventDefault = true;

	switch (true) {
		case event.key === ' ' && state.type === 'select':
		case event.key === 'Enter':
			onEnter(combobox, state);
			break;

		case event.key === 'Escape':
			onEscape(state);
			break;

		case isSelect && KEYS_ABSOLUTE.has(event.key):
			onNavigation(event, combobox, state);
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

function onAnchorKeyup(
	event: KeyboardEvent,
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
): void {
	const typed = event.key.length === 1 && EXPRESSION_TYPED.test(event.key);

	if (state.type === 'select') {
		if (typed) {
			event.preventDefault();
			event.stopPropagation();

			onScrollTo(event, combobox, state);
		}

		return;
	}

	let preventDefault = true;

	if (typed) {
		state.filter += event.key;
	}

	if (
		state.anchor instanceof HTMLInputElement &&
		(KEYS_REMOVE.has(event.key) || state.anchor.value.length < state.filter.length)
	) {
		state.filter = state.anchor.value;

		filterOptions(state);
	}

	switch (true) {
		case typed:
			onTyped(combobox, state);
			break;

		case KEYS_REMOVE.has(event.key):
			onRemove(combobox, state);
			break;

		default: {
			preventDefault = false;

			break;
		}
	}

	if (preventDefault) {
		event.preventDefault();
		event.stopPropagation();
	}
}

function onClick(event: PointerEvent): void {
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
		const option = state.selected.find(option => option.id === getAttribute(selection, 'option'));

		setValue('set', combobox, state, option);

		return;
	}

	const anchor = findAncestor(event, SELECTOR_ANCHOR);

	if (anchor != null) {
		state.floatable.show();

		return;
	}
}

function onContent(event: PointerEvent, content: HTMLElement): void {
	const combobox = comboboxes.get(content);
	const state = states.get(content);

	if (combobox == null || state == null) {
		return;
	}

	const option = findAncestor(event, SELECTOR_OPTION);

	if (option instanceof HTMLElement) {
		setNext('set', combobox, state, getOptions(state)[0], option);
	}

	state.anchor.focus();
}

function onEnter(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	if (hasTextSelection(state.anchor)) {
		onSelection(combobox, state);

		return;
	}

	if (!state.floatable.open) {
		state.floatable.show();

		return;
	}

	setNext('set', combobox, state, getOptions(state)[0], state.active);
}

function onEscape(state: OuiComboboxState): void {
	state.floatable.hide();
}

function onKeydown(event: KeyboardEvent): void {
	onAnchor(event, onAnchorKeydown);
}

function onKeyup(event: KeyboardEvent): void {
	onAnchor(event, onAnchorKeyup);
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

	const [all, visible] = getOptions(state);

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

	setNext(state.autocomplete.none ? 'none' : 'navigation', combobox, state, all, next);
}

function onRemove(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	const [all] = getOptions(state);

	const next = filterOptions(state, all);

	setNext('remove', combobox, state, all, next);
}

function onScrollTo(
	event: KeyboardEvent,
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
): void {
	const [all] = getOptions(state);

	const key = event.key.toLocaleLowerCase();

	const next =
		all.find(option => option.textContent?.toLocaleLowerCase().startsWith(key) === true) ??
		all.find(option => option.textContent?.toLocaleLowerCase().includes(key) === true);

	if (next != null) {
		setNext('navigation', combobox, state, all, next);
	}
}

function onSelection(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	state.filter = state.anchor instanceof HTMLInputElement ? state.anchor.value : '';

	filterOptions(state);

	setNext('set', combobox, state, getOptions(state)[0], state.active);
}

function onTab(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	if (combobox !== document.activeElement || !combobox.contains(document.activeElement)) {
		state.floatable.hide();
	}
}

function onTyped(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	if (
		!state.autocomplete.inline &&
		state.anchor instanceof HTMLInputElement &&
		state.anchor.value.length > 0
	) {
		state.floatable.show();
	}

	const options = getOptions(state)[0];

	const next = state.autocomplete.none ? (state.active ?? options[0]) : filterOptions(state);

	setNext('typed', combobox, state, options, next);
}

function setDisabled(combobox: OuiComboboxElement, state: OuiComboboxState, value: boolean): void {
	state.disabled = value;

	setAria(state.anchor, 'disabled', value);
	setProperty(combobox, 'disabled', value);

	if (state.anchor instanceof HTMLInputElement) {
		state.anchor.readOnly = value;
	}
}

function setLimit(
	type: 'max' | 'min',
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
	value?: number,
): void {
	const updateLimit =
		typeof value === 'number' && !Number.isNaN(value) ? value !== state[type] : value == null;

	if (updateLimit) {
		state[type] = value;

		setAttribute(combobox, type, value);

		updateValidity(state);
	}
}

function setNext(
	update: OuiComboboxUpdate,
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
	all: HTMLElement[],
	next?: HTMLElement,
): void {
	for (const option of all) {
		setAttribute(option, ATTRIBUTE_OPTION_ACTIVE, option === next ? '' : undefined);
	}

	state.active = next;

	setAria(state.anchor, 'activedescendant', next?.id);

	next?.scrollIntoView(scrollOptions);

	setValue(update, combobox, state, next);
}

function setReadonly(combobox: OuiComboboxElement, state: OuiComboboxState, value: boolean): void {
	state.readonly = value;

	setAria(state.anchor, 'readonly', value);
	setProperty(combobox, 'readonly', value);

	if (state.anchor instanceof HTMLInputElement) {
		state.anchor.readOnly = value;
	}
}

function setRequired(combobox: OuiComboboxElement, state: OuiComboboxState, value: boolean): void {
	state.required = value;

	setAria(state.anchor, 'required', value);
	setProperty(combobox, 'required', value);

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
		const [all] = getOptions(state);

		for (const option of all) {
			setAria(option, 'selected', false);
		}

		const input = state.anchor.value;

		const content = next?.textContent ?? '';
		const value = next == null ? '' : (getAttribute(next, 'value') ?? '');

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

		shouldUpdate = state.values[0] !== values[0];
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

	setTimeout(() => {
		updateWidth(state);
	});
}

function setValues(combobox: OuiComboboxElement, state: OuiComboboxState, value: unknown): void {
	if (!Array.isArray(value)) {
		return;
	}

	const strings = (state.multiple ? value : [value]).map(value =>
		getString(value).toLocaleLowerCase(),
	);

	const [all] = getOptions(state);

	const selected: HTMLElement[] = [];
	const values: string[] = [];

	let next: HTMLElement | undefined;

	for (const option of all) {
		const value = getAttribute(option, 'value');

		if (value == null || !strings.includes(value.toLocaleLowerCase())) {
			continue;
		}

		selected.push(option);
		values.push(value);

		next ??= option;
	}

	for (const option of state.selected) {
		setAria(option, 'selected', false);

		state.anchor.querySelector(`[${ATTRIBUTE_SELECTION_ITEM}][option="${option.id}"]`)?.remove();
	}

	for (const option of selected) {
		setAria(option, 'selected', true);

		state.anchor.querySelector(`[${ATTRIBUTE_SELECTION}]`)?.append(getSelectionItem(option));
	}

	state.selected = selected.slice();

	setNext('navigation', combobox, state, all, next);

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
		!content.toLocaleLowerCase().startsWith(state.filter.toLocaleLowerCase())
	) {
		return;
	}

	const {length} = content;

	if (state.anchor instanceof HTMLInputElement) {
		state.anchor.value = content;

		state.anchor.setSelectionRange(update === 'typed' ? state.filter.length : length, length);
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

	state.values = formValues;

	state.internals.setFormValue(formData);

	updateValidity(state);

	dispatch(combobox, 'change');
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
		state.anchor.querySelector(`[${ATTRIBUTE_SELECTION}]`)?.append(getSelectionItem(next));
	} else if (added === false) {
		state.anchor.querySelector(`[${ATTRIBUTE_SELECTION_ITEM}][option="${next.id}"]`)?.remove();
	}
}

function updateSelected(
	update: OuiComboboxUpdate,
	state: OuiComboboxState,
	next?: HTMLElement,
): boolean | undefined {
	const [all] = getOptions(state);

	for (const option of all) {
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
		const valueMissing = state.required && state.values[0].length === 0;

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
				rangeOverflow
					? getString(INVALID_OVERFLOW).replace('{max}', state.max!.toString())
					: undefined,
				rangeUnderflow
					? getString(INVALID_UNDERFLOW).replace('{min}', state.min!.toString())
					: undefined,
			],
			'; ',
		),
	);

	state.internals.checkValidity();
}

function updateWidth(state: OuiComboboxState): void {
	setStyle(state.content, PROPERTY_STYLE, `${state.anchor.getBoundingClientRect().width}px`);
}

// #endregion

// #region Variables

const TAGNAME = 'oui-combobox';

const ATTRIBUTE_ANCHOR = `${TAGNAME}-anchor`;

const ATTRIBUTE_CONTENT = `${TAGNAME}-content`;

const ATTRIBUTE_EMPTY = `${TAGNAME}-empty`;

const ATTRIBUTE_LIST = `${TAGNAME}-list`;

const ATTRIBUTE_OPTION = `${TAGNAME}-option`;

const ATTRIBUTE_OPTION_ACTIVE = `${TAGNAME}-option-active`;

const ATTRIBUTE_SELECTION = `${TAGNAME}-selection`;

const ATTRIBUTE_SELECTION_ITEM = `${TAGNAME}-selection-item`;

const AUTOCOMPLETES = new Set<OuiComboboxAutoCompleteType>(['both', 'inline', 'list', 'none']);

const EXPRESSION_TYPED = /\p{L}|\s/u;

const INVALID_BAD = 'Please select an option from the list';

const INVALID_INPUT = 'Please enter a value';

const INVALID_OVERFLOW = 'Please select fewer options (maximum is {max})';

const INVALID_UNDERFLOW = 'Please select more options (minimum is {min})';

const KEYS_ABSOLUTE = new Set(['End', 'Home']);

const KEYS_NAVIGATION = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

const KEYS_REMOVE = new Set(['Backspace', 'Delete']);

const KEYS_SELECTION = new Set(['ArrowRight', 'End']);

const MESSAGE_LABEL = `<${TAGNAME}> must contain a <label> element for the <select> element`;

const MESSAGE_SELECT = `<${TAGNAME}> must contain a valid <select> element`;

const PROPERTY_STYLE = '--oui-combobox-width';

const SELECTOR_ANCHOR = `[${ATTRIBUTE_ANCHOR}]`;

const SELECTOR_OPTION = `[${ATTRIBUTE_OPTION}]`;

const TYPES = new Set<OuiComboboxType>(['autocomplete', 'select']);

const comboboxes = new WeakMap<HTMLElement, OuiComboboxElement>();

const scrollOptions: ScrollIntoViewOptions = {
	behavior: 'smooth',
	block: 'nearest',
	inline: 'nearest',
};

const states = new WeakMap<HTMLElement, OuiComboboxState>();

let index = 0;

// #endregion

// #region Initialization

on(document, 'click', onClick);

on(document, 'keydown', onKeydown, {
	passive: false,
});

on(document, 'keyup', onKeyup, {
	passive: false,
});

customElements.define(TAGNAME, OuiComboboxElement);

// #endregion
