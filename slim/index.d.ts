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

export const setValues: (map: FontSetting) => void;
export const getPathD: (string: string) => [d: string[], width: number, height: number];
export const getSvg: (string: string) => string;
