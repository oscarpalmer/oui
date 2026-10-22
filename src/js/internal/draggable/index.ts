import type {PlainObject} from '@oscarpalmer/atoms/models';
import {clamp} from '@oscarpalmer/atoms/number';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {setStyle, setStyles, toggleStyles} from '@oscarpalmer/toretto/style';
import {supportsTouch} from '@oscarpalmer/toretto/touch';
import {MOVABLE_ATTRIBUTE} from '../../movable/movable.model';
import {
	DRAGGABLE_KEY_ESCAPE,
	DRAGGABLE_SELECTOR,
	DRAGGABLE_SELECTOR_MOVABLE_HANDLE,
	DRAGGABLE_SELECTOR_SORTABLE_HANDLE,
	DRAGGABLE_SELECTOR_SORTABLE_ITEM,
	DRAGGABLE_SYMBOL,
	draggableContainers,
	draggableGlobals,
	draggableHorizontals,
	draggableProperties,
	draggableStyles,
	draggableStyleToggler,
	draggableVerticals,
	OuiDraggableEvent,
	type CreateOuiDraggableOptions,
	type OuiDraggable,
	type OuiDraggableBound,
	type OuiDraggableInstances,
	type OuiDraggableItem,
	type OuiDraggableOptions,
	type OuiDraggableState,
	type OuiDraggableStates,
} from './draggable.model';

// #region Functions

export function addDraggable<
	Property extends keyof OuiDraggableInstances,
	Instance extends OuiDraggableInstances[Property],
>(
	this: OuiDraggableBound<Property, Instance>,
	element: Element,
	options?: CreateOuiDraggableOptions,
): Instance {
	let instances = draggableGlobals.instances.get(element);

	if (instances == null) {
		instances = {};

		draggableGlobals.instances.set(element, instances);
	}

	instances[this.property] ??= new this.constructor(element, options);

	return instances[this.property] as Instance;
}

function cancelDrag(item?: OuiDraggableItem<{}>): void {
	if (item == null) {
		return;
	}

	item.state.options.drag.onCancel?.(item);

	dispatch(
		item.state.element,
		new OuiDraggableEvent(`oui-${item.state.name}:cancel`, {
			detail: {
				element: item.state.options.getOrigin()!,
			},
		}),
	);

	reset();
}

export function destroyDraggable<ExtraState extends PlainObject>(
	draggable: OuiDraggable<ExtraState>,
): void {
	const state = draggable[DRAGGABLE_SYMBOL];

	if (state.destroyed) {
		return;
	}

	state.destroyed = true;

	destroyInstance(draggable, state);
}

