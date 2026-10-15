import type {PlainObject} from '@oscarpalmer/atoms/models';
import {getAttribute} from '@oscarpalmer/toretto/attribute';
import type {OuiLocalizationsValues} from '../l10n/l10n.model';
import {filterOptionListOptions} from './option-list.data';
import {
	updateOptionListMessage,
	updateOptionListPreview,
	updateOptionListValueLabel,
} from './option-list.dom';
import {updateOptionListForm} from './option-list.form';
import {
	setOptionListDisabled,
	setOptionListLimit,
	setOptionListMultiple,
	setOptionListReadonly,
	setOptionListRequired,
} from './option-list.misc';
import type {OptionListState} from './option-list.model';

// #region Functions

export function attachOptionList<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(
	state: OptionListState<State, Localizations>,
	set: Set<OptionListState<State, Localizations>>,
	onAttach: (state: OptionListState<State, Localizations>) => void,
): void {
	const {filter, id, label} = state.component;

	label.element.htmlFor = filter.element.id;
	label.element.id = `${id}_label`;

	onAttach(state);

	set.add(state);
}

export function detachOptionList<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(
	state: OptionListState<State, Localizations>,
	set: Set<OptionListState<State, Localizations>>,
	onDetach: (state: OptionListState<State, Localizations>) => void,
): void {
	const {label, select} = state.component;

	const listeners = state.component.listeners.splice(0);
	const {length} = listeners;

	for (let index = 0; index < length; index += 1) {
		listeners[index]();
	}

	label.element.htmlFor = select.id;
	label.element.id = label.id;

	onDetach(state);

	set.delete(state);
}

export function initializeOptionListState<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(
	state: OptionListState<State, Localizations>,
	set: Set<OptionListState<State, Localizations>>,
	onAttach: (state: OptionListState<State, Localizations>) => void,
): OptionListState<State, Localizations> {
	const {component} = state;

	attachOptionList(state, set, onAttach);

	setOptionListDisabled(state, component.disabled);
	setOptionListLimit('max', state, getAttribute(component.host, 'max'));
	setOptionListLimit('min', state, getAttribute(component.host, 'min'));
	setOptionListMultiple(component.host, component.multiple);
	setOptionListReadonly(state, component.readonly);
	setOptionListRequired(state, component.required);

	filterOptionListOptions(state);

	updateOptionListForm(state, component.values.current, false);
	updateOptionListMessage(state);
	updateOptionListValueLabel(state);

	if (component.options.selected.length > 0) {
		updateOptionListPreview('none', state, component.options.selected[0], false);
	}

	return state;
}

// #endregion
