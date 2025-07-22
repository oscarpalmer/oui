import {clamp} from '@oscarpalmer/atoms/number';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';

declare global {
	interface HTMLElementTagNameMap {
		'oui-splitter': OuiSplitterElement;
	}
}

type Flex = {
	previous: number;
	value: number;
};

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

class Splitter {
	flex: Flex = {
		previous: 0.5,
		value: 0.5,
	};

	handle: HTMLSpanElement;

	rectangle: DOMRect;

	separator: HTMLDivElement;

	types: Types;

	constructor(
		public element: OuiSplitterElement,
		public panels: HTMLElement[],
	) {
		this.handle = createHandle();
		this.rectangle = element.getBoundingClientRect();
		this.separator = createSeparator();

		this.separator.append(this.handle);

		panels[0].insertAdjacentElement('afterend', this.separator);

		mapped.set(element, this);
		mapped.set(this.handle, this);

		setSize(this, this.flex.value);

		this.types = getTypes(this);

		if (this.types.horizontal) {
			this.element.setAttribute('oui-splitter-horizontal', '');
		}
	}
}

type Types = {
	auto: boolean;
	horizontal: boolean;
};

//

function createHandle(): HTMLSpanElement {
	const handle = document.createElement('span');

	handle.tabIndex = 0;

	handle.setAttribute('aria-label', 'Resize panels');
	handle.setAttribute('oui-splitter-handle', '');

	return handle;
}

function createSeparator(): HTMLDivElement {
	const separator = document.createElement('div');

	separator.setAttribute('oui-splitter-separator', '');

	return separator;
}

function getFlex(splitter: Splitter, value: number): number {
	const {height, left, top, width} = splitter.rectangle;

	const offset = value - (splitter.types.horizontal ? top : left);

	const fraction = offset / (splitter.types.horizontal ? height : width);

	return clamp(fraction, 0.1, 0.9);
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

function onEnd(reset: boolean): void {
	if (splitter != null) {
		splitter.handle.removeAttribute('oui-splitter-active');
		splitter.separator.removeAttribute('oui-splitter-active');

		if (reset) {
			setSize(splitter, splitter.flex.previous);
		} else {
			splitter.flex.previous = splitter.flex.value;
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
		splitter.flex.value = getFlex(
			splitter,
			splitter.types.horizontal ? position.y : position.x,
		);

		setSize(splitter, splitter.flex.value);
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
		setSize(splitter, event.key === 'End' ? 0.9 : 0.1, true);

		return;
	}

	if (
		(splitter.types.horizontal && !horizontalKeys.has(event.key)) ||
		(!splitter.types.horizontal && !verticalKeys.has(event.key))
	) {
		return;
	}

	const modifier = negativeKeys.has(event.key) ? -1 : 1;

	setSize(splitter, splitter.flex.value + modifier * 0.05, true);
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
		}

		frame = undefined;
	});
}

function setSize(splitter: Splitter, size: number, previous?: boolean): void {
	splitter.flex.value = size;

	if (previous) {
		splitter.flex.previous = size;
	}

	splitter.element.style.setProperty('--oui-splitter-size', `${size}`);
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
