import {filter} from '@oscarpalmer/atoms/array/filter';
import {clamp} from '@oscarpalmer/atoms/number';
import {getAria, setAria, setRole} from '@oscarpalmer/toretto/aria';
import {getAttribute} from '@oscarpalmer/toretto/attribute';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import {
	type OuiNavigable,
	type OuiNavigableOptions,
	type OuiNavigableOrientation,
	NAVIGABLE_KEYS_ABSOLUTE,
	NAVIGABLE_KEYS_ACTIVATE,
	NAVIGABLE_KEYS_ALL,
	NAVIGABLE_KEYS_HORIZONTAL,
	NAVIGABLE_KEYS_NEXT,
	NAVIGABLE_ORIENTATION_HORIZONTAL,
	NAVIGABLE_ORIENTATION_VERTICAL,
	NAVIGABLE_ORIENTATIONS,
	NAVIGABLE_SYMBOL,
} from './navigable.model';

// #region Instances

function OuiNavigable(this: OuiNavigable, element: Element, options: OuiNavigableOptions): void {
	this[NAVIGABLE_SYMBOL] = {
		element,
		options,
		active: {
			index: 0,
		},
		listeners: [
			on(
				element,
				'click',
				event => {
					onClick(this, event);
				},
				{
					passive: false,
				},
			),
			on(element, 'focusin', event => {
				onFocusin(this, event);
			}),
			on(
				element,
				'keydown',
				event => {
					onKeydown(this, event);
				},
				{
					passive: false,
				},
			),
		],
		orientation: options?.orientation ?? getNavigableOrientation(element, options.vertical),
	};

	setAria(element, 'orientation', this[NAVIGABLE_SYMBOL].orientation);

	if (options.role != null) {
		setRole(element, options.role);
	}
}

OuiNavigable.prototype.destroy = destroyNavigable;
OuiNavigable.prototype.navigate = navigateWithNavigable;

// #endregion

// #region Functions

function destroyNavigable(this: OuiNavigable): void {
	const state = this[NAVIGABLE_SYMBOL];

	const listeners = state.listeners.splice(0);

	for (const listener of listeners) {
		listener();
	}

	state.active.element = undefined;
	state.element = undefined as never;
}

function getItems(container: Element, selector: string): HTMLElement[] {
	return filter([...container.querySelectorAll(selector)], isValidItem) as HTMLElement[];
}

export function getNavigable(element: Element, options: OuiNavigableOptions): OuiNavigable {
	// @ts-expect-error All good, no worries :-)
	return new OuiNavigable(element, options);
}

export function getNavigableOrientation(
	element: Element,
	vertical: boolean,
	aria?: boolean,
): OuiNavigableOrientation {
	const attribute =
		(aria ?? true) ? getAria(element, 'orientation') : getAttribute(element, 'orientation');

	return NAVIGABLE_ORIENTATIONS.has(attribute as never)
		? (attribute as never)
		: vertical
			? NAVIGABLE_ORIENTATION_VERTICAL
			: NAVIGABLE_ORIENTATION_HORIZONTAL;
}

function isValidItem(element: Element): element is HTMLElement {
	return 'disabled' in element ? element.disabled !== true : true;
}

function navigateWithNavigable(this: OuiNavigable, index: number, focus?: boolean): void {
	const {element, options} = this[NAVIGABLE_SYMBOL];

	const items = getItems(element, options.selector);

	if (index >= 0 && index < items.length) {
		onNavigate(this, index, items, focus ?? false);
	}
}

function onClick(navigable: OuiNavigable, event: Event): void {
	const {active, element, options} = navigable[NAVIGABLE_SYMBOL];

	const item = findAncestor(event, options.selector);
	const items = getItems(element, options.selector);

	const index = items.indexOf(item as never);

	if (index === -1) {
		return;
	}

	if (index !== active.index) {
		onNavigate(navigable, index, items, false);
	}

	options.onActivate?.(navigable);

	(item as HTMLElement)?.focus?.();
}

function onNavigate(
	navigable: OuiNavigable,
	index: number,
	items: HTMLElement[],
	focus: boolean,
): void {
	const {active, options} = navigable[NAVIGABLE_SYMBOL];

	active.element = items[index];
	active.index = index;

	updateNavigableFocus(navigable, focus, items);

	options.onNavigation?.(navigable);
}

function onFocusin(navigable: OuiNavigable, event: FocusEvent): void {
	const {active, element, options} = navigable[NAVIGABLE_SYMBOL];

	const item = findAncestor(event, options.selector);

	if (!isHTMLOrSVGElement(item) || !isValidItem(item)) {
		return;
	}

	const items = getItems(element, options.selector);
	const index = items.indexOf(item);

	if (index === -1) {
		return;
	}

	active.element = item;
	active.index = index;

	updateNavigableFocus(navigable, false, items);
}

function onKeydown(navigable: OuiNavigable, event: KeyboardEvent): void {
	const {active, element, options, orientation} = navigable[NAVIGABLE_SYMBOL];

	const escaped = event.key === 'Escape';
	const stopPropagation = options.onShouldDeactivate?.(event, navigable);

	if (escaped || stopPropagation != null) {
		if (escaped || stopPropagation) {
			event.stopPropagation();
		}

		options.onDeactivate?.(event, navigable);

		return;
	}

	if (!NAVIGABLE_KEYS_ALL.has(event.key)) {
		return;
	}

	const mustActivate = NAVIGABLE_KEYS_ACTIVATE.has(event.key);
	const shouldActivate = options.onShouldActivate?.(event, navigable) === true;

	if (mustActivate || shouldActivate || options.onPreventNavigation?.(event, navigable) === true) {
		event.stopPropagation();
	}

	if (mustActivate || shouldActivate) {
		options.onActivate?.(navigable);

		return;
	}

	const items = getItems(element, options.selector);
	const {length} = items;

	if (length === 0) {
		return;
	}

	event.preventDefault();

	let index: number | undefined;

	if (NAVIGABLE_KEYS_ABSOLUTE.has(event.key)) {
		index = event.key === 'Home' ? 0 : items.length - 1;
	} else {
		const direction = NAVIGABLE_KEYS_HORIZONTAL.has(event.key)
			? NAVIGABLE_ORIENTATION_HORIZONTAL
			: NAVIGABLE_ORIENTATION_VERTICAL;

		if (orientation === direction) {
			if (active.element instanceof HTMLSelectElement) {
				event.preventDefault();
			}

			index = clamp(
				active.index + (NAVIGABLE_KEYS_NEXT.has(event.key) ? 1 : -1),
				0,
				length - 1,
				true,
			);
		}
	}

	if (index != null && index !== active.index) {
		onNavigate(navigable, index, items, true);
	}
}

export function updateNavigableFocus(
	navigable: OuiNavigable,
	focus: boolean,
	items?: HTMLElement[],
): void {
	const {active, element, options} = navigable[NAVIGABLE_SYMBOL];

	const updated = items ?? getItems(element, options.selector);
	const {length} = updated;

	if (length === 0) {
		return;
	}

	for (let index = 0; index < length; index += 1) {
		updated[index].tabIndex = index === active.index ? 0 : -1;
	}

	active.element ??= updated[active.index];

	if (focus) {
		active.element?.focus();
	}
}

// #endregion
