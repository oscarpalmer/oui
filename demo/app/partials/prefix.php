<?php

include_once(__DIR__ . '/../data/pages.php');

?>
<!doctype html>
<html dir="ltr" lang="en">

<head>
	<base href="/">
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title><?php echo $meta->url === '.' ? '' : $meta->title . ' &ndash; '; ?>Oui</title>
	<link rel="stylesheet" href="/assets/css/styles.css">
	<?php if (file_exists('../' . $meta->url . '/index.css')): ?>
		<link rel="stylesheet" href="<?php echo $meta->url; ?>/index.css">
	<?php endif; ?>
	<meta name="author" content="Oscar Palmér">
</head>

<body>

	<header class="stack stack--small header">
		<p>Oui</p>
		<nav class="nav">
			<ul oui-menubar class="flow flow--small">
				<?php foreach ($pages as $page): ?>
					<li><a oui-menubar-item href="<?php echo $page->url; ?>" <?php echo $meta->url == $page->url ? ' aria-current="page"' : '' ?>><?php echo $page->title; ?></a></li>
				<?php endforeach; ?>
			</ul>
		</nav>
	</header>

	<main class="fill stack main">
		<h1><?php echo $meta->title; ?></h1>

		<div class="fill stack">
