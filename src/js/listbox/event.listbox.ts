import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {applyListboxSelection, toggleListboxOption} from '../internal/listbox/listbox.data';
import {updateListboxPreview} from '../internal/listbox/listbox.dom';
import {onListboxFilter, onListboxKeydown} from '../internal/listbox/listbox.event';
import type {OuiListboxPreview, OuiListboxState} from '../internal/listbox/listbox.model';
import {LISTBOX_SELECTORS, LISTBOX_TAGNAME} from './constants.listbox';
import {listboxStates} from './state.listbox';

// #region Types

// #region Functions

export function onListboxApply(): void {}

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
	toggleListboxOption(state, state.active);
}

export function onListboxFilter2(
	preview: OuiListboxPreview,
	state: OuiListboxState,
	update: boolean,
	active?: HTMLElement,
): void {
	updateListboxPreview(preview, state, active);
}

export function onListboxForm(state: OuiListboxState): void {}

function onListboxInput(event: InputEvent): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listboxStates.map.get(listbox!);

	if (state?.filter.element === event.target) {
		onListboxFilter(event.inputType, state);
	}
}

function onListboxKeydown2(event: KeyboardEvent): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listboxStates.map.get(listbox!);

	if (state?.filter.element === event.target) {
		onListboxKeydown(event, state);
	}
}

export function onListboxNavigation(
	preview: OuiListboxPreview,
	state: OuiListboxState,
	active?: HTMLElement,
): void {
	if (state.multiple) {
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

export function onListboxPreview(
	preview: OuiListboxPreview,
	state: OuiListboxState,
	active?: HTMLElement,
): void {
	// ?
}

export function onListboxToggle(state: OuiListboxState): void {
	state.filter.element.focus();
}

// #endregion

// #region Initialization

on(document, 'click', onListboxClick);
on(document, 'input', onListboxInput);

on(document, 'keydown', onListboxKeydown2, {
	passive: false,
});

// #endregion
