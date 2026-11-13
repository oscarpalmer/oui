import {clamp} from '@oscarpalmer/atoms/number';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {setStyle, setStyles} from '@oscarpalmer/toretto/style';
import {supportsTouch} from '@oscarpalmer/toretto/touch';
import {ignoreEvent} from '../internal/misc';
import {
	MOVABLE_ATTRIBUTE_MOVING,
	MOVABLE_CONTAINERS,
	MOVABLE_EVENT_END,
	MOVABLE_MOVED,
	MOVABLE_SELECTOR,
	MOVABLE_SELECTOR_HANDLE,
	MOVABLE_SYMBOL,
	movables,
	movableStyleToggler,
	OuiMovableEvent,
	type OuiMovableEventDetail,
	type OuiMovableEventState,
	type OuiMovableState,
} from './movable.model';

// #region Functions

function cancelMove(): void {
	const {movable, state} = eventState;

	if (movable == null || state == null) {
		return;
	}

	state.options.onCancel?.(movable);

	dispatch(
		state.element,
		new OuiMovableEvent(`oui-movable:cancel`, {
			detail: {
				element: state.element,
				position: {
					from: {...(eventState.original ?? {x: 0, y: 0})},
					to: {...(eventState.original ?? {x: 0, y: 0})},
				},
			},
		}),
	);

	reset();
}

function getNextPosition(state: OuiMovableState, position: EventPosition): EventPosition {
	let x = eventState.original?.x ?? 0;
	let y = eventState.original?.y ?? 0;

	if (state.direction.horizontal) {
		x = position.x - (eventState.offset?.x ?? 0);

		if (eventState.container != null && eventState.element != null) {
			x = clamp(
				x,
				eventState.container.left,
				eventState.container.right - eventState.element.rectangle.width,
			);
		}
	}

	if (state.direction.vertical) {
		y = position.y - (eventState.offset?.y ?? 0);

		if (eventState.container != null && eventState.element != null) {
			y = clamp(
				y,
				eventState.container.top,
				eventState.container.bottom - eventState.element.rectangle.height,
			);
		}
	}

	return {x, y};
}

function getOffsetPosition(position: EventPosition): EventPosition {
	const {element} = eventState;

	return {
		x: position.x - (element?.rectangle.left ?? 0),
		y: position.y - (element?.rectangle.top ?? 0),
	};
}

function getOriginalPosition(): EventPosition {
	const {element} = eventState;

	return {
		x: element?.rectangle.left ?? 0,
		y: element?.rectangle.top ?? 0,
	};
}

export function initializeMovableEvents(): void {
	on(document, 'keydown', onKeydown);
	on(document, 'mousedown', onPointerdown);
	on(document, 'pointermove', onPointermove);
	on(document, 'pointerup', onPointerup);
	on(document, 'scroll', onScroll);
	on(document, 'touchcancel', onPointerup);
	on(document, 'touchstart', onPointerdown, {passive: false});
}

function onKeydown(event: KeyboardEvent): void {
	if (eventState.state != null && event.key === 'Escape') {
		cancelMove();
	}
}

