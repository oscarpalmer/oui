import {select} from '@oscarpalmer/atoms/array/select';
import {floor, max, min} from '@oscarpalmer/atoms/math';
import {getNumber} from '@oscarpalmer/atoms/number';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {dispatch} from '@oscarpalmer/toretto/event';
import {getStyle} from '@oscarpalmer/toretto/style';
import {getPixelSize} from '../internal/misc';
import {createResizable} from '../resizable/resizable.embedded';
import {
	RESIZABLE_ATTRIBUTE_HANDLE,
	RESIZABLE_SELECTOR_HANDLE_SCOPED,
} from '../resizable/resizable.model';
import {
	GRID_ATTRIBUTE_COLUMN_SPAN,
	GRID_ATTRIBUTE_COLUMNS,
	GRID_ATTRIBUTE_GAP,
	GRID_ATTRIBUTE_ITEM,
	GRID_ATTRIBUTE_MIN_HEIGHT,
	GRID_ATTRIBUTE_MIN_WIDTH,
	GRID_ATTRIBUTE_PLACEHOLDER,
	GRID_ATTRIBUTE_RESIZABLE,
	GRID_ATTRIBUTE_ROW_SPAN,
	GRID_ATTRIBUTE_SORTABLE,
	GRID_SELECTOR_ITEM_SCOPED,
	OuiGridResizeHandlerEvent,
	type GridColumns,
	type GridGap,
	type GridItem,
	type GridRows,
	type GridState,
} from './grid.model';

// #region Functions

function collides(first: GridItem, second: GridItem): boolean {
	return (
		first.x < second.x + second.width &&
		second.x < first.x + first.width &&
		first.y < second.y + second.height &&
		second.y < first.y + first.height
	);
}

function createResizeHandle(state: GridState, item: HTMLElement): HTMLDivElement {
	const handle = createElement('div', {
		aria: {
			label: 'Resize grid item',
		},
		attribute: {
			[RESIZABLE_ATTRIBUTE_HANDLE]: '',
		},
		property: {
			textContent: 'R',
		},
	});

	dispatch(
		state.host,
		new OuiGridResizeHandlerEvent({
			handle,
			item,
		}),
	);

	return handle;
}

function findFreeSpot(
	size: Pick<GridItem, 'height' | 'width'>,
	others: GridItem[],
	containerWidth: number,
): GridItem {
	const candidate: GridItem = {
		height: size.height,
		width: size.width,
		x: 0,
		y: 0,
	};

	// Terminates once y clears every placed item (the caller clamps the width)
	while (true) {
		const blocker = others.find(other => collides(candidate, other));

		if (blocker == null) {
			return candidate;
		}

		// Skip past the blocker
		candidate.x = blocker.x + blocker.width;

		if (candidate.x + candidate.width > containerWidth) {
			candidate.x = 0;

			// Next y where something ends
			candidate.y = min(
				select.reverse(
					others,
					other => other.y + other.height,
					bottom => bottom > candidate.y,
				),
			);
		}
	}
}

function getColumns(state: GridState, gap: number): GridColumns | undefined {
	const columnsAttribute = getAttribute(state.host, GRID_ATTRIBUTE_COLUMNS) ?? '';
	const minWidthAttribute = getAttribute(state.host, GRID_ATTRIBUTE_MIN_WIDTH) ?? '';

	const columns = Number.parseInt(columnsAttribute ?? '', 10);
	const minWidth = Number.parseFloat(minWidthAttribute ?? '');

	const hasMinWidth = minWidth > 0;
	const hasColumns = columns > 0;

	if (!hasMinWidth && !hasColumns) {
		return undefined;
	}

	const {clientWidth} = state.host;

	const count = max([
		1,
		min([
			hasColumns ? columns : Number.POSITIVE_INFINITY,
			hasMinWidth ? floor((clientWidth + gap) / (minWidth + gap) + 1e-9) : Number.POSITIVE_INFINITY,
		]),
	]);

	return {
		count,
		width: (clientWidth - gap * (count - 1)) / count,
	};
}

function getGap(state: GridState): GridGap {
	let attribute: number | undefined;
	let style: string | undefined;
	let value: number | undefined;

	const input = getAttribute(state.host, GRID_ATTRIBUTE_GAP);

	if (input != null) {
		attribute = getNumber(input);

		if (Number.isNaN(attribute) || attribute < 0) {
			attribute = undefined;
		} else {
			value = attribute;
		}
	}

	if (value == null) {
		style = getStyle(state.host, 'gap', true);

		if (style != null) {
			value = getPixelSize(style);
		}
	}

	return {
		attribute,
		style,
		value: value == null ? 0 : max([value, 0]),
	};
}

