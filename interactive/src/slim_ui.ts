import "./main";
import { setInputParam } from "./App";
import { presetMaps } from "./controlParam/preset";

const preset_selector = document.getElementById("preset_selector")!;
for (const { title: mapName, map, imagePosition: [px, py] } of presetMaps) {
	const div = document.createElement("div");
	const a = document.createElement("a");
	const s = document.createElement("div");
	s.appendChild(document.createTextNode(mapName));
	a.appendChild(s);
	a.href = "javascript:void(0)";
	a.title = mapName;
	a.addEventListener("click", () => {
		setInputParam(map);
	});
	a.style.backgroundPosition = `${-px}px ${-py}px`;
	div.appendChild(a);
	preset_selector.appendChild(div);
}
setInputParam(presetMaps[0].map);
