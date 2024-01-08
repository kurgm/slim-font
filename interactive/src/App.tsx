import { FC, useSyncExternalStore } from "react";

import { RenderedText } from "@kurgm/slim-font";

import { Preview } from "./components/Preview";

let currentRenderedText: RenderedText | null = null;

const callbacks: (() => void)[] = [];

export const setRenderedText = (renderedText: RenderedText) => {
  currentRenderedText = renderedText;
  callbacks.forEach((cb) => cb());
};

const subscribeRenderedText = (cb: () => void) => {
  callbacks.push(cb);
  return () => {
    const index = callbacks.indexOf(cb);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  };
};

const getRenderedText = () => {
  return currentRenderedText;
};

export const App: FC = () => {
  const renderedText = useSyncExternalStore(subscribeRenderedText, getRenderedText);

  if (!renderedText) return null;
  return (
    <Preview {...renderedText} />
  );
};
