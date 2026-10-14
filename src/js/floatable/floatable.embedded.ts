import {isPlainObject} from '@oscarpalmer/atoms/is';
import {getAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {on} from '@oscarpalmer/toretto/event';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import {setStyle, setStyles} from '@oscarpalmer/toretto/style';
import {
	FLOATABLE_AREAS,
	FLOATABLE_ATTRIBUTE,
	FLOATABLE_ATTRIBUTE_POSITION,
	FLOATABLE_MESSAGE,
	FLOATABLE_POSITIONS,
	FLOATABLE_SYMBOL,
	floatables,
	type CreateOuiFloatableOptions,
	type OuiFloatable,
	type OuiFloatableOptions,
	type OuiFloatablePosition,
	type OuiFloatableState,
} from './floatable.model';

// #region Instances

function OuiFloatable(this: OuiFloatable, state: OuiFloatableState, standalone: boolean): void {
	this[FLOATABLE_SYMBOL] = state;

	initialize(state, standalone);
}

OuiFloatable.prototype.destroy = destroyFloatable;
OuiFloatable.prototype.hide = hideFloatable;
OuiFloatable.prototype.show = showFloatable;
OuiFloatable.prototype.update = updateFloatable;

Object.defineProperties(OuiFloatable.prototype, {
	open: {
		enumerable: true,
		get: getOpen,
		set: setOpen,
	},
});

// #endregion

// #region Functions

function getAnchorName(anchor: HTMLElement): string {
	let {anchorName} = anchor.style;

	if (anchorName.length > 0) {
		return anchorName;
	}

	index += 1;

	return `--oui-floatable-anchor-${index}`;
}

export function createEmbeddedFloatable(
	anchor: HTMLElement,
	content: HTMLElement,
	options: OuiFloatableOptions,
): OuiFloatable {
	return createInstance(anchor, content, options, false);
}

/**
 * Create a _OuiFloatable_ for an anchor and content element
 *
 * @param anchor Anchor element
 * @param content Content element
 * @param options _OuiFloatable_ options
 * @returns _OuiFloatable_ instance
 */
export function createFloatable(
	anchor: HTMLElement,
	content: HTMLElement,
	options?: CreateOuiFloatableOptions,
): OuiFloatable {
	const {open, position} = getOptions(options);

	const floatable = createInstance(
		anchor,
		content,
		{
			position,
			reusable: false,
		},
		true,
	);

	floatable?.update(position);

	if (open) {
		floatable?.show();
	}

	return floatable;
}

function createInstance(
	anchor: HTMLElement,
	content: HTMLElement,
	options: OuiFloatableOptions,
	standalone: boolean,
): OuiFloatable {
	if (!isHTMLOrSVGElement(anchor) || !isHTMLOrSVGElement(content)) {
		throw new TypeError(FLOATABLE_MESSAGE);
	}

	let floatable = options.reusable ? undefined : floatables.get(content);

	if (floatable == null) {
		// @ts-expect-error All good, no worries :-)
		floatable = new OuiFloatable(getState(anchor, content, options), standalone) as OuiFloatable;

		if (!options.reusable) {
			floatables.set(content, floatable);
		}
	}

	return floatable;
}

function destroyFloatable(this: OuiFloatable): void {
	const state = this[FLOATABLE_SYMBOL];

	if (state.destroyed) {
		return;
	}

	state.destroyed = true;

	removeFloatable(state.content);

	state.anchor = null as never;
	state.content = null as never;
}

export function getOnBeforeToggleListener(element: HTMLElement): RemovableEventListener {
	return on(
		element,
		'beforetoggle',
		event => {
			const {newState, source} = event;

			if (newState === 'open' && source != null && getAria(source, 'disabled') === true) {
				event.preventDefault();
			}
		},
		{
			passive: false,
		},
	);
}

function getOpen(this: OuiFloatable): boolean {
	return this[FLOATABLE_SYMBOL].content.checkVisibility();
}

function getOptions(input?: CreateOuiFloatableOptions): Required<CreateOuiFloatableOptions> {
	const object = isPlainObject(input) ? input : {};

	return {
		open: typeof object.open === 'boolean' ? object.open : true,
		position:
			object.position != null && object.position in FLOATABLE_AREAS ? object.position : 'below',
	};
}

function getPosition(
	state: OuiFloatableState,
	override?: OuiFloatablePosition,
): OuiFloatablePosition {
	if (override != null && override in FLOATABLE_AREAS) {
		return override;
	}

	const {anchor, options} = state;

	if (options.attribute == null) {
		return options.position;
	}

	const attribute = getAttribute(anchor, options.attribute);

	return attribute != null && attribute in FLOATABLE_AREAS
		? (attribute as OuiFloatablePosition)
		: options.position;
}

function getState(
	anchor: HTMLElement,
	content: HTMLElement,
	options: OuiFloatableOptions,
): OuiFloatableState {
	const name = getAnchorName(anchor);

	const state: OuiFloatableState = {
		anchor,
		content,
		name,
		options,
		destroyed: false,
	};

	return state;
}

function hideFloatable(this: OuiFloatable): void {
	const {content, destroyed} = this[FLOATABLE_SYMBOL];

	if (!destroyed && this.open) {
		content.hidePopover();
	}
}

function initialize(state: OuiFloatableState, standalone: boolean): void {
	const {anchor, content} = state;

	if (standalone) {
		setAttribute(content, FLOATABLE_ATTRIBUTE, '');

		content.popover = 'manual';
	} else {
		content.popover ??= 'auto';
	}

	setStyle(anchor, 'anchorName', state.name);
	setStyle(content, 'positionAnchor', state.name);
}

export function removeFloatable(content: HTMLElement): void {
	floatables.get(content)?.destroy();

	floatables.delete(content);
}

function setOpen(this: OuiFloatable, value: unknown): void {
	if (value === true) {
		this.show();
	} else if (value === false) {
		this.hide();
	}
}

function setPosition(state: OuiFloatableState, override?: OuiFloatablePosition): void {
	const position = getPosition(state, override);

	const area = FLOATABLE_AREAS[position];

	setAttribute(state.content, FLOATABLE_ATTRIBUTE_POSITION, FLOATABLE_POSITIONS[area]);

	setStyles(state.content, {
		positionAnchor: state.name,
		positionArea: area,
	});
}

function showFloatable(this: OuiFloatable): void {
	const {content, destroyed} = this[FLOATABLE_SYMBOL];

	if (!destroyed && !this.open) {
		content.showPopover();
	}
}

function updateFloatable(this: OuiFloatable, position?: OuiFloatablePosition): void {
	const state = this[FLOATABLE_SYMBOL];

	if (!state.destroyed) {
		setPosition(state, position);
	}
}

// #endregion

// #region Variables

let index = 0;

// #endregion
