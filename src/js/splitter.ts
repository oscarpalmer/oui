import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {round} from '@oscarpalmer/atoms/math';
import {clamp} from '@oscarpalmer/atoms/number';
import {setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {setStyle, toggleStyles} from '@oscarpalmer/toretto/style';
import supportsTouch from '@oscarpalmer/toretto/touch';

// #region Special variables

const ATTRIBUTE_MAX = 'max';

const ATTRIBUTE_MIN = 'min';

const ATTRIBUTE_SIZE = 'size';

const ATTRIBUTE_TYPE = 'type';

// #endregion

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[TAGNAME]: OuiSplitterElement;
	}
}

class OuiSplitter {
	element: OuiSplitterElement;

	handle: HTMLSpanElement;

	panels: HTMLElement[];

	rectangle: DOMRect;

	separator: HTMLDivElement;

	types!: OuiSplitterTypes;

	values: OuiSplitterValues;

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

		setAttribute(this.element, ATTRIBUTE_HORIZONTAL, this.types.horizontal ? '' : undefined);

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

export class OuiSplitterElement extends HTMLElement {
	static readonly observedAttributes = [
		ATTRIBUTE_MAX,
		ATTRIBUTE_MIN,
		ATTRIBUTE_SIZE,
		ATTRIBUTE_TYPE,
	];

	readonly #splitter: OuiSplitter;

	// Getters and setters

	/**
	 * Maximum size for the first panel
	 */
	get max(): number {
		return this.#splitter.values.max;
	}

	/**
	 * Maximum size for the first panel
	 */
	set max(value: number) {
		if (typeof value === 'number') {
			setAttribute(this, ATTRIBUTE_MAX, value.toString());
		}
	}

	/**
	 * Minimum size for the first panel
	 */
	get min(): number {
		return this.#splitter.values.min;
	}

	/**
	 * Minimum size for the first panel
	 */
	set min(value: number) {
		if (typeof value === 'number') {
			setAttribute(this, ATTRIBUTE_MIN, value.toString());
		}
	}

	/**
	 * Current size for the first panel
	 */
	get size(): number {
		return this.#splitter.values.now.current;
	}

	/**
	 * Current size for the first panel
	 */
	set size(value: number) {
		if (typeof value === 'number') {
			setAttribute(this, ATTRIBUTE_SIZE, value.toString());
		}
	}

	/**
	 * Orientation of the splitter
	 */
	get type(): string {
		return getAttribute(this, ATTRIBUTE_TYPE) ?? 'vertical';
	}

	/**
	 * Orientation of the splitter
	 */
	set type(value: string) {
		setAttribute(this, ATTRIBUTE_TYPE, value);
	}

	// Constructor

	constructor() {
		super();

		const panels = [...this.children].filter(child => child instanceof Element) as HTMLElement[];

		if (panels.length !== 2) {
			throw new Error(MESSAGE);
		}

		this.#splitter = new OuiSplitter(this, panels);
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
			case ATTRIBUTE_MAX:
			case ATTRIBUTE_MIN:
			case ATTRIBUTE_SIZE:
				this.#splitter.updateValues();
				break;

			case ATTRIBUTE_TYPE:
				this.#splitter.updateOrientation();
				break;

			default:
				break;
		}
	}
}

type OuiSplitterTypes = {
	auto: boolean;
	horizontal: boolean;
};

type OuiSplitterValues = {
	max: number;
	min: number;
	now: OuiSplitterValuesNow;
};

type OuiSplitterValuesNow = {
	current: number;
	previous: number;
};

// #endregion

// #region Functions

function createHandle(): HTMLSpanElement {
	const handle = document.createElement('span');

	setAria(handle, 'hidden', 'true');
	setAttribute(handle, ATTRIBUTE_HANDLE, '');

	return handle;
}

function createSeparator(splitter: OuiSplitter): HTMLDivElement {
	const separator = document.createElement('div');

	separator.role = 'separator';
	separator.tabIndex = 0;

	setAria(separator, {
		controls: splitter.element.id,
		label: 'Resize panels',
	});

	setAttribute(separator, ATTRIBUTE_SEPARATOR, '');

	return separator;
}

function getContained(min: number, value: number, max: number): number {
	return round(clamp(value, min, max), VALUE_DECIMALS);
}

function getSize(splitter: OuiSplitter, value: number): number {
	const {height, left, top, width} = splitter.rectangle;

	const offset = value - (splitter.types.horizontal ? top : left);

	const fraction = offset / (splitter.types.horizontal ? height : width);

	return getContained(splitter.values.min, fraction, splitter.values.max);
}

function getTypes(splitter: OuiSplitter, width?: number, height?: number): OuiSplitterTypes {
	const type = getAttribute(splitter.element, 'type');

	if (type === 'horizontal') {
		return {
			auto: false,
			horizontal: true,
		};
	}

	if (type === 'auto') {
		return {
			auto: true,
			horizontal: (height ?? splitter.rectangle.height) > (width ?? splitter.rectangle.width),
		};
	}

	return {
		auto: false,
		horizontal: false,
	};
}

function getValue(element: HTMLElement, name: string, defaultValue: number): number {
	const value = getAttribute(element, name);

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

function getValues(element: OuiSplitterElement): OuiSplitterValues {
	const values: OuiSplitterValues = {
		max: getValue(element, ATTRIBUTE_MAX, NAVIGATION_MAXIMUM_PERCENTAGE),
		min: getValue(element, ATTRIBUTE_MIN, NAVIGATION_MINIMUM_PERCENTAGE),
		now: {
			current: 0.5,
			previous: 0.5,
		},
	};

	const value = getContained(
		values.min,
		getValue(element, ATTRIBUTE_SIZE, values.now.current),
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
		findAncestor(event, '[oui-splitter-separator]') as HTMLSpanElement,
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
		getContained(values.min, values.now.current + offset * NAVIGATION_MODIFIER, values.max),
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

			splitter.types = getTypes(splitter, entry.contentRect.width, entry.contentRect.height);

			setAttribute(
				splitter.element,
				ATTRIBUTE_HORIZONTAL,
				splitter.types.horizontal ? '' : undefined,
			);

			setAriaOrientation(splitter);
		}

		frame = undefined;
	});
}

function onPointerdown(event: Event): void {
	if (supportsTouch.value ? event.type === 'mousedown' : event.type === 'touchstart') {
		return;
	}

	splitter = MAPPED_ELEMENTS.get(findAncestor(event, SELECTOR_HANDLE) as HTMLSpanElement);

	if (splitter == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	setAttribute(splitter.handle, ATTRIBUTE_ACTIVE, '');
	setAttribute(splitter.separator, ATTRIBUTE_ACTIVE, '');

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

function setAriaOrientation(splitter: OuiSplitter): void {
	setAria(splitter.separator, 'orientation', splitter.types.horizontal ? 'horizontal' : 'vertical');
}

function setAriaValue(splitter: OuiSplitter): void {
	setAria(splitter.separator, {
		valuemax: splitter.values.max,
		valuemin: splitter.values.min,
		valuenow: splitter.values.now.current,
	});
}

function setSize(splitter: OuiSplitter, size: number, previous?: boolean): void {
	splitter.values.now.current = size;

	if (previous) {
		splitter.values.now.previous = size;
	}

	setStyle(splitter.element, '--oui-splitter-size', `${size}`);

	setAriaValue(splitter);
}

// #endregion

// #region Variables

const TAGNAME = 'oui-splitter';

const ATTRIBUTE_ACTIVE = `${TAGNAME}-active`;

const ATTRIBUTE_HANDLE = `${TAGNAME}-handle`;

const ATTRIBUTE_HORIZONTAL = `${TAGNAME}-horizontal`;

const ATTRIBUTE_SEPARATOR = `${TAGNAME}-separator`;

const KEYS_ABSOLUTE = new Set(['End', 'Home']);

const KEYS_HORIZONTAL = new Set(['ArrowDown', 'ArrowUp']);

const KEYS_NEGATIVE = new Set(['ArrowLeft', 'ArrowUp']);

const KEYS_VERTICAL = new Set(['ArrowLeft', 'ArrowRight']);

const KEYS_ALL = new Set([...KEYS_ABSOLUTE, ...KEYS_HORIZONTAL, ...KEYS_VERTICAL]);

const MAPPED_ELEMENTS = new WeakMap<HTMLElement, OuiSplitter>();

const MESSAGE = `<${TAGNAME}> must have exactly two panels.`;

const METHODS_CONNECT = ['delete', 'set'] as const;

const METHODS_OBSERVE = ['unobserve', 'observe'] as const;

const NAVIGATION_MAXIMUM_PERCENTAGE = 0.9;

const NAVIGATION_MAXIMUM_TOTAL = 100;

const NAVIGATION_MINIMUM_PERCENTAGE = 0.1;

const NAVIGATION_MODIFIER = 0.05;

const RESIZE_OBSERVER: ResizeObserver = new ResizeObserver(onObservation);

const SELECTOR_HANDLE = `[${ATTRIBUTE_HANDLE}]`;

const STYLING_TOGGLER = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

const VALUE_DECIMALS = 6;

let index = 0;

let frame: DOMHighResTimeStamp | undefined;

let splitter: OuiSplitter | undefined;

// #endregion

// #region Initialization

on(document, 'keydown', onKeydown);
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup);
on(document, 'touchstart', onPointerdown, {passive: false});

customElements.define(TAGNAME, OuiSplitterElement);

// #endregion
