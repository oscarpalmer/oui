import {attributable} from '../attributable';
import {createFocusTrap, FOCUS_TRAP_SELECTOR, FOCUSTRAPS_ALL} from './embedded';

function removeFocusTraps(element: HTMLElement): void {
	FOCUSTRAPS_ALL.get(element)?.destroy();
	FOCUSTRAPS_ALL.delete(element);
}

attributable(FOCUS_TRAP_SELECTOR, createFocusTrap, removeFocusTraps);
