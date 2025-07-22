export class Floatable {
		activate: number | undefined;

		active = false;

		deactivate: number | undefined;

		frame: DOMHighResTimeStamp | undefined;

		constructor(
			public anchor: HTMLElement,
			public content: HTMLElement,
			readonly attribute: string,
			readonly position: Position,
			readonly preferAbove: boolean,
		) {
			setStyles(content);
		}

		destroy(): void {
			this.activate = undefined;
			this.deactivate = undefined;
			this.frame = undefined;

			this.anchor = undefined as never;
			this.content = undefined as never;
		}
	}

type Position =
	| 'above'
	| 'above-end'
	| 'above-start'
	| 'below'
	| 'below-end'
	| 'below-start'
	| 'end'
	| 'end-bottom'
	| 'end-top'
	| 'horizontal'
	| 'horizontal-bottom'
	| 'horizontal-top'
	| 'start'
	| 'start-bottom'
	| 'start-top'
	| 'vertical'
	| 'vertical-end'
	| 'vertical-start';

//

export function activate(
	floatable: Floatable,
	active: Set<Floatable>,
	order?: Floatable[],
	time?: number,
): void {
	stop(floatable);

	if (floatable.active) {
		return;
	}

	if (time == null || time === 0) {
		onActivate(floatable, active, order);
	} else {
		floatable.activate = +setTimeout(() => {
			onActivate(floatable, active, order);
		}, time);
	}
}

export function deactivate(
	floatable: Floatable,
	active: Set<Floatable>,
	order?: Floatable[],
	time?: number,
): void {
	stop(floatable);

	if (!floatable.active) {
		return;
	}

	if (time == null || time === 0) {
		onDeactivate(floatable, active, order);
	} else {
		floatable.deactivate = +setTimeout(() => {
			onDeactivate(floatable, active, order);
		}, time);
	}
}

function getX(anchor: DOMRect, content: DOMRect, position: Position): number {
	if (position.endsWith('-end')) {
		const end = anchor.right - content.width;

		return end - margin < 0 ? margin : end;
	}

	if (position.endsWith('-start')) {
		const start = anchor.left;

		return start + content.width + margin > window.innerWidth
			? window.innerWidth - content.width - margin
			: start;
	}

	if (position.startsWith('end')) {
		return anchor.right + margin;
	}

	if (position.startsWith('start')) {
		return anchor.left - content.width - margin;
	}

	if (position.startsWith('horizontal')) {
		if (anchor.right + content.width + margin <= window.innerWidth) {
			return anchor.right + margin;
		}

		return anchor.left - content.width - margin;
	}

	return anchor.left + (anchor.width - content.width) / 2;
}

function getY(
	anchor: DOMRect,
	content: DOMRect,
	position: Position,
	preferAbove: boolean,
): number {
	if (position.startsWith('above')) {
		return anchor.top - content.height - margin;
	}

	if (position.startsWith('below')) {
		return anchor.bottom + margin;
	}

	if (position.endsWith('bottom')) {
		const bottom = anchor.bottom - content.height;

		return bottom + margin < 0 ? margin : bottom;
	}

	if (position.endsWith('top')) {
		const top = anchor.top;

		return top + content.height + margin > window.innerHeight
			? window.innerHeight - content.height - margin
			: top;
	}

	if (position.startsWith('vertical')) {
		if (preferAbove && anchor.top - content.height - margin >= 0) {
			return anchor.top - content.height - margin;
		}

		if (anchor.bottom + content.height + margin <= document.body.clientHeight) {
			return anchor.bottom + margin;
		}

		return anchor.top - content.height - margin;
	}

	return anchor.top + (anchor.height - content.height) / 2;
}

function onActivate(
	floatable: Floatable,
	active: Set<Floatable>,
	order?: Floatable[],
): void {
	floatable.active = true;

	active.add(floatable);

	if (order != null) {
		order.push(floatable);
	}

	document.body.append(floatable.content);

	floatable.content.hidden = false;

	update(floatable);
}

function onDeactivate(
	floatable: Floatable,
	active: Set<Floatable>,
	order?: Floatable[],
): void {
	floatable.active = false;

	active.delete(floatable);

	const index = order?.indexOf(floatable) ?? -1;

	if (index > -1) {
		order?.splice(index, 1);
	}

	floatable.content.hidden = true;

	floatable.anchor.insertAdjacentElement('afterend', floatable.content);
}

function update(floatable: Floatable): void {
	let position: Position =
		(floatable.anchor.getAttribute(floatable.attribute)?.trim() as Position) ??
		floatable.position;

	if (!positions.has(position as Position)) {
		position = floatable.position;
	}

	function run(): void {
			const anchor = floatable.anchor.getBoundingClientRect();
			const content = floatable.content.getBoundingClientRect();

			const left = getX(anchor, content, position);
			const top = getY(anchor, content, position, floatable.preferAbove);

			floatable.content.style.inset = `${top}px auto auto ${left}px`;

			floatable.frame = requestAnimationFrame(run);
		}

	floatable.frame = requestAnimationFrame(run);
}

function setStyles(content: HTMLElement): void {
	content.style.position = 'fixed';
	content.style.inset = '0 auto auto 0';
	content.style.zIndex = '10';
}

function stop(floatable: Floatable): void {
	if (floatable.frame != null) {
		cancelAnimationFrame(floatable.frame);
	}

	if (floatable.activate != null) {
		clearTimeout(floatable.activate);
	}

	if (floatable.deactivate != null) {
		clearTimeout(floatable.deactivate);
	}

	floatable.activate = undefined;
	floatable.deactivate = undefined;
	floatable.frame = undefined;
}

//

const margin =
	Number.parseInt(getComputedStyle(document.documentElement).fontSize, 10) / 2;

const positions = new Set<Position>([
	'above',
	'above-end',
	'above-start',
	'below',
	'below-end',
	'below-start',
	'end',
	'end-bottom',
	'end-top',
	'horizontal',
	'horizontal-bottom',
	'horizontal-top',
	'start',
	'start-bottom',
	'start-top',
	'vertical',
	'vertical-end',
	'vertical-start',
]);
