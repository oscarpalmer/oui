import {clamp} from '@oscarpalmer/atoms/number';
import {getPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {toggleStyles, type StyleToggler} from '@oscarpalmer/toretto/style';
import {attributable} from './attributable';

// #region Types

type Direction = 'horizontal' | 'vertical' | 'x' | 'y';

class Movable {
	container: HTMLElement | undefined;

	hasHandles = false;

	horizontal = true;

	inset: string;

	moved = false;

	offset: Partial<Position> | undefined;

	position: string;

	vertical = true;

	constructor(public element: HTMLElement) {
		setContainer(this, element.getAttribute(CONTAINER));
		setDirection(this, element.getAttribute(DIRECTION));

		this.hasHandles = element.querySelector(ATTRIBUTE_HANDLE) != null;

		this.inset = element.style.inset;
		this.position = element.style.position;
	}

	destroy(): void {
		MOVED.delete(this);

		unsetContainer(this);

		this.element.style.inset = this.inset;
		this.element.style.position = this.position;

		this.container = undefined;
		this.element = undefined!;
	}
}

type Position = {
	x: number;
	y: number;
};

type State = {
	container: DOMRect | undefined;
	offset: Position;
	original: Position;
};

// #endregion

// #region Functions

function addMovable(element: HTMLElement): void {
	if (!MOVABLES.has(element)) {
		MOVABLES.set(element, new Movable(element));
	}
}

function onKeydown(event: KeyboardEvent): void {
	if (instance == null || event.key !== KEY_ESCAPE) {
		return;
	}

	const {element, inset, moved, position} = instance;
	const {x, y} = state.original;

	reset();

	if (moved) {
		element.style.inset = `${y}px auto auto ${x}px`;
	} else {
		element.style.position = position;
		element.style.inset = inset;
	}
}

function onPointerdown(event: PointerEvent): void {
	const element = findAncestor(event, ATTRIBUTE)! as HTMLElement;
	const movable = MOVABLES.get(element!);

	if (movable == null) {
		return;
	}

	let handle: HTMLElement | null = element;

	if (movable.hasHandles) {
		handle = findAncestor(event, ATTRIBUTE_HANDLE) as HTMLElement;
	}

	if (handle == null) {
		return;
	}

	const {left, top} = element.getBoundingClientRect();
	const {x, y} = getPosition(event) ?? {x: 0, y: 0};

	instance = movable;

	state.container = movable.container?.getBoundingClientRect();

	state.offset = {
		x: x - left,
		y: y - top,
	};

	state.original = {
		x: left,
		y: top,
	};

	element.style.position = 'fixed';
	element.style.inset = `${top}px auto auto ${left}px`;

	styleToggler.set();
}

function onPointermove(event: PointerEvent): void {
	if (instance == null) {
		return;
	}

	const position = getPosition(event);

	if (position == null) {
		return;
	}

	let x = state.original.x;
	let y = state.original.y;

	if (instance.horizontal) {
		x = position.x - state.offset.x;

		if (state.container != null) {
			x = clamp(x, state.container.left, state.container.right - instance.element.offsetWidth);
		}
	}

	if (instance.vertical) {
		y = position.y - state.offset.y;

		if (state.container != null) {
			y = clamp(y, state.container.top, state.container.bottom - instance.element.offsetHeight);
		}
	}

	instance.element.style.inset = `${y}px auto auto ${x}px`;
}

function onPointerup(): void {
	if (instance == null) {
		return;
	}

	if (!instance.moved) {
		instance.moved = true;

		if (instance.container != null) {
			MOVED.add(instance);
		}
	}

	reset();
}

function onResize(entries: ResizeObserverEntry[]): void {
	const {length} = entries;

	for (let index = 0; index < length; index += 1) {
		const entry = entries[index];
		const set = CONTAINERS.get(entry.target as HTMLElement);

		if (set == null) {
			continue;
		}

		for (const movable of set) {
			reposition(movable);
		}
	}
}

function onScroll(): void {
	for (const moved of MOVED) {
		reposition(moved);
	}
}

function removeMovable(element: HTMLElement): void {
	const movable = MOVABLES.get(element);

	if (movable == null) {
		return;
	}

	movable.destroy();

	MOVABLES.delete(element);
}

function reposition(movable: Movable): void {
	if (!movable.moved || movable.container == null) {
		return;
	}

	const container = movable.container.getBoundingClientRect();

	let {x, y} = movable.element.getBoundingClientRect();

	if (movable.horizontal) {
		x = clamp(x, container.left, container.right - movable.element.offsetWidth);

		if (!movable.vertical) {
			y = container.top + (movable.offset?.y ?? 0);
		}
	}

	if (movable.vertical) {
		y = clamp(y, container.top, container.bottom - movable.element.offsetHeight);

		if (!movable.horizontal) {
			x = container.left + (movable.offset?.x ?? 0);
		}
	}

	movable.element.style.inset = `${y}px auto auto ${x}px`;
}

function reset(): void {
	instance = undefined;

	state.container = undefined;
	state.offset = undefined!;
	state.original = undefined!;

	styleToggler.remove();
}

function setContainer(movable: Movable, selector: unknown): void {
	if (typeof selector !== 'string') {
		return;
	}

	movable.container = globals.has(selector)
		? movable.element.ownerDocument.body
		: (document.querySelector(selector) ?? undefined);

	if (movable.container == null) {
		return;
	}

	const set = CONTAINERS.get(movable.container);

	if (set == null) {
		CONTAINERS.set(movable.container, new Set([movable]));
	} else {
		set.add(movable);
	}

	resizer.observe(movable.container);
}

function setDirection(movable: Movable, direction: unknown): void {
	if (horizontals.has(direction as Direction)) {
		movable.vertical = false;
	} else if (verticals.has(direction as Direction)) {
		movable.horizontal = false;
	}

	const container = movable.container?.getBoundingClientRect();

	if (movable.horizontal !== movable.vertical && container != null) {
		setOffset(movable, container);
	}
}

function setOffset(movable: Movable, container: DOMRect): void {
	movable.offset = {};

	const element = movable.element.getBoundingClientRect();

	if (movable.horizontal && !movable.vertical) {
		movable.offset.y = element.top - container.top;
	}

	if (movable.vertical && !movable.horizontal) {
		movable.offset.x = element.left - container.left;
	}
}

function unsetContainer(movable: Movable): void {
	const {container} = movable;

	if (container == null) {
		return;
	}

	const set = CONTAINERS.get(container);

	if (set != null) {
		set.delete(movable);

		if (set.size === 0) {
			CONTAINERS.delete(container);

			resizer.unobserve(container);
		}
	}
}

// #endregion

// #region Variables

const SELECTOR = 'oui-movable';

const SELECTOR_HANDLE = `${SELECTOR}-handle`;

const ATTRIBUTE = `[${SELECTOR}]`;

const ATTRIBUTE_HANDLE = `[${SELECTOR_HANDLE}]`;

const CONTAINER = `${SELECTOR}-container`;

const CONTAINERS = new Map<HTMLElement, Set<Movable>>();

const DIRECTION = `${SELECTOR}-direction`;

const KEY_ESCAPE = 'Escape';

const MOVABLES = new WeakMap<Element, Movable>();

const MOVED = new Set<Movable>();

const globals = new Set<string>(['body', 'document', 'window']);

const horizontals = new Set<Direction>(['horizontal', 'x']);

const resizer = new ResizeObserver(onResize);

const state: State = {
	container: undefined!,
	offset: undefined!,
	original: undefined!,
};

const styleToggler: StyleToggler = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

const verticals = new Set<Direction>(['vertical', 'y']);

let instance: Movable | undefined;

// #endregion

// #region Initialization

attributable(SELECTOR, addMovable, removeMovable);

on(document, 'keydown', onKeydown);
on(document, 'pointerdown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'scroll', onScroll);

// #endregion
