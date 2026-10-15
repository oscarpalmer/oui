import {noop} from '@oscarpalmer/atoms/function';
import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttributes} from '@oscarpalmer/toretto/attribute';
import {getData} from '@oscarpalmer/toretto/data';
import {on} from '@oscarpalmer/toretto/event';
import {createEmbeddedFloatable} from '../floatable/floatable.embedded';
import {createDefaultLocalizations, createLocalizations} from '../internal/l10n/index';
import type {OuiDefaultLocalizations} from '../internal/l10n/l10n.model';
import {getAttributeValue, getBooleanAriaValue} from '../internal/misc';
import {OPTION_LIST_TYPES} from '../internal/option-list/option-list.constants';
import {setOptionListValues} from '../internal/option-list/option-list.data';
import {generateOptionListIds} from '../internal/option-list/option-list.misc';
import type {OptionListCallbacks} from '../internal/option-list/option-list.model';
import {initializeOptionListState} from '../internal/option-list/option-list.state';
import {comboboxAttributes, comboboxMessages} from './combobox.constants';
import {createComboboxAnchor, createComboboxContent} from './combobox.dom';
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
} from './combobox.event';
import {getComboboxAutoComplete, getComboboxId} from './combobox.misc';
import type {
	OuiComboboxLocalizations,
	OuiComboboxState,
	OuiComboboxStateExtras,
} from './combobox.model';

// #region Functions

function createComponentState(element: Element, state: OuiComboboxState): OuiComboboxState {
	const select = element.querySelector('select');

	if (!(select instanceof HTMLSelectElement) || select.id === '') {
		throw new Error(comboboxMessages.select);
	}

	const label = element.querySelector(`label[for="${select.id}"]`);

	if (!(label instanceof HTMLLabelElement)) {
		throw new Error(comboboxMessages.label);
	}

	element.id = select.id;

	const disabled = getBooleanAriaValue(element, 'disabled') || select.disabled;
	const multiple = (element as HTMLSelectElement).multiple || select.multiple;
	const readonly = getBooleanAriaValue(element, 'readonly');
	const required = getBooleanAriaValue(element, 'required') || select.required;

	const id = getComboboxId();
	const type = multiple
		? 'select'
		: getAttributeValue(element, 'type', OPTION_LIST_TYPES, 'select');

	const autocomplete = getComboboxAutoComplete(element, type === 'select');

	setAttributes(element, {
		autocomplete: autocomplete.value,
		name: select.name === '' ? select.id : select.name,
	});

	const labelId = label.id;

	label.htmlFor = id;
	label.id = `${id}_label`;

	generateOptionListIds(id, select);

	const parameters = {
		autocomplete,
		element,
		id,
		label,
		multiple,
		select,
		type,
		attributes: comboboxAttributes,
		listbox: false,
	};

	const anchor = createComboboxAnchor(parameters);
	const content = createComboboxContent(parameters);

	const {selected} = content.list.options;

	const values =
		selected.length === 0 ? [''] : selected.map(option => getData(option, 'value', false) ?? '');

	state.component = {
		autocomplete,
		disabled,
		id,
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
		attributes: comboboxAttributes,
		callbacks: comboboxCallbacks as OuiComboboxState['component']['callbacks'],
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
		localizations: createLocalizations(comboboxLocalizations),
		message: content.message,
		name: (element as HTMLSelectElement).name,
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

	return initializeOptionListState(state, comboboxes, onAttachCombobox);
}

export function initializeCombobox(element: HTMLElement, state: OuiComboboxState): void {
	element.tabIndex = -1;

	createComponentState(element, state);

	if (state.form.restored != null) {
		setOptionListValues(state, state.form.restored);

		state.form.restored = undefined;
	}
}

export function onAttachCombobox(state: OuiComboboxState): void {
	const {component} = state;
	const {anchor, content, filter, listeners, select} = component;

	select.hidden = true;

	select.insertAdjacentElement('afterend', anchor.container ?? anchor.element);
	(anchor.container ?? anchor.element).insertAdjacentElement('afterend', content);

	select.remove();

	const floatable = createEmbeddedFloatable(anchor.container ?? anchor.element, content, {
		position: 'below-start',
		reusable: false,
	});

	floatable.update();

	listeners.push(
		on(content, 'toggle', () => {
			setAria(anchor.element, 'expanded', floatable.open);

			setAria(
				filter.element,
				'activedescendant',
				floatable.open ? component.active?.id : undefined,
			);

			if (floatable.open) {
				filter.element.focus();
			}
		}),
	);

	component.floatable = floatable;
}

export function onDetachCombobox(state: OuiComboboxState): void {
	const {content, floatable, label, select} = state.component;

	floatable.destroy();

	const anchor = state.component.anchor.container ?? state.component.anchor.element;

	anchor.insertAdjacentElement('beforebegin', select);

	anchor.remove();
	content.remove();

	label.element.htmlFor = select.id;
	label.element.id = state.component.label.id;

	select.hidden = false;
}

// #endregion

// #region Variables

const comboboxCallbacks: OptionListCallbacks<OuiComboboxStateExtras, OuiComboboxLocalizations> = {
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

export const comboboxLocalizations: OuiDefaultLocalizations<OuiComboboxLocalizations> =
	createDefaultLocalizations<OuiComboboxLocalizations>({
		empty: 'No results found',
		input: 'Please enter a value',
		invalid: 'Please select an option from the list',
		max: max => `Please select fewer options (maximum is ${max})`,
		min: min => `Please select more options (minimum is ${min})`,
		remove: label => `Remove ${label}`,
		results: amount => `${amount} results available`,
		selected: amount => `${amount} selected`,
	});

export const comboboxes: Set<OuiComboboxState> = new Set();

// #endregion
