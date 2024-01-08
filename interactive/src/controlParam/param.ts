import type { FontSetting } from "@kurgm/slim-font";

export type InputParam = Omit<FontSetting, "space_x"> & {
  stem_interval: number;
};

export const inputParamNames: (keyof InputParam)[] = [
  "weight_x",
  "weight_y",
  "stem_interval",
  "descender",
  "ascender",
  "xHeight",
  "topBearing",
  "bottomBearing",
];

function limVal(
  map: InputParam,
  name: keyof InputParam,
  lim: number,
  isMax = false
) {
  map[name] = isMax ? Math.min(map[name], lim) : Math.max(map[name], lim);
}
export function clampInputParam(
  { ...map }: InputParam,
  name?: keyof InputParam
) {
  if (name) limVal(map, name, 1);
  if (name === "stem_interval") {
    limVal(map, "weight_x", map.stem_interval, true);
  } else {
    limVal(map, "stem_interval", map.weight_x);
  }
  const ipdifxy = map.stem_interval + Math.abs(map.weight_x - map.weight_y);
  limVal(map, "xHeight", 2 * ipdifxy + map.weight_y);
  limVal(map, "ascender", ipdifxy + map.xHeight);
  limVal(map, "descender", ipdifxy);
  return map;
}
