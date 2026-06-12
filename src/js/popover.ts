import {on} from '@oscarpalmer/toretto/event';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {createFocusTrap, removeFocusTrap, type FocusTrap} from './focus-trap/embedded';
import {attributable} from './internal/attributable';
import {
	createFloatable,
	removeFloatable,
	type Floatable,
	type FloatableOptions,
} from './internal/floatable';

class Popover {
	anchor: HTMLElement | null;
	floatable?: Floatable;
	focusTrap?: FocusTrap;
	listener: RemovableEventListener;

	constructor(public element: HTMLElement) {
		this.anchor = element.ownerDocument.querySelector(`[popovertarget="${element.id}"]`);

		this.floatable = createFloatable(this.anchor as HTMLElement, element, options);

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
	if (!instances.has(element) && element.getAttribute(ATTRIBUTE) !== POPOVER_HINT) {
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
	attribute: 'position',
	position: 'below-start',
};

let ignoreFocus = false;

on(document, 'pointerdown', onPointerdown, {
	capture: true,
});

attributable(ATTRIBUTE, onAdd, onRemove);
