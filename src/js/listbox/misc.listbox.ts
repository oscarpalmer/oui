import {updateListboxMessage, updateListboxValueLabel} from '../internal/listbox/listbox.dom';
import type {OuiListboxLocalizations} from '../internal/listbox/listbox.model';
import {OuiLocalizations, updateLocalizations} from '../l10n';
import {listboxLocalizations, listboxStates} from './state.listbox';

// #region Functions

export function getListboxId(): string {
	index += 1;

	return `oui_listbox_${index}`;
}

/**
 * Set listbox localizations for a specific language
 *
 * @param language Language code
 * @param localizations Localizations for language
 */
export function setListboxLocalizations(
	language: string,
	localizations: Partial<OuiListboxLocalizations>,
): void;

/**
 * Set listbox localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setListboxLocalizations(
	localizations: Record<string, Partial<OuiListboxLocalizations>>,
): void;

export function setListboxLocalizations(
	first: string | Record<string, Partial<OuiListboxLocalizations>>,
	second?: Partial<OuiListboxLocalizations>,
): void {
	updateListboxLocalizations(listboxLocalizations, listboxLocalizations.values, first, second);
}

export function updateListboxLocalizations(
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
			for (const state of listboxStates.set) {
				updateListboxMessage(state);
				updateListboxValueLabel(state);
			}
		},
	);
}

// #endregion

// #region Variables

let index = 0;

// #endregion
