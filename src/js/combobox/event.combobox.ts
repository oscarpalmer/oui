import {clamp} from '@oscarpalmer/atoms/number';
import {dispatch, findAncestor, getData} from '@oscarpalmer/toretto';
import {on} from '@oscarpalmer/toretto/event';
import {
	COMBOBOX_ATTRIBUTE_SELECTION_ITEM,
	COMBOBOX_KEYS_ACTIVATION,
	COMBOBOX_KEYS_NAVIGATION,
	COMBOBOX_KEYS_SELECTION,
	COMBOBOX_SELECTOR_ANCHOR,
	COMBOBOX_SELECTOR_OPTION,
	COMBOBOX_SELECTOR_SELECTION_ITEM,
	COMBOBOX_TAGNAME,
} from './constants.combobox';
import {
	applyComboboxSelection,
	filterComboboxOption,
	filterComboboxOptions,
	toggleComboboxOption,
} from './data.combobox';
import {updateComboboxPreview, updateComboboxTabindices} from './dom.combobox';
import type {OuiComboboxElement} from './index';
import {getComboboxVisibleOptions, hasTextSelection} from './misc.combobox';
import type {OuiComboboxPreview, OuiComboboxState} from './models.combobox';
import {comboboxStates} from './state.combobox';

// #region Functions

export function onComboboxClickContent(event: PointerEvent, content: HTMLElement): void {
	const state = comboboxStates.map.get(content);

	if (state == null) {
		return;
	}

	if (state.disabled) {
		return;
	}

	const option = findAncestor(event, COMBOBOX_SELECTOR_OPTION);

	if (!(option instanceof HTMLElement)) {
		state.filter.element.focus();
	} else if (state.readonly) {
		updateComboboxPreview('set', state, option);
	} else {
		toggleComboboxOption(state, option);
	}
}

export function onComboboxClickDocument(event: PointerEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME) as OuiComboboxElement | null;
	const state = comboboxStates.map.get(combobox!);

	if (combobox == null || state == null) {
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
			toggleComboboxOption(state, option);
		}

		return;
	}

	const anchor = findAncestor(event, COMBOBOX_SELECTOR_ANCHOR);

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
		onComboboxSelection(state);
	} else {
		toggleComboboxOption(state, state.active);
	}
}

export function onComboboxEscape(state: OuiComboboxState): void {
	state.floatable.hide();
}

export function onComboboxFilter(
	type: InputEvent['inputType'],
	state: OuiComboboxState,
	manual?: boolean,
	emit?: boolean,
): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const diff = state.filter.value !== state.filter.element.value;

	if (!state.autocomplete.inline && state.filter.element.value.length > 0 && !(manual ?? false)) {
		state.floatable.show();
	}

	const option = state.autocomplete.none
		? (state.active ?? state.options.all[0])
		: filterComboboxOptions(state);

	let update: OuiComboboxPreview | undefined;

	if (type.includes('delete')) {
		update = 'none';
	} else if (type.includes('insert')) {
		update = 'typed';
	}

	if (update != null) {
		if (state.autocomplete.none) {
			applyComboboxSelection({state, added: false, emit: (emit ?? true) && diff});
		} else {
			updateComboboxPreview(update, state, option);
		}
	}

	if (diff) {
		state.filter.value = state.filter.element.value;

		dispatch(state.host, 'input');
	}
}

export function onComboboxFocusout(state: OuiComboboxState): void {
	if (
		state.disabled ||
		state.readonly ||
		state.type === 'select' ||
		state.host === document.activeElement ||
		state.host.contains(document.activeElement)
	) {
		return;
	}

	const option = filterComboboxOption(state, state.filter.element.value, true);

	applyComboboxSelection({
		option,
		state,
		added: false,
		selected: option == null ? [] : [option],
	});
}

export function onComboboxInput(event: InputEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME) as OuiComboboxElement | null;
	const state = comboboxStates.map.get(combobox!);

	if (combobox != null && state != null && event.target === state.filter.element) {
		onComboboxFilter(event.inputType, state);
	}
}

