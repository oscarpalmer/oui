import {noop} from '@oscarpalmer/atoms/function';
import {setAttributes} from '@oscarpalmer/toretto/attribute';
import {getData} from '@oscarpalmer/toretto/data';
import {setListboxValues} from '../internal/listbox/listbox.data';
import {createListboxContent} from '../internal/listbox/listbox.dom';
import {generateListboxIds} from '../internal/listbox/listbox.misc';
import type {
	OuiListboxAutoCompleteType,
	OuiListboxCallbacks,
	OuiListboxLocalizations,
	OuiListboxState,
} from '../internal/listbox/listbox.model';
import {initializeListboxState} from '../internal/listbox/listbox.state';
import {getBooleanAriaValue} from '../internal/misc';
import {createLocalizations} from '../l10n/index';
import type {OuiLocalizations} from '../l10n/l10n.model';
import {listboxAttributes, listboxMessages} from './constants.listbox';
import {
	onListboxEnter,
	onListboxFilter,
	onListboxNavigation,
	onListboxToggle,
} from './event.listbox';
import {getListboxId} from './misc.listbox';

// #region Functions

function createComponentState(element: HTMLElement, state: OuiListboxState): OuiListboxState {
	const select = element.querySelector('select');

	if (select == null) {
		throw new Error(listboxMessages.select);
	}

	const label = element.querySelector(`label[for="${select.id}"]`) as HTMLLabelElement;

	if (label == null) {
		throw new Error(listboxMessages.label);
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

	generateListboxIds(id, select);

	const type = 'select';

	const content = createListboxContent({
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

	const {selected} = content.list.options;

	const values =
		selected.length === 0 ? [''] : selected.map(option => getData(option, 'value', false) ?? '');

	state.component = {
		disabled,
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
		localizations: {
			component: {},
			global: listboxLocalizations,
		},
		message: content.message,
		name: (element as HTMLSelectElement).name,
		options: content.list.options,
		values: {
			current: values.slice(),
			initial: values.slice(),
			label: content.value,
		},
	};

	return initializeListboxState(state, listboxes, onAttachListbox);
}

export function initializeListbox(element: HTMLElement, state: OuiListboxState): void {
	createComponentState(element, state);

	if (state.form.restored != null) {
		setListboxValues(state, state.form.restored);

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

export const listboxLocalizations: OuiLocalizations<OuiListboxLocalizations> =
	createLocalizations<OuiListboxLocalizations>({
		empty: 'No results found',
		input: '',
		invalid: 'Please select an option from the list',
		max: max => `Please select fewer options (maximum is ${max})`,
		min: min => `Please select more options (minimum is ${min})`,
		remove: '',
		results: amount => `${amount} results available`,
		selected: amount => `${amount} selected`,
	});

export const listboxes: Set<OuiListboxState> = new Set();

// #endregion
