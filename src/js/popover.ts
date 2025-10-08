import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {getFocusable} from '@oscarpalmer/toretto/focusable';
import {Floatable} from './floatable';
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
		content.setAttribute('aria-modal', 'true');
		content.setAttribute('oui-focus-trap', '');
		content.setAttribute('oui-focus-trap-noescape', '');

		if (isNullableOrWhitespace(content.id)) {
			content.setAttribute('id', `oui_popover_content_${++index}`);
		}

		toggle.setAttribute('aria-controls', content.id);
		toggle.setAttribute('aria-haspopup', 'dialog');

		this.#floatable = new Floatable({
			content,
			anchor: toggle,
			defaultPosition: 'below-start',
			interactive: true,
			positionAttribute: 'position',
			preferAbove: false,
			onAfter: active => {
				if (active) {
					focus(content);
				} else if (!this.#floatable.ignoreFocus) {
					toggle.focus();
				}
			},
		});

		this.#focusTrap = createFocusTrap(content);

		mapped.set(toggle, this.#floatable);
		mapped.set(content, this.#floatable);
	}

	close(): void {
		this.hidePopover();
	}

	hidePopover(): void {
		if (this.#floatable.active && this.isConnected) {
			this.#floatable.toggle(false);
		}
	}

	open(): void {
		this.showPopover();
	}

	showPopover(): void {
		if (!this.#floatable.active && this.isConnected) {
			this.#floatable.toggle(true);
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

function focus(content: HTMLElement): void {
	let target = getFocusable(content)[0];

	if (!(target instanceof HTMLElement)) {
		target = content;
	}

	requestAnimationFrame(() => {
		(target as HTMLElement).focus();
	});
}

//

customElements.define('oui-popover', OuiPopoverElement);
