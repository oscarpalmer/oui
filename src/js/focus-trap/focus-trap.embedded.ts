import {isPlainObject} from '@oscarpalmer/atoms/is';
import {clamp} from '@oscarpalmer/atoms/number';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {getFocusable} from '@oscarpalmer/toretto/focusable';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {attributable} from '../internal/attributable';
import {
	type OuiFocusTrap,
	type OuiFocusTrapOptions,
	type OuiFocusTrapState,
	FOCUSTRAP_ATTRIBUTE,
	FOCUSTRAP_ATTRIBUTE_CONTAIN,
	FOCUSTRAP_ATTRIBUTE_NOESCAPE,
	FOCUSTRAP_EVENT_OPTIONS,
	FOCUSTRAP_MESSAGE,
	FOCUSTRAP_SELECTOR,
	FOCUSTRAP_SYMBOL,
	disabledFocusTraps,
	focusTraps,
} from './focus-trap.model';

// #region Instances

function OuiFocusTrap(this: OuiFocusTrap, state: OuiFocusTrapState): void {
	this[FOCUSTRAP_SYMBOL] = state;

	state.element.tabIndex = -1;

	setAttribute(state.element, FOCUSTRAP_ATTRIBUTE, '');

	this.contain = state.options.contain;
	this.noescape = state.options.noescape;
}

OuiFocusTrap.prototype.destroy = destroyFocusTrap;
OuiFocusTrap.prototype.disable = disableFocusTrap;
OuiFocusTrap.prototype.enable = enableFocusTrap;
OuiFocusTrap.prototype.focus = focusFocusTrap;

Object.defineProperties(OuiFocusTrap.prototype, {
	contain: {
		enumerable: true,
		get: getContain,
		set: setContain,
	},
	disabled: {
		enumerable: true,
		get: getDisabled,
		set: setDisabled,
	},
	noescape: {
		enumerable: true,
		get: getNoEscape,
		set: setNoEscape,
	},
});

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
		throw new TypeError(FOCUSTRAP_MESSAGE);
	}

	let instance = focusTraps.get(element);

	if (instance == null) {
		// @ts-expect-error All good, no worries :-)
		instance = new OuiFocusTrap(getState(element, options)) as OuiFocusTrap;

		focusTraps.set(element, instance);
	}

	return instance;
}

function destroyFocusTrap(this: OuiFocusTrap): void {
	const state = this[FOCUSTRAP_SYMBOL];

	if (state.destroyed) {
		return;
	}

	state.destroyed = true;

	disabledFocusTraps.delete(this);
	focusTraps.delete(state.element);

	state.element.tabIndex = state.tabIndex;

	state.element.removeAttribute(FOCUSTRAP_ATTRIBUTE);
	state.element.removeAttribute(FOCUSTRAP_ATTRIBUTE_CONTAIN);
	state.element.removeAttribute(FOCUSTRAP_ATTRIBUTE_NOESCAPE);

	state.element = undefined as never;
}

function disableFocusTrap(this: OuiFocusTrap): void {
	const state = this[FOCUSTRAP_SYMBOL];

	if (!state.destroyed && !(this.disabled || state.options.noescape)) {
		setDisabledState(this, state, true);
	}
}

function enableFocusTrap(this: OuiFocusTrap): void {
	const state = this[FOCUSTRAP_SYMBOL];

	if (!state.destroyed && this.disabled) {
		setDisabledState(this, state, false);
	}
}

function focusFocusTrap(this: OuiFocusTrap, last: boolean): void {
	const state = this[FOCUSTRAP_SYMBOL];

	if (!state.destroyed && !this.disabled) {
		tabToTrap(this, getFocusable(state.element), state.element, last ? -1 : 0);
	}
}

function getContain(this: OuiFocusTrap): boolean {
	return this[FOCUSTRAP_SYMBOL].element.hasAttribute(FOCUSTRAP_ATTRIBUTE_CONTAIN);
}

function getDisabled(this: OuiFocusTrap): boolean {
	return this[FOCUSTRAP_SYMBOL].disabled;
}

