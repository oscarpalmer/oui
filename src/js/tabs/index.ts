import {min} from '@oscarpalmer/atoms/math';
import {getNumber} from '@oscarpalmer/atoms/number';
import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {getNavigable, getNavigableOrientation} from '../internal/navigable/index';
import {NAVIGABLE_SYMBOL} from '../internal/navigable/navigable.model';
import {
	OuiTabsEvent,
	TABS_SYMBOL,
	type OuiTabsContent,
	type OuiTabsState,
	type OuiTabsTabList,
} from './tabs.model';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[TAGNAME]: OuiTabsElement;
	}
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging
export interface OuiTabsElement {
	[TABS_SYMBOL]: OuiTabsState;
}

export class OuiTabsElement extends HTMLElement {
	static readonly observedAttributes: string[] = ['active'];

	get active(): number {
		return this[TABS_SYMBOL].component?.active ?? 0;
	}

	set active(value: number) {
		setActive(this[TABS_SYMBOL], value);
	}

	get panel(): Element {
		return this[TABS_SYMBOL].component?.panels.elements[this.active];
	}

	get tab(): HTMLButtonElement {
		return this[TABS_SYMBOL].component?.tabList.tabs[this.active];
	}

	constructor() {
		super();

		this[TABS_SYMBOL] = {
			component: undefined as never,
		};
	}

	attributeChangedCallback(name: string, _: string | null, value: string | null): void {
		if (name === 'active') {
			setActive(this[TABS_SYMBOL], value);
		}
	}

	connectedCallback(): void {
		const state = this[TABS_SYMBOL];

		if (state.component == null) {
			initializeTabs(this, state);
		} else {
			attachTabs(state);
		}
	}

	disconnectedCallback(): void {
		const state = this[TABS_SYMBOL];

		if (state.component != null) {
			detachTabs(state);
		}
	}
}

// #endregion

// #region Functions

function attachTabs(state: OuiTabsState): void {
	const {component} = state;
	const {content, orientation, panels, tabList} = component;

	const navigable = getNavigable(tabList.element, {
		orientation,
		selector: SELECTOR_TAB,
		vertical: false,
		onActivate: navigable => {
			const index = tabList.tabs.indexOf(
				navigable[NAVIGABLE_SYMBOL].active.element as HTMLButtonElement,
			);

			if (index > -1 && index !== component.active) {
				onActivate(state, index);
			}
		},
	});

	component.navigable = navigable;

	const {length} = panels.elements;

	for (let index = 0; index < length; index += 1) {
		const panel = panels.elements[index];

		panel.hidden = index !== component.active;
		panel.role = 'tabpanel';

		if (index === 0) {
			panel.insertAdjacentElement('beforebegin', tabList.element);
			panel.insertAdjacentElement('beforebegin', content);
		}

		content.append(panel);
	}
}

function createContent(prefix: string, panels: HTMLElement[], active: number): OuiTabsContent {
	const content = createElement('div', {
		attribute: {
			[`${TAGNAME}-content`]: '',
		},
	});

	const {length} = panels;

	const hidden: Array<boolean | 'until-found'> = [];
	const roles: Array<string | null> = [];

	for (let index = 0; index < length; index += 1) {
		const panel = panels[index];

		hidden.push(panel.hidden);
		roles.push(panel.role);

		panel.hidden = index !== active;

		if (panel.id === '') {
			panel.id = `${prefix}_panel_${index}`;
		}
	}

	return {
		element: content,
		panels: {
			hidden,
			roles,
			elements: panels,
		},
	};
}

function createTab(
	prefix: string,
	index: number,
	panel: Element,
	label: string,
	selected: boolean,
): HTMLButtonElement {
	return createElement('button', {
		aria: {
			selected,
			controls: panel.id,
		},
		attribute: {
			[`${TAGNAME}-tab`]: '',
		},
		property: {
			id: `${prefix}_tab_${index}`,
			role: 'tab',
			tabIndex: selected ? 0 : -1,
			textContent: label,
			type: 'button',
		},
	});
}

function createTabList(
	prefix: string,
	panels: Element[],
	labels: string[],
	active: number,
): OuiTabsTabList {
	const element = createElement('div', {
		attribute: {
			[`${TAGNAME}-tablist`]: '',
		},
		property: {
			role: 'tablist',
		},
	});

	const {length} = panels;

	const tabs: HTMLButtonElement[] = [];

	for (let index = 0; index < length; index += 1) {
		const tab = createTab(prefix, index, panels[index], labels[index], index === active);

		element.append(tab);
		tabs.push(tab);
	}

	return {
		element,
		tabs,
	};
}

