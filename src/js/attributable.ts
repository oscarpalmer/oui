export function attributable(
	attribute: string,
	add: (element: HTMLElement) => void,
	remove: (element: HTMLElement) => void,
): void {
	const observer = new MutationObserver(entries => {
		const {length} = entries;

		for (let index = 0; index < length; index += 1) {
			const entry = entries[index];

			if (entry.type === 'attributes' && entry.target instanceof HTMLElement) {
				if (entry.target.hasAttribute(attribute)) {
					handleAdded(attribute, [entry.target], add);
				} else {
					handleRemoved([entry.target], remove);
				}
			} else if (entry.type === 'childList') {
				handleAdded(attribute, entry.addedNodes, add);
				handleRemoved(entry.removedNodes, remove);
			}
		}
	});

	observer.observe(document, {
		attributeFilter: [attribute],
		attributes: true,
		childList: true,
		subtree: true,
	});

	requestAnimationFrame(() => {
		handleAdded(attribute, document.querySelectorAll(`[${attribute}]`), add);
	});
}

function handleAdded(
	attribute: string,
	nodes: Node[] | NodeList,
	add: (element: HTMLElement) => void,
): void {
	const elements = [...nodes].filter(
		node => node instanceof HTMLElement,
	) as HTMLElement[];

	const {length} = elements;

	for (let index = 0; index < length; index += 1) {
		const element = elements[index];

		if (element.hasAttribute(attribute)) {
			add(element);
		}
	}
}

function handleRemoved(
	nodes: Node[] | NodeList,
	remove: (element: HTMLElement) => void,
): void {
	const elements = [...nodes].filter(
		node => node instanceof HTMLElement,
	) as HTMLElement[];

	const {length} = elements;

	for (let index = 0; index < length; index += 1) {
		remove(elements[index]);
	}
}