function destroyInstance<ExtraState extends PlainObject>(
	instance: OuiDraggable<ExtraState>,
	state: OuiDraggableState<ExtraState>,
): void {
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

export function getDraggableStates(element: Element): OuiDraggableStates | undefined {
	return draggableGlobals.states.get(element);
}

export function getDraggableElement<ExtraState extends PlainObject>(
	this: OuiDraggable<ExtraState>,
): Element {
	return this[DRAGGABLE_SYMBOL].element;
}

function getHandle(event: Event, isMovable: boolean): Element | null {
	return findAncestor(
		event,
		isMovable ? DRAGGABLE_SELECTOR_MOVABLE_HANDLE : DRAGGABLE_SELECTOR_SORTABLE_HANDLE,
	);
}

function getNextPosition(item: OuiDraggableItem<{}>, position: EventPosition): EventPosition {
	let x = draggableGlobals.original?.x ?? 0;
	let y = draggableGlobals.original?.y ?? 0;

	if (item.state.horizontal) {
		x = position.x - (draggableGlobals.offset?.x ?? 0);

		if (draggableGlobals.container != null && draggableGlobals.element != null) {
			x = clamp(
				x,
				draggableGlobals.container.left,
				draggableGlobals.container.right - draggableGlobals.element.rectangle.width,
			);
		}
	}

	if (item.state.vertical) {
		y = position.y - (draggableGlobals.offset?.y ?? 0);

		if (draggableGlobals.container != null && draggableGlobals.element != null) {
			y = clamp(
				y,
				draggableGlobals.container.top,
				draggableGlobals.container.bottom - draggableGlobals.element.rectangle.height,
			);
		}
	}

	return {x, y};
}

export function initializeDraggable<ExtraState extends PlainObject>(
	draggable: OuiDraggable<ExtraState>,
	name: keyof OuiDraggableStates,
	event: string,
	attribute: string,
	element: Element,
	options: OuiDraggableOptions<ExtraState>,
	extras: ExtraState,
): OuiDraggableState<ExtraState> {
	const state = {
		...extras,
		attribute,
		element,
		event,
		name,
		options,
		destroyed: false,
		horizontal: true,
		styling: toggleStyles(element, draggableStyles),
		vertical: true,
	} satisfies OuiDraggableState<ExtraState>;

	const item = {
		state,
		instance: draggable,
	};

	setContainer(item);
	setDirection(item);

	setAttribute(element, attribute, '');

	let states = draggableGlobals.states.get(element);

	states ??= {};

	states[state.name] = state as never;

	draggableGlobals.states.set(element, states);

	return state;
}

function onKeydown(event: KeyboardEvent): void {
	if (current != null && event.key === DRAGGABLE_KEY_ESCAPE) {
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

	const container = findAncestor(event, DRAGGABLE_SELECTOR);

	if (container == null) {
		return;
	}

	const instances = draggableGlobals.instances.get(container);
	const states = draggableGlobals.states.get(container);

	if (instances == null || states == null) {
		return;
	}

	const isMovable = container.hasAttribute(MOVABLE_ATTRIBUTE);

	const item = {
		instance: isMovable ? instances.movable : instances.sortable,
		state: isMovable ? states.movable : states.sortable,
	} as unknown as OuiDraggableItem<{}>;

	if (item.instance == null || item.state == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	let element: Element | null = container;

	if (!isMovable) {
		element = findAncestor(event, DRAGGABLE_SELECTOR_SORTABLE_ITEM);

		if (element?.parentElement !== container) {
			return;
		}
	}

	let handle: Element | null = element;

	item.state.hasHandles ??= element.querySelector(DRAGGABLE_SELECTOR_SORTABLE_HANDLE) != null;

	if (item.state.hasHandles) {
		handle = getHandle(event, isMovable);
	}

	if (handle == null) {
		return;
	}

	const dragged = item.state.options.getDragged();
	const rectangle = dragged.getBoundingClientRect();

	const position = getEventPosition(event) ?? {x: 0, y: 0};

	current = item;

	draggableGlobals.container = item.state.container?.getBoundingClientRect();

	draggableGlobals.element = {
		rectangle,
		node: dragged,
	};

	draggableGlobals.offset = item.state.options.position.getOffset(item, element, position);
	draggableGlobals.original = item.state.options.position.getOriginal(item, position);

	const dispatched = new OuiDraggableEvent(`oui-${item.state.name}:begin`, {
		detail: {
			element,
			position: {
				original: {...draggableGlobals.original},
			},
		},
	});

	if (dispatch(item.state.element, dispatched).defaultPrevented) {
		item.state.options.drag.onCancel?.(item);

		reset();

		return;
	}

	const next = getNextPosition(item, position);

	setStyles(dragged, {
		position: 'fixed',
		inset: `${next.y}px auto auto ${next.x}px`,
		transform: 'translate3d(0, 0, 0)',
	});

	item.state.options.drag.onBegin?.(event, item, element, handle, next);

	item.state.styling.set();
	draggableStyleToggler.set();
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	if (current == null) {
		return;
	}

	const position = getEventPosition(event);

	if (position == null) {
		return;
	}

	const next = getNextPosition(current, position);

	if (draggableGlobals.element != null) {
		setStyle(draggableGlobals.element.node, 'inset', `${next.y}px auto auto ${next.x}px`);
	}

	const dispatched = new OuiDraggableEvent(`oui-${current.state.name}:move`, {
		detail: {
			element: current.state.options.getOrigin()!,
			position: {
				next,
				original: position,
			},
		},
	});

	if (dispatch(current.state.element, dispatched).defaultPrevented) {
		cancelDrag(current);
	}
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	current?.state.options.drag.onEnd?.(event, current, reset);
}

export function removeDraggable<
	Property extends keyof OuiDraggableInstances,
	Instance extends OuiDraggableInstances[Property],
>(
	this: {
		constructor: new (element: Element) => Instance;
		property: Property;
	},
	element: Element,
): void {
	const {property} = this;

	removeInstance(draggableGlobals.instances, property, element);
	removeState(draggableGlobals.states, property, element);
}

function removeInstance(
	instances: WeakMap<Element, OuiDraggableInstances>,
	name: keyof OuiDraggableInstances,
	element: Element,
): void {
	removeStored(instances, name, element);
}

function removeState(
	map: WeakMap<Element, OuiDraggableStates>,
	name: keyof OuiDraggableStates,
	element: Element,
): void {
	removeStored(map, name, element);
}

function removeStored(
	map: WeakMap<Element, OuiDraggableInstances> | WeakMap<Element, OuiDraggableStates>,
	name: keyof OuiDraggableInstances | keyof OuiDraggableStates,
	element: Element,
): void {
	const stored = map.get(element);
	const item = stored?.[name];

	if (stored == null || item == null) {
		return;
	}

	const itemAsPlainObject = item as PlainObject;

	if (typeof itemAsPlainObject.destroy === 'function') {
		itemAsPlainObject.destroy();
	}

	stored[name] = undefined;

	if (stored[draggableProperties[name]] == null) {
		map.delete(element);
	}
}

function reset(): void {
	current?.state.styling.remove();
	draggableStyleToggler.remove();

	current = undefined;

	draggableGlobals.container = undefined;
	draggableGlobals.element = undefined;
	draggableGlobals.offset = undefined;
	draggableGlobals.original = undefined;
}

function setContainer<ExtraState extends PlainObject>(item: OuiDraggableItem<ExtraState>): void {
	const {container} = item.state.options.input ?? {};

	if (isHTMLOrSVGElement(container)) {
		setContainerElement(item, container);

		return;
	}

	const selector =
		container ?? getAttribute(item.state.element, item.state.options.container.attribute);

	if (typeof selector !== 'string') {
		return;
	}

	const element = draggableContainers.has(selector)
		? item.state.element.ownerDocument.body
		: (document.querySelector(selector) ?? undefined);

	if (isHTMLOrSVGElement(element)) {
		setContainerElement(item, element);
	}
}

function setContainerElement<ExtraState extends PlainObject>(
	item: OuiDraggableItem<ExtraState>,
	element: Element,
): void {
	item.state.container = element;

	const set = item.state.options.container.map.get(element);

	if (set == null) {
		item.state.options.container.map.set(element, new Set([item.instance]));
	} else {
		set.add(item.instance);
	}

	item.state.options.container.onInitialize?.(item);
}

function setDirection<ExtraState extends PlainObject>(item: OuiDraggableItem<ExtraState>): void {
	const direction = getAttribute(item.state.element, item.state.options.direction.attribute);

	if (draggableHorizontals.has(direction as never)) {
		item.state.vertical = false;
	} else if (draggableVerticals.has(direction as never)) {
		item.state.horizontal = false;
	}

	item.state.options.direction.onAfter?.(item);
}

function unsetContainer<ExtraState extends PlainObject>(item: OuiDraggableItem<ExtraState>): void {
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

let current: OuiDraggableItem<{}> | undefined;

// #endregion

// #region Initialization

on(document, 'keydown', onKeydown);
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup);
on(document, 'touchstart', onPointerdown, {passive: false});

// #endregion
