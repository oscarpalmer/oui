import {attributable} from '../internal/attributable';
import {getDialogOpen, hideDialog, setDialogOpen, showDialog} from './dialog.event';
import {addDialog, removeDialog} from './dialog.misc';
import {DIALOG_ATTRIBUTE, DIALOG_SYMBOL, type OuiDialog, type OuiDialogState} from './dialog.model';

// #region Instances

function OuiDialog(this: OuiDialog, state: OuiDialogState): void {
	this[DIALOG_SYMBOL] = state;
}

OuiDialog.prototype.hide = hideDialog;
OuiDialog.prototype.show = showDialog;

Object.defineProperties(OuiDialog.prototype, {
	open: {
		enumerable: true,
		get: getDialogOpen,
		set: setDialogOpen,
	},
});

// #endregion

// #region Initialization

// @ts-expect-error All good, no worries :-)
attributable(DIALOG_ATTRIBUTE, addDialog.bind(state => new OuiDialog(state)), removeDialog);

// #endregion

// #region Exports

export {getDialog} from './dialog.misc';
export type {OuiDialog} from './dialog.model';

// #endregion
