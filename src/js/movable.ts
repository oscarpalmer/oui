import type {EventPosition, PlainObject} from '@oscarpalmer/atoms/models';
import {clamp} from '@oscarpalmer/atoms/number';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {attributable} from './internal/attributable';
import {
	addDraggable,
	Draggable,
	removeDraggable,
	type DraggableBound,
	type DraggableState,
} from './internal/draggable';

// #region Types

export class Movable extends Draggable {
	inset: string;

	moved = false;

	offset: Partial<EventPosition> | undefined;

	position: string;

	get active(): HTMLElement | undefined {
		return this.element;
	}

	get dragged(): HTMLElement {
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
			onBegin,
			onCancel,
			onEnd,
			onMove,
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

function afterDirection(draggable: Draggable): void {
	const container = draggable.container?.getBoundingClientRect();

	if (container != null) {
		setOffset(draggable as Movable, container);
	}
}

function destroyContainer(_: Draggable, container: HTMLElement, empty: boolean): void {
	if (empty) {
		resizer.unobserve(container);
	}
}

function initializeContainer(draggable: Draggable): void {
	resizer.observe(draggable.container!);
}

function onBegin(
	_: MouseEvent | TouchEvent,
	state: DraggableState,
	__: Draggable,
	element: HTMLElement,
): void {
	element.style.position = 'fixed';
	element.style.inset = `${state.original.y}px auto auto ${state.original.x}px`;
}

function onCancel(state: DraggableState, draggable: Draggable): void {
	const movable = draggable as Movable;

	const {element, inset, moved, position} = movable;
	const {x, y} = state.original;

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
	draggable: Draggable,
	reset: () => void,
): void {
	const movable = draggable as Movable;

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
	draggable: Draggable,
	position: EventPosition,
): PlainObject | undefined {
	const movable = draggable as Movable;

	let x = state.original.x;
	let y = state.original.y;

	if (movable.horizontal) {
		x = position.x - state.offset.x;

		if (state.container != null) {
			x = clamp(x, state.container.left, state.container.right - movable.element.offsetWidth);
		}
	}

	if (movable.vertical) {
		y = position.y - state.offset.y;

		if (state.container != null) {
			y = clamp(y, state.container.top, state.container.bottom - movable.element.offsetHeight);
		}
	}

	movable.element.style.inset = `${y}px auto auto ${x}px`;

	return {
		from: {...state.original},
		to: {...position},
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

function reposition(movable: Movable): void {
	if (!movable.moved || movable.container == null) {
		return;
	}

	const container = movable.container.getBoundingClientRect();

	let {x, y} = movable.element.getBoundingClientRect();

	x = container.left + (movable.offset?.x ?? 0);
	y = container.top + (movable.offset?.y ?? 0);

	movable.element.style.inset = `${y}px auto auto ${x}px`;
}

function setOffset(movable: Movable, container: DOMRect): void {
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

const CONTAINERS = new Map<HTMLElement, Set<Movable>>();

const EVENT_END = 'move:end';

const MOVED = new Set<Movable>();

const SELECTOR_HANDLE = `[${ATTRIBUTE}-handle]`;

const bound: DraggableBound = {
	constructor: Movable,
	property: 'movable',
};

const resizer = new ResizeObserver(onResize);

// #endregion

// #region Initialization

attributable(ATTRIBUTE, addDraggable.bind(bound), removeDraggable.bind(bound));

on(document, 'scroll', onScroll);

// #endregion
