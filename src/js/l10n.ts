import type {GenericCallback} from '@oscarpalmer/atoms/models';
import {getString} from '@oscarpalmer/atoms/string';

// #region Types

type LocalizationParameters<Localization> = Localization extends GenericCallback
	? Parameters<Localization>
	: never;

export class OuiLocalizations<Localizations extends OuiLocalizationsValues> {
	readonly defaults: Localizations;

	readonly keys: Set<keyof Localizations>;

	readonly values: Record<string, Partial<Localizations>> = {};

	constructor(defaults: Localizations) {
		this.defaults = defaults;
		this.keys = new Set(Object.keys(defaults) as Array<keyof Localizations>);
	}

	get<Key extends keyof Localizations>(
		element: Element,
		key: Key,
		localizations: Record<string, Partial<Localizations>>,
	): string | GenericCallback {
		return getLocalization(this, element, key, localizations);
	}

	set(language: string, localizations: Partial<Localizations>): void;

	set(localizations: Record<string, Partial<Localizations>>): void;

	set(
		first: string | Record<string, Partial<Localizations>>,
		second?: Partial<Localizations>,
	): void {
		updateLocalizations(
			this,
			typeof first === 'string'
				? {
						[first]: second!,
					}
				: first,
			this.values,
		);
	}
}

export type OuiLocalizationsValues = Record<string, string | GenericCallback>;

// #endregion

// #region Functions

export function getLanguage(element: Element): string {
	return (
		element.closest('[lang]')?.getAttribute('lang') ?? document.documentElement.lang
	).toLowerCase();
}

export function getLocalization<
	Localizations extends OuiLocalizationsValues,
	Key extends keyof Localizations,
>(
	localizations: OuiLocalizations<Localizations>,
	element: Element,
	key: Key,
	value: Record<string, Partial<Localizations>>,
): Localizations[Key] | GenericCallback {
	const language = getLanguage(element);

	const values = [value, localizations.values];
	const {length} = values;

	let localization: Localizations[Key] | undefined;
	let shortLanguage: string | undefined;

	for (let index = 0; index < length; index += 1) {
		const value = values[index];

		localization = value?.[language]?.[key];

		if (localization != null) {
			break;
		}

		shortLanguage ??= language.split('-')[0];

		if (shortLanguage === language) {
			continue;
		}

		localization = value?.[shortLanguage]?.[key];

		if (localization != null) {
			break;
		}
	}

	return localization ?? localizations.defaults[key];
}

export function getLocalizations<Localizations extends OuiLocalizationsValues>(
	defaults: Localizations,
): OuiLocalizations<Localizations> {
	return new OuiLocalizations(defaults);
}

export function localize<
	Localizations extends OuiLocalizationsValues,
	Key extends keyof Localizations,
	Localization extends Localizations[Key],
>(
	localization: Localization,
	data: Record<string, unknown>,
	parameters: LocalizationParameters<Localization>,
): string {
	if (typeof localization === 'function') {
		return localization(...parameters);
	}

	const keys = Object.keys(data);
	const {length} = keys;

	let localized = localization as string;

	for (let index = 0; index < length; index += 1) {
		const key = keys[index];
		const value = data[key];

		localized = localized.replaceAll(`{${key}}`, getString(value));
	}

	return localized;
}

export function updateLocalizations<Localizations extends OuiLocalizationsValues>(
	instance: OuiLocalizations<Localizations>,
	values: Record<string, Partial<Localizations>>,
	destination: Record<string, Partial<Localizations>>,
	onAfter?: () => void,
): void {
	if (typeof values !== 'object' || values == null) {
		return;
	}

	const localizations = destination ?? instance.values;

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

			const normalizedKey = key.toLowerCase() as keyof Localizations;

			if (
				instance.keys.has(normalizedKey) &&
				(typeof keyValue === 'string' || typeof keyValue === 'function')
			) {
				updated = true;

				localizations[normalizedLanguage][normalizedKey] = keyValue as never;
			}
		}
	}

	if (updated && typeof onAfter === 'function') {
		onAfter();
	}
}

// #endregion
