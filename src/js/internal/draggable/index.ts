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
	type CreateOuiDraggableOptions,
	type OuiDraggable,
	type OuiDraggableBound,
	type OuiDraggableDirection,
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
	element: HTMLElement,
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

function cancelDrag(item?: OuiDraggableItem): void {
	if (item == null) {
		return;
	}

	item.state.options.drag.onCancel?.(draggableGlobals, item);

	dispatch(item.state.element, `oui:${item.state.name}:cancel`, {
		detail: {
			element: item.state.options.getOrigin(),
		},
	});

	reset();
}

export function destroyDraggable(draggable: OuiDraggable): void {
	const state = draggable[DRAGGABLE_SYMBOL];

	if (state.destroyed) {
		return;
	}

	state.destroyed = true;

	destroyInstance(draggable, state);
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
	return draggableGlobals.states.get(element);
}

export function getDraggableElement(this: OuiDraggable): HTMLElement {
	return this[DRAGGABLE_SYMBOL].element;
}

function getHandle(event: Event, isMovable: boolean): HTMLElement | null {
	return findAncestor(
		event,
		isMovable ? DRAGGABLE_SELECTOR_MOVABLE_HANDLE : DRAGGABLE_SELECTOR_SORTABLE_HANDLE,
	) as HTMLElement;
}

function getNextPosition(item: OuiDraggableItem, position: EventPosition): EventPosition {
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

export function initializeDraggable<ExtraState extends PlainObject = PlainObject>(
	draggable: OuiDraggable,
	name: keyof OuiDraggableStates,
	event: string,
	attribute: string,
	element: HTMLElement,
	options: OuiDraggableOptions<ExtraState>,
	extras: ExtraState,
): OuiDraggableState & ExtraState {
	const state = {
		...extras,
		attribute,
		element,
		event,
		name,
		options,
		horizontal: true,
		vertical: true,
		destroyed: false,
		styling: toggleStyles(element, draggableStyles),
	} as OuiDraggableState & ExtraState;

	const item = {
		state,
		instance: draggable,
	};

	setContainer(item);
	setDirection(item);

	setAttribute(element, attribute, '');

	let states = draggableGlobals.states.get(element);

	states ??= {};

	states[state.name] = state;

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

	const container = findAncestor(event, DRAGGABLE_SELECTOR)! as HTMLElement;

	const instances = draggableGlobals.instances.get(container!);
	const states = draggableGlobals.states.get(container);

	if (instances == null || states == null) {
		return;
	}

	const isMovable = container.hasAttribute(MOVABLE_ATTRIBUTE);

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
		element = findAncestor(event, DRAGGABLE_SELECTOR_SORTABLE_ITEM) as HTMLElement;

		if (element == null || element.parentElement !== container) {
			return;
		}
	}

	let handle: HTMLElement | null = element;

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

	draggableGlobals.offset = item.state.options.position.getOffset(
		draggableGlobals,
		item,
		element,
		position,
	);
	draggableGlobals.original = item.state.options.position.getOriginal(
		draggableGlobals,
		item,
		position,
	);

	if (
		dispatch(item.state.element, `oui:${item.state.name}:begin`, {
			detail: {
				element,
				position: {...draggableGlobals.original},
			},
		}).defaultPrevented
	) {
		item.state.options.drag.onCancel?.(draggableGlobals, item);

		reset();

		return;
	}

	const next = getNextPosition(item, position);

	setStyles(dragged, {
		position: 'fixed',
		inset: `${next.y}px auto auto ${next.x}px`,
		transform: 'translate3d(0, 0, 0)',
	});

	item.state.options.drag.onBegin?.(event, draggableGlobals, item, element, handle, next);

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

	const detail = current.state.options.drag.onMove(event, draggableGlobals, current, {
		calculated: next,
		original: position,
	});

	if (
		dispatch(current.state.element, `oui:${current.state.name}:move`, {
			detail,
		}).defaultPrevented
	) {
		cancelDrag(current);
	}
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	current?.state.options.drag.onEnd?.(event, draggableGlobals, current, reset);
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

	removeInstance(draggableGlobals.instances, property, element);
	removeInstance(draggableGlobals.states, property, element);
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

	if (instances[draggableProperties[name]] == null) {
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

function setContainer(item: OuiDraggableItem): void {
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

	if (draggableHorizontals.has(direction as OuiDraggableDirection)) {
		item.state.vertical = false;
	} else if (draggableVerticals.has(direction as OuiDraggableDirection)) {
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
