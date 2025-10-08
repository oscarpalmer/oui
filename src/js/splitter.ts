import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {round} from '@oscarpalmer/atoms/math';
import {clamp} from '@oscarpalmer/atoms/number';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';

declare global {
	interface HTMLElementTagNameMap {
		[selector]: OuiSplitterElement;
	}
}

export class OuiSplitterElement extends HTMLElement {
	static readonly observedAttributes = ['max', 'min', 'size', 'type'];

	#splitter: Splitter;

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
			throw new Error(`${selector} must have exactly two panels.`);
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
		}
	}
}

let index = 0;

class Splitter {
	handle: HTMLSpanElement;

	rectangle: DOMRect;

	separator: HTMLDivElement;

	types!: Types;

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

		this.updateOrientation();
		this.updateValues();
	}

	updateConnections(add: 0 | 1): void {
		mapped[connectMethods[add]](this.element, this);
		mapped[connectMethods[add]](this.handle, this);
		mapped[connectMethods[add]](this.separator, this);

		if (this.types.auto) {
			observer[observeMethods[add]](this.element);
		}
	}

	updateOrientation(): void {
		this.types = getTypes(this);

		if (this.types.auto) {
			observer.observe(this.element);
		} else {
			observer.unobserve(this.element);
		}

		if (this.types.horizontal) {
			this.element.setAttribute(attributeHorizontal, '');
		} else {
			this.element.removeAttribute(attributeHorizontal);
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

type UserSelect = {
	any?: string;
	webkit?: string;
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
	handle.setAttribute(attributeHandle, '');

	return handle;
}

function createSeparator(splitter: Splitter): HTMLDivElement {
	const separator = document.createElement('div');

	separator.role = 'separator';
	separator.tabIndex = 0;

	separator.setAttribute('aria-controls', splitter.element.id);
	separator.setAttribute('aria-label', 'Resize panels');
	separator.setAttribute(attributeSeparator, '');

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
	if (splitter == null) {
		return;
	}

	splitter.handle.removeAttribute(attributeActive);
	splitter.separator.removeAttribute(attributeActive);

	if (reset) {
		setSize(splitter, splitter.values.now.previous);
	} else {
		splitter.values.now.previous = splitter.values.now.current;
	}

	splitter = undefined;

	unsetUserSelect();
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

	splitter.handle.setAttribute(attributeActive, '');
	splitter.separator.setAttribute(attributeActive, '');

	splitter.rectangle = splitter.element.getBoundingClientRect();

	setUserSelect();
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
			'[oui-splitter-separator]',
		) as HTMLSpanElement,
	);

	if (splitter == null) {
		return;
	}

	const {types, values} = splitter;

	if (absoluteKeys.has(event.key)) {
		setSize(splitter, event.key === 'End' ? values.max : values.min, true);

		return;
	}

	if (
		(types.horizontal && !horizontalKeys.has(event.key)) ||
		(!types.horizontal && !verticalKeys.has(event.key))
	) {
		return;
	}

	const modifier = negativeKeys.has(event.key) ? -1 : 1;

	setSize(
		splitter,
		getContained(values.min, values.now.current + modifier * 0.05, values.max),
		true,
	);
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
				splitter.element.setAttribute(attributeHorizontal, '');
			} else {
				splitter.element.removeAttribute(attributeHorizontal);
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

function setUserSelect(): void {
	const any = document.body.style.userSelect;
	const webkit = document.body.style.webkitUserSelect;

	userSelect.any = (any?.length ?? 0) === 0 ? undefined : any;
	userSelect.webkit = (webkit?.length ?? 0) === 0 ? undefined : webkit;

	document.body.style.userSelect = 'none';
	document.body.style.webkitUserSelect = 'none';
}

function unsetUserSelect(): void {
	if (userSelect.any == null) {
		document.body.style.removeProperty('user-select');
	} else {
		document.body.style.userSelect = userSelect.any;
	}

	if (userSelect.webkit == null) {
		document.body.style.removeProperty('-webkit-user-select');
	} else {
		document.body.style.webkitUserSelect = userSelect.webkit;
	}
}

//

const selector = 'oui-splitter';

const absoluteKeys = new Set(['End', 'Home']);

const attributeActive = `${selector}-active`;

const attributeHandle = `${selector}-handle`;

const attributeHorizontal = `${selector}-horizontal`;

const attributeSeparator = `${selector}-separator`;

const connectMethods = ['delete', 'set'] as const;

const horizontalKeys = new Set(['ArrowDown', 'ArrowUp']);

const mapped = new WeakMap<HTMLElement, Splitter>();

const observeMethods = ['unobserve', 'observe'] as const;

const observer = new ResizeObserver(onObservation);

const negativeKeys = new Set(['ArrowLeft', 'ArrowUp']);

const userSelect: UserSelect = {};

const verticalKeys = new Set(['ArrowLeft', 'ArrowRight']);

const allKeys = new Set([...absoluteKeys, ...horizontalKeys, ...verticalKeys]);

let frame: DOMHighResTimeStamp | undefined;

let splitter: Splitter | undefined;

//

customElements.define(selector, OuiSplitterElement);

on(document, 'keydown', onKeydown);
on(document, 'mousedown', onMousedown);
on(document, 'mousemove', onMousemove);
on(document, 'mouseup', onMouseup);
