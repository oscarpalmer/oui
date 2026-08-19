import {
	getColor,
	getForegroundColor,
	isHexColor,
	isHslaColor,
	isHslColor,
	isHwbaColor,
	isHwbColor,
	isRgbaColor,
	isRgbColor,
	type Color,
	type HSLAColor,
	type HSLColor,
	type HWBAColor,
	type HWBColor,
	type RGBAColor,
	type RGBColor,
} from '@oscarpalmer/atoms/color';
import {round} from '@oscarpalmer/atoms/math';
import {clamp} from '@oscarpalmer/atoms/number';
import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute, setAttributes} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {dispatch, getEventPosition, on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import type {EventPosition, RemovableEventListener} from '@oscarpalmer/toretto/models';
import {setProperty} from '@oscarpalmer/toretto/property';
import {toggleStyles} from '@oscarpalmer/toretto/style';
import supportsTouch from '@oscarpalmer/toretto/touch';
import {createEmbeddedFloatable, type OuiFloatable} from './floatable/floatable.embedded';
import {
	getLocalization,
	getLocalizations,
	localize,
	OuiLocalizations,
	updateLocalizations,
} from './l10n';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[TAGNAME]: OuiColorPickerElement;
	}
}

type ColorValueType = 'hex' | 'hexa' | 'hsl' | 'hsla' | 'hwb' | 'hwba' | 'rgb' | 'rgba';

type CreateParameters = {
	alpha: boolean;
	color: Color;
	id: string;
	inline: boolean;
	input: HTMLInputElement;
	output: OuiColorPickerOutput;
};

type MoveParameters = {
	rectangle: DOMRect;
	state: OuiColorPickerState;
	value: string;
};

type OuiColorPickerAnchor = {
	button?: HTMLButtonElement;
	container: HTMLDivElement;
	input: HTMLInputElement;
};

type OuiColorPickerColor = {
	foreground: string;
	value: Color;
};

type OuiColorPickerContent = {
	element: HTMLDivElement;
	hue: OuiColorPickerContentHue;
	opacity?: OuiColorPickerContentOpacity;
	well: OuiColorPickerContentWell;
};

type OuiColorPickerContentHue = {
	container: HTMLDivElement;
	input: HTMLInputElement;
	label: HTMLLabelElement;
	knob: HTMLSpanElement;
	track: HTMLDivElement;
};

type OuiColorPickerContentOpacity = {
	container: HTMLDivElement;
	input: HTMLInputElement;
	label: HTMLLabelElement;
};

