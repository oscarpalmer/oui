import {setAria, setRole} from '@oscarpalmer/toretto/aria';
import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {createEmbeddedFloatable, getOnBeforeToggleListener} from './floatable/floatable.embedded';
import type {OuiFloatable} from './floatable/floatable.standalone';
import {attributable} from './internal/attributable';
import {
	NAVIGABLE_KEYS_HORIZONTAL,
	NAVIGABLE_KEYS_VERTICAL,
	type OuiNavigable,
	type OuiNavigableOptions,
	getNavigable,
	updateNavigableFocus,
} from './internal/navigable';

// #region Types

type OuiBasicMenu = {
	destroy(): void;
};

type OuiBasicMenuOptions = Pick<OuiNavigableOptions, 'role' | 'selector' | 'vertical'>;

class OuiMenu {
	content: HTMLElement;

	element: HTMLElement;

	floatable: OuiFloatable;

	navigable: OuiNavigable;

	toggle: HTMLElement;

	get open(): boolean {
		return this.floatable.open;
	}

	constructor(element: HTMLElement, navigable: OuiNavigable) {
		this.element = element;
		this.navigable = navigable;

		this.content = navigable.element;

		this.toggle = element.querySelector(SELECTOR_MENU_TOGGLE)!;

		this.floatable = createEmbeddedFloatable(this.toggle, this.content, {
			attribute: ATTRIBUTE_MENU_POSITION,
			position:
				findAncestor(element.parentElement!, SELECTOR_MENU_CONTENT) == null
					? 'below-start'
					: 'end-top',
			reusable: false,
		});

		this.navigable.listeners.push(
			getOnBeforeToggleListener(this.content),
			on(this.content, 'click', event => {
				event.stopPropagation();

				const toggle = findAncestor(event, SELECTOR_MENU_TOGGLE);

				if (toggle != null) {
					return;
				}

				const elements = document.querySelectorAll(SELECTOR_MENU_CONTENT);

				for (const element of elements) {
					menus.get(element as HTMLElement)?.floatable.hide();
				}

				const menu = menus.get(elements[0] as HTMLElement);

				if (menu != null && event.pointerId === -1) {
					updateNavigableFocus(menu.navigable, true);
				}
			}),
			on(this.content, 'toggle', event => {
				const expanded = event.newState === 'open';

				if (expanded) {
					this.floatable?.update();

					updateNavigableFocus(this.navigable, true);
				} else {
				}

				setAria(this.toggle, 'expanded', expanded);
			}),
		);

		this.floatable.update();

		initializeMenu(this);

		updateNavigableFocus(this.navigable, false);
	}

	destroy(): void {
		this.floatable.destroy();
		this.navigable.destroy();

		this.floatable = undefined as never;
		this.navigable = undefined as never;
	}
}

class OuiMenubar {
	element: HTMLElement;

	navigable: OuiNavigable;

	constructor(element: HTMLElement, navigable: OuiNavigable) {
		this.element = element;
		this.navigable = navigable;

		updateNavigableFocus(this.navigable, false);
	}

	destroy(): void {
		this.navigable.destroy();

		this.navigable = undefined as never;
	}
}

// #endregion

// #region Functions

function addInstance<Instance>(
	instances: WeakMap<HTMLElement, Instance>,
	ctor: new (element: HTMLElement, navigable: OuiNavigable) => Instance,
	element: HTMLElement,
	content: HTMLElement,
	options: OuiBasicMenuOptions,
): void {
	if (!instances.has(content)) {
		instances.set(
			content,
			new ctor(
				element,
				getNavigable(content, {
					...options,
					onDeactivate,
					onPreventNavigation,
					onShouldActivate,
					onShouldDeactivate,
				}),
			),
		);
	}
}

function addMenu(element: HTMLElement): void {
	const content = element.querySelector(SELECTOR_MENU_CONTENT);
	const toggle = element.querySelector(SELECTOR_MENU_TOGGLE);

	if (content != null && toggle != null) {
		addInstance(menus, OuiMenu, element, content as never, {
			selector: SELECTOR_MENU_ITEM,
			vertical: true,
		});
	}
}

function addMenubar(element: HTMLElement): void {
	addInstance(menubars, OuiMenubar, element, element, {
		role: 'menubar',
		selector: SELECTOR_MENUBAR_ITEM,
		vertical: false,
	});
}

function getId(element: HTMLElement, value?: string): string {
	let {id} = element;

	if (id == null || id.trim().length === 0) {
		id = value == null ? `oui_menu_${++index}` : `${value}_toggle`;

		element.id = id;
	}

	return id;
}

