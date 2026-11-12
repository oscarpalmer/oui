<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['grid'];

$toggleAttributes = [
	[
		'id' => 'resizable',
		'label' => 'Resizable grid?'
	],
	[
		'id' => 'sortable',
		'label' => 'Sortable grid?'
	],
];

$toggleInputs = [
	[
		'id' => 'columns',
		'label' => [
			'checkbox' => 'Use preferred column amount?',
			'input' => 'Preferred column amount'
		],
		'max' => 10,
		'min' => 0,
		'value' => 4,
	],
	[
		'id' => 'min_width',
		'label' => [
			'checkbox' => 'Use minimum column width?',
			'input' => 'Minimum column width'
		],
		'max' => 500,
		'min' => 25,
		'value' => 100,
	],
	[
		'id' => 'gap',
		'label' => [
			'checkbox' => 'Use gap?',
			'input' => 'Gap'
		],
		'max' => 100,
		'min' => 0,
		'value' => 10,
	],
	[
		'id' => 'min_height',
		'label' => [
			'checkbox' => 'Use minimum row height?',
			'input' => 'Minimum row height'
		],
		'max' => 500,
		'min' => 25,
		'value' => 150,
	],
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<div class="flow flex-ai--fs grid__toolbar" hidden>
	<div class="stack">
		<?php foreach ($toggleAttributes as $item): ?>
		<div class="stack grid__toolbar__item">
			<label class="oui-toggle" for="<?php echo $item['id']; ?>">
				<input class="toggle-attribute" id="<?php echo $item['id']; ?>" type="checkbox">
				<span><?php echo $item['label']; ?></span>
			</label>
		</div>
	<?php endforeach; ?>
	</div>
	<?php foreach ($toggleInputs as $item): ?>
		<div class="stack grid__toolbar__item">
			<label class="oui-toggle" for="<?php echo $item['id']; ?>_checkbox">
				<input class="toggle-input" id="<?php echo $item['id']; ?>_checkbox" type="checkbox">
				<span><?php echo $item['label']['checkbox']; ?></span>
			</label>
			<div class="stack stack--small">
				<label class="oui-label" for="<?php echo $item['id']; ?>"><?php echo $item['label']['input']; ?></label>
				<input class="oui-input" id="<?php echo $item['id']; ?>" type="number" min="<?php echo $item['min']; ?>" max="<?php echo $item['max']; ?>" value="<?php echo $item['value']; ?>" readonly>
			</div>
		</div>
	<?php endforeach; ?>
</div>
<oui-grid class="grid">
	<?php for ($i = 0; $i < 10; $i++): ?>
		<article class="oui-card grid__item" style="width: <?php echo random_int(100, 500) ?>px; height: <?php echo random_int(100, 500) ?>px;">
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