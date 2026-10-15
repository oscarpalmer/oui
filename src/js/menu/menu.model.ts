import type {OuiFloatable} from '../floatable/floatable.model';
import {type OuiNavigable, type OuiNavigableOptions} from '../internal/navigable/navigable.model';

// #region Types

export type OuiBasicMenu = {
	destroy(): void;
};

export type OuiBasicMenuOptions = Pick<OuiNavigableOptions, 'role' | 'selector' | 'vertical'>;

export type OuiMenu = {
	content: Element;
	element: Element;
	floatable: OuiFloatable;
	navigable: OuiNavigable;
	toggle: Element;
	get open(): boolean;
	destroy(): void;
};

export type OuiMenubar = {
	element: Element;
	navigable: OuiNavigable;
	destroy(): void;
};

// #endregion

// #region Variables

export const MENU_ATTRIBUTE = 'oui-menu';

export const MENU_ATTRIBUTE_POSITION: string = `${MENU_ATTRIBUTE}-position`;

export const MENUBAR_ATTRIBUTE = 'oui-menubar';

export const MENU_SELECTOR_CONTENT: string = `[${MENU_ATTRIBUTE}-content]`;

export const MENU_SELECTOR_ITEM: string = `:scope > [${MENU_ATTRIBUTE}-item], :scope > * > [${MENU_ATTRIBUTE}-item]`;

export const MENU_SELECTOR_TOGGLE: string = `[${MENU_ATTRIBUTE}-toggle]`;

export const MENUBAR_SELECTOR: string = `[${MENUBAR_ATTRIBUTE}]`;

export const MENUBAR_SELECTOR_ITEM: string = `:scope > [${MENUBAR_ATTRIBUTE}-item], :scope > * > [${MENUBAR_ATTRIBUTE}-item]`;

export const MENU_MENUBAR_SELECTORS: string = `${MENUBAR_SELECTOR}, ${MENU_SELECTOR_CONTENT}`;

export const menubars: WeakMap<Element, OuiMenubar> = new WeakMap();

export const menus: WeakMap<Element, OuiMenu> = new WeakMap();

// #endregion
