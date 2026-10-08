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

$states = [
	'busy',
	'success',
	'error',
];

$types = [
	false,
	true,
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<section class="stack">
	<h2>Colors and sizes</h2>
	<ul class="stack">
		<?php foreach ($color['names'] as $colorIndex => $colorName): ?>
			<li class="flow flex-jc-sb">
				<?php foreach ($types as $type): ?>
					<ul class="fill flow flow--small">
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
</section>

<section class="stack">
	<h2>States</h2>
	<p>Click any button to change <i>(or cancel its)</i> state.</p>
	<ul class="stack">
		<?php foreach ($states as $state): ?>
			<li class="flow flow--small">
				<button class="oui-button flex-as--fs <?php echo $state ?>" id="<?php echo $state; ?>_1" type="button">I can be <?php echo $state; ?></button>
				<button class="oui-button flex-as--fs <?php echo $state ?>" id="<?php echo $state; ?>_2" type="button">
					<span class="oui-icon oui-icon--star" aria-hidden="true"></span>
					<span>I can be <?php echo $state; ?></span>
				</button>
				<button class="oui-button flex-as--fs <?php echo $state ?>" id="<?php echo $state; ?>_3" type="button">
					<span>I can be <?php echo $state; ?></span>
					<span class="oui-icon oui-icon--star" aria-hidden="true"></span>
				</button>
				<button class="oui-button flex-as--fs <?php echo $state ?>" id="<?php echo $state; ?>_4" type="button">
					<span>I can</span>
					<span class="oui-icon oui-icon--star" aria-hidden="true"></span>
					<span>be <?php echo $state; ?></span>
				</button>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>