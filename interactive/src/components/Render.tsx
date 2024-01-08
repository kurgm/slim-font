import { FC, useMemo } from "react";

import { setValues, type FontSetting } from "@kurgm/slim-font";

import { Preview } from "./Preview";

export interface RenderProps {
  fontSetting: FontSetting;
  text: string;
}

export const Render: FC<RenderProps> = ({ fontSetting, text }: RenderProps) => {
  const renderedText = useMemo(() => {
    return setValues(fontSetting).renderText(text);
  }, [fontSetting, text]);

  return <Preview {...renderedText} />;
};
