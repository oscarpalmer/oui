import type {OuiFloatable, OuiFloatableOptions} from '../floatable/floatable.model';

// #region Types

export type OuiTooltip = {
	[TOOLTIP_SYMBOL]: OuiTooltipState;

	/**
	 * Is the tooltip open?
	 */
	get open(): boolean;

	/**
	 * Open or close the tooltip
	 */
	set open(value: boolean);

	/**
	 * Closes the tooltip
	 */
	hide(): void;

	/**
	 * Opens the tooltip
	 */
	show(): void;
};

export type OuiTooltipState = {
	anchor: Element;
	elements: Element[];
	floatable: OuiFloatable;
	timer?: number;
};

// #endregion

// #region Variables

export const TOOLTIP_ATTRIBUTE = 'oui-tooltip';

export const TOOLTIP_ATTRIBUTE_CONTENT: string = `${TOOLTIP_ATTRIBUTE}-content`;

export const TOOLTIP_ATTRIBUTE_CONTENT_OPEN: string = `${TOOLTIP_ATTRIBUTE_CONTENT}-open`;

export const TOOLTIP_SELECTOR: string = `[${TOOLTIP_ATTRIBUTE}]`;

export const TOOLTIP_SELECTOR_CONTENT: string = `[${TOOLTIP_ATTRIBUTE_CONTENT}]`;

export const TOOLTIP_SYMBOL: unique symbol = Symbol(TOOLTIP_ATTRIBUTE);

export const tooltipFloatableOptions: OuiFloatableOptions = {
	attribute: `${TOOLTIP_ATTRIBUTE}-position`,
	position: 'above',
	reusable: true,
};

export const tooltips: WeakMap<Element, OuiTooltip> = new WeakMap();

// #endregion
