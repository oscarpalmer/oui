import type {PlainObject} from '@oscarpalmer/atoms/models';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {toggleStyles, type StyleToggler} from '@oscarpalmer/toretto/style';
import type {OuiMovable} from '../../movable/movable.model';
import type {OuiSortable} from '../../sortable/sortable.model';

// #region Types

export type CreateOuiDraggableOptions = {
	/**
	 * Container to hold the draggable element and restrict its movement within. Can be `body`, `document`, `window`, a _CSS_ selector, or an element. _(If not provided, the draggable element will not have any constraints)_
	 */
	container?: string | HTMLElement;
	/**
	 * Direction in which the element can be dragged. _(If not provided, the element can be dragged in any direction)_
	 */
	direction?: OuiDraggableDirection;
};

export type OuiDraggableDirection = 'horizontal' | 'vertical' | 'x' | 'y';

export interface OuiDraggable<ExtraState extends PlainObject = PlainObject> {
	[DRAGGABLE_SYMBOL]: OuiDraggableState & ExtraState;
	get element(): HTMLElement;
	destroy(): void;
}

export type OuiDragBegin<State extends PlainObject = PlainObject> = (
	event: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<State>,
	element: HTMLElement,
	handle: HTMLElement,
	position: EventPosition,
) => void;

export type OuiDragCancel<State extends PlainObject = PlainObject> = (
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<State>,
) => void;

export type OuiDragEnd<State extends PlainObject = PlainObject> = (
	event: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<State>,
	reset: () => void,
) => void;

export type OuiDragMove<State extends PlainObject = PlainObject> = (
	event: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<State>,
	position: OuiDragMovePosition,
) => PlainObject | undefined;

export type OuiDragMovePosition = {
	calculated: EventPosition;
	original: EventPosition;
};

export type OuiDraggableBound<
	Property extends keyof OuiDraggableInstances = keyof OuiDraggableInstances,
	Instance extends OuiDraggableInstances[Property] = OuiDraggableInstances[Property],
> = {
	constructor: new (element: HTMLElement, options?: CreateOuiDraggableOptions) => Instance;
	property: Property;
};

export type OuiDraggableGlobals = {
	container?: DOMRect;
	element?: OuiDraggableGlobalsElement;
	instances: WeakMap<HTMLElement, OuiDraggableInstances>;
	offset?: EventPosition;
	original?: EventPosition;
	states: WeakMap<HTMLElement, OuiDraggableStates>;
};

export type OuiDraggableGlobalsElement = {
	node: HTMLElement;
	rectangle: DOMRect;
};

export type OuiDraggableInstances = {
	movable?: OuiMovable;
	sortable?: OuiSortable;
};

export type OuiDraggableItem<ExtraState extends PlainObject = PlainObject> = {
	instance: OuiDraggable<ExtraState>;
	state: OuiDraggableState & ExtraState;
};

export type OuiDraggableOptions<ExtraState extends PlainObject = PlainObject> = {
	container: OuiDraggableOptionsContainer<ExtraState>;
	direction: OuiDraggableOptionsDirection<ExtraState>;
	drag: OuiDraggableOptionsDrag<ExtraState>;
	input?: CreateOuiDraggableOptions;
	position: OuiDraggableOptionsPosition<ExtraState>;
	getDragged(): HTMLElement;
	getOrigin(): HTMLElement | undefined;
};

export type OuiDraggableOptionsContainer<ExtraState extends PlainObject = PlainObject> = {
	attribute: string;
	map: Map<HTMLElement, Set<OuiDraggable>>;
	onDestroy?: OuiDraggableOptionsContainerOnDestroy<ExtraState>;
	onInitialize?: OuiDraggableOptionsContainerOnInitialize;
};

export type OuiDraggableOptionsContainerOnDestroy<ExtraState extends PlainObject = PlainObject> = (
	item: OuiDraggableItem<ExtraState>,
	container: HTMLElement,
	empty: boolean,
) => void;

