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
		floatable => floatable.options.anchor === element || floatable.options.content === element,
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

	floatable.options.anchor.insertAdjacentElement(INSERT_AFTEREND, floatable.options.content);

	floatable.options.onAfter?.(false);
}

function getAttribute(
	position: Position,
	anchor: DOMRect,
	top: number,
	left: number,
): Position | undefined {
	switch (position) {
		case 'horizontal':
		case 'horizontal-bottom':
		case 'horizontal-top':
			return position.replace('horizontal', left >= anchor.right ? 'right' : 'left') as Position;

		case 'vertical':
		case 'vertical-end':
		case 'vertical-start':
			return position.replace('vertical', top >= anchor.bottom ? 'bottom' : 'top') as Position;

		default:
			break;
	}
}

function getMargin(): number {
	try {
		const fontsize = parseFloat(getComputedStyle(document.documentElement).fontSize);

		if (Number.isNaN(fontsize)) {
			return 5;
		}

		const margin = fontsize / 2;

		return margin < 5 ? 5 : margin;
	} catch {
		return 5;
	}
}

function getState(): State {
	return (window as unknown as FloatableWindow)._oscarpalmer_oui_floatable;
}

function getX(anchor: DOMRect, content: DOMRect, position: Position, margin: number): number {
	if (position === 'above' || position === 'below' || position === 'vertical') {
		const center = anchor.left + anchor.width / 2;
		const width = content.width / 2;

		if (center + width + margin >= document.body.clientWidth) {
			return document.body.clientWidth - content.width - margin / 2;
		}

		if (center - width - margin <= 0) {
			return margin / 2;
		}

		return center - width;
	}

	if (position.startsWith('end')) {
		return anchor.right;
	}

	if (position.startsWith('start')) {
		return anchor.left - content.width;
	}

	if (position.endsWith('end')) {
		return anchor.right - content.width - margin <= 0 ? margin / 2 : anchor.right - content.width;
	}

	if (position.endsWith('start')) {
		if (anchor.left + content.width + margin >= document.body.clientWidth) {
			return document.body.clientWidth - content.width - margin / 2;
		}

		return anchor.left - margin <= 0 ? margin / 2 : anchor.left;
	}

	if (!position.startsWith('horizontal')) {
		return 0;
	}

	if (anchor.right + content.width + margin >= document.body.clientWidth) {
		return anchor.left - content.width;
	}

	return anchor.right;
}

function getY(
	anchor: DOMRect,
	content: DOMRect,
	position: Position,
	margin: number,
	preferAbove: boolean,
): number {
	if (position === 'end' || position === 'start' || position === 'horizontal') {
		const center = anchor.top + anchor.height / 2;
		const height = content.height / 2;

		if (center + height + margin >= document.body.clientHeight) {
			return document.body.clientHeight - content.height - margin / 2;
		}

		if (center - height - margin <= 0) {
			return margin / 2;
		}

		return center - height;
	}

	if (position.startsWith('above')) {
		return anchor.top - content.height;
	}

	if (position.startsWith('below')) {
		return anchor.bottom;
	}

	if (position.endsWith('bottom')) {
		return anchor.bottom - content.height - margin <= 0
			? margin / 2
			: anchor.bottom - content.height;
	}

	if (position.endsWith('top')) {
		return anchor.top + content.height + margin >= document.body.clientHeight
			? document.body.clientHeight - content.height - margin
			: anchor.top;
	}

	if (!position.startsWith('vertical')) {
		return 0;
	}

	if (preferAbove) {
		if (
			anchor.top - content.height - margin <= 0 &&
			anchor.bottom + content.height + margin <= document.body.clientHeight
		) {
			return anchor.bottom;
		}

		return anchor.top - content.height;
	}

	if (anchor.bottom + content.height + margin >= document.body.clientHeight) {
		return anchor.top - content.height;
	}

	return anchor.bottom;
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
		void floatable.toggle(false);
	}
}

function setAttribute(
	position: Position,
	anchor: DOMRect,
	floater: HTMLElement,
	top: number,
	left: number,
): void {
	let actual: Position | undefined;

	if (/^(horizontal|vertical)/.test(position)) {
		actual = getAttribute(position, anchor, top, left);
	}

	floater.setAttribute('position', actual ?? position);
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

	const margin = getMargin();

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
					PROPERTIES.every(property => anchor[property] === previousAnchor[property]) &&
					PROPERTIES.every(property => content[property] === previousContent[property])
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

		const left = getX(anchor, content, position, margin);
		const top = getY(anchor, content, position, margin, floatable.options.preferAbove);

		setAttribute(position, anchor, floatable.options.content, top, left);

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
