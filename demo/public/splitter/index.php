<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['splitter'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>

<oui-splitter max="75" min="25" size="33" type="horizontal">
	<div>Panel #1</div>
	<div>Panel #2</div>
</oui-splitter>

<hr>

<oui-splitter type="vertical">
	<div>Panel #1</div>
	<div>Panel #2</div>
</oui-splitter>

<hr>

<oui-splitter type="auto">
	<div>Panel #1</div>
	<div>Panel #2</div>
</oui-splitter>

<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
