import {clamp} from '@oscarpalmer/atoms/number';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {getFocusable} from '@oscarpalmer/toretto/focusable';
import {attributable} from './attributable';

class FocusTrap {
	active = true;

	constructor(private element: HTMLElement) {
		element.setAttribute('aria-modal', 'true');
		element.setAttribute('tabindex', '-1');
	}

	activate() {
		this.element.setAttribute('aria-modal', 'true');

		this.active = true;
	}

	destroy() {
		this.active = false;
		this.element = undefined as never;
	}

	inactivate() {
		this.element.setAttribute('aria-modal', 'false');

		this.active = false;

		inactive.add(this);
	}
}

function addFocusTrap(element: HTMLElement): void {
	if (!focusTraps.has(element)) {
		focusTraps.set(element, new FocusTrap(element));
	}
}

function onEscape(event: KeyboardEvent): void {
	if (event.key !== 'Escape') {
		return;
	}

	const element = findAncestor(
		document.activeElement as never,
		`[${selector}]`,
	) as HTMLElement;

	focusTraps.get(element)?.inactivate();
}

function onFocusOut(): void {
	if (inactive.size === 0) {
		return;
	}

	requestAnimationFrame(() => {
		const element = findAncestor(
			document.activeElement as never,
			`[${selector}]`,
		) as HTMLElement;

		if (!focusTraps.has(element)) {
			for (const focusTrap of inactive) {
				focusTrap.activate();
			}
		}
	});
}

function onTab(event: KeyboardEvent): void {
	if (event.key !== 'Tab') {
		return;
	}

	const element = findAncestor(
		event.target as never,
		`[${selector}]`,
	) as HTMLElement;

	if (!(focusTraps.get(element)?.active ?? false)) {
		return;
	}

	event.preventDefault();

	const elements = getFocusable(element);
	const {length} = elements;

	const index = elements.indexOf(event.target as HTMLElement);

	if (index === -1 || length === 0) {
		if (length === 0) {
			element.focus();
		} else {
			(elements[0] as HTMLElement).focus();
		}

		return;
	}

	const next = clamp(index + (event.shiftKey ? -1 : 1), 0, length - 1, true);

	if (next !== index) {
		(elements[next] as HTMLElement).focus();
	}
}

function removeFocusTraps(element: HTMLElement): void {
	focusTraps.get(element)?.destroy();
	focusTraps.delete(element);
}

const focusTraps = new WeakMap<HTMLElement, FocusTrap>();
const inactive = new Set<FocusTrap>();
const selector = 'oui-focus-trap';

attributable(selector, addFocusTrap, removeFocusTraps);

on(document, 'focusout', onFocusOut, {
	capture: true,
});

on(document, 'keydown', onTab, {
	capture: true,
	passive: false,
});

on(document, 'keydown', onEscape, {
	passive: false,
});
