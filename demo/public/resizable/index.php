<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['resizable'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

$directions = ['', 'horizontal', 'vertical'];

$titles = ['Any direction', 'Horizontal', 'Vertical'];

?>
<?php
foreach ($directions as $index => $direction) {
	$title = $titles[$index];
?>
	<div oui-resizable <?php echo $direction ? "oui-resizable-direction=\"$direction\"" : ""; ?> oui-resizable-maximum="500,500" oui-resizable-minimum="100,100">
		<span><?php echo $title; ?></span>
		<span oui-resizable-handle>Resize me!</span>
	</div>
<?php
}
?>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>