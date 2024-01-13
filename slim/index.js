import slimDatabase from "./slim_db.js";

/**
 * @typedef {import("./index.d.ts").FontSetting} FontSetting
 * @typedef {import("./index.d.ts").RenderedGlyph} RenderedGlyph
 * @typedef {import("./index.d.ts").RenderedText} RenderedText
 * @typedef {import("./slim_db.js").SlimGlyphData} SlimGlyphData
 */

export class SlimError extends Error {
	static {
		this.prototype.name = "SlimError";
	}
}
/**
 * @param {number} a 
 * @param {number} b 
 */
function copysign (a, b) {
	return a * b < 0 ? -a : a;
}
/**
 * @type {typeof import('./index.d.ts').setValues}
 */
export const setValues = (fontsetting) => {
	/** @type {Record<string, number>} */
	const vertpos = {
		"t": fontsetting.topBearing + fontsetting.weight_y / 2.0,
		"b": fontsetting.topBearing + fontsetting.ascender - fontsetting.weight_y / 2.0,
		"x": fontsetting.topBearing + fontsetting.ascender - fontsetting.xHeight + fontsetting.weight_y / 2.0,
		"d": fontsetting.topBearing + fontsetting.ascender + fontsetting.descender - fontsetting.weight_y / 2.0,
		"m": fontsetting.topBearing + fontsetting.ascender - fontsetting.xHeight / 2.0,
		"M": fontsetting.topBearing + fontsetting.ascender / 2.0,
		"T": fontsetting.weight_y / 2.0,
		"B": fontsetting.topBearing + fontsetting.ascender + fontsetting.descender + fontsetting.bottomBearing - fontsetting.weight_y / 2.0,
		"g": fontsetting.topBearing + fontsetting.ascender + (fontsetting.descender - fontsetting.xHeight) / 2.0,
		"f": fontsetting.topBearing + (fontsetting.ascender - fontsetting.xHeight) / 2.0
	};
	/** @type {Record<string, number>} */
	const unit_dict = {
		"x": fontsetting.weight_x,
		"y": fontsetting.weight_y,
		"w": fontsetting.space_x + fontsetting.weight_x,
		"W": fontsetting.space_x + fontsetting.weight_x + Math.abs(fontsetting.weight_x - fontsetting.weight_y),
		"m": fontsetting.ascender
	};
	const radius_inner = fontsetting.space_x / 2.0;
	const radius_outer = fontsetting.weight_x + radius_inner;
	/**
	 * @param {number} n
	 */
	function horipos (n) {
		return (fontsetting.space_x + fontsetting.weight_x) * (n + 0.5);
	}
	/**
	 * @param {string} str
	 * @param {string} [default_unit]
	 */
	function parsePosStr(str, default_unit = "w") {
		if (/^\d/.test(str)) str = `+${str}`;
		let res = 0.0;
		const pattern = /([\+\-][0-9.]+)([xywmW]?)/y;
		while (pattern.lastIndex < str.length) {
			const mobj = pattern.exec(str);
			if (!mobj) throw new SlimError(`syntax error in parsing position: ${str}`);
			const [, factor, unit] = mobj;
			res += parseFloat(factor) * unit_dict[unit || default_unit];
		}
		return res;
	}
	/**
	 * @param {number} xScale
	 * @param {number} yScale
	 * @param {number} x
	 * @param {number} y
	 */
	function pathCorner(xScale, yScale, x, y) {
		const isnotinv = xScale * yScale > 0;
		return [
			"M",
			xScale * (- fontsetting.weight_x / 2.0) + x,
			yScale * (radius_outer - fontsetting.weight_y / 2.0) + y,
			"a",
			radius_outer, radius_outer,
			"0", "0",
			isnotinv ? "1" : "0",
			xScale *  radius_outer,
			yScale * -radius_outer,
			"l",
			"0", yScale * fontsetting.weight_y,
			"a",
			radius_inner, radius_inner,
			"0", "0",
			isnotinv ? "0" : "1",
			xScale * -radius_inner,
			yScale *  radius_inner,
			"z"
		].join(" ");
	}
	/** @type {Record<string, 0 | 1 | 2>} */
	const typdic = {
		"s": 0,
		"r": 1,
		"b": 2
	};
	/**
	 * @param {string} slimpoint
	 * @param {number} dx
	 * @param {number} dy
	 * @returns {[x: number, y: number, bety: 0 | 1 | 2, afty: 0 | 1 | 2]}
	 */
	function slimParsepoint(slimpoint, dx, dy) {
		dx = dx || 0.0;
		dy = dy || 0.0;
		const mobj = slimpoint.match(/^([srb]{0,2})([tbxdmgfyMTB])([^,]*),([^,]+)$/);
		if (!mobj) throw new SlimError(`syntax error: ${slimpoint}`);
		const [, typ, pos, y, x] = mobj;
		const typlen = typ.length;
		/** @type {0 | 1 | 2} */
		let bety;
		/** @type {0 | 1 | 2} */
		let afty;
		if (typlen === 0)
			bety = afty = 0;
		else if (typlen === 1)
			bety = afty = typdic[typ];
		else
			bety = typdic[typ[0]], afty = typdic[typ[1]];
		return [
			parsePosStr(`${x}+0.5w`, "w") + dx,
			vertpos[pos] + parsePosStr(y, "y") + dy,
			bety,
			afty
		];
	}
	/**
	 * @param {Record<string, SlimGlyphData>} database
	 * @param {string} glyphname
	 * @param {number} [dx]
	 * @param {number} [dy]
	 * @returns {[d: string[], width: number]}
	 */
	function slim2pathd(database, glyphname, dx = 0.0, dy = 0.0) {
		const glyphdata = database[glyphname];
		const slimdata = glyphdata.slim;
		/** @type {string[]} */
		const slim_d = [];
		let max_w = horipos(-1);
		for (const slimelem of slimdata) {
			if (slimelem.charAt(0) === "#") {
				const params = slimelem.split("#");
				const [, name, dxStr = "0", dyStr = "0"] = params;
				if (!database[name]) throw new SlimError(`referred glyph was not found: ${name}`);
				if (name === glyphname) throw new SlimError(`referring itself: ${name}`);
				const new_dx = parsePosStr(dxStr, "w");
				const new_dy = parsePosStr(dyStr, "y");
				const [new_pathd, new_glyphw] = slim2pathd(database, name, dx + new_dx, dy + new_dy);
				slim_d.push(...new_pathd);
				max_w = Math.max(max_w, new_glyphw);
				continue;
			}
			const slimpoints = slimelem.split(/\s+/).map((token) => slimParsepoint(token, dx, dy));
			for (const [px] of slimpoints) {
				max_w = Math.max(max_w, px + (fontsetting.weight_x + fontsetting.space_x) / 2.0);
			}
			const pointc = slimpoints.length;
			/** @type {{ x: number, y: number, arg: number, isvert: boolean, hv: 0 | 1 | 2, pointStartR: [number, number], pointEndR: [number, number], pointEndL: [number, number], pointStartL: [number, number] }[]} */
			const line = [];
			for (let j = 0; j < pointc - 1; j++) {
				const [p1x, p1y] = slimpoints[j];
				const [p2x, p2y] = slimpoints[j + 1];
				const arg = Math.atan2(p2y - p1y, p2x - p1x);
				const arg2 = Math.abs(arg / Math.PI);
				const isvert = (0.25 < arg2) && (arg2 < 0.75);
				/** @type {0 | 1 | 2} */
				let hv;
				if (arg2 === 0.5)
					hv = 1; //vert
				else if (arg2 === 0.0 || arg2 === 1.0)
					hv = 2; //hori
				else
					hv = 0;
				line.push({
					"x": p2x - p1x,
					"y": p2y - p1y,
					"arg": arg,
					"isvert": isvert,
					"hv": hv,
					pointStartR: [],
					pointEndR: [],
					pointEndL: [],
					pointStartL: [],
				});
			}
			slimpoints.forEach(([px, py, pbety, pafty], j) => {
				const bel = j !== 0          ? line[j - 1] : null;
				const afl = j !== pointc - 1 ? line[j]     : null;
				if (pbety === 1 && pafty === 1) {
					if (bel && afl) {
						const hv1 = bel.hv;
						const hv2 = afl.hv;
						if (hv1 && hv2 && hv1 !== hv2) {
							//corner
							processRounded2Corner(bel, afl, px, py);
							return;
						}
					}
				} else if (pbety !== 1 && pafty !== 1) {
					if (bel && pbety === 2) {
						processRounded1CornerBel(bel, px, py);
					}
					if (afl && pafty === 2) {
						processRounded1CornerAfl(afl, px, py);
					}
					//not rounded
					if (bel && pbety === 0) {
						processRounded0CornerBel(bel, px, py);
					}
					if (afl && pafty === 0) {
						processRounded0CornerAfl(afl, px, py);
					}
					if (bel === null && afl === null)
						slim_d.push([
							"M",
							px - fontsetting.weight_x / 2, py - fontsetting.weight_y / 2,
							px + fontsetting.weight_x / 2, py - fontsetting.weight_y / 2,
							px + fontsetting.weight_x / 2, py + fontsetting.weight_y / 2,
							px - fontsetting.weight_x / 2, py + fontsetting.weight_y / 2,
							"z"
						].join(" "));
					return;
				}
				//round stroke
				slim_d.push([
					"M",
					px - fontsetting.weight_x / 2.0,
					py,
					"a",
					fontsetting.weight_x / 2.0, fontsetting.weight_y / 2.0,
					"0", "0", "0",
					fontsetting.weight_x, "0",
					fontsetting.weight_x / 2.0, fontsetting.weight_y / 2.0,
					"0", "0", "0",
					-fontsetting.weight_x, "0",
					"z"
				].join(" "));
				if (bel) {
					processRounded1CornerBel(bel, px, py);
				}
				if (afl) {
					processRounded1CornerAfl(afl, px, py);
				}
			});
			for (const lineElem of line) {
				slim_d.push([
					"M",
					lineElem.pointStartR.join(","),
					lineElem.pointEndR.join(","),
					lineElem.pointEndL.join(","),
					lineElem.pointStartL.join(","),
					"z"
				].join(" "));
			}
		}
		return [slim_d, getGlyphWidth(database, glyphname, max_w, dx)];

		/**
		 * @param {{ x: number; y: number; arg: number; isvert: boolean; hv: 0 | 2 | 1; pointStartR: [number, number]; pointEndR: [number, number]; pointEndL: [number, number]; pointStartL: [number, number]; }} bel
		 * @param {number} px
		 * @param {number} py
		 */
		function processRounded1CornerBel(bel, px, py) {
			const vx = bel.x;
			const vy = bel.y;
			const k = 2.0 * Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx);
			const dx2 = fontsetting.weight_x ** 2 * vy / k;
			const dy2 = fontsetting.weight_y ** 2 * vx / k;
			bel.pointEndR = [
				px - dx2,
				py + dy2
			];
			bel.pointEndL = [
				px + dx2,
				py - dy2
			];
		}

		/**
		 * @param {{ x: number; y: number; arg: number; isvert: boolean; hv: 0 | 2 | 1; pointStartR: [number, number]; pointEndR: [number, number]; pointEndL: [number, number]; pointStartL: [number, number]; }} afl
		 * @param {number} px
		 * @param {number} py
		 */
		function processRounded1CornerAfl(afl, px, py) {
			const vx = afl.x;
			const vy = afl.y;
			const k = 2.0 * Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx);
			const dx2 = fontsetting.weight_x ** 2 * vy / k;
			const dy2 = fontsetting.weight_y ** 2 * vx / k;
			afl.pointStartR = [
				px - dx2,
				py + dy2
			];
			afl.pointStartL = [
				px + dx2,
				py - dy2
			];
		}

		/**
		 * @param {{ x: number; y: number; arg: number; isvert: boolean; hv: 0 | 2 | 1; pointStartR: [number, number]; pointEndR: [number, number]; pointEndL: [number, number]; pointStartL: [number, number]; }} bel
		 * @param {{ x: number; y: number; arg: number; isvert: boolean; hv: 0 | 2 | 1; pointStartR: [number, number]; pointEndR: [number, number]; pointEndL: [number, number]; pointStartL: [number, number]; }} afl
		 * @param {number} px
		 * @param {number} py
		 */
		function processRounded2Corner(bel, afl, px, py) {
			const arg1 = bel.arg / Math.PI;
			const arg2 = afl.arg / Math.PI;
			let xs;
			let ys;
			if      ((arg1 === -0.5 && arg2 === 0.0) || (arg1 === 1.0 && arg2 ===  0.5))
				// left-top corner
				xs =  1, ys =  1;
			else if ((arg1 === -0.5 && arg2 === 1.0) || (arg1 === 0.0 && arg2 ===  0.5))
				// right-top corner
				xs = -1, ys =  1;
			else if ((arg1 ===  0.5 && arg2 === 1.0) || (arg1 === 0.0 && arg2 === -0.5))
				// right-bottom corner
				xs = -1, ys = -1;
			else if ((arg1 ===  0.5 && arg2 === 0.0) || (arg1 === 1.0 && arg2 === -0.5))
				// left-bottom corner
				xs =  1, ys = -1;
			slim_d.push(pathCorner(xs, ys, px, py));
			/** @type {[number, number]} */
			const vert_outer = [
				xs * (- fontsetting.weight_x / 2.0) + px,
				ys * (radius_outer - fontsetting.weight_y / 2.0) + py
			];
			/** @type {[number, number]} */
			const vert_inner = [
				xs * (  fontsetting.weight_x / 2.0) + px,
				ys * (radius_inner + fontsetting.weight_y / 2.0) + py
			];
			/** @type {[number, number]} */
			const hori_outer = [
				xs * (radius_outer - fontsetting.weight_x / 2.0) + px,
				ys * (- fontsetting.weight_y / 2.0) + py
			];
			/** @type {[number, number]} */
			const hori_inner = [
				xs * (radius_outer - fontsetting.weight_x / 2.0) + px,
				ys * (  fontsetting.weight_y / 2.0) + py
			];
			if (bel.hv === 1) {
				//vert -> hori
				if (xs * ys > 0) {
					//left-top or right-bottom corner
					bel.pointEndR = vert_inner, bel.pointEndL = vert_outer;
					afl.pointStartR = hori_inner, afl.pointStartL = hori_outer;
				} else {
					//left-bottom or right-top corner
					bel.pointEndR = vert_outer, bel.pointEndL = vert_inner;
					afl.pointStartR = hori_outer, afl.pointStartL = hori_inner;
				}
			} else {
				//hori -> vert
				if (xs * ys > 0) {
					//left-top or right-bottom corner
					bel.pointEndR = hori_outer, bel.pointEndL = hori_inner;
					afl.pointStartR = vert_outer, afl.pointStartL = vert_inner;
				} else {
					//left-bottom or right-top corner
					bel.pointEndR = hori_inner, bel.pointEndL = hori_outer;
					afl.pointStartR = vert_inner, afl.pointStartL = vert_outer;
				}
			}
		}

		/**
		 * @param {{ x: number; y: number; arg: number; isvert: boolean; hv: 0 | 2 | 1; pointStartR: [number, number]; pointEndR: [number, number]; pointEndL: [number, number]; pointStartL: [number, number]; }} bel
		 * @param {number} px
		 * @param {number} py
		 */
		function processRounded0CornerBel(bel, px, py) {
			const arg = bel.arg;
			if (bel.isvert) {
				const signedX = copysign(fontsetting.weight_x, arg);
				const signedY = copysign(fontsetting.weight_y, arg);
				if (bel.hv) {
					bel.pointEndR = [
						px - signedX / 2.0,
						py + signedY / 2.0
					];
					bel.pointEndL = [
						px + signedX / 2.0,
						py + signedY / 2.0
					];
				} else {
					const vx = bel.x;
					const vy = bel.y;
					const d = Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vy);
					bel.pointEndR = [
						px + signedY / (2.0 * Math.tan(arg)) - d,
						py + signedY / 2.0
					];
					bel.pointEndL = [
						px + signedY / (2.0 * Math.tan(arg)) + d,
						py + signedY / 2.0
					];
				}
			} else {
				let signedX;
				let signedY;
				if (Math.abs(arg / Math.PI) > 0.5)
					// leftwards
					signedX = -fontsetting.weight_x,
					signedY = -fontsetting.weight_y;

				else
					// rightwards
					signedX =  fontsetting.weight_x,
					signedY =  fontsetting.weight_y;
				if (bel.hv) {
					bel.pointEndR = [
						px + signedX / 2.0,
						py + signedY / 2.0
					];
					bel.pointEndL = [
						px + signedX / 2.0,
						py - signedY / 2.0
					];
				} else {
					const vx = bel.x;
					const vy = bel.y;
					const d = Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vx);
					bel.pointEndR = [
						px + signedX / 2.0,
						py + signedX * Math.tan(arg) / 2.0 + d
					];
					bel.pointEndL = [
						px + signedX / 2.0,
						py + signedX * Math.tan(arg) / 2.0 - d
					];
				}
			}
		}

		/**
		 * @param {{ x: number; y: number; arg: number; isvert: boolean; hv: 0 | 2 | 1; pointStartR: [number, number]; pointEndR: [number, number]; pointEndL: [number, number]; pointStartL: [number, number]; }} afl
		 * @param {number} px
		 * @param {number} py
		 */
		function processRounded0CornerAfl(afl, px, py) {
			const arg = afl.arg;
			if (afl.isvert) {
				const signedX = -copysign(fontsetting.weight_x, arg);
				const signedY = -copysign(fontsetting.weight_y, arg);
				if (afl.hv) {
					afl.pointStartR = [
						px + signedX / 2.0,
						py + signedY / 2.0
					];
					afl.pointStartL = [
						px - signedX / 2.0,
						py + signedY / 2.0
					];
				} else {
					const vx = afl.x;
					const vy = afl.y;
					const d = Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vy);
					afl.pointStartR = [
						px + signedY / (2.0 * Math.tan(arg)) - d,
						py + signedY / 2.0
					];
					afl.pointStartL = [
						px + signedY / (2.0 * Math.tan(arg)) + d,
						py + signedY / 2.0
					];
				}
			} else {
				let signedX;
				let signedY;
				if (Math.abs(arg / Math.PI) > 0.5)
					// leftwards
					signedX =  fontsetting.weight_x,
					signedY =  fontsetting.weight_y;
				else
					// rightwards
					signedX = -fontsetting.weight_x,
					signedY = -fontsetting.weight_y;
				if (afl.hv) {
					afl.pointStartR = [
						px + signedX / 2.0,
						py - signedY / 2.0
					];
					afl.pointStartL = [
						px + signedX / 2.0,
						py + signedY / 2.0
					];
				} else {
					const vx = afl.x;
					const vy = afl.y;
					const d = Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vx);
					afl.pointStartR = [
						px + signedX / 2.0,
						py + signedX * Math.tan(arg) / 2.0 + d
					];
					afl.pointStartL = [
						px + signedX / 2.0,
						py + signedX * Math.tan(arg) / 2.0 - d
					];
				}
			}
		}
	}
	/**
	 * @param {Record<string, SlimGlyphData>} database
	 * @param {string} glyphname
	 * @param {number} default_
	 * @param {number} dx
	 */
	function getGlyphWidth(database, glyphname, default_, dx) {
		dx = dx || 0.0;
		if (/\/[cC]ombining$/.test(glyphname))
			return 0;
		const glyphdata = database[glyphname];
		if (!("width" in glyphdata))
			return default_;
		return parsePosStr(glyphdata.width, "w") + dx;
	}
	/**
	 * @param {Record<string, SlimGlyphData>} database
	 * @param {string} c
	 */
	function char2glyphname(database, c) {
		const name = `uni${c.codePointAt(0).toString(16).padStart(4, "0")}`;
		return database[name] ? name : ".notdef";
	}
	/**
	 * @param {string} string
	 * @param {Record<string, SlimGlyphData>} [database]
	 * @returns {RenderedText}
	 */
	const renderText = (string, database = slimDatabase) => {
		/** @type {RenderedGlyph[]} */
		const glyphs = [];
		let offsetX = 0.0;
		for (const char of string) {
			const c = char2glyphname(database, char);
			const [slim_d, advanceWidth] = slim2pathd(database, c);
			glyphs.push({
				dList: slim_d,
				advanceWidth,
				offsetX,
			});
			offsetX += advanceWidth;
		}
		return {
			glyphs,
			height: fontsetting.topBearing + fontsetting.ascender + fontsetting.descender + fontsetting.bottomBearing,
			width: offsetX,
		};
	}
	/**
	 * @param {string} string
	 * @param {Record<string, SlimGlyphData>} [database]
	 * @returns {string}
	 */
	const renderTextSvg = (string, database = slimDatabase) => {
		const { glyphs, width: svglist_x, height: lineHeight } = renderText(string, database);
		const g_elems = glyphs.map(({ dList, offsetX }) => `<g transform="translate(${offsetX},0)">${dList.map((d) => `<path d="${d}" />`).join("")}</g>`);
		return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${svglist_x} ${lineHeight}" preserveAspectRatio="xMinYMid meet" id="svg">${g_elems.join("")}</svg>`;
	}

	return { renderText, renderTextSvg };
};
