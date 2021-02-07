/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/animejs/lib/anime.es.js":
/*!**********************************************!*\
  !*** ./node_modules/animejs/lib/anime.es.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/*
 * anime.js v3.2.1
 * (c) 2020 Julian Garnier
 * Released under the MIT license
 * animejs.com
 */

// Defaults

var defaultInstanceSettings = {
  update: null,
  begin: null,
  loopBegin: null,
  changeBegin: null,
  change: null,
  changeComplete: null,
  loopComplete: null,
  complete: null,
  loop: 1,
  direction: 'normal',
  autoplay: true,
  timelineOffset: 0
};

var defaultTweenSettings = {
  duration: 1000,
  delay: 0,
  endDelay: 0,
  easing: 'easeOutElastic(1, .5)',
  round: 0
};

var validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];

// Caching

var cache = {
  CSS: {},
  springs: {}
};

// Utils

function minMax(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

function applyArguments(func, args) {
  return func.apply(null, args);
}

var is = {
  arr: function (a) { return Array.isArray(a); },
  obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
  pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
  svg: function (a) { return a instanceof SVGElement; },
  inp: function (a) { return a instanceof HTMLInputElement; },
  dom: function (a) { return a.nodeType || is.svg(a); },
  str: function (a) { return typeof a === 'string'; },
  fnc: function (a) { return typeof a === 'function'; },
  und: function (a) { return typeof a === 'undefined'; },
  nil: function (a) { return is.und(a) || a === null; },
  hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
  rgb: function (a) { return /^rgb/.test(a); },
  hsl: function (a) { return /^hsl/.test(a); },
  col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
  key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; },
};

// Easings

function parseEasingParameters(string) {
  var match = /\(([^)]+)\)/.exec(string);
  return match ? match[1].split(',').map(function (p) { return parseFloat(p); }) : [];
}

// Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

function spring(string, duration) {

  var params = parseEasingParameters(string);
  var mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
  var stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
  var damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
  var velocity =  minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
  var w0 = Math.sqrt(stiffness / mass);
  var zeta = damping / (2 * Math.sqrt(stiffness * mass));
  var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  var a = 1;
  var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

  function solver(t) {
    var progress = duration ? (duration * t) / 1000 : t;
    if (zeta < 1) {
      progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
    } else {
      progress = (a + b * progress) * Math.exp(-progress * w0);
    }
    if (t === 0 || t === 1) { return t; }
    return 1 - progress;
  }

  function getDuration() {
    var cached = cache.springs[string];
    if (cached) { return cached; }
    var frame = 1/6;
    var elapsed = 0;
    var rest = 0;
    while(true) {
      elapsed += frame;
      if (solver(elapsed) === 1) {
        rest++;
        if (rest >= 16) { break; }
      } else {
        rest = 0;
      }
    }
    var duration = elapsed * frame * 1000;
    cache.springs[string] = duration;
    return duration;
  }

  return duration ? solver : getDuration;

}

// Basic steps easing implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function

function steps(steps) {
  if ( steps === void 0 ) steps = 10;

  return function (t) { return Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps); };
}

// BezierEasing https://github.com/gre/bezier-easing

var bezier = (function () {

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 }
  function C(aA1)      { return 3.0 * aA1 }

  function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT }
  function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) }

  function binarySubdivide(aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) { aB = currentT; } else { aA = currentT; }
    } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
    return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (var i = 0; i < 4; ++i) {
      var currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) { return aGuessT; }
      var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  function bezier(mX1, mY1, mX2, mY2) {

    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) { return; }
    var sampleValues = new Float32Array(kSplineTableSize);

    if (mX1 !== mY1 || mX2 !== mY2) {
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX(aX) {

      var intervalStart = 0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }

      --currentSample;

      var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;
      var initialSlope = getSlope(guessForT, mX1, mX2);

      if (initialSlope >= 0.001) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }

    }

    return function (x) {
      if (mX1 === mY1 && mX2 === mY2) { return x; }
      if (x === 0 || x === 1) { return x; }
      return calcBezier(getTForX(x), mY1, mY2);
    }

  }

  return bezier;

})();

var penner = (function () {

  // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

  var eases = { linear: function () { return function (t) { return t; }; } };

  var functionEasings = {
    Sine: function () { return function (t) { return 1 - Math.cos(t * Math.PI / 2); }; },
    Circ: function () { return function (t) { return 1 - Math.sqrt(1 - t * t); }; },
    Back: function () { return function (t) { return t * t * (3 * t - 2); }; },
    Bounce: function () { return function (t) {
      var pow2, b = 4;
      while (t < (( pow2 = Math.pow(2, --b)) - 1) / 11) {}
      return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow(( pow2 * 3 - 2 ) / 22 - t, 2)
    }; },
    Elastic: function (amplitude, period) {
      if ( amplitude === void 0 ) amplitude = 1;
      if ( period === void 0 ) period = .5;

      var a = minMax(amplitude, 1, 10);
      var p = minMax(period, .1, 2);
      return function (t) {
        return (t === 0 || t === 1) ? t : 
          -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
      }
    }
  };

  var baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

  baseEasings.forEach(function (name, i) {
    functionEasings[name] = function () { return function (t) { return Math.pow(t, i + 2); }; };
  });

  Object.keys(functionEasings).forEach(function (name) {
    var easeIn = functionEasings[name];
    eases['easeIn' + name] = easeIn;
    eases['easeOut' + name] = function (a, b) { return function (t) { return 1 - easeIn(a, b)(1 - t); }; };
    eases['easeInOut' + name] = function (a, b) { return function (t) { return t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 
      1 - easeIn(a, b)(t * -2 + 2) / 2; }; };
    eases['easeOutIn' + name] = function (a, b) { return function (t) { return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 : 
      (easeIn(a, b)(t * 2 - 1) + 1) / 2; }; };
  });

  return eases;

})();

function parseEasings(easing, duration) {
  if (is.fnc(easing)) { return easing; }
  var name = easing.split('(')[0];
  var ease = penner[name];
  var args = parseEasingParameters(easing);
  switch (name) {
    case 'spring' : return spring(easing, duration);
    case 'cubicBezier' : return applyArguments(bezier, args);
    case 'steps' : return applyArguments(steps, args);
    default : return applyArguments(ease, args);
  }
}

// Strings

function selectString(str) {
  try {
    var nodes = document.querySelectorAll(str);
    return nodes;
  } catch(e) {
    return;
  }
}

// Arrays

function filterArray(arr, callback) {
  var len = arr.length;
  var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
  var result = [];
  for (var i = 0; i < len; i++) {
    if (i in arr) {
      var val = arr[i];
      if (callback.call(thisArg, val, i, arr)) {
        result.push(val);
      }
    }
  }
  return result;
}

function flattenArray(arr) {
  return arr.reduce(function (a, b) { return a.concat(is.arr(b) ? flattenArray(b) : b); }, []);
}

function toArray(o) {
  if (is.arr(o)) { return o; }
  if (is.str(o)) { o = selectString(o) || o; }
  if (o instanceof NodeList || o instanceof HTMLCollection) { return [].slice.call(o); }
  return [o];
}

function arrayContains(arr, val) {
  return arr.some(function (a) { return a === val; });
}

// Objects

function cloneObject(o) {
  var clone = {};
  for (var p in o) { clone[p] = o[p]; }
  return clone;
}

function replaceObjectProps(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o1) { o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p]; }
  return o;
}

function mergeObjects(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o2) { o[p] = is.und(o1[p]) ? o2[p] : o1[p]; }
  return o;
}

// Colors

function rgbToRgba(rgbValue) {
  var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? ("rgba(" + (rgb[1]) + ",1)") : rgbValue;
}

function hexToRgba(hexValue) {
  var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  var hex = hexValue.replace(rgx, function (m, r, g, b) { return r + r + g + g + b + b; } );
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);
  return ("rgba(" + r + "," + g + "," + b + ",1)");
}

function hslToRgba(hslValue) {
  var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
  var h = parseInt(hsl[1], 10) / 360;
  var s = parseInt(hsl[2], 10) / 100;
  var l = parseInt(hsl[3], 10) / 100;
  var a = hsl[4] || 1;
  function hue2rgb(p, q, t) {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1/6) { return p + (q - p) * 6 * t; }
    if (t < 1/2) { return q; }
    if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
    return p;
  }
  var r, g, b;
  if (s == 0) {
    r = g = b = l;
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return ("rgba(" + (r * 255) + "," + (g * 255) + "," + (b * 255) + "," + a + ")");
}

function colorToRgb(val) {
  if (is.rgb(val)) { return rgbToRgba(val); }
  if (is.hex(val)) { return hexToRgba(val); }
  if (is.hsl(val)) { return hslToRgba(val); }
}

// Units

function getUnit(val) {
  var split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
  if (split) { return split[1]; }
}

function getTransformUnit(propName) {
  if (stringContains(propName, 'translate') || propName === 'perspective') { return 'px'; }
  if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) { return 'deg'; }
}

// Values

function getFunctionValue(val, animatable) {
  if (!is.fnc(val)) { return val; }
  return val(animatable.target, animatable.id, animatable.total);
}

function getAttribute(el, prop) {
  return el.getAttribute(prop);
}

function convertPxToUnit(el, value, unit) {
  var valueUnit = getUnit(value);
  if (arrayContains([unit, 'deg', 'rad', 'turn'], valueUnit)) { return value; }
  var cached = cache.CSS[value + unit];
  if (!is.und(cached)) { return cached; }
  var baseline = 100;
  var tempEl = document.createElement(el.tagName);
  var parentEl = (el.parentNode && (el.parentNode !== document)) ? el.parentNode : document.body;
  parentEl.appendChild(tempEl);
  tempEl.style.position = 'absolute';
  tempEl.style.width = baseline + unit;
  var factor = baseline / tempEl.offsetWidth;
  parentEl.removeChild(tempEl);
  var convertedUnit = factor * parseFloat(value);
  cache.CSS[value + unit] = convertedUnit;
  return convertedUnit;
}

function getCSSValue(el, prop, unit) {
  if (prop in el.style) {
    var uppercasePropName = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    var value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || '0';
    return unit ? convertPxToUnit(el, value, unit) : value;
  }
}

function getAnimationType(el, prop) {
  if (is.dom(el) && !is.inp(el) && (!is.nil(getAttribute(el, prop)) || (is.svg(el) && el[prop]))) { return 'attribute'; }
  if (is.dom(el) && arrayContains(validTransforms, prop)) { return 'transform'; }
  if (is.dom(el) && (prop !== 'transform' && getCSSValue(el, prop))) { return 'css'; }
  if (el[prop] != null) { return 'object'; }
}

function getElementTransforms(el) {
  if (!is.dom(el)) { return; }
  var str = el.style.transform || '';
  var reg  = /(\w+)\(([^)]*)\)/g;
  var transforms = new Map();
  var m; while (m = reg.exec(str)) { transforms.set(m[1], m[2]); }
  return transforms;
}

function getTransformValue(el, propName, animatable, unit) {
  var defaultVal = stringContains(propName, 'scale') ? 1 : 0 + getTransformUnit(propName);
  var value = getElementTransforms(el).get(propName) || defaultVal;
  if (animatable) {
    animatable.transforms.list.set(propName, value);
    animatable.transforms['last'] = propName;
  }
  return unit ? convertPxToUnit(el, value, unit) : value;
}

function getOriginalTargetValue(target, propName, unit, animatable) {
  switch (getAnimationType(target, propName)) {
    case 'transform': return getTransformValue(target, propName, animatable, unit);
    case 'css': return getCSSValue(target, propName, unit);
    case 'attribute': return getAttribute(target, propName);
    default: return target[propName] || 0;
  }
}

function getRelativeValue(to, from) {
  var operator = /^(\*=|\+=|-=)/.exec(to);
  if (!operator) { return to; }
  var u = getUnit(to) || 0;
  var x = parseFloat(from);
  var y = parseFloat(to.replace(operator[0], ''));
  switch (operator[0][0]) {
    case '+': return x + y + u;
    case '-': return x - y + u;
    case '*': return x * y + u;
  }
}

function validateValue(val, unit) {
  if (is.col(val)) { return colorToRgb(val); }
  if (/\s/g.test(val)) { return val; }
  var originalUnit = getUnit(val);
  var unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;
  if (unit) { return unitLess + unit; }
  return unitLess;
}

// getTotalLength() equivalent for circle, rect, polyline, polygon and line shapes
// adapted from https://gist.github.com/SebLambla/3e0550c496c236709744

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getCircleLength(el) {
  return Math.PI * 2 * getAttribute(el, 'r');
}

function getRectLength(el) {
  return (getAttribute(el, 'width') * 2) + (getAttribute(el, 'height') * 2);
}

function getLineLength(el) {
  return getDistance(
    {x: getAttribute(el, 'x1'), y: getAttribute(el, 'y1')}, 
    {x: getAttribute(el, 'x2'), y: getAttribute(el, 'y2')}
  );
}

function getPolylineLength(el) {
  var points = el.points;
  var totalLength = 0;
  var previousPos;
  for (var i = 0 ; i < points.numberOfItems; i++) {
    var currentPos = points.getItem(i);
    if (i > 0) { totalLength += getDistance(previousPos, currentPos); }
    previousPos = currentPos;
  }
  return totalLength;
}

function getPolygonLength(el) {
  var points = el.points;
  return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
}

// Path animation

function getTotalLength(el) {
  if (el.getTotalLength) { return el.getTotalLength(); }
  switch(el.tagName.toLowerCase()) {
    case 'circle': return getCircleLength(el);
    case 'rect': return getRectLength(el);
    case 'line': return getLineLength(el);
    case 'polyline': return getPolylineLength(el);
    case 'polygon': return getPolygonLength(el);
  }
}

function setDashoffset(el) {
  var pathLength = getTotalLength(el);
  el.setAttribute('stroke-dasharray', pathLength);
  return pathLength;
}

// Motion path

function getParentSvgEl(el) {
  var parentEl = el.parentNode;
  while (is.svg(parentEl)) {
    if (!is.svg(parentEl.parentNode)) { break; }
    parentEl = parentEl.parentNode;
  }
  return parentEl;
}

function getParentSvg(pathEl, svgData) {
  var svg = svgData || {};
  var parentSvgEl = svg.el || getParentSvgEl(pathEl);
  var rect = parentSvgEl.getBoundingClientRect();
  var viewBoxAttr = getAttribute(parentSvgEl, 'viewBox');
  var width = rect.width;
  var height = rect.height;
  var viewBox = svg.viewBox || (viewBoxAttr ? viewBoxAttr.split(' ') : [0, 0, width, height]);
  return {
    el: parentSvgEl,
    viewBox: viewBox,
    x: viewBox[0] / 1,
    y: viewBox[1] / 1,
    w: width,
    h: height,
    vW: viewBox[2],
    vH: viewBox[3]
  }
}

function getPath(path, percent) {
  var pathEl = is.str(path) ? selectString(path)[0] : path;
  var p = percent || 100;
  return function(property) {
    return {
      property: property,
      el: pathEl,
      svg: getParentSvg(pathEl),
      totalLength: getTotalLength(pathEl) * (p / 100)
    }
  }
}

function getPathProgress(path, progress, isPathTargetInsideSVG) {
  function point(offset) {
    if ( offset === void 0 ) offset = 0;

    var l = progress + offset >= 1 ? progress + offset : 0;
    return path.el.getPointAtLength(l);
  }
  var svg = getParentSvg(path.el, path.svg);
  var p = point();
  var p0 = point(-1);
  var p1 = point(+1);
  var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
  var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
  switch (path.property) {
    case 'x': return (p.x - svg.x) * scaleX;
    case 'y': return (p.y - svg.y) * scaleY;
    case 'angle': return Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
  }
}

// Decompose value

function decomposeValue(val, unit) {
  // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
  // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var value = validateValue((is.pth(val) ? val.totalLength : val), unit) + '';
  return {
    original: value,
    numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
    strings: (is.str(val) || unit) ? value.split(rgx) : []
  }
}

// Animatables

function parseTargets(targets) {
  var targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
  return filterArray(targetsArray, function (item, pos, self) { return self.indexOf(item) === pos; });
}

function getAnimatables(targets) {
  var parsed = parseTargets(targets);
  return parsed.map(function (t, i) {
    return {target: t, id: i, total: parsed.length, transforms: { list: getElementTransforms(t) } };
  });
}

// Properties

function normalizePropertyTweens(prop, tweenSettings) {
  var settings = cloneObject(tweenSettings);
  // Override duration if easing is a spring
  if (/^spring/.test(settings.easing)) { settings.duration = spring(settings.easing); }
  if (is.arr(prop)) {
    var l = prop.length;
    var isFromTo = (l === 2 && !is.obj(prop[0]));
    if (!isFromTo) {
      // Duration divided by the number of tweens
      if (!is.fnc(tweenSettings.duration)) { settings.duration = tweenSettings.duration / l; }
    } else {
      // Transform [from, to] values shorthand to a valid tween value
      prop = {value: prop};
    }
  }
  var propArray = is.arr(prop) ? prop : [prop];
  return propArray.map(function (v, i) {
    var obj = (is.obj(v) && !is.pth(v)) ? v : {value: v};
    // Default delay value should only be applied to the first tween
    if (is.und(obj.delay)) { obj.delay = !i ? tweenSettings.delay : 0; }
    // Default endDelay value should only be applied to the last tween
    if (is.und(obj.endDelay)) { obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0; }
    return obj;
  }).map(function (k) { return mergeObjects(k, settings); });
}


function flattenKeyframes(keyframes) {
  var propertyNames = filterArray(flattenArray(keyframes.map(function (key) { return Object.keys(key); })), function (p) { return is.key(p); })
  .reduce(function (a,b) { if (a.indexOf(b) < 0) { a.push(b); } return a; }, []);
  var properties = {};
  var loop = function ( i ) {
    var propName = propertyNames[i];
    properties[propName] = keyframes.map(function (key) {
      var newKey = {};
      for (var p in key) {
        if (is.key(p)) {
          if (p == propName) { newKey.value = key[p]; }
        } else {
          newKey[p] = key[p];
        }
      }
      return newKey;
    });
  };

  for (var i = 0; i < propertyNames.length; i++) loop( i );
  return properties;
}

function getProperties(tweenSettings, params) {
  var properties = [];
  var keyframes = params.keyframes;
  if (keyframes) { params = mergeObjects(flattenKeyframes(keyframes), params); }
  for (var p in params) {
    if (is.key(p)) {
      properties.push({
        name: p,
        tweens: normalizePropertyTweens(params[p], tweenSettings)
      });
    }
  }
  return properties;
}

// Tweens

function normalizeTweenValues(tween, animatable) {
  var t = {};
  for (var p in tween) {
    var value = getFunctionValue(tween[p], animatable);
    if (is.arr(value)) {
      value = value.map(function (v) { return getFunctionValue(v, animatable); });
      if (value.length === 1) { value = value[0]; }
    }
    t[p] = value;
  }
  t.duration = parseFloat(t.duration);
  t.delay = parseFloat(t.delay);
  return t;
}

function normalizeTweens(prop, animatable) {
  var previousTween;
  return prop.tweens.map(function (t) {
    var tween = normalizeTweenValues(t, animatable);
    var tweenValue = tween.value;
    var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
    var toUnit = getUnit(to);
    var originalValue = getOriginalTargetValue(animatable.target, prop.name, toUnit, animatable);
    var previousValue = previousTween ? previousTween.to.original : originalValue;
    var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
    var fromUnit = getUnit(from) || getUnit(originalValue);
    var unit = toUnit || fromUnit;
    if (is.und(to)) { to = previousValue; }
    tween.from = decomposeValue(from, unit);
    tween.to = decomposeValue(getRelativeValue(to, from), unit);
    tween.start = previousTween ? previousTween.end : 0;
    tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
    tween.easing = parseEasings(tween.easing, tween.duration);
    tween.isPath = is.pth(tweenValue);
    tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
    tween.isColor = is.col(tween.from.original);
    if (tween.isColor) { tween.round = 1; }
    previousTween = tween;
    return tween;
  });
}

// Tween progress

var setProgressValue = {
  css: function (t, p, v) { return t.style[p] = v; },
  attribute: function (t, p, v) { return t.setAttribute(p, v); },
  object: function (t, p, v) { return t[p] = v; },
  transform: function (t, p, v, transforms, manual) {
    transforms.list.set(p, v);
    if (p === transforms.last || manual) {
      var str = '';
      transforms.list.forEach(function (value, prop) { str += prop + "(" + value + ") "; });
      t.style.transform = str;
    }
  }
};

// Set Value helper

function setTargetsValue(targets, properties) {
  var animatables = getAnimatables(targets);
  animatables.forEach(function (animatable) {
    for (var property in properties) {
      var value = getFunctionValue(properties[property], animatable);
      var target = animatable.target;
      var valueUnit = getUnit(value);
      var originalValue = getOriginalTargetValue(target, property, valueUnit, animatable);
      var unit = valueUnit || getUnit(originalValue);
      var to = getRelativeValue(validateValue(value, unit), originalValue);
      var animType = getAnimationType(target, property);
      setProgressValue[animType](target, property, to, animatable.transforms, true);
    }
  });
}

// Animations

function createAnimation(animatable, prop) {
  var animType = getAnimationType(animatable.target, prop.name);
  if (animType) {
    var tweens = normalizeTweens(prop, animatable);
    var lastTween = tweens[tweens.length - 1];
    return {
      type: animType,
      property: prop.name,
      animatable: animatable,
      tweens: tweens,
      duration: lastTween.end,
      delay: tweens[0].delay,
      endDelay: lastTween.endDelay
    }
  }
}

function getAnimations(animatables, properties) {
  return filterArray(flattenArray(animatables.map(function (animatable) {
    return properties.map(function (prop) {
      return createAnimation(animatable, prop);
    });
  })), function (a) { return !is.und(a); });
}

// Create Instance

function getInstanceTimings(animations, tweenSettings) {
  var animLength = animations.length;
  var getTlOffset = function (anim) { return anim.timelineOffset ? anim.timelineOffset : 0; };
  var timings = {};
  timings.duration = animLength ? Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration; })) : tweenSettings.duration;
  timings.delay = animLength ? Math.min.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.delay; })) : tweenSettings.delay;
  timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration - anim.endDelay; })) : tweenSettings.endDelay;
  return timings;
}

var instanceID = 0;

function createNewInstance(params) {
  var instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
  var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
  var properties = getProperties(tweenSettings, params);
  var animatables = getAnimatables(params.targets);
  var animations = getAnimations(animatables, properties);
  var timings = getInstanceTimings(animations, tweenSettings);
  var id = instanceID;
  instanceID++;
  return mergeObjects(instanceSettings, {
    id: id,
    children: [],
    animatables: animatables,
    animations: animations,
    duration: timings.duration,
    delay: timings.delay,
    endDelay: timings.endDelay
  });
}

// Core

var activeInstances = [];

var engine = (function () {
  var raf;

  function play() {
    if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && activeInstances.length > 0) {
      raf = requestAnimationFrame(step);
    }
  }
  function step(t) {
    // memo on algorithm issue:
    // dangerous iteration over mutable `activeInstances`
    // (that collection may be updated from within callbacks of `tick`-ed animation instances)
    var activeInstancesLength = activeInstances.length;
    var i = 0;
    while (i < activeInstancesLength) {
      var activeInstance = activeInstances[i];
      if (!activeInstance.paused) {
        activeInstance.tick(t);
        i++;
      } else {
        activeInstances.splice(i, 1);
        activeInstancesLength--;
      }
    }
    raf = i > 0 ? requestAnimationFrame(step) : undefined;
  }

  function handleVisibilityChange() {
    if (!anime.suspendWhenDocumentHidden) { return; }

    if (isDocumentHidden()) {
      // suspend ticks
      raf = cancelAnimationFrame(raf);
    } else { // is back to active tab
      // first adjust animations to consider the time that ticks were suspended
      activeInstances.forEach(
        function (instance) { return instance ._onDocumentVisibility(); }
      );
      engine();
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return play;
})();

function isDocumentHidden() {
  return !!document && document.hidden;
}

// Public Instance

function anime(params) {
  if ( params === void 0 ) params = {};


  var startTime = 0, lastTime = 0, now = 0;
  var children, childrenLength = 0;
  var resolve = null;

  function makePromise(instance) {
    var promise = window.Promise && new Promise(function (_resolve) { return resolve = _resolve; });
    instance.finished = promise;
    return promise;
  }

  var instance = createNewInstance(params);
  var promise = makePromise(instance);

  function toggleInstanceDirection() {
    var direction = instance.direction;
    if (direction !== 'alternate') {
      instance.direction = direction !== 'normal' ? 'normal' : 'reverse';
    }
    instance.reversed = !instance.reversed;
    children.forEach(function (child) { return child.reversed = instance.reversed; });
  }

  function adjustTime(time) {
    return instance.reversed ? instance.duration - time : time;
  }

  function resetTime() {
    startTime = 0;
    lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
  }

  function seekChild(time, child) {
    if (child) { child.seek(time - child.timelineOffset); }
  }

  function syncInstanceChildren(time) {
    if (!instance.reversePlayback) {
      for (var i = 0; i < childrenLength; i++) { seekChild(time, children[i]); }
    } else {
      for (var i$1 = childrenLength; i$1--;) { seekChild(time, children[i$1]); }
    }
  }

  function setAnimationsProgress(insTime) {
    var i = 0;
    var animations = instance.animations;
    var animationsLength = animations.length;
    while (i < animationsLength) {
      var anim = animations[i];
      var animatable = anim.animatable;
      var tweens = anim.tweens;
      var tweenLength = tweens.length - 1;
      var tween = tweens[tweenLength];
      // Only check for keyframes if there is more than one tween
      if (tweenLength) { tween = filterArray(tweens, function (t) { return (insTime < t.end); })[0] || tween; }
      var elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
      var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
      var strings = tween.to.strings;
      var round = tween.round;
      var numbers = [];
      var toNumbersLength = tween.to.numbers.length;
      var progress = (void 0);
      for (var n = 0; n < toNumbersLength; n++) {
        var value = (void 0);
        var toNumber = tween.to.numbers[n];
        var fromNumber = tween.from.numbers[n] || 0;
        if (!tween.isPath) {
          value = fromNumber + (eased * (toNumber - fromNumber));
        } else {
          value = getPathProgress(tween.value, eased * toNumber, tween.isPathTargetInsideSVG);
        }
        if (round) {
          if (!(tween.isColor && n > 2)) {
            value = Math.round(value * round) / round;
          }
        }
        numbers.push(value);
      }
      // Manual Array.reduce for better performances
      var stringsLength = strings.length;
      if (!stringsLength) {
        progress = numbers[0];
      } else {
        progress = strings[0];
        for (var s = 0; s < stringsLength; s++) {
          var a = strings[s];
          var b = strings[s + 1];
          var n$1 = numbers[s];
          if (!isNaN(n$1)) {
            if (!b) {
              progress += n$1 + ' ';
            } else {
              progress += n$1 + b;
            }
          }
        }
      }
      setProgressValue[anim.type](animatable.target, anim.property, progress, animatable.transforms);
      anim.currentValue = progress;
      i++;
    }
  }

  function setCallback(cb) {
    if (instance[cb] && !instance.passThrough) { instance[cb](instance); }
  }

  function countIteration() {
    if (instance.remaining && instance.remaining !== true) {
      instance.remaining--;
    }
  }

  function setInstanceProgress(engineTime) {
    var insDuration = instance.duration;
    var insDelay = instance.delay;
    var insEndDelay = insDuration - instance.endDelay;
    var insTime = adjustTime(engineTime);
    instance.progress = minMax((insTime / insDuration) * 100, 0, 100);
    instance.reversePlayback = insTime < instance.currentTime;
    if (children) { syncInstanceChildren(insTime); }
    if (!instance.began && instance.currentTime > 0) {
      instance.began = true;
      setCallback('begin');
    }
    if (!instance.loopBegan && instance.currentTime > 0) {
      instance.loopBegan = true;
      setCallback('loopBegin');
    }
    if (insTime <= insDelay && instance.currentTime !== 0) {
      setAnimationsProgress(0);
    }
    if ((insTime >= insEndDelay && instance.currentTime !== insDuration) || !insDuration) {
      setAnimationsProgress(insDuration);
    }
    if (insTime > insDelay && insTime < insEndDelay) {
      if (!instance.changeBegan) {
        instance.changeBegan = true;
        instance.changeCompleted = false;
        setCallback('changeBegin');
      }
      setCallback('change');
      setAnimationsProgress(insTime);
    } else {
      if (instance.changeBegan) {
        instance.changeCompleted = true;
        instance.changeBegan = false;
        setCallback('changeComplete');
      }
    }
    instance.currentTime = minMax(insTime, 0, insDuration);
    if (instance.began) { setCallback('update'); }
    if (engineTime >= insDuration) {
      lastTime = 0;
      countIteration();
      if (!instance.remaining) {
        instance.paused = true;
        if (!instance.completed) {
          instance.completed = true;
          setCallback('loopComplete');
          setCallback('complete');
          if (!instance.passThrough && 'Promise' in window) {
            resolve();
            promise = makePromise(instance);
          }
        }
      } else {
        startTime = now;
        setCallback('loopComplete');
        instance.loopBegan = false;
        if (instance.direction === 'alternate') {
          toggleInstanceDirection();
        }
      }
    }
  }

  instance.reset = function() {
    var direction = instance.direction;
    instance.passThrough = false;
    instance.currentTime = 0;
    instance.progress = 0;
    instance.paused = true;
    instance.began = false;
    instance.loopBegan = false;
    instance.changeBegan = false;
    instance.completed = false;
    instance.changeCompleted = false;
    instance.reversePlayback = false;
    instance.reversed = direction === 'reverse';
    instance.remaining = instance.loop;
    children = instance.children;
    childrenLength = children.length;
    for (var i = childrenLength; i--;) { instance.children[i].reset(); }
    if (instance.reversed && instance.loop !== true || (direction === 'alternate' && instance.loop === 1)) { instance.remaining++; }
    setAnimationsProgress(instance.reversed ? instance.duration : 0);
  };

  // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
  instance._onDocumentVisibility = resetTime;

  // Set Value helper

  instance.set = function(targets, properties) {
    setTargetsValue(targets, properties);
    return instance;
  };

  instance.tick = function(t) {
    now = t;
    if (!startTime) { startTime = now; }
    setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
  };

  instance.seek = function(time) {
    setInstanceProgress(adjustTime(time));
  };

  instance.pause = function() {
    instance.paused = true;
    resetTime();
  };

  instance.play = function() {
    if (!instance.paused) { return; }
    if (instance.completed) { instance.reset(); }
    instance.paused = false;
    activeInstances.push(instance);
    resetTime();
    engine();
  };

  instance.reverse = function() {
    toggleInstanceDirection();
    instance.completed = instance.reversed ? false : true;
    resetTime();
  };

  instance.restart = function() {
    instance.reset();
    instance.play();
  };

  instance.remove = function(targets) {
    var targetsArray = parseTargets(targets);
    removeTargetsFromInstance(targetsArray, instance);
  };

  instance.reset();

  if (instance.autoplay) { instance.play(); }

  return instance;

}

// Remove targets from animation

function removeTargetsFromAnimations(targetsArray, animations) {
  for (var a = animations.length; a--;) {
    if (arrayContains(targetsArray, animations[a].animatable.target)) {
      animations.splice(a, 1);
    }
  }
}

function removeTargetsFromInstance(targetsArray, instance) {
  var animations = instance.animations;
  var children = instance.children;
  removeTargetsFromAnimations(targetsArray, animations);
  for (var c = children.length; c--;) {
    var child = children[c];
    var childAnimations = child.animations;
    removeTargetsFromAnimations(targetsArray, childAnimations);
    if (!childAnimations.length && !child.children.length) { children.splice(c, 1); }
  }
  if (!animations.length && !children.length) { instance.pause(); }
}

function removeTargetsFromActiveInstances(targets) {
  var targetsArray = parseTargets(targets);
  for (var i = activeInstances.length; i--;) {
    var instance = activeInstances[i];
    removeTargetsFromInstance(targetsArray, instance);
  }
}

// Stagger helpers

function stagger(val, params) {
  if ( params === void 0 ) params = {};

  var direction = params.direction || 'normal';
  var easing = params.easing ? parseEasings(params.easing) : null;
  var grid = params.grid;
  var axis = params.axis;
  var fromIndex = params.from || 0;
  var fromFirst = fromIndex === 'first';
  var fromCenter = fromIndex === 'center';
  var fromLast = fromIndex === 'last';
  var isRange = is.arr(val);
  var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
  var val2 = isRange ? parseFloat(val[1]) : 0;
  var unit = getUnit(isRange ? val[1] : val) || 0;
  var start = params.start || 0 + (isRange ? val1 : 0);
  var values = [];
  var maxValue = 0;
  return function (el, i, t) {
    if (fromFirst) { fromIndex = 0; }
    if (fromCenter) { fromIndex = (t - 1) / 2; }
    if (fromLast) { fromIndex = t - 1; }
    if (!values.length) {
      for (var index = 0; index < t; index++) {
        if (!grid) {
          values.push(Math.abs(fromIndex - index));
        } else {
          var fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
          var fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
          var toX = index%grid[0];
          var toY = Math.floor(index/grid[0]);
          var distanceX = fromX - toX;
          var distanceY = fromY - toY;
          var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          if (axis === 'x') { value = -distanceX; }
          if (axis === 'y') { value = -distanceY; }
          values.push(value);
        }
        maxValue = Math.max.apply(Math, values);
      }
      if (easing) { values = values.map(function (val) { return easing(val / maxValue) * maxValue; }); }
      if (direction === 'reverse') { values = values.map(function (val) { return axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val); }); }
    }
    var spacing = isRange ? (val2 - val1) / maxValue : val1;
    return start + (spacing * (Math.round(values[i] * 100) / 100)) + unit;
  }
}