function detachTabs(state: OuiTabsState): void {
	const {content, navigable, panels, tabList} = state.component;

	navigable?.destroy();

	const {length} = panels.elements;

	for (let index = 0; index < length; index += 1) {
		const panel = panels.elements[index];

		panel.hidden = panels.hidden[index];
		panel.role = panels.roles[index];

		content.before(panel);
	}

	tabList.element.remove();
	content.remove();
}

function getActive(element: OuiTabsElement, max: number): number {
	const attribute = getAttribute(element, 'active');

	let index = 0;

	if (attribute != null) {
		const value = getNumber(attribute);

		if (!Number.isNaN(value) && value >= 0) {
			index = min([value, max]);
		}
	}

	return index;
}

function getId(): string {
	index += 1;

	return `oui_tabs_${index}`;
}

function getLabels(panels: Element[]): string[] | undefined {
	const labels: string[] = [];

	const {length} = panels;

	for (let index = 0; index < length; index += 1) {
		const panel = panels[index];

		const labelledBy = getAria(panel, 'labelledby');

		if (typeof labelledBy === 'string' && labelledBy.trim().length > 0) {
			const label: string[] = [];
			const selectors = labelledBy.split(/\s+/);

			for (const selector of selectors) {
				const element = document.getElementById(selector);

				if (element == null) {
					return;
				}

				label.push(element.textContent);
			}

			labels.push(label.join(' '));

			continue;
		}

		const label = getAria(panel, 'label');

		if (typeof label === 'string' && label.trim().length > 0) {
			labels.push(label);

			continue;
		}

		return;
	}

	return labels;
}

function initializeTabs(element: OuiTabsElement, state: OuiTabsState): void {
	const panels = [...element.querySelectorAll(SELECTOR_PANEL)] as HTMLElement[];

	if (panels.length === 0) {
		throw new Error(MESSAGE_EMPTY);
	}

	const labels = getLabels(panels);

	if (labels == null) {
		throw new Error(MESSAGE_INVALID);
	}

	let id: string;

	if (element.id === '') {
		id = getId();
	} else {
		id = element.id;
	}

	const active = getActive(element, panels.length - 1);
	const orientation = getNavigableOrientation(element, false, false);

	const content = createContent(id, panels, active);
	const tabList = createTabList(id, panels, labels, active);

	state.component = {
		active,
		id,
		orientation,
		tabList,
		content: content.element,
		host: element,
		panels: content.panels,
	};

	attachTabs(state);
}

function onActivate(state: OuiTabsState, next: number): void {
	const {component} = state;
	const {host, panels, tabList} = component;

	const current = component.active;

	const event = new OuiTabsEvent('oui:beforechange', current, next, true);

	host.dispatchEvent(event);

	if (event.defaultPrevented) {
		return;
	}

	component.active = next;

	const {length} = panels.elements;

	for (let index = 0; index < length; index += 1) {
		const panel = panels.elements[index];

		panel.hidden = index !== next;

		setAria(tabList.tabs[index], 'selected', index === next);
	}

	setAttribute(host, 'active', next);

	host.dispatchEvent(new OuiTabsEvent('oui:change', current, next, false));
}

function setActive(state: OuiTabsState, value: unknown): void {
	const {component} = state;

	if (component == null) {
		return;
	}

	const {active, host, navigable, panels} = component;

	const max = panels.elements.length - 1;

	let index: number | undefined;

	if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
		index = min([value, max]);
	} else if (typeof value === 'string') {
		const parsed = Number.parseInt(value, 10);

		if (!Number.isNaN(parsed) && parsed >= 0) {
			index = min([parsed, max]);
		}
	}

	if (index == null) {
		setAttribute(host, 'active', active);
	} else if (index !== active) {
		navigable?.navigate(index, false);

		onActivate(state, index);
	}
}

// #endregion

// #region Variables

const TAGNAME = 'oui-tabs';

const ATTRIBUTE_PANEL = `${TAGNAME}-panel`;

const MESSAGE_EMPTY = `<${TAGNAME}> must contain at least one [${ATTRIBUTE_PANEL}] child element`;

const MESSAGE_INVALID = `A [${ATTRIBUTE_PANEL}] child element of <${TAGNAME}> must have a valid 'aria-label' or 'aria-labelledby' attribute`;

const SELECTOR_PANEL = `:scope > [${ATTRIBUTE_PANEL}]`;

const SELECTOR_TAB = `[${TAGNAME}-tab]`;

let index = 0;

// #endregion

// #region Initialization

customElements.define(TAGNAME, OuiTabsElement);

// #endregion

// #region Exports

export {OuiTabsEvent};

// #endregion
