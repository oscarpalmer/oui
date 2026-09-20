<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['tooltip'];

$positions = [
	'above',
	'above-end',
	'above-start',
	'below',
	'below-end',
	'below-start',
	'end',
	'end-bottom',
	'end-top',
	'start',
	'start-bottom',
	'start-top'
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<ul class="stack stack--small">
	<?php foreach ($positions as $index => $position) { ?>
		<li>
			<button oui-tooltip class="oui-button" oui-tooltip-position="<?php echo $position; ?>" aria-describedby="tooltip_<?php echo $index; ?>"><?php echo $position; ?></button>
			<p id="tooltip_<?php echo $index; ?>" hidden><?php echo $position; ?>, <?php echo $position; ?>, <?php echo $position; ?>.</p>
		</li>
	<?php } ?>
</ul>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
