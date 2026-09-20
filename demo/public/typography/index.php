<?php

include_once(__DIR__ . '/../../app/data/pages.php');

$meta = $pages['typography'];

$families = [
	'antique' => 'Antique',
	'didot' => 'Didot',
	'handwritten' => 'Handwritten',
	'humanist' => 'Humanist',
	'humanist--classical' => 'Classical humanist',
	'humanist--geometric' => 'Geometric humanist',
	'industrial' => 'Industrial',
	'monospace' => 'Monospace code',
	'monospace--slab-serif' => 'Monospace slab serif',
	'neogrotesque' => 'Neo-grotesque',
	'oldstyle' => 'Old style',
	'sans' => 'Sans serif',
	'sans--rounded' => 'Rounded sans serif',
	'serif' => 'Serif',
	'serif--slab' => 'Slab serif',
	'system' => 'System',
	'transitional' => 'Transitional',
];

$sizes = [
	'x-small' => 'Extra small',
	'small' => 'Small',
	'medium' => 'Medium',
	'large' => 'Large',
	'x-large' => 'Extra large',
];

include_once(__DIR__ . '/../../app/partials/prefix.php');

?>
<section class="stack">
	<h2>Blockquotes</h2>

	<ul class="flow typography-list">
		<li class="oui-card stack stack--small">
			<h3>Simple blockquote</h3>
			<figure>
				<blockquote class="oui-blockquote">Here's a simple blockquote holding only text content.</blockquote>
			</figure>
		</li>
		<li class="oui-card stack stack--small">
			<h3>Blockquote with a single paragraph</h3>
			<figure>
				<blockquote class="oui-blockquote">
					<p>Here's a blockquote holding a single paragraph of text content.</p>
				</blockquote>
			</figure>
		</li>
		<li class="oui-card stack stack--small">
			<h3>Blockquote with multiple paragraphs</h3>
			<figure>
				<blockquote class="oui-blockquote">
					<p>Here's a blockquote holding multiple paragraphs of text content.</p>
					<p>Here's the second paragraph within the same blockquote.</p>
				</blockquote>
			</figure>
		</li>
	</ul>
</section>

<section class="stack">
	<h2>Font families</h2>
	<figure class="stack stack--small">
		<blockquote class="oui-blockquote">System font stack CSS organized by typeface classification for every modern OS. The fastest fonts available. No downloading, no layout shifts, no flashes — just instant renders.</blockquote>
		<p>&mdash; <a href="https://modernfontstacks.com/">Modern Font Stacks</a></p>
	</figure>
	<ul class="typography-list">
		<?php foreach ($families as $klass => $name): ?>
			<li class="oui-card stack stack--small">
				<h3><?php echo $name; ?></h3>
				<p><code>oui-font-<?php echo $klass; ?></code></p>
				<p class="oui-font-<?php echo $klass; ?>">One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.</p>
			</li>
		<?php endforeach; ?>
	</ul>
</section>

<section class="stack">
	<h2>Font sizes</h2>
	<ul class="typography-list">
		<?php foreach ($sizes as $klass => $name): ?>
			<li class="oui-card stack stack--small">
				<h3><?php echo $name; ?></h3>
				<p><code>oui-font--<?php echo $klass; ?></code></p>
				<p class="oui-font--<?php echo $klass; ?>">One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.</p>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
<?php include_once(__DIR__ . '/../../app/partials/suffix.php'); ?>
