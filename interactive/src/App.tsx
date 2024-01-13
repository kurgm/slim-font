import { FC, useMemo, useState } from "react";

import { Render } from "./components/Render";
import { PresetSelector } from "./components/PresetSelector";
import { InputParamTable } from "./components/InputParamTable";
import {
  InputParam,
  clampInputParam,
  inputParamToFontSetting,
} from "./controlParam/param";
import { PresetMap, presetMaps } from "./controlParam/preset";

import style from "./App.module.css";

export const App: FC = () => {
  const [inputParam, setInputParam] = useState<Readonly<InputParam>>(
    presetMaps[0].map
  );
  const [text, setText] = useState("Lorem ipsum");

  const fontSetting = useMemo(
    () => inputParamToFontSetting(inputParam),
    [inputParam]
  );

  const onParamChange = (name: keyof InputParam, value: number) => {
    setInputParam(clampInputParam(inputParam, name, value));
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
      <div className={style.columns}>
        <div className={style.left}>
          <PresetSelector presets={presetMaps} onClick={onPresetClick} />
        </div>
        <div className={style.right}>
          <InputParamTable param={inputParam} onChange={onParamChange} />
        </div>
      </div>
    </>
  );
};
