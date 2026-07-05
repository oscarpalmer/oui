import {isPlainObject} from '@oscarpalmer/atoms/is';
import {clamp} from '@oscarpalmer/atoms/number';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {getFocusable} from '@oscarpalmer/toretto/focusable';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {attributable} from '../internal/attributable';

// #region Types

export class OuiFocusTrap {
	#destroyed = false;
	#tabIndex: number;

	readonly #state: OuiFocusTrapState;

	/**
	 * Is focused maintained within the _focus trap_ when clicking outside of it?
	 */
	get contain(): boolean {
		return this.#state.element.hasAttribute(ATTRIBUTE_FOCUSTRAP_CONTAIN);
	}

	/**
	 * Should focus be maintained within the _focus trap_ when clicking outside of it?
	 */
	set contain(value: boolean) {
		if (value === true) {
			this.#state.element.setAttribute(ATTRIBUTE_FOCUSTRAP_CONTAIN, '');
		} else if (value === false) {
			this.#state.element.removeAttribute(ATTRIBUTE_FOCUSTRAP_CONTAIN);
		}
	}

	/**
	 * Is the _focus trap_ disabled?
	 */
	get disabled(): boolean {
		return this.#state.disabled;
	}

	/**
	 * Should the _focus trap_ be disabled?
	 */
	set disabled(value: boolean) {
		if (value === true) {
			this.disable();
		} else if (value === false) {
			this.enable();
		}
	}

	/**
	 * Is focus allowed to escape when pressing _Escape_ within the _focus trap_?
	 */
	get noescape(): boolean {
		return this.#state.element.hasAttribute(ATTRIBUTE_FOCUSTRAP_NOESCAPE);
	}

	/**
	 * Should the _focus trap_ allow focus to escape when pressing _Escape_?
	 */
	set noescape(value: boolean) {
		if (value === true) {
			this.#state.element.setAttribute(ATTRIBUTE_FOCUSTRAP_NOESCAPE, '');
		} else if (value === false) {
			this.#state.element.removeAttribute(ATTRIBUTE_FOCUSTRAP_NOESCAPE);
		}
	}

	constructor(state: OuiFocusTrapState) {
		this.#state = state;
		this.#tabIndex = state.element.tabIndex;

		state.element.tabIndex = -1;

		state.element.setAttribute(ATTRIBUTE_FOCUSTRAP, '');

		this.contain = state.options.contain;
		this.noescape = state.options.noescape;

		states.set(this, state);
	}

