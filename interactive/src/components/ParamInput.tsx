import { type ChangeEvent, type FC, useCallback } from "react";

import type { InputParam } from "../controlParam/param";

import style from "./ParamInput.module.css";

interface ParamInputProps {
  name: keyof InputParam;
  value: number;
  min: number;
  max: number;
  onChange: (name: keyof InputParam, value: number) => void;
}

export const ParamInput: FC<ParamInputProps> = ({
  name,
  value,
  min,
  max,
  onChange,
}: ParamInputProps) => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      onChange(name, value);
    },
    [onChange, name]
  );

  return (
    <>
      <input
        type="range"
        name={`range_${name}`}
        min={min}
        max={max}
        value={value}
        step="any"
        onChange={handleChange}
      />
      <input
        type="number"
        className={style.number}
        name={name}
        value={value}
        onChange={handleChange}
      />
    </>
  );
};
