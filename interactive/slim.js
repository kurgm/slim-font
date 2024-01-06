if (!("ku6goma" in this)) ku6goma = {};
if (!ku6goma.slim) ku6goma.slim = {};
(function (slim) {
	slim.SlimError = function (message) {
		this.message = message;
	};
	slim.SlimError.prototype.toString = function () {
		return this.message;
	};
	if (!slim.database) slim.database = {};
	function hypot (x, y) {
		return Math.sqrt(x * x + y * y);
	}
	function copysign (a, b) {
		return a * b < 0 ? -a : a;
	}
	var fontsetting = {
		weight_x: 60.0,
		weight_y: 50.0,
		space_x: 90.0,
		descender: 200.0,
		ascender: 700.0,
		xHeight: 500.0,
		topBearing: 100.0,
		bottomBearing: 100.0
	};
	var vertpos = {
	};
	var unit_dict = {
	};
	var radius_inner, radius_outer;
	slim.setValues = function (map) {
		for(var i in map) fontsetting[i] = map[i];
		initValues();
	};
	function initValues() {
		var m = fontsetting;
		vertpos = {
			"t": m.topBearing + m.weight_y / 2.0,
			"b": m.topBearing + m.ascender - m.weight_y / 2.0,
			"x": m.topBearing + m.ascender - m.xHeight + m.weight_y / 2.0,
			"d": m.topBearing + m.ascender + m.descender - m.weight_y / 2.0,
			"m": m.topBearing + m.ascender - m.xHeight / 2.0,
			"M": m.topBearing + m.ascender / 2.0,
			"T": m.weight_y / 2.0,
			"B": m.topBearing + m.ascender + m.descender + m.bottomBearing - m.weight_y / 2.0,
			"g": m.topBearing + m.ascender + (m.descender - m.xHeight) / 2.0,
			"f": m.topBearing + (m.ascender - m.xHeight) / 2.0
		};
		unit_dict = {
			"x": m.weight_x,
			"y": m.weight_y,
			"w": m.space_x + m.weight_x,
			"W": m.space_x + m.weight_x + Math.abs(m.weight_x - m.weight_y),
			"m": m.ascender
		};
		radius_inner = m.space_x / 2.0;
		radius_outer = m.weight_x + radius_inner;
	}
	initValues();
	function horipos (n) {
		return (fontsetting.space_x + fontsetting.weight_x) * (n + 0.5);
	}
	function parsePosStr(str, default_unit) {
		default_unit = default_unit || "w";
		if (/^\d/.test(str)) str = "+" + str;
		var res = 0.0,
		    pattern = /^([\+\-][0-9.]+)([xywmW]?)/;
		for (var i = 0, l = str.length; i < l; i += mobj[0].length) {
			var mobj = str.substring(i).match(pattern);
			if (!mobj) throw new slim.SlimError("syntax error in parsing position: " + str);
			res += parseFloat(mobj[1]) * unit_dict[mobj[2] || default_unit];
		}
		return res;
	}
	function pathCorner(xScale, yScale, x, y) {
		var isnotinv = xScale * yScale > 0;
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
	var typdic = {
		"s": 0,
		"r": 1,
		"b": 2
	};
	function slimParsepoint(slimpoint, dx, dy) {
		dx = dx || 0.0;
		dy = dy || 0.0;
		var mobj = slimpoint.match(/^([srb]{0,2})([tbxdmgfyMTB])([^,]*),([^,]+)$/);
		if (!mobj) throw new slim.SlimError("syntax error: " + slimpoint);
		var typ = mobj[1];
		var typlen = typ.length;
		var bety, afty;
		if (typlen === 0)
			bety = afty = 0;
		else if (typlen === 1)
			bety = afty = typdic[typ];
		else
			bety = typdic[typ[0]], afty = typdic[typ[1]];
		return [
			parsePosStr(mobj[4] + "+0.5w", "w") + dx,
			vertpos[mobj[2]] + parsePosStr(mobj[3], "y") + dy,
			bety,
			afty
		];
	}
	function slim2pathd(database, glyphname, dx, dy) {
		dx = dx || 0.0;
		dy = dy || 0.0;
		var glyphdata = database[glyphname];
		var slimdata = glyphdata.slim;
		var slim_d = [];
		var max_w = horipos(-1);
		for (var i = 0, l = slimdata.length; i < l; i++) {
			var slimelem = slimdata[i];
			if (slimelem.charAt(0) === "#") {
				var params = slimelem.split("#");
				var name = params[1];
				if (!database[name]) throw new slim.SlimError("referred glyph was not found: " + name);
				if (name === glyphname) throw new slim.SlimError("referring itself: " + name);
				var lenparams = params.length;
				if (lenparams >= 4)
					var new_dy = params[3];
				else
					var new_dy = "0";
				if (lenparams >= 3)
					var new_dx = params[2];
				else
					var new_dx = "0";
				new_dx = parsePosStr(new_dx, "w");
				new_dy = parsePosStr(new_dy, "y");
				var pd = slim2pathd(database, name, dx + new_dx, dy + new_dy);
				var new_pathd = pd[0], new_glyphw = pd[1];
				slim_d = slim_d.concat(new_pathd);
				max_w = Math.max(max_w, new_glyphw);
				continue;
			}
			var slimpoints = slimelem.split(/\s+/);
			var pointc = slimpoints.length;
			for (var j = 0; j < pointc; j++) {
				var slimpoint = slimParsepoint(slimpoints[j], dx, dy);
				max_w = Math.max(max_w, slimpoint[0] + (fontsetting.weight_x + fontsetting.space_x) / 2.0);
				slimpoints[j] = slimpoint;
			}
			var line = [];
			for (var j = 0; j < pointc - 1; j++) {
				var point1 = slimpoints[j],
				    point2 = slimpoints[j + 1];
				var arg = Math.atan2(point2[1] - point1[1], point2[0] - point1[0]),
				    arg2 = Math.abs(arg / Math.PI),
				    isvert = (0.25 < arg2) && (arg2 < 0.75);
				if (arg2 === 0.5)
					var hv = 1; //vert
				else if (arg2 === 0.0 || arg2 === 1.0)
					var hv = 2; //hori
				else
					var hv = 0;
				line.push({
					"x": point2[0] - point1[0],
					"y": point2[1] - point1[1],
					"arg": arg,
					"isvert": isvert,
					"hv": hv,
					"points": [[], [], [], []]
				});
			}
			for (var j = 0; j < pointc; j++) {
				var p = slimpoints[j];
				var bel = j !== 0          ? line[j - 1] : null,
				    afl = j !== pointc - 1 ? line[j]     : null;
				var rounded = 0;
				if (p[2] === 1 && p[3] === 1) {
					if (bel && afl) {
						var hv1 = bel.hv,
						    hv2 = afl.hv;
						if (hv1 && hv2) {
							if (hv1 !== hv2)
								rounded = 2; //corner
							else
								rounded = 1;
						} else
							rounded = 1; //round
					} else
						rounded = 1; //round
				} else if (p[2] === 1 || p[3] === 1)
					rounded = 1;
				else
					rounded = 0;
				if (rounded === 2) {
					//corner
					var arg1 = bel.arg / Math.PI,
					    arg2 = afl.arg / Math.PI;
					var xs, ys;
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
					slim_d.push(pathCorner(xs, ys, p[0], p[1]));
					var vert_outer = [
						xs * (- fontsetting.weight_x / 2.0) + p[0],
						ys * (radius_outer - fontsetting.weight_y / 2.0) + p[1]
					],  vert_inner = [
						xs * (  fontsetting.weight_x / 2.0) + p[0],
						ys * (radius_inner + fontsetting.weight_y / 2.0) + p[1]
					],  hori_outer = [
						xs * (radius_outer - fontsetting.weight_x / 2.0) + p[0],
						ys * (- fontsetting.weight_y / 2.0) + p[1]
					],  hori_inner = [
						xs * (radius_outer - fontsetting.weight_x / 2.0) + p[0],
						ys * (  fontsetting.weight_y / 2.0) + p[1]
					];
					if (hv1 === 1) {
						//vert -> hori
						if (xs * ys > 0) {
							//left-top or right-bottom corner
							bel.points[1] = vert_inner, bel.points[2] = vert_outer;
							afl.points[0] = hori_inner, afl.points[3] = hori_outer;
						} else {
							//left-bottom or right-top corner
							bel.points[1] = vert_outer, bel.points[2] = vert_inner;
							afl.points[0] = hori_outer, afl.points[3] = hori_inner;
						}
					} else {
						//hori -> vert
						if (xs * ys > 0) {
							//left-top or right-bottom corner
							bel.points[1] = hori_outer, bel.points[2] = hori_inner;
							afl.points[0] = vert_outer, afl.points[3] = vert_inner;
						} else {
							//left-bottom or right-top corner
							bel.points[1] = hori_inner, bel.points[2] = hori_outer;
							afl.points[0] = vert_inner, afl.points[3] = vert_outer;
						}
					}
				} else {
					if (rounded === 1)
						//round stroke
						slim_d.push([
							"M",
							p[0] - fontsetting.weight_x / 2.0,
							p[1],
							"a",
							fontsetting.weight_x / 2.0, fontsetting.weight_y / 2.0,
							"0", "0", "0",
							fontsetting.weight_x, "0",
							fontsetting.weight_x / 2.0, fontsetting.weight_y / 2.0,
							"0", "0", "0",
							-fontsetting.weight_x, "0",
							"z"
						].join(" "));
					if (bel && (p[2] === 2 || rounded === 1)) {
						var vx = bel.x, vy = bel.y;
						var k = 2.0 * hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx);
						var dx2 = Math.pow(fontsetting.weight_x, 2) * vy / k,
						    dy2 = Math.pow(fontsetting.weight_y, 2) * vx / k;
						bel.points[1] = [
							p[0] - dx2,
							p[1] + dy2
						];
						bel.points[2] = [
							p[0] + dx2,
							p[1] - dy2
						];
					}
					if (afl && (p[3] === 2 || rounded === 1)) {
						var vx = afl.x, vy = afl.y;
						var k = 2.0 * hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx);
						var dx2 = Math.pow(fontsetting.weight_x, 2) * vy / k,
						    dy2 = Math.pow(fontsetting.weight_y, 2) * vx / k;
						afl.points[0] = [
							p[0] - dx2,
							p[1] + dy2
						];
						afl.points[3] = [
							p[0] + dx2,
							p[1] - dy2
						];
					}
					if (rounded === 0) {
						//not rounded
						if (bel && p[2] === 0) {
							var arg = bel.arg;
							if (bel.isvert) {
								var signedX = copysign(fontsetting.weight_x, arg),
								    signedY = copysign(fontsetting.weight_y, arg);
								if (bel.hv) {
									bel.points[1] = [
										p[0] - signedX / 2.0,
										p[1] + signedY / 2.0
									];
									bel.points[2] = [
										p[0] + signedX / 2.0,
										p[1] + signedY / 2.0
									];
								} else {
									var vx = bel.x, vy = bel.y;
									var d = hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vy);
									bel.points[1] = [
										p[0] + signedY / (2.0 * Math.tan(arg)) - d,
										p[1] + signedY / 2.0
									];
									bel.points[2] = [
										p[0] + signedY / (2.0 * Math.tan(arg)) + d,
										p[1] + signedY / 2.0
									];
								}
							} else {
								var signedX, signedY;
								if (Math.abs(arg / Math.PI) > 0.5)
									// leftwards
									signedX = -fontsetting.weight_x,
									signedY = -fontsetting.weight_y;
								else
									// rightwards
									signedX =  fontsetting.weight_x,
									signedY =  fontsetting.weight_y;
								if (bel.hv) {
									bel.points[1] = [
										p[0] + signedX / 2.0,
										p[1] + signedY / 2.0
									];
									bel.points[2] = [
										p[0] + signedX / 2.0,
										p[1] - signedY / 2.0
									];
								} else {
									var vx = bel.x, vy = bel.y;
									var d = hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vx);
									bel.points[1] = [
										p[0] + signedX / 2.0,
										p[1] + signedX * Math.tan(arg) / 2.0 + d
									];
									bel.points[2] = [
										p[0] + signedX / 2.0,
										p[1] + signedX * Math.tan(arg) / 2.0 - d
									];
								}
							}
						}
						if (afl && p[3] === 0) {
							var arg = afl.arg;
							if (afl.isvert) {
								var signedX = -copysign(fontsetting.weight_x, arg),
								    signedY = -copysign(fontsetting.weight_y, arg);
								if (afl.hv) {
									afl.points[0] = [
										p[0] + signedX / 2.0,
										p[1] + signedY / 2.0
									];
									afl.points[3] = [
										p[0] - signedX / 2.0,
										p[1] + signedY / 2.0
									];
								} else {
									var vx = afl.x, vy = afl.y;
									var d = hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vy);
									afl.points[0] = [
										p[0] + signedY / (2.0 * Math.tan(arg)) - d,
										p[1] + signedY / 2.0
									];
									afl.points[3] = [
										p[0] + signedY / (2.0 * Math.tan(arg)) + d,
										p[1] + signedY / 2.0
									];
								}
							} else {
								var signedX, signedY;
								if (Math.abs(arg / Math.PI) > 0.5)
									// leftwards
									signedX =  fontsetting.weight_x,
									signedY =  fontsetting.weight_y;
								else
									// rightwards
									signedX = -fontsetting.weight_x,
									signedY = -fontsetting.weight_y;
								if (afl.hv) {
									afl.points[0] = [
										p[0] + signedX / 2.0,
										p[1] - signedY / 2.0
									];
									afl.points[3] = [
										p[0] + signedX / 2.0,
										p[1] + signedY / 2.0
									];
								} else {
									var vx = afl.x, vy = afl.y;
									var d = hypot(fontsetting.weight_x * vy, fontsetting.weight_y * vx) / (2.0 * vx);
									afl.points[0] = [
										p[0] + signedX / 2.0,
										p[1] + signedX * Math.tan(arg) / 2.0 + d
									];
									afl.points[3] = [
										p[0] + signedX / 2.0,
										p[1] + signedX * Math.tan(arg) / 2.0 - d
									];
								}
							}
						}
						if (pointc === 1)
							slim_d.push([
								"M",
								p[0] - fontsetting.weight_x / 2, p[1] - fontsetting.weight_y / 2,
								p[0] + fontsetting.weight_x / 2, p[1] - fontsetting.weight_y / 2,
								p[0] + fontsetting.weight_x / 2, p[1] + fontsetting.weight_y / 2,
								p[0] - fontsetting.weight_x / 2, p[1] + fontsetting.weight_y / 2,
								"z"
							].join(" "));
					}
				}
			}
			for (var j = 0, jl = line.length; j < jl; j++) {
				var lstr = "M ";
				for (var k = 0, kl = line[j].points.length; k < kl; k++)
					lstr += line[j].points[k].join(",") + " ";
				lstr += "z";
				slim_d.push(lstr);
			}
		}
		return [slim_d, getGlyphWidth(database, glyphname, max_w, dx)];
	}
	function slim2svgg(database, glyphname, properties) {
		properties = properties || "";
		var pd = slim2pathd(database, glyphname);
		var slim_d = pd[0], glyph_w = pd[1];
		var glyphdata = database[glyphname];
		glyphdata.id = glyphdata.id || glyphname.split("/").join("_");
		var buffer = "";
		buffer += '<g id="' + glyphdata.id + '"' + properties + '>';
		for (var i = 0, l = slim_d.length; i < l; i++)
			buffer += '<path d="' + slim_d[i] + '" />';
		buffer += "</g>";
		return [buffer, glyph_w];
	}
	function getGlyphWidth(database, glyphname, default_, dx) {
		dx = dx || 0.0;
		if (/\/[cC]ombining$/.test(glyphname))
			return 0;
		var glyphdata = database[glyphname];
		if ("width" in glyphdata)
			return parsePosStr(glyphdata.width, "w") + dx;
		else
			return default_;
	}
	function char2glyphname(c) {
		var u = c.charCodeAt(0).toString(16);
		while (u.length < 4)
			u = "0" + u;
		var name = "uni" + u;
		if (!slim.database[name])
			name = ".notdef";
		return name;
	}
	function exampleStringSvg(database, string) {
		if (typeof string === "undefined") string = "The quick brown fox jumps over the lazy dog.";
		var buffer = "";
		var svglist_x = 0.0;
		for (var i = 0, l = string.length; i < l; i++) {
			var c = char2glyphname(string.charAt(i));
			var glyphdata = database[c];
			var gg = slim2svgg(database, c, ' transform="translate(' + svglist_x + ',0)"');
			var g_elem = gg[0], glyph_w = gg[1];
			buffer += g_elem;
			svglist_x += glyph_w;
		}
		var lineHeight = fontsetting.topBearing + fontsetting.ascender + fontsetting.descender + fontsetting.bottomBearing;
		return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ' + 
		svglist_x + ' ' + lineHeight + '" preserveAspectRatio="xMinYMid meet" id="svg">' + buffer + '</svg>';
	}
	// for canvas
	slim.getPathD = function(string) {
		string = string || "";
		var pathd = [];
		var dx = 0.0;
		for (var i = 0, l = string.length; i < l; i++) {
			var c = char2glyphname(string.charAt(i));
			var pd = slim2pathd(slim.database, c, dx, 0);
			var slim_d = pd[0], glyph_w = pd[1];
			pathd = pathd.concat(slim_d);
			dx = glyph_w;
		}
		var lineHeight = fontsetting.topBearing + fontsetting.ascender + fontsetting.descender + fontsetting.bottomBearing;
		return [pathd, dx, lineHeight];
	};
	slim.getSvg = function(string) {
		return exampleStringSvg(slim.database, string || "");
	};
})(ku6goma.slim);