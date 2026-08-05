import type {GenericCallback} from '@oscarpalmer/atoms/models';
import {
	updateComboboxAnchor,
	updateComboboxMessage,
	updateComboboxSelectionItems,
} from './dom.combobox';
import {getComboboxVisibleOptions} from './misc.combobox';
import type {OuiComboboxLocalizations, OuiComboboxState} from './models.combobox';
import {comboboxStates} from './state.combobox';

// #region Functions

export function getComboboxLanguage(state: OuiComboboxState): string {
	return (
		state.host.closest('[lang]')?.getAttribute('lang') ?? document.documentElement.lang
	).toLowerCase();
}

export function getComboboxLocalization<Key extends keyof OuiComboboxLocalizations>(
	key: Key,
	state: OuiComboboxState,
): OuiComboboxLocalizations[Key] {
	const language = getComboboxLanguage(state);

	const allLocalizations = [state.localizations, LOCALIZATIONS.globals];
	const {length} = allLocalizations;

	let localization: OuiComboboxLocalizations[Key] | undefined;
	let shortLanguage: string | undefined;

	for (let index = 0; index < length; index += 1) {
		const localizations = allLocalizations[index];

		localization = localizations?.[language]?.[key];

		if (localization != null) {
			break;
		}

		shortLanguage ??= language.split('-')[0];

		if (shortLanguage === language) {
			continue;
		}

		localization = localizations?.[shortLanguage]?.[key];

		if (localization != null) {
			break;
		}
	}

	return localization ?? LOCALIZATIONS.defaults[key];
}

/**
 * Set combobox localizations for a specific language
 *
 * @param language Language code
 * @param localizations Localizations for language
 */
export function setComboboxLocalizations(
	language: string,
	localizations: Partial<OuiComboboxLocalizations>,
): void;

/**
 * Set combobox localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setComboboxLocalizations(
	localizations: Record<string, Partial<OuiComboboxLocalizations>>,
): void;

export function setComboboxLocalizations(
	first: string | Record<string, Partial<OuiComboboxLocalizations>>,
	second?: Partial<OuiComboboxLocalizations>,
): void {
	updateComboboxLocalizations(
		typeof first === 'string'
			? {
					[first]: second!,
				}
			: first,
	);
}

export function updateComboboxLocalizations(
	values: Record<string, Partial<Record<string, string | GenericCallback>>>,
	destination?: Record<string, Partial<OuiComboboxLocalizations>>,
): void {
	if (typeof values !== 'object' || values == null) {
		return;
	}

	const localizations = destination ?? LOCALIZATIONS.globals;

	const languages = Object.keys(values);
	const languagesLength = languages.length;

	let updated = false;

	for (let languagesIndex = 0; languagesIndex < languagesLength; languagesIndex += 1) {
		const language = languages[languagesIndex];
		const languageValue = values[language];

		if (typeof languageValue !== 'object' || languageValue == null) {
			continue;
		}

		const normalizedLanguage = language.toLowerCase();

		localizations[normalizedLanguage] ??= {};

		const keys = Object.keys(languageValue);
		const keysLength = keys.length;

		for (let keysIndex = 0; keysIndex < keysLength; keysIndex += 1) {
			const key = keys[keysIndex];
			const keyValue = languageValue[key];

			const normalizedKey = key.toLowerCase() as keyof OuiComboboxLocalizations;

			if (
				LOCALIZATIONS.keys.has(normalizedKey) &&
				(typeof keyValue === 'string' || typeof keyValue === 'function')
			) {
				updated = true;

				localizations[normalizedLanguage][normalizedKey] = keyValue as never;
			}
		}
	}

	if (!updated) {
		return;
	}

	for (const state of comboboxStates.set) {
		updateComboboxAnchor(state);
		updateComboboxMessage(state, getComboboxVisibleOptions(state).length);
		updateComboboxSelectionItems(state);
	}
}

// #endregion

// #region Variables

const LOCALIZATIONS: {
	defaults: OuiComboboxLocalizations;
	globals: Record<string, Partial<OuiComboboxLocalizations>>;
	keys: Set<keyof OuiComboboxLocalizations>;
} = {
	defaults: {
		empty: 'No results found',
		input: 'Please enter a value',
		invalid: 'Please select an option from the list',
		max: max => `Please select fewer options (maximum is ${max})`,
		min: min => `Please select more options (minimum is ${min})`,
		remove: label => `Remove ${label}`,
		results: amount => `${amount} results available`,
		selected: amount => `${amount} selected`,
	},
	globals: {},
	keys: new Set<keyof OuiComboboxLocalizations>([
		'empty',
		'input',
		'invalid',
		'max',
		'min',
		'remove',
		'results',
		'selected',
	]),
};

// #endregion
