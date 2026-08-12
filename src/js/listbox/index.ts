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
import {LISTBOX_TAGNAME} from './constants.listbox';
import {updateListboxLocalizations} from './misc.listbox';
import {createListboxState, listboxStates, onAttachListbox, onDetachListbox} from './state.listbox';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[LISTBOX_TAGNAME]: OuiListboxElement;
	}
}

export class OuiListboxElement extends HTMLElement {
	static formAssociated = true;

	static observedAttributes = ['max', 'min', 'required', 'value'];

	readonly #internals: ElementInternals;

	#restored?: string[];

	#state!: OuiListboxState;

	/**
	 * Is the listbox disabled?
	 */
	get disabled(): boolean {
		return this.#state?.disabled ?? false;
	}

	/**
	 * Should the listbox be disabled?
	 */
	set disabled(value: boolean) {
		if (typeof value === 'boolean' && value !== this.disabled) {
			setListboxDisabled(this.#state, value);
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
		setListboxFilter(this.#state, value);
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
		setListboxLimit('max', this.#state, value);
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
		setListboxLimit('min', this.#state, value);
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
		return this.#state?.readonly ?? false;
	}

	/**
	 * Should the listbox be readonly?
	 */
	set readonly(value: boolean) {
		if (typeof value === 'boolean' && value !== this.readonly) {
			setListboxReadonly(this.#state, value);
		}
	}

	/**
	 * Is the listbox required?
	 */
	get required(): boolean {
		return this.#state?.required ?? false;
	}

	/**
	 * Should the listbox be required?
	 */
	set required(value: boolean) {
		if (typeof value === 'boolean' && value !== this.required) {
			setListboxRequired(this.#state, value);
		}
	}

	/**
	 * Selected options
	 */
	get selected(): HTMLElement[] {
		return this.#state.options.selected.slice();
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
		setListboxValue(this.#state, value);
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
	set values(values: unknown[]) {
		setListboxValues(this.#state, values);
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
				setListboxLimit(name, this.#state, value);
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
		setListboxValues(this.#state, []);
	}

	connectedCallback(): void {
		if (this.#state == null) {
			this.#initialize();
		} else {
			attachListbox(this.#state, listboxStates, onAttachListbox);
		}
	}

	disconnectedCallback(): void {
		if (this.#state != null) {
			detachListbox(this.#state, listboxStates, onDetachListbox);
		}
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		setListboxValues(this.#state, this.#state.values.initial);
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
			setListboxValues(this.#state, parsed);
		}
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
		updateListboxLocalizations(
			this.#state.localizations.global,
			this.#state.localizations.component,
			first,
			second,
		);
	}

	#initialize(): void {
		this.#state = createListboxState(this, this.#internals);

		if (this.#restored != null) {
			setListboxValues(this.#state, this.#restored);

			this.#restored = undefined;
		}
	}
}

// #endregion

// #region Initialization

customElements.define(LISTBOX_TAGNAME, OuiListboxElement);

// #endregion

// #region Exports

export {setListboxLocalizations} from './misc.listbox';

// #endregion
