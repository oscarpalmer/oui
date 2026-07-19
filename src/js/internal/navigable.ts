import {clamp} from '@oscarpalmer/atoms/number';
import {getAria, setRole} from '@oscarpalmer/toretto/aria';
import {dispatch, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {AriaRole, RemovableEventListener} from '@oscarpalmer/toretto/models';

// #region Types

export class OuiNavigable {
	active: OuiNavigableActive = {
		index: 0,
	};

	element: HTMLElement;

	listeners: RemovableEventListener[];

	options: OuiNavigableOptions;

	orientation: OuiNavigableOrientation;

	constructor(element: HTMLElement, options: OuiNavigableOptions) {
		this.element = element;
		this.options = options;

		this.listeners = [
			on(element, 'focusin', event => {
				onFocusin(this, event);
			}),
			on(element, 'keydown', event => {
				onKeydown(this, event);
			}),
		];

		this.orientation = getOrientation(element, options);

		if (options.role != null) {
			setRole(element, options.role);
		}
	}

	destroy(): void {
		const listeners = this.listeners.splice(0);

		for (const listener of listeners) {
			listener();
		}

		this.active.element = undefined;
		this.element = undefined as never;
	}
}

type OuiNavigableActive = {
	element?: HTMLElement;
	index: number;
};

export type OuiNavigableOptions = {
	role?: AriaRole;
	selector: string;
	vertical: boolean;
	onDeactivate?: (event: KeyboardEvent, navigable: OuiNavigable) => void;
	onPreventNavigation?: (event: KeyboardEvent, navigable: OuiNavigable) => boolean;
	onShouldActivate?: (event: KeyboardEvent, navigable: OuiNavigable) => boolean;
	onShouldDeactivate?: (event: KeyboardEvent, navigable: OuiNavigable) => boolean | undefined;
};

type OuiNavigableOrientation = 'horizontal' | 'vertical';

// #endregion

// #region Functions

function getItems(container: HTMLElement, selector: string): HTMLElement[] {
	return [...container.querySelectorAll(selector)].filter(isValidItem);
}

export function getNavigable(element: HTMLElement, options: OuiNavigableOptions): OuiNavigable {
	return new OuiNavigable(element, options);
}

function getOrientation(
	element: HTMLElement,
	options: OuiNavigableOptions,
): OuiNavigableOrientation {
	const attribute = getAria(element, 'orientation');

	return ORIENTATIONS.has(attribute as OuiNavigableOrientation)
		? (attribute as OuiNavigableOrientation)
		: options.vertical
			? ORIENTATION_VERTICAL
			: ORIENTATION_HORIZONTAL;
}

function isValidItem(element: Element): element is HTMLElement {
	return 'disabled' in element ? element.disabled !== true : true;
}

function onFocusin(navigable: OuiNavigable, event: FocusEvent): void {
	const item = findAncestor(event, navigable.options.selector);

	if (!isHTMLOrSVGElement(item) || !isValidItem(item)) {
		return;
	}

	const items = getItems(navigable.element, navigable.options.selector);
	const index = items.indexOf(item);

	if (index === -1) {
		return;
	}

	navigable.active.element = item;
	navigable.active.index = index;

	updateNavigableFocus(navigable, false, items);
}

function onKeydown(navigable: OuiNavigable, event: KeyboardEvent): void {
	const escaped = event.key === 'Escape';
	const stopPropagation = navigable.options.onShouldDeactivate?.(event, navigable);

	if (escaped || stopPropagation != null) {
		if (escaped || stopPropagation) {
			event.stopPropagation();
		}

		navigable.options.onDeactivate?.(event, navigable);

		return;
	}

	if (!KEYS_ALL.has(event.key)) {
		return;
	}

	const mustActivate = KEYS_ACTIVATE.has(event.key);
	const shouldActivate = navigable.options.onShouldActivate?.(event, navigable) === true;

	if (
		mustActivate ||
		shouldActivate ||
		navigable.options.onPreventNavigation?.(event, navigable) === true
	) {
		event.stopPropagation();
	}

	if (mustActivate || shouldActivate) {
		return;
	}

	const items = getItems(navigable.element, navigable.options.selector);
	const {length} = items;

	if (length === 0) {
		return;
	}

	let index: number | undefined;

	if (KEYS_ABSOLUTE.has(event.key)) {
		index = event.key === 'Home' ? 0 : items.length - 1;
	} else {
		const direction = NAVIGABLE_KEYS_HORIZONTAL.has(event.key)
			? ORIENTATION_HORIZONTAL
			: ORIENTATION_VERTICAL;

		if (navigable.orientation === direction) {
			if (navigable.active.element instanceof HTMLSelectElement) {
				event.preventDefault();
			}

			index = clamp(
				navigable.active.index + (KEYS_NEXT.has(event.key) ? 1 : -1),
				0,
				length - 1,
				true,
			);
		}
	}

	if (index == null || index === navigable.active.index) {
		return;
	}

	navigable.active.element = items[index];
	navigable.active.index = index;

	updateNavigableFocus(navigable, true, items);
}

export function updateNavigableFocus(
	navigable: OuiNavigable,
	focus: boolean,
	items?: HTMLElement[],
): void {
	const updated = items ?? getItems(navigable.element, navigable.options.selector);
	const {length} = updated;

	if (length === 0) {
		return;
	}

	for (let index = 0; index < length; index += 1) {
		updated[index].tabIndex = index === navigable.active.index ? 0 : -1;
	}

	navigable.active.element ??= updated[navigable.active.index];

	if (focus) {
		navigable.active.element?.focus();
	}

	dispatch(navigable.active.element, 'navigable:change', {
		detail: {...navigable.active},
	});
}

// #endregion

// #region Variables

const KEYS_ABSOLUTE = new Set(['End', 'Home']);

const KEYS_ACTIVATE = new Set(['Enter', ' ']);

export const NAVIGABLE_KEYS_HORIZONTAL = new Set(['ArrowRight', 'ArrowLeft']);

export const NAVIGABLE_KEYS_VERTICAL = new Set(['ArrowDown', 'ArrowUp']);

const KEYS_ALL = new Set([
	...KEYS_ABSOLUTE,
	...KEYS_ACTIVATE,
	...NAVIGABLE_KEYS_HORIZONTAL,
	...NAVIGABLE_KEYS_VERTICAL,
]);

const KEYS_NEXT = new Set(['ArrowDown', 'ArrowRight']);

const ORIENTATION_HORIZONTAL: OuiNavigableOrientation = 'horizontal';

const ORIENTATION_VERTICAL: OuiNavigableOrientation = 'vertical';

const ORIENTATIONS = new Set<OuiNavigableOrientation>([
	ORIENTATION_HORIZONTAL,
	ORIENTATION_VERTICAL,
]);

// #endregion
