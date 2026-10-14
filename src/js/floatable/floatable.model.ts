// #region Types

export type CreateOuiFloatableOptions = {
	/**
	 * Open the floatable when created? _(defaults to `true`)_
	 */
	open?: boolean;
	/**
	 * Position of the floatable _(defaults to `below`)_
	 */
	position?: OuiFloatablePosition;
};

export type OuiFloatable = {
	[FLOATABLE_SYMBOL]: OuiFloatableState;

	/**
	 * Is the floatable open?
	 */
	get open(): boolean;

	/**
	 * Open or close the floatable
	 */
	set open(value: boolean);

	/**
	 * Destroy the floatable, removing it from the DOM and cleaning up references
	 */
	destroy(): void;

	/**
	 * Closes the floatable
	 */
	hide(): void;

	/**
	 * Opens the floatable
	 */
	show(): void;

	/**
	 * Update the position of the floatable, with an optional new position
	 *
	 * @param position Optional new position
	 */
	update(position?: OuiFloatablePosition): void;
};

export type OuiFloatableOptions = {
	attribute?: string;
	position: OuiFloatablePosition;
	reusable: boolean;
};

export type OuiFloatablePosition =
	| 'above'
	| 'above-end'
	| 'above-start'
	| 'below'
	| 'below-end'
	| 'below-start'
	| 'end'
	| 'end-bottom'
	| 'end-top'
	| 'start'
	| 'start-bottom'
	| 'start-top';

export type OuiFloatableState = {
	anchor: HTMLElement;
	content: HTMLElement;
	destroyed: boolean;
	name: string;
	options: OuiFloatableOptions;
};

// #endregion

// #region Variables

export const FLOATABLE_AREAS: Record<OuiFloatablePosition, string> = {
	above: 'block-start',
	'above-end': 'start span-start',
	'above-start': 'start span-end',
	below: 'block-end',
	'below-end': 'end span-start',
	'below-start': 'end span-end',
	end: 'center end',
	'end-bottom': 'span-start end',
	'end-top': 'span-end end',
	start: 'center start',
	'start-bottom': 'span-start start',
	'start-top': 'span-end start',
};

export const FLOATABLE_ATTRIBUTE = 'oui-floatable';

export const FLOATABLE_ATTRIBUTE_POSITION = 'oui-position';

export const FLOATABLE_MESSAGE = 'Anchor and content must be an HTMLElement or SVGElement';

export const FLOATABLE_POSITIONS = Object.fromEntries(
	Object.entries(FLOATABLE_AREAS).map(([position, area]) => [area, position]),
) as Record<string, OuiFloatablePosition>;

export const FLOATABLE_SYMBOL: unique symbol = Symbol(FLOATABLE_ATTRIBUTE);

export const floatables: WeakMap<HTMLElement, OuiFloatable> = new WeakMap();

// #endregion
