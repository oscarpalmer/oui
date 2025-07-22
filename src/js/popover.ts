import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {getFocusable} from '@oscarpalmer/toretto/focusable';
import {activate, deactivate, Floatable} from './floatable';
import {createFocusTrap, type FocusTrap} from './focus-trap/embedded';

declare global {
	interface HTMLElementTagNameMap {
		'oui-popover': OuiPopoverElement;
	}
}

const mapped = new Map<HTMLElement, Floatable>();

let index = 0;

export class OuiPopoverElement extends HTMLElement {
	#floatable: Floatable;
	#focusTrap: FocusTrap;

	constructor() {
		super();

		const content = this.querySelector(':scope > [oui-popover-content]');
		const toggle = this.querySelector(':scope > [oui-popover-toggle]');

		if (!(content instanceof HTMLElement)) {
			throw new Error(
				'A oui-popover must have a direct child element with the [oui-popover-content]-attribute',
			);
		}

		if (!(toggle instanceof HTMLButtonElement)) {
			throw new Error(
				'A oui-popover must have a direct child element with the [oui-popover-toggle]-attribute and be a button',
			);
		}

		content.hidden = true;

		content.setAttribute('role', 'dialog');
		content.setAttribute('oui-focus-trap', '');
		content.setAttribute('oui-focus-trap-noescape', '');

		if (isNullableOrWhitespace(content.id)) {
			content.setAttribute('id', `oui-popover-content-${++index}`);
		}

		toggle.setAttribute('aria-controls', content.id);
		toggle.setAttribute('aria-haspopup', 'dialog');

		this.#floatable = new Floatable(toggle, content);
		this.#focusTrap = createFocusTrap(content);

		mapped.set(toggle, this.#floatable);
		mapped.set(content, this.#floatable);
	}

	close(): void {
		this.hidePopover();
	}

	hidePopover(): void {
		if (this.#floatable.active) {
			closeAbove(this.#floatable.content);
			deactivate(this.#floatable, active, order);

			this.#floatable.anchor.focus();
		}
	}

	open(): void {
		this.showPopover();
	}

	showPopover(): void {
		if (!this.#floatable.active) {
			toggle(this.#floatable.anchor);
		}
	}

	toggle(): void {
		this.togglePopover();
	}

	togglePopover(options?: boolean): boolean {
		if (typeof options === 'boolean') {
			if (options === true) {
				this.showPopover();
			} else {
				this.hidePopover();
			}

			return options;
		}

		if (this.#floatable.active) {
			this.hidePopover();

			return false;
		}

		this.showPopover();

		return true;
	}
}

//

function closeAll(): void {
	for (const floatable of active) {
		deactivate(floatable, active, order);
	}
}

function closeAbove(element: HTMLElement): void {
	const index = order.findIndex(
		floatable => floatable.anchor === element || floatable.content === element,
	);

	if (index === -1 || index === order.length - 1) {
		return;
	}

	while (index < order.length - 1) {
		const floatable = order.pop();

		if (floatable != null) {
			deactivate(floatable, active, order);
		}
	}

	focus(order[index].content);
}

function focus(content: HTMLElement): void {
	let target = getFocusable(content)[0];

	if (!(target instanceof HTMLElement)) {
		target = content;
	}

	requestAnimationFrame(() => {
		(target as HTMLElement).focus();
	});
}

function onClick(event: MouseEvent): void {
	const related = findAncestor(
		event.target as never,
		'[oui-popover-toggle], [oui-popover-content]',
	);

	if (!(related instanceof HTMLElement)) {
		closeAll();
	} else if (related.hasAttribute('oui-popover-content')) {
		closeAbove(related);
	} else {
		toggle(related);
	}
}

function onKeydown(event: KeyboardEvent): void {
	if (event.key !== 'Escape' || order.length === 0) {
		return;
	}

	const related = findAncestor(event.target as never, '[oui-popover-content]');

	if (!(related instanceof HTMLElement)) {
		return;
	}

	closeAbove(related);

	const floatable = mapped.get(related);

	if (floatable != null) {
		deactivate(floatable, active, order);

		floatable.anchor.focus();
	}
}

function toggle(anchor: HTMLElement): void {
	const content = findAncestor(anchor, '[oui-popover-content]');

	if (content instanceof HTMLElement) {
		closeAbove(content);
	} else {
		closeAll();
	}

	const floatable = mapped.get(anchor);

	if (floatable == null) {
		return;
	}

	if (floatable.active) {
		deactivate(floatable, active, order);
	} else {
		activate(floatable, active, order);
		focus(floatable.content);
	}
}

//

customElements.define('oui-popover', OuiPopoverElement);

on(document, 'click', onClick);
on(document, 'keydown', onKeydown);

//

const active = new Set<Floatable>();

const order: Floatable[] = [];
