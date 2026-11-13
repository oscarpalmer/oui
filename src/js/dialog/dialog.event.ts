import {promises} from '@oscarpalmer/atoms/promise';
import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {setStyles} from '@oscarpalmer/toretto/style';
import {
	DIALOG_ATTRIBUTE_OPEN,
	DIALOG_SYMBOL,
	type OuiDialog,
	type OuiDialogState,
} from './dialog.model';

// #region Functions

export function getDialogOpen(this: OuiDialog): boolean {
	return this[DIALOG_SYMBOL].element.open;
}

export function hideDialog(this: OuiDialog, first?: unknown, second?: unknown): void {
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

export function onDialogToggle(event: ToggleEvent, state: OuiDialogState): void {
	const {source} = event;
	const {element} = state;

	if (element.open) {
		const modal =
			(source instanceof HTMLButtonElement && source.command === 'show-modal') ||
			element.matches(':modal');

		setAria(element, 'modal', modal);
		setAttribute(element, DIALOG_ATTRIBUTE_OPEN, '');

		element.focus();

		void promises(element.getAnimations().map(animation => animation.finished)).then(() =>
			state.resizable?.set(),
		);
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
}

export function setDialogOpen(this: OuiDialog, value: unknown): void {
	if (value === true) {
		this.show();
	} else if (value === false) {
		this.hide();
	}
}

export function showDialog(this: OuiDialog, value: unknown): void {
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
