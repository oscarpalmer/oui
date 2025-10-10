import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {round} from '@oscarpalmer/atoms/math';
import {clamp} from '@oscarpalmer/atoms/number';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {type StyleToggler, toggleStyles} from '@oscarpalmer/toretto/style';
import supportsTouch from '@oscarpalmer/toretto/touch';

declare global {
	// biome-ignore lint/nursery/useConsistentTypeDefinitions: Extending builtins to allow custom element type help
	interface HTMLElementTagNameMap {
		[SELECTOR]: OuiSplitterElement;
	}
}

export class OuiSplitterElement extends HTMLElement {
	static readonly observedAttributes = ['max', 'min', 'size', 'type'];

	readonly #splitter: Splitter;

	// Getters and setters

	get max(): number {
		return this.#splitter.values.max;
	}

	set max(value: number) {
		this.setAttribute('max', String(value));
	}

	get min(): number {
		return this.#splitter.values.min;
	}

	set min(value: number) {
		this.setAttribute('min', String(value));
	}

	get size(): number {
		return this.#splitter.values.now.current;
	}

	set size(value: number) {
		this.setAttribute('size', String(value));
	}

	get type(): string {
		return this.getAttribute('type') ?? 'vertical';
	}

	set type(value: string) {
		this.setAttribute('type', value);
	}

	// Constructor

	constructor() {
		super();

		const panels = [...this.children].filter(
			child => child instanceof HTMLElement,
		);

		if (panels.length !== 2) {
			throw new Error(`${SELECTOR} must have exactly two panels.`);
		}

		this.#splitter = new Splitter(this, panels);
	}

	// Methods

	connectedCallback(): void {
		this.#splitter.updateConnections(1);
	}

	disconnectedCallback(): void {
		this.#splitter.updateConnections(0);
	}

	attributeChangedCallback(name: string): void {
		switch (name) {
			case 'max':
			case 'min':
			case 'size':
				this.#splitter.updateValues();
				break;

			case 'type':
				this.#splitter.updateOrientation();
				break;

			default:
				break;
		}
	}
}

let index = 0;

class Splitter {
	element: OuiSplitterElement;

	handle: HTMLSpanElement;

	panels: HTMLElement[];

	rectangle: DOMRect;

	separator: HTMLDivElement;

	types!: Types;

	values: Values;

	constructor(element: OuiSplitterElement, panels: HTMLElement[]) {
		this.element = element;
		this.panels = panels;

		if (isNullableOrWhitespace(element.id)) {
			element.id = `oui_splitter_${++index}`;
		}

		this.values = getValues(element);

		this.handle = createHandle();
		this.rectangle = element.getBoundingClientRect();
		this.separator = createSeparator(this);

		this.separator.append(this.handle);

		panels[0].insertAdjacentElement('afterend', this.separator);

		this.updateOrientation();
		this.updateValues();
	}

	updateConnections(add: 0 | 1): void {
		const method = METHODS_CONNECT[add];

		MAPPED_ELEMENTS[method](this.element, this);
		MAPPED_ELEMENTS[method](this.handle, this);
		MAPPED_ELEMENTS[method](this.separator, this);

		if (this.types.auto) {
			RESIZE_OBSERVER[METHODS_OBSERVE[add]](this.element);
		}
	}

	updateOrientation(): void {
		this.types = getTypes(this);

		if (this.types.auto) {
			RESIZE_OBSERVER.observe(this.element);
		} else {
			RESIZE_OBSERVER.unobserve(this.element);
		}

		if (this.types.horizontal) {
			this.element.setAttribute(ATTRIBUTE_HORIZONTAL, '');
		} else {
			this.element.removeAttribute(ATTRIBUTE_HORIZONTAL);
		}

		setAriaOrientation(this);
	}

