import type {EventPosition, PlainObject} from '@oscarpalmer/atoms/models';
import {clamp} from '@oscarpalmer/atoms/number';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch, getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {setStyle, setStyles, toggleStyles, type StyleToggler} from '@oscarpalmer/toretto/style';
import supportsTouch from '@oscarpalmer/toretto/touch';
import type {OuiMovable} from '../movable/movable.embedded';
import type {OuiSortable} from '../sortable/sortable.embedded';

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

type OuiDraggableDirection = 'horizontal' | 'vertical' | 'x' | 'y';

export abstract class OuiDraggable<ExtraState extends PlainObject = PlainObject> {
	#destroyed = false;

	readonly #state: OuiDraggableState & ExtraState;

	get element(): HTMLElement {
		return this.#state.element;
	}

	constructor(
		name: keyof OuiDraggableStates,
		event: string,
		attribute: string,
		element: HTMLElement,
		options: OuiDraggableOptions<ExtraState>,
		extras: ExtraState,
	) {
		this.#state = {
			...extras,
			attribute,
			element,
			event,
			name,
			options,
			horizontal: true,
			vertical: true,
			styling: toggleStyles(element, styles),
		} as OuiDraggableState & ExtraState;

		const item = {
			instance: this,
			state: this.#state,
		};

		setContainer(item);
		setDirection(item);

		setAttribute(element, attribute, '');

		let states = globals.states.get(element);

		states ??= {};

		states[this.#state.name] = this.#state;

		globals.states.set(element, states);
	}

