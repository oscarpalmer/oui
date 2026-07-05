import {on} from '@oscarpalmer/toretto/event';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {getOnBeforeToggleListener} from './floatable/floatable.embedded';
import {attributable} from './internal/attributable';
import {ATTRIBUTE_MOVABLE_HANDLE} from './movable/movable.embedded';
import {createMovable, type OuiMovable} from './movable/movable.standalone';
import {createResizable, RESIZABLE_ATTRIBUTE_HANDLE} from './resizable/resizable.embedded';
import type {OuiResizable} from './resizable/resizable.standalone';

// #region Types

class OuiDialog {
	readonly #state: OuiDialogState;

	/**
	 * Is the dialog open?
	 */
	get open(): boolean {
		return this.#state.element.open;
	}

	/**
	 * Open or close the dialog
	 */
	set open(value: boolean) {
		if (value === true) {
			this.show();
		} else if (value === false) {
			this.hide();
		}
	}

	constructor(state: OuiDialogState) {
		this.#state = state;
	}

	/**
	 * Closes the dialog by request
	 */
	hide(request: true, value?: string): void;

	/**
	 * Closes the dialog
	 */
	hide(value?: string): void;

	hide(first?: string | boolean, second?: string): void {
		if (!this.#state.element.open) {
			return;
		}

		if (first === true) {
			this.#state.element.requestClose(typeof second === 'string' ? second : undefined);
		} else {
			this.#state.element.close(typeof first === 'string' ? first : undefined);
		}
	}

	/**
	 * Opens the dialog
	 */
	show(modal?: boolean): void {
		const {element} = this.#state;

		if (element == null || element.open) {
			return;
		}

		const isModal = modal !== false;

		element.setAttribute(ARIA_MODAL, String(isModal));

		if (isModal) {
			element.showModal();
		} else {
			element.show();
		}
	}
}

type OuiDialogState = {
	dialog: OuiDialog;
	element: HTMLDialogElement;
	listeners: RemovableEventListener[];
	modal: boolean;
	movable?: OuiMovable;
	resizable?: OuiResizable;
};

// #endregion

// #region Functions

function addDialog(element: HTMLElement): void {
	if (!(element instanceof HTMLDialogElement)) {
		throw new TypeError(MESSAGE);
	}

	if (!states.has(element)) {
		states.set(element, getState(element));
	}
}

function destroyDialog(state: OuiDialogState): void {
	state.element.close();

	state.element.setAttribute(ARIA_MODAL, String(state.modal));
	state.element.removeAttribute(ATTRIBUTE_OPEN);

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
	return states.get(element)?.dialog;
}

function getMovable(element: HTMLDialogElement): OuiMovable | undefined {
	const handles = element.querySelectorAll(SELECTOR_MOVER);

	if (handles.length === 0) {
		return;
	}

	for (const handle of handles) {
		handle.setAttribute(ATTRIBUTE_MOVABLE_HANDLE, '');
	}

	return createMovable(element, {
		container: element.getAttribute(ATTRIBUTE_CONTAINER) ?? undefined,
	});
}

function getResizable(element: HTMLDialogElement): OuiResizable | undefined {
	const handle = element.querySelector(SELECTOR_RESIZER);

	if (handle == null) {
		return;
	}

	handle.setAttribute(RESIZABLE_ATTRIBUTE_HANDLE, '');

	return createResizable(element);
}

function getState(element: HTMLDialogElement): OuiDialogState {
	const state: OuiDialogState = {
		element,
		dialog: undefined as never,
		listeners: [
			getOnBeforeToggleListener(element),
			on(element, EVENT_TOGGLE, event => {
				const {source} = event;

				if (element.open) {
					const modal =
						(source instanceof HTMLButtonElement && source.command === COMMAND_SHOW_MODAL) ||
						element.matches(SELECTOR_MODAL);

					element.setAttribute(ARIA_MODAL, String(modal));
					element.setAttribute(ATTRIBUTE_OPEN, '');

					element.focus();

					setTimeout(() => {
						state.resizable?.set();
					}, 500);
				} else {
					element.removeAttribute(ATTRIBUTE_OPEN);
					element.setAttribute(ARIA_MODAL, String(state.modal));

					element.style.inset = '';
					element.style.position = '';
					element.style.transform = '';

					state.resizable?.reset();
				}
			}),
		],
		modal: element.getAttribute(ARIA_MODAL) === TRUE,
	};

	state.dialog = new OuiDialog(state);

	state.movable = getMovable(element);
	state.resizable = getResizable(element);

	return state;
}

function removeDialog(element: HTMLElement): void {
	const state = states.get(element);

	if (state == null) {
		return;
	}

	destroyDialog(state);

	states.delete(element);
}

// #endregion

// #region Variables

const ARIA_MODAL = 'aria-modal';

const ATTRIBUTE = 'oui-dialog';

const ATTRIBUTE_CONTAINER = `${ATTRIBUTE}-container`;

const ATTRIBUTE_OPEN = `${ATTRIBUTE}-open`;

const COMMAND_SHOW_MODAL = 'show-modal';

const EVENT_TOGGLE = 'toggle';

const MESSAGE = 'The element must be an instance of HTMLDialogElement';

const SELECTOR_MOVER = `[${ATTRIBUTE}-mover]`;

const SELECTOR_MODAL = ':modal';

const SELECTOR_RESIZER = `[${ATTRIBUTE}-resizer]`;

const TRUE = 'true';

const states = new WeakMap<HTMLElement, OuiDialogState>();

// #endregion

// #region Initialization

attributable(ATTRIBUTE, addDialog, removeDialog);

// #endregion

// #region Exports

export {getDialog, type OuiDialog};

// #endregion
