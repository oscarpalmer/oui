import {dispatch} from '@oscarpalmer/toretto/event';
import {getLocalization, localize} from '../../l10n';
import type {OuiListboxState} from './listbox.model';

// #region Functions

export function updateListboxForm<State extends OuiListboxState>(
	state: State,
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

	state.callbacks.data.onForm(state);

	updateListboxValidity(state);

	if (emit ?? true) {
		dispatch(state.host, 'oui:change');
	}
}

export function updateListboxValidity(state: OuiListboxState): void {
	const {
		autocomplete,
		filter,
		host,
		internals,
		listbox,
		localizations,
		max,
		min,
		multiple,
		options,
		required,
	} = state;

	if (autocomplete.none && !listbox) {
		const valueMissing = required && filter.element.value.length === 0;

		const localization = getLocalization(
			localizations.global,
			host,
			'invalid',
			localizations.component,
		);

		internals.setValidity({valueMissing}, localize(localization, {}, []));

		internals.checkValidity();

		return;
	}

	let data: Record<string, unknown> = {};
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
			data = {amount: max};
			error = 'rangeOverflow';
			key = 'max';
			parameters = [max];

			break;
		}

		case multiple && typeof min === 'number' && options.selected.length < min: {
			data = {amount: min};
			error = 'rangeUnderflow';
			key = 'min';
			parameters = [min];

			break;
		}

		default:
			break;
	}

	const localization =
		key == null
			? undefined
			: getLocalization(localizations.global, host, key, localizations.component);

	const message = localization == null ? undefined : localize(localization, data, parameters);

	internals.setValidity(
		error == null
			? {}
			: {
					[error]: true,
				},
		message,
	);

	internals.checkValidity();
}

// #endregion
