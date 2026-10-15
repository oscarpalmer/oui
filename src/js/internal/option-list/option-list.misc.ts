import {filter} from '@oscarpalmer/atoms/array/filter';
import type {PlainObject} from '@oscarpalmer/atoms/models';
import {setAria} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import type {OuiLocalizationsValues} from '../l10n/l10n.model';
import {filterOptionList} from './option-list.data';
import {updateOptionListValidity} from './option-list.form';
import type {OptionListState} from './option-list.model';

// #region Functions

export function generateOptionListIds(prefix: string, select: HTMLSelectElement): void {
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

export function getOptionListVisibleOptions<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>): Element[] {
	return state.component.options.all.filter(option => !option.hidden);
}

export function setOptionListDisabled<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>, value: boolean): void {
	state.component.filter.element.readOnly = state.component.readonly || value;

	setProperties('disabled', state, value);
}

export function setOptionListFilter<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>, value: unknown): void {
	if (typeof value !== 'string') {
		return;
	}

	const {filter} = state.component;

	const type: InputEvent['inputType'] =
		value.length < filter.element.value.length ? 'deleteContentBackward' : 'insertText';

	filter.element.value = value;

	filterOptionList(type, state);
}

export function setOptionListLimit<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(type: 'max' | 'min', state: OptionListState<State, Localizations>, value?: unknown): void {
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

		updateOptionListValidity(state);
	}
}

export function setOptionListMultiple(element: Element, value: boolean): void {
	if (value) {
		element.setAttribute('multiple', '');
	} else {
		element.removeAttribute('multiple');
	}
}

function setProperties<State extends PlainObject, Localizations extends OuiLocalizationsValues>(
	key: 'disabled' | 'readonly' | 'required',
	state: OptionListState<State, Localizations>,
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

export function setOptionListReadonly<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>, value: boolean): void {
	const {disabled, filter} = state.component;

	filter.element.readOnly = disabled || value;

	setProperties('readonly', state, value);
}

export function setOptionListRequired<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>, value: boolean): void {
	setProperties('required', state, value);

	updateOptionListValidity(state);
}

// #endregion
