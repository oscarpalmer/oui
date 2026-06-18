import type {EventPosition, PlainObject} from '@oscarpalmer/atoms/models';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {attributable} from './internal/attributable';
import {
	addDraggable,
	OuiDraggable,
	removeDraggable,
	type DraggableBound,
	type DraggableState,
	type DragMovePosition,
} from './internal/draggable';

// #region Types

export class OuiMovable extends OuiDraggable {
	inset: string;

	moved = false;

	offset: Partial<EventPosition> | undefined;

	position: string;

	get dragged(): HTMLElement {
		return this.element;
	}

	get origin(): HTMLElement | undefined {
		return this.element;
	}

	constructor(element: HTMLElement) {
		super('move', element, {
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
			position: {
				getOffset: getOffsetPosition,
				getOriginal: getOriginalPosition,
			},
		});

		this.hasHandles = element.querySelector(SELECTOR_HANDLE) != null;

		this.inset = element.style.inset;
		this.position = element.style.position;
	}

	override destroy(): void {
		super.destroy();

		MOVED.delete(this);

		this.element.style.inset = this.inset;
		this.element.style.position = this.position;
	}
}

// #endregion

// #region Functions

function afterDirection(draggable: OuiDraggable): void {
	const container = draggable.container?.getBoundingClientRect();

	if (container != null) {
		setOffset(draggable as OuiMovable, container);
	}
}

function destroyContainer(_: OuiDraggable, container: HTMLElement, empty: boolean): void {
	if (empty) {
		resizer.unobserve(container);
	}
}

function getOffsetPosition(
	state: DraggableState,
	_: OuiDraggable,
	__: HTMLElement,
	position: EventPosition,
): EventPosition {
	return {
		x: position.x - (state.element?.rectangle.left ?? 0),
		y: position.y - (state.element?.rectangle.top ?? 0),
	};
}

function getOriginalPosition(state: DraggableState): EventPosition {
	return {
		x: state.element?.rectangle.left ?? 0,
		y: state.element?.rectangle.top ?? 0,
	};
}

function initializeContainer(draggable: OuiDraggable): void {
	resizer.observe(draggable.container!);
}

function onBegin(): void {}

function onCancel(state: DraggableState, draggable: OuiDraggable): void {
	const movable = draggable as OuiMovable;

	const {element, inset, moved, position} = movable;
	const {x, y} = state.original ?? {x: 0, y: 0};

	if (moved) {
		element.style.inset = `${y}px auto auto ${x}px`;
	} else {
		element.style.position = position;
		element.style.inset = inset;
	}
}

function onEnd(
	event: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: OuiDraggable,
	reset: () => void,
): void {
	const movable = draggable as OuiMovable;

	if (!movable.moved) {
		movable.moved = true;

		if (movable.container != null) {
			MOVED.add(movable);
		}
	}

	const container = movable.container?.getBoundingClientRect();

	if (container != null) {
		setOffset(movable, container);
	}

	const end = new CustomEvent(EVENT_END, {
		detail: {
			from: {...state.original},
			to: getPosition(event),
		},
		cancelable: true,
	});

	movable.element.dispatchEvent(end);

	setTimeout(() => {
		if (end.defaultPrevented) {
			onCancel(state, draggable);
		}

		reset();
	});
}

function onMove(
	_: MouseEvent | TouchEvent,
	state: DraggableState,
	__: OuiDraggable,
	position: DragMovePosition,
): PlainObject | undefined {
	return {
		from: {...state.original},
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
	if (!movable.moved || movable.container == null) {
		return;
	}

	const container = movable.container.getBoundingClientRect();

	const x = container.left + (movable.offset?.x ?? 0);
	const y = container.top + (movable.offset?.y ?? 0);

	movable.element.style.inset = `${y}px auto auto ${x}px`;
}

function setOffset(movable: OuiMovable, container: DOMRect): void {
	movable.offset = {};

	const element = movable.element.getBoundingClientRect();

	movable.offset.y = element.top - container.top;
	movable.offset.x = element.left - container.left;
}

// #endregion

// #region Variables

const ATTRIBUTE = 'oui-movable';

const ATTRIBUTE_CONTAINER = `${ATTRIBUTE}-container`;

const ATTRIBUTE_DIRECTION = `${ATTRIBUTE}-direction`;

const CONTAINERS = new Map<HTMLElement, Set<OuiMovable>>();

const EVENT_END = 'move:end';

const MOVED = new Set<OuiMovable>();

const SELECTOR_HANDLE = `[${ATTRIBUTE}-handle]`;

const bound: DraggableBound = {
	constructor: OuiMovable,
	property: 'movable',
};

const resizer = new ResizeObserver(onResize);

// #endregion

// #region Initialization

attributable(ATTRIBUTE, addDraggable.bind(bound), removeDraggable.bind(bound));

on(document, 'scroll', onScroll);

// #endregion
