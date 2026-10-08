<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['form'];

$input = [
	'labels' => [
		'Color',
		'Date',
		'Date and time',
		'Email',
		'File',
		'Month',
		'Number',
		'Password',
		'Search',
		'Telephone',
		'Text',
		'Time',
		'URL',
		'Week',
	],
	'types' => [
		'color',
		'date',
		'datetime-local',
		'email',
		'file',
		'month',
		'number',
		'password',
		'search',
		'tel',
		'text',
		'time',
		'url',
		'week',
	],
];

$toggle = [
	'attributes' => [
		'',
		' oui-off="x" oui-on="!"',
		'',
		'',
	],
	'classes' => [
		'oui-toggle',
		'oui-toggle',
		'oui-switch',
	],
	'states' => [
		'',
		'',
		' readonly',
		' aria-disabled="true"',
	],
	'labels' => [
		'Checkbox',
		'Radio',
		'Switch',
	],
	'types' => [
		'checkbox',
		'radio',
		'checkbox',
	],
];

$variation = [
	'attributes' => [
		'',
		' aria-invalid="false"',
		' aria-invalid="true"',
		' readonly',
		' aria-disabled="true"',
	],
	'classes' => [
		'',
		' oui-validate',
		' oui-validate',
		'',
		'',
	],
	'labels' => [
		'',
		'valid',
		'invalid',
		'readonly',
		'disabled',
	],
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<article class="stack">
	<h2>Toggles</h2>

	<?php foreach ($toggle['types'] as $typeIndex => $type): ?>
		<fieldset class="oui-fieldset">
			<legend class="oui-legend"><?php echo $toggle['labels'][$typeIndex] ?></legend>

			<ul class="flow flow--small">
				<?php foreach ($toggle['attributes'] as $attributeIndex => $attribute): ?>
					<li>
						<label class="<?php echo $toggle['classes'][$typeIndex] ?>" <?php echo $attribute ?>>
							<input name="<?php echo $type . '_' . $typeIndex . ($type == 'radio' ? '' : '_' . $attributeIndex) ?>" id="<?php echo $type . '_' . $typeIndex . '_' . $attributeIndex ?>" type="<?php echo $type; ?>" <?php echo $toggle['states'][$attributeIndex] ?>>A <?php echo lcfirst($toggle['labels'][$typeIndex]) ?>
						</label>
					</li>
				<?php endforeach; ?>
			</ul>
		</fieldset>
	<?php endforeach; ?>
</article>

<hr>

<article class="stack">
	<h2>Inputs</h2>

	<?php foreach ($input['types'] as $typeIndex => $type): ?>
		<form>
			<fieldset class="oui-fieldset">
				<legend class="oui-legend"><?php echo $input['labels'][$typeIndex] ?></legend>

				<ul class="flow flow--small">
					<?php foreach ($variation['attributes'] as $attributeIndex => $attribute): ?>
						<li class="stack stack--small">
							<label class="oui-label" for="<?php echo $type . '_' . $typeIndex . '_' . $attributeIndex ?>"><?php echo $input['labels'][$typeIndex] ?><?php echo $variation['labels'][$attributeIndex] ? ' <i>(' . $variation['labels'][$attributeIndex] . ')</i>' : '' ?></label>
							<input class="oui-input<?php echo $variation['classes'][$attributeIndex] ?>" id="<?php echo $type . '_' . $typeIndex . '_' . $attributeIndex ?>" type="<?php echo $type; ?>" <?php echo $attribute ?>>
						</li>
					<?php endforeach; ?>
				</ul>
			</fieldset>
		</form>
	<?php endforeach; ?>
</article>

<hr>

<article class="stack">
	<h2>Textarea</h2>

	<form>
		<ul class="flow flow--small">
			<?php foreach ($variation['attributes'] as $attributeIndex => $attribute): ?>
				<li class="stack stack--small">
					<label class="oui-label" for="<?php echo $type . '_' . $typeIndex . '_' . $attributeIndex ?>"><?php echo $input['labels'][$typeIndex] ?><?php echo $variation['labels'][$attributeIndex] ? ' <i>(' . $variation['labels'][$attributeIndex] . ')</i>' : '' ?></label>
					<textarea class="oui-input<?php echo $variation['classes'][$attributeIndex] ?>" id="<?php echo $type . '_' . $typeIndex . '_' . $attributeIndex ?>" <?php echo $attribute ?>></textarea>
				</li>
			<?php endforeach; ?>
		</ul>
	</form>
</article>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
