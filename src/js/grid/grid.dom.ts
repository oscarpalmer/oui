import {select} from '@oscarpalmer/atoms/array/select';
import {floor, max, min} from '@oscarpalmer/atoms/math';
import {getNumber} from '@oscarpalmer/atoms/number';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {dispatch} from '@oscarpalmer/toretto/event';
import {getStyle} from '@oscarpalmer/toretto/style';
import {createResizable} from '../resizable/resizable.embedded';
import {
	RESIZABLE_ATTRIBUTE_HANDLE,
	RESIZABLE_SELECTOR_HANDLE_SCOPED,
} from '../resizable/resizable.model';
import {
	GRID_ATTRIBUTE_COLUMNS,
	GRID_ATTRIBUTE_GAP,
	GRID_ATTRIBUTE_ITEM,
	GRID_ATTRIBUTE_PLACEHOLDER,
	GRID_ATTRIBUTE_RESIZABLE,
	GRID_ATTRIBUTE_SPAN,
	GRID_SELECTOR_ITEM_SCOPED,
	OuiGridResizeHandlerEvent,
	type GridColumns,
	type GridGap,
	type GridItem,
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

function getColumns(host: HTMLElement, gap: number, attribute?: string): GridColumns | undefined {
	const value = attribute ?? getAttribute(host, GRID_ATTRIBUTE_COLUMNS) ?? '';

	const [first, second] = value.split(',');

	const preferred = Number.parseInt(first ?? '', 10);
	const minimum = Number.parseFloat(second ?? '');

	const hasMinimum = minimum > 0;
	const hasPreferred = preferred > 0;

	if (!hasMinimum && !hasPreferred) {
		return undefined;
	}

	const {clientWidth} = host;

	const count = max([
		1,
		min([
			hasPreferred ? preferred : Number.POSITIVE_INFINITY,
			hasMinimum ? floor((clientWidth + gap) / (minimum + gap)) : Number.POSITIVE_INFINITY,
		]),
	]);

	return {
		count,
		attribute: [preferred, Number.isNaN(minimum) ? undefined : minimum],
		width: (clientWidth - gap * (count - 1)) / count,
	};
}

export function getGridElements(state: GridState): HTMLElement[] {
	const previous = new Set(state.elements.splice(0));

	const next = [...state.host.querySelectorAll(GRID_SELECTOR_ITEM_SCOPED)] as HTMLElement[];
	const {length} = next;

	for (let index = 0; index < length; index++) {
		const element = next[index];

		if (previous.has(element)) {
			previous.delete(element);
		}

		setAttribute(element, GRID_ATTRIBUTE_ITEM, '');
	}

	if (state.active != null) {
		previous.delete(state.active);
	}

	for (const element of previous) {
		setAttribute(element, GRID_ATTRIBUTE_ITEM);
	}

	return next;
}

function getGap(host: HTMLElement, input?: string): GridGap {
	let attribute: number | undefined;
	let style: string | undefined;
	let value: number | undefined;

	input ??= getAttribute(host, GRID_ATTRIBUTE_GAP);

	if (input != null) {
		attribute = getNumber(input);

		if (Number.isNaN(attribute) || attribute < 0) {
			attribute = undefined;
		} else {
			value = attribute;
		}
	}

	if (value == null) {
		style = getStyle(host, 'gap', true);

		if (style != null) {
			value = getNumber(style.endsWith('px') ? style.slice(0, -2) : style);
		}
	}

	return {
		attribute,
		style,
		value: value == null ? 0 : max([value, 0]),
	};
}

export function getGridColumns(state: GridState): [number, number | undefined] | undefined {
	return state.columns?.attribute;
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

	setAttribute(placeholder, GRID_ATTRIBUTE_SPAN, getAttribute(original, GRID_ATTRIBUTE_SPAN));

	placeholder.style.width = `${original.offsetWidth}px`;
	placeholder.style.height = `${original.offsetHeight}px`;
	placeholder.style.transform = original.style.transform;

	return placeholder;
}

function getSpan(element: HTMLElement, count: number): number {
	const span = getNumber(getAttribute(element, GRID_ATTRIBUTE_SPAN));

	// Clamped here, never written back, so a span survives narrow layouts
	return min([span > 0 ? span : 1, count]);
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

export function updateGridPositions(state: GridState): void {
	const {elements: items} = state;
	const {length} = items;

	const bottoms = [0];
	const width = state.host.clientWidth;

	const gap = getGap(state.host);
	const columns = getColumns(state.host, gap.value);

	state.columns = columns;
	state.gap = gap;

	// Items are only checked against earlier ones, so DOM order is the layout
	const placed: GridItem[] = [];

	for (let index = 0; index < length; index += 1) {
		const item = items[index];

		// Column mode runs x and width in columns, y and height in pixels.
		// Pixel axes carry one trailing gap, and the container gets one extra
		const spot = findFreeSpot(
			{
				height: item.offsetHeight + gap.value,
				width:
					columns == null
						? min([item.offsetWidth + gap.value, width + gap.value])
						: getSpan(item, columns.count),
			},
			placed,
			columns?.count ?? width + gap.value,
		);

		bottoms.push(spot.y + spot.height);
		placed.push(spot);

		if (columns == null) {
			item.style.transform = `translate3d(${spot.x}px, ${spot.y}px, 0)`;
		} else {
			const step = columns.width + gap.value;

			item.style.transform = `translate3d(${spot.x * step}px, ${spot.y}px, 0)`;
			item.style.width = `${spot.width * step - gap.value}px`;
		}
	}

	const height = max([0, max(bottoms) - gap.value]);

	if (height !== state.height) {
		state.height = height;

		state.host.style.height = `${height}px`;
	}

	dispatch(state.host, 'update');
}

export function updateGridResizables(state: GridState): void {
	if (!state.host.hasAttribute(GRID_ATTRIBUTE_RESIZABLE)) {
		return;
	}

	const {length} = state.elements;

	for (let index = 0; index < length; index += 1) {
		const element = state.elements[index];

		if (element.hasAttribute(GRID_ATTRIBUTE_PLACEHOLDER)) {
			continue;
		}

		const resizer = element.querySelector(RESIZABLE_SELECTOR_HANDLE_SCOPED);

		if (resizer == null) {
			element.append(createResizeHandle(state, element));
		}

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
