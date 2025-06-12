import '@alegendstale/holly-components/color-palette'
import '@alegendstale/holly-components/canvas';
import '@alegendstale/holly-components/tool-tip';
import { Direction } from '@alegendstale/holly-components/color-palette/utils';
import { html, render } from "lit";
import { ifDefined } from 'lit/directives/if-defined.js';

function renderPalette(
	targetEl: HTMLElement,
	colors: string[],
	settings: {
		height: number,
		width: number,
		direction: Direction,
		gradient: boolean,
		preventHover: boolean,
		hideText: boolean,
		override: boolean,
		aliases: string[],
		editMode?: boolean,
		maxWidth?: number
	}
)
{
	render(
		html`
			<color-palette
				.colors=${colors}
				height=${ifDefined(settings.height)}
				width=${ifDefined(settings.width)}
				direction=${ifDefined(settings.direction)}
				?gradient=${settings.gradient}
				?preventHover=${settings.preventHover}
				?hideText=${settings.hideText}
				?override=${settings.override}
				.aliases=${settings.aliases}
				?editMode=${settings.editMode}
				maxWidth=${ifDefined(settings.maxWidth)}
			>
			</color-palette>
		`, targetEl
	)
	return targetEl.querySelector('color-palette');
}

function renderCanvas(targetEl: HTMLElement) {
	render(
		html`
			<tool-tip trigger="hover">
				<canvas-image>
				</canvas-image>
			</tool-tip>
		`,
		targetEl
	);
	return {
		tooltip: targetEl.querySelector("tool-tip"),
		canvas: targetEl.querySelector("canvas-image"),
	};
}

export { renderPalette, renderCanvas };