import {attributable} from '../internal/attributable';
import {ATTRIBUTE_FOCUSTRAP, createFocusTrap, removeFocusTrap, type OuiFocusTrap} from './embedded';

attributable(ATTRIBUTE_FOCUSTRAP, createFocusTrap, removeFocusTrap);

export {createFocusTrap, type OuiFocusTrap};
