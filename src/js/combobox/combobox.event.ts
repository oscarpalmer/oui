import {clamp} from '@oscarpalmer/atoms/number';
import {getData} from '@oscarpalmer/toretto/data';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {OPTION_LIST_KEYS_ACTIVATION} from '../internal/option-list/option-list.constants';
import {
	applyOptionListSelection,
	filterOptionList,
	filterOptionListOption,
	filterOptionListOptions,
	toggleOptionListOption,
} from '../internal/option-list/option-list.data';
import {updateOptionListPreview} from '../internal/option-list/option-list.dom';
import {processOptionListKeydown} from '../internal/option-list/option-list.event';
import type {OptionListPreview} from '../internal/option-list/option-list.model';
import {
	COMBOBOX_ATTRIBUTE_SELECTION_ITEM,
	COMBOBOX_SYMBOL,
	COMBOBOX_TAGNAME,
	comboboxSelectors,
} from './combobox.constants';
import {
	updateComboboxAutocomplete,
	updateComboboxSelection,
	updateComboboxTabindices,
} from './combobox.dom';
import {hasTextSelection} from './combobox.misc';
import type {OuiComboboxState} from './combobox.model';

// #region Functions

export function onComboboxActivation(state: OuiComboboxState): void {
	state.component.floatable.show();
}

export function onComboboxApply(
	state: OuiComboboxState,
	option: Element | undefined,
	_: string[],
	added: boolean,
	selected?: Element[],
): void {
	updateComboboxSelection(state, option, added, selected);
}

export function onComboboxClickContent(event: PointerEvent, state: OuiComboboxState): void {
	if (state == null) {
		return;
	}

	const {disabled, filter, readonly} = state.component;

	if (disabled) {
		return;
	}

	const option = findAncestor(event, comboboxSelectors.option);

	if (!(option instanceof HTMLElement)) {
		filter.element.focus();
	} else if (readonly) {
		onComboboxPreview('set', state, option);
	} else {
		toggleOptionListOption(state, option);
	}
}

function onComboboxClickDocument(event: PointerEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME);
	const state = combobox?.[COMBOBOX_SYMBOL];

	if (combobox == null || state == null) {
		return;
	}

	if (findAncestor(event, comboboxSelectors.content) != null) {
		onComboboxClickContent(event, state);

		return;
	}

	const {disabled, floatable, options, readonly} = state.component;

	const label = findAncestor(event, 'label');

	if (label != null) {
		if (label === state.component.label.element && combobox.type === 'select') {
			state.component.anchor.element.focus();

			if (!disabled) {
				floatable.show();
			}
		}

		return;
	}

	const selection = findAncestor(event, `[${COMBOBOX_ATTRIBUTE_SELECTION_ITEM}]`);

	if (selection != null) {
		const option = options.selected.find(
			option => option.id === getData(selection, 'option', false),
		);

		if (disabled) {
			state.component.anchor.element.focus();
		} else if (readonly) {
			updateComboboxTabindices(state, option);
		} else {
			toggleOptionListOption(state, option);
		}

		return;
	}

	const anchor = findAncestor(event, comboboxSelectors.anchor);

	if (anchor != null && !disabled) {
		floatable.show();

		return;
	}
}

export function onComboboxEnter(state: OuiComboboxState): void {
	const {active, anchor, disabled, readonly} = state.component;

	if (disabled || readonly) {
		return;
	}

	if (hasTextSelection(anchor.element)) {
		onComboboxSelection(state, true);
	} else {
		toggleOptionListOption(state, active);
	}
}

export function onComboboxEscape(state: OuiComboboxState): void {
	state.component.floatable.hide();
}

export function onComboboxFilter(
	preview: OptionListPreview,
	state: OuiComboboxState,
	update: boolean,
	active?: Element,
	emit?: boolean,
): void {
	if (state.component.autocomplete.none) {
		applyOptionListSelection({
			state,
			added: false,
			emit: (emit ?? true) && update,
		});
	} else {
		updateOptionListPreview(preview, state, active);
	}
}

