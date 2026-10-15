import type {AriaRole, RemovableEventListener} from '@oscarpalmer/toretto/models';

// #region Types

export type OuiNavigable = {
	[NAVIGABLE_SYMBOL]: OuiNavigableState;
	destroy(): void;
	navigate(index: number, focus?: boolean): void;
};

export type OuiNavigableActive = {
	element?: HTMLElement;
	index: number;
};

export type OuiNavigableCallback<ReturnType> = (
	event: KeyboardEvent,
	navigable: OuiNavigable,
) => ReturnType;

export type OuiNavigableOptions = {
	orientation?: OuiNavigableOrientation;
	role?: AriaRole;
	selector: string;
	vertical: boolean;
	onActivate?: (navigable: OuiNavigable) => void;
	onDeactivate?: OuiNavigableCallback<void>;
	onNavigation?: (navigable: OuiNavigable) => void;
	onPreventNavigation?: OuiNavigableCallback<boolean>;
	onShouldActivate?: OuiNavigableCallback<boolean>;
	onShouldDeactivate?: OuiNavigableCallback<boolean | undefined>;
};

export type OuiNavigableOrientation = 'horizontal' | 'vertical';

export type OuiNavigableState = {
	active: OuiNavigableActive;
	element: Element;
	listeners: RemovableEventListener[];
	options: OuiNavigableOptions;
	orientation: OuiNavigableOrientation;
};

// #endregion

// #region Variables

export const NAVIGABLE_KEYS_ABSOLUTE: Set<string> = new Set(['End', 'Home']);

export const NAVIGABLE_KEYS_ACTIVATE: Set<string> = new Set(['Enter', ' ']);

export const NAVIGABLE_KEYS_HORIZONTAL: Set<string> = new Set(['ArrowRight', 'ArrowLeft']);

export const NAVIGABLE_KEYS_VERTICAL: Set<string> = new Set(['ArrowDown', 'ArrowUp']);

export const NAVIGABLE_KEYS_ALL: Set<string> = new Set([
	...NAVIGABLE_KEYS_ABSOLUTE,
	...NAVIGABLE_KEYS_ACTIVATE,
	...NAVIGABLE_KEYS_HORIZONTAL,
	...NAVIGABLE_KEYS_VERTICAL,
]);

export const NAVIGABLE_KEYS_NEXT: Set<string> = new Set(['ArrowDown', 'ArrowRight']);

export const NAVIGABLE_ORIENTATION_HORIZONTAL: OuiNavigableOrientation = 'horizontal';

export const NAVIGABLE_ORIENTATION_VERTICAL: OuiNavigableOrientation = 'vertical';

export const NAVIGABLE_ORIENTATIONS: Set<OuiNavigableOrientation> = new Set([
	NAVIGABLE_ORIENTATION_HORIZONTAL,
	NAVIGABLE_ORIENTATION_VERTICAL,
]);

export const NAVIGABLE_SYMBOL: unique symbol = Symbol('oui-navigable');

// #endregion
