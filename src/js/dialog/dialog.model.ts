import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import type {OuiMovable} from '../movable/movable.model';
import type {OuiResizable} from '../resizable/resizable.model';

// #region Types

export type OuiDialog = {
	[DIALOG_SYMBOL]: OuiDialogState;

	/**
	 * Is the dialog open?
	 */
	get open(): boolean;

	/**
	 * Open or close the dialog
	 */
	set open(value: boolean);

	/**
	 * Closes the dialog by request
	 */
	hide(request: true, value?: string): void;

	/**
	 * Closes the dialog
	 */
	hide(value?: string): void;

	/**
	 * Opens the dialog
	 */
	show(modal?: boolean): void;
};

export type OuiDialogState = {
	dialog: OuiDialog;
	element: HTMLDialogElement;
	listeners: RemovableEventListener[];
	modal: boolean;
	movable?: OuiMovable;
	resizable?: OuiResizable;
};

// #endregion

// #region Variables

export const DIALOG_ATTRIBUTE = 'oui-dialog';

export const DIALOG_ATTRIBUTE_CONTAINER: string = `${DIALOG_ATTRIBUTE}-container`;

export const DIALOG_ATTRIBUTE_OPEN: string = `${DIALOG_ATTRIBUTE}-open`;

export const DIALOG_MESSAGE = 'The element must be an instance of HTMLDialogElement';

export const DIALOG_SELECTOR_MOVER: string = `[${DIALOG_ATTRIBUTE}-mover]`;

export const DIALOG_SELECTOR_RESIZER: string = `[${DIALOG_ATTRIBUTE}-resizer]`;

export const DIALOG_SYMBOL: unique symbol = Symbol(DIALOG_ATTRIBUTE);

export const dialogs: WeakMap<Element, OuiDialogState> = new WeakMap();

// #endregion
