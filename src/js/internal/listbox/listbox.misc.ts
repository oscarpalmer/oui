import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {onListboxFilter} from './listbox.event';
import {updateListboxValidity} from './listbox.form';
import type {OuiListboxState} from './listbox.model';

// #region Functions

export function generateListboxIds(prefix: string, select: HTMLSelectElement): void {
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

export function getListboxVisibleOptions(state: OuiListboxState): HTMLElement[] {
	return state.options.all.filter(option => !option.hidden);
}

export function setListboxDisabled<State extends OuiListboxState>(
	state: State,
	value: boolean,
): void {
	state.filter.element.readOnly = state.readonly || value;

	setProperties('disabled', state, value);
}

export function setListboxFilter<State extends OuiListboxState>(
	state: State,
	value: unknown,
): void {
	if (typeof value !== 'string') {
		return;
	}

	const type: InputEvent['inputType'] =
		value.length < state.filter.element.value.length ? 'deleteContentBackward' : 'insertText';

	state.filter.element.value = value;

	onListboxFilter(type, state);
}

export function setListboxLimit<State extends OuiListboxState>(
	type: 'max' | 'min',
	state: State,
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
	state[key] = value;

	const {length} = state.elements;

	for (let index = 0; index < length; index += 1) {
		const element = state.elements[index];

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
	state.filter.element.readOnly = state.disabled || value;

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
