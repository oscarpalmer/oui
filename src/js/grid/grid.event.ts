import {max, min, round} from '@oscarpalmer/atoms/math';
import {getString} from '@oscarpalmer/atoms/string';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {supportsTouch} from '@oscarpalmer/toretto/touch';
import {ignoreEvent} from '../internal/misc';
import {getResizable} from '../resizable/resizable.embedded';
import type {OuiResizableEventDetail} from '../resizable/resizable.model';
import {
	getGridElements,
	getGridPlaceholder,
	updateGridPositions,
	updateGridResizables,
} from './grid.dom';
import {endGridSort} from './grid.misc';
import {
	GRID_ATTRIBUTE_COLUMNS,
	GRID_ATTRIBUTE_GAP,
	GRID_ATTRIBUTE_ITEM_ACTIVE,
	GRID_ATTRIBUTE_SORTING,
	GRID_ATTRIBUTE_SPAN,
	GRID_EVENT_RESIZE_BEGIN,
	GRID_EVENT_RESIZE_CANCEL,
	GRID_EVENT_RESIZE_END,
	GRID_EVENT_SORT_BEGIN,
	GRID_EVENT_SORT_CHANGE,
	GRID_SELECTOR_HANDLE,
	GRID_SELECTOR_ITEM,
	GRID_SYMBOL,
	GRID_TAGNAME,
	gridStyling,
	OuiGridResizeEvent,
	OuiGridSortEvent,
	type GridSort,
	type GridState,
} from './grid.model';

// #region Functions

export function onBeginResizeGridItem(
	state: GridState,
	element: Element,
	size: OuiResizableEventDetail,
): void {
	const event = new OuiGridResizeEvent(GRID_EVENT_RESIZE_BEGIN, {
		detail: {
			...size,
			item: element as HTMLElement,
		},
	});

	if (dispatch(state.host, event).defaultPrevented) {
		return;
	}

	const {columns} = state;

	if (columns == null) {
		return;
	}

	const resizable = getResizable(element as HTMLElement);

	if (resizable == null) {
		return;
	}

	state.active = element as HTMLElement;

	const step = columns.width + state.gap.value;

	// Step, min and max follow the current column width, so refresh them per drag
	resizable.configure({
		maximumWidth: columns.count * step - state.gap.value,
		minimumWidth: columns.width,
		stepWidth: step,
	});
}

export function onGridAttributeChanged(state: GridState, name: string): void {
	if (!state.host.isConnected) {
		return;
	}

	if (name === GRID_ATTRIBUTE_COLUMNS || name === GRID_ATTRIBUTE_GAP) {
		updateGridPositions(state);
	}
}

export function onGridItemResized(
	type: string,
	state: GridState,
	element: Element,
	size: OuiResizableEventDetail,
): void {
	const event = new OuiGridResizeEvent(type, {
		detail: {
			...size,
			item: element as HTMLElement,
		},
	});

	if (dispatch(state.host, event).defaultPrevented) {
		return;
	}

	const {columns} = state;

	if (columns != null) {
		const span = max([
			1,
			min([
				round((size.width + state.gap.value) / (columns.width + state.gap.value)),
				columns.count,
			]),
		]);

		setAttribute(element, GRID_ATTRIBUTE_SPAN, getString(span));
	}

	updateGridPositions(state);

	if (type === GRID_EVENT_RESIZE_CANCEL || type === GRID_EVENT_RESIZE_END) {
		state.active = undefined;
	}
}

export function onGridMutation(state: GridState): void {
	state.elements = getGridElements(state);

	updateGridPositions(state);
	updateGridResizables(state);
}

export function onGridResized(entries: ResizeObserverEntry[]): void {
	const {length} = entries;

	for (let index = 0; index < length; index += 1) {
		const entry = entries[index];

		if (GRID_SYMBOL in entry.target) {
			updateGridPositions(entry.target[GRID_SYMBOL] as GridState);
		}
	}
}

function onKeydown(event: KeyboardEvent): void {
	if (event.key === 'Escape' && sort != null) {
		sort = endGridSort(sort);
	}
}

function onPointerdown(event: MouseEvent | TouchEvent): void {
	if (ignoreEvent(event, supportsTouch.value)) {
		return;
	}

	const item = findAncestor(event, GRID_SELECTOR_ITEM) as HTMLElement;

	if (item == null) {
		return;
	}

	const handle = item.querySelector(GRID_SELECTOR_HANDLE);

	if (handle != null && !(event.target === handle || handle.contains(event.target as Node))) {
		return;
	}

	const grid = findAncestor(item, GRID_TAGNAME);

	if (grid == null) {
		return;
	}

	const state = grid[GRID_SYMBOL];

	if (!state.sortable) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	const dispatched = new OuiGridSortEvent(GRID_EVENT_SORT_BEGIN, {
		detail: {
			item,
		},
	});

	if (dispatch(state.host, dispatched).defaultPrevented) {
		return;
	}

	state.active = item;

	const placeholder = getGridPlaceholder(item);
	const position = getEventPosition(event) as EventPosition;
	const rectangle = item.getBoundingClientRect();

	item.replaceWith(placeholder);
	document.body.append(item);

	sort = {
		item,
		state,
		index: state.elements.indexOf(item),
		offset: {
			x: position.x - rectangle.left,
			y: position.y - rectangle.top,
		},
		style: {
			pointerEvents: item.style.pointerEvents,
			transform: item.style.transform,
			zIndex: item.style.zIndex,
		},
	};

	setAttribute(sort.state.host, GRID_ATTRIBUTE_SORTING, '');
	setAttribute(sort.item, GRID_ATTRIBUTE_ITEM_ACTIVE, '');

	gridStyling.set();

	onPointermove(event);
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	if (sort == null) {
		return;
	}

	const {x, y} = getEventPosition(event) as EventPosition;

	sort.item.style.pointerEvents = 'none';
	sort.item.style.position = 'fixed';
	sort.item.style.transform = `translate3d(${x - sort.offset.x}px, ${y - sort.offset.y}px, 0)`;
	sort.item.style.zIndex = '1000';

	const dispatched = new OuiGridSortEvent(GRID_EVENT_SORT_CHANGE, {
		detail: {
			item: sort.item,
		},
	});

	if (dispatch(sort.state.host, dispatched).defaultPrevented) {
		sort = endGridSort(sort);
	}
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	if (sort == null) {
		return;
	}

	const target = findAncestor(event, GRID_SELECTOR_ITEM) as HTMLElement;

	if (target == null) {
		sort = endGridSort(sort);

		return;
	}

	const grid = findAncestor(target, GRID_TAGNAME);

	if (grid?.[GRID_SYMBOL] !== sort.state) {
		sort = endGridSort(sort);

		return;
	}

	sort = endGridSort(sort, target);
}

// #endregion

// #region Variables

let sort: GridSort | undefined;

// #endregion

// #region Initialization

on(document, 'keydown', onKeydown);
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup);
on(document, 'touchstart', onPointerdown, {passive: false});

// #endregion
