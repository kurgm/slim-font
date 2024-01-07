import { getSvg, setValues, type FontSetting } from "@kurgm/slim-font";

type InputParam = Omit<FontSetting, "space_x"> & { stem_interval: number; };

class SlimUIError extends Error {
	static {
		this.prototype.name = "SlimUIError";
	}
}

function drawSvg(str: string) {
	const svg = getSvg(str);
	document.getElementById("svgarea")!.innerHTML = svg;
	const svgelm = document.getElementById("svg");
	if (!svgelm || !svgelm.setAttribute) throw new SlimUIError("svg seems unsupported");
	const max_w = document.body.clientWidth - 100;
	const max_h = max_w * 0.25;
	svgelm.setAttribute("width", String(max_w));
	svgelm.setAttribute("height", String(max_h));
}

const presetMaps: readonly [string, Readonly<InputParam>, [number, number]][] = [
	["Regular", {
		weight_x: 60.0,
		weight_y: 50.0,
		stem_interval: 150.0,
		descender: 200.0,
		ascender: 700.0,
		xHeight: 500.0,
		topBearing: 100.0,
		bottomBearing: 100.0
	}, [0, 0]],
	["Light", {
		weight_x: 50.0,
		weight_y: 30.0,
		stem_interval: 150.0,
		descender: 200.0,
		ascender: 700.0,
		xHeight: 500.0,
		topBearing: 100.0,
		bottomBearing: 100.0
	}, [180, 0]],
	["Bold", {
		weight_x: 90.0,
		weight_y: 60.0,
		stem_interval: 160.0,
		descender: 200.0,
		ascender: 700.0,
		xHeight: 500.0,
		topBearing: 100.0,
		bottomBearing: 100.0
	}, [0, 150]],
	["Contrast", {
		weight_x: 60.0,
		weight_y: 15.0,
		stem_interval: 150.0,
		descender: 200.0,
		ascender: 700.0,
		xHeight: 500.0,
		topBearing: 100.0,
		bottomBearing: 100.0
	}, [180, 150]],
	["Condensed", {
		weight_x: 60.0,
		weight_y: 50.0,
		stem_interval: 100.0,
		descender: 200.0,
		ascender: 700.0,
		xHeight: 500.0,
		topBearing: 100.0,
		bottomBearing: 100.0
	}, [0, 300]],
	["Medium", {
		weight_x: 60.0,
		weight_y: 60.0,
		stem_interval: 150.0,
		descender: 200.0,
		ascender: 700.0,
		xHeight: 500.0,
		topBearing: 100.0,
		bottomBearing: 100.0
	}, [180, 300]]
];

const pform = document.getElementById("slim_params") as HTMLFormElement;
const controlnames: (keyof InputParam)[] = [
	"weight_x", "weight_y", "stem_interval", "descender", "ascender", "xHeight", "topBearing", "bottomBearing"
];
const controls: HTMLInputElement[] = [];
const controlr: (HTMLInputElement | null)[] = [];
const controlf = {} as Record<keyof InputParam, () => void>;
const anonchgf = controlchgf_maker();
controlnames.forEach((controlname, i) => {
	controls[i] = pform.elements.namedItem(controlname) as HTMLInputElement;
	controlr[i] = pform.elements.namedItem(`range_${controlname}`) as HTMLInputElement | null;
	const f = controlf[controlname] = controlchgf_maker(controlname);
	controls[i].addEventListener("change", f);
	controlr[i]?.addEventListener("change", rangechgf_maker(controlname));
});
(pform.elements.namedItem("text") as HTMLInputElement).addEventListener("keyup", anonchgf);
(pform.elements.namedItem("autosubmit") as HTMLInputElement).addEventListener("change", () => {
	if ((pform.elements.namedItem("autosubmit") as HTMLInputElement).checked) anonchgf();
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
function limVal(map: InputParam, name: keyof InputParam, lim: number, isMax: boolean = false) {
	map[name] = isMax ? Math.min(map[name], lim) : Math.max(map[name], lim);
}
function limForm(name?: keyof InputParam) {
	const map = getFormValues();
	if (name) limVal(map, name, 1);
	if (name === "stem_interval") {
		limVal(map, "weight_x", map["stem_interval"], true);
	} else {
		limVal(map, "stem_interval", map["weight_x"]);
	}
	const ipdifxy = map["stem_interval"] + Math.abs(map["weight_x"] - map["weight_y"]);
	limVal(map, "xHeight", 2 * ipdifxy + map["weight_y"]);
	limVal(map, "ascender",    ipdifxy + map["xHeight"]);
	limVal(map, "descender",   ipdifxy);
	setFormValues(map);
	return map;
}
function controlchgf_maker(name?: keyof InputParam) {
	return () => {
		limForm(name);
		if ((pform.elements.namedItem("autosubmit") as HTMLInputElement).checked)
			formsubfunc();
	};
}
function rangechgf_maker(name: keyof InputParam) {
	return () => {
		(pform.elements.namedItem(name) as HTMLInputElement).value = (pform.elements.namedItem(`range_${name}`) as HTMLInputElement).value;
		controlf[name]();
	}
}
const formsubfunc = () => {
	const map = limForm();
	setValues({
		weight_x: map["weight_x"],
		weight_y: map["weight_y"],
		space_x: map["stem_interval"] - map["weight_x"],
		descender: map["descender"],
		ascender: map["ascender"],
		xHeight: map["xHeight"],
		topBearing: map["topBearing"],
		bottomBearing: map["bottomBearing"]
	});
	const text = (pform.elements.namedItem("text") as HTMLInputElement).value;
	try {
		drawSvg(text);
	} catch(e) {
		alert(e);
	}
	return false;
};
pform.addEventListener("submit", formsubfunc);
formsubfunc();
const preset_selector = document.getElementById("preset_selector")!;
function setMap (newmap: InputParam) {
	setFormValues(newmap);
	formsubfunc();
}
for (const presetMap of presetMaps) {
	const div = document.createElement("div");
	const a = document.createElement("a");
	const s = document.createElement("div");
	s.appendChild(document.createTextNode(presetMap[0]));
	a.appendChild(s);
	a.href = "javascript:void(0)";
	a.title = presetMap[0];
	a.addEventListener("click", () => {
		setMap(presetMap[1]);
	});
	a.style.backgroundPosition = `${-presetMap[2][0]}px ${-presetMap[2][1]}px`;
	div.appendChild(a);
	preset_selector.appendChild(div);
}
