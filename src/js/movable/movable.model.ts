import type {EventPosition} from '@oscarpalmer/toretto/models';
import type {OuiDraggable} from '../internal/draggable/draggable.model';

// #region Types

export type OuiMovable = {
	/**
	 * The movable element
	 */
	get element(): Element;
	/**
	 * Destroy the movable
	 */
	destroy(): void;
} & OuiDraggable<OuiMovableState>;

export type OuiMovableState = {
	hasHandles?: boolean;
	moved: boolean;
	offset?: Partial<EventPosition>;
	style: OuiMovableStyle;
};

export type OuiMovableStyle = {
	inset?: string;
	position?: string;
};

// #endregion

// #region Variables

export const MOVABLE_ATTRIBUTE = 'oui-movable';

export const MOVABLE_ATTRIBUTE_CONTAINER: string = `${MOVABLE_ATTRIBUTE}-container`;

export const MOVABLE_ATTRIBUTE_DIRECTION: string = `${MOVABLE_ATTRIBUTE}-direction`;

export const MOVABLE_ATTRIBUTE_HANDLE: string = `${MOVABLE_ATTRIBUTE}-handle`;

export const MOVABLE_ATTRIBUTE_MOVING: string = `${MOVABLE_ATTRIBUTE}-moving`;

export const MOVABLE_CONTAINERS: Map<Element, Set<OuiMovable>> = new Map();

export const MOVABLE_MESSAGE = 'The element must be an instance of HTMLElement or SVGElement';

export const MOVABLE_MOVED: Set<OuiMovable> = new Set();

export const MOVABLE_SELECTOR_HANDLE: string = `[${MOVABLE_ATTRIBUTE_HANDLE}]`;

// #endregion