	updateValues(): void {
		this.values = getValues(this.element);

		requestAnimationFrame(() => {
			setSize(this, this.values.now.current);
			setAriaValue(this);
		});
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
	handle.setAttribute(ATTRIBUTE_HANDLE, '');

	return handle;
}

function createSeparator(splitter: Splitter): HTMLDivElement {
	const separator = document.createElement('div');

	separator.role = 'separator';
	separator.tabIndex = 0;

	separator.setAttribute('aria-controls', splitter.element.id);
	separator.setAttribute('aria-label', 'Resize panels');
	separator.setAttribute(ATTRIBUTE_SEPARATOR, '');

	return separator;
}

function getContained(min: number, value: number, max: number): number {
	return round(clamp(value, min, max), VALUE_DECIMALS);
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

	if (parsed < 0) {
		return defaultValue;
	}

	return parsed > 1 ? parsed / NAVIGATION_MAXIMUM_TOTAL : parsed;
}

function getValues(element: OuiSplitterElement): Values {
	const values: Values = {
		max: getValue(element, 'max', NAVIGATION_MAXIMUM_PERCENTAGE),
		min: getValue(element, 'min', NAVIGATION_MINIMUM_PERCENTAGE),
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
	if (splitter == null) {
		return;
	}

	splitter.handle.removeAttribute(ATTRIBUTE_ACTIVE);
	splitter.separator.removeAttribute(ATTRIBUTE_ACTIVE);

	if (reset) {
		setSize(splitter, splitter.values.now.previous);
	} else {
		splitter.values.now.previous = splitter.values.now.current;
	}

	splitter = undefined;

	STYLING_TOGGLER.remove();
}

function onKeydown(event: KeyboardEvent): void {
	switch (true) {
		case KEYS_ALL.has(event.key):
			onNavigate(event);
			break;

		case event.key === 'Escape':
			onEnd(true);
			break;

		default:
			break;
	}
}

function onNavigate(event: KeyboardEvent): void {
	const splitter = MAPPED_ELEMENTS.get(
		findAncestor(
			event.target as never,
			'[oui-splitter-separator]',
		) as HTMLSpanElement,
	);

	if (splitter == null) {
		return;
	}

	const {types, values} = splitter;

	if (KEYS_ABSOLUTE.has(event.key)) {
		setSize(splitter, event.key === 'End' ? values.max : values.min, true);

		return;
	}

	if (
		(types.horizontal && !KEYS_HORIZONTAL.has(event.key)) ||
		!(types.horizontal || KEYS_VERTICAL.has(event.key))
	) {
		return;
	}

	const offset = KEYS_NEGATIVE.has(event.key) ? -1 : 1;

	setSize(
		splitter,
		getContained(
			values.min,
			values.now.current + offset * NAVIGATION_MODIFIER,
			values.max,
		),
		true,
	);
}

function onObservation(entries: ResizeObserverEntry[]): void {
	if (frame != null) {
		cancelAnimationFrame(frame);
	}

	frame = requestAnimationFrame(() => {
		for (const entry of entries) {
			const splitter = MAPPED_ELEMENTS.get(entry.target as HTMLElement);

			if (splitter == null) {
				return;
			}

			splitter.types = getTypes(
				splitter,
				entry.contentRect.width,
				entry.contentRect.height,
			);

			if (splitter.types.horizontal) {
				splitter.element.setAttribute(ATTRIBUTE_HORIZONTAL, '');
			} else {
				splitter.element.removeAttribute(ATTRIBUTE_HORIZONTAL);
			}

			setAriaOrientation(splitter);
		}

		frame = undefined;
	});
}

function onPointerdown(event: Event): void {
	if (
		(event.type === 'mousedown' && supportsTouch.value) ||
		(event.type === 'touchstart' && !supportsTouch.value)
	) {
		return;
	}

	splitter = MAPPED_ELEMENTS.get(
		findAncestor(event.target as never, SELECTOR_HANDLE) as HTMLSpanElement,
	);

	if (splitter == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	splitter.handle.setAttribute(ATTRIBUTE_ACTIVE, '');
	splitter.separator.setAttribute(ATTRIBUTE_ACTIVE, '');

	splitter.rectangle = splitter.element.getBoundingClientRect();

	STYLING_TOGGLER.set();
}

function onPointermove(event: MouseEvent): void {
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

function onPointerup(): void {
	if (splitter != null) {
		onEnd(false);
	}
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

const SELECTOR = 'oui-splitter';

const ATTRIBUTE_ACTIVE = `${SELECTOR}-active`;

const ATTRIBUTE_HANDLE = `${SELECTOR}-handle`;

const ATTRIBUTE_HORIZONTAL = `${SELECTOR}-horizontal`;

const ATTRIBUTE_SEPARATOR = `${SELECTOR}-separator`;

const KEYS_ABSOLUTE: Set<string> = new Set(['End', 'Home']);

const KEYS_HORIZONTAL: Set<string> = new Set(['ArrowDown', 'ArrowUp']);

const KEYS_NEGATIVE: Set<string> = new Set(['ArrowLeft', 'ArrowUp']);

const KEYS_VERTICAL: Set<string> = new Set(['ArrowLeft', 'ArrowRight']);

const KEYS_ALL: Set<string> = new Set([
	...KEYS_ABSOLUTE,
	...KEYS_HORIZONTAL,
	...KEYS_VERTICAL,
]);

const MAPPED_ELEMENTS: WeakMap<HTMLElement, Splitter> = new WeakMap();

const METHODS_CONNECT = ['delete', 'set'] as const;

const METHODS_OBSERVE = ['unobserve', 'observe'] as const;

const NAVIGATION_MAXIMUM_PERCENTAGE = 0.9;

const NAVIGATION_MAXIMUM_TOTAL = 100;

const NAVIGATION_MINIMUM_PERCENTAGE = 0.1;

const NAVIGATION_MODIFIER = 0.05;

const RESIZE_OBSERVER: ResizeObserver = new ResizeObserver(onObservation);

const SELECTOR_HANDLE = `[${ATTRIBUTE_HANDLE}]`;

const STYLING_TOGGLER: StyleToggler = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

const VALUE_DECIMALS = 6;

let frame: DOMHighResTimeStamp | undefined;

let splitter: Splitter | undefined;

//

customElements.define(SELECTOR, OuiSplitterElement);

on(document, 'keydown', onKeydown);
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup, {passive: false});
on(document, 'touchstart', onPointerdown, {passive: false});
