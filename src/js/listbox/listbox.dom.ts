import {setAria} from '@oscarpalmer/toretto/aria';
import {createElement} from '@oscarpalmer/toretto/create';
import {LISTBOX_TAGNAME} from './listbox.constants';
import type {OuiListboxFooter, OuiListboxState} from './listbox.model';
import {listboxLocalizations} from './listbox.state';

// #region Functions

export function createListboxFooter(): OuiListboxFooter {
	const container = createElement('div', {
		attribute: {
			[`${LISTBOX_TAGNAME}-footer`]: '',
		},
	});

	const clear = createElement('button', {
		attribute: {
			[`${LISTBOX_TAGNAME}-footer-button`]: '',
		},
		property: {
			textContent: listboxLocalizations.localize('clearSelection'),
		},
	});

	const select = createElement('button', {
		attribute: {
			[`${LISTBOX_TAGNAME}-footer-button`]: '',
		},
		property: {
			textContent: listboxLocalizations.localize('selectAll'),
		},
	});

	container.append(select, clear);

	return {container, button: {clear, select}};
}

export function updateListboxFooter(state: OuiListboxState): void {
	const {disabled, footer, options, readonly} = state.component;

	setAria(footer.button.clear, 'disabled', disabled || readonly || options.selected.length === 0);

	setAria(
		footer.button.select,
		'disabled',
		disabled || readonly || options.selected.length === options.all.length,
	);
}

// #endregion
