import type {GenericCallback} from '@oscarpalmer/atoms/models';

// #region Types

export type OuiLocalizationParameters<Localization> = Localization extends GenericCallback
	? Parameters<Localization>
	: never;

export type OuiLocalizations<Localizations extends OuiLocalizationsValues> = {
	[L10N_SYMBOL]: OuiLocalizationsState<Localizations>;

	get defaults(): Localizations;

	get keys(): Set<keyof Localizations>;

	get values(): Record<string, Partial<Localizations>>;

	get<Key extends keyof Localizations>(
		element: Element,
		key: Key,
		localizations: Record<string, Partial<Localizations>>,
	): string | GenericCallback;

	set(language: string, localizations: Partial<Localizations>): void;

	set(localizations: Record<string, Partial<Localizations>>): void;
};

export type OuiLocalizationsState<Localizations extends OuiLocalizationsValues> = {
	readonly defaults: Localizations;
	readonly keys: Set<string>;
	readonly values: Record<string, Partial<Localizations>>;
};

export type OuiLocalizationsValues = Record<string, string | GenericCallback>;

// #endregion

// #region Variables

export const L10N_MESSAGE_ITEM_CREATE = 'Localization item must be a string or a function.';

export const L10N_MESSAGE_ITEM_UPDATE_KEY = 'Localization item key must be known.';

export const L10N_MESSAGE_ITEM_UPDATE_VALUE =
	'Localization item value must be a string or a function.';

export const L10N_MESSAGE_OBJECT_CREATE = 'Default localizations must be a non-empty plain object.';

export const L10N_MESSAGE_OBJECT_UPDATE = 'Localizations update object must be a plain object.';

export const L10N_SYMBOL: unique symbol = Symbol('l10n');

// #endregion
