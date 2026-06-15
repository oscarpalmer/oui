import {on} from '@oscarpalmer/toretto/event';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {
	ATTRIBUTE_FLOATABLE,
	createFloatable,
	removeFloatable,
	type Floatable,
	type FloatableOptions,
} from './floatable';
import {createFocusTrap, removeFocusTrap, type FocusTrap} from './focus-trap/embedded';
import {attributable} from './internal/attributable';

class Popover {
	anchor: HTMLElement | null;
	floatable?: Floatable;
	focusTrap?: FocusTrap;
	listener: RemovableEventListener;

	constructor(public element: HTMLElement) {
		const anchor = element.ownerDocument.querySelector(`[popovertarget="${element.id}"]`);

		if (!isHTMLOrSVGElement(anchor)) {
			throw new Error(`No anchor found for popover with id '${element.id}'.`);
		}

		if (element.contains(anchor)) {
			throw new Error('Popover content cannot contain its anchor.');
		}

		this.anchor = anchor as HTMLElement;

		this.floatable = createFloatable(this.anchor, element, options, false);

		this.focusTrap = createFocusTrap(element, {
			noescape: true,
		});

		this.listener = on(element, EVENT_TOGGLE, event => {
			if (event.newState === STATE_OPEN) {
				ignoreFocus = false;

				this.floatable?.update();

				element.focus();
			} else if (!ignoreFocus) {
				this.anchor?.focus();
			}
		});

		this.element.setAttribute(ATTRIBUTE_CONTENT, '');

		this.floatable?.update();
	}

	destroy(): void {
		this.focusTrap?.destroy();

		removeFloatable(this.element);
		removeFocusTrap(this.element);

		this.element.removeAttribute(ATTRIBUTE_CONTENT);

		this.anchor = null;
		this.element = null as never;
	}
}

function onAdd(element: HTMLElement): void {
	if (
		!instances.has(element) &&
		element.getAttribute(ATTRIBUTE) !== POPOVER_HINT &&
		!element.hasAttribute(ATTRIBUTE_FLOATABLE)
	) {
		instances.set(element, new Popover(element));
	}
}

function onPointerdown(): void {
	ignoreFocus = true;
}

function onRemove(element: HTMLElement): void {
	instances.get(element)?.destroy();

	instances.delete(element);
}

const ATTRIBUTE = 'popover';

const ATTRIBUTE_CONTENT = 'oui-popover-content';

const EVENT_TOGGLE = 'toggle';

const POPOVER_HINT = 'hint';

const STATE_OPEN = 'open';

const instances = new WeakMap<HTMLElement, Popover>();

const options: FloatableOptions = {
	attribute: `${ATTRIBUTE}position`,
	position: 'below-start',
};

let ignoreFocus = false;

on(document, 'pointerdown', onPointerdown, {
	capture: true,
});

attributable(ATTRIBUTE, onAdd, onRemove);
