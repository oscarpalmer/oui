import {attributable} from './internal/attributable';
import {getNavigable, OuiNavigable, updateNavigableFocus} from './internal/navigable';

// #region Types

class OuiToolbar {
	#navigable: OuiNavigable;

	constructor(navigable: OuiNavigable) {
		this.#navigable = navigable;

		updateNavigableFocus(this.#navigable, false);
	}

	destroy(): void {
		this.#navigable.destroy();

		this.#navigable = undefined as never;
	}
}

// #endregion

// #region Functions

function addToolbar(element: HTMLElement): void {
	if (!instances.has(element)) {
		instances.set(
			element,
			new OuiToolbar(
				getNavigable(element, {
					role: 'toolbar',
					selector: SELECTOR,
					vertical: false,
				}),
			),
		);
	}
}

function removeToolbar(element: HTMLElement): void {
	instances.get(element)?.destroy();

	instances.delete(element);
}

// #endregion

// #region Variables

const ATTRIBUTE = 'oui-toolbar';

const SELECTOR = `[${ATTRIBUTE}-item]`;

const instances = new WeakMap<HTMLElement, OuiToolbar>();

// #endregion

// #region Initialization

attributable(ATTRIBUTE, addToolbar, removeToolbar);

// #endregion
