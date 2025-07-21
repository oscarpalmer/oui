import {attributable} from '../attributable';
import {createFocusTrap, focusTraps, selector} from './embedded';

function removeFocusTraps(element: HTMLElement): void {
	focusTraps.get(element)?.destroy();
	focusTraps.delete(element);
}

attributable(selector, createFocusTrap, removeFocusTraps);
