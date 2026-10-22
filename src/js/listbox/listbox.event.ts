import {getAria} from '@oscarpalmer/toretto/aria';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {
	applyOptionListSelection,
	filterOptionList,
	toggleOptionListOption,
} from '../internal/option-list/option-list.data';
import {updateOptionListPreview} from '../internal/option-list/option-list.dom';
import {processOptionListKeydown} from '../internal/option-list/option-list.event';
import type {OptionListPreview} from '../internal/option-list/option-list.model';
import {LISTBOX_SYMBOL, LISTBOX_TAGNAME, listboxSelectors} from './listbox.constants';
import {updateListboxFooter} from './listbox.dom';
import type {OuiListboxState} from './listbox.model';

// #region Types

// #region Functions

export function onListboxApply(state: OuiListboxState): void {
	updateListboxFooter(state as never);
}

function onListboxClick(event: Event): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listbox?.[LISTBOX_SYMBOL];

	if (listbox == null || state == null) {
		return;
	}

	const button = findAncestor(event, `[${LISTBOX_TAGNAME}-footer-button]`);

	if (button instanceof HTMLElement) {
		onListboxSelection(state, button);

		return;
	}

	const option = findAncestor(event, listboxSelectors.option);

	if (!(option instanceof HTMLElement)) {
		return;
	}

	const {disabled, filter, readonly} = state.component;

	if (disabled) {
		filter.element.focus();
	} else if (readonly) {
		updateOptionListPreview('none', state, option, false);
	} else {
		toggleOptionListOption(state, option);
	}
}

export function onListboxEnter(state: OuiListboxState): void {
	if (!state.component.disabled && !state.component.readonly) {
		toggleOptionListOption(state, state.component.active);
	}
}

export function onListboxFilter(
	preview: OptionListPreview,
	state: OuiListboxState,
	_: boolean,
	active?: Element,
): void {
	updateOptionListPreview(preview, state, active as HTMLElement);
}

function onListboxInput(event: InputEvent): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listbox?.[LISTBOX_SYMBOL];

	if (state?.component.filter.element === event.target) {
		filterOptionList(event.inputType, state);
	}
}

function onListboxKeydown(event: KeyboardEvent): void {
	const listbox = findAncestor(event, LISTBOX_TAGNAME);
	const state = listbox?.[LISTBOX_SYMBOL];

	if (state?.component.filter.element === event.target) {
		processOptionListKeydown(event, state);
	}
}

export function onListboxNavigation(
	preview: OptionListPreview,
	state: OuiListboxState,
	active?: HTMLElement,
): void {
	if (state.component.multiple || state.component.readonly) {
		updateOptionListPreview(preview, state, active);
	} else {
		applyOptionListSelection({
			state,
			option: active,
			added: true,
			selected: active == null ? [] : [active],
		});
	}
}

function onListboxSelection(state: OuiListboxState, button: Element): void {
	if (getAria(button, 'disabled') || state.component.options.all.length === 0) {
		return;
	}

	const clear = button === state.component.footer.button.clear;
	const select = button === state.component.footer.button.select;

	if (clear || select) {
		applyOptionListSelection({
			state,
			option: state.component.options.all[0],
			added: false,
			selected: clear ? [] : state.component.options.all,
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
