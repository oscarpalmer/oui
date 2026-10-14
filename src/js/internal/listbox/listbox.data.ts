import {getString} from '@oscarpalmer/atoms/string';
import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {getData} from '@oscarpalmer/toretto/data';
import {dispatch} from '@oscarpalmer/toretto/event';
import {updateListboxMessage, updateListboxPreview, updateListboxValueLabel} from './listbox.dom';
import {updateListboxForm} from './listbox.form';
import {setListboxFilter} from './listbox.misc';
import type {OuiListboxPreview, OuiListboxState} from './listbox.model';

// #region Types

type ApplySelectionParameters<State extends OuiListboxState = OuiListboxState> = {
	added: boolean;
	emit?: boolean;
	option?: HTMLElement;
	scroll?: boolean;
	selected?: HTMLElement[];
	state: State;
	values?: string[];
};

// #endregion

// #region Functions

export function applyListboxSelection<State extends OuiListboxState>(
	parameters: ApplySelectionParameters<State>,
): void {
	const {added, emit, option, scroll, selected, state} = parameters;
	const {component} = state;
	const {autocomplete, callbacks, filter, listbox, options, type} = component;
	const {length} = options.all;

	for (let index = 0; index < length; index += 1) {
		const option = options.all[index];

		setAria(
			option,
			'selected',
			(type === 'select' || !autocomplete.none) && (selected ?? options.selected).includes(option),
		);
	}

	const values =
		parameters.values ??
		(autocomplete.none && !listbox
			? [filter.element.value]
			: (selected ?? options.selected).map(option => getData(option, 'value', false) ?? ''));

	if (values.length === 0) {
		values.push('');
	}

	if (selected != null) {
		options.selected = selected;
	}

	const update =
		values.length === component.values.current.length
			? values.some(value => !component.values.current.includes(value))
			: true;

	if (!update) {
		return;
	}

	updateListboxForm(state, values, emit);
	updateListboxMessage(state);
	updateListboxPreview('set', state, option, scroll);
	updateListboxValueLabel(state);

	callbacks.data.onApply(state, option, values, added, selected, emit);
}

export function filterListbox(type: InputEvent['inputType'], state: OuiListboxState): void {
	const {callbacks, disabled, filter, host, readonly} = state.component;

	if (disabled || readonly) {
		return;
	}

	const update = filter.element.value !== filter.value;

	const option = filterListboxOptions(state);

	let preview: OuiListboxPreview | undefined;

	if (type.includes('delete')) {
		preview = 'none';
	} else if (type.includes('insert')) {
		preview = 'typed';
	}

	if (preview != null) {
		callbacks.data.onFilter(preview, state, update, option);
	}

	if (update) {
		filter.value = filter.element.value;

		dispatch(host, 'input');
	}
}

export function filterListboxOption(
	state: OuiListboxState,
	value: unknown,
	textContent?: boolean,
): HTMLElement | undefined {
	const {options} = state.component;

	const filterTextContent = textContent ?? false;

	const filter = getString(value).toLocaleLowerCase();

	filterListboxOptions(state);

	const {length} = options.all;

	let match: HTMLElement | undefined;

	for (let index = 0; index < length; index += 1) {
		const option = options.all[index];

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

export function filterListboxOptions(state: OuiListboxState): HTMLElement | undefined {
	function filterOptions(options: HTMLElement[]): boolean {
		const {length} = options;

		let count = 0;

		for (let index = 0; index < length; index += 1) {
			const option = options[index];

			option.hidden =
				(type === 'select' || !autocomplete.none) &&
				!option.textContent.toLocaleLowerCase().includes(value);

			if (!option.hidden) {
				count += 1;

				visible.push(option);
			}
		}

		return count === 0;
	}

	const {active, attributes, autocomplete, filter, groups, list, options, type} = state.component;

	const value = filter.element.value.toLocaleLowerCase();

	const visible: HTMLElement[] = [];

	if (groups == null) {
		filterOptions(options.all);
	} else {
		const groupsLength = groups.length;

		for (let groupIndex = 0; groupIndex < groupsLength; groupIndex += 1) {
			const {element, options} = groups[groupIndex];

			element.hidden = filterOptions(options);
		}
	}

	setAttribute(list, attributes.empty, visible.length === 0 ? '' : undefined);

	updateListboxMessage(state);

	return active != null && visible.includes(active) ? active : visible[0];
}

export function setListboxValue<State extends OuiListboxState>(
	state: State,
	value: unknown,
	emit?: boolean,
): void {
	const {autocomplete, listbox} = state.component;

	if (autocomplete.none && !listbox) {
		setListboxFilter(state, getString(value));

		return;
	}

	const option = filterListboxOption(state, value);

	if (option != null) {
		setListboxValues(state, [value], emit);
	}
}

export function setListboxValues<State extends OuiListboxState>(
	state: State,
	value: unknown[],
	emit?: boolean,
): void {
	if (!Array.isArray(value)) {
		return;
	}

	const {autocomplete, listbox, multiple, options} = state.component;

	const values = (multiple ? value : value.slice(0, 1)).map(value =>
		getString(value).toLocaleLowerCase(),
	);

	if (values.length === 0) {
		values.push('');
	}

	if (autocomplete.none && !listbox) {
		setListboxValue(state, values[0], emit);

		return;
	}

	const {length} = options.all;

	const selected: HTMLElement[] = [];

	for (let index = 0; index < length; index += 1) {
		const option = options.all[index];

		if (values.includes(getData(option, 'value', false)?.toLocaleLowerCase() ?? '')) {
			selected.push(option);
		}
	}

	applyListboxSelection({
		emit,
		selected,
		state,
		added: true,
		option: selected[0] ?? options.all[0],
		values: autocomplete.none && !listbox ? values : undefined,
	});
}

export function toggleListboxOption<State extends OuiListboxState>(
	state: State,
	option?: HTMLElement,
): void {
	const {autocomplete, callbacks, listbox, multiple, options} = state.component;

	if (option == null || (!multiple && options.selected.includes(option))) {
		callbacks.data.onToggle(state);

		return;
	}

	const selected = options.selected.slice();

	let added = true;

	if (multiple) {
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

	const values = autocomplete.none && !listbox && option != null ? [option.textContent] : undefined;

	applyListboxSelection({
		added,
		option,
		selected,
		state,
		values,
		scroll: false,
	});

	callbacks.data.onToggle(state);
}

// #endregion
