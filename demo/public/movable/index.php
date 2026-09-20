<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['movable'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<div class="fill flow flex-ai--s">
	<div class="fill container">
		<div oui-movable>
			<p>Movable <i>(anywhere)</i></p>
		</div>
	</div>
	<div class="fill container">
		<div oui-movable>
			<p>Movable <i>(anywhere)</i></p>
			<small oui-movable-handle>Handle</small>
		</div>
	</div>
</div>
<div class="fill flow flex-ai--s">
	<div class="fill container" id="container_1">
		<div oui-movable oui-movable-container="#container_1">
			<p>Movable <i>(within container)</i></p>
		</div>
	</div>
	<div class="fill container" id="container_2">
		<div oui-movable oui-movable-container="#container_2">
			<p>Movable <i>(within container)</i></p>
			<small oui-movable-handle>Handle</small>
		</div>
	</div>
</div>
<div class="fill flow flex-ai--s">
	<div class="fill container" id="container_3">
		<div oui-movable oui-movable-container="#container_3" oui-movable-direction="horizontal">
			<p>Movable <i>(horizontally)</i></p>
		</div>
	</div>
	<div class="fill container" id="container_4">
		<div oui-movable oui-movable-container="#container_4" oui-movable-direction="vertical">
			<p>Movable <i>(vertically)</i></p>
			<small oui-movable-handle>Handle</small>
		</div>
	</div>
</div>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
