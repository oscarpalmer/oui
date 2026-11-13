import {clamp} from '@oscarpalmer/atoms/number';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {setStyle, setStyles} from '@oscarpalmer/toretto/style';
import {supportsTouch} from '@oscarpalmer/toretto/touch';
import {ignoreEvent} from '../internal/misc';
import {
	OuiSortableEvent,
	SORTABLE_EVENT_END,
	SORTABLE_SELECTOR,
	SORTABLE_SELECTOR_HANDLE,
	SORTABLE_SYMBOL,
	sortables,
	sortableStyleToggler,
	type OuiSortableEventDetail,
	type OuiSortableEventState,
	type OuiSortableState,
} from './sortable.model';

// #region Functions

function cancelSort(): void {
	const {sortable, state} = eventState;

	if (sortable == null || state == null) {
		return;
	}

	state.options.onCancel?.(sortable);

	dispatch(
		state.element,
		new OuiSortableEvent(`oui-sortable:cancel`, {
			detail: {
				from: state.element,
			},
		}),
	);

	reset();
}

function getNextPosition(state: OuiSortableState, position: EventPosition): EventPosition {
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

export function initializeSortableEvents(): void {
	on(document, 'keydown', onKeydown);
	on(document, 'mousedown', onPointerdown);
	on(document, 'pointermove', onPointermove);
	on(document, 'pointerup', onPointerup);
	on(document, 'touchcancel', onPointerup);
	on(document, 'touchstart', onPointerdown, {passive: false});
}

function onKeydown(event: KeyboardEvent): void {
	if (eventState.state != null && event.key === 'Escape') {
		cancelSort();
	}
}

function onPointerdown(event: MouseEvent | TouchEvent): void {
	if (ignoreEvent(event, supportsTouch.value)) {
		return;
	}

	const element = findAncestor(event, SORTABLE_SELECTOR);
	const sortable = element && sortables.get(element as never);
	const state = sortable?.[SORTABLE_SYMBOL];

	if (element == null || sortable == null || state == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	let moved: Element | null = element;
	let handle: Element | null = moved;

	state.hasHandles ??= moved.querySelector(SORTABLE_SELECTOR_HANDLE) != null;

	if (state.hasHandles) {
		handle = findAncestor(event, SORTABLE_SELECTOR_HANDLE);
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
	eventState.offset = getOffsetPosition(position);
	eventState.original = getOriginalPosition();
	eventState.sortable = sortable;
	eventState.state = state;

	const detail: OuiSortableEventDetail = {
		from: moved,
	};

	const dispatched = new OuiSortableEvent('oui-sortable:begin', {
		detail,
	});

	state.options.onBegin?.(detail, sortable, () => dispatched.preventDefault());

	dispatch(state.element, dispatched);

	if (dispatched.defaultPrevented) {
		cancelSort();

		return;
	}

	const next = getNextPosition(state, position);

	setStyles(dragged, {
		position: 'fixed',
		inset: `${next.y}px auto auto ${next.x}px`,
		transform: 'translate3d(0, 0, 0)',
	});

	sortableStyleToggler.set();
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	const {sortable, state} = eventState;

	if (sortable == null || state == null) {
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

	const detail: OuiSortableEventDetail = {
		from: state.element,
	};

	const dispatched = new OuiSortableEvent(`oui-sortable:move`, {
		detail,
	});

	state.options.onMove?.(detail, sortable, () => dispatched.preventDefault());

	dispatch(state.element, dispatched);

	if (dispatched.defaultPrevented) {
		cancelSort();
	}
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	const {sortable, state} = eventState;

	if (sortable == null || state == null) {
		return;
	}

	const container = state.container.element?.getBoundingClientRect();

	if (container != null) {
		setOffset(state, container);
	}

	const detail: OuiSortableEventDetail = {
		from: state.element,
	};

	const dispatched = new OuiSortableEvent(SORTABLE_EVENT_END, {detail});

	state.options.onEnd?.(detail, sortable, () => dispatched.preventDefault());

	dispatch(state.element, dispatched);

	if (dispatched.defaultPrevented) {
		cancelSort();
	} else {
		reset();
	}
}

function reset(): void {
	sortableStyleToggler.remove();

	eventState.container = undefined;
	eventState.element = undefined;
	eventState.offset = undefined;
	eventState.original = undefined;
	eventState.sortable = undefined;
	eventState.state = undefined;
}

function setOffset(state: OuiSortableState, container: DOMRect): void {
	state.offset = {};

	const element = state.element.getBoundingClientRect();

	state.offset.y = element.top - container.top;
	state.offset.x = element.left - container.left;
}

// #endregion

// #region Variables

const eventState: OuiSortableEventState = {};

// #endregion
