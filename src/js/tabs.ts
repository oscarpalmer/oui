import {getAria, setAria} from '@oscarpalmer/toretto/aria';
import {getAttribute, setAttribute} from '@oscarpalmer/toretto/attribute';
import {createElement} from '@oscarpalmer/toretto/create';
import {
	getNavigableOrientation,
	OuiNavigable,
	type OuiNavigableOrientation,
} from './internal/navigable';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[TAGNAME]: OuiTabsElement;
	}
}

export class OuiTabsEvent extends Event {
	constructor(
		name: 'oui:beforechange' | 'oui:change',
		public oldIndex: number,
		public newIndex: number,
		cancelable: boolean,
	) {
		super(name, {
			cancelable,
			bubbles: true,
			composed: true,
		});
	}
}

type OuiTabsContent = {
	element: HTMLDivElement;
	panels: OuiTabsPanels;
};

export class OuiTabsElement extends HTMLElement {
	static observedAttributes = ['active'];

	#state?: OuiTabsState;

	get active(): number {
		return this.#state?.active ?? 0;
	}

	set active(value: number) {
		setActive(this.#state, value);
	}

	get panel(): HTMLElement {
		return this.#state?.panels.elements[this.active] as HTMLElement;
	}

	get tab(): HTMLButtonElement {
		return this.#state?.tabList.tabs[this.active] as HTMLButtonElement;
	}

	attributeChangedCallback(name: string, _: string | null, value: string | null): void {
		switch (name) {
			case 'active':
				setActive(this.#state, value);
				break;

			default:
				break;
		}
	}

	connectedCallback(): void {
		if (this.#state == null) {
			this.#state = initializeTabs(this);
		} else {
			attachTabs(this.#state);
		}
	}

	disconnectedCallback(): void {
		if (this.#state != null) {
			detachTabs(this.#state);
		}
	}
}

type OuiTabsPanels = {
	elements: HTMLElement[];
	hidden: Array<boolean | 'until-found'>;
	roles: Array<string | null>;
};

type OuiTabsState = {
	active: number;
	content: HTMLDivElement;
	host: OuiTabsElement;
	id: string;
	navigable?: OuiNavigable;
	orientation: OuiNavigableOrientation;
	panels: OuiTabsPanels;
	tabList: OuiTabsTabList;
};

type OuiTabsTabList = {
	element: HTMLDivElement;
	tabs: HTMLButtonElement[];
};

// #endregion

// #region Functions

function attachTabs(state: OuiTabsState): void {
	const navigable = new OuiNavigable(state.tabList.element, {
		orientation: state.orientation,
		selector: SELECTOR_TAB,
		vertical: false,
		onActivate: navigable => {
			const index = state.tabList.tabs.indexOf(navigable.active.element as HTMLButtonElement);

			if (index > -1 && index !== state.active) {
				onActivate(state, index);
			}
		},
	});

	state.navigable = navigable;

	const {length} = state.panels.elements;

	for (let index = 0; index < length; index += 1) {
		const panel = state.panels.elements[index];

		panel.hidden = index !== state.active;
		panel.role = 'tabpanel';

		if (index === 0) {
			panel.insertAdjacentElement('beforebegin', state.tabList.element);
			panel.insertAdjacentElement('beforebegin', state.content);
		}

		state.content.append(panel);
	}
}

function createContent(prefix: string, panels: HTMLElement[], active: number): OuiTabsContent {
	const content = createElement('div', {
		attribute: {
			[ATTRIBUTE_CONTENT]: '',
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
	panel: HTMLElement,
	label: string,
	selected: boolean,
): HTMLButtonElement {
	return createElement('button', {
		aria: {
			selected,
			controls: panel.id,
		},
		attribute: {
			[ATTRIBUTE_TAB]: '',
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
	panels: HTMLElement[],
	labels: string[],
	active: number,
): OuiTabsTabList {
	const element = createElement('div', {
		attribute: {
			[ATTRIBUTE_TABLIST]: '',
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
	state.navigable?.destroy();

	const {length} = state.panels.elements;

	for (let index = 0; index < length; index += 1) {
		const panel = state.panels.elements[index];

		panel.hidden = state.panels.hidden[index];
		panel.role = state.panels.roles[index];

		state.content.before(panel);
	}

	state.tabList.element.remove();
	state.content.remove();
}

function getActive(element: OuiTabsElement, max: number): number {
	const attribute = getAttribute(element, 'active');

	let index = 0;

	if (attribute != null) {
		const value = Number.parseInt(attribute, 10);

		if (!Number.isNaN(value) && value >= 0) {
			index = value > max ? max : value;
		}
	}

	return index;
}

function getId(): string {
	index += 1;

	return `oui_tabs_${index}`;
}

function getLabels(panels: HTMLElement[]): string[] | undefined {
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

function initializeTabs(element: OuiTabsElement): OuiTabsState {
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

	const state: OuiTabsState = {
		active,
		id,
		orientation,
		tabList,
		content: content.element,
		host: element,
		panels: content.panels,
	};

	attachTabs(state);

	return state;
}

function onActivate(state: OuiTabsState, next: number): void {
	const current = state.active;

	const event = new OuiTabsEvent('oui:beforechange', current, next, true);

	state.host.dispatchEvent(event);

	if (event.defaultPrevented) {
		return;
	}

	state.active = next;

	const {length} = state.panels.elements;

	for (let index = 0; index < length; index += 1) {
		const panel = state.panels.elements[index];

		panel.hidden = index !== next;

		setAria(state.tabList.tabs[index], 'selected', index === next);
	}

	setAttribute(state.host, 'active', next);

	state.host.dispatchEvent(new OuiTabsEvent('oui:change', current, next, false));
}

function setActive(state: OuiTabsState | undefined, value: unknown): void {
	if (state == null) {
		return;
	}

	const max = state.panels.elements.length - 1;

	let index: number | undefined;

	if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
		index = value > max ? max : value;
	} else if (typeof value === 'string') {
		const parsed = Number.parseInt(value, 10);

		if (!Number.isNaN(parsed) && parsed >= 0) {
			index = parsed > max ? max : parsed;
		}
	}

	if (index == null) {
		setAttribute(state.host, 'active', state.active);
	} else if (index !== state.active) {
		state.navigable?.navigate(index, false);

		onActivate(state, index);
	}
}

// #endregion

// #region Variables

const TAGNAME = 'oui-tabs';

const ATTRIBUTE_CONTENT = `${TAGNAME}-content`;

const ATTRIBUTE_PANEL = `${TAGNAME}-panel`;

const ATTRIBUTE_TAB = `${TAGNAME}-tab`;

const ATTRIBUTE_TABLIST = `${TAGNAME}-tablist`;

const MESSAGE_EMPTY = `<${TAGNAME}> must contain at least one [${ATTRIBUTE_PANEL}] child element`;

const MESSAGE_INVALID = `A [${ATTRIBUTE_PANEL}] child element of <${TAGNAME}> must have a valid 'aria-label' or 'aria-labelledby' attribute`;

const SELECTOR_PANEL = `:scope > [${ATTRIBUTE_PANEL}]`;

const SELECTOR_TAB = `[${ATTRIBUTE_TAB}]`;

let index = 0;

// #endregion

// #region Initialization

customElements.define(TAGNAME, OuiTabsElement);

// #endregion
