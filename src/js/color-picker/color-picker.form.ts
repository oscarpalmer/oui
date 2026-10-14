import {dispatch} from '@oscarpalmer/toretto/event';
import {getLocalization, localize} from '../l10n/index';
import {type OuiColorPickerState, OuiColorPickerEvent} from './color-picker.model';

// #region Functions

export function updateColorPickerForm(state: OuiColorPickerState, valid: boolean): void {
	const {component, form} = state;
	const {color, host, value} = component;

	form.internals.setFormValue(valid ? value.current : '');

	updateColorPickerValidity(state, valid);

	dispatch(host, new OuiColorPickerEvent('oui:change', color.value, valid));
}

export function updateColorPickerValidity(state: OuiColorPickerState, valid: boolean): void {
	const {component, form} = state;
	const {anchor, host, localizations} = component;
	const {internals} = form;

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
