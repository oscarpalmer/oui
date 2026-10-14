import {noop} from '@oscarpalmer/atoms/function';
import {attempt} from '@oscarpalmer/atoms/result';
import {getAria} from '@oscarpalmer/toretto/aria';
import {getAttribute} from '@oscarpalmer/toretto/attribute';
import type {AnyAriaBooleanAttribute} from '@oscarpalmer/toretto/models';

// #region Functions

export function copyValue(value: string, onSuccess?: () => void, onError?: () => void): void {
	const result = attempt(() =>
		navigator.clipboard.writeText(value).then(onSuccess ?? noop, onError ?? noop),
	);

	if (!result.ok) {
		onError?.();
	}
}

export function getAttributeValue<Value>(
	element: HTMLElement,
	attribute: string,
	possible: Set<Value>,
	defaultValue: Value,
): Value {
	const value = getAttribute(element, attribute);

	return possible.has(value as Value) ? (value as Value) : defaultValue;
}

export function getBooleanAriaValue(
	element: HTMLElement,
	attribute: AnyAriaBooleanAttribute,
): boolean {
	const value = getAria(element, attribute);

	return value === true || value === 'true';
}

// #endregion

// #region Variables

export const EXPRESSION_WHITESPACE: RegExp = /\s+/;

// #endregion
