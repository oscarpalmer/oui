import type {
	OptionListAttributes,
	OptionListAutoCompleteType,
} from '../internal/option-list/option-list.model';

// #region Variables

export const COMBOBOX_TAGNAME = 'oui-combobox';

export const COMBOBOX_ATTRIBUTE_ANCHOR: string = `${COMBOBOX_TAGNAME}-anchor`;

export const COMBOBOX_ATTRIBUTE_SELECTION: string = `${COMBOBOX_TAGNAME}-selection`;

export const COMBOBOX_ATTRIBUTE_SELECTION_ITEM: string = `${COMBOBOX_TAGNAME}-selection-item`;

export const COMBOBOX_AUTOCOMPLETES: Set<OptionListAutoCompleteType> = new Set([
	'both',
	'inline',
	'list',
	'none',
]);

export const COMBOBOX_SYMBOL: unique symbol = Symbol(COMBOBOX_TAGNAME);

const attributeContent = `${COMBOBOX_TAGNAME}-content`;

const attributeFilter = `${COMBOBOX_TAGNAME}-filter`;

const attributeFilterInput = `${attributeFilter}-input`;

const attributeGroup = `${COMBOBOX_TAGNAME}-group`;

const attributeHeader = `${COMBOBOX_TAGNAME}-header`;

const attributeHidden = `${COMBOBOX_TAGNAME}-hidden`;

const attributeList = `${COMBOBOX_TAGNAME}-list`;

const attributeListEmpty = `${attributeList}-empty`;

const attributeMessage = `${COMBOBOX_TAGNAME}-message`;

const attributeOption = `${COMBOBOX_TAGNAME}-option`;

const attributeOptionActive = `${COMBOBOX_TAGNAME}-option-active`;

export const comboboxAttributes: OptionListAttributes = {
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

export const messageLabel: string = `<${COMBOBOX_TAGNAME}> must contain a <label> element for the <select> element`;

export const messageSelect: string = `<${COMBOBOX_TAGNAME}> must contain a valid <select> element`;

export const comboboxMessages: Record<string, string> = {
	label: messageLabel,
	select: messageSelect,
};

export const selectorAnchor: string = `[${COMBOBOX_ATTRIBUTE_ANCHOR}]`;

export const selectorContent: string = `[${attributeContent}]`;

export const selectorOption: string = `[${attributeOption}]`;

export const selectorSelectionItem: string = `[${COMBOBOX_ATTRIBUTE_SELECTION_ITEM}]`;

export const comboboxSelectors: Record<string, string> = {
	anchor: selectorAnchor,
	content: selectorContent,
	selectionItem: selectorSelectionItem,
	option: selectorOption,
};

// #endregion
