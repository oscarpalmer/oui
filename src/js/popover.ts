import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {getFocusable} from '@oscarpalmer/toretto/focusable';
import {Floatable} from './floatable';
import {createFocusTrap, type FocusTrap} from './focus-trap/embedded';

declare global {
	// biome-ignore lint/nursery/useConsistentTypeDefinitions: Extending builtins to allow custom element type help
	interface HTMLElementTagNameMap {
		'oui-popover': OuiPopoverElement;
	}
}

let index = 0;

export class OuiPopoverElement extends HTMLElement {
	readonly #floatable: Floatable;
	readonly #focusTrap: FocusTrap;

	constructor() {
		super();

		const content = this.querySelector(SELECTOR_CONTENT);
		const toggle = this.querySelector(SELECTOR_TOGGLE);

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

		if (isNullableOrWhitespace(content.id)) {
			content.setAttribute('id', `${ATTRIBUTE_ID_PREFIX}_${++index}`);
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
			onAfter: (active: boolean): void => {
				if (active) {
					focus(content);
				} else if (!this.#floatable.ignoreFocus) {
					toggle.focus();
				}
			},
		});

		this.#focusTrap = createFocusTrap(content, {
			noescape: true,
		});

		POPOVERS.set(toggle, this.#floatable);
		POPOVERS.set(content, this.#floatable);
	}

	close(): void {
		this.hidePopover();
	}

	connectedCallback(): void {
		this.#floatable.enable();
		this.#focusTrap.connect();
	}

	disconnectedCallback(): void {
		this.#floatable.disable();
		this.#focusTrap.disconnect();
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

const ATTRIBUTE_ID_PREFIX = 'oui_popover_content_';

const POPOVERS: Map<HTMLElement, Floatable> = new Map();

const SELECTOR = 'oui-popover';

const SELECTOR_CONTENT = `:scope > [${SELECTOR}-content]`;

const SELECTOR_TOGGLE = `:scope > [${SELECTOR}-toggle]`;

//

customElements.define(SELECTOR, OuiPopoverElement);
