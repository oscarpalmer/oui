import type {EventPosition} from '@oscarpalmer/toretto/models';
import {toggleStyles, type StyleToggler} from '@oscarpalmer/toretto/style';

// #region Types

export type OuiMovable = {
	[MOVABLE_SYMBOL]: OuiMovableState;
	/**
	 * The movable element
	 */
	get element(): Element;
	/**
	 * Destroy the movable
	 */
	destroy(): void;
};

export type OuiMovableContainer = {
	attribute: string;
	element?: Element;
};

export type OuiMovableDirection = {
	attribute: string;
	horizontal: boolean;
	vertical: boolean;
};

export type OuiMovableDirectionType = 'horizontal' | 'vertical' | 'x' | 'y';

export class OuiMovableEvent extends CustomEvent<OuiMovableEventDetail> {}

export type OuiMovableEventDetail = {
	element: Element;
	position: OuiMovableEventDetailPosition;
};

type OuiMovableEventDetailPosition = {
	from: EventPosition;
	to: EventPosition;
};

export type OuiMovableEventState = {
	container?: DOMRect;
	element?: OuiMovableEventStateElement;
	movable?: OuiMovable;
	offset?: EventPosition;
	original?: EventPosition;
	state?: OuiMovableState;
};

type OuiMovableEventStateElement = {
	node: Element;
	rectangle: DOMRect;
};

export type OuiMovableOptions = {
	container?: string | Element;
	direction?: OuiMovableDirectionType;
	onBegin?: OuiMovableOptionsCallback;
	onCancel?: (movable: OuiMovable) => void;
	onEnd?: OuiMovableOptionsCallback;
	onMove?: OuiMovableOptionsCallback;
};

type OuiMovableOptionsCallback = (
	position: OuiMovableEventDetailPosition,
	movable: OuiMovable,
	cancel: () => void,
) => void;

export type OuiMovableState = {
	container: OuiMovableContainer;
	direction: OuiMovableDirection;
	element: Element;
	hasHandles?: boolean;
	moved: boolean;
	offset?: Partial<EventPosition>;
	options: OuiMovableOptions;
	style: OuiMovableStyle;
};

export type OuiMovableStyle = {
	original: OuiMovableStyleOriginal;
	toggler: StyleToggler;
};

export type OuiMovableStyleOriginal = {
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

export const MOVABLE_CONTAINERS: Map<Element, Set<OuiMovableState>> = new Map();

export const MOVABLE_EVENT_END: string = `${MOVABLE_ATTRIBUTE}:end`;

export const MOVABLE_MESSAGE = 'The element must be an instance of HTMLElement or SVGElement';

export const MOVABLE_MOVED: Set<OuiMovableState> = new Set();

export const MOVABLE_SELECTOR: string = `[${MOVABLE_ATTRIBUTE}]`;

export const MOVABLE_SELECTOR_HANDLE: string = `[${MOVABLE_ATTRIBUTE_HANDLE}]`;

export const MOVABLE_SYMBOL: unique symbol = Symbol(MOVABLE_ATTRIBUTE);

export const movableContainers: Set<string> = new Set(['body', 'document', 'window']);

export const movableHorizontals: Set<string> = new Set(['horizontal', 'x']);

export const movableStyleToggler: StyleToggler = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

export const movableVerticals: Set<string> = new Set(['vertical', 'y']);

export const movables: WeakMap<Element, OuiMovable> = new WeakMap();

// #endregion
