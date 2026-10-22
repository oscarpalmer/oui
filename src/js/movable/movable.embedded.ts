import {noop} from '@oscarpalmer/atoms/function';
import type {PlainObject} from '@oscarpalmer/atoms/models';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {getStyles, setStyle, setStyles} from '@oscarpalmer/toretto/style';
import {attributable} from '../internal/attributable';
import {
	DRAGGABLE_SYMBOL,
	draggableGlobals,
	type CreateOuiDraggableOptions,
	type OuiDraggableBound,
	type OuiDraggableItem,
	type OuiDraggableState,
	type OuiDragMovePosition,
} from '../internal/draggable/draggable.model';
import {
	addDraggable,
	destroyDraggable,
	getDraggableElement,
	getDraggableStates,
	initializeDraggable,
	removeDraggable,
} from '../internal/draggable/index';
import {
	MOVABLE_ATTRIBUTE,
	MOVABLE_ATTRIBUTE_CONTAINER,
	MOVABLE_ATTRIBUTE_DIRECTION,
	MOVABLE_ATTRIBUTE_MOVING,
	MOVABLE_CONTAINERS,
	MOVABLE_EVENT_END,
	MOVABLE_MESSAGE,
	MOVABLE_MOVED,
	MOVABLE_SELECTOR_HANDLE,
	type OuiMovable,
	type OuiMovableState,
} from './movable.model';

// #region Instances

function OuiMovable(this: OuiMovable, element: Element, options?: CreateOuiDraggableOptions): void {
	const style = getStyles(element, ['inset', 'position']);

	this[DRAGGABLE_SYMBOL] = initializeDraggable(
		this,
		'movable',
		'move',
		MOVABLE_ATTRIBUTE,
		element,
		{
			container: {
				attribute: MOVABLE_ATTRIBUTE_CONTAINER,
				map: MOVABLE_CONTAINERS,
				onDestroy: destroyContainer,
				onInitialize: initializeContainer,
			},
			direction: {
				attribute: MOVABLE_ATTRIBUTE_DIRECTION,
				onAfter: afterDirection,
			},
			drag: {
				onCancel,
				onEnd,
				onMove,
				onBegin: noop,
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
			hasHandles: element.querySelector(MOVABLE_SELECTOR_HANDLE) != null,
			moved: false,
		},
	);
}

OuiMovable.prototype.destroy = destroyMovable;

Object.defineProperties(OuiMovable.prototype, {
	element: {
		enumerable: true,
		get: getDraggableElement,
	},
});

// #endregion

// #region Functions

function afterDirection(item: OuiDraggableItem<OuiMovableState>): void {
	const container = item.state.container?.getBoundingClientRect();

	if (container != null) {
		setOffset(item.state, container);
	}
}

/**
 * Creates _(or retrieves)_ a _OuiMovable_ instance for an element
 *
 * @param element Element to make movable
 * @returns _OuiMovable_ instance
 */
export function createMovable(element: Element, options?: CreateOuiDraggableOptions): OuiMovable {
	if (!isHTMLOrSVGElement(element)) {
		throw new TypeError(MOVABLE_MESSAGE);
	}

	return addMovable(element, options) as OuiMovable;
}

function destroyContainer(
	_: OuiDraggableItem<OuiMovableState>,
	container: Element,
	empty: boolean,
): void {
	if (empty) {
		resizer.unobserve(container);
	}
}

function destroyMovable(this: OuiMovable): void {
	const {element, style} = this[DRAGGABLE_SYMBOL];

	MOVABLE_MOVED.delete(this);

	setStyles(element, style);

	destroyDraggable(this);
}

function getOffsetPosition(
	_: OuiDraggableItem<OuiMovableState>,
	__: Element,
	position: EventPosition,
): EventPosition {
	const {element} = draggableGlobals;

	return {
		x: position.x - (element?.rectangle.left ?? 0),
		y: position.y - (element?.rectangle.top ?? 0),
	};
}

function getOriginalPosition(): EventPosition {
	const {element} = draggableGlobals;

	return {
		x: element?.rectangle.left ?? 0,
		y: element?.rectangle.top ?? 0,
	};
}

function initializeContainer(item: OuiDraggableItem<OuiMovableState>): void {
	resizer.observe(item.state.container!);
}

function onCancel(item: OuiDraggableItem<OuiMovableState>): void {
	const {element, moved, style} = item.state;

	const {x, y} = draggableGlobals.original ?? {x: 0, y: 0};

	if (moved) {
		setStyle(element, 'inset', `${y}px auto auto ${x}px`);
	} else {
		setStyles(element, style);
	}

	element.removeAttribute(MOVABLE_ATTRIBUTE_MOVING);
}

function onEnd(
	event: MouseEvent | TouchEvent,
	item: OuiDraggableItem<OuiMovableState>,
	reset: () => void,
): void {
	const movable = item.instance;
	const state = item.state;

	state.element.removeAttribute(MOVABLE_ATTRIBUTE_MOVING);

	if (!state.moved) {
		state.moved = true;

		if (state.container != null) {
			MOVABLE_MOVED.add(movable);
		}
	}

	const container = state.container?.getBoundingClientRect();

	if (container != null) {
		setOffset(state, container);
	}

	if (
		dispatch(state.element, MOVABLE_EVENT_END, {
			detail: {
				from: {...draggableGlobals.original},
				to: getEventPosition(event),
			},
		}).defaultPrevented
	) {
		onCancel(item);
	}

	reset();
}

function onMove(
	_: MouseEvent | TouchEvent,
	__: OuiDraggableItem<OuiMovableState>,
	position: OuiDragMovePosition,
): PlainObject | undefined {
	const {element, original} = draggableGlobals;

	setAttribute(element?.node as never, MOVABLE_ATTRIBUTE_MOVING, '');

	return {
		from: {...original},
		to: {...position.calculated},
	};
}

function onResize(entries: ResizeObserverEntry[]): void {
	const {length} = entries;

	for (let index = 0; index < length; index += 1) {
		const entry = entries[index];
		const set = MOVABLE_CONTAINERS.get(entry.target);

		if (set == null) {
			continue;
		}

		for (const movable of set) {
			reposition(movable);
		}
	}
}

function onScroll(): void {
	for (const moved of MOVABLE_MOVED) {
		reposition(moved);
	}
}

function reposition(movable: OuiMovable): void {
	const state = getDraggableStates(movable.element)
		?.movable as unknown as OuiDraggableState<OuiMovableState>;

	if (state == null || !state.moved || state.container == null) {
		return;
	}

	const container = state.container.getBoundingClientRect();

	const x = container.left + (state.offset?.x ?? 0);
	const y = container.top + (state.offset?.y ?? 0);

	setStyle(state.element, 'inset', `${y}px auto auto ${x}px`);
}

function setOffset(state: OuiDraggableState<OuiMovableState>, container: DOMRect): void {
	state.offset = {};

	const element = state.element.getBoundingClientRect();

	state.offset.y = element.top - container.top;
	state.offset.x = element.left - container.left;
}

// #endregion

// #region Variables

const bound: OuiDraggableBound = {
	// @ts-expect-error All good, no worries :-)
	constructor: OuiMovable,
	property: 'movable',
};

const resizer = new ResizeObserver(onResize);

const addMovable = addDraggable.bind(bound);

const removeMovable = removeDraggable.bind(bound);

// #endregion

// #region Initialization

on(document, 'scroll', onScroll);

attributable(MOVABLE_ATTRIBUTE, addMovable, removeMovable);

// #endregion
