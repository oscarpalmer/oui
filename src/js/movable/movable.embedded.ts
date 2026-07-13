import type {EventPosition, PlainObject} from '@oscarpalmer/atoms/models';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {getStyles, setStyle, setStyles} from '@oscarpalmer/toretto/style';
import {attributable} from '../internal/attributable';
import {
	addDraggable,
	getDraggableStates,
	OuiDraggable,
	removeDraggable,
	type CreateOuiDraggableOptions,
	type OuiDraggableBound,
	type OuiDraggableGlobals,
	type OuiDraggableItem,
	type OuiDraggableState,
	type OuiDragMovePosition,
} from '../internal/draggable';

// #region Types

export class OuiMovable extends OuiDraggable<OuiMovableState> {
	#element: HTMLElement;

	#style: OuiMovableStyle;

	constructor(element: HTMLElement, options?: CreateOuiDraggableOptions) {
		const style = getStyles(element, ['inset', 'position']);

		super(
			'movable',
			'move',
			ATTRIBUTE_MOVABLE,
			element,
			{
				container: {
					attribute: ATTRIBUTE_CONTAINER,
					map: CONTAINERS,
					onDestroy: destroyContainer,
					onInitialize: initializeContainer,
				},
				direction: {
					attribute: ATTRIBUTE_DIRECTION,
					onAfter: afterDirection,
				},
				drag: {
					onBegin,
					onCancel,
					onEnd,
					onMove,
				},
				input: options,
				position: {
					getOffset: getOffsetPosition,
					getOriginal: getOriginalPosition,
				},
				getDragged() {
					return element;
				},
				getOrigin() {
					return element;
				},
			},
			{
				style,
				hasHandles: element.querySelector(SELECTOR_HANDLE) != null,
				moved: false,
			},
		);

		this.#element = element;

		this.#style = style;
	}

