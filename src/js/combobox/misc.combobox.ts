import {getAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import type {AnyAriaBooleanAttribute} from '@oscarpalmer/toretto/models';
import type {OuiComboboxElement} from '.';
import {COMBOBOX_AUTOCOMPLETES} from './constants.combobox';
import {onComboboxFilter} from './event.combobox';
import {updateComboboxValidity} from './form.combobox';
import type {
	OuiComboboxAutoComplete,
	OuiComboboxAutoCompleteType,
	OuiComboboxState,
} from './models.combobox';

// #region Functions

export function generateComboboxIds(prefix: string, select: HTMLSelectElement): void {
	const elements = [...select.children].flatMap(child =>
		child instanceof HTMLOptGroupElement
			? [
					child,
					...[...child.children].filter(groupChild => groupChild instanceof HTMLOptionElement),
				]
			: child instanceof HTMLOptionElement
				? [child]
				: [],
	);

	const {length} = elements;

	for (let index = 0; index < length; index += 1) {
		const element = elements[index];

		if (element.id === '') {
			element.id = `${prefix}${element instanceof HTMLOptGroupElement ? '_group_' : '_option_'}${index}`;
		}
	}
}

export function getComboboxAttributeValue<Value>(
	element: HTMLElement,
	attribute: string,
	possible: Set<Value>,
	defaultValue: Value,
): Value {
	const value = getAttribute(element, attribute);

	return possible.has(value as Value) ? (value as Value) : defaultValue;
}

export function getComboboxAutoComplete(
	element: OuiComboboxElement,
	select: boolean,
): OuiComboboxAutoComplete {
	let value: OuiComboboxAutoCompleteType;

	if (select) {
		value = 'list';
	} else {
		value = getComboboxAttributeValue(element, 'autocomplete', COMBOBOX_AUTOCOMPLETES, 'none');
	}

	return {
		value,
		both: value === 'both',
		inline: value === 'inline',
		list: value === 'list',
		none: value === 'none',
	};
}

export function getComboboxBooleanAria(
	element: HTMLElement,
	attribute: AnyAriaBooleanAttribute,
): boolean {
	const value = getAria(element, attribute);

	return value === true || value === 'true';
}

export function getComboboxId(): string {
	index += 1;

	return `oui_combobox_${index}`;
}

export function getComboboxVisibleOptions(state: OuiComboboxState): HTMLElement[] {
	return state.options.all.filter(option => !option.hidden);
}

export function hasTextSelection(element: HTMLElement): element is HTMLInputElement {
	return element instanceof HTMLInputElement && element.selectionStart !== element.selectionEnd;
}

export function setComboboxFilter(state: OuiComboboxState, value: unknown): void {
	if (typeof value !== 'string') {
		return;
	}

	const type: InputEvent['inputType'] =
		value.length < state.filter.element.value.length ? 'deleteContentBackward' : 'insertText';

	state.filter.element.value = value;

	onComboboxFilter(type, state);
}

export function setComboboxLimit(
	type: 'max' | 'min',
	state: OuiComboboxState,
	value?: unknown,
): void {
	let actual = value;

	if (typeof actual === 'string') {
		actual = Number.parseInt(actual, 10);
	}

	const updateLimit =
		typeof actual === 'number' && !Number.isNaN(actual) && actual >= 0
			? actual !== state[type]
			: actual == null;

	if (updateLimit) {
		state[type] = actual as number | undefined;

		setAttribute(state.host, type, actual);

		updateComboboxValidity(state);
	}
}

// #endregion

// #region Variables

let index = 0;

// #endregion
