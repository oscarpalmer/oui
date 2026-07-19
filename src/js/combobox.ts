import {clamp} from '@oscarpalmer/atoms/number';
import {getString} from '@oscarpalmer/atoms/string';
import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute, setAttributes} from '@oscarpalmer/toretto/attribute';
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

	static observedAttributes = ['disabled', 'required', 'value'];

	readonly #internals: ElementInternals;

	readonly #state: OuiComboboxState;

	get disabled(): boolean {
		return this.#state?.disabled ?? false;
	}

	set disabled(value: boolean) {
		if (typeof value === 'boolean' && value !== this.#state.disabled) {
			setDisabled(this, this.#state, value);
		}
	}

	get multiple(): boolean {
		return this.hasAttribute('multiple');
	}

	get name(): string {
		return this.getAttribute('name') ?? '';
	}

	set name(value: string) {
		if (typeof value === 'string') {
			this.setAttribute('name', value);
		}
	}

	get required(): boolean {
		return this.hasAttribute('required');
	}

	set required(value: boolean) {
		if (typeof value === 'boolean' && value !== this.#state.required) {
			setRequired(this, this.#state, value);
		}
	}

	get type(): OuiComboboxType {
		return this.#state.type;
	}

	get value(): string {
		return this.#state.value;
	}

	set value(value: unknown) {
		const [option, all] = getOption(this.#state, value);

		if (option != null) {
			setNext(this, this.#state, all, 'set', option);
		}
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
				this.disabled = this.hasAttribute('disabled');
				break;

			case 'required':
				this.required = this.hasAttribute('required');
				break;

			case 'value':
				this.value = value;
				break;
		}
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
	filter: string;
	floatable: OuiFloatable;
	id: string;
	internals: ElementInternals;
	label: HTMLLabelElement;
	listeners: RemovableEventListener[];
	multiple: boolean;
	required: boolean;
	select: HTMLSelectElement;
	selected: HTMLElement[];
	type: OuiComboboxType;
	value: string;
};

type OuiComboboxType = 'autocomplete' | 'select';

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

	if (visible.length > 0) {
		return state.active != null && visible.includes(state.active) ? state.active : visible[0];
	}
}

function getAnchor(
	type: OuiComboboxType,
	id: string,
	element: OuiComboboxElement,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	autocomplete: OuiComboboxAutoComplete,
): HTMLElement {
	const anchor =
		type === 'autocomplete'
			? getInput(id, element, label, select)
			: getBox(id, element, label, select);

	setAria(anchor, 'autocomplete', autocomplete.value);

	setAttributes(anchor, {
		[ATTRIBUTE_ANCHOR]: '',
		'aria-controls': `${id}_content`,
		'aria-expanded': false,
		'aria-haspopup': 'listbox',
		'aria-labelledby': label.id,
		role: 'combobox',
	});

	return anchor;
}

function getAutoComplete(element: OuiComboboxElement, select: boolean): OuiComboboxAutoComplete {
	let value: OuiComboboxAutoCompleteType;

	if (select) {
		value = 'list';
	} else {
		const attribute = getAttribute(element, 'autocomplete') as OuiComboboxAutoCompleteType;

		value = AUTOCOMPLETES.has(attribute) ? attribute : 'none';
	}

	return {
		value,
		both: value === 'both',
		inline: value === 'inline',
		list: value === 'list',
		none: value === 'none',
	};
}

function getBox(
	id: string,
	element: OuiComboboxElement,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
): HTMLElement {
	return createElement('div', {
		id,
		innerHTML: select.selectedOptions[0]?.textContent ?? '',
		tabIndex: 0,
	});
}

function getContent(
	type: OuiComboboxType,
	id: string,
	element: OuiComboboxElement,
	anchor: HTMLElement,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
	autocomplete: OuiComboboxAutoComplete,
): [HTMLElement, HTMLElement[]] {
	const content = createElement(
		'div',
		{
			id: `${id}_content`,
		},
		{
			[ATTRIBUTE_CONTENT]: '',
			popover: '',
			role: 'listbox',
			tabindex: -1,
			'aria-labelledby': label.id,
		},
	);

	const list = createElement(
		'ul',
		{},
		{
			[ATTRIBUTE_LIST]: '',
		},
	);

	const options = [...select.options];

	const selected: HTMLElement[] = [];

	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];

		const item = createElement(
			'li',
			{
				id: `${id}_option_${index}`,
				textContent: option.textContent,
			},
			{
				[ATTRIBUTE_OPTION]: '',
				[ATTRIBUTE_OPTION_CURRENT]: index === 0 ? '' : undefined,
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

	content.append(list);

	return [content, selected];
}

function getId(): string {
	index += 1;

	return `oui_combobox_${index}`;
}

function getInput(
	id: string,
	element: OuiComboboxElement,
	label: HTMLLabelElement,
	select: HTMLSelectElement,
): HTMLInputElement {
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
	const valueAsString = getString(value);

	filterOptions(state, all, true);

	let match: HTMLElement | undefined;

	for (const option of all) {
		if (option.getAttribute('value')?.toLocaleLowerCase() === valueAsString) {
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
	update: 'navigation' | 'none' | 'set' | 'typed',
	state: OuiComboboxState,
	element: HTMLElement,
	next?: HTMLElement,
): boolean {
	if (state.autocomplete.none) {
		return false;
	}

	if (update === 'navigation') {
		if (state.autocomplete.both) {
			return element === next;
		}

		return getAria(element, 'selected') === 'true';
	}

	if (update === 'none') {
		return getAria(element, 'selected') === 'true';
	}

	if (update === 'set') {
		return element === next;
	}

	return state.autocomplete.both && element === next;
}

function getState(element: OuiComboboxElement, internals: ElementInternals): OuiComboboxState {
	const select = element.querySelector('select');

	if (select == null) {
		throw new Error(MESSAGE_SELECT);
	}

	const label = element.querySelector(`label[for="${select.id}"]`) as HTMLLabelElement;

	if (label == null) {
		throw new Error(MESSAGE_LABEL);
	}

	select.hidden = true;

	element.id = select.id;
	element.name = select.name === '' ? select.id : select.name;

	const disabled = element.disabled || select.disabled;
	const multiple = element.multiple || select.multiple;
	const required = element.required || select.required;

	const id = getId();
	const type = multiple ? 'select' : getType(element);

	const autocomplete = getAutoComplete(element, type === 'select');

	label.htmlFor = id;
	label.id = `${id}_label`;

	const anchor = getAnchor(type, id, element, label, select, autocomplete);
	const [content, selected] = getContent(type, id, element, anchor, label, select, autocomplete);

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
		floatable,
		id,
		internals,
		label,
		multiple,
		required,
		select,
		selected,
		type,
		filter: '',
		listeners: [],
		value: '',
	};

	state.listeners.push(
		on(content, 'click', event => {
			onContent(event, content);
		}),
		on(content, 'toggle', () => {
			setAria(anchor, {
				activedescendant: floatable.open ? state.active?.id : undefined,
				expanded: floatable.open,
			});

			if (floatable.open) {
				setStyle(content, '--oui-combobox-width', `${anchor.getBoundingClientRect().width}px`);
			}
		}),
	);

	setDisabled(element, state, disabled);

	return state;
}

function getType(element: OuiComboboxElement): OuiComboboxType {
	const type = getAttribute(element, ATTRIBUTE_TYPE) as OuiComboboxType;

	return TYPES.has(type) ? type : 'select';
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
	let preventDefault = true;

	switch (true) {
		case event.key === 'Enter':
			onEnter(combobox, state);
			break;

		case event.key === 'Escape':
			onEscape(combobox, state);
			break;

		case state.type === 'select' && KEYS_ABSOLUTE.has(event.key):
			onNavigation(event, combobox, state);
			break;

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
	if (state.type === 'select') {
		return;
	}

	let preventDefault = true;

	const typed = event.key.length === 1 && EXPRESSION_TYPED.test(event.key);

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
		}

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
		setNext(combobox, state, getOptions(state)[0], 'set', option);
	}

	state.anchor.focus();
}

function onEnter(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	if (state.floatable.open) {
		setNext(combobox, state, getOptions(state)[0], 'set', state.active);
	} else {
		state.floatable.show();
	}
}

function onEscape(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	if (!state.floatable.open) {
		return;
	}

	if (state.type === 'select') {
		state.floatable.hide();
	} else {
		setNext(combobox, state, getOptions(state)[0], 'set', state.active);
	}
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

	if (skip ?? state.active == null) {
		next = state.active ?? visible[0];
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

	setNext(combobox, state, all, state.autocomplete.none ? 'none' : 'navigation', next);
}

function onRemove(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	const [all] = getOptions(state);

	const next = filterOptions(state, all);

	setNext(combobox, state, all, 'none', next);
}

function onTab(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	if (combobox !== document.activeElement || !combobox.contains(document.activeElement)) {
		state.floatable.hide();
	}
}

function onTyped(combobox: OuiComboboxElement, state: OuiComboboxState): void {
	function open(): void {
		if (
			state.anchor instanceof HTMLInputElement &&
			state.anchor.value.length > 0 &&
			(state.autocomplete.both || state.autocomplete.list)
		) {
			state.floatable.show();
		}
	}

	if (!state.autocomplete.none) {
		const next = filterOptions(state);

		state.active =
			next != null &&
			next.textContent?.toLocaleLowerCase().indexOf(state.filter.toLocaleLowerCase()) === 0
				? next
				: undefined;

		if (next != null) {
			open();
		}

		setNext(combobox, state, getOptions(state)[0], 'typed', next);
	} else {
		open();
	}
}

function setDisabled(combobox: OuiComboboxElement, state: OuiComboboxState, value: boolean): void {
	state.disabled = value;

	setAria(state.anchor, 'disabled', value);
	setProperty(combobox, 'disabled', value);

	if (state.anchor instanceof HTMLInputElement) {
		state.anchor.readOnly = value;
	}
}

function setNext(
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
	all: HTMLElement[],
	update: 'navigation' | 'none' | 'set' | 'typed',
	next?: HTMLElement,
): void {
	for (const option of all) {
		setAttribute(option, ATTRIBUTE_OPTION_CURRENT, option === next ? '' : undefined);
	}

	state.active = next;

	setAria(state.anchor, 'activedescendant', next?.id);

	next?.scrollIntoView(scrollOptions);

	setValue(combobox, state, update, next);
}

function setRequired(combobox: OuiComboboxElement, state: OuiComboboxState, value: boolean): void {
	state.required = value;

	setAria(state.anchor, 'required', value);
	setProperty(combobox, 'required', value);
}

function setValue(
	combobox: OuiComboboxElement,
	state: OuiComboboxState,
	update: 'navigation' | 'none' | 'set' | 'typed',
	next?: HTMLElement,
): void {
	if (state.disabled) {
		return;
	}

	const [all] = getOptions(state);

	for (const option of all) {
		setAria(option, 'selected', getSelected(update, state, option, next));
	}

	state.select.value = next?.getAttribute('value') ?? '';

	if (state.value !== state.select.value) {
		state.value = state.select.value;

		state.internals.setFormValue(state.value);

		dispatch(combobox, 'change');
		dispatch(state.select, 'change');
	}

	if (next == null || update === 'none') {
		return;
	}

	if (update === 'set' || state.autocomplete.both || state.autocomplete.inline) {
		const textContent = next.textContent ?? '';

		if (state.anchor instanceof HTMLInputElement) {
			state.anchor.value = textContent;
		} else {
			state.anchor.innerHTML = textContent;
		}

		if (state.anchor instanceof HTMLInputElement) {
			state.anchor.setSelectionRange(
				update === 'typed' ? state.filter.length : textContent.length,
				textContent.length,
			);
		}
	}

	if (update === 'set') {
		state.floatable.hide();
	}
}

// #endregion

// #region Variables

const TAGNAME = 'oui-combobox';

const ATTRIBUTE_ANCHOR = `${TAGNAME}-anchor`;

const ATTRIBUTE_CONTENT = `${TAGNAME}-content`;

const ATTRIBUTE_LIST = `${TAGNAME}-list`;

const ATTRIBUTE_OPTION = `${TAGNAME}-option`;

const ATTRIBUTE_OPTION_CURRENT = `${TAGNAME}-option-current`;

const ATTRIBUTE_TYPE = 'type';

const AUTOCOMPLETES = new Set<keyof OuiComboboxAutoComplete>(['both', 'inline', 'list', 'none']);

const EXPRESSION_TYPED = /\p{L}|\s/u;

const KEYS_ABSOLUTE = new Set(['End', 'Home']);

const KEYS_NAVIGATION = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

const KEYS_REMOVE = new Set(['Backspace', 'Delete']);

const MESSAGE_LABEL = `<${TAGNAME}> must contain a <label> element for the <select> element`;

const MESSAGE_SELECT = `<${TAGNAME}> must contain a <select> element`;

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
