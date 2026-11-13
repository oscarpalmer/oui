import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {on} from '@oscarpalmer/toretto/event';
import {getOnBeforeToggleListener} from '../floatable/floatable.embedded';
import {createMovable} from '../movable/movable.embedded';
import {MOVABLE_ATTRIBUTE_HANDLE, type OuiMovable} from '../movable/movable.model';
import {createResizable} from '../resizable/resizable.embedded';
import {RESIZABLE_ATTRIBUTE_HANDLE, type OuiResizable} from '../resizable/resizable.model';
import {onDialogToggle} from './dialog.event';
import {
	DIALOG_ATTRIBUTE_CONTAINER,
	DIALOG_ATTRIBUTE_OPEN,
	DIALOG_ATTRIBUTE_TABBED,
	DIALOG_MESSAGE,
	DIALOG_SELECTOR_MOVER,
	DIALOG_SELECTOR_RESIZER,
	dialogs,
	type OuiDialog,
	type OuiDialogState,
	type OuiDialogTab,
} from './dialog.model';
import {createElement} from '@oscarpalmer/toretto/create';

// #region Functions

export function addDialog(this: (state: OuiDialogState) => OuiDialog, element: Element): void {
	if (!(element instanceof HTMLDialogElement)) {
		throw new TypeError(DIALOG_MESSAGE);
	}

	if (!dialogs.has(element)) {
		dialogs.set(element, getState(element, this));
	}
}

function destroyDialog(state: OuiDialogState): void {
	state.element.close();

	setAria(state.element, 'modal', state.modal);

	state.element.removeAttribute(DIALOG_ATTRIBUTE_OPEN);

	for (const listener of state.listeners) {
		listener();
	}

	state.movable?.destroy();
	state.resizable?.destroy();

	state.dialog = undefined as never;
	state.element = undefined as never;
	state.listeners = undefined as never;
	state.movable = undefined;
	state.resizable = undefined;
}

/**
 * Get the _OuiDialog_ for an element
 *
 * @param element Element to get _OuiDialog_ for
 * @returns _OuiDialog_ instance
 */
export function getDialog(element: HTMLDialogElement): OuiDialog | undefined {
	return dialogs.get(element)?.dialog;
}

function getMovable(state: OuiDialogState): OuiMovable | undefined {
	const {element} = state;

	const handles = element.querySelectorAll(DIALOG_SELECTOR_MOVER);

	if (handles.length === 0) {
		return;
	}

	for (const handle of handles) {
		setAttribute(handle, MOVABLE_ATTRIBUTE_HANDLE, '');
	}

	return createMovable(element, {
		container: getAttribute(element, DIALOG_ATTRIBUTE_CONTAINER),
	});
}

function getResizable(state: OuiDialogState): OuiResizable | undefined {
	const {element} = state;

	const handle = element.querySelector(DIALOG_SELECTOR_RESIZER);

	if (handle == null) {
		return;
	}

	setAttribute(handle, RESIZABLE_ATTRIBUTE_HANDLE, '');

	return createResizable(element);
}

function getState(
	element: HTMLDialogElement,
	getDialog: (state: OuiDialogState) => OuiDialog,
): OuiDialogState {
	const state: OuiDialogState = {
		element,
		dialog: undefined as never,
		listeners: [
			getOnBeforeToggleListener(element),
			on(element, 'toggle', event => onDialogToggle(event, state)),
		],
		modal: isModal(element),
	};

	state.dialog = getDialog(state);
	state.movable = getMovable(state);
	state.resizable = getResizable(state);

	if (state.movable != null) {
		state.tab = getTab(state);
	}

	return state;
}

function getTab(state: OuiDialogState): OuiDialogTab | undefined {
	if (!state.element.hasAttribute(DIALOG_ATTRIBUTE_TABBED)) {
		return;
	}

	const element = createElement('div', {
		attribute: {
			popover: '',
		},
		property: {
			textContent: 'Tab',
		},
	});

	state.listeners.push(
		on(element, 'click', () => {
			// ?
		}),
	);

	const movable = createMovable(element, {
		container: 'body',
	});

	return {
		element,
		movable,
	};
}

function isModal(element: HTMLDialogElement): boolean {
	return getAria(element, 'modal') === true || element.matches(':modal');
}

export function removeDialog(element: Element): void {
	const state = dialogs.get(element);

	if (state == null) {
		return;
	}

	destroyDialog(state);

	dialogs.delete(element);
}

// #endregion
