import {clamp} from '@oscarpalmer/atoms/number';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {getFocusable} from '@oscarpalmer/toretto/focusable';

export class FocusTrap {
	disabled = false;

	connected = true;

	element: HTMLElement;

	embedded: boolean;

	get contain(): boolean {
		return this.element.hasAttribute(FOCUS_TRAP_CONTAIN);
	}

	get noescape(): boolean {
		return this.element.hasAttribute(FOCUS_TRAP_NOESCAPE);
	}

	constructor(element: HTMLElement, options?: Options) {
		this.element = element;
		this.embedded = options != null;

		element.setAttribute('tabindex', '-1');

		if (options != null) {
			element.setAttribute(FOCUS_TRAP_SELECTOR, '');
		}

		if (options?.noescape) {
			element.setAttribute(FOCUS_TRAP_NOESCAPE, '');
		}
	}

	connect(): void {
		setConnected(this, true);
	}

	destroy(): void {
		this.element = undefined as never;
	}

	disable(): void {
		if (!(this.disabled || this.noescape)) {
			setDisabled(this, true);
		}
	}

	disconnect(): void {
		setConnected(this, false);
	}

	enable(): void {
		if (this.disabled) {
			setDisabled(this, false);
		}
	}

	focus(last: boolean): void {
		tabToTrap(this, getFocusable(this.element), this.element, last ? -1 : 0);
	}
}

type Options = {
	noescape: boolean;
};

//

export function createFocusTrap(
	element: HTMLElement,
	options?: Options,
): FocusTrap {
	let focusTrap = FOCUSTRAPS_ALL.get(element);

	if (focusTrap == null) {
		focusTrap = new FocusTrap(element, options);

		FOCUSTRAPS_ALL.set(element, focusTrap);
	}

	return focusTrap;
}

function onEscape(event: KeyboardEvent): void {
	let element = findAncestor(
		event.target as HTMLElement,
		ATTRIBUTE_SELECTOR,
	) as HTMLElement;

	let focusTrap = FOCUSTRAPS_ALL.get(element);

	if (element == null || focusTrap == null) {
		return;
	}

	while (focusTrap.disabled) {
		element = findAncestor(
			focusTrap.element.parentElement as HTMLElement,
			ATTRIBUTE_SELECTOR,
		) as HTMLElement;

		focusTrap = FOCUSTRAPS_ALL.get(element);

		if (element == null || focusTrap == null) {
			return;
		}

		if (!focusTrap.disabled) {
			break;
		}
	}

	focusTrap?.disable();
}

function onFocusIn(event: Event): void {
	const focusTrap = FOCUSTRAPS_ALL.get(
		findAncestor(
			event.target as HTMLElement,
			ATTRIBUTE_SELECTOR,
		) as HTMLElement,
	);

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
	const lastFocusTrap = findAncestor(
		lastTarget as HTMLElement,
		ATTRIBUTE_SELECTOR,
	) as HTMLElement;

	const nextFocusTrap = findAncestor(
		event.target as HTMLElement,
		ATTRIBUTE_SELECTOR,
	) as HTMLElement;

	if (lastFocusTrap != null && nextFocusTrap !== lastFocusTrap) {
		if (FOCUSTRAPS_ALL.get(lastFocusTrap)?.contain ?? false) {
			event.preventDefault();

			lastTarget?.focus();
		}
	}

	if (FOCUSTRAPS_DISABLED.size === 0) {
		return;
	}

	for (const focusTrap of FOCUSTRAPS_DISABLED) {
		if (focusTrap.element !== nextFocusTrap) {
			focusTrap.enable();
		}
	}
}

function onTab(event: KeyboardEvent): void {
	const element = findAncestor(
		event.target as HTMLElement,
		ATTRIBUTE_SELECTOR,
	) as HTMLElement;

	const focusTrap = FOCUSTRAPS_ALL.get(element);

	if (focusTrap == null) {
		return;
	}

	if (!focusTrap.disabled) {
		event.preventDefault();
	}

	const elements = getFocusable(element);

	const index = elements.indexOf(event.target as HTMLElement);

	if (index === -1 || elements.length === 0) {
		tabToTrap(focusTrap, elements, element);
	} else {
		tabToElement(focusTrap, elements, index, event.shiftKey ? -1 : 1);
	}
}

function setConnected(focusTrap: FocusTrap, value: boolean): void {
	if (!focusTrap.embedded || focusTrap.connected === value) {
		return;
	}

	focusTrap.connected = value;
}

function setDisabled(focusTrap: FocusTrap, value: boolean): void {
	focusTrap.disabled = value;

	if (value) {
		FOCUSTRAPS_DISABLED.add(focusTrap);
	} else {
		FOCUSTRAPS_DISABLED.delete(focusTrap);
	}
}

function tabToElement(
	focusTrap: FocusTrap,
	elements: Element[],
	index: number,
	modifier: number,
): void {
	const {length} = elements;
	const next = clamp(index + modifier, 0, length - 1, true);

	if (focusTrap.disabled) {
		if (
			(index === length - 1 && next === 0) ||
			(index === 0 && next === length - 1)
		) {
			lastTarget = undefined;

			focusTrap.enable();
		}

		return;
	}

	const element = elements[next] as HTMLElement;
	const elementFocusTrap = FOCUSTRAPS_ALL.get(element);

	if (elementFocusTrap != null) {
		elementFocusTrap.focus(modifier === -1);
	} else {
		(elements[next] as HTMLElement).focus();

		lastTarget = elements[next] as HTMLElement;
	}
}

function tabToTrap(
	focusTrap: FocusTrap,
	elements: Element[],
	element: HTMLElement,
	index?: number,
): void {
	if (focusTrap.disabled) {
		lastTarget = undefined;

		focusTrap.enable();
	} else {
		const next = elements.length === 0 ? element : elements.at(index ?? 0);

		(next as HTMLElement).focus();

		lastTarget = next as HTMLElement;
	}
}

//

export const FOCUS_TRAP_SELECTOR = 'oui-focus-trap';

const ATTRIBUTE_SELECTOR = `[${FOCUS_TRAP_SELECTOR}]`;

const EVENT_OPTIONS: AddEventListenerOptions = {
	capture: true,
	passive: false,
};

export const FOCUS_TRAP_CONTAIN = `${FOCUS_TRAP_SELECTOR}-contain`;

export const FOCUS_TRAP_NOESCAPE = `${FOCUS_TRAP_SELECTOR}-noescape`;

export const FOCUSTRAPS_ALL: WeakMap<HTMLElement, FocusTrap> = new WeakMap();

const FOCUSTRAPS_DISABLED: Set<FocusTrap> = new Set();

let lastTarget: HTMLElement | undefined;

//

on(document, 'focusin', onFocusIn, EVENT_OPTIONS);
on(document, 'keydown', onKeydown, EVENT_OPTIONS);
on(document, 'mousedown', onPointerdown, EVENT_OPTIONS);
on(document, 'touchstart', onPointerdown, EVENT_OPTIONS);
