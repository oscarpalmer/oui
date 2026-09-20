<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['listbox'];

$groups = [
	'New England' => ['Connecticut', 'Maine', 'Massachusetts', 'New Hampshire', 'Rhode Island', 'Vermont'],
	'Mid-Atlantic' => ['Delaware', 'Maryland', 'New Jersey', 'New York', 'Pennsylvania'],
	'Midwest' => ['Illinois', 'Indiana', 'Iowa', 'Kansas', 'Michigan', 'Minnesota', 'Missouri', 'Nebraska', 'North Dakota', 'Ohio', 'South Dakota', 'Wisconsin'],
	'South' => ['Alabama', 'Arkansas', 'Florida', 'Georgia', 'Kentucky', 'Louisiana', 'Mississippi', 'North Carolina', 'Oklahoma', 'South Carolina', 'Tennessee', 'Texas', 'Virginia', 'West Virginia'],
	'Mountain West' => ['Arizona', 'Colorado', 'Idaho', 'Montana', 'New Mexico', 'Utah', 'Wyoming'],
	'West Coast' => ['California', 'Oregon', 'Washington'],
	'Alaska & Hawaii' => ['Alaska', 'Hawaii'],
];

$multiples = ['', 'multiple'];

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
<section class="fill stack">
	<h2>Simple</h2>

	<div class="fill flow flex-ai--s">
		<?php foreach ($multiples as $multiple): ?>
			<?php $type = $multiple === '' ? 'single' : 'multiple'; ?>
			<oui-listbox class="fill stack stack--small" <?php echo $multiple; ?>>
				<label class="oui-label" for="simple_<?php echo $type; ?>">Simple, <?php echo ucfirst($type); ?></label>
				<select id="simple_<?php echo $type; ?>">
					<?php foreach ($states_all as $state): ?>
						<option value="<?php echo $state; ?>" <?php echo in_array($state, $states_selected) ? ' selected' : ''; ?>><?php echo $state; ?></option>
					<?php endforeach; ?>
				</select>
			</oui-listbox>
		<?php endforeach; ?>
	</div>
</section>

<section class="fill stack">
	<h2>Grouped</h2>

	<div class="fill flow flex-ai--s">
		<?php foreach ($multiples as $multiple): ?>
			<?php $type = $multiple === '' ? 'single' : 'multiple'; ?>
			<oui-listbox class="fill stack stack--small" <?php echo $multiple; ?>>
				<label class="oui-label" for="grouped_<?php echo $type; ?>">Grouped, <?php echo ucfirst($type); ?></label>
				<select id="grouped_<?php echo $type; ?>">
					<?php foreach ($groups as $group => $states): ?>
						<optgroup label="<?php echo $group; ?>">
							<?php foreach ($states as $state): ?>
								<option value="<?php echo $state; ?>" <?php echo in_array($state, $states_selected) ? ' selected' : ''; ?>><?php echo $state; ?></option>
							<?php endforeach; ?>
						</optgroup>
					<?php endforeach; ?>
				</select>
			</oui-listbox>
		<?php endforeach; ?>
	</div>
</section>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