type OuiColorPickerContentWell = {
	element: HTMLDivElement;
	knob: HTMLSpanElement;
	label: HTMLSpanElement;
};

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
			setDisabled(this.#state, 'disabled', value);
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
		setValue(this.#state, value, 'hex');
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
		setValue(this.#state, value, 'hexa');
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
		setValue(this.#state, value, 'hsl');
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
		setValue(this.#state, value, 'hsla');
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
		setValue(this.#state, value, 'hwb');
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
		setValue(this.#state, value, 'hwba');
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
			setDisabled(this.#state, 'readonly', value);
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
			setRequired(this.#state, value);
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
		setValue(this.#state, value, 'rgb');
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
		setValue(this.#state, value, 'rgba');
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

			onInput(this.#state);
		} else {
			setValue(this.#state, value);
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
			attach(this.#state);
		}
	}

	disconnectedCallback(): void {
		if (this.#state != null) {
			detach(this.#state);
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
			localizations,
			this.#state.localizations.component,
			first,
			second,
		);
	}

	#initialize(): void {
		this.#state = initialize(this, this.#internals);

		if (this.#restored != null) {
			this.value = this.#restored;

			this.#restored = undefined;
		}
	}
}

export class OuiColorPickerEvent extends Event {
	readonly value: OuiColorPickerEventValue;
	constructor(
		type: 'oui:change' | 'oui:input',
		color: Color,
		readonly valid: boolean,
	) {
		super(type, {
			bubbles: true,
			cancelable: true,
		});

		this.value = {
			hex: color.hex,
			hexa: color.hexa,
			hsl: color.hsl,
			hsla: color.hsla,
			hwb: color.hwb,
			hwba: color.hwba,
			rgb: color.rgb,
			rgba: color.rgba,
		};
	}
}

type OuiColorPickerEventValue = {
	hex: string;
	hexa: string;
	hsl: HSLColor;
	hsla: HSLAColor;
	hwb: HWBColor;
	hwba: HWBAColor;
	rgb: RGBColor;
	rgba: RGBAColor;
};

type OuiColorPickerLabel = {
	element: HTMLLabelElement;
	id: string;
};

type OuiColorPickerLocalizations = {
	hue: string;
	invalid: string;
	lightnessSaturationLabel: string;
	lightnessSaturationValue: string | ((lightness: number, saturation: number) => string);
	opacity: string;
	toggle: string;
};

type OuiColorPickerOutput = 'all' | 'none' | OuiColorPickerOutputColor;

type OuiColorPickerOutputColor = 'hsl' | 'hwb' | 'rgb';

type OuiColorPickerState = {
	alpha: boolean;
	anchor: OuiColorPickerAnchor;
	color: OuiColorPickerColor;
	content: OuiColorPickerContent;
	disabled: boolean;
	floatable?: OuiFloatable;
	host: OuiColorPickerElement;
	id: string;
	inline: boolean;
	input: HTMLInputElement;
	internals: ElementInternals;
	label: OuiColorPickerLabel;
	listeners: RemovableEventListener[];
	localizations: OuiColorPickerStateLocalizations;
	output: OuiColorPickerOutput;
	readonly: boolean;
	required: boolean;
	style: HTMLStyleElement;
	value: OuiColorPickerValue;
};

type OuiColorPickerStateLocalizations = {
	component: Record<string, Partial<OuiColorPickerLocalizations>>;
	global: OuiLocalizations<OuiColorPickerLocalizations>;
};

type OuiColorPickerValue = {
	current: string;
	initial: string;
};

// #endregion

// #region Functions

function attach(state: OuiColorPickerState): void {
	const {anchor, content, host, id, inline, input, label, listeners, style} = state;

	if (!inline) {
		state.floatable = createEmbeddedFloatable(
			anchor.container ?? anchor.container,
			content.element,
			{
				position: 'below-start',
				reusable: false,
			},
		);

		state.floatable.update();
	}

	const labelId = `${id}_label`;

	setAria(host, {
		describedby: getAria(input, 'describedby'),
		labelledby: labelId,
	});

	setAttributes(host, {
		name: input.name === '' ? input.id : input.name,
	});

	label.element.htmlFor = anchor.input.id;
	label.element.id = labelId;

	if (anchor.button != null) {
		setAria(anchor.button, 'expanded', false);
	}

	input.before(style, anchor.container, content.element);

	input.remove();

	listeners.push(
		on(host, 'focusout', () => {
			setTimeout(() => {
				if (moved == null && !host.contains(document.activeElement)) {
					state.floatable?.hide();
				}
			});
		}),
		on(anchor.input, 'change', () => {
			onInput(state);
		}),
		on(anchor.input, 'input', () => {
			onInput(state);
		}),
		on(
			content.element,
			'beforetoggle',
			event => {
				if (state.disabled) {
					event.preventDefault();
				}
			},
			{
				passive: false,
			},
		),
		on(content.element, 'toggle', event => {
			const open = event.newState === 'open';

			if (anchor.button != null) {
				setAria(anchor.button, 'expanded', open);
			}

			if (open) {
				content.well.knob.focus();
			}
		}),
		on(content.hue.input, 'input', () => {
			onHue(state);
		}),
	);

	if (content.opacity != null) {
		listeners.push(
			on(content.opacity.input, 'input', () => {
				onOpacity(state);
			}),
		);
	}

	instances.set(host, state);
	states.add(state);
}

function cancelMove(parameters: MoveParameters): void {
	parameters.state.color.value.hexa = parameters.value;

	setValues(parameters.state, true);

	moved = undefined;

	styleToggler.remove();
}

function createAnchor(parameters: CreateParameters): OuiColorPickerAnchor {
	const {alpha, color, id, inline} = parameters;

	const container = createElement('div', {
		attribute: {
			[`${TAGNAME}-anchor`]: '',
		},
	});

	const input = createElement('input', {
		attribute: {
			[`${TAGNAME}-input`]: '',
			autocomplete: 'off',
			autocorrect: 'off',
			form: '',
			inputmode: 'text',
			placeholder: parameters.input.placeholder,
			spellcheck: 'false',
		},
		property: {
			id,
			type: 'text',
			value: alpha ? color.hexa : color.hex,
		},
	});

	let button: HTMLButtonElement | undefined;

	if (!inline) {
		button = createElement('button', {
			aria: {
				label: '',
			},
			attribute: {
				[`${TAGNAME}-button`]: '',
				popovertarget: `${id}_content`,
			},
			property: {
				type: 'button',
			},
		});
	}

	container.append(input);

	if (button != null) {
		container.append(button);
	}

	return {
		button,
		container,
		input,
	};
}

function createContent(parameters: CreateParameters): OuiColorPickerContent {
	const {id, inline} = parameters;

	const element = createElement('div', {
		attribute: {
			[`${TAGNAME}-content`]: '',
			popover: inline ? undefined : '',
		},
		property: {
			id: `${id}_content`,
		},
	});

	const hue = createHue(parameters);
	const opacity = createOpacity(parameters);
	const well = createWell(parameters);

	element.append(well.element, hue.container);

	if (opacity != null) {
		element.append(opacity.container);
	}

	return {
		element,
		hue,
		opacity,
		well,
	};
}

function createHue(parameters: CreateParameters): OuiColorPickerContentHue {
	const {color, id} = parameters;

	const container = createElement('div', {
		attribute: {
			[`${TAGNAME}-hue`]: '',
		},
	});

	const label = createElement('label', {
		attribute: {
			[`${TAGNAME}-hue-label`]: '',
		},
		property: {
			htmlFor: `${id}_hue`,
			id: `${id}_hue_label`,
		},
	});

	const input = createElement('input', {
		aria: {
			labelledby: `${id}_label ${label.id}`,
		},
		attribute: {
			[`${TAGNAME}-hue-input`]: '',
			form: '',
			inputmode: 'numeric',
			max: 360,
			min: 0,
		},
		property: {
			id: `${id}_hue`,
			type: 'range',
			value: color.hsl.hue.toString(),
		},
	});

	const knob = createElement('span', {
		aria: {
			hidden: true,
		},
		attribute: {
			[`${TAGNAME}-hue-knob`]: '',
		},
	});

	const track = createElement('div', {
		aria: {
			hidden: true,
		},
		attribute: {
			[`${TAGNAME}-hue-track`]: '',
		},
	});

	track.append(knob);

	container.append(label, input, track);

	return {
		container,
		input,
		knob,
		label,
		track,
	};
}

function createOpacity(parameters: CreateParameters): OuiColorPickerContentOpacity | undefined {
	const {alpha, color, id} = parameters;

	if (!alpha) {
		return;
	}

	const container = createElement('div', {
		attribute: {
			[`${TAGNAME}-opacity`]: '',
		},
	});

	const label = createElement('label', {
		attribute: {
			[`${TAGNAME}-opacity-label`]: '',
		},
		property: {
			htmlFor: `${id}_opacity`,
			id: `${id}_opacity_label`,
		},
	});

	const input = createElement('input', {
		aria: {
			labelledby: `${id}_label ${label.id}`,
		},
		attribute: {
			[`${TAGNAME}-opacity-input`]: '',
			form: '',
			max: 100,
			min: 0,
		},
		property: {
			id: `${id}_opacity`,
			type: 'range',
			value: color.alpha.toString(),
		},
	});

	const knob = createElement('span', {
		aria: {
			hidden: true,
		},
		attribute: {
			[`${TAGNAME}-opacity-knob`]: '',
		},
	});

	const track = createElement('div', {
		aria: {
			hidden: true,
		},
		attribute: {
			[`${TAGNAME}-opacity-track`]: '',
		},
	});

	track.append(knob);

	container.append(label, input, track);

	return {
		container,
		input,
		label,
	};
}

function createWell(parameters: CreateParameters): OuiColorPickerContentWell {
	const {id} = parameters;

	const element = createElement('div', {
		attribute: {
			[ATTRIBUTE_WELL]: '',
		},
	});

	const label = createElement('span', {
		property: {
			id: `${id}_well_label`,
			hidden: true,
		},
	});

	const knob = createElement('span', {
		aria: {
			labelledby: `${id}_label ${label.id}`,
		},
		attribute: {
			[ATTRIBUTE_WELL_KNOB]: '',
		},
		property: {
			role: 'slider',
			tabIndex: 0,
		},
	});

	element.append(label, knob);

	return {
		element,
		knob,
		label,
	};
}

function detach(state: OuiColorPickerState): void {
	const {anchor, content, floatable, host, input, label, style} = state;

	floatable?.destroy();

	setAria(host, {
		describedby: undefined,
		labelledby: undefined,
	});

	setAttributes(host, {
		name: undefined,
	});

	label.element.htmlFor = input.id;
	label.element.id = label.id;

	anchor.container.before(input);

	anchor.container.remove();
	content.element.remove();
	style.remove();

	const listeners = state.listeners.splice(0);
	const {length} = listeners;

	for (let index = 0; index < length; index += 1) {
		listeners[index]();
	}

	instances.set(host, state);
	states.add(state);
}

function getId(): string {
	index += 1;

	return `oui_color_picker_${index}`;
}

function getOutput(element: OuiColorPickerElement): OuiColorPickerOutput {
	const attribute = getAttribute(element, 'output');

	return OUTPUTS.has(attribute as OuiColorPickerOutput)
		? (attribute as OuiColorPickerOutput)
		: 'none';
}

function getValueType(state: OuiColorPickerState, value: unknown): ColorValueType | undefined {
	switch (true) {
		case isHexColor(value, state.alpha):
			return state.alpha ? 'hexa' : 'hex';

		case isHslColor(value):
			return 'hsl';

		case isHslaColor(value):
			return 'hsla';

		case isHwbColor(value):
			return 'hwb';

		case isHwbaColor(value):
			return 'hwba';

		case isRgbColor(value):
			return 'rgb';

		case isRgbaColor(value):
			return 'rgba';

		default:
			break;
	}
}

function initialize(
	element: OuiColorPickerElement,
	internals: ElementInternals,
): OuiColorPickerState {
	const input = element.querySelector('input');

	if (input == null || !TYPES.has(input.type)) {
		throw new Error(MESSAGE_INPUT);
	}

	const label = element.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement | null;

	if (label == null) {
		throw new Error(MESSAGE_LABEL);
	}

	element.id = input.id;

	const id = getId();

	const labelId = label.id;

	const alpha = element.hasAttribute('alpha');
	const color = getColor(input.value);
	const disabled = element.hasAttribute('disabled') || input.disabled;
	const inline = element.hasAttribute('inline');
	const output = getOutput(element);
	const readonly = element.hasAttribute('readonly') || input.readOnly;
	const required = element.hasAttribute('required') || input.required;

	const parameters: CreateParameters = {
		alpha,
		color,
		id,
		inline,
		input,
		output,
	};

	const anchor = createAnchor(parameters);
	const content = createContent(parameters);

	const formatted = color.toHexString(alpha);

	const state: OuiColorPickerState = {
		alpha,
		anchor,
		content,
		disabled,
		id,
		inline,
		input,
		internals,
		output,
		readonly,
		required,
		color: {
			foreground: '',
			value: color,
		},
		host: element,
		label: {
			element: label,
			id: labelId,
		},
		listeners: [],
		localizations: {
			component: {},
			global: localizations,
		},
		style: createElement('style'),
		value: {
			current: formatted,
			initial: formatted,
		},
	};

	attach(state);

	setAttributes(element, {
		output,
		alpha: alpha ? '' : undefined,
		inline: inline ? '' : undefined,
	});

	setDisabled(state, 'disabled', disabled);
	setDisabled(state, 'readonly', readonly);
	setRequired(state, required);

	setValues(state, false);

	updateLabels(state);
	updateValidity(state, isHexColor(state.value.current, alpha));

	return state;
}

function onEnter(state: OuiColorPickerState): void {
	const {alpha, anchor, color, internals} = state;

	const input = anchor.input.value.replace(EXPRESSION_HEX_PREFIX, '');

	const short = alpha ? input.length === 4 : input.length === 3;

	const valid = isHexColor(input, alpha) && short;

	if (valid) {
		anchor.input.value = color.value.toHexString(alpha);
	}

	internals.form?.requestSubmit();
}

function onHue(state: OuiColorPickerState): void {
	const hue = state.content.hue.input.valueAsNumber;

	state.color.value.hsla = {
		...state.color.value.hsla,
		hue,
	};

	setValues(state, false);
}

function onInput(state: OuiColorPickerState): void {
	const {alpha, anchor, color, host} = state;

	const value = anchor.input.value.replace(EXPRESSION_HEX_PREFIX, '');

	if (value.toLowerCase() === (alpha ? color.value.hexa : color.value.hex).toLowerCase()) {
		return;
	}

	state.value.current = anchor.input.value;

	const {length} = value;

	let valid: boolean;

	if (alpha) {
		valid = isHexColor(value, true) && (length === 4 || length === 8);
	} else {
		valid = isHexColor(value) && (length === 3 || length === 6);
	}

	if (valid) {
		if (length === 3 || length === 6) {
			color.value.hex = value;
		} else {
			color.value.hexa = value;
		}
	}

	setValues(state, false, anchor.input.value);

	dispatch(host, new OuiColorPickerEvent('oui:input', color.value, valid));
}

function onKeydown(event: KeyboardEvent): void {
	if (moved != null && event.key === 'Escape') {
		cancelMove(moved);

		return;
	}

	const knob = findAncestor(event, SELECTOR_WELL_KNOB);

	if (
		!(
			(event.key === 'Enter' && findAncestor(event, SELECTOR_INPUT) != null) ||
			(KEYS.has(event.key) && knob != null)
		)
	) {
		return;
	}

	const state = instances.get(findAncestor(event, TAGNAME)!);

	if (state == null || state.disabled || state.readonly) {
		return;
	}

	event.preventDefault();

	if (event.key === 'Enter') {
		onEnter(state);

		return;
	}

	if (knob == null) {
		return;
	}

	const modifier = event.shiftKey ? 10 : 1;

	let {lightness, saturation} = state.color.value.hsl;

	switch (event.key) {
		case 'ArrowDown':
			lightness -= 1 * modifier;
			break;

		case 'ArrowLeft':
			saturation -= 1 * modifier;
			break;

		case 'ArrowRight':
			saturation += 1 * modifier;
			break;

		case 'ArrowUp':
			lightness += 1 * modifier;
			break;

		case 'End':
			lightness = 0;
			break;

		case 'Home':
			lightness = 100;
			break;

		case 'PageDown':
			lightness -= 10;
			break;

		case 'PageUp':
			lightness += 10;
			break;
	}

	state.color.value.hsl = {
		...state.color.value.hsl,
		lightness: clamp(lightness, 0, 100),
		saturation: clamp(saturation, 0, 100),
	};

	setValues(state, false);
}

function onOpacity(state: OuiColorPickerState): void {
	const opacity = state.content.opacity?.input.valueAsNumber;

	if (opacity == null) {
		return;
	}

	state.color.value.alpha = opacity;

	setValues(state, false);
}

function onPointerdown(event: MouseEvent | TouchEvent): void {
	if (
		event.altKey ||
		event.ctrlKey ||
		event.metaKey ||
		event.shiftKey ||
		(supportsTouch.value
			? event.type === 'mousedown'
			: event.type === 'touchstart' || (event as MouseEvent).button !== 0)
	) {
		return;
	}

	const well = findAncestor(event, SELECTOR_WELL);

	if (well == null) {
		return;
	}

	const element = findAncestor(event, TAGNAME);

	if (element == null) {
		return;
	}

	if (supportsTouch.value) {
		event.preventDefault();
	}

	const position = getEventPosition(event);

	if (position == null) {
		return;
	}

	const state = instances.get(element);

	if (state == null || state.disabled || state.readonly) {
		return;
	}

	moved = {
		state,
		rectangle: well.getBoundingClientRect(),
		value: state.color.value.hexa,
	};

	styleToggler.set();
}

function onPointermove(event: MouseEvent | TouchEvent): void {
	if (moved == null) {
		return;
	}

	const position = getEventPosition(event);

	if (position != null) {
		updateValues(moved, position);
	}
}

function onPointerup(event: MouseEvent | TouchEvent): void {
	if (moved == null) {
		return;
	}

	const position = getEventPosition(event);

	if (position != null) {
		updateValues(moved, position);
	}

	moved = undefined;

	styleToggler.remove();
}

/**
 * Set localizations for a specific language
 *
 * @param language Language code
 * @param localizations Localizations for language
 */
export function setColorPickerLocalizations(
	language: string,
	localizations: Partial<OuiColorPickerLocalizations>,
): void;

/**
 * Set localizations for one or more languages
 *
 * @param localizations Localizations for one or more languages
 */
export function setColorPickerLocalizations(
	localizations: Record<string, Partial<OuiColorPickerLocalizations>>,
): void;

export function setColorPickerLocalizations(
	first: string | Record<string, Partial<OuiColorPickerLocalizations>>,
	second?: Partial<OuiColorPickerLocalizations>,
): void {
	updateColorPickerLocalizations(localizations, localizations.values, first, second);
}

function setDisabled(
	state: OuiColorPickerState,
	type: 'disabled' | 'readonly',
	value: boolean,
): void {
	state[type] = value;

	setAria(state.host, type, value);

	state.anchor.input.readOnly = value;

	setAria(state.anchor.input, type, value);
	setProperty(state.content.hue.input, 'disabled', state.disabled || state.readonly);

	if (state.anchor.button != null) {
		setAria(state.anchor.button, 'disabled', state.disabled);
	}

	if (state.content.opacity != null) {
		setProperty(state.content.opacity.input, 'disabled', state.disabled || state.readonly);
	}
}

function setRequired(state: OuiColorPickerState, value: boolean): void {
	state.required = value;

	setAria(state.host, 'required', value);
	setAria(state.anchor.input, 'required', value);

	updateValidity(state, isHexColor(state.value.current, state.alpha));
}

function setValue<Type extends ColorValueType>(
	state: OuiColorPickerState,
	value: unknown,
	type?: Type,
): void {
	if (state == null) {
		return;
	}

	const actual = type ?? getValueType(state, value);

	if (actual == null || (type != null && type !== actual)) {
		return;
	}

	state.color.value[actual] = value as never;

	setValues(state, true);
}

function setValues(state: OuiColorPickerState, focus: boolean, input?: string): void {
	const {anchor, color, content, host, style} = state;

	color.foreground = getForegroundColor(color.value).hex;

	const {alpha, hex, hsl, rgb} = color.value;
	const {hue, lightness, saturation} = hsl;
	const {blue, green, red} = rgb;

	const value = input ?? color.value.toHexString(state.alpha);

	anchor.input.value = value;
	content.hue.input.valueAsNumber = hue;

	if (content.opacity != null) {
		content.opacity.input.valueAsNumber = alpha;
	}

	state.value.current = value;

	style.textContent = `#${host.id} {
	--oui-color-picker-alpha: ${alpha};
	--oui-color-picker-blue: ${blue};
	--oui-color-picker-green: ${green};
	--oui-color-picker-foreground: #${color.foreground};
	--oui-color-picker-hex: #${hex};
	--oui-color-picker-hue: ${hue};
	--oui-color-picker-lightness: ${lightness};
	--oui-color-picker-red: ${red};
	--oui-color-picker-saturation: ${saturation};
}`;

	updateForm(state, isHexColor(state.value.current, state.alpha));
	updateWell(state);

	if (focus) {
		content.well.knob.focus();
	}
}

function updateForm(state: OuiColorPickerState, valid: boolean): void {
	const {color, host, internals, value} = state;

	internals.setFormValue(valid ? value.current : '');

	updateValidity(state, valid);

	dispatch(host, new OuiColorPickerEvent('oui:change', color.value, valid));
}

function updateLabels(state: OuiColorPickerState): void {
	const {anchor, content, host, localizations} = state;
	const {component, global} = localizations;

	if (anchor.button != null) {
		setAria(
			anchor.button,
			'label',
			localize(getLocalization(global, host, 'toggle', component), {}, []),
		);
	}

	content.hue.label.textContent = localize(getLocalization(global, host, 'hue', component), {}, []);

	content.well.label.textContent = localize(
		getLocalization(global, host, 'lightnessSaturationLabel', component),
		{},
		[],
	);

	updateWell(state);

	if (content.opacity != null) {
		content.opacity.label.textContent = localize(
			getLocalization(global, host, 'opacity', component),
			{},
			[],
		);
	}
}

function updateColorPickerLocalizations(
	instance: OuiLocalizations<OuiColorPickerLocalizations>,
	destination: Record<string, Partial<OuiColorPickerLocalizations>>,
	first: string | Record<string, Partial<OuiColorPickerLocalizations>>,
	second?: Partial<OuiColorPickerLocalizations>,
): void {
	updateLocalizations(
		instance,
		typeof first === 'string'
			? {
					[first]: second!,
				}
			: first,
		destination,
		() => {
			for (const state of states) {
				updateLabels(state);
			}
		},
	);
}

function updateValidity(state: OuiColorPickerState, valid: boolean): void {
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

function updateValues(parameters: MoveParameters, position: EventPosition): void {
	const {rectangle, state} = parameters;
	const {x, y} = position;

	const top = clamp((y - rectangle.top) / rectangle.height, 0, 1);
	const left = clamp((x - rectangle.left) / rectangle.width, 0, 1);

	state.color.value.hsl = {
		...state.color.value.hsl,
		lightness: (1 - top) * 100,
		saturation: left * 100,
	};

	setValues(state, true);
}

function updateWell(state: OuiColorPickerState): void {
	const {color, content, host, localizations} = state;
	const {component, global} = localizations;
	const {lightness, saturation} = color.value.hsl;

	setAria(
		content.well.knob,
		'valuetext',
		localize(
			getLocalization(global, host, 'lightnessSaturationValue', component),
			{
				lightness,
				saturation,
			},
			[lightness, saturation],
		),
	);
}

// #endregion

// #region Variables

const TAGNAME = 'oui-color-picker';

const ATTRIBUTE_INPUT = `${TAGNAME}-input`;

const ATTRIBUTE_WELL = `${TAGNAME}-well`;

const ATTRIBUTE_WELL_KNOB = `${TAGNAME}-well-knob`;

const EXPRESSION_HEX_PREFIX = /^#/;

const KEYS = new Set([
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowUp',
	'End',
	'Home',
	'PageDown',
	'PageUp',
]);

const MESSAGE_INPUT = `<${TAGNAME}> must contain a valid <input> element`;

const MESSAGE_LABEL = `<${TAGNAME}> must contain a <label> element for the <input> element`;

const OUTPUTS = new Set<OuiColorPickerOutput>(['all', 'none', 'hsl', 'rgb']);

const SELECTOR_INPUT = `[${ATTRIBUTE_INPUT}]`;

const SELECTOR_WELL = `[${ATTRIBUTE_WELL}]`;

const SELECTOR_WELL_KNOB = `[${ATTRIBUTE_WELL_KNOB}]`;

const TYPES = new Set(['color', 'text']);

const instances = new WeakMap<OuiColorPickerElement, OuiColorPickerState>();

const localizations = getLocalizations<OuiColorPickerLocalizations>({
	hue: 'Hue',
	invalid: 'Please enter or select a color',
	lightnessSaturationLabel: 'Lightness and saturation',
	lightnessSaturationValue: (lightness: number, saturation: number) =>
		`Lightness: ${round(lightness, 1)}%, saturation: ${round(saturation, 1)}%`,
	opacity: 'Opacity',
	toggle: 'Toggle color picker',
});

const states = new Set<OuiColorPickerState>();

const styles = {
	touchAction: 'none',
	userSelect: 'none',
	webkitUserSelect: 'none',
};

const styleToggler = toggleStyles(document.body, styles);

let index = 0;

let moved: MoveParameters | undefined;

// #endregion

// #region Initialization

on(document, 'keydown', onKeydown, {passive: false});
on(document, 'mousedown', onPointerdown);
on(document, 'pointermove', onPointermove);
on(document, 'pointerup', onPointerup);
on(document, 'touchcancel', onPointerup);
on(document, 'touchstart', onPointerdown, {passive: false});

customElements.define(TAGNAME, OuiColorPickerElement);

// #endregion
