<?php

include_once(__DIR__ . '/../../app/data/color.php');
include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['content'];

$details = [
	'content' => [
		'This is the first content item.',
		'This is the second content item.',
		'This is the third content item.',
	],
	'summaries' => [
		'First summary',
		'Second summary',
		'Third summary',
	],
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<article class="flex-as-fs stack oui-card">
	<h2>Card</h2>

	<p>This is a card, which can hold anything, really.</p>
</article>

<hr>

<article class="stack">
	<h2>Details</h2>

	<?php foreach ($details['summaries'] as $index => $summary): ?>
		<details class="oui-details" name="details">
			<summary><?php echo $summary; ?></summary>
			<p><?php echo $details['content'][$index]; ?></p>
		</details>
	<?php endforeach; ?>
</article>

<hr>

<article class="stack">
	<h2>Formatted</h2>

	<pre class="flex-as-fs oui-formatted">a b c d e f g h i
j k l m n o p q r
s t u v w x y z

A B C D E F G H I
J K L M N O P Q R
S T U V W X Y Z</pre>
</article>

<hr>

<article class="stack">
	<h2>Meter</h2>

	<ul class="flow">
		<?php for ($index = 0; $index < 11; $index += 1): ?>
			<li>
				<meter class="oui-meter" high="75" low="25" min="0" max="100" optimum="90" value="<?php echo $index * 10 ?>"></meter>
			</li>
		<?php endfor; ?>
	</ul>
</article>

<hr>

<article class="stack">
	<h2>Progress</h2>

	<ul class="flow">
		<?php for ($index = 0; $index < 11; $index += 1): ?>
			<li>
				<progress class="oui-progress" min="0" max="100" value="<?php echo $index * 10 ?>"></progress>
			</li>
		<?php endfor; ?>
	</ul>
</article>

<article class="stack">
	<h2>Shadows</h2>

	<ul class="flow">
		<?php for ($index = 0; $index < 5; $index += 1): ?>
			<li class="oui-card oui-shadow-<?php echo $index; ?>">Shadow #<?php echo $index; ?></li>
		<?php endfor; ?>
	</ul>
</article>

<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
