import slimDatabase from "./slim_db.js";
import type { SlimGlyphData } from "./slim_db.js";

export interface FontSetting {
	weight_x: number;
	weight_y: number;
	space_x: number;
	descender: number;
	ascender: number;
	xHeight: number;
	topBearing: number;
	bottomBearing: number;
}

export interface RenderedGlyph {
	dList: string[];
	offsetX: number;
	advanceWidth: number;
}
export interface RenderedText {
	glyphs: RenderedGlyph[];
	width: number;
	height: number;
}

export class SlimError extends Error {
	static {
		this.prototype.name = "SlimError";
	}
}


export const setValues: (map: FontSetting) => {
	renderText: (string: string) => RenderedText;
	renderTextSvg: (string: string) => string;
} = (fontsetting) => {
	const vertpos: Record<string, number> = {
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
	const unit_dict: Record<string, number> = {
		"x": fontsetting.weight_x,
		"y": fontsetting.weight_y,
		"w": fontsetting.space_x + fontsetting.weight_x,
		"W": fontsetting.space_x + fontsetting.weight_x + Math.abs(fontsetting.weight_x - fontsetting.weight_y),
		"m": fontsetting.ascender
	};
	const radius_inner = fontsetting.space_x / 2.0;
	const radius_outer = fontsetting.weight_x + radius_inner;
	function horipos (n: number) {
		return (fontsetting.space_x + fontsetting.weight_x) * (n + 0.5);
	}
	function parsePosStr(str: string, default_unit = "w") {
		if (/^\d/.test(str)) str = `+${str}`;
		let res = 0.0;
		const pattern = /([+-][0-9.]+)([xywmW]?)/y;
		while (pattern.lastIndex < str.length) {
			const mobj = pattern.exec(str);
			if (!mobj) throw new SlimError(`syntax error in parsing position: ${str}`);
			const [, factor, unit] = mobj;
			res += parseFloat(factor) * unit_dict[unit || default_unit];
		}
		return res;
	}
	function pathCorner(xScale: number, yScale: number, x: number, y: number): {
		vert_outer: [number, number];
		vert_inner: [number, number];
		hori_outer: [number, number];
		hori_inner: [number, number];
		isnotinv: boolean;
		path: string;
	} {
		const vert_outer: [number, number] = [
			xScale * (- fontsetting.weight_x / 2.0) + x,
			yScale * (radius_outer - fontsetting.weight_y / 2.0) + y
		];
		const vert_inner: [number, number] = [
			xScale * (  fontsetting.weight_x / 2.0) + x,
			yScale * (radius_inner + fontsetting.weight_y / 2.0) + y
		];
		const hori_outer: [number, number] = [
			xScale * (radius_outer - fontsetting.weight_x / 2.0) + x,
			yScale * (- fontsetting.weight_y / 2.0) + y
		];
		const hori_inner: [number, number] = [
			xScale * (radius_outer - fontsetting.weight_x / 2.0) + x,
			yScale * (  fontsetting.weight_y / 2.0) + y
		];
		const isnotinv = xScale * yScale > 0;
		return {
			vert_outer,
			vert_inner,
			hori_outer,
			hori_inner,
			isnotinv,
			path: [
				"M",
				...vert_outer,
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
			].join(" "),
		};
	}
	const typdic: Record<string, 0 | 1 | 2> = {
		"s": 0,
		"r": 1,
		"b": 2
	};
	function slimParsepoint(slimpoint: string, dx: number, dy: number): [x: number, y: number, bety: 0 | 1 | 2, afty: 0 | 1 | 2] {
		dx = dx || 0.0;
		dy = dy || 0.0;
		const mobj = slimpoint.match(/^([srb]{0,2})([tbxdmgfyMTB])([^,]*),([^,]+)$/);
		if (!mobj) throw new SlimError(`syntax error: ${slimpoint}`);
		const [, typ, pos, y, x] = mobj;
		const typlen = typ.length;
		let bety: 0 | 1 | 2;
		let afty: 0 | 1 | 2;
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
	type SlimLineEnding =
		| { type: "0" }
		| { type: "1" }
		| {
			type: "override";
			pointL: [number, number];
			pointR: [number, number];
		};

	class SlimLine {
		readonly startX: number;
		readonly startY: number;
		readonly endX: number;
		readonly endY: number;
		readonly vx: number;
		readonly vy: number;
		readonly arg: number;
		readonly isvert: boolean;
		readonly hv: 0 | 1 | 2;
		startEnding: SlimLineEnding;
		endEnding: SlimLineEnding;
		constructor(p1x: number, p1y: number, p2x: number, p2y: number) {
			const vx = p2x - p1x;
			const vy = p2y - p1y;
			const arg = Math.atan2(vy, vx);
			const isvert = Math.abs(vx) < Math.abs(vy);
			const hv = vy === 0 ? 2 : vx === 0 ? 1 : 0;
			this.startX = p1x;
			this.startY = p1y;
			this.endX = p2x;
			this.endY = p2y;
			this.vx = vx;
			this.vy = vy;
			this.arg = arg;
			this.isvert = isvert;
			this.hv = hv;
			this.startEnding = {} as SlimLineEnding;
			this.endEnding = {} as SlimLineEnding;
		}

		calcPointStartRL(): [pointStartR: [number, number], pointStartL: [number, number]] {
			switch (this.startEnding.type) {
				case "override":
					return [this.startEnding.pointR, this.startEnding.pointL];
				case "0": {
					const { startX: px, startY: py } = this;
					const [dx1, dy1, dx2, dy2] = this.getOffset0();
					return [
						[px - dx1 - dx2, py - dy1 - dy2],
						[px - dx1 + dx2, py - dy1 + dy2],
					];
				}
				case "1": {
					const { startX: px, startY: py } = this;
					const [dx2, dy2] = this.getOffset1();
					return [
						[px - dx2, py - dy2],
						[px + dx2, py + dy2],
					];
				}
			}
		}
		calcPointEndRL(): [pointEndR: [number, number], pointEndL: [number, number]] {
			switch (this.endEnding.type) {
				case "override":
					return [this.endEnding.pointR, this.endEnding.pointL];
				case "0": {
					const { endX: px, endY: py } = this;
					const [dx1, dy1, dx2, dy2] = this.getOffset0();
					return [
						[px + dx1 - dx2, py + dy1 - dy2],
						[px + dx1 + dx2, py + dy1 + dy2],
					];
				}
				case "1": {
					const { endX: px, endY: py } = this;
					const [dx2, dy2] = this.getOffset1();
					return [
						[px - dx2, py - dy2],
						[px + dx2, py + dy2],
					];
				}
			}
		}
		getOffset0(): [dx1: number, dy1: number, dx2: number, dy2: number] {
			const { arg } = this;
			if (this.isvert) {
				const sign = this.vy < 0 ? -1 : 1;
				const signedX = sign * fontsetting.weight_x;
				const signedY = sign * fontsetting.weight_y;
				if (this.hv) {
					return [0, signedY / 2.0, signedX / 2.0, 0];
				} else {
					const { vx, vy } = this;
					const d = Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vy);
					return [
						signedY / (2.0 * Math.tan(arg)),
						signedY / 2.0,
						d,
						0
					];
				}
			} else {
				const sign = this.vx < 0 ? -1 : 1;
				const signedX = sign * fontsetting.weight_x;
				const signedY = sign * fontsetting.weight_y;
				if (this.hv) {
					return [signedX / 2.0, 0, 0, -signedY / 2.0];
				} else {
					const { vx, vy } = this;
					const d = Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vx);
					return [
						signedX / 2.0,
						signedX * Math.tan(arg) / 2.0,
						0,
						-d
					];
				}
			}
		}
		getOffset1(): [dx2: number, dy2: number] {
			const { vx, vy } = this;
			const k = 2.0 * Math.hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx);
			const dx2 = fontsetting.weight_x ** 2 * +vy / k;
			const dy2 = fontsetting.weight_y ** 2 * -vx / k;
			return [dx2, dy2];
		}
	}
	function slim2pathd(database: Record<string, SlimGlyphData>, glyphname: string, dx = 0.0, dy = 0.0): [d: string[], width: number] {
		const glyphdata = database[glyphname];
		const slimdata = glyphdata.slim;
		const slim_d: string[] = [];
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
			const slimLines: SlimLine[] = [];
			for (let j = 0; j < pointc - 1; j++) {
				const [p1x, p1y] = slimpoints[j];
				const [p2x, p2y] = slimpoints[j + 1];
				slimLines.push(new SlimLine(p1x, p1y, p2x, p2y));
			}
			slimpoints.forEach(([px, py, pbety, pafty], j) => {
				const bel = j !== 0          ? slimLines[j - 1] : null;
				const afl = j !== pointc - 1 ? slimLines[j]     : null;
				if (pbety !== 1 && pafty !== 1) {
					if (bel) {
						bel.endEnding = pbety === 2 ? { type: "1" } : { type: "0" };
					}
					if (afl) {
						afl.startEnding = pafty === 2 ? { type: "1" } : { type: "0" };
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
				if (pbety === 1 && pafty === 1 && bel && afl && bel.hv && afl.hv && bel.hv !== afl.hv) {
					//corner
					const result = processRounded2Corner(bel, afl);
					slim_d.push(result.path);
					bel.endEnding = {
						type: "override",
						pointL: result.pointEndL,
						pointR: result.pointEndR,
					};
					afl.startEnding = {
						type: "override",
						pointL: result.pointStartL,
						pointR: result.pointStartR,
					};
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
					bel.endEnding = { type: "1" };
				}
				if (afl) {
					afl.startEnding = { type: "1" };
				}
			});
			for (const line of slimLines) {
				const [pointStartR, pointStartL] = line.calcPointStartRL();
				const [pointEndR, pointEndL] = line.calcPointEndRL();
				slim_d.push([
					"M",
					pointStartR.join(","),
					pointEndR.join(","),
					pointEndL.join(","),
					pointStartL.join(","),
					"z"
				].join(" "));
			}
		}
		return [slim_d, getGlyphWidth(database, glyphname, max_w, dx)];
	}

	function processRounded2Corner(bel: SlimLine, afl: SlimLine): {
		path: string;
		pointEndR: [number, number];
		pointEndL: [number, number];
		pointStartR: [number, number];
		pointStartL: [number, number];
	} {
		const { endX: px, endY: py } = bel;
		if (px !== afl.startX || py !== afl.startY) {
			throw new SlimError(`assertion failed: (${px}, ${py}) !== (${afl.startX}, ${afl.startY})`);
		}
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
		else
			throw new SlimError(`unexpected corner: ${arg1}, ${arg2}`);
		const { path, vert_outer, vert_inner, hori_outer, hori_inner, isnotinv } = pathCorner(xs, ys, px, py);
		if (bel.hv === 1) {
			//vert -> hori
			if (isnotinv) {
				//left-top or right-bottom corner
				return {
					path,
					pointEndR: vert_inner,
					pointEndL: vert_outer,
					pointStartR: hori_inner,
					pointStartL: hori_outer,
				};
			} else {
				//left-bottom or right-top corner
				return {
					path,
					pointEndR: vert_outer,
					pointEndL: vert_inner,
					pointStartR: hori_outer,
					pointStartL: hori_inner,
				};
			}
		} else {
			//hori -> vert
			if (isnotinv) {
				//left-top or right-bottom corner
				return {
					path,
					pointEndR: hori_outer,
					pointEndL: hori_inner,
					pointStartR: vert_outer,
					pointStartL: vert_inner,
				};
			} else {
				//left-bottom or right-top corner
				return {
					path,
					pointEndR: hori_inner,
					pointEndL: hori_outer,
					pointStartR: vert_inner,
					pointStartL: vert_outer,
				};
			}
		}
	}

	function getGlyphWidth(database: Record<string, SlimGlyphData>, glyphname: string, default_: number, dx: number) {
		dx = dx || 0.0;
		if (/\/[cC]ombining$/.test(glyphname))
			return 0;
		const { width } = database[glyphname];
		if (width === undefined)
			return default_;
		return parsePosStr(width, "w") + dx;
	}
	function char2glyphname(database: Record<string, SlimGlyphData>, c: string) {
		const name = `uni${c.codePointAt(0)!.toString(16).padStart(4, "0")}`;
		return database[name] ? name : ".notdef";
	}
	const renderText = (string: string, database: Record<string, SlimGlyphData> = slimDatabase): RenderedText => {
		const glyphs: RenderedGlyph[] = [];
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
	const renderTextSvg = (string: string, database: Record<string, SlimGlyphData> = slimDatabase): string => {
		const { glyphs, width: svglist_x, height: lineHeight } = renderText(string, database);
		const g_elems = glyphs.map(({ dList, offsetX }) => `<g transform="translate(${offsetX},0)">${dList.map((d) => `<path d="${d}" />`).join("")}</g>`);
		return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${svglist_x} ${lineHeight}" preserveAspectRatio="xMinYMid meet" id="svg">${g_elems.join("")}</svg>`;
	}

	return { renderText, renderTextSvg };
};
