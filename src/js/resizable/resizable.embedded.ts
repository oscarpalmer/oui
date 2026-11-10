import {noop} from '@oscarpalmer/atoms/function';
import {isPlainObject} from '@oscarpalmer/atoms/is';
import {round} from '@oscarpalmer/atoms/math';
import {getNumber} from '@oscarpalmer/atoms/number';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {setStyles, toggleStyles} from '@oscarpalmer/toretto/style';
import {supportsTouch} from '@oscarpalmer/toretto/touch';
import {attributable} from '../internal/attributable';
import {ignoreEvent} from '../internal/misc';
import {
	OuiResizableEvent,
	RESIZABLE_ATTRIBUTE,
	RESIZABLE_ATTRIBUTE_DIRECTION,
	RESIZABLE_ATTRIBUTE_MAXIMUM,
	RESIZABLE_ATTRIBUTE_MINIMUM,
	RESIZABLE_ATTRIBUTE_STEP,
	RESIZABLE_EVENT_BEGIN,
	RESIZABLE_EVENT_CANCEL,
	RESIZABLE_EVENT_END,
	RESIZABLE_EVENT_RESIZE,
	RESIZABLE_MESSAGE_ELEMENT,
	RESIZABLE_MESSAGE_HANDLE,
	RESIZABLE_MESSAGE_HEIGHT,
	RESIZABLE_MESSAGE_WIDTH,
	RESIZABLE_SELECTOR,
	RESIZABLE_SELECTOR_HANDLE,
	RESIZABLE_SELECTOR_HANDLE_SCOPED,
	RESIZABLE_SYMBOL,
	resizableHorizontals,
	resizableItems,
	resizableStyles,
	resizableVerticals,
	type CreateOuiResizableOptions,
	type OuiResizable,
	type OuiResizableEventDetail,
	type OuiResizableItem,
	type OuiResizableState,
} from './resizable.model';

// #region Instancs

function OuiResizable(this: OuiResizable, state: OuiResizableState): void {
	this[RESIZABLE_SYMBOL] = state;
}

OuiResizable.prototype.configure = configureResizable;
OuiResizable.prototype.destroy = destroyResizable;
OuiResizable.prototype.reset = resetResizable;
OuiResizable.prototype.set = setResizable;

// #endregion

// #region Functions

function addResizable(
	element: Element,
	options?: CreateOuiResizableOptions,
): OuiResizable | undefined {
	let item = resizableItems.get(element);

	if (item == null) {
		const handle = element.querySelector(RESIZABLE_SELECTOR_HANDLE_SCOPED);

		if (!isHTMLOrSVGElement(handle)) {
			return;
		}

		const state = createState(element, handle, options);

		// @ts-expect-error All good, no worries :-)
		const instance = new OuiResizable(state);

		item = {
			instance,
			state,
		};

		resizableItems.set(element, item);
	}

	return item?.instance;
}

function cancelResize(item?: OuiResizableItem): void {
	if (item == null) {
		return;
	}

	setStyles(item.state.element, {
		height: `${item.state.height}px`,
		width: `${item.state.width}px`,
	});

	resetResizableStyles();

	const detail = {
		height: item.state.height,
		width: item.state.width,
	};

	const cancel = new OuiResizableEvent(RESIZABLE_EVENT_CANCEL, {detail});

	item.state.options.onCancel(item.state.element, detail, cancel);

	dispatch(item.state.element, cancel);
}

function configureResizable(this: OuiResizable, options: CreateOuiResizableOptions): void {
	const state = this[RESIZABLE_SYMBOL];

	const keys = Object.keys(options) as (keyof CreateOuiResizableOptions)[];

	for (const key of keys) {
		const value = options[key];

		if (typeof value === typeof state.options[key]) {
			state.options[key] = value as never;
		}
	}

	this.set();
}

/**
 * Creates _(or retrieves)_ a _OuiResizable_ instance for an element
 *
 * @param element Element to make resizable
 * @returns _OuiResizable_ instance
 */
export function createResizable(
	element: Element,
	options?: CreateOuiResizableOptions,
): OuiResizable {
	if (!isHTMLOrSVGElement(element)) {
		throw new TypeError(RESIZABLE_MESSAGE_ELEMENT);
	}

	if (!isHTMLOrSVGElement(element.querySelector(RESIZABLE_SELECTOR_HANDLE_SCOPED))) {
		throw new Error(RESIZABLE_MESSAGE_HANDLE);
	}

	return addResizable(element, options ?? {})!;
}

