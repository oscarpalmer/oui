import {isPlainObject} from '@oscarpalmer/atoms/is';
import {on} from '@oscarpalmer/toretto/event';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';

// #region Types

type CreateOuiFloatableOptions = {
	/**
	 * Open the floatable when created? _(defaults to `true`)_
	 */
	open?: boolean;
	/**
	 * Position of the floatable _(defaults to `below`)_
	 */
	position?: OuiFloatablePosition;
};

export class OuiFloatable {
	#destroyed = false;

	readonly #state: OuiFloatableState;

	/**
	 * Is the floatable open?
	 */
	get open(): boolean {
		return this.#state.content.checkVisibility();
	}

	/**
	 * Open or close the floatable
	 */
	set open(value: boolean) {
		if (value === true) {
			this.show();
		} else if (value === false) {
			this.hide();
		}
	}

	constructor(state: OuiFloatableState, standalone: boolean) {
		this.#state = state;

		const {anchor, content} = state;

		if (standalone) {
			content.setAttribute(ATTRIBUTE_FLOATABLE, '');

			content.popover = 'manual';
		}

		const anchorName = getAnchorName(anchor);

		anchor.style.anchorName = anchorName;
		content.style.positionAnchor = anchorName;
	}

	/**
	 * Destroy the floatable, removing it from the DOM and cleaning up references
	 */
	destroy(): void {
		if (this.#destroyed) {
			return;
		}

		this.#destroyed = true;

		removeFloatable(this.#state.content);

		this.#state.anchor = null as never;
		this.#state.content = null as never;
	}

	/**
	 * Closes the floatable
	 */
	hide(): void {
		if (!this.#destroyed && this.open) {
			this.#state.content.hidePopover();
		}
	}

	/**
	 * Opens the floatable
	 */
	show(): void {
		if (!this.#destroyed && !this.open) {
			this.#state.content.showPopover();
		}
	}

	/**
	 * Update the position of the floatable, with an optional new position
	 *
	 * @param position Optional new position
	 */
	update(position?: OuiFloatablePosition): void {
		if (!this.#destroyed) {
			setPosition(this.#state, position);
		}
	}
}

export type OuiFloatableOptions = {
	attribute?: string;
	position: OuiFloatablePosition;
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

type OuiFloatableState = {
	anchor: HTMLElement;
	content: HTMLElement;
	options: OuiFloatableOptions;
};

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
		throw new TypeError(MESSAGE);
	}

	let floatable = instances.get(content);

	if (floatable == null) {
		floatable = new OuiFloatable(getState(anchor, content, options), standalone);

		instances.set(content, floatable);
	}

	return floatable;
}

export function getOnBeforeToggleListener(element: HTMLElement): RemovableEventListener {
	return on(
		element,
		EVENT_BEFORE,
		event => {
			const {newState, source} = event;

			if (newState === STATE_OPEN && source?.getAttribute(ARIA_DISABLED) === TRUE) {
				event.preventDefault();
			}
		},
		{
			passive: false,
		},
	);
}

function getOptions(input?: CreateOuiFloatableOptions): Required<CreateOuiFloatableOptions> {
	const object = isPlainObject(input) ? input : {};

	return {
		open: typeof object.open === 'boolean' ? object.open : true,
		position: object.position != null && object.position in AREAS ? object.position : 'below',
	};
}

function getPosition(
	state: OuiFloatableState,
	override?: OuiFloatablePosition,
): OuiFloatablePosition {
	if (override != null && override in AREAS) {
		return override;
	}

	const {anchor, options} = state;

	if (options.attribute == null) {
		return options.position;
	}

	const attribute = anchor.getAttribute(options.attribute) ?? '';

	return attribute in AREAS ? (attribute as OuiFloatablePosition) : options.position;
}

function getState(
	anchor: HTMLElement,
	content: HTMLElement,
	options: OuiFloatableOptions,
): OuiFloatableState {
	const state: OuiFloatableState = {
		anchor,
		content,
		options,
	};

	return state;
}

export function removeFloatable(content: HTMLElement): void {
	instances.get(content)?.destroy();
	instances.delete(content);
}

function setPosition(state: OuiFloatableState, override?: OuiFloatablePosition): void {
	const position = getPosition(state, override);

	const area = AREAS[position];

	state.content.style.positionArea = area;

	state.content.setAttribute(ATTRIBUTE_POSITION, POSITIONS[area]);
}

// #endregion

// #region Variables

const AREAS: Record<OuiFloatablePosition, string> = {
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

const ARIA_DISABLED = 'aria-disabled';

export const ATTRIBUTE_FLOATABLE = 'oui-floatable';

const ATTRIBUTE_POSITION = 'oui-position';

const EVENT_BEFORE = 'beforetoggle';

const MESSAGE = 'Anchor and content must be an HTMLElement or SVGElement';

const POSITIONS = Object.fromEntries(
	Object.entries(AREAS).map(([position, area]) => [area, position]),
) as Record<string, OuiFloatablePosition>;

const STATE_OPEN = 'open';

const TRUE = 'true';

const instances = new WeakMap<HTMLElement, OuiFloatable>();

let index = 0;

// #endregion
