import {noop} from '@oscarpalmer/atoms/function';
import {setAttributes} from '@oscarpalmer/toretto/attribute';
import {getData} from '@oscarpalmer/toretto/data';
import {createDefaultLocalizations, createLocalizations} from '../internal/l10n/index';
import type {OuiDefaultLocalizations} from '../internal/l10n/l10n.model';
import {getBooleanAriaValue} from '../internal/misc';
import {setOptionListValues} from '../internal/option-list/option-list.data';
import {createOptionListContent} from '../internal/option-list/option-list.dom';
import {generateOptionListIds} from '../internal/option-list/option-list.misc';
import type {
	OptionListAutoCompleteType,
	OptionListCallbacks,
} from '../internal/option-list/option-list.model';
import {initializeOptionListState} from '../internal/option-list/option-list.state';
import {listboxAttributes, listboxMessages} from './listbox.constants';
import {createListboxFooter} from './listbox.dom';
import {
	onListboxApply,
	onListboxEnter,
	onListboxFilter,
	onListboxNavigation,
	onListboxToggle,
} from './listbox.event';
import {getListboxId} from './listbox.misc';
import type {
	OuiListboxLocalizations,
	OuiListboxState,
	OuiListboxStateExtras,
} from './listbox.model';

// #region Functions

function createComponentState(element: Element, state: OuiListboxState): OuiListboxState {
	const select = element.querySelector('select');

	if (!(select instanceof HTMLSelectElement)) {
		throw new TypeError(listboxMessages.select);
	}

	const label = element.querySelector(`label[for="${select.id}"]`);

	if (!(label instanceof HTMLLabelElement)) {
		throw new TypeError(listboxMessages.label);
	}

	element.id = select.id;

	const disabled = getBooleanAriaValue(element, 'disabled') || select.disabled;
	const multiple = (element as HTMLSelectElement).multiple || select.multiple;
	const readonly = getBooleanAriaValue(element, 'readonly');
	const required = getBooleanAriaValue(element, 'required') || select.required;

	setAttributes(element, {
		autocomplete: 'none',
		name: select.name === '' ? select.id : select.name,
	});

	const id = getListboxId();

	const labelId = label.id;

	label.htmlFor = id;
	label.id = `${id}_label`;

	generateOptionListIds(id, select);

	const type = 'select';

	const content = createOptionListContent({
		element,
		id,
		label,
		multiple,
		select,
		type,
		attributes: listboxAttributes,
		autocomplete: listboxAutoComplete,
		listbox: true,
	});

	const footer = createListboxFooter();

	content.element.append(footer.container);

	const {selected} = content.list.options;

	const values =
		selected.length === 0 ? [''] : selected.map(option => getData(option, 'value', false) ?? '');

	state.component = {
		disabled,
		footer,
		id,
		multiple,
		readonly,
		required,
		select,
		type,
		active: selected[0],
		attributes: listboxAttributes,
		autocomplete: listboxAutoComplete,
		callbacks: listboxCallbacks,
		content: content.element,
		elements: [element, content.filter!.element],
		filter: {
			element: content.filter!.element,
			value: '',
		},
		host: element,
		label: {
			id: labelId,
			element: label,
		},
		list: content.list.element,
		listeners: [],
		listbox: true,
		localizations: createLocalizations(listboxLocalizations),
		message: content.message,
		name: (element as HTMLSelectElement).name,
		options: content.list.options,
		values: {
			current: values.slice(),
			initial: values.slice(),
			label: content.value,
		},
	};

	return initializeOptionListState(state, listboxes, onAttachListbox) as OuiListboxState;
}

export function initializeListbox(element: Element, state: OuiListboxState): void {
	createComponentState(element, state);

	if (state.form.restored != null) {
		setOptionListValues(state, state.form.restored);

		state.form.restored = undefined;
	}
}

export function onAttachListbox(state: OuiListboxState): void {
	const {content, select} = state.component;

	select.hidden = true;

	select.insertAdjacentElement('afterend', content);

	select.remove();
}

export function onDetachListbox(state: OuiListboxState): void {
	const {content, select} = state.component;

	content.insertAdjacentElement('beforebegin', select);

	content.remove();

	select.hidden = false;
}

// #endregion

// #region Variables

const listboxAutoComplete: Record<OptionListAutoCompleteType, boolean> = {
	both: false,
	inline: false,
	list: false,
	none: true,
};

const listboxCallbacks: OptionListCallbacks<OuiListboxStateExtras, OuiListboxLocalizations> = {
	data: {
		onApply: onListboxApply,
		onFilter: onListboxFilter,
		onForm: noop,
		onPreview: noop,
		onToggle: onListboxToggle,
	},
	keydown: {
		onEnter: onListboxEnter,
		onNavigation: onListboxNavigation,
		onToggle: onListboxToggle,
	},
};

export const listboxLocalizations: OuiDefaultLocalizations<OuiListboxLocalizations> =
	createDefaultLocalizations<OuiListboxLocalizations>({
		clearSelection: 'Clear',
		empty: 'No results found',
		input: '',
		invalid: 'Please select an option from the list',
		max: max => `Please select fewer options (maximum is ${max})`,
		min: min => `Please select more options (minimum is ${min})`,
		remove: '',
		results: amount => `${amount} results available`,
		selectAll: 'Select all',
		selected: amount => `${amount} selected`,
	});

export const listboxes: Set<OuiListboxState> = new Set();

// #endregion