export function onComboboxFocusout(event: FocusEvent): void {
	setTimeout(() => {
		const combobox = findAncestor(event, COMBOBOX_TAGNAME);
		const state = combobox?.[COMBOBOX_SYMBOL];
		const component = state?.component;

		if (
			combobox == null ||
			state == null ||
			component == null ||
			component.disabled ||
			component.readonly ||
			component.type === 'select' ||
			component.host === document.activeElement ||
			component.host.contains(document.activeElement)
		) {
			return;
		}

		const option = filterOptionListOption(state, component.filter.element.value, true);

		applyOptionListSelection({
			option,
			state,
			added: false,
			selected: option == null ? [] : [option],
		});
	});
}

export function onComboboxInput(event: InputEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME);
	const state = combobox?.[COMBOBOX_SYMBOL];

	if (combobox != null && state != null && event.target === state.component.filter.element) {
		filterOptionList(event.inputType, state);
	}
}

export function onComboboxKeydown(event: KeyboardEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME);
	const state = combobox?.[COMBOBOX_SYMBOL];

	if (combobox == null || state == null) {
		return;
	}

	const item = findAncestor(event, comboboxSelectors.selectionItem);

	if (item instanceof HTMLElement) {
		onComboboxKeydownSelection(event, state, item);
	} else {
		processOptionListKeydown(event, state);
	}
}

export function onComboboxKeydownSelection(
	event: KeyboardEvent,
	state: OuiComboboxState,
	item: Element,
): void {
	if (OPTION_LIST_KEYS_ACTIVATION.has(event.key)) {
		event.preventDefault();

		onComboboxRemoveSelection(state, item);

		return;
	}

	const {anchor, disabled, selection} = state.component;

	if (disabled || selection == null) {
		return;
	}

	const {length} = selection.items;

	const index = selection.items.findIndex(selected => selected.button === item);

	let next: number | undefined;

	switch (event.key) {
		case 'ArrowDown':
			anchor.element.focus();
			anchor.element.click();
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
		const {button} = selection.items[index];
		const selected = index === next;

		button.tabIndex = selected ? 0 : -1;

		if (selected) {
			button.focus();
		}
	}
}

export function onComboboxPreview(
	preview: OptionListPreview,
	state: OuiComboboxState,
	active?: Element,
): void {
	updateComboboxAutocomplete(preview, state, active);
}

export function onComboboxRemoveSelection(state: OuiComboboxState, item: Element): void {
	const {disabled, options, readonly} = state.component;

	if (disabled || readonly) {
		return;
	}

	const option = options.selected.find(option => option.id === getData(item, 'option', false));

	if (option != null) {
		toggleOptionListOption(state, option);
	}
}

export function onComboboxNavigation(
	preview: OptionListPreview,
	state: OuiComboboxState,
	active?: Element,
): void {
	updateOptionListPreview(preview, state, active);
}

export function onComboboxSelection(state: OuiComboboxState, hasSelection?: boolean): void {
	const {active, anchor, filter} = state.component;

	if (!(hasSelection ?? hasTextSelection(anchor.element))) {
		return;
	}

	filter.value = anchor.element === filter.element ? filter.element.value : '';

	toggleOptionListOption(state, filterOptionListOptions(state) ?? active);
}

export function onComboboxTab(state: OuiComboboxState): void {
	setTimeout(() => {
		const {floatable, host, selection} = state.component;

		if (host === document.activeElement) {
			return;
		}

		if (
			selection?.container.contains(document.activeElement) ||
			!host.contains(document.activeElement)
		) {
			floatable.hide();
		}
	});
}

export function onComboboxToggle(state: OuiComboboxState): void {
	if (!state.component.multiple) {
		state.component.floatable.hide();
	}
}

export function preventComboboxActivation(state: OuiComboboxState): boolean {
	return state.component.floatable.open;
}

export function skipComboboxNavigation(state: OuiComboboxState): boolean {
	if (state.component.floatable.open) {
		return false;
	}

	state.component.floatable.show();

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
