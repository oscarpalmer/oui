import type {
	Color,
	HSLAColor,
	HSLColor,
	HWBAColor,
	HWBColor,
	RGBAColor,
	RGBColor,
} from '@oscarpalmer/atoms/color';
import type {RemovableEventListener} from '@oscarpalmer/toretto';
import type {OuiFloatable} from '../floatable/floatable.embedded';
import type {OuiLocalizations} from '../l10n';
import type {OuiColorPickerElement} from './index';

// #region Types

export type OuiColorPickerAnchor = {
	button?: HTMLButtonElement;
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
};

export type OuiColorPickerContentWell = {
	element: HTMLDivElement;
	knob: HTMLSpanElement;
	label: HTMLSpanElement;
};

export type OuiColorPickerCreateParameters = {
	alpha: boolean;
	color: Color;
	id: string;
	inline: boolean;
	input: HTMLInputElement;
	output: OuiColorPickerOutput;
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

type OuiColorPickerEventType = 'oui:change' | 'oui:input';

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
	hue: string;
	invalid: string;
	lightnessSaturationLabel: string;
	lightnessSaturationValue: string | ((lightness: number, saturation: number) => string);
	opacity: string;
	toggle: string;
};

export type OuiColorPickerMovement = {
	parameters?: OuiColorPickerMovementParameters;
};

export type OuiColorPickerMovementParameters = {
	rectangle: DOMRect;
	state: OuiColorPickerState;
	value: string;
};

export type OuiColorPickerOutput = 'all' | 'none' | OuiColorPickerOutputColor;

export type OuiColorPickerOutputColor = 'hsl' | 'hwb' | 'rgb';

export type OuiColorPickerState = {
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

export type OuiColorPickerStateLocalizations = {
	component: Record<string, Partial<OuiColorPickerLocalizations>>;
	global: OuiLocalizations<OuiColorPickerLocalizations>;
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