	destroy(): void {
		if (this.#destroyed) {
			return;
		}

		this.#destroyed = true;

		destroyInstance(this, this.#state);
	}
}

type OuiDragBegin<State extends PlainObject = PlainObject> = (
	event: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<State>,
	element: HTMLElement,
	handle: HTMLElement,
	position: EventPosition,
) => void;

type OuiDragCancel<State extends PlainObject = PlainObject> = (
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<State>,
) => void;

type OuiDragEnd<State extends PlainObject = PlainObject> = (
	event: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<State>,
	reset: () => void,
) => void;

type OuiDragMove<State extends PlainObject = PlainObject> = (
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

type OuiDraggableGlobalsElement = {
	node: HTMLElement;
	rectangle: DOMRect;
};

type OuiDraggableInstances = {
	movable?: OuiMovable;
	sortable?: OuiSortable;
};

export type OuiDraggableItem<ExtraState extends PlainObject = PlainObject> = {
	instance: OuiDraggable<ExtraState>;
	state: OuiDraggableState & ExtraState;
};

type OuiDraggableOptions<ExtraState extends PlainObject = PlainObject> = {
	container: OuiDraggableOptionsContainer<ExtraState>;
	direction: OuiDraggableOptionsDirection<ExtraState>;
	drag: OuiDraggableOptionsDrag<ExtraState>;
	input?: CreateOuiDraggableOptions;
	position: OuiDraggableOptionsPosition<ExtraState>;
	getDragged(): HTMLElement;
	getOrigin(): HTMLElement | undefined;
};

type OuiDraggableOptionsContainer<ExtraState extends PlainObject = PlainObject> = {
	attribute: string;
	map: Map<HTMLElement, Set<OuiDraggable>>;
	onDestroy?: OuiDraggableOptionsContainerOnDestroy<ExtraState>;
	onInitialize?: OuiDraggableOptionsContainerOnInitialize;
};

type OuiDraggableOptionsContainerOnDestroy<ExtraState extends PlainObject = PlainObject> = (
	item: OuiDraggableItem<ExtraState>,
	container: HTMLElement,
	empty: boolean,
) => void;

type OuiDraggableOptionsContainerOnInitialize<ExtraState extends PlainObject = PlainObject> = (
	item: OuiDraggableItem<ExtraState>,
) => void;

type OuiDraggableOptionsDirection<ExtraState extends PlainObject = PlainObject> = {
	attribute: string;
	onAfter?: OuiDraggableOptionsDirectionOnAfter<ExtraState>;
};

type OuiDraggableOptionsDirectionOnAfter<ExtraState extends PlainObject = PlainObject> = (
	item: OuiDraggableItem<ExtraState>,
) => void;

type OuiDraggableOptionsDrag<ExtraState extends PlainObject = PlainObject> = {
	onBegin: OuiDragBegin<ExtraState>;
	onCancel: OuiDragCancel<ExtraState>;
	onEnd: OuiDragEnd<ExtraState>;
	onMove: OuiDragMove<ExtraState>;
};

type OuiDraggableOptionsPosition<ExtraState extends PlainObject = PlainObject> = {
	getOffset: OuiDraggableOptionsPositionGetOffset<ExtraState>;
	getOriginal: OuiDraggableOptionsPositionGetOriginal<ExtraState>;
};

type OuiDraggableOptionsPositionGetOffset<ExtraState extends PlainObject = PlainObject> = (
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<ExtraState>,
	element: HTMLElement,
	position: EventPosition,
) => EventPosition;

type OuiDraggableOptionsPositionGetOriginal<ExtraState extends PlainObject = PlainObject> = (
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<ExtraState>,
	position: EventPosition,
) => EventPosition;

export type OuiDraggableState = {
	attribute: string;
	container?: HTMLElement;
	element: HTMLElement;
	hasHandles?: boolean;
	horizontal: boolean;
	name: keyof OuiDraggableStates;
	options: OuiDraggableOptions;
	styling: StyleToggler;
	vertical: boolean;
};

type OuiDraggableStates = {
	movable?: OuiDraggableState;
	sortable?: OuiDraggableState;
};

// #endregion

// #region Functions

export function addDraggable<
	Property extends keyof OuiDraggableInstances,
	Instance extends OuiDraggableInstances[Property],
>(
	this: OuiDraggableBound<Property, Instance>,
	element: HTMLElement,
	options?: CreateOuiDraggableOptions,
): Instance {
	let instances = globals.instances.get(element);

	if (instances == null) {
		instances = {};

		globals.instances.set(element, instances);
	}

	instances[this.property] ??= new this.constructor(element, options);

	return instances[this.property] as Instance;
}

function cancelDrag(item?: OuiDraggableItem): void {
	if (item == null) {
		return;
	}

	item.state.options.drag.onCancel?.(globals, item);

	dispatch(item.state.element, `${item.state.name}:cancel`, {
		detail: {
			element: item.state.options.getOrigin(),
		},
	});

	reset();
}

function destroyInstance(instance: OuiDraggable, state: OuiDraggableState): void {
	unsetContainer({
		instance,
		state,
	});

	state.element.removeAttribute(state.attribute);
	state.styling.remove();

	state.container = undefined;
	state.element = undefined as never;
	state.options = undefined as never;
	state.styling = undefined as never;
}

export function getDraggableStates(element: HTMLElement): OuiDraggableStates | undefined {
	return globals.states.get(element);
}

function getHandle(event: Event, isMovable: boolean): HTMLElement | null {
	return findAncestor(
		event,
		isMovable ? SELECTOR_MOVABLE_HANDLE : SELECTOR_SORTABLE_HANDLE,
	) as HTMLElement;
}

function getNextPosition(item: OuiDraggableItem, position: EventPosition): EventPosition {
	let x = globals.original?.x ?? 0;
	let y = globals.original?.y ?? 0;

	if (item.state.horizontal) {
		x = position.x - (globals.offset?.x ?? 0);

		if (globals.container != null && globals.element != null) {
			x = clamp(
				x,
				globals.container.left,
				globals.container.right - globals.element.rectangle.width,
			);
		}
	}

	if (item.state.vertical) {
		y = position.y - (globals.offset?.y ?? 0);

		if (globals.container != null && globals.element != null) {
			y = clamp(
				y,
				globals.container.top,
				globals.container.bottom - globals.element.rectangle.height,
			);
		}
	}

	return {x, y};
}

function onKeydown(event: KeyboardEvent): void {
	if (current != null && event.key === KEY_ESCAPE) {
		cancelDrag(current);
	}
}

function onPointerdown(event: MouseEvent | TouchEvent): void {
	if (
		event.altKey ||
		event.ctrlKey ||
		event.metaKey ||
		event.shiftKey ||
		(supportsTouch.value
			? event.type === 'mousedown'
			: event.type === 'touchstart' || (event as MouseEvent).button !== 0)
	) {
		return;
	}

	const container = findAncestor(event, SELECTOR)! as HTMLElement;

	const instances = globals.instances.get(container!);
	const states = globals.states.get(container);

	if (instances == null || states == null) {
		return;
	}

	const isMovable = container.hasAttribute(ATTRIBUTE_MOVABLE);

	const item: OuiDraggableItem = {
		instance: (isMovable ? instances.movable : instances.sortable) as OuiDraggable,
		state: (isMovable ? states.movable : states.sortable) as OuiDraggableState,
	};

	if (item.instance == null || item.state == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	let element: HTMLElement | null = container;

	if (!isMovable) {
		element = findAncestor(event, SELECTOR_SORTABLE_ITEM) as HTMLElement;

		if (element == null || element.parentElement !== container) {
			return;
		}
	}

	let handle: HTMLElement | null = element;

	item.state.hasHandles ??= element.querySelector(SELECTOR_SORTABLE_HANDLE) != null;

	if (item.state.hasHandles) {
		handle = getHandle(event, isMovable);
	}

	if (handle == null) {
		return;
	}

	const dragged = item.state.options.getDragged();
	const rectangle = dragged.getBoundingClientRect();

	const position = getPosition(event) ?? {x: 0, y: 0};

	current = item;

	globals.container = item.state.container?.getBoundingClientRect();

	globals.element = {
		rectangle,
		node: dragged,
	};

	globals.offset = item.state.options.position.getOffset(globals, item, element, position);
	globals.original = item.state.options.position.getOriginal(globals, item, position);

	const dispatched = dispatch(item.state.element, `${item.state.name}:begin`, {
		detail: {
			element,
			position: {...globals.original},
		},
	});

	setTimeout(() => {
		if (dispatched.defaultPrevented) {
			item.state.options.drag.onCancel?.(globals, item);

			reset();

			return;
		}

		const next = getNextPosition(item, position);

		setStyles(dragged, {
			position: 'fixed',
			inset: `${next.y}px auto auto ${next.x}px`,
			transform: 'translate3d(0, 0, 0)',
		});

		item.state.options.drag.onBegin?.(event, globals, item, element, handle, next);

		item.state.styling.set();
		styleToggler.set();
	});
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	if (current == null) {
		return;
	}

	const position = getPosition(event);

	if (position == null) {
		return;
	}

	const next = getNextPosition(current, position);

	if (globals.element != null) {
		setStyle(globals.element.node, 'inset', `${next.y}px auto auto ${next.x}px`);
	}

	const detail = current.state.options.drag.onMove(event, globals, current, {
		calculated: next,
		original: position,
	});

	const dispatched = dispatch(current.state.element, `${current.state.name}:move`, {
		detail,
	});

	setTimeout(() => {
		if (dispatched.defaultPrevented) {
			cancelDrag(current);
		}
	});
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	current?.state.options.drag.onEnd?.(event, globals, current, reset);
}

export function removeDraggable<
	Property extends keyof OuiDraggableInstances,
	Instance extends OuiDraggableInstances[Property],
>(
	this: {
		constructor: new (element: HTMLElement) => Instance;
		property: Property;
	},
	element: HTMLElement,
): void {
	const {property} = this;

	removeInstance(globals.instances, property, element);
	removeInstance(globals.states, property, element);
}

function removeInstance(
	map: WeakMap<HTMLElement, OuiDraggableInstances | OuiDraggableStates>,
	name: keyof OuiDraggableInstances | keyof OuiDraggableStates,
	element: HTMLElement,
): void {
	const instances = map.get(element);

	if (instances == null || instances[name] == null) {
		return;
	}

	if (typeof (instances[name] as OuiDraggable).destroy === 'function') {
		(instances[name] as OuiDraggable).destroy();
	}

	instances[name] = undefined;

	if (instances[properties[name]] == null) {
		map.delete(element);
	}
}

function reset(): void {
	current?.state.styling.remove();
	styleToggler.remove();

	current = undefined;

	globals.container = undefined;
	globals.element = undefined;
	globals.offset = undefined;
	globals.original = undefined;
}

function setContainer(item: OuiDraggableItem): void {
	const {container} = item.state.options.input ?? {};

	if (isHTMLOrSVGElement(container)) {
		setContainerElement(item, container);

		return;
	}

	const selector =
		container ?? getAttribute(item.instance.element, item.state.options.container.attribute);

	if (typeof selector !== 'string') {
		return;
	}

	const element = containers.has(selector)
		? item.state.element.ownerDocument.body
		: (document.querySelector(selector) ?? undefined);

	if (isHTMLOrSVGElement(element)) {
		setContainerElement(item, element);
	}
}

function setContainerElement(item: OuiDraggableItem, element: HTMLElement): void {
	item.state.container = element;

	const set = item.state.options.container.map.get(element);

	if (set == null) {
		item.state.options.container.map.set(element, new Set([item.instance]));
	} else {
		set.add(item.instance);
	}

	item.state.options.container.onInitialize?.(item);
}

function setDirection(item: OuiDraggableItem): void {
	const direction = getAttribute(item.state.element, item.state.options.direction.attribute);

	if (horizontals.has(direction as OuiDraggableDirection)) {
		item.state.vertical = false;
	} else if (verticals.has(direction as OuiDraggableDirection)) {
		item.state.horizontal = false;
	}

	item.state.options.direction.onAfter?.(item);
}

function unsetContainer(item: OuiDraggableItem): void {
	const {container} = item.state;

	if (container == null) {
		return;
	}

	const set = item.state.options.container.map.get(container);

	let empty = false;

	if (set != null) {
		set.delete(item.instance);

		if (set.size === 0) {
			empty = true;

			item.state.options.container.map.delete(container);
		}
	}

	item.state.options.container.onDestroy?.(item, container, empty);
}

// #endregion

// #region Variables

const ATTRIBUTE_MOVABLE = 'oui-movable';

const ATTRIBUTE_SORTABLE = 'oui-sortable';

const KEY_ESCAPE = 'Escape';

const SELECTOR = `[${ATTRIBUTE_MOVABLE}], [${ATTRIBUTE_SORTABLE}]`;

const SELECTOR_MOVABLE_HANDLE = `[${ATTRIBUTE_MOVABLE}-handle]`;

const SELECTOR_SORTABLE_HANDLE = `[${ATTRIBUTE_SORTABLE}-handle]`;

const SELECTOR_SORTABLE_ITEM = `[${ATTRIBUTE_SORTABLE}] > *`;

const containers = new Set<string>(['body', 'document', 'window']);

const horizontals = new Set<OuiDraggableDirection>(['horizontal', 'x']);

const properties: Record<keyof OuiDraggableInstances, keyof OuiDraggableInstances> = {
	movable: 'sortable',
	sortable: 'movable',
};

const globals: OuiDraggableGlobals = {
	container: undefined,
	element: undefined,
	instances: new WeakMap(),
	offset: undefined,
	original: undefined,
	states: new WeakMap(),
};

const styles = {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
};

const styleToggler = toggleStyles(document.body, styles);

const verticals = new Set<OuiDraggableDirection>(['vertical', 'y']);

let current: OuiDraggableItem | undefined;

// #endregion

// #region Initialization

on(document, 'keydown', onKeydown);
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup);
on(document, 'touchstart', onPointerdown, {passive: false});

// #endregion
