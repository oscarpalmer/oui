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
import type {OuiListboxState} from './listbox.model';

// #region Functions

export function attachListbox<State extends OuiListboxState>(
	state: State,
	set: Set<State>,
	onAttach: (state: State) => void,
): void {
	const {filter, id, label} = state.component;

	label.element.htmlFor = filter.element.id;
	label.element.id = `${id}_label`;

	onAttach(state);

	set.add(state);
}

export function detachListbox<State extends OuiListboxState>(
	state: State,
	set: Set<State>,
	onDetach: (state: State) => void,
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

export function initializeListboxState<State extends OuiListboxState>(
	state: State,
	set: Set<State>,
	onAttach: (state: State) => void,
): State {
	const {component} = state;

	attachListbox(state, set, onAttach);

	setListboxDisabled(state, component.disabled);
	setListboxLimit('max', state, getAttribute(component.host, 'max'));
	setListboxLimit('min', state, getAttribute(component.host, 'min'));
	setListboxMultiple(component.host, component.multiple);
	setListboxReadonly(state, component.readonly);
	setListboxRequired(state, component.required);

	filterListboxOptions(state);

	updateListboxForm(state, component.values.current, false);
	updateListboxMessage(state);
	updateListboxValueLabel(state);

	if (component.options.selected.length > 0) {
		updateListboxPreview('none', state, component.options.selected[0], false);
	}

	return state;
}

// #endregion
