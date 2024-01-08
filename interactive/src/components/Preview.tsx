import { FC } from "react";

import { RenderedGlyph } from "@kurgm/slim-font";

import style from "./Preview.module.css";

interface PreviewProps {
  glyphs: RenderedGlyph[];
  width: number;
  height: number;
}

export const Preview: FC<PreviewProps> = ({
  glyphs,
  width,
  height,
}: PreviewProps) => {
  const maxWidth = document.body.clientWidth - 100;
  const maxHeight = maxWidth * 0.25;
  return (
    <div className={style.chararea}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMid meet"
        width={maxWidth}
        height={maxHeight}
      >
        {glyphs.map(({ dList, offsetX }, i) => (
          <g key={i} transform={`translate(${offsetX},0)`}>
            {dList.map((d, j) => (
              <path key={j} d={d} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
};
