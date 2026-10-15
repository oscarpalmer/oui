import {filter} from '@oscarpalmer/atoms/array/filter';
import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {round} from '@oscarpalmer/atoms/math';
import {clamp} from '@oscarpalmer/atoms/number';
import {setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {setStyle} from '@oscarpalmer/toretto/style';
import {supportsTouch} from '@oscarpalmer/toretto/touch';
import {
	SPLITTER_ATTRIBUTE_ACTIVE,
	SPLITTER_ATTRIBUTE_HANDLE,
	SPLITTER_ATTRIBUTE_HORIZONTAL,
	SPLITTER_ATTRIBUTE_MAX,
	SPLITTER_ATTRIBUTE_MIN,
	SPLITTER_ATTRIBUTE_SEPARATOR,
	SPLITTER_ATTRIBUTE_SIZE,
	SPLITTER_ATTRIBUTE_TYPE,
	SPLITTER_KEYS_ABSOLUTE,
	SPLITTER_KEYS_ALL,
	SPLITTER_KEYS_HORIZONTAL,
	SPLITTER_KEYS_NEGATIVE,
	SPLITTER_KEYS_VERTICAL,
	SPLITTER_MESSAGE,
	SPLITTER_METHODS_OBSERVE,
	SPLITTER_NAVIGATION_MAXIMUM_PERCENTAGE,
	SPLITTER_NAVIGATION_MAXIMUM_TOTAL,
	SPLITTER_NAVIGATION_MINIMUM_PERCENTAGE,
	SPLITTER_NAVIGATION_MODIFIER,
	SPLITTER_SELECTOR_HANDLE,
	SPLITTER_SYMBOL,
	SPLITTER_TAGNAME,
	SPLITTER_VALUE_DECIMALS,
	splitterStyling,
	type GenericOuiSplitterElement,
	type OuiSplitter,
	type OuiSplitterTypes,
	type OuiSplitterValues,
} from './splitter.model';

// #region Instances

function OuiSplitter(
	this: OuiSplitter,
	element: GenericOuiSplitterElement,
	panels: Element[],
): void {
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

OuiSplitter.prototype.updateObserver = updateObserver;
OuiSplitter.prototype.updateOrientation = updateOrientation;
OuiSplitter.prototype.updateValues = updateValues;

// #endregion

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[SPLITTER_TAGNAME]: OuiSplitterElement;
	}
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging
export interface OuiSplitterElement {
	[SPLITTER_SYMBOL]: OuiSplitter;
}

export class OuiSplitterElement extends HTMLElement {
	static readonly observedAttributes: string[] = [
		SPLITTER_ATTRIBUTE_MAX,
		SPLITTER_ATTRIBUTE_MIN,
		SPLITTER_ATTRIBUTE_SIZE,
		SPLITTER_ATTRIBUTE_TYPE,
	];

	// Getters and setters

	/**
	 * Maximum size for the first panel
	 */
	get max(): number {
		return this[SPLITTER_SYMBOL].values.max;
	}

	/**
	 * Maximum size for the first panel
	 */
	set max(value: number) {
		if (typeof value === 'number') {
			setAttribute(this, SPLITTER_ATTRIBUTE_MAX, value.toString());
		}
	}

	/**
	 * Minimum size for the first panel
	 */
	get min(): number {
		return this[SPLITTER_SYMBOL].values.min;
	}

	/**
	 * Minimum size for the first panel
	 */
	set min(value: number) {
		if (typeof value === 'number') {
			setAttribute(this, SPLITTER_ATTRIBUTE_MIN, value.toString());
		}
	}

	/**
	 * Current size for the first panel
	 */
	get size(): number {
		return this[SPLITTER_SYMBOL].values.now.current;
	}

	/**
	 * Current size for the first panel
	 */
	set size(value: number) {
		if (typeof value === 'number') {
			setAttribute(this, SPLITTER_ATTRIBUTE_SIZE, value.toString());
		}
	}

	/**
	 * Orientation of the splitter
	 */
	get type(): string {
		return getAttribute(this, SPLITTER_ATTRIBUTE_TYPE) ?? 'vertical';
	}

	/**
	 * Orientation of the splitter
	 */
	set type(value: string) {
		setAttribute(this, SPLITTER_ATTRIBUTE_TYPE, value);
	}

	// Constructor

	constructor() {
		super();

		const panels = filter([...this.children], child => child instanceof Element) as HTMLElement[];

		if (panels.length !== 2) {
			throw new Error(SPLITTER_MESSAGE);
		}

		// @ts-expect-error All good, no worries :-)
		this[SPLITTER_SYMBOL] = new OuiSplitter(this, panels);
	}

	// Methods

	connectedCallback(): void {
		this[SPLITTER_SYMBOL].updateObserver(1);
	}

	disconnectedCallback(): void {
		this[SPLITTER_SYMBOL].updateObserver(0);
	}

	attributeChangedCallback(name: string): void {
		switch (name) {
			case SPLITTER_ATTRIBUTE_MAX:
			case SPLITTER_ATTRIBUTE_MIN:
			case SPLITTER_ATTRIBUTE_SIZE:
				this[SPLITTER_SYMBOL].updateValues();
				break;

			case SPLITTER_ATTRIBUTE_TYPE:
				this[SPLITTER_SYMBOL].updateOrientation();
				break;

			default:
				break;
		}
	}
}

// #endregion

// #region Functions

function createHandle(): HTMLSpanElement {
	return createElement('span', {
		aria: {
			hidden: true,
		},
		attribute: {
			[SPLITTER_ATTRIBUTE_HANDLE]: '',
		},
	});
}

function createSeparator(splitter: OuiSplitter): HTMLDivElement {
	return createElement('div', {
		aria: {
			controls: splitter.element.id,
			label: 'Resize panels',
		},
		attribute: {
			[SPLITTER_ATTRIBUTE_SEPARATOR]: '',
		},
		property: {
			role: 'separator',
			tabIndex: 0,
		},
	});
}

function getContained(min: number, value: number, max: number): number {
	return round(clamp(value, min, max), SPLITTER_VALUE_DECIMALS);
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

function getValue(element: Element, name: string, defaultValue: number): number {
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

	return parsed > 1 ? parsed / SPLITTER_NAVIGATION_MAXIMUM_TOTAL : parsed;
}

function getValues(element: GenericOuiSplitterElement): OuiSplitterValues {
	const values: OuiSplitterValues = {
		max: getValue(element, SPLITTER_ATTRIBUTE_MAX, SPLITTER_NAVIGATION_MAXIMUM_PERCENTAGE),
		min: getValue(element, SPLITTER_ATTRIBUTE_MIN, SPLITTER_NAVIGATION_MINIMUM_PERCENTAGE),
		now: {
			current: 0.5,
			previous: 0.5,
		},
	};

	const value = getContained(
		values.min,
		getValue(element, SPLITTER_ATTRIBUTE_SIZE, values.now.current),
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

	splitter.handle.removeAttribute(SPLITTER_ATTRIBUTE_ACTIVE);
	splitter.separator.removeAttribute(SPLITTER_ATTRIBUTE_ACTIVE);

	if (reset) {
		setSize(splitter, splitter.values.now.previous);
	} else {
		splitter.values.now.previous = splitter.values.now.current;
	}

	splitter = undefined;

	splitterStyling.remove();
}

function onKeydown(event: KeyboardEvent): void {
	switch (true) {
		case SPLITTER_KEYS_ALL.has(event.key):
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
	const separator = findAncestor(event, '[oui-splitter-separator]');

	if (separator == null) {
		return;
	}

	const splitter = findAncestor(separator, SPLITTER_TAGNAME)?.[SPLITTER_SYMBOL];

	if (splitter == null) {
		return;
	}

	const {types, values} = splitter;

	if (SPLITTER_KEYS_ABSOLUTE.has(event.key)) {
		setSize(splitter, event.key === 'End' ? values.max : values.min, true);

		return;
	}

	if (
		(types.horizontal && !SPLITTER_KEYS_HORIZONTAL.has(event.key)) ||
		!(types.horizontal || SPLITTER_KEYS_VERTICAL.has(event.key))
	) {
		return;
	}

	const offset = SPLITTER_KEYS_NEGATIVE.has(event.key) ? -1 : 1;

	setSize(
		splitter,
		getContained(
			values.min,
			values.now.current + offset * SPLITTER_NAVIGATION_MODIFIER,
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
			const splitter =
				entry.target instanceof OuiSplitterElement ||
				entry.target.hasAttribute(SPLITTER_ATTRIBUTE_HANDLE) ||
				entry.target.hasAttribute(SPLITTER_ATTRIBUTE_SEPARATOR)
					? findAncestor(entry.target, SPLITTER_TAGNAME)?.[SPLITTER_SYMBOL]
					: undefined;

			if (splitter == null) {
				return;
			}

			splitter.types = getTypes(splitter, entry.contentRect.width, entry.contentRect.height);

			setAttribute(
				splitter.element,
				SPLITTER_ATTRIBUTE_HORIZONTAL,
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

	const handle = findAncestor(event, SPLITTER_SELECTOR_HANDLE);

	if (handle == null) {
		return;
	}

	splitter = findAncestor(handle, SPLITTER_TAGNAME)?.[SPLITTER_SYMBOL];

	if (splitter == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	setAttribute(splitter.handle, SPLITTER_ATTRIBUTE_ACTIVE, '');
	setAttribute(splitter.separator, SPLITTER_ATTRIBUTE_ACTIVE, '');

	splitter.rectangle = splitter.element.getBoundingClientRect();

	splitterStyling.set();
}

function onPointermove(event: MouseEvent): void {
	if (splitter == null) {
		return;
	}

	const position = getEventPosition(event);

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

function updateObserver(this: OuiSplitter, add: 0 | 1): void {
	if (this.types.auto) {
		observer[SPLITTER_METHODS_OBSERVE[add]](this.element);
	}
}

function updateOrientation(this: OuiSplitter): void {
	this.types = getTypes(this);

	if (this.types.auto) {
		observer.observe(this.element);
	} else {
		observer.unobserve(this.element);
	}

	setAttribute(this.element, SPLITTER_ATTRIBUTE_HORIZONTAL, this.types.horizontal ? '' : undefined);

	setAriaOrientation(this);
}

function updateValues(this: OuiSplitter): void {
	this.values = getValues(this.element);

	requestAnimationFrame(() => {
		setSize(this, this.values.now.current);
		setAriaValue(this);
	});
}

// #endregion

// #region Variables

const observer: ResizeObserver = new ResizeObserver(onObservation);

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

customElements.define(SPLITTER_TAGNAME, OuiSplitterElement);

// #endregion
