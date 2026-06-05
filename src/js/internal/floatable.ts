import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';

export class Floatable {
	active = false;

	disabled = false;

	frame: DOMHighResTimeStamp | undefined;

	ignoreFocus = false;

	constructor(readonly options: Options) {
		initialize(this);
	}

	destroy(): void {
		stop(this);

		const state = getState();

		state?.active.delete(this);
		state?.mapped.delete(this.options.anchor);
		state?.mapped.delete(this.options.content);

		this.options.anchor = undefined as never;
		this.options.content = undefined as never;
	}

	disable(): void {
		if (this.disabled) {
			return;
		}

		this.disabled = true;

		stop(this);

		getState()?.active.delete(this);
	}

	enable(): void {
		if (!this.disabled) {
			return;
		}

		this.disabled = false;

		initialize(this);
	}

	toggle(active: boolean, ignoreFocus?: boolean): void {
		if (this.disabled || this.active === active) {
			return;
		}

		const state = getState();

		if (state == null) {
			return;
		}

		this.ignoreFocus = !active && (ignoreFocus ?? false);

		stop(this);

		if (active) {
			state.active.add(this);
		} else {
			state.active.delete(this);
		}

		if (this.options.interactive) {
			if (active) {
				state.order.push(this);
			} else {
				const index = state.order.indexOf(this);

				if (index > -1) {
					state.order.splice(index, 1);
				}
			}
		}

		if (active) {
			activate(this);
		} else {
			deactivate(this);
		}
	}
}

type FloatableWindow = Window & {
	_oscarpalmer_oui_floatable: State;
};

type Options = {
	anchor: HTMLElement;
	content: HTMLElement;
	defaultPosition: Position;
	interactive: boolean;
	positionAttribute: string;
	reusable: boolean;
	onAfter?: (active: boolean) => void;
};

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
	| 'start'
	| 'start-bottom'
	| 'start-top';

type State = {
	active: Set<Floatable>;
	mapped: Map<HTMLElement, Floatable>;
	order: Floatable[];
};

//

function activate(floatable: Floatable): void {
	floatable.active = true;

	document.body.append(floatable.options.content);

	floatable.options.content.hidden = false;

	setPosition(floatable);
}

function closeAbove(element: HTMLElement): void {
	const state = getState();

	if (state == null) {
		return;
	}

	const index = state.order.findIndex(
		floatable => floatable.options.anchor === element || floatable.options.content === element,
	);

	if (index === -1 || index === state.order.length - 1) {
		return;
	}

	while (index < state.order.length - 1) {
		state.order.pop()?.toggle(false, true);
	}
}

function closeAll(): void {
	const state = getState();

	const floatables = [...(state?.active ?? [])];

	state?.active.clear();

	for (const floatable of floatables) {
		floatable.toggle(false, true);
	}
}

function closeNonInteractive(state: State): void {
	for (const floatable of state.active) {
		if (!floatable.options.interactive) {
			floatable.toggle(false);
		}
	}
}

export function deactivate(floatable: Floatable): void {
	floatable.active = false;

	if (!floatable.options.reusable) {
		floatable.options.content.hidden = true;

		floatable.options.anchor.insertAdjacentElement(INSERT_AFTEREND, floatable.options.content);
	}

	floatable.options.onAfter?.(false);
}

function getAnchorName(): string {
	index += 1;

	return `--oui-floatable-anchor-${index}`;
}

function getState(): State {
	return (window as unknown as FloatableWindow)._oscarpalmer_oui_floatable;
}

function initialize(floatable: Floatable): void {
	const {anchor, content, interactive} = floatable.options;

	if (interactive) {
		anchor.setAttribute(ATTRIBUTE_ANCHOR, '');
		content.setAttribute(ATTRIBUTE_CONTENT, '');
	}

	const anchorName = getAnchorName();

	anchor.style.anchorName = anchorName;

	content.style.position = 'absolute';
	content.style.positionAnchor = anchorName;
	content.style.positionTry = 'normal flip-start';

	const state = getState();

	state?.mapped.set(anchor, floatable);
	state?.mapped.set(content, floatable);
}

function isDisabled(element: HTMLElement): boolean {
	return (
		(element as HTMLInputElement).disabled ||
		(element as HTMLInputElement).readOnly ||
		element.getAttribute('aria-disabled') === 'true'
	);
}

function onClick(event: PointerEvent): void {
	const related = findAncestor(event, SELECTOR_ALL);

	if (!(related instanceof HTMLElement)) {
		closeAll();
	} else if (related.hasAttribute(ATTRIBUTE_CONTENT)) {
		closeAbove(related);
	} else if (!isDisabled(related)) {
		toggle(related);
	}
}

function onKeyDown(event: KeyboardEvent): void {
	if (event.key !== 'Escape') {
		return;
	}

	const state = getState();

	if (state == null || state.active.size === 0) {
		return;
	}

	closeNonInteractive(state);

	const related = findAncestor(event, SELECTOR_CONTENT);

	if (!(related instanceof HTMLElement)) {
		return;
	}

	closeAbove(related);

	const floatable = state.mapped.get(related);

	if (floatable != null) {
		floatable.toggle(false);
	}
}

function setPosition(floatable: Floatable): void {
	let position: Position =
		(floatable.options.anchor.getAttribute(floatable.options.positionAttribute) as Position) ??
		floatable.options.defaultPosition;

	if (AREAS[position] == null) {
		position = floatable.options.defaultPosition;
	}

	const area = AREAS[position];

	floatable.options.content.style.positionArea = area;

	floatable.options.content.setAttribute(ATTRIBUTE_POSITION, POSITIONS[area]);

	floatable.options.onAfter?.(true);
}

function stop(floatable: Floatable): void {
	if (floatable.frame != null) {
		cancelAnimationFrame(floatable.frame);
	}

	floatable.frame = undefined;
}

function toggle(anchor: HTMLElement): void {
	const floatable = getState()?.mapped.get(anchor);

	if (floatable == null) {
		closeAll();

		return;
	}

	const active = Boolean(floatable.active);
	const content = findAncestor(floatable.options.anchor, SELECTOR_CONTENT);

	if (content == null) {
		closeAll();
	} else {
		closeAbove(content as HTMLElement);
	}

	floatable.toggle(!active);
}

//

const AREAS: Record<Position, string> = {
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

const ATTRIBUTE_ANCHOR = 'oui-floatable-anchor';

const ATTRIBUTE_CONTENT = 'oui-floatable-content';

const ATTRIBUTE_POSITION = 'oui-position';

const INSERT_AFTEREND = 'afterend';

const POSITIONS = Object.fromEntries(
	Object.entries(AREAS).map(([position, area]) => [area, position]),
) as Record<string, Position>;

const SELECTOR_ALL = `[${ATTRIBUTE_ANCHOR}], [${ATTRIBUTE_CONTENT}]`;

const SELECTOR_CONTENT = `[${ATTRIBUTE_CONTENT}]`;

let index = 0;

//

if ((window as unknown as FloatableWindow)._oscarpalmer_oui_floatable == null) {
	Object.defineProperty(window, '_oscarpalmer_oui_floatable', {
		enumerable: false,
		value: {
			active: new Set(),
			mapped: new Map(),
			order: [],
		},
		writable: false,
	});

	on(document, 'keydown', event => {
		onKeyDown(event);
	});

	on(document, 'click', event => {
		onClick(event);
	});
}
