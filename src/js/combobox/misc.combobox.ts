import {updateListboxMessage, updateListboxValueLabel} from '../internal/listbox/listbox.dom';
import type {
	OuiListboxAutoComplete,
	OuiListboxAutoCompleteType,
	OuiListboxLocalizations,
} from '../internal/listbox/listbox.model';
import {getAttributeValue} from '../internal/misc';
import {OuiLocalizations, updateLocalizations} from '../l10n';
import {COMBOBOX_AUTOCOMPLETES} from './constants.combobox';
import {updateComboboxSelectionItems} from './dom.combobox';
import type {OuiComboboxElement} from './index';
import {comboboxLocalizations, comboboxStates} from './state.combobox';

// #region Functions

export function getComboboxAutoComplete(
	element: OuiComboboxElement,
	select: boolean,
): OuiListboxAutoComplete {
	let value: OuiListboxAutoCompleteType;

	if (select) {
		value = 'list';
	} else {
		value = getAttributeValue(element, 'autocomplete', COMBOBOX_AUTOCOMPLETES, 'none');
	}

	return {
		value,
		both: value === 'both',
		inline: value === 'inline',
		list: value === 'list',
		none: value === 'none',
	};
}

export function getComboboxId(): string {
	index += 1;

	return `oui_combobox_${index}`;
}

export function hasTextSelection(element: HTMLElement): element is HTMLInputElement {
	return element instanceof HTMLInputElement && element.selectionStart !== element.selectionEnd;
}

/**
 * Set combobox localizations for a specific language
 *
 * @param language Language code
 * @param localizations Localizations for language
 */
export function setComboboxLocalizations(
	language: string,
	localizations: Partial<OuiListboxLocalizations>,
): void;

/**
 * Set combobox localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setComboboxLocalizations(
	localizations: Record<string, Partial<OuiListboxLocalizations>>,
): void;

export function setComboboxLocalizations(
	first: string | Record<string, Partial<OuiListboxLocalizations>>,
	second?: Partial<OuiListboxLocalizations>,
): void {
	updateComboboxLocalizations(comboboxLocalizations, comboboxLocalizations.values, first, second);
}

export function updateComboboxLocalizations(
	instance: OuiLocalizations<OuiListboxLocalizations>,
	destination: Record<string, Partial<OuiListboxLocalizations>>,
	first: string | Record<string, Partial<OuiListboxLocalizations>>,
	second?: Partial<OuiListboxLocalizations>,
): void {
	updateLocalizations(
		instance,
		typeof first === 'string'
			? {
					[first]: second!,
				}
			: first,
		destination,
		() => {
			for (const state of comboboxStates.set) {
				updateListboxMessage(state);
				updateListboxValueLabel(state);
				updateComboboxSelectionItems(state);
			}
		},
	);
}

// #endregion

// #region Variables

let index = 0;

// #endregion
