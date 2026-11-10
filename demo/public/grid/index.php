<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['grid'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<oui-grid class="grid" style="gap: var(--spacing)" resizable sortable>
	<?php for ($i = 0; $i < 10; $i++): ?>
		<article class="grid__item" style="width: <?php echo random_int(100, 500) ?>px; height: <?php echo random_int(100, 500) ?>px;">
			<header oui-grid-item-handle>
				<h2>Item #<?php echo $i + 1; ?></h2>
			</header>
			<section>
				<p>Item <?php echo $i + 1; ?></p>
			</section>
		</article>
	<?php endfor; ?>
</oui-grid>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>