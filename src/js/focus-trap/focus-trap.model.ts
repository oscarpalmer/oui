// #region Types

export type OuiFocusTrap = {
	[FOCUSTRAP_SYMBOL]: OuiFocusTrapState;

	/**
	 * Is focused maintained within the _focus trap_ when clicking outside of it?
	 */
	get contain(): boolean;

	/**
	 * Should focus be maintained within the _focus trap_ when clicking outside of it?
	 */
	set contain(value: boolean);

	/**
	 * Is the _focus trap_ disabled?
	 */
	get disabled(): boolean;

	/**
	 * Should the _focus trap_ be disabled?
	 */
	set disabled(value: boolean);

	/**
	 * Is focus allowed to escape when pressing _Escape_ within the _focus trap_?
	 */
	get noescape(): boolean;

	/**
	 * Should the _focus trap_ allow focus to escape when pressing _Escape_?
	 */
	set noescape(value: boolean);

	/**
	 * Destroys the _focus trap_
	 */
	destroy(): void;

	/**
	 * Disables the _focus trap_
	 */
	disable(): void;

	/**
	 * Enables the _focus trap_
	 */
	enable(): void;

	/**
	 * Focuses the _focus trap_
	 *
	 * @param last When `true`, focuses the last focusable element within the _focus trap_ instead of the first
	 */
	focus(last: boolean): void;
};

export type OuiFocusTrapOptions = {
	/**
	 * Should focus be maintained within the _focus trap_ when clicking outside of it?
	 */
	contain?: boolean;
	/**
	 * Should the _focus trap_ allow focus to escape when pressing _Escape_?
	 */
	noescape?: boolean;
};

export type OuiFocusTrapState = {
	destroyed: boolean;
	disabled: boolean;
	element: HTMLElement;
	options: Required<OuiFocusTrapOptions>;
	tabIndex: number;
};

// #endregion

// #region Variables

export const FOCUSTRAP_ATTRIBUTE = 'oui-focus-trap';

export const FOCUSTRAP_ATTRIBUTE_CONTAIN: string = `${FOCUSTRAP_ATTRIBUTE}-contain`;

export const FOCUSTRAP_ATTRIBUTE_NOESCAPE: string = `${FOCUSTRAP_ATTRIBUTE}-noescape`;

export const FOCUSTRAP_EVENT_NAME: string = `${FOCUSTRAP_ATTRIBUTE}:focus`;

export const FOCUSTRAP_EVENT_OPTIONS: AddEventListenerOptions = {
	capture: true,
	passive: false,
};

export const FOCUSTRAP_MESSAGE = 'Element must be an HTMLElement or SVGElement';

export const FOCUSTRAP_SELECTOR: string = `[${FOCUSTRAP_ATTRIBUTE}]`;

export const FOCUSTRAP_SYMBOL: unique symbol = Symbol(FOCUSTRAP_ATTRIBUTE);

export const disabledFocusTraps: Set<OuiFocusTrap> = new Set();

export const focusTraps: WeakMap<Element, OuiFocusTrap> = new WeakMap();

// #endregion