function createState(
	element: Element,
	handle: Element,
	input?: CreateOuiResizableOptions,
): OuiResizableState {
	setAttribute(element, RESIZABLE_ATTRIBUTE, '');

	const options = getValidOptions(element, input);

	const [width, height] = getAndSetDimensions(element, options);
	const [horizontal, vertical] = getDirections(element);

	return {
		element,
		handle,
		height,
		horizontal,
		options,
		vertical,
		width,
		styles: toggleStyles(element, resizableStyles),
	};
}

function destroyResizable(this: OuiResizable): void {
	const state = this[RESIZABLE_SYMBOL];

	state.element = undefined as never;
	state.handle = undefined as never;
	state.options = undefined as never;
	state.styles = undefined as never;
}

function getAndSetDimensions(
	element: Element,
	options: Required<CreateOuiResizableOptions>,
	input?: Pick<DOMRect, 'height' | 'width'>,
): [number, number] {
	const {maximumHeight, maximumWidth, minimumHeight, minimumWidth} = options;

	let {height, width} = input ?? element.getBoundingClientRect();

	if (maximumWidth > -1 && width > maximumWidth) {
		width = maximumWidth;
	} else if (minimumWidth > -1 && width < minimumWidth) {
		width = minimumWidth;
	}

	if (maximumHeight > -1 && height > maximumHeight) {
		height = maximumHeight;
	} else if (minimumHeight > -1 && height < minimumHeight) {
		height = minimumHeight;
	}

	if (element.checkVisibility()) {
		setStyles(element, {
			height: `${height}px`,
			width: `${width}px`,
		});
	}

	return [width, height];
}

function getDirections(element: Element): [boolean, boolean] {
	const attribute = getAttribute(element, RESIZABLE_ATTRIBUTE_DIRECTION);

	if (resizableHorizontals.has(attribute as never)) {
		return [true, false];
	}

	if (resizableVerticals.has(attribute as never)) {
		return [false, true];
	}

	return [true, true];
}

function getProperties(
	element: Element,
	widthProperty: 'maxWidth' | 'minWidth',
	heightProperty: 'maxHeight' | 'minHeight',
): [string, string] {
	const computed = getComputedStyle(element);

	return [computed[widthProperty], computed[heightProperty]];
}

export function getResizable(element: HTMLElement): OuiResizable | undefined {
	return resizableItems.get(element)?.instance;
}

function getRestrictions(
	maximum: string | [unknown, unknown],
	minimum: string | [unknown, unknown],
): Required<
	Pick<
		CreateOuiResizableOptions,
		'maximumHeight' | 'maximumWidth' | 'minimumHeight' | 'minimumWidth'
	>
> {
	const [maximumWidth, maximumHeight] = getXAndY(maximum);
	const [minimumWidth, minimumHeight] = getXAndY(minimum);

	if (maximumWidth > -1 && minimumWidth > -1 && maximumWidth <= minimumWidth) {
		throw new Error(RESIZABLE_MESSAGE_WIDTH);
	}

	if (maximumHeight > -1 && minimumHeight > -1 && maximumHeight <= minimumHeight) {
		throw new Error(RESIZABLE_MESSAGE_HEIGHT);
	}

	return {
		maximumHeight,
		maximumWidth,
		minimumHeight,
		minimumWidth,
	};
}

function getValidOptions(
	element: Element,
	input?: CreateOuiResizableOptions,
): Required<CreateOuiResizableOptions> {
	const original = isPlainObject(input) ? input : {};

	const [stepWidth, stepHeight] = getXAndY(
		input == null
			? getAttribute(element, RESIZABLE_ATTRIBUTE_STEP)
			: [original.stepWidth, original.stepHeight],
	);

	return {
		...getRestrictions(
			input == null
				? (getAttribute(element, RESIZABLE_ATTRIBUTE_MAXIMUM) ??
						getProperties(element, 'maxWidth', 'maxHeight'))
				: [original.maximumWidth, original.maximumHeight],
			input == null
				? (getAttribute(element, RESIZABLE_ATTRIBUTE_MINIMUM) ??
						getProperties(element, 'minWidth', 'minHeight'))
				: [original.minimumWidth, original.minimumHeight],
		),
		onBegin: typeof original.onBegin === 'function' ? original.onBegin : noop,
		onCancel: typeof original.onCancel === 'function' ? original.onCancel : noop,
		onEnd: typeof original.onEnd === 'function' ? original.onEnd : noop,
		onResize: typeof original.onResize === 'function' ? original.onResize : noop,
		stepHeight,
		stepWidth,
	};
}

