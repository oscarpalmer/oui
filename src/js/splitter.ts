import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {round} from '@oscarpalmer/atoms/math';
import {clamp} from '@oscarpalmer/atoms/number';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';

declare global {
	interface HTMLElementTagNameMap {
		'oui-splitter': OuiSplitterElement;
	}
}

export class OuiSplitterElement extends HTMLElement {
	#splitter: Splitter;

	constructor() {
		super();

		const panels = [...this.children].filter(
			child => child instanceof HTMLElement,
		);

		if (panels.length !== 2) {
			throw new Error('oui-splitter must have exactly two panels.');
		}

		this.#splitter = new Splitter(this, panels);
	}

	connectedCallback(): void {
		if (this.#splitter.types.auto) {
			observer.observe(this);
		}
	}

	disconnectedCallback(): void {
		if (this.#splitter.types.auto) {
			observer.unobserve(this);
		}
	}
}

let index = 0;

class Splitter {
	handle: HTMLSpanElement;

	rectangle: DOMRect;

	separator: HTMLDivElement;

	types: Types;

	values: Values;

	constructor(
		public element: OuiSplitterElement,
		public panels: HTMLElement[],
	) {
		if (isNullableOrWhitespace(element.id)) {
			element.id = `oui_splitter_${++index}`;
		}

		this.values = getValues(element);

		this.handle = createHandle();
		this.rectangle = element.getBoundingClientRect();
		this.separator = createSeparator(this);

		this.separator.append(this.handle);

		panels[0].insertAdjacentElement('afterend', this.separator);

		mapped.set(element, this);
		mapped.set(this.handle, this);

		setSize(this, this.values.now.current);

		this.types = getTypes(this);

		if (this.types.horizontal) {
			this.element.setAttribute('oui-splitter-horizontal', '');
		}

		setAriaOrientation(this);
		setAriaValue(this);
	}
}

type Types = {
	auto: boolean;
	horizontal: boolean;
};

type Values = {
	max: number;
	min: number;
	now: ValuesNow;
};

type ValuesNow = {
	current: number;
	previous: number;
};

//

function createHandle(): HTMLSpanElement {
	const handle = document.createElement('span');

	handle.setAttribute('aria-hidden', 'true');
	handle.setAttribute('oui-splitter-handle', '');

	return handle;
}

function createSeparator(splitter: Splitter): HTMLDivElement {
	const separator = document.createElement('div');

	separator.role = 'separator';
	separator.tabIndex = 0;

	separator.setAttribute('aria-controls', splitter.element.id);
	separator.setAttribute('aria-label', 'Resize panels');
	separator.setAttribute('oui-splitter-separator', '');

	return separator;
}

function getContained(min: number, value: number, max: number): number {
	return round(clamp(value, min, max), 6);
}

function getSize(splitter: Splitter, value: number): number {
	const {height, left, top, width} = splitter.rectangle;

	const offset = value - (splitter.types.horizontal ? top : left);

	const fraction = offset / (splitter.types.horizontal ? height : width);

	return getContained(splitter.values.min, fraction, splitter.values.max);
}

function getTypes(splitter: Splitter, width?: number, height?: number): Types {
	const type = splitter.element.getAttribute('type')?.trim() ?? '';

	if (type === 'horizontal') {
		return {
			auto: false,
			horizontal: true,
		};
	}

	if (type === 'auto') {
		return {
			auto: true,
			horizontal:
				(height ?? splitter.rectangle.height) >
				(width ?? splitter.rectangle.width),
		};
	}

	return {
		auto: false,
		horizontal: false,
	};
}

function getValue(
	element: HTMLElement,
	name: string,
	defaultValue: number,
): number {
	const value = element.getAttribute(name);

	if (isNullableOrWhitespace(value)) {
		return defaultValue;
	}

	const parsed = Number.parseFloat(value);

	if (Number.isNaN(parsed)) {
		return defaultValue;
	}

	return parsed < 0 ? defaultValue : parsed > 1 ? parsed / 100 : parsed;
}

function getValues(element: OuiSplitterElement): Values {
	const values: Values = {
		max: getValue(element, 'max', 0.9),
		min: getValue(element, 'min', 0.1),
		now: {
			current: 0.5,
			previous: 0.5,
		},
	};

	const value = getContained(
		values.min,
		getValue(element, 'size', values.now.current),
		values.max,
	);

	values.now.current = value;
	values.now.previous = value;

	return values;
}