	/**
	 * Destroys the _Movable_
	 */
	override destroy(): void {
		MOVED.delete(this);

		setStyles(this.#element, this.#style);

		this.#element = undefined as never;
		this.#style = undefined as never;

		super.destroy();
	}
}

type OuiMovableState = {
	hasHandles?: boolean;
	moved: boolean;
	offset?: Partial<EventPosition>;
	style: OuiMovableStyle;
};

type OuiMovableStyle = {
	inset: string | undefined;
	position: string | undefined;
};

// #endregion

// #region Functions

function afterDirection(item: OuiDraggableItem): void {
	const container = item.state.container?.getBoundingClientRect();

	if (container != null) {
		setOffset(item.state as OuiDraggableState & OuiMovableState, container);
	}
}

/**
 * Creates _(or retrieves)_ a _OuiMovable_ instance for an element
 *
 * @param element Element to make movable
 * @returns _OuiMovable_ instance
 */
export function createMovable(
	element: HTMLElement,
	options?: CreateOuiDraggableOptions,
): OuiMovable {
	if (!isHTMLOrSVGElement(element)) {
		throw new TypeError(MESSAGE);
	}

	return addMovable(element, options) as OuiMovable;
}

function destroyContainer(_: unknown, container: HTMLElement, empty: boolean): void {
	if (empty) {
		resizer.unobserve(container);
	}
}

function getOffsetPosition(
	globals: OuiDraggableGlobals,
	_: OuiDraggableItem,
	__: HTMLElement,
	position: EventPosition,
): EventPosition {
	return {
		x: position.x - (globals.element?.rectangle.left ?? 0),
		y: position.y - (globals.element?.rectangle.top ?? 0),
	};
}

function getOriginalPosition(globals: OuiDraggableGlobals): EventPosition {
	return {
		x: globals.element?.rectangle.left ?? 0,
		y: globals.element?.rectangle.top ?? 0,
	};
}

function initializeContainer(item: OuiDraggableItem): void {
	resizer.observe(item.state.container!);
}

function onBegin(): void {}

function onCancel(globals: OuiDraggableGlobals, item: OuiDraggableItem): void {
	const {element, moved, style} = item.state as OuiDraggableState & OuiMovableState;

	const {x, y} = globals.original ?? {x: 0, y: 0};

	if (moved) {
		setStyle(element, 'inset', `${y}px auto auto ${x}px`);
	} else {
		setStyles(element, style);
	}

	element.removeAttribute(ATTRIBUTE_MOVING);
}

function onEnd(
	event: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem,
	reset: () => void,
): void {
	const movable = item.instance as OuiMovable;
	const state = item.state as OuiDraggableState & OuiMovableState;

	state.element.removeAttribute(ATTRIBUTE_MOVING);

	if (!state.moved) {
		state.moved = true;

		if (state.container != null) {
			MOVED.add(movable);
		}
	}

	const container = state.container?.getBoundingClientRect();

	if (container != null) {
		setOffset(state, container);
	}

	const end = new CustomEvent(EVENT_END, {
		detail: {
			from: {...globals.original},
			to: getPosition(event),
		},
		cancelable: true,
	});

	state.element.dispatchEvent(end);

	setTimeout(() => {
		if (end.defaultPrevented) {
			onCancel(globals, item);
		}

		reset();
	});
}

function onMove(
	_: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	__: OuiDraggableItem,
	position: OuiDragMovePosition,
): PlainObject | undefined {
	setAttribute(globals.element?.node as never, ATTRIBUTE_MOVING, '');

	return {
		from: {...globals.original},
		to: {...position.calculated},
	};
}

function onResize(entries: ResizeObserverEntry[]): void {
	const {length} = entries;

	for (let index = 0; index < length; index += 1) {
		const entry = entries[index];
		const set = CONTAINERS.get(entry.target as HTMLElement);

		if (set == null) {
			continue;
		}

		for (const movable of set) {
			reposition(movable);
		}
	}
}

function onScroll(): void {
	for (const moved of MOVED) {
		reposition(moved);
	}
}

function reposition(movable: OuiMovable): void {
	const state = getDraggableStates(movable.element)?.movable as OuiDraggableState & OuiMovableState;

	if (state == null || !state.moved || state.container == null) {
		return;
	}

	const container = state.container.getBoundingClientRect();

	const x = container.left + (state.offset?.x ?? 0);
	const y = container.top + (state.offset?.y ?? 0);

	setStyle(state.element, 'inset', `${y}px auto auto ${x}px`);
}

function setOffset(state: OuiDraggableState & OuiMovableState, container: DOMRect): void {
	state.offset = {};

	const element = state.element.getBoundingClientRect();

	state.offset.y = element.top - container.top;
	state.offset.x = element.left - container.left;
}

// #endregion

// #region Variables

export const ATTRIBUTE_MOVABLE = 'oui-movable';

const ATTRIBUTE_CONTAINER = `${ATTRIBUTE_MOVABLE}-container`;

const ATTRIBUTE_DIRECTION = `${ATTRIBUTE_MOVABLE}-direction`;

export const ATTRIBUTE_MOVABLE_HANDLE = `${ATTRIBUTE_MOVABLE}-handle`;

const ATTRIBUTE_MOVING = `${ATTRIBUTE_MOVABLE}-moving`;

const CONTAINERS = new Map<HTMLElement, Set<OuiMovable>>();

const EVENT_END = 'move:end';

const MESSAGE = 'The element must be an instance of HTMLElement or SVGElement';

const MOVED = new Set<OuiMovable>();

const SELECTOR_HANDLE = `[${ATTRIBUTE_MOVABLE_HANDLE}]`;

const bound: OuiDraggableBound = {
	constructor: OuiMovable,
	property: 'movable',
};

const resizer = new ResizeObserver(onResize);

const addMovable = addDraggable.bind(bound);

const removeMovable = removeDraggable.bind(bound);

// #endregion

// #region Initialization

on(document, 'scroll', onScroll);

attributable(ATTRIBUTE_MOVABLE, addMovable, removeMovable);

// #endregion
