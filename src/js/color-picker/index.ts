import {
	type HSLAColor,
	type HSLColor,
	type HWBAColor,
	type HWBColor,
	type RGBAColor,
	type RGBColor,
} from '@oscarpalmer/atoms/color';
import {COLOR_PICKER_TAGNAME, colorPickerLocalizations} from './constants.color-picker';
import {onColorPickerInput} from './event.color-picker';
import {
	setColorPickerDisabled,
	setColorPickerRequired,
	setColorPickerValue,
	updateColorPickerLocalizations,
} from './misc.color-picker';
import type {OuiColorPickerLocalizations, OuiColorPickerState} from './models.color-picker';
import {attachColorPicker, detachColorPicker, initializeColorPicker} from './state.color-picker';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[COLOR_PICKER_TAGNAME]: OuiColorPickerElement;
	}
}

export class OuiColorPickerElement extends HTMLElement {
	static formAssociated = true;

	static observedAttributes = ['disabled', 'required', 'value'];

	readonly #internals: ElementInternals;

	#restored?: string;

	#state!: OuiColorPickerState;

	/**
	 * Is the color picker disabled?
	 */
	get disabled(): boolean {
		return this.#state?.disabled ?? false;
	}

	/**
	 * Should the color picker be disabled?
	 */
	set disabled(value: boolean) {
		if (this.#state != null && typeof value === 'boolean' && value !== this.#state.disabled) {
			setColorPickerDisabled(this.#state, 'disabled', value);
		}
	}

	/**
	 * Form element associated with the color picker
	 */
	get form(): HTMLFormElement | null {
		return this.#internals.form;
	}

	/**
	 * Color value as hexadecimal string
	 */
	get hex(): string {
		return this.#state?.color.value.hex ?? '';
	}

	/**
	 * Set color value from a hexadecimal string
	 */
	set hex(value: string) {
		setColorPickerValue(this.#state, value, 'hex');
	}

	/**
	 * Color value as hexadecimal string with alpha channel
	 */
	get hexa(): string {
		return this.#state?.color.value.hexa ?? '';
	}

	/**
	 * Set color value from a hexadecimal string with alpha channel
	 */
	set hexa(value: string) {
		setColorPickerValue(this.#state, value, 'hexa');
	}

	/**
	 * Color value as an _HSL_ color object
	 */
	get hsl(): HSLColor {
		return this.#state?.color.value.hsl ?? {hue: 0, lightness: 0, saturation: 0};
	}

	/**
	 * Set color value from an _HSL_ color object
	 */
	set hsl(value: HSLColor) {
		setColorPickerValue(this.#state, value, 'hsl');
	}

	/**
	 * Color value as an _HSLA_ color object _(HSL with alpha channel)_
	 */
	get hsla(): HSLAColor {
		return this.#state?.color.value.hsla ?? {hue: 0, lightness: 0, saturation: 0, alpha: 100};
	}

	/**
	 * Set color value from an _HSLA_ color object _(HSL with alpha channel)_
	 */
	set hsla(value: HSLAColor) {
		setColorPickerValue(this.#state, value, 'hsla');
	}

	/**
	 * Color value as an _HWB_ color object
	 */
	get hwb(): HWBColor {
		return this.#state?.color.value.hwb ?? {hue: 0, whiteness: 0, blackness: 0};
	}

	/**
	 * Set color value from an _HWB_ color object
	 */
	set hwb(value: HWBColor) {
		setColorPickerValue(this.#state, value, 'hwb');
	}

	/**
	 * Color value as an _HWBA_ color object _(HWB with alpha channel)_
	 */
	get hwba(): HWBAColor {
		return this.#state?.color.value.hwba ?? {hue: 0, whiteness: 0, blackness: 0, alpha: 100};
	}

	/**
	 * Set color value from an _HWBA_ color object _(HWB with alpha channel)_
	 */
	set hwba(value: HWBAColor) {
		setColorPickerValue(this.#state, value, 'hwba');
	}

	/**
	 * Text input value
	 */
	get input(): string {
		return this.#state?.anchor.input.value ?? '';
	}

	/**
	 * Label elements associated with the color picker
	 */
	get labels(): NodeList {
		return this.#internals.labels;
	}

	/**
	 * Is the color picker readonly?
	 */
	get readonly(): boolean {
		return this.#state?.readonly ?? false;
	}

	/**
	 * Should the color picker be readonly?
	 */
	set readonly(value: boolean) {
		if (this.#state != null && typeof value === 'boolean' && value !== this.#state.readonly) {
			setColorPickerDisabled(this.#state, 'readonly', value);
		}
	}

	/**
	 * Is the color picker required?
	 */
	get required(): boolean {
		return this.#state?.required ?? false;
	}

	/**
	 * Should the color picker be required?
	 */
	set required(value: boolean) {
		if (this.#state != null && typeof value === 'boolean' && value !== this.#state.required) {
			setColorPickerRequired(this.#state, value);
		}
	}

	/**
	 * Color value as an _RGB_ color object
	 */
	get rgb(): RGBColor {
		return this.#state?.color.value.rgb ?? {red: 0, green: 0, blue: 0};
	}

	/**
	 * Set color value from an _RGB_ color object
	 */
	set rgb(value: RGBColor) {
		setColorPickerValue(this.#state, value, 'rgb');
	}

	/**
	 * Color value as an _RGBA_ color object _(RGB with alpha channel)_
	 */
	get rgba(): RGBAColor {
		return this.#state?.color.value.rgba ?? {red: 0, green: 0, blue: 0, alpha: 100};
	}

	/**
	 * Set color value from an _RGBA_ color object _(RGB with alpha channel)_
	 */
	set rgba(value: RGBAColor) {
		setColorPickerValue(this.#state, value, 'rgba');
	}

	/**
	 * Validation message for the color picker
	 */
	get validationMessage(): string {
		return this.#internals.validationMessage;
	}

	/**
	 * Validity state for the color picker
	 */
	get validity(): ValidityState {
		return this.#internals.validity;
	}

	/**
	 * Current color value
	 */
	get value(): string {
		return this.#state?.value.current ?? '';
	}

	/**
	 * Set color value from a string, _HSL(A)_, _HWB(A)_, or _RGB(A)_ color object
	 */
	set value(value: string | HSLColor | HSLAColor | HWBColor | HWBAColor | RGBColor | RGBAColor) {
		if (typeof value === 'string') {
			this.#state.anchor.input.value = value;

			onColorPickerInput(this.#state);
		} else {
			setColorPickerValue(this.#state, value);
		}
	}

	/**
	 * Can the color picker be validated?
	 */
	get willValidate(): boolean {
		return this.#internals.willValidate;
	}

	constructor() {
		super();

		this.#internals = this.attachInternals();
	}

	attributeChangedCallback(name: string, _: string | null, value: string | null): void {
		if (this.#state == null) {
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
		return this.#internals.checkValidity();
	}

	/**
	 * Clear the color picker's value
	 */
	clear(): void {
		this.value = '';
	}

	connectedCallback(): void {
		if (this.#state == null) {
			this.#initialize();
		} else {
			attachColorPicker(this.#state);
		}
	}

	disconnectedCallback(): void {
		if (this.#state != null) {
			detachColorPicker(this.#state);
		}
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		this.value = this.#state?.value.initial ?? '';
	}

	formStateRestoreCallback(state: unknown, reason: unknown): void {
		if (reason !== 'restore' || typeof state !== 'string' || this.#state == null) {
			return;
		}

		if (this.#state == null) {
			this.#restored = state;
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
		return this.#internals.reportValidity();
	}

	/**
	 * Set a custom validation message for the color picker
	 *
	 * @param message Validation message
	 */
	setCustomValidity(message: string): void {
		this.#internals.setValidity({customError: message !== ''}, message, this);
	}

	/**
	 * Set localizations for a specific language
	 *
	 * @param language Language code
	 * @param localizations Localizations for language
	 */
	setLocalizations(language: string, localizations: Partial<OuiColorPickerLocalizations>): void;

	/**
	 * Set localizations for one or more languages
	 *
	 * @param localizations Localizations for one or more languages
	 */
	setLocalizations(localizations: Record<string, Partial<OuiColorPickerLocalizations>>): void;

	setLocalizations(
		first: string | Record<string, Partial<OuiColorPickerLocalizations>>,
		second?: Partial<OuiColorPickerLocalizations>,
	): void {
		updateColorPickerLocalizations(
			colorPickerLocalizations,
			this.#state.localizations.component,
			first,
			second,
		);
	}

	#initialize(): void {
		this.#state = initializeColorPicker(this, this.#internals);

		if (this.#restored != null) {
			this.value = this.#restored;

			this.#restored = undefined;
		}
	}
}

// #region Initialization

customElements.define(COLOR_PICKER_TAGNAME, OuiColorPickerElement);

// #endregion

// #region Exports

export {setColorPickerLocalizations} from './misc.color-picker';
export {OuiColorPickerEvent} from './models.color-picker';

// #endregion