function onPointerdown(event: MouseEvent | TouchEvent): void {
	if (ignoreEvent(event, supportsTouch.value)) {
		return;
	}

	const element = findAncestor(event, MOVABLE_SELECTOR);
	const movable = element && movables.get(element as never);
	const state = movable?.[MOVABLE_SYMBOL];

	if (element == null || movable == null || state == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	let moved: Element | null = element;
	let handle: Element | null = moved;

	state.hasHandles ??= moved.querySelector(MOVABLE_SELECTOR_HANDLE) != null;

	if (state.hasHandles) {
		handle = findAncestor(event, MOVABLE_SELECTOR_HANDLE);
	}

	if (handle == null) {
		return;
	}

	const dragged = state.element;
	const rectangle = dragged.getBoundingClientRect();

	const position = getEventPosition(event) ?? {x: 0, y: 0};

	eventState.element = {
		rectangle,
		node: dragged,
	};

	eventState.container = state.container.element?.getBoundingClientRect();
	eventState.movable = movable;
	eventState.offset = getOffsetPosition(position);
	eventState.original = getOriginalPosition();
	eventState.state = state;

	const detail: OuiMovableEventDetail = {
		element: moved,
		position: {
			from: {...eventState.original},
			to: {...eventState.original},
		},
	};

	const dispatched = new OuiMovableEvent('oui-movable:begin', {
		detail,
	});

	state.options.onBegin?.(detail.position, movable, () => dispatched.preventDefault());

	dispatch(state.element, dispatched);

	if (dispatched.defaultPrevented) {
		cancelMove();

		return;
	}

	const next = getNextPosition(state, position);

	setStyles(dragged, {
		position: 'fixed',
		inset: `${next.y}px auto auto ${next.x}px`,
		transform: 'translate3d(0, 0, 0)',
	});

	state.style.toggler.set();
	movableStyleToggler.set();
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	const {movable, state} = eventState;

	if (movable == null || state == null) {
		return;
	}

	const position = getEventPosition(event);

	if (position == null) {
		return;
	}

	const next = getNextPosition(state, position);

	if (eventState.element != null) {
		setStyle(eventState.element.node, 'inset', `${next.y}px auto auto ${next.x}px`);
	}

	const detail: OuiMovableEventDetail = {
		element: state.element,
		position: {
			from: {...(eventState.original ?? {x: 0, y: 0})},
			to: {...position},
		},
	};

	const dispatched = new OuiMovableEvent(`oui-movable:move`, {
		detail,
	});

	state.options.onMove?.(detail.position, movable, () => dispatched.preventDefault());

	dispatch(state.element, dispatched);

	if (dispatched.defaultPrevented) {
		cancelMove();
	}
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	const {movable, state} = eventState;

	if (movable == null || state == null) {
		return;
	}

	state.element.removeAttribute(MOVABLE_ATTRIBUTE_MOVING);

	if (!state.moved) {
		state.moved = true;

		if (state.container != null) {
			MOVABLE_MOVED.add(state);
		}
	}

	const container = state.container.element?.getBoundingClientRect();

	if (container != null) {
		setOffset(state, container);
	}

	const detail: OuiMovableEventDetail = {
		element: state.element,
		position: {
			from: {...(eventState.original ?? {x: 0, y: 0})},
			to: getEventPosition(event)!,
		},
	};

	const dispatched = new OuiMovableEvent(MOVABLE_EVENT_END, {detail});

	state.options.onEnd?.(detail.position, movable, () => dispatched.preventDefault());

	dispatch(state.element, dispatched);

	if (dispatched.defaultPrevented) {
		cancelMove();
	} else {
		reset();
	}
}

function onResize(entries: ResizeObserverEntry[]): void {
	const {length} = entries;

	const movables: OuiMovableState[] = [];

	for (let index = 0; index < length; index += 1) {
		const set = MOVABLE_CONTAINERS.get(entries[index].target);

		if (set != null) {
			movables.push(...set);
		}
	}

	reposition(movables);
}

function onScroll(): void {
	reposition(MOVABLE_MOVED);
}

/**
 * TODO: use getNextPosition for calculating the new positions
 */
function reposition(states: Iterable<OuiMovableState>): void {
	const updates: {element: Element; x: number; y: number}[] = [];

	// All rectangles are read before any write, as an inset write invalidates layout
	for (const state of states) {
		const {container, element, moved, offset} = state;

		if (!moved || container.element == null) {
			continue;
		}

		const {left, top} = container.element.getBoundingClientRect();

		updates.push({
			element,
			x: left + (offset?.x ?? 0),
			y: top + (offset?.y ?? 0),
		});
	}

	for (const {element, x, y} of updates) {
		setStyle(element, 'inset', `${y}px auto auto ${x}px`);
	}
}

function reset(): void {
	eventState.state?.style.toggler.remove();
	movableStyleToggler.remove();

	eventState.container = undefined;
	eventState.element = undefined;
	eventState.movable = undefined;
	eventState.offset = undefined;
	eventState.original = undefined;
	eventState.state = undefined;
}

function setOffset(state: OuiMovableState, container: DOMRect): void {
	state.offset = {};

	const element = state.element.getBoundingClientRect();

	state.offset.y = element.top - container.top;
	state.offset.x = element.left - container.left;
}

// #endregion

// #region Variables

const eventState: OuiMovableEventState = {};

export const movableResizeObserver: ResizeObserver = new ResizeObserver(onResize);

// #endregion
