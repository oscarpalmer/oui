import type {
	OptionListLocalizationValues,
	OptionListState,
} from '../internal/option-list/option-list.model';

// #region Types

export type OuiListboxFooter = {
	button: OuiListboxFooterButton;
	container: Element;
};

type OuiListboxFooterButton = {
	clear: HTMLButtonElement;
	select: HTMLButtonElement;
};

export type OuiListboxLocalizations = {
	clearSelection: string | (() => string);
	selectAll: string | (() => string);
} & OptionListLocalizationValues;

export type OuiListboxState = OptionListState<OuiListboxStateExtras, OuiListboxLocalizations>;

export type OuiListboxStateExtras = {
	footer: OuiListboxFooter;
};

// #endregion
