import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {createElement} from '@oscarpalmer/toretto/create';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {
	createEmbeddedFloatable,
	FLOATABLE_STATE_OPEN,
	type OuiFloatable,
	type OuiFloatableOptions,
} from './floatable/floatable.embedded';
import {attributable} from './internal/attributable';

// #region Types

class OuiTooltip {
	readonly #state: OuiTooltipState;

	/**
	 * Is the tooltip open?
	 */
	get open(): boolean {
		return this === activeTooltip && content.checkVisibility();
	}

	/**
	 * Open or close the tooltip
	 */
	set open(value: boolean) {
		if (value === true) {
			this.show();
		} else if (value === false) {
			this.hide();
		}
	}

	constructor(state: OuiTooltipState) {
		this.#state = state;

		state.floatable.update();
	}

	/**
	 * Closes the tooltip
	 */
	hide(): void {
		this.#state.floatable.hide();
	}

	/**
	 * Opens the tooltip
	 */
	show(): void {
		this.#state.floatable.show();
	}
}

type OuiTooltipState = {
	anchor: HTMLElement;
	elements: HTMLElement[];
	floatable: OuiFloatable;
	timer?: number;
	tooltip: OuiTooltip;
};

// #endregion

// #region Functions

function activate(event: Event, focus: boolean): void {
	const targetAnchor = findAncestor(event, SELECTOR) as HTMLElement | null;
	const targetContent = findAncestor(event, SELECTOR_CONTENT) as HTMLElement | null;

	if (targetAnchor == null && targetContent == null) {
		if (!focused) {
			closeTooltip(true, activeState);

			activeState = undefined;
			activeTooltip = undefined;
		}

		return;
	}

	const state = states.get((targetAnchor ?? targetContent)!);

	if (state == null || state.tooltip === activeTooltip) {
		return;
	}

	const shouldDelay = activeTooltip == null;

	closeTooltip(false, activeState);

	activeState = state;
	activeTooltip = state.tooltip;

	focused = focus;

	state.timer = setTimeout(
		() => {
			content.innerHTML = '';

			content.append(...state.elements);

			state.floatable.show();

			setTimeout(() => {
				state.floatable.update();
			});
		},
		shouldDelay ? delay : 0,
	);
}

function addTooltip(element: HTMLElement): void {
	if (!states.has(element)) {
		createTooltip(element);
	}
}

function closeTooltip(clear: boolean, state?: OuiTooltipState): void {
	if (state == null) {
		return;
	}

	if (state.timer != null) {
		clearTimeout(state.timer);
	}

	if (clear) {
		content?.hidePopover();
	}
}

function createTooltip(anchor: HTMLElement): void {
	const elements = getElements(anchor);

	if (elements == null) {
		return;
	}

	states.set(anchor, getState(anchor, elements));
}

function destroyTooltip(state: OuiTooltipState): void {
	clearTimeout(state.timer);

	state.floatable.destroy();

	state.anchor = undefined as never;
	state.elements = undefined as never;
	state.floatable = undefined as never;
	state.tooltip = undefined as never;
}

function findElements(attribute: string | null): HTMLElement[] {
	const ids = attribute?.split(EXPRESSION_WHITESPACE) ?? [];
	const elements: HTMLElement[] = [];

	for (const id of ids) {
		if (isNullableOrWhitespace(id)) {
			continue;
		}

		const element = document.querySelector(`#${id}`);

		if (isHTMLOrSVGElement(element)) {
			const cloned = element.cloneNode(true) as HTMLElement;

			cloned.hidden = false;

			elements.push(cloned);
		}
	}

	return elements;
}

function getContent(): HTMLElement {
	const content = createElement(CONTENT_TAGNAME, {
		popover: 'hint',
		role: 'tooltip',
		tabIndex: -1,
	});

	content.setAttribute(ATTRIBUTE_CONTENT, '');

	return content;
}

