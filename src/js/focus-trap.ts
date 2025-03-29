import {clamp} from '@oscarpalmer/atoms/number';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {getFocusable} from '@oscarpalmer/toretto/focusable';

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

function addFocusTraps(nodes: Node[] | NodeList): void {
	const elements = [...nodes].filter(
		node => node instanceof HTMLElement,
	) as HTMLElement[];

	const {length} = elements;

	for (let index = 0; index < length; index += 1) {
		const element = elements[index];

		if (element.hasAttribute(selector)) {
			focusTraps.set(element, new FocusTrap(element));
		}
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

	setTimeout(() => {
		const element = findAncestor(
			document.activeElement as never,
			`[${selector}]`,
		) as HTMLElement;

		if (!focusTraps.has(element)) {
			for (const focusTrap of inactive) {
				focusTrap.activate();
			}
		}
	}, 0);
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

function removeFocusTraps(nodes: Node[] | NodeList): void {
	const elements = [...nodes].filter(
		node => node instanceof HTMLElement,
	) as HTMLElement[];

	const {length} = elements;

	for (let index = 0; index < length; index += 1) {
		const element = elements[index];

		focusTraps.get(element)?.destroy();
		focusTraps.delete(element);
	}
}

const focusTraps = new WeakMap<HTMLElement, FocusTrap>();
const inactive = new Set<FocusTrap>();

const observer = new MutationObserver(entries => {
	const {length} = entries;

	for (let index = 0; index < length; index += 1) {
		const entry = entries[index];

		if (entry.type === 'attributes' && entry.target instanceof HTMLElement) {
			if (entry.target.hasAttribute(selector)) {
				addFocusTraps([entry.target]);
			} else {
				removeFocusTraps([entry.target]);
			}
		} else if (entry.type === 'childList') {
			addFocusTraps(entry.addedNodes);
			removeFocusTraps(entry.removedNodes);
		}
	}
});

const selector = 'oui-focus-trap';

observer.observe(document, {
	attributeFilter: [selector],
	attributes: true,
	childList: true,
	subtree: true,
});

setTimeout(() => {
	addFocusTraps(document.querySelectorAll(`[${selector}]`));

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
}, 0);
