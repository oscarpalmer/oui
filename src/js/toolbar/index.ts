import {attributable} from '../internal/attributable';
import {getNavigable, updateNavigableFocus} from '../internal/navigable/index';
import type {OuiNavigable} from '../internal/navigable/navigable.model';
import {
	TOOLBAR_ATTRIBUTE,
	TOOLBAR_SELECTOR,
	TOOLBAR_SYMBOL,
	toolbars,
	type OuiToolbar,
} from './toolbar.model';

// #region Instances

function OuiToolbar(this: OuiToolbar, navigable: OuiNavigable): void {
	this[TOOLBAR_SYMBOL] = navigable;

	updateNavigableFocus(navigable, false);
}

OuiToolbar.prototype.destroy = destroyToolbar;

// #endregion

// #region Functions

function addToolbar(element: Element): void {
	if (!toolbars.has(element)) {
		toolbars.set(
			element,
			// @ts-expect-error All good, no worries :-)
			new OuiToolbar(
				getNavigable(element, {
					role: 'toolbar',
					selector: TOOLBAR_SELECTOR,
					vertical: false,
				}),
			),
		);
	}
}

function destroyToolbar(this: OuiToolbar): void {
	this[TOOLBAR_SYMBOL].destroy();

	this[TOOLBAR_SYMBOL] = undefined as never;
}

function removeToolbar(element: Element): void {
	toolbars.get(element)?.destroy();

	toolbars.delete(element);
}

// #endregion

// #region Initialization

attributable(TOOLBAR_ATTRIBUTE, addToolbar, removeToolbar);

// #endregion
