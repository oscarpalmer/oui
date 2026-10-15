import type {PlainObject} from '@oscarpalmer/atoms/models';
import {dispatch} from '@oscarpalmer/toretto/event';
import type {OuiLocalizationsValues} from '../l10n/l10n.model';
import type {OptionListState} from './option-list.model';

// #region Functions

export function updateOptionListForm<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>, values: string[], emit?: boolean): void {
	const {component, form} = state;
	const {callbacks, host, multiple, name} = component;

	let value: string | FormData;

	if (multiple) {
		const {length} = values;

		value = new FormData();

		for (let index = 0; index < length; index += 1) {
			(value as FormData).append(name, values[index]);
		}
	} else {
		value = values[0];
	}

	component.values.current = values;

	form.internals.setFormValue(value, JSON.stringify(values));

	callbacks.data.onForm(state);

	updateOptionListValidity(state);

	if (emit ?? true) {
		dispatch(host, 'oui:change');
	}
}

export function updateOptionListValidity<
	State extends PlainObject,
	Localizations extends OuiLocalizationsValues,
>(state: OptionListState<State, Localizations>): void {
	const {component, form} = state;
	const {
		autocomplete,
		filter,
		host,
		listbox,
		localizations,
		max,
		min,
		multiple,
		options,
		required,
	} = component;

	if (autocomplete.none && !listbox) {
		const valueMissing = required && filter.element.value.length === 0;

		form.internals.setValidity(
			{valueMissing},
			localizations.localize('invalid', {
				element: host,
			} as never),
		);

		form.internals.checkValidity();

		return;
	}

	let error: 'badInput' | 'rangeOverflow' | 'rangeUnderflow' | undefined;
	let key: 'input' | 'max' | 'min' | undefined;
	let parameters: unknown[] = [];

	switch (true) {
		case required && options.selected.length === 0: {
			error = 'badInput';
			key = 'input';

			break;
		}

		case multiple && typeof max === 'number' && options.selected.length > max: {
			error = 'rangeOverflow';
			key = 'max';
			parameters = [max];

			break;
		}

		case multiple && typeof min === 'number' && options.selected.length < min: {
			error = 'rangeUnderflow';
			key = 'min';
			parameters = [min];

			break;
		}

		default:
			break;
	}

	const message =
		key == null
			? undefined
			: localizations.localize(key, {
					arguments: parameters,
					element: host,
				} as never);

	form.internals.setValidity(
		error == null
			? {}
			: {
					[error]: true,
				},
		message,
	);

	form.internals.checkValidity();
}

// #endregion
