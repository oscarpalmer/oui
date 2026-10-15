import type {GenericCallback} from '@oscarpalmer/atoms/models';

// #region Types

export type OuiDefaultLocalizations<Localizations extends OuiLocalizationsValues> = {
	[L10N_SYMBOL]: OuiDefaultLocalizationsState<Localizations>;

	get keys(): Array<keyof Localizations>;

	get values(): OuiDefaultLocalizationsValues<Localizations>;

	localize<Key extends keyof Localizations>(
		key: Key,
		parameters?: OuiLocalizationsParameters<Localizations[Key]>,
	): string;

	setDefaults(values: Partial<Localizations>): Promise<boolean>;

	setLanguages(language: string, localizations: Partial<Localizations>): Promise<boolean>;

	setLanguages(localizations: Record<string, Partial<Localizations>>): Promise<boolean>;
};

export type OuiDefaultLocalizationsState<Localizations extends OuiLocalizationsValues> = {
	defaults: Localizations;
	keys: Set<keyof Localizations>;
	type: typeof L10N_TYPE_DEFAULT;
	values: Record<string, Partial<Localizations>>;
};

export type OuiDefaultLocalizationsValues<Localizations extends OuiLocalizationsValues> = {
	defaults: Localizations;
	languages: Record<string, Partial<Localizations>>;
};

type OuiLocalizationsCallback<Localization> = Extract<Localization, GenericCallback>;

export type OuiLocalizationsParameters<Localization> = ([
	OuiLocalizationsCallback<Localization>,
] extends [never]
	? {}
	: {arguments: Parameters<OuiLocalizationsCallback<Localization>>}) & {
	element?: Element;
	language?: string;
};

export type OuiLocalizations<Localizations extends OuiLocalizationsValues> = {
	[L10N_SYMBOL]: OuiLocalizationsState<Localizations>;

	get defaults(): OuiDefaultLocalizations<Localizations>;

	localize<Key extends keyof Localizations>(
		key: Key,
		parameters?: OuiLocalizationsParameters<Localizations[Key]>,
	): string;

	set(language: string, localizations: Partial<Localizations>): Promise<boolean>;

	set(localizations: Record<string, Partial<Localizations>>): Promise<boolean>;
};

export type OuiLocalizationsState<Localizations extends OuiLocalizationsValues> = {
	defaults: OuiDefaultLocalizations<Localizations>;
	keys: Set<keyof Localizations>;
	type: typeof L10N_TYPE_INSTANCE;
	values: Record<string, Partial<Localizations>>;
};

export type OuiLocalizationsType = 'default' | 'instance';

export type OuiLocalizationsValues = Record<string, string | GenericCallback>;

// #endregion

// #region Variables

export const L10N_MESSAGE_DEFAULT =
	'Default localizations must be an instance of OuiDefaultLocalizations.';

export const L10N_MESSAGE_ITEM_CREATE = 'Localization item must be a string or a function.';

export const L10N_MESSAGE_ITEM_UPDATE_KEY = 'Localization item key must be known.';

export const L10N_MESSAGE_ITEM_UPDATE_VALUE =
	'Localization item value must be a string or a function.';

export const L10N_MESSAGE_OBJECT_CREATE = 'Default localizations must be a non-empty plain object.';

export const L10N_MESSAGE_OBJECT_UPDATE = 'Localizations update object must be a plain object.';

export const L10N_TYPE_DEFAULT: OuiLocalizationsType = 'default';

export const L10N_TYPE_INSTANCE: OuiLocalizationsType = 'instance';

export const L10N_SYMBOL: unique symbol = Symbol('l10n');

// #endregion
