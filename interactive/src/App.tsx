import { FC, useMemo, useState, useSyncExternalStore } from "react";

import { Render } from "./components/Render";
import { InputParam, inputParamToFontSetting } from "./controlParam/param";

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
  createExternalParam<InputParam | null>(null);

export { setInputParam };

export const App: FC = () => {
  const inputParam = useInputParam();
  const [text, setText] = useState("Lorem ipsum");

  const fontSetting = useMemo(
    () => (inputParam ? inputParamToFontSetting(inputParam) : null),
    [inputParam]
  );
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
