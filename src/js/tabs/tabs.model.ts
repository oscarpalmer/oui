import type {OuiNavigable, OuiNavigableOrientation} from '../internal/navigable/navigable.model';

// #region Types

export type GenericOuiTabsElement = {
	[TABS_SYMBOL]: OuiTabsState;
} & HTMLElement;

export class OuiTabsEvent extends Event {
	constructor(
		name: 'oui:beforechange' | 'oui:change',
		public oldIndex: number,
		public newIndex: number,
		cancelable: boolean,
	) {
		super(name, {
			cancelable,
			bubbles: true,
			composed: true,
		});
	}
}

export type OuiTabsContent = {
	element: HTMLDivElement;
	panels: OuiTabsPanels;
};

export type OuiTabsPanels = {
	elements: HTMLElement[];
	hidden: Array<boolean | 'until-found'>;
	roles: Array<string | null>;
};

export type OuiTabsState = {
	component: OuiTabsStateComponent;
};

export type OuiTabsStateComponent = {
	active: number;
	content: HTMLDivElement;
	host: GenericOuiTabsElement;
	id: string;
	navigable?: OuiNavigable;
	orientation: OuiNavigableOrientation;
	panels: OuiTabsPanels;
	tabList: OuiTabsTabList;
};

export type OuiTabsTabList = {
	element: HTMLDivElement;
	tabs: HTMLButtonElement[];
};

// #endregion

// #region Variables

export const TABS_TAGNAME = 'oui-tabs';

export const TABS_SYMBOL: unique symbol = Symbol(TABS_TAGNAME);

// #endregion
