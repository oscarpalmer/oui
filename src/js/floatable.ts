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
	// biome-ignore lint/style/useNamingConvention: Non-standard name to avoid conflicts
	_oscarpalmer_oui_floatable: State;
};

type Options = {
	anchor: HTMLElement;
	content: HTMLElement;
	defaultPosition: Position;
	interactive: boolean;
	positionAttribute: string;
	preferAbove: boolean;
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
	| 'horizontal'
	| 'horizontal-bottom'
	| 'horizontal-top'
	| 'start'
	| 'start-bottom'
	| 'start-top'
	| 'vertical'
	| 'vertical-end'
	| 'vertical-start';

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

	updatePosition(floatable);
}

function closeAbove(element: HTMLElement): void {
	const state = getState();

	if (state == null) {
		return;
	}

	const index = state.order.findIndex(
		floatable =>
			floatable.options.anchor === element ||
			floatable.options.content === element,
	);

	if (index === -1 || index === state.order.length - 1) {
		return;
	}

	while (index < state.order.length - 1) {
		void state.order.pop()?.toggle(false, true);
	}
}

function closeAll(): void {
	const state = getState();

	const floatables = [...(state?.active ?? [])];

	state?.active.clear();

	for (const floatable of floatables) {
		void floatable.toggle(false, true);
	}
}

function closeNonInteractive(state: State): void {
	for (const floatable of state.active) {
		if (!floatable.options.interactive) {
			void floatable.toggle(false);
		}
	}
}

export function deactivate(floatable: Floatable): void {
	floatable.active = false;

	floatable.options.content.hidden = true;

	floatable.options.anchor.insertAdjacentElement(
		INSERT_AFTEREND,
		floatable.options.content,
	);

	floatable.options.onAfter?.(false);
}

function getState(): State {
	return (window as unknown as FloatableWindow)._oscarpalmer_oui_floatable;
}

function getX(anchor: DOMRect, content: DOMRect, position: Position): number {
	if (position.endsWith(POSITION_SUFFIX_END)) {
		const end = anchor.right - content.width;

		return end < 0 ? 0 : end;
	}

	if (position.endsWith(POSITION_SUFFIX_START)) {
		const start = anchor.left;

		return start + content.width > window.innerWidth
			? window.innerWidth - content.width
			: start;
	}

	if (position.startsWith(POSITION_END)) {
		return anchor.right;
	}

	if (position.startsWith(POSITION_START)) {
		return anchor.left - content.width;
	}

	if (position.startsWith(POSITION_HORIZONTAL)) {
		if (anchor.right + content.width <= window.innerWidth) {
			return anchor.right;
		}

		return anchor.left - content.width;
	}

	const left = anchor.left + (anchor.width - content.width) / 2;

	return left < 0 ? 0 : left;
}

function getY(
	anchor: DOMRect,
	content: DOMRect,
	position: Position,
	preferAbove: boolean,
): number {
	if (position.startsWith(POSITION_ABOVE)) {
		return anchor.top - content.height;
	}

	if (position.startsWith(POSITION_BELOW)) {
		return anchor.bottom;
	}

	if (position.endsWith(POSITION_BOTTOM)) {
		const bottom = anchor.bottom - content.height;

		return bottom < 0 ? 0 : bottom;
	}

	if (position.endsWith(POSITION_TOP)) {
		const top = anchor.top;

		return top + content.height > window.innerHeight
			? window.innerHeight - content.height
			: top;
	}

	if (position.startsWith(POSITION_VERTICAL)) {
		if (preferAbove && anchor.top - content.height >= 0) {
			return anchor.top - content.height;
		}

		if (anchor.bottom + content.height <= document.body.clientHeight) {
			return anchor.bottom;
		}

		return anchor.top - content.height;
	}

	return anchor.top + (anchor.height - content.height) / 2;
}

function initialize(floatable: Floatable): void {
	const {anchor, content, interactive} = floatable.options;

	if (interactive) {
		anchor.setAttribute(ATTRIBUTE_ANCHOR, '');
		content.setAttribute(ATTRIBUTE_CONTENT, '');
	}

	content.style.position = 'fixed';
	content.style.inset = '0 auto auto 0';
	content.style.zIndex = '10';

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
	const related = findAncestor(event.target as never, SELECTOR_ALL);

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

	const related = findAncestor(event.target as never, SELECTOR_CONTENT);

	if (!(related instanceof HTMLElement)) {
		return;
	}

	closeAbove(related);

	const floatable = state.mapped.get(related);

	if (floatable != null) {
		void floatable.toggle(false);
	}
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

	void floatable.toggle(!active);
}

function updatePosition(floatable: Floatable): void {
	let position: Position =
		(floatable.options.anchor
			.getAttribute(floatable.options.positionAttribute)
			?.trim() as Position) ?? floatable.options.defaultPosition;

	if (!POSITIONS.has(position as Position)) {
		position = floatable.options.defaultPosition;
	}

	let previousAnchor: DOMRect;
	let previousContent: DOMRect;

	let calculated = false;
	let runOnAfter = false;

	function run(): void {
		const anchor = floatable.options.anchor.getBoundingClientRect();
		const content = floatable.options.content.getBoundingClientRect();

		if (calculated) {
			if (previousAnchor != null && previousContent != null) {
				if (
					PROPERTIES.every(
						property => anchor[property] === previousAnchor[property],
					) &&
					PROPERTIES.every(
						property => content[property] === previousContent[property],
					)
				) {
					floatable.frame = requestAnimationFrame(run);

					return;
				}
			}
		} else {
			calculated = true;
		}

		update(anchor, content);
	}

	function update(anchor: DOMRect, content: DOMRect): void {
		previousAnchor = anchor;
		previousContent = content;

		const left = getX(anchor, content, position);
		const top = getY(anchor, content, position, floatable.options.preferAbove);

		if (top + content.height > window.innerHeight) {
			floatable.options.content.style.height = `${window.innerHeight - top}px`;
		} else {
			floatable.options.content.style.height = '';
		}

		if (left + content.width > window.innerWidth) {
			floatable.options.content.style.width = `${window.innerWidth - left}px`;
		} else {
			floatable.options.content.style.width = '';
		}

		// floatable.options.content.style.inset = `${top}px auto auto ${left}px`;
		floatable.options.content.style.transform = `translate3d(${left}px, ${top}px, 0)`;

		floatable.frame = requestAnimationFrame(run);

		if (!runOnAfter) {
			runOnAfter = true;

			floatable.options.onAfter?.(true);
		}
	}

	floatable.frame = requestAnimationFrame(run);
}

//

const ATTRIBUTE_ANCHOR = 'oui-floatable-anchor';

const ATTRIBUTE_CONTENT = 'oui-floatable-content';

const INSERT_AFTEREND = 'afterend';

const POSITION_ABOVE = 'above';

const POSITION_BELOW = 'below';

const POSITION_BOTTOM = 'bottom';

const POSITION_END = 'end';

const POSITION_HORIZONTAL = 'horizontal';

const POSITION_START = 'start';

const POSITION_SUFFIX_END = '-end';

const POSITION_SUFFIX_START = '-start';

const POSITION_TOP = 'top';

const POSITION_VERTICAL = 'vertical';

const POSITIONS: Set<Position> = new Set([
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

const PROPERTIES: (keyof DOMRect)[] = ['bottom', 'left', 'right', 'top'];

const SELECTOR_ALL = `[${ATTRIBUTE_ANCHOR}], [${ATTRIBUTE_CONTENT}]`;

const SELECTOR_CONTENT = `[${ATTRIBUTE_CONTENT}]`;

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
