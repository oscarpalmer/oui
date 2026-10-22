import {isPlainObject} from '@oscarpalmer/atoms/is';
import {getNumber} from '@oscarpalmer/atoms/number';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {setStyles, toggleStyles} from '@oscarpalmer/toretto/style';
import {supportsTouch} from '@oscarpalmer/toretto/touch';
import {attributable} from '../internal/attributable';
import {
	OuiResizableEvent,
	RESIZABLE_ATTRIBUTE,
	RESIZABLE_ATTRIBUTE_DIRECTION,
	RESIZABLE_ATTRIBUTE_MAXIMUM,
	RESIZABLE_ATTRIBUTE_MINIMUM,
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
	type OuiResizableItem,
	type OuiResizableState,
} from './resizable.model';

// #region Instancs

function OuiResizable(this: OuiResizable, state: OuiResizableState): void {
	this[RESIZABLE_SYMBOL] = state;
}

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

	dispatch(
		item.state.element,
		new OuiResizableEvent(RESIZABLE_EVENT_CANCEL, {
			detail: {
				height: item.state.height,
				width: item.state.width,
			},
		}),
	);
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

function getRestrictions(
	maximum: string | [unknown, unknown],
	minimum: string | [unknown, unknown],
): Required<CreateOuiResizableOptions> {
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

	const [x, y] = typeof first === 'string' && second == null ? first.split(',') : [first, second];

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
	if (
		event.altKey ||
		event.ctrlKey ||
		event.metaKey ||
		event.shiftKey ||
		(supportsTouch.value
			? event.type === 'mousedown'
			: event.type === 'touchstart' || (event as MouseEvent).button !== 0)
	) {
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

	const resize = new OuiResizableEvent(RESIZABLE_EVENT_BEGIN, {
		detail: {
			height: stored.state.height,
			width: stored.state.width,
		},
	});

	if (dispatch(element!, resize).defaultPrevented) {
		return;
	}

	current = stored;
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

	let width = current.state.horizontal
		? current.state.width + (x - (start?.x ?? 0))
		: current.state.width;

	let height = current.state.vertical
		? current.state.height + (y - (start?.y ?? 0))
		: current.state.height;

	[width, height] = getAndSetDimensions(current.state.element, current.state.options, {
		height,
		width,
	});

	const resize = new OuiResizableEvent(RESIZABLE_EVENT_RESIZE, {
		detail: {
			height,
			width,
		},
	});

	if (dispatch(current.state.element, resize).defaultPrevented) {
		cancelResize(current);
	}
}

function onPointerup(): void {
	if (current == null) {
		return;
	}

	const resize = new OuiResizableEvent(RESIZABLE_EVENT_END, {
		detail: {
			height: current.state.height,
			width: current.state.width,
		},
	});

	if (dispatch(current.state.element, resize).defaultPrevented) {
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
	start = undefined;
}

function setResizable(this: OuiResizable): void {
	const state = this[RESIZABLE_SYMBOL];

	const [width, height] = getAndSetDimensions(state.element, state.options);

	state.width = width;
	state.height = height;
}

// #endregion

// #region Variables

const styleToggler = toggleStyles(document.body, resizableStyles);

let current: OuiResizableItem | undefined;

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
