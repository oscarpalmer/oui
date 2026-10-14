import {filter} from '@oscarpalmer/atoms/array/filter';
import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {filterListbox} from './listbox.data';
import {updateListboxValidity} from './listbox.form';
import type {OuiListboxState} from './listbox.model';

// #region Functions

export function generateListboxIds(prefix: string, select: HTMLSelectElement): void {
	const elements = [...select.children].flatMap(child =>
		child instanceof HTMLOptGroupElement
			? [
					child,
					...filter([...child.children], groupChild => groupChild instanceof HTMLOptionElement),
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

export function getListboxVisibleOptions(state: OuiListboxState): HTMLElement[] {
	return state.component.options.all.filter(option => !option.hidden);
}

export function setListboxDisabled<State extends OuiListboxState>(
	state: State,
	value: boolean,
): void {
	state.component.filter.element.readOnly = state.component.readonly || value;

	setProperties('disabled', state, value);
}

export function setListboxFilter<State extends OuiListboxState>(
	state: State,
	value: unknown,
): void {
	if (typeof value !== 'string') {
		return;
	}

	const {filter} = state.component;

	const type: InputEvent['inputType'] =
		value.length < filter.element.value.length ? 'deleteContentBackward' : 'insertText';

	filter.element.value = value;

	filterListbox(type, state);
}

export function setListboxLimit<State extends OuiListboxState>(
	type: 'max' | 'min',
	state: State,
	value?: unknown,
): void {
	const {component} = state;

	let actual = value;

	if (typeof actual === 'string') {
		actual = Number.parseInt(actual, 10);
	}

	const updateLimit =
		typeof actual === 'number' && !Number.isNaN(actual) && actual >= 0
			? actual !== component[type]
			: actual == null;

	if (updateLimit) {
		component[type] = actual as number | undefined;

		setAttribute(component.host, type, actual);

		updateListboxValidity(state);
	}
}

export function setListboxMultiple(element: HTMLElement, value: boolean): void {
	if (value) {
		element.setAttribute('multiple', '');
	} else {
		element.removeAttribute('multiple');
	}
}

function setProperties<State extends OuiListboxState>(
	key: 'disabled' | 'readonly' | 'required',
	state: State,
	value: boolean,
): void {
	const {component} = state;
	const {elements} = component;

	component[key] = value;

	const {length} = elements;

	for (let index = 0; index < length; index += 1) {
		const element = elements[index];

		if (element == null) {
			continue;
		}

		setAria(
			element,
			key,
			key !== 'readonly' || !(element instanceof HTMLButtonElement) ? value : undefined,
		);
	}
}

export function setListboxReadonly<State extends OuiListboxState>(
	state: State,
	value: boolean,
): void {
	const {disabled, filter} = state.component;

	filter.element.readOnly = disabled || value;

	setProperties('readonly', state, value);
}

export function setListboxRequired<State extends OuiListboxState>(
	state: State,
	value: boolean,
): void {
	setProperties('required', state, value);
	updateListboxValidity(state);
}

// #endregion
