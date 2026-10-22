import {isPlainObject} from '@oscarpalmer/atoms/is';
import type {GenericCallback, PlainObject} from '@oscarpalmer/atoms/models';
import {promises} from '@oscarpalmer/atoms/promise';
import {isFulfilled} from '@oscarpalmer/atoms/promise/misc';
import type {FulfilledPromise} from '@oscarpalmer/atoms/promise/models';
import {
	L10N_MESSAGE_DEFAULT,
	L10N_MESSAGE_ITEM_CREATE,
	L10N_MESSAGE_ITEM_UPDATE_KEY,
	L10N_MESSAGE_ITEM_UPDATE_VALUE,
	L10N_MESSAGE_OBJECT_CREATE,
	L10N_MESSAGE_OBJECT_UPDATE,
	L10N_SYMBOL,
	L10N_TYPE_DEFAULT,
	L10N_TYPE_INSTANCE,
	type OuiDefaultLocalizations,
	type OuiDefaultLocalizationsValues,
	type OuiLocalizations,
	type OuiLocalizationsParameters,
	type OuiLocalizationsValues,
} from './l10n.model';

// #region Instances

function OuiDefaultLocalizations<Localizations extends OuiLocalizationsValues>(
	this: OuiDefaultLocalizations<Localizations>,
	values: Localizations,
): void {
	this[L10N_SYMBOL] = {
		defaults: values,
		keys: new Set(Object.keys(values)),
		type: L10N_TYPE_DEFAULT,
		values: {},
	};
}

OuiDefaultLocalizations.prototype.localize = localizeDefault;
OuiDefaultLocalizations.prototype.setDefaults = setDefaultLocalizations;
OuiDefaultLocalizations.prototype.setLanguages = setLocalizations;

Object.defineProperties(OuiDefaultLocalizations.prototype, {
	keys: {
		enumerable: true,
		get: getKeys,
	},
	values: {
		enumerable: true,
		get: getValues,
	},
});

function OuiLocalizations<Localizations extends OuiLocalizationsValues>(
	this: OuiLocalizations<Localizations>,
	defaults: OuiDefaultLocalizations<Localizations>,
): void {
	this[L10N_SYMBOL] = {
		defaults,
		keys: new Set(defaults.keys),
		values: {},
		type: L10N_TYPE_INSTANCE,
	};
}

OuiLocalizations.prototype.localize = localizeWithLanguage;
OuiLocalizations.prototype.set = setLocalizations;

Object.defineProperties(OuiLocalizations.prototype, {
	defaults: {
		enumerable: true,
		get: getDefaults,
	},
});

// #endregion

// #region Functions

export function createDefaultLocalizations<Localizations extends OuiLocalizationsValues>(
	values: Localizations,
): OuiDefaultLocalizations<Localizations> {
	validateDefaultValues(values);

	// @ts-expect-error All good, no worries :-)
	return new OuiDefaultLocalizations(values);
}

export function createLocalizations<Localizations extends OuiLocalizationsValues>(
	defaults: OuiDefaultLocalizations<Localizations>,
): OuiLocalizations<Localizations> {
	validateDefaultInstance(defaults);

	// @ts-expect-error All good, no worries :-)
	return new OuiLocalizations(defaults);
}

function getDefaults(this: OuiLocalizations<{}>): OuiDefaultLocalizations<{}> {
	return this[L10N_SYMBOL].defaults;
}

function getKeys(this: OuiDefaultLocalizations<{}>): string[] {
	return [...this[L10N_SYMBOL].keys];
}

function getLanguage(parameters?: OuiLocalizationsParameters<{}>): string {
	return (
		typeof parameters?.language === 'string'
			? parameters.language
			: (parameters?.element?.closest('[lang]')?.getAttribute('lang') ??
				document.documentElement.lang)
	).toLowerCase();
}

function getLocalization<
	Localizations extends OuiLocalizationsValues,
	Key extends keyof Localizations,
>(
	key: Key,
	parameters: PlainObject | undefined,
	defaultLocalizations: OuiDefaultLocalizations<Localizations> | undefined,
	instanceLocalizations: OuiLocalizations<Localizations> | undefined,
): string | GenericCallback {
	const defaultState = defaultLocalizations?.[L10N_SYMBOL];
	const instanceState = instanceLocalizations?.[L10N_SYMBOL];

	const language = getLanguage(parameters);

	let values: Record<string, Partial<Localizations>>[];

	if (defaultState == null) {
		values =
			instanceState == null ? [] : [instanceState.values, instanceState.defaults.values.languages];
	} else {
		values = [defaultState.values];
	}

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

	if (localization != null) {
		return localization;
	}

	return defaultState?.defaults[key] ?? instanceState?.defaults.values.defaults[key] ?? '';
}

