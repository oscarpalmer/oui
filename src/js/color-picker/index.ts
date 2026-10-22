import {
	type HSLAColor,
	type HSLColor,
	type HWBAColor,
	type HWBColor,
	type RGBAColor,
	type RGBColor,
} from '@oscarpalmer/atoms/color';
import type {OuiLocalizations} from '../internal/l10n/l10n.model';
import {COLOR_PICKER_SYMBOL, COLOR_PICKER_TAGNAME} from './color-picker.constants';
import {onColorPickerInput} from './color-picker.event';
import {
	setColorPickerDisabled,
	setColorPickerRequired,
	setColorPickerValue,
} from './color-picker.misc';
import type {OuiColorPickerLocalizations, OuiColorPickerState} from './color-picker.model';
import {
	attachColorPicker,
	detachColorPicker,
	initializeColorPickerComponent,
} from './color-picker.state';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[COLOR_PICKER_TAGNAME]: OuiColorPickerElement;
	}
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging
export interface OuiColorPickerElement {
	[COLOR_PICKER_SYMBOL]: OuiColorPickerState;
}

export class OuiColorPickerElement extends HTMLElement {
	static readonly formAssociated = true;

	static readonly observedAttributes: string[] = ['disabled', 'required', 'value'];

	/**
	 * Is the color picker disabled?
	 */
	get disabled(): boolean {
		return this[COLOR_PICKER_SYMBOL]?.component.disabled ?? false;
	}

	/**
	 * Should the color picker be disabled?
	 */
	set disabled(value: boolean) {
		const state = this[COLOR_PICKER_SYMBOL];

		if (
			state.component != null &&
			typeof value === 'boolean' &&
			value !== state.component.disabled
		) {
			setColorPickerDisabled(state, 'disabled', value);
		}
	}

	/**
	 * Form element associated with the color picker
	 */
	get form(): HTMLFormElement | null {
		return this[COLOR_PICKER_SYMBOL].form.internals.form;
	}

	/**
	 * Color value as hexadecimal string
	 */
	get hex(): string {
		return this[COLOR_PICKER_SYMBOL]?.component.color.value.hex ?? '';
	}

	/**
	 * Set color value from a hexadecimal string
	 */
	set hex(value: string) {
		setColorPickerValue(this[COLOR_PICKER_SYMBOL], value, 'hex');
	}

	/**
	 * Color value as hexadecimal string with alpha channel
	 */
	get hexa(): string {
		return this[COLOR_PICKER_SYMBOL]?.component.color.value.hexa ?? '';
	}

	/**
	 * Set color value from a hexadecimal string with alpha channel
	 */
	set hexa(value: string) {
		setColorPickerValue(this[COLOR_PICKER_SYMBOL], value, 'hexa');
	}

	/**
	 * Color value as an _HSL_ color object
	 */
	get hsl(): HSLColor {
		return (
			this[COLOR_PICKER_SYMBOL]?.component.color.value.hsl ?? {hue: 0, lightness: 0, saturation: 0}
		);
	}

	/**
	 * Set color value from an _HSL_ color object
	 */
	set hsl(value: HSLColor) {
		setColorPickerValue(this[COLOR_PICKER_SYMBOL], value, 'hsl');
	}

	/**
	 * Color value as an _HSLA_ color object _(HSL with alpha channel)_
	 */
	get hsla(): HSLAColor {
		return (
			this[COLOR_PICKER_SYMBOL]?.component.color.value.hsla ?? {
				hue: 0,
				lightness: 0,
				saturation: 0,
				alpha: 100,
			}
		);
	}

	/**
	 * Set color value from an _HSLA_ color object _(HSL with alpha channel)_
	 */
	set hsla(value: HSLAColor) {
		setColorPickerValue(this[COLOR_PICKER_SYMBOL], value, 'hsla');
	}

	/**
	 * Color value as an _HWB_ color object
	 */
	get hwb(): HWBColor {
		return (
			this[COLOR_PICKER_SYMBOL]?.component.color.value.hwb ?? {hue: 0, whiteness: 0, blackness: 0}
		);
	}

	/**
	 * Set color value from an _HWB_ color object
	 */
	set hwb(value: HWBColor) {
		setColorPickerValue(this[COLOR_PICKER_SYMBOL], value, 'hwb');
	}

	/**
	 * Color value as an _HWBA_ color object _(HWB with alpha channel)_
	 */
	get hwba(): HWBAColor {
		return (
			this[COLOR_PICKER_SYMBOL]?.component.color.value.hwba ?? {
				hue: 0,
				whiteness: 0,
				blackness: 0,
				alpha: 100,
			}
		);
	}

	/**
	 * Set color value from an _HWBA_ color object _(HWB with alpha channel)_
	 */
	set hwba(value: HWBAColor) {
		setColorPickerValue(this[COLOR_PICKER_SYMBOL], value, 'hwba');
	}

	/**
	 * Text input value
	 */
	get input(): string {
		return this[COLOR_PICKER_SYMBOL]?.component.anchor.input.value ?? '';
	}

	/**
	 * Label elements associated with the color picker
	 */
	get labels(): NodeList {
		return this[COLOR_PICKER_SYMBOL].form.internals.labels;
	}

	/**
	 * Localization information for the color picker
	 */
	get localizations(): OuiLocalizations<OuiColorPickerLocalizations> {
		return this[COLOR_PICKER_SYMBOL]?.component.localizations;
	}

	/**
	 * Is the color picker readonly?
	 */
	get readonly(): boolean {
		return this[COLOR_PICKER_SYMBOL]?.component.readonly ?? false;
	}

