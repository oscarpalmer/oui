import type {EventPosition, PlainObject} from '@oscarpalmer/atoms/models';
import {clamp} from '@oscarpalmer/atoms/number';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {toggleStyles} from '@oscarpalmer/toretto/style';
import supportsTouch from '@oscarpalmer/toretto/touch';
import type {Movable} from '../movable';
import type {Sortable} from '../sortable';

// #region Types

type Direction = 'horizontal' | 'vertical' | 'x' | 'y';

export abstract class Draggable {
	container: HTMLElement | undefined;

	hasHandles: boolean | undefined;

	horizontal = true;

	vertical = true;

	abstract readonly dragged: HTMLElement;

	abstract origin: HTMLElement | undefined;

	constructor(
		public prefix: string,
		public element: HTMLElement,
		public options: DraggableOptions,
	) {
		setContainer(this, options);
		setDirection(this, options);
	}

	destroy(): void {
		unsetContainer(this, this.options);

		this.container = undefined;
		this.element = undefined!;
		this.options = undefined!;
	}
}

type DragBegin = (
	event: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	element: HTMLElement,
	handle: HTMLElement,
	position: EventPosition,
) => void;

type DragCancel = (state: DraggableState, draggable: Draggable) => void;

type DragEnd = (
	event: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	reset: () => void,
) => void;

type DragMove = (
	event: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	position: DragMovePosition,
) => PlainObject | undefined;

export type DragMovePosition = {
	calculated: EventPosition;
	original: EventPosition;
};

export type DraggableBound<
	Property extends keyof DraggableInstances = keyof DraggableInstances,
	Instance extends DraggableInstances[Property] = DraggableInstances[Property],
> = {
	constructor: new (element: HTMLElement) => Instance;
	property: Property;
};

type DraggableInstances = {
	movable?: Movable;
	sortable?: Sortable;
};

type DraggableOptions = {
	container: DraggableOptionsContainer;
	direction: DraggableOptionsDirection;
	drag: DraggableOptionsDrag;
	position: DraggableOptionsPosition;
};

type DraggableOptionsContainer = {
	attribute: string;
	map: Map<HTMLElement, Set<Draggable>>;
	onDestroy?: DraggableOptionsContainerOnDestroy;
	onInitialize?: DraggableOptionsContainerOnInitialize;
};

type DraggableOptionsContainerOnDestroy = (
	draggable: Draggable,
	container: HTMLElement,
	empty: boolean,
) => void;

type DraggableOptionsContainerOnInitialize = (draggable: Draggable) => void;

type DraggableOptionsDirection = {
	attribute: string;
	onAfter?: DraggableOptionsDirectionOnAfter;
};

type DraggableOptionsDirectionOnAfter = (draggable: Draggable) => void;

type DraggableOptionsDrag = {
	onBegin: DragBegin;
	onCancel: DragCancel;
	onEnd: DragEnd;
	onMove: DragMove;
};

type DraggableOptionsPosition = {
	getOffset: DraggableOptionsPositionGetOffset;
	getOriginal: DraggableOptionsPositionGetOriginal;
};

type DraggableOptionsPositionGetOffset = (
	state: DraggableState,
	draggable: Draggable,
	element: HTMLElement,
	position: EventPosition,
) => EventPosition;

type DraggableOptionsPositionGetOriginal = (
	state: DraggableState,
	draggable: Draggable,
	position: EventPosition,
) => EventPosition;

export type DraggableState = {
	container: DOMRect | undefined;
	element: DraggableStateElement | undefined;
	instances: WeakMap<HTMLElement, DraggableInstances>;
	offset: EventPosition | undefined;
	original: EventPosition | undefined;
};

type DraggableStateElement = {
	node: HTMLElement;
	rectangle: DOMRect;
};

// #endregion

// #region Functions

export function addDraggable<
	Property extends keyof DraggableInstances,
	Instance extends DraggableInstances[Property],
>(this: DraggableBound<Property, Instance>, element: HTMLElement): void {
	let instances = state.instances.get(element);

	if (instances == null) {
		instances = {};

		state.instances.set(element, instances);
	}

	instances[this.property] ??= new this.constructor(element);
}

function getHandle(event: Event, isMovable: boolean): HTMLElement | null {
	return findAncestor(
		event,
		isMovable ? SELECTOR_MOVABLE_HANDLE : SELECTOR_SORTABLE_HANDLE,
	) as HTMLElement;
}

function getNextPosition(draggable: Draggable, position: EventPosition): EventPosition {
	let x = state.original?.x ?? 0;
	let y = state.original?.y ?? 0;

	if (draggable.horizontal) {
		x = position.x - (state.offset?.x ?? 0);

		if (state.container != null && state.element != null) {
			x = clamp(x, state.container.left, state.container.right - state.element.rectangle.width);
		}
	}

	if (draggable.vertical) {
		y = position.y - (state.offset?.y ?? 0);

		if (state.container != null && state.element != null) {
			y = clamp(y, state.container.top, state.container.bottom - state.element.rectangle.height);
		}
	}

	return {x, y};
}

