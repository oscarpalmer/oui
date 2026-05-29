import type {EventPosition, PlainObject} from '@oscarpalmer/atoms/models';
import {createElement} from '@oscarpalmer/toretto/create';
import {getPosition} from '@oscarpalmer/toretto/event';
import {findAncestor, getElementFromPosition} from '@oscarpalmer/toretto/find';
import {attributable} from './internal/attributable';
import {
	addDraggable,
	Draggable,
	removeDraggable,
	type DraggableBound,
	type DraggableState,
	type DragMovePosition,
} from './internal/draggable';

// #region Types

export class Sortable extends Draggable {
	connections: string | null;

	origin: HTMLElement | undefined;

	get dragged(): HTMLElement {
		return getDragPlaceholder();
	}

	constructor(element: HTMLElement) {
		super('sort', element, {
			container: {
				attribute: ATTRIBUTE_CONTAINER,
				map: CONTAINERS,
			},
			direction: {
				attribute: ATTRIBUTE_DIRECTION,
			},
			drag: {
				onBegin,
				onCancel,
				onEnd,
				onMove,
			},
			position: {
				getOffset: getOffsetPosition,
				getOriginal: getOriginalPosition,
			},
		});

		this.connections = this.element.getAttribute(ATTRIBUTE_CONNECTIONS);
	}
}

type SortablePlaceholder = {
	drag: SortablePlaceholderDrag;
	position: HTMLElement | undefined;
};

type SortablePlaceholderDrag = {
	custom: HTMLElement | undefined;
	default: HTMLElement | undefined;
};

// #endregion

// #region Functions

function afterEnd(
	insert: 'append' | 'insert' | 'prepend' | undefined,
	from: Sortable,
	events: CustomEvent[],
	elements: {origin?: HTMLElement; target: HTMLElement},
	position: EventPosition | undefined,
	valid: boolean,
): void {
	elements.origin?.removeAttribute(ATTRIBUTE_ORIGIN);

	from.origin = undefined;

	resetPlaceholders();

	if (!valid || events.some(event => event.defaultPrevented)) {
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
		insertion = INSERT_BEFORE;
	} else {
		insertion = INSERT_AFTER;
	}

	elements.target?.insertAdjacentElement(insertion, elements.origin!);

	document.body.removeAttribute(ATTRIBUTE_ACTIVE);
}

function getDragPlaceholder(): HTMLElement {
	placeholder.drag.default ??= createElement('div');

	return placeholder.drag.custom ?? placeholder.drag.default;
}

function getOffsetPosition(
	_: DraggableState,
	draggable: Draggable,
	element: HTMLElement,
	position: EventPosition,
): EventPosition {
	const rectangle = element.getBoundingClientRect();

	return {
		x: draggable.horizontal ? 0 : position.x - rectangle.left,
		y: draggable.vertical ? 0 : position.y - rectangle.top,
	};
}

function getOriginalPosition(
	_: DraggableState,
	__: Draggable,
	position: EventPosition,
): EventPosition {
	return position;
}

function getPositionPlaceholder(sortable: Sortable): HTMLElement {
	placeholder.position ??= createElement('div');

	placeholder.position.setAttribute(ATTRIBUTE_PLACEHOLDER_POSITION, '');

	if (sortable.origin != null) {
		placeholder.position.style.setProperty(
			'--placeholder-height',
			`${sortable.origin.getBoundingClientRect().height}px`,
		);
	}

	return placeholder.position;
}

function onBegin(
	_: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	element: HTMLElement,
): void {
	const sortable = draggable as Sortable;

	sortable.origin = element;

	setPlaceholder(state, sortable, element);

	element.setAttribute(ATTRIBUTE_ORIGIN, '');

	document.body.setAttribute(ATTRIBUTE_ACTIVE, '');
}

function onCancel(_: DraggableState, draggable: Draggable): void {
	const sortable = draggable as Sortable;

	const {origin} = sortable;

	origin?.removeAttribute(ATTRIBUTE_ORIGIN);

	document.body.removeAttribute(ATTRIBUTE_ACTIVE);

	resetPlaceholders();

	sortable.origin = undefined;
}