export function onComboboxKeydown(event: KeyboardEvent): void {
	const combobox = findAncestor(event, COMBOBOX_TAGNAME) as OuiComboboxElement | null;
	const state = comboboxStates.map.get(combobox!);

	if (combobox == null || state == null) {
		return;
	}

	const item = findAncestor(event, COMBOBOX_SELECTOR_SELECTION_ITEM);

	if (item instanceof HTMLElement) {
		onComboboxKeydownSelection(event, state, item);

		return;
	}

	onComboboxKeydownFilter(event, state);
}

function onComboboxKeydownFilter(event: KeyboardEvent, state: OuiComboboxState): void {
	const ignore = state.disabled || state.readonly;
	const isSelect = state.type === 'select';

	let preventDefault = ignore;

	switch (true) {
		case event.key === ' ': {
			if (!state.disabled) {
				state.floatable.show();
			}

			break;
		}

		case event.key === 'Enter': {
			preventDefault = state.floatable.open;

			if (preventDefault) {
				onComboboxEnter(state);
			} else if (!ignore && state.type === 'select') {
				state.floatable.show();
			} else if (!ignore) {
				state.internals.form?.requestSubmit();
			}

			break;
		}

		case event.key === 'Escape': {
			preventDefault = false;

			onComboboxEscape(state);

			break;
		}

		case !isSelect && COMBOBOX_KEYS_SELECTION.has(event.key): {
			if (!ignore && hasTextSelection(state.anchor.element)) {
				onComboboxSelection(state);
			}

			break;
		}

		case COMBOBOX_KEYS_NAVIGATION.has(event.key): {
			if (!state.disabled) {
				onComboboxNavigation(event, state);
			}

			break;
		}

		default: {
			preventDefault = false;

			if (event.key === 'Tab') {
				onComboboxTab(state);
			}

			break;
		}
	}

	if (preventDefault) {
		event.preventDefault();
		event.stopPropagation();
	}
}

export function onComboboxKeydownSelection(
	event: KeyboardEvent,
	state: OuiComboboxState,
	item: HTMLElement,
): void {
	if (COMBOBOX_KEYS_ACTIVATION.has(event.key)) {
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

export function onComboboxNavigation(event: KeyboardEvent, state: OuiComboboxState): void {
	let skip = false;

	if (!state.floatable.open) {
		skip = true;

		state.floatable.show();
	}

	const visible = getComboboxVisibleOptions(state);

	if (visible.length === 0) {
		return;
	}

	let next: HTMLElement | undefined;

	if (skip || state.active == null) {
		next = state.active ?? visible.at(event.key === 'ArrowDown' ? 0 : -1);
	} else {
		const current = visible.findIndex(option => option.id === state.active?.id);

		let index: number | undefined;

		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
				index = clamp(current + (event.key === 'ArrowDown' ? 1 : -1), 0, visible.length - 1, true);
				break;

			case 'End':
				index = visible.length - 1;
				break;

			case 'Home':
				index = 0;
				break;

			case 'PageDown':
			case 'PageUp':
				index = clamp(current + (event.key === 'PageDown' ? 10 : -10), 0, visible.length - 1);
				break;

			default:
				break;
		}

		if (index != null) {
			next = visible[index];
		}
	}

	let preview: OuiComboboxPreview;

	if (state.type === 'autocomplete' && (state.autocomplete.both || state.autocomplete.inline)) {
		preview = 'set';
	} else {
		preview = 'none';
	}

	updateComboboxPreview(preview, state, next ?? state.active ?? visible[0]);
}

export function onComboboxRemoveSelection(state: OuiComboboxState, item: HTMLElement): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const option = state.options.selected.find(
		option => option.id === getData(item, 'option', false),
	);

	if (option != null) {
		toggleComboboxOption(state, option);
	}
}

export function onComboboxSelection(state: OuiComboboxState): void {
	state.filter.value =
		state.anchor.element === state.filter.element ? state.filter.element.value : '';

	toggleComboboxOption(state, filterComboboxOptions(state) ?? state.active);
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

// #endregion

// #region Initialization

on(document, 'click', onComboboxClickDocument);

on(document, 'input', onComboboxInput, {
	passive: false,
});

on(document, 'keydown', onComboboxKeydown, {
	passive: false,
});

// #endregion
