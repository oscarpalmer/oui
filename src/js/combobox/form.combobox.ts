import {dispatch} from '@oscarpalmer/toretto/event';
import {getLocalization, localize} from '../l10n';
import {updateComboboxAnchor} from './dom.combobox';
import type {OuiComboboxState} from './models.combobox';
import {comboboxLocalizations} from './state.combobox';

// #region Functions

export function updateComboboxForm(
	state: OuiComboboxState,
	values: string[],
	emit?: boolean,
): void {
	let value: string | FormData;

	if (state.multiple) {
		const {length} = values;

		value = new FormData();

		for (let index = 0; index < length; index += 1) {
			(value as FormData).append(state.name, values[index]);
		}
	} else {
		value = values[0];
	}

	state.values.current = values;

	state.internals.setFormValue(value, JSON.stringify(values));

	updateComboboxAnchor(state);
	updateComboboxValidity(state);

	if (emit ?? true) {
		dispatch(state.host, 'change');
	}
}

export function updateComboboxValidity(state: OuiComboboxState): void {
	if (state.autocomplete.none) {
		const valueMissing = state.required && state.filter.element.value.length === 0;

		const localization = getLocalization(
			comboboxLocalizations,
			state.host,
			'invalid',
			state.localizations,
		);

		state.internals.setValidity({valueMissing}, localize(localization, {}, []));

		state.internals.checkValidity();

		return;
	}

	let data: Record<string, unknown> = {};
	let error: 'badInput' | 'rangeOverflow' | 'rangeUnderflow' | undefined;
	let key: 'input' | 'max' | 'min' | undefined;
	let parameters: unknown[] = [];

	switch (true) {
		case state.required && state.options.selected.length === 0: {
			error = 'badInput';
			key = 'input';

			break;
		}

		case state.multiple &&
			typeof state.max === 'number' &&
			state.options.selected.length > state.max: {
			data = {amount: state.max};
			error = 'rangeOverflow';
			key = 'max';
			parameters = [state.max];

			break;
		}

		case state.multiple &&
			typeof state.min === 'number' &&
			state.options.selected.length < state.min: {
			data = {amount: state.min};
			error = 'rangeUnderflow';
			key = 'min';
			parameters = [state.min];

			break;
		}

		default:
			break;
	}

	const localization =
		key == null
			? undefined
			: getLocalization(comboboxLocalizations, state.host, key, state.localizations);

	const message = localization == null ? undefined : localize(localization, data, parameters);

	state.internals.setValidity(
		error == null
			? {}
			: {
					[error]: true,
				},
		message,
	);

	state.internals.checkValidity();
}

// #endregion
