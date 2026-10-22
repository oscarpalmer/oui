import {parse} from '@oscarpalmer/atoms/string';
import {getAttribute} from '@oscarpalmer/toretto/attribute';
import type {OuiLocalizations} from '../internal/l10n/l10n.model';
import {setOptionListValue, setOptionListValues} from '../internal/option-list/option-list.data';
import {
	setOptionListDisabled,
	setOptionListFilter,
	setOptionListLimit,
	setOptionListReadonly,
	setOptionListRequired,
} from '../internal/option-list/option-list.misc';
import {attachOptionList, detachOptionList} from '../internal/option-list/option-list.state';
import {LISTBOX_SYMBOL, LISTBOX_TAGNAME} from './listbox.constants';
import type {OuiListboxLocalizations, OuiListboxState} from './listbox.model';
import {initializeListbox, listboxes, onAttachListbox, onDetachListbox} from './listbox.state';

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
	static readonly formAssociated = true;

	static readonly observedAttributes: string[] = ['max', 'min', 'required', 'value'];

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
			setOptionListDisabled(this[LISTBOX_SYMBOL], value);
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
		setOptionListFilter(this[LISTBOX_SYMBOL], value);
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

	get localizations(): OuiLocalizations<OuiListboxLocalizations> {
		return this[LISTBOX_SYMBOL].component?.localizations;
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
		setOptionListLimit('max', this[LISTBOX_SYMBOL], value);
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
		setOptionListLimit('min', this[LISTBOX_SYMBOL], value);
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
			setOptionListReadonly(this[LISTBOX_SYMBOL], value);
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
			setOptionListRequired(this[LISTBOX_SYMBOL], value);
		}
	}

	/**
	 * Selected options
	 */
	get selected(): Element[] {
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
		setOptionListValue(this[LISTBOX_SYMBOL], value);
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
		setOptionListValues(this[LISTBOX_SYMBOL], values);
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
			component: undefined as never,
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
				setOptionListLimit(name, state, value);
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
		setOptionListValues(this[LISTBOX_SYMBOL], []);
	}

	connectedCallback(): void {
		const state = this[LISTBOX_SYMBOL];

		if (state.component == null) {
			initializeListbox(this, state);
		} else {
			attachOptionList(state, listboxes, onAttachListbox);
		}
	}

	disconnectedCallback(): void {
		const state = this[LISTBOX_SYMBOL];

		if (state.component != null) {
			detachOptionList(state, listboxes, onDetachListbox);
		}
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		const state = this[LISTBOX_SYMBOL];

		setOptionListValues(state, state.component.values.initial);
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
			setOptionListValues(this[LISTBOX_SYMBOL], parsed);
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
}

// #endregion

// #region Initialization

customElements.define(LISTBOX_TAGNAME, OuiListboxElement);

// #endregion

// #region Exports

export {setListboxLocalizations} from './listbox.misc';

// #endregion
