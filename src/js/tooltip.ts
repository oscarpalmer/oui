import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {createElement} from '@oscarpalmer/toretto/create';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {attributable} from './internal/attributable';
import {Floatable, type FloatableOptions} from './internal/floatable';

class Tooltip {
	floatable: Floatable;

	timer: number | undefined;

	constructor(
		public anchor: HTMLElement,
		public content: HTMLElement,
	) {
		instances.set(content, this);

		anchor.insertAdjacentElement('afterend', content);

		this.floatable = new Floatable(anchor, content, options);

		this.floatable.update();
	}

	destroy(): void {
		instances.delete(this.content);

		this.anchor = null as never;
		this.content = null as never;
	}
}

function activate(event: Event, focus: boolean): void {
	const anchor = findAncestor(event, SELECTOR) as HTMLElement | null;
	const content = findAncestor(event, SELECTOR_CONTENT) as HTMLElement | null;

	if (anchor == null && content == null) {
		if (!focused) {
			closeTooltip(active);

			active = undefined;
		}

		return;
	}

	const instance = instances.get((anchor ?? content)!);

	if (instance == null || instance === active) {
		return;
	}

	const shouldDelay = active == null;

	closeTooltip(active);

	active = instance;
	focused = focus;

	instance.timer = setTimeout(
		() => {
			instance.content.showPopover({
				source: instance.anchor,
			});

			setTimeout(() => {
				instance.floatable.update();

				instance.content.setAttribute(ATTRIBUTE_CONTENT_ACTIVE, '');
			});
		},
		shouldDelay ? delay : 0,
	);
}

function closeTooltip(instance?: Tooltip): void {
	if (instance == null) {
		return;
	}

	if (instance.timer != null) {
		clearTimeout(instance.timer);
	}

	instance.content.hidePopover();
	instance.content.removeAttribute(ATTRIBUTE_CONTENT_ACTIVE);
}

function createTooltip(anchor: HTMLElement): void {
	const content = getContent(anchor);

	if (content != null) {
		instances.set(anchor, new Tooltip(anchor, content));
	}
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

function onAdd(element: HTMLElement): void {
	if (!instances.has(element)) {
		createTooltip(element);
	}
}

function onFocusin(event: Event): void {
	activate(event, true);
}

function onFocusout(): void {
	if (active == null) {
		return;
	}

	if (focusTimer != null) {
		clearTimeout(focusTimer);
	}

	focusTimer = setTimeout(() => {
		if (
			active == null ||
			document.activeElement == null ||
			findAncestor(document.activeElement, SELECTOR) != null
		) {
			return;
		}

		closeTooltip(active);

		active = undefined;
	});
}

function onPointermove(event: Event): void {
	activate(event, false);
}

function onRemove(element: HTMLElement): void {
	instances.get(element)?.destroy();

	instances.delete(element);
}

export function setTooltipDelay(value: number): void {
	if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
		delay = value;
	}
}

const ARIA_DESCRIBEDBY = 'aria-describedby';

const ARIA_DESCRIPTION = 'aria-description';

const ARIA_LABEL = 'aria-label';

const ARIA_LABELLEDBY = 'aria-labelledby';

const CONTENT_TAGNAME = 'div';

const EXPRESSION_WHITESPACE = /\s+/;

const ATTRIBUTE = 'oui-tooltip';

const ATTRIBUTE_CONTENT = `${ATTRIBUTE}-content`;

const ATTRIBUTE_CONTENT_ACTIVE = `${ATTRIBUTE_CONTENT}-active`;

const SELECTOR = `[${ATTRIBUTE}]`;

const SELECTOR_CONTENT = `[${ATTRIBUTE_CONTENT}]`;

const instances = new WeakMap<HTMLElement, Tooltip>();

const options: FloatableOptions = {
	attribute: 'oui-tooltip-position',
	position: 'above',
};

let delay = 500;

let focused = false;

let active: Tooltip | undefined;

let focusTimer: number | undefined;

on(document, 'focusin', onFocusin);
on(document, 'focusout', onFocusout);
on(document, 'pointermove', onPointermove);

attributable(ATTRIBUTE, onAdd, onRemove);
