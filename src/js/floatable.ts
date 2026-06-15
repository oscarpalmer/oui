import {isPlainObject} from '@oscarpalmer/atoms/is';
import {isHTMLOrSVGElement} from '@oscarpalmer/toretto/is';

export class Floatable {
	#destroyed = false;

	/**
	 * Is the _Floatable_ open?
	 */
	get open(): boolean {
		return this.content.checkVisibility();
	}

	constructor(
		public anchor: HTMLElement,
		public content: HTMLElement,
		public options: FloatableOptions,
		standalone: boolean,
	) {
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

		removeFloatable(this.content);

		this.anchor = null as never;
		this.content = null as never;
	}

	/**
	 * Hide the floatable
	 */
	hide(): void {
		if (!this.#destroyed) {
			this.content.hidePopover();
		}
	}

	/**
	 * Show the floatable
	 */
	show(): void {
		if (!this.#destroyed) {
			this.content.showPopover();
		}
	}

	/**
	 * Update the position of the floatable, with an optional new position
	 *
	 * @param position Optional new position
	 */
	update(position?: FloatablePosition): void {
		if (!this.#destroyed) {
			setPosition(this, position);
		}
	}
}

export type FloatableOptions = {
	attribute?: string;
	position: FloatablePosition;
};

export type FloatablePosition =
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

type GetFloatableOptions = {
	/**
	 * Open the _Floatable_ when created? _(defaults to `true`)_
	 */
	open?: boolean;
	/**
	 * Position of the _Floatable_ _(defaults to `below`)_
	 */
	position?: FloatablePosition;
};

export function createFloatable(
	anchor: HTMLElement,
	content: HTMLElement,
	options: FloatableOptions,
	standalone: boolean,
): Floatable {
	if (!isHTMLOrSVGElement(anchor) || !isHTMLOrSVGElement(content)) {
		throw new TypeError('Anchor and content must be an HTMLElement or SVGElement.');
	}

	let floatable = instances.get(content);

	if (floatable == null) {
		floatable = new Floatable(anchor, content, options, standalone);

		instances.set(content, floatable);
	}

	return floatable;
}

function getAnchorName(anchor: HTMLElement): string {
	let {anchorName} = anchor.style;

	if (anchorName.length > 0) {
		return anchorName;
	}

	index += 1;

	return `--oui-floatable-anchor-${index}`;
}

/**
 * Create a _Floatable_ for an anchor and content element
 *
 * @param anchor Anchor element
 * @param content Content element
 * @param options _Floatable_ options
 * @returns _Floatable_ instance
 */
export function getFloatable(
	anchor: HTMLElement | SVGElement,
	content: HTMLElement | SVGElement,
	options?: GetFloatableOptions,
): Floatable {
	const {open, position} = getOptions(options);

	const floatable = createFloatable(
		anchor as HTMLElement,
		content as HTMLElement,
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

function getOptions(input?: GetFloatableOptions): Required<GetFloatableOptions> {
	const object = isPlainObject(input) ? input : {};

	return {
		open: typeof object.open === 'boolean' ? object.open : true,
		position: object.position != null && object.position in AREAS ? object.position : 'below',
	};
}

function getPosition(floatable: Floatable, override?: FloatablePosition): FloatablePosition {
	if (override != null && override in AREAS) {
		return override;
	}

	if (floatable.options.attribute == null) {
		return floatable.options.position;
	}

	const attribute = floatable.anchor.getAttribute(floatable.options.attribute) ?? '';

	return attribute in AREAS ? (attribute as FloatablePosition) : floatable.options.position;
}

export function removeFloatable(content: HTMLElement): void {
	instances.get(content)?.destroy();
	instances.delete(content);
}

function setPosition(floatable: Floatable, override?: FloatablePosition): void {
	const position = getPosition(floatable, override);

	const area = AREAS[position];

	floatable.content.style.positionArea = area;

	floatable.content.setAttribute(ATTRIBUTE_POSITION, POSITIONS[area]);
}

const AREAS: Record<FloatablePosition, string> = {
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

export const ATTRIBUTE_FLOATABLE = 'oui-floatable';

const ATTRIBUTE_POSITION = 'oui-position';

const POSITIONS = Object.fromEntries(
	Object.entries(AREAS).map(([position, area]) => [area, position]),
) as Record<string, FloatablePosition>;

const instances = new WeakMap<HTMLElement, Floatable>();

let index = 0;