	/**
	 * Destroys the _focus trap_
	 */
	destroy(): void {
		if (this.#destroyed) {
			return;
		}

		this.#destroyed = true;

		disabled.delete(this);
		instances.delete(this.#state.element);
		states.delete(this);

		this.#state.element.tabIndex = this.#tabIndex;

		this.#state.element.removeAttribute(ATTRIBUTE_FOCUSTRAP);
		this.#state.element.removeAttribute(ATTRIBUTE_FOCUSTRAP_CONTAIN);
		this.#state.element.removeAttribute(ATTRIBUTE_FOCUSTRAP_NOESCAPE);

		this.#state.element = undefined as never;
	}

	/**
	 * Disables the _focus trap_
	 */
	disable(): void {
		if (!this.#destroyed && !(this.disabled || this.#state.options.noescape)) {
			setDisabled(this, this.#state, true);
		}
	}

	/**
	 * Enables the _focus trap_
	 */
	enable(): void {
		if (!this.#destroyed && this.disabled) {
			setDisabled(this, this.#state, false);
		}
	}

	/**
	 * Focuses the _focus trap_
	 *
	 * @param last When `true`, focuses the last focusable element within the _focus trap_ instead of the first
	 */
	focus(last: boolean): void {
		if (!this.#destroyed && !this.disabled) {
			tabToTrap(this, getFocusable(this.#state.element), this.#state.element, last ? -1 : 0);
		}
	}
}

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

type OuiFocusTrapState = {
	disabled: boolean;
	element: HTMLElement;
	options: Required<OuiFocusTrapOptions>;
};

// #endregion

// #region Functions

/**
 * Creates _(or retrieves)_ a _focus trap_ for an element
 *
 * @param element Element to trap focus within
 * @param options _Focus trap_ options
 * @returns _Focus trap_ instance
 */
export function createFocusTrap(element: HTMLElement, options?: OuiFocusTrapOptions): OuiFocusTrap {
	if (!isHTMLOrSVGElement(element)) {
		throw new TypeError(MESSAGE);
	}

	let instance = instances.get(element);

	if (instance == null) {
		instance = new OuiFocusTrap(getState(element, options));

		instances.set(element, instance);
	}

	return instance;
}

function getOptions(
	element: HTMLElement,
	input?: OuiFocusTrapOptions,
): Required<OuiFocusTrapOptions> {
	const options = isPlainObject(input) ? input : {};

	return {
		contain:
			typeof options.contain === 'boolean'
				? options.contain
				: element.hasAttribute(ATTRIBUTE_FOCUSTRAP_CONTAIN),
		noescape:
			typeof options.noescape === 'boolean'
				? options.noescape
				: element.hasAttribute(ATTRIBUTE_FOCUSTRAP_NOESCAPE),
	};
}

function getState(element: HTMLElement, options?: OuiFocusTrapOptions): OuiFocusTrapState {
	return {
		element,
		disabled: false,
		options: getOptions(element, options),
	};
}

function onEscape(event: KeyboardEvent): void {
	let element = findAncestor(event, SELECTOR) as HTMLElement;

	let instance = instances.get(element);
	let state = states.get(instance!);

	if (element == null || instance == null || state == null) {
		return;
	}

	while (state.disabled) {
		element = findAncestor(state.element.parentElement as HTMLElement, SELECTOR) as HTMLElement;

		instance = instances.get(element);
		state = states.get(instance!);

		if (element == null || instance == null || state == null) {
			return;
		}

		if (!state.disabled) {
			break;
		}
	}

	instance?.disable();
}

function onFocusIn(event: Event): void {
	const focusTrap = instances.get(findAncestor(event, SELECTOR) as HTMLElement);

	lastTarget = focusTrap == null ? undefined : (event.target as HTMLElement);
}

function onKeydown(event: KeyboardEvent): void {
	switch (event.key) {
		case 'Escape':
			onEscape(event);
			break;

		case 'Tab':
			onTab(event);
			break;

		default:
			return;
	}
}

function onPointerdown(event: MouseEvent | TouchEvent): void {
	const last = findAncestor(lastTarget as HTMLElement, SELECTOR) as HTMLElement;
	const next = findAncestor(event, SELECTOR) as HTMLElement;

	if (last != null && next !== last) {
		if (states.get(instances.get(last)!)?.options.contain ?? false) {
			event.preventDefault();

			lastTarget?.focus();
		}
	}

	if (disabled.size === 0) {
		return;
	}

	for (const focusTrap of disabled) {
		const state = states.get(focusTrap);

		if (state != null && state.element !== next) {
			focusTrap.enable();
		}
	}
}

function onTab(event: KeyboardEvent): void {
	const element = findAncestor(event, SELECTOR) as HTMLElement;

	const instance = instances.get(element);

	if (instance == null) {
		return;
	}

	if (!instance.disabled) {
		event.preventDefault();
	}

	const elements = getFocusable(element);

	const index = elements.indexOf(event.target as HTMLElement);

	if (index === -1 || elements.length === 0) {
		tabToTrap(instance, elements, element);
	} else {
		tabToElement(instance, elements, index, event.shiftKey ? -1 : 1);
	}
}

export function removeFocusTrap(element: HTMLElement): void {
	instances.get(element)?.destroy();

	instances.delete(element);
}

function setDisabled(focusTrap: OuiFocusTrap, state: OuiFocusTrapState, value: boolean): void {
	state.disabled = value;

	if (value) {
		disabled.add(focusTrap);
	} else {
		disabled.delete(focusTrap);
	}
}

function tabToElement(
	instance: OuiFocusTrap,
	elements: Element[],
	index: number,
	modifier: number,
): void {
	const {length} = elements;
	const next = clamp(index + modifier, 0, length - 1, true);

	if (instance.disabled) {
		if ((index === length - 1 && next === 0) || (index === 0 && next === length - 1)) {
			lastTarget = undefined;

			instance.enable();
		}

		return;
	}

	const element = elements[next] as HTMLElement;
	const elementFocusTrap = instances.get(element);

	if (elementFocusTrap != null) {
		elementFocusTrap.focus(modifier === -1);
	} else {
		(elements[next] as HTMLElement).focus();

		lastTarget = elements[next] as HTMLElement;
	}
}

function tabToTrap(
	instance: OuiFocusTrap,
	elements: Element[],
	element: HTMLElement,
	index?: number,
): void {
	if (instance.disabled) {
		lastTarget = undefined;

		instance.enable();
	} else {
		const next = elements.length === 0 ? element : elements.at(index ?? 0);

		(next as HTMLElement).focus();

		lastTarget = next as HTMLElement;
	}
}

// #endregion

// #region Variables

export const ATTRIBUTE_FOCUSTRAP = 'oui-focus-trap';

export const ATTRIBUTE_FOCUSTRAP_CONTAIN = `${ATTRIBUTE_FOCUSTRAP}-contain`;

export const ATTRIBUTE_FOCUSTRAP_NOESCAPE = `${ATTRIBUTE_FOCUSTRAP}-noescape`;

const EVENT_OPTIONS: AddEventListenerOptions = {
	capture: true,
	passive: false,
};

const MESSAGE = 'Element must be an HTMLElement or SVGElement';

const SELECTOR = `[${ATTRIBUTE_FOCUSTRAP}]`;

const disabled = new Set<OuiFocusTrap>();

const instances = new WeakMap<HTMLElement, OuiFocusTrap>();

const states = new WeakMap<OuiFocusTrap, OuiFocusTrapState>();

let lastTarget: HTMLElement | undefined;

// #endregion

// #region Initialization

attributable(ATTRIBUTE_FOCUSTRAP, createFocusTrap, removeFocusTrap);

on(document, 'focusin', onFocusIn, EVENT_OPTIONS);
on(document, 'keydown', onKeydown, EVENT_OPTIONS);
on(document, 'mousedown', onPointerdown, EVENT_OPTIONS);
on(document, 'touchstart', onPointerdown, EVENT_OPTIONS);

// #endregion
