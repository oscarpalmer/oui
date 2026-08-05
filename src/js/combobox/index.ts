import {parse} from '@oscarpalmer/atoms/string';
import {getAttribute} from '@oscarpalmer/toretto/attribute';
import {COMBOBOX_TAGNAME} from './constants.combobox';
import {setComboboxValue, setComboboxValues} from './data.combobox';
import {setComboboxDisabled, setComboboxReadonly, setComboboxRequired} from './dom.combobox';
import {updateComboboxLocalizations} from './i18n.combobox';
import {setComboboxFilter, setComboboxLimit} from './misc.combobox';
import type {OuiComboboxLocalizations, OuiComboboxState, OuiComboboxType} from './models.combobox';
import {attachCombobox, createComboboxState, detachCombobox} from './state.combobox';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[COMBOBOX_TAGNAME]: OuiComboboxElement;
	}
}

export class OuiComboboxElement extends HTMLElement {
	static formAssociated = true;

	static observedAttributes = ['max', 'min', 'required', 'value'];

	readonly #internals: ElementInternals;

	#restored?: string[];

	#state!: OuiComboboxState;

	/**
	 * Is the combobox disabled?
	 */
	get disabled(): boolean {
		return this.#state?.disabled ?? false;
	}

	/**
	 * Should the combobox be disabled?
	 */
	set disabled(value: boolean) {
		if (typeof value === 'boolean' && value !== this.disabled) {
			setComboboxDisabled(this.#state, value);
		}
	}

	/**
	 * Current filter value
	 */
	get filter(): string {
		return this.#state.filter.element.value;
	}

	/**
	 * Set the filter value
	 */
	set filter(value: string) {
		setComboboxFilter(this.#state, value);
	}

	/**
	 * Maximum number of selected options
	 */
	get max(): number | undefined {
		return this.#state?.max;
	}

	/**
	 * Set the maximum number of selected options
	 */
	set max(value: number) {
		setComboboxLimit('max', this.#state, value);
	}

	/**
	 * Minimum number of selected options
	 */
	get min(): number | undefined {
		return this.#state?.min;
	}

	/**
	 * Set the minimum number of selected options
	 */
	set min(value: number) {
		setComboboxLimit('min', this.#state, value);
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
		return this.#state?.readonly ?? false;
	}

	/**
	 * Should the combobox be readonly?
	 */
	set readonly(value: boolean) {
		if (typeof value === 'boolean' && value !== this.readonly) {
			setComboboxReadonly(this.#state, value);
		}
	}

	/**
	 * Is the combobox required?
	 */
	get required(): boolean {
		return this.#state?.required ?? false;
	}

	/**
	 * Should the combobox be required?
	 */
	set required(value: boolean) {
		if (typeof value === 'boolean' && value !== this.required) {
			setComboboxRequired(this.#state, value);
		}
	}

	/**
	 * Selected options
	 */
	get selected(): HTMLElement[] {
		return this.#state.options.selected.slice();
	}

	/**
	 * Type of combobox
	 */
	get type(): OuiComboboxType {
		return this.#state.type;
	}

	/**
	 * Current value
	 */
	get value(): string {
		return this.#state.values.current[0];
	}

	/**
	 * Set the value
	 */
	set value(value: unknown) {
		setComboboxValue(this.#state, value);
	}

	/**
	 * Current values
	 */
	get values(): string[] {
		return this.#state.values.current.slice();
	}

	/**
	 * Set the values
	 */
	set values(value: unknown[]) {
		setComboboxValues(this.#state, value);
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
			case 'required':
				this[name] = this.hasAttribute(name);
				break;

			case 'max':
			case 'min':
				setComboboxLimit(name, this.#state, value);
				break;

			case 'value':
				this.value = value ?? '';
				break;

			default:
				break;
		}
	}

	/**
	 * Clear all selected options
	 */
	clear(): void {
		setComboboxValues(this.#state, []);
	}

	connectedCallback(): void {
		if (this.#state == null) {
			this.#initialize();
		} else {
			attachCombobox(this.#state);
		}
	}

	disconnectedCallback(): void {
		if (this.#state != null) {
			detachCombobox(this.#state);
		}
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		setComboboxValues(this.#state, this.#state.values.initial, false);
	}

	formStateRestoreCallback(state: string | File | FormData, reason: unknown): void {
		if (reason !== 'restore') {
			return;
		}

		const parsed = typeof state === 'string' ? parse(state) : undefined;

		if (!Array.isArray(parsed)) {
			return;
		}

		if (this.#state == null) {
			this.#restored = parsed;
		} else {
			setComboboxValues(this.#state, parsed);
		}
	}

	/**
	 * Set combobox localizations for a specific language
	 *
	 * @param language Language code
	 * @param localizations Localizations for language
	 */
	setLocalizations(language: string, localizations: Partial<OuiComboboxLocalizations>): void;

	/**
	 * Set combobox localizations for one or more languages
	 *
	 * @param localizations Localizations for one or more languages
	 */
	setLocalizations(localizations: Record<string, Partial<OuiComboboxLocalizations>>): void;

	setLocalizations(
		first: string | Record<string, Partial<OuiComboboxLocalizations>>,
		second?: Partial<OuiComboboxLocalizations>,
	): void {
		updateComboboxLocalizations(
			typeof first === 'string'
				? {
						[first]: second!,
					}
				: first,
			this.#state.localizations,
		);
	}

	#initialize(): void {
		this.tabIndex = -1;

		this.#state = createComboboxState(this, this.#internals);

		if (this.#restored != null) {
			setComboboxValues(this.#state, this.#restored, false);

			this.#restored = undefined;
		}
	}
}

// #endregion

// #region Initialization

customElements.define(COMBOBOX_TAGNAME, OuiComboboxElement);

// #endregion

// #region Exports

export {setComboboxLocalizations} from './i18n.combobox';

// #endregion
