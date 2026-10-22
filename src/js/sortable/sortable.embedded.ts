import type {PlainObject} from '@oscarpalmer/atoms/models';
import {getAttribute, setAttribute, setAttributes} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {dispatch, getEventPosition} from '@oscarpalmer/toretto/event';
import {findAncestor, getElementFromPosition} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {EventPosition} from '@oscarpalmer/toretto/models';
import {setStyle} from '@oscarpalmer/toretto/style';
import {attributable} from '../internal/attributable';
import {
	DRAGGABLE_SYMBOL,
	draggableGlobals,
	type CreateOuiDraggableOptions,
	type OuiDraggableBound,
	type OuiDraggableItem,
	type OuiDraggableState,
	type OuiDragMovePosition,
} from '../internal/draggable/draggable.model';
import {
	addDraggable,
	destroyDraggable,
	getDraggableElement,
	getDraggableStates,
	initializeDraggable,
	removeDraggable,
} from '../internal/draggable/index';
import {
	SORTABLE_ATTRIBUTE,
	SORTABLE_ATTRIBUTE_ACTIVE,
	SORTABLE_ATTRIBUTE_CONNECTIONS,
	SORTABLE_ATTRIBUTE_CONTAINER,
	SORTABLE_ATTRIBUTE_DIRECTION,
	SORTABLE_ATTRIBUTE_HORIZONTAL,
	SORTABLE_ATTRIBUTE_ORIGIN,
	SORTABLE_ATTRIBUTE_PLACEHOLDER_DRAG,
	SORTABLE_ATTRIBUTE_PLACEHOLDER_POSITION,
	SORTABLE_ATTRIBUTE_VERTICAL,
	SORTABLE_CONTAINERS,
	SORTABLE_EVENT_END,
	SORTABLE_EVENT_PLACEHOLDER,
	SORTABLE_MESSAGE,
	SORTABLE_SELECTOR_ITEM,
	sortablePlaceholder,
	type OuiSortable,
	type OuiSortableState,
} from './sortable.model';

// #region Instances

function OuiSortable(
	this: OuiSortable,
	element: Element,
	options?: CreateOuiDraggableOptions,
): void {
	this[DRAGGABLE_SYMBOL] = initializeDraggable(
		this,
		'sortable',
		'sort',
		SORTABLE_ATTRIBUTE,
		element,
		{
			container: {
				attribute: SORTABLE_ATTRIBUTE_CONTAINER,
				map: SORTABLE_CONTAINERS,
			},
			direction: {
				attribute: SORTABLE_ATTRIBUTE_DIRECTION,
			},
			drag: {
				onBegin,
				onCancel,
				onEnd,
				onMove,
			},
			input: options,
			position: {
				getOffset: getOffsetPosition,
				getOriginal: getOriginalPosition,
			},
			getDragged: getDragPlaceholder,
			getOrigin: () => getState(element)?.origin,
		},
		{
			connections: getAttribute(element, SORTABLE_ATTRIBUTE_CONNECTIONS),
		},
	);
}

OuiSortable.prototype.destroy = destroySortable;

Object.defineProperties(OuiSortable.prototype, {
	element: {
		enumerable: true,
		get: getDraggableElement,
	},
});

// #endregion

// #region Functions

function afterEnd(
	insert: 'append' | 'insert' | 'prepend' | undefined,
	from: OuiDraggableItem<OuiSortableState>,
	events: [CustomEvent, CustomEvent | undefined],
	elements: {origin?: Element; target: Element},
	position: EventPosition | undefined,
	valid: boolean,
): void {
	elements.origin?.removeAttribute(SORTABLE_ATTRIBUTE_ORIGIN);

	from.state.origin = undefined;

	resetPlaceholders();

	if (!valid || events.some(event => event?.defaultPrevented)) {
		return;
	}

	if (insert !== 'insert') {
		elements.target.append(elements.origin!);

		return;
	}

	if (position == null) {
		return;
	}

	const {height, top} = elements.target.getBoundingClientRect();

	let insertion: 'afterend' | 'beforebegin';

	if (position.y < top + height / 2) {
		insertion = 'beforebegin';
	} else {
		insertion = 'afterend';
	}

	elements.target?.insertAdjacentElement(insertion, elements.origin!);

	document.body.removeAttribute(SORTABLE_ATTRIBUTE_ACTIVE);
}

/**
 * Creates _(or retrieves)_ a _OuiSortable_ instance for an element
 *
 * @param element Element to make sortable
 * @returns _OuiSortable_ instance
 */
export function createSortable(element: Element, options?: CreateOuiDraggableOptions): OuiSortable {
	if (!isHTMLOrSVGElement(element)) {
		throw new TypeError(SORTABLE_MESSAGE);
	}

	return addSortable(element, options) as OuiSortable;
}

