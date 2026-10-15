import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {getAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {createEmbeddedFloatable} from '../floatable/floatable.embedded';
import {attributable} from '../internal/attributable';
import {EXPRESSION_WHITESPACE} from '../internal/misc';
import {
	TOOLTIP_ATTRIBUTE,
	TOOLTIP_ATTRIBUTE_CONTENT,
	TOOLTIP_ATTRIBUTE_CONTENT_OPEN,
	TOOLTIP_SELECTOR,
	TOOLTIP_SELECTOR_CONTENT,
	TOOLTIP_SYMBOL,
	tooltipFloatableOptions,
	tooltips,
	type OuiTooltip,
	type OuiTooltipState,
} from './tooltip.model';

// #region Instances

function OuiTooltip(this: OuiTooltip, state: OuiTooltipState): void {
	this[TOOLTIP_SYMBOL] = state;

	state.floatable.update();
}

OuiTooltip.prototype.hide = hideTooltip;
OuiTooltip.prototype.show = showTooltip;

Object.defineProperties(OuiTooltip.prototype, {
	open: {
		enumerable: true,
		get: getOpen,
		set: setOpen,
	},
});

// #endregion

// #region Functions

function activate(event: Event, focus: boolean): void {
	const targetAnchor = findAncestor(event, TOOLTIP_SELECTOR);
	const targetContent = findAncestor(event, TOOLTIP_SELECTOR_CONTENT);

	if (targetAnchor == null && targetContent == null) {
		if (!focused) {
			closeTooltip(true, activeTooltip);

			activeTooltip = undefined;
		}

		return;
	}

	const targetTooltip = tooltips.get((targetAnchor ?? targetContent)!);

	if (targetTooltip == null || targetTooltip === activeTooltip) {
		return;
	}

	const shouldDelay = activeTooltip == null;

	closeTooltip(false, activeTooltip);

	activeTooltip = targetTooltip;

	focused = focus;

	const targetState = targetTooltip[TOOLTIP_SYMBOL];

	targetState.timer = setTimeout(
		() => {
			content.innerHTML = '';

			content.append(...targetState.elements);

			targetState.floatable.show();

			setTimeout(() => {
				targetState.floatable.update();
			});
		},
		shouldDelay ? delay : 0,
	);
}

function addTooltip(element: Element): void {
	if (!tooltips.has(element)) {
		createTooltip(element);
	}
}

function closeTooltip(clear: boolean, tooltip?: OuiTooltip): void {
	if (tooltip == null) {
		return;
	}

	const state = tooltip[TOOLTIP_SYMBOL];

	if (state.timer != null) {
		clearTimeout(state.timer);
	}

	if (clear) {
		content?.hidePopover();
	}
}

function createTooltip(anchor: Element): void {
	const elements = getElements(anchor);

	if (elements != null) {
		// @ts-expect-error All good, no worries :-)
		tooltips.set(anchor, new OuiTooltip(getState(anchor, elements)));
	}
}

function destroyTooltip(tooltip: OuiTooltip): void {
	const state = tooltip[TOOLTIP_SYMBOL];

	clearTimeout(state.timer);

	state.floatable.destroy();

	state.anchor = undefined as never;
	state.elements = undefined as never;
	state.floatable = undefined as never;
}

function findElements(attribute?: string): Element[] | undefined {
	if (attribute == null) {
		return;
	}

	const ids = attribute?.split(EXPRESSION_WHITESPACE) ?? [];
	const elements: Element[] = [];

	for (const id of ids) {
		if (isNullableOrWhitespace(id)) {
			continue;
		}

		const element = document.querySelector(`#${id}`);

		if (element != null) {
			const cloned = element.cloneNode(true) as HTMLElement;

			cloned.hidden = false;

			elements.push(cloned);
		}
	}

	return elements;
}

function getContent(): HTMLElement {
	return createElement('div', {
		attribute: {
			[TOOLTIP_ATTRIBUTE_CONTENT]: '',
			popover: 'hint',
		},
		property: {
			role: 'tooltip',
			tabIndex: -1,
		},
	});
}

function getElements(anchor: Element): Element[] | undefined {
	let elements = findElements(getAria(anchor, 'labelledby'));

	if (elements == null || elements.length === 0) {
		elements = findElements(getAria(anchor, 'describedby'));
	}

	if (elements != null && elements.length > 0) {
		return elements;
	}

	let textContent = getAria(anchor, 'label');

	if (isNullableOrWhitespace(textContent)) {
		textContent = getAria(anchor, 'description');
	}

	if (isNullableOrWhitespace(textContent)) {
		return;
	}

	return [
		createElement('p', {
			property: {
				textContent,
			},
		}),
	];
}

function getOpen(this: OuiTooltip): boolean {
	return this === activeTooltip && content.checkVisibility();
}

function getState(anchor: Element, elements: Element[]): OuiTooltipState {
	return {
		anchor,
		elements,
		floatable: createEmbeddedFloatable(anchor, content, tooltipFloatableOptions),
	};
}

/**
 * Get the _OuiTooltip_ for an element
 *
 * @param element Element to get _OuiTooltip_ for
 * @returns _OuiTooltip_ instance
 */
export function getTooltip(element: Element): OuiTooltip | undefined {
	return tooltips.get(element);
}

function hideTooltip(this: OuiTooltip): void {
	this[TOOLTIP_SYMBOL].floatable.hide();
}

function onFocusin(event: Event): void {
	activate(event, true);
}

function onFocusout(): void {
	if (activeTooltip == null) {
		return;
	}

	if (focusTimer != null) {
		clearTimeout(focusTimer);
	}

	focusTimer = setTimeout(() => {
		if (
			activeTooltip == null ||
			document.activeElement == null ||
			findAncestor(document.activeElement, TOOLTIP_SELECTOR) != null
		) {
			return;
		}

		closeTooltip(true, activeTooltip);

		activeTooltip = undefined;
	});
}

function onPointermove(event: Event): void {
	activate(event, false);
}

function onToggle(event: ToggleEvent): void {
	setAttribute(content, TOOLTIP_ATTRIBUTE_CONTENT_OPEN, event.newState === 'open' ? '' : undefined);
}

function removeTooltip(element: Element): void {
	const tooltip = tooltips.get(element);

	if (tooltip != null) {
		destroyTooltip(tooltip);
	}

	tooltips.delete(element);
}

/**
 * Set the delay before showing the tooltip, in milliseconds
 *
 * _(Default delay is half a second, or 500 milliseconds)_
 * @param value Delay in milliseconds
 */
export function setTooltipDelay(value: number): void {
	if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
		delay = value;
	}
}

function setOpen(this: OuiTooltip, value: unknown): void {
	if (value === true) {
		this.show();
	} else if (value === false) {
		this.hide();
	}
}

function showTooltip(this: OuiTooltip): void {
	this[TOOLTIP_SYMBOL].floatable.show();
}

// #endregion

// #region Variables

const content = getContent();

let delay = 500;

let focused = false;

let activeTooltip: OuiTooltip | undefined;

let focusTimer: number | undefined;

// #endregion

// #region Initialization

document.body.append(content);

on(content, 'toggle', onToggle);

on(document, 'focusin', onFocusin);
on(document, 'focusout', onFocusout);
on(document, 'pointermove', onPointermove);

attributable(TOOLTIP_ATTRIBUTE, addTooltip, removeTooltip);

// #endregion

// #region Exports

export {type OuiTooltip};

// #endregion