	/**
	 * Should the color picker be readonly?
	 */
	set readonly(value: boolean) {
		const state = this[COLOR_PICKER_SYMBOL];

		if (
			state.component != null &&
			typeof value === 'boolean' &&
			value !== state.component.readonly
		) {
			setColorPickerDisabled(state, 'readonly', value);
		}
	}

	/**
	 * Is the color picker required?
	 */
	get required(): boolean {
		return this[COLOR_PICKER_SYMBOL]?.component.required ?? false;
	}

	/**
	 * Should the color picker be required?
	 */
	set required(value: boolean) {
		const state = this[COLOR_PICKER_SYMBOL];

		if (
			state.component != null &&
			typeof value === 'boolean' &&
			value !== state.component.required
		) {
			setColorPickerRequired(state, value);
		}
	}

	/**
	 * Color value as an _RGB_ color object
	 */
	get rgb(): RGBColor {
		return this[COLOR_PICKER_SYMBOL]?.component.color.value.rgb ?? {red: 0, green: 0, blue: 0};
	}

	/**
	 * Set color value from an _RGB_ color object
	 */
	set rgb(value: RGBColor) {
		setColorPickerValue(this[COLOR_PICKER_SYMBOL], value, 'rgb');
	}

	/**
	 * Color value as an _RGBA_ color object _(RGB with alpha channel)_
	 */
	get rgba(): RGBAColor {
		return (
			this[COLOR_PICKER_SYMBOL]?.component.color.value.rgba ?? {
				red: 0,
				green: 0,
				blue: 0,
				alpha: 100,
			}
		);
	}

	/**
	 * Set color value from an _RGBA_ color object _(RGB with alpha channel)_
	 */
	set rgba(value: RGBAColor) {
		setColorPickerValue(this[COLOR_PICKER_SYMBOL], value, 'rgba');
	}

	/**
	 * Validation message for the color picker
	 */
	get validationMessage(): string {
		return this[COLOR_PICKER_SYMBOL].form.internals.validationMessage;
	}

	/**
	 * Validity state for the color picker
	 */
	get validity(): ValidityState {
		return this[COLOR_PICKER_SYMBOL].form.internals.validity;
	}

	/**
	 * Current color value
	 */
	get value(): string {
		return this[COLOR_PICKER_SYMBOL]?.component.value.current ?? '';
	}

	/**
	 * Set color value from a string, _HSL(A)_, _HWB(A)_, or _RGB(A)_ color object
	 */
	set value(value: string | HSLColor | HSLAColor | HWBColor | HWBAColor | RGBColor | RGBAColor) {
		const state = this[COLOR_PICKER_SYMBOL];

		if (state.component == null) {
			return;
		}

		if (typeof value === 'string') {
			state.component.anchor.input.value = value;

			onColorPickerInput(state);
		} else {
			setColorPickerValue(state, value);
		}
	}

	/**
	 * Can the color picker be validated?
	 */
	get willValidate(): boolean {
		return this[COLOR_PICKER_SYMBOL].form.internals.willValidate;
	}

	constructor() {
		super();

		this[COLOR_PICKER_SYMBOL] = {
			component: undefined as never,
			form: {
				internals: this.attachInternals(),
			},
		};
	}

	attributeChangedCallback(name: string, _: string | null, value: string | null): void {
		if (this[COLOR_PICKER_SYMBOL].component == null) {
			return;
		}

		switch (name) {
			case 'disabled':
				this.disabled = value != null;
				break;

			case 'required':
				this.required = value != null;
				break;

			case 'value':
				this.value = value ?? '';
				break;
		}
	}

	/**
	 * Check if the color picker is valid
	 *
	 * @returns `true` if the color picker is valid, otherwise `false`
	 */
	checkValidity(): boolean {
		return this[COLOR_PICKER_SYMBOL].form.internals.checkValidity();
	}

	/**
	 * Clear the color picker's value
	 */
	clear(): void {
		this.value = '';
	}

	connectedCallback(): void {
		const state = this[COLOR_PICKER_SYMBOL];
		const {component} = state;

		if (component == null) {
			initializeColorPickerComponent(this, state);
		} else {
			attachColorPicker(state);
		}
	}

	disconnectedCallback(): void {
		const state = this[COLOR_PICKER_SYMBOL];

		if (state.component != null) {
			detachColorPicker(state);
		}
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		this.value = this[COLOR_PICKER_SYMBOL]?.component.value.initial ?? '';
	}

	formStateRestoreCallback(state: unknown, reason: unknown): void {
		const {component, form} = this[COLOR_PICKER_SYMBOL];

		if (reason !== 'restore' || typeof state !== 'string' || component == null) {
			return;
		}

		if (component == null) {
			form.restored = state;
		} else {
			this.value = state;
		}
	}

	/**
	 * Check if the color picker is valid and report any validation errors
	 *
	 * @returns `true` if the color picker is valid, otherwise `false`
	 */
	reportValidity(): boolean {
		return this[COLOR_PICKER_SYMBOL].form.internals.reportValidity();
	}

	/**
	 * Set a custom validation message for the color picker
	 *
	 * @param message Validation message
	 */
	setCustomValidity(message: string): void {
		this[COLOR_PICKER_SYMBOL].form.internals.setValidity(
			{customError: message !== ''},
			message,
			this,
		);
	}
}

// #region Initialization

customElements.define(COLOR_PICKER_TAGNAME, OuiColorPickerElement);

// #endregion

// #region Exports

export {setColorPickerLocalizations} from './color-picker.misc';
export {OuiColorPickerEvent} from './color-picker.model';

// #endregion