function destroySortable(this: OuiSortable): void {
	destroyDraggable(this);
}

function getDragPlaceholder(): Element {
	sortablePlaceholder.drag.default ??= createElement('div');

	return sortablePlaceholder.drag.custom ?? sortablePlaceholder.drag.default;
}

function getInstance(element?: Element | null): OuiSortable | undefined {
	return element == null ? undefined : draggableGlobals.instances.get(element)?.sortable;
}

function getOffsetPosition(
	item: OuiDraggableItem<OuiSortableState>,
	element: Element,
	position: EventPosition,
): EventPosition {
	const rectangle = element.getBoundingClientRect();

	return {
		x: item.state.horizontal ? 0 : position.x - rectangle.left,
		y: item.state.vertical ? 0 : position.y - rectangle.top,
	};
}

function getOriginalPosition(
	__: OuiDraggableItem<OuiSortableState>,
	position: EventPosition,
): EventPosition {
	return position;
}

function getPositionPlaceholder(item: OuiDraggableItem<OuiSortableState>): Element {
	sortablePlaceholder.position ??= createElement('div');

	setAttribute(sortablePlaceholder.position, SORTABLE_ATTRIBUTE_PLACEHOLDER_POSITION, '');

	if (item.state.origin != null) {
		setStyle(
			sortablePlaceholder.position,
			'--placeholder-height',
			`${item.state.origin.getBoundingClientRect().height}px`,
		);
	}

	return sortablePlaceholder.position;
}

function getState(element?: Element | null): OuiDraggableState<OuiSortableState> | undefined {
	return element == null
		? undefined
		: (draggableGlobals.states.get(element)?.sortable as
				| OuiDraggableState<OuiSortableState>
				| undefined);
}

function onBegin(
	_: MouseEvent | TouchEvent,
	item: OuiDraggableItem<OuiSortableState>,
	element: Element,
): void {
	item.state.origin = element;

	setPlaceholder(item, element);

	setAttribute(element, SORTABLE_ATTRIBUTE_ORIGIN, '');

	setAttribute(document.body, SORTABLE_ATTRIBUTE_ACTIVE, '');
}

function onCancel(item: OuiDraggableItem<OuiSortableState>): void {
	item.state.origin?.removeAttribute(SORTABLE_ATTRIBUTE_ORIGIN);

	document.body.removeAttribute(SORTABLE_ATTRIBUTE_ACTIVE);

	resetPlaceholders();

	item.state.origin = undefined;
}

function onEnd(
	event: MouseEvent | TouchEvent,
	item: OuiDraggableItem<OuiSortableState>,
	reset: () => void,
): void {
	const {original} = draggableGlobals;
	const {origin} = item.state;

	const position = getEventPosition(event) ?? {x: 0, y: 0};
	const [target] = getElementFromPosition(position);

	let element: Element | null | undefined = findAncestor(target, SORTABLE_SELECTOR_ITEM);

	const attribute = element?.getAttribute(SORTABLE_ATTRIBUTE_PLACEHOLDER_POSITION);

	if (attribute != null && attribute === 'after') {
		element = element?.previousElementSibling;
	} else if (attribute != null) {
		element = element?.nextElementSibling;
	}

	let insert: 'append' | 'insert' | 'prepend' | undefined = 'insert';
	let instance: OuiSortable | undefined;
	let state: OuiDraggableState<OuiSortableState> | undefined;

	if (element == null) {
		element = findAncestor(target, SORTABLE_SELECTOR_ITEM);

		instance = getInstance(element);
		state = getState(element);

		insert = element == null ? undefined : element.children.length === 0 ? 'append' : 'prepend';
	} else {
		instance = getInstance(element.parentElement);
		state = getState(element.parentElement);
	}

	if (element == null || instance == null || state == null) {
		return;
	}

	const valid = insert != null && validatePosition(item, {instance, state}, position);

	const detail = valid
		? {
				from: {
					element: origin,
					position: {...original},
				},
				to: {
					element: element,
					position: {...position},
				},
			}
		: undefined;

	const options = {
		detail,
		bubbles: false,
		cancelable: true,
	};

	const dispatchedFrom = dispatch(item.instance.element, SORTABLE_EVENT_END, options);

	let dispatchedTo: CustomEvent | undefined;

	if (item.instance !== instance && instance != null) {
		dispatchedTo = dispatch(instance.element, SORTABLE_EVENT_END, options);
	}

	setTimeout(() => {
		afterEnd(
			insert,
			item,
			[dispatchedFrom, dispatchedTo],
			{origin, target: element},
			position,
			valid,
		);

		reset();
	});
}

