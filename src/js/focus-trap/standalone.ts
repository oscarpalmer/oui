import {attributable} from '../internal/attributable';
import {createFocusTrap, FOCUS_TRAP_SELECTOR, removeFocusTrap} from './embedded';

attributable(FOCUS_TRAP_SELECTOR, createFocusTrap, removeFocusTrap);
