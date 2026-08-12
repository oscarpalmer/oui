import {clamp} from '@oscarpalmer/atoms/number';
import {findAncestor, getData} from '@oscarpalmer/toretto';
import {on} from '@oscarpalmer/toretto/event';
import {LISTBOX_KEYS} from '../internal/listbox/listbox.constants';
import {
	applyListboxSelection,
	filterListbox,
	filterListboxOption,
	filterListboxOptions,
	toggleListboxOption,
} from '../internal/listbox/listbox.data';
import {updateListboxPreview} from '../internal/listbox/listbox.dom';
import {processListboxKeydown} from '../internal/listbox/listbox.event';
import type {OuiListboxPreview} from '../internal/listbox/listbox.model';
import {
	COMBOBOX_ATTRIBUTE_SELECTION_ITEM,
	COMBOBOX_SELECTORS,
	COMBOBOX_TAGNAME,
} from './constants.combobox';
import {
	updateComboboxAutocomplete,
	updateComboboxSelection,
	updateComboboxTabindices,
} from './dom.combobox';
import type {OuiComboboxElement} from './index';
import {hasTextSelection} from './misc.combobox';
import type {OuiComboboxState} from './models.combobox';
import {comboboxStates} from './state.combobox';

// #region Functions

export function onComboboxActivation(state: OuiComboboxState): void {
	state.floatable.show();
}

export function onComboboxApply(
	state: OuiComboboxState,
	option: HTMLElement | undefined,
	_: string[],
	added: boolean,
	selected?: HTMLElement[],
): void {
	updateComboboxSelection(state, option, added, selected);
}

export function onComboboxClickContent(event: PointerEvent, state: OuiComboboxState): void {
	if (state == null) {
		return;
	}

	if (state.disabled) {
		return;
	}

	const option = findAncestor(event, COMBOBOX_SELECTORS.option);

	if (!(option instanceof HTMLElement)) {
		state.filter.element.focus();
	} else if (state.readonly) {
		onComboboxPreview('set', state, option);
	} else {
		toggleListboxOption(state, option);
	}
}

function onComboboxClickDocument(event: PointerEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME);
	const state = comboboxStates.map.get(combobox!);

	if (combobox == null || state == null) {
		return;
	}

	if (findAncestor(event, COMBOBOX_SELECTORS.content) != null) {
		onComboboxClickContent(event, state);

		return;
	}

	const label = findAncestor(event, 'label');

	if (label != null) {
		if (label === state.label.element && combobox.type === 'select') {
			state.anchor.element.focus();

			if (!state.disabled) {
				state.floatable.show();
			}
		}

		return;
	}

	const selection = findAncestor(event, `[${COMBOBOX_ATTRIBUTE_SELECTION_ITEM}]`);

	if (selection != null) {
		const option = state.options.selected.find(
			option => option.id === getData(selection, 'option', false),
		);

		if (state.disabled) {
			state.anchor.element.focus();
		} else if (state.readonly) {
			updateComboboxTabindices(state, option);
		} else {
			toggleListboxOption(state, option);
		}

		return;
	}

	const anchor = findAncestor(event, COMBOBOX_SELECTORS.anchor);

	if (anchor != null && !state.disabled) {
		state.floatable.show();

		return;
	}
}

export function onComboboxEnter(state: OuiComboboxState): void {
	if (state.disabled || state.readonly) {
		return;
	}

	if (hasTextSelection(state.anchor.element)) {
		onComboboxSelection(state, true);
	} else {
		toggleListboxOption(state, state.active);
	}
}

export function onComboboxEscape(state: OuiComboboxState): void {
	state.floatable.hide();
}

export function onComboboxFilter(
	preview: OuiListboxPreview,
	state: OuiComboboxState,
	update: boolean,
	active?: HTMLElement,
	emit?: boolean,
): void {
	if (state.autocomplete.none) {
		applyListboxSelection({
			state,
			added: false,
			emit: (emit ?? true) && update,
		});
	} else {
		updateListboxPreview(preview, state, active);
	}
}

