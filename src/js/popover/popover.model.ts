import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import type {OuiFloatable, OuiFloatableOptions} from '../floatable/floatable.model';
import type {OuiFocusTrap} from '../focus-trap/focus-trap.model';

// #region Types

export type OuiPopover = {
	[POPOVER_SYMBOL]: OuiPopoverState;

	/**
	 * Is the popover open?
	 */
	get open(): boolean;

	/**
	 * Open or close the popover
	 */
	set open(value: boolean);

	/**
	 * Closes the popover
	 */
	hide(): void;

	/**
	 * Opens the popover
	 */
	show(): void;
};

export type OuiPopoverState = {
	anchor: HTMLElement;
	content: HTMLElement;
	floatable: OuiFloatable;
	focusTrap?: OuiFocusTrap;
	listeners: RemovableEventListener[];
	popover: OuiPopover;
};

// #endregion

// #region Variables

export const POPOVER_ATTRIBUTE = 'oui-popover';

export const POPOVER_ATTRIBUTE_OPEN: string = `${POPOVER_ATTRIBUTE}-open`;

export const POPOVER_SYMBOL: unique symbol = Symbol(POPOVER_ATTRIBUTE);

export const popoverFloatableOptions: OuiFloatableOptions = {
	attribute: `${POPOVER_ATTRIBUTE}-position`,
	position: 'below-start',
	reusable: false,
};

export const popovers: WeakMap<HTMLElement, OuiPopoverState> = new WeakMap();

// #endregion
