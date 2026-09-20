<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['sortable'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<div class="fill flow flex-ai--s">
	<ul oui-sortable class="fill container" id="container_1" oui-sortable-connections="#container_1,#container_2">
		<?php for ($index = 0; $index < 5; $index += 1) { ?>
			<li class="item">
				<span>Item #<?php echo $index + 1; ?></span>
			</li>
		<?php } ?>
	</ul>
	<ul oui-sortable class="fill container" id="container_2" oui-sortable-connections="#container_1,#container_2">
		<?php for ($index = 0; $index < 5; $index += 1) { ?>
			<li class="stack stack--small item">
				<span>Item #<?php echo $index + 1; ?></span>
				<small oui-sortable-handle>Handle</small>
			</li>
		<?php } ?>
	</ul>
</div>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
