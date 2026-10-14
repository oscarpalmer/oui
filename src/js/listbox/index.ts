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
import type {OuiListboxLocalizations, OuiListboxState} from '../internal/listbox/listbox.model';
import {attachListbox, detachListbox} from '../internal/listbox/listbox.state';
import {LISTBOX_SYMBOL, LISTBOX_TAGNAME} from './constants.listbox';
import {updateListboxLocalizations} from './misc.listbox';
import {initializeListbox, listboxes, onAttachListbox, onDetachListbox} from './state.listbox';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[LISTBOX_TAGNAME]: OuiListboxElement;
	}
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging
export interface OuiListboxElement {
	[LISTBOX_SYMBOL]: OuiListboxState;
}

export class OuiListboxElement extends HTMLElement {
	static formAssociated = true;

	static observedAttributes: string[] = ['max', 'min', 'required', 'value'];

	/**
	 * Is the listbox disabled?
	 */
	get disabled(): boolean {
		return this[LISTBOX_SYMBOL].component?.disabled ?? false;
	}

	/**
	 * Should the listbox be disabled?
	 */
	set disabled(value: boolean) {
		if (typeof value === 'boolean' && value !== this.disabled) {
			setListboxDisabled(this[LISTBOX_SYMBOL], value);
		}
	}

	/**
	 * Current filter value
	 */
	get filter(): string {
		return this[LISTBOX_SYMBOL].component?.filter.element.value ?? '';
	}

	/**
	 * Set the filter value
	 */
	set filter(value: string) {
		setListboxFilter(this[LISTBOX_SYMBOL], value);
	}

	/**
	 * Form element associated with the listbox
	 */
	get form(): HTMLFormElement | null {
		return this[LISTBOX_SYMBOL].form.internals.form;
	}

	/**
	 * Label elements associated with the listbox
	 */
	get labels(): NodeList {
		return this[LISTBOX_SYMBOL].form.internals.labels;
	}

	/**
	 * Maximum number of selected options
	 */
	get max(): number | undefined {
		return this[LISTBOX_SYMBOL].component?.max;
	}

	/**
	 * Set the maximum number of selected options
	 */
	set max(value: number) {
		setListboxLimit('max', this[LISTBOX_SYMBOL], value);
	}

	/**
	 * Minimum number of selected options
	 */
	get min(): number | undefined {
		return this[LISTBOX_SYMBOL].component?.min;
	}

	/**
	 * Set the minimum number of selected options
	 */
	set min(value: number) {
		setListboxLimit('min', this[LISTBOX_SYMBOL], value);
	}

	/**
	 * Does the listbox allow multiple values?
	 */
	get multiple(): boolean {
		return this.hasAttribute('multiple');
	}

	/**
	 * Name of the listbox
	 */
	get name(): string {
		return getAttribute(this, 'name') ?? '';
	}

	/**
	 * Is the listbox readonly?
	 */
	get readonly(): boolean {
		return this[LISTBOX_SYMBOL].component?.readonly ?? false;
	}

	/**
	 * Should the listbox be readonly?
	 */
	set readonly(value: boolean) {
		if (typeof value === 'boolean' && value !== this.readonly) {
			setListboxReadonly(this[LISTBOX_SYMBOL], value);
		}
	}

	/**
	 * Is the listbox required?
	 */
	get required(): boolean {
		return this[LISTBOX_SYMBOL].component?.required ?? false;
	}

	/**
	 * Should the listbox be required?
	 */
	set required(value: boolean) {
		if (typeof value === 'boolean' && value !== this.required) {
			setListboxRequired(this[LISTBOX_SYMBOL], value);
		}
	}

	/**
	 * Selected options
	 */
	get selected(): HTMLElement[] {
		return this[LISTBOX_SYMBOL].component?.options.selected.slice() ?? [];
	}

	/**
	 * Validation message for the listbox
	 */
	get validationMessage(): string {
		return this[LISTBOX_SYMBOL].form.internals.validationMessage;
	}

	/**
	 * Validity state for the listbox
	 */
	get validity(): ValidityState {
		return this[LISTBOX_SYMBOL].form.internals.validity;
	}

