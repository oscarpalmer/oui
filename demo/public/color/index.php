<?php

include_once(__DIR__ . '/../../app/data/color.php');
include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['color'];

$colors = [
	'gray',
	'slate',
	'stone',
	'red',
	'orange',
	'yellow',
	'green',
	'blue',
	'purple',
];

$values = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<ul class="colors">
	<?php foreach ($colors as $color): ?>
		<li>
			<ul class="colors">
				<?php foreach ($values as $value): ?>
					<li class="color" style="background-color: var(--oui-<?php echo $color ?>-<?php echo $value ?>)"><?php echo $value ?></li>
				<?php endforeach; ?>
			</ul>
		</li>
	<?php endforeach; ?>
</ul>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
