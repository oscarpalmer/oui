import type {PlainObject} from '@oscarpalmer/atoms/models';
import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import type {OuiLocalizationsValues} from '../l10n/l10n.model';
import {optionListScrollOptions} from './option-list.constants';
import {getOptionListVisibleOptions} from './option-list.misc';
import type {
	CreateOptionListContent,
	CreateOptionListContentParameters,
	CreateOptionListFilter,
	CreateOptionListGroupParameters,
	CreateOptionListList,
	CreateOptionListOptionParameters,
	CreateOptionListOptionsParameters,
	OptionListGroup,
	OptionListLocalizationValues,
	OptionListPreview,
	OptionListState,
} from './option-list.model';

// #region Functions

export function createOptionListContent(
	parameters: CreateOptionListContentParameters,
): CreateOptionListContent {
	const element = createElement('div', {
		attribute: {
			[parameters.attributes.content]: '',
		},
	});

	const filter = createOptionListFilter(parameters);
	const list = createOptionListList(parameters);
	const message = createOptionListMessage(parameters.attributes.message);
	const value = createOptionListValueLabel(parameters.id);

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

export function createOptionListFilter(
	parameters: CreateOptionListContentParameters,
): CreateOptionListFilter | undefined {
	if (parameters.type === 'autocomplete') {
		return;
	}

	const container = createElement('div', {
		attribute: {
			[parameters.attributes.filter]: '',
		},
	});

	const element = createOptionListInput(parameters, '');

	setAttribute(element, parameters.attributes.input, '');

	container.append(element);

	return {container, element};
}

export function createOptionListGroup(
	parameters: CreateOptionListGroupParameters,
): OptionListGroup {
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

	const header = createOptionListHeader(parameters, group);

	element.append(header, list);

	return {
		element,
		header,
		options: createOptionListOptions({
			list,
			selected,
			type,
			group: header.id,
			options: groupOptions,
			original: parameters.original,
		}),
	};
}

export function createOptionListHeader(
	parameters: CreateOptionListGroupParameters,
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

export function createOptionListInput(
	parameters: CreateOptionListContentParameters,
	value: string,
): HTMLInputElement {
	const {autocomplete, id, label, listbox, type} = parameters;

	const isAutocomplete = type === 'autocomplete';

	const input = createElement('input', {
		aria: {
			autocomplete: autocomplete.value,
			controls: `${id}_list`,
			haspopup: isAutocomplete ? 'listbox' : undefined,
			labelledby: label.id,
		},
		attribute: {
			autocorrect: 'off',
			autocomplete: 'off',
			form: '',
			inputmode: 'text',
			spellcheck: 'false',
		},
		property: {
			id,
			value,
			role: isAutocomplete || listbox ? 'combobox' : 'searchbox',
			type: 'text',
		},
	});

	if (isAutocomplete || listbox) {
		setAria(input, 'expanded', listbox);
	}

	return input;
}

export function createOptionListList(
	parameters: CreateOptionListContentParameters,
): CreateOptionListList {
	const {attributes, id, label, multiple, select, type} = parameters;

	const element = createElement('ul', {
		aria: {
			labelledby: label.id,
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

	let groups: OptionListGroup[] | undefined;

	for (let childIndex = 0; childIndex < childrenLength; childIndex += 1) {
		const child = children[childIndex];

		if (child instanceof HTMLOptionElement) {
			const option = createOptionListOption({
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

		const group = createOptionListGroup({
			selected,
			type,
			group: child,
			groupOptions: [...child.children] as HTMLOptionElement[],
			original: parameters,
		});

		groups ??= [];

		element.append(group.element);
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

export function createOptionListMessage(attribute: string): HTMLDivElement {
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

export function createOptionListOption(parameters: CreateOptionListOptionParameters): HTMLElement {
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

export function createOptionListOptions(
	parameters: CreateOptionListOptionsParameters,
): HTMLElement[] {
	const {group, list, options, original, selected, type} = parameters;

	const items: HTMLElement[] = [];

	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];

		const item = createOptionListOption({group, index, option, original, type});

		items.push(item);

		if (option.selected) {
			selected.push(item);
		}

		list.append(item);
	}

	return items;
}

export function createOptionListValueLabel(id: string): HTMLSpanElement {
	return createElement('span', {
		property: {
			hidden: true,
			id: `${id}_value`,
		},
	});
}

export function updateOptionListMessage<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>): void {
	const {attributes, host, localizations, message} = state.component;

	const visible = getOptionListVisibleOptions(state).length;

	setAttribute(message, attributes.hidden, visible > 0 ? '' : undefined);

	let parameters: unknown[] = [];

	let key: keyof OptionListLocalizationValues | undefined;

	if (visible === 0) {
		key = 'empty';
	} else {
		key = 'results';
		parameters = [visible];
	}

	message.textContent = localizations.localize(key, {
		arguments: parameters,
		element: host,
	} as never);

	message.hidden = false;
}

export function updateOptionListPreview<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(
	preview: OptionListPreview,
	state: OptionListState<State, Localizations>,
	active?: HTMLElement,
	scroll?: boolean,
): void {
	const {attributes, callbacks, content, filter, options} = state.component;
	const {length} = options.all;

	for (let index = 0; index < length; index += 1) {
		const option = options.all[index];

		setAttribute(option, attributes.active, option === active ? '' : undefined);
	}

	state.component.active = active;

	setAria(filter.element, 'activedescendant', content.checkVisibility() ? active?.id : undefined);

	if (scroll ?? true) {
		active?.scrollIntoView(optionListScrollOptions);
	}

	if (preview !== 'none') {
		callbacks.data.onPreview(preview, state, active);
	}
}

export function updateOptionListValueLabel<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>): void {
	const {autocomplete, filter, listbox, localizations, host, options, multiple, values} =
		state.component;

	let label: string;

	if (multiple) {
		label = localizations.localize('selected', {
			arguments: [options.selected.length],
			element: host,
		} as never);
	} else {
		label =
			autocomplete.none && !listbox
				? filter.element.value
				: (options.selected[0]?.textContent ?? '');
	}

	values.label.textContent = label;
}

// #endregion
