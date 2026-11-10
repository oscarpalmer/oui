import '/assets/js/index.mjs';

function addItem() {
	if (grid == null) {
		return;
	}

	const item = document.createElement('div');

	item.className = 'oui-card grid__item';
	item.textContent = 'Item';

	grid.append(item);
}

function updateResizer(_, handle) {
	handle.className = 'grid__item__resizer';
	handle.textContent = '';
}

const grid = document.querySelector('oui-grid');

grid?.addEventListener('resize:handle', event => {
	console.log(event);
	updateResizer(null, event.detail.handle);
});

grid?.updateResizers(updateResizer);

window.add = addItem;
