import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {getData} from '@oscarpalmer/toretto/data';
import {
	createListboxFilter,
	createListboxInput,
	createListboxList,
	createListboxMessage,
	createListboxValueLabel,
	type CreateListboxContent,
	type CreateListboxContentParameters,
} from '../internal/listbox/listbox.dom';
import type {OuiListboxPreview} from '../internal/listbox/listbox.model';
import {getLocalization, localize} from '../l10n';
import {
	COMBOBOX_ATTRIBUTE_ANCHOR,
	COMBOBOX_ATTRIBUTE_SELECTION,
	COMBOBOX_ATTRIBUTE_SELECTION_ITEM,
} from './constants.combobox';
import type {
	OuiComboboxSelection,
	OuiComboboxSelectionItem,
	OuiComboboxState,
} from './models.combobox';

// #region Types

type CreateAnchor = {
	container?: HTMLElement;
	element: HTMLElement;
	selection?: OuiComboboxSelection;
};

type CreateSelectionItemsParameters = {
	container: HTMLElement;
	items: OuiComboboxSelectionItem[];
	options: HTMLElement[];
	state?: OuiComboboxState;
};

// #endregion

// #region Functions

export function createComboboxAnchor(parameters: CreateListboxContentParameters): CreateAnchor {
	const {select} = parameters;

	let container: HTMLElement | undefined;
	let element: HTMLElement;
	let selection: OuiComboboxSelection | undefined;

	if (parameters.type === 'autocomplete') {
		element = createListboxInput(parameters, select.selectedOptions[0]?.textContent ?? '');
	} else {
		({container, element, selection} = createComboboxButton(parameters));
	}

	setAttribute(container ?? element, COMBOBOX_ATTRIBUTE_ANCHOR, '');

	return {container, element, selection};
}

export function createComboboxButton(parameters: CreateListboxContentParameters): CreateAnchor {
	const {id, label, multiple, select} = parameters;

	const element = createElement('button', {
		aria: {
			controls: `${id}_content`,
			expanded: false,
			haspopup: 'listbox',
			labelledby: `${label.id} ${id}_value`,
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

export function createComboboxContent(
	parameters: CreateListboxContentParameters,
): CreateListboxContent {
	const {id, label} = parameters;

	const element = createElement('div', {
		aria: {
			labelledby: label.id,
		},
		attribute: {
			[parameters.attributes.content]: '',
			popover: '',
		},
		property: {
			id: `${id}_content`,
			tabIndex: -1,
		},
	});

	const filter = createListboxFilter(parameters);
	const list = createListboxList(parameters);
	const message = createListboxMessage(parameters.attributes.message);
	const value = createListboxValueLabel(parameters.id);

	if (filter != null) {
		element.append(filter.container);
	}

	element.append(list.element, message, value);

	return {element, filter, list, message, value};
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
			: getLocalization(
					state.localizations.global,
					state.host,
					'remove',
					state.localizations.component,
				);

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

export function updateComboboxAutocomplete(
	preview: OuiListboxPreview,
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
		state.localizations.global,
		state.host,
		'remove',
		state.localizations.component,
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
