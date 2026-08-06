import type {
	OuiListboxAttributes,
	OuiListboxAutoCompleteType,
} from '../internal/listbox/listbox.model';

// #region Variables

export const COMBOBOX_TAGNAME = 'oui-combobox';

export const COMBOBOX_ATTRIBUTE_ANCHOR = `${COMBOBOX_TAGNAME}-anchor`;

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

export const COMBOBOX_ATTRIBUTE_SELECTION = `${COMBOBOX_TAGNAME}-selection`;

export const COMBOBOX_ATTRIBUTE_SELECTION_ITEM = `${COMBOBOX_TAGNAME}-selection-item`;

export const COMBOBOX_AUTOCOMPLETES = new Set<OuiListboxAutoCompleteType>([
	'both',
	'inline',
	'list',
	'none',
]);

export const messageLabel = `<${COMBOBOX_TAGNAME}> must contain a <label> element for the <select> element`;

export const messageSelect = `<${COMBOBOX_TAGNAME}> must contain a valid <select> element`;

export const selectorAnchor = `[${COMBOBOX_ATTRIBUTE_ANCHOR}]`;

export const selectorContent = `[${attributeContent}]`;

export const selectorOption = `[${attributeOption}]`;

export const selectorSelectionItem = `[${COMBOBOX_ATTRIBUTE_SELECTION_ITEM}]`;

export const COMBOBOX_ATTRIBUTES: OuiListboxAttributes = {
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

export const COMBOBOX_MESSAGES = {
	label: messageLabel,
	select: messageSelect,
};

export const COMBOBOX_SELECTORS = {
	anchor: selectorAnchor,
	content: selectorContent,
	selectionItem: selectorSelectionItem,
	option: selectorOption,
};

// #endregion
