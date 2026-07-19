import {isPlainObject} from '@oscarpalmer/atoms/is';
import type {EventPosition} from '@oscarpalmer/atoms/models';
import {getNumber} from '@oscarpalmer/atoms/number';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch, getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {setStyles, toggleStyles, type StyleToggler} from '@oscarpalmer/toretto/style';
import supportsTouch from '@oscarpalmer/toretto/touch';
import {attributable} from '../internal/attributable';

// #region Types

export type CreateOuiResizableOptions = {
	maximumHeight?: number;
	maximumWidth?: number;
	minimumHeight?: number;
	minimumWidth?: number;
};

export class OuiResizable {
	readonly #state: OuiResizableState;

	constructor(state: OuiResizableState) {
		this.#state = state;
	}

	destroy(): void {
		destroyResizable(this.#state);
	}

	set(): void {
		const [width, height] = getAndSetDimensions(this.#state.element, this.#state.options);

		console.log('set', width, height);

		this.#state.width = width;
		this.#state.height = height;
	}

	reset(): void {
		setStyles(this.#state.element, {
			height: '',
			width: '',
		});
	}
}

type OuiResizableItem = {
	instance: OuiResizable;
	state: OuiResizableState;
};

type OuiResizableState = {
	element: HTMLElement;
	handle: HTMLElement;
	height: number;
	options: Required<CreateOuiResizableOptions>;
	styles: StyleToggler;
	width: number;
};

// #endregion

// #region Functions

function addResizable(
	element: HTMLElement,
	options?: CreateOuiResizableOptions,
): OuiResizable | undefined {
	let item = items.get(element);

	if (item == null) {
		const handle = element.querySelector(SELECTOR_HANDLE_SCOPED);

		if (!isHTMLOrSVGElement(handle)) {
			return;
		}

		const state = getState(element, handle, options);
		const instance = new OuiResizable(state);

		item = {
			instance,
			state,
		};

		items.set(element, item);
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

	resetResizable();

	dispatch(item.state.element, 'resizable:cancel');
}

/**
 * Creates _(or retrieves)_ a _OuiResizable_ instance for an element
 *
 * @param element Element to make resizable
 * @returns _OuiResizable_ instance
 */
export function createResizable(
	element: HTMLElement,
	options?: CreateOuiResizableOptions,
): OuiResizable {
	if (!isHTMLOrSVGElement(element)) {
		throw new TypeError(MESSAGE_ELEMENT);
	}

	if (!isHTMLOrSVGElement(element.querySelector(SELECTOR_HANDLE_SCOPED))) {
		throw new Error(MESSAGE_HANDLE);
	}

	return addResizable(element, options ?? {})!;
}

function destroyResizable(state: OuiResizableState): void {
	state.element = undefined as never;
	state.handle = undefined as never;
}

function getAndSetDimensions(
	element: HTMLElement,
	options: Required<CreateOuiResizableOptions>,
	input?: Pick<DOMRect, 'height' | 'width'>,
): [number, number] {
	let {height, width} = input ?? element.getBoundingClientRect();

	if (options.maximumWidth > -1 && width > options.maximumWidth) {
		width = options.maximumWidth;
	} else if (options.minimumWidth > -1 && width < options.minimumWidth) {
		width = options.minimumWidth;
	}

	if (options.maximumHeight > -1 && height > options.maximumHeight) {
		height = options.maximumHeight;
	} else if (options.minimumHeight > -1 && height < options.minimumHeight) {
		height = options.minimumHeight;
	}

	if (element.checkVisibility()) {
		setStyles(element, {
			height: `${height}px`,
			width: `${width}px`,
		});
	}

	return [width, height];
}

function getProperties(
	element: HTMLElement,
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
	const [maximumWidth, maximumHeight] = getXAndY.apply(
		null,
		typeof maximum === 'string' ? [maximum] : maximum,
	);

	const [minimumWidth, minimumHeight] = getXAndY.apply(
		null,
		typeof minimum === 'string' ? [minimum] : minimum,
	);

	if (maximumWidth > -1 && minimumWidth > -1 && maximumWidth <= minimumWidth) {
		throw new Error(MESSAGE_WIDTH);
	}

	if (maximumHeight > -1 && minimumHeight > -1 && maximumHeight <= minimumHeight) {
		throw new Error(MESSAGE_HEIGHT);
	}

	return {
		maximumHeight,
		maximumWidth,
		minimumHeight,
		minimumWidth,
	};
}

function getState(
	element: HTMLElement,
	handle: HTMLElement,
	input?: CreateOuiResizableOptions,
): OuiResizableState {
	setAttribute(element, RESIZABLE_ATTRIBUTE, '');

	const options = getValidOptions(element, input);

	const [width, height] = getAndSetDimensions(element, options);

	return {
		element,
		handle,
		height,
		options,
		width,
		styles: toggleStyles(element, styles),
	};
}

function getValidOptions(
	element: HTMLElement,
	input?: CreateOuiResizableOptions,
): Required<CreateOuiResizableOptions> {
	const original = isPlainObject(input) ? input : {};

	return {
		...getRestrictions(
			input == null
				? (getAttribute(element, ATTRIBUTE_MAXIMUM) ??
						getProperties(element, 'maxWidth', 'maxHeight'))
				: [original.maximumWidth, original.maximumHeight],
			input == null
				? (getAttribute(element, ATTRIBUTE_MINIMUM) ??
						getProperties(element, 'minWidth', 'minHeight'))
				: [original.minimumWidth, original.minimumHeight],
		),
	};
}

function getXAndY(first: unknown, second?: unknown): [number, number] {
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

	const handle = findAncestor(event, SELECTOR_HANDLE);
	const element = handle && findAncestor(handle, SELECTOR);
	const stored = element && items.get(element as HTMLElement);
	const position = getPosition(event);

	if (stored == null || position == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	const dispatch = new CustomEvent('resizable:begin', {
		cancelable: true,
	});

	element!.dispatchEvent(dispatch);

	setTimeout(() => {
		if (dispatch.defaultPrevented) {
			return;
		}

		current = stored;
		start = position;

		current.state.styles.set();
		styleToggler.set();
	});
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	if (current == null) {
		return;
	}

	const {x, y} = getPosition(event) ?? {};

	if (x == null || y == null) {
		return;
	}

	const width = current.state.width + (x - (start?.x ?? 0));
	const height = current.state.height + (y - (start?.y ?? 0));

	getAndSetDimensions(current.state.element, current.state.options, {height, width});

	const dispatch = new CustomEvent('resizable:resize', {
		cancelable: true,
		detail: {
			height,
			width,
		},
	});

	current.state.element.dispatchEvent(dispatch);

	setTimeout(() => {
		if (dispatch.defaultPrevented) {
			cancelResize(current);
		}
	});
}

function onPointerup(): void {
	if (current == null) {
		return;
	}

	const dispatch = new CustomEvent('resizable:end', {
		cancelable: true,
	});

	current.state.element.dispatchEvent(dispatch);

	setTimeout(() => {
		if (current == null || dispatch.defaultPrevented) {
			cancelResize(current);

			return;
		}

		const {height, width} = current.state.element.getBoundingClientRect();

		current.state.height = height;
		current.state.width = width;

		resetResizable();
	});
}

function removeResizable(element: HTMLElement): void {
	items.get(element)?.instance.destroy();

	items.delete(element);
}

function resetResizable(): void {
	current?.state.styles.remove();
	styleToggler.remove();

	current = undefined;
	start = undefined;
}

// #endregion

// #region Variables

export const RESIZABLE_ATTRIBUTE = 'oui-resizable';

export const RESIZABLE_ATTRIBUTE_HANDLE = `${RESIZABLE_ATTRIBUTE}-handle`;

const ATTRIBUTE_MAXIMUM = `${RESIZABLE_ATTRIBUTE}-maximum`;

const ATTRIBUTE_MINIMUM = `${RESIZABLE_ATTRIBUTE}-minimum`;

const MESSAGE_ELEMENT = 'The element must be an instance of HTMLElement or SVGElement';

const MESSAGE_HEIGHT = 'The maximum height must be greater than the minimum height';

const MESSAGE_HANDLE = `The element must contain a child with the attribute "${RESIZABLE_ATTRIBUTE_HANDLE}"`;

const MESSAGE_WIDTH = 'The maximum width must be greater than the minimum width';

const SELECTOR = `[${RESIZABLE_ATTRIBUTE}]`;

const SELECTOR_HANDLE = `[${RESIZABLE_ATTRIBUTE_HANDLE}]`;

const SELECTOR_HANDLE_SCOPED = `:scope > ${SELECTOR_HANDLE}`;

const items = new WeakMap<HTMLElement, OuiResizableItem>();

const styles = {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
};

const styleToggler = toggleStyles(document.body, styles);

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
