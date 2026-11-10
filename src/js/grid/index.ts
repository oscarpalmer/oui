import {setAttribute} from '@oscarpalmer/toretto/attribute';
import {RESIZABLE_SELECTOR_HANDLE_SCOPED} from '../resizable/resizable.model';
import {getGridColumns, setGridColumns} from './grid.dom';
import {onGridAttributeChanged} from './grid.event';
import {connectGrid, createGridState, disconnectGrid, updateGrid} from './grid.misc';
import {
	GRID_ATTRIBUTE_COLUMNS,
	GRID_ATTRIBUTE_GAP,
	GRID_ATTRIBUTE_RESIZABLE,
	GRID_SYMBOL,
	GRID_TAGNAME,
	type GridGap,
	type GridState,
} from './grid.model';

// #region Types

declare global {
	interface HTMLElementTagNameMap {
		[GRID_TAGNAME]: OuiGridElement;
	}
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging
export interface OuiGridElement {
	[GRID_SYMBOL]: GridState;
}

export class OuiGridElement extends HTMLElement {
	static readonly observedAttributes: string[] = [GRID_ATTRIBUTE_COLUMNS, GRID_ATTRIBUTE_GAP];

	get columns(): [number, number | undefined] | undefined {
		return getGridColumns(this[GRID_SYMBOL]);
	}

	set columns(value: number | [number, number | undefined] | undefined) {
		setGridColumns(this[GRID_SYMBOL], value);
	}

	get gap(): GridGap {
		return {...this[GRID_SYMBOL].gap};
	}

	set gap(value: number) {
		setAttribute(this, GRID_ATTRIBUTE_GAP, typeof value === 'number' ? value : undefined);
	}

	constructor() {
		super();

		this[GRID_SYMBOL] = createGridState(this);
	}

	attributeChangedCallback(name: string): void {
		onGridAttributeChanged(this[GRID_SYMBOL], name);
	}

	connectedCallback(): void {
		connectGrid(this[GRID_SYMBOL]);
	}

	disconnectedCallback(): void {
		disconnectGrid(this[GRID_SYMBOL]);
	}

	update(): void {
		updateGrid(this[GRID_SYMBOL]);
	}

	updateResizers(updater: (item: HTMLElement, handle: HTMLElement) => void): void {
		if (!this.hasAttribute(GRID_ATTRIBUTE_RESIZABLE)) {
			return;
		}

		const {length} = this[GRID_SYMBOL].elements;

		for (let index = 0; index < length; index += 1) {
			const element = this[GRID_SYMBOL].elements[index];

			const handle = element.querySelector(RESIZABLE_SELECTOR_HANDLE_SCOPED);

			if (handle != null) {
				updater(element, handle as HTMLElement);
			}
		}
	}
}

// #endregion

// #region Functions

// #endregion

// #region Initialization

customElements.define(GRID_TAGNAME, OuiGridElement);

// #endregion
