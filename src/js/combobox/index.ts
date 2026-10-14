import {parse} from '@oscarpalmer/atoms/string';
import {getAttribute} from '@oscarpalmer/toretto/attribute';
import {setListboxValue, setListboxValues} from '../internal/listbox/listbox.data';
import {
	setListboxDisabled,
	setListboxFilter,
	setListboxLimit,
	setListboxReadonly,
	setListboxRequired,
} from '../internal/listbox/listbox.misc';
import type {OuiListboxLocalizations, OuiListboxType} from '../internal/listbox/listbox.model';
import {attachListbox, detachListbox} from '../internal/listbox/listbox.state';
import {updateLocalizations} from '../l10n/index';
import {COMBOBOX_SYMBOL, COMBOBOX_TAGNAME} from './combobox.constants';
import type {OuiComboboxState} from './combobox.model';
import {comboboxes, initializeCombobox, onAttachCombobox, onDetachCombobox} from './combobox.state';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[COMBOBOX_TAGNAME]: OuiComboboxElement & {[COMBOBOX_SYMBOL]: OuiComboboxState};
	}
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging
export interface OuiComboboxElement {
	[COMBOBOX_SYMBOL]: OuiComboboxState;
}

export class OuiComboboxElement extends HTMLElement {
	static formAssociated = true;

	static observedAttributes: string[] = ['max', 'min', 'required', 'value'];

	/**
	 * Is the combobox disabled?
	 */
	get disabled(): boolean {
		return this[COMBOBOX_SYMBOL].component?.disabled ?? false;
	}

	/**
	 * Should the combobox be disabled?
	 */
	set disabled(value: boolean) {
		if (typeof value === 'boolean' && value !== this.disabled) {
			setListboxDisabled(this[COMBOBOX_SYMBOL], value);
		}
	}

	/**
	 * Current filter value
	 */
	get filter(): string {
		return this[COMBOBOX_SYMBOL].component?.filter.element.value ?? '';
	}

	/**
	 * Set the filter value
	 */
	set filter(value: string) {
		setListboxFilter(this[COMBOBOX_SYMBOL], value);
	}

	/**
	 * Form element associated with the combobox
	 */
	get form(): HTMLFormElement | null {
		return this[COMBOBOX_SYMBOL].form.internals.form;
	}

	/**
	 * Label elements associated with the combobox
	 */
	get labels(): NodeList {
		return this[COMBOBOX_SYMBOL].form.internals.labels;
	}

	/**
	 * Maximum number of selected options
	 */
	get max(): number | undefined {
		return this[COMBOBOX_SYMBOL].component?.max;
	}

	/**
	 * Set the maximum number of selected options
	 */
	set max(value: number) {
		setListboxLimit('max', this[COMBOBOX_SYMBOL], value);
	}

	/**
	 * Minimum number of selected options
	 */
	get min(): number | undefined {
		return this[COMBOBOX_SYMBOL].component?.min;
	}

	/**
	 * Set the minimum number of selected options
	 */
	set min(value: number) {
		setListboxLimit('min', this[COMBOBOX_SYMBOL], value);
	}

	/**
	 * Does the combobox allow multiple values?
	 */
	get multiple(): boolean {
		return this.hasAttribute('multiple');
	}

	/**
	 * Name of the combobox
	 */
	get name(): string {
		return getAttribute(this, 'name') ?? '';
	}

	/**
	 * Is the combobox readonly?
	 */
	get readonly(): boolean {
		return this[COMBOBOX_SYMBOL].component?.readonly ?? false;
	}

	/**
	 * Should the combobox be readonly?
	 */
	set readonly(value: boolean) {
		if (typeof value === 'boolean' && value !== this.readonly) {
			setListboxReadonly(this[COMBOBOX_SYMBOL], value);
		}
	}

	/**
	 * Is the combobox required?
	 */
	get required(): boolean {
		return this[COMBOBOX_SYMBOL].component?.required ?? false;
	}

	/**
	 * Should the combobox be required?
	 */
	set required(value: boolean) {
		if (typeof value === 'boolean' && value !== this.required) {
			setListboxRequired(this[COMBOBOX_SYMBOL], value);
		}
	}

	/**
	 * Selected options
	 */
	get selected(): HTMLElement[] {
		return this[COMBOBOX_SYMBOL].component?.options.selected.slice() ?? [];
	}

	/**
	 * Type of combobox
	 */
	get type(): OuiListboxType {
		return this[COMBOBOX_SYMBOL].component?.type;
	}

	/**
	 * Validation message for the combobox
	 */
	get validationMessage(): string {
		return this[COMBOBOX_SYMBOL].form.internals.validationMessage;
	}

