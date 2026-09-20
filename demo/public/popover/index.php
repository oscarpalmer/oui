<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['popover'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<article class="flow">
	<button class="oui-button oui-button-blue" popovertarget="popover_1" type="button">Toggle</button>
	<div oui-popover popover id="popover_1" aria-label="Popover 1, Content" aria-modal="true">
		<button class="oui-button oui-button-blue" id="popover_1_1_toggle" popovertarget="popover_1_1" type="button">Toggle</button>
		<div oui-popover popover id="popover_1_1" aria-labelledby="popover_1_1_toggle" aria-modal="true">
			<p>This is a nested popover.</p>
			<input type="text" placeholder="Focusable element">
			<p>It can contain any content, including other popovers.</p>
			<input type="text" placeholder="Another focusable element">
			<button class="oui-button oui-button-blue" type="button">Another button</button>
		</div>
	</div>
	<button class="oui-button oui-button-blue" popovertarget="popover_2" type="button">Toggle</button>
	<div oui-popover popover id="popover_2" aria-modal="true">
		<button class="oui-button oui-button-blue" popovertarget="popover_2_1" type="button">Toggle</button>
		<div oui-popover popover id="popover_2_1" aria-modal="true">
			<p>This is a nested popover.</p>
			<p>It can contain any content, including other popovers.</p>
		</div>
	</div>
</article>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
