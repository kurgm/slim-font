import { getSvg, setValues } from "@kurgm/slim-font";

class SlimUIError {
	constructor(message) {
		this.message = message;
	}
	toString() {
		return this.message;
	}
}
const ael = (obj, evt, func) => {
	if(obj.addEventListener) return obj.addEventListener(evt, func, false);
	if(obj.attachEvent)
		return (evt === "DOMContentLoaded") ?
			obj.attachEvent("onreadystatechange", (e) => {
				if(obj.readyState === "complete") func(e);
			}) :
			obj.attachEvent("on" + evt, func);
	const o = obj[evt];
	obj[evt] = o ? (e) => {o(e); func(e);} : func;
};
const valueskey = [
	"weight_x", "weight_y", "space_x", "descender", "ascender", "xHeight", "topBearing", "bottomBearing"
];
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
ael(document, "DOMContentLoaded", () => {
	const pform = document.getElementById("slim_params");
	const controlnames = [
		"weight_x", "weight_y", "stem_interval", "descender", "ascender", "xHeight", "topBearing", "bottomBearing"
	];
	const controls = [];
	const controlr = [];
	const controlf = {};
	const anonchgf = controlchgf_maker();
	for (let i = 0, l = controlnames.length; i < l; i++) {
		controls[i] = pform.elements[controlnames[i]];
		controlr[i] = pform.elements["range_" + controlnames[i]];
		const f = controlf[controlnames[i]] = controlchgf_maker(controlnames[i]);
		ael(controls[i], "change", f);
		if (controlr[i])
			ael(controlr[i], "change", rangechgf_maker(controlnames[i]));
	}
	ael(pform.elements["text"], "keyup", anonchgf);
	ael(pform.elements["autosubmit"], "change", () => {
		if (pform.elements["autosubmit"].checked) anonchgf();
	});
	const map = {};
	function getFormValues() {
		for(let i = 0, l = controlnames.length; i < l; i++) {
			const inp = parseFloat(controls[i].value);
			if (inp === inp) // not NaN
				map[controlnames[i]] = inp;
		}
	}
	function setFormValues() {
		for(let i = 0, l = controlnames.length; i < l; i++) {
			controls[i].value = map[controlnames[i]];
			if (controlr[i])
				controlr[i].value = map[controlnames[i]];
		}
	}
	function limVal(name, lim, isMax) {
		if (isMax)
			map[name] = Math.min(map[name], lim);
		else
			map[name] = Math.max(map[name], lim);
	}
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
	function controlchgf_maker(name) {
		return () => {
			limForm(name);
			if (pform.elements["autosubmit"].checked)
				formsubfunc();
		};
	}
	function rangechgf_maker(name) {
		return () => {
			pform.elements[name].value = pform.elements["range_" + name].value;
			controlf[name]();
		}
	}
	const formsubfunc = () => {
		limForm();
		const map2 = {};
		for(let i = 0, l = valueskey.length; i < l; i++) {
			const key = valueskey[i];
			let val;
			if (key === "space_x") {
				val = map["stem_interval"] - map["weight_x"];
			} else {
				val = map[key];
			}
			map2[key] = val;
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
	ael(pform, "submit", formsubfunc);
	formsubfunc();
	const preset_selector = document.getElementById("preset_selector");
	function setMap (newmap) {
		for (let i = 0, l = controlnames.length; i < l; i++)
			map[controlnames[i]] = newmap[controlnames[i]];
		setFormValues();
		formsubfunc();
	}
	for(let i = 0, l = presetMaps.length; i < l; i++) {
		const div = document.createElement("div");
		const a = document.createElement("a");
		const s = document.createElement("div");
		s.appendChild(document.createTextNode(presetMaps[i][0]));
		a.appendChild(s);
		a.href = "javascript:void(0)";
		a.title = presetMaps[i][0];
		ael(a, "click", () => {
			setMap(presetMaps[i][1]);
		});
		a.style.backgroundPosition = (-presetMaps[i][2][0]) + "px " + (-presetMaps[i][2][1]) + "px";
		div.appendChild(a);
		preset_selector.appendChild(div);
	}
});
