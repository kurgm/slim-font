import type { FontSetting } from "@kurgm/slim-font";

export type InputParam = Omit<FontSetting, "space_x"> & {
  stem_interval: number;
};

export function clampInputParam(
  { ...map }: InputParam,
  name?: keyof InputParam
): InputParam {
  if (name) map[name] = Math.max(map[name], 1);
  if (name === "stem_interval") {
    map.weight_x = Math.min(map.weight_x, map.stem_interval);
  } else {
    map.stem_interval = Math.max(map.stem_interval, map.weight_x);
  }
  const ipdifxy = map.stem_interval + Math.abs(map.weight_x - map.weight_y);
  map.xHeight = Math.max(map.xHeight, 2 * ipdifxy + map.weight_y);
  map.ascender = Math.max(map.ascender, ipdifxy + map.xHeight);
  map.descender = Math.max(map.descender, ipdifxy);
  return map;
}

export const inputParamToFontSetting = ({
  weight_x,
  weight_y,
  stem_interval,
  descender,
  ascender,
  xHeight,
  topBearing,
  bottomBearing,
}: Readonly<InputParam>): FontSetting => ({
  weight_x,
  weight_y,
  space_x: stem_interval - weight_x,
  descender,
  ascender,
  xHeight,
  topBearing,
  bottomBearing,
});
