import {dispatch} from '@oscarpalmer/toretto/event';
import {getLocalization, localize} from '../../l10n/index';
import type {OuiListboxState} from './listbox.model';

// #region Functions

export function updateListboxForm<State extends OuiListboxState>(
	state: State,
	values: string[],
	emit?: boolean,
): void {
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

	updateListboxValidity(state);

	if (emit ?? true) {
		dispatch(host, 'oui:change');
	}
}

export function updateListboxValidity(state: OuiListboxState): void {
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

		const localization = getLocalization(
			localizations.global,
			host,
			'invalid',
			localizations.component,
		);

		form.internals.setValidity({valueMissing}, localize(localization, {}, []));

		form.internals.checkValidity();

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