export function getGridItems(state: GridState): HTMLElement[] {
	const previous = new Set(state.items.splice(0));

	const next = [...state.host.querySelectorAll(GRID_SELECTOR_ITEM_SCOPED)] as HTMLElement[];
	const {length} = next;

	for (let index = 0; index < length; index += 1) {
		const item = next[index];

		if (previous.has(item)) {
			previous.delete(item);
		}

		setAttribute(item, GRID_ATTRIBUTE_ITEM, '');
	}

	if (state.active != null) {
		previous.delete(state.active);
	}

	for (const item of previous) {
		resetItem(state, item);
	}

	return next;
}

export function getGridPlaceholder(original?: HTMLElement): HTMLElement {
	placeholder ??= createElement('div', {
		attribute: {
			[GRID_ATTRIBUTE_PLACEHOLDER]: '',
		},
		style: {
			position: 'absolute',
			inset: '0',
		},
	});

	if (original == null) {
		return placeholder;
	}

	setAttribute(
		placeholder,
		GRID_ATTRIBUTE_COLUMN_SPAN,
		getAttribute(original, GRID_ATTRIBUTE_COLUMN_SPAN),
	);

	setAttribute(
		placeholder,
		GRID_ATTRIBUTE_ROW_SPAN,
		getAttribute(original, GRID_ATTRIBUTE_ROW_SPAN),
	);

	placeholder.style.width = `${original.offsetWidth}px`;
	placeholder.style.height = `${original.offsetHeight}px`;
	placeholder.style.transform = original.style.transform;

	return placeholder;
}

function getRows(state: GridState): GridRows | undefined {
	const height = getNumber(getAttribute(state.host, GRID_ATTRIBUTE_MIN_HEIGHT));

	return Number.isNaN(height)
		? undefined
		: {
				height: max([height, 0]),
			};
}

// Each axis is in units (columns, rows) or pixels, independently.
// Pixel axes carry one trailing gap, and the container gets one extra
function getSizes(
	items: HTMLElement[],
	columns: GridColumns | undefined,
	rows: GridRows | undefined,
	gap: number,
	containerWidth: number,
): Pick<GridItem, 'height' | 'width'>[] {
	const {length} = items;

	const sizes: Pick<GridItem, 'height' | 'width'>[] = [];

	for (let index = 0; index < length; index += 1) {
		const item = items[index];

		sizes.push({
			height: rows == null ? item.offsetHeight + gap : getSpan(item, GRID_ATTRIBUTE_ROW_SPAN),
			width:
				columns == null
					? min([item.offsetWidth + gap, containerWidth + gap])
					: getSpan(item, GRID_ATTRIBUTE_COLUMN_SPAN, columns.count),
		});
	}

	return sizes;
}

function getSpan(item: HTMLElement, attribute: string, maximum?: number): number {
	const span = floor(getNumber(getAttribute(item, attribute)) + 1e-9);

	// Clamped here, never written back, so a span survives narrow layouts
	return min([span > 0 ? span : 1, maximum ?? Number.POSITIVE_INFINITY]);
}

function holdSize(state: GridState, item: HTMLElement, property: 'height' | 'width'): void {
	const size = state.size.get(item) ?? {};

	if (size[property] === undefined) {
		size[property] = item.style[property];

		state.size.set(item, size);
	}
}

function resetItem(state: GridState, item: HTMLElement): void {
	resetSize(state, item, 'height');
	resetSize(state, item, 'width');

	item.style.transform = '';

	setAttribute(item, GRID_ATTRIBUTE_ITEM);

	state.size.delete(item);
}

function resetSize(state: GridState, item: HTMLElement, property: 'height' | 'width'): void {
	const size = state.size.get(item);

	if (size?.[property] !== undefined) {
		item.style[property] = size[property];

		size[property] = undefined;
	}
}

function resetSizes(state: GridState, property: 'height' | 'width'): void {
	const {items} = state;
	const {length} = items;

	for (let index = 0; index < length; index += 1) {
		resetSize(state, items[index], property);
	}
}

function setColumnWidths(state: GridState, columns: GridColumns, gap: number): void {
	const {items} = state;
	const {length} = items;

	const step = columns.width + gap;

	for (let index = 0; index < length; index += 1) {
		const span = getSpan(items[index], GRID_ATTRIBUTE_COLUMN_SPAN, columns.count);

		holdSize(state, items[index], 'width');

		items[index].style.width = `${span * step - gap}px`;
	}
}

