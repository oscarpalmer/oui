import {getString} from '@oscarpalmer/atoms/string';
import {setAria} from '@oscarpalmer/toretto/aria';
import {getData} from '@oscarpalmer/toretto/data';
import {
	updateComboboxMessage,
	updateComboboxPreview,
	updateComboboxSelection,
} from './dom.combobox';
import {onComboboxFilter} from './event.combobox';
import {updateComboboxForm} from './form.combobox';
import type {OuiComboboxState} from './models.combobox';

// #region Types

type ApplySelectionParameters = {
	added: boolean;
	emit?: boolean;
	option?: HTMLElement;
	selected?: HTMLElement[];
	state: OuiComboboxState;
	values?: string[];
};

// #endregion

// #region Functions

export function applyComboboxSelection(parameters: ApplySelectionParameters): void {
	const {added, emit, option, selected, state} = parameters;

	const {length} = state.options.all;

	for (let index = 0; index < length; index += 1) {
		const option = state.options.all[index];

		setAria(option, 'selected', (selected ?? state.options.selected).includes(option));
	}

	const values =
		parameters.values ??
		(state.autocomplete.none
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

	updateComboboxForm(state, values, emit);
	updateComboboxPreview('set', state, option);
	updateComboboxSelection(state, option, added, selected);
}

export function filterComboboxOption(
	state: OuiComboboxState,
	value: unknown,
	textContent?: boolean,
): HTMLElement | undefined {
	const filterTextContent = textContent ?? false;

	const filter = getString(value).toLocaleLowerCase();

	filterComboboxOptions(state);

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

export function filterComboboxOptions(state: OuiComboboxState): HTMLElement | undefined {
	function filter(options: HTMLElement[]): boolean {
		const {length} = options;

		let count = 0;

		for (let index = 0; index < length; index += 1) {
			const option = options[index];

			option.hidden =
				!state.autocomplete.none && !option.textContent.toLocaleLowerCase().includes(value);

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

	updateComboboxMessage(state, visible.length);

	return state.active != null && visible.includes(state.active) ? state.active : visible[0];
}

export function setComboboxValue(state: OuiComboboxState, value: unknown, emit?: boolean): void {
	if (state.autocomplete.none) {
		state.filter.element.value = getString(value);

		onComboboxFilter('insertText', state, true, emit);

		return;
	}

	const option = filterComboboxOption(state, value);

	if (option != null) {
		setComboboxValues(state, [value], emit);
	}
}

export function setComboboxValues(state: OuiComboboxState, value: unknown, emit?: boolean): void {
	if (!Array.isArray(value)) {
		return;
	}

	const values = (state.multiple ? value : value.slice(0, 1)).map(value =>
		getString(value).toLocaleLowerCase(),
	);

	if (values.length === 0) {
		values.push('');
	}

	if (state.autocomplete.none) {
		setComboboxValue(state, values[0], emit);

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

	applyComboboxSelection({
		emit,
		selected,
		state,
		added: true,
		option: selected[0] ?? state.options.all[0],
		values: state.autocomplete.none ? values : undefined,
	});
}

export function toggleComboboxOption(state: OuiComboboxState, option?: HTMLElement): void {
	if (option == null || (!state.multiple && state.options.selected.includes(option))) {
		state.floatable.hide();

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

	applyComboboxSelection({
		added,
		option,
		selected,
		state,
		values: state.autocomplete.none && option != null ? [option.textContent] : undefined,
	});

	if (!state.multiple) {
		state.floatable.hide();
	}
}

// #endregion
