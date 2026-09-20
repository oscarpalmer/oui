<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['menus'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<ul oui-menubar class="flow flow--small" role="menubar">
	<li role="none">
		<button oui-menubar-item class="oui-button" role="menuitem">Item #1</button>
	</li>
	<li oui-menu role="none">
		<button oui-menubar-item oui-menu-toggle class="oui-button" role="menuitem">Item #2, Menu</button>
		<ul oui-menu-content class="stack stack--small" role="menu">
			<li role="none">
				<button oui-menu-item class="oui-button" role="menuitem">Item #2, Menu, Item #1</button>
			</li>
			<li oui-menu role="none">
				<button oui-menu-item oui-menu-toggle class="oui-button" role="menuitem">Item #2, Menu, Item #2</button>
				<ul oui-menu-content class="stack stack--small" role="menu">
					<li role="none">
						<button oui-menu-item class="oui-button" role="menuitem">Item #2, Menu, Item #2, Item #1</button>
					</li>
					<li role="none">
						<button oui-menu-item class="oui-button" role="menuitem">Item #2, Menu, Item #2, Item #2</button>
					</li>
				</ul>
			</li>
			<li role="none">
				<button oui-menu-item class="oui-button" role="menuitem">Item #2, Menu, Item #3</button>
			</li>
		</ul>
	</li>
	<li role="none">
		<button oui-menubar-item class="oui-button" role="menuitem">Item #3</button>
	</li>
</ul>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
