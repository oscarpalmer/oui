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
import {LISTBOX_SYMBOL, LISTBOX_TAGNAME, listboxSelectors} from './constants.listbox';

// #region Types

// #region Functions

function onListboxClick(event: Event): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listbox?.[LISTBOX_SYMBOL];

	if (listbox == null || state == null) {
		return;
	}

	const option = findAncestor(event, listboxSelectors.option) as HTMLElement | null;

	if (option == null) {
		return;
	}

	const {disabled, filter, readonly} = state.component;

	if (disabled) {
		filter.element.focus();
	} else if (readonly) {
		updateListboxPreview('none', state, option, false);
	} else {
		toggleListboxOption(state, option);
	}
}

export function onListboxEnter(state: OuiListboxState): void {
	if (!state.component.disabled && !state.component.readonly) {
		toggleListboxOption(state, state.component.active);
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
	const state = listbox?.[LISTBOX_SYMBOL];

	if (state?.component.filter.element === event.target) {
		filterListbox(event.inputType, state);
	}
}

function onListboxKeydown(event: KeyboardEvent): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listbox?.[LISTBOX_SYMBOL];

	if (state?.component.filter.element === event.target) {
		processListboxKeydown(event, state);
	}
}

export function onListboxNavigation(
	preview: OuiListboxPreview,
	state: OuiListboxState,
	active?: HTMLElement,
): void {
	if (state.component.multiple || state.component.readonly) {
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
	state.component.filter.element.focus();
}

// #endregion

// #region Initialization

on(document, 'click', onListboxClick);
on(document, 'input', onListboxInput);

on(document, 'keydown', onListboxKeydown, {
	passive: false,
});

// #endregion