export function setGridColumns(state: GridState, value: unknown): void {
	let columns: [number, number | undefined] | undefined;

	if (typeof value === 'number') {
		columns = [value, undefined];
	} else if (Array.isArray(value)) {
		const [preferred, minimum] = value;

		if (typeof preferred === 'number' && (minimum == null || typeof minimum === 'number')) {
			columns = [preferred, minimum];
		}
	}

	setAttribute(
		state.host,
		GRID_ATTRIBUTE_COLUMNS,
		columns == null ? null : `${columns[0]},${columns[1]}`,
	);
}

function setRowHeights(state: GridState, rows: GridRows, gap: number): void {
	const {items} = state;
	const {length} = items;

	const step = rows.height + gap;

	for (let index = 0; index < length; index += 1) {
		const span = getSpan(items[index], GRID_ATTRIBUTE_ROW_SPAN);

		holdSize(state, items[index], 'height');

		items[index].style.height = `${span * step - gap}px`;
	}
}

// The grid only writes an axis it owns, so free axes stay with CSS, content and the resizable.
// An axis is restored once, when it changes from owned to not owned
function setSizes(
	state: GridState,
	previous: Pick<GridState, 'columns' | 'rows'>,
	columns: GridColumns | undefined,
	rows: GridRows | undefined,
	gap: number,
): void {
	if (columns != null) {
		setColumnWidths(state, columns, gap);
	} else if (previous.columns != null) {
		resetSizes(state, 'width');
	}

	if (rows != null) {
		setRowHeights(state, rows, gap);
	} else if (previous.rows != null) {
		resetSizes(state, 'height');
	}
}

export function toggleGridResizable(state: GridState): void {
	state.resizable = state.host.hasAttribute(GRID_ATTRIBUTE_RESIZABLE);

	const {items} = state;
	const {length} = items;

	for (let index = 0; index < length; index += 1) {
		const item = items[index];
		const resizer = item.querySelector(RESIZABLE_SELECTOR_HANDLE_SCOPED) as HTMLElement | null;

		if (resizer != null) {
			resizer.hidden = !state.resizable;
		}
	}
}

export function toggleGridSortable(state: GridState): void {
	state.sortable = state.host.hasAttribute(GRID_ATTRIBUTE_SORTABLE);
}

export function updateGridPositions(state: GridState): void {
	const {items} = state;
	const {length} = items;

	const bottoms = [0];
	const width = state.host.clientWidth;

	const gap = getGap(state);
	const columns = getColumns(state, gap.value);
	const rows = getRows(state);

	const previous = {columns: state.columns, rows: state.rows};

	state.columns = columns;
	state.gap = gap;
	state.rows = rows;

	const columnStep = columns == null ? 0 : columns.width + gap.value;
	const rowStep = rows == null ? 0 : rows.height + gap.value;

	// A size write invalidates layout, so all of them go first and the reads below share one layout
	setSizes(state, previous, columns, rows, gap.value);

	const sizes = getSizes(items, columns, rows, gap.value, width);

	// Items are only checked against earlier ones, so DOM order is the layout.
	// Only transforms from here on, and they do not invalidate layout
	const placed: GridItem[] = [];

	for (let index = 0; index < length; index += 1) {
		const spot = findFreeSpot(sizes[index], placed, columns?.count ?? width + gap.value);

		bottoms.push(spot.y + spot.height);
		placed.push(spot);

		const x = columns == null ? spot.x : spot.x * columnStep;
		const y = rows == null ? spot.y : spot.y * rowStep;

		items[index].style.transform = `translate3d(${x}px, ${y}px, 0)`;
	}

	const bottom = max(bottoms);
	const height = max([0, (rows == null ? bottom : bottom * rowStep) - gap.value]);

	if (height !== state.height) {
		state.height = height;

		state.host.style.height = `${height}px`;
	}

	dispatch(state.host, 'update');
}

export function updateGridResizables(state: GridState): void {
	const {length} = state.items;

	for (let index = 0; index < length; index += 1) {
		const element = state.items[index];

		if (element.hasAttribute(GRID_ATTRIBUTE_PLACEHOLDER)) {
			continue;
		}

		let resizer = element.querySelector(RESIZABLE_SELECTOR_HANDLE_SCOPED) as HTMLElement | null;

		if (resizer == null) {
			resizer = createResizeHandle(state, element);

			element.append(resizer);
		}

		resizer.hidden = !state.resizable;

		createResizable(element, {
			onBegin: state.callbacks.onResizeBegin,
			onCancel: state.callbacks.onResizeUpdate,
			onEnd: state.callbacks.onResizeUpdate,
			onResize: state.callbacks.onResizeUpdate,
		});
	}
}

// #endregion

// #region Variables

let placeholder: HTMLElement | undefined;

// #endregion