// Timeline

function timeline(params) {
  if ( params === void 0 ) params = {};

  var tl = anime(params);
  tl.duration = 0;
  tl.add = function(instanceParams, timelineOffset) {
    var tlIndex = activeInstances.indexOf(tl);
    var children = tl.children;
    if (tlIndex > -1) { activeInstances.splice(tlIndex, 1); }
    function passThrough(ins) { ins.passThrough = true; }
    for (var i = 0; i < children.length; i++) { passThrough(children[i]); }
    var insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
    insParams.targets = insParams.targets || params.targets;
    var tlDuration = tl.duration;
    insParams.autoplay = false;
    insParams.direction = tl.direction;
    insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
    passThrough(tl);
    tl.seek(insParams.timelineOffset);
    var ins = anime(insParams);
    passThrough(ins);
    children.push(ins);
    var timings = getInstanceTimings(children, params);
    tl.delay = timings.delay;
    tl.endDelay = timings.endDelay;
    tl.duration = timings.duration;
    tl.seek(0);
    tl.reset();
    if (tl.autoplay) { tl.play(); }
    return tl;
  };
  return tl;
}

anime.version = '3.2.1';
anime.speed = 1;
// TODO:#review: naming, documentation
anime.suspendWhenDocumentHidden = true;
anime.running = activeInstances;
anime.remove = removeTargetsFromActiveInstances;
anime.get = getOriginalTargetValue;
anime.set = setTargetsValue;
anime.convertPx = convertPxToUnit;
anime.path = getPath;
anime.setDashoffset = setDashoffset;
anime.stagger = stagger;
anime.timeline = timeline;
anime.easing = parseEasings;
anime.penner = penner;
anime.random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (anime);


/***/ }),

/***/ "./node_modules/canvas-confetti/dist/confetti.module.mjs":
/*!***************************************************************!*\
  !*** ./node_modules/canvas-confetti/dist/confetti.module.mjs ***!
  \***************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__,
/* harmony export */   "create": () => /* binding */ create
/* harmony export */ });
// canvas-confetti v1.3.3 built on 2021-01-16T22:50:46.932Z
var module = {};

// source content
(function main(global, module, isWorker, workerSize) {
  var canUseWorker = !!(
    global.Worker &&
    global.Blob &&
    global.Promise &&
    global.OffscreenCanvas &&
    global.OffscreenCanvasRenderingContext2D &&
    global.HTMLCanvasElement &&
    global.HTMLCanvasElement.prototype.transferControlToOffscreen &&
    global.URL &&
    global.URL.createObjectURL);

  function noop() {}

  // create a promise if it exists, otherwise, just
  // call the function directly
  function promise(func) {
    var ModulePromise = module.exports.Promise;
    var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;

    if (typeof Prom === 'function') {
      return new Prom(func);
    }

    func(noop, noop);

    return null;
  }

  var raf = (function () {
    var TIME = Math.floor(1000 / 60);
    var frame, cancel;
    var frames = {};
    var lastFrameTime = 0;

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
      frame = function (cb) {
        var id = Math.random();

        frames[id] = requestAnimationFrame(function onFrame(time) {
          if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
            lastFrameTime = time;
            delete frames[id];

            cb();
          } else {
            frames[id] = requestAnimationFrame(onFrame);
          }
        });

        return id;
      };
      cancel = function (id) {
        if (frames[id]) {
          cancelAnimationFrame(frames[id]);
        }
      };
    } else {
      frame = function (cb) {
        return setTimeout(cb, TIME);
      };
      cancel = function (timer) {
        return clearTimeout(timer);
      };
    }

    return { frame: frame, cancel: cancel };
  }());

  var getWorker = (function () {
    var worker;
    var prom;
    var resolves = {};

    function decorate(worker) {
      function execute(options, callback) {
        worker.postMessage({ options: options || {}, callback: callback });
      }
      worker.init = function initWorker(canvas) {
        var offscreen = canvas.transferControlToOffscreen();
        worker.postMessage({ canvas: offscreen }, [offscreen]);
      };

      worker.fire = function fireWorker(options, size, done) {
        if (prom) {
          execute(options, null);
          return prom;
        }

        var id = Math.random().toString(36).slice(2);

        prom = promise(function (resolve) {
          function workerDone(msg) {
            if (msg.data.callback !== id) {
              return;
            }

            delete resolves[id];
            worker.removeEventListener('message', workerDone);

            prom = null;
            done();
            resolve();
          }

          worker.addEventListener('message', workerDone);
          execute(options, id);

          resolves[id] = workerDone.bind(null, { data: { callback: id }});
        });

        return prom;
      };

      worker.reset = function resetWorker() {
        worker.postMessage({ reset: true });

        for (var id in resolves) {
          resolves[id]();
          delete resolves[id];
        }
      };
    }

    return function () {
      if (worker) {
        return worker;
      }

      if (!isWorker && canUseWorker) {
        var code = [
          'var CONFETTI, SIZE = {}, module = {};',
          '(' + main.toString() + ')(this, module, true, SIZE);',
          'onmessage = function(msg) {',
          '  if (msg.data.options) {',
          '    CONFETTI(msg.data.options).then(function () {',
          '      if (msg.data.callback) {',
          '        postMessage({ callback: msg.data.callback });',
          '      }',
          '    });',
          '  } else if (msg.data.reset) {',
          '    CONFETTI.reset();',
          '  } else if (msg.data.resize) {',
          '    SIZE.width = msg.data.resize.width;',
          '    SIZE.height = msg.data.resize.height;',
          '  } else if (msg.data.canvas) {',
          '    SIZE.width = msg.data.canvas.width;',
          '    SIZE.height = msg.data.canvas.height;',
          '    CONFETTI = module.exports.create(msg.data.canvas);',
          '  }',
          '}',
        ].join('\n');
        try {
          worker = new Worker(URL.createObjectURL(new Blob([code])));
        } catch (e) {
          // eslint-disable-next-line no-console
          typeof console !== undefined && typeof console.warn === 'function' ? console.warn('🎊 Could not load worker', e) : null;

          return null;
        }

        decorate(worker);
      }

      return worker;
    };
  })();

  var defaults = {
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    ticks: 200,
    x: 0.5,
    y: 0.5,
    shapes: ['square', 'circle'],
    zIndex: 100,
    colors: [
      '#26ccff',
      '#a25afd',
      '#ff5e7e',
      '#88ff5a',
      '#fcff42',
      '#ffa62d',
      '#ff36ff'
    ],
    // probably should be true, but back-compat
    disableForReducedMotion: false,
    scalar: 1
  };

  function convert(val, transform) {
    return transform ? transform(val) : val;
  }

  function isOk(val) {
    return !(val === null || val === undefined);
  }

  function prop(options, name, transform) {
    return convert(
      options && isOk(options[name]) ? options[name] : defaults[name],
      transform
    );
  }

  function onlyPositiveInt(number){
    return number < 0 ? 0 : Math.floor(number);
  }

  function randomInt(min, max) {
    // [min, max)
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function toDecimal(str) {
    return parseInt(str, 16);
  }

  function colorsToRgb(colors) {
    return colors.map(hexToRgb);
  }

  function hexToRgb(str) {
    var val = String(str).replace(/[^0-9a-f]/gi, '');

    if (val.length < 6) {
        val = val[0]+val[0]+val[1]+val[1]+val[2]+val[2];
    }

    return {
      r: toDecimal(val.substring(0,2)),
      g: toDecimal(val.substring(2,4)),
      b: toDecimal(val.substring(4,6))
    };
  }

  function getOrigin(options) {
    var origin = prop(options, 'origin', Object);
    origin.x = prop(origin, 'x', Number);
    origin.y = prop(origin, 'y', Number);

    return origin;
  }

  function setCanvasWindowSize(canvas) {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
  }

  function setCanvasRectSize(canvas) {
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function getCanvas(zIndex) {
    var canvas = document.createElement('canvas');

    canvas.style.position = 'fixed';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = zIndex;

    return canvas;
  }

  function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(radiusX, radiusY);
    context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
    context.restore();
  }

  function randomPhysics(opts) {
    var radAngle = opts.angle * (Math.PI / 180);
    var radSpread = opts.spread * (Math.PI / 180);

    return {
      x: opts.x,
      y: opts.y,
      wobble: Math.random() * 10,
      velocity: (opts.startVelocity * 0.5) + (Math.random() * opts.startVelocity),
      angle2D: -radAngle + ((0.5 * radSpread) - (Math.random() * radSpread)),
      tiltAngle: Math.random() * Math.PI,
      color: opts.color,
      shape: opts.shape,
      tick: 0,
      totalTicks: opts.ticks,
      decay: opts.decay,
      random: Math.random() + 5,
      tiltSin: 0,
      tiltCos: 0,
      wobbleX: 0,
      wobbleY: 0,
      gravity: opts.gravity * 3,
      ovalScalar: 0.6,
      scalar: opts.scalar
    };
  }

  function updateFetti(context, fetti) {
    fetti.x += Math.cos(fetti.angle2D) * fetti.velocity;
    fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
    fetti.wobble += 0.1;
    fetti.velocity *= fetti.decay;
    fetti.tiltAngle += 0.1;
    fetti.tiltSin = Math.sin(fetti.tiltAngle);
    fetti.tiltCos = Math.cos(fetti.tiltAngle);
    fetti.random = Math.random() + 5;
    fetti.wobbleX = fetti.x + ((10 * fetti.scalar) * Math.cos(fetti.wobble));
    fetti.wobbleY = fetti.y + ((10 * fetti.scalar) * Math.sin(fetti.wobble));

    var progress = (fetti.tick++) / fetti.totalTicks;

    var x1 = fetti.x + (fetti.random * fetti.tiltCos);
    var y1 = fetti.y + (fetti.random * fetti.tiltSin);
    var x2 = fetti.wobbleX + (fetti.random * fetti.tiltCos);
    var y2 = fetti.wobbleY + (fetti.random * fetti.tiltSin);

    context.fillStyle = 'rgba(' + fetti.color.r + ', ' + fetti.color.g + ', ' + fetti.color.b + ', ' + (1 - progress) + ')';
    context.beginPath();

    if (fetti.shape === 'circle') {
      context.ellipse ?
        context.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) :
        ellipse(context, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
    } else {
      context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
      context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
      context.lineTo(Math.floor(x2), Math.floor(y2));
      context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
    }

    context.closePath();
    context.fill();

    return fetti.tick < fetti.totalTicks;
  }

  function animate(canvas, fettis, resizer, size, done) {
    var animatingFettis = fettis.slice();
    var context = canvas.getContext('2d');
    var animationFrame;
    var destroy;

    var prom = promise(function (resolve) {
      function onDone() {
        animationFrame = destroy = null;

        context.clearRect(0, 0, size.width, size.height);

        done();
        resolve();
      }

      function update() {
        if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
          size.width = canvas.width = workerSize.width;
          size.height = canvas.height = workerSize.height;
        }

        if (!size.width && !size.height) {
          resizer(canvas);
          size.width = canvas.width;
          size.height = canvas.height;
        }

        context.clearRect(0, 0, size.width, size.height);

        animatingFettis = animatingFettis.filter(function (fetti) {
          return updateFetti(context, fetti);
        });

        if (animatingFettis.length) {
          animationFrame = raf.frame(update);
        } else {
          onDone();
        }
      }

      animationFrame = raf.frame(update);
      destroy = onDone;
    });

    return {
      addFettis: function (fettis) {
        animatingFettis = animatingFettis.concat(fettis);

        return prom;
      },
      canvas: canvas,
      promise: prom,
      reset: function () {
        if (animationFrame) {
          raf.cancel(animationFrame);
        }

        if (destroy) {
          destroy();
        }
      }
    };
  }

  function confettiCannon(canvas, globalOpts) {
    var isLibCanvas = !canvas;
    var allowResize = !!prop(globalOpts || {}, 'resize');
    var globalDisableForReducedMotion = prop(globalOpts, 'disableForReducedMotion', Boolean);
    var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, 'useWorker');
    var worker = shouldUseWorker ? getWorker() : null;
    var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
    var initialized = (canvas && worker) ? !!canvas.__confetti_initialized : false;
    var preferLessMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion)').matches;
    var animationObj;

    function fireLocal(options, size, done) {
      var particleCount = prop(options, 'particleCount', onlyPositiveInt);
      var angle = prop(options, 'angle', Number);
      var spread = prop(options, 'spread', Number);
      var startVelocity = prop(options, 'startVelocity', Number);
      var decay = prop(options, 'decay', Number);
      var gravity = prop(options, 'gravity', Number);
      var colors = prop(options, 'colors', colorsToRgb);
      var ticks = prop(options, 'ticks', Number);
      var shapes = prop(options, 'shapes');
      var scalar = prop(options, 'scalar');
      var origin = getOrigin(options);

      var temp = particleCount;
      var fettis = [];

      var startX = canvas.width * origin.x;
      var startY = canvas.height * origin.y;

      while (temp--) {
        fettis.push(
          randomPhysics({
            x: startX,
            y: startY,
            angle: angle,
            spread: spread,
            startVelocity: startVelocity,
            color: colors[temp % colors.length],
            shape: shapes[randomInt(0, shapes.length)],
            ticks: ticks,
            decay: decay,
            gravity: gravity,
            scalar: scalar
          })
        );
      }

      // if we have a previous canvas already animating,
      // add to it
      if (animationObj) {
        return animationObj.addFettis(fettis);
      }

      animationObj = animate(canvas, fettis, resizer, size , done);

      return animationObj.promise;
    }

    function fire(options) {
      var disableForReducedMotion = globalDisableForReducedMotion || prop(options, 'disableForReducedMotion', Boolean);
      var zIndex = prop(options, 'zIndex', Number);

      if (disableForReducedMotion && preferLessMotion) {
        return promise(function (resolve) {
          resolve();
        });
      }

      if (isLibCanvas && animationObj) {
        // use existing canvas from in-progress animation
        canvas = animationObj.canvas;
      } else if (isLibCanvas && !canvas) {
        // create and initialize a new canvas
        canvas = getCanvas(zIndex);
        document.body.appendChild(canvas);
      }

      if (allowResize && !initialized) {
        // initialize the size of a user-supplied canvas
        resizer(canvas);
      }

      var size = {
        width: canvas.width,
        height: canvas.height
      };

      if (worker && !initialized) {
        worker.init(canvas);
      }

      initialized = true;

      if (worker) {
        canvas.__confetti_initialized = true;
      }

      function onResize() {
        if (worker) {
          // TODO this really shouldn't be immediate, because it is expensive
          var obj = {
            getBoundingClientRect: function () {
              if (!isLibCanvas) {
                return canvas.getBoundingClientRect();
              }
            }
          };

          resizer(obj);

          worker.postMessage({
            resize: {
              width: obj.width,
              height: obj.height
            }
          });
          return;
        }

        // don't actually query the size here, since this
        // can execute frequently and rapidly
        size.width = size.height = null;
      }

      function done() {
        animationObj = null;

        if (allowResize) {
          global.removeEventListener('resize', onResize);
        }

        if (isLibCanvas && canvas) {
          document.body.removeChild(canvas);
          canvas = null;
          initialized = false;
        }
      }

      if (allowResize) {
        global.addEventListener('resize', onResize, false);
      }

      if (worker) {
        return worker.fire(options, size, done);
      }

      return fireLocal(options, size, done);
    }

    fire.reset = function () {
      if (worker) {
        worker.reset();
      }

      if (animationObj) {
        animationObj.reset();
      }
    };

    return fire;
  }

  module.exports = confettiCannon(null, { useWorker: true, resize: true });
  module.exports.create = confettiCannon;
}((function () {
  if (typeof window !== 'undefined') {
    return window;
  }

  if (typeof self !== 'undefined') {
    return self;
  }

  return this || {};
})(), module, false));

// end source content

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (module.exports);
var create = module.exports.create;


/***/ }),

/***/ "./src/scss/main.scss":
/*!****************************!*\
  !*** ./src/scss/main.scss ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/js/components/anime-blocks.js":
/*!*******************************************!*\
  !*** ./src/js/components/anime-blocks.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ animeBlocks
/* harmony export */ });
/* harmony import */ var _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/animejs/lib/anime.es.js */ "./node_modules/animejs/lib/anime.es.js");


function animeBlocks() {
	// visualizer
	const staggerVisualizerEl = document.querySelector(
		'.stagger-visualizer'
	);
	const fragment = document.createDocumentFragment();
	const grid = [17, 17];
	const col = grid[0];
	const row = grid[1];
	const numberOfElements = col * row;

	for (let i = 0; i < numberOfElements; i++) {
		fragment.appendChild(document.createElement('div'));
	}

	staggerVisualizerEl.appendChild(fragment);

	const staggersAnimation = _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.timeline({
			targets: '.stagger-visualizer div',
			easing: 'easeInOutSine',
			delay: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger(50),
			loop: true,
			autoplay: false,
		})
		.add({
			translateX: [
				{
					value: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger('-.1rem', {
						grid: grid,
						from: 'center',
						axis: 'x',
					}),
				},
				{
					value: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger('.1rem', {
						grid: grid,
						from: 'center',
						axis: 'x',
					}),
				},
			],
			translateY: [
				{
					value: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger('-.1rem', {
						grid: grid,
						from: 'center',
						axis: 'y',
					}),
				},
				{
					value: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger('.1rem', {
						grid: grid,
						from: 'center',
						axis: 'y',
					}),
				},
			],
			duration: 1000,
			scale: 0.5,
			delay: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger(100, {
				grid: grid,
				from: 'center',
			}),
		})
		.add({
			translateX: () => _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(-10, 10),
			translateY: () => _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(-10, 10),
			delay: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger(8, { from: 'last' }),
		})
		.add({
			translateX: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger('.25rem', {
				grid: grid,
				from: 'center',
				axis: 'x',
			}),
			translateY: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger('.25rem', {
				grid: grid,
				from: 'center',
				axis: 'y',
			}),
			rotate: 0,
			scaleX: 2.5,
			scaleY: 0.25,
			delay: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger(4, { from: 'center' }),
		})
		.add({
			rotate: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger([90, 0], {
				grid: grid,
				from: 'center',
			}),
			delay: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger(50, {
				grid: grid,
				from: 'center',
			}),
		})
		.add({
			translateX: 0,
			translateY: 0,
			scale: 0.5,
			scaleX: 1,
			rotate: 180,
			duration: 1000,
			delay: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger(100, {
				grid: grid,
				from: 'center',
			}),
		})
		.add({
			scaleY: 1,
			scale: 1,
			delay: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.stagger(20, {
				grid: grid,
				from: 'center',
			}),
		});

	staggersAnimation.play();
}


/***/ }),

/***/ "./src/js/components/color-splash.js":
/*!*******************************************!*\
  !*** ./src/js/components/color-splash.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ colorSplash
/* harmony export */ });
/* harmony import */ var _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/animejs/lib/anime.es.js */ "./node_modules/animejs/lib/anime.es.js");


function colorSplash() {
	// Splash of color
	var c = document.getElementById('c');
	var ctx = c.getContext('2d');
	var cH;
	var cW;
	var bgColor = '#000';
	var animations = [];
	var circles = [];

	var colorPicker = (function () {
		var colors = ['#FF6138', '#FFBE53', '#2980B9', '#282741'];
		var index = 0;
		function next() {
			index = index++ < colors.length - 1 ? index : 0;
			return colors[index];
		}
		function current() {
			return colors[index];
		}
		return {
			next: next,
			current: current,
		};
	})();

	function removeAnimation(animation) {
		var index = animations.indexOf(animation);
		if (index > -1) animations.splice(index, 1);
	}

	function calcPageFillRadius(x, y) {
		var l = Math.max(x - 0, cW - x);
		var h = Math.max(y - 0, cH - y);
		return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
	}

	function addClickListeners() {
		document.addEventListener('touchstart', handleEvent);
		document.addEventListener('mousedown', handleEvent);
	}

	function handleEvent(e) {
		if (e.touches) {
			e.preventDefault();
			e = e.touches[0];
		}
		var currentColor = colorPicker.current();
		var nextColor = colorPicker.next();
		var targetR = calcPageFillRadius(e.pageX, e.pageY);
		var rippleSize = Math.min(200, cW * 0.4);
		var minCoverDuration = 750;

		var pageFill = new Circle({
			x: e.clientX,
			y: e.clientY,
			r: 0,
			fill: nextColor,
		});
		var fillAnimation = (0,_node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default)({
			targets: pageFill,
			r: targetR,
			duration: Math.max(targetR / 2, minCoverDuration),
			easing: 'easeOutQuart',
			complete: function () {
				bgColor = pageFill.fill;
				removeAnimation(fillAnimation);
			},
		});

		var ripple = new Circle({
			x: e.clientX,
			y: e.clientY,
			r: 0,
			fill: currentColor,
			stroke: {
				width: 3,
				color: currentColor,
			},
			opacity: 1,
		});
		var rippleAnimation = (0,_node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default)({
			targets: ripple,
			r: rippleSize,
			opacity: 0,
			easing: 'easeOutExpo',
			duration: 900,
			complete: removeAnimation,
		});

		var particles = [];
		for (var i = 0; i < 32; i++) {
			var particle = new Circle({
				x: e.clientX,
				y: e.clientY,
				fill: currentColor,
				r: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(24, 48),
			});
			particles.push(particle);
		}
		var particlesAnimation = (0,_node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default)({
			targets: particles,
			x: function (particle) {
				return (
					particle.x +
					_node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(rippleSize, -rippleSize)
				);
			},
			y: function (particle) {
				return (
					particle.y +
					_node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(
						rippleSize * 1.15,
						-rippleSize * 1.15
					)
				);
			},
			r: 0,
			easing: 'easeOutExpo',
			duration: _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(1000, 1300),
			complete: removeAnimation,
		});
		animations.push(
			fillAnimation,
			rippleAnimation,
			particlesAnimation
		);
	}

	function extend(a, b) {
		for (var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = b[key];
			}
		}
		return a;
	}

	var Circle = function (opts) {
		extend(this, opts);
	};

	Circle.prototype.draw = function () {
		ctx.globalAlpha = this.opacity || 1;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
		if (this.stroke) {
			ctx.strokeStyle = this.stroke.color;
			ctx.lineWidth = this.stroke.width;
			ctx.stroke();
		}
		if (this.fill) {
			ctx.fillStyle = this.fill;
			ctx.fill();
		}
		ctx.closePath();
		ctx.globalAlpha = 1;
	};

	var animate = (0,_node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default)({
		duration: Infinity,
		update: function () {
			ctx.fillStyle = bgColor;
			ctx.fillRect(0, 0, cW, cH);
			animations.forEach(function (anim) {
				anim.animatables.forEach(function (animatable) {
					animatable.target.draw();
				});
			});
		},
	});

	var resizeCanvas = function () {
		cW = window.innerWidth;
		cH = window.innerHeight;
		c.width = cW * devicePixelRatio;
		c.height = cH * devicePixelRatio;
		ctx.scale(devicePixelRatio, devicePixelRatio);
	};

	(function init() {
		resizeCanvas();
		if (window.CP) {
			// CodePen's loop detection was causin' problems
			// and I have no idea why, so...
			window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 6000;
		}
		window.addEventListener('resize', resizeCanvas);
		addClickListeners();
		if (!!window.location.pathname.match(/fullcpgrid/)) {
			startFauxClicking();
		}
		handleInactiveUser();
	})();

	function handleInactiveUser() {
		var inactive = setTimeout(function () {
			fauxClick(cW / 2, cH / 2);
		}, 2000);

		function clearInactiveTimeout() {
			clearTimeout(inactive);
			document.removeEventListener(
				'mousedown',
				clearInactiveTimeout
			);
			document.removeEventListener(
				'touchstart',
				clearInactiveTimeout
			);
		}

		document.addEventListener('mousedown', clearInactiveTimeout);
		document.addEventListener('touchstart', clearInactiveTimeout);
	}

	function startFauxClicking() {
		setTimeout(function () {
			fauxClick(
				_node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(cW * 0.2, cW * 0.8),
				_node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(cH * 0.2, cH * 0.8)
			);
			startFauxClicking();
		}, _node_modules_animejs_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__.default.random(200, 900));
	}

	function fauxClick(x, y) {
		var fauxClick = new Event('mousedown');
		fauxClick.clientX = x;
		fauxClick.clientY = y;
		document.dispatchEvent(fauxClick);
	}
}


/***/ }),

/***/ "./src/js/components/dark-mode.js":
/*!****************************************!*\
  !*** ./src/js/components/dark-mode.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ darkMode
/* harmony export */ });
function darkMode() {
	// Start in dark mode
	document.documentElement.setAttribute('data-theme', 'dark');
	localStorage.setItem('theme', 'dark');

	// Dark Mode
	const toggleSwitch = document.querySelector(
		'.theme-switch input[type="checkbox"]'
	);

	function switchTheme(e) {
		if (e.target.checked) {
			document.documentElement.setAttribute(
				'data-theme',
				'dark'
			);
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.setAttribute(
				'data-theme',
				'light'
			);
			localStorage.setItem('theme', 'light');
		}
	}

	toggleSwitch.addEventListener('change', switchTheme, false);

	const currentTheme = localStorage.getItem('theme')
		? localStorage.getItem('theme')
		: null;

	if (currentTheme) {
		document.documentElement.setAttribute(
			'data-theme',
			currentTheme
		);

		if (currentTheme === 'dark') {
			toggleSwitch.checked = true;
		}
	}
}


/***/ }),

/***/ "./src/js/components/form-submit.js":
/*!******************************************!*\
  !*** ./src/js/components/form-submit.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ formSubmit
/* harmony export */ });
/* harmony import */ var canvas_confetti__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! canvas-confetti */ "./node_modules/canvas-confetti/dist/confetti.module.mjs");


function formSubmit() {
	var email = document.querySelector('input[type="email"]');

	// Play Lottie
	function playAnimation() {
		const player = document.querySelector(".rocket");
		player.play();
	}

	// Confetti
	var canvas = document.getElementById("confetti");
	canvas.confetti =
		canvas.confetti || canvas_confetti__WEBPACK_IMPORTED_MODULE_0__.create(canvas, { resize: true });

	function makeItFly() {
		var end = Date.now() + 15 * 1000;
		var colors = ["#00FFC0", "#F9FF00", "#FF0000", "#FFF", "#FF0000"];
		(function frame() {
			canvas.confetti({
				particleCount: 2,
				angle: 60,
				spread: 55,
				origin: { x: 0 },
				colors: colors,
				resize: true,
				useWorker: true,
			});
			canvas.confetti({
				particleCount: 2,
				angle: 120,
				spread: 55,
				origin: { x: 1 },
				colors: colors,
				resize: true,
				useWorker: true,
			});

			if (Date.now() < end) {
				requestAnimationFrame(frame);
			}
		})();
	}

	function validateEmail(email) {
		const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	function validate() {
		const result = document.getElementById("result");
		var email = document.querySelector('input[type="email"]').value;
		result.innerHTML = "";

		if (validateEmail(email)) {
			var element = document.getElementById("party");
			element.classList.add("success");

			makeItFly();

			result.innerHTML =
				"<h2>Yea!!! Now we're talkin!</h2><p>We will review your message and be in touch soon.</p>";

			return true;
		} else {
			result.innerHTML =
				'<p>Hmm...something is off. Try checking "' +
				email +
				'" and try again.</p>';
		}
		return false;
	}

	const tada = document.getElementById("tada");
	tada.addEventListener("click", validate);
}


/***/ }),

/***/ "./src/js/components/particles.js":
/*!****************************************!*\
  !*** ./src/js/components/particles.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ particles
/* harmony export */ });
function particles() {
	// Particle JS
	function startParticles() {
		particlesJS('particles-js', {
			particles: {
				number: {
					value: 80,
					density: {
						enable: true,
						value_area: 800,
					},
				},
				color: { value: '#ffffff' },
				shape: {
					type: 'circle',
					stroke: { width: 0, color: '#000000' },
					polygon: { nb_sides: 5 },
					image: {
						src: 'img/github.svg',
						width: 100,
						height: 100,
					},
				},
				opacity: {
					value: 0.5,
					random: false,
					anim: {
						enable: false,
						speed: 1,
						opacity_min: 0.1,
						sync: false,
					},
				},
				size: {
					value: 3,
					random: true,
					anim: {
						enable: false,
						speed: 40,
						size_min: 0.1,
						sync: false,
					},
				},
				line_linked: {
					enable: true,
					distance: 150,
					color: '#ffffff',
					opacity: 0.4,
					width: 1,
				},
				move: {
					enable: true,
					speed: 6,
					direction: 'none',
					random: false,
					straight: false,
					out_mode: 'out',
					bounce: false,
					attract: {
						enable: false,
						rotateX: 600,
						rotateY: 1200,
					},
				},
			},
			interactivity: {
				detect_on: 'canvas',
				events: {
					onhover: {
						enable: true,
						mode: 'repulse',
					},
					onclick: { enable: true, mode: 'push' },
					resize: true,
				},
				modes: {
					grab: {
						distance: 400,
						line_linked: { opacity: 1 },
					},
					bubble: {
						distance: 400,
						size: 40,
						duration: 2,
						opacity: 8,
						speed: 3,
					},
					repulse: {
						distance: 200,
						duration: 0.4,
					},
					push: { particles_nb: 4 },
					remove: { particles_nb: 2 },
				},
			},
			retina_detect: true,
		});
	}

	startParticles();
}


/***/ }),

/***/ "./src/js/index.js":
/*!*************************!*\
  !*** ./src/js/index.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _scss_main_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../scss/main.scss */ "./src/scss/main.scss");
/* harmony import */ var _components_anime_blocks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/anime-blocks */ "./src/js/components/anime-blocks.js");
/* harmony import */ var _components_color_splash__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/color-splash */ "./src/js/components/color-splash.js");
/* harmony import */ var _components_dark_mode__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/dark-mode */ "./src/js/components/dark-mode.js");
/* harmony import */ var _components_form_submit__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/form-submit */ "./src/js/components/form-submit.js");
/* harmony import */ var _components_particles__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./components/particles */ "./src/js/components/particles.js");








