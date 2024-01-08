import { FC, useSyncExternalStore } from "react";

import { RenderedText } from "@kurgm/slim-font";

import { Preview } from "./components/Preview";

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

const {
  set: setRenderedText,
  useExternalParam: useRenderedText,
} = createExternalParam<RenderedText | null>(null);

export { setRenderedText };

export const App: FC = () => {
  const renderedText = useRenderedText();

  if (!renderedText) return null;
  return (
    <Preview {...renderedText} />
  );
};