function onKeydown(event: KeyboardEvent): void {
	if (current == null || event.key !== KEY_ESCAPE) {
		return;
	}

	const {origin} = current;

	current.options.drag.onCancel?.(state, current);

	current.element.dispatchEvent(
		new CustomEvent(`${current.prefix}:cancel`, {
			detail: {
				element: origin,
			},
		}),
	);

	reset();
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
	const instances = state.instances.get(container!);

	if (instances == null) {
		return;
	}

	const isMovable = container.hasAttribute(ATTRIBUTE_MOVABLE);

	const instance = isMovable ? instances.movable : instances.sortable;

	if (instance == null) {
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

	instance.hasHandles ??= element.querySelector(SELECTOR_SORTABLE_HANDLE) != null;

	if (instance.hasHandles) {
		handle = getHandle(event, isMovable);
	}

	if (handle == null) {
		return;
	}

	const {dragged} = instance;

	const rectangle = dragged.getBoundingClientRect();

	const position = getPosition(event) ?? {x: 0, y: 0};

	current = instance;

	state.container = instance.container?.getBoundingClientRect();

	state.element = {
		rectangle,
		node: dragged,
	};

	state.offset = instance.options.position.getOffset(state, instance, element, position);
	state.original = instance.options.position.getOriginal(state, instance, position);

	const begin = new CustomEvent(`${instance.prefix}:begin`, {
		detail: {
			element,
			position: {...state.original},
		},
		cancelable: true,
	});

	instance.element.dispatchEvent(begin);

	setTimeout(() => {
		if (begin.defaultPrevented) {
			current?.options.drag.onCancel(state, instance);

			reset();

			return;
		}

		const next = getNextPosition(instance, position);

		dragged.style.position = 'fixed';
		dragged.style.inset = `${next.y}px auto auto ${next.x}px`;

		instance.options.drag.onBegin(event, state, instance, element, handle, next);

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

	if (state.element != null) {
		state.element.node.style.inset = `${next.y}px auto auto ${next.x}px`;
	}

	const detail = current.options.drag.onMove(event, state, current, {
		calculated: next,
		original: position,
	});

	current.element.dispatchEvent(
		new CustomEvent(`${current.prefix}:move`, {
			detail,
		}),
	);
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	current?.options.drag.onEnd?.(event, state, current, reset);
}

export function removeDraggable<
	Property extends keyof DraggableInstances,
	Instance extends DraggableInstances[Property],
>(
	this: {
		constructor: new (element: HTMLElement) => Instance;
		property: Property;
	},
	element: HTMLElement,
): void {
	const {property} = this;

	const instances = state.instances.get(element);

	if (instances == null || instances[property] == null) {
		return;
	}

	instances[property]?.destroy();

	instances[property] = undefined;

	if (instances[properties[property]] == null) {
		state.instances.delete(element);
	}
}

function reset(): void {
	current = undefined;

	state.container = undefined;
	state.element = undefined;
	state.offset = undefined;
	state.original = undefined;

	styleToggler.remove();
}

function setContainer(draggable: Draggable, options: DraggableOptions): void {
	const selector = draggable.element.getAttribute(options.container.attribute);

	if (typeof selector !== 'string') {
		return;
	}

	draggable.container = globals.has(selector)
		? draggable.element.ownerDocument.body
		: (document.querySelector(selector) ?? undefined);

	if (draggable.container == null) {
		return;
	}

	const set = options.container.map.get(draggable.container);

	if (set == null) {
		options.container.map.set(draggable.container, new Set([draggable]));
	} else {
		set.add(draggable);
	}

	options.container.onInitialize?.(draggable);
}

function setDirection(draggable: Draggable, options: DraggableOptions): void {
	const direction = draggable.element.getAttribute(options.direction.attribute);

	if (horizontals.has(direction as Direction)) {
		draggable.vertical = false;
	} else if (verticals.has(direction as Direction)) {
		draggable.horizontal = false;
	}

	options.direction.onAfter?.(draggable);
}

function unsetContainer(draggable: Draggable, options: DraggableOptions): void {
	const {container} = draggable;

	if (container == null) {
		return;
	}

	const set = options.container.map.get(container);

	let empty = false;

	if (set != null) {
		set.delete(draggable);

		if (set.size === 0) {
			empty = true;

			options.container.map.delete(container);
		}
	}

	options.container.onDestroy?.(draggable, container, empty);
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

const globals = new Set<string>(['body', 'document', 'window']);

const horizontals = new Set<Direction>(['horizontal', 'x']);

const properties: Record<keyof DraggableInstances, keyof DraggableInstances> = {
	movable: 'sortable',
	sortable: 'movable',
};

const state: DraggableState = {
	container: undefined,
	element: undefined,
	instances: new WeakMap(),
	offset: undefined,
	original: undefined,
};

const styleToggler = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

const verticals = new Set<Direction>(['vertical', 'y']);

let current: Movable | Sortable | undefined;

// #endregion

// #region Initialization

on(document, 'keydown', onKeydown);
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup, {passive: false});
on(document, 'touchstart', onPointerdown, {passive: false});

// #endregion
