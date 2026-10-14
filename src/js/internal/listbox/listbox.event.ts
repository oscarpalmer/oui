import {clamp} from '@oscarpalmer/atoms/number';
import {LISTBOX_KEYS_NAVIGATION, LISTBOX_KEYS_SELECTION} from './listbox.constants';
import {getListboxVisibleOptions} from './listbox.misc';
import type {OuiListboxPreview, OuiListboxState} from './listbox.model';

// #region Functions

export function processListboxKeydown<State extends OuiListboxState>(
	event: KeyboardEvent,
	state: State,
): void {
	const {component, form} = state;
	const {callbacks, disabled, readonly, type} = component;

	const ignore = disabled || readonly;
	const isSelect = type === 'select';

	let preventDefault = ignore;

	switch (true) {
		case event.key === ' ': {
			if (!disabled) {
				callbacks.keydown.onActivation?.(state);
			}

			break;
		}

		case event.key === 'Enter': {
			preventDefault = callbacks.keydown.preventActivation?.(state) ?? true;

			if (preventDefault) {
				callbacks.keydown.onEnter?.(state);
			} else if (!ignore && type === 'select') {
				callbacks.keydown.onActivation?.(state);
			} else if (!ignore) {
				form.internals.form?.requestSubmit();
			}

			break;
		}

		case event.key === 'Escape': {
			preventDefault = false;

			callbacks.keydown.onEscape?.(state);

			break;
		}

		case !isSelect && LISTBOX_KEYS_SELECTION.has(event.key): {
			if (!ignore) {
				callbacks.keydown.onSelection?.(state);
			}

			break;
		}

		case LISTBOX_KEYS_NAVIGATION.has(event.key): {
			if (!disabled) {
				onNavigation(event, state);
			}

			break;
		}

		default: {
			preventDefault = false;

			if (event.key === 'Tab') {
				callbacks.keydown.onTab?.(state);
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
	const {active, autocomplete, callbacks, type} = state.component;

	const skip = callbacks.keydown.skipNavigation?.(state) ?? false;
	const visible = getListboxVisibleOptions(state);

	if (visible.length === 0) {
		return;
	}

	let next: HTMLElement | undefined;

	if (skip || active == null) {
		next = active ?? visible.at(event.key === 'ArrowDown' ? 0 : -1);
	} else {
		const current = visible.findIndex(option => option.id === active?.id);

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

	if (type === 'autocomplete' && (autocomplete.both || autocomplete.inline)) {
		preview = 'set';
	} else {
		preview = 'none';
	}

	callbacks.keydown.onNavigation(preview, state, next ?? active ?? visible[0]);
}

// #endregion
