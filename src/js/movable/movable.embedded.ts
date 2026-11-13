import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {getStyles} from '@oscarpalmer/toretto/style';
import {attributable} from '../internal/attributable';
import {initializeMovableEvents} from './movable.event';
import {setMovableContainer, setMovableDirection, unsetMovableContainer} from './movable.misc';
import {
	MOVABLE_ATTRIBUTE,
	MOVABLE_ATTRIBUTE_CONTAINER,
	MOVABLE_ATTRIBUTE_DIRECTION,
	MOVABLE_MESSAGE,
	MOVABLE_SYMBOL,
	movables,
	movableStyleToggler,
	type OuiMovable,
	type OuiMovableOptions,
} from './movable.model';

// #region Instances

function OuiMovable(this: OuiMovable, element: Element, options?: OuiMovableOptions): void {
	const style = getStyles(element, ['inset', 'position']);

	this[MOVABLE_SYMBOL] = {
		element,
		container: {
			attribute: MOVABLE_ATTRIBUTE_CONTAINER,
		},
		direction: {
			attribute: MOVABLE_ATTRIBUTE_DIRECTION,
			horizontal: true,
			vertical: true,
		},
		moved: false,
		options: options ?? {},
		style: {
			original: style,
			toggler: movableStyleToggler,
		},
	};

	setMovableContainer(this[MOVABLE_SYMBOL], options?.container);
	setMovableDirection(this[MOVABLE_SYMBOL], options?.direction);

	setAttribute(element, MOVABLE_ATTRIBUTE, '');
}

OuiMovable.prototype.destroy = destroyMovable;

Object.defineProperties(OuiMovable.prototype, {
	element: {
		enumerable: true,
		get: getMovableElement,
	},
});

// #endregion

// #region Functions

function addMovable(element: Element): void {
	if (!movables.has(element)) {
		createMovable(element);
	}
}

export function createMovable(element: Element, options?: OuiMovableOptions): OuiMovable {
	if (!(element instanceof Element)) {
		throw new TypeError(MOVABLE_MESSAGE);
	}

	let movable = movables.get(element);

	if (movable == null) {
		// @ts-expect-error All good, no worries :-)
		movable = new OuiMovable(element, options) as OuiMovable;

		movables.set(element, movable);
	}

	return movable;
}

function destroyMovable(this: OuiMovable): void {
	setAttribute(this[MOVABLE_SYMBOL].element, MOVABLE_ATTRIBUTE);
}

function getMovableElement(this: OuiMovable): Element {
	return this[MOVABLE_SYMBOL].element;
}

function removeMovable(element: Element): void {
	const movable = movables.get(element);

	if (movable == null) {
		return;
	}

	movables.delete(element);

	const state = movable[MOVABLE_SYMBOL];

	unsetMovableContainer(state, state.container.element);

	state.container.element = undefined;
	state.element = undefined as never;
	state.offset = undefined;
	state.options = undefined as never;
	state.style = undefined as never;
}

// #endregion

// #region Variables

// #endregion

// #region Initialization

attributable(MOVABLE_ATTRIBUTE, addMovable, removeMovable);

initializeMovableEvents();

// #endregion
