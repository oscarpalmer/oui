<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['combobox'];

$autocomplete = ['none', 'inline', 'list', 'both'];

$groups = [
	'New England' => ['Connecticut', 'Maine', 'Massachusetts', 'New Hampshire', 'Rhode Island', 'Vermont'],
	'Mid-Atlantic' => ['Delaware', 'Maryland', 'New Jersey', 'New York', 'Pennsylvania'],
	'Midwest' => ['Illinois', 'Indiana', 'Iowa', 'Kansas', 'Michigan', 'Minnesota', 'Missouri', 'Nebraska', 'North Dakota', 'Ohio', 'South Dakota', 'Wisconsin'],
	'South' => ['Alabama', 'Arkansas', 'Florida', 'Georgia', 'Kentucky', 'Louisiana', 'Mississippi', 'North Carolina', 'Oklahoma', 'South Carolina', 'Tennessee', 'Texas', 'Virginia', 'West Virginia'],
	'Mountain West' => ['Arizona', 'Colorado', 'Idaho', 'Montana', 'New Mexico', 'Utah', 'Wyoming'],
	'West Coast' => ['California', 'Oregon', 'Washington'],
	'Alaska & Hawaii' => ['Alaska', 'Hawaii'],
];

$selects = ['', 'multiple'];

$states_all = [
	'Alabama',
	'Alaska',
	'Arizona',
	'Arkansas',
	'California',
	'Colorado',
	'Connecticut',
	'Delaware',
	'Florida',
	'Georgia',
	'Hawaii',
	'Idaho',
	'Illinois',
	'Indiana',
	'Iowa',
	'Kansas',
	'Kentucky',
	'Louisiana',
	'Maine',
	'Maryland',
	'Massachusetts',
	'Michigan',
	'Minnesota',
	'Mississippi',
	'Missouri',
	'Montana',
	'Nebraska',
	'Nevada',
	'New Hampshire',
	'New Jersey',
	'New Mexico',
	'New York',
	'North Carolina',
	'North Dakota',
	'Ohio',
	'Oklahoma',
	'Oregon',
	'Pennsylvania',
	'Rhode Island',
	'South Carolina',
	'South Dakota',
	'Tennessee',
	'Texas',
	'Utah',
	'Vermont',
	'Virginia',
	'Washington',
	'West Virginia',
	'Wisconsin',
	'Wyoming',
];

$states_selected = ['California', 'New York'];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<form class="stack" id="f">
	<section class="stack">
		<h2>Ungrouped</h2>

		<div class="flow">
			<?php foreach ($autocomplete as $auto) : ?>
				<oui-combobox class="stack stack--small" type="autocomplete" autocomplete="<?= $auto ?>">
					<label class="oui-label" for="autocomplete_<?= $auto ?>"><?= ucfirst($auto) ?></label>
					<select id="autocomplete_<?= $auto ?>">
						<?php foreach ($states_all as $state) : ?>
							<option value="<?= $state ?>"><?= $state ?></option>
						<?php endforeach; ?>
					</select>
				</oui-combobox>
			<?php endforeach; ?>
		</div>

		<div class="flow">
			<?php foreach ($selects as $select) : ?>
				<oui-combobox class="stack stack--small" type="select" <?= $select ?>>
					<label class="oui-label" for="select_<?= $select === 'multiple' ? 'multiple' : 'single' ?>"><?= ucfirst($select ?: 'single') ?></label>
					<select id="select_<?= $select === 'multiple' ? 'multiple' : 'single' ?>" name="select_<?= $select === 'multiple' ? 'multiple' : 'single' ?>" <?= $select ?>>
						<?php foreach ($states_all as $state) : ?>
							<option value="<?= $state ?>" <?= $select === 'multiple' && in_array($state, $states_selected) ? 'selected' : '' ?>><?= $state ?></option>
						<?php endforeach; ?>
					</select>
				</oui-combobox>
			<?php endforeach; ?>
		</div>
	</section>

	<section class="stack">
		<h2>Grouped</h2>

		<div class="flow">
			<?php foreach ($autocomplete as $auto) : ?>
				<oui-combobox class="stack stack--small" type="autocomplete" autocomplete="<?= $auto ?>">
					<label class="oui-label" for="grouped_autocomplete_<?= $auto ?>"><?= ucfirst($auto) ?></label>
					<select id="grouped_autocomplete_<?= $auto ?>">
						<?php foreach ($groups as $group => $options) : ?>
							<optgroup label="<?= $group ?>">
								<?php foreach ($options as $option) : ?>
									<option value="<?= $option ?>"><?= $option ?></option>
								<?php endforeach; ?>
							</optgroup>
						<?php endforeach; ?>
					</select>
				</oui-combobox>
			<?php endforeach; ?>
		</div>

		<div class="flow">
			<?php foreach ($selects as $select) : ?>
				<oui-combobox class="stack stack--small" type="select" <?= $select ?>>
					<label class="oui-label" for="grouped_select_<?= $select === 'multiple' ? 'multiple' : 'single' ?>"><?= ucfirst($select ?: 'single') ?></label>
					<select id="grouped_select_<?= $select === 'multiple' ? 'multiple' : 'single' ?>" name="grouped_select_<?= $select === 'multiple' ? 'multiple' : 'single' ?>" <?= $select ?>>
						<?php foreach ($groups as $group => $options) : ?>
							<optgroup label="<?= $group ?>">
								<?php foreach ($options as $option) : ?>
									<option value="<?= $option ?>" <?= $select === 'multiple' && in_array($option, $states_selected) ? 'selected' : '' ?>><?= $option ?></option>
								<?php endforeach; ?>
							</optgroup>
						<?php endforeach; ?>
					</select>
				</oui-combobox>
			<?php endforeach; ?>
		</div>
	</section>
</form>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
