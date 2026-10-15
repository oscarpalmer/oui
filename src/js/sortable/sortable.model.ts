import type {OuiDraggable} from '../internal/draggable/draggable.model';

// #region Types

export type OuiSortable = {
	destroy(): void;
} & OuiDraggable<OuiSortableState>;

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
	origin?: Element;
};

// #endregion

// #region Variables

export const SORTABLE_ATTRIBUTE = 'oui-sortable';

export const SORTABLE_ATTRIBUTE_ACTIVE: string = `${SORTABLE_ATTRIBUTE}-active`;

export const SORTABLE_ATTRIBUTE_CONNECTIONS: string = `${SORTABLE_ATTRIBUTE}-connections`;

export const SORTABLE_ATTRIBUTE_CONTAINER: string = `${SORTABLE_ATTRIBUTE}-container`;

export const SORTABLE_ATTRIBUTE_DIRECTION: string = `${SORTABLE_ATTRIBUTE}-direction`;

export const SORTABLE_ATTRIBUTE_HORIZONTAL: string = `${SORTABLE_ATTRIBUTE}-horizontal`;

export const SORTABLE_ATTRIBUTE_ORIGIN: string = `${SORTABLE_ATTRIBUTE}-origin`;

export const SORTABLE_ATTRIBUTE_PLACEHOLDER_DRAG: string = `${SORTABLE_ATTRIBUTE}-placeholder-drag`;

export const SORTABLE_ATTRIBUTE_PLACEHOLDER_POSITION: string = `${SORTABLE_ATTRIBUTE}-placeholder-position`;

export const SORTABLE_ATTRIBUTE_VERTICAL: string = `${SORTABLE_ATTRIBUTE}-vertical`;

export const SORTABLE_CONTAINERS: Map<HTMLElement, Set<OuiSortable>> = new Map();

export const SORTABLE_MESSAGE = 'The element must be an instance of HTMLElement or SVGElement';

export const SORTABLE_SELECTOR: string = `[${SORTABLE_ATTRIBUTE}]`;

export const SORTABLE_SELECTOR_ITEM: string = `[${SORTABLE_ATTRIBUTE}] > *`;

export const sortablePlaceholder: OuiSortablePlaceholder = {
	drag: {
		custom: undefined,
		default: undefined,
	},
	position: undefined,
};

// #endregion
