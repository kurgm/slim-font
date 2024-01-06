export class SlimError {
	message: string;
	constructor(message: string);
	toString(): string;
}

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
export const getPathD: (string: string) => [string[], number, number];
export const getSvg: (string: string) => string;
