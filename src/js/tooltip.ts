import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {createElement} from '@oscarpalmer/toretto/create';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {createFloatable, type OuiFloatable, type OuiFloatableOptions} from './floatable/embedded';
import {attributable} from './internal/attributable';

// #region Types

class OuiTooltip {
	readonly #state: OuiTooltipState;

	/**
	 * Is the tooltip open?
	 */
	get open(): boolean {
		return this.#state.content.checkVisibility();
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
	content: HTMLElement;
	floatable: OuiFloatable;
	timer?: number;
	tooltip: OuiTooltip;
};

// #endregion

// #region Functions

function activate(event: Event, focus: boolean): void {
	const anchor = findAncestor(event, SELECTOR) as HTMLElement | null;
	const content = findAncestor(event, SELECTOR_CONTENT) as HTMLElement | null;

	if (anchor == null && content == null) {
		if (!focused) {
			closeTooltip(activeState);

			activeState = undefined;
			activeTooltip = undefined;
		}

		return;
	}

	const state = states.get((anchor ?? content)!);

	if (state == null || state.tooltip === activeTooltip) {
		return;
	}

	const shouldDelay = activeTooltip == null;

	closeTooltip(activeState);

	activeState = state;
	activeTooltip = state.tooltip;

	focused = focus;

	state.timer = setTimeout(
		() => {
			state.content.showPopover({
				source: state.anchor as HTMLElement,
			});

			setTimeout(() => {
				state.floatable.update();

				state.content.setAttribute(ATTRIBUTE_CONTENT_OPEN, '');
			});
		},
		shouldDelay ? delay : 0,
	);
}

function closeTooltip(state?: OuiTooltipState): void {
	if (state == null) {
		return;
	}

	if (state.timer != null) {
		clearTimeout(state.timer);
	}

	state.content?.hidePopover();
	state.content?.removeAttribute(ATTRIBUTE_CONTENT_OPEN);
}

function createTooltip(anchor: HTMLElement): void {
	const content = getContent(anchor);

	if (content == null) {
		return;
	}

	anchor.insertAdjacentElement('afterend', content);

	states.set(anchor, getState(anchor, content));
}

function destroyTooltip(state: OuiTooltipState): void {
	clearTimeout(state.timer);

	state.content.remove();
	state.floatable.destroy();

	state.anchor = undefined as never;
	state.content = undefined as never;
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

function getContent(anchor: HTMLElement): HTMLElement | undefined {
	const elements = getElements(anchor);

	if (elements == null) {
		return;
	}

	const content = createElement(CONTENT_TAGNAME, {
		popover: 'hint',
		role: 'tooltip',
		tabIndex: -1,
	});

	content.setAttribute(ATTRIBUTE_CONTENT, '');

	content.append(...elements);

	return content;
}

function getElements(anchor: HTMLElement): HTMLElement[] | undefined {
	let elements = findElements(anchor.getAttribute(ARIA_LABELLEDBY));

	if (elements.length > 0) {
		return elements.map(element => element.cloneNode(true)) as HTMLElement[];
	}

	elements = findElements(anchor.getAttribute(ARIA_DESCRIBEDBY));

	if (elements.length > 0) {
		return elements.map(element => element.cloneNode(true)) as HTMLElement[];
	}

	let content = anchor.getAttribute(ARIA_LABEL);

	if (isNullableOrWhitespace(content)) {
		content = anchor.getAttribute(ARIA_DESCRIPTION);
	}

	if (isNullableOrWhitespace(content)) {
		return;
	}

	const paragraph = document.createElement('p');

	paragraph.textContent = content;

	return [paragraph];
}

function getState(anchor: HTMLElement, content: HTMLElement): OuiTooltipState {
	const state: OuiTooltipState = {
		anchor,
		content,
		floatable: createFloatable(anchor, content, options, false),
		tooltip: null as never,
	};

	state.tooltip = new OuiTooltip(state);

	return state;
}

function getTooltip(element: HTMLElement): OuiTooltip | undefined {
	return states.get(element)?.tooltip;
}

function onAdd(element: HTMLElement): void {
	if (!states.has(element)) {
		createTooltip(element);
	}
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

		closeTooltip(activeState);

		activeState = undefined;
		activeTooltip = undefined;
	});
}

function onPointermove(event: Event): void {
	activate(event, false);
}

function onRemove(element: HTMLElement): void {
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

const states = new WeakMap<HTMLElement, OuiTooltipState>();

const options: OuiFloatableOptions = {
	attribute: `${ATTRIBUTE}-position`,
	position: 'above',
};

let delay = 500;

let focused = false;

let activeState: OuiTooltipState | undefined;

let activeTooltip: OuiTooltip | undefined;

let focusTimer: number | undefined;

// #endregion

// #region Initialization

on(document, 'focusin', onFocusin);
on(document, 'focusout', onFocusout);
on(document, 'pointermove', onPointermove);

attributable(ATTRIBUTE, onAdd, onRemove);

// #endregion

// #region Exports

export {getTooltip, setTooltipDelay, type OuiTooltip};

// #endregion
