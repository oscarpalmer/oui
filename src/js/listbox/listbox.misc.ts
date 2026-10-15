import type {OptionListLocalizationValues} from '../internal/option-list/option-list.model';
import {listboxLocalizations} from './listbox.state';

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
	localizations: Partial<OptionListLocalizationValues>,
): void;

/**
 * Set default listbox localizations
 *
 * @param localizations Default localizations
 */
export function setListboxLocalizations(
	localizations: Partial<OptionListLocalizationValues>,
	defaults: true,
): void;

/**
 * Set listbox localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setListboxLocalizations(
	localizations: Record<string, Partial<OptionListLocalizationValues>>,
): void;

export function setListboxLocalizations(
	first:
		| string
		| Partial<OptionListLocalizationValues>
		| Record<string, Partial<OptionListLocalizationValues>>,
	second?: true | Partial<OptionListLocalizationValues>,
): void {
	if (second === true) {
		void listboxLocalizations.setDefaults(first as never);
	} else {
		void listboxLocalizations.setLanguages(first as never, second as never);
	}
}

// #endregion

// #region Variables

let index = 0;

// #endregion
