import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {on} from '@oscarpalmer/toretto/event';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {createEmbeddedFloatable, getOnBeforeToggleListener} from '../floatable/floatable.embedded';
import {FLOATABLE_ATTRIBUTE} from '../floatable/floatable.model';
import {createFocusTrap} from '../focus-trap/focus-trap.embedded';
import {attributable} from '../internal/attributable';
import {
	POPOVER_ATTRIBUTE,
	POPOVER_ATTRIBUTE_OPEN,
	POPOVER_SYMBOL,
	popoverFloatableOptions,
	popovers,
	type OuiPopover,
	type OuiPopoverState,
} from './popover.model';

// #region Instances

function OuiPopover(this: OuiPopover, state: OuiPopoverState): void {
	this[POPOVER_SYMBOL] = state;

	initialize(state);

	this[POPOVER_SYMBOL].floatable.update();
}

OuiPopover.prototype.hide = hidePopover;
OuiPopover.prototype.show = showPopover;

Object.defineProperties(OuiPopover.prototype, {
	open: {
		enumerable: true,
		get: getOpen,
		set: setOpen,
	},
});

// #endregion

// #region Functions

function addPopover(element: Element): void {
	if (popovers.has(element) || element.hasAttribute(FLOATABLE_ATTRIBUTE)) {
		return;
	}

	const anchor = element.ownerDocument.querySelector(`[popovertarget="${element.id}"]`);

	if (isHTMLOrSVGElement(anchor) && isHTMLOrSVGElement(element)) {
		popovers.set(element, getState(anchor, element));
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

function getId(element: Element, value?: string): string {
	let {id} = element;

	if (id == null || id.trim().length === 0) {
		id = value == null ? `oui_popover_${++index}` : `${value}_toggle`;

		element.id = id;
	}

	return id;
}

function getOpen(this: OuiPopover): boolean {
	return this[POPOVER_SYMBOL].content.checkVisibility();
}

/**
 * Get the _OuiPopover_ for an element
 *
 * @param element Element to get _OuiPopover_ for
 * @returns _OuiPopover_ instance
 */
export function getPopover(element: Element): OuiPopover | undefined {
	return popovers.get(element)?.popover;
}

function getState(anchor: HTMLElement, content: HTMLElement): OuiPopoverState {
	const state: OuiPopoverState = {
		anchor,
		content,
		floatable: createEmbeddedFloatable(anchor, content, popoverFloatableOptions),
		focusTrap:
			getAria(content, 'modal') === true
				? createFocusTrap(content, {
						noescape: true,
					})
				: undefined,
		listeners: [
			getOnBeforeToggleListener(content),
			on(content, 'toggle', event => {
				const expanded = event.newState === 'open';

				if (expanded) {
					ignoreFocus = false;

					state.floatable?.update();

					content.focus();
				} else {
					if (!ignoreFocus) {
						anchor?.focus();
					}
				}

				setAria(anchor, 'expanded', expanded);
				setAttribute(content, POPOVER_ATTRIBUTE_OPEN, expanded ? '' : undefined);
			}),
		],
		popover: undefined as never,
	};

	// @ts-expect-error All good, no worries :-)
	state.popover = new OuiPopover(state);

	return state;
}

function hidePopover(this: OuiPopover): void {
	this[POPOVER_SYMBOL].floatable.hide();
}

function initialize(state: OuiPopoverState): void {
	const id = getId(state.content);

	setAria(state.anchor, {
		controls: id,
		expanded: 'false',
	});

	const label = getAria(state.content, 'label') ?? getAria(state.content, 'labelledby');

	if (label == null) {
		setAria(state.content, 'labelledby', getId(state.anchor, id));
	}
}

function onPointerdown(): void {
	ignoreFocus = true;
}

function removePopover(element: Element): void {
	const state = popovers.get(element);

	if (state == null) {
		return;
	}

	destroyPopover(state);

	popovers.delete(element);
}

function setOpen(this: OuiPopover, value: unknown): void {
	const {floatable} = this[POPOVER_SYMBOL];

	if (value === true) {
		floatable.show();
	} else if (value === false) {
		floatable.hide();
	}
}

function showPopover(this: OuiPopover): void {
	this[POPOVER_SYMBOL].floatable.show();
}

// #endregion

// #region Variables

let ignoreFocus = false;

let index = 0;

// #endregion

// #region Initialization

on(document, 'pointerdown', onPointerdown, {
	capture: true,
});

attributable(POPOVER_ATTRIBUTE, addPopover, removePopover);

// #endregion

// #region Exports

export {type OuiPopover};

// #endregion
