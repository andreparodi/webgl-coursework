"use strict"

var canvas;
var gl;
var points = [];
var outlinePoints = [];
var bufferId;

var thetaLoc;
var colorLoc;

var params;

var Params = function () {
	this.tesselation = 4;
	this.theta = 0;
	this.outline = true;
	this.color = [ 28, 123, 207 ];
	this.shape = "triangle";
}

function init() {
	console.log("in init");

	initParamsControls();

	canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL was not initialized correctly");
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0, 0, 0, 1.0);

	var program = initShaders(gl, "vertex-shader-rotation", "fragment-shader-black");
	gl.useProgram(program);

	bufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, 1000000000, gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	thetaLoc = gl.getUniformLocation(program, "theta");
	colorLoc = gl.getUniformLocation(program, "color");

	render();

}

function initParamsControls() {
		params = new Params();
	var gui = new dat.GUI();
	
	var tesselationController = gui.add(params, "tesselation", 0, 10).step(1);
	tesselationController.onFinishChange(function(value) {
		params.tesselation = value;
		render();
	});
	
	var thetaController = gui.add(params, "theta", 0, 360).step(1).name('rotation');
	thetaController.onFinishChange(function(value) {
		params.theta = value * Math.PI / 180;
		render();
	});
	
	var outlineController = gui.add(params, "outline");
	outlineController.onFinishChange(function(value) {
		params.outline = value;
		render();
	});
	
	var colorController = gui.addColor(params, "color");
	colorController.onFinishChange(function(value) {
		params.color = value;
		render();
	});
	colorController.onChange(function(value) {
		params.color = value;
		render();
	});

	var shapeController = gui.add(params, "shape", ["triangle", "square"]);
	shapeController.onFinishChange(function(value) {
		params.shape = value;
		render();
	})
}

function render() {
	if (params.shape === "triangle") {
		renderTriangle();
	} else if (params.shape === "square") {
		renderSquare();
	}
}

function renderSquare() {

	var vertices = [
		vec2(-0.70711, -0.70711),
		vec2(-0.70711, 0.70711),
		vec2(0.70711, 0.70711),
		vec2(0.70711, -0.70711),
	]

	cleanPointArrays();

	divideSquare(vertices[0], vertices[1], vertices[2], vertices[3], params.tesselation);

	gl.uniform1f(thetaLoc, params.theta);
	gl.uniform4fv(colorLoc, colorArrayFromParams());

	if (params.outline) {
		renderPointsAsLines();
	} else {
		renderPointsAsTriangles();
	}

	cleanPointArrays();
}

function renderTriangle() {
	
	var vertices = [
		vec2(-0.866, -0.5),
		vec2(0, 1),
		vec2(0.866, -0.5)
	];

	cleanPointArrays();

	divideTriangle(vertices[0], vertices[1], vertices[2], params.tesselation);
	
    gl.uniform1f(thetaLoc, params.theta);
    gl.uniform4fv(colorLoc, colorArrayFromParams());

	if (params.outline) {
		renderPointsAsLines();
	} else {
		renderPointsAsTriangles();
	}

	cleanPointArrays();
}

function colorArrayFromParams() {
	return flatten(vec4(params.color[0]/255,params.color[1]/255,params.color[2]/255,1.0))
}

function renderPointsAsLines() {
	var flattenedPoints = flatten(outlinePoints);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flattenedPoints);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.LINES, 0, outlinePoints.length);
}

function renderPointsAsTriangles() {

	var flattenedPoints = flatten(points);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flattenedPoints);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

function cleanPointArrays() {
	points = [];
	outlinePoints = [];
}

function divideTriangle(a, b, c, count) {
	if (count === 0) {
		triangle(a, b, c);
	} else {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        count--;

        divideTriangle(a, ab, ac, count);
        divideTriangle(c, ac, bc, count);
        divideTriangle(b, bc, ab, count);
        divideTriangle(ab, bc, ac, count);
	}
}

function divideSquare(a, b, c, d, count) {
	if (count === 0) {
		square(a, b, c, d);
	} else {
		var ab = mix (a, b, 0.5);
		var bc = mix (b, c, 0.5);
		var cd = mix (c, d, 0.5);
		var da = mix (d, a, 0.5);
		var center = mix(a, c, 0.5);

		count--;

		divideSquare(a, ab, center, da, count);
		divideSquare(ab, b, bc, center, count);
		divideSquare(center, bc, c, cd, count);
		divideSquare(da, center, cd, d, count);
	}
}

function triangle(a, b, c) {
	points.push(a, b, c);
	outlinePoints.push(a, b, b, c, c, a);
}

function square(a, b, c, d) {
	points.push(a, b, c, a, c, d);
	outlinePoints.push(a, b, b, c, c, d, d, a);
}

window.onload = init;