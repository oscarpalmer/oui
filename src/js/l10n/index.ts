import {isPlainObject} from '@oscarpalmer/atoms/is';
import type {GenericCallback, PlainObject} from '@oscarpalmer/atoms/models';
import {getString} from '@oscarpalmer/atoms/string';
import {
	L10N_MESSAGE_ITEM_CREATE,
	L10N_MESSAGE_ITEM_UPDATE_KEY,
	L10N_MESSAGE_ITEM_UPDATE_VALUE,
	L10N_MESSAGE_OBJECT_CREATE,
	L10N_MESSAGE_OBJECT_UPDATE,
	L10N_SYMBOL,
	type OuiLocalizationParameters,
	type OuiLocalizations,
	type OuiLocalizationsValues,
} from './l10n.model';

// #region Instances

function OuiLocalizations(this: OuiLocalizations<{}>, defaults: PlainObject): void {
	this[L10N_SYMBOL] = {
		defaults,
		keys: new Set(Object.keys(defaults)),
		values: {},
	};
}

OuiLocalizations.prototype.get = getLocalizationValue;
OuiLocalizations.prototype.set = setLocalizationValues;

Object.defineProperties(OuiLocalizations.prototype, {
	defaults: {
		enumerable: true,
		get: getDefaults,
	},
	keys: {
		enumerable: true,
		get: getKeys,
	},
});

// #endregion

// #region Functions

export function createLocalizations<Localizations extends OuiLocalizationsValues>(
	defaults: Localizations,
): OuiLocalizations<Localizations> {
	if (!isPlainObject(defaults) || Object.keys(defaults).length === 0) {
		throw new Error(L10N_MESSAGE_OBJECT_CREATE);
	}

	if (!Object.values(defaults).every(isValidLocalization)) {
		throw new Error(L10N_MESSAGE_ITEM_CREATE);
	}

	// @ts-expect-error All good, no worris :-)
	return new OuiLocalizations(defaults);
}

function getDefaults(this: OuiLocalizations<{}>): PlainObject {
	return {...this[L10N_SYMBOL].defaults};
}

function getKeys(this: OuiLocalizations<{}>): string[] {
	return [...this[L10N_SYMBOL].keys];
}

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

	const state = localizations[L10N_SYMBOL];

	const values = [value, state.values];
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

	return localization ?? state.defaults[key];
}

function getLocalizationValue(
	this: OuiLocalizations<{}>,
	element: Element,
	key: never,
	localizations: {},
): unknown {
	return getLocalization(this, element, key, localizations);
}

function isValidLocalization(value: unknown): value is string | GenericCallback {
	return typeof value === 'string' || typeof value === 'function';
}

export function localize<
	Localizations extends OuiLocalizationsValues,
	Key extends keyof Localizations,
	Localization extends Localizations[Key],
>(
	localization: Localization,
	data: Record<string, unknown>,
	parameters: OuiLocalizationParameters<Localization>,
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

function setLocalizationValues(this: OuiLocalizations<never>, first: never, second?: never): void {
	updateLocalizations(
		this,
		typeof first === 'string' ? ({[first]: second} as never) : first,
		this[L10N_SYMBOL].values,
	);
}

export function updateLocalizations<Localizations extends OuiLocalizationsValues>(
	instance: OuiLocalizations<Localizations>,
	values: Record<string, Partial<Localizations>>,
	destination: Record<string, Partial<Localizations>>,
	onAfter?: () => void,
): void {
	if (typeof values !== 'object' || values == null) {
		throw new Error(L10N_MESSAGE_OBJECT_UPDATE);
	}

	const state = instance[L10N_SYMBOL];
	const localizations = destination ?? state.values;

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

			const normalizedKey = key.toLowerCase();

			if (!state.keys.has(normalizedKey)) {
				throw new Error(L10N_MESSAGE_ITEM_UPDATE_KEY);
			}

			if (!isValidLocalization(keyValue)) {
				throw new Error(L10N_MESSAGE_ITEM_UPDATE_VALUE);
			}

			if (state.keys.has(normalizedKey) && isValidLocalization(keyValue)) {
				updated = true;

				(localizations[normalizedLanguage] as PlainObject)[normalizedKey] = keyValue;
			}
		}
	}

	if (updated && typeof onAfter === 'function') {
		onAfter();
	}
}

// #endregion
