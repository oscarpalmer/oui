import {toggleStyles, type StyleToggler} from '@oscarpalmer/toretto/style';

// #region Types

export type GenericOuiSplitterElement = {
	[SPLITTER_SYMBOL]: OuiSplitter;
} & HTMLElement;

export type OuiSplitter = {
	element: GenericOuiSplitterElement;
	handle: HTMLSpanElement;
	panels: HTMLElement[];
	rectangle: DOMRect;
	separator: HTMLDivElement;
	types: OuiSplitterTypes;
	values: OuiSplitterValues;
	updateObserver(add: 0 | 1): void;
	updateOrientation(): void;
	updateValues(): void;
};

export type OuiSplitterTypes = {
	auto: boolean;
	horizontal: boolean;
};

export type OuiSplitterValues = {
	max: number;
	min: number;
	now: OuiSplitterValuesNow;
};

export type OuiSplitterValuesNow = {
	current: number;
	previous: number;
};

// #endregion

// #region Special variables

export const SPLITTER_TAGNAME = 'oui-splitter';

export const SPLITTER_ATTRIBUTE_ACTIVE: string = `${SPLITTER_TAGNAME}-active`;

export const SPLITTER_ATTRIBUTE_HANDLE: string = `${SPLITTER_TAGNAME}-handle`;

export const SPLITTER_ATTRIBUTE_HORIZONTAL: string = `${SPLITTER_TAGNAME}-horizontal`;

export const SPLITTER_ATTRIBUTE_MAX = 'max';

export const SPLITTER_ATTRIBUTE_MIN = 'min';

export const SPLITTER_ATTRIBUTE_SIZE = 'size';

export const SPLITTER_ATTRIBUTE_TYPE = 'type';

export const SPLITTER_ATTRIBUTE_SEPARATOR: string = `${SPLITTER_TAGNAME}-separator`;

export const SPLITTER_KEYS_ABSOLUTE: Set<string> = new Set(['End', 'Home']);

export const SPLITTER_KEYS_HORIZONTAL: Set<string> = new Set(['ArrowDown', 'ArrowUp']);

export const SPLITTER_KEYS_NEGATIVE: Set<string> = new Set(['ArrowLeft', 'ArrowUp']);

export const SPLITTER_KEYS_VERTICAL: Set<string> = new Set(['ArrowLeft', 'ArrowRight']);

export const SPLITTER_KEYS_ALL: Set<string> = new Set([
	...SPLITTER_KEYS_ABSOLUTE,
	...SPLITTER_KEYS_HORIZONTAL,
	...SPLITTER_KEYS_VERTICAL,
]);

export const SPLITTER_MESSAGE: string = `<${SPLITTER_TAGNAME}> must have exactly two panels.`;

export const SPLITTER_METHODS_CONNECT = ['delete', 'set'] as const;

export const SPLITTER_METHODS_OBSERVE = ['unobserve', 'observe'] as const;

export const SPLITTER_NAVIGATION_MAXIMUM_PERCENTAGE = 0.9;

export const SPLITTER_NAVIGATION_MAXIMUM_TOTAL = 100;

export const SPLITTER_NAVIGATION_MINIMUM_PERCENTAGE = 0.1;

export const SPLITTER_NAVIGATION_MODIFIER = 0.05;

export const SPLITTER_SELECTOR_HANDLE: string = `[${SPLITTER_ATTRIBUTE_HANDLE}]`;

export const SPLITTER_SYMBOL: unique symbol = Symbol(SPLITTER_TAGNAME);

export const SPLITTER_VALUE_DECIMALS = 6;

export const splitterStyling: StyleToggler = toggleStyles(document.body, {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
});

// #endregion
