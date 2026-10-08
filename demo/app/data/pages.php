<?php

function getPage(string $url, string $title) {
	$page = new stdClass;

	$page->url = $url;
	$page->title = $title;

	return $page;
}

$pages = [
	'home' => getPage('.', 'Home'),
	'badge' => getPage('badge', 'Badge'),
	'button' => getPage('button', 'Button'),
	'color' => getPage('color', 'Color'),
	'color-picker' => getPage('color-picker', 'Color picker'),
	'combobox' => getPage('combobox', 'Combobox'),
	'content' => getPage('content', 'Content'),
	'dialog' => getPage('dialog', 'Dialog'),
	'form' => getPage('form', 'Form'),
	'icon' => getPage('icon', 'Icon'),
	'listbox' => getPage('listbox', 'Listbox'),
	'menus' => getPage('menus', 'Menus'),
	'message' => getPage('message', 'Message'),
	'movable' => getPage('movable', 'Movable'),
	'popover' => getPage('popover', 'Popover'),
	'resizable' => getPage('resizable', 'Resizable'),
	'sortable' => getPage('sortable', 'Sortable'),
	'splitter' => getPage('splitter', 'Splitter'),
	// 'table' => getPage('table', 'Table'),
	'tabs' => getPage('tabs', 'Tabs'),
	'toolbar' => getPage('toolbar', 'Toolbar'),
	'tooltip' => getPage('tooltip', 'Tooltip'),
	'typography' => getPage('typography', 'Typography'),
	];
