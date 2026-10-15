import {setAria, setRole} from '@oscarpalmer/toretto/aria';
import {setAttribute, setAttributes} from '@oscarpalmer/toretto/attribute';
import {on} from '@oscarpalmer/toretto/event';
import {findAncestor} from '@oscarpalmer/toretto/find';
import {createEmbeddedFloatable, getOnBeforeToggleListener} from '../floatable/floatable.embedded';
import {attributable} from '../internal/attributable';
import {getNavigable, updateNavigableFocus} from '../internal/navigable/index';
import {
	NAVIGABLE_KEYS_HORIZONTAL,
	NAVIGABLE_KEYS_VERTICAL,
	NAVIGABLE_SYMBOL,
	type OuiNavigable,
} from '../internal/navigable/navigable.model';
import {
	MENU_ATTRIBUTE,
	MENU_ATTRIBUTE_POSITION,
	MENU_MENUBAR_SELECTORS,
	MENU_SELECTOR_CONTENT,
	MENU_SELECTOR_ITEM,
	MENU_SELECTOR_TOGGLE,
	MENUBAR_ATTRIBUTE,
	MENUBAR_SELECTOR_ITEM,
	menubars,
	menus,
	type OuiBasicMenu,
	type OuiBasicMenuOptions,
	type OuiMenu,
	type OuiMenubar,
} from './menu.model';

// #region Instances