export function onComboboxFocusout(event: FocusEvent): void {
	setTimeout(() => {
		const combobox = findAncestor(event, COMBOBOX_TAGNAME);
		const state = comboboxStates.map.get(combobox!);

		if (
			combobox == null ||
			state == null ||
			state.disabled ||
			state.readonly ||
			state.type === 'select' ||
			state.host === document.activeElement ||
			state.host.contains(document.activeElement)
		) {
			return;
		}

		const option = filterListboxOption(state, state.filter.element.value, true);

		applyListboxSelection({
			option,
			state,
			added: false,
			selected: option == null ? [] : [option],
		});
	});
}

export function onComboboxInput(event: InputEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME) as OuiComboboxElement | null;
	const state = comboboxStates.map.get(combobox!);

	if (combobox != null && state != null && event.target === state.filter.element) {
		filterListbox(event.inputType, state);
	}
}

export function onComboboxKeydown(event: KeyboardEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME) as OuiComboboxElement | null;
	const state = comboboxStates.map.get(combobox!);

	if (combobox == null || state == null) {
		return;
	}

	const item = findAncestor(event, COMBOBOX_SELECTORS.selectionItem);

	if (item instanceof HTMLElement) {
		onComboboxKeydownSelection(event, state, item);
	} else {
		processListboxKeydown(event, state);
	}
}

export function onComboboxKeydownSelection(
	event: KeyboardEvent,
	state: OuiComboboxState,
	item: HTMLElement,
): void {
	if (LISTBOX_KEYS.activation.has(event.key)) {
		event.preventDefault();

		onComboboxRemoveSelection(state, item);

		return;
	}

	if (state.disabled || state.selection == null) {
		return;
	}

	const {length} = state.selection.items;

	const index = state.selection.items.findIndex(selection => selection.button === item);

	let next: number | undefined;

	switch (event.key) {
		case 'ArrowDown':
			state.anchor.element.focus();
			state.anchor.element.click();
			return;

		case 'ArrowRight':
		case 'ArrowLeft':
			next = clamp(index + (event.key === 'ArrowRight' ? 1 : -1), 0, length - 1, true);
			break;

		case 'End':
			next = length - 1;
			break;

		case 'Home':
			next = 0;
			break;

		default:
			break;
	}

	if (next == null) {
		return;
	}

	event.preventDefault();

	for (let index = 0; index < length; index += 1) {
		const {button} = state.selection.items[index];
		const selected = index === next;

		button.tabIndex = selected ? 0 : -1;

		if (selected) {
			button.focus();
		}
	}
}

export function onComboboxPreview(
	preview: OuiListboxPreview,
	state: OuiComboboxState,
	active?: HTMLElement,
): void {
	updateComboboxAutocomplete(preview, state, active);
}

export function onComboboxRemoveSelection(state: OuiComboboxState, item: HTMLElement): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const option = state.options.selected.find(
		option => option.id === getData(item, 'option', false),
	);

	if (option != null) {
		toggleListboxOption(state, option);
	}
}

export function onComboboxNavigation(
	preview: OuiListboxPreview,
	state: OuiComboboxState,
	active?: HTMLElement,
): void {
	updateListboxPreview(preview, state, active);
}

export function onComboboxSelection(state: OuiComboboxState, hasSelection?: boolean): void {
	if (!(hasSelection ?? hasTextSelection(state.anchor.element))) {
		return;
	}

	state.filter.value =
		state.anchor.element === state.filter.element ? state.filter.element.value : '';

	toggleListboxOption(state, filterListboxOptions(state) ?? state.active);
}

export function onComboboxTab(state: OuiComboboxState): void {
	setTimeout(() => {
		if (state.host === document.activeElement) {
			return;
		}

		if (
			state.selection?.container.contains(document.activeElement) ||
			!state.host.contains(document.activeElement)
		) {
			state.floatable.hide();
		}
	});
}

export function onComboboxToggle(state: OuiComboboxState): void {
	if (!state.multiple) {
		state.floatable.hide();
	}
}

export function preventComboboxActivation(state: OuiComboboxState): boolean {
	return state.floatable.open;
}

export function skipComboboxNavigation(state: OuiComboboxState): boolean {
	if (state.floatable.open) {
		return false;
	}

	state.floatable.show();

	return true;
}

// #endregion

// #region Initialization

on(document, 'click', onComboboxClickDocument);

on(document, 'focusout', onComboboxFocusout);

on(document, 'input', onComboboxInput, {
	passive: false,
});

on(document, 'keydown', onComboboxKeydown, {
	passive: false,
});

// #endregion