function initializeMenu(menu: OuiMenu): void {
	const id = getId(menu.content);

	setAttribute(menu.toggle, 'popovertarget', id);

	setAria(menu.toggle, {
		controls: id,
		expanded: 'false',
		haspopup: 'menu',
	});

	setAttribute(menu.content, 'tabindex', '-1');

	setRole(menu.content, 'menu');
}

function onDeactivate(_: KeyboardEvent, navigable: OuiNavigable): void {
	const menu = menus.get(navigable.element);

	if (menu == null) {
		return;
	}

	menu.floatable.hide();

	const element = findAncestor(menu.element.parentElement!, SELECTORS) as HTMLElement | null;

	if (element == null) {
		return;
	}

	const instance = menubars.get(element) ?? menus.get(element);

	if (instance != null) {
		updateNavigableFocus(instance.navigable, true);
	}
}

function onPreventNavigation(_: KeyboardEvent, navigable: OuiNavigable): boolean {
	const instance = menubars.get(navigable.element) ?? menus.get(navigable.element);

	return findAncestor(instance?.element.parentElement!, SELECTORS) != null;
}

function onShouldActivate(event: KeyboardEvent, navigable: OuiNavigable): boolean {
	let activate = false;

	if (menubars.has(navigable.element)) {
		activate =
			navigable.orientation === 'horizontal'
				? NAVIGABLE_KEYS_VERTICAL.has(event.key)
				: NAVIGABLE_KEYS_HORIZONTAL.has(event.key);
	} else if (menus.has(navigable.element)) {
		activate =
			navigable.orientation === 'horizontal'
				? NAVIGABLE_KEYS_VERTICAL.has(event.key)
				: event.key === 'ArrowRight';
	}

	if (activate) {
		const target =
			event.target instanceof HTMLElement && event.target.matches(SELECTOR_MENU_TOGGLE)
				? event.target
				: undefined;

		if (target == null) {
			activate = false;
		} else {
			target.click();
		}
	}

	return activate;
}

function onShouldDeactivate(event: KeyboardEvent, navigable: OuiNavigable): boolean | undefined {
	if (menubars.has(navigable.element)) {
		return;
	}

	const menu = menus.get(navigable.element);

	if (menu == null) {
		return;
	}

	const horizontal = navigable.orientation === 'horizontal';

	const altKey = horizontal ? 'ArrowDown' : 'ArrowRight';
	const baseKey = horizontal ? 'ArrowUp' : 'ArrowLeft';

	if (event.key === baseKey) {
		return findAncestor(menu.element.parentElement!, SELECTOR_MENU_CONTENT) != null;
	}

	if (
		event.key === altKey &&
		event.target instanceof HTMLElement &&
		!event.target.hasAttribute('popovertarget')
	) {
		return false;
	}
}

function removeInstance<Instance extends OuiBasicMenu>(
	instances: WeakMap<HTMLElement, Instance>,
	element: HTMLElement,
): void {
	instances.get(element)?.destroy();

	instances.delete(element);
}

function removeMenu(element: HTMLElement): void {
	removeInstance(menus, element);
}

function removeMenubar(element: HTMLElement): void {
	removeInstance(menubars, element);
}

// #endregion

// #region Variables

const ATTRIBUTE_MENU = 'oui-menu';

const ATTRIBUTE_MENU_POSITION = 'oui-menu-position';

const ATTRIBUTE_MENUBAR = 'oui-menubar';

const SELECTOR_MENUBAR = `[${ATTRIBUTE_MENUBAR}]`;

const SELECTOR_MENUBAR_ITEM = `:scope > [${ATTRIBUTE_MENUBAR}-item], :scope > * > [${ATTRIBUTE_MENUBAR}-item]`;

const SELECTOR_MENU_CONTENT = `[${ATTRIBUTE_MENU}-content]`;

const SELECTOR_MENU_ITEM = `:scope > [${ATTRIBUTE_MENU}-item], :scope > * > [${ATTRIBUTE_MENU}-item]`;

const SELECTOR_MENU_TOGGLE = `[${ATTRIBUTE_MENU}-toggle]`;

const SELECTORS = `${SELECTOR_MENUBAR}, ${SELECTOR_MENU_CONTENT}`;

const menubars = new WeakMap<HTMLElement, OuiMenubar>();

const menus = new WeakMap<HTMLElement, OuiMenu>();

let index = 0;

// #endregion

// #region Initialization

attributable(ATTRIBUTE_MENU, addMenu, removeMenu);
attributable(ATTRIBUTE_MENUBAR, addMenubar, removeMenubar);

// #endregion
