import {noop} from '@oscarpalmer/atoms/function';
import {setAttribute, setAttributes} from '@oscarpalmer/toretto/attribute';
import {getData} from '@oscarpalmer/toretto/data';
import {createListboxContent} from '../internal/listbox/listbox.dom';
import {generateListboxIds} from '../internal/listbox/listbox.misc';
import type {
	OuiListboxAutoCompleteType,
	OuiListboxCallbacks,
	OuiListboxLocalizations,
	OuiListboxState,
	OuiListboxStates,
} from '../internal/listbox/listbox.model';
import {initializeListboxState} from '../internal/listbox/listbox.state';
import {getBooleanAriaValue} from '../internal/misc';
import {getLocalizations} from '../l10n';
import {LISTBOX_ATTRIBUTES, LISTBOX_MESSAGES} from './constants.listbox';
import {
	onListboxEnter,
	onListboxFilter,
	onListboxNavigation,
	onListboxToggle,
} from './event.listbox';
import type {OuiListboxElement} from './index';
import {getListboxId} from './misc.listbox';

// #region Functions

export function createListboxState(
	element: OuiListboxElement,
	internals: ElementInternals,
): OuiListboxState {
	const select = element.querySelector('select');

	if (select == null) {
		throw new Error(LISTBOX_MESSAGES.select);
	}

	const label = element.querySelector(`label[for="${select.id}"]`) as HTMLLabelElement;

	if (label == null) {
		throw new Error(LISTBOX_MESSAGES.label);
	}

	element.id = select.id;

	const disabled = getBooleanAriaValue(element, 'disabled') || select.disabled;
	const multiple = element.multiple || select.multiple;
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

	generateListboxIds(id, select);

	const type = 'select';

	const content = createListboxContent({
		element,
		id,
		label,
		multiple,
		select,
		type,
		attributes: LISTBOX_ATTRIBUTES,
		autocomplete: listboxAutoComplete,
		listbox: true,
	});

	const {selected} = content.list.options;

	const values =
		selected.length === 0 ? [''] : selected.map(option => getData(option, 'value', false) ?? '');

	const state: OuiListboxState = {
		disabled,
		id,
		internals,
		message: content.message,
		multiple,
		readonly,
		required,
		select,
		type,
		active: selected[0],
		attributes: LISTBOX_ATTRIBUTES,
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
		localizations: {
			component: {},
			global: listboxLocalizations,
		},
		name: element.name,
		options: content.list.options,
		values: {
			current: values.slice(),
			initial: values.slice(),
			label: content.value,
		},
	};

	return initializeListboxState(state, listboxStates, onAttachListbox);
}

// #endregion

// #region Functions

export function onAttachListbox(state: OuiListboxState): void {
	const {content, select} = state;

	select.hidden = true;

	select.insertAdjacentElement('afterend', content);

	select.remove();
}

export function onDetachListbox(state: OuiListboxState): void {
	const {content, select} = state;

	content.insertAdjacentElement('beforebegin', select);

	content.remove();

	select.hidden = false;
}

// #endregion

// #region Variables

const listboxAutoComplete: Record<OuiListboxAutoCompleteType, boolean> = {
	both: false,
	inline: false,
	list: false,
	none: true,
};

const listboxCallbacks: OuiListboxCallbacks = {
	data: {
		onApply: noop,
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

export const listboxLocalizations = getLocalizations<OuiListboxLocalizations>({
	empty: 'No results found',
	input: '',
	invalid: 'Please select an option from the list',
	max: max => `Please select fewer options (maximum is ${max})`,
	min: min => `Please select more options (minimum is ${min})`,
	remove: '',
	results: amount => `${amount} results available`,
	selected: amount => `${amount} selected`,
});

export const listboxStates: OuiListboxStates = {
	map: new WeakMap(),
	set: new Set(),
};

// #endregion
