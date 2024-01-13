import { FC } from "react";

import { ParamInput } from "./ParamInput";
import { InputParam } from "../controlParam/param";

import controllerPath from "./controller.png";
import style from "./InputParamTable.module.css";

interface InputParamTableProps {
  param: InputParam;
  onChange: (name: keyof InputParam, value: number) => void;
}

export const InputParamTable: FC<InputParamTableProps> = ({
  param,
  onChange,
}) => {
  return (
    <table className={style.table}>
      <tbody>
        <tr>
          <td>
            水平ステムの太さ
            <br />
            <ParamInput
              name="weight_y"
              min={1}
              max={100}
              value={param.weight_y}
              onChange={onChange}
            />
          </td>
          <td rowSpan={3}>
            <img src={controllerPath} height="360" width="383" alt="" />
          </td>
          <td>
            アセンダ
            <br />
            <ParamInput
              name="ascender"
              min={400}
              max={1100}
              value={param.ascender}
              onChange={onChange}
            />
          </td>
        </tr>
        <tr>
          <td>
            垂直ステムの太さ
            <br />
            <ParamInput
              name="weight_x"
              min={1}
              max={200}
              value={param.weight_x}
              onChange={onChange}
            />
          </td>
          <td>
            x-ハイト
            <br />
            <ParamInput
              name="xHeight"
              min={200}
              max={700}
              value={param.xHeight}
              onChange={onChange}
            />
          </td>
        </tr>
        <tr>
          <td>
            垂直ステムの間隔
            <br />
            <ParamInput
              name="stem_interval"
              min={30}
              max={300}
              value={param.stem_interval}
              onChange={onChange}
            />
          </td>
          <td>
            ディセンダ
            <br />
            <ParamInput
              name="descender"
              min={50}
              max={500}
              value={param.descender}
              onChange={onChange}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
