import "./main";
import { setFontSetting } from "./App";
import { InputParam, inputParamNames as controlnames } from "./controlParam/param";
import { presetMaps } from "./controlParam/preset";
import { clampInputParam } from "./controlParam/param";

const pform = document.getElementById("slim_params") as HTMLFormElement;
const controls: HTMLInputElement[] = [];
const controlr: (HTMLInputElement | null)[] = [];
controlnames.forEach((controlname, i) => {
	controls[i] = pform.elements.namedItem(controlname) as HTMLInputElement;
	controlr[i] = pform.elements.namedItem(`range_${controlname}`) as HTMLInputElement | null;
	const f = controlchgf_maker(controlname);
	controls[i].addEventListener("change", f);
	controlr[i]?.addEventListener("change", () => {
		controls[i].value = controlr[i]!.value;
		f();
	});
});

function getFormValues(): InputParam {
	return Object.fromEntries(controlnames.map((controlname, i) => [controlname, parseFloat(controls[i].value)])) as InputParam;
}
function setFormValues(map: InputParam) {
	controlnames.forEach((controlname, i) => {
		controls[i].value = String(map[controlname]);
		const rangeInput = controlr[i];
		if (rangeInput)
			rangeInput.value = String(map[controlname]);
	});
}
function limForm(name?: keyof InputParam) {
	const map = clampInputParam(getFormValues(), name);
	setFormValues(map);
	return map;
}
function controlchgf_maker(name?: keyof InputParam) {
	return () => {
		formsubfunc(limForm(name));
	};
}
const formsubfunc = (map: InputParam) => {
	setFontSetting({
		weight_x: map.weight_x,
		weight_y: map.weight_y,
		space_x: map.stem_interval - map.weight_x,
		descender: map.descender,
		ascender: map.ascender,
		xHeight: map.xHeight,
		topBearing: map.topBearing,
		bottomBearing: map.bottomBearing
	});
};
formsubfunc(limForm());
const preset_selector = document.getElementById("preset_selector")!;
function setMap (newmap: InputParam) {
	setFormValues(newmap);
	formsubfunc(newmap);
}
for (const { title: mapName, map, imagePosition: [px, py] } of presetMaps) {
	const div = document.createElement("div");
	const a = document.createElement("a");
	const s = document.createElement("div");
	s.appendChild(document.createTextNode(mapName));
	a.appendChild(s);
	a.href = "javascript:void(0)";
	a.title = mapName;
	a.addEventListener("click", () => {
		setMap(map);
	});
	a.style.backgroundPosition = `${-px}px ${-py}px`;
	div.appendChild(a);
	preset_selector.appendChild(div);
}
