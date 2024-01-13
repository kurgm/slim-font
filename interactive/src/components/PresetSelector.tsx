import { FC } from "react";

import { PresetMap } from "../controlParam/preset";
import { PresetButton } from "./PresetButton";

import style from "./PresetSelector.module.css";

interface PresetSelectorProps {
  presets: readonly Readonly<PresetMap>[];
  onClick: (value: Readonly<PresetMap>) => void;
}

export const PresetSelector: FC<PresetSelectorProps> = ({
  presets,
  onClick,
}: PresetSelectorProps) => {
  return (
    <div className={style.selector}>
      {presets.map((preset) => (
        <PresetButton key={preset.title} preset={preset} onClick={onClick} />
      ))}
    </div>
  );
};
