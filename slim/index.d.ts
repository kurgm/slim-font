export class SlimError extends Error {}

export type FontSetting = {
	weight_x: number;
	weight_y: number;
	space_x: number;
	descender: number;
	ascender: number;
	xHeight: number;
	topBearing: number;
	bottomBearing: number;
};

export type RenderedGlyph = {
	dList: string[];
	offsetX: number;
	advanceWidth: number;
};
export type RenderedText = {
	glyphs: RenderedGlyph[];
	width: number;
	height: number;
};

export const setValues: (map: FontSetting) => {
	renderText: (string: string) => RenderedText;
	renderTextSvg: (string: string) => string;
};
