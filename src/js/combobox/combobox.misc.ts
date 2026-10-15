import {getAttributeValue} from '../internal/misc';
import type {
	OptionListAutoComplete,
	OptionListAutoCompleteType,
	OptionListLocalizationValues,
} from '../internal/option-list/option-list.model';
import {COMBOBOX_AUTOCOMPLETES} from './combobox.constants';
import {comboboxLocalizations} from './combobox.state';

// #region Functions

export function getComboboxAutoComplete(element: Element, select: boolean): OptionListAutoComplete {
	let value: OptionListAutoCompleteType;

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

export function hasTextSelection(element: Element): element is HTMLInputElement {
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
	localizations: Partial<OptionListLocalizationValues>,
): void;

/**
 * Set default combobox localizations
 *
 * @param localizations Default localizations
 */
export function setComboboxLocalizations(
	localizations: Partial<OptionListLocalizationValues>,
	defaults: true,
): void;

/**
 * Set combobox localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setComboboxLocalizations(
	localizations: Record<string, Partial<OptionListLocalizationValues>>,
): void;

export function setComboboxLocalizations(
	first:
		| string
		| Partial<OptionListLocalizationValues>
		| Record<string, Partial<OptionListLocalizationValues>>,
	second?: true | Partial<OptionListLocalizationValues>,
): void {
	if (second === true) {
		void comboboxLocalizations.setDefaults(first as never);
	} else {
		void comboboxLocalizations.setLanguages(first as never, second as never);
	}
}

// #endregion

// #region Variables

let index = 0;

// #endregion
