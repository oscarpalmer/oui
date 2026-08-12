import {noop} from '@oscarpalmer/atoms/function';
import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttributes} from '@oscarpalmer/toretto/attribute';
import {getData} from '@oscarpalmer/toretto/data';
import {on} from '@oscarpalmer/toretto/event';
import {createEmbeddedFloatable} from '../floatable/floatable.embedded';
import {LISTBOX_TYPES} from '../internal/listbox/listbox.constants';
import {generateListboxIds} from '../internal/listbox/listbox.misc';
import type {
	OuiListboxCallbacks,
	OuiListboxLocalizations,
	OuiListboxStates,
} from '../internal/listbox/listbox.model';
import {initializeListboxState} from '../internal/listbox/listbox.state';
import {getAttributeValue, getBooleanAriaValue} from '../internal/misc';
import {getLocalizations} from '../l10n';
import {COMBOBOX_ATTRIBUTES, COMBOBOX_MESSAGES} from './constants.combobox';
import {createComboboxAnchor, createComboboxContent} from './dom.combobox';
import {
	onComboboxActivation,
	onComboboxApply,
	onComboboxEnter,
	onComboboxEscape,
	onComboboxFilter,
	onComboboxNavigation,
	onComboboxPreview,
	onComboboxSelection,
	onComboboxTab,
	onComboboxToggle,
	preventComboboxActivation,
	skipComboboxNavigation,
} from './event.combobox';
import type {OuiComboboxElement} from './index';
import {getComboboxAutoComplete, getComboboxId} from './misc.combobox';
import type {OuiComboboxState} from './models.combobox';

// #region Functions

export function createComboboxState(
	element: OuiComboboxElement,
	internals: ElementInternals,
): OuiComboboxState {
	const select = element.querySelector('select');

	if (select == null || select.id === '') {
		throw new Error(COMBOBOX_MESSAGES.select);
	}

	const label = element.querySelector(`label[for="${select.id}"]`) as HTMLLabelElement;

	if (label == null) {
		throw new Error(COMBOBOX_MESSAGES.label);
	}

	element.id = select.id;

	const disabled = getBooleanAriaValue(element, 'disabled') || select.disabled;
	const multiple = element.multiple || select.multiple;
	const readonly = getBooleanAriaValue(element, 'readonly');
	const required = getBooleanAriaValue(element, 'required') || select.required;

	const id = getComboboxId();
	const type = multiple ? 'select' : getAttributeValue(element, 'type', LISTBOX_TYPES, 'select');

	const autocomplete = getComboboxAutoComplete(element, type === 'select');

	setAttributes(element, {
		autocomplete: autocomplete.value,
		name: select.name === '' ? select.id : select.name,
	});

	const labelId = label.id;

	label.htmlFor = id;
	label.id = `${id}_label`;

	generateListboxIds(id, select);

	const parameters = {
		autocomplete,
		element,
		id,
		label,
		multiple,
		select,
		type,
		attributes: COMBOBOX_ATTRIBUTES,
		listbox: false,
	};

	const anchor = createComboboxAnchor(parameters);
	const content = createComboboxContent(parameters);

	const {selected} = content.list.options;

	const values =
		selected.length === 0 ? [''] : selected.map(option => getData(option, 'value', false) ?? '');

	const state: OuiComboboxState = {
		autocomplete,
		disabled,
		id,
		internals,
		multiple,
		readonly,
		required,
		select,
		type,
		active: selected[0],
		anchor: {
			container: anchor.container,
			element: anchor.element,
		},
		attributes: COMBOBOX_ATTRIBUTES,
		callbacks: comboboxCallbacks as OuiComboboxState['callbacks'],
		content: content.element,
		elements: [element, anchor.element, content.filter?.element],
		filter: {
			element: content.filter?.element ?? (anchor.element as HTMLInputElement),
			value: '',
		},
		floatable: undefined as never,
		groups: content.list.groups,
		host: element,
		label: {
			element: label,
			id: labelId,
		},
		list: content.list.element,
		listbox: false,
		listeners: [],
		localizations: {
			component: {},
			global: comboboxLocalizations,
		},
		message: content.message,
		name: element.name,
		options: {
			selected,
			all: content.list.options.all,
		},
		selection: anchor.selection,
		values: {
			current: values.slice(),
			initial: values.slice(),
			label: content.value,
		},
	};

	return initializeListboxState(state, comboboxStates, onAttachCombobox);
}

export function onAttachCombobox(state: OuiComboboxState): void {
	const {anchor, content, filter, select} = state;

	select.hidden = true;

	select.insertAdjacentElement('afterend', anchor.container ?? anchor.element);
	(anchor.container ?? anchor.element).insertAdjacentElement('afterend', content);

	select.remove();

	state.floatable = createEmbeddedFloatable(anchor.container ?? anchor.element, content, {
		position: 'below-start',
		reusable: false,
	});

	state.floatable.update();

	state.listeners.push(
		on(content, 'toggle', () => {
			setAria(anchor.element, 'expanded', state.floatable.open);

			setAria(
				filter.element,
				'activedescendant',
				state.floatable.open ? state.active?.id : undefined,
			);

			if (state.floatable.open) {
				filter.element.focus();
			}
		}),
	);
}

export function onDetachCombobox(state: OuiComboboxState): void {
	const {content, floatable, label, select} = state;

	floatable.destroy();

	const anchor = state.anchor.container ?? state.anchor.element;

	anchor.insertAdjacentElement('beforebegin', select);

	anchor.remove();
	content.remove();

	label.element.htmlFor = select.id;
	label.element.id = state.label.id;

	select.hidden = false;
}

// #endregion

// #region Variables

const comboboxCallbacks: OuiListboxCallbacks<OuiComboboxState> = {
	data: {
		onApply: onComboboxApply,
		onFilter: onComboboxFilter,
		onForm: noop,
		onPreview: onComboboxPreview,
		onToggle: onComboboxToggle,
	},
	keydown: {
		onActivation: onComboboxActivation,
		onEnter: onComboboxEnter,
		onEscape: onComboboxEscape,
		onNavigation: onComboboxNavigation,
		onSelection: onComboboxSelection,
		onTab: onComboboxTab,
		onToggle: onComboboxToggle,
		preventActivation: preventComboboxActivation,
		skipNavigation: skipComboboxNavigation,
	},
};

export const comboboxLocalizations = getLocalizations<OuiListboxLocalizations>({
	empty: 'No results found',
	input: 'Please enter a value',
	invalid: 'Please select an option from the list',
	max: max => `Please select fewer options (maximum is ${max})`,
	min: min => `Please select more options (minimum is ${min})`,
	remove: label => `Remove ${label}`,
	results: amount => `${amount} results available`,
	selected: amount => `${amount} selected`,
});

export const comboboxStates: OuiListboxStates<OuiComboboxState> = {
	map: new WeakMap(),
	set: new Set(),
};

// #endregion