function onEnd(reset: boolean): void {
	if (splitter != null) {
		splitter.handle.removeAttribute('oui-splitter-active');
		splitter.separator.removeAttribute('oui-splitter-active');

		if (reset) {
			setSize(splitter, splitter.values.now.previous);
		} else {
			splitter.values.now.previous = splitter.values.now.current;
		}
	}

	splitter = undefined;
}

function onKeydown(event: KeyboardEvent): void {
	switch (true) {
		case allKeys.has(event.key):
			onNavigate(event);
			break;

		case event.key === 'Escape':
			onEnd(true);
			break;

		default:
			break;
	}
}

function onMousedown(event: Event): void {
	splitter = mapped.get(
		findAncestor(
			event.target as never,
			'[oui-splitter-handle]',
		) as HTMLSpanElement,
	);

	if (splitter == null) {
		return;
	}

	splitter.handle.setAttribute('oui-splitter-active', '');
	splitter.separator.setAttribute('oui-splitter-active', '');

	splitter.rectangle = splitter.element.getBoundingClientRect();
}

function onMousemove(event: MouseEvent): void {
	if (splitter == null) {
		return;
	}

	const position = getPosition(event);

	if (position != null) {
		splitter.values.now.current = getSize(
			splitter,
			splitter.types.horizontal ? position.y : position.x,
		);

		setSize(splitter, splitter.values.now.current);
	}
}

function onMouseup(): void {
	if (splitter != null) {
		onEnd(false);
	}
}

function onNavigate(event: KeyboardEvent): void {
	const splitter = mapped.get(
		findAncestor(
			event.target as never,
			'[oui-splitter-handle]',
		) as HTMLSpanElement,
	);

	if (splitter == null) {
		return;
	}

	if (absoluteKeys.has(event.key)) {
		setSize(
			splitter,
			event.key === 'End' ? splitter.values.max : splitter.values.min,
			true,
		);

		return;
	}

	if (
		(splitter.types.horizontal && !horizontalKeys.has(event.key)) ||
		(!splitter.types.horizontal && !verticalKeys.has(event.key))
	) {
		return;
	}

	const modifier = negativeKeys.has(event.key) ? -1 : 1;

	setSize(splitter, splitter.values.now.current + modifier * 0.05, true);
}

function onObservation(entries: ResizeObserverEntry[]): void {
	if (frame != null) {
		cancelAnimationFrame(frame);
	}

	frame = requestAnimationFrame(() => {
		for (const entry of entries) {
			const splitter = mapped.get(entry.target as HTMLElement);

			if (splitter == null) {
				return;
			}

			splitter.types = getTypes(
				splitter,
				entry.contentRect.width,
				entry.contentRect.height,
			);

			if (splitter.types.horizontal) {
				splitter.element.setAttribute('oui-splitter-horizontal', '');
			} else {
				splitter.element.removeAttribute('oui-splitter-horizontal');
			}

			setAriaOrientation(splitter);
		}

		frame = undefined;
	});
}

function setAriaOrientation(splitter: Splitter): void {
	splitter.separator.setAttribute(
		'aria-orientation',
		splitter.types.horizontal ? 'horizontal' : 'vertical',
	);
}

function setAriaValue(splitter: Splitter): void {
	splitter.separator.setAttribute('aria-valuemax', String(splitter.values.max));
	splitter.separator.setAttribute('aria-valuemin', String(splitter.values.min));

	splitter.separator.setAttribute(
		'aria-valuenow',
		String(splitter.values.now.current),
	);
}

function setSize(splitter: Splitter, size: number, previous?: boolean): void {
	splitter.values.now.current = size;

	if (previous) {
		splitter.values.now.previous = size;
	}

	splitter.element.style.setProperty('--oui-splitter-size', `${size}`);

	setAriaValue(splitter);
}

//

const absoluteKeys = new Set(['End', 'Home']);

const horizontalKeys = new Set(['ArrowDown', 'ArrowUp']);

const mapped = new WeakMap<HTMLElement, Splitter>();

const observer = new ResizeObserver(onObservation);

const negativeKeys = new Set(['ArrowLeft', 'ArrowUp']);

const verticalKeys = new Set(['ArrowLeft', 'ArrowRight']);

const allKeys = new Set([...absoluteKeys, ...horizontalKeys, ...verticalKeys]);

let frame: DOMHighResTimeStamp | undefined;

let splitter: Splitter | undefined;

//

customElements.define('oui-splitter', OuiSplitterElement);

on(document, 'keydown', onKeydown);

on(document, 'mousedown', onMousedown);

on(document, 'mousemove', onMousemove);

on(document, 'mouseup', onMouseup);
