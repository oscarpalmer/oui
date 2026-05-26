import type {EventPosition, PlainObject} from '@oscarpalmer/atoms/models';
import {clamp} from '@oscarpalmer/atoms/number';
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
} from './internal/draggable';

// #region Types

export class Sortable extends Draggable {
	active: HTMLElement | undefined;

	connections: string | null;

	get dragged(): HTMLElement {
		return getPlaceholder(this);
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
			onBegin,
			onCancel,
			onEnd,
			onMove,
		});

		this.connections = this.element.getAttribute(ATTRIBUTE_CONNECTIONS);
	}
}

// #endregion

// #region Functions

function afterEnd(
	insert: 'append' | 'insert' | 'prepend',
	from: Sortable,
	events: CustomEvent[],
	elements: {active?: HTMLElement; target: HTMLElement},
	position: EventPosition | undefined,
	valid: boolean,
): void {
	elements.active?.removeAttribute(ATTRIBUTE_ACTIVE);

	const placeholder = getPlaceholder(from);

	placeholder.remove();

	from.active = undefined;

	const actives = [...document.querySelectorAll(SELECTOR_ACTIVE)];

	for (const element of actives) {
		element.removeAttribute(ATTRIBUTE_AFTER);
		element.removeAttribute(ATTRIBUTE_BEFORE);
	}

	if (!valid || events.some(event => event.defaultPrevented)) {
		return;
	}

	if (insert !== 'insert') {
		elements.target.append(elements.active!);

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

	elements.target?.insertAdjacentElement(insertion, elements.active!);
}

function getPlaceholder(sortable: Sortable): HTMLElement {
	if (placeholder == null) {
		placeholder = createElement('div');

		placeholder.setAttribute(ATTRIBUTE_PLACEHOLDER, '');
	}

	if (sortable.horizontal) {
		placeholder.setAttribute(ATTRIBUTE_HORIZONTAL, '');
	}

	if (sortable.vertical) {
		placeholder.setAttribute(ATTRIBUTE_VERTICAL, '');
	}

	return placeholder;
}

function onBegin(
	_: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	element: HTMLElement,
): void {
	const sortable = draggable as Sortable;

	sortable.active = element;

	const placeholder = getPlaceholder(sortable);

	placeholder.style.position = 'fixed';
	placeholder.style.inset = `${state.original.y}px auto auto ${state.original.x}px`;

	setPlaceholder(sortable, placeholder, element);

	element.setAttribute(ATTRIBUTE_ACTIVE, '');
}

function onCancel(_: DraggableState, draggable: Draggable): void {
	const sortable = draggable as Sortable;

	const {active} = sortable;

	active?.removeAttribute(ATTRIBUTE_ACTIVE);

	const placeholder = getPlaceholder(sortable);

	placeholder.remove();

	sortable.active = undefined;
}

function onEnd(
	event: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	reset: () => void,
): void {
	const from = draggable as Sortable;
	const {active} = from;

	const target = getElementFromPosition(getPosition(event)!)[0];

	let element = findAncestor(target, SELECTOR_ITEM) as HTMLElement;
	let insert: 'append' | 'insert' | 'prepend' = 'insert';
	let to: Sortable | undefined;

	if (element == null) {
		element = findAncestor(target, SELECTOR) as HTMLElement;
		to = state.instances.get(element)?.sortable;

		insert = element.children.length === 0 ? 'append' : 'prepend';
	} else {
		to = state.instances.get(element.parentElement!)?.sortable;
	}

	const position = getPosition(event);

	let valid = true;

	if (from.connections != null) {
		valid = to?.element.matches(from.connections) ?? false;
	}

	if (valid && to?.connections != null) {
		valid = from.element.matches(to.connections);
	}

	const detail = valid
		? {
				from: {
					element: active,
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
		afterEnd(insert, from, [fromEvent, toEvent], {active, target: element}, position, valid);

		reset();
	});
}

function onMove(
	event: MouseEvent | TouchEvent,
	state: DraggableState,
	draggable: Draggable,
	position: EventPosition,
): PlainObject | undefined {
	const from = draggable as Sortable;

	const placeholder = getPlaceholder(from);

	let x = state.original.x;
	let y = state.original.y;

	if (from.horizontal) {
		x = position.x;

		if (state.container != null) {
			x = clamp(x, state.container.left, state.container.right - 8);
		}
	}

	if (from.vertical) {
		y = position.y;

		if (state.container != null) {
			y = clamp(y, state.container.top, state.container.bottom - 8);
		}
	}

	placeholder.style.inset = `${y}px auto auto ${x}px`;

	const actives = [...document.querySelectorAll(SELECTOR_ACTIVE)];

	for (const element of actives) {
		element.removeAttribute(ATTRIBUTE_AFTER);
		element.removeAttribute(ATTRIBUTE_BEFORE);
	}

	const fromElement = from.active;
	const toElement = findAncestor(event, SELECTOR_ITEM) as HTMLElement;

	let to: Sortable | undefined;

	if (toElement == null) {
		to = state.instances.get(findAncestor(event, SELECTOR) as HTMLElement)?.sortable;
	} else {
		to = state.instances.get(toElement.parentElement!)?.sortable;
	}

	let valid = true;

	if (from.connections != null) {
		valid = to?.element.matches(from.connections) ?? true;
	}

	if (valid && to?.connections != null) {
		valid = from.element.matches(to.connections);
	}

	if (valid && toElement != null && toElement !== fromElement) {
		const {height, top} = toElement.getBoundingClientRect();

		if (y < top + height / 2) {
			toElement.setAttribute(ATTRIBUTE_BEFORE, '');
		} else {
			toElement.setAttribute(ATTRIBUTE_AFTER, '');
		}
	}

	if (valid) {
		return {
			from: {
				element: fromElement,
				position: {...state.original},
			},
			to: {
				element: toElement,
				position: {...position},
			},
		};
	}
}

function setPlaceholder(sortable: Sortable, placeholder: HTMLElement, element: HTMLElement): void {
	placeholder.innerHTML = '';

	const event = new CustomEvent(EVENT_PLACEHOLDER, {
		cancelable: true,
		detail: {
			element,
			placeholder,
		},
	});

	sortable.element.dispatchEvent(event);

	setTimeout(() => {
		if (!event.defaultPrevented) {
			placeholder.append(element.cloneNode(true));
		}

		document.body.append(placeholder);
	});
}

// #endregion

// #region Variables

const ATTRIBUTE = 'oui-sortable';

const ATTRIBUTE_ACTIVE = `${ATTRIBUTE}-active`;

const ATTRIBUTE_AFTER = `${ATTRIBUTE}-after`;

const ATTRIBUTE_BEFORE = `${ATTRIBUTE}-before`;

const ATTRIBUTE_CONNECTIONS = `${ATTRIBUTE}-connections`;

const ATTRIBUTE_CONTAINER = `${ATTRIBUTE}-container`;

const ATTRIBUTE_DIRECTION = `${ATTRIBUTE}-direction`;

const ATTRIBUTE_HORIZONTAL = `${ATTRIBUTE}-horizontal`;

const ATTRIBUTE_PLACEHOLDER = `${ATTRIBUTE}-placeholder`;

const ATTRIBUTE_VERTICAL = `${ATTRIBUTE}-vertical`;

const CONTAINERS = new Map<HTMLElement, Set<Sortable>>();

const EVENT_END = 'sort:end';

const EVENT_PLACEHOLDER = 'sort:placeholder';

const INSERT_AFTER = 'afterend';

const INSERT_BEFORE = 'beforebegin';

const SELECTOR = `[${ATTRIBUTE}]`;

const SELECTOR_ACTIVE = `[${ATTRIBUTE_AFTER}], [${ATTRIBUTE_BEFORE}]`;

const SELECTOR_ITEM = `[${ATTRIBUTE}] > *`;

const bound: DraggableBound = {
	constructor: Sortable,
	property: 'sortable',
};

let placeholder: HTMLElement | undefined;

// #endregion

// #region Initialization

attributable(ATTRIBUTE, addDraggable.bind(bound), removeDraggable.bind(bound));

// #endregion
