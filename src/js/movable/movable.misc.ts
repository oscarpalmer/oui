import {getAttribute} from '@oscarpalmer/toretto/attribute';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {movableResizeObserver} from './movable.event';
import {
	MOVABLE_ATTRIBUTE_DIRECTION,
	MOVABLE_CONTAINERS,
	movableContainers,
	movableHorizontals,
	movableVerticals,
	type OuiMovableState,
} from './movable.model';

// #region Functions

export function setMovableContainer(state: OuiMovableState, input: unknown): void {
	if (isHTMLOrSVGElement(input)) {
		return setMovableContainerElement(state, input);
	}

	const selector = input ?? getAttribute(state.element, state.container.attribute);

	if (typeof selector !== 'string') {
		return;
	}

	const element = movableContainers.has(selector.toLowerCase())
		? state.element.ownerDocument.body
		: document.querySelector(selector);

	if (isHTMLOrSVGElement(element)) {
		return setMovableContainerElement(state, element);
	}
}

function setMovableContainerElement(state: OuiMovableState, element: Element): void {
	state.container.element = element;

	const set = MOVABLE_CONTAINERS.get(element);

	if (set == null) {
		MOVABLE_CONTAINERS.set(element, new Set([state]));
	} else {
		set.add(state);
	}

	movableResizeObserver.observe(element);
}

export function setMovableDirection(state: OuiMovableState, input: unknown): void {
	let direction: string | undefined;

	if (typeof input === 'string' && (movableHorizontals.has(input) || movableVerticals.has(input))) {
		direction = input;
	}

	direction ??= getAttribute(state.element, MOVABLE_ATTRIBUTE_DIRECTION);

	if (direction == null) {
		return;
	}

	state.direction.horizontal = true;
	state.direction.vertical = true;

	if (movableHorizontals.has(direction)) {
		state.direction.vertical = false;
	} else if (movableVerticals.has(direction)) {
		state.direction.horizontal = false;
	}
}

export function unsetMovableContainer(state: OuiMovableState, element?: Element): void {
	if (element == null) {
		return;
	}

	const set = MOVABLE_CONTAINERS.get(element);

	let empty = false;

	if (set != null) {
		set.delete(state);

		if (set.size === 0) {
			empty = true;

			MOVABLE_CONTAINERS.delete(element);
		}
	}

	if (empty) {
		movableResizeObserver.unobserve(element);
	}
}

// #endregion
