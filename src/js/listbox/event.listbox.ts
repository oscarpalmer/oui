import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {
	applyListboxSelection,
	filterListbox,
	toggleListboxOption,
} from '../internal/listbox/listbox.data';
import {updateListboxPreview} from '../internal/listbox/listbox.dom';
import {processListboxKeydown} from '../internal/listbox/listbox.event';
import type {OuiListboxPreview, OuiListboxState} from '../internal/listbox/listbox.model';
import {LISTBOX_SELECTORS, LISTBOX_TAGNAME} from './constants.listbox';
import {listboxStates} from './state.listbox';

// #region Types

// #region Functions

function onListboxClick(event: Event): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listboxStates.map.get(listbox!);

	if (listbox == null || state == null) {
		return;
	}

	const option = findAncestor(event, LISTBOX_SELECTORS.option) as HTMLElement | null;

	if (option == null) {
		return;
	}

	if (state.disabled) {
		state.filter.element.focus();
	} else if (state.readonly) {
		updateListboxPreview('none', state, option, false);
	} else {
		toggleListboxOption(state, option);
	}
}

export function onListboxEnter(state: OuiListboxState): void {
	if (!state.disabled && !state.readonly) {
		toggleListboxOption(state, state.active);
	}
}

export function onListboxFilter(
	preview: OuiListboxPreview,
	state: OuiListboxState,
	_: boolean,
	active?: HTMLElement,
): void {
	updateListboxPreview(preview, state, active);
}

function onListboxInput(event: InputEvent): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listboxStates.map.get(listbox!);

	if (state?.filter.element === event.target) {
		filterListbox(event.inputType, state);
	}
}

function onListboxKeydown(event: KeyboardEvent): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listboxStates.map.get(listbox!);

	if (state?.filter.element === event.target) {
		processListboxKeydown(event, state);
	}
}

export function onListboxNavigation(
	preview: OuiListboxPreview,
	state: OuiListboxState,
	active?: HTMLElement,
): void {
	if (state.multiple || state.readonly) {
		updateListboxPreview(preview, state, active);
	} else {
		applyListboxSelection({
			state,
			option: active,
			added: true,
			selected: active == null ? [] : [active],
		});
	}
}

export function onListboxToggle(state: OuiListboxState): void {
	state.filter.element.focus();
}

// #endregion

// #region Initialization

on(document, 'click', onListboxClick);
on(document, 'input', onListboxInput);

on(document, 'keydown', onListboxKeydown, {
	passive: false,
});

// #endregion
