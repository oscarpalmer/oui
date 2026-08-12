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
	const {length} = state.options.all;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		setAria(
			option,
			'selected',
			(state.type === 'select' || !state.autocomplete.none) &&
				(selected ?? state.options.selected).includes(option),
		);
	}

	const values =
		parameters.values ??
		(state.autocomplete.none && !state.listbox
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

	updateListboxForm(state, values, emit);
	updateListboxMessage(state);
	updateListboxPreview('set', state, option, scroll);
	updateListboxValueLabel(state);

	state.callbacks.data.onApply(state, option, values, added, selected, emit);
}

export function filterListbox(type: InputEvent['inputType'], state: OuiListboxState): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const update = state.filter.element.value !== state.filter.value;

	const option = filterListboxOptions(state);

	let preview: OuiListboxPreview | undefined;

	if (type.includes('delete')) {
		preview = 'none';
	} else if (type.includes('insert')) {
		preview = 'typed';
	}

	if (preview != null) {
		state.callbacks.data.onFilter(preview, state, update, option);
	}

	if (update) {
		state.filter.value = state.filter.element.value;

		dispatch(state.host, 'input');
	}
}

export function filterListboxOption(
	state: OuiListboxState,
	value: unknown,
	textContent?: boolean,
): HTMLElement | undefined {
	const filterTextContent = textContent ?? false;

	const filter = getString(value).toLocaleLowerCase();

	filterListboxOptions(state);

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

export function filterListboxOptions(state: OuiListboxState): HTMLElement | undefined {
	function filter(options: HTMLElement[]): boolean {
		const {length} = options;

		let count = 0;

		for (let index = 0; index < length; index += 1) {
			const option = options[index];

			option.hidden =
				(state.type === 'select' || !state.autocomplete.none) &&
				!option.textContent.toLocaleLowerCase().includes(value);

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

	setAttribute(state.list, state.attributes.empty, visible.length === 0 ? '' : undefined);

	updateListboxMessage(state);

	return state.active != null && visible.includes(state.active) ? state.active : visible[0];
}

export function setListboxValue<State extends OuiListboxState>(
	state: State,
	value: unknown,
	emit?: boolean,
): void {
	if (state.autocomplete.none && !state.listbox) {
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

	const values = (state.multiple ? value : value.slice(0, 1)).map(value =>
		getString(value).toLocaleLowerCase(),
	);

	if (values.length === 0) {
		values.push('');
	}

	if (state.autocomplete.none && !state.listbox) {
		setListboxValue(state, values[0], emit);

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

	applyListboxSelection({
		emit,
		selected,
		state,
		added: true,
		option: selected[0] ?? state.options.all[0],
		values: state.autocomplete.none && !state.listbox ? values : undefined,
	});
}

export function toggleListboxOption<State extends OuiListboxState>(
	state: State,
	option?: HTMLElement,
): void {
	if (option == null || (!state.multiple && state.options.selected.includes(option))) {
		state.callbacks.data.onToggle(state);

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

	applyListboxSelection({
		added,
		option,
		selected,
		state,
		scroll: false,
		values:
			state.autocomplete.none && !state.listbox && option != null
				? [option.textContent]
				: undefined,
	});

	state.callbacks.data.onToggle(state);
}

// #endregion
