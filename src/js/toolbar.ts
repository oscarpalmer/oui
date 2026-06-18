import {clamp} from '@oscarpalmer/atoms/number';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {attributable} from './internal/attributable';

class OuiToolbar {
	readonly #state: OuiToolbarState;

	constructor(state: OuiToolbarState) {
		this.#state = state;

		updateFocus(this.#state, false);
	}

	destroy(): void {
		for (const listener of this.#state.listeners) {
			listener();
		}

		this.#state.active = undefined as never;
		this.#state.element = undefined as never;
		this.#state.listeners = undefined as never;
	}
}

type OuiToolbarOrientation = 'horizontal' | 'vertical';

type OuiToolbarState = {
	active: OuiToolbarStateActive;
	element: HTMLElement;
	listeners: RemovableEventListener[];
	orientation: OuiToolbarOrientation;
};

type OuiToolbarStateActive = {
	element?: HTMLElement;
	index: number;
};

function addToolbar(element: HTMLElement): void {
	if (!instances.has(element)) {
		instances.set(element, new OuiToolbar(getState(element)));
	}
}

function getItems(element: HTMLElement): HTMLElement[] {
	return [...element.querySelectorAll<HTMLElement>(SELECTOR)].filter(isValidItem);
}

function getOrientation(element: HTMLElement): OuiToolbarOrientation {
	const attribute = element.getAttribute(ARIA_ORIENTATION);

	return ORIENTATIONS.has(attribute as OuiToolbarOrientation)
		? (attribute as OuiToolbarOrientation)
		: ORIENTATION_HORIZONTAL;
}

function getState(element: HTMLElement): OuiToolbarState {
	const state: OuiToolbarState = {
		element,
		active: {
			index: 0,
		},
		listeners: [
			on(element, EVENT_FOCUSIN, event => {
				onFocusin(state, event);
			}),
			on(
				element,
				EVENT_KEYDOWN,
				event => {
					onKeydown(state, event);
				},
				{
					passive: false,
				},
			),
		],
		orientation: getOrientation(element),
	};

	return state;
}

function isValidItem(element: HTMLElement): boolean {
	return PROPERTY_DISABLED in element ? element.disabled !== true : true;
}

function onKeydown(state: OuiToolbarState, event: KeyboardEvent): void {
	if (!KEYS_ALL.has(event.key)) {
		return;
	}

	const items = getItems(state.element);

	if (items.length === 0) {
		return;
	}

	let index: number | undefined;

	if (KEYS_ABSOLUTE.has(event.key)) {
		index = event.key === KEY_HOME ? 0 : items.length - 1;
	} else if (
		state.orientation === ORIENTATION_HORIZONTAL
			? KEYS_HORIZONTAL.has(event.key)
			: KEYS_VERTICAL.has(event.key)
	) {
		if (state.active.element instanceof HTMLSelectElement) {
			event.preventDefault();
		}

		index = clamp(
			state.active.index + (KEYS_NEXT.has(event.key) ? 1 : -1),
			0,
			items.length - 1,
			true,
		);
	}

	if (index == null || index === state.active.index) {
		return;
	}

	state.active.element = items[index];
	state.active.index = index;

	updateFocus(state, true, items);
}

function onFocusin(state: OuiToolbarState, event: FocusEvent): void {
	const item = findAncestor(event, SELECTOR);

	if (!isHTMLOrSVGElement(item) || !isValidItem(item)) {
		return;
	}

	const items = getItems(state.element);
	const index = items.indexOf(item);

	if (index === -1) {
		return;
	}

	state.active.element = item;
	state.active.index = index;

	updateFocus(state, false, items);
}

function removeToolbar(element: HTMLElement): void {
	instances.get(element)?.destroy();

	instances.delete(element);
}

function updateFocus(state: OuiToolbarState, focus: boolean, items?: HTMLElement[]): void {
	const updated = items ?? getItems(state.element);
	const {length} = updated;

	if (length === 0) {
		return;
	}

	for (let index = 0; index < length; index += 1) {
		updated[index].tabIndex = index === state.active.index ? 0 : -1;
	}

	state.active.element ??= updated[state.active.index];

	if (focus) {
		state.active.element?.focus();
	}
}

const ARIA_ORIENTATION = 'aria-orientation';

const ATTRIBUTE = 'oui-toolbar';

const EVENT_KEYDOWN = 'keydown';

const EVENT_FOCUSIN = 'focusin';

const KEY_ARROW_DOWN = 'ArrowDown';

const KEY_ARROW_RIGHT = 'ArrowRight';

const KEY_END = 'End';

const KEY_HOME = 'Home';

const KEYS_ABSOLUTE = new Set([KEY_END, KEY_HOME]);

const KEYS_HORIZONTAL = new Set([KEY_ARROW_RIGHT, 'ArrowLeft']);

const KEYS_VERTICAL = new Set([KEY_ARROW_DOWN, 'ArrowUp']);

const KEYS_ALL = new Set([...KEYS_ABSOLUTE, ...KEYS_HORIZONTAL, ...KEYS_VERTICAL]);

const KEYS_NEXT = new Set([KEY_ARROW_DOWN, KEY_ARROW_RIGHT]);

const ORIENTATION_HORIZONTAL: OuiToolbarOrientation = 'horizontal';

const ORIENTATIONS = new Set<OuiToolbarOrientation>([ORIENTATION_HORIZONTAL, 'vertical']);

const PROPERTY_DISABLED = 'disabled';

const SELECTOR = `[${ATTRIBUTE}-item]`;

const instances = new WeakMap<HTMLElement, OuiToolbar>();

attributable(ATTRIBUTE, addToolbar, removeToolbar);
