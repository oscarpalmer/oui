<?php

include_once(__DIR__ . '/../../app/data/color.php');
include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['icon'];

$icons = [
	'add' => ['add', 'plus'],
	'cancel' => ['cancel', 'close', 'x'],
	'check' => ['check'],
	'chevron-down' => ['chevron-down'],
	'chevron-left' => ['chevron-left'],
	'chevron-right' => ['chevron-right'],
	'chevron-up' => ['chevron-up'],
	'cog' => ['cog', 'settings'],
	'delete' => ['delete', 'remove', 'trash'],
	'edit' => ['edit', 'pencil'],
	'hamburger' => ['hamburger', 'menu'],
	'home' => ['home', 'house'],
	'loader' => ['loader', 'spinner'],
	'minus' => ['minus', 'subtract'],
	'search' => ['search'],
	'star' => ['star'],
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<p>Some commonly used icons, courtesy of <a href="https://tabler.io/icons">Tabler</a>.</p>
<ul class="flow icons">
	<?php foreach ($icons as $icon => $names): ?>
		<li class="stack flex-ai--c oui-card">
			<span class="oui-icon oui-icon--<?php echo $icon; ?>" aria-hidden="true" style="font-size: 3rem;"></span>
			<ul class="flow flow--small">
				<?php foreach ($names as $name): ?>
					<li class="oui-tag oui-tag--tiny"><?php echo $name; ?></li>
				<?php endforeach; ?>
			</ul>
		</li>
	<?php endforeach; ?>
</ul>
<?php
include_once(__DIR__ . '/../../app/partials/suffix.php');
?>