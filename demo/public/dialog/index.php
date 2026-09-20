<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['dialog'];

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
<button class="oui-button flex-as--fs" command="show-modal" commandfor="dialog" type="button">Show dialog</button>

<dialog oui-dialog class="dialog" id="dialog" oui-dialog-container="document">
	<header oui-dialog-mover class="flow dialog__header">
		<h1>Dialog</h1>
		<button class="oui-button oui-button--tiny" command="close" commandfor="dialog" type="button">Close</button>
	</header>
	<main class="dialog__content">
		<p>This is a dialog.</p>
	</main>
	<footer oui-dialog-mover class="dialog__footer">
		<p>Dialog footer</p>
	</footer>
	<span oui-dialog-resizer>R!</span>
</dialog>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
