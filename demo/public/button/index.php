<?php

include_once(__DIR__ . '/../../app/data/color.php');
include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['button'];

$icons = [
	'' => '',
	'blue' => '',
	'green' => '&plus;',
	'orange' => '',
	'purple' => '',
	'red' => '&minus;',
	'yellow' => '',
];

$sizes = [
	'',
	'small',
	'tiny',
];

$types = [
	false,
	true,
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<ul class="stack">
	<?php foreach ($color['names'] as $colorIndex => $colorName): ?>
		<li class="flow flex-jc-sb">
			<?php foreach ($types as $type): ?>
				<ul class="fill flow flow-small flex-ai--fs">
					<?php foreach ($sizes as $size): ?>
						<li>
							<button class="oui-button<?php echo $colorName ? ' oui-button--' . $colorName : '' ?><?php echo $size ? ' oui-button--' . $size : '' ?>" type="button" <?php echo $type ? ' aria-disabled="true"' : '' ?>><?php echo $color['articles'][$colorIndex] ?> <?php echo $colorName ? $colorName . ' ' : '' ?><?php echo $size ? $size . ' ' : '' ?>button</button>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php endforeach; ?>
		</li>
	<?php endforeach; ?>
</ul>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