function getNoEscape(this: OuiFocusTrap): boolean {
	return this[FOCUSTRAP_SYMBOL].element.hasAttribute(FOCUSTRAP_ATTRIBUTE_NOESCAPE);
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
				: element.hasAttribute(FOCUSTRAP_ATTRIBUTE_CONTAIN),
		noescape:
			typeof options.noescape === 'boolean'
				? options.noescape
				: element.hasAttribute(FOCUSTRAP_ATTRIBUTE_NOESCAPE),
	};
}

function getState(element: HTMLElement, options?: OuiFocusTrapOptions): OuiFocusTrapState {
	return {
		element,
		destroyed: false,
		disabled: false,
		options: getOptions(element, options),
		tabIndex: element.tabIndex,
	};
}

function onEscape(event: KeyboardEvent): void {
	let element = findAncestor(event, FOCUSTRAP_SELECTOR) as HTMLElement;

	let instance = focusTraps.get(element);
	let state = instance?.[FOCUSTRAP_SYMBOL];

	if (element == null || instance == null || state == null) {
		return;
	}

	while (state.disabled) {
		element = findAncestor(
			state.element.parentElement as HTMLElement,
			FOCUSTRAP_SELECTOR,
		) as HTMLElement;

		instance = focusTraps.get(element);
		state = instance?.[FOCUSTRAP_SYMBOL];

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
	const focusTrap = focusTraps.get(findAncestor(event, FOCUSTRAP_SELECTOR) as HTMLElement);

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
	const last = findAncestor(lastTarget as HTMLElement, FOCUSTRAP_SELECTOR) as HTMLElement;
	const next = findAncestor(event, FOCUSTRAP_SELECTOR) as HTMLElement;

	if (last != null && next !== last) {
		if (focusTraps.get(last)?.[FOCUSTRAP_SYMBOL]?.options.contain ?? false) {
			event.preventDefault();

			lastTarget?.focus();
		}
	}

	if (disabledFocusTraps.size === 0) {
		return;
	}

	for (const focusTrap of disabledFocusTraps) {
		const state = focusTrap?.[FOCUSTRAP_SYMBOL];

		if (state != null && state.element !== next) {
			focusTrap.enable();
		}
	}
}

function onTab(event: KeyboardEvent): void {
	const element = findAncestor(event, FOCUSTRAP_SELECTOR) as HTMLElement;

	const instance = focusTraps.get(element);

	if (instance == null || dispatch(element, 'oui:focus-trap').defaultPrevented) {
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
	focusTraps.get(element)?.destroy();

	focusTraps.delete(element);
}

function setContain(this: OuiFocusTrap, value: unknown) {
	const {element} = this[FOCUSTRAP_SYMBOL];

	if (value === true) {
		setAttribute(element, FOCUSTRAP_ATTRIBUTE_CONTAIN, '');
	} else if (value === false) {
		setAttribute(element, FOCUSTRAP_ATTRIBUTE_CONTAIN, undefined);
	}
}

function setDisabled(this: OuiFocusTrap, value: unknown) {
	if (value === true) {
		this.disable();
	} else if (value === false) {
		this.enable();
	}
}

function setDisabledState(focusTrap: OuiFocusTrap, state: OuiFocusTrapState, value: boolean): void {
	state.disabled = value;

	if (value) {
		disabledFocusTraps.add(focusTrap);
	} else {
		disabledFocusTraps.delete(focusTrap);
	}
}

function setNoEscape(this: OuiFocusTrap, value: boolean) {
	const {element} = this[FOCUSTRAP_SYMBOL];

	if (value === true) {
		setAttribute(element, FOCUSTRAP_ATTRIBUTE_NOESCAPE, '');
	} else if (value === false) {
		setAttribute(element, FOCUSTRAP_ATTRIBUTE_NOESCAPE, undefined);
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
	const elementFocusTrap = focusTraps.get(element);

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

let lastTarget: HTMLElement | undefined;

// #endregion

// #region Initialization

attributable(FOCUSTRAP_ATTRIBUTE, createFocusTrap, removeFocusTrap);

on(document, 'focusin', onFocusIn, FOCUSTRAP_EVENT_OPTIONS);
on(document, 'keydown', onKeydown, FOCUSTRAP_EVENT_OPTIONS);
on(document, 'mousedown', onPointerdown, FOCUSTRAP_EVENT_OPTIONS);
on(document, 'touchstart', onPointerdown, FOCUSTRAP_EVENT_OPTIONS);

// #endregion