function onEnd(
	event: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	reset: () => void,
): void {
	const from = draggable as Sortable;
	const {origin} = from;

	const position = getPosition(event) ?? {x: 0, y: 0};

	const target = getElementFromPosition(position)[0];

	let element = findAncestor(target, SELECTOR_ITEM) as HTMLElement;

	if (element?.hasAttribute(ATTRIBUTE_PLACEHOLDER_POSITION)) {
		const position = element.getAttribute(ATTRIBUTE_PLACEHOLDER_POSITION);

		if (position === 'after') {
			element = element.previousElementSibling as HTMLElement;
		} else {
			element = element.nextElementSibling as HTMLElement;
		}
	}

	let insert: 'append' | 'insert' | 'prepend' | undefined = 'insert';
	let to: Sortable | undefined;

	if (element == null) {
		element = findAncestor(target, SELECTOR) as HTMLElement;

		to = state.instances.get(element)?.sortable;

		insert = element == null ? undefined : element.children.length === 0 ? 'append' : 'prepend';
	} else {
		to = state.instances.get(element.parentElement!)?.sortable;
	}

	const valid = insert != null && validatePosition(state, from, to, position);

	const detail = valid
		? {
				from: {
					element: origin,
					position: {...state.original},
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

	const fromEvent = new CustomEvent(EVENT_END, options);
	const toEvent = new CustomEvent(EVENT_END, options);

	from.element.dispatchEvent(fromEvent);

	if (from !== to) {
		to?.element.dispatchEvent(toEvent);
	}

	setTimeout(() => {
		afterEnd(insert, from, [fromEvent, toEvent], {origin, target: element}, position, valid);

		reset();
	});
}

function onMove(
	event: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	position: DragMovePosition,
): PlainObject | undefined {
	const from = draggable as Sortable;

	const fromElement = from.origin;
	const toElement = findAncestor(event, SELECTOR_ITEM) as HTMLElement;

	let to: Sortable | undefined;

	if (toElement == null) {
		to = state.instances.get(findAncestor(event, SELECTOR) as HTMLElement)?.sortable;
	} else {
		to = state.instances.get(toElement.parentElement!)?.sortable;
	}

	if (!validatePosition(state, from, to, position.original)) {
		return;
	}

	const placeholder = getPositionPlaceholder(from);

	if (toElement != null && toElement !== fromElement) {
		const {height, top} = toElement.getBoundingClientRect();

		let place: 'after' | 'before';

		if (position.calculated.y < top + height / 2) {
			place = 'before';

			toElement.insertAdjacentElement(INSERT_BEFORE, placeholder);
		} else {
			place = 'after';

			toElement.insertAdjacentElement(INSERT_AFTER, placeholder);
		}

		placeholder.setAttribute(ATTRIBUTE_PLACEHOLDER_POSITION, place);
	} else {
		placeholder.remove();
	}

	return {
		from: {
			element: fromElement,
			position: {...state.original},
		},
		to: {
			element: toElement,
			position: {...position.calculated},
		},
	};
}

function resetPlaceholders(): void {
	placeholder.drag.custom?.remove();
	placeholder.drag.default?.remove();
	placeholder.position?.remove();

	placeholder.drag.custom = undefined;
}

function setPlaceholder(state: DraggableState, sortable: Sortable, origin: HTMLElement): void {
	const element = getDragPlaceholder();

	placeholder.drag.default!.innerHTML = '';

	updatePlaceholder(sortable, element);

	const event = new CustomEvent(EVENT_PLACEHOLDER, {
		cancelable: true,
		detail: {
			origin,
			parent: sortable.element,
			placeholder: element,
			create: (value: unknown) => {
				if (!(value instanceof HTMLElement)) {
					return;
				}

				placeholder.drag.custom = value;

				updatePlaceholder(sortable, value);

				state.element = {
					rectangle: value.getBoundingClientRect(),
					node: value,
				};
			},
		},
	});

	sortable.element.dispatchEvent(event);

	setTimeout(() => {
		if (!event.defaultPrevented && placeholder.drag.custom == null) {
			placeholder.drag.default?.append(element.cloneNode(true));
		}

		document.body.append(placeholder.drag.custom ?? placeholder.drag.default ?? '');
	});
}

function updatePlaceholder(sortable: Sortable, element: HTMLElement): void {
	element.style.position = 'fixed';

	element.setAttribute(ATTRIBUTE_PLACEHOLDER_DRAG, '');

	if (sortable.horizontal) {
		element.setAttribute(ATTRIBUTE_HORIZONTAL, '');
	} else {
		element.removeAttribute(ATTRIBUTE_HORIZONTAL);
	}

	if (sortable.vertical) {
		element.setAttribute(ATTRIBUTE_VERTICAL, '');
	} else {
		element.removeAttribute(ATTRIBUTE_VERTICAL);
	}
}

function validatePosition(
	_: DraggableState,
	from: Sortable,
	to: Sortable | undefined,
	position: EventPosition,
): boolean {
	let valid = true;

	const rectangle = from.origin?.getBoundingClientRect();

	if (rectangle != null && !from.horizontal) {
		valid = position.x >= rectangle.left && position.x <= rectangle.right;
	}

	if (valid && rectangle != null && !from.vertical) {
		valid = position.y >= rectangle.top && position.y <= rectangle.bottom;
	}

	if (valid && from.connections != null) {
		valid = to?.element.matches(from.connections) ?? true;
	}

	if (valid && to?.connections != null) {
		valid = from.element.matches(to.connections);
	}

	return valid;
}

// #endregion

// #region Variables

const ATTRIBUTE = 'oui-sortable';

const ATTRIBUTE_ACTIVE = `${ATTRIBUTE}-active`;

const ATTRIBUTE_CONNECTIONS = `${ATTRIBUTE}-connections`;

const ATTRIBUTE_CONTAINER = `${ATTRIBUTE}-container`;

const ATTRIBUTE_DIRECTION = `${ATTRIBUTE}-direction`;

const ATTRIBUTE_HORIZONTAL = `${ATTRIBUTE}-horizontal`;

const ATTRIBUTE_ORIGIN = `${ATTRIBUTE}-origin`;

const ATTRIBUTE_PLACEHOLDER_DRAG = `${ATTRIBUTE}-placeholder-drag`;

const ATTRIBUTE_PLACEHOLDER_POSITION = `${ATTRIBUTE}-placeholder-position`;

const ATTRIBUTE_VERTICAL = `${ATTRIBUTE}-vertical`;

const CONTAINERS = new Map<HTMLElement, Set<Sortable>>();

const EVENT_END = 'sort:end';

const EVENT_PLACEHOLDER = 'sort:placeholder';

const INSERT_AFTER = 'afterend';

const INSERT_BEFORE = 'beforebegin';

const SELECTOR = `[${ATTRIBUTE}]`;

const SELECTOR_ITEM = `[${ATTRIBUTE}] > *`;

const bound: DraggableBound = {
	constructor: Sortable,
	property: 'sortable',
};

const placeholder: SortablePlaceholder = {
	drag: {
		custom: undefined,
		default: undefined,
	},
	position: undefined,
};

// #endregion

// #region Initialization

attributable(ATTRIBUTE, addDraggable.bind(bound), removeDraggable.bind(bound));

// #endregion
