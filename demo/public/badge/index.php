<?php

include_once(__DIR__ . '/../../app/data/color.php');
include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['badge'];

$sizes = [
	'',
	'small',
	'tiny',
];

$titles = [
	'Pills',
	'Tags',
];

$types = [
	'pill',
	'tag',
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<?php foreach ($types as $typeIndex => $type): ?>
	<article class="stack">
		<h2><?php echo $titles[$typeIndex]; ?></h2>
		<ul class="stack stack-small">
			<?php foreach ($color['names'] as $colorIndex => $colorName): ?>
				<li class="flow flow-small">
					<?php foreach ($sizes as $size): ?>
						<span class="oui-<?php echo $type ?><?php echo $colorName ? ' oui-' . $type . '--' . $colorName : '' ?><?php echo $size ? ' oui-' . $type . '--' . $size : '' ?>"><?php echo $color['articles'][$colorIndex] ?> <?php echo $colorName ? $colorName . ' ' : '' ?><?php echo $size ? $size . ' ' : '' ?><?php echo $type ?></span>
					<?php endforeach; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	</article>
<?php endforeach; ?>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
