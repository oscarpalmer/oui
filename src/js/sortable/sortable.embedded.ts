import type {EventPosition, PlainObject} from '@oscarpalmer/atoms/models';
import {createElement} from '@oscarpalmer/toretto/create';
import {getPosition} from '@oscarpalmer/toretto/event';
import {findAncestor, getElementFromPosition} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {attributable} from '../internal/attributable';
import {
	addDraggable,
	getDraggableStates,
	OuiDraggable,
	removeDraggable,
	type CreateOuiDraggableOptions,
	type OuiDraggableBound,
	type OuiDraggableGlobals,
	type OuiDraggableItem,
	type OuiDraggableState,
	type OuiDragMovePosition,
} from '../internal/draggable';

// #region Types

export class OuiSortable extends OuiDraggable<OuiSortableState> {
	constructor(element: HTMLElement, options?: CreateOuiDraggableOptions) {
		super(
			'sortable',
			'sort',
			ATTRIBUTE,
			element,
			{
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
				input: options,
				position: {
					getOffset: getOffsetPosition,
					getOriginal: getOriginalPosition,
				},
				getDragged: getDragPlaceholder,
				getOrigin: () =>
					(getDraggableStates(element)?.sortable as OuiDraggableState & OuiSortableState)?.origin,
			},
			{
				connections: element.getAttribute(ATTRIBUTE_CONNECTIONS),
			},
		);
	}
}

type OuiSortablePlaceholder = {
	drag: OuiSortablePlaceholderDrag;
	position: HTMLElement | undefined;
};

type OuiSortablePlaceholderDrag = {
	custom: HTMLElement | undefined;
	default: HTMLElement | undefined;
};

type OuiSortableState = {
	connections: string | null;
	origin?: HTMLElement;
};

// #endregion

// #region Functions

