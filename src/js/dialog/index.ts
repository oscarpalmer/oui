import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {on} from '@oscarpalmer/toretto/event';
import {setStyles} from '@oscarpalmer/toretto/style';
import {getOnBeforeToggleListener} from '../floatable/floatable.embedded';
import {attributable} from '../internal/attributable';
import {MOVABLE_ATTRIBUTE_HANDLE} from '../movable/movable.model';
import {createMovable, type OuiMovable} from '../movable/movable.standalone';
import {createResizable} from '../resizable/resizable.embedded';
import {RESIZABLE_ATTRIBUTE_HANDLE} from '../resizable/resizable.model';
import type {OuiResizable} from '../resizable/resizable.standalone';
import {
	DIALOG_ATTRIBUTE,
	DIALOG_ATTRIBUTE_CONTAINER,
	DIALOG_ATTRIBUTE_OPEN,
	DIALOG_MESSAGE,
	DIALOG_SELECTOR_MOVER,
	DIALOG_SELECTOR_RESIZER,
	DIALOG_SYMBOL,
	dialogs,
	type OuiDialog,
	type OuiDialogState,
} from './dialog.model';

// #region Instances

function OuiDialog(this: OuiDialog, state: OuiDialogState): void {
	this[DIALOG_SYMBOL] = state;
}

OuiDialog.prototype.hide = hideDialog;
OuiDialog.prototype.show = showDialog;

Object.defineProperties(OuiDialog.prototype, {
	open: {
		enumerable: true,
		get: getOpen,
		set: setOpen,
	},
});

// #endregion

// #region Functions

function addDialog(element: HTMLElement): void {
	if (!(element instanceof HTMLDialogElement)) {
		throw new TypeError(DIALOG_MESSAGE);
	}

	if (!dialogs.has(element)) {
		dialogs.set(element, getState(element));
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
function getDialog(element: HTMLDialogElement): OuiDialog | undefined {
	return dialogs.get(element)?.dialog;
}

function getMovable(element: HTMLDialogElement): OuiMovable | undefined {
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

function getOpen(this: OuiDialog): boolean {
	return this[DIALOG_SYMBOL].element.open;
}

function getResizable(element: HTMLDialogElement): OuiResizable | undefined {
	const handle = element.querySelector(DIALOG_SELECTOR_RESIZER);

	if (handle == null) {
		return;
	}

	setAttribute(handle, RESIZABLE_ATTRIBUTE_HANDLE, '');

	return createResizable(element);
}

function getState(element: HTMLDialogElement): OuiDialogState {
	const state: OuiDialogState = {
		element,
		dialog: undefined as never,
		listeners: [
			getOnBeforeToggleListener(element),
			on(element, 'toggle', event => {
				const {source} = event;

				if (element.open) {
					const modal =
						(source instanceof HTMLButtonElement && source.command === 'show-modal') ||
						element.matches(':modal');

					setAria(element, 'modal', modal);
					setAttribute(element, DIALOG_ATTRIBUTE_OPEN, '');

					element.focus();

					setTimeout(() => {
						state.resizable?.set();
					}, 500);
				} else {
					setAttribute(element, DIALOG_ATTRIBUTE_OPEN);
					setAria(element, 'modal', state.modal);

					setStyles(element, {
						inset: '',
						position: '',
						transform: '',
					});

					state.resizable?.reset();
				}
			}),
		],
		modal: getAria(element, 'modal') === true || element.matches(':modal'),
	};

	// @ts-expect-error All good, no worries :-)
	state.dialog = new OuiDialog(state);

	state.movable = getMovable(element);
	state.resizable = getResizable(element);

	return state;
}

function hideDialog(this: OuiDialog, first?: unknown, second?: unknown): void {
	const {element} = this[DIALOG_SYMBOL];

	if (!element.open) {
		return;
	}

	if (first === true) {
		element.requestClose(typeof second === 'string' ? second : undefined);
	} else {
		element.close(typeof first === 'string' ? first : undefined);
	}
}

function removeDialog(element: HTMLElement): void {
	const state = dialogs.get(element);

	if (state == null) {
		return;
	}

	destroyDialog(state);

	dialogs.delete(element);
}

function setOpen(this: OuiDialog, value: unknown): void {
	if (value === true) {
		this.show();
	} else if (value === false) {
		this.hide();
	}
}

function showDialog(this: OuiDialog, value: unknown): void {
	const {element} = this[DIALOG_SYMBOL];

	if (element == null || element.open) {
		return;
	}

	const isModal = value !== false;

	setAria(element, 'modal', isModal);

	if (isModal) {
		element.showModal();
	} else {
		element.show();
	}
}

// #endregion

// #region Variables

// #endregion

// #region Initialization

attributable(DIALOG_ATTRIBUTE, addDialog, removeDialog);

// #endregion

// #region Exports

export {getDialog, type OuiDialog};

// #endregion