function getValues(this: OuiDefaultLocalizations<{}>): OuiDefaultLocalizationsValues<{}> {
	const {defaults, values} = this[L10N_SYMBOL];

	return {
		defaults,
		languages: values,
	};
}

function isValidLocalization(value: unknown): value is string | GenericCallback {
	return typeof value === 'string' || typeof value === 'function';
}

function localizeDefault(
	this: OuiDefaultLocalizations<{}>,
	key: never,
	parameters?: PlainObject,
): string {
	return localizeValue(key, parameters, this, undefined);
}

function localizeWithLanguage(
	this: OuiLocalizations<{}>,
	key: never,
	parameters?: PlainObject,
): string {
	return localizeValue(key, parameters, undefined, this);
}

function localizeValue<
	Localizations extends OuiLocalizationsValues,
	Key extends keyof Localizations,
>(
	key: Key,
	parameters: PlainObject | undefined,
	defaultLocalizations: OuiDefaultLocalizations<Localizations> | undefined,
	instanceLocalizations: OuiLocalizations<Localizations> | undefined,
): string {
	const localization = getLocalization(
		key,
		parameters,
		defaultLocalizations,
		instanceLocalizations,
	);

	if (typeof localization === 'function') {
		const args = Array.isArray(parameters?.arguments) ? parameters.arguments : [];

		return localization(...args);
	}

	return localization;
}

async function setDefaultLocalizations<Localizations extends OuiLocalizationsValues>(
	this: OuiDefaultLocalizations<Localizations>,
	values: unknown,
): Promise<boolean> {
	if (typeof values !== 'object' || values == null) {
		throw new TypeError(L10N_MESSAGE_OBJECT_UPDATE);
	}

	const state = this[L10N_SYMBOL];

	return updateLocalizationValues(state, state.defaults, values).then(count => count > 0);
}

function setLocalizations(
	this: OuiLocalizations<{}>,
	first: never,
	second?: never,
): Promise<boolean> {
	return updateLocalizations(
		this,
		typeof first === 'string' ? ({[first]: second} as never) : first,
	);
}

async function updateLocalizationValues<Localizations extends OuiLocalizationsValues>(
	state: {keys: Set<keyof Localizations>},
	to: Partial<Localizations>,
	from: Partial<Localizations>,
): Promise<number> {
	const keys = Object.keys(from);
	const {length} = keys;

	const toAsPlainObject = to as PlainObject;

	let count = 0;

	for (let index = 0; index < length; index += 1) {
		const key = keys[index];
		const value = from[key];

		const lowercased = key.toLowerCase();

		if (!state.keys.has(lowercased)) {
			throw new TypeError(L10N_MESSAGE_ITEM_UPDATE_KEY);
		}

		if (!isValidLocalization(value)) {
			throw new TypeError(L10N_MESSAGE_ITEM_UPDATE_VALUE);
		}

		if (state.keys.has(lowercased) && isValidLocalization(value)) {
			count += 1;

			toAsPlainObject[lowercased] = value;
		}
	}

	return count;
}

async function updateLocalizations<Localizations extends OuiLocalizationsValues>(
	localizations: OuiLocalizations<Localizations>,
	values: Record<string, Partial<Localizations>>,
): Promise<boolean> {
	if (typeof values !== 'object' || values == null) {
		throw new TypeError(L10N_MESSAGE_OBJECT_UPDATE);
	}

	const state = localizations[L10N_SYMBOL];

	const languages = Object.keys(values);
	const {length} = languages;

	const updates: Array<Promise<number>> = [];

	for (let index = 0; index < length; index += 1) {
		const language = languages[index];
		const value = values[language];

		if (typeof value !== 'object' || value == null) {
			throw new TypeError(L10N_MESSAGE_OBJECT_UPDATE);
		}

		const lowercased = language.toLowerCase();

		state.values[lowercased] ??= {};

		updates.push(updateLocalizationValues(state, state.values[lowercased], value));
	}

	return promises(updates).then(results => {
		let count = 0;

		const {length} = results;

		for (let index = 0; index < length; index += 1) {
			count += isFulfilled(results[index]) ? (results[index] as FulfilledPromise<number>).value : 0;
		}

		return count > 0;
	});
}

function validateDefaultInstance(value: unknown): asserts value is OuiDefaultLocalizations<{}> {
	if (typeof value !== 'object' || value === null || !(L10N_SYMBOL in value)) {
		throw new TypeError(L10N_MESSAGE_DEFAULT);
	}
}

function validateDefaultValues(value: unknown): asserts value is OuiLocalizationsValues {
	if (!isPlainObject(value) || Object.keys(value).length === 0) {
		throw new TypeError(L10N_MESSAGE_OBJECT_CREATE);
	}

	if (!Object.values(value).every(isValidLocalization)) {
		throw new TypeError(L10N_MESSAGE_ITEM_CREATE);
	}
}

// #endregion
