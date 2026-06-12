export class Floatable {
	constructor(
		public anchor: HTMLElement,
		public content: HTMLElement,
		public options: FloatableOptions,
	) {
		const anchorName = getAnchorName(anchor);

		anchor.style.anchorName = anchorName;
		content.style.positionAnchor = anchorName;
	}

	destroy(): void {
		this.anchor = null as never;
		this.content = null as never;
	}

	update(): void {
		setPosition(this);
	}
}

export type FloatableOptions = {
	attribute: string;
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

export function createFloatable(
	anchor: HTMLElement | null,
	content: HTMLElement,
	options: FloatableOptions,
): Floatable | undefined {
	if (anchor == null) {
		return;
	}

	let floatable = instances.get(content);

	if (floatable == null) {
		floatable = new Floatable(anchor, content, options);

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

export function removeFloatable(content: HTMLElement): void {
	instances.get(content)?.destroy();
	instances.delete(content);
}

function setPosition(floatable: Floatable): void {
	let position: FloatablePosition =
		(floatable.anchor.getAttribute(floatable.options.attribute) as FloatablePosition) ??
		floatable.options.position;

	if (AREAS[position] == null) {
		position = floatable.options.position;
	}

	const area = AREAS[position];

	floatable.content.style.positionArea = area;

	floatable.content.setAttribute(ATTRIBUTE, POSITIONS[area]);
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

const ATTRIBUTE = 'oui-position';

const POSITIONS = Object.fromEntries(
	Object.entries(AREAS).map(([position, area]) => [area, position]),
) as Record<string, FloatablePosition>;

const instances = new WeakMap<HTMLElement, Floatable>();

let index = 0;
