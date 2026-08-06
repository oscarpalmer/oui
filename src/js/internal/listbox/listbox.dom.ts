import {createElement, setAria, setAttribute} from '@oscarpalmer/toretto';
import {getLocalization, localize} from '../../l10n';
import {listboxScrollOptions} from './listbox.constants';
import {getListboxVisibleOptions} from './listbox.misc';
import type {
	OuiListboxAttributes,
	OuiListboxAutoComplete,
	OuiListboxGroup,
	OuiListboxLocalizations,
	OuiListboxOptions,
	OuiListboxPreview,
	OuiListboxState,
	OuiListboxType,
} from './listbox.model';

// #region Types

export type CreateListboxContent = {
	element: HTMLDivElement;
	filter?: CreateListboxFilter;
	list: CreateListboxList;
	message: HTMLDivElement;
	value: HTMLSpanElement;
};

export type CreateListboxContentParameters = {
	attributes: OuiListboxAttributes;
	autocomplete: OuiListboxAutoComplete;
	element: HTMLElement;
	id: string;
	label: HTMLLabelElement;
	multiple: boolean;
	select: HTMLSelectElement;
	type: OuiListboxType;
};

export type CreateListboxFilter = {
	container: HTMLElement;
	element: HTMLInputElement;
};

type CreateListboxGroupParameters = {
	group: HTMLOptGroupElement;
	groupOptions: HTMLOptionElement[];
	original: CreateListboxContentParameters;
	selected: HTMLElement[];
	type: OuiListboxType;
};

export type CreateListboxList = {
	element: HTMLUListElement;
	groups?: OuiListboxGroup[];
	options: OuiListboxOptions;
};

type CreateListboxOptionParameters = {
	group?: string;
	index: number;
	option: HTMLOptionElement;
	original: CreateListboxContentParameters;
	type: OuiListboxType;
};

type CreateListboxOptionsParameters = {
	group?: string;
	list: HTMLElement;
	options: HTMLOptionElement[];
	original: CreateListboxContentParameters;
	selected: HTMLElement[];
	type: OuiListboxType;
};

// #endregion

// #region Functions

