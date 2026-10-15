import type {OptionListAttributes} from '../internal/option-list/option-list.model';

// #region Variables

export const LISTBOX_TAGNAME = 'oui-listbox';

export const LISTBOX_SYMBOL: unique symbol = Symbol(LISTBOX_TAGNAME);

const attributeContent = `${LISTBOX_TAGNAME}-content`;

const attributeFilter = `${LISTBOX_TAGNAME}-filter`;

const attributeFilterInput = `${attributeFilter}-input`;

const attributeGroup = `${LISTBOX_TAGNAME}-group`;

const attributeHeader = `${LISTBOX_TAGNAME}-header`;

const attributeHidden = `${LISTBOX_TAGNAME}-hidden`;

const attributeList = `${LISTBOX_TAGNAME}-list`;

const attributeListEmpty = `${attributeList}-empty`;

const attributeMessage = `${LISTBOX_TAGNAME}-message`;

const attributeOption = `${LISTBOX_TAGNAME}-option`;

const attributeOptionActive = `${LISTBOX_TAGNAME}-option-active`;

export const listboxAttributes: OptionListAttributes = {
	active: attributeOptionActive,
	content: attributeContent,
	empty: attributeListEmpty,
	filter: attributeFilter,
	group: attributeGroup,
	header: attributeHeader,
	hidden: attributeHidden,
	input: attributeFilterInput,
	list: attributeList,
	message: attributeMessage,
	option: attributeOption,
};

const messageLabel = `<${LISTBOX_TAGNAME}> must contain a <label> element for the <select> element`;

const messageSelect = `<${LISTBOX_TAGNAME}> must contain a valid <select> element`;

export const listboxMessages: Record<string, string> = {
	label: messageLabel,
	select: messageSelect,
};

const selectorFilter = `[${attributeFilterInput}]`;

const selectorOption = `[${attributeOption}]`;

export const listboxSelectors: Record<string, string> = {
	filter: selectorFilter,
	option: selectorOption,
};

// #endregion