	/**
	 * Validity state for the combobox
	 */
	get validity(): ValidityState {
		return this[COMBOBOX_SYMBOL].form.internals.validity;
	}

	/**
	 * Current value
	 */
	get value(): string {
		return this[COMBOBOX_SYMBOL].component?.values.current[0] ?? '';
	}

	/**
	 * Set the value
	 */
	set value(value: unknown) {
		setListboxValue(this[COMBOBOX_SYMBOL], value);
	}

	/**
	 * Current values
	 */
	get values(): string[] {
		return this[COMBOBOX_SYMBOL].component?.values.current.slice() ?? [];
	}

	/**
	 * Set the values
	 */
	set values(values: unknown[]) {
		setListboxValues(this[COMBOBOX_SYMBOL], values);
	}

	/**
	 * Can the combobox be validated?
	 */
	get willValidate(): boolean {
		return this[COMBOBOX_SYMBOL].form.internals.willValidate;
	}

	constructor() {
		super();

		this[COMBOBOX_SYMBOL] = {
			component: null as never,
			form: {
				internals: this.attachInternals(),
			},
		};
	}

	attributeChangedCallback(name: string, _: string | null, value: string | null): void {
		const state = this[COMBOBOX_SYMBOL];

		if (state == null) {
			return;
		}

		switch (name) {
			case 'required':
				this[name] = this.hasAttribute(name);
				break;

			case 'max':
			case 'min':
				setListboxLimit(name, state, value);
				break;

			case 'value':
				this.value = value ?? '';
				break;

			default:
				break;
		}
	}

	/**
	 * Check if the combobox is valid
	 *
	 * @returns `true` if the combobox is valid, otherwise `false`
	 */
	checkValidity(): boolean {
		return this[COMBOBOX_SYMBOL].form.internals.checkValidity();
	}

	/**
	 * Clear all selected options
	 */
	clear(): void {
		setListboxValues(this[COMBOBOX_SYMBOL], []);
	}

	connectedCallback(): void {
		const state = this[COMBOBOX_SYMBOL];

		if (state.component == null) {
			initializeCombobox(this, state);
		} else {
			attachListbox(state, comboboxes, onAttachCombobox);
		}
	}

	disconnectedCallback(): void {
		const state = this[COMBOBOX_SYMBOL];

		if (state.component != null) {
			detachListbox(state, comboboxes, onDetachCombobox);
		}
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		const state = this[COMBOBOX_SYMBOL];

		if (state.component != null) {
			setListboxValues(state, state.component.values.initial);
		}
	}

	formStateRestoreCallback(state: unknown, reason: unknown): void {
		if (reason !== 'restore') {
			return;
		}

		const parsed = typeof state === 'string' ? parse(state) : undefined;

		if (!Array.isArray(parsed)) {
			return;
		}

		const {component, form} = this[COMBOBOX_SYMBOL];

		if (component == null) {
			form.restored = parsed;
		} else {
			setListboxValues({component, form}, parsed);
		}
	}

	/**
	 * Check if the combobox is valid and report any validation errors
	 *
	 * @returns `true` if the combobox is valid, otherwise `false`
	 */
	reportValidity(): boolean {
		return this[COMBOBOX_SYMBOL].form.internals.reportValidity();
	}

	/**
	 * Set a custom validation message for the combobox
	 *
	 * @param message Validation message
	 */
	setCustomValidity(message: string): void {
		this[COMBOBOX_SYMBOL].form.internals.setValidity({customError: message !== ''}, message, this);
	}

	/**
	 * Set combobox localizations for a specific language
	 *
	 * @param language Language code
	 * @param localizations Localizations for language
	 */
	setLocalizations(language: string, localizations: Partial<OuiListboxLocalizations>): void;

	/**
	 * Set combobox localizations for one or more languages
	 *
	 * @param localizations Localizations for one or more languages
	 */
	setLocalizations(localizations: Record<string, Partial<OuiListboxLocalizations>>): void;

	setLocalizations(
		first: string | Record<string, Partial<OuiListboxLocalizations>>,
		second?: Partial<OuiListboxLocalizations>,
	): void {
		const {localizations} = this[COMBOBOX_SYMBOL].component;

		updateLocalizations(
			localizations.global,
			typeof first === 'string'
				? {
						[first]: second!,
					}
				: first,
			localizations.component,
		);
	}
}

// #endregion

// #region Initialization

customElements.define(COMBOBOX_TAGNAME, OuiComboboxElement);

// #endregion

// #region Exports

export {setComboboxLocalizations} from './combobox.misc';

// #endregion
