import { getSvg, setValues } from "@kurgm/slim-font";

/**
 * @typedef {import("@kurgm/slim-font").FontSetting} FontSetting
 * @typedef {Omit<FontSetting, "space_x"> & { stem_interval: number }} InputParam
 */

class SlimUIError extends Error {
	static {
		this.prototype.name = "SlimUIError";
	}
}
/** @type {(keyof FontSetting)[]} */
const valueskey = [
	"weight_x", "weight_y", "space_x", "descender", "ascender", "xHeight", "topBearing", "bottomBearing"
];
/**
 * @param {string} str
 */
function drawSvg(str) {
	const svg = getSvg(str);
	document.getElementById("svgarea").innerHTML = svg;
	const svgelm = document.getElementById("svg");
	if (!svgelm || !svgelm.setAttribute) throw new SlimUIError("svg seems unsupported");
	const max_w = document.body.clientWidth - 100;
	const max_h = max_w * 0.25;
	svgelm.setAttribute("width", max_w);
	svgelm.setAttribute("height", max_h);
}
/** @type {readonly [string, Readonly<InputParam>, [number, number]][]} */
const presetMaps = [
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

/** @type {HTMLFormElement} */
const pform = document.getElementById("slim_params");
/** @type {(keyof InputParam)[]} */
const controlnames = [
	"weight_x", "weight_y", "stem_interval", "descender", "ascender", "xHeight", "topBearing", "bottomBearing"
];
const controls = [];
const controlr = [];
const controlf = {};
const anonchgf = controlchgf_maker();
controlnames.forEach((controlname, i) => {
	controls[i] = pform.elements[controlname];
	controlr[i] = pform.elements[`range_${controlname}`];
	const f = controlf[controlname] = controlchgf_maker(controlname);
	controls[i].addEventListener("change", f);
	if (controlr[i])
		controlr[i].addEventListener("change", rangechgf_maker(controlname));
});
pform.elements["text"].addEventListener("keyup", anonchgf);
pform.elements["autosubmit"].addEventListener("change", () => {
	if (pform.elements["autosubmit"].checked) anonchgf();
});
/** @type {InputParam} */
const map = {};
function getFormValues() {
	controlnames.forEach((controlname, i) => {
		const inp = parseFloat(controls[i].value);
		if (inp === inp) // not NaN
			map[controlname] = inp;
	});
}
function setFormValues() {
	controlnames.forEach((controlname, i) => {
		controls[i].value = map[controlname];
		if (controlr[i])
			controlr[i].value = map[controlname];
	});
}
/**
 * @param {keyof InputParam} name
 * @param {number} lim 
 * @param {boolean} [isMax]
 */
function limVal(name, lim, isMax = false) {
	map[name] = isMax ? Math.min(map[name], lim) : Math.max(map[name], lim);
}
/**
 * @param {keyof InputParam} [name]
 */
function limForm(name) {
	getFormValues();
	if (name) limVal(name, 1);
	if (name === "stem_interval") {
		limVal("weight_x", map["stem_interval"], true);
	} else {
		limVal("stem_interval", map["weight_x"]);
	}
	const ipdifxy = map["stem_interval"] + Math.abs(map["weight_x"] - map["weight_y"]);
	limVal("xHeight", 2 * ipdifxy + map["weight_y"]);
	limVal("ascender",    ipdifxy + map["xHeight"]);
	limVal("descender",   ipdifxy);
	setFormValues();
}
/**
 * @param {keyof InputParam} [name]
 */
function controlchgf_maker(name) {
	return () => {
		limForm(name);
		if (pform.elements["autosubmit"].checked)
			formsubfunc();
	};
}
/**
 * @param {keyof InputParam} name
 */
function rangechgf_maker(name) {
	return () => {
		pform.elements[name].value = pform.elements[`range_${name}`].value;
		controlf[name]();
	}
}
const formsubfunc = () => {
	limForm();
	/** @type {FontSetting} */
	const map2 = {};
	for (const key of valueskey) {
		map2[key] = key === "space_x" ? map["stem_interval"] - map["weight_x"] : map[key];
	}
	setValues(map2);
	const text = pform.elements["text"].value;
	try {
		drawSvg(text);
	} catch(e) {
		alert(e);
	}
	return false;
};
pform.addEventListener("submit", formsubfunc);
formsubfunc();
const preset_selector = document.getElementById("preset_selector");
/**
 * @param {InputParam} newmap
 */
function setMap (newmap) {
	for (const controlname of controlnames) {
		map[controlname] = newmap[controlname];
	}
	setFormValues();
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
