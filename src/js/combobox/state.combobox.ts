import {setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {getData} from '@oscarpalmer/toretto/data';
import {on} from '@oscarpalmer/toretto/event';
import {createEmbeddedFloatable} from '../floatable/floatable.embedded';
import {
	COMBOBOX_MESSAGE_LABEL,
	COMBOBOX_MESSAGE_SELECT,
	COMBOBOX_TYPES,
} from './constants.combobox';
import {filterComboboxOptions} from './data.combobox';
import {
	createComboboxAnchor,
	createComboboxContent,
	setComboboxDisabled,
	setComboboxReadonly,
	setComboboxRequired,
	updateComboboxMessage,
	updateComboboxPreview,
	updateComboboxSelectionItems,
} from './dom.combobox';
import {onComboboxClickContent, onComboboxFocusout} from './event.combobox';
import {updateComboboxForm} from './form.combobox';
import type {OuiComboboxElement} from './index';
import {
	generateComboboxIds,
	getComboboxAttributeValue,
	getComboboxAutoComplete,
	getComboboxBooleanAria,
	getComboboxId,
	getComboboxVisibleOptions,
	setComboboxLimit,
} from './misc.combobox';
import type {OuiComboboxState} from './models.combobox';

// #region Functions

export function attachCombobox(state: OuiComboboxState): void {
	const {anchor, content, filter, label, listeners, select} = state;

	label.element.htmlFor = filter.element.id;
	label.element.id = `${state.id}_label`;

	select.hidden = true;

	select.insertAdjacentElement('afterend', anchor.container ?? anchor.element);
	(anchor.container ?? anchor.element).insertAdjacentElement('afterend', content);

	select.remove();

	state.floatable = createEmbeddedFloatable(anchor.container ?? anchor.element, content, {
		position: 'below-start',
		reusable: false,
	});

	state.floatable.update();

	listeners.push(
		on(state.host, 'focusout', () => {
			setTimeout(() => {
				onComboboxFocusout(state);
			});
		}),
		on(content, 'click', event => {
			onComboboxClickContent(event, content);
		}),
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

	comboboxStates.map.set(state.host, state);
	comboboxStates.map.set(state.content, state);
	comboboxStates.set.add(state);
}

export function createComboboxState(
	element: OuiComboboxElement,
	internals: ElementInternals,
): OuiComboboxState {
	const select = element.querySelector('select');

	if (select == null || select.id === '') {
		throw new Error(COMBOBOX_MESSAGE_SELECT);
	}

	const label = element.querySelector(`label[for="${select.id}"]`) as HTMLLabelElement;

	if (label == null) {
		throw new Error(COMBOBOX_MESSAGE_LABEL);
	}

	element.id = select.id;

	setAttribute(element, 'name', select.name === '' ? select.id : select.name);

	const disabled = getComboboxBooleanAria(element, 'disabled') || select.disabled;
	const multiple = element.multiple || select.multiple;
	const readonly = getComboboxBooleanAria(element, 'readonly');
	const required = getComboboxBooleanAria(element, 'required') || select.required;

	const id = getComboboxId();
	const type = multiple
		? 'select'
		: getComboboxAttributeValue(element, 'type', COMBOBOX_TYPES, 'select');

	const autocomplete = getComboboxAutoComplete(element, type === 'select');

	const labelId = label.id;

	label.htmlFor = id;
	label.id = `${id}_label`;

	generateComboboxIds(id, select);

	const anchor = createComboboxAnchor({autocomplete, id, label, multiple, select, type});
	const content = createComboboxContent({autocomplete, id, label, multiple, select, type});

	const values =
		content.list.selected.length === 0
			? ['']
			: content.list.selected.map(option => getData(option, 'value', false) ?? '');

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
		anchor: {
			container: anchor.container,
			element: anchor.element,
		},
		active: content.list.selected[0],
		content: content.element,
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
		listeners: [],
		localizations: {},
		message: content.message,
		name: element.name,
		options: {
			all: content.list.options,
			selected: content.list.selected,
		},
		selection: anchor.selection,
		values: {
			current: values.slice(),
			initial: values.slice(),
		},
	};

	attachCombobox(state);

	setComboboxDisabled(state, disabled);
	setComboboxLimit('max', state, getAttribute(element, 'max'));
	setComboboxLimit('min', state, getAttribute(element, 'min'));
	setComboboxReadonly(state, readonly);
	setComboboxRequired(state, required);

	filterComboboxOptions(state);

	if (content.list.selected.length > 0) {
		updateComboboxPreview('set', state, content.list.selected[0]);
	}

	updateComboboxForm(state, state.values.current, false);
	updateComboboxMessage(state, getComboboxVisibleOptions(state).length);
	updateComboboxSelectionItems(state);

	return state;
}

export function detachCombobox(state: OuiComboboxState): void {
	const {content, floatable, host, label, select} = state;

	const listeners = state.listeners.splice(0);
	const {length} = listeners;

	for (let index = 0; index < length; index += 1) {
		listeners[index]();
	}

	floatable.destroy();

	const anchor = state.anchor.container ?? state.anchor.element;

	anchor.insertAdjacentElement('beforebegin', select);

	anchor.remove();
	content.remove();

	label.element.htmlFor = select.id;
	label.element.id = state.label.id;

	select.hidden = false;

	comboboxStates.map.delete(host);
	comboboxStates.map.delete(content);
	comboboxStates.set.delete(state);
}

// #endregion

// #region Variables

export const comboboxStates = {
	map: new WeakMap<HTMLElement, OuiComboboxState>(),
	set: new Set<OuiComboboxState>(),
};

// #endregion
