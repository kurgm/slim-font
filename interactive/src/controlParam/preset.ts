import type { InputParam } from "./param";

export interface PresetMap {
	title: string;
	map: Readonly<InputParam>;
	imagePosition: readonly [number, number];
}

export const presetMaps: readonly Readonly<PresetMap>[] = [
	{
		title: "Regular",
		map: {
			weight_x: 60.0,
			weight_y: 50.0,
			stem_interval: 150.0,
			descender: 200.0,
			ascender: 700.0,
			xHeight: 500.0,
			topBearing: 100.0,
			bottomBearing: 100.0
		},
		imagePosition: [0, 0]
	},
	{
		title: "Light",
		map: {
			weight_x: 50.0,
			weight_y: 30.0,
			stem_interval: 150.0,
			descender: 200.0,
			ascender: 700.0,
			xHeight: 500.0,
			topBearing: 100.0,
			bottomBearing: 100.0
		},
		imagePosition: [180, 0]
	},
	{
		title: "Bold",
		map: {
			weight_x: 90.0,
			weight_y: 60.0,
			stem_interval: 160.0,
			descender: 200.0,
			ascender: 700.0,
			xHeight: 500.0,
			topBearing: 100.0,
			bottomBearing: 100.0
		},
		imagePosition: [0, 150]
	},
	{
		title: "Contrast",
		map: {
			weight_x: 60.0,
			weight_y: 15.0,
			stem_interval: 150.0,
			descender: 200.0,
			ascender: 700.0,
			xHeight: 500.0,
			topBearing: 100.0,
			bottomBearing: 100.0
		},
		imagePosition: [180, 150]
	},
	{
		title: "Condensed",
		map: {
			weight_x: 60.0,
			weight_y: 50.0,
			stem_interval: 100.0,
			descender: 200.0,
			ascender: 700.0,
			xHeight: 500.0,
			topBearing: 100.0,
			bottomBearing: 100.0
		},
		imagePosition: [0, 300]
	},
	{
		title: "Medium",
		map: {
			weight_x: 60.0,
			weight_y: 60.0,
			stem_interval: 150.0,
			descender: 200.0,
			ascender: 700.0,
			xHeight: 500.0,
			topBearing: 100.0,
			bottomBearing: 100.0
		},
		imagePosition: [180, 300]
	}
];