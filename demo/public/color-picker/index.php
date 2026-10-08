<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['color-picker'];

$colors = ['#ff0000', '#00ff00', '#0000ff'];

$inlines = ['', 'inline'];

$outputs = ['all', 'rgb', 'none'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<form class="stack" id="color-pickers">
	<?php foreach ($inlines as $inline) : ?>
	<?php $alpha = $inline === '' ? 'alpha' : ''; ?>
	<?php $copy = $inline === '' ? 'copy' : 'copy'; ?>
	<?php $input = $inline === '' ? 'color' : 'text'; ?>
	<?php $type = $inline === '' ? 'popover' : $inline; ?>
	<section class="stack">
		<h2><?php echo ucfirst($type); ?></h2>
		<div class="flow">
			<?php foreach ($outputs as $index => $output) : ?>
				<oui-color-picker <?php echo $alpha; ?> <?php echo $copy; ?> <?php echo $inline; ?> output="<?php echo $output; ?>">
					<label class="oui-label" for="<?php echo $type; ?>_<?php echo $output; ?>"><?php echo ucfirst($output); ?>, <?php echo $type; ?></label>
					<input type="<?php echo $input; ?>" id="<?php echo $type; ?>_<?php echo $output; ?>" name="<?php echo $type; ?>_<?php echo $output; ?>" value="<?php echo $colors[$index]; ?>" />
				</oui-color-picker>
			<?php endforeach; ?>
		</div>
	</section>
<?php endforeach; ?>
</form>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>