import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {getData} from '@oscarpalmer/toretto/data';
import {
	COMBOBOX_ATTRIBUTE_ANCHOR,
	COMBOBOX_ATTRIBUTE_CONTENT,
	COMBOBOX_ATTRIBUTE_FILTER,
	COMBOBOX_ATTRIBUTE_FILTER_INPUT,
	COMBOBOX_ATTRIBUTE_HEADER,
	COMBOBOX_ATTRIBUTE_HIDDEN,
	COMBOBOX_ATTRIBUTE_LIST,
	COMBOBOX_ATTRIBUTE_MESSAGE,
	COMBOBOX_ATTRIBUTE_OPTION,
	COMBOBOX_ATTRIBUTE_OPTION_ACTIVE,
	COMBOBOX_ATTRIBUTE_SELECTION,
	COMBOBOX_ATTRIBUTE_SELECTION_ITEM,
	comboboxScrollOptions,
} from './constants.combobox';
import {updateComboboxValidity} from './form.combobox';
import type {
	OuiComboboxAutoComplete,
	OuiComboboxAutoCompleteType,
	OuiComboboxGroup,
	OuiComboboxPreview,
	OuiComboboxSelection,
	OuiComboboxSelectionItem,
	OuiComboboxState,
	OuiComboboxType,
} from './models.combobox';
import {getLocalization, localize} from '../l10n';
import {comboboxLocalizations} from './state.combobox';

// #region Types

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

// #endregion

// #region Functions

export function createComboboxAnchor(parameters: CreatAnchorParameters): CreateAnchor {
	const {autocomplete, id, label, select, type} = parameters;

	let container: HTMLElement | undefined;
	let element: HTMLElement;
	let selection: OuiComboboxSelection | undefined;

	if (parameters.type === 'autocomplete') {
		element = createComboboxInput({
			id,
			label,
			type,
			autocomplete: autocomplete.value,
			value: select.selectedOptions[0]?.textContent ?? '',
		});
	} else {
		({container, element, selection} = createComboboxButton(parameters));
	}

	setAttribute(container ?? element, COMBOBOX_ATTRIBUTE_ANCHOR, '');

	return {container, element, selection};
}

export function createComboboxButton(parameters: CreatAnchorParameters): CreateAnchor {
	const {id, label, multiple, select} = parameters;

	const element = createElement('button', {
		aria: {
			controls: `${id}_content`,
			expanded: false,
			haspopup: 'listbox',
			labelledby: `${label.id} ${id}`,
		},
		property: {
			textContent: multiple ? '' : (select.selectedOptions[0]?.textContent ?? ''),
		},
	});

	if (!multiple) {
		return {element};
	}

	const container = createElement('div');
	const selection = createComboboxSelection(id, select);

	container.append(selection.container, element);

	return {container, element, selection};
}

export function createComboboxContent(parameters: CreateContentParameters): CreateContent {
	const {autocomplete, id, label, multiple, select, type} = parameters;

	const element = createElement('div', {
		aria: {
			labelledby: label.id,
		},
		attribute: {
			[COMBOBOX_ATTRIBUTE_CONTENT]: '',
			popover: '',
		},
		property: {
			id: `${id}_content`,
			tabIndex: -1,
		},
	});

	const filter = createComboboxFilter({id, label, type, autocomplete: autocomplete.value});
	const list = createComboboxList({autocomplete, id, label, multiple, select});
	const message = createComboboxMessage();

	if (filter != null) {
		element.append(filter.container);
	}

	element.append(list.element, message);

	return {element, filter, list, message};
}

export function createComboboxFilter(parameters: CreateFilterParameters): CreateFilter | undefined {
	const {autocomplete, id, label, type} = parameters;

	if (type === 'autocomplete') {
		return;
	}

	const container = createElement('div', {
		attribute: {
			[COMBOBOX_ATTRIBUTE_FILTER]: '',
		},
	});

	const element = createComboboxInput({autocomplete, id, label, type, value: ''});

	setAttribute(element, COMBOBOX_ATTRIBUTE_FILTER_INPUT, '');

	container.append(element);

	return {container, element};
}

export function createComboboxGroup(parameters: CreateGroupParameters): OuiComboboxGroup {
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

	const header = createComboboxHeader(group);

	element.append(header, list);

	return {
		element,
		header,
		options: createComboboxOptions({
			autocomplete,
			list,
			selected,
			group: header.id,
			options: groupOptions,
		}),
	};
}

export function createComboboxHeader(group: HTMLOptGroupElement): HTMLElement {
	return createElement('div', {
		aria: {
			hidden: true,
		},
		attribute: {
			[COMBOBOX_ATTRIBUTE_HEADER]: '',
		},
		property: {
			id: group.id,
			textContent: group.label,
		},
	});
}

export function createComboboxInput(parameters: CreateInputParameters): HTMLInputElement {
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

export function createComboboxList(parameters: CreateListParameters): CreateList {
	const {autocomplete, id, label, multiple, select} = parameters;

	const element = createElement('ul', {
		aria: {
			labelledby: label.id,
			multiselectable: multiple,
		},
		attribute: {
			[COMBOBOX_ATTRIBUTE_LIST]: '',
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
			const option = createComboboxOption({
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

		const group = createComboboxGroup({
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

export function createComboboxMessage(): HTMLElement {
	return createElement('div', {
		aria: {
			live: 'polite',
		},
		attribute: {
			[COMBOBOX_ATTRIBUTE_MESSAGE]: '',
		},
		property: {
			hidden: true,
			role: 'status',
		},
	});
}

export function createComboboxOption(parameters: CreateOptionParameters): HTMLElement {
	const {autocomplete, group, option} = parameters;

	return createElement('li', {
		aria: {
			selected: !autocomplete.none && option.selected,
		},
		attribute: {
			[COMBOBOX_ATTRIBUTE_OPTION]: '',
		},
		data: {
			group,
			value: option.value,
		},
		property: {
			id: option.id,
			role: 'option',
			textContent: option.textContent,
		},
	});
}

export function createComboboxOptions(parameters: CreateOptionsParameters): HTMLElement[] {
	const {autocomplete, group, list, options, selected} = parameters;

	const items: HTMLElement[] = [];

	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];

		const item = createComboboxOption({autocomplete, group, index, option});

		items.push(item);

		if (option.selected) {
			selected.push(item);
		}

		list.append(item);
	}

	return items;
}

export function createComboboxSelection(
	id: string,
	select: HTMLSelectElement,
): OuiComboboxSelection {
	const container = createElement('ul', {
		attribute: {
			[COMBOBOX_ATTRIBUTE_SELECTION]: '',
		},
		property: {
			id: `${id}_selection`,
		},
	});

	const options = [...select.selectedOptions];

	const items: OuiComboboxSelectionItem[] = [];

	createComboboxSelectionItems({container, items, options});

	const {button} = items[0] ?? {};

	if (button != null) {
		button.tabIndex = 0;
	}

	return {
		items,
		container: container,
	};
}

export function createComboboxSelectionItem(
	option: HTMLElement,
	state?: OuiComboboxState,
): OuiComboboxSelectionItem {
	const optionLabel = option.textContent;
	const optionValue = getData(option, 'value', false) ?? '';

	const element = createElement('li');

	const localization =
		state == null
			? option.textContent
			: getLocalization(comboboxLocalizations, state.host, 'remove', state.localizations);

	const button = createElement('button', {
		aria: {
			label: localize(
				localization,
				{
					label: optionLabel,
					value: optionValue,
				},
				[optionLabel, optionValue],
			),
		},
		attribute: {
			[COMBOBOX_ATTRIBUTE_SELECTION_ITEM]: '',
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

export function createComboboxSelectionItems(parameters: CreateSelectionItemsParameters): void {
	const {container, items, options, state} = parameters;

	const {length} = options;

	for (let index = 0; index < length; index += 1) {
		const option = options[index];

		const item = createComboboxSelectionItem(option, state);

		container.append(item.element);
		items.push(item);
	}
}

export function setComboboxDisabled(state: OuiComboboxState, value: boolean): void {
	state.filter.element.readOnly = state.readonly || value;

	setProperties('disabled', state, value);
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

export function setComboboxReadonly(state: OuiComboboxState, value: boolean): void {
	state.filter.element.readOnly = state.disabled || value;

	setProperties('readonly', state, value);
}

export function setComboboxRequired(state: OuiComboboxState, value: boolean): void {
	setProperties('required', state, value);
	updateComboboxValidity(state);
}

export function updateComboboxTabindices(state: OuiComboboxState, active?: HTMLElement): void {
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

export function updateComboboxAnchor(state: OuiComboboxState): void {
	if (!state.multiple) {
		return;
	}

	const localization = getLocalization(
		comboboxLocalizations,
		state.host,
		'selected',
		state.localizations,
	);

	const {length} = state.options.selected;

	setAria(state.anchor.element, 'label', localize(localization, {amount: length}, [length]));
}

export function updateComboboxAutocomplete(
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

export function updateComboboxMessage(state: OuiComboboxState, visible: number): void {
	setAttribute(state.message, COMBOBOX_ATTRIBUTE_HIDDEN, visible > 0 ? '' : undefined);

	if (visible === 0) {
		const localization = getLocalization(
			comboboxLocalizations,
			state.host,
			'empty',
			state.localizations,
		);

		state.message.textContent = localize(localization, {}, []);
	} else {
		const localization = getLocalization(
			comboboxLocalizations,
			state.host,
			'results',
			state.localizations,
		);

		state.message.textContent = localize(localization, {amount: visible}, [visible]);
	}

	state.message.hidden = false;
}

export function updateComboboxPreview(
	preview: OuiComboboxPreview,
	state: OuiComboboxState,
	active?: HTMLElement,
): void {
	const {length} = state.options.all;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		setAttribute(option, COMBOBOX_ATTRIBUTE_OPTION_ACTIVE, option === active ? '' : undefined);
	}

	state.active = active;

	setAria(state.filter.element, 'activedescendant', state.floatable.open ? active?.id : undefined);

	if (state.floatable.open) {
		active?.scrollIntoView(comboboxScrollOptions);
	}

	if (preview !== 'none') {
		updateComboboxAutocomplete(preview, state, active);
	}
}

export function updateComboboxSelection(
	state: OuiComboboxState,
	active: HTMLElement | undefined,
	added: boolean,
	selected?: HTMLElement[],
): void {
	if (state.selection == null) {
		return;
	}

	let options = active == null ? [] : [active];

	if (added && selected != null) {
		options = selected;

		const {length} = state.selection.items;

		for (let index = 0; index < length; index += 1) {
			state.selection.items[index].element.remove();
		}

		state.selection.items.splice(0);
	}

	if (added) {
		createComboboxSelectionItems({
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

export function updateComboboxSelectionItems(state: OuiComboboxState): void {
	if (state.selection == null) {
		return;
	}

	const localization = getLocalization(
		comboboxLocalizations,
		state.host,
		'remove',
		state.localizations,
	);

	const {length} = state.selection.items;

	for (let index = 0; index < length; index += 1) {
		const item = state.selection.items[index];

		const option = state.options.selected.find(
			option => option.id === getData(item.button, 'option', false),
		);

		if (option == null) {
			continue;
		}

		const optionLabel = option.textContent;
		const optionValue = getData(option, 'value', false) ?? '';

		setAria(
			item.button,
			'label',
			localize(
				localization,
				{
					label: optionLabel,
					value: optionValue,
				},
				[optionLabel, optionValue],
			),
		);
	}
}

// #endregion
