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
	if (state.autocomplete.none && !state.listbox) {
		const valueMissing = state.required && state.filter.element.value.length === 0;

		const localization = getLocalization(
			state.localizations.global,
			state.host,
			'invalid',
			state.localizations.component,
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
			: getLocalization(state.localizations.global, state.host, key, state.localizations.component);

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