	/**
	 * Current value
	 */
	get value(): string {
		return this[LISTBOX_SYMBOL].component?.values.current[0] ?? '';
	}

	/**
	 * Set the value
	 */
	set value(value: unknown) {
		setListboxValue(this[LISTBOX_SYMBOL], value);
	}

	/**
	 * Current values
	 */
	get values(): string[] {
		return this[LISTBOX_SYMBOL].component?.values.current.slice() ?? [];
	}

	/**
	 * Set the values
	 */
	set values(values: unknown[]) {
		setListboxValues(this[LISTBOX_SYMBOL], values);
	}

	/**
	 * Can the listbox be validated?
	 */
	get willValidate(): boolean {
		return this[LISTBOX_SYMBOL].form.internals.willValidate;
	}

	constructor() {
		super();

		this[LISTBOX_SYMBOL] = {
			component: null as never,
			form: {
				internals: this.attachInternals(),
			},
		};
	}

	attributeChangedCallback(name: string, _: string | null, value: string | null): void {
		const state = this[LISTBOX_SYMBOL];

		if (state.component == null) {
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
	 * Check if the listbox is valid
	 *
	 * @returns `true` if the listbox is valid, otherwise `false`
	 */
	checkValidity(): boolean {
		return this[LISTBOX_SYMBOL].form.internals.checkValidity();
	}

	/**
	 * Clear all selected options
	 */
	clear(): void {
		setListboxValues(this[LISTBOX_SYMBOL], []);
	}

	connectedCallback(): void {
		const state = this[LISTBOX_SYMBOL];

		if (state.component == null) {
			initializeListbox(this, state);
		} else {
			attachListbox(state, listboxes, onAttachListbox);
		}
	}

	disconnectedCallback(): void {
		const state = this[LISTBOX_SYMBOL];

		if (state.component != null) {
			detachListbox(state, listboxes, onDetachListbox);
		}
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		const state = this[LISTBOX_SYMBOL];

		setListboxValues(state, state.component.values.initial);
	}

	formStateRestoreCallback(state: string | File | FormData, reason: unknown): void {
		if (reason !== 'restore') {
			return;
		}

		const parsed = typeof state === 'string' ? parse(state) : undefined;

		if (!Array.isArray(parsed)) {
			return;
		}

		const component = this[LISTBOX_SYMBOL]?.component;

		if (component == null) {
			this[LISTBOX_SYMBOL].form.restored = parsed;
		} else {
			setListboxValues(this[LISTBOX_SYMBOL], parsed);
		}
	}

	/**
	 * Check if the listbox is valid and report any validation errors
	 *
	 * @returns `true` if the listbox is valid, otherwise `false`
	 */
	reportValidity(): boolean {
		return this[LISTBOX_SYMBOL].form.internals.reportValidity();
	}

	/**
	 * Set a custom validation message for the listbox
	 *
	 * @param message Validation message
	 */
	setCustomValidity(message: string): void {
		this[LISTBOX_SYMBOL].form.internals.setValidity({customError: message !== ''}, message, this);
	}

	/**
	 * Set listbox localizations for a specific language
	 *
	 * @param language Language code
	 * @param localizations Localizations for language
	 */
	setLocalizations(language: string, localizations: Partial<OuiListboxLocalizations>): void;

	/**
	 * Set listbox localizations for one or more languages
	 *
	 * @param localizations Localizations for one or more languages
	 */
	setLocalizations(localizations: Record<string, Partial<OuiListboxLocalizations>>): void;

	setLocalizations(
		first: string | Record<string, Partial<OuiListboxLocalizations>>,
		second?: Partial<OuiListboxLocalizations>,
	): void {
		const {localizations} = this[LISTBOX_SYMBOL].component;

		updateListboxLocalizations(localizations.global, localizations.component, first, second);
	}
}

// #endregion

// #region Initialization

customElements.define(LISTBOX_TAGNAME, OuiListboxElement);

// #endregion

// #region Exports

export {setListboxLocalizations} from './misc.listbox';

// #endregion
