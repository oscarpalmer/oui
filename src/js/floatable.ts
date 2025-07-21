export class Floatable {
	activate: number | undefined;
	active = false;
	deactivate: number | undefined;
	frame: DOMHighResTimeStamp | undefined;

	constructor(
		public anchor: HTMLElement,
		public content: HTMLElement,
	) {}

	destroy(): void {
		this.activate = undefined;
		this.deactivate = undefined;
		this.frame = undefined;

		this.anchor = undefined as never;
		this.content = undefined as never;
	}
}

export function activate(
	floatable: Floatable,
	active: Set<Floatable>,
	time?: number,
): void {
	stop(floatable);

	if (floatable.active) {
		return;
	}

	if (time == null || time === 0) {
		onActivate(floatable, active);
	} else {
		floatable.activate = +setTimeout(() => {
			onActivate(floatable, active);
		}, time);
	}
}

export function deactivate(
	floatable: Floatable,
	active: Set<Floatable>,
	time?: number,
): void {
	stop(floatable);

	if (!floatable.active) {
		return;
	}

	if (time == null || time === 0) {
		onDeactivate(floatable, active);
	} else {
		floatable.deactivate = +setTimeout(() => {
			onDeactivate(floatable, active);
		}, time);
	}
}

function getX(
	anchor: DOMRect,
	content: DOMRect,
): {left?: number; right?: number} {
	if (content.width + 2 * margin >= window.innerWidth) {
		return {
			left: margin,
			right: margin,
		};
	}

	const left = anchor.left + (anchor.width - content.width) / 2;
	const right = window.innerWidth - margin;

	if (left < margin) {
		return {
			left: margin,
		};
	}

	if (left + content.width > right) {
		return {
			right: margin,
		};
	}

	return {
		left,
	};
}

function getY(anchor: DOMRect, content: DOMRect): number {
	let top = anchor.top - content.height - margin;

	if (top - margin >= 0) {
		return top;
	}

	top = anchor.bottom + margin;

	if (top + content.height + margin <= window.innerHeight) {
		return top;
	}

	return anchor.top + (anchor.height - content.height) / 2;
}

function onActivate(floatable: Floatable, active: Set<Floatable>): void {
	floatable.active = true;

	active.add(floatable);

	document.body.append(floatable.content);

	floatable.content.hidden = false;

	update(floatable);
}

function onDeactivate(floatable: Floatable, active: Set<Floatable>): void {
	floatable.active = false;

	active.delete(floatable);

	floatable.content.hidden = true;

	floatable.anchor.insertAdjacentElement('afterend', floatable.content);
}

function update(floatable: Floatable): void {
	function run(): void {
		const anchor = floatable.anchor.getBoundingClientRect();
		const content = floatable.content.getBoundingClientRect();

		const {left, right} = getX(anchor, content);
		const top = getY(anchor, content);

		floatable.content.style.inset = `${top}px ${right == null ? 'auto' : `${right}px`} auto ${left == null ? 'auto' : `${left}px`}`;

		floatable.frame = requestAnimationFrame(run);
	}

	floatable.frame = requestAnimationFrame(run);
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
	Number.parseInt(getComputedStyle(document.documentElement).fontSize, 10) / 4;
