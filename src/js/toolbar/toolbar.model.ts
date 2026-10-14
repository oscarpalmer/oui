import type {OuiNavigable} from '../internal/navigable/navigable.model';

// #region Types

export type OuiToolbar = {
	[TOOLBAR_SYMBOL]: OuiNavigable;

	destroy(): void;
};

// #endregion

// #region Variables

export const TOOLBAR_ATTRIBUTE = 'oui-toolbar';

export const TOOLBAR_SYMBOL: unique symbol = Symbol(TOOLBAR_ATTRIBUTE);

export const TOOLBAR_SELECTOR: string = `[${TOOLBAR_ATTRIBUTE}-item]`;

export const toolbars: WeakMap<HTMLElement, OuiToolbar> = new WeakMap();

// #endregion
