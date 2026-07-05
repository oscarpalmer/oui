import {on} from '@oscarpalmer/toretto/event';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {
	ATTRIBUTE_FLOATABLE,
	createEmbeddedFloatable,
	getOnBeforeToggleListener,
	type OuiFloatable,
	type OuiFloatableOptions,
} from './floatable/floatable.embedded';
import {createFocusTrap, type OuiFocusTrap} from './focus-trap/focus-trap.embedded';
import {attributable} from './internal/attributable';

// #region Types

class OuiPopover {
	readonly #state: OuiPopoverState;

	/**
	 * Is the popover open?
	 */
	get open(): boolean {
		return this.#state.content.checkVisibility();
	}

	set open(value: boolean) {
		if (value === true) {
			this.show();
		} else if (value === false) {
			this.hide();
		}
	}

	constructor(state: OuiPopoverState) {
		this.#state = state;

		this.#state.floatable.update();
	}

	/**
	 * Closes the popover
	 */
	hide(): void {
		this.#state.floatable.hide();
	}

	/**
	 * Opens the popover
	 */
	show(): void {
		this.#state.floatable.show();
	}
}

type OuiPopoverState = {
	anchor: HTMLElement;
	content: HTMLElement;
	floatable: OuiFloatable;
	focusTrap?: OuiFocusTrap;
	listeners: RemovableEventListener[];
	popover: OuiPopover;
};

// #endregion

// #region Functions

function addPopover(element: HTMLElement): void {
	if (states.has(element) || element.hasAttribute(ATTRIBUTE_FLOATABLE)) {
		return;
	}

	const anchor = element.ownerDocument.querySelector(`[popovertarget="${element.id}"]`);

	if (isHTMLOrSVGElement(anchor)) {
		states.set(element, getState(anchor, element));
	}
}

function destroyPopover(state: OuiPopoverState): void {
	state.floatable.destroy();
	state.focusTrap?.destroy();

	for (const listener of state.listeners) {
		listener();
	}

	state.anchor = undefined as never;
	state.content = undefined as never;
	state.floatable = undefined as never;
	state.focusTrap = undefined as never;
	state.listeners = undefined as never;
	state.popover = undefined as never;
}

/**
 * Get the _OuiPopover_ for an element
 *
 * @param element Element to get _OuiPopover_ for
 * @returns _OuiPopover_ instance
 */
function getPopover(element: HTMLElement): OuiPopover | undefined {
	return states.get(element)?.popover;
}

function getState(anchor: HTMLElement, content: HTMLElement): OuiPopoverState {
	const state: OuiPopoverState = {
		anchor,
		content,
		floatable: createEmbeddedFloatable(anchor, content, options),
		focusTrap:
			content.getAttribute(ARIA_MODAL) === TRUE
				? createFocusTrap(content, {
						noescape: true,
					})
				: undefined,
		listeners: [
			getOnBeforeToggleListener(content),
			on(content, EVENT_TOGGLE, event => {
				if (event.newState === STATE_OPEN) {
					ignoreFocus = false;

					state.floatable?.update();

					content.setAttribute(ATTRIBUTE_OPEN, '');

					content.focus();
				} else {
					content.removeAttribute(ATTRIBUTE_OPEN);

					if (!ignoreFocus) {
						anchor?.focus();
					}
				}
			}),
		],
		popover: undefined as never,
	};

	state.popover = new OuiPopover(state);

	return state;
}

function onPointerdown(): void {
	ignoreFocus = true;
}

function removePopover(element: HTMLElement): void {
	const state = states.get(element);

	if (state == null) {
		return;
	}

	destroyPopover(state);

	states.delete(element);
}

// #endregion

// #region Variables

const ATTRIBUTE = 'oui-popover';

const ARIA_MODAL = 'aria-modal';

const ATTRIBUTE_OPEN = `${ATTRIBUTE}-open`;

const EVENT_TOGGLE = 'toggle';

const STATE_OPEN = 'open';

const TRUE = 'true';

const options: OuiFloatableOptions = {
	attribute: `${ATTRIBUTE}position`,
	position: 'below-start',
	reusable: false,
};

const states = new WeakMap<HTMLElement, OuiPopoverState>();

let ignoreFocus = false;

// #endregion

// #region Initialization

on(document, 'pointerdown', onPointerdown, {
	capture: true,
});

attributable(ATTRIBUTE, addPopover, removePopover);

// #endregion

// #region Exports

export {getPopover, type OuiPopover};

// #endregion
