import { FC, useState, useSyncExternalStore } from "react";
import { FontSetting } from "@kurgm/slim-font";

import { Render } from "./components/Render";

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

const { set: setFontSetting, useExternalParam: useFontSetting } =
  createExternalParam<FontSetting | null>(null);

export { setFontSetting };

export const App: FC = () => {
  const fontSetting = useFontSetting();
  const [text, setText] = useState("Lorem ipsum");

  if (!fontSetting) return null;
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
    </>
  );
};