document.addEventListener('DOMContentLoaded', function () {
	(0,_components_anime_blocks__WEBPACK_IMPORTED_MODULE_1__.default)();
	(0,_components_color_splash__WEBPACK_IMPORTED_MODULE_2__.default)();
	(0,_components_dark_mode__WEBPACK_IMPORTED_MODULE_3__.default)();
	(0,_components_form_submit__WEBPACK_IMPORTED_MODULE_4__.default)();
	(0,_components_particles__WEBPACK_IMPORTED_MODULE_5__.default)();
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("./src/js/index.js");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy8uL25vZGVfbW9kdWxlcy9hbmltZWpzL2xpYi9hbmltZS5lcy5qcyIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy8uL25vZGVfbW9kdWxlcy9jYW52YXMtY29uZmV0dGkvZGlzdC9jb25mZXR0aS5tb2R1bGUubWpzIiwid2VicGFjazovL211aC1idWlsZC1wcm9jZXNzLy4vc3JjL3Njc3MvbWFpbi5zY3NzP2NiYjciLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3MvLi9zcmMvanMvY29tcG9uZW50cy9hbmltZS1ibG9ja3MuanMiLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3MvLi9zcmMvanMvY29tcG9uZW50cy9jb2xvci1zcGxhc2guanMiLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3MvLi9zcmMvanMvY29tcG9uZW50cy9kYXJrLW1vZGUuanMiLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3MvLi9zcmMvanMvY29tcG9uZW50cy9mb3JtLXN1Ym1pdC5qcyIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy8uL3NyYy9qcy9jb21wb25lbnRzL3BhcnRpY2xlcy5qcyIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy8uL3NyYy9qcy9pbmRleC5qcyIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3Mvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL211aC1idWlsZC1wcm9jZXNzL3dlYnBhY2sv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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBOztBQUVBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBLGlFQUFpRTtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEseUNBQXlDLGdDQUFnQztBQUN6RTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsQ0FBQzs7QUFFRDs7QUFFQSxpRUFBZSxjQUFjLEVBQUM7QUFDdkI7Ozs7Ozs7Ozs7OztBQ25sQlA7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBa0U7O0FBRW5EO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGdCQUFnQixzQkFBc0I7QUFDdEM7QUFDQTs7QUFFQTs7QUFFQSwyQkFBMkIsbUZBQ2hCO0FBQ1g7QUFDQTtBQUNBLFVBQVUsa0ZBQWE7QUFDdkI7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxZQUFZLGtGQUFhO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixLQUFLO0FBQ0w7QUFDQSxZQUFZLGtGQUFhO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsWUFBWSxrRkFBYTtBQUN6QjtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ04sS0FBSztBQUNMO0FBQ0EsWUFBWSxrRkFBYTtBQUN6QjtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ04sS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLFVBQVUsa0ZBQWE7QUFDdkI7QUFDQTtBQUNBLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQSxxQkFBcUIsaUZBQVk7QUFDakMscUJBQXFCLGlGQUFZO0FBQ2pDLFVBQVUsa0ZBQWEsS0FBSyxlQUFlO0FBQzNDLEdBQUc7QUFDSDtBQUNBLGVBQWUsa0ZBQWE7QUFDNUI7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKLGVBQWUsa0ZBQWE7QUFDNUI7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBLFVBQVUsa0ZBQWEsS0FBSyxpQkFBaUI7QUFDN0MsR0FBRztBQUNIO0FBQ0EsV0FBVyxrRkFBYTtBQUN4QjtBQUNBO0FBQ0EsSUFBSTtBQUNKLFVBQVUsa0ZBQWE7QUFDdkI7QUFDQTtBQUNBLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVLGtGQUFhO0FBQ3ZCO0FBQ0E7QUFDQSxJQUFJO0FBQ0osR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLFVBQVUsa0ZBQWE7QUFDdkI7QUFDQTtBQUNBLElBQUk7QUFDSixHQUFHOztBQUVIO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUN4SGtFOztBQUVuRDtBQUNmO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILHNCQUFzQiw4RUFBSztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSixHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQSxHQUFHO0FBQ0gsd0JBQXdCLDhFQUFLO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQSxpQkFBaUIsUUFBUTtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8saUZBQVk7QUFDbkIsSUFBSTtBQUNKO0FBQ0E7QUFDQSwyQkFBMkIsOEVBQUs7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLLGlGQUFZO0FBQ2pCO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBLEtBQUssaUZBQVk7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBLGFBQWEsaUZBQVk7QUFDekI7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGVBQWUsOEVBQUs7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSTtBQUNKLEdBQUc7QUFDSCxFQUFFOztBQUVGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUksaUZBQVk7QUFDaEIsSUFBSSxpRkFBWTtBQUNoQjtBQUNBO0FBQ0EsR0FBRyxFQUFFLGlGQUFZO0FBQ2pCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUMxT2U7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQzFDNEM7O0FBRTdCO0FBQ2Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsbURBQWUsVUFBVSxlQUFlOztBQUU3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBLCtCQUErQix5QkFBeUIsZ0NBQWdDLElBQUksUUFBUSxJQUFJLFFBQVEsSUFBSSxRQUFRLElBQUksaUNBQWlDLEdBQUc7QUFDcEs7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQzVFZTtBQUNmO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixLQUFLO0FBQ0wsWUFBWSxtQkFBbUI7QUFDL0I7QUFDQTtBQUNBLGNBQWMsNkJBQTZCO0FBQzNDLGVBQWUsY0FBYztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixLQUFLO0FBQ0wsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixlQUFlLDZCQUE2QjtBQUM1QztBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsYUFBYTtBQUNqQyxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTixZQUFZLGtCQUFrQjtBQUM5QixjQUFjLGtCQUFrQjtBQUNoQyxLQUFLO0FBQ0wsSUFBSTtBQUNKO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3BHMkI7O0FBRXlCO0FBQ0E7QUFDTjtBQUNJO0FBQ0g7O0FBRS9DO0FBQ0EsQ0FBQyxpRUFBVztBQUNaLENBQUMsaUVBQVc7QUFDWixDQUFDLDhEQUFRO0FBQ1QsQ0FBQyxnRUFBVTtBQUNYLENBQUMsOERBQVM7QUFDVixDQUFDOzs7Ozs7O1VDZEQ7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDckJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSxzRjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSxzREFBc0Qsa0JBQWtCO1dBQ3hFO1dBQ0EsK0NBQStDLGNBQWM7V0FDN0QsRTs7OztVQ05BO1VBQ0E7VUFDQTtVQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogYW5pbWUuanMgdjMuMi4xXG4gKiAoYykgMjAyMCBKdWxpYW4gR2FybmllclxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBhbmltZWpzLmNvbVxuICovXG5cbi8vIERlZmF1bHRzXG5cbnZhciBkZWZhdWx0SW5zdGFuY2VTZXR0aW5ncyA9IHtcbiAgdXBkYXRlOiBudWxsLFxuICBiZWdpbjogbnVsbCxcbiAgbG9vcEJlZ2luOiBudWxsLFxuICBjaGFuZ2VCZWdpbjogbnVsbCxcbiAgY2hhbmdlOiBudWxsLFxuICBjaGFuZ2VDb21wbGV0ZTogbnVsbCxcbiAgbG9vcENvbXBsZXRlOiBudWxsLFxuICBjb21wbGV0ZTogbnVsbCxcbiAgbG9vcDogMSxcbiAgZGlyZWN0aW9uOiAnbm9ybWFsJyxcbiAgYXV0b3BsYXk6IHRydWUsXG4gIHRpbWVsaW5lT2Zmc2V0OiAwXG59O1xuXG52YXIgZGVmYXVsdFR3ZWVuU2V0dGluZ3MgPSB7XG4gIGR1cmF0aW9uOiAxMDAwLFxuICBkZWxheTogMCxcbiAgZW5kRGVsYXk6IDAsXG4gIGVhc2luZzogJ2Vhc2VPdXRFbGFzdGljKDEsIC41KScsXG4gIHJvdW5kOiAwXG59O1xuXG52YXIgdmFsaWRUcmFuc2Zvcm1zID0gWyd0cmFuc2xhdGVYJywgJ3RyYW5zbGF0ZVknLCAndHJhbnNsYXRlWicsICdyb3RhdGUnLCAncm90YXRlWCcsICdyb3RhdGVZJywgJ3JvdGF0ZVonLCAnc2NhbGUnLCAnc2NhbGVYJywgJ3NjYWxlWScsICdzY2FsZVonLCAnc2tldycsICdza2V3WCcsICdza2V3WScsICdwZXJzcGVjdGl2ZScsICdtYXRyaXgnLCAnbWF0cml4M2QnXTtcblxuLy8gQ2FjaGluZ1xuXG52YXIgY2FjaGUgPSB7XG4gIENTUzoge30sXG4gIHNwcmluZ3M6IHt9XG59O1xuXG4vLyBVdGlsc1xuXG5mdW5jdGlvbiBtaW5NYXgodmFsLCBtaW4sIG1heCkge1xuICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgodmFsLCBtaW4pLCBtYXgpO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdDb250YWlucyhzdHIsIHRleHQpIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKHRleHQpID4gLTE7XG59XG5cbmZ1bmN0aW9uIGFwcGx5QXJndW1lbnRzKGZ1bmMsIGFyZ3MpIHtcbiAgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7XG59XG5cbnZhciBpcyA9IHtcbiAgYXJyOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gQXJyYXkuaXNBcnJheShhKTsgfSxcbiAgb2JqOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gc3RyaW5nQ29udGFpbnMoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpLCAnT2JqZWN0Jyk7IH0sXG4gIHB0aDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGlzLm9iaihhKSAmJiBhLmhhc093blByb3BlcnR5KCd0b3RhbExlbmd0aCcpOyB9LFxuICBzdmc6IGZ1bmN0aW9uIChhKSB7IHJldHVybiBhIGluc3RhbmNlb2YgU1ZHRWxlbWVudDsgfSxcbiAgaW5wOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gYSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQ7IH0sXG4gIGRvbTogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGEubm9kZVR5cGUgfHwgaXMuc3ZnKGEpOyB9LFxuICBzdHI6IGZ1bmN0aW9uIChhKSB7IHJldHVybiB0eXBlb2YgYSA9PT0gJ3N0cmluZyc7IH0sXG4gIGZuYzogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIHR5cGVvZiBhID09PSAnZnVuY3Rpb24nOyB9LFxuICB1bmQ6IGZ1bmN0aW9uIChhKSB7IHJldHVybiB0eXBlb2YgYSA9PT0gJ3VuZGVmaW5lZCc7IH0sXG4gIG5pbDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGlzLnVuZChhKSB8fCBhID09PSBudWxsOyB9LFxuICBoZXg6IGZ1bmN0aW9uIChhKSB7IHJldHVybiAvKF4jWzAtOUEtRl17Nn0kKXwoXiNbMC05QS1GXXszfSQpL2kudGVzdChhKTsgfSxcbiAgcmdiOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gL15yZ2IvLnRlc3QoYSk7IH0sXG4gIGhzbDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIC9eaHNsLy50ZXN0KGEpOyB9LFxuICBjb2w6IGZ1bmN0aW9uIChhKSB7IHJldHVybiAoaXMuaGV4KGEpIHx8IGlzLnJnYihhKSB8fCBpcy5oc2woYSkpOyB9LFxuICBrZXk6IGZ1bmN0aW9uIChhKSB7IHJldHVybiAhZGVmYXVsdEluc3RhbmNlU2V0dGluZ3MuaGFzT3duUHJvcGVydHkoYSkgJiYgIWRlZmF1bHRUd2VlblNldHRpbmdzLmhhc093blByb3BlcnR5KGEpICYmIGEgIT09ICd0YXJnZXRzJyAmJiBhICE9PSAna2V5ZnJhbWVzJzsgfSxcbn07XG5cbi8vIEVhc2luZ3NcblxuZnVuY3Rpb24gcGFyc2VFYXNpbmdQYXJhbWV0ZXJzKHN0cmluZykge1xuICB2YXIgbWF0Y2ggPSAvXFwoKFteKV0rKVxcKS8uZXhlYyhzdHJpbmcpO1xuICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXS5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAocCkgeyByZXR1cm4gcGFyc2VGbG9hdChwKTsgfSkgOiBbXTtcbn1cblxuLy8gU3ByaW5nIHNvbHZlciBpbnNwaXJlZCBieSBXZWJraXQgQ29weXJpZ2h0IMKpIDIwMTYgQXBwbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBodHRwczovL3dlYmtpdC5vcmcvZGVtb3Mvc3ByaW5nL3NwcmluZy5qc1xuXG5mdW5jdGlvbiBzcHJpbmcoc3RyaW5nLCBkdXJhdGlvbikge1xuXG4gIHZhciBwYXJhbXMgPSBwYXJzZUVhc2luZ1BhcmFtZXRlcnMoc3RyaW5nKTtcbiAgdmFyIG1hc3MgPSBtaW5NYXgoaXMudW5kKHBhcmFtc1swXSkgPyAxIDogcGFyYW1zWzBdLCAuMSwgMTAwKTtcbiAgdmFyIHN0aWZmbmVzcyA9IG1pbk1heChpcy51bmQocGFyYW1zWzFdKSA/IDEwMCA6IHBhcmFtc1sxXSwgLjEsIDEwMCk7XG4gIHZhciBkYW1waW5nID0gbWluTWF4KGlzLnVuZChwYXJhbXNbMl0pID8gMTAgOiBwYXJhbXNbMl0sIC4xLCAxMDApO1xuICB2YXIgdmVsb2NpdHkgPSAgbWluTWF4KGlzLnVuZChwYXJhbXNbM10pID8gMCA6IHBhcmFtc1szXSwgLjEsIDEwMCk7XG4gIHZhciB3MCA9IE1hdGguc3FydChzdGlmZm5lc3MgLyBtYXNzKTtcbiAgdmFyIHpldGEgPSBkYW1waW5nIC8gKDIgKiBNYXRoLnNxcnQoc3RpZmZuZXNzICogbWFzcykpO1xuICB2YXIgd2QgPSB6ZXRhIDwgMSA/IHcwICogTWF0aC5zcXJ0KDEgLSB6ZXRhICogemV0YSkgOiAwO1xuICB2YXIgYSA9IDE7XG4gIHZhciBiID0gemV0YSA8IDEgPyAoemV0YSAqIHcwICsgLXZlbG9jaXR5KSAvIHdkIDogLXZlbG9jaXR5ICsgdzA7XG5cbiAgZnVuY3Rpb24gc29sdmVyKHQpIHtcbiAgICB2YXIgcHJvZ3Jlc3MgPSBkdXJhdGlvbiA/IChkdXJhdGlvbiAqIHQpIC8gMTAwMCA6IHQ7XG4gICAgaWYgKHpldGEgPCAxKSB7XG4gICAgICBwcm9ncmVzcyA9IE1hdGguZXhwKC1wcm9ncmVzcyAqIHpldGEgKiB3MCkgKiAoYSAqIE1hdGguY29zKHdkICogcHJvZ3Jlc3MpICsgYiAqIE1hdGguc2luKHdkICogcHJvZ3Jlc3MpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3Jlc3MgPSAoYSArIGIgKiBwcm9ncmVzcykgKiBNYXRoLmV4cCgtcHJvZ3Jlc3MgKiB3MCk7XG4gICAgfVxuICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHsgcmV0dXJuIHQ7IH1cbiAgICByZXR1cm4gMSAtIHByb2dyZXNzO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RHVyYXRpb24oKSB7XG4gICAgdmFyIGNhY2hlZCA9IGNhY2hlLnNwcmluZ3Nbc3RyaW5nXTtcbiAgICBpZiAoY2FjaGVkKSB7IHJldHVybiBjYWNoZWQ7IH1cbiAgICB2YXIgZnJhbWUgPSAxLzY7XG4gICAgdmFyIGVsYXBzZWQgPSAwO1xuICAgIHZhciByZXN0ID0gMDtcbiAgICB3aGlsZSh0cnVlKSB7XG4gICAgICBlbGFwc2VkICs9IGZyYW1lO1xuICAgICAgaWYgKHNvbHZlcihlbGFwc2VkKSA9PT0gMSkge1xuICAgICAgICByZXN0Kys7XG4gICAgICAgIGlmIChyZXN0ID49IDE2KSB7IGJyZWFrOyB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN0ID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGR1cmF0aW9uID0gZWxhcHNlZCAqIGZyYW1lICogMTAwMDtcbiAgICBjYWNoZS5zcHJpbmdzW3N0cmluZ10gPSBkdXJhdGlvbjtcbiAgICByZXR1cm4gZHVyYXRpb247XG4gIH1cblxuICByZXR1cm4gZHVyYXRpb24gPyBzb2x2ZXIgOiBnZXREdXJhdGlvbjtcblxufVxuXG4vLyBCYXNpYyBzdGVwcyBlYXNpbmcgaW1wbGVtZW50YXRpb24gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZnIvZG9jcy9XZWIvQ1NTL3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uXG5cbmZ1bmN0aW9uIHN0ZXBzKHN0ZXBzKSB7XG4gIGlmICggc3RlcHMgPT09IHZvaWQgMCApIHN0ZXBzID0gMTA7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiBNYXRoLmNlaWwoKG1pbk1heCh0LCAwLjAwMDAwMSwgMSkpICogc3RlcHMpICogKDEgLyBzdGVwcyk7IH07XG59XG5cbi8vIEJlemllckVhc2luZyBodHRwczovL2dpdGh1Yi5jb20vZ3JlL2Jlemllci1lYXNpbmdcblxudmFyIGJlemllciA9IChmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGtTcGxpbmVUYWJsZVNpemUgPSAxMTtcbiAgdmFyIGtTYW1wbGVTdGVwU2l6ZSA9IDEuMCAvIChrU3BsaW5lVGFibGVTaXplIC0gMS4wKTtcblxuICBmdW5jdGlvbiBBKGFBMSwgYUEyKSB7IHJldHVybiAxLjAgLSAzLjAgKiBhQTIgKyAzLjAgKiBhQTEgfVxuICBmdW5jdGlvbiBCKGFBMSwgYUEyKSB7IHJldHVybiAzLjAgKiBhQTIgLSA2LjAgKiBhQTEgfVxuICBmdW5jdGlvbiBDKGFBMSkgICAgICB7IHJldHVybiAzLjAgKiBhQTEgfVxuXG4gIGZ1bmN0aW9uIGNhbGNCZXppZXIoYVQsIGFBMSwgYUEyKSB7IHJldHVybiAoKEEoYUExLCBhQTIpICogYVQgKyBCKGFBMSwgYUEyKSkgKiBhVCArIEMoYUExKSkgKiBhVCB9XG4gIGZ1bmN0aW9uIGdldFNsb3BlKGFULCBhQTEsIGFBMikgeyByZXR1cm4gMy4wICogQShhQTEsIGFBMikgKiBhVCAqIGFUICsgMi4wICogQihhQTEsIGFBMikgKiBhVCArIEMoYUExKSB9XG5cbiAgZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlKGFYLCBhQSwgYUIsIG1YMSwgbVgyKSB7XG4gICAgdmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XG4gICAgZG8ge1xuICAgICAgY3VycmVudFQgPSBhQSArIChhQiAtIGFBKSAvIDIuMDtcbiAgICAgIGN1cnJlbnRYID0gY2FsY0JlemllcihjdXJyZW50VCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICBpZiAoY3VycmVudFggPiAwLjApIHsgYUIgPSBjdXJyZW50VDsgfSBlbHNlIHsgYUEgPSBjdXJyZW50VDsgfVxuICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IDAuMDAwMDAwMSAmJiArK2kgPCAxMCk7XG4gICAgcmV0dXJuIGN1cnJlbnRUO1xuICB9XG5cbiAgZnVuY3Rpb24gbmV3dG9uUmFwaHNvbkl0ZXJhdGUoYVgsIGFHdWVzc1QsIG1YMSwgbVgyKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcbiAgICAgIHZhciBjdXJyZW50U2xvcGUgPSBnZXRTbG9wZShhR3Vlc3NULCBtWDEsIG1YMik7XG4gICAgICBpZiAoY3VycmVudFNsb3BlID09PSAwLjApIHsgcmV0dXJuIGFHdWVzc1Q7IH1cbiAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICBhR3Vlc3NUIC09IGN1cnJlbnRYIC8gY3VycmVudFNsb3BlO1xuICAgIH1cbiAgICByZXR1cm4gYUd1ZXNzVDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJlemllcihtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcblxuICAgIGlmICghKDAgPD0gbVgxICYmIG1YMSA8PSAxICYmIDAgPD0gbVgyICYmIG1YMiA8PSAxKSkgeyByZXR1cm47IH1cbiAgICB2YXIgc2FtcGxlVmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheShrU3BsaW5lVGFibGVTaXplKTtcblxuICAgIGlmIChtWDEgIT09IG1ZMSB8fCBtWDIgIT09IG1ZMikge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrU3BsaW5lVGFibGVTaXplOyArK2kpIHtcbiAgICAgICAgc2FtcGxlVmFsdWVzW2ldID0gY2FsY0JlemllcihpICoga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0VEZvclgoYVgpIHtcblxuICAgICAgdmFyIGludGVydmFsU3RhcnQgPSAwO1xuICAgICAgdmFyIGN1cnJlbnRTYW1wbGUgPSAxO1xuICAgICAgdmFyIGxhc3RTYW1wbGUgPSBrU3BsaW5lVGFibGVTaXplIC0gMTtcblxuICAgICAgZm9yICg7IGN1cnJlbnRTYW1wbGUgIT09IGxhc3RTYW1wbGUgJiYgc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyArK2N1cnJlbnRTYW1wbGUpIHtcbiAgICAgICAgaW50ZXJ2YWxTdGFydCArPSBrU2FtcGxlU3RlcFNpemU7XG4gICAgICB9XG5cbiAgICAgIC0tY3VycmVudFNhbXBsZTtcblxuICAgICAgdmFyIGRpc3QgPSAoYVggLSBzYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pIC8gKHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlICsgMV0gLSBzYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pO1xuICAgICAgdmFyIGd1ZXNzRm9yVCA9IGludGVydmFsU3RhcnQgKyBkaXN0ICoga1NhbXBsZVN0ZXBTaXplO1xuICAgICAgdmFyIGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xuXG4gICAgICBpZiAoaW5pdGlhbFNsb3BlID49IDAuMDAxKSB7XG4gICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JULCBtWDEsIG1YMik7XG4gICAgICB9IGVsc2UgaWYgKGluaXRpYWxTbG9wZSA9PT0gMC4wKSB7XG4gICAgICAgIHJldHVybiBndWVzc0ZvclQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gYmluYXJ5U3ViZGl2aWRlKGFYLCBpbnRlcnZhbFN0YXJ0LCBpbnRlcnZhbFN0YXJ0ICsga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHgpIHtcbiAgICAgIGlmIChtWDEgPT09IG1ZMSAmJiBtWDIgPT09IG1ZMikgeyByZXR1cm4geDsgfVxuICAgICAgaWYgKHggPT09IDAgfHwgeCA9PT0gMSkgeyByZXR1cm4geDsgfVxuICAgICAgcmV0dXJuIGNhbGNCZXppZXIoZ2V0VEZvclgoeCksIG1ZMSwgbVkyKTtcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBiZXppZXI7XG5cbn0pKCk7XG5cbnZhciBwZW5uZXIgPSAoZnVuY3Rpb24gKCkge1xuXG4gIC8vIEJhc2VkIG9uIGpRdWVyeSBVSSdzIGltcGxlbWVuYXRpb24gb2YgZWFzaW5nIGVxdWF0aW9ucyBmcm9tIFJvYmVydCBQZW5uZXIgKGh0dHA6Ly93d3cucm9iZXJ0cGVubmVyLmNvbS9lYXNpbmcpXG5cbiAgdmFyIGVhc2VzID0geyBsaW5lYXI6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiB0OyB9OyB9IH07XG5cbiAgdmFyIGZ1bmN0aW9uRWFzaW5ncyA9IHtcbiAgICBTaW5lOiBmdW5jdGlvbiAoKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gMSAtIE1hdGguY29zKHQgKiBNYXRoLlBJIC8gMik7IH07IH0sXG4gICAgQ2lyYzogZnVuY3Rpb24gKCkgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIDEgLSBNYXRoLnNxcnQoMSAtIHQgKiB0KTsgfTsgfSxcbiAgICBCYWNrOiBmdW5jdGlvbiAoKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gdCAqIHQgKiAoMyAqIHQgLSAyKTsgfTsgfSxcbiAgICBCb3VuY2U6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XG4gICAgICB2YXIgcG93MiwgYiA9IDQ7XG4gICAgICB3aGlsZSAodCA8ICgoIHBvdzIgPSBNYXRoLnBvdygyLCAtLWIpKSAtIDEpIC8gMTEpIHt9XG4gICAgICByZXR1cm4gMSAvIE1hdGgucG93KDQsIDMgLSBiKSAtIDcuNTYyNSAqIE1hdGgucG93KCggcG93MiAqIDMgLSAyICkgLyAyMiAtIHQsIDIpXG4gICAgfTsgfSxcbiAgICBFbGFzdGljOiBmdW5jdGlvbiAoYW1wbGl0dWRlLCBwZXJpb2QpIHtcbiAgICAgIGlmICggYW1wbGl0dWRlID09PSB2b2lkIDAgKSBhbXBsaXR1ZGUgPSAxO1xuICAgICAgaWYgKCBwZXJpb2QgPT09IHZvaWQgMCApIHBlcmlvZCA9IC41O1xuXG4gICAgICB2YXIgYSA9IG1pbk1heChhbXBsaXR1ZGUsIDEsIDEwKTtcbiAgICAgIHZhciBwID0gbWluTWF4KHBlcmlvZCwgLjEsIDIpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHJldHVybiAodCA9PT0gMCB8fCB0ID09PSAxKSA/IHQgOiBcbiAgICAgICAgICAtYSAqIE1hdGgucG93KDIsIDEwICogKHQgLSAxKSkgKiBNYXRoLnNpbigoKCh0IC0gMSkgLSAocCAvIChNYXRoLlBJICogMikgKiBNYXRoLmFzaW4oMSAvIGEpKSkgKiAoTWF0aC5QSSAqIDIpKSAvIHApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB2YXIgYmFzZUVhc2luZ3MgPSBbJ1F1YWQnLCAnQ3ViaWMnLCAnUXVhcnQnLCAnUXVpbnQnLCAnRXhwbyddO1xuXG4gIGJhc2VFYXNpbmdzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUsIGkpIHtcbiAgICBmdW5jdGlvbkVhc2luZ3NbbmFtZV0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gTWF0aC5wb3codCwgaSArIDIpOyB9OyB9O1xuICB9KTtcblxuICBPYmplY3Qua2V5cyhmdW5jdGlvbkVhc2luZ3MpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgZWFzZUluID0gZnVuY3Rpb25FYXNpbmdzW25hbWVdO1xuICAgIGVhc2VzWydlYXNlSW4nICsgbmFtZV0gPSBlYXNlSW47XG4gICAgZWFzZXNbJ2Vhc2VPdXQnICsgbmFtZV0gPSBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIDEgLSBlYXNlSW4oYSwgYikoMSAtIHQpOyB9OyB9O1xuICAgIGVhc2VzWydlYXNlSW5PdXQnICsgbmFtZV0gPSBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQgPCAwLjUgPyBlYXNlSW4oYSwgYikodCAqIDIpIC8gMiA6IFxuICAgICAgMSAtIGVhc2VJbihhLCBiKSh0ICogLTIgKyAyKSAvIDI7IH07IH07XG4gICAgZWFzZXNbJ2Vhc2VPdXRJbicgKyBuYW1lXSA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gdCA8IDAuNSA/ICgxIC0gZWFzZUluKGEsIGIpKDEgLSB0ICogMikpIC8gMiA6IFxuICAgICAgKGVhc2VJbihhLCBiKSh0ICogMiAtIDEpICsgMSkgLyAyOyB9OyB9O1xuICB9KTtcblxuICByZXR1cm4gZWFzZXM7XG5cbn0pKCk7XG5cbmZ1bmN0aW9uIHBhcnNlRWFzaW5ncyhlYXNpbmcsIGR1cmF0aW9uKSB7XG4gIGlmIChpcy5mbmMoZWFzaW5nKSkgeyByZXR1cm4gZWFzaW5nOyB9XG4gIHZhciBuYW1lID0gZWFzaW5nLnNwbGl0KCcoJylbMF07XG4gIHZhciBlYXNlID0gcGVubmVyW25hbWVdO1xuICB2YXIgYXJncyA9IHBhcnNlRWFzaW5nUGFyYW1ldGVycyhlYXNpbmcpO1xuICBzd2l0Y2ggKG5hbWUpIHtcbiAgICBjYXNlICdzcHJpbmcnIDogcmV0dXJuIHNwcmluZyhlYXNpbmcsIGR1cmF0aW9uKTtcbiAgICBjYXNlICdjdWJpY0JlemllcicgOiByZXR1cm4gYXBwbHlBcmd1bWVudHMoYmV6aWVyLCBhcmdzKTtcbiAgICBjYXNlICdzdGVwcycgOiByZXR1cm4gYXBwbHlBcmd1bWVudHMoc3RlcHMsIGFyZ3MpO1xuICAgIGRlZmF1bHQgOiByZXR1cm4gYXBwbHlBcmd1bWVudHMoZWFzZSwgYXJncyk7XG4gIH1cbn1cblxuLy8gU3RyaW5nc1xuXG5mdW5jdGlvbiBzZWxlY3RTdHJpbmcoc3RyKSB7XG4gIHRyeSB7XG4gICAgdmFyIG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzdHIpO1xuICAgIHJldHVybiBub2RlcztcbiAgfSBjYXRjaChlKSB7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBmaWx0ZXJBcnJheShhcnIsIGNhbGxiYWNrKSB7XG4gIHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50cy5sZW5ndGggPj0gMiA/IGFyZ3VtZW50c1sxXSA6IHZvaWQgMDtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGkgaW4gYXJyKSB7XG4gICAgICB2YXIgdmFsID0gYXJyW2ldO1xuICAgICAgaWYgKGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdmFsLCBpLCBhcnIpKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHZhbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5BcnJheShhcnIpIHtcbiAgcmV0dXJuIGFyci5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuY29uY2F0KGlzLmFycihiKSA/IGZsYXR0ZW5BcnJheShiKSA6IGIpOyB9LCBbXSk7XG59XG5cbmZ1bmN0aW9uIHRvQXJyYXkobykge1xuICBpZiAoaXMuYXJyKG8pKSB7IHJldHVybiBvOyB9XG4gIGlmIChpcy5zdHIobykpIHsgbyA9IHNlbGVjdFN0cmluZyhvKSB8fCBvOyB9XG4gIGlmIChvIGluc3RhbmNlb2YgTm9kZUxpc3QgfHwgbyBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uKSB7IHJldHVybiBbXS5zbGljZS5jYWxsKG8pOyB9XG4gIHJldHVybiBbb107XG59XG5cbmZ1bmN0aW9uIGFycmF5Q29udGFpbnMoYXJyLCB2YWwpIHtcbiAgcmV0dXJuIGFyci5zb21lKGZ1bmN0aW9uIChhKSB7IHJldHVybiBhID09PSB2YWw7IH0pO1xufVxuXG4vLyBPYmplY3RzXG5cbmZ1bmN0aW9uIGNsb25lT2JqZWN0KG8pIHtcbiAgdmFyIGNsb25lID0ge307XG4gIGZvciAodmFyIHAgaW4gbykgeyBjbG9uZVtwXSA9IG9bcF07IH1cbiAgcmV0dXJuIGNsb25lO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlT2JqZWN0UHJvcHMobzEsIG8yKSB7XG4gIHZhciBvID0gY2xvbmVPYmplY3QobzEpO1xuICBmb3IgKHZhciBwIGluIG8xKSB7IG9bcF0gPSBvMi5oYXNPd25Qcm9wZXJ0eShwKSA/IG8yW3BdIDogbzFbcF07IH1cbiAgcmV0dXJuIG87XG59XG5cbmZ1bmN0aW9uIG1lcmdlT2JqZWN0cyhvMSwgbzIpIHtcbiAgdmFyIG8gPSBjbG9uZU9iamVjdChvMSk7XG4gIGZvciAodmFyIHAgaW4gbzIpIHsgb1twXSA9IGlzLnVuZChvMVtwXSkgPyBvMltwXSA6IG8xW3BdOyB9XG4gIHJldHVybiBvO1xufVxuXG4vLyBDb2xvcnNcblxuZnVuY3Rpb24gcmdiVG9SZ2JhKHJnYlZhbHVlKSB7XG4gIHZhciByZ2IgPSAvcmdiXFwoKFxcZCssXFxzKltcXGRdKyxcXHMqW1xcZF0rKVxcKS9nLmV4ZWMocmdiVmFsdWUpO1xuICByZXR1cm4gcmdiID8gKFwicmdiYShcIiArIChyZ2JbMV0pICsgXCIsMSlcIikgOiByZ2JWYWx1ZTtcbn1cblxuZnVuY3Rpb24gaGV4VG9SZ2JhKGhleFZhbHVlKSB7XG4gIHZhciByZ3ggPSAvXiM/KFthLWZcXGRdKShbYS1mXFxkXSkoW2EtZlxcZF0pJC9pO1xuICB2YXIgaGV4ID0gaGV4VmFsdWUucmVwbGFjZShyZ3gsIGZ1bmN0aW9uIChtLCByLCBnLCBiKSB7IHJldHVybiByICsgciArIGcgKyBnICsgYiArIGI7IH0gKTtcbiAgdmFyIHJnYiA9IC9eIz8oW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkkL2kuZXhlYyhoZXgpO1xuICB2YXIgciA9IHBhcnNlSW50KHJnYlsxXSwgMTYpO1xuICB2YXIgZyA9IHBhcnNlSW50KHJnYlsyXSwgMTYpO1xuICB2YXIgYiA9IHBhcnNlSW50KHJnYlszXSwgMTYpO1xuICByZXR1cm4gKFwicmdiYShcIiArIHIgKyBcIixcIiArIGcgKyBcIixcIiArIGIgKyBcIiwxKVwiKTtcbn1cblxuZnVuY3Rpb24gaHNsVG9SZ2JhKGhzbFZhbHVlKSB7XG4gIHZhciBoc2wgPSAvaHNsXFwoKFxcZCspLFxccyooW1xcZC5dKyklLFxccyooW1xcZC5dKyklXFwpL2cuZXhlYyhoc2xWYWx1ZSkgfHwgL2hzbGFcXCgoXFxkKyksXFxzKihbXFxkLl0rKSUsXFxzKihbXFxkLl0rKSUsXFxzKihbXFxkLl0rKVxcKS9nLmV4ZWMoaHNsVmFsdWUpO1xuICB2YXIgaCA9IHBhcnNlSW50KGhzbFsxXSwgMTApIC8gMzYwO1xuICB2YXIgcyA9IHBhcnNlSW50KGhzbFsyXSwgMTApIC8gMTAwO1xuICB2YXIgbCA9IHBhcnNlSW50KGhzbFszXSwgMTApIC8gMTAwO1xuICB2YXIgYSA9IGhzbFs0XSB8fCAxO1xuICBmdW5jdGlvbiBodWUycmdiKHAsIHEsIHQpIHtcbiAgICBpZiAodCA8IDApIHsgdCArPSAxOyB9XG4gICAgaWYgKHQgPiAxKSB7IHQgLT0gMTsgfVxuICAgIGlmICh0IDwgMS82KSB7IHJldHVybiBwICsgKHEgLSBwKSAqIDYgKiB0OyB9XG4gICAgaWYgKHQgPCAxLzIpIHsgcmV0dXJuIHE7IH1cbiAgICBpZiAodCA8IDIvMykgeyByZXR1cm4gcCArIChxIC0gcCkgKiAoMi8zIC0gdCkgKiA2OyB9XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgdmFyIHIsIGcsIGI7XG4gIGlmIChzID09IDApIHtcbiAgICByID0gZyA9IGIgPSBsO1xuICB9IGVsc2Uge1xuICAgIHZhciBxID0gbCA8IDAuNSA/IGwgKiAoMSArIHMpIDogbCArIHMgLSBsICogcztcbiAgICB2YXIgcCA9IDIgKiBsIC0gcTtcbiAgICByID0gaHVlMnJnYihwLCBxLCBoICsgMS8zKTtcbiAgICBnID0gaHVlMnJnYihwLCBxLCBoKTtcbiAgICBiID0gaHVlMnJnYihwLCBxLCBoIC0gMS8zKTtcbiAgfVxuICByZXR1cm4gKFwicmdiYShcIiArIChyICogMjU1KSArIFwiLFwiICsgKGcgKiAyNTUpICsgXCIsXCIgKyAoYiAqIDI1NSkgKyBcIixcIiArIGEgKyBcIilcIik7XG59XG5cbmZ1bmN0aW9uIGNvbG9yVG9SZ2IodmFsKSB7XG4gIGlmIChpcy5yZ2IodmFsKSkgeyByZXR1cm4gcmdiVG9SZ2JhKHZhbCk7IH1cbiAgaWYgKGlzLmhleCh2YWwpKSB7IHJldHVybiBoZXhUb1JnYmEodmFsKTsgfVxuICBpZiAoaXMuaHNsKHZhbCkpIHsgcmV0dXJuIGhzbFRvUmdiYSh2YWwpOyB9XG59XG5cbi8vIFVuaXRzXG5cbmZ1bmN0aW9uIGdldFVuaXQodmFsKSB7XG4gIHZhciBzcGxpdCA9IC9bKy1dP1xcZCpcXC4/XFxkKyg/OlxcLlxcZCspPyg/OltlRV1bKy1dP1xcZCspPyglfHB4fHB0fGVtfHJlbXxpbnxjbXxtbXxleHxjaHxwY3x2d3x2aHx2bWlufHZtYXh8ZGVnfHJhZHx0dXJuKT8kLy5leGVjKHZhbCk7XG4gIGlmIChzcGxpdCkgeyByZXR1cm4gc3BsaXRbMV07IH1cbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtVW5pdChwcm9wTmFtZSkge1xuICBpZiAoc3RyaW5nQ29udGFpbnMocHJvcE5hbWUsICd0cmFuc2xhdGUnKSB8fCBwcm9wTmFtZSA9PT0gJ3BlcnNwZWN0aXZlJykgeyByZXR1cm4gJ3B4JzsgfVxuICBpZiAoc3RyaW5nQ29udGFpbnMocHJvcE5hbWUsICdyb3RhdGUnKSB8fCBzdHJpbmdDb250YWlucyhwcm9wTmFtZSwgJ3NrZXcnKSkgeyByZXR1cm4gJ2RlZyc7IH1cbn1cblxuLy8gVmFsdWVzXG5cbmZ1bmN0aW9uIGdldEZ1bmN0aW9uVmFsdWUodmFsLCBhbmltYXRhYmxlKSB7XG4gIGlmICghaXMuZm5jKHZhbCkpIHsgcmV0dXJuIHZhbDsgfVxuICByZXR1cm4gdmFsKGFuaW1hdGFibGUudGFyZ2V0LCBhbmltYXRhYmxlLmlkLCBhbmltYXRhYmxlLnRvdGFsKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlKGVsLCBwcm9wKSB7XG4gIHJldHVybiBlbC5nZXRBdHRyaWJ1dGUocHJvcCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRQeFRvVW5pdChlbCwgdmFsdWUsIHVuaXQpIHtcbiAgdmFyIHZhbHVlVW5pdCA9IGdldFVuaXQodmFsdWUpO1xuICBpZiAoYXJyYXlDb250YWlucyhbdW5pdCwgJ2RlZycsICdyYWQnLCAndHVybiddLCB2YWx1ZVVuaXQpKSB7IHJldHVybiB2YWx1ZTsgfVxuICB2YXIgY2FjaGVkID0gY2FjaGUuQ1NTW3ZhbHVlICsgdW5pdF07XG4gIGlmICghaXMudW5kKGNhY2hlZCkpIHsgcmV0dXJuIGNhY2hlZDsgfVxuICB2YXIgYmFzZWxpbmUgPSAxMDA7XG4gIHZhciB0ZW1wRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsLnRhZ05hbWUpO1xuICB2YXIgcGFyZW50RWwgPSAoZWwucGFyZW50Tm9kZSAmJiAoZWwucGFyZW50Tm9kZSAhPT0gZG9jdW1lbnQpKSA/IGVsLnBhcmVudE5vZGUgOiBkb2N1bWVudC5ib2R5O1xuICBwYXJlbnRFbC5hcHBlbmRDaGlsZCh0ZW1wRWwpO1xuICB0ZW1wRWwuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICB0ZW1wRWwuc3R5bGUud2lkdGggPSBiYXNlbGluZSArIHVuaXQ7XG4gIHZhciBmYWN0b3IgPSBiYXNlbGluZSAvIHRlbXBFbC5vZmZzZXRXaWR0aDtcbiAgcGFyZW50RWwucmVtb3ZlQ2hpbGQodGVtcEVsKTtcbiAgdmFyIGNvbnZlcnRlZFVuaXQgPSBmYWN0b3IgKiBwYXJzZUZsb2F0KHZhbHVlKTtcbiAgY2FjaGUuQ1NTW3ZhbHVlICsgdW5pdF0gPSBjb252ZXJ0ZWRVbml0O1xuICByZXR1cm4gY29udmVydGVkVW5pdDtcbn1cblxuZnVuY3Rpb24gZ2V0Q1NTVmFsdWUoZWwsIHByb3AsIHVuaXQpIHtcbiAgaWYgKHByb3AgaW4gZWwuc3R5bGUpIHtcbiAgICB2YXIgdXBwZXJjYXNlUHJvcE5hbWUgPSBwcm9wLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIHZhbHVlID0gZWwuc3R5bGVbcHJvcF0gfHwgZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZ2V0UHJvcGVydHlWYWx1ZSh1cHBlcmNhc2VQcm9wTmFtZSkgfHwgJzAnO1xuICAgIHJldHVybiB1bml0ID8gY29udmVydFB4VG9Vbml0KGVsLCB2YWx1ZSwgdW5pdCkgOiB2YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRBbmltYXRpb25UeXBlKGVsLCBwcm9wKSB7XG4gIGlmIChpcy5kb20oZWwpICYmICFpcy5pbnAoZWwpICYmICghaXMubmlsKGdldEF0dHJpYnV0ZShlbCwgcHJvcCkpIHx8IChpcy5zdmcoZWwpICYmIGVsW3Byb3BdKSkpIHsgcmV0dXJuICdhdHRyaWJ1dGUnOyB9XG4gIGlmIChpcy5kb20oZWwpICYmIGFycmF5Q29udGFpbnModmFsaWRUcmFuc2Zvcm1zLCBwcm9wKSkgeyByZXR1cm4gJ3RyYW5zZm9ybSc7IH1cbiAgaWYgKGlzLmRvbShlbCkgJiYgKHByb3AgIT09ICd0cmFuc2Zvcm0nICYmIGdldENTU1ZhbHVlKGVsLCBwcm9wKSkpIHsgcmV0dXJuICdjc3MnOyB9XG4gIGlmIChlbFtwcm9wXSAhPSBudWxsKSB7IHJldHVybiAnb2JqZWN0JzsgfVxufVxuXG5mdW5jdGlvbiBnZXRFbGVtZW50VHJhbnNmb3JtcyhlbCkge1xuICBpZiAoIWlzLmRvbShlbCkpIHsgcmV0dXJuOyB9XG4gIHZhciBzdHIgPSBlbC5zdHlsZS50cmFuc2Zvcm0gfHwgJyc7XG4gIHZhciByZWcgID0gLyhcXHcrKVxcKChbXildKilcXCkvZztcbiAgdmFyIHRyYW5zZm9ybXMgPSBuZXcgTWFwKCk7XG4gIHZhciBtOyB3aGlsZSAobSA9IHJlZy5leGVjKHN0cikpIHsgdHJhbnNmb3Jtcy5zZXQobVsxXSwgbVsyXSk7IH1cbiAgcmV0dXJuIHRyYW5zZm9ybXM7XG59XG5cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybVZhbHVlKGVsLCBwcm9wTmFtZSwgYW5pbWF0YWJsZSwgdW5pdCkge1xuICB2YXIgZGVmYXVsdFZhbCA9IHN0cmluZ0NvbnRhaW5zKHByb3BOYW1lLCAnc2NhbGUnKSA/IDEgOiAwICsgZ2V0VHJhbnNmb3JtVW5pdChwcm9wTmFtZSk7XG4gIHZhciB2YWx1ZSA9IGdldEVsZW1lbnRUcmFuc2Zvcm1zKGVsKS5nZXQocHJvcE5hbWUpIHx8IGRlZmF1bHRWYWw7XG4gIGlmIChhbmltYXRhYmxlKSB7XG4gICAgYW5pbWF0YWJsZS50cmFuc2Zvcm1zLmxpc3Quc2V0KHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgYW5pbWF0YWJsZS50cmFuc2Zvcm1zWydsYXN0J10gPSBwcm9wTmFtZTtcbiAgfVxuICByZXR1cm4gdW5pdCA/IGNvbnZlcnRQeFRvVW5pdChlbCwgdmFsdWUsIHVuaXQpIDogdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldE9yaWdpbmFsVGFyZ2V0VmFsdWUodGFyZ2V0LCBwcm9wTmFtZSwgdW5pdCwgYW5pbWF0YWJsZSkge1xuICBzd2l0Y2ggKGdldEFuaW1hdGlvblR5cGUodGFyZ2V0LCBwcm9wTmFtZSkpIHtcbiAgICBjYXNlICd0cmFuc2Zvcm0nOiByZXR1cm4gZ2V0VHJhbnNmb3JtVmFsdWUodGFyZ2V0LCBwcm9wTmFtZSwgYW5pbWF0YWJsZSwgdW5pdCk7XG4gICAgY2FzZSAnY3NzJzogcmV0dXJuIGdldENTU1ZhbHVlKHRhcmdldCwgcHJvcE5hbWUsIHVuaXQpO1xuICAgIGNhc2UgJ2F0dHJpYnV0ZSc6IHJldHVybiBnZXRBdHRyaWJ1dGUodGFyZ2V0LCBwcm9wTmFtZSk7XG4gICAgZGVmYXVsdDogcmV0dXJuIHRhcmdldFtwcm9wTmFtZV0gfHwgMDtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZWxhdGl2ZVZhbHVlKHRvLCBmcm9tKSB7XG4gIHZhciBvcGVyYXRvciA9IC9eKFxcKj18XFwrPXwtPSkvLmV4ZWModG8pO1xuICBpZiAoIW9wZXJhdG9yKSB7IHJldHVybiB0bzsgfVxuICB2YXIgdSA9IGdldFVuaXQodG8pIHx8IDA7XG4gIHZhciB4ID0gcGFyc2VGbG9hdChmcm9tKTtcbiAgdmFyIHkgPSBwYXJzZUZsb2F0KHRvLnJlcGxhY2Uob3BlcmF0b3JbMF0sICcnKSk7XG4gIHN3aXRjaCAob3BlcmF0b3JbMF1bMF0pIHtcbiAgICBjYXNlICcrJzogcmV0dXJuIHggKyB5ICsgdTtcbiAgICBjYXNlICctJzogcmV0dXJuIHggLSB5ICsgdTtcbiAgICBjYXNlICcqJzogcmV0dXJuIHggKiB5ICsgdTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVZhbHVlKHZhbCwgdW5pdCkge1xuICBpZiAoaXMuY29sKHZhbCkpIHsgcmV0dXJuIGNvbG9yVG9SZ2IodmFsKTsgfVxuICBpZiAoL1xccy9nLnRlc3QodmFsKSkgeyByZXR1cm4gdmFsOyB9XG4gIHZhciBvcmlnaW5hbFVuaXQgPSBnZXRVbml0KHZhbCk7XG4gIHZhciB1bml0TGVzcyA9IG9yaWdpbmFsVW5pdCA/IHZhbC5zdWJzdHIoMCwgdmFsLmxlbmd0aCAtIG9yaWdpbmFsVW5pdC5sZW5ndGgpIDogdmFsO1xuICBpZiAodW5pdCkgeyByZXR1cm4gdW5pdExlc3MgKyB1bml0OyB9XG4gIHJldHVybiB1bml0TGVzcztcbn1cblxuLy8gZ2V0VG90YWxMZW5ndGgoKSBlcXVpdmFsZW50IGZvciBjaXJjbGUsIHJlY3QsIHBvbHlsaW5lLCBwb2x5Z29uIGFuZCBsaW5lIHNoYXBlc1xuLy8gYWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL1NlYkxhbWJsYS8zZTA1NTBjNDk2YzIzNjcwOTc0NFxuXG5mdW5jdGlvbiBnZXREaXN0YW5jZShwMSwgcDIpIHtcbiAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhwMi54IC0gcDEueCwgMikgKyBNYXRoLnBvdyhwMi55IC0gcDEueSwgMikpO1xufVxuXG5mdW5jdGlvbiBnZXRDaXJjbGVMZW5ndGgoZWwpIHtcbiAgcmV0dXJuIE1hdGguUEkgKiAyICogZ2V0QXR0cmlidXRlKGVsLCAncicpO1xufVxuXG5mdW5jdGlvbiBnZXRSZWN0TGVuZ3RoKGVsKSB7XG4gIHJldHVybiAoZ2V0QXR0cmlidXRlKGVsLCAnd2lkdGgnKSAqIDIpICsgKGdldEF0dHJpYnV0ZShlbCwgJ2hlaWdodCcpICogMik7XG59XG5cbmZ1bmN0aW9uIGdldExpbmVMZW5ndGgoZWwpIHtcbiAgcmV0dXJuIGdldERpc3RhbmNlKFxuICAgIHt4OiBnZXRBdHRyaWJ1dGUoZWwsICd4MScpLCB5OiBnZXRBdHRyaWJ1dGUoZWwsICd5MScpfSwgXG4gICAge3g6IGdldEF0dHJpYnV0ZShlbCwgJ3gyJyksIHk6IGdldEF0dHJpYnV0ZShlbCwgJ3kyJyl9XG4gICk7XG59XG5cbmZ1bmN0aW9uIGdldFBvbHlsaW5lTGVuZ3RoKGVsKSB7XG4gIHZhciBwb2ludHMgPSBlbC5wb2ludHM7XG4gIHZhciB0b3RhbExlbmd0aCA9IDA7XG4gIHZhciBwcmV2aW91c1BvcztcbiAgZm9yICh2YXIgaSA9IDAgOyBpIDwgcG9pbnRzLm51bWJlck9mSXRlbXM7IGkrKykge1xuICAgIHZhciBjdXJyZW50UG9zID0gcG9pbnRzLmdldEl0ZW0oaSk7XG4gICAgaWYgKGkgPiAwKSB7IHRvdGFsTGVuZ3RoICs9IGdldERpc3RhbmNlKHByZXZpb3VzUG9zLCBjdXJyZW50UG9zKTsgfVxuICAgIHByZXZpb3VzUG9zID0gY3VycmVudFBvcztcbiAgfVxuICByZXR1cm4gdG90YWxMZW5ndGg7XG59XG5cbmZ1bmN0aW9uIGdldFBvbHlnb25MZW5ndGgoZWwpIHtcbiAgdmFyIHBvaW50cyA9IGVsLnBvaW50cztcbiAgcmV0dXJuIGdldFBvbHlsaW5lTGVuZ3RoKGVsKSArIGdldERpc3RhbmNlKHBvaW50cy5nZXRJdGVtKHBvaW50cy5udW1iZXJPZkl0ZW1zIC0gMSksIHBvaW50cy5nZXRJdGVtKDApKTtcbn1cblxuLy8gUGF0aCBhbmltYXRpb25cblxuZnVuY3Rpb24gZ2V0VG90YWxMZW5ndGgoZWwpIHtcbiAgaWYgKGVsLmdldFRvdGFsTGVuZ3RoKSB7IHJldHVybiBlbC5nZXRUb3RhbExlbmd0aCgpOyB9XG4gIHN3aXRjaChlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdjaXJjbGUnOiByZXR1cm4gZ2V0Q2lyY2xlTGVuZ3RoKGVsKTtcbiAgICBjYXNlICdyZWN0JzogcmV0dXJuIGdldFJlY3RMZW5ndGgoZWwpO1xuICAgIGNhc2UgJ2xpbmUnOiByZXR1cm4gZ2V0TGluZUxlbmd0aChlbCk7XG4gICAgY2FzZSAncG9seWxpbmUnOiByZXR1cm4gZ2V0UG9seWxpbmVMZW5ndGgoZWwpO1xuICAgIGNhc2UgJ3BvbHlnb24nOiByZXR1cm4gZ2V0UG9seWdvbkxlbmd0aChlbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0RGFzaG9mZnNldChlbCkge1xuICB2YXIgcGF0aExlbmd0aCA9IGdldFRvdGFsTGVuZ3RoKGVsKTtcbiAgZWwuc2V0QXR0cmlidXRlKCdzdHJva2UtZGFzaGFycmF5JywgcGF0aExlbmd0aCk7XG4gIHJldHVybiBwYXRoTGVuZ3RoO1xufVxuXG4vLyBNb3Rpb24gcGF0aFxuXG5mdW5jdGlvbiBnZXRQYXJlbnRTdmdFbChlbCkge1xuICB2YXIgcGFyZW50RWwgPSBlbC5wYXJlbnROb2RlO1xuICB3aGlsZSAoaXMuc3ZnKHBhcmVudEVsKSkge1xuICAgIGlmICghaXMuc3ZnKHBhcmVudEVsLnBhcmVudE5vZGUpKSB7IGJyZWFrOyB9XG4gICAgcGFyZW50RWwgPSBwYXJlbnRFbC5wYXJlbnROb2RlO1xuICB9XG4gIHJldHVybiBwYXJlbnRFbDtcbn1cblxuZnVuY3Rpb24gZ2V0UGFyZW50U3ZnKHBhdGhFbCwgc3ZnRGF0YSkge1xuICB2YXIgc3ZnID0gc3ZnRGF0YSB8fCB7fTtcbiAgdmFyIHBhcmVudFN2Z0VsID0gc3ZnLmVsIHx8IGdldFBhcmVudFN2Z0VsKHBhdGhFbCk7XG4gIHZhciByZWN0ID0gcGFyZW50U3ZnRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHZhciB2aWV3Qm94QXR0ciA9IGdldEF0dHJpYnV0ZShwYXJlbnRTdmdFbCwgJ3ZpZXdCb3gnKTtcbiAgdmFyIHdpZHRoID0gcmVjdC53aWR0aDtcbiAgdmFyIGhlaWdodCA9IHJlY3QuaGVpZ2h0O1xuICB2YXIgdmlld0JveCA9IHN2Zy52aWV3Qm94IHx8ICh2aWV3Qm94QXR0ciA/IHZpZXdCb3hBdHRyLnNwbGl0KCcgJykgOiBbMCwgMCwgd2lkdGgsIGhlaWdodF0pO1xuICByZXR1cm4ge1xuICAgIGVsOiBwYXJlbnRTdmdFbCxcbiAgICB2aWV3Qm94OiB2aWV3Qm94LFxuICAgIHg6IHZpZXdCb3hbMF0gLyAxLFxuICAgIHk6IHZpZXdCb3hbMV0gLyAxLFxuICAgIHc6IHdpZHRoLFxuICAgIGg6IGhlaWdodCxcbiAgICB2Vzogdmlld0JveFsyXSxcbiAgICB2SDogdmlld0JveFszXVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFBhdGgocGF0aCwgcGVyY2VudCkge1xuICB2YXIgcGF0aEVsID0gaXMuc3RyKHBhdGgpID8gc2VsZWN0U3RyaW5nKHBhdGgpWzBdIDogcGF0aDtcbiAgdmFyIHAgPSBwZXJjZW50IHx8IDEwMDtcbiAgcmV0dXJuIGZ1bmN0aW9uKHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb3BlcnR5OiBwcm9wZXJ0eSxcbiAgICAgIGVsOiBwYXRoRWwsXG4gICAgICBzdmc6IGdldFBhcmVudFN2ZyhwYXRoRWwpLFxuICAgICAgdG90YWxMZW5ndGg6IGdldFRvdGFsTGVuZ3RoKHBhdGhFbCkgKiAocCAvIDEwMClcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGF0aFByb2dyZXNzKHBhdGgsIHByb2dyZXNzLCBpc1BhdGhUYXJnZXRJbnNpZGVTVkcpIHtcbiAgZnVuY3Rpb24gcG9pbnQob2Zmc2V0KSB7XG4gICAgaWYgKCBvZmZzZXQgPT09IHZvaWQgMCApIG9mZnNldCA9IDA7XG5cbiAgICB2YXIgbCA9IHByb2dyZXNzICsgb2Zmc2V0ID49IDEgPyBwcm9ncmVzcyArIG9mZnNldCA6IDA7XG4gICAgcmV0dXJuIHBhdGguZWwuZ2V0UG9pbnRBdExlbmd0aChsKTtcbiAgfVxuICB2YXIgc3ZnID0gZ2V0UGFyZW50U3ZnKHBhdGguZWwsIHBhdGguc3ZnKTtcbiAgdmFyIHAgPSBwb2ludCgpO1xuICB2YXIgcDAgPSBwb2ludCgtMSk7XG4gIHZhciBwMSA9IHBvaW50KCsxKTtcbiAgdmFyIHNjYWxlWCA9IGlzUGF0aFRhcmdldEluc2lkZVNWRyA/IDEgOiBzdmcudyAvIHN2Zy52VztcbiAgdmFyIHNjYWxlWSA9IGlzUGF0aFRhcmdldEluc2lkZVNWRyA/IDEgOiBzdmcuaCAvIHN2Zy52SDtcbiAgc3dpdGNoIChwYXRoLnByb3BlcnR5KSB7XG4gICAgY2FzZSAneCc6IHJldHVybiAocC54IC0gc3ZnLngpICogc2NhbGVYO1xuICAgIGNhc2UgJ3knOiByZXR1cm4gKHAueSAtIHN2Zy55KSAqIHNjYWxlWTtcbiAgICBjYXNlICdhbmdsZSc6IHJldHVybiBNYXRoLmF0YW4yKHAxLnkgLSBwMC55LCBwMS54IC0gcDAueCkgKiAxODAgLyBNYXRoLlBJO1xuICB9XG59XG5cbi8vIERlY29tcG9zZSB2YWx1ZVxuXG5mdW5jdGlvbiBkZWNvbXBvc2VWYWx1ZSh2YWwsIHVuaXQpIHtcbiAgLy8gY29uc3Qgcmd4ID0gLy0/XFxkKlxcLj9cXGQrL2c7IC8vIGhhbmRsZXMgYmFzaWMgbnVtYmVyc1xuICAvLyBjb25zdCByZ3ggPSAvWystXT9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/L2c7IC8vIGhhbmRsZXMgZXhwb25lbnRzIG5vdGF0aW9uXG4gIHZhciByZ3ggPSAvWystXT9cXGQqXFwuP1xcZCsoPzpcXC5cXGQrKT8oPzpbZUVdWystXT9cXGQrKT8vZzsgLy8gaGFuZGxlcyBleHBvbmVudHMgbm90YXRpb25cbiAgdmFyIHZhbHVlID0gdmFsaWRhdGVWYWx1ZSgoaXMucHRoKHZhbCkgPyB2YWwudG90YWxMZW5ndGggOiB2YWwpLCB1bml0KSArICcnO1xuICByZXR1cm4ge1xuICAgIG9yaWdpbmFsOiB2YWx1ZSxcbiAgICBudW1iZXJzOiB2YWx1ZS5tYXRjaChyZ3gpID8gdmFsdWUubWF0Y2gocmd4KS5tYXAoTnVtYmVyKSA6IFswXSxcbiAgICBzdHJpbmdzOiAoaXMuc3RyKHZhbCkgfHwgdW5pdCkgPyB2YWx1ZS5zcGxpdChyZ3gpIDogW11cbiAgfVxufVxuXG4vLyBBbmltYXRhYmxlc1xuXG5mdW5jdGlvbiBwYXJzZVRhcmdldHModGFyZ2V0cykge1xuICB2YXIgdGFyZ2V0c0FycmF5ID0gdGFyZ2V0cyA/IChmbGF0dGVuQXJyYXkoaXMuYXJyKHRhcmdldHMpID8gdGFyZ2V0cy5tYXAodG9BcnJheSkgOiB0b0FycmF5KHRhcmdldHMpKSkgOiBbXTtcbiAgcmV0dXJuIGZpbHRlckFycmF5KHRhcmdldHNBcnJheSwgZnVuY3Rpb24gKGl0ZW0sIHBvcywgc2VsZikgeyByZXR1cm4gc2VsZi5pbmRleE9mKGl0ZW0pID09PSBwb3M7IH0pO1xufVxuXG5mdW5jdGlvbiBnZXRBbmltYXRhYmxlcyh0YXJnZXRzKSB7XG4gIHZhciBwYXJzZWQgPSBwYXJzZVRhcmdldHModGFyZ2V0cyk7XG4gIHJldHVybiBwYXJzZWQubWFwKGZ1bmN0aW9uICh0LCBpKSB7XG4gICAgcmV0dXJuIHt0YXJnZXQ6IHQsIGlkOiBpLCB0b3RhbDogcGFyc2VkLmxlbmd0aCwgdHJhbnNmb3JtczogeyBsaXN0OiBnZXRFbGVtZW50VHJhbnNmb3Jtcyh0KSB9IH07XG4gIH0pO1xufVxuXG4vLyBQcm9wZXJ0aWVzXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByb3BlcnR5VHdlZW5zKHByb3AsIHR3ZWVuU2V0dGluZ3MpIHtcbiAgdmFyIHNldHRpbmdzID0gY2xvbmVPYmplY3QodHdlZW5TZXR0aW5ncyk7XG4gIC8vIE92ZXJyaWRlIGR1cmF0aW9uIGlmIGVhc2luZyBpcyBhIHNwcmluZ1xuICBpZiAoL15zcHJpbmcvLnRlc3Qoc2V0dGluZ3MuZWFzaW5nKSkgeyBzZXR0aW5ncy5kdXJhdGlvbiA9IHNwcmluZyhzZXR0aW5ncy5lYXNpbmcpOyB9XG4gIGlmIChpcy5hcnIocHJvcCkpIHtcbiAgICB2YXIgbCA9IHByb3AubGVuZ3RoO1xuICAgIHZhciBpc0Zyb21UbyA9IChsID09PSAyICYmICFpcy5vYmoocHJvcFswXSkpO1xuICAgIGlmICghaXNGcm9tVG8pIHtcbiAgICAgIC8vIER1cmF0aW9uIGRpdmlkZWQgYnkgdGhlIG51bWJlciBvZiB0d2VlbnNcbiAgICAgIGlmICghaXMuZm5jKHR3ZWVuU2V0dGluZ3MuZHVyYXRpb24pKSB7IHNldHRpbmdzLmR1cmF0aW9uID0gdHdlZW5TZXR0aW5ncy5kdXJhdGlvbiAvIGw7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVHJhbnNmb3JtIFtmcm9tLCB0b10gdmFsdWVzIHNob3J0aGFuZCB0byBhIHZhbGlkIHR3ZWVuIHZhbHVlXG4gICAgICBwcm9wID0ge3ZhbHVlOiBwcm9wfTtcbiAgICB9XG4gIH1cbiAgdmFyIHByb3BBcnJheSA9IGlzLmFycihwcm9wKSA/IHByb3AgOiBbcHJvcF07XG4gIHJldHVybiBwcm9wQXJyYXkubWFwKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgdmFyIG9iaiA9IChpcy5vYmoodikgJiYgIWlzLnB0aCh2KSkgPyB2IDoge3ZhbHVlOiB2fTtcbiAgICAvLyBEZWZhdWx0IGRlbGF5IHZhbHVlIHNob3VsZCBvbmx5IGJlIGFwcGxpZWQgdG8gdGhlIGZpcnN0IHR3ZWVuXG4gICAgaWYgKGlzLnVuZChvYmouZGVsYXkpKSB7IG9iai5kZWxheSA9ICFpID8gdHdlZW5TZXR0aW5ncy5kZWxheSA6IDA7IH1cbiAgICAvLyBEZWZhdWx0IGVuZERlbGF5IHZhbHVlIHNob3VsZCBvbmx5IGJlIGFwcGxpZWQgdG8gdGhlIGxhc3QgdHdlZW5cbiAgICBpZiAoaXMudW5kKG9iai5lbmREZWxheSkpIHsgb2JqLmVuZERlbGF5ID0gaSA9PT0gcHJvcEFycmF5Lmxlbmd0aCAtIDEgPyB0d2VlblNldHRpbmdzLmVuZERlbGF5IDogMDsgfVxuICAgIHJldHVybiBvYmo7XG4gIH0pLm1hcChmdW5jdGlvbiAoaykgeyByZXR1cm4gbWVyZ2VPYmplY3RzKGssIHNldHRpbmdzKTsgfSk7XG59XG5cblxuZnVuY3Rpb24gZmxhdHRlbktleWZyYW1lcyhrZXlmcmFtZXMpIHtcbiAgdmFyIHByb3BlcnR5TmFtZXMgPSBmaWx0ZXJBcnJheShmbGF0dGVuQXJyYXkoa2V5ZnJhbWVzLm1hcChmdW5jdGlvbiAoa2V5KSB7IHJldHVybiBPYmplY3Qua2V5cyhrZXkpOyB9KSksIGZ1bmN0aW9uIChwKSB7IHJldHVybiBpcy5rZXkocCk7IH0pXG4gIC5yZWR1Y2UoZnVuY3Rpb24gKGEsYikgeyBpZiAoYS5pbmRleE9mKGIpIDwgMCkgeyBhLnB1c2goYik7IH0gcmV0dXJuIGE7IH0sIFtdKTtcbiAgdmFyIHByb3BlcnRpZXMgPSB7fTtcbiAgdmFyIGxvb3AgPSBmdW5jdGlvbiAoIGkgKSB7XG4gICAgdmFyIHByb3BOYW1lID0gcHJvcGVydHlOYW1lc1tpXTtcbiAgICBwcm9wZXJ0aWVzW3Byb3BOYW1lXSA9IGtleWZyYW1lcy5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgdmFyIG5ld0tleSA9IHt9O1xuICAgICAgZm9yICh2YXIgcCBpbiBrZXkpIHtcbiAgICAgICAgaWYgKGlzLmtleShwKSkge1xuICAgICAgICAgIGlmIChwID09IHByb3BOYW1lKSB7IG5ld0tleS52YWx1ZSA9IGtleVtwXTsgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0tleVtwXSA9IGtleVtwXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ld0tleTtcbiAgICB9KTtcbiAgfTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BlcnR5TmFtZXMubGVuZ3RoOyBpKyspIGxvb3AoIGkgKTtcbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbmZ1bmN0aW9uIGdldFByb3BlcnRpZXModHdlZW5TZXR0aW5ncywgcGFyYW1zKSB7XG4gIHZhciBwcm9wZXJ0aWVzID0gW107XG4gIHZhciBrZXlmcmFtZXMgPSBwYXJhbXMua2V5ZnJhbWVzO1xuICBpZiAoa2V5ZnJhbWVzKSB7IHBhcmFtcyA9IG1lcmdlT2JqZWN0cyhmbGF0dGVuS2V5ZnJhbWVzKGtleWZyYW1lcyksIHBhcmFtcyk7IH1cbiAgZm9yICh2YXIgcCBpbiBwYXJhbXMpIHtcbiAgICBpZiAoaXMua2V5KHApKSB7XG4gICAgICBwcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgICBuYW1lOiBwLFxuICAgICAgICB0d2VlbnM6IG5vcm1hbGl6ZVByb3BlcnR5VHdlZW5zKHBhcmFtc1twXSwgdHdlZW5TZXR0aW5ncylcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcGVydGllcztcbn1cblxuLy8gVHdlZW5zXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVR3ZWVuVmFsdWVzKHR3ZWVuLCBhbmltYXRhYmxlKSB7XG4gIHZhciB0ID0ge307XG4gIGZvciAodmFyIHAgaW4gdHdlZW4pIHtcbiAgICB2YXIgdmFsdWUgPSBnZXRGdW5jdGlvblZhbHVlKHR3ZWVuW3BdLCBhbmltYXRhYmxlKTtcbiAgICBpZiAoaXMuYXJyKHZhbHVlKSkge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5tYXAoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIGdldEZ1bmN0aW9uVmFsdWUodiwgYW5pbWF0YWJsZSk7IH0pO1xuICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMSkgeyB2YWx1ZSA9IHZhbHVlWzBdOyB9XG4gICAgfVxuICAgIHRbcF0gPSB2YWx1ZTtcbiAgfVxuICB0LmR1cmF0aW9uID0gcGFyc2VGbG9hdCh0LmR1cmF0aW9uKTtcbiAgdC5kZWxheSA9IHBhcnNlRmxvYXQodC5kZWxheSk7XG4gIHJldHVybiB0O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVUd2VlbnMocHJvcCwgYW5pbWF0YWJsZSkge1xuICB2YXIgcHJldmlvdXNUd2VlbjtcbiAgcmV0dXJuIHByb3AudHdlZW5zLm1hcChmdW5jdGlvbiAodCkge1xuICAgIHZhciB0d2VlbiA9IG5vcm1hbGl6ZVR3ZWVuVmFsdWVzKHQsIGFuaW1hdGFibGUpO1xuICAgIHZhciB0d2VlblZhbHVlID0gdHdlZW4udmFsdWU7XG4gICAgdmFyIHRvID0gaXMuYXJyKHR3ZWVuVmFsdWUpID8gdHdlZW5WYWx1ZVsxXSA6IHR3ZWVuVmFsdWU7XG4gICAgdmFyIHRvVW5pdCA9IGdldFVuaXQodG8pO1xuICAgIHZhciBvcmlnaW5hbFZhbHVlID0gZ2V0T3JpZ2luYWxUYXJnZXRWYWx1ZShhbmltYXRhYmxlLnRhcmdldCwgcHJvcC5uYW1lLCB0b1VuaXQsIGFuaW1hdGFibGUpO1xuICAgIHZhciBwcmV2aW91c1ZhbHVlID0gcHJldmlvdXNUd2VlbiA/IHByZXZpb3VzVHdlZW4udG8ub3JpZ2luYWwgOiBvcmlnaW5hbFZhbHVlO1xuICAgIHZhciBmcm9tID0gaXMuYXJyKHR3ZWVuVmFsdWUpID8gdHdlZW5WYWx1ZVswXSA6IHByZXZpb3VzVmFsdWU7XG4gICAgdmFyIGZyb21Vbml0ID0gZ2V0VW5pdChmcm9tKSB8fCBnZXRVbml0KG9yaWdpbmFsVmFsdWUpO1xuICAgIHZhciB1bml0ID0gdG9Vbml0IHx8IGZyb21Vbml0O1xuICAgIGlmIChpcy51bmQodG8pKSB7IHRvID0gcHJldmlvdXNWYWx1ZTsgfVxuICAgIHR3ZWVuLmZyb20gPSBkZWNvbXBvc2VWYWx1ZShmcm9tLCB1bml0KTtcbiAgICB0d2Vlbi50byA9IGRlY29tcG9zZVZhbHVlKGdldFJlbGF0aXZlVmFsdWUodG8sIGZyb20pLCB1bml0KTtcbiAgICB0d2Vlbi5zdGFydCA9IHByZXZpb3VzVHdlZW4gPyBwcmV2aW91c1R3ZWVuLmVuZCA6IDA7XG4gICAgdHdlZW4uZW5kID0gdHdlZW4uc3RhcnQgKyB0d2Vlbi5kZWxheSArIHR3ZWVuLmR1cmF0aW9uICsgdHdlZW4uZW5kRGVsYXk7XG4gICAgdHdlZW4uZWFzaW5nID0gcGFyc2VFYXNpbmdzKHR3ZWVuLmVhc2luZywgdHdlZW4uZHVyYXRpb24pO1xuICAgIHR3ZWVuLmlzUGF0aCA9IGlzLnB0aCh0d2VlblZhbHVlKTtcbiAgICB0d2Vlbi5pc1BhdGhUYXJnZXRJbnNpZGVTVkcgPSB0d2Vlbi5pc1BhdGggJiYgaXMuc3ZnKGFuaW1hdGFibGUudGFyZ2V0KTtcbiAgICB0d2Vlbi5pc0NvbG9yID0gaXMuY29sKHR3ZWVuLmZyb20ub3JpZ2luYWwpO1xuICAgIGlmICh0d2Vlbi5pc0NvbG9yKSB7IHR3ZWVuLnJvdW5kID0gMTsgfVxuICAgIHByZXZpb3VzVHdlZW4gPSB0d2VlbjtcbiAgICByZXR1cm4gdHdlZW47XG4gIH0pO1xufVxuXG4vLyBUd2VlbiBwcm9ncmVzc1xuXG52YXIgc2V0UHJvZ3Jlc3NWYWx1ZSA9IHtcbiAgY3NzOiBmdW5jdGlvbiAodCwgcCwgdikgeyByZXR1cm4gdC5zdHlsZVtwXSA9IHY7IH0sXG4gIGF0dHJpYnV0ZTogZnVuY3Rpb24gKHQsIHAsIHYpIHsgcmV0dXJuIHQuc2V0QXR0cmlidXRlKHAsIHYpOyB9LFxuICBvYmplY3Q6IGZ1bmN0aW9uICh0LCBwLCB2KSB7IHJldHVybiB0W3BdID0gdjsgfSxcbiAgdHJhbnNmb3JtOiBmdW5jdGlvbiAodCwgcCwgdiwgdHJhbnNmb3JtcywgbWFudWFsKSB7XG4gICAgdHJhbnNmb3Jtcy5saXN0LnNldChwLCB2KTtcbiAgICBpZiAocCA9PT0gdHJhbnNmb3Jtcy5sYXN0IHx8IG1hbnVhbCkge1xuICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgdHJhbnNmb3Jtcy5saXN0LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBwcm9wKSB7IHN0ciArPSBwcm9wICsgXCIoXCIgKyB2YWx1ZSArIFwiKSBcIjsgfSk7XG4gICAgICB0LnN0eWxlLnRyYW5zZm9ybSA9IHN0cjtcbiAgICB9XG4gIH1cbn07XG5cbi8vIFNldCBWYWx1ZSBoZWxwZXJcblxuZnVuY3Rpb24gc2V0VGFyZ2V0c1ZhbHVlKHRhcmdldHMsIHByb3BlcnRpZXMpIHtcbiAgdmFyIGFuaW1hdGFibGVzID0gZ2V0QW5pbWF0YWJsZXModGFyZ2V0cyk7XG4gIGFuaW1hdGFibGVzLmZvckVhY2goZnVuY3Rpb24gKGFuaW1hdGFibGUpIHtcbiAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICB2YXIgdmFsdWUgPSBnZXRGdW5jdGlvblZhbHVlKHByb3BlcnRpZXNbcHJvcGVydHldLCBhbmltYXRhYmxlKTtcbiAgICAgIHZhciB0YXJnZXQgPSBhbmltYXRhYmxlLnRhcmdldDtcbiAgICAgIHZhciB2YWx1ZVVuaXQgPSBnZXRVbml0KHZhbHVlKTtcbiAgICAgIHZhciBvcmlnaW5hbFZhbHVlID0gZ2V0T3JpZ2luYWxUYXJnZXRWYWx1ZSh0YXJnZXQsIHByb3BlcnR5LCB2YWx1ZVVuaXQsIGFuaW1hdGFibGUpO1xuICAgICAgdmFyIHVuaXQgPSB2YWx1ZVVuaXQgfHwgZ2V0VW5pdChvcmlnaW5hbFZhbHVlKTtcbiAgICAgIHZhciB0byA9IGdldFJlbGF0aXZlVmFsdWUodmFsaWRhdGVWYWx1ZSh2YWx1ZSwgdW5pdCksIG9yaWdpbmFsVmFsdWUpO1xuICAgICAgdmFyIGFuaW1UeXBlID0gZ2V0QW5pbWF0aW9uVHlwZSh0YXJnZXQsIHByb3BlcnR5KTtcbiAgICAgIHNldFByb2dyZXNzVmFsdWVbYW5pbVR5cGVdKHRhcmdldCwgcHJvcGVydHksIHRvLCBhbmltYXRhYmxlLnRyYW5zZm9ybXMsIHRydWUpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIEFuaW1hdGlvbnNcblxuZnVuY3Rpb24gY3JlYXRlQW5pbWF0aW9uKGFuaW1hdGFibGUsIHByb3ApIHtcbiAgdmFyIGFuaW1UeXBlID0gZ2V0QW5pbWF0aW9uVHlwZShhbmltYXRhYmxlLnRhcmdldCwgcHJvcC5uYW1lKTtcbiAgaWYgKGFuaW1UeXBlKSB7XG4gICAgdmFyIHR3ZWVucyA9IG5vcm1hbGl6ZVR3ZWVucyhwcm9wLCBhbmltYXRhYmxlKTtcbiAgICB2YXIgbGFzdFR3ZWVuID0gdHdlZW5zW3R3ZWVucy5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogYW5pbVR5cGUsXG4gICAgICBwcm9wZXJ0eTogcHJvcC5uYW1lLFxuICAgICAgYW5pbWF0YWJsZTogYW5pbWF0YWJsZSxcbiAgICAgIHR3ZWVuczogdHdlZW5zLFxuICAgICAgZHVyYXRpb246IGxhc3RUd2Vlbi5lbmQsXG4gICAgICBkZWxheTogdHdlZW5zWzBdLmRlbGF5LFxuICAgICAgZW5kRGVsYXk6IGxhc3RUd2Vlbi5lbmREZWxheVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRBbmltYXRpb25zKGFuaW1hdGFibGVzLCBwcm9wZXJ0aWVzKSB7XG4gIHJldHVybiBmaWx0ZXJBcnJheShmbGF0dGVuQXJyYXkoYW5pbWF0YWJsZXMubWFwKGZ1bmN0aW9uIChhbmltYXRhYmxlKSB7XG4gICAgcmV0dXJuIHByb3BlcnRpZXMubWFwKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICByZXR1cm4gY3JlYXRlQW5pbWF0aW9uKGFuaW1hdGFibGUsIHByb3ApO1xuICAgIH0pO1xuICB9KSksIGZ1bmN0aW9uIChhKSB7IHJldHVybiAhaXMudW5kKGEpOyB9KTtcbn1cblxuLy8gQ3JlYXRlIEluc3RhbmNlXG5cbmZ1bmN0aW9uIGdldEluc3RhbmNlVGltaW5ncyhhbmltYXRpb25zLCB0d2VlblNldHRpbmdzKSB7XG4gIHZhciBhbmltTGVuZ3RoID0gYW5pbWF0aW9ucy5sZW5ndGg7XG4gIHZhciBnZXRUbE9mZnNldCA9IGZ1bmN0aW9uIChhbmltKSB7IHJldHVybiBhbmltLnRpbWVsaW5lT2Zmc2V0ID8gYW5pbS50aW1lbGluZU9mZnNldCA6IDA7IH07XG4gIHZhciB0aW1pbmdzID0ge307XG4gIHRpbWluZ3MuZHVyYXRpb24gPSBhbmltTGVuZ3RoID8gTWF0aC5tYXguYXBwbHkoTWF0aCwgYW5pbWF0aW9ucy5tYXAoZnVuY3Rpb24gKGFuaW0pIHsgcmV0dXJuIGdldFRsT2Zmc2V0KGFuaW0pICsgYW5pbS5kdXJhdGlvbjsgfSkpIDogdHdlZW5TZXR0aW5ncy5kdXJhdGlvbjtcbiAgdGltaW5ncy5kZWxheSA9IGFuaW1MZW5ndGggPyBNYXRoLm1pbi5hcHBseShNYXRoLCBhbmltYXRpb25zLm1hcChmdW5jdGlvbiAoYW5pbSkgeyByZXR1cm4gZ2V0VGxPZmZzZXQoYW5pbSkgKyBhbmltLmRlbGF5OyB9KSkgOiB0d2VlblNldHRpbmdzLmRlbGF5O1xuICB0aW1pbmdzLmVuZERlbGF5ID0gYW5pbUxlbmd0aCA/IHRpbWluZ3MuZHVyYXRpb24gLSBNYXRoLm1heC5hcHBseShNYXRoLCBhbmltYXRpb25zLm1hcChmdW5jdGlvbiAoYW5pbSkgeyByZXR1cm4gZ2V0VGxPZmZzZXQoYW5pbSkgKyBhbmltLmR1cmF0aW9uIC0gYW5pbS5lbmREZWxheTsgfSkpIDogdHdlZW5TZXR0aW5ncy5lbmREZWxheTtcbiAgcmV0dXJuIHRpbWluZ3M7XG59XG5cbnZhciBpbnN0YW5jZUlEID0gMDtcblxuZnVuY3Rpb24gY3JlYXRlTmV3SW5zdGFuY2UocGFyYW1zKSB7XG4gIHZhciBpbnN0YW5jZVNldHRpbmdzID0gcmVwbGFjZU9iamVjdFByb3BzKGRlZmF1bHRJbnN0YW5jZVNldHRpbmdzLCBwYXJhbXMpO1xuICB2YXIgdHdlZW5TZXR0aW5ncyA9IHJlcGxhY2VPYmplY3RQcm9wcyhkZWZhdWx0VHdlZW5TZXR0aW5ncywgcGFyYW1zKTtcbiAgdmFyIHByb3BlcnRpZXMgPSBnZXRQcm9wZXJ0aWVzKHR3ZWVuU2V0dGluZ3MsIHBhcmFtcyk7XG4gIHZhciBhbmltYXRhYmxlcyA9IGdldEFuaW1hdGFibGVzKHBhcmFtcy50YXJnZXRzKTtcbiAgdmFyIGFuaW1hdGlvbnMgPSBnZXRBbmltYXRpb25zKGFuaW1hdGFibGVzLCBwcm9wZXJ0aWVzKTtcbiAgdmFyIHRpbWluZ3MgPSBnZXRJbnN0YW5jZVRpbWluZ3MoYW5pbWF0aW9ucywgdHdlZW5TZXR0aW5ncyk7XG4gIHZhciBpZCA9IGluc3RhbmNlSUQ7XG4gIGluc3RhbmNlSUQrKztcbiAgcmV0dXJuIG1lcmdlT2JqZWN0cyhpbnN0YW5jZVNldHRpbmdzLCB7XG4gICAgaWQ6IGlkLFxuICAgIGNoaWxkcmVuOiBbXSxcbiAgICBhbmltYXRhYmxlczogYW5pbWF0YWJsZXMsXG4gICAgYW5pbWF0aW9uczogYW5pbWF0aW9ucyxcbiAgICBkdXJhdGlvbjogdGltaW5ncy5kdXJhdGlvbixcbiAgICBkZWxheTogdGltaW5ncy5kZWxheSxcbiAgICBlbmREZWxheTogdGltaW5ncy5lbmREZWxheVxuICB9KTtcbn1cblxuLy8gQ29yZVxuXG52YXIgYWN0aXZlSW5zdGFuY2VzID0gW107XG5cbnZhciBlbmdpbmUgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcmFmO1xuXG4gIGZ1bmN0aW9uIHBsYXkoKSB7XG4gICAgaWYgKCFyYWYgJiYgKCFpc0RvY3VtZW50SGlkZGVuKCkgfHwgIWFuaW1lLnN1c3BlbmRXaGVuRG9jdW1lbnRIaWRkZW4pICYmIGFjdGl2ZUluc3RhbmNlcy5sZW5ndGggPiAwKSB7XG4gICAgICByYWYgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc3RlcCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHN0ZXAodCkge1xuICAgIC8vIG1lbW8gb24gYWxnb3JpdGhtIGlzc3VlOlxuICAgIC8vIGRhbmdlcm91cyBpdGVyYXRpb24gb3ZlciBtdXRhYmxlIGBhY3RpdmVJbnN0YW5jZXNgXG4gICAgLy8gKHRoYXQgY29sbGVjdGlvbiBtYXkgYmUgdXBkYXRlZCBmcm9tIHdpdGhpbiBjYWxsYmFja3Mgb2YgYHRpY2tgLWVkIGFuaW1hdGlvbiBpbnN0YW5jZXMpXG4gICAgdmFyIGFjdGl2ZUluc3RhbmNlc0xlbmd0aCA9IGFjdGl2ZUluc3RhbmNlcy5sZW5ndGg7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgYWN0aXZlSW5zdGFuY2VzTGVuZ3RoKSB7XG4gICAgICB2YXIgYWN0aXZlSW5zdGFuY2UgPSBhY3RpdmVJbnN0YW5jZXNbaV07XG4gICAgICBpZiAoIWFjdGl2ZUluc3RhbmNlLnBhdXNlZCkge1xuICAgICAgICBhY3RpdmVJbnN0YW5jZS50aWNrKHQpO1xuICAgICAgICBpKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY3RpdmVJbnN0YW5jZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICBhY3RpdmVJbnN0YW5jZXNMZW5ndGgtLTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmFmID0gaSA+IDAgPyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc3RlcCkgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKCkge1xuICAgIGlmICghYW5pbWUuc3VzcGVuZFdoZW5Eb2N1bWVudEhpZGRlbikgeyByZXR1cm47IH1cblxuICAgIGlmIChpc0RvY3VtZW50SGlkZGVuKCkpIHtcbiAgICAgIC8vIHN1c3BlbmQgdGlja3NcbiAgICAgIHJhZiA9IGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJhZik7XG4gICAgfSBlbHNlIHsgLy8gaXMgYmFjayB0byBhY3RpdmUgdGFiXG4gICAgICAvLyBmaXJzdCBhZGp1c3QgYW5pbWF0aW9ucyB0byBjb25zaWRlciB0aGUgdGltZSB0aGF0IHRpY2tzIHdlcmUgc3VzcGVuZGVkXG4gICAgICBhY3RpdmVJbnN0YW5jZXMuZm9yRWFjaChcbiAgICAgICAgZnVuY3Rpb24gKGluc3RhbmNlKSB7IHJldHVybiBpbnN0YW5jZSAuX29uRG9jdW1lbnRWaXNpYmlsaXR5KCk7IH1cbiAgICAgICk7XG4gICAgICBlbmdpbmUoKTtcbiAgICB9XG4gIH1cbiAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSk7XG4gIH1cblxuICByZXR1cm4gcGxheTtcbn0pKCk7XG5cbmZ1bmN0aW9uIGlzRG9jdW1lbnRIaWRkZW4oKSB7XG4gIHJldHVybiAhIWRvY3VtZW50ICYmIGRvY3VtZW50LmhpZGRlbjtcbn1cblxuLy8gUHVibGljIEluc3RhbmNlXG5cbmZ1bmN0aW9uIGFuaW1lKHBhcmFtcykge1xuICBpZiAoIHBhcmFtcyA9PT0gdm9pZCAwICkgcGFyYW1zID0ge307XG5cblxuICB2YXIgc3RhcnRUaW1lID0gMCwgbGFzdFRpbWUgPSAwLCBub3cgPSAwO1xuICB2YXIgY2hpbGRyZW4sIGNoaWxkcmVuTGVuZ3RoID0gMDtcbiAgdmFyIHJlc29sdmUgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIG1ha2VQcm9taXNlKGluc3RhbmNlKSB7XG4gICAgdmFyIHByb21pc2UgPSB3aW5kb3cuUHJvbWlzZSAmJiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoX3Jlc29sdmUpIHsgcmV0dXJuIHJlc29sdmUgPSBfcmVzb2x2ZTsgfSk7XG4gICAgaW5zdGFuY2UuZmluaXNoZWQgPSBwcm9taXNlO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgdmFyIGluc3RhbmNlID0gY3JlYXRlTmV3SW5zdGFuY2UocGFyYW1zKTtcbiAgdmFyIHByb21pc2UgPSBtYWtlUHJvbWlzZShpbnN0YW5jZSk7XG5cbiAgZnVuY3Rpb24gdG9nZ2xlSW5zdGFuY2VEaXJlY3Rpb24oKSB7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGluc3RhbmNlLmRpcmVjdGlvbjtcbiAgICBpZiAoZGlyZWN0aW9uICE9PSAnYWx0ZXJuYXRlJykge1xuICAgICAgaW5zdGFuY2UuZGlyZWN0aW9uID0gZGlyZWN0aW9uICE9PSAnbm9ybWFsJyA/ICdub3JtYWwnIDogJ3JldmVyc2UnO1xuICAgIH1cbiAgICBpbnN0YW5jZS5yZXZlcnNlZCA9ICFpbnN0YW5jZS5yZXZlcnNlZDtcbiAgICBjaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZCkgeyByZXR1cm4gY2hpbGQucmV2ZXJzZWQgPSBpbnN0YW5jZS5yZXZlcnNlZDsgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGp1c3RUaW1lKHRpbWUpIHtcbiAgICByZXR1cm4gaW5zdGFuY2UucmV2ZXJzZWQgPyBpbnN0YW5jZS5kdXJhdGlvbiAtIHRpbWUgOiB0aW1lO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzZXRUaW1lKCkge1xuICAgIHN0YXJ0VGltZSA9IDA7XG4gICAgbGFzdFRpbWUgPSBhZGp1c3RUaW1lKGluc3RhbmNlLmN1cnJlbnRUaW1lKSAqICgxIC8gYW5pbWUuc3BlZWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2Vla0NoaWxkKHRpbWUsIGNoaWxkKSB7XG4gICAgaWYgKGNoaWxkKSB7IGNoaWxkLnNlZWsodGltZSAtIGNoaWxkLnRpbWVsaW5lT2Zmc2V0KTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3luY0luc3RhbmNlQ2hpbGRyZW4odGltZSkge1xuICAgIGlmICghaW5zdGFuY2UucmV2ZXJzZVBsYXliYWNrKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuTGVuZ3RoOyBpKyspIHsgc2Vla0NoaWxkKHRpbWUsIGNoaWxkcmVuW2ldKTsgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpJDEgPSBjaGlsZHJlbkxlbmd0aDsgaSQxLS07KSB7IHNlZWtDaGlsZCh0aW1lLCBjaGlsZHJlbltpJDFdKTsgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEFuaW1hdGlvbnNQcm9ncmVzcyhpbnNUaW1lKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBhbmltYXRpb25zID0gaW5zdGFuY2UuYW5pbWF0aW9ucztcbiAgICB2YXIgYW5pbWF0aW9uc0xlbmd0aCA9IGFuaW1hdGlvbnMubGVuZ3RoO1xuICAgIHdoaWxlIChpIDwgYW5pbWF0aW9uc0xlbmd0aCkge1xuICAgICAgdmFyIGFuaW0gPSBhbmltYXRpb25zW2ldO1xuICAgICAgdmFyIGFuaW1hdGFibGUgPSBhbmltLmFuaW1hdGFibGU7XG4gICAgICB2YXIgdHdlZW5zID0gYW5pbS50d2VlbnM7XG4gICAgICB2YXIgdHdlZW5MZW5ndGggPSB0d2VlbnMubGVuZ3RoIC0gMTtcbiAgICAgIHZhciB0d2VlbiA9IHR3ZWVuc1t0d2Vlbkxlbmd0aF07XG4gICAgICAvLyBPbmx5IGNoZWNrIGZvciBrZXlmcmFtZXMgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSB0d2VlblxuICAgICAgaWYgKHR3ZWVuTGVuZ3RoKSB7IHR3ZWVuID0gZmlsdGVyQXJyYXkodHdlZW5zLCBmdW5jdGlvbiAodCkgeyByZXR1cm4gKGluc1RpbWUgPCB0LmVuZCk7IH0pWzBdIHx8IHR3ZWVuOyB9XG4gICAgICB2YXIgZWxhcHNlZCA9IG1pbk1heChpbnNUaW1lIC0gdHdlZW4uc3RhcnQgLSB0d2Vlbi5kZWxheSwgMCwgdHdlZW4uZHVyYXRpb24pIC8gdHdlZW4uZHVyYXRpb247XG4gICAgICB2YXIgZWFzZWQgPSBpc05hTihlbGFwc2VkKSA/IDEgOiB0d2Vlbi5lYXNpbmcoZWxhcHNlZCk7XG4gICAgICB2YXIgc3RyaW5ncyA9IHR3ZWVuLnRvLnN0cmluZ3M7XG4gICAgICB2YXIgcm91bmQgPSB0d2Vlbi5yb3VuZDtcbiAgICAgIHZhciBudW1iZXJzID0gW107XG4gICAgICB2YXIgdG9OdW1iZXJzTGVuZ3RoID0gdHdlZW4udG8ubnVtYmVycy5sZW5ndGg7XG4gICAgICB2YXIgcHJvZ3Jlc3MgPSAodm9pZCAwKTtcbiAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgdG9OdW1iZXJzTGVuZ3RoOyBuKyspIHtcbiAgICAgICAgdmFyIHZhbHVlID0gKHZvaWQgMCk7XG4gICAgICAgIHZhciB0b051bWJlciA9IHR3ZWVuLnRvLm51bWJlcnNbbl07XG4gICAgICAgIHZhciBmcm9tTnVtYmVyID0gdHdlZW4uZnJvbS5udW1iZXJzW25dIHx8IDA7XG4gICAgICAgIGlmICghdHdlZW4uaXNQYXRoKSB7XG4gICAgICAgICAgdmFsdWUgPSBmcm9tTnVtYmVyICsgKGVhc2VkICogKHRvTnVtYmVyIC0gZnJvbU51bWJlcikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gZ2V0UGF0aFByb2dyZXNzKHR3ZWVuLnZhbHVlLCBlYXNlZCAqIHRvTnVtYmVyLCB0d2Vlbi5pc1BhdGhUYXJnZXRJbnNpZGVTVkcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyb3VuZCkge1xuICAgICAgICAgIGlmICghKHR3ZWVuLmlzQ29sb3IgJiYgbiA+IDIpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IE1hdGgucm91bmQodmFsdWUgKiByb3VuZCkgLyByb3VuZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbnVtYmVycy5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIC8vIE1hbnVhbCBBcnJheS5yZWR1Y2UgZm9yIGJldHRlciBwZXJmb3JtYW5jZXNcbiAgICAgIHZhciBzdHJpbmdzTGVuZ3RoID0gc3RyaW5ncy5sZW5ndGg7XG4gICAgICBpZiAoIXN0cmluZ3NMZW5ndGgpIHtcbiAgICAgICAgcHJvZ3Jlc3MgPSBudW1iZXJzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvZ3Jlc3MgPSBzdHJpbmdzWzBdO1xuICAgICAgICBmb3IgKHZhciBzID0gMDsgcyA8IHN0cmluZ3NMZW5ndGg7IHMrKykge1xuICAgICAgICAgIHZhciBhID0gc3RyaW5nc1tzXTtcbiAgICAgICAgICB2YXIgYiA9IHN0cmluZ3NbcyArIDFdO1xuICAgICAgICAgIHZhciBuJDEgPSBudW1iZXJzW3NdO1xuICAgICAgICAgIGlmICghaXNOYU4obiQxKSkge1xuICAgICAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAgIHByb2dyZXNzICs9IG4kMSArICcgJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHByb2dyZXNzICs9IG4kMSArIGI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZXRQcm9ncmVzc1ZhbHVlW2FuaW0udHlwZV0oYW5pbWF0YWJsZS50YXJnZXQsIGFuaW0ucHJvcGVydHksIHByb2dyZXNzLCBhbmltYXRhYmxlLnRyYW5zZm9ybXMpO1xuICAgICAgYW5pbS5jdXJyZW50VmFsdWUgPSBwcm9ncmVzcztcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRDYWxsYmFjayhjYikge1xuICAgIGlmIChpbnN0YW5jZVtjYl0gJiYgIWluc3RhbmNlLnBhc3NUaHJvdWdoKSB7IGluc3RhbmNlW2NiXShpbnN0YW5jZSk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNvdW50SXRlcmF0aW9uKCkge1xuICAgIGlmIChpbnN0YW5jZS5yZW1haW5pbmcgJiYgaW5zdGFuY2UucmVtYWluaW5nICE9PSB0cnVlKSB7XG4gICAgICBpbnN0YW5jZS5yZW1haW5pbmctLTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRJbnN0YW5jZVByb2dyZXNzKGVuZ2luZVRpbWUpIHtcbiAgICB2YXIgaW5zRHVyYXRpb24gPSBpbnN0YW5jZS5kdXJhdGlvbjtcbiAgICB2YXIgaW5zRGVsYXkgPSBpbnN0YW5jZS5kZWxheTtcbiAgICB2YXIgaW5zRW5kRGVsYXkgPSBpbnNEdXJhdGlvbiAtIGluc3RhbmNlLmVuZERlbGF5O1xuICAgIHZhciBpbnNUaW1lID0gYWRqdXN0VGltZShlbmdpbmVUaW1lKTtcbiAgICBpbnN0YW5jZS5wcm9ncmVzcyA9IG1pbk1heCgoaW5zVGltZSAvIGluc0R1cmF0aW9uKSAqIDEwMCwgMCwgMTAwKTtcbiAgICBpbnN0YW5jZS5yZXZlcnNlUGxheWJhY2sgPSBpbnNUaW1lIDwgaW5zdGFuY2UuY3VycmVudFRpbWU7XG4gICAgaWYgKGNoaWxkcmVuKSB7IHN5bmNJbnN0YW5jZUNoaWxkcmVuKGluc1RpbWUpOyB9XG4gICAgaWYgKCFpbnN0YW5jZS5iZWdhbiAmJiBpbnN0YW5jZS5jdXJyZW50VGltZSA+IDApIHtcbiAgICAgIGluc3RhbmNlLmJlZ2FuID0gdHJ1ZTtcbiAgICAgIHNldENhbGxiYWNrKCdiZWdpbicpO1xuICAgIH1cbiAgICBpZiAoIWluc3RhbmNlLmxvb3BCZWdhbiAmJiBpbnN0YW5jZS5jdXJyZW50VGltZSA+IDApIHtcbiAgICAgIGluc3RhbmNlLmxvb3BCZWdhbiA9IHRydWU7XG4gICAgICBzZXRDYWxsYmFjaygnbG9vcEJlZ2luJyk7XG4gICAgfVxuICAgIGlmIChpbnNUaW1lIDw9IGluc0RlbGF5ICYmIGluc3RhbmNlLmN1cnJlbnRUaW1lICE9PSAwKSB7XG4gICAgICBzZXRBbmltYXRpb25zUHJvZ3Jlc3MoMCk7XG4gICAgfVxuICAgIGlmICgoaW5zVGltZSA+PSBpbnNFbmREZWxheSAmJiBpbnN0YW5jZS5jdXJyZW50VGltZSAhPT0gaW5zRHVyYXRpb24pIHx8ICFpbnNEdXJhdGlvbikge1xuICAgICAgc2V0QW5pbWF0aW9uc1Byb2dyZXNzKGluc0R1cmF0aW9uKTtcbiAgICB9XG4gICAgaWYgKGluc1RpbWUgPiBpbnNEZWxheSAmJiBpbnNUaW1lIDwgaW5zRW5kRGVsYXkpIHtcbiAgICAgIGlmICghaW5zdGFuY2UuY2hhbmdlQmVnYW4pIHtcbiAgICAgICAgaW5zdGFuY2UuY2hhbmdlQmVnYW4gPSB0cnVlO1xuICAgICAgICBpbnN0YW5jZS5jaGFuZ2VDb21wbGV0ZWQgPSBmYWxzZTtcbiAgICAgICAgc2V0Q2FsbGJhY2soJ2NoYW5nZUJlZ2luJyk7XG4gICAgICB9XG4gICAgICBzZXRDYWxsYmFjaygnY2hhbmdlJyk7XG4gICAgICBzZXRBbmltYXRpb25zUHJvZ3Jlc3MoaW5zVGltZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpbnN0YW5jZS5jaGFuZ2VCZWdhbikge1xuICAgICAgICBpbnN0YW5jZS5jaGFuZ2VDb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICBpbnN0YW5jZS5jaGFuZ2VCZWdhbiA9IGZhbHNlO1xuICAgICAgICBzZXRDYWxsYmFjaygnY2hhbmdlQ29tcGxldGUnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaW5zdGFuY2UuY3VycmVudFRpbWUgPSBtaW5NYXgoaW5zVGltZSwgMCwgaW5zRHVyYXRpb24pO1xuICAgIGlmIChpbnN0YW5jZS5iZWdhbikgeyBzZXRDYWxsYmFjaygndXBkYXRlJyk7IH1cbiAgICBpZiAoZW5naW5lVGltZSA+PSBpbnNEdXJhdGlvbikge1xuICAgICAgbGFzdFRpbWUgPSAwO1xuICAgICAgY291bnRJdGVyYXRpb24oKTtcbiAgICAgIGlmICghaW5zdGFuY2UucmVtYWluaW5nKSB7XG4gICAgICAgIGluc3RhbmNlLnBhdXNlZCA9IHRydWU7XG4gICAgICAgIGlmICghaW5zdGFuY2UuY29tcGxldGVkKSB7XG4gICAgICAgICAgaW5zdGFuY2UuY29tcGxldGVkID0gdHJ1ZTtcbiAgICAgICAgICBzZXRDYWxsYmFjaygnbG9vcENvbXBsZXRlJyk7XG4gICAgICAgICAgc2V0Q2FsbGJhY2soJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgaWYgKCFpbnN0YW5jZS5wYXNzVGhyb3VnaCAmJiAnUHJvbWlzZScgaW4gd2luZG93KSB7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICBwcm9taXNlID0gbWFrZVByb21pc2UoaW5zdGFuY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhcnRUaW1lID0gbm93O1xuICAgICAgICBzZXRDYWxsYmFjaygnbG9vcENvbXBsZXRlJyk7XG4gICAgICAgIGluc3RhbmNlLmxvb3BCZWdhbiA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5zdGFuY2UuZGlyZWN0aW9uID09PSAnYWx0ZXJuYXRlJykge1xuICAgICAgICAgIHRvZ2dsZUluc3RhbmNlRGlyZWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpbnN0YW5jZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkaXJlY3Rpb24gPSBpbnN0YW5jZS5kaXJlY3Rpb247XG4gICAgaW5zdGFuY2UucGFzc1Rocm91Z2ggPSBmYWxzZTtcbiAgICBpbnN0YW5jZS5jdXJyZW50VGltZSA9IDA7XG4gICAgaW5zdGFuY2UucHJvZ3Jlc3MgPSAwO1xuICAgIGluc3RhbmNlLnBhdXNlZCA9IHRydWU7XG4gICAgaW5zdGFuY2UuYmVnYW4gPSBmYWxzZTtcbiAgICBpbnN0YW5jZS5sb29wQmVnYW4gPSBmYWxzZTtcbiAgICBpbnN0YW5jZS5jaGFuZ2VCZWdhbiA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmNvbXBsZXRlZCA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmNoYW5nZUNvbXBsZXRlZCA9IGZhbHNlO1xuICAgIGluc3RhbmNlLnJldmVyc2VQbGF5YmFjayA9IGZhbHNlO1xuICAgIGluc3RhbmNlLnJldmVyc2VkID0gZGlyZWN0aW9uID09PSAncmV2ZXJzZSc7XG4gICAgaW5zdGFuY2UucmVtYWluaW5nID0gaW5zdGFuY2UubG9vcDtcbiAgICBjaGlsZHJlbiA9IGluc3RhbmNlLmNoaWxkcmVuO1xuICAgIGNoaWxkcmVuTGVuZ3RoID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSBjaGlsZHJlbkxlbmd0aDsgaS0tOykgeyBpbnN0YW5jZS5jaGlsZHJlbltpXS5yZXNldCgpOyB9XG4gICAgaWYgKGluc3RhbmNlLnJldmVyc2VkICYmIGluc3RhbmNlLmxvb3AgIT09IHRydWUgfHwgKGRpcmVjdGlvbiA9PT0gJ2FsdGVybmF0ZScgJiYgaW5zdGFuY2UubG9vcCA9PT0gMSkpIHsgaW5zdGFuY2UucmVtYWluaW5nKys7IH1cbiAgICBzZXRBbmltYXRpb25zUHJvZ3Jlc3MoaW5zdGFuY2UucmV2ZXJzZWQgPyBpbnN0YW5jZS5kdXJhdGlvbiA6IDApO1xuICB9O1xuXG4gIC8vIGludGVybmFsIG1ldGhvZCAoZm9yIGVuZ2luZSkgdG8gYWRqdXN0IGFuaW1hdGlvbiB0aW1pbmdzIGJlZm9yZSByZXN0b3JpbmcgZW5naW5lIHRpY2tzIChyQUYpXG4gIGluc3RhbmNlLl9vbkRvY3VtZW50VmlzaWJpbGl0eSA9IHJlc2V0VGltZTtcblxuICAvLyBTZXQgVmFsdWUgaGVscGVyXG5cbiAgaW5zdGFuY2Uuc2V0ID0gZnVuY3Rpb24odGFyZ2V0cywgcHJvcGVydGllcykge1xuICAgIHNldFRhcmdldHNWYWx1ZSh0YXJnZXRzLCBwcm9wZXJ0aWVzKTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH07XG5cbiAgaW5zdGFuY2UudGljayA9IGZ1bmN0aW9uKHQpIHtcbiAgICBub3cgPSB0O1xuICAgIGlmICghc3RhcnRUaW1lKSB7IHN0YXJ0VGltZSA9IG5vdzsgfVxuICAgIHNldEluc3RhbmNlUHJvZ3Jlc3MoKG5vdyArIChsYXN0VGltZSAtIHN0YXJ0VGltZSkpICogYW5pbWUuc3BlZWQpO1xuICB9O1xuXG4gIGluc3RhbmNlLnNlZWsgPSBmdW5jdGlvbih0aW1lKSB7XG4gICAgc2V0SW5zdGFuY2VQcm9ncmVzcyhhZGp1c3RUaW1lKHRpbWUpKTtcbiAgfTtcblxuICBpbnN0YW5jZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgIGluc3RhbmNlLnBhdXNlZCA9IHRydWU7XG4gICAgcmVzZXRUaW1lKCk7XG4gIH07XG5cbiAgaW5zdGFuY2UucGxheSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghaW5zdGFuY2UucGF1c2VkKSB7IHJldHVybjsgfVxuICAgIGlmIChpbnN0YW5jZS5jb21wbGV0ZWQpIHsgaW5zdGFuY2UucmVzZXQoKTsgfVxuICAgIGluc3RhbmNlLnBhdXNlZCA9IGZhbHNlO1xuICAgIGFjdGl2ZUluc3RhbmNlcy5wdXNoKGluc3RhbmNlKTtcbiAgICByZXNldFRpbWUoKTtcbiAgICBlbmdpbmUoKTtcbiAgfTtcblxuICBpbnN0YW5jZS5yZXZlcnNlID0gZnVuY3Rpb24oKSB7XG4gICAgdG9nZ2xlSW5zdGFuY2VEaXJlY3Rpb24oKTtcbiAgICBpbnN0YW5jZS5jb21wbGV0ZWQgPSBpbnN0YW5jZS5yZXZlcnNlZCA/IGZhbHNlIDogdHJ1ZTtcbiAgICByZXNldFRpbWUoKTtcbiAgfTtcblxuICBpbnN0YW5jZS5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgaW5zdGFuY2UucmVzZXQoKTtcbiAgICBpbnN0YW5jZS5wbGF5KCk7XG4gIH07XG5cbiAgaW5zdGFuY2UucmVtb3ZlID0gZnVuY3Rpb24odGFyZ2V0cykge1xuICAgIHZhciB0YXJnZXRzQXJyYXkgPSBwYXJzZVRhcmdldHModGFyZ2V0cyk7XG4gICAgcmVtb3ZlVGFyZ2V0c0Zyb21JbnN0YW5jZSh0YXJnZXRzQXJyYXksIGluc3RhbmNlKTtcbiAgfTtcblxuICBpbnN0YW5jZS5yZXNldCgpO1xuXG4gIGlmIChpbnN0YW5jZS5hdXRvcGxheSkgeyBpbnN0YW5jZS5wbGF5KCk7IH1cblxuICByZXR1cm4gaW5zdGFuY2U7XG5cbn1cblxuLy8gUmVtb3ZlIHRhcmdldHMgZnJvbSBhbmltYXRpb25cblxuZnVuY3Rpb24gcmVtb3ZlVGFyZ2V0c0Zyb21BbmltYXRpb25zKHRhcmdldHNBcnJheSwgYW5pbWF0aW9ucykge1xuICBmb3IgKHZhciBhID0gYW5pbWF0aW9ucy5sZW5ndGg7IGEtLTspIHtcbiAgICBpZiAoYXJyYXlDb250YWlucyh0YXJnZXRzQXJyYXksIGFuaW1hdGlvbnNbYV0uYW5pbWF0YWJsZS50YXJnZXQpKSB7XG4gICAgICBhbmltYXRpb25zLnNwbGljZShhLCAxKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlVGFyZ2V0c0Zyb21JbnN0YW5jZSh0YXJnZXRzQXJyYXksIGluc3RhbmNlKSB7XG4gIHZhciBhbmltYXRpb25zID0gaW5zdGFuY2UuYW5pbWF0aW9ucztcbiAgdmFyIGNoaWxkcmVuID0gaW5zdGFuY2UuY2hpbGRyZW47XG4gIHJlbW92ZVRhcmdldHNGcm9tQW5pbWF0aW9ucyh0YXJnZXRzQXJyYXksIGFuaW1hdGlvbnMpO1xuICBmb3IgKHZhciBjID0gY2hpbGRyZW4ubGVuZ3RoOyBjLS07KSB7XG4gICAgdmFyIGNoaWxkID0gY2hpbGRyZW5bY107XG4gICAgdmFyIGNoaWxkQW5pbWF0aW9ucyA9IGNoaWxkLmFuaW1hdGlvbnM7XG4gICAgcmVtb3ZlVGFyZ2V0c0Zyb21BbmltYXRpb25zKHRhcmdldHNBcnJheSwgY2hpbGRBbmltYXRpb25zKTtcbiAgICBpZiAoIWNoaWxkQW5pbWF0aW9ucy5sZW5ndGggJiYgIWNoaWxkLmNoaWxkcmVuLmxlbmd0aCkgeyBjaGlsZHJlbi5zcGxpY2UoYywgMSk7IH1cbiAgfVxuICBpZiAoIWFuaW1hdGlvbnMubGVuZ3RoICYmICFjaGlsZHJlbi5sZW5ndGgpIHsgaW5zdGFuY2UucGF1c2UoKTsgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVUYXJnZXRzRnJvbUFjdGl2ZUluc3RhbmNlcyh0YXJnZXRzKSB7XG4gIHZhciB0YXJnZXRzQXJyYXkgPSBwYXJzZVRhcmdldHModGFyZ2V0cyk7XG4gIGZvciAodmFyIGkgPSBhY3RpdmVJbnN0YW5jZXMubGVuZ3RoOyBpLS07KSB7XG4gICAgdmFyIGluc3RhbmNlID0gYWN0aXZlSW5zdGFuY2VzW2ldO1xuICAgIHJlbW92ZVRhcmdldHNGcm9tSW5zdGFuY2UodGFyZ2V0c0FycmF5LCBpbnN0YW5jZSk7XG4gIH1cbn1cblxuLy8gU3RhZ2dlciBoZWxwZXJzXG5cbmZ1bmN0aW9uIHN0YWdnZXIodmFsLCBwYXJhbXMpIHtcbiAgaWYgKCBwYXJhbXMgPT09IHZvaWQgMCApIHBhcmFtcyA9IHt9O1xuXG4gIHZhciBkaXJlY3Rpb24gPSBwYXJhbXMuZGlyZWN0aW9uIHx8ICdub3JtYWwnO1xuICB2YXIgZWFzaW5nID0gcGFyYW1zLmVhc2luZyA/IHBhcnNlRWFzaW5ncyhwYXJhbXMuZWFzaW5nKSA6IG51bGw7XG4gIHZhciBncmlkID0gcGFyYW1zLmdyaWQ7XG4gIHZhciBheGlzID0gcGFyYW1zLmF4aXM7XG4gIHZhciBmcm9tSW5kZXggPSBwYXJhbXMuZnJvbSB8fCAwO1xuICB2YXIgZnJvbUZpcnN0ID0gZnJvbUluZGV4ID09PSAnZmlyc3QnO1xuICB2YXIgZnJvbUNlbnRlciA9IGZyb21JbmRleCA9PT0gJ2NlbnRlcic7XG4gIHZhciBmcm9tTGFzdCA9IGZyb21JbmRleCA9PT0gJ2xhc3QnO1xuICB2YXIgaXNSYW5nZSA9IGlzLmFycih2YWwpO1xuICB2YXIgdmFsMSA9IGlzUmFuZ2UgPyBwYXJzZUZsb2F0KHZhbFswXSkgOiBwYXJzZUZsb2F0KHZhbCk7XG4gIHZhciB2YWwyID0gaXNSYW5nZSA/IHBhcnNlRmxvYXQodmFsWzFdKSA6IDA7XG4gIHZhciB1bml0ID0gZ2V0VW5pdChpc1JhbmdlID8gdmFsWzFdIDogdmFsKSB8fCAwO1xuICB2YXIgc3RhcnQgPSBwYXJhbXMuc3RhcnQgfHwgMCArIChpc1JhbmdlID8gdmFsMSA6IDApO1xuICB2YXIgdmFsdWVzID0gW107XG4gIHZhciBtYXhWYWx1ZSA9IDA7XG4gIHJldHVybiBmdW5jdGlvbiAoZWwsIGksIHQpIHtcbiAgICBpZiAoZnJvbUZpcnN0KSB7IGZyb21JbmRleCA9IDA7IH1cbiAgICBpZiAoZnJvbUNlbnRlcikgeyBmcm9tSW5kZXggPSAodCAtIDEpIC8gMjsgfVxuICAgIGlmIChmcm9tTGFzdCkgeyBmcm9tSW5kZXggPSB0IC0gMTsgfVxuICAgIGlmICghdmFsdWVzLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHQ7IGluZGV4KyspIHtcbiAgICAgICAgaWYgKCFncmlkKSB7XG4gICAgICAgICAgdmFsdWVzLnB1c2goTWF0aC5hYnMoZnJvbUluZGV4IC0gaW5kZXgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgZnJvbVggPSAhZnJvbUNlbnRlciA/IGZyb21JbmRleCVncmlkWzBdIDogKGdyaWRbMF0tMSkvMjtcbiAgICAgICAgICB2YXIgZnJvbVkgPSAhZnJvbUNlbnRlciA/IE1hdGguZmxvb3IoZnJvbUluZGV4L2dyaWRbMF0pIDogKGdyaWRbMV0tMSkvMjtcbiAgICAgICAgICB2YXIgdG9YID0gaW5kZXglZ3JpZFswXTtcbiAgICAgICAgICB2YXIgdG9ZID0gTWF0aC5mbG9vcihpbmRleC9ncmlkWzBdKTtcbiAgICAgICAgICB2YXIgZGlzdGFuY2VYID0gZnJvbVggLSB0b1g7XG4gICAgICAgICAgdmFyIGRpc3RhbmNlWSA9IGZyb21ZIC0gdG9ZO1xuICAgICAgICAgIHZhciB2YWx1ZSA9IE1hdGguc3FydChkaXN0YW5jZVggKiBkaXN0YW5jZVggKyBkaXN0YW5jZVkgKiBkaXN0YW5jZVkpO1xuICAgICAgICAgIGlmIChheGlzID09PSAneCcpIHsgdmFsdWUgPSAtZGlzdGFuY2VYOyB9XG4gICAgICAgICAgaWYgKGF4aXMgPT09ICd5JykgeyB2YWx1ZSA9IC1kaXN0YW5jZVk7IH1cbiAgICAgICAgICB2YWx1ZXMucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbWF4VmFsdWUgPSBNYXRoLm1heC5hcHBseShNYXRoLCB2YWx1ZXMpO1xuICAgICAgfVxuICAgICAgaWYgKGVhc2luZykgeyB2YWx1ZXMgPSB2YWx1ZXMubWFwKGZ1bmN0aW9uICh2YWwpIHsgcmV0dXJuIGVhc2luZyh2YWwgLyBtYXhWYWx1ZSkgKiBtYXhWYWx1ZTsgfSk7IH1cbiAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdyZXZlcnNlJykgeyB2YWx1ZXMgPSB2YWx1ZXMubWFwKGZ1bmN0aW9uICh2YWwpIHsgcmV0dXJuIGF4aXMgPyAodmFsIDwgMCkgPyB2YWwgKiAtMSA6IC12YWwgOiBNYXRoLmFicyhtYXhWYWx1ZSAtIHZhbCk7IH0pOyB9XG4gICAgfVxuICAgIHZhciBzcGFjaW5nID0gaXNSYW5nZSA/ICh2YWwyIC0gdmFsMSkgLyBtYXhWYWx1ZSA6IHZhbDE7XG4gICAgcmV0dXJuIHN0YXJ0ICsgKHNwYWNpbmcgKiAoTWF0aC5yb3VuZCh2YWx1ZXNbaV0gKiAxMDApIC8gMTAwKSkgKyB1bml0O1xuICB9XG59XG5cbi8vIFRpbWVsaW5lXG5cbmZ1bmN0aW9uIHRpbWVsaW5lKHBhcmFtcykge1xuICBpZiAoIHBhcmFtcyA9PT0gdm9pZCAwICkgcGFyYW1zID0ge307XG5cbiAgdmFyIHRsID0gYW5pbWUocGFyYW1zKTtcbiAgdGwuZHVyYXRpb24gPSAwO1xuICB0bC5hZGQgPSBmdW5jdGlvbihpbnN0YW5jZVBhcmFtcywgdGltZWxpbmVPZmZzZXQpIHtcbiAgICB2YXIgdGxJbmRleCA9IGFjdGl2ZUluc3RhbmNlcy5pbmRleE9mKHRsKTtcbiAgICB2YXIgY2hpbGRyZW4gPSB0bC5jaGlsZHJlbjtcbiAgICBpZiAodGxJbmRleCA+IC0xKSB7IGFjdGl2ZUluc3RhbmNlcy5zcGxpY2UodGxJbmRleCwgMSk7IH1cbiAgICBmdW5jdGlvbiBwYXNzVGhyb3VnaChpbnMpIHsgaW5zLnBhc3NUaHJvdWdoID0gdHJ1ZTsgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHsgcGFzc1Rocm91Z2goY2hpbGRyZW5baV0pOyB9XG4gICAgdmFyIGluc1BhcmFtcyA9IG1lcmdlT2JqZWN0cyhpbnN0YW5jZVBhcmFtcywgcmVwbGFjZU9iamVjdFByb3BzKGRlZmF1bHRUd2VlblNldHRpbmdzLCBwYXJhbXMpKTtcbiAgICBpbnNQYXJhbXMudGFyZ2V0cyA9IGluc1BhcmFtcy50YXJnZXRzIHx8IHBhcmFtcy50YXJnZXRzO1xuICAgIHZhciB0bER1cmF0aW9uID0gdGwuZHVyYXRpb247XG4gICAgaW5zUGFyYW1zLmF1dG9wbGF5ID0gZmFsc2U7XG4gICAgaW5zUGFyYW1zLmRpcmVjdGlvbiA9IHRsLmRpcmVjdGlvbjtcbiAgICBpbnNQYXJhbXMudGltZWxpbmVPZmZzZXQgPSBpcy51bmQodGltZWxpbmVPZmZzZXQpID8gdGxEdXJhdGlvbiA6IGdldFJlbGF0aXZlVmFsdWUodGltZWxpbmVPZmZzZXQsIHRsRHVyYXRpb24pO1xuICAgIHBhc3NUaHJvdWdoKHRsKTtcbiAgICB0bC5zZWVrKGluc1BhcmFtcy50aW1lbGluZU9mZnNldCk7XG4gICAgdmFyIGlucyA9IGFuaW1lKGluc1BhcmFtcyk7XG4gICAgcGFzc1Rocm91Z2goaW5zKTtcbiAgICBjaGlsZHJlbi5wdXNoKGlucyk7XG4gICAgdmFyIHRpbWluZ3MgPSBnZXRJbnN0YW5jZVRpbWluZ3MoY2hpbGRyZW4sIHBhcmFtcyk7XG4gICAgdGwuZGVsYXkgPSB0aW1pbmdzLmRlbGF5O1xuICAgIHRsLmVuZERlbGF5ID0gdGltaW5ncy5lbmREZWxheTtcbiAgICB0bC5kdXJhdGlvbiA9IHRpbWluZ3MuZHVyYXRpb247XG4gICAgdGwuc2VlaygwKTtcbiAgICB0bC5yZXNldCgpO1xuICAgIGlmICh0bC5hdXRvcGxheSkgeyB0bC5wbGF5KCk7IH1cbiAgICByZXR1cm4gdGw7XG4gIH07XG4gIHJldHVybiB0bDtcbn1cblxuYW5pbWUudmVyc2lvbiA9ICczLjIuMSc7XG5hbmltZS5zcGVlZCA9IDE7XG4vLyBUT0RPOiNyZXZpZXc6IG5hbWluZywgZG9jdW1lbnRhdGlvblxuYW5pbWUuc3VzcGVuZFdoZW5Eb2N1bWVudEhpZGRlbiA9IHRydWU7XG5hbmltZS5ydW5uaW5nID0gYWN0aXZlSW5zdGFuY2VzO1xuYW5pbWUucmVtb3ZlID0gcmVtb3ZlVGFyZ2V0c0Zyb21BY3RpdmVJbnN0YW5jZXM7XG5hbmltZS5nZXQgPSBnZXRPcmlnaW5hbFRhcmdldFZhbHVlO1xuYW5pbWUuc2V0ID0gc2V0VGFyZ2V0c1ZhbHVlO1xuYW5pbWUuY29udmVydFB4ID0gY29udmVydFB4VG9Vbml0O1xuYW5pbWUucGF0aCA9IGdldFBhdGg7XG5hbmltZS5zZXREYXNob2Zmc2V0ID0gc2V0RGFzaG9mZnNldDtcbmFuaW1lLnN0YWdnZXIgPSBzdGFnZ2VyO1xuYW5pbWUudGltZWxpbmUgPSB0aW1lbGluZTtcbmFuaW1lLmVhc2luZyA9IHBhcnNlRWFzaW5ncztcbmFuaW1lLnBlbm5lciA9IHBlbm5lcjtcbmFuaW1lLnJhbmRvbSA9IGZ1bmN0aW9uIChtaW4sIG1heCkgeyByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjsgfTtcblxuZXhwb3J0IGRlZmF1bHQgYW5pbWU7XG4iLCIvLyBjYW52YXMtY29uZmV0dGkgdjEuMy4zIGJ1aWx0IG9uIDIwMjEtMDEtMTZUMjI6NTA6NDYuOTMyWlxudmFyIG1vZHVsZSA9IHt9O1xuXG4vLyBzb3VyY2UgY29udGVudFxuKGZ1bmN0aW9uIG1haW4oZ2xvYmFsLCBtb2R1bGUsIGlzV29ya2VyLCB3b3JrZXJTaXplKSB7XG4gIHZhciBjYW5Vc2VXb3JrZXIgPSAhIShcbiAgICBnbG9iYWwuV29ya2VyICYmXG4gICAgZ2xvYmFsLkJsb2IgJiZcbiAgICBnbG9iYWwuUHJvbWlzZSAmJlxuICAgIGdsb2JhbC5PZmZzY3JlZW5DYW52YXMgJiZcbiAgICBnbG9iYWwuT2Zmc2NyZWVuQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEICYmXG4gICAgZ2xvYmFsLkhUTUxDYW52YXNFbGVtZW50ICYmXG4gICAgZ2xvYmFsLkhUTUxDYW52YXNFbGVtZW50LnByb3RvdHlwZS50cmFuc2ZlckNvbnRyb2xUb09mZnNjcmVlbiAmJlxuICAgIGdsb2JhbC5VUkwgJiZcbiAgICBnbG9iYWwuVVJMLmNyZWF0ZU9iamVjdFVSTCk7XG5cbiAgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbiAgLy8gY3JlYXRlIGEgcHJvbWlzZSBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSwganVzdFxuICAvLyBjYWxsIHRoZSBmdW5jdGlvbiBkaXJlY3RseVxuICBmdW5jdGlvbiBwcm9taXNlKGZ1bmMpIHtcbiAgICB2YXIgTW9kdWxlUHJvbWlzZSA9IG1vZHVsZS5leHBvcnRzLlByb21pc2U7XG4gICAgdmFyIFByb20gPSBNb2R1bGVQcm9taXNlICE9PSB2b2lkIDAgPyBNb2R1bGVQcm9taXNlIDogZ2xvYmFsLlByb21pc2U7XG5cbiAgICBpZiAodHlwZW9mIFByb20gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbShmdW5jKTtcbiAgICB9XG5cbiAgICBmdW5jKG5vb3AsIG5vb3ApO1xuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2YXIgcmFmID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgVElNRSA9IE1hdGguZmxvb3IoMTAwMCAvIDYwKTtcbiAgICB2YXIgZnJhbWUsIGNhbmNlbDtcbiAgICB2YXIgZnJhbWVzID0ge307XG4gICAgdmFyIGxhc3RGcmFtZVRpbWUgPSAwO1xuXG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGNhbmNlbEFuaW1hdGlvbkZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmcmFtZSA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICB2YXIgaWQgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgICAgIGZyYW1lc1tpZF0gPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gb25GcmFtZSh0aW1lKSB7XG4gICAgICAgICAgaWYgKGxhc3RGcmFtZVRpbWUgPT09IHRpbWUgfHwgbGFzdEZyYW1lVGltZSArIFRJTUUgLSAxIDwgdGltZSkge1xuICAgICAgICAgICAgbGFzdEZyYW1lVGltZSA9IHRpbWU7XG4gICAgICAgICAgICBkZWxldGUgZnJhbWVzW2lkXTtcblxuICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnJhbWVzW2lkXSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShvbkZyYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBpZDtcbiAgICAgIH07XG4gICAgICBjYW5jZWwgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgaWYgKGZyYW1lc1tpZF0pIHtcbiAgICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShmcmFtZXNbaWRdKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnJhbWUgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoY2IsIFRJTUUpO1xuICAgICAgfTtcbiAgICAgIGNhbmNlbCA9IGZ1bmN0aW9uICh0aW1lcikge1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgZnJhbWU6IGZyYW1lLCBjYW5jZWw6IGNhbmNlbCB9O1xuICB9KCkpO1xuXG4gIHZhciBnZXRXb3JrZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciB3b3JrZXI7XG4gICAgdmFyIHByb207XG4gICAgdmFyIHJlc29sdmVzID0ge307XG5cbiAgICBmdW5jdGlvbiBkZWNvcmF0ZSh3b3JrZXIpIHtcbiAgICAgIGZ1bmN0aW9uIGV4ZWN1dGUob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHsgb3B0aW9uczogb3B0aW9ucyB8fCB7fSwgY2FsbGJhY2s6IGNhbGxiYWNrIH0pO1xuICAgICAgfVxuICAgICAgd29ya2VyLmluaXQgPSBmdW5jdGlvbiBpbml0V29ya2VyKGNhbnZhcykge1xuICAgICAgICB2YXIgb2Zmc2NyZWVuID0gY2FudmFzLnRyYW5zZmVyQ29udHJvbFRvT2Zmc2NyZWVuKCk7XG4gICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7IGNhbnZhczogb2Zmc2NyZWVuIH0sIFtvZmZzY3JlZW5dKTtcbiAgICAgIH07XG5cbiAgICAgIHdvcmtlci5maXJlID0gZnVuY3Rpb24gZmlyZVdvcmtlcihvcHRpb25zLCBzaXplLCBkb25lKSB7XG4gICAgICAgIGlmIChwcm9tKSB7XG4gICAgICAgICAgZXhlY3V0ZShvcHRpb25zLCBudWxsKTtcbiAgICAgICAgICByZXR1cm4gcHJvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xuXG4gICAgICAgIHByb20gPSBwcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgICAgZnVuY3Rpb24gd29ya2VyRG9uZShtc2cpIHtcbiAgICAgICAgICAgIGlmIChtc2cuZGF0YS5jYWxsYmFjayAhPT0gaWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWxldGUgcmVzb2x2ZXNbaWRdO1xuICAgICAgICAgICAgd29ya2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB3b3JrZXJEb25lKTtcblxuICAgICAgICAgICAgcHJvbSA9IG51bGw7XG4gICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB3b3JrZXJEb25lKTtcbiAgICAgICAgICBleGVjdXRlKG9wdGlvbnMsIGlkKTtcblxuICAgICAgICAgIHJlc29sdmVzW2lkXSA9IHdvcmtlckRvbmUuYmluZChudWxsLCB7IGRhdGE6IHsgY2FsbGJhY2s6IGlkIH19KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByb207XG4gICAgICB9O1xuXG4gICAgICB3b3JrZXIucmVzZXQgPSBmdW5jdGlvbiByZXNldFdvcmtlcigpIHtcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHsgcmVzZXQ6IHRydWUgfSk7XG5cbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcmVzb2x2ZXMpIHtcbiAgICAgICAgICByZXNvbHZlc1tpZF0oKTtcbiAgICAgICAgICBkZWxldGUgcmVzb2x2ZXNbaWRdO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAod29ya2VyKSB7XG4gICAgICAgIHJldHVybiB3b3JrZXI7XG4gICAgICB9XG5cbiAgICAgIGlmICghaXNXb3JrZXIgJiYgY2FuVXNlV29ya2VyKSB7XG4gICAgICAgIHZhciBjb2RlID0gW1xuICAgICAgICAgICd2YXIgQ09ORkVUVEksIFNJWkUgPSB7fSwgbW9kdWxlID0ge307JyxcbiAgICAgICAgICAnKCcgKyBtYWluLnRvU3RyaW5nKCkgKyAnKSh0aGlzLCBtb2R1bGUsIHRydWUsIFNJWkUpOycsXG4gICAgICAgICAgJ29ubWVzc2FnZSA9IGZ1bmN0aW9uKG1zZykgeycsXG4gICAgICAgICAgJyAgaWYgKG1zZy5kYXRhLm9wdGlvbnMpIHsnLFxuICAgICAgICAgICcgICAgQ09ORkVUVEkobXNnLmRhdGEub3B0aW9ucykudGhlbihmdW5jdGlvbiAoKSB7JyxcbiAgICAgICAgICAnICAgICAgaWYgKG1zZy5kYXRhLmNhbGxiYWNrKSB7JyxcbiAgICAgICAgICAnICAgICAgICBwb3N0TWVzc2FnZSh7IGNhbGxiYWNrOiBtc2cuZGF0YS5jYWxsYmFjayB9KTsnLFxuICAgICAgICAgICcgICAgICB9JyxcbiAgICAgICAgICAnICAgIH0pOycsXG4gICAgICAgICAgJyAgfSBlbHNlIGlmIChtc2cuZGF0YS5yZXNldCkgeycsXG4gICAgICAgICAgJyAgICBDT05GRVRUSS5yZXNldCgpOycsXG4gICAgICAgICAgJyAgfSBlbHNlIGlmIChtc2cuZGF0YS5yZXNpemUpIHsnLFxuICAgICAgICAgICcgICAgU0laRS53aWR0aCA9IG1zZy5kYXRhLnJlc2l6ZS53aWR0aDsnLFxuICAgICAgICAgICcgICAgU0laRS5oZWlnaHQgPSBtc2cuZGF0YS5yZXNpemUuaGVpZ2h0OycsXG4gICAgICAgICAgJyAgfSBlbHNlIGlmIChtc2cuZGF0YS5jYW52YXMpIHsnLFxuICAgICAgICAgICcgICAgU0laRS53aWR0aCA9IG1zZy5kYXRhLmNhbnZhcy53aWR0aDsnLFxuICAgICAgICAgICcgICAgU0laRS5oZWlnaHQgPSBtc2cuZGF0YS5jYW52YXMuaGVpZ2h0OycsXG4gICAgICAgICAgJyAgICBDT05GRVRUSSA9IG1vZHVsZS5leHBvcnRzLmNyZWF0ZShtc2cuZGF0YS5jYW52YXMpOycsXG4gICAgICAgICAgJyAgfScsXG4gICAgICAgICAgJ30nLFxuICAgICAgICBdLmpvaW4oJ1xcbicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHdvcmtlciA9IG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbY29kZV0pKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgIHR5cGVvZiBjb25zb2xlICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gJ2Z1bmN0aW9uJyA/IGNvbnNvbGUud2Fybign8J+OiiBDb3VsZCBub3QgbG9hZCB3b3JrZXInLCBlKSA6IG51bGw7XG5cbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlY29yYXRlKHdvcmtlcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB3b3JrZXI7XG4gICAgfTtcbiAgfSkoKTtcblxuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgcGFydGljbGVDb3VudDogNTAsXG4gICAgYW5nbGU6IDkwLFxuICAgIHNwcmVhZDogNDUsXG4gICAgc3RhcnRWZWxvY2l0eTogNDUsXG4gICAgZGVjYXk6IDAuOSxcbiAgICBncmF2aXR5OiAxLFxuICAgIHRpY2tzOiAyMDAsXG4gICAgeDogMC41LFxuICAgIHk6IDAuNSxcbiAgICBzaGFwZXM6IFsnc3F1YXJlJywgJ2NpcmNsZSddLFxuICAgIHpJbmRleDogMTAwLFxuICAgIGNvbG9yczogW1xuICAgICAgJyMyNmNjZmYnLFxuICAgICAgJyNhMjVhZmQnLFxuICAgICAgJyNmZjVlN2UnLFxuICAgICAgJyM4OGZmNWEnLFxuICAgICAgJyNmY2ZmNDInLFxuICAgICAgJyNmZmE2MmQnLFxuICAgICAgJyNmZjM2ZmYnXG4gICAgXSxcbiAgICAvLyBwcm9iYWJseSBzaG91bGQgYmUgdHJ1ZSwgYnV0IGJhY2stY29tcGF0XG4gICAgZGlzYWJsZUZvclJlZHVjZWRNb3Rpb246IGZhbHNlLFxuICAgIHNjYWxhcjogMVxuICB9O1xuXG4gIGZ1bmN0aW9uIGNvbnZlcnQodmFsLCB0cmFuc2Zvcm0pIHtcbiAgICByZXR1cm4gdHJhbnNmb3JtID8gdHJhbnNmb3JtKHZhbCkgOiB2YWw7XG4gIH1cblxuICBmdW5jdGlvbiBpc09rKHZhbCkge1xuICAgIHJldHVybiAhKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9wKG9wdGlvbnMsIG5hbWUsIHRyYW5zZm9ybSkge1xuICAgIHJldHVybiBjb252ZXJ0KFxuICAgICAgb3B0aW9ucyAmJiBpc09rKG9wdGlvbnNbbmFtZV0pID8gb3B0aW9uc1tuYW1lXSA6IGRlZmF1bHRzW25hbWVdLFxuICAgICAgdHJhbnNmb3JtXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9ubHlQb3NpdGl2ZUludChudW1iZXIpe1xuICAgIHJldHVybiBudW1iZXIgPCAwID8gMCA6IE1hdGguZmxvb3IobnVtYmVyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUludChtaW4sIG1heCkge1xuICAgIC8vIFttaW4sIG1heClcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9EZWNpbWFsKHN0cikge1xuICAgIHJldHVybiBwYXJzZUludChzdHIsIDE2KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbG9yc1RvUmdiKGNvbG9ycykge1xuICAgIHJldHVybiBjb2xvcnMubWFwKGhleFRvUmdiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhleFRvUmdiKHN0cikge1xuICAgIHZhciB2YWwgPSBTdHJpbmcoc3RyKS5yZXBsYWNlKC9bXjAtOWEtZl0vZ2ksICcnKTtcblxuICAgIGlmICh2YWwubGVuZ3RoIDwgNikge1xuICAgICAgICB2YWwgPSB2YWxbMF0rdmFsWzBdK3ZhbFsxXSt2YWxbMV0rdmFsWzJdK3ZhbFsyXTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcjogdG9EZWNpbWFsKHZhbC5zdWJzdHJpbmcoMCwyKSksXG4gICAgICBnOiB0b0RlY2ltYWwodmFsLnN1YnN0cmluZygyLDQpKSxcbiAgICAgIGI6IHRvRGVjaW1hbCh2YWwuc3Vic3RyaW5nKDQsNikpXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE9yaWdpbihvcHRpb25zKSB7XG4gICAgdmFyIG9yaWdpbiA9IHByb3Aob3B0aW9ucywgJ29yaWdpbicsIE9iamVjdCk7XG4gICAgb3JpZ2luLnggPSBwcm9wKG9yaWdpbiwgJ3gnLCBOdW1iZXIpO1xuICAgIG9yaWdpbi55ID0gcHJvcChvcmlnaW4sICd5JywgTnVtYmVyKTtcblxuICAgIHJldHVybiBvcmlnaW47XG4gIH1cblxuICBmdW5jdGlvbiBzZXRDYW52YXNXaW5kb3dTaXplKGNhbnZhcykge1xuICAgIGNhbnZhcy53aWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldENhbnZhc1JlY3RTaXplKGNhbnZhcykge1xuICAgIHZhciByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNhbnZhcy53aWR0aCA9IHJlY3Qud2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IHJlY3QuaGVpZ2h0O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q2FudmFzKHpJbmRleCkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblxuICAgIGNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgY2FudmFzLnN0eWxlLnRvcCA9ICcwcHgnO1xuICAgIGNhbnZhcy5zdHlsZS5sZWZ0ID0gJzBweCc7XG4gICAgY2FudmFzLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gICAgY2FudmFzLnN0eWxlLnpJbmRleCA9IHpJbmRleDtcblxuICAgIHJldHVybiBjYW52YXM7XG4gIH1cblxuICBmdW5jdGlvbiBlbGxpcHNlKGNvbnRleHQsIHgsIHksIHJhZGl1c1gsIHJhZGl1c1ksIHJvdGF0aW9uLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgYW50aUNsb2Nrd2lzZSkge1xuICAgIGNvbnRleHQuc2F2ZSgpO1xuICAgIGNvbnRleHQudHJhbnNsYXRlKHgsIHkpO1xuICAgIGNvbnRleHQucm90YXRlKHJvdGF0aW9uKTtcbiAgICBjb250ZXh0LnNjYWxlKHJhZGl1c1gsIHJhZGl1c1kpO1xuICAgIGNvbnRleHQuYXJjKDAsIDAsIDEsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpQ2xvY2t3aXNlKTtcbiAgICBjb250ZXh0LnJlc3RvcmUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbVBoeXNpY3Mob3B0cykge1xuICAgIHZhciByYWRBbmdsZSA9IG9wdHMuYW5nbGUgKiAoTWF0aC5QSSAvIDE4MCk7XG4gICAgdmFyIHJhZFNwcmVhZCA9IG9wdHMuc3ByZWFkICogKE1hdGguUEkgLyAxODApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IG9wdHMueCxcbiAgICAgIHk6IG9wdHMueSxcbiAgICAgIHdvYmJsZTogTWF0aC5yYW5kb20oKSAqIDEwLFxuICAgICAgdmVsb2NpdHk6IChvcHRzLnN0YXJ0VmVsb2NpdHkgKiAwLjUpICsgKE1hdGgucmFuZG9tKCkgKiBvcHRzLnN0YXJ0VmVsb2NpdHkpLFxuICAgICAgYW5nbGUyRDogLXJhZEFuZ2xlICsgKCgwLjUgKiByYWRTcHJlYWQpIC0gKE1hdGgucmFuZG9tKCkgKiByYWRTcHJlYWQpKSxcbiAgICAgIHRpbHRBbmdsZTogTWF0aC5yYW5kb20oKSAqIE1hdGguUEksXG4gICAgICBjb2xvcjogb3B0cy5jb2xvcixcbiAgICAgIHNoYXBlOiBvcHRzLnNoYXBlLFxuICAgICAgdGljazogMCxcbiAgICAgIHRvdGFsVGlja3M6IG9wdHMudGlja3MsXG4gICAgICBkZWNheTogb3B0cy5kZWNheSxcbiAgICAgIHJhbmRvbTogTWF0aC5yYW5kb20oKSArIDUsXG4gICAgICB0aWx0U2luOiAwLFxuICAgICAgdGlsdENvczogMCxcbiAgICAgIHdvYmJsZVg6IDAsXG4gICAgICB3b2JibGVZOiAwLFxuICAgICAgZ3Jhdml0eTogb3B0cy5ncmF2aXR5ICogMyxcbiAgICAgIG92YWxTY2FsYXI6IDAuNixcbiAgICAgIHNjYWxhcjogb3B0cy5zY2FsYXJcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlRmV0dGkoY29udGV4dCwgZmV0dGkpIHtcbiAgICBmZXR0aS54ICs9IE1hdGguY29zKGZldHRpLmFuZ2xlMkQpICogZmV0dGkudmVsb2NpdHk7XG4gICAgZmV0dGkueSArPSBNYXRoLnNpbihmZXR0aS5hbmdsZTJEKSAqIGZldHRpLnZlbG9jaXR5ICsgZmV0dGkuZ3Jhdml0eTtcbiAgICBmZXR0aS53b2JibGUgKz0gMC4xO1xuICAgIGZldHRpLnZlbG9jaXR5ICo9IGZldHRpLmRlY2F5O1xuICAgIGZldHRpLnRpbHRBbmdsZSArPSAwLjE7XG4gICAgZmV0dGkudGlsdFNpbiA9IE1hdGguc2luKGZldHRpLnRpbHRBbmdsZSk7XG4gICAgZmV0dGkudGlsdENvcyA9IE1hdGguY29zKGZldHRpLnRpbHRBbmdsZSk7XG4gICAgZmV0dGkucmFuZG9tID0gTWF0aC5yYW5kb20oKSArIDU7XG4gICAgZmV0dGkud29iYmxlWCA9IGZldHRpLnggKyAoKDEwICogZmV0dGkuc2NhbGFyKSAqIE1hdGguY29zKGZldHRpLndvYmJsZSkpO1xuICAgIGZldHRpLndvYmJsZVkgPSBmZXR0aS55ICsgKCgxMCAqIGZldHRpLnNjYWxhcikgKiBNYXRoLnNpbihmZXR0aS53b2JibGUpKTtcblxuICAgIHZhciBwcm9ncmVzcyA9IChmZXR0aS50aWNrKyspIC8gZmV0dGkudG90YWxUaWNrcztcblxuICAgIHZhciB4MSA9IGZldHRpLnggKyAoZmV0dGkucmFuZG9tICogZmV0dGkudGlsdENvcyk7XG4gICAgdmFyIHkxID0gZmV0dGkueSArIChmZXR0aS5yYW5kb20gKiBmZXR0aS50aWx0U2luKTtcbiAgICB2YXIgeDIgPSBmZXR0aS53b2JibGVYICsgKGZldHRpLnJhbmRvbSAqIGZldHRpLnRpbHRDb3MpO1xuICAgIHZhciB5MiA9IGZldHRpLndvYmJsZVkgKyAoZmV0dGkucmFuZG9tICogZmV0dGkudGlsdFNpbik7XG5cbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKCcgKyBmZXR0aS5jb2xvci5yICsgJywgJyArIGZldHRpLmNvbG9yLmcgKyAnLCAnICsgZmV0dGkuY29sb3IuYiArICcsICcgKyAoMSAtIHByb2dyZXNzKSArICcpJztcbiAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuXG4gICAgaWYgKGZldHRpLnNoYXBlID09PSAnY2lyY2xlJykge1xuICAgICAgY29udGV4dC5lbGxpcHNlID9cbiAgICAgICAgY29udGV4dC5lbGxpcHNlKGZldHRpLngsIGZldHRpLnksIE1hdGguYWJzKHgyIC0geDEpICogZmV0dGkub3ZhbFNjYWxhciwgTWF0aC5hYnMoeTIgLSB5MSkgKiBmZXR0aS5vdmFsU2NhbGFyLCBNYXRoLlBJIC8gMTAgKiBmZXR0aS53b2JibGUsIDAsIDIgKiBNYXRoLlBJKSA6XG4gICAgICAgIGVsbGlwc2UoY29udGV4dCwgZmV0dGkueCwgZmV0dGkueSwgTWF0aC5hYnMoeDIgLSB4MSkgKiBmZXR0aS5vdmFsU2NhbGFyLCBNYXRoLmFicyh5MiAtIHkxKSAqIGZldHRpLm92YWxTY2FsYXIsIE1hdGguUEkgLyAxMCAqIGZldHRpLndvYmJsZSwgMCwgMiAqIE1hdGguUEkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0Lm1vdmVUbyhNYXRoLmZsb29yKGZldHRpLngpLCBNYXRoLmZsb29yKGZldHRpLnkpKTtcbiAgICAgIGNvbnRleHQubGluZVRvKE1hdGguZmxvb3IoZmV0dGkud29iYmxlWCksIE1hdGguZmxvb3IoeTEpKTtcbiAgICAgIGNvbnRleHQubGluZVRvKE1hdGguZmxvb3IoeDIpLCBNYXRoLmZsb29yKHkyKSk7XG4gICAgICBjb250ZXh0LmxpbmVUbyhNYXRoLmZsb29yKHgxKSwgTWF0aC5mbG9vcihmZXR0aS53b2JibGVZKSk7XG4gICAgfVxuXG4gICAgY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICBjb250ZXh0LmZpbGwoKTtcblxuICAgIHJldHVybiBmZXR0aS50aWNrIDwgZmV0dGkudG90YWxUaWNrcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFuaW1hdGUoY2FudmFzLCBmZXR0aXMsIHJlc2l6ZXIsIHNpemUsIGRvbmUpIHtcbiAgICB2YXIgYW5pbWF0aW5nRmV0dGlzID0gZmV0dGlzLnNsaWNlKCk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB2YXIgYW5pbWF0aW9uRnJhbWU7XG4gICAgdmFyIGRlc3Ryb3k7XG5cbiAgICB2YXIgcHJvbSA9IHByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgIGZ1bmN0aW9uIG9uRG9uZSgpIHtcbiAgICAgICAgYW5pbWF0aW9uRnJhbWUgPSBkZXN0cm95ID0gbnVsbDtcblxuICAgICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBzaXplLndpZHRoLCBzaXplLmhlaWdodCk7XG5cbiAgICAgICAgZG9uZSgpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKGlzV29ya2VyICYmICEoc2l6ZS53aWR0aCA9PT0gd29ya2VyU2l6ZS53aWR0aCAmJiBzaXplLmhlaWdodCA9PT0gd29ya2VyU2l6ZS5oZWlnaHQpKSB7XG4gICAgICAgICAgc2l6ZS53aWR0aCA9IGNhbnZhcy53aWR0aCA9IHdvcmtlclNpemUud2lkdGg7XG4gICAgICAgICAgc2l6ZS5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0ID0gd29ya2VyU2l6ZS5oZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNpemUud2lkdGggJiYgIXNpemUuaGVpZ2h0KSB7XG4gICAgICAgICAgcmVzaXplcihjYW52YXMpO1xuICAgICAgICAgIHNpemUud2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgICAgICAgc2l6ZS5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpO1xuXG4gICAgICAgIGFuaW1hdGluZ0ZldHRpcyA9IGFuaW1hdGluZ0ZldHRpcy5maWx0ZXIoZnVuY3Rpb24gKGZldHRpKSB7XG4gICAgICAgICAgcmV0dXJuIHVwZGF0ZUZldHRpKGNvbnRleHQsIGZldHRpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGFuaW1hdGluZ0ZldHRpcy5sZW5ndGgpIHtcbiAgICAgICAgICBhbmltYXRpb25GcmFtZSA9IHJhZi5mcmFtZSh1cGRhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9uRG9uZSgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFuaW1hdGlvbkZyYW1lID0gcmFmLmZyYW1lKHVwZGF0ZSk7XG4gICAgICBkZXN0cm95ID0gb25Eb25lO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZEZldHRpczogZnVuY3Rpb24gKGZldHRpcykge1xuICAgICAgICBhbmltYXRpbmdGZXR0aXMgPSBhbmltYXRpbmdGZXR0aXMuY29uY2F0KGZldHRpcyk7XG5cbiAgICAgICAgcmV0dXJuIHByb207XG4gICAgICB9LFxuICAgICAgY2FudmFzOiBjYW52YXMsXG4gICAgICBwcm9taXNlOiBwcm9tLFxuICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICAgICAgcmFmLmNhbmNlbChhbmltYXRpb25GcmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVzdHJveSkge1xuICAgICAgICAgIGRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjb25mZXR0aUNhbm5vbihjYW52YXMsIGdsb2JhbE9wdHMpIHtcbiAgICB2YXIgaXNMaWJDYW52YXMgPSAhY2FudmFzO1xuICAgIHZhciBhbGxvd1Jlc2l6ZSA9ICEhcHJvcChnbG9iYWxPcHRzIHx8IHt9LCAncmVzaXplJyk7XG4gICAgdmFyIGdsb2JhbERpc2FibGVGb3JSZWR1Y2VkTW90aW9uID0gcHJvcChnbG9iYWxPcHRzLCAnZGlzYWJsZUZvclJlZHVjZWRNb3Rpb24nLCBCb29sZWFuKTtcbiAgICB2YXIgc2hvdWxkVXNlV29ya2VyID0gY2FuVXNlV29ya2VyICYmICEhcHJvcChnbG9iYWxPcHRzIHx8IHt9LCAndXNlV29ya2VyJyk7XG4gICAgdmFyIHdvcmtlciA9IHNob3VsZFVzZVdvcmtlciA/IGdldFdvcmtlcigpIDogbnVsbDtcbiAgICB2YXIgcmVzaXplciA9IGlzTGliQ2FudmFzID8gc2V0Q2FudmFzV2luZG93U2l6ZSA6IHNldENhbnZhc1JlY3RTaXplO1xuICAgIHZhciBpbml0aWFsaXplZCA9IChjYW52YXMgJiYgd29ya2VyKSA/ICEhY2FudmFzLl9fY29uZmV0dGlfaW5pdGlhbGl6ZWQgOiBmYWxzZTtcbiAgICB2YXIgcHJlZmVyTGVzc01vdGlvbiA9IHR5cGVvZiBtYXRjaE1lZGlhID09PSAnZnVuY3Rpb24nICYmIG1hdGNoTWVkaWEoJyhwcmVmZXJzLXJlZHVjZWQtbW90aW9uKScpLm1hdGNoZXM7XG4gICAgdmFyIGFuaW1hdGlvbk9iajtcblxuICAgIGZ1bmN0aW9uIGZpcmVMb2NhbChvcHRpb25zLCBzaXplLCBkb25lKSB7XG4gICAgICB2YXIgcGFydGljbGVDb3VudCA9IHByb3Aob3B0aW9ucywgJ3BhcnRpY2xlQ291bnQnLCBvbmx5UG9zaXRpdmVJbnQpO1xuICAgICAgdmFyIGFuZ2xlID0gcHJvcChvcHRpb25zLCAnYW5nbGUnLCBOdW1iZXIpO1xuICAgICAgdmFyIHNwcmVhZCA9IHByb3Aob3B0aW9ucywgJ3NwcmVhZCcsIE51bWJlcik7XG4gICAgICB2YXIgc3RhcnRWZWxvY2l0eSA9IHByb3Aob3B0aW9ucywgJ3N0YXJ0VmVsb2NpdHknLCBOdW1iZXIpO1xuICAgICAgdmFyIGRlY2F5ID0gcHJvcChvcHRpb25zLCAnZGVjYXknLCBOdW1iZXIpO1xuICAgICAgdmFyIGdyYXZpdHkgPSBwcm9wKG9wdGlvbnMsICdncmF2aXR5JywgTnVtYmVyKTtcbiAgICAgIHZhciBjb2xvcnMgPSBwcm9wKG9wdGlvbnMsICdjb2xvcnMnLCBjb2xvcnNUb1JnYik7XG4gICAgICB2YXIgdGlja3MgPSBwcm9wKG9wdGlvbnMsICd0aWNrcycsIE51bWJlcik7XG4gICAgICB2YXIgc2hhcGVzID0gcHJvcChvcHRpb25zLCAnc2hhcGVzJyk7XG4gICAgICB2YXIgc2NhbGFyID0gcHJvcChvcHRpb25zLCAnc2NhbGFyJyk7XG4gICAgICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKG9wdGlvbnMpO1xuXG4gICAgICB2YXIgdGVtcCA9IHBhcnRpY2xlQ291bnQ7XG4gICAgICB2YXIgZmV0dGlzID0gW107XG5cbiAgICAgIHZhciBzdGFydFggPSBjYW52YXMud2lkdGggKiBvcmlnaW4ueDtcbiAgICAgIHZhciBzdGFydFkgPSBjYW52YXMuaGVpZ2h0ICogb3JpZ2luLnk7XG5cbiAgICAgIHdoaWxlICh0ZW1wLS0pIHtcbiAgICAgICAgZmV0dGlzLnB1c2goXG4gICAgICAgICAgcmFuZG9tUGh5c2ljcyh7XG4gICAgICAgICAgICB4OiBzdGFydFgsXG4gICAgICAgICAgICB5OiBzdGFydFksXG4gICAgICAgICAgICBhbmdsZTogYW5nbGUsXG4gICAgICAgICAgICBzcHJlYWQ6IHNwcmVhZCxcbiAgICAgICAgICAgIHN0YXJ0VmVsb2NpdHk6IHN0YXJ0VmVsb2NpdHksXG4gICAgICAgICAgICBjb2xvcjogY29sb3JzW3RlbXAgJSBjb2xvcnMubGVuZ3RoXSxcbiAgICAgICAgICAgIHNoYXBlOiBzaGFwZXNbcmFuZG9tSW50KDAsIHNoYXBlcy5sZW5ndGgpXSxcbiAgICAgICAgICAgIHRpY2tzOiB0aWNrcyxcbiAgICAgICAgICAgIGRlY2F5OiBkZWNheSxcbiAgICAgICAgICAgIGdyYXZpdHk6IGdyYXZpdHksXG4gICAgICAgICAgICBzY2FsYXI6IHNjYWxhclxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHdlIGhhdmUgYSBwcmV2aW91cyBjYW52YXMgYWxyZWFkeSBhbmltYXRpbmcsXG4gICAgICAvLyBhZGQgdG8gaXRcbiAgICAgIGlmIChhbmltYXRpb25PYmopIHtcbiAgICAgICAgcmV0dXJuIGFuaW1hdGlvbk9iai5hZGRGZXR0aXMoZmV0dGlzKTtcbiAgICAgIH1cblxuICAgICAgYW5pbWF0aW9uT2JqID0gYW5pbWF0ZShjYW52YXMsIGZldHRpcywgcmVzaXplciwgc2l6ZSAsIGRvbmUpO1xuXG4gICAgICByZXR1cm4gYW5pbWF0aW9uT2JqLnByb21pc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlyZShvcHRpb25zKSB7XG4gICAgICB2YXIgZGlzYWJsZUZvclJlZHVjZWRNb3Rpb24gPSBnbG9iYWxEaXNhYmxlRm9yUmVkdWNlZE1vdGlvbiB8fCBwcm9wKG9wdGlvbnMsICdkaXNhYmxlRm9yUmVkdWNlZE1vdGlvbicsIEJvb2xlYW4pO1xuICAgICAgdmFyIHpJbmRleCA9IHByb3Aob3B0aW9ucywgJ3pJbmRleCcsIE51bWJlcik7XG5cbiAgICAgIGlmIChkaXNhYmxlRm9yUmVkdWNlZE1vdGlvbiAmJiBwcmVmZXJMZXNzTW90aW9uKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzTGliQ2FudmFzICYmIGFuaW1hdGlvbk9iaikge1xuICAgICAgICAvLyB1c2UgZXhpc3RpbmcgY2FudmFzIGZyb20gaW4tcHJvZ3Jlc3MgYW5pbWF0aW9uXG4gICAgICAgIGNhbnZhcyA9IGFuaW1hdGlvbk9iai5jYW52YXM7XG4gICAgICB9IGVsc2UgaWYgKGlzTGliQ2FudmFzICYmICFjYW52YXMpIHtcbiAgICAgICAgLy8gY3JlYXRlIGFuZCBpbml0aWFsaXplIGEgbmV3IGNhbnZhc1xuICAgICAgICBjYW52YXMgPSBnZXRDYW52YXMoekluZGV4KTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoYWxsb3dSZXNpemUgJiYgIWluaXRpYWxpemVkKSB7XG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIHNpemUgb2YgYSB1c2VyLXN1cHBsaWVkIGNhbnZhc1xuICAgICAgICByZXNpemVyKGNhbnZhcyk7XG4gICAgICB9XG5cbiAgICAgIHZhciBzaXplID0ge1xuICAgICAgICB3aWR0aDogY2FudmFzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGNhbnZhcy5oZWlnaHRcbiAgICAgIH07XG5cbiAgICAgIGlmICh3b3JrZXIgJiYgIWluaXRpYWxpemVkKSB7XG4gICAgICAgIHdvcmtlci5pbml0KGNhbnZhcyk7XG4gICAgICB9XG5cbiAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgICAgaWYgKHdvcmtlcikge1xuICAgICAgICBjYW52YXMuX19jb25mZXR0aV9pbml0aWFsaXplZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uUmVzaXplKCkge1xuICAgICAgICBpZiAod29ya2VyKSB7XG4gICAgICAgICAgLy8gVE9ETyB0aGlzIHJlYWxseSBzaG91bGRuJ3QgYmUgaW1tZWRpYXRlLCBiZWNhdXNlIGl0IGlzIGV4cGVuc2l2ZVxuICAgICAgICAgIHZhciBvYmogPSB7XG4gICAgICAgICAgICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKCFpc0xpYkNhbnZhcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgcmVzaXplcihvYmopO1xuXG4gICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHJlc2l6ZToge1xuICAgICAgICAgICAgICB3aWR0aDogb2JqLndpZHRoLFxuICAgICAgICAgICAgICBoZWlnaHQ6IG9iai5oZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkb24ndCBhY3R1YWxseSBxdWVyeSB0aGUgc2l6ZSBoZXJlLCBzaW5jZSB0aGlzXG4gICAgICAgIC8vIGNhbiBleGVjdXRlIGZyZXF1ZW50bHkgYW5kIHJhcGlkbHlcbiAgICAgICAgc2l6ZS53aWR0aCA9IHNpemUuaGVpZ2h0ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZG9uZSgpIHtcbiAgICAgICAgYW5pbWF0aW9uT2JqID0gbnVsbDtcblxuICAgICAgICBpZiAoYWxsb3dSZXNpemUpIHtcbiAgICAgICAgICBnbG9iYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25SZXNpemUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzTGliQ2FudmFzICYmIGNhbnZhcykge1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoY2FudmFzKTtcbiAgICAgICAgICBjYW52YXMgPSBudWxsO1xuICAgICAgICAgIGluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGFsbG93UmVzaXplKSB7XG4gICAgICAgIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvblJlc2l6ZSwgZmFsc2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAod29ya2VyKSB7XG4gICAgICAgIHJldHVybiB3b3JrZXIuZmlyZShvcHRpb25zLCBzaXplLCBkb25lKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpcmVMb2NhbChvcHRpb25zLCBzaXplLCBkb25lKTtcbiAgICB9XG5cbiAgICBmaXJlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHdvcmtlcikge1xuICAgICAgICB3b3JrZXIucmVzZXQoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFuaW1hdGlvbk9iaikge1xuICAgICAgICBhbmltYXRpb25PYmoucmVzZXQoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGZpcmU7XG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IGNvbmZldHRpQ2Fubm9uKG51bGwsIHsgdXNlV29ya2VyOiB0cnVlLCByZXNpemU6IHRydWUgfSk7XG4gIG1vZHVsZS5leHBvcnRzLmNyZWF0ZSA9IGNvbmZldHRpQ2Fubm9uO1xufSgoZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gd2luZG93O1xuICB9XG5cbiAgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMgfHwge307XG59KSgpLCBtb2R1bGUsIGZhbHNlKSk7XG5cbi8vIGVuZCBzb3VyY2UgY29udGVudFxuXG5leHBvcnQgZGVmYXVsdCBtb2R1bGUuZXhwb3J0cztcbmV4cG9ydCB2YXIgY3JlYXRlID0gbW9kdWxlLmV4cG9ydHMuY3JlYXRlO1xuIiwiLy8gZXh0cmFjdGVkIGJ5IG1pbmktY3NzLWV4dHJhY3QtcGx1Z2luXG5leHBvcnQge307IiwiaW1wb3J0IGFuaW1lIGZyb20gJy4uLy4uLy4uL25vZGVfbW9kdWxlcy9hbmltZWpzL2xpYi9hbmltZS5lcy5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGFuaW1lQmxvY2tzKCkge1xuXHQvLyB2aXN1YWxpemVyXG5cdGNvbnN0IHN0YWdnZXJWaXN1YWxpemVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuXHRcdCcuc3RhZ2dlci12aXN1YWxpemVyJ1xuXHQpO1xuXHRjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0Y29uc3QgZ3JpZCA9IFsxNywgMTddO1xuXHRjb25zdCBjb2wgPSBncmlkWzBdO1xuXHRjb25zdCByb3cgPSBncmlkWzFdO1xuXHRjb25zdCBudW1iZXJPZkVsZW1lbnRzID0gY29sICogcm93O1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZFbGVtZW50czsgaSsrKSB7XG5cdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpO1xuXHR9XG5cblx0c3RhZ2dlclZpc3VhbGl6ZXJFbC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG5cblx0Y29uc3Qgc3RhZ2dlcnNBbmltYXRpb24gPSBhbmltZVxuXHRcdC50aW1lbGluZSh7XG5cdFx0XHR0YXJnZXRzOiAnLnN0YWdnZXItdmlzdWFsaXplciBkaXYnLFxuXHRcdFx0ZWFzaW5nOiAnZWFzZUluT3V0U2luZScsXG5cdFx0XHRkZWxheTogYW5pbWUuc3RhZ2dlcig1MCksXG5cdFx0XHRsb29wOiB0cnVlLFxuXHRcdFx0YXV0b3BsYXk6IGZhbHNlLFxuXHRcdH0pXG5cdFx0LmFkZCh7XG5cdFx0XHR0cmFuc2xhdGVYOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YWx1ZTogYW5pbWUuc3RhZ2dlcignLS4xcmVtJywge1xuXHRcdFx0XHRcdFx0Z3JpZDogZ3JpZCxcblx0XHRcdFx0XHRcdGZyb206ICdjZW50ZXInLFxuXHRcdFx0XHRcdFx0YXhpczogJ3gnLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFsdWU6IGFuaW1lLnN0YWdnZXIoJy4xcmVtJywge1xuXHRcdFx0XHRcdFx0Z3JpZDogZ3JpZCxcblx0XHRcdFx0XHRcdGZyb206ICdjZW50ZXInLFxuXHRcdFx0XHRcdFx0YXhpczogJ3gnLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHRcdHRyYW5zbGF0ZVk6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhbHVlOiBhbmltZS5zdGFnZ2VyKCctLjFyZW0nLCB7XG5cdFx0XHRcdFx0XHRncmlkOiBncmlkLFxuXHRcdFx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHRcdFx0XHRheGlzOiAneScsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YWx1ZTogYW5pbWUuc3RhZ2dlcignLjFyZW0nLCB7XG5cdFx0XHRcdFx0XHRncmlkOiBncmlkLFxuXHRcdFx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHRcdFx0XHRheGlzOiAneScsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdFx0ZHVyYXRpb246IDEwMDAsXG5cdFx0XHRzY2FsZTogMC41LFxuXHRcdFx0ZGVsYXk6IGFuaW1lLnN0YWdnZXIoMTAwLCB7XG5cdFx0XHRcdGdyaWQ6IGdyaWQsXG5cdFx0XHRcdGZyb206ICdjZW50ZXInLFxuXHRcdFx0fSksXG5cdFx0fSlcblx0XHQuYWRkKHtcblx0XHRcdHRyYW5zbGF0ZVg6ICgpID0+IGFuaW1lLnJhbmRvbSgtMTAsIDEwKSxcblx0XHRcdHRyYW5zbGF0ZVk6ICgpID0+IGFuaW1lLnJhbmRvbSgtMTAsIDEwKSxcblx0XHRcdGRlbGF5OiBhbmltZS5zdGFnZ2VyKDgsIHsgZnJvbTogJ2xhc3QnIH0pLFxuXHRcdH0pXG5cdFx0LmFkZCh7XG5cdFx0XHR0cmFuc2xhdGVYOiBhbmltZS5zdGFnZ2VyKCcuMjVyZW0nLCB7XG5cdFx0XHRcdGdyaWQ6IGdyaWQsXG5cdFx0XHRcdGZyb206ICdjZW50ZXInLFxuXHRcdFx0XHRheGlzOiAneCcsXG5cdFx0XHR9KSxcblx0XHRcdHRyYW5zbGF0ZVk6IGFuaW1lLnN0YWdnZXIoJy4yNXJlbScsIHtcblx0XHRcdFx0Z3JpZDogZ3JpZCxcblx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHRcdGF4aXM6ICd5Jyxcblx0XHRcdH0pLFxuXHRcdFx0cm90YXRlOiAwLFxuXHRcdFx0c2NhbGVYOiAyLjUsXG5cdFx0XHRzY2FsZVk6IDAuMjUsXG5cdFx0XHRkZWxheTogYW5pbWUuc3RhZ2dlcig0LCB7IGZyb206ICdjZW50ZXInIH0pLFxuXHRcdH0pXG5cdFx0LmFkZCh7XG5cdFx0XHRyb3RhdGU6IGFuaW1lLnN0YWdnZXIoWzkwLCAwXSwge1xuXHRcdFx0XHRncmlkOiBncmlkLFxuXHRcdFx0XHRmcm9tOiAnY2VudGVyJyxcblx0XHRcdH0pLFxuXHRcdFx0ZGVsYXk6IGFuaW1lLnN0YWdnZXIoNTAsIHtcblx0XHRcdFx0Z3JpZDogZ3JpZCxcblx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHR9KSxcblx0XHR9KVxuXHRcdC5hZGQoe1xuXHRcdFx0dHJhbnNsYXRlWDogMCxcblx0XHRcdHRyYW5zbGF0ZVk6IDAsXG5cdFx0XHRzY2FsZTogMC41LFxuXHRcdFx0c2NhbGVYOiAxLFxuXHRcdFx0cm90YXRlOiAxODAsXG5cdFx0XHRkdXJhdGlvbjogMTAwMCxcblx0XHRcdGRlbGF5OiBhbmltZS5zdGFnZ2VyKDEwMCwge1xuXHRcdFx0XHRncmlkOiBncmlkLFxuXHRcdFx0XHRmcm9tOiAnY2VudGVyJyxcblx0XHRcdH0pLFxuXHRcdH0pXG5cdFx0LmFkZCh7XG5cdFx0XHRzY2FsZVk6IDEsXG5cdFx0XHRzY2FsZTogMSxcblx0XHRcdGRlbGF5OiBhbmltZS5zdGFnZ2VyKDIwLCB7XG5cdFx0XHRcdGdyaWQ6IGdyaWQsXG5cdFx0XHRcdGZyb206ICdjZW50ZXInLFxuXHRcdFx0fSksXG5cdFx0fSk7XG5cblx0c3RhZ2dlcnNBbmltYXRpb24ucGxheSgpO1xufVxuIiwiaW1wb3J0IGFuaW1lIGZyb20gJy4uLy4uLy4uL25vZGVfbW9kdWxlcy9hbmltZWpzL2xpYi9hbmltZS5lcy5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbG9yU3BsYXNoKCkge1xuXHQvLyBTcGxhc2ggb2YgY29sb3Jcblx0dmFyIGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYycpO1xuXHR2YXIgY3R4ID0gYy5nZXRDb250ZXh0KCcyZCcpO1xuXHR2YXIgY0g7XG5cdHZhciBjVztcblx0dmFyIGJnQ29sb3IgPSAnIzAwMCc7XG5cdHZhciBhbmltYXRpb25zID0gW107XG5cdHZhciBjaXJjbGVzID0gW107XG5cblx0dmFyIGNvbG9yUGlja2VyID0gKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY29sb3JzID0gWycjRkY2MTM4JywgJyNGRkJFNTMnLCAnIzI5ODBCOScsICcjMjgyNzQxJ107XG5cdFx0dmFyIGluZGV4ID0gMDtcblx0XHRmdW5jdGlvbiBuZXh0KCkge1xuXHRcdFx0aW5kZXggPSBpbmRleCsrIDwgY29sb3JzLmxlbmd0aCAtIDEgPyBpbmRleCA6IDA7XG5cdFx0XHRyZXR1cm4gY29sb3JzW2luZGV4XTtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gY3VycmVudCgpIHtcblx0XHRcdHJldHVybiBjb2xvcnNbaW5kZXhdO1xuXHRcdH1cblx0XHRyZXR1cm4ge1xuXHRcdFx0bmV4dDogbmV4dCxcblx0XHRcdGN1cnJlbnQ6IGN1cnJlbnQsXG5cdFx0fTtcblx0fSkoKTtcblxuXHRmdW5jdGlvbiByZW1vdmVBbmltYXRpb24oYW5pbWF0aW9uKSB7XG5cdFx0dmFyIGluZGV4ID0gYW5pbWF0aW9ucy5pbmRleE9mKGFuaW1hdGlvbik7XG5cdFx0aWYgKGluZGV4ID4gLTEpIGFuaW1hdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbGNQYWdlRmlsbFJhZGl1cyh4LCB5KSB7XG5cdFx0dmFyIGwgPSBNYXRoLm1heCh4IC0gMCwgY1cgLSB4KTtcblx0XHR2YXIgaCA9IE1hdGgubWF4KHkgLSAwLCBjSCAtIHkpO1xuXHRcdHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cobCwgMikgKyBNYXRoLnBvdyhoLCAyKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBhZGRDbGlja0xpc3RlbmVycygpIHtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlRXZlbnQpO1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZUV2ZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUV2ZW50KGUpIHtcblx0XHRpZiAoZS50b3VjaGVzKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRlID0gZS50b3VjaGVzWzBdO1xuXHRcdH1cblx0XHR2YXIgY3VycmVudENvbG9yID0gY29sb3JQaWNrZXIuY3VycmVudCgpO1xuXHRcdHZhciBuZXh0Q29sb3IgPSBjb2xvclBpY2tlci5uZXh0KCk7XG5cdFx0dmFyIHRhcmdldFIgPSBjYWxjUGFnZUZpbGxSYWRpdXMoZS5wYWdlWCwgZS5wYWdlWSk7XG5cdFx0dmFyIHJpcHBsZVNpemUgPSBNYXRoLm1pbigyMDAsIGNXICogMC40KTtcblx0XHR2YXIgbWluQ292ZXJEdXJhdGlvbiA9IDc1MDtcblxuXHRcdHZhciBwYWdlRmlsbCA9IG5ldyBDaXJjbGUoe1xuXHRcdFx0eDogZS5jbGllbnRYLFxuXHRcdFx0eTogZS5jbGllbnRZLFxuXHRcdFx0cjogMCxcblx0XHRcdGZpbGw6IG5leHRDb2xvcixcblx0XHR9KTtcblx0XHR2YXIgZmlsbEFuaW1hdGlvbiA9IGFuaW1lKHtcblx0XHRcdHRhcmdldHM6IHBhZ2VGaWxsLFxuXHRcdFx0cjogdGFyZ2V0Uixcblx0XHRcdGR1cmF0aW9uOiBNYXRoLm1heCh0YXJnZXRSIC8gMiwgbWluQ292ZXJEdXJhdGlvbiksXG5cdFx0XHRlYXNpbmc6ICdlYXNlT3V0UXVhcnQnLFxuXHRcdFx0Y29tcGxldGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YmdDb2xvciA9IHBhZ2VGaWxsLmZpbGw7XG5cdFx0XHRcdHJlbW92ZUFuaW1hdGlvbihmaWxsQW5pbWF0aW9uKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cblx0XHR2YXIgcmlwcGxlID0gbmV3IENpcmNsZSh7XG5cdFx0XHR4OiBlLmNsaWVudFgsXG5cdFx0XHR5OiBlLmNsaWVudFksXG5cdFx0XHRyOiAwLFxuXHRcdFx0ZmlsbDogY3VycmVudENvbG9yLFxuXHRcdFx0c3Ryb2tlOiB7XG5cdFx0XHRcdHdpZHRoOiAzLFxuXHRcdFx0XHRjb2xvcjogY3VycmVudENvbG9yLFxuXHRcdFx0fSxcblx0XHRcdG9wYWNpdHk6IDEsXG5cdFx0fSk7XG5cdFx0dmFyIHJpcHBsZUFuaW1hdGlvbiA9IGFuaW1lKHtcblx0XHRcdHRhcmdldHM6IHJpcHBsZSxcblx0XHRcdHI6IHJpcHBsZVNpemUsXG5cdFx0XHRvcGFjaXR5OiAwLFxuXHRcdFx0ZWFzaW5nOiAnZWFzZU91dEV4cG8nLFxuXHRcdFx0ZHVyYXRpb246IDkwMCxcblx0XHRcdGNvbXBsZXRlOiByZW1vdmVBbmltYXRpb24sXG5cdFx0fSk7XG5cblx0XHR2YXIgcGFydGljbGVzID0gW107XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAzMjsgaSsrKSB7XG5cdFx0XHR2YXIgcGFydGljbGUgPSBuZXcgQ2lyY2xlKHtcblx0XHRcdFx0eDogZS5jbGllbnRYLFxuXHRcdFx0XHR5OiBlLmNsaWVudFksXG5cdFx0XHRcdGZpbGw6IGN1cnJlbnRDb2xvcixcblx0XHRcdFx0cjogYW5pbWUucmFuZG9tKDI0LCA0OCksXG5cdFx0XHR9KTtcblx0XHRcdHBhcnRpY2xlcy5wdXNoKHBhcnRpY2xlKTtcblx0XHR9XG5cdFx0dmFyIHBhcnRpY2xlc0FuaW1hdGlvbiA9IGFuaW1lKHtcblx0XHRcdHRhcmdldHM6IHBhcnRpY2xlcyxcblx0XHRcdHg6IGZ1bmN0aW9uIChwYXJ0aWNsZSkge1xuXHRcdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRcdHBhcnRpY2xlLnggK1xuXHRcdFx0XHRcdGFuaW1lLnJhbmRvbShyaXBwbGVTaXplLCAtcmlwcGxlU2l6ZSlcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0XHR5OiBmdW5jdGlvbiAocGFydGljbGUpIHtcblx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHRwYXJ0aWNsZS55ICtcblx0XHRcdFx0XHRhbmltZS5yYW5kb20oXG5cdFx0XHRcdFx0XHRyaXBwbGVTaXplICogMS4xNSxcblx0XHRcdFx0XHRcdC1yaXBwbGVTaXplICogMS4xNVxuXHRcdFx0XHRcdClcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0XHRyOiAwLFxuXHRcdFx0ZWFzaW5nOiAnZWFzZU91dEV4cG8nLFxuXHRcdFx0ZHVyYXRpb246IGFuaW1lLnJhbmRvbSgxMDAwLCAxMzAwKSxcblx0XHRcdGNvbXBsZXRlOiByZW1vdmVBbmltYXRpb24sXG5cdFx0fSk7XG5cdFx0YW5pbWF0aW9ucy5wdXNoKFxuXHRcdFx0ZmlsbEFuaW1hdGlvbixcblx0XHRcdHJpcHBsZUFuaW1hdGlvbixcblx0XHRcdHBhcnRpY2xlc0FuaW1hdGlvblxuXHRcdCk7XG5cdH1cblxuXHRmdW5jdGlvbiBleHRlbmQoYSwgYikge1xuXHRcdGZvciAodmFyIGtleSBpbiBiKSB7XG5cdFx0XHRpZiAoYi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGFba2V5XSA9IGJba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGE7XG5cdH1cblxuXHR2YXIgQ2lyY2xlID0gZnVuY3Rpb24gKG9wdHMpIHtcblx0XHRleHRlbmQodGhpcywgb3B0cyk7XG5cdH07XG5cblx0Q2lyY2xlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKCkge1xuXHRcdGN0eC5nbG9iYWxBbHBoYSA9IHRoaXMub3BhY2l0eSB8fCAxO1xuXHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRjdHguYXJjKHRoaXMueCwgdGhpcy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG5cdFx0aWYgKHRoaXMuc3Ryb2tlKSB7XG5cdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnN0cm9rZS5jb2xvcjtcblx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLnN0cm9rZS53aWR0aDtcblx0XHRcdGN0eC5zdHJva2UoKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuZmlsbCkge1xuXHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcblx0XHRcdGN0eC5maWxsKCk7XG5cdFx0fVxuXHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRjdHguZ2xvYmFsQWxwaGEgPSAxO1xuXHR9O1xuXG5cdHZhciBhbmltYXRlID0gYW5pbWUoe1xuXHRcdGR1cmF0aW9uOiBJbmZpbml0eSxcblx0XHR1cGRhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGN0eC5maWxsU3R5bGUgPSBiZ0NvbG9yO1xuXHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNXLCBjSCk7XG5cdFx0XHRhbmltYXRpb25zLmZvckVhY2goZnVuY3Rpb24gKGFuaW0pIHtcblx0XHRcdFx0YW5pbS5hbmltYXRhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uIChhbmltYXRhYmxlKSB7XG5cdFx0XHRcdFx0YW5pbWF0YWJsZS50YXJnZXQuZHJhdygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cdH0pO1xuXG5cdHZhciByZXNpemVDYW52YXMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0Y1cgPSB3aW5kb3cuaW5uZXJXaWR0aDtcblx0XHRjSCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblx0XHRjLndpZHRoID0gY1cgKiBkZXZpY2VQaXhlbFJhdGlvO1xuXHRcdGMuaGVpZ2h0ID0gY0ggKiBkZXZpY2VQaXhlbFJhdGlvO1xuXHRcdGN0eC5zY2FsZShkZXZpY2VQaXhlbFJhdGlvLCBkZXZpY2VQaXhlbFJhdGlvKTtcblx0fTtcblxuXHQoZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRyZXNpemVDYW52YXMoKTtcblx0XHRpZiAod2luZG93LkNQKSB7XG5cdFx0XHQvLyBDb2RlUGVuJ3MgbG9vcCBkZXRlY3Rpb24gd2FzIGNhdXNpbicgcHJvYmxlbXNcblx0XHRcdC8vIGFuZCBJIGhhdmUgbm8gaWRlYSB3aHksIHNvLi4uXG5cdFx0XHR3aW5kb3cuQ1AuUGVuVGltZXIuTUFYX1RJTUVfSU5fTE9PUF9XT19FWElUID0gNjAwMDtcblx0XHR9XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZUNhbnZhcyk7XG5cdFx0YWRkQ2xpY2tMaXN0ZW5lcnMoKTtcblx0XHRpZiAoISF3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUubWF0Y2goL2Z1bGxjcGdyaWQvKSkge1xuXHRcdFx0c3RhcnRGYXV4Q2xpY2tpbmcoKTtcblx0XHR9XG5cdFx0aGFuZGxlSW5hY3RpdmVVc2VyKCk7XG5cdH0pKCk7XG5cblx0ZnVuY3Rpb24gaGFuZGxlSW5hY3RpdmVVc2VyKCkge1xuXHRcdHZhciBpbmFjdGl2ZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0ZmF1eENsaWNrKGNXIC8gMiwgY0ggLyAyKTtcblx0XHR9LCAyMDAwKTtcblxuXHRcdGZ1bmN0aW9uIGNsZWFySW5hY3RpdmVUaW1lb3V0KCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KGluYWN0aXZlKTtcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdCdtb3VzZWRvd24nLFxuXHRcdFx0XHRjbGVhckluYWN0aXZlVGltZW91dFxuXHRcdFx0KTtcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdCd0b3VjaHN0YXJ0Jyxcblx0XHRcdFx0Y2xlYXJJbmFjdGl2ZVRpbWVvdXRcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgY2xlYXJJbmFjdGl2ZVRpbWVvdXQpO1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBjbGVhckluYWN0aXZlVGltZW91dCk7XG5cdH1cblxuXHRmdW5jdGlvbiBzdGFydEZhdXhDbGlja2luZygpIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdGZhdXhDbGljayhcblx0XHRcdFx0YW5pbWUucmFuZG9tKGNXICogMC4yLCBjVyAqIDAuOCksXG5cdFx0XHRcdGFuaW1lLnJhbmRvbShjSCAqIDAuMiwgY0ggKiAwLjgpXG5cdFx0XHQpO1xuXHRcdFx0c3RhcnRGYXV4Q2xpY2tpbmcoKTtcblx0XHR9LCBhbmltZS5yYW5kb20oMjAwLCA5MDApKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZhdXhDbGljayh4LCB5KSB7XG5cdFx0dmFyIGZhdXhDbGljayA9IG5ldyBFdmVudCgnbW91c2Vkb3duJyk7XG5cdFx0ZmF1eENsaWNrLmNsaWVudFggPSB4O1xuXHRcdGZhdXhDbGljay5jbGllbnRZID0geTtcblx0XHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGZhdXhDbGljayk7XG5cdH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRhcmtNb2RlKCkge1xuXHQvLyBTdGFydCBpbiBkYXJrIG1vZGVcblx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS10aGVtZScsICdkYXJrJyk7XG5cdGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0aGVtZScsICdkYXJrJyk7XG5cblx0Ly8gRGFyayBNb2RlXG5cdGNvbnN0IHRvZ2dsZVN3aXRjaCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG5cdFx0Jy50aGVtZS1zd2l0Y2ggaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJ1xuXHQpO1xuXG5cdGZ1bmN0aW9uIHN3aXRjaFRoZW1lKGUpIHtcblx0XHRpZiAoZS50YXJnZXQuY2hlY2tlZCkge1xuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZShcblx0XHRcdFx0J2RhdGEtdGhlbWUnLFxuXHRcdFx0XHQnZGFyaydcblx0XHRcdCk7XG5cdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndGhlbWUnLCAnZGFyaycpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2V0QXR0cmlidXRlKFxuXHRcdFx0XHQnZGF0YS10aGVtZScsXG5cdFx0XHRcdCdsaWdodCdcblx0XHRcdCk7XG5cdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndGhlbWUnLCAnbGlnaHQnKTtcblx0XHR9XG5cdH1cblxuXHR0b2dnbGVTd2l0Y2guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgc3dpdGNoVGhlbWUsIGZhbHNlKTtcblxuXHRjb25zdCBjdXJyZW50VGhlbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndGhlbWUnKVxuXHRcdD8gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3RoZW1lJylcblx0XHQ6IG51bGw7XG5cblx0aWYgKGN1cnJlbnRUaGVtZSkge1xuXHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoXG5cdFx0XHQnZGF0YS10aGVtZScsXG5cdFx0XHRjdXJyZW50VGhlbWVcblx0XHQpO1xuXG5cdFx0aWYgKGN1cnJlbnRUaGVtZSA9PT0gJ2RhcmsnKSB7XG5cdFx0XHR0b2dnbGVTd2l0Y2guY2hlY2tlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgKiBhcyBjb25mZXR0aSBmcm9tIFwiY2FudmFzLWNvbmZldHRpXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZvcm1TdWJtaXQoKSB7XG5cdHZhciBlbWFpbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJlbWFpbFwiXScpO1xuXG5cdC8vIFBsYXkgTG90dGllXG5cdGZ1bmN0aW9uIHBsYXlBbmltYXRpb24oKSB7XG5cdFx0Y29uc3QgcGxheWVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5yb2NrZXRcIik7XG5cdFx0cGxheWVyLnBsYXkoKTtcblx0fVxuXG5cdC8vIENvbmZldHRpXG5cdHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbmZldHRpXCIpO1xuXHRjYW52YXMuY29uZmV0dGkgPVxuXHRcdGNhbnZhcy5jb25mZXR0aSB8fCBjb25mZXR0aS5jcmVhdGUoY2FudmFzLCB7IHJlc2l6ZTogdHJ1ZSB9KTtcblxuXHRmdW5jdGlvbiBtYWtlSXRGbHkoKSB7XG5cdFx0dmFyIGVuZCA9IERhdGUubm93KCkgKyAxNSAqIDEwMDA7XG5cdFx0dmFyIGNvbG9ycyA9IFtcIiMwMEZGQzBcIiwgXCIjRjlGRjAwXCIsIFwiI0ZGMDAwMFwiLCBcIiNGRkZcIiwgXCIjRkYwMDAwXCJdO1xuXHRcdChmdW5jdGlvbiBmcmFtZSgpIHtcblx0XHRcdGNhbnZhcy5jb25mZXR0aSh7XG5cdFx0XHRcdHBhcnRpY2xlQ291bnQ6IDIsXG5cdFx0XHRcdGFuZ2xlOiA2MCxcblx0XHRcdFx0c3ByZWFkOiA1NSxcblx0XHRcdFx0b3JpZ2luOiB7IHg6IDAgfSxcblx0XHRcdFx0Y29sb3JzOiBjb2xvcnMsXG5cdFx0XHRcdHJlc2l6ZTogdHJ1ZSxcblx0XHRcdFx0dXNlV29ya2VyOiB0cnVlLFxuXHRcdFx0fSk7XG5cdFx0XHRjYW52YXMuY29uZmV0dGkoe1xuXHRcdFx0XHRwYXJ0aWNsZUNvdW50OiAyLFxuXHRcdFx0XHRhbmdsZTogMTIwLFxuXHRcdFx0XHRzcHJlYWQ6IDU1LFxuXHRcdFx0XHRvcmlnaW46IHsgeDogMSB9LFxuXHRcdFx0XHRjb2xvcnM6IGNvbG9ycyxcblx0XHRcdFx0cmVzaXplOiB0cnVlLFxuXHRcdFx0XHR1c2VXb3JrZXI6IHRydWUsXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKERhdGUubm93KCkgPCBlbmQpIHtcblx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZyYW1lKTtcblx0XHRcdH1cblx0XHR9KSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdmFsaWRhdGVFbWFpbChlbWFpbCkge1xuXHRcdGNvbnN0IHJlID0gL14oKFtePD4oKVtcXF1cXFxcLiw7Olxcc0BcXFwiXSsoXFwuW148PigpW1xcXVxcXFwuLDs6XFxzQFxcXCJdKykqKXwoXFxcIi4rXFxcIikpQCgoXFxbWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcXSl8KChbYS16QS1aXFwtMC05XStcXC4pK1thLXpBLVpdezIsfSkpJC87XG5cdFx0cmV0dXJuIHJlLnRlc3QoZW1haWwpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdmFsaWRhdGUoKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXN1bHRcIik7XG5cdFx0dmFyIGVtYWlsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImVtYWlsXCJdJykudmFsdWU7XG5cdFx0cmVzdWx0LmlubmVySFRNTCA9IFwiXCI7XG5cblx0XHRpZiAodmFsaWRhdGVFbWFpbChlbWFpbCkpIHtcblx0XHRcdHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXJ0eVwiKTtcblx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInN1Y2Nlc3NcIik7XG5cblx0XHRcdG1ha2VJdEZseSgpO1xuXG5cdFx0XHRyZXN1bHQuaW5uZXJIVE1MID1cblx0XHRcdFx0XCI8aDI+WWVhISEhIE5vdyB3ZSdyZSB0YWxraW4hPC9oMj48cD5XZSB3aWxsIHJldmlldyB5b3VyIG1lc3NhZ2UgYW5kIGJlIGluIHRvdWNoIHNvb24uPC9wPlwiO1xuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0LmlubmVySFRNTCA9XG5cdFx0XHRcdCc8cD5IbW0uLi5zb21ldGhpbmcgaXMgb2ZmLiBUcnkgY2hlY2tpbmcgXCInICtcblx0XHRcdFx0ZW1haWwgK1xuXHRcdFx0XHQnXCIgYW5kIHRyeSBhZ2Fpbi48L3A+Jztcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Y29uc3QgdGFkYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGFkYVwiKTtcblx0dGFkYS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdmFsaWRhdGUpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFydGljbGVzKCkge1xuXHQvLyBQYXJ0aWNsZSBKU1xuXHRmdW5jdGlvbiBzdGFydFBhcnRpY2xlcygpIHtcblx0XHRwYXJ0aWNsZXNKUygncGFydGljbGVzLWpzJywge1xuXHRcdFx0cGFydGljbGVzOiB7XG5cdFx0XHRcdG51bWJlcjoge1xuXHRcdFx0XHRcdHZhbHVlOiA4MCxcblx0XHRcdFx0XHRkZW5zaXR5OiB7XG5cdFx0XHRcdFx0XHRlbmFibGU6IHRydWUsXG5cdFx0XHRcdFx0XHR2YWx1ZV9hcmVhOiA4MDAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0Y29sb3I6IHsgdmFsdWU6ICcjZmZmZmZmJyB9LFxuXHRcdFx0XHRzaGFwZToge1xuXHRcdFx0XHRcdHR5cGU6ICdjaXJjbGUnLFxuXHRcdFx0XHRcdHN0cm9rZTogeyB3aWR0aDogMCwgY29sb3I6ICcjMDAwMDAwJyB9LFxuXHRcdFx0XHRcdHBvbHlnb246IHsgbmJfc2lkZXM6IDUgfSxcblx0XHRcdFx0XHRpbWFnZToge1xuXHRcdFx0XHRcdFx0c3JjOiAnaW1nL2dpdGh1Yi5zdmcnLFxuXHRcdFx0XHRcdFx0d2lkdGg6IDEwMCxcblx0XHRcdFx0XHRcdGhlaWdodDogMTAwLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9wYWNpdHk6IHtcblx0XHRcdFx0XHR2YWx1ZTogMC41LFxuXHRcdFx0XHRcdHJhbmRvbTogZmFsc2UsXG5cdFx0XHRcdFx0YW5pbToge1xuXHRcdFx0XHRcdFx0ZW5hYmxlOiBmYWxzZSxcblx0XHRcdFx0XHRcdHNwZWVkOiAxLFxuXHRcdFx0XHRcdFx0b3BhY2l0eV9taW46IDAuMSxcblx0XHRcdFx0XHRcdHN5bmM6IGZhbHNlLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNpemU6IHtcblx0XHRcdFx0XHR2YWx1ZTogMyxcblx0XHRcdFx0XHRyYW5kb206IHRydWUsXG5cdFx0XHRcdFx0YW5pbToge1xuXHRcdFx0XHRcdFx0ZW5hYmxlOiBmYWxzZSxcblx0XHRcdFx0XHRcdHNwZWVkOiA0MCxcblx0XHRcdFx0XHRcdHNpemVfbWluOiAwLjEsXG5cdFx0XHRcdFx0XHRzeW5jOiBmYWxzZSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRsaW5lX2xpbmtlZDoge1xuXHRcdFx0XHRcdGVuYWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRkaXN0YW5jZTogMTUwLFxuXHRcdFx0XHRcdGNvbG9yOiAnI2ZmZmZmZicsXG5cdFx0XHRcdFx0b3BhY2l0eTogMC40LFxuXHRcdFx0XHRcdHdpZHRoOiAxLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtb3ZlOiB7XG5cdFx0XHRcdFx0ZW5hYmxlOiB0cnVlLFxuXHRcdFx0XHRcdHNwZWVkOiA2LFxuXHRcdFx0XHRcdGRpcmVjdGlvbjogJ25vbmUnLFxuXHRcdFx0XHRcdHJhbmRvbTogZmFsc2UsXG5cdFx0XHRcdFx0c3RyYWlnaHQ6IGZhbHNlLFxuXHRcdFx0XHRcdG91dF9tb2RlOiAnb3V0Jyxcblx0XHRcdFx0XHRib3VuY2U6IGZhbHNlLFxuXHRcdFx0XHRcdGF0dHJhY3Q6IHtcblx0XHRcdFx0XHRcdGVuYWJsZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRyb3RhdGVYOiA2MDAsXG5cdFx0XHRcdFx0XHRyb3RhdGVZOiAxMjAwLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0aW50ZXJhY3Rpdml0eToge1xuXHRcdFx0XHRkZXRlY3Rfb246ICdjYW52YXMnLFxuXHRcdFx0XHRldmVudHM6IHtcblx0XHRcdFx0XHRvbmhvdmVyOiB7XG5cdFx0XHRcdFx0XHRlbmFibGU6IHRydWUsXG5cdFx0XHRcdFx0XHRtb2RlOiAncmVwdWxzZScsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbmNsaWNrOiB7IGVuYWJsZTogdHJ1ZSwgbW9kZTogJ3B1c2gnIH0sXG5cdFx0XHRcdFx0cmVzaXplOiB0cnVlLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtb2Rlczoge1xuXHRcdFx0XHRcdGdyYWI6IHtcblx0XHRcdFx0XHRcdGRpc3RhbmNlOiA0MDAsXG5cdFx0XHRcdFx0XHRsaW5lX2xpbmtlZDogeyBvcGFjaXR5OiAxIH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRidWJibGU6IHtcblx0XHRcdFx0XHRcdGRpc3RhbmNlOiA0MDAsXG5cdFx0XHRcdFx0XHRzaXplOiA0MCxcblx0XHRcdFx0XHRcdGR1cmF0aW9uOiAyLFxuXHRcdFx0XHRcdFx0b3BhY2l0eTogOCxcblx0XHRcdFx0XHRcdHNwZWVkOiAzLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cmVwdWxzZToge1xuXHRcdFx0XHRcdFx0ZGlzdGFuY2U6IDIwMCxcblx0XHRcdFx0XHRcdGR1cmF0aW9uOiAwLjQsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRwdXNoOiB7IHBhcnRpY2xlc19uYjogNCB9LFxuXHRcdFx0XHRcdHJlbW92ZTogeyBwYXJ0aWNsZXNfbmI6IDIgfSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRyZXRpbmFfZGV0ZWN0OiB0cnVlLFxuXHRcdH0pO1xuXHR9XG5cblx0c3RhcnRQYXJ0aWNsZXMoKTtcbn1cbiIsImltcG9ydCAnLi4vc2Nzcy9tYWluLnNjc3MnO1xuXG5pbXBvcnQgYW5pbWVCbG9ja3MgZnJvbSAnLi9jb21wb25lbnRzL2FuaW1lLWJsb2Nrcyc7XG5pbXBvcnQgY29sb3JTcGxhc2ggZnJvbSAnLi9jb21wb25lbnRzL2NvbG9yLXNwbGFzaCc7XG5pbXBvcnQgZGFya01vZGUgZnJvbSAnLi9jb21wb25lbnRzL2RhcmstbW9kZSc7XG5pbXBvcnQgZm9ybVN1Ym1pdCBmcm9tICcuL2NvbXBvbmVudHMvZm9ybS1zdWJtaXQnO1xuaW1wb3J0IHBhcnRpY2xlcyBmcm9tICcuL2NvbXBvbmVudHMvcGFydGljbGVzJztcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHtcblx0YW5pbWVCbG9ja3MoKTtcblx0Y29sb3JTcGxhc2goKTtcblx0ZGFya01vZGUoKTtcblx0Zm9ybVN1Ym1pdCgpO1xuXHRwYXJ0aWNsZXMoKTtcbn0pO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlXG5fX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvanMvaW5kZXguanNcIik7XG4vLyBUaGlzIGVudHJ5IG1vZHVsZSB1c2VkICdleHBvcnRzJyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG4iXSwic291cmNlUm9vdCI6IiJ9