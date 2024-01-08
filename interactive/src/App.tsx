import { FC, useSyncExternalStore } from "react";

import { Render, RenderProps } from "./components/Render";

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

const { set: setRenderProps, useExternalParam: useRenderProps } =
  createExternalParam<RenderProps | null>(null);

export { setRenderProps };

export const App: FC = () => {
  const renderProps = useRenderProps();

  if (!renderProps) return null;
  return <Render {...renderProps} />;
};
