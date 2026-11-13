// #region Types

import type {EventPosition} from '@oscarpalmer/toretto/models';
import {toggleStyles, type StyleToggler} from '@oscarpalmer/toretto/style';

export type OuiSortable = {
	[SORTABLE_SYMBOL]: OuiSortableState;
	destroy(): void;
};

export type OuiSortableContainer = {
	attribute: string;
	element?: Element;
};

export type OuiSortableDirection = {
	attribute: string;
	horizontal: boolean;
	vertical: boolean;
};

export type OuieDirectionType = 'horizontal' | 'vertical' | 'x' | 'y';

export class OuiSortableEvent extends CustomEvent<OuiSortableEventDetail> {}

export type OuiSortableEventDetail = {
	from: Element;
	to?: Element;
};

export type OuiSortableEventState = {
	container?: DOMRect;
	element?: OuiSortableEventStateElement;
	sortable?: OuiSortable;
	offset?: EventPosition;
	original?: EventPosition;
	state?: OuiSortableState;
};

type OuiSortableEventStateElement = {
	node: Element;
	rectangle: DOMRect;
};

export type OuiSortableOptions = {
	container?: string | Element;
	direction?: OuiSortableDirection;
	onBegin?: OuiSortableOptionsCallback;
	onCancel?: (sortable: OuiSortable) => void;
	onEnd?: OuiSortableOptionsCallback;
	onMove?: OuiSortableOptionsCallback;
};

type OuiSortableOptionsCallback = (
	elements: OuiSortableEventDetail,
	movable: OuiSortable,
	cancel: () => void,
) => void;

export type OuiSortablePlaceholder = {
	drag: OuiSortablePlaceholderDrag;
	position: Element | undefined;
};

export type OuiSortablePlaceholderDrag = {
	custom: Element | SVGElement | undefined;
	default: Element | undefined;
};

export type OuiSortableState = {
	connections: string | null | undefined;
	container: OuiSortableContainer;
	direction: OuiSortableDirection;
	element: Element;
	hasHandles?: boolean;
	moved: boolean;
	offset?: Partial<EventPosition>;
	options: OuiSortableOptions;
	origin?: Element;
};

// #endregion

// #region Variables

export const SORTABLE_ATTRIBUTE = 'oui-sortable';

export const SORTABLE_ATTRIBUTE_ACTIVE: string = `${SORTABLE_ATTRIBUTE}-active`;

export const SORTABLE_ATTRIBUTE_CONNECTIONS: string = `${SORTABLE_ATTRIBUTE}-connections`;

export const SORTABLE_ATTRIBUTE_CONTAINER: string = `${SORTABLE_ATTRIBUTE}-container`;

export const SORTABLE_ATTRIBUTE_DIRECTION: string = `${SORTABLE_ATTRIBUTE}-direction`;

export const SORTABLE_ATTRIBUTE_HANDLE: string = `${SORTABLE_ATTRIBUTE}-handle`;

export const SORTABLE_ATTRIBUTE_HORIZONTAL: string = `${SORTABLE_ATTRIBUTE}-horizontal`;

export const SORTABLE_ATTRIBUTE_ORIGIN: string = `${SORTABLE_ATTRIBUTE}-origin`;

export const SORTABLE_ATTRIBUTE_PLACEHOLDER_DRAG: string = `${SORTABLE_ATTRIBUTE}-placeholder-drag`;

export const SORTABLE_ATTRIBUTE_PLACEHOLDER_POSITION: string = `${SORTABLE_ATTRIBUTE}-placeholder-position`;

export const SORTABLE_ATTRIBUTE_VERTICAL: string = `${SORTABLE_ATTRIBUTE}-vertical`;

export const SORTABLE_CONTAINERS: Map<HTMLElement, Set<OuiSortable>> = new Map();

export const SORTABLE_EVENT_END: string = `${SORTABLE_ATTRIBUTE}:end`;

export const SORTABLE_EVENT_PLACEHOLDER: string = `${SORTABLE_ATTRIBUTE}:placeholder`;

export const SORTABLE_MESSAGE = 'The element must be an instance of HTMLElement or SVGElement';

export const SORTABLE_SELECTOR: string = `[${SORTABLE_ATTRIBUTE}]`;

export const SORTABLE_SELECTOR_HANDLE: string = `[${SORTABLE_ATTRIBUTE_HANDLE}]`;

export const SORTABLE_SELECTOR_ITEM: string = `[${SORTABLE_ATTRIBUTE}] > *`;

export const SORTABLE_SYMBOL: unique symbol = Symbol(SORTABLE_ATTRIBUTE);

export const sortableContainers: Set<string> = new Set(['body', 'document', 'window']);

export const sortableHorizontals: Set<string> = new Set(['horizontal', 'x']);

export const sortablePlaceholder: OuiSortablePlaceholder = {
	drag: {
		custom: undefined,
		default: undefined,
	},
	position: undefined,
};

export const sortableStyleToggler: StyleToggler = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

export const sortableVerticals: Set<string> = new Set(['vertical', 'y']);

export const sortables: WeakMap<Element, OuiSortable> = new WeakMap();

// #endregion
