import {clamp} from '@oscarpalmer/atoms/number';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {getFocusable} from '@oscarpalmer/toretto/focusable';

export class FocusTrap {
	active = true;

	constructor(public element: HTMLElement) {
		element.setAttribute('aria-modal', 'true');
		element.setAttribute('tabindex', '-1');
	}

	destroy() {
		this.element = undefined as never;
	}

	disable() {
		if (this.active && !this.element.hasAttribute(`${selector}-noescape`)) {
			setDisabled(this, true);
		}
	}

	enable() {
		if (!this.active) {
			setDisabled(this, false);
		}
	}
}

//

export function createFocusTrap(element: HTMLElement): FocusTrap {
	let focusTrap = focusTraps.get(element);

	if (focusTrap == null) {
		focusTrap = new FocusTrap(element);

		focusTraps.set(element, focusTrap);
	}

	return focusTrap;
}

function onEscape(event: KeyboardEvent): void {
	focusTraps
		.get(
			findAncestor(event.target as HTMLElement, `[${selector}]`) as HTMLElement,
		)
		?.disable();
}

function onFocusIn(event: Event): void {
	lastTarget =
		findAncestor(event.target as HTMLElement, `[${selector}]`) == null
			? undefined
			: (event.target as HTMLElement);
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
		`[${selector}]`,
	) as HTMLElement;

	const nextFocusTrap = findAncestor(
		event.target as HTMLElement,
		`[${selector}]`,
	) as HTMLElement;

	if (lastFocusTrap != null && nextFocusTrap !== lastFocusTrap) {
		event.preventDefault();

		lastTarget?.focus();
	}

	if (disabled.size === 0) {
		return;
	}

	for (const focusTrap of disabled) {
		if (focusTrap.element !== nextFocusTrap) {
			focusTrap.enable();
			return;
		}
	}
}

function onTab(event: KeyboardEvent): void {
	const element = findAncestor(
		event.target as HTMLElement,
		`[${selector}]`,
	) as HTMLElement;

	const focusTrap = focusTraps.get(element);

	if (focusTrap == null) {
		return;
	}

	if (focusTrap.active) {
		event.preventDefault();
	}

	const elements = getFocusable(element);

	const index = elements.indexOf(event.target as HTMLElement);

	if (index === -1 || elements.length === 0) {
		tabToTrap(focusTrap, elements, element);
	} else {
		tabToElement(event, focusTrap, elements, index);
	}
}

function setDisabled(focusTrap: FocusTrap, value: boolean): void {
	focusTrap.element.setAttribute('aria-modal', String(!value));

	focusTrap.active = !value;

	if (value) {
		disabled.add(focusTrap);
	} else {
		disabled.delete(focusTrap);
	}
}

function tabToElement(
	event: KeyboardEvent,
	focusTrap: FocusTrap,
	elements: Element[],
	index: number,
): void {
	const next = clamp(
		index + (event.shiftKey ? -1 : 1),
		0,
		elements.length - 1,
		true,
	);

	if (!focusTrap.active) {
		if (
			(index === length - 1 && next === 0) ||
			(index === 0 && next === length - 1)
		) {
			lastTarget = undefined;

			focusTrap.enable();
		}

		return;
	}

	(elements[next] as HTMLElement).focus();

	lastTarget = elements[next] as HTMLElement;
}

function tabToTrap(
	focusTrap: FocusTrap,
	elements: Element[],
	element: HTMLElement,
): void {
	if (focusTrap.active) {
		const next = length === 0 ? element : elements[0];

		(next as HTMLElement).focus();

		lastTarget = next as HTMLElement;
	} else {
		lastTarget = undefined;

		focusTrap.enable();
	}
}

//

const disabled = new Set<FocusTrap>();

const eventOptions = {
	capture: true,
	passive: false,
};

export const focusTraps = new WeakMap<HTMLElement, FocusTrap>();

let lastTarget: HTMLElement | undefined;

export const selector = 'oui-focus-trap';

//

on(document, 'focusin', onFocusIn, eventOptions);

on(document, 'keydown', onKeydown, eventOptions);

on(document, 'mousedown', onPointerdown, eventOptions);

on(document, 'touchstart', onPointerdown, eventOptions);
