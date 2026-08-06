import {clamp} from '@oscarpalmer/atoms/number';
import {dispatch} from '@oscarpalmer/toretto/event';
import {LISTBOX_KEYS} from './listbox.constants';
import {filterListboxOptions} from './listbox.data';
import {getListboxVisibleOptions} from './listbox.misc';
import type {OuiListboxPreview, OuiListboxState} from './listbox.model';

// #region Functions

export function onListboxFilter(type: InputEvent['inputType'], state: OuiListboxState): void {
	if (state.disabled || state.readonly) {
		return;
	}

	const update = state.filter.element.value !== state.filter.value;

	const option = filterListboxOptions(state);

	let preview: OuiListboxPreview | undefined;

	if (type.includes('delete')) {
		preview = 'none';
	} else if (type.includes('insert')) {
		preview = 'typed';
	}

	if (preview != null) {
		state.callbacks.data.onFilter(preview, state, update, option);
	}

	if (update) {
		state.filter.value = state.filter.element.value;

		dispatch(state.host, 'input');
	}
}

export function onListboxKeydown<State extends OuiListboxState>(
	event: KeyboardEvent,
	state: State,
): void {
	const ignore = state.disabled || state.readonly;
	const isSelect = state.type === 'select';

	let preventDefault = ignore;

	switch (true) {
		case event.key === ' ': {
			if (!state.disabled) {
				state.callbacks.keydown.onActivation?.(state);
			}

			break;
		}

		case event.key === 'Enter': {
			preventDefault = true; // state.floatable.open;

			if (preventDefault) {
				state.callbacks.keydown.onEnter?.(state);
			} else if (!ignore && state.type === 'select') {
				state.callbacks.keydown.onActivation?.(state);
			} else if (!ignore) {
				state.internals.form?.requestSubmit();
			}

			break;
		}

		case event.key === 'Escape': {
			preventDefault = false;

			state.callbacks.keydown.onEscape?.(state);

			break;
		}

		case !isSelect && LISTBOX_KEYS.selection.has(event.key): {
			if (!ignore) {
				state.callbacks.keydown.onSelection?.(state);
			}

			break;
		}

		case LISTBOX_KEYS.navigation.has(event.key): {
			if (!state.disabled) {
				onNavigation(event, state);
			}

			break;
		}

		default: {
			preventDefault = false;

			if (event.key === 'Tab') {
				state.callbacks.keydown.onTab?.(state);
			}

			break;
		}
	}

	if (preventDefault) {
		event.preventDefault();
		event.stopPropagation();
	}
}

function onNavigation<State extends OuiListboxState>(event: KeyboardEvent, state: State): void {
	const skip = state.callbacks.keydown.skipNavigation?.(state) ?? false;
	const visible = getListboxVisibleOptions(state);

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

	let preview: OuiListboxPreview;

	if (state.type === 'autocomplete' && (state.autocomplete.both || state.autocomplete.inline)) {
		preview = 'set';
	} else {
		preview = 'none';
	}

	state.callbacks.keydown.onNavigation(preview, state, next ?? state.active ?? visible[0]);
}

// #endregion
