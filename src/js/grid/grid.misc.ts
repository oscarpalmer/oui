import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch} from '@oscarpalmer/toretto/event';
import {
	getGridItems,
	getGridPlaceholder,
	updateGridPositions,
	updateGridResizables,
} from './grid.dom';
import {
	onBeginResizeGridItem,
	onGridItemResized,
	onGridMutation,
	onGridResized,
} from './grid.event';
import {
	GRID_ATTRIBUTE_ITEM_ACTIVE,
	GRID_ATTRIBUTE_RESIZABLE,
	GRID_ATTRIBUTE_SORTABLE,
	GRID_ATTRIBUTE_SORTING,
	GRID_EVENT_RESIZE_CANCEL,
	GRID_EVENT_RESIZE_CHANGE,
	GRID_EVENT_RESIZE_END,
	GRID_EVENT_SORT_CANCEL,
	GRID_EVENT_SORT_END,
	gridStyling,
	OuiGridSortEvent,
	type GridSort,
	type GridState,
} from './grid.model';

// #region Functions

export function connectGrid(state: GridState): void {
	state.items = getGridItems(state);

	state.mutationObserver.observe(state.host, mutationOptions);
	resizeObserver.observe(state.host);

	updateGridResizables(state);
}

export function createGridState(host: HTMLElement): GridState {
	const state = {
		host,
		callbacks: {
			onResizeBegin: (element, size) => onBeginResizeGridItem(state, element, size),
			onResizeCancel: (element, size) =>
				onGridItemResized(GRID_EVENT_RESIZE_CANCEL, state, element, size),
			onResizeEnd: (element, size) =>
				onGridItemResized(GRID_EVENT_RESIZE_END, state, element, size),
			onResizeUpdate: (element, size) =>
				onGridItemResized(GRID_EVENT_RESIZE_CHANGE, state, element, size),
		},
		items: [],
		gap: {
			value: 0,
		},
		size: new WeakMap(),
		mutationObserver: new MutationObserver(() => onGridMutation(state)),
		resizable: host.hasAttribute(GRID_ATTRIBUTE_RESIZABLE),
		sortable: host.hasAttribute(GRID_ATTRIBUTE_SORTABLE),
	} satisfies GridState;

	return state;
}

export function disconnectGrid(state: GridState): void {
	state.mutationObserver.disconnect();
	resizeObserver.unobserve(state.host);
}

export function endGridSort(sort: GridSort, target?: HTMLElement): undefined {
	sort.item.style.pointerEvents = sort.style.pointerEvents;
	sort.item.style.position = '';
	sort.item.style.transform = sort.style.transform;
	sort.item.style.zIndex = sort.style.zIndex;
	sort.state.active = undefined;

	const placeholder = getGridPlaceholder();

	if (target == null) {
		placeholder?.replaceWith(sort.item);

		dispatch(
			sort.state.host,
			new OuiGridSortEvent(GRID_EVENT_SORT_CANCEL, {
				detail: {
					item: sort.item,
				},
			}),
		);
	} else {
		const event = new OuiGridSortEvent(GRID_EVENT_SORT_END, {
			detail: {
				destination: target,
				item: sort.item,
			},
		});

		if (dispatch(sort.state.host, event).defaultPrevented) {
			placeholder?.replaceWith(sort.item);
		} else {
			const next = sort.state.items.indexOf(target);

			if (sort.index < next) {
				target?.after(sort.item);
			} else {
				target?.before(sort.item);
			}

			placeholder?.remove();

			updateGridPositions(sort.state);
			updateGridResizables(sort.state);
		}
	}

	setAttribute(sort.state.host, GRID_ATTRIBUTE_SORTING);
	setAttribute(sort.item, GRID_ATTRIBUTE_ITEM_ACTIVE);

	gridStyling.remove();

	return undefined;
}

export function updateGrid(state: GridState): void {
	if (state.host.isConnected) {
		updateGridPositions(state);
	}
}

// #endregion

// #region Variables

const mutationOptions: MutationObserverInit = {
	childList: true,
};

const resizeObserver = new ResizeObserver(onGridResized);

// #endregion
