import {dispatch} from '@oscarpalmer/toretto/event';
import {getLocalization, localize} from '../l10n';
import {type OuiColorPickerState, OuiColorPickerEvent} from './models.color-picker';

// #region Functions

export function updateColorPickerForm(state: OuiColorPickerState, valid: boolean): void {
	const {color, host, internals, value} = state;

	internals.setFormValue(valid ? value.current : '');

	updateColorPickerValidity(state, valid);

	dispatch(host, new OuiColorPickerEvent('oui:change', color.value, valid));
}

export function updateColorPickerValidity(state: OuiColorPickerState, valid: boolean): void {
	const {anchor, host, internals, localizations} = state;

	if (valid) {
		internals.setValidity({});
		internals.checkValidity();

		return;
	}

	const localization = getLocalization(
		localizations.global,
		host,
		'invalid',
		localizations.component,
	);

	const message = localization == null ? undefined : localize(localization, {}, []);

	internals.setValidity(
		{
			typeMismatch: true,
		},
		message,
		anchor.input,
	);

	internals.checkValidity();
}

// #endregion
