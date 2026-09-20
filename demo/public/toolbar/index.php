<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['toolbar'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>

<article class="stack">
	<h2>Horizontal</h2>

	<ul oui-toolbar class="flow flow--small">
		<li>
			<button oui-toolbar-item oui-tooltip class="oui-button" type="button" aria-label="Button #1">Button #1</button>
		</li>
		<li>
			<button oui-toolbar-item oui-tooltip class="oui-button" type="button" aria-label="Button #2">Button #2</button>
		</li>
		<li>
			<button oui-toolbar-item oui-tooltip class="oui-button" type="button" aria-label="Button #3">Button #3</button>
		</li>
	</ul>
</article>

<article class="stack">
	<h2>Vertical</h2>

	<ul oui-toolbar class="stack stack--small" aria-orientation="vertical">
		<li>
			<button oui-toolbar-item class="oui-button" type="button">Button #1</button>
		</li>
		<li>
			<button oui-toolbar-item class="oui-button" type="button">Button #2</button>
		</li>
		<li>
			<button oui-toolbar-item class="oui-button" type="button">Button #3</button>
		</li>
	</ul>
</article>

<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
