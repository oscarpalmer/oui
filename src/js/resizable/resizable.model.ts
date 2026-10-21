import type {StyleToggler} from '@oscarpalmer/toretto/style';

// #region Types

export type CreateOuiResizableOptions = {
	maximumHeight?: number;
	maximumWidth?: number;
	minimumHeight?: number;
	minimumWidth?: number;
};

export type OuiResizable = {
	[RESIZABLE_SYMBOL]: OuiResizableState;

	destroy(): void;

	reset(): void;

	set(): void;
};

export type OuiResizableDirection = 'horizontal' | 'vertical' | 'x' | 'y';

export type OuiResizableItem = {
	instance: OuiResizable;
	state: OuiResizableState;
};

export type OuiResizableState = {
	element: Element;
	handle: Element;
	height: number;
	horizontal: boolean;
	options: Required<CreateOuiResizableOptions>;
	styles: StyleToggler;
	vertical: boolean;
	width: number;
};

// #endregion

// #region Variables

export const RESIZABLE_ATTRIBUTE = 'oui-resizable';

export const RESIZABLE_ATTRIBUTE_DIRECTION: string = `${RESIZABLE_ATTRIBUTE}-direction`;

export const RESIZABLE_ATTRIBUTE_HANDLE: string = `${RESIZABLE_ATTRIBUTE}-handle`;

export const RESIZABLE_ATTRIBUTE_MAXIMUM: string = `${RESIZABLE_ATTRIBUTE}-maximum`;

export const RESIZABLE_ATTRIBUTE_MINIMUM: string = `${RESIZABLE_ATTRIBUTE}-minimum`;

export const RESIZABLE_MESSAGE_ELEMENT =
	'The element must be an instance of HTMLElement or SVGElement';

export const RESIZABLE_MESSAGE_HEIGHT =
	'The maximum height must be greater than the minimum height';

export const RESIZABLE_MESSAGE_HANDLE: string = `The element must contain a child with the attribute "${RESIZABLE_ATTRIBUTE_HANDLE}"`;

export const RESIZABLE_MESSAGE_WIDTH = 'The maximum width must be greater than the minimum width';

export const RESIZABLE_SELECTOR: string = `[${RESIZABLE_ATTRIBUTE}]`;

export const RESIZABLE_SELECTOR_HANDLE: string = `[${RESIZABLE_ATTRIBUTE_HANDLE}]`;

export const RESIZABLE_SELECTOR_HANDLE_SCOPED: string = `:scope > ${RESIZABLE_SELECTOR_HANDLE}`;

export const RESIZABLE_SYMBOL: unique symbol = Symbol(RESIZABLE_ATTRIBUTE);

export const resizableHorizontals: Set<OuiResizableDirection> = new Set(['horizontal', 'x']);

export const resizableItems: WeakMap<Element, OuiResizableItem> = new WeakMap();

export const resizableStyles = {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
};

export const resizableVerticals: Set<OuiResizableDirection> = new Set(['vertical', 'y']);

// #endregion
