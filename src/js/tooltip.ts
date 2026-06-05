import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {attributable} from './internal/attributable';
import {Floatable} from './internal/floatable';

class Tooltip {
	elements: HTMLElement[];

	floatable: Floatable;

	constructor(anchor: HTMLElement, elements: HTMLElement[]) {
		const content = getContent();

		this.elements = elements;

		this.floatable = new Floatable({
			anchor,
			content,
			defaultPosition: 'above',
			interactive: false,
			positionAttribute: ATTRIBUTE_POSITION,
			reusable: true,
			onAfter: (active: boolean): void => {
				if (active) {
					content.innerHTML = '';

					content.append(...this.elements);
				}

				if (active || TOOLTIPS_ACTIVE.size > 0) {
					return;
				}

				content.removeAttribute(ATTRIBUTE_CONTENT_ACTIVE);

				contentTimer = setTimeout(() => {
					content.innerHTML = '';

					content.remove();
				}, delayClose);
			},
		});
	}

	destroy(): void {
		const {floatable} = this;

		TOOLTIPS_ACTIVE.delete(this);
		TOOLTIPS_PENDING.delete(this);

		TOOLTIPS_ALL.delete(floatable.options.anchor);
		TOOLTIPS_ALL.delete(floatable.options.content);

		floatable.destroy();

		this.elements = [];
		this.floatable = undefined as never;
	}
}

function addTooltip(anchor: HTMLElement): void {
	if (TOOLTIPS_ALL.has(anchor)) {
		return;
	}

	const elements = getElements(anchor);

	if (elements != null) {
		TOOLTIPS_ALL.set(anchor, new Tooltip(anchor, elements));
	}
}

function closeTooltips(current?: Tooltip): void {
	const pending = [...TOOLTIPS_PENDING];

	for (const item of pending) {
		if (item === current) {
			continue;
		}

		TOOLTIPS_PENDING.delete(item);
	}

	const active = [...TOOLTIPS_ACTIVE];

	for (const item of active) {
		if (item === current) {
			continue;
		}

		TOOLTIPS_ACTIVE.delete(item);

		item.floatable.toggle(false);
	}
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

function findElements(attribute: string | null): HTMLElement[] {
	const ids = attribute?.split(EXPRESSION_WHITESPACE) ?? [];
	const elements: HTMLElement[] = [];

	for (const id of ids) {
		if (isNullableOrWhitespace(id)) {
			continue;
		}

		const element = document.querySelector(`#${id}`);

		if (element instanceof HTMLElement) {
			const cloned = element.cloneNode(true) as HTMLElement;

			cloned.hidden = false;

			elements.push(cloned);
		}
	}

	return elements;
}

function getContent(): HTMLElement {
	if (contentElement != null) {
		return contentElement;
	}

	contentElement = document.createElement('div');

	contentElement.setAttribute(ATTRIBUTE_CONTENT, '');

	contentElement.role = 'tooltip';
	contentElement.tabIndex = -1;

	return contentElement;
}

function onActivate(event: Event): void {
	onToggle(event, true);
}

function onChange(): void {
	if (TOOLTIPS_ACTIVE.size === 0) {
		return;
	}
}

function onClick(event: Event): void {
	if (findAncestor(event, SELECTOR_CONTENT) != null) {
		event.stopPropagation();
	}
}

function onDeactivate(event: Event): void {
	onToggle(event, false);
}

function onToggle(event: Event, activate: boolean): void {
	if (toggle != null) {
		cancelAnimationFrame(toggle);
	}

	if (findAncestor(event, SELECTOR_CONTENT) != null) {
		if (contentTimer != null) {
			clearTimeout(contentTimer);
		}

		return;
	}

	toggle = requestAnimationFrame(() => {
		toggle = undefined;

		const element = findAncestor(event, SELECTOR) as HTMLElement;

		const tooltip = TOOLTIPS_ALL.get(element);

		if (TOOLTIPS_ACTIVE.size > 0 || TOOLTIPS_PENDING.size > 0) {
			closeTooltips(tooltip);
		}

		if (tooltip == null || tooltip.floatable.active === activate) {
			return;
		}

		if (activate) {
			clearTimeout(contentTimer);

			TOOLTIPS_PENDING.add(tooltip);

			contentTimer = setTimeout(() => {
				TOOLTIPS_ACTIVE.add(tooltip);
				TOOLTIPS_PENDING.delete(tooltip);

				tooltip.floatable.options.content.style.positionAnchor =
					tooltip.floatable.options.anchor.style.anchorName;

				tooltip.floatable.toggle(true);

				setTimeout(() => {
					tooltip.floatable.options.content.setAttribute(ATTRIBUTE_CONTENT_ACTIVE, '');
				});
			}, delayOpen);

			return;
		}

		TOOLTIPS_ACTIVE.delete(tooltip);

		tooltip.floatable.toggle(false);
	});
}

function removeTooltip(element: HTMLElement): void {
	if (!element.hasAttribute(ATTRIBUTE_CONTENT)) {
		TOOLTIPS_ALL.get(element)?.destroy();
	}
}

function setTooltipDelay(open?: number, close?: number): void {
	delayClose = typeof close === 'number' && close >= 0 ? close : delayClose;
	delayOpen = typeof open === 'number' && open >= 0 ? open : delayOpen;
}

//

const ARIA_DESCRIBEDBY = 'aria-describedby';

const ARIA_DESCRIPTION = 'aria-description';

const ARIA_LABEL = 'aria-label';

const ARIA_LABELLEDBY = 'aria-labelledby';

const ATTRIBUTE = 'oui-tooltip';

const ATTRIBUTE_CONTENT = `${ATTRIBUTE}-content`;

const ATTRIBUTE_CONTENT_ACTIVE = `${ATTRIBUTE_CONTENT}-active`;

const ATTRIBUTE_POSITION = `${ATTRIBUTE}-position`;

const SELECTOR = `[${ATTRIBUTE}]`;

const SELECTOR_CONTENT = `[${ATTRIBUTE_CONTENT}]`;

const EXPRESSION_WHITESPACE = /\s+/;

const TOOLTIPS_ACTIVE: Set<Tooltip> = new Set();

const TOOLTIPS_ALL: WeakMap<HTMLElement, Tooltip> = new WeakMap();

const TOOLTIPS_PENDING: Set<Tooltip> = new Set();

let contentElement: HTMLElement | undefined;

let contentTimer: number | undefined;

let delayClose = 250;

let delayOpen = 500;

let toggle: DOMHighResTimeStamp | undefined;

//

attributable(ATTRIBUTE, addTooltip, removeTooltip);

on(document, 'click', onClick, {capture: true});
on(document, 'focusin', onActivate);
on(document, 'focusout', onDeactivate);
on(document, 'mousemove', onActivate);
on(window, 'resize', onChange);
on(document, 'scroll', onChange);
on(document, 'touchstart', onActivate);

//

export {setTooltipDelay};
