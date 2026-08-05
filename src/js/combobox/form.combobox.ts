import {dispatch} from '@oscarpalmer/toretto/event';
import {updateComboboxAnchor} from './dom.combobox';
import {getComboboxLocalization} from './i18n.combobox';
import type {OuiComboboxState} from './models.combobox';

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

		const localization = getComboboxLocalization('invalid', state);

		state.internals.setValidity(
			{valueMissing},
			typeof localization === 'function' ? localization() : localization,
		);

		state.internals.checkValidity();

		return;
	}

	let error: 'badInput' | 'rangeOverflow' | 'rangeUnderflow' | undefined;
	let message: string | undefined;

	switch (true) {
		case state.required && state.options.selected.length === 0: {
			error = 'badInput';

			const localization = getComboboxLocalization('input', state);

			message = typeof localization === 'function' ? localization() : localization;

			break;
		}

		case state.multiple &&
			typeof state.max === 'number' &&
			state.options.selected.length > state.max: {
			error = 'rangeOverflow';

			const localization = getComboboxLocalization('max', state);

			message =
				typeof localization === 'function'
					? localization(state.max)
					: localization.replace('{max}', state.max.toString());

			break;
		}

		case state.multiple &&
			typeof state.min === 'number' &&
			state.options.selected.length < state.min: {
			error = 'rangeUnderflow';

			const localization = getComboboxLocalization('min', state);

			message =
				typeof localization === 'function'
					? localization(state.min)
					: localization.replace('{min}', state.min.toString());

			break;
		}

		default:
			break;
	}

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
