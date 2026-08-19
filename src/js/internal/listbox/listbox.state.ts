import {getAttribute} from '@oscarpalmer/toretto/attribute';
import {filterListboxOptions} from './listbox.data';
import {updateListboxMessage, updateListboxPreview, updateListboxValueLabel} from './listbox.dom';
import {updateListboxForm} from './listbox.form';
import {
	setListboxDisabled,
	setListboxLimit,
	setListboxMultiple,
	setListboxReadonly,
	setListboxRequired,
} from './listbox.misc';
import type {OuiListboxState, OuiListboxStates} from './listbox.model';

// #region Functions

export function attachListbox<State extends OuiListboxState>(
	state: State,
	states: OuiListboxStates<State>,
	onAttach: (state: State) => void,
): void {
	const {filter, host, id, label} = state;

	label.element.htmlFor = filter.element.id;
	label.element.id = `${id}_label`;

	onAttach(state);

	states.map.set(host, state);
	states.set.add(state);
}

export function detachListbox<State extends OuiListboxState>(
	state: State,
	states: OuiListboxStates<State>,
	onDetach: (state: State) => void,
): void {
	const {host, label, select} = state;

	const listeners = state.listeners.splice(0);
	const {length} = listeners;

	for (let index = 0; index < length; index += 1) {
		listeners[index]();
	}

	label.element.htmlFor = select.id;
	label.element.id = label.id;

	onDetach(state);

	states.map.delete(host);
	states.set.delete(state);
}

export function initializeListboxState<State extends OuiListboxState>(
	state: State,
	states: OuiListboxStates<State>,
	onAttach: (state: State) => void,
): State {
	attachListbox(state, states, onAttach);

	setListboxDisabled(state, state.disabled);
	setListboxLimit('max', state, getAttribute(state.host, 'max'));
	setListboxLimit('min', state, getAttribute(state.host, 'min'));
	setListboxMultiple(state.host, state.multiple);
	setListboxReadonly(state, state.readonly);
	setListboxRequired(state, state.required);

	filterListboxOptions(state);

	updateListboxForm(state, state.values.current, false);
	updateListboxMessage(state);
	updateListboxValueLabel(state);

	if (state.options.selected.length > 0) {
		updateListboxPreview('none', state, state.options.selected[0], false);
	}

	return state;
}

// #endregion