function getElements(anchor: HTMLElement): HTMLElement[] | undefined {
	let elements = findElements(anchor.getAttribute(ARIA_LABELLEDBY));

	if (elements.length > 0) {
		return elements;
	}

	elements = findElements(anchor.getAttribute(ARIA_DESCRIBEDBY));

	if (elements.length > 0) {
		return elements;
	}

	let text = anchor.getAttribute(ARIA_LABEL);

	if (isNullableOrWhitespace(text)) {
		text = anchor.getAttribute(ARIA_DESCRIPTION);
	}

	if (isNullableOrWhitespace(text)) {
		return;
	}

	const paragraph = document.createElement('p');

	paragraph.textContent = text;

	return [paragraph];
}

function getState(anchor: HTMLElement, elements: HTMLElement[]): OuiTooltipState {
	const state: OuiTooltipState = {
		anchor,
		elements,
		floatable: createEmbeddedFloatable(anchor, content, options),
		tooltip: null as never,
	};

	state.tooltip = new OuiTooltip(state);

	return state;
}

/**
 * Get the _OuiTooltip_ for an element
 *
 * @param element Element to get _OuiTooltip_ for
 * @returns _OuiTooltip_ instance
 */
function getTooltip(element: HTMLElement): OuiTooltip | undefined {
	return states.get(element)?.tooltip;
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
			findAncestor(document.activeElement, SELECTOR) != null
		) {
			return;
		}

		closeTooltip(true, activeState);

		activeState = undefined;
		activeTooltip = undefined;
	});
}

function onPointermove(event: Event): void {
	activate(event, false);
}

function onToggle(event: ToggleEvent): void {
	if (event.newState === FLOATABLE_STATE_OPEN) {
		content.setAttribute(ATTRIBUTE_CONTENT_OPEN, '');
	} else {
		content.removeAttribute(ATTRIBUTE_CONTENT_OPEN);
	}
}

function removeTooltip(element: HTMLElement): void {
	const state = states.get(element);

	if (state == null) {
		return;
	}

	destroyTooltip(state);

	states.delete(element);
}

/**
 * Set the delay before showing the tooltip, in milliseconds
 *
 * _(Default delay is half a second, or 500 milliseconds)_
 * @param value Delay in milliseconds
 */
function setTooltipDelay(value: number): void {
	if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
		delay = value;
	}
}

// #endregion

// #region Variables

const ARIA_DESCRIBEDBY = 'aria-describedby';

const ARIA_DESCRIPTION = 'aria-description';

const ARIA_LABEL = 'aria-label';

const ARIA_LABELLEDBY = 'aria-labelledby';

const CONTENT_TAGNAME = 'div';

const EXPRESSION_WHITESPACE = /\s+/;

const ATTRIBUTE = 'oui-tooltip';

const ATTRIBUTE_CONTENT = `${ATTRIBUTE}-content`;

const ATTRIBUTE_CONTENT_OPEN = `${ATTRIBUTE_CONTENT}-open`;

const SELECTOR = `[${ATTRIBUTE}]`;

const SELECTOR_CONTENT = `[${ATTRIBUTE_CONTENT}]`;

const content = getContent();

const states = new WeakMap<HTMLElement, OuiTooltipState>();

const options: OuiFloatableOptions = {
	attribute: `${ATTRIBUTE}-position`,
	position: 'above',
	reusable: true,
};

let delay = 500;

let focused = false;

let activeState: OuiTooltipState | undefined;

let activeTooltip: OuiTooltip | undefined;

let focusTimer: number | undefined;

// #endregion

// #region Initialization

document.body.append(content);

on(content, 'toggle', onToggle);

on(document, 'focusin', onFocusin);
on(document, 'focusout', onFocusout);
on(document, 'pointermove', onPointermove);

attributable(ATTRIBUTE, addTooltip, removeTooltip);

// #endregion

// #region Exports

export {getTooltip, setTooltipDelay, type OuiTooltip};

// #endregion