function OuiMenu(this: OuiMenu, element: Element, navigable: OuiNavigable): void {
	const state = navigable[NAVIGABLE_SYMBOL];

	this.content = state.element;
	this.element = element;
	this.navigable = navigable;

	this.toggle = element.querySelector(MENU_SELECTOR_TOGGLE)!;

	this.floatable = createEmbeddedFloatable(this.toggle, this.content, {
		attribute: MENU_ATTRIBUTE_POSITION,
		position:
			findAncestor(element.parentElement!, MENU_SELECTOR_CONTENT) == null
				? 'below-start'
				: 'end-top',
		reusable: false,
	});

	state.listeners.push(
		getOnBeforeToggleListener(this.content),
		on(this.content, 'click', event => {
			event.stopPropagation();

			const toggle = findAncestor(event, MENU_SELECTOR_TOGGLE);

			if (toggle != null) {
				return;
			}

			const elements = document.querySelectorAll(MENU_SELECTOR_CONTENT) as NodeListOf<HTMLElement>;

			let firstElement: Element | undefined;

			for (const element of elements) {
				firstElement ??= element;

				menus.get(element)?.floatable.hide();
			}

			const menu = firstElement == null ? undefined : menus.get(firstElement!);

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

OuiMenu.prototype.destroy = destroyMenu;

Object.defineProperties(OuiMenu.prototype, {
	open: {
		enumerable: true,
		get: getMenuOpen,
	},
});

function OuiMenubar(this: OuiMenubar, element: Element, navigable: OuiNavigable): void {
	this.element = element;
	this.navigable = navigable;

	updateNavigableFocus(this.navigable, false);
}

OuiMenubar.prototype.destroy = destroyMenubar;

// #endregion

// #region Functions

function addInstance<Instance>(
	instances: WeakMap<Element, Instance>,
	ctor: new (element: Element, navigable: OuiNavigable) => Instance,
	element: Element,
	content: Element,
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

function addMenu(element: Element): void {
	const content = element.querySelector(MENU_SELECTOR_CONTENT);
	const toggle = element.querySelector(MENU_SELECTOR_TOGGLE);

	if (content != null && toggle != null) {
		// @ts-expect-error All good, no worries :-)
		addInstance(menus, OuiMenu, element, content as never, {
			selector: MENU_SELECTOR_ITEM,
			vertical: true,
		});
	}
}

function addMenubar(element: Element): void {
	// @ts-expect-error All good, no worries :-)
	addInstance(menubars, OuiMenubar, element, element, {
		role: 'menubar',
		selector: MENUBAR_SELECTOR_ITEM,
		vertical: false,
	});
}

function destroyMenu(this: OuiMenu): void {
	this.floatable.destroy();
	this.navigable.destroy();

	this.content = undefined as never;
	this.element = undefined as never;
	this.floatable = undefined as never;
	this.navigable = undefined as never;
	this.toggle = undefined as never;
}

function destroyMenubar(this: OuiMenubar): void {
	this.navigable.destroy();

	this.element = undefined as never;
	this.navigable = undefined as never;
}

function getId(element: Element, value?: string): string {
	let {id} = element;

	if (id == null || id.trim().length === 0) {
		id = value == null ? `oui_menu_${++index}` : `${value}_toggle`;

		element.id = id;
	}

	return id;
}

function getMenuOpen(this: OuiMenu): boolean {
	return this.floatable.open;
}

function initializeMenu(menu: OuiMenu): void {
	const id = getId(menu.content);

	setAttribute(menu.toggle, 'popovertarget', id);

	setAria(menu.toggle, {
		controls: id,
		expanded: 'false',
		haspopup: 'menu',
	});

	setAttributes(menu.content, {
		popover: '',
		tabindex: '-1',
	});

	setRole(menu.content, 'menu');
}

function onDeactivate(_: KeyboardEvent, navigable: OuiNavigable): void {
	const menu = menus.get(navigable[NAVIGABLE_SYMBOL].element);

	if (menu == null) {
		return;
	}

	menu.floatable.hide();

	const element =
		menu.element.parentElement == null
			? undefined
			: findAncestor(menu.element.parentElement, MENU_MENUBAR_SELECTORS);

	if (element == null) {
		return;
	}

	const instance = menubars.get(element) ?? menus.get(element);

	if (instance != null) {
		updateNavigableFocus(instance.navigable, true);
	}
}

function onPreventNavigation(_: KeyboardEvent, navigable: OuiNavigable): boolean {
	const {element} = navigable[NAVIGABLE_SYMBOL];

	const instance = menubars.get(element) ?? menus.get(element);

	return instance == null
		? false
		: findAncestor(instance.element.parentElement!, MENU_MENUBAR_SELECTORS) != null;
}

function onShouldActivate(event: KeyboardEvent, navigable: OuiNavigable): boolean {
	const state = navigable[NAVIGABLE_SYMBOL];
	const {element} = state;

	let activate = false;

	if (menubars.has(element)) {
		activate =
			state.orientation === 'horizontal'
				? NAVIGABLE_KEYS_VERTICAL.has(event.key)
				: NAVIGABLE_KEYS_HORIZONTAL.has(event.key);
	} else if (menus.has(element)) {
		activate =
			state.orientation === 'horizontal'
				? NAVIGABLE_KEYS_VERTICAL.has(event.key)
				: event.key === 'ArrowRight';
	}

	if (activate) {
		const target =
			event.target instanceof HTMLElement && event.target.matches(MENU_SELECTOR_TOGGLE)
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
	const {element, orientation} = navigable[NAVIGABLE_SYMBOL];

	if (menubars.has(element)) {
		return undefined;
	}

	const menu = menus.get(element);

	if (menu == null) {
		return undefined;
	}

	const horizontal = orientation === 'horizontal';

	const altKey = horizontal ? 'ArrowDown' : 'ArrowRight';
	const baseKey = horizontal ? 'ArrowUp' : 'ArrowLeft';

	if (event.key === baseKey) {
		return findAncestor(menu.element.parentElement!, MENU_SELECTOR_CONTENT) != null;
	}

	if (
		event.key === altKey &&
		event.target instanceof HTMLElement &&
		!event.target.hasAttribute('popovertarget')
	) {
		return false;
	}

	return undefined;
}

function removeInstance<Instance extends OuiBasicMenu>(
	instances: WeakMap<Element, Instance>,
	element: Element,
): void {
	instances.get(element)?.destroy();

	instances.delete(element);
}

function removeMenu(element: Element): void {
	removeInstance(menus, element);
}

function removeMenubar(element: Element): void {
	removeInstance(menubars, element);
}

// #endregion

// #region Variables

let index = 0;

// #endregion

// #region Initialization

attributable(MENU_ATTRIBUTE, addMenu, removeMenu);
attributable(MENUBAR_ATTRIBUTE, addMenubar, removeMenubar);

// #endregion
