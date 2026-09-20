<?php

include_once(__DIR__ . '/../../app/data/color.php');
include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['message'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<?php foreach ($color['names'] as $colorIndex => $colorName): ?>
	<div class="oui-message<?php echo $colorName ? ' oui-message--' . $colorName : '' ?>">
		<h2>This a <?php echo $colorName ? $colorName . ' ' : '' ?>message</h2>
		<p>One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.</p>
		<hr>
		<h3>This is a subheading</h3>
		<p>He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections.</p>
	</div>
<?php endforeach; ?>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