export function createListboxContent(
	parameters: CreateListboxContentParameters,
): CreateListboxContent {
	const element = createElement('div', {
		attribute: {
			[parameters.attributes.content]: '',
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

	return {
		element,
		filter,
		list,
		message,
		value,
	};
}

export function createListboxFilter(
	parameters: CreateListboxContentParameters,
): CreateListboxFilter | undefined {
	if (parameters.type === 'autocomplete') {
		return;
	}

	const container = createElement('div', {
		attribute: {
			[parameters.attributes.filter]: '',
		},
	});

	const element = createListboxInput(parameters, '');

	setAttribute(element, parameters.attributes.input, '');

	container.append(element);

	return {container, element};
}

export function createListboxGroup(parameters: CreateListboxGroupParameters): OuiListboxGroup {
	const {group, groupOptions, selected, type} = parameters;

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

	const header = createListboxHeader(parameters, group);

	element.append(header, list);

	return {
		element,
		header,
		options: createListboxOptions({
			list,
			selected,
			type,
			group: header.id,
			options: groupOptions,
			original: parameters.original,
		}),
	};
}

export function createListboxHeader(
	parameters: CreateListboxGroupParameters,
	group: HTMLOptGroupElement,
): HTMLElement {
	return createElement('div', {
		aria: {
			hidden: true,
		},
		attribute: {
			[parameters.original.attributes.header]: '',
		},
		property: {
			id: group.id,
			textContent: group.label,
		},
	});
}

export function createListboxInput(
	parameters: CreateListboxContentParameters,
	value: string,
): HTMLInputElement {
	const {autocomplete, id, label, type} = parameters;

	return createElement('input', {
		aria: {
			autocomplete: autocomplete.value,
			controls: `${id}_list`,
			expanded: type === 'select',
			haspopup: 'listbox',
			labelledby: `${label.id} ${id}_value`,
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

export function createListboxList(parameters: CreateListboxContentParameters): CreateListboxList {
	const {attributes, id, label, multiple, select, type} = parameters;

	const element = createElement('ul', {
		aria: {
			labelledby: `${label.id} ${id}_value`,
			multiselectable: multiple,
		},
		attribute: {
			[attributes.list]: '',
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

	let groups: OuiListboxGroup[] | undefined;

	for (let childIndex = 0; childIndex < childrenLength; childIndex += 1) {
		const child = children[childIndex];

		if (child instanceof HTMLOptionElement) {
			const option = createListboxOption({
				type,
				option: child,
				original: parameters,
				index: childIndex,
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

		const group = createListboxGroup({
			selected,
			type,
			group: child,
			groupOptions: [...child.children] as HTMLOptionElement[],
			original: parameters,
		});

		groups ??= [];

		element.append(group.element, ...group.options);
		groups.push(group);
		options.push(...group.options);
	}

	return {
		element,
		groups,
		options: {
			selected,
			all: options,
		},
	};
}

export function createListboxMessage(attribute: string): HTMLDivElement {
	return createElement('div', {
		aria: {
			live: 'polite',
		},
		attribute: {
			[attribute]: '',
		},
		property: {
			hidden: true,
			role: 'status',
		},
	});
}

export function createListboxOption(parameters: CreateListboxOptionParameters): HTMLElement {
	const {group, option, original} = parameters;

	return createElement('li', {
		aria: {
			selected: (parameters.type === 'select' || !original.autocomplete.none) && option.selected,
		},
		attribute: {
			[original.attributes.option]: '',
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

export function createListboxOptions(parameters: CreateListboxOptionsParameters): HTMLElement[] {
	const {group, list, options, original, selected, type} = parameters;

	const items: HTMLElement[] = [];

	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];

		const item = createListboxOption({group, index, option, original, type});

		items.push(item);

		if (option.selected) {
			selected.push(item);
		}

		list.append(item);
	}

	return items;
}

export function createListboxValueLabel(id: string): HTMLSpanElement {
	return createElement('span', {
		property: {
			hidden: true,
			id: `${id}_value`,
		},
	});
}

export function updateListboxMessage(state: OuiListboxState): void {
	const {attributes, host, localizations, message} = state;

	const visible = getListboxVisibleOptions(state).length;

	setAttribute(message, attributes.hidden, visible > 0 ? '' : undefined);

	let data: Record<string, unknown> = {};
	let parameters: unknown[] = [];

	let key: keyof OuiListboxLocalizations | undefined;

	if (visible === 0) {
		key = 'empty';
	} else {
		data = {amount: visible};
		key = 'results';
		parameters = [visible];
	}

	const localization = getLocalization(localizations.global, host, key, localizations.component);

	message.textContent = localize(localization, data, parameters);

	message.hidden = false;
}

export function updateListboxPreview<State extends OuiListboxState>(
	preview: OuiListboxPreview,
	state: State,
	active?: HTMLElement,
	scroll?: boolean,
): void {
	const {length} = state.options.all;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		setAttribute(option, state.attributes.active, option === active ? '' : undefined);
	}

	state.active = active;

	setAria(
		state.filter.element,
		'activedescendant',
		state.content.checkVisibility() ? active?.id : undefined,
	);

	if (scroll ?? true) {
		active?.scrollIntoView(listboxScrollOptions);
	}

	if (preview !== 'none') {
		state.callbacks.data.onPreview(preview, state, active);
	}
}

export function updateListboxValueLabel<State extends OuiListboxState>(state: State): void {
	let label: string;

	if (state.multiple) {
		const localization = getLocalization(
			state.localizations.global,
			state.host,
			'selected',
			state.localizations.component,
		);

		const {length} = state.options.selected;

		label = localize(localization, {amount: length}, [length]);
	} else {
		label =
			state.autocomplete.none && !state.listbox
				? state.filter.element.value
				: (state.options.selected[0]?.textContent ?? '');
	}

	state.values.label.textContent = label;
}

// #endregion
