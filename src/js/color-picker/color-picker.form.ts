import {dispatch} from '@oscarpalmer/toretto/event';
import {COLOR_PICKER_EVENT_CHANGE} from './color-picker.constants';
import {type OuiColorPickerState, OuiColorPickerEvent} from './color-picker.model';

// #region Functions

export function updateColorPickerForm(state: OuiColorPickerState, valid: boolean): void {
	const {component, form} = state;
	const {color, host, value} = component;

	form.internals.setFormValue(valid ? value.current : '');

	updateColorPickerValidity(state, valid);

	dispatch(host, new OuiColorPickerEvent(COLOR_PICKER_EVENT_CHANGE, color.value, valid));
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

	const message = localizations.localize('invalid', {
		element: host,
	});

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
