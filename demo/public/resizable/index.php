<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['resizable'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<div oui-resizable oui-resizable-maximum="500,500" oui-resizable-minimum="100,100">
	<span oui-resizable-handle>Resize me!</span>
</div>
<div oui-resizable class="dimensional">
	<span oui-resizable-handle>Resize me!</span>
</div>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
