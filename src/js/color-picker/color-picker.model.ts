import type {
	Color,
	HSLAColor,
	HSLColor,
	HWBAColor,
	HWBColor,
	RGBAColor,
	RGBColor,
} from '@oscarpalmer/atoms/color';
import type {RemovableEventListener} from '@oscarpalmer/toretto/models';
import type {OuiFloatable} from '../floatable/floatable.model';
import type {OuiLocalizations} from '../internal/l10n/l10n.model';
import type {COLOR_PICKER_SYMBOL} from './color-picker.constants';

// #region Types

export type GenericOuiColorPickerElement = {
	[COLOR_PICKER_SYMBOL]: OuiColorPickerState;
	get value(): string;
	set value(value: string);
} & HTMLElement;

export type OuiColorPickerAnchor = {
	copy?: OuiColorPickerCopy;
	toggle?: HTMLButtonElement;
	container: HTMLDivElement;
	input: HTMLInputElement;
};

export type OuiColorPickerColor = {
	foreground: string;
	value: Color;
};

export type OuiColorPickerContent = {
	element: HTMLDivElement;
	hue: OuiColorPickerContentHue;
	opacity?: OuiColorPickerContentOpacity;
	output?: OuiColorPickerContentOutput;
	well: OuiColorPickerContentWell;
};

export type OuiColorPickerContentHue = {
	container: HTMLDivElement;
	input: HTMLInputElement;
	label: HTMLLabelElement;
	knob: HTMLSpanElement;
	track: HTMLDivElement;
};

export type OuiColorPickerContentOpacity = {
	container: HTMLDivElement;
	input: HTMLInputElement;
	label: HTMLLabelElement;
	range: HTMLInputElement;
};

export type OuiColorPickerContentOutput = {
	container: HTMLDivElement;
	copy?: OuiColorPickerCopy;
	inputs: HTMLInputElement[];
	items: HTMLDivElement[];
	toggle?: HTMLSelectElement;
};

export type OuiColorPickerContentWell = {
	element: HTMLDivElement;
	knob: HTMLSpanElement;
	label: HTMLSpanElement;
};

export type OuiColorPickerCopy = {
	button: HTMLButtonElement;
	timer?: number;
};

export type OuiColorPickerCreateParameters = {
	alpha: boolean;
	color: Color;
	copy: boolean;
	id: string;
	inline: boolean;
	input: HTMLInputElement;
	output: OuiColorPickerOutputType;
};

export class OuiColorPickerEvent extends Event {
	readonly value: OuiColorPickerEventValue;

	constructor(
		type: OuiColorPickerEventType,
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

export type OuiColorPickerEventType = 'oui-color-picker:change' | 'oui-color-picker:input';

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

export type OuiColorPickerLocalizations = {
	blackness: string;
	blue: string;
	copy: string;
	green: string;
	hex: string;
	hsl: string;
	hue: string;
	hwb: string;
	invalid: string;
	lightness: string;
	opacity: string;
	output: string;
	red: string;
	rgb: string;
	saturation: string;
	toggle: string;
	wellLabel: string;
	wellValue: string | ((lightness: number, saturation: number) => string);
	whiteness: string;
};

export type OuiColorPickerMovement = {
	parameters?: OuiColorPickerMovementParameters;
};

export type OuiColorPickerMovementParameters = {
	rectangle: DOMRect;
	state: OuiColorPickerState;
	value: string;
};

export type OuiColorPickerOutputColor = 'hsl' | 'hwb' | 'rgb';

export type OuiColorPickerOutputColorProperty =
	| 'blackness'
	| 'blue'
	| 'green'
	| 'hue'
	| 'lightness'
	| 'red'
	| 'saturation'
	| 'whiteness';

export type OuiColorPickerOutputType = 'all' | 'none' | OuiColorPickerOutputColor;

export type OuiColorPickerState = {
	component: OuiColorPickerStateComponent;
	form: OuiColorPickerStateForm;
};

export type OuiColorPickerStateComponent = {
	alpha: boolean;
	anchor: OuiColorPickerAnchor;
	color: OuiColorPickerColor;
	copy: boolean;
	content: OuiColorPickerContent;
	disabled: boolean;
	floatable?: OuiFloatable;
	host: GenericOuiColorPickerElement;
	id: string;
	inline: boolean;
	input: HTMLInputElement;
	label: OuiColorPickerLabel;
	listeners: RemovableEventListener[];
	localizations: OuiLocalizations<OuiColorPickerLocalizations>;
	output: OuiColorPickerOutputType;
	readonly: boolean;
	required: boolean;
	style: HTMLStyleElement;
	value: OuiColorPickerValue;
};

type OuiColorPickerStateForm = {
	internals: ElementInternals;
	restored?: string;
};

type OuiColorPickerValue = {
	current: string;
	initial: string;
};

export type OuiColorPickerValueType =
	| 'hex'
	| 'hexa'
	| 'hsl'
	| 'hsla'
	| 'hwb'
	| 'hwba'
	| 'rgb'
	| 'rgba';

// #endregion
