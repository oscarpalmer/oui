</div>
</main>
<footer class="footer">
	<p>&copy; <?php echo date('Y') ?> Oscar Palmér</p>
</footer>
<?php if (file_exists('../' . $meta->url . '/index.js')): ?>
	<script src="<?php echo $meta->url; ?>/index.js" type="module"></script>
<?php else: ?>
	<script src="/assets/js/index.mjs" type="module"></script>
<?php endif; ?>
</body>

</html>
