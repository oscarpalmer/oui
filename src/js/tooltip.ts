import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {on} from '@oscarpalmer/toretto/event';
import {attributable} from './attributable';

class Tooltip {
	abortController = new AbortController();

	activate: number | undefined;

	active = false;

	deactivate: number | undefined;

	element: HTMLElement;

	frame: DOMHighResTimeStamp | undefined;

	constructor(public parent: HTMLElement) {
		this.element = getContent(parent) as HTMLElement;

		if (this.element != null) {
			parent.insertAdjacentElement('afterend', this.element);

			initialize(this);
		}
	}

	destroy() {
		deactivate(this);

		this.abortController.abort();

		this.abortController = undefined as never;
		this.activate = undefined as never;
		this.deactivate = undefined as never;
		this.element = undefined as never;
		this.frame = undefined as never;
		this.parent = undefined as never;
	}
}

function activate(tooltip: Tooltip): void {
	stop(tooltip);

	if (tooltip.active) {
		return;
	}

	tooltip.activate = +setTimeout(() => {
		tooltip.active = true;

		active.add(tooltip);

		document.body.append(tooltip.element);

		tooltip.element.hidden = false;

		update(tooltip);
	}, 250);
}

function addTooltip(element: HTMLElement): void {
	if (!tooltips.has(element)) {
		tooltips.set(element, new Tooltip(element));
	}
}

function deactivate(tooltip: Tooltip, time?: number): void {
	stop(tooltip);

	if (!tooltip.active) {
		return;
	}

	tooltip.deactivate = +setTimeout(() => {
		tooltip.active = false;

		active.delete(tooltip);

		tooltip.element.hidden = true;

		tooltip.parent.insertAdjacentElement('afterend', tooltip.element);
	}, time ?? 250);
}

function getContent(parent: HTMLElement): HTMLElement | undefined {
	const wrapper = getWrapper(parent);

	const ids = (parent.getAttribute('aria-describedby') ?? '').split(/\s+/);

	parent.setAttribute('aria-describedby', wrapper.id);

	const elements = ids
		.map(id =>
			isNullableOrWhitespace(id) ? undefined : document.querySelector(`#${id}`),
		)
		.filter(element => element instanceof HTMLElement);

	if (elements.length > 0) {
		for (const element of elements) {
			element.hidden = false;

			wrapper.append(element);
		}

		return wrapper;
	}

	let content = parent.getAttribute('aria-description');

	if (isNullableOrWhitespace(content)) {
		content = parent.getAttribute('aria-label');

		if (isNullableOrWhitespace(content)) {
			return;
		}
	}

	const paragraph = document.createElement('p');

	paragraph.textContent = content;

	wrapper.append(paragraph);

	return wrapper;
}

function getTop(parent: DOMRect, content: DOMRect): number {
	let top = parent.top - content.height - margin;

	if (top - margin >= 0) {
		return top;
	}

	top = parent.bottom + margin;

	if (top + content.height + margin <= window.innerHeight) {
		return top;
	}

	return parent.top + (parent.height - content.height) / 2;
}

function getWrapper(parent: HTMLElement): HTMLElement {
	const wrapper = document.createElement('div');

	wrapper.setAttribute(`${selector}-content`, '');

	wrapper.className = parent.getAttribute(`${selector}-class`) ?? '';
	wrapper.hidden = true;
	wrapper.id = `${selector}-${++index}`;
	wrapper.role = 'tooltip';
	wrapper.tabIndex = -1;

	return wrapper;
}

function getX(
	parent: DOMRect,
	content: DOMRect,
): {left?: number; right?: number} {
	if (content.width + 2 * margin >= window.innerWidth) {
		return {
			left: margin,
			right: margin,
		};
	}

	const left = parent.left + (parent.width - content.width) / 2;
	const right = window.innerWidth - margin;

	if (left < margin) {
		return {
			left: margin,
		};
	}

	if (left + content.width > right) {
		return {
			right: margin,
		};
	}

	return {
		left,
	};
}

function initialize(tooltip: Tooltip): void {
	const elements = [tooltip.parent, tooltip.element];

	for (const element of elements) {
		for (const event of activateEvents) {
			on(
				element,
				event,
				() => {
					activate(tooltip);
				},
				{
					signal: tooltip.abortController.signal,
				},
			);
		}

		for (const event of deactivateEvents) {
			on(
				element,
				event,
				() => {
					deactivate(tooltip);
				},
				{
					signal: tooltip.abortController.signal,
				},
			);
		}
	}
}

function removeTooltip(element: HTMLElement): void {
	tooltips.get(element)?.destroy();
	tooltips.delete(element);
}

function stop(tooltip: Tooltip): void {
	if (tooltip.frame != null) {
		cancelAnimationFrame(tooltip.frame);

		tooltip.frame = undefined;
	}

	if (tooltip.activate != null) {
		clearTimeout(tooltip.activate);

		tooltip.activate = undefined;
	}

	if (tooltip.deactivate != null) {
		clearTimeout(tooltip.deactivate);

		tooltip.deactivate = undefined;
	}
}

function update(tooltip: Tooltip): void {
	function run(): void {
		const parentRect = tooltip.parent.getBoundingClientRect();
		const contentRect = tooltip.element.getBoundingClientRect();

		const top = getTop(parentRect, contentRect);
		const {left, right} = getX(parentRect, contentRect);

		tooltip.element.style.inset = `${top}px ${right == null ? 'auto' : `${right}px`} auto ${left == null ? 'auto' : `${left}px`}`;

		tooltip.frame = requestAnimationFrame(run);
	}

	tooltip.frame = requestAnimationFrame(run);
}

//

const active = new Set<Tooltip>();

const activateEvents = ['focus', 'mouseenter', 'touchstart'];

const deactivateEvents = ['blur', 'mouseleave'];

const margin =
	Number.parseInt(getComputedStyle(document.documentElement).fontSize, 10) / 4;

const selector = 'oui-tooltip';

const tooltips = new WeakMap<HTMLElement, Tooltip>();

let index = 0;

//

attributable(selector, addTooltip, removeTooltip);

on(document, 'keydown', event => {
	if (event.key === 'Escape') {
		for (const tooltip of active) {
			deactivate(tooltip, 0);
		}
	}
});
