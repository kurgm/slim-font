import { getPathD, getSvg, setValues } from "@kurgm/slim-font";

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
const getRadioVal = (nodelist) => {
	for(let i = 0, l = nodelist.length; i < l; i++) {
		if (nodelist[i].checked) {
			return nodelist[i].value;
		}
	}
	return null;
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
function drawVml(str) {
	const pd = getPathD(str);
	const pathd = pd[0];
	let buffer = "";
	const max_w = document.body.clientWidth - 100;
	const max_h = max_w * 0.25;
	let real_w;
	let real_h;
	if (max_w / max_h > pd[1] / pd[2]) {
		real_h = max_h;
		real_w = max_h * pd[1] / pd[2];
	} else {
		real_h = max_w * pd[2] / pd[1];
		real_w = max_w;
	}
	buffer += '<v:group id="vml" coordorigin="0 0" coordsize="' + pd[1] + ' ' + pd[2] + '"' + ' style="width:' + real_w + 'px;height:' + real_h + 'px">';
	for(let i = 0, l = pathd.length; i < l; i++){
		buffer += '<v:shape stroke="false" fill="true" fillcolor="#000000" style="width:' + pd[1] + ';height:' + pd[2] + '" path="';
		const path = pathd[i].split(/[ ,]/);
		const cur = [0, 0];
		let mode = path[0];
		for (let j = 0, jl = path.length, clen; j < jl; j += clen) {
			const p = (idx) => Math.round(parseFloat(path[j + idx]));
			if (path[j].match(/^[MLAZ]$/i)) {
				mode = path[j];
				j++;
			}
			switch (mode) {
				case "M":
					buffer += ["m", p(0), p(1)].join(" ");
					clen = 2;
					mode = "L";
					break;
				case "m":
					buffer += ["m", cur[0] + p(0), cur[1] + p(1)].join(" ");
					clen = 2;
					mode = "l";
					break;
				case "L":
					buffer += ["l", p(0), p(1)].join(" ");
					clen = 2;
					break;
				case "l":
					buffer += ["l", cur[0] + p(0), cur[1] + p(1)].join(" ");
					clen = 2;
					break;
				case "A": {
					const rx = p(0);
					const ry = p(1);
					if (rx === ry && rx === Math.abs(p(5) - cur[1])) {
						if ((p(5) - cur[0] + p(6) - cur[1] === 0) ^ (path[j + 4] === "1")) {
							buffer += ["qx", p(5), p(6)].join(" ");
						} else {
							buffer += ["qy", p(5), p(6)].join(" ");
						}
						clen = 7;
					} else {
						buffer += ["wa", cur[0], cur[1] - ry, cur[0] + rx * 2, cur[1] + ry, cur[0], cur[1], cur[0], cur[1]];
						cur[0] = p(5);
						cur[1] = p(6);
						clen = 14;
					}
					break;
				}
				case "a": {
					const rx = p(0);
					const ry = p(1);
					if (rx === ry && rx === Math.abs(p(5))) {
						if ((p(5) + p(6) === 0) ^ (path[j + 4] === "1")) {
							buffer += ["qx", cur[0] + p(5), cur[1] + p(6)].join(" ");
						} else {
							buffer += ["qy", cur[0] + p(5), cur[1] + p(6)].join(" ");
						}
						clen = 7;
					} else {
						buffer += ["wa", cur[0], cur[1] - ry, cur[0] + rx * 2, cur[1] + ry, cur[0], cur[1], cur[0], cur[1]];
						cur[0] += p(5);
						cur[1] += p(6);
						clen = 14;
					}
					break;
				}
				case "Z":
				case "z":
					buffer += "x";
					clen = 0;
					break;
				default:
					throw new SlimUIError("undefined mode: " + mode);
			}
			if (clen > 0) {
				if (mode.match(/^[A-Z]$/)) {
					cur[0] = p(clen - 2);
					cur[1] = p(clen - 1);
				} else {
					cur[0] += p(clen - 2);
					cur[1] += p(clen - 1);
				}
			}
			buffer += " ";
		}
		buffer += '" />';
	}
	buffer += "</v:group>";
	const vmlarea = document.getElementById("vmlarea_cell");
	while (vmlarea.firstChild) {
		vmlarea.removeChild(vmlarea.firstChild);
	}
	vmlarea.insertAdjacentHTML("beforeend", buffer);
	vmlarea.style.height = max_h + "px";
}
function drawCanvas(str) {
	const pd = getPathD(str);
	const pathd = pd[0];
	let zoom = 1;
	const max_w = document.body.clientWidth - 100;
	const max_h = max_w * 0.25;
	if (max_w / max_h > pd[1] / pd[2]) {
		zoom = max_h / pd[2];
	} else {
		zoom = max_w / pd[1];
	}
	const canvas = document.getElementById("canvas");
	if (!canvas || !canvas.getContext) throw new SlimUIError("canvas seems unsupported");
	const real_w = pd[1] * zoom;
	const real_h = pd[2] * zoom;
	canvas.width = real_w, canvas.height = real_h;
	canvas.parentNode.style.height = max_h + "px";
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new SlimUIError("canvas seems unsupported");
	ctx.fillStyle = "#000000";
	for(let i = 0, l = pathd.length; i < l; i++){
		const path = pathd[i].split(/[ ,]/);
		const cur = [0, 0];
		let mode = path[0];
		ctx.beginPath();
		for (let j = 0, jl = path.length, clen; j < jl; j += clen) {
			const p = (idx) => parseFloat(path[j + idx]) * zoom;
			if (path[j].match(/^[MLAZ]$/i)) {
				mode = path[j];
				j++;
			}
			switch (mode) {
				case "M":
					ctx.moveTo(p(0), p(1));
					clen = 2;
					mode = "L";
					break;
				case "m":
					ctx.moveTo(cur[0] + p(0), cur[1] + p(1));
					clen = 2;
					mode = "l";
					break;
				case "L":
					ctx.lineTo(p(0), p(1));
					clen = 2;
					break;
				case "l":
					ctx.lineTo(cur[0] + p(0), cur[1] + p(1));
					clen = 2;
					break;
				case "A": {
					const rx = p(0);
					const ry = p(1);
					if (rx === ry && rx === Math.abs(p(5) - cur[1])) {
						clen = 7;
						if (rx === 0) break;
						if ((p(5) - cur[0] + p(6) - cur[1] === 0) ^ (path[j + 4] === "1")) {
							ctx.arc(cur[0], p(6), rx,
								(p(6) > cur[1] ? -0.5 : 0.5) * Math.PI,
								(p(5) > cur[0] ? 0 : 1) * Math.PI,
								path[j + 4] === "1" ? false : true);
							//ctx.arcTo(p(5), cur[1], p(5), p(6), rx);
						} else {
							ctx.arc(p(5), cur[1], rx,
								(p(5) > cur[0] ? 1 : 0) * Math.PI,
								(p(6) > cur[1] ? 0.5 : -0.5) * Math.PI,
								path[j + 4] === "1" ? false : true);
							//ctx.arcTo(cur[0], p(6), p(5), p(6), rx);
						}
					} else {
						clen = 14;
						if (rx === 0 || ry === 0) break;
						// canvas doesn't have ellipse method...
						ctx.save();
						ctx.scale(rx, ry);
						ctx.arc((cur[0] + rx) / rx, cur[1] / ry, 1, 0, Math.PI * 2, false);
						ctx.restore();
						cur[0] = p(5);
						cur[1] = p(6);
					}
					break;
				}
				case "a": {
					const rx = p(0);
					const ry = p(1);
					if (rx === ry && rx === Math.abs(p(5))) {
						clen = 7;
						if (rx === 0) break;
						if ((p(5) + p(6) === 0) ^ (path[j + 4] === "1")) {
							ctx.arc(cur[0], cur[1] + p(6), rx,
								(p(6) > 0 ? -0.5 : 0.5) * Math.PI,
								(p(5) > 0 ? 0 : 1) * Math.PI,
								path[j + 4] === "1" ? false : true);
							//ctx.arcTo(cur[0] + p(5), cur[1], cur[0] + p(5), cur[1] + p(6), rx);
						} else {
							ctx.arc(cur[0] + p(5), cur[1], rx,
								(p(5) > 0 ? 1 : 0) * Math.PI,
								(p(6) > 0 ? 0.5 : -0.5) * Math.PI,
								path[j + 4] === "1" ? false : true);
							//ctx.arcTo(cur[0], cur[1] + p(6), cur[0] + p(5), cur[1] + p(6), rx);
						}
					} else {
						clen = 14;
						if (rx === 0 || ry === 0) break;
						// canvas doesn't have ellipse method...
						ctx.save();
						ctx.scale(rx, ry);
						ctx.arc((cur[0] + rx) / rx, cur[1] / ry, 1, 0, Math.PI * 2, false);
						ctx.restore();
						cur[0] += p(5);
						cur[1] += p(6);
					}
					break;
				}
				case "Z":
				case "z":
					clen = 0;
					ctx.closePath();
					ctx.fill();
					break;
				default:
					throw new SlimUIError("undefined mode: " + mode);
			}
			if (clen > 0) {
				if (mode.match(/^[A-Z]$/)) {
					cur[0] = p(clen - 2);
					cur[1] = p(clen - 1);
				} else {
					cur[0] += p(clen - 2);
					cur[1] += p(clen - 1);
				}
			}
		}
	}
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
	const reprtype_radios = pform.elements["reprtype"];
	for (let i = 0, l = reprtype_radios.length; i < l; i++) {
		ael(reprtype_radios[i], "click", anonchgf);
	}
	/*@cc_on
	if (!document.documentMode || document.documentMode < 8) {
		reprtype_radios[2].checked = true; // VML
	}
	@*/
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
		document.getElementById("svgarea").style.display = "none";
		document.getElementById("canvasarea").style.display = "none";
		document.getElementById("vmlarea").style.display = "none";
		const text = pform.elements["text"].value;
		try {
			switch (getRadioVal(pform.elements["reprtype"])) {
				case "canvas":
					drawCanvas(text);
					document.getElementById("canvasarea").style.display = "block";
					break;
				case "vml":
					drawVml(text);
					document.getElementById("vmlarea").style.display = "block";
					break;
				default:
					drawSvg(text);
					document.getElementById("svgarea").style.display = "block";
			}
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