function onMove(
	event: MouseEvent | TouchEvent,
	item: OuiDraggableItem<OuiSortableState>,
	position: OuiDragMovePosition,
): PlainObject | undefined {
	const {original} = draggableGlobals;

	const fromElement = item.state.origin;
	const toElement = findAncestor(event, SORTABLE_SELECTOR_ITEM);

	let instance: OuiSortable | undefined;
	let state: OuiDraggableState<OuiSortableState> | undefined;

	if (toElement == null) {
		const element = findAncestor(event, SORTABLE_SELECTOR_ITEM);

		instance = getInstance(element);
		state = getState(element);
	} else {
		instance = getInstance(toElement.parentElement);
		state = getState(toElement.parentElement);
	}

	if (
		instance == null ||
		state == null ||
		!validatePosition(item, {instance, state}, position.original)
	) {
		return;
	}

	const placeholder = getPositionPlaceholder(item);

	if (toElement != null && toElement !== fromElement) {
		const {height, top} = toElement.getBoundingClientRect();

		let place: 'after' | 'before';

		if (position.calculated.y < top + height / 2) {
			place = 'before';

			toElement.insertAdjacentElement('beforebegin', placeholder);
		} else {
			place = 'after';

			toElement.insertAdjacentElement('afterend', placeholder);
		}

		setAttribute(placeholder, SORTABLE_ATTRIBUTE_PLACEHOLDER_POSITION, place);
	} else {
		placeholder.remove();
	}

	return {
		from: {
			element: fromElement,
			position: {...original},
		},
		to: {
			element: toElement,
			position: {...position.calculated},
		},
	};
}

function resetPlaceholders(): void {
	sortablePlaceholder.drag.custom?.remove();
	sortablePlaceholder.drag.default?.remove();
	sortablePlaceholder.position?.remove();

	sortablePlaceholder.drag.custom = undefined;
}

function setPlaceholder(item: OuiDraggableItem<OuiSortableState>, origin: Element): void {
	const element = getDragPlaceholder();

	if (sortablePlaceholder.drag.default != null) {
		sortablePlaceholder.drag.default.innerHTML = '';
	}

	updatePlaceholder(item, element);

	const dispatched = dispatch(item.instance.element, SORTABLE_EVENT_PLACEHOLDER, {
		detail: {
			origin,
			parent: item.instance.element,
			placeholder: element,
			create: (value: unknown) => {
				if (!isHTMLOrSVGElement(value)) {
					return;
				}

				const element = value;

				sortablePlaceholder.drag.custom = element;

				updatePlaceholder(item, element);

				draggableGlobals.element = {
					rectangle: element.getBoundingClientRect(),
					node: element,
				};
			},
		},
	});

	setTimeout(() => {
		if (!dispatched.defaultPrevented && sortablePlaceholder.drag.custom == null) {
			sortablePlaceholder.drag.default?.append(element.cloneNode(true));
		}

		document.body.append(sortablePlaceholder.drag.custom ?? sortablePlaceholder.drag.default ?? '');
	});
}

function updatePlaceholder(item: OuiDraggableItem<OuiSortableState>, element: Element): void {
	setAttribute(element, SORTABLE_ATTRIBUTE_PLACEHOLDER_DRAG, '');
	setStyle(element, 'position', 'fixed');

	const state = getDraggableStates(item.state.element)?.sortable;

	if (state == null) {
		return;
	}

	setAttributes(element, {
		[SORTABLE_ATTRIBUTE_HORIZONTAL]: state.horizontal ? '' : undefined,
		[SORTABLE_ATTRIBUTE_VERTICAL]: state.vertical ? '' : undefined,
	});
}

function validatePosition(
	from: OuiDraggableItem<OuiSortableState>,
	to: OuiDraggableItem<OuiSortableState> | undefined,
	position: EventPosition,
): boolean {
	let valid = true;

	const rectangle = from.state.origin?.getBoundingClientRect();

	const fromState = getDraggableStates(from.state.element)?.sortable;

	if (rectangle != null && !(fromState?.horizontal ?? true)) {
		valid = position.x >= rectangle.left && position.x <= rectangle.right;
	}

	if (valid && rectangle != null && !(fromState?.vertical ?? true)) {
		valid = position.y >= rectangle.top && position.y <= rectangle.bottom;
	}

	if (valid && from.state.connections != null) {
		valid = to?.state.element.matches(from.state.connections) ?? true;
	}

	if (valid && to?.state.connections != null) {
		valid = from.state.element.matches(to.state.connections);
	}

	return valid;
}

// #endregion

// #region Variables

const bound: OuiDraggableBound = {
	// @ts-expect-error All good, no worries :-)
	constructor: OuiSortable,
	property: 'sortable',
};

const addSortable = addDraggable.bind(bound);

const removeSortable = removeDraggable.bind(bound);

// #endregion

// #region Initialization

attributable(SORTABLE_ATTRIBUTE, addSortable, removeSortable);

// #endregion
