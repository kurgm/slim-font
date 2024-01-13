import { FC, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Render } from "./components/Render";
import { PresetSelector } from "./components/PresetSelector";
import { InputParamTable } from "./components/InputParamTable";
import {
  InputParam,
  clampInputParam,
  inputParamToFontSetting,
} from "./controlParam/param";
import { PresetMap, presetMaps } from "./controlParam/preset";

const createExternalParam = <T,>(defaultValue: T) => {
  let currentValue = defaultValue;
  const callbacks: (() => void)[] = [];

  const get = () => currentValue;
  const set = (value: T) => {
    currentValue = value;
    callbacks.forEach((cb) => cb());
  };
  const subscribe = (cb: () => void) => {
    callbacks.push(cb);
    return () => {
      const index = callbacks.indexOf(cb);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  };

  const useExternalParam = () => useSyncExternalStore(subscribe, get);
  return { get, set, useExternalParam };
};

const { set: setInputParam, useExternalParam: useInputParam } =
  createExternalParam<InputParam>(presetMaps[0].map);

export const App: FC = () => {
  const inputParam = useInputParam();
  const [text, setText] = useState("Lorem ipsum");

  const fontSetting = useMemo(
    () => inputParamToFontSetting(inputParam),
    [inputParam]
  );

  const onParamChange = (name: keyof InputParam, value: number) => {
    setInputParam(clampInputParam({ ...inputParam, [name]: value }, name));
  };
  const onPresetClick = (preset: Readonly<PresetMap>) => {
    setInputParam(preset.map);
  };

  return (
    <>
      <Render fontSetting={fontSetting} text={text} />
      <div>
        テキスト:{" "}
        <input
          type="text"
          name="text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
      </div>
      {createPortal(
        <PresetSelector presets={presetMaps} onClick={onPresetClick} />,
        document.getElementById("react_portal_preset_root")!
      )}
      {createPortal(
        <InputParamTable param={inputParam} onChange={onParamChange} />,
        document.getElementById("react_portal_table_root")!
      )}
    </>
  );
};
