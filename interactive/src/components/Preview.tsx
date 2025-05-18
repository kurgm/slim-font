import type { FC } from "react";

import type { RenderedGlyph } from "@kurgm/slim-font";

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
  return (
    <div className={style.chararea}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMid meet"
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
