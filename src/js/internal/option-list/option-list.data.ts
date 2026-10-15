import type {PlainObject} from '@oscarpalmer/atoms/models';
import {getString} from '@oscarpalmer/atoms/string';
import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {getData} from '@oscarpalmer/toretto/data';
import {dispatch} from '@oscarpalmer/toretto/event';
import type {OuiLocalizationsValues} from '../l10n/l10n.model';
import {
	updateOptionListMessage,
	updateOptionListPreview,
	updateOptionListValueLabel,
} from './option-list.dom';
import {updateOptionListForm} from './option-list.form';
import {setOptionListFilter} from './option-list.misc';
import type {OptionListPreview, OptionListState} from './option-list.model';

// #region Types

type ApplySelectionParameters<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
> = {
	added: boolean;
	emit?: boolean;
	option?: HTMLElement;
	scroll?: boolean;
	selected?: HTMLElement[];
	state: OptionListState<State, Localizations>;
	values?: string[];
};

// #endregion

// #region Functions

export function applyOptionListSelection<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(parameters: ApplySelectionParameters<State, Localizations>): void {
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

	updateOptionListForm(state, values, emit);
	updateOptionListMessage(state);
	updateOptionListPreview('set', state, option, scroll);
	updateOptionListValueLabel(state);

	callbacks.data.onApply(state, option, values, added, selected, emit);
}

export function filterOptionList<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(type: InputEvent['inputType'], state: OptionListState<State, Localizations>): void {
	const {callbacks, disabled, filter, host, readonly} = state.component;

	if (disabled || readonly) {
		return;
	}

	const update = filter.element.value !== filter.value;

	const option = filterOptionListOptions(state);

	let preview: OptionListPreview | undefined;

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

export function filterOptionListOption<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(
	state: OptionListState<State, Localizations>,
	value: unknown,
	textContent?: boolean,
): HTMLElement | undefined {
	const {options} = state.component;

	const filterTextContent = textContent ?? false;

	const filter = getString(value).toLocaleLowerCase();

	filterOptionListOptions(state);

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

export function filterOptionListOptions<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>): HTMLElement | undefined {
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

	updateOptionListMessage(state);

	return active != null && visible.includes(active) ? active : visible[0];
}

export function setOptionListValue<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>, value: unknown, emit?: boolean): void {
	const {autocomplete, listbox} = state.component;

	if (autocomplete.none && !listbox) {
		setOptionListFilter(state, getString(value));

		return;
	}

	const option = filterOptionListOption(state, value);

	if (option != null) {
		setOptionListValues(state, [value], emit);
	}
}

export function setOptionListValues<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>, value: unknown[], emit?: boolean): void {
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
		setOptionListValue(state, values[0], emit);

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

	applyOptionListSelection({
		emit,
		selected,
		state,
		added: true,
		option: selected[0] ?? options.all[0],
		values: autocomplete.none && !listbox ? values : undefined,
	});
}

export function toggleOptionListOption<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>, option?: HTMLElement): void {
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

	applyOptionListSelection({
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
