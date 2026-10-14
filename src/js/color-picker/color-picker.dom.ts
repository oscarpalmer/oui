import {createElement} from '@oscarpalmer/toretto/create';
import {
	COLOR_PICKER_ATTRIBUTE_COPY,
	COLOR_PICKER_ATTRIBUTE_WELL,
	COLOR_PICKER_ATTRIBUTE_WELL_KNOB,
	COLOR_PICKER_TAGNAME,
	colorPickerLocalizations,
} from './color-picker.constants';
import type {
	OuiColorPickerAnchor,
	OuiColorPickerContent,
	OuiColorPickerContentHue,
	OuiColorPickerContentOpacity,
	OuiColorPickerContentOutput,
	OuiColorPickerContentWell,
	OuiColorPickerCopy,
	OuiColorPickerCreateParameters,
} from './color-picker.model';
import {createColorPickerOutput} from './color-picker.output';

// #region Functions

export function createColorPickerAnchor(
	parameters: OuiColorPickerCreateParameters,
): OuiColorPickerAnchor {
	const {alpha, color, id, inline} = parameters;

	const container = createElement('div', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-anchor`]: '',
		},
	});

	const input = createElement('input', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-input`]: '',
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

	let toggle: HTMLButtonElement | undefined;

	if (!inline) {
		toggle = createElement('button', {
			aria: {
				label: '',
			},
			attribute: {
				[`${COLOR_PICKER_TAGNAME}-toggle`]: '',
				popovertarget: `${id}_content`,
			},
			property: {
				type: 'button',
			},
		});
	}

	let copy: OuiColorPickerCopy | undefined;

	if (parameters.copy) {
		copy = createColorPickerCopy(parameters, 'hex');
	}

	container.append(input);

	if (toggle != null) {
		container.append(toggle);
	}

	if (copy != null) {
		container.append(copy.button);
	}

	return {
		container,
		copy,
		input,
		toggle,
	};
}

export function createColorPickerContent(
	parameters: OuiColorPickerCreateParameters,
): OuiColorPickerContent {
	const {id, inline} = parameters;

	const element = createElement('div', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-content`]: '',
			popover: inline ? undefined : '',
		},
		property: {
			id: `${id}_content`,
		},
	});

	const hue = createColorPickerHue(parameters);
	const opacity = createColorPickerOpacity(parameters);
	const well = createColorPickerWell(parameters);

	let output: OuiColorPickerContentOutput | undefined;

	element.append(well.element, hue.container);

	if (opacity != null) {
		element.append(opacity.container);
	}

	if (parameters.output !== 'none') {
		output = createColorPickerOutput(parameters, createColorPickerCopy(parameters));

		if (output != null) {
			element.append(output.container);
		}
	}

	return {
		element,
		hue,
		opacity,
		output,
		well,
	};
}

function createColorPickerCopy(
	parameters: OuiColorPickerCreateParameters,
	color?: string,
): OuiColorPickerCopy | undefined {
	if (!parameters.copy) {
		return;
	}

	return {
		button: createElement('button', {
			attribute: {
				[COLOR_PICKER_ATTRIBUTE_COPY]: '',
			},
			aria: {
				label: colorPickerLocalizations.defaults.copy,
			},
			data: {
				color,
			},
			property: {
				textContent: colorPickerLocalizations.defaults.copy,
				type: 'button',
			},
		}),
	};
}

export function createColorPickerHue(
	parameters: OuiColorPickerCreateParameters,
): OuiColorPickerContentHue {
	const {color, id} = parameters;

	const container = createElement('div', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-hue`]: '',
		},
	});

	const label = createElement('label', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-hue-label`]: '',
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
			[`${COLOR_PICKER_TAGNAME}-hue-input`]: '',
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
			[`${COLOR_PICKER_TAGNAME}-hue-knob`]: '',
		},
	});

	const track = createElement('div', {
		aria: {
			hidden: true,
		},
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-hue-track`]: '',
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

export function createColorPickerOpacity(
	parameters: OuiColorPickerCreateParameters,
): OuiColorPickerContentOpacity | undefined {
	const {alpha, color, id} = parameters;

	if (!alpha) {
		return;
	}

	const container = createElement('div', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-opacity`]: '',
		},
	});

	const label = createElement('label', {
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-opacity-label`]: '',
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
			[`${COLOR_PICKER_TAGNAME}-opacity-input`]: '',
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
			[`${COLOR_PICKER_TAGNAME}-opacity-knob`]: '',
		},
	});

	const track = createElement('div', {
		aria: {
			hidden: true,
		},
		attribute: {
			[`${COLOR_PICKER_TAGNAME}-opacity-track`]: '',
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

export function createColorPickerWell(
	parameters: OuiColorPickerCreateParameters,
): OuiColorPickerContentWell {
	const {id} = parameters;

	const element = createElement('div', {
		attribute: {
			[COLOR_PICKER_ATTRIBUTE_WELL]: '',
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
			[COLOR_PICKER_ATTRIBUTE_WELL_KNOB]: '',
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

// #endregion
