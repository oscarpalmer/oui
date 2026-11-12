import type {EventPosition} from '@oscarpalmer/toretto/models';
import {toggleStyles, type StyleToggler} from '@oscarpalmer/toretto/style';
import type {OuiResizableEventDetail} from '../resizable/resizable.model';

// #region Types

export type GridColumns = {
	count: number;
	width: number;
};

export type GridGap = {
	attribute?: number;
	style?: string;
	value: number;
};

export type GridOriginalSize = {
	height?: string;
	width?: string;
};

export type GridItem = {
	height: number;
	width: number;
	x: number;
	y: number;
};

export type GridRows = {
	height: number;
};

export type GridSort = {
	index: number;
	item: HTMLElement;
	offset: EventPosition;
	state: GridState;
	style: GridSortStyle;
};

type GridSortStyle = {
	pointerEvents: string;
	transform: string;
	zIndex: string;
};

export type GridState = {
	active?: HTMLElement;
	callbacks: GridStateCallbacks;
	columns?: GridColumns;
	items: HTMLElement[];
	gap: GridGap;
	height?: number;
	host: HTMLElement;
	mutationObserver: MutationObserver;
	resizable: boolean;
	rows?: GridRows;
	size: WeakMap<HTMLElement, GridOriginalSize>;
	sortable: boolean;
};

type GridStateCallbacks = {
	onResizeBegin: (element: Element, size: OuiResizableEventDetail) => void;
	onResizeCancel: (element: Element, size: OuiResizableEventDetail) => void;
	onResizeEnd: (element: Element, size: OuiResizableEventDetail) => void;
	onResizeUpdate: (element: Element, size: OuiResizableEventDetail) => void;
};

export class OuiGridResizeEvent extends CustomEvent<OuiGridResizeEventDetail> {}

export type OuiGridResizeEventDetail = {
	item: HTMLElement;
} & OuiResizableEventDetail;

export class OuiGridResizeHandlerEvent extends CustomEvent<OuiGridResizeHandlerEventDetail> {
	constructor(detail: OuiGridResizeHandlerEventDetail) {
		super(GRID_EVENT_RESIZE_HANDLE, {detail});
	}
}

export type OuiGridResizeHandlerEventDetail = {
	handle: HTMLElement;
	item: HTMLElement;
};

export class OuiGridSortEvent extends CustomEvent<OuiGridEventSortDetail> {}

export type OuiGridEventSortDetail = {
	destination?: HTMLElement;
	item: HTMLElement;
};

// #endregion

// #region Variables

export const GRID_TAGNAME = 'oui-grid';

export const GRID_ATTRIBUTE_COLUMN_SPAN: string = `${GRID_TAGNAME}-column-span`;

export const GRID_ATTRIBUTE_COLUMNS = 'columns';

export const GRID_ATTRIBUTE_GAP = 'gap';

export const GRID_ATTRIBUTE_ITEM: string = `${GRID_TAGNAME}-item`;

export const GRID_ATTRIBUTE_ITEM_ACTIVE: string = `${GRID_ATTRIBUTE_ITEM}-active`;

export const GRID_ATTRIBUTE_ITEM_HANDLE: string = `${GRID_ATTRIBUTE_ITEM}-handle`;

export const GRID_ATTRIBUTE_MIN_HEIGHT = 'min-height';

export const GRID_ATTRIBUTE_MIN_WIDTH = 'min-width';

export const GRID_ATTRIBUTE_PLACEHOLDER: string = `${GRID_TAGNAME}-placeholder`;

export const GRID_ATTRIBUTE_RESIZABLE = 'resizable';

export const GRID_ATTRIBUTE_ROW_SPAN: string = `${GRID_TAGNAME}-row-span`;

export const GRID_ATTRIBUTE_SORTABLE = 'sortable';

export const GRID_ATTRIBUTE_SORTING: string = `${GRID_TAGNAME}-sorting`;

export const GRID_EVENT_RESIZE_BEGIN = 'resize:begin';

export const GRID_EVENT_RESIZE_CANCEL = 'resize:cancel';

export const GRID_EVENT_RESIZE_CHANGE = 'resize:change';

export const GRID_EVENT_RESIZE_END = 'resize:end';

export const GRID_EVENT_RESIZE_HANDLE = 'resize:handle';

export const GRID_EVENT_SORT_BEGIN = 'sort:begin';

export const GRID_EVENT_SORT_CANCEL = 'sort:cancel';

export const GRID_EVENT_SORT_CHANGE = 'sort:change';

export const GRID_EVENT_SORT_END = 'sort:end';

export const GRID_SELECTOR_HANDLE: string = `[${GRID_ATTRIBUTE_ITEM_HANDLE}]`;

export const GRID_SELECTOR_ITEM: string = `${GRID_TAGNAME} > *`;

export const GRID_SELECTOR_ITEM_SCOPED: string = `:scope > *`;

export const GRID_SYMBOL: unique symbol = Symbol(GRID_TAGNAME);

export const gridStyling: StyleToggler = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

// #endregion