function afterEnd(
	insert: 'append' | 'insert' | 'prepend' | undefined,
	from: OuiDraggableItem<OuiSortableState>,
	events: CustomEvent[],
	elements: {origin?: HTMLElement; target: HTMLElement},
	position: EventPosition | undefined,
	valid: boolean,
): void {
	elements.origin?.removeAttribute(ATTRIBUTE_ORIGIN);

	from.state.origin = undefined;

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

/**
 * Creates _(or retrieves)_ a _OuiSortable_ instance for an element
 *
 * @param element Element to make sortable
 * @returns _OuiSortable_ instance
 */
export function createSortable(
	element: HTMLElement,
	options?: CreateOuiDraggableOptions,
): OuiSortable {
	if (!isHTMLOrSVGElement(element)) {
		throw new TypeError(MESSAGE);
	}

	return addSortable(element, options) as OuiSortable;
}

function getDragPlaceholder(): HTMLElement {
	placeholder.drag.default ??= createElement('div');

	return placeholder.drag.custom ?? placeholder.drag.default;
}

function getOffsetPosition(
	_: OuiDraggableGlobals,
	item: OuiDraggableItem,
	element: HTMLElement,
	position: EventPosition,
): EventPosition {
	const rectangle = element.getBoundingClientRect();

	return {
		x: item.state.horizontal ? 0 : position.x - rectangle.left,
		y: item.state.vertical ? 0 : position.y - rectangle.top,
	};
}

function getOriginalPosition(
	_: OuiDraggableGlobals,
	__: OuiDraggableItem,
	position: EventPosition,
): EventPosition {
	return position;
}

function getPositionPlaceholder(item: OuiDraggableItem<OuiSortableState>): HTMLElement {
	placeholder.position ??= createElement('div');

	placeholder.position.setAttribute(ATTRIBUTE_PLACEHOLDER_POSITION, '');

	if (item.state.origin != null) {
		placeholder.position.style.setProperty(
			'--placeholder-height',
			`${item.state.origin.getBoundingClientRect().height}px`,
		);
	}

	return placeholder.position;
}

function onBegin(
	_: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<OuiSortableState>,
	element: HTMLElement,
): void {
	item.state.origin = element;

	setPlaceholder(globals, item, element);

	element.setAttribute(ATTRIBUTE_ORIGIN, '');

	document.body.setAttribute(ATTRIBUTE_ACTIVE, '');
}

function onCancel(_: OuiDraggableGlobals, item: OuiDraggableItem<OuiSortableState>): void {
	item.state.origin?.removeAttribute(ATTRIBUTE_ORIGIN);

	document.body.removeAttribute(ATTRIBUTE_ACTIVE);

	resetPlaceholders();

	item.state.origin = undefined;
}

function onEnd(
	event: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<OuiSortableState>,
	reset: () => void,
): void {
	const {origin} = item.state;

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
	let toInstance: OuiSortable | undefined;
	let toState: OuiDraggableState | undefined;

	if (element == null) {
		element = findAncestor(target, SELECTOR) as HTMLElement;

		toInstance = globals.instances.get(element)?.sortable;
		toState = globals.states.get(element)?.sortable;

		insert = element == null ? undefined : element.children.length === 0 ? 'append' : 'prepend';
	} else {
		toInstance = globals.instances.get(element.parentElement!)?.sortable;
		toState = globals.states.get(element.parentElement!)?.sortable;
	}

	const valid =
		insert != null &&
		validatePosition(
			globals,
			item,
			{
				instance: toInstance as OuiDraggable<OuiSortableState>,
				state: toState as OuiDraggableState & OuiSortableState,
			},
			position,
		);

	const detail = valid
		? {
				from: {
					element: origin,
					position: {...globals.original},
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

	item.instance.element.dispatchEvent(fromEvent);

	if (item.instance !== toInstance) {
		toInstance?.element.dispatchEvent(toEvent);
	}

	setTimeout(() => {
		afterEnd(insert, item, [fromEvent, toEvent], {origin, target: element}, position, valid);

		reset();
	});
}

function onMove(
	event: MouseEvent | TouchEvent,
	globals: OuiDraggableGlobals,
	item: OuiDraggableItem<OuiSortableState>,
	position: OuiDragMovePosition,
): PlainObject | undefined {
	const fromElement = item.state.origin;
	const toElement = findAncestor(event, SELECTOR_ITEM) as HTMLElement;

	let toInstance: OuiSortable | undefined;
	let toState: OuiDraggableState | undefined;

	if (toElement == null) {
		const element = findAncestor(event, SELECTOR) as HTMLElement;

		toInstance = globals.instances.get(element)?.sortable;
		toState = globals.states.get(element)?.sortable;
	} else {
		toInstance = globals.instances.get(toElement.parentElement!)?.sortable;
		toState = globals.states.get(toElement.parentElement!)?.sortable;
	}

	if (
		toInstance == null ||
		!validatePosition(
			globals,
			item,
			{
				instance: toInstance as OuiDraggable<OuiSortableState>,
				state: toState as OuiDraggableState & OuiSortableState,
			},
			position.original,
		)
	) {
		return;
	}

	const placeholder = getPositionPlaceholder(item);

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
			position: {...globals.original},
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

function setPlaceholder(
	state: OuiDraggableGlobals,
	item: OuiDraggableItem<OuiSortableState>,
	origin: HTMLElement,
): void {
	const element = getDragPlaceholder();

	placeholder.drag.default!.innerHTML = '';

	updatePlaceholder(item, element);

	const event = new CustomEvent(EVENT_PLACEHOLDER, {
		cancelable: true,
		detail: {
			origin,
			parent: item.state.element,
			placeholder: element,
			create: (value: unknown) => {
				if (!isHTMLOrSVGElement(value)) {
					return;
				}

				const element = value as HTMLElement;

				placeholder.drag.custom = element;

				updatePlaceholder(item, element);

				state.element = {
					rectangle: element.getBoundingClientRect(),
					node: element,
				};
			},
		},
	});

	item.instance.element.dispatchEvent(event);

	setTimeout(() => {
		if (!event.defaultPrevented && placeholder.drag.custom == null) {
			placeholder.drag.default?.append(element.cloneNode(true));
		}

		document.body.append(placeholder.drag.custom ?? placeholder.drag.default ?? '');
	});
}

function updatePlaceholder(item: OuiDraggableItem<OuiSortableState>, element: HTMLElement): void {
	element.style.position = 'fixed';

	element.setAttribute(ATTRIBUTE_PLACEHOLDER_DRAG, '');

	const state = getDraggableStates(item.state.element)?.sortable;

	if (state == null) {
		return;
	}

	if (state.horizontal) {
		element.setAttribute(ATTRIBUTE_HORIZONTAL, '');
	} else {
		element.removeAttribute(ATTRIBUTE_HORIZONTAL);
	}

	if (state.vertical) {
		element.setAttribute(ATTRIBUTE_VERTICAL, '');
	} else {
		element.removeAttribute(ATTRIBUTE_VERTICAL);
	}
}

function validatePosition(
	_: OuiDraggableGlobals,
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

const CONTAINERS = new Map<HTMLElement, Set<OuiSortable>>();

const EVENT_END = 'sort:end';

const EVENT_PLACEHOLDER = 'sort:placeholder';

const INSERT_AFTER = 'afterend';

const INSERT_BEFORE = 'beforebegin';

const MESSAGE = 'The element must be an instance of HTMLElement or SVGElement';

const SELECTOR = `[${ATTRIBUTE}]`;

const SELECTOR_ITEM = `[${ATTRIBUTE}] > *`;

const bound: OuiDraggableBound = {
	constructor: OuiSortable,
	property: 'sortable',
};

const placeholder: OuiSortablePlaceholder = {
	drag: {
		custom: undefined,
		default: undefined,
	},
	position: undefined,
};

const addSortable = addDraggable.bind(bound);

const removeSortable = removeDraggable.bind(bound);

// #endregion

// #region Initialization

attributable(ATTRIBUTE, addSortable, removeSortable);

// #endregion
