import { type FC, type MouseEventHandler, useCallback } from "react";

import type { PresetMap } from "../controlParam/preset";

import style from "./PresetButton.module.css";

interface PresetButtonProps {
  preset: Readonly<PresetMap>;
  onClick: (value: Readonly<PresetMap>) => void;
}

export const PresetButton: FC<PresetButtonProps> = ({
  preset,
  onClick,
}: PresetButtonProps) => {
  const handleClick = useCallback<MouseEventHandler<HTMLAnchorElement>>(
    (evt) => {
      evt.preventDefault();
      onClick(preset);
    },
    [onClick, preset]
  );

  return (
    <div className={style.button}>
      <a
        href=""
        onClick={handleClick}
        title={preset.title}
        style={{
          backgroundPosition: `${-preset.imagePosition[0]}px ${-preset
            .imagePosition[1]}px`,
        }}
      >
        <div>{preset.title}</div>
      </a>
    </div>
  );
};
