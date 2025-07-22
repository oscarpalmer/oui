import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {on} from '@oscarpalmer/toretto/event';
import {attributable} from './attributable';
import {activate, deactivate, Floatable} from './floatable';

type Attributes = {
	ariaDescribedby: string | null;
	ariaLabelledBy: string | null;
};

type Content = {
	attributes: Attributes;
	element: HTMLElement;
};

class Tooltip {
	abortController = new AbortController();
	attributes: Attributes;
	floatable: Floatable;

	constructor(anchor: HTMLElement, content: Content) {
		this.attributes = content.attributes;

		this.floatable = new Floatable(
			anchor,
			content.element,
			`${selector}-position`,
			'vertical',
			true,
		);

		initialize(this);
	}

	destroy(): void {
		deactivate(this.floatable, active);
		reset(this.floatable.anchor, this.attributes);

		this.abortController.abort();
		this.floatable.content.remove();
		this.floatable.destroy();

		this.abortController = undefined as never;
		this.attributes = undefined as never;
		this.floatable = undefined as never;
	}
}

function addTooltip(anchor: HTMLElement): void {
	if (tooltips.has(anchor)) {
		return;
	}

	const content = getContent(anchor);

	if (content != null) {
		tooltips.set(anchor, new Tooltip(anchor, content));
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
	const ids = attribute?.split(/\s+/) ?? [];
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

	wrapper.setAttribute(`${selector}-content`, '');

	wrapper.className = anchor.getAttribute(`${selector}-class`) ?? '';
	wrapper.hidden = true;
	wrapper.id = `${selector}-${++index}`;
	wrapper.role = 'tooltip';
	wrapper.tabIndex = -1;

	return wrapper;
}

function initialize(tooltip: Tooltip): void {
	const {abortController, floatable} = tooltip;
	const {anchor, content} = floatable;

	anchor.insertAdjacentElement('afterend', content);

	const elements = [anchor, content];

	for (const element of elements) {
		for (const event of activateEvents) {
			on(
				element,
				event,
				() => {
					activate(floatable, active, undefined, 250);
				},
				{
					signal: abortController.signal,
				},
			);
		}

		for (const event of deactivateEvents) {
			on(
				element,
				event,
				() => {
					deactivate(floatable, active, undefined, 250);
				},
				{
					signal: abortController.signal,
				},
			);
		}
	}
}

function removeTooltip(element: HTMLElement): void {
	tooltips.get(element)?.destroy();
	tooltips.delete(element);
}

function reset(anchor: HTMLElement, attributes: Attributes): void {
	if (attributes.ariaDescribedby == null) {
		anchor.removeAttribute('aria-describedby');
	} else {
		anchor.setAttribute('aria-describedby', attributes.ariaDescribedby);
	}
}

//

const active = new Set<Floatable>();

const activateEvents = ['focus', 'mouseenter', 'touchstart'];

const deactivateEvents = ['blur', 'mouseleave'];

const selector = 'oui-tooltip';

const tooltips = new WeakMap<HTMLElement, Tooltip>();

let index = 0;

//

attributable(selector, addTooltip, removeTooltip);

on(document, 'keydown', event => {
	if (event.key === 'Escape') {
		for (const floatable of active) {
			deactivate(floatable, active);
		}
	}
});