export type OuiDraggableOptionsContainerOnInitialize<ExtraState extends PlainObject = PlainObject> =
	(item: OuiDraggableItem<ExtraState>) => void;

export type OuiDraggableOptionsDirection<ExtraState extends PlainObject = PlainObject> = {
	attribute: string;
	onAfter?: OuiDraggableOptionsDirectionOnAfter<ExtraState>;
};

export type OuiDraggableOptionsDirectionOnAfter<ExtraState extends PlainObject = PlainObject> = (
	item: OuiDraggableItem<ExtraState>,
) => void;

export type OuiDraggableOptionsDrag<ExtraState extends PlainObject = PlainObject> = {
	onBegin: OuiDragBegin<ExtraState>;
	onCancel: OuiDragCancel<ExtraState>;
	onEnd: OuiDragEnd<ExtraState>;
	onMove: OuiDragMove<ExtraState>;
};

export type OuiDraggableOptionsPosition<ExtraState extends PlainObject = PlainObject> = {
	getOffset: OuiDraggableOptionsPositionGetOffset<ExtraState>;
	getOriginal: OuiDraggableOptionsPositionGetOriginal<ExtraState>;
};

export type OuiDraggableOptionsPositionGetOffset<ExtraState extends PlainObject = PlainObject> = (
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<ExtraState>,
	element: HTMLElement,
	position: EventPosition,
) => EventPosition;

export type OuiDraggableOptionsPositionGetOriginal<ExtraState extends PlainObject = PlainObject> = (
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<ExtraState>,
	position: EventPosition,
) => EventPosition;

export type OuiDraggableState = {
	attribute: string;
	container?: HTMLElement;
	destroyed: boolean;
	element: HTMLElement;
	hasHandles?: boolean;
	horizontal: boolean;
	name: keyof OuiDraggableStates;
	options: OuiDraggableOptions;
	styling: StyleToggler;
	vertical: boolean;
};

export type OuiDraggableStates = {
	movable?: OuiDraggableState;
	sortable?: OuiDraggableState;
};

// #endregion

// #region Variables

export const DRAGGABLE_ATTRIBUTE_MOVABLE = 'oui-movable';

export const DRAGGABLE_ATTRIBUTE_SORTABLE = 'oui-sortable';

export const DRAGGABLE_KEY_ESCAPE = 'Escape';

export const DRAGGABLE_SELECTOR: string = `[${DRAGGABLE_ATTRIBUTE_MOVABLE}], [${DRAGGABLE_ATTRIBUTE_SORTABLE}]`;

export const DRAGGABLE_SELECTOR_MOVABLE_HANDLE: string = `[${DRAGGABLE_ATTRIBUTE_MOVABLE}-handle]`;

export const DRAGGABLE_SELECTOR_SORTABLE_HANDLE: string = `[${DRAGGABLE_ATTRIBUTE_SORTABLE}-handle]`;

export const DRAGGABLE_SELECTOR_SORTABLE_ITEM: string = `[${DRAGGABLE_ATTRIBUTE_SORTABLE}] > *`;

export const DRAGGABLE_SYMBOL: unique symbol = Symbol(DRAGGABLE_ATTRIBUTE_MOVABLE);

export const draggableContainers: Set<string> = new Set(['body', 'document', 'window']);

export const draggableHorizontals: Set<OuiDraggableDirection> = new Set(['horizontal', 'x']);

export const draggableProperties: Record<keyof OuiDraggableInstances, keyof OuiDraggableInstances> =
	{
		movable: 'sortable',
		sortable: 'movable',
	};

export const draggableGlobals: OuiDraggableGlobals = {
	container: undefined,
	element: undefined,
	instances: new WeakMap(),
	offset: undefined,
	original: undefined,
	states: new WeakMap(),
};

export const draggableStyles = {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
};

export const draggableStyleToggler: StyleToggler = toggleStyles(document.body, draggableStyles);

export const draggableVerticals: Set<OuiDraggableDirection> = new Set(['vertical', 'y']);

// #endregion