function getXAndY(value: unknown): [number, number] {
	let first: unknown;
	let second: unknown;

	if (Array.isArray(value)) {
		[first, second] = value;
	} else {
		first = value;
	}

	const [x, y] = typeof first === 'string' && second == null ? splitXAndY(first) : [first, second];

	let xAsNumber = typeof x === 'string' ? Number.parseFloat(x) : getNumber(x);
	let yAsNumber = typeof y === 'string' ? Number.parseFloat(y) : getNumber(y);

	if (Number.isNaN(xAsNumber) || xAsNumber <= 0) {
		xAsNumber = -1;
	}

	if (Number.isNaN(yAsNumber) || yAsNumber <= 0) {
		yAsNumber = -1;
	}

	return [xAsNumber, yAsNumber];
}

function onKeydown(event: KeyboardEvent): void {
	if (current != null && event.key === 'Escape') {
		cancelResize(current);
	}
}

function onPointerdown(event: MouseEvent | TouchEvent): void {
	if (ignoreEvent(event, supportsTouch.value)) {
		return;
	}

	const handle = findAncestor(event, RESIZABLE_SELECTOR_HANDLE);
	const element = handle && findAncestor(handle, RESIZABLE_SELECTOR);
	const stored = element && resizableItems.get(element);
	const position = getEventPosition(event);

	if (stored == null || position == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	const detail = {
		height: stored.state.height,
		width: stored.state.width,
	};

	const begin = new OuiResizableEvent(RESIZABLE_EVENT_BEGIN, {detail});

	stored.state.options.onBegin(stored.state.element, detail, begin);

	dispatch(element!, begin);

	if (begin.defaultPrevented) {
		return;
	}

	event.stopPropagation();

	current = stored;
	last = {height: stored.state.height, width: stored.state.width};
	start = position;

	current.state.styles.set();
	styleToggler.set();
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	if (current == null) {
		return;
	}

	const {x, y} = getEventPosition(event) ?? {};

	if (x == null || y == null) {
		return;
	}

	const {stepHeight, stepWidth} = current.state.options;

	let deltaX = current.state.horizontal ? x - (start?.x ?? 0) : 0;
	let deltaY = current.state.vertical ? y - (start?.y ?? 0) : 0;

	if (stepWidth > -1) {
		deltaX = round(deltaX / stepWidth) * stepWidth;
	}

	if (stepHeight > -1) {
		deltaY = round(deltaY / stepHeight) * stepHeight;
	}

	let width = current.state.width + deltaX;
	let height = current.state.height + deltaY;

	[width, height] = getAndSetDimensions(current.state.element, current.state.options, {
		height,
		width,
	});

	if (last?.height === height && last?.width === width) {
		return;
	}

	last = {height, width};

	const detail = {
		height,
		width,
	};

	const resize = new OuiResizableEvent(RESIZABLE_EVENT_RESIZE, {detail});

	current.state.options.onResize(current.state.element, detail, resize);

	dispatch(current.state.element, resize);

	if (resize.defaultPrevented) {
		cancelResize(current);
	}
}

function onPointerup(): void {
	if (current == null) {
		return;
	}

	const detail = {
		height: last?.height ?? current.state.height,
		width: last?.width ?? current.state.width,
	};

	const end = new OuiResizableEvent(RESIZABLE_EVENT_END, {detail});

	current.state.options.onEnd(current.state.element, detail, end);

	dispatch(current.state.element, end);

	if (end.defaultPrevented) {
		cancelResize(current);

		return;
	}

	const {height, width} = current.state.element.getBoundingClientRect();

	current.state.height = height;
	current.state.width = width;

	resetResizableStyles();
}

function removeResizable(element: Element): void {
	resizableItems.get(element)?.instance.destroy();

	resizableItems.delete(element);
}

function resetResizable(this: OuiResizable): void {
	setStyles(this[RESIZABLE_SYMBOL].element, {
		height: '',
		width: '',
	});
}

function resetResizableStyles(): void {
	current?.state.styles.remove();
	styleToggler.remove();

	current = undefined;
	last = undefined;
	start = undefined;
}

function setResizable(this: OuiResizable): void {
	const state = this[RESIZABLE_SYMBOL];

	const [width, height] = getAndSetDimensions(state.element, state.options);

	state.width = width;
	state.height = height;
}

function splitXAndY(value: string): [string, string] {
	const parts = value.split(',');

	return [parts[0], parts.length > 1 ? parts[1] : parts[0]];
}

// #endregion

// #region Variables

const styleToggler = toggleStyles(document.body, resizableStyles);

let current: OuiResizableItem | undefined;

let last: OuiResizableEventDetail | undefined;

let start: EventPosition | undefined;

// #endregion

// #region Initialization

on(document, 'keydown', onKeydown);
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup);
on(document, 'touchstart', onPointerdown, {passive: false});

attributable(RESIZABLE_ATTRIBUTE, addResizable, removeResizable);

// #endregion
