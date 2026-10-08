import '/assets/js/index.mjs';

const handlers = [
	[element => (element.ariaBusy = 'true'), element => (element.ariaBusy = 'false')],
	[element => (element.dataset.state = 'success'), element => (element.dataset.state = '')],
	[element => (element.dataset.state = 'error'), element => (element.dataset.state = '')],
];

const states = ['busy', 'success', 'error'];

for (const state of states) {
	const elements = document.querySelectorAll(`.${state}`);
	const [set, unset] = handlers[states.indexOf(state)];

	for (const element of elements) {
		let timer;

		element.addEventListener('click', () => {
			if (timer == null) {
				set(element);

				timer = setTimeout(() => {
					unset(element);

					timer = undefined;
				}, 5_000);
			} else {
				clearTimeout(timer);

				unset(element);

				timer = undefined;
			}
		});
	}
}
