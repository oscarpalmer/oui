import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {attributable} from './attributable';
import {Floatable} from './floatable';

type Attributes = {
	ariaDescribedby: string | null;
	ariaLabelledBy: string | null;
};

type Content = {
	attributes: Attributes;
	element: HTMLElement;
};

class Tooltip {
	attributes: Attributes;

	floatable: Floatable;

	timer: number | undefined;

	constructor(anchor: HTMLElement, content: Content) {
		this.attributes = content.attributes;

		this.floatable = new Floatable({
			anchor,
			content: content.element,
			defaultPosition: 'vertical',
			interactive: false,
			preferAbove: true,
			positionAttribute: ATTRIBUTE_POSITION,
		});

		anchor.insertAdjacentElement('afterend', content.element);

		TOOLTIPS_ALL.set(content.element, this);
	}

	destroy(): void {
		const {attributes, floatable} = this;

		TOOLTIPS_ACTIVE.delete(this);
		TOOLTIPS_ALL.delete(floatable.options.anchor);
		TOOLTIPS_ALL.delete(floatable.options.content);

		reset(floatable.options.anchor, attributes);

		floatable.options.content.remove();
		floatable.destroy();

		this.attributes = undefined as never;
		this.floatable = undefined as never;
	}
}

function addTooltip(anchor: HTMLElement): void {
	if (TOOLTIPS_ALL.has(anchor)) {
		return;
	}

	const content = getContent(anchor);

	if (content != null) {
		TOOLTIPS_ALL.set(anchor, new Tooltip(anchor, content));
	}
}

function closeTooltips(next: Tooltip | undefined): void {
	const tooltips = [...TOOLTIPS_ACTIVE];

	for (const active of tooltips) {
		if (active === next) {
			continue;
		}

		if (active.timer != null) {
			clearTimeout(active.timer);
		}

		active.floatable.options.content.removeAttribute(
			'oui-tooltip-content-active',
		);

		requestAnimationFrame(() => {
			active.timer = setTimeout(() => {
				TOOLTIPS_ACTIVE.delete(active);
				active.floatable.toggle(false);
			}, delay) as never;
		});
	}
}

function getContent(anchor: HTMLElement): Content | undefined {
	const attributes = {
		ariaDescribedby: anchor.getAttribute('aria-describedby'),
		ariaLabelledBy: anchor.getAttribute('aria-labelledby'),
	};

	const wrapper = getWrapper(anchor);

	const labelledElements = getElements(attributes.ariaLabelledBy);

	if (labelledElements.length > 0) {
		anchor.setAttribute('aria-labelledby', wrapper.id);

		for (const element of labelledElements) {
			wrapper.append(element);
		}

		return {
			attributes,
			element: wrapper,
		};
	}

	const describedElements = getElements(attributes.ariaDescribedby);

	if (describedElements.length > 0) {
		anchor.setAttribute('aria-describedby', wrapper.id);

		for (const element of describedElements) {
			wrapper.append(element);
		}

		return {
			attributes,
			element: wrapper,
		};
	}

	let content = anchor.getAttribute('aria-label');

	if (isNullableOrWhitespace(content)) {
		content = anchor.getAttribute('aria-description');
	}

	if (isNullableOrWhitespace(content)) {
		return;
	}

	const paragraph = document.createElement('p');

	paragraph.textContent = content;

	wrapper.append(paragraph);

	return {
		attributes,
		element: wrapper,
	};
}

function getElements(attribute: string | null): HTMLElement[] {
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

function getWrapper(anchor: HTMLElement): HTMLElement {
	const wrapper = document.createElement('div');

	wrapper.setAttribute(ATTRIBUTE_CONTENT, '');

	wrapper.className = anchor.getAttribute(ATTRIBUTE_CLASS) ?? '';
	wrapper.hidden = true;
	wrapper.id = `${SELECTOR}-${++index}`;
	wrapper.role = 'tooltip';
	wrapper.tabIndex = -1;

	return wrapper;
}

function onActivate(event: Event): void {
	onToggle(event, true);
}

function onClick(event: Event): void {
	if (findAncestor(event.target as HTMLElement, SELECTOR_CONTENT) != null) {
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

	toggle = requestAnimationFrame(() => {
		toggle = undefined;

		const element = findAncestor(
			event.target as HTMLElement,
			SELECTOR_FULL,
		) as HTMLElement;

		const tooltip = TOOLTIPS_ALL.get(element);

		if (TOOLTIPS_ACTIVE.size > 0) {
			closeTooltips(tooltip);
		}

		if (
			tooltip == null ||
			tooltip.floatable.options.content.hasAttribute(
				'oui-tooltip-content-active',
			) === activate
		) {
			return;
		}

		if (activate) {
			if (tooltip.timer != null) {
				clearTimeout(tooltip.timer);
			}

			TOOLTIPS_ACTIVE.add(tooltip);
			tooltip.floatable.toggle(true);

			requestAnimationFrame(() => {
				tooltip.floatable.options.content.setAttribute(
					'oui-tooltip-content-active',
					'',
				);
			});

			return;
		}

		tooltip.floatable.options.content.removeAttribute(
			'oui-tooltip-content-active',
		);

		tooltip.timer ??= setTimeout(() => {
			TOOLTIPS_ACTIVE.delete(tooltip);
			tooltip.floatable.toggle(false);
		}, delay) as never;
	});
}

function removeTooltip(element: HTMLElement): void {
	if (!element.hasAttribute(ATTRIBUTE_CONTENT)) {
		TOOLTIPS_ALL.get(element)?.destroy();
	}
}

function reset(anchor: HTMLElement, attributes: Attributes): void {
	if (attributes.ariaDescribedby == null) {
		anchor.removeAttribute('aria-describedby');
	} else {
		anchor.setAttribute('aria-describedby', attributes.ariaDescribedby);
	}
}

function setDelay(value: number): void {
	delay = typeof value === 'number' && value >= 0 ? value : delay;
}

//

const SELECTOR = 'oui-tooltip';

const ATTRIBUTE_CLASS = `${SELECTOR}-class`;

const ATTRIBUTE_CONTENT = `${SELECTOR}-content`;

const ATTRIBUTE_POSITION = `${SELECTOR}-position`;

const SELECTOR_CONTENT = `[${ATTRIBUTE_CONTENT}]`;

const SELECTOR_FULL = `[${SELECTOR}], [${ATTRIBUTE_CONTENT}]`;

const EXPRESSION_WHITESPACE = /\s+/;

const TOOLTIPS_ACTIVE: Set<Tooltip> = new Set();

const TOOLTIPS_ALL: WeakMap<HTMLElement, Tooltip> = new WeakMap();

let delay = 250;

let index = 0;

let toggle: DOMHighResTimeStamp | undefined;

//

attributable(SELECTOR, addTooltip, removeTooltip);

on(document, 'click', onClick, {capture: true});
on(document, 'focusin', onActivate);
on(document, 'focusout', onDeactivate);
on(document, 'mousemove', onActivate);
on(document, 'touchstart', onActivate);

//

export {setDelay};
