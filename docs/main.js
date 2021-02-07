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
		const player = document.querySelector('.rocket');
		player.play();
	}

	// Confetti
	var canvas = document.getElementById('confetti');
	canvas.confetti =
		canvas.confetti || canvas_confetti__WEBPACK_IMPORTED_MODULE_0__.create(canvas, { resize: true });

	function makeItFly() {
		var end = Date.now() + 15 * 1000;
		var colors = [
			'#00FFC0',
			'#F9FF00',
			'#FF0000',
			'#FFF',
			'#FF0000',
		];
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
		const result = document.getElementById('result');
		var email = document.querySelector('input[type="email"]').value;
		result.innerHTML = '';

		if (validateEmail(email)) {
			var element = document.getElementById('party');
			element.classList.add('success');

			playAnimation();
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

	const tada = document.getElementById('tada');
	tada.addEventListener('click', validate);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy8uL25vZGVfbW9kdWxlcy9hbmltZWpzL2xpYi9hbmltZS5lcy5qcyIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy8uL25vZGVfbW9kdWxlcy9jYW52YXMtY29uZmV0dGkvZGlzdC9jb25mZXR0aS5tb2R1bGUubWpzIiwid2VicGFjazovL211aC1idWlsZC1wcm9jZXNzLy4vc3JjL3Njc3MvbWFpbi5zY3NzP2NiYjciLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3MvLi9zcmMvanMvY29tcG9uZW50cy9hbmltZS1ibG9ja3MuanMiLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3MvLi9zcmMvanMvY29tcG9uZW50cy9jb2xvci1zcGxhc2guanMiLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3MvLi9zcmMvanMvY29tcG9uZW50cy9kYXJrLW1vZGUuanMiLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3MvLi9zcmMvanMvY29tcG9uZW50cy9mb3JtLXN1Ym1pdC5qcyIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy8uL3NyYy9qcy9jb21wb25lbnRzL3BhcnRpY2xlcy5qcyIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy8uL3NyYy9qcy9pbmRleC5qcyIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vbXVoLWJ1aWxkLXByb2Nlc3Mvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9tdWgtYnVpbGQtcHJvY2Vzcy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL211aC1idWlsZC1wcm9jZXNzL3dlYnBhY2svc3RhcnR1cCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxxQkFBcUIseUJBQXlCLEVBQUU7QUFDaEQscUJBQXFCLG9FQUFvRSxFQUFFO0FBQzNGLHFCQUFxQixxREFBcUQsRUFBRTtBQUM1RSxxQkFBcUIsZ0NBQWdDLEVBQUU7QUFDdkQscUJBQXFCLHNDQUFzQyxFQUFFO0FBQzdELHFCQUFxQixnQ0FBZ0MsRUFBRTtBQUN2RCxxQkFBcUIsOEJBQThCLEVBQUU7QUFDckQscUJBQXFCLGdDQUFnQyxFQUFFO0FBQ3ZELHFCQUFxQixpQ0FBaUMsRUFBRTtBQUN4RCxxQkFBcUIsZ0NBQWdDLEVBQUU7QUFDdkQscUJBQXFCLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUU7QUFDNUUscUJBQXFCLHVCQUF1QixFQUFFO0FBQzlDLHFCQUFxQix1QkFBdUIsRUFBRTtBQUM5QyxxQkFBcUIsOENBQThDLEVBQUU7QUFDckUscUJBQXFCLHNJQUFzSSxFQUFFO0FBQzdKOztBQUVBOztBQUVBO0FBQ0E7QUFDQSx1REFBdUQsc0JBQXNCLEVBQUU7QUFDL0U7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLDZCQUE2QixVQUFVO0FBQ3ZDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGlCQUFpQixlQUFlO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLE9BQU87QUFDaEMsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUEsdUJBQXVCLGtFQUFrRTtBQUN6Rjs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBLHdCQUF3QjtBQUN4Qix3QkFBd0I7QUFDeEIsd0JBQXdCOztBQUV4QixxQ0FBcUM7QUFDckMsbUNBQW1DOztBQUVuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGVBQWUsRUFBRSxPQUFPLGVBQWU7QUFDbEUsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBLGlDQUFpQyxnQkFBZ0I7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSwwREFBMEQsUUFBUTtBQUNsRTs7QUFFQTtBQUNBLHFCQUFxQixzQkFBc0I7QUFDM0M7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxZQUFZLG1FQUFtRTtBQUMvRTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EsT0FBTztBQUNQO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQSx1Q0FBdUMsVUFBVTtBQUNqRCwrQkFBK0IsVUFBVTtBQUN6QztBQUNBOztBQUVBOztBQUVBOztBQUVBLENBQUM7O0FBRUQ7O0FBRUE7O0FBRUEsZUFBZSxzQkFBc0Isc0JBQXNCLFVBQVUsR0FBRyxFQUFFOztBQUUxRTtBQUNBLHVCQUF1QixzQkFBc0Isc0NBQXNDLEdBQUcsRUFBRTtBQUN4Rix1QkFBdUIsc0JBQXNCLGlDQUFpQyxHQUFHLEVBQUU7QUFDbkYsdUJBQXVCLHNCQUFzQiw0QkFBNEIsR0FBRyxFQUFFO0FBQzlFLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQSxNQUFNLEVBQUU7QUFDUjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLHlDQUF5QyxzQkFBc0IsMkJBQTJCLEdBQUc7QUFDN0YsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQSwrQ0FBK0Msc0JBQXNCLGdDQUFnQyxHQUFHO0FBQ3hHLGlEQUFpRCxzQkFBc0I7QUFDdkUsdUNBQXVDLEdBQUc7QUFDMUMsaURBQWlELHNCQUFzQjtBQUN2RSx3Q0FBd0MsR0FBRztBQUMzQyxHQUFHOztBQUVIOztBQUVBLENBQUM7O0FBRUQ7QUFDQSx1QkFBdUIsZUFBZTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsU0FBUztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxxQ0FBcUMsa0RBQWtELEVBQUU7QUFDekY7O0FBRUE7QUFDQSxrQkFBa0IsVUFBVTtBQUM1QixrQkFBa0IsMEJBQTBCO0FBQzVDLDZEQUE2RCx5QkFBeUI7QUFDdEY7QUFDQTs7QUFFQTtBQUNBLGdDQUFnQyxrQkFBa0IsRUFBRTtBQUNwRDs7QUFFQTs7QUFFQTtBQUNBO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQztBQUNBOztBQUVBO0FBQ0E7QUFDQSxxQkFBcUIsNkNBQTZDO0FBQ2xFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHFCQUFxQixzQ0FBc0M7QUFDM0Q7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseURBQXlELDhCQUE4QixFQUFFO0FBQ3pGLHlCQUF5QixFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUU7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixRQUFRO0FBQ3hCLGdCQUFnQixRQUFRO0FBQ3hCLGtCQUFrQiw0QkFBNEI7QUFDOUMsa0JBQWtCLFVBQVU7QUFDNUIsa0JBQWtCLG9DQUFvQztBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxvQkFBb0IsdUJBQXVCO0FBQzNDLG9CQUFvQix1QkFBdUI7QUFDM0Msb0JBQW9CLHVCQUF1QjtBQUMzQzs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYyxpQkFBaUI7QUFDL0I7O0FBRUE7QUFDQSw0RUFBNEUsYUFBYTtBQUN6RiwrRUFBK0UsY0FBYztBQUM3Rjs7QUFFQTs7QUFFQTtBQUNBLHFCQUFxQixZQUFZO0FBQ2pDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSwrREFBK0QsY0FBYztBQUM3RTtBQUNBLHdCQUF3QixlQUFlO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG1HQUFtRyxvQkFBb0I7QUFDdkgsMkRBQTJELG9CQUFvQjtBQUMvRSxzRUFBc0UsY0FBYztBQUNwRix5QkFBeUIsaUJBQWlCO0FBQzFDOztBQUVBO0FBQ0Esb0JBQW9CLFFBQVE7QUFDNUI7QUFDQTtBQUNBO0FBQ0EsUUFBUSw0QkFBNEIsNEJBQTRCO0FBQ2hFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGtCQUFrQixXQUFXO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQix3QkFBd0I7QUFDNUMsd0JBQXdCLFlBQVk7QUFDcEM7QUFDQTtBQUNBLGFBQWEsd0JBQXdCO0FBQ3JDO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsS0FBSyxxREFBcUQ7QUFDMUQsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsMEJBQTBCO0FBQzVDO0FBQ0EsZ0JBQWdCLHFEQUFxRDtBQUNyRTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLDBCQUEwQiw0QkFBNEI7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxPQUFPO0FBQzlDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0EsZ0NBQWdDO0FBQ2hDLHdEQUF3RDtBQUN4RCx5REFBeUQ7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLCtEQUErRCxtQ0FBbUMsRUFBRTtBQUNwRzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLHFEQUFxRCxnQ0FBZ0M7QUFDakcsR0FBRztBQUNIOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3Qyw2Q0FBNkM7QUFDckY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxnREFBZ0Q7QUFDNUYsS0FBSztBQUNMO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQStDO0FBQy9DO0FBQ0EsNEJBQTRCLDBDQUEwQztBQUN0RTtBQUNBLCtCQUErQix3RUFBd0U7QUFDdkc7QUFDQSxHQUFHLG9CQUFvQixrQ0FBa0MsRUFBRTtBQUMzRDs7O0FBR0E7QUFDQSw2RUFBNkUseUJBQXlCLEVBQUUsa0JBQWtCLGtCQUFrQixFQUFFO0FBQzlJLDBCQUEwQix3QkFBd0IsV0FBVyxFQUFFLFVBQVUsRUFBRTtBQUMzRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4Qix1QkFBdUI7QUFDckQsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBLGlCQUFpQiwwQkFBMEI7QUFDM0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsNERBQTREO0FBQzlFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyx3Q0FBd0MsRUFBRTtBQUNoRiwrQkFBK0Isa0JBQWtCO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQixvQkFBb0I7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixpQkFBaUI7QUFDekM7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTs7QUFFQTtBQUNBLDJCQUEyQix1QkFBdUIsRUFBRTtBQUNwRCxpQ0FBaUMsNkJBQTZCLEVBQUU7QUFDaEUsOEJBQThCLGlCQUFpQixFQUFFO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELGtDQUFrQyxFQUFFO0FBQzFGO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLEdBQUcsa0JBQWtCLG1CQUFtQixFQUFFO0FBQzFDOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxxQ0FBcUMsc0RBQXNEO0FBQzNGO0FBQ0EsdUZBQXVGLDBDQUEwQyxFQUFFO0FBQ25JLG9GQUFvRix1Q0FBdUMsRUFBRTtBQUM3SCwwR0FBMEcsMERBQTBELEVBQUU7QUFDdEs7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsMkNBQTJDLFFBQVE7O0FBRW5EO0FBQ0E7QUFDQTtBQUNBLEtBQUssT0FBTztBQUNaO0FBQ0E7QUFDQSw2QkFBNkIsMENBQTBDO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7O0FBR0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EscUVBQXFFLDJCQUEyQixFQUFFO0FBQ2xHO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QywyQ0FBMkMsRUFBRTtBQUNwRjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxnQkFBZ0IseUNBQXlDO0FBQ3pEOztBQUVBO0FBQ0E7QUFDQSxxQkFBcUIsb0JBQW9CLE9BQU8sOEJBQThCO0FBQzlFLEtBQUs7QUFDTCxvQ0FBb0MsT0FBTyxHQUFHLGdDQUFnQztBQUM5RTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsMkNBQTJDLDBCQUEwQixFQUFFLGNBQWM7QUFDN0c7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIscUJBQXFCO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQSx1QkFBdUIsbUJBQW1CO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGdEQUFnRCx3QkFBd0I7QUFDeEU7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwrQkFBK0I7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUIsdUJBQXVCO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLEtBQUssR0FBRyw4QkFBOEI7QUFDdEUsNEdBQTRHLHNCQUFzQjtBQUNsSTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHFCQUFxQixpQkFBaUI7QUFDdEM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSwyQkFBMkIsUUFBUTtBQUNuQyw2QkFBNkIsa0JBQWtCO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSwwQkFBMEIsaUJBQWlCOztBQUUzQzs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBLGlDQUFpQyxLQUFLO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsS0FBSztBQUNwQztBQUNBO0FBQ0E7QUFDQSw0REFBNEQsdUJBQXVCO0FBQ25GO0FBQ0EsK0NBQStDLGtCQUFrQjtBQUNqRTs7QUFFQTtBQUNBO0FBQ0Esc0NBQXNDLEtBQUs7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixlQUFlO0FBQ25DLHFCQUFxQix5QkFBeUI7QUFDOUMsbUJBQW1CLG1CQUFtQjtBQUN0QztBQUNBLHlCQUF5QixXQUFXO0FBQ3BDO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsb0JBQW9CO0FBQ2pELDZCQUE2QixvQkFBb0I7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIscUNBQXFDLDBDQUEwQyxFQUFFLEVBQUU7QUFDdEcsb0NBQW9DLHFDQUFxQyxzRUFBc0UsRUFBRSxFQUFFO0FBQ25KO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLG9DQUFvQztBQUMzRCwrQkFBK0Isd0JBQXdCO0FBQ3ZELG1CQUFtQixxQkFBcUIsT0FBTywwQkFBMEI7QUFDekU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixXQUFXO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQywwREFBMEQ7O0FBRTlGLGlFQUFlLEtBQUssRUFBQzs7Ozs7Ozs7Ozs7Ozs7OztBQzd4Q3JCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxXQUFXO0FBQ1g7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsWUFBWTtBQUNaLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDRCQUE0Qix1QkFBdUIsc0JBQXNCO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixvQkFBb0I7QUFDaEQ7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxnREFBZ0QsUUFBUSxnQkFBZ0I7QUFDeEUsU0FBUzs7QUFFVDtBQUNBOztBQUVBO0FBQ0EsNEJBQTRCLGNBQWM7O0FBRTFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esa0NBQWtDLGNBQWM7QUFDaEQsK0RBQStEO0FBQy9ELHNDQUFzQztBQUN0QyxvQ0FBb0M7QUFDcEMsNERBQTREO0FBQzVELHlDQUF5QztBQUN6QyxnQ0FBZ0MsOEJBQThCLEVBQUU7QUFDaEUsa0JBQWtCO0FBQ2xCLGdCQUFnQixFQUFFO0FBQ2xCLGNBQWMsMkJBQTJCO0FBQ3pDLGdDQUFnQztBQUNoQyxjQUFjLDRCQUE0QjtBQUMxQyxrREFBa0Q7QUFDbEQsb0RBQW9EO0FBQ3BELGNBQWMsNEJBQTRCO0FBQzFDLGtEQUFrRDtBQUNsRCxvREFBb0Q7QUFDcEQsaUVBQWlFO0FBQ2pFLGNBQWM7QUFDZCxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBOztBQUVBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtB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O0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOLFlBQVksa0JBQWtCO0FBQzlCLGNBQWMsa0JBQWtCO0FBQ2hDLEtBQUs7QUFDTCxJQUFJO0FBQ0o7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDcEcyQjs7QUFFeUI7QUFDQTtBQUNOO0FBQ0k7QUFDSDs7QUFFL0M7QUFDQSxDQUFDLGlFQUFXO0FBQ1osQ0FBQyxpRUFBVztBQUNaLENBQUMsOERBQVE7QUFDVCxDQUFDLGdFQUFVO0FBQ1gsQ0FBQyw4REFBUztBQUNWLENBQUM7Ozs7Ozs7VUNkRDtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0NyQkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx3Q0FBd0MseUNBQXlDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHNGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHNEQUFzRCxrQkFBa0I7V0FDeEU7V0FDQSwrQ0FBK0MsY0FBYztXQUM3RCxFOzs7O1VDTkE7VUFDQTtVQUNBO1VBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBhbmltZS5qcyB2My4yLjFcbiAqIChjKSAyMDIwIEp1bGlhbiBHYXJuaWVyXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIGFuaW1lanMuY29tXG4gKi9cblxuLy8gRGVmYXVsdHNcblxudmFyIGRlZmF1bHRJbnN0YW5jZVNldHRpbmdzID0ge1xuICB1cGRhdGU6IG51bGwsXG4gIGJlZ2luOiBudWxsLFxuICBsb29wQmVnaW46IG51bGwsXG4gIGNoYW5nZUJlZ2luOiBudWxsLFxuICBjaGFuZ2U6IG51bGwsXG4gIGNoYW5nZUNvbXBsZXRlOiBudWxsLFxuICBsb29wQ29tcGxldGU6IG51bGwsXG4gIGNvbXBsZXRlOiBudWxsLFxuICBsb29wOiAxLFxuICBkaXJlY3Rpb246ICdub3JtYWwnLFxuICBhdXRvcGxheTogdHJ1ZSxcbiAgdGltZWxpbmVPZmZzZXQ6IDBcbn07XG5cbnZhciBkZWZhdWx0VHdlZW5TZXR0aW5ncyA9IHtcbiAgZHVyYXRpb246IDEwMDAsXG4gIGRlbGF5OiAwLFxuICBlbmREZWxheTogMCxcbiAgZWFzaW5nOiAnZWFzZU91dEVsYXN0aWMoMSwgLjUpJyxcbiAgcm91bmQ6IDBcbn07XG5cbnZhciB2YWxpZFRyYW5zZm9ybXMgPSBbJ3RyYW5zbGF0ZVgnLCAndHJhbnNsYXRlWScsICd0cmFuc2xhdGVaJywgJ3JvdGF0ZScsICdyb3RhdGVYJywgJ3JvdGF0ZVknLCAncm90YXRlWicsICdzY2FsZScsICdzY2FsZVgnLCAnc2NhbGVZJywgJ3NjYWxlWicsICdza2V3JywgJ3NrZXdYJywgJ3NrZXdZJywgJ3BlcnNwZWN0aXZlJywgJ21hdHJpeCcsICdtYXRyaXgzZCddO1xuXG4vLyBDYWNoaW5nXG5cbnZhciBjYWNoZSA9IHtcbiAgQ1NTOiB7fSxcbiAgc3ByaW5nczoge31cbn07XG5cbi8vIFV0aWxzXG5cbmZ1bmN0aW9uIG1pbk1heCh2YWwsIG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWwsIG1pbiksIG1heCk7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ0NvbnRhaW5zKHN0ciwgdGV4dCkge1xuICByZXR1cm4gc3RyLmluZGV4T2YodGV4dCkgPiAtMTtcbn1cblxuZnVuY3Rpb24gYXBwbHlBcmd1bWVudHMoZnVuYywgYXJncykge1xuICByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTtcbn1cblxudmFyIGlzID0ge1xuICBhcnI6IGZ1bmN0aW9uIChhKSB7IHJldHVybiBBcnJheS5pc0FycmF5KGEpOyB9LFxuICBvYmo6IGZ1bmN0aW9uIChhKSB7IHJldHVybiBzdHJpbmdDb250YWlucyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSksICdPYmplY3QnKTsgfSxcbiAgcHRoOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gaXMub2JqKGEpICYmIGEuaGFzT3duUHJvcGVydHkoJ3RvdGFsTGVuZ3RoJyk7IH0sXG4gIHN2ZzogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGEgaW5zdGFuY2VvZiBTVkdFbGVtZW50OyB9LFxuICBpbnA6IGZ1bmN0aW9uIChhKSB7IHJldHVybiBhIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudDsgfSxcbiAgZG9tOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gYS5ub2RlVHlwZSB8fCBpcy5zdmcoYSk7IH0sXG4gIHN0cjogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIHR5cGVvZiBhID09PSAnc3RyaW5nJzsgfSxcbiAgZm5jOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gdHlwZW9mIGEgPT09ICdmdW5jdGlvbic7IH0sXG4gIHVuZDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIHR5cGVvZiBhID09PSAndW5kZWZpbmVkJzsgfSxcbiAgbmlsOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gaXMudW5kKGEpIHx8IGEgPT09IG51bGw7IH0sXG4gIGhleDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIC8oXiNbMC05QS1GXXs2fSQpfCheI1swLTlBLUZdezN9JCkvaS50ZXN0KGEpOyB9LFxuICByZ2I6IGZ1bmN0aW9uIChhKSB7IHJldHVybiAvXnJnYi8udGVzdChhKTsgfSxcbiAgaHNsOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gL15oc2wvLnRlc3QoYSk7IH0sXG4gIGNvbDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIChpcy5oZXgoYSkgfHwgaXMucmdiKGEpIHx8IGlzLmhzbChhKSk7IH0sXG4gIGtleTogZnVuY3Rpb24gKGEpIHsgcmV0dXJuICFkZWZhdWx0SW5zdGFuY2VTZXR0aW5ncy5oYXNPd25Qcm9wZXJ0eShhKSAmJiAhZGVmYXVsdFR3ZWVuU2V0dGluZ3MuaGFzT3duUHJvcGVydHkoYSkgJiYgYSAhPT0gJ3RhcmdldHMnICYmIGEgIT09ICdrZXlmcmFtZXMnOyB9LFxufTtcblxuLy8gRWFzaW5nc1xuXG5mdW5jdGlvbiBwYXJzZUVhc2luZ1BhcmFtZXRlcnMoc3RyaW5nKSB7XG4gIHZhciBtYXRjaCA9IC9cXCgoW14pXSspXFwpLy5leGVjKHN0cmluZyk7XG4gIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uIChwKSB7IHJldHVybiBwYXJzZUZsb2F0KHApOyB9KSA6IFtdO1xufVxuXG4vLyBTcHJpbmcgc29sdmVyIGluc3BpcmVkIGJ5IFdlYmtpdCBDb3B5cmlnaHQgwqkgMjAxNiBBcHBsZSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIGh0dHBzOi8vd2Via2l0Lm9yZy9kZW1vcy9zcHJpbmcvc3ByaW5nLmpzXG5cbmZ1bmN0aW9uIHNwcmluZyhzdHJpbmcsIGR1cmF0aW9uKSB7XG5cbiAgdmFyIHBhcmFtcyA9IHBhcnNlRWFzaW5nUGFyYW1ldGVycyhzdHJpbmcpO1xuICB2YXIgbWFzcyA9IG1pbk1heChpcy51bmQocGFyYW1zWzBdKSA/IDEgOiBwYXJhbXNbMF0sIC4xLCAxMDApO1xuICB2YXIgc3RpZmZuZXNzID0gbWluTWF4KGlzLnVuZChwYXJhbXNbMV0pID8gMTAwIDogcGFyYW1zWzFdLCAuMSwgMTAwKTtcbiAgdmFyIGRhbXBpbmcgPSBtaW5NYXgoaXMudW5kKHBhcmFtc1syXSkgPyAxMCA6IHBhcmFtc1syXSwgLjEsIDEwMCk7XG4gIHZhciB2ZWxvY2l0eSA9ICBtaW5NYXgoaXMudW5kKHBhcmFtc1szXSkgPyAwIDogcGFyYW1zWzNdLCAuMSwgMTAwKTtcbiAgdmFyIHcwID0gTWF0aC5zcXJ0KHN0aWZmbmVzcyAvIG1hc3MpO1xuICB2YXIgemV0YSA9IGRhbXBpbmcgLyAoMiAqIE1hdGguc3FydChzdGlmZm5lc3MgKiBtYXNzKSk7XG4gIHZhciB3ZCA9IHpldGEgPCAxID8gdzAgKiBNYXRoLnNxcnQoMSAtIHpldGEgKiB6ZXRhKSA6IDA7XG4gIHZhciBhID0gMTtcbiAgdmFyIGIgPSB6ZXRhIDwgMSA/ICh6ZXRhICogdzAgKyAtdmVsb2NpdHkpIC8gd2QgOiAtdmVsb2NpdHkgKyB3MDtcblxuICBmdW5jdGlvbiBzb2x2ZXIodCkge1xuICAgIHZhciBwcm9ncmVzcyA9IGR1cmF0aW9uID8gKGR1cmF0aW9uICogdCkgLyAxMDAwIDogdDtcbiAgICBpZiAoemV0YSA8IDEpIHtcbiAgICAgIHByb2dyZXNzID0gTWF0aC5leHAoLXByb2dyZXNzICogemV0YSAqIHcwKSAqIChhICogTWF0aC5jb3Mod2QgKiBwcm9ncmVzcykgKyBiICogTWF0aC5zaW4od2QgKiBwcm9ncmVzcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm9ncmVzcyA9IChhICsgYiAqIHByb2dyZXNzKSAqIE1hdGguZXhwKC1wcm9ncmVzcyAqIHcwKTtcbiAgICB9XG4gICAgaWYgKHQgPT09IDAgfHwgdCA9PT0gMSkgeyByZXR1cm4gdDsgfVxuICAgIHJldHVybiAxIC0gcHJvZ3Jlc3M7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREdXJhdGlvbigpIHtcbiAgICB2YXIgY2FjaGVkID0gY2FjaGUuc3ByaW5nc1tzdHJpbmddO1xuICAgIGlmIChjYWNoZWQpIHsgcmV0dXJuIGNhY2hlZDsgfVxuICAgIHZhciBmcmFtZSA9IDEvNjtcbiAgICB2YXIgZWxhcHNlZCA9IDA7XG4gICAgdmFyIHJlc3QgPSAwO1xuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgIGVsYXBzZWQgKz0gZnJhbWU7XG4gICAgICBpZiAoc29sdmVyKGVsYXBzZWQpID09PSAxKSB7XG4gICAgICAgIHJlc3QrKztcbiAgICAgICAgaWYgKHJlc3QgPj0gMTYpIHsgYnJlYWs7IH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3QgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgZHVyYXRpb24gPSBlbGFwc2VkICogZnJhbWUgKiAxMDAwO1xuICAgIGNhY2hlLnNwcmluZ3Nbc3RyaW5nXSA9IGR1cmF0aW9uO1xuICAgIHJldHVybiBkdXJhdGlvbjtcbiAgfVxuXG4gIHJldHVybiBkdXJhdGlvbiA/IHNvbHZlciA6IGdldER1cmF0aW9uO1xuXG59XG5cbi8vIEJhc2ljIHN0ZXBzIGVhc2luZyBpbXBsZW1lbnRhdGlvbiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9mci9kb2NzL1dlYi9DU1MvdHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb25cblxuZnVuY3Rpb24gc3RlcHMoc3RlcHMpIHtcbiAgaWYgKCBzdGVwcyA9PT0gdm9pZCAwICkgc3RlcHMgPSAxMDtcblxuICByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIE1hdGguY2VpbCgobWluTWF4KHQsIDAuMDAwMDAxLCAxKSkgKiBzdGVwcykgKiAoMSAvIHN0ZXBzKTsgfTtcbn1cblxuLy8gQmV6aWVyRWFzaW5nIGh0dHBzOi8vZ2l0aHViLmNvbS9ncmUvYmV6aWVyLWVhc2luZ1xuXG52YXIgYmV6aWVyID0gKGZ1bmN0aW9uICgpIHtcblxuICB2YXIga1NwbGluZVRhYmxlU2l6ZSA9IDExO1xuICB2YXIga1NhbXBsZVN0ZXBTaXplID0gMS4wIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxLjApO1xuXG4gIGZ1bmN0aW9uIEEoYUExLCBhQTIpIHsgcmV0dXJuIDEuMCAtIDMuMCAqIGFBMiArIDMuMCAqIGFBMSB9XG4gIGZ1bmN0aW9uIEIoYUExLCBhQTIpIHsgcmV0dXJuIDMuMCAqIGFBMiAtIDYuMCAqIGFBMSB9XG4gIGZ1bmN0aW9uIEMoYUExKSAgICAgIHsgcmV0dXJuIDMuMCAqIGFBMSB9XG5cbiAgZnVuY3Rpb24gY2FsY0JlemllcihhVCwgYUExLCBhQTIpIHsgcmV0dXJuICgoQShhQTEsIGFBMikgKiBhVCArIEIoYUExLCBhQTIpKSAqIGFUICsgQyhhQTEpKSAqIGFUIH1cbiAgZnVuY3Rpb24gZ2V0U2xvcGUoYVQsIGFBMSwgYUEyKSB7IHJldHVybiAzLjAgKiBBKGFBMSwgYUEyKSAqIGFUICogYVQgKyAyLjAgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpIH1cblxuICBmdW5jdGlvbiBiaW5hcnlTdWJkaXZpZGUoYVgsIGFBLCBhQiwgbVgxLCBtWDIpIHtcbiAgICB2YXIgY3VycmVudFgsIGN1cnJlbnRULCBpID0gMDtcbiAgICBkbyB7XG4gICAgICBjdXJyZW50VCA9IGFBICsgKGFCIC0gYUEpIC8gMi4wO1xuICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcbiAgICAgIGlmIChjdXJyZW50WCA+IDAuMCkgeyBhQiA9IGN1cnJlbnRUOyB9IGVsc2UgeyBhQSA9IGN1cnJlbnRUOyB9XG4gICAgfSB3aGlsZSAoTWF0aC5hYnMoY3VycmVudFgpID4gMC4wMDAwMDAxICYmICsraSA8IDEwKTtcbiAgICByZXR1cm4gY3VycmVudFQ7XG4gIH1cblxuICBmdW5jdGlvbiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgYUd1ZXNzVCwgbVgxLCBtWDIpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7ICsraSkge1xuICAgICAgdmFyIGN1cnJlbnRTbG9wZSA9IGdldFNsb3BlKGFHdWVzc1QsIG1YMSwgbVgyKTtcbiAgICAgIGlmIChjdXJyZW50U2xvcGUgPT09IDAuMCkgeyByZXR1cm4gYUd1ZXNzVDsgfVxuICAgICAgdmFyIGN1cnJlbnRYID0gY2FsY0JlemllcihhR3Vlc3NULCBtWDEsIG1YMikgLSBhWDtcbiAgICAgIGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XG4gICAgfVxuICAgIHJldHVybiBhR3Vlc3NUO1xuICB9XG5cbiAgZnVuY3Rpb24gYmV6aWVyKG1YMSwgbVkxLCBtWDIsIG1ZMikge1xuXG4gICAgaWYgKCEoMCA8PSBtWDEgJiYgbVgxIDw9IDEgJiYgMCA8PSBtWDIgJiYgbVgyIDw9IDEpKSB7IHJldHVybjsgfVxuICAgIHZhciBzYW1wbGVWYWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xuXG4gICAgaWYgKG1YMSAhPT0gbVkxIHx8IG1YMiAhPT0gbVkyKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtTcGxpbmVUYWJsZVNpemU7ICsraSkge1xuICAgICAgICBzYW1wbGVWYWx1ZXNbaV0gPSBjYWxjQmV6aWVyKGkgKiBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRURm9yWChhWCkge1xuXG4gICAgICB2YXIgaW50ZXJ2YWxTdGFydCA9IDA7XG4gICAgICB2YXIgY3VycmVudFNhbXBsZSA9IDE7XG4gICAgICB2YXIgbGFzdFNhbXBsZSA9IGtTcGxpbmVUYWJsZVNpemUgLSAxO1xuXG4gICAgICBmb3IgKDsgY3VycmVudFNhbXBsZSAhPT0gbGFzdFNhbXBsZSAmJiBzYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0gPD0gYVg7ICsrY3VycmVudFNhbXBsZSkge1xuICAgICAgICBpbnRlcnZhbFN0YXJ0ICs9IGtTYW1wbGVTdGVwU2l6ZTtcbiAgICAgIH1cblxuICAgICAgLS1jdXJyZW50U2FtcGxlO1xuXG4gICAgICB2YXIgZGlzdCA9IChhWCAtIHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAoc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUgKyAxXSAtIHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSk7XG4gICAgICB2YXIgZ3Vlc3NGb3JUID0gaW50ZXJ2YWxTdGFydCArIGRpc3QgKiBrU2FtcGxlU3RlcFNpemU7XG4gICAgICB2YXIgaW5pdGlhbFNsb3BlID0gZ2V0U2xvcGUoZ3Vlc3NGb3JULCBtWDEsIG1YMik7XG5cbiAgICAgIGlmIChpbml0aWFsU2xvcGUgPj0gMC4wMDEpIHtcbiAgICAgICAgcmV0dXJuIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBndWVzc0ZvclQsIG1YMSwgbVgyKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09PSAwLjApIHtcbiAgICAgICAgcmV0dXJuIGd1ZXNzRm9yVDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBiaW5hcnlTdWJkaXZpZGUoYVgsIGludGVydmFsU3RhcnQsIGludGVydmFsU3RhcnQgKyBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoeCkge1xuICAgICAgaWYgKG1YMSA9PT0gbVkxICYmIG1YMiA9PT0gbVkyKSB7IHJldHVybiB4OyB9XG4gICAgICBpZiAoeCA9PT0gMCB8fCB4ID09PSAxKSB7IHJldHVybiB4OyB9XG4gICAgICByZXR1cm4gY2FsY0JlemllcihnZXRURm9yWCh4KSwgbVkxLCBtWTIpO1xuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIGJlemllcjtcblxufSkoKTtcblxudmFyIHBlbm5lciA9IChmdW5jdGlvbiAoKSB7XG5cbiAgLy8gQmFzZWQgb24galF1ZXJ5IFVJJ3MgaW1wbGVtZW5hdGlvbiBvZiBlYXNpbmcgZXF1YXRpb25zIGZyb20gUm9iZXJ0IFBlbm5lciAoaHR0cDovL3d3dy5yb2JlcnRwZW5uZXIuY29tL2Vhc2luZylcblxuICB2YXIgZWFzZXMgPSB7IGxpbmVhcjogZnVuY3Rpb24gKCkgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQ7IH07IH0gfTtcblxuICB2YXIgZnVuY3Rpb25FYXNpbmdzID0ge1xuICAgIFNpbmU6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiAxIC0gTWF0aC5jb3ModCAqIE1hdGguUEkgLyAyKTsgfTsgfSxcbiAgICBDaXJjOiBmdW5jdGlvbiAoKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gMSAtIE1hdGguc3FydCgxIC0gdCAqIHQpOyB9OyB9LFxuICAgIEJhY2s6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiB0ICogdCAqICgzICogdCAtIDIpOyB9OyB9LFxuICAgIEJvdW5jZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHtcbiAgICAgIHZhciBwb3cyLCBiID0gNDtcbiAgICAgIHdoaWxlICh0IDwgKCggcG93MiA9IE1hdGgucG93KDIsIC0tYikpIC0gMSkgLyAxMSkge31cbiAgICAgIHJldHVybiAxIC8gTWF0aC5wb3coNCwgMyAtIGIpIC0gNy41NjI1ICogTWF0aC5wb3coKCBwb3cyICogMyAtIDIgKSAvIDIyIC0gdCwgMilcbiAgICB9OyB9LFxuICAgIEVsYXN0aWM6IGZ1bmN0aW9uIChhbXBsaXR1ZGUsIHBlcmlvZCkge1xuICAgICAgaWYgKCBhbXBsaXR1ZGUgPT09IHZvaWQgMCApIGFtcGxpdHVkZSA9IDE7XG4gICAgICBpZiAoIHBlcmlvZCA9PT0gdm9pZCAwICkgcGVyaW9kID0gLjU7XG5cbiAgICAgIHZhciBhID0gbWluTWF4KGFtcGxpdHVkZSwgMSwgMTApO1xuICAgICAgdmFyIHAgPSBtaW5NYXgocGVyaW9kLCAuMSwgMik7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgcmV0dXJuICh0ID09PSAwIHx8IHQgPT09IDEpID8gdCA6IFxuICAgICAgICAgIC1hICogTWF0aC5wb3coMiwgMTAgKiAodCAtIDEpKSAqIE1hdGguc2luKCgoKHQgLSAxKSAtIChwIC8gKE1hdGguUEkgKiAyKSAqIE1hdGguYXNpbigxIC8gYSkpKSAqIChNYXRoLlBJICogMikpIC8gcCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHZhciBiYXNlRWFzaW5ncyA9IFsnUXVhZCcsICdDdWJpYycsICdRdWFydCcsICdRdWludCcsICdFeHBvJ107XG5cbiAgYmFzZUVhc2luZ3MuZm9yRWFjaChmdW5jdGlvbiAobmFtZSwgaSkge1xuICAgIGZ1bmN0aW9uRWFzaW5nc1tuYW1lXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiBNYXRoLnBvdyh0LCBpICsgMik7IH07IH07XG4gIH0pO1xuXG4gIE9iamVjdC5rZXlzKGZ1bmN0aW9uRWFzaW5ncykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBlYXNlSW4gPSBmdW5jdGlvbkVhc2luZ3NbbmFtZV07XG4gICAgZWFzZXNbJ2Vhc2VJbicgKyBuYW1lXSA9IGVhc2VJbjtcbiAgICBlYXNlc1snZWFzZU91dCcgKyBuYW1lXSA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gMSAtIGVhc2VJbihhLCBiKSgxIC0gdCk7IH07IH07XG4gICAgZWFzZXNbJ2Vhc2VJbk91dCcgKyBuYW1lXSA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gdCA8IDAuNSA/IGVhc2VJbihhLCBiKSh0ICogMikgLyAyIDogXG4gICAgICAxIC0gZWFzZUluKGEsIGIpKHQgKiAtMiArIDIpIC8gMjsgfTsgfTtcbiAgICBlYXNlc1snZWFzZU91dEluJyArIG5hbWVdID0gZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiB0IDwgMC41ID8gKDEgLSBlYXNlSW4oYSwgYikoMSAtIHQgKiAyKSkgLyAyIDogXG4gICAgICAoZWFzZUluKGEsIGIpKHQgKiAyIC0gMSkgKyAxKSAvIDI7IH07IH07XG4gIH0pO1xuXG4gIHJldHVybiBlYXNlcztcblxufSkoKTtcblxuZnVuY3Rpb24gcGFyc2VFYXNpbmdzKGVhc2luZywgZHVyYXRpb24pIHtcbiAgaWYgKGlzLmZuYyhlYXNpbmcpKSB7IHJldHVybiBlYXNpbmc7IH1cbiAgdmFyIG5hbWUgPSBlYXNpbmcuc3BsaXQoJygnKVswXTtcbiAgdmFyIGVhc2UgPSBwZW5uZXJbbmFtZV07XG4gIHZhciBhcmdzID0gcGFyc2VFYXNpbmdQYXJhbWV0ZXJzKGVhc2luZyk7XG4gIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgJ3NwcmluZycgOiByZXR1cm4gc3ByaW5nKGVhc2luZywgZHVyYXRpb24pO1xuICAgIGNhc2UgJ2N1YmljQmV6aWVyJyA6IHJldHVybiBhcHBseUFyZ3VtZW50cyhiZXppZXIsIGFyZ3MpO1xuICAgIGNhc2UgJ3N0ZXBzJyA6IHJldHVybiBhcHBseUFyZ3VtZW50cyhzdGVwcywgYXJncyk7XG4gICAgZGVmYXVsdCA6IHJldHVybiBhcHBseUFyZ3VtZW50cyhlYXNlLCBhcmdzKTtcbiAgfVxufVxuXG4vLyBTdHJpbmdzXG5cbmZ1bmN0aW9uIHNlbGVjdFN0cmluZyhzdHIpIHtcbiAgdHJ5IHtcbiAgICB2YXIgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHN0cik7XG4gICAgcmV0dXJuIG5vZGVzO1xuICB9IGNhdGNoKGUpIHtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGZpbHRlckFycmF5KGFyciwgY2FsbGJhY2spIHtcbiAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gIHZhciB0aGlzQXJnID0gYXJndW1lbnRzLmxlbmd0aCA+PSAyID8gYXJndW1lbnRzWzFdIDogdm9pZCAwO1xuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoaSBpbiBhcnIpIHtcbiAgICAgIHZhciB2YWwgPSBhcnJbaV07XG4gICAgICBpZiAoY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWwsIGksIGFycikpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godmFsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbkFycmF5KGFycikge1xuICByZXR1cm4gYXJyLnJlZHVjZShmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5jb25jYXQoaXMuYXJyKGIpID8gZmxhdHRlbkFycmF5KGIpIDogYik7IH0sIFtdKTtcbn1cblxuZnVuY3Rpb24gdG9BcnJheShvKSB7XG4gIGlmIChpcy5hcnIobykpIHsgcmV0dXJuIG87IH1cbiAgaWYgKGlzLnN0cihvKSkgeyBvID0gc2VsZWN0U3RyaW5nKG8pIHx8IG87IH1cbiAgaWYgKG8gaW5zdGFuY2VvZiBOb2RlTGlzdCB8fCBvIGluc3RhbmNlb2YgSFRNTENvbGxlY3Rpb24pIHsgcmV0dXJuIFtdLnNsaWNlLmNhbGwobyk7IH1cbiAgcmV0dXJuIFtvXTtcbn1cblxuZnVuY3Rpb24gYXJyYXlDb250YWlucyhhcnIsIHZhbCkge1xuICByZXR1cm4gYXJyLnNvbWUoZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGEgPT09IHZhbDsgfSk7XG59XG5cbi8vIE9iamVjdHNcblxuZnVuY3Rpb24gY2xvbmVPYmplY3Qobykge1xuICB2YXIgY2xvbmUgPSB7fTtcbiAgZm9yICh2YXIgcCBpbiBvKSB7IGNsb25lW3BdID0gb1twXTsgfVxuICByZXR1cm4gY2xvbmU7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VPYmplY3RQcm9wcyhvMSwgbzIpIHtcbiAgdmFyIG8gPSBjbG9uZU9iamVjdChvMSk7XG4gIGZvciAodmFyIHAgaW4gbzEpIHsgb1twXSA9IG8yLmhhc093blByb3BlcnR5KHApID8gbzJbcF0gOiBvMVtwXTsgfVxuICByZXR1cm4gbztcbn1cblxuZnVuY3Rpb24gbWVyZ2VPYmplY3RzKG8xLCBvMikge1xuICB2YXIgbyA9IGNsb25lT2JqZWN0KG8xKTtcbiAgZm9yICh2YXIgcCBpbiBvMikgeyBvW3BdID0gaXMudW5kKG8xW3BdKSA/IG8yW3BdIDogbzFbcF07IH1cbiAgcmV0dXJuIG87XG59XG5cbi8vIENvbG9yc1xuXG5mdW5jdGlvbiByZ2JUb1JnYmEocmdiVmFsdWUpIHtcbiAgdmFyIHJnYiA9IC9yZ2JcXCgoXFxkKyxcXHMqW1xcZF0rLFxccypbXFxkXSspXFwpL2cuZXhlYyhyZ2JWYWx1ZSk7XG4gIHJldHVybiByZ2IgPyAoXCJyZ2JhKFwiICsgKHJnYlsxXSkgKyBcIiwxKVwiKSA6IHJnYlZhbHVlO1xufVxuXG5mdW5jdGlvbiBoZXhUb1JnYmEoaGV4VmFsdWUpIHtcbiAgdmFyIHJneCA9IC9eIz8oW2EtZlxcZF0pKFthLWZcXGRdKShbYS1mXFxkXSkkL2k7XG4gIHZhciBoZXggPSBoZXhWYWx1ZS5yZXBsYWNlKHJneCwgZnVuY3Rpb24gKG0sIHIsIGcsIGIpIHsgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYjsgfSApO1xuICB2YXIgcmdiID0gL14jPyhbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KSQvaS5leGVjKGhleCk7XG4gIHZhciByID0gcGFyc2VJbnQocmdiWzFdLCAxNik7XG4gIHZhciBnID0gcGFyc2VJbnQocmdiWzJdLCAxNik7XG4gIHZhciBiID0gcGFyc2VJbnQocmdiWzNdLCAxNik7XG4gIHJldHVybiAoXCJyZ2JhKFwiICsgciArIFwiLFwiICsgZyArIFwiLFwiICsgYiArIFwiLDEpXCIpO1xufVxuXG5mdW5jdGlvbiBoc2xUb1JnYmEoaHNsVmFsdWUpIHtcbiAgdmFyIGhzbCA9IC9oc2xcXCgoXFxkKyksXFxzKihbXFxkLl0rKSUsXFxzKihbXFxkLl0rKSVcXCkvZy5leGVjKGhzbFZhbHVlKSB8fCAvaHNsYVxcKChcXGQrKSxcXHMqKFtcXGQuXSspJSxcXHMqKFtcXGQuXSspJSxcXHMqKFtcXGQuXSspXFwpL2cuZXhlYyhoc2xWYWx1ZSk7XG4gIHZhciBoID0gcGFyc2VJbnQoaHNsWzFdLCAxMCkgLyAzNjA7XG4gIHZhciBzID0gcGFyc2VJbnQoaHNsWzJdLCAxMCkgLyAxMDA7XG4gIHZhciBsID0gcGFyc2VJbnQoaHNsWzNdLCAxMCkgLyAxMDA7XG4gIHZhciBhID0gaHNsWzRdIHx8IDE7XG4gIGZ1bmN0aW9uIGh1ZTJyZ2IocCwgcSwgdCkge1xuICAgIGlmICh0IDwgMCkgeyB0ICs9IDE7IH1cbiAgICBpZiAodCA+IDEpIHsgdCAtPSAxOyB9XG4gICAgaWYgKHQgPCAxLzYpIHsgcmV0dXJuIHAgKyAocSAtIHApICogNiAqIHQ7IH1cbiAgICBpZiAodCA8IDEvMikgeyByZXR1cm4gcTsgfVxuICAgIGlmICh0IDwgMi8zKSB7IHJldHVybiBwICsgKHEgLSBwKSAqICgyLzMgLSB0KSAqIDY7IH1cbiAgICByZXR1cm4gcDtcbiAgfVxuICB2YXIgciwgZywgYjtcbiAgaWYgKHMgPT0gMCkge1xuICAgIHIgPSBnID0gYiA9IGw7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHEgPSBsIDwgMC41ID8gbCAqICgxICsgcykgOiBsICsgcyAtIGwgKiBzO1xuICAgIHZhciBwID0gMiAqIGwgLSBxO1xuICAgIHIgPSBodWUycmdiKHAsIHEsIGggKyAxLzMpO1xuICAgIGcgPSBodWUycmdiKHAsIHEsIGgpO1xuICAgIGIgPSBodWUycmdiKHAsIHEsIGggLSAxLzMpO1xuICB9XG4gIHJldHVybiAoXCJyZ2JhKFwiICsgKHIgKiAyNTUpICsgXCIsXCIgKyAoZyAqIDI1NSkgKyBcIixcIiArIChiICogMjU1KSArIFwiLFwiICsgYSArIFwiKVwiKTtcbn1cblxuZnVuY3Rpb24gY29sb3JUb1JnYih2YWwpIHtcbiAgaWYgKGlzLnJnYih2YWwpKSB7IHJldHVybiByZ2JUb1JnYmEodmFsKTsgfVxuICBpZiAoaXMuaGV4KHZhbCkpIHsgcmV0dXJuIGhleFRvUmdiYSh2YWwpOyB9XG4gIGlmIChpcy5oc2wodmFsKSkgeyByZXR1cm4gaHNsVG9SZ2JhKHZhbCk7IH1cbn1cblxuLy8gVW5pdHNcblxuZnVuY3Rpb24gZ2V0VW5pdCh2YWwpIHtcbiAgdmFyIHNwbGl0ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KCV8cHh8cHR8ZW18cmVtfGlufGNtfG1tfGV4fGNofHBjfHZ3fHZofHZtaW58dm1heHxkZWd8cmFkfHR1cm4pPyQvLmV4ZWModmFsKTtcbiAgaWYgKHNwbGl0KSB7IHJldHVybiBzcGxpdFsxXTsgfVxufVxuXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1Vbml0KHByb3BOYW1lKSB7XG4gIGlmIChzdHJpbmdDb250YWlucyhwcm9wTmFtZSwgJ3RyYW5zbGF0ZScpIHx8IHByb3BOYW1lID09PSAncGVyc3BlY3RpdmUnKSB7IHJldHVybiAncHgnOyB9XG4gIGlmIChzdHJpbmdDb250YWlucyhwcm9wTmFtZSwgJ3JvdGF0ZScpIHx8IHN0cmluZ0NvbnRhaW5zKHByb3BOYW1lLCAnc2tldycpKSB7IHJldHVybiAnZGVnJzsgfVxufVxuXG4vLyBWYWx1ZXNcblxuZnVuY3Rpb24gZ2V0RnVuY3Rpb25WYWx1ZSh2YWwsIGFuaW1hdGFibGUpIHtcbiAgaWYgKCFpcy5mbmModmFsKSkgeyByZXR1cm4gdmFsOyB9XG4gIHJldHVybiB2YWwoYW5pbWF0YWJsZS50YXJnZXQsIGFuaW1hdGFibGUuaWQsIGFuaW1hdGFibGUudG90YWwpO1xufVxuXG5mdW5jdGlvbiBnZXRBdHRyaWJ1dGUoZWwsIHByb3ApIHtcbiAgcmV0dXJuIGVsLmdldEF0dHJpYnV0ZShwcm9wKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFB4VG9Vbml0KGVsLCB2YWx1ZSwgdW5pdCkge1xuICB2YXIgdmFsdWVVbml0ID0gZ2V0VW5pdCh2YWx1ZSk7XG4gIGlmIChhcnJheUNvbnRhaW5zKFt1bml0LCAnZGVnJywgJ3JhZCcsICd0dXJuJ10sIHZhbHVlVW5pdCkpIHsgcmV0dXJuIHZhbHVlOyB9XG4gIHZhciBjYWNoZWQgPSBjYWNoZS5DU1NbdmFsdWUgKyB1bml0XTtcbiAgaWYgKCFpcy51bmQoY2FjaGVkKSkgeyByZXR1cm4gY2FjaGVkOyB9XG4gIHZhciBiYXNlbGluZSA9IDEwMDtcbiAgdmFyIHRlbXBFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWwudGFnTmFtZSk7XG4gIHZhciBwYXJlbnRFbCA9IChlbC5wYXJlbnROb2RlICYmIChlbC5wYXJlbnROb2RlICE9PSBkb2N1bWVudCkpID8gZWwucGFyZW50Tm9kZSA6IGRvY3VtZW50LmJvZHk7XG4gIHBhcmVudEVsLmFwcGVuZENoaWxkKHRlbXBFbCk7XG4gIHRlbXBFbC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHRlbXBFbC5zdHlsZS53aWR0aCA9IGJhc2VsaW5lICsgdW5pdDtcbiAgdmFyIGZhY3RvciA9IGJhc2VsaW5lIC8gdGVtcEVsLm9mZnNldFdpZHRoO1xuICBwYXJlbnRFbC5yZW1vdmVDaGlsZCh0ZW1wRWwpO1xuICB2YXIgY29udmVydGVkVW5pdCA9IGZhY3RvciAqIHBhcnNlRmxvYXQodmFsdWUpO1xuICBjYWNoZS5DU1NbdmFsdWUgKyB1bml0XSA9IGNvbnZlcnRlZFVuaXQ7XG4gIHJldHVybiBjb252ZXJ0ZWRVbml0O1xufVxuXG5mdW5jdGlvbiBnZXRDU1NWYWx1ZShlbCwgcHJvcCwgdW5pdCkge1xuICBpZiAocHJvcCBpbiBlbC5zdHlsZSkge1xuICAgIHZhciB1cHBlcmNhc2VQcm9wTmFtZSA9IHByb3AucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgdmFsdWUgPSBlbC5zdHlsZVtwcm9wXSB8fCBnZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKHVwcGVyY2FzZVByb3BOYW1lKSB8fCAnMCc7XG4gICAgcmV0dXJuIHVuaXQgPyBjb252ZXJ0UHhUb1VuaXQoZWwsIHZhbHVlLCB1bml0KSA6IHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEFuaW1hdGlvblR5cGUoZWwsIHByb3ApIHtcbiAgaWYgKGlzLmRvbShlbCkgJiYgIWlzLmlucChlbCkgJiYgKCFpcy5uaWwoZ2V0QXR0cmlidXRlKGVsLCBwcm9wKSkgfHwgKGlzLnN2ZyhlbCkgJiYgZWxbcHJvcF0pKSkgeyByZXR1cm4gJ2F0dHJpYnV0ZSc7IH1cbiAgaWYgKGlzLmRvbShlbCkgJiYgYXJyYXlDb250YWlucyh2YWxpZFRyYW5zZm9ybXMsIHByb3ApKSB7IHJldHVybiAndHJhbnNmb3JtJzsgfVxuICBpZiAoaXMuZG9tKGVsKSAmJiAocHJvcCAhPT0gJ3RyYW5zZm9ybScgJiYgZ2V0Q1NTVmFsdWUoZWwsIHByb3ApKSkgeyByZXR1cm4gJ2Nzcyc7IH1cbiAgaWYgKGVsW3Byb3BdICE9IG51bGwpIHsgcmV0dXJuICdvYmplY3QnOyB9XG59XG5cbmZ1bmN0aW9uIGdldEVsZW1lbnRUcmFuc2Zvcm1zKGVsKSB7XG4gIGlmICghaXMuZG9tKGVsKSkgeyByZXR1cm47IH1cbiAgdmFyIHN0ciA9IGVsLnN0eWxlLnRyYW5zZm9ybSB8fCAnJztcbiAgdmFyIHJlZyAgPSAvKFxcdyspXFwoKFteKV0qKVxcKS9nO1xuICB2YXIgdHJhbnNmb3JtcyA9IG5ldyBNYXAoKTtcbiAgdmFyIG07IHdoaWxlIChtID0gcmVnLmV4ZWMoc3RyKSkgeyB0cmFuc2Zvcm1zLnNldChtWzFdLCBtWzJdKTsgfVxuICByZXR1cm4gdHJhbnNmb3Jtcztcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtVmFsdWUoZWwsIHByb3BOYW1lLCBhbmltYXRhYmxlLCB1bml0KSB7XG4gIHZhciBkZWZhdWx0VmFsID0gc3RyaW5nQ29udGFpbnMocHJvcE5hbWUsICdzY2FsZScpID8gMSA6IDAgKyBnZXRUcmFuc2Zvcm1Vbml0KHByb3BOYW1lKTtcbiAgdmFyIHZhbHVlID0gZ2V0RWxlbWVudFRyYW5zZm9ybXMoZWwpLmdldChwcm9wTmFtZSkgfHwgZGVmYXVsdFZhbDtcbiAgaWYgKGFuaW1hdGFibGUpIHtcbiAgICBhbmltYXRhYmxlLnRyYW5zZm9ybXMubGlzdC5zZXQocHJvcE5hbWUsIHZhbHVlKTtcbiAgICBhbmltYXRhYmxlLnRyYW5zZm9ybXNbJ2xhc3QnXSA9IHByb3BOYW1lO1xuICB9XG4gIHJldHVybiB1bml0ID8gY29udmVydFB4VG9Vbml0KGVsLCB2YWx1ZSwgdW5pdCkgOiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZ2luYWxUYXJnZXRWYWx1ZSh0YXJnZXQsIHByb3BOYW1lLCB1bml0LCBhbmltYXRhYmxlKSB7XG4gIHN3aXRjaCAoZ2V0QW5pbWF0aW9uVHlwZSh0YXJnZXQsIHByb3BOYW1lKSkge1xuICAgIGNhc2UgJ3RyYW5zZm9ybSc6IHJldHVybiBnZXRUcmFuc2Zvcm1WYWx1ZSh0YXJnZXQsIHByb3BOYW1lLCBhbmltYXRhYmxlLCB1bml0KTtcbiAgICBjYXNlICdjc3MnOiByZXR1cm4gZ2V0Q1NTVmFsdWUodGFyZ2V0LCBwcm9wTmFtZSwgdW5pdCk7XG4gICAgY2FzZSAnYXR0cmlidXRlJzogcmV0dXJuIGdldEF0dHJpYnV0ZSh0YXJnZXQsIHByb3BOYW1lKTtcbiAgICBkZWZhdWx0OiByZXR1cm4gdGFyZ2V0W3Byb3BOYW1lXSB8fCAwO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlbGF0aXZlVmFsdWUodG8sIGZyb20pIHtcbiAgdmFyIG9wZXJhdG9yID0gL14oXFwqPXxcXCs9fC09KS8uZXhlYyh0byk7XG4gIGlmICghb3BlcmF0b3IpIHsgcmV0dXJuIHRvOyB9XG4gIHZhciB1ID0gZ2V0VW5pdCh0bykgfHwgMDtcbiAgdmFyIHggPSBwYXJzZUZsb2F0KGZyb20pO1xuICB2YXIgeSA9IHBhcnNlRmxvYXQodG8ucmVwbGFjZShvcGVyYXRvclswXSwgJycpKTtcbiAgc3dpdGNoIChvcGVyYXRvclswXVswXSkge1xuICAgIGNhc2UgJysnOiByZXR1cm4geCArIHkgKyB1O1xuICAgIGNhc2UgJy0nOiByZXR1cm4geCAtIHkgKyB1O1xuICAgIGNhc2UgJyonOiByZXR1cm4geCAqIHkgKyB1O1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlVmFsdWUodmFsLCB1bml0KSB7XG4gIGlmIChpcy5jb2wodmFsKSkgeyByZXR1cm4gY29sb3JUb1JnYih2YWwpOyB9XG4gIGlmICgvXFxzL2cudGVzdCh2YWwpKSB7IHJldHVybiB2YWw7IH1cbiAgdmFyIG9yaWdpbmFsVW5pdCA9IGdldFVuaXQodmFsKTtcbiAgdmFyIHVuaXRMZXNzID0gb3JpZ2luYWxVbml0ID8gdmFsLnN1YnN0cigwLCB2YWwubGVuZ3RoIC0gb3JpZ2luYWxVbml0Lmxlbmd0aCkgOiB2YWw7XG4gIGlmICh1bml0KSB7IHJldHVybiB1bml0TGVzcyArIHVuaXQ7IH1cbiAgcmV0dXJuIHVuaXRMZXNzO1xufVxuXG4vLyBnZXRUb3RhbExlbmd0aCgpIGVxdWl2YWxlbnQgZm9yIGNpcmNsZSwgcmVjdCwgcG9seWxpbmUsIHBvbHlnb24gYW5kIGxpbmUgc2hhcGVzXG4vLyBhZGFwdGVkIGZyb20gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vU2ViTGFtYmxhLzNlMDU1MGM0OTZjMjM2NzA5NzQ0XG5cbmZ1bmN0aW9uIGdldERpc3RhbmNlKHAxLCBwMikge1xuICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHAyLnggLSBwMS54LCAyKSArIE1hdGgucG93KHAyLnkgLSBwMS55LCAyKSk7XG59XG5cbmZ1bmN0aW9uIGdldENpcmNsZUxlbmd0aChlbCkge1xuICByZXR1cm4gTWF0aC5QSSAqIDIgKiBnZXRBdHRyaWJ1dGUoZWwsICdyJyk7XG59XG5cbmZ1bmN0aW9uIGdldFJlY3RMZW5ndGgoZWwpIHtcbiAgcmV0dXJuIChnZXRBdHRyaWJ1dGUoZWwsICd3aWR0aCcpICogMikgKyAoZ2V0QXR0cmlidXRlKGVsLCAnaGVpZ2h0JykgKiAyKTtcbn1cblxuZnVuY3Rpb24gZ2V0TGluZUxlbmd0aChlbCkge1xuICByZXR1cm4gZ2V0RGlzdGFuY2UoXG4gICAge3g6IGdldEF0dHJpYnV0ZShlbCwgJ3gxJyksIHk6IGdldEF0dHJpYnV0ZShlbCwgJ3kxJyl9LCBcbiAgICB7eDogZ2V0QXR0cmlidXRlKGVsLCAneDInKSwgeTogZ2V0QXR0cmlidXRlKGVsLCAneTInKX1cbiAgKTtcbn1cblxuZnVuY3Rpb24gZ2V0UG9seWxpbmVMZW5ndGgoZWwpIHtcbiAgdmFyIHBvaW50cyA9IGVsLnBvaW50cztcbiAgdmFyIHRvdGFsTGVuZ3RoID0gMDtcbiAgdmFyIHByZXZpb3VzUG9zO1xuICBmb3IgKHZhciBpID0gMCA7IGkgPCBwb2ludHMubnVtYmVyT2ZJdGVtczsgaSsrKSB7XG4gICAgdmFyIGN1cnJlbnRQb3MgPSBwb2ludHMuZ2V0SXRlbShpKTtcbiAgICBpZiAoaSA+IDApIHsgdG90YWxMZW5ndGggKz0gZ2V0RGlzdGFuY2UocHJldmlvdXNQb3MsIGN1cnJlbnRQb3MpOyB9XG4gICAgcHJldmlvdXNQb3MgPSBjdXJyZW50UG9zO1xuICB9XG4gIHJldHVybiB0b3RhbExlbmd0aDtcbn1cblxuZnVuY3Rpb24gZ2V0UG9seWdvbkxlbmd0aChlbCkge1xuICB2YXIgcG9pbnRzID0gZWwucG9pbnRzO1xuICByZXR1cm4gZ2V0UG9seWxpbmVMZW5ndGgoZWwpICsgZ2V0RGlzdGFuY2UocG9pbnRzLmdldEl0ZW0ocG9pbnRzLm51bWJlck9mSXRlbXMgLSAxKSwgcG9pbnRzLmdldEl0ZW0oMCkpO1xufVxuXG4vLyBQYXRoIGFuaW1hdGlvblxuXG5mdW5jdGlvbiBnZXRUb3RhbExlbmd0aChlbCkge1xuICBpZiAoZWwuZ2V0VG90YWxMZW5ndGgpIHsgcmV0dXJuIGVsLmdldFRvdGFsTGVuZ3RoKCk7IH1cbiAgc3dpdGNoKGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2NpcmNsZSc6IHJldHVybiBnZXRDaXJjbGVMZW5ndGgoZWwpO1xuICAgIGNhc2UgJ3JlY3QnOiByZXR1cm4gZ2V0UmVjdExlbmd0aChlbCk7XG4gICAgY2FzZSAnbGluZSc6IHJldHVybiBnZXRMaW5lTGVuZ3RoKGVsKTtcbiAgICBjYXNlICdwb2x5bGluZSc6IHJldHVybiBnZXRQb2x5bGluZUxlbmd0aChlbCk7XG4gICAgY2FzZSAncG9seWdvbic6IHJldHVybiBnZXRQb2x5Z29uTGVuZ3RoKGVsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXREYXNob2Zmc2V0KGVsKSB7XG4gIHZhciBwYXRoTGVuZ3RoID0gZ2V0VG90YWxMZW5ndGgoZWwpO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZS1kYXNoYXJyYXknLCBwYXRoTGVuZ3RoKTtcbiAgcmV0dXJuIHBhdGhMZW5ndGg7XG59XG5cbi8vIE1vdGlvbiBwYXRoXG5cbmZ1bmN0aW9uIGdldFBhcmVudFN2Z0VsKGVsKSB7XG4gIHZhciBwYXJlbnRFbCA9IGVsLnBhcmVudE5vZGU7XG4gIHdoaWxlIChpcy5zdmcocGFyZW50RWwpKSB7XG4gICAgaWYgKCFpcy5zdmcocGFyZW50RWwucGFyZW50Tm9kZSkpIHsgYnJlYWs7IH1cbiAgICBwYXJlbnRFbCA9IHBhcmVudEVsLnBhcmVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIHBhcmVudEVsO1xufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnRTdmcocGF0aEVsLCBzdmdEYXRhKSB7XG4gIHZhciBzdmcgPSBzdmdEYXRhIHx8IHt9O1xuICB2YXIgcGFyZW50U3ZnRWwgPSBzdmcuZWwgfHwgZ2V0UGFyZW50U3ZnRWwocGF0aEVsKTtcbiAgdmFyIHJlY3QgPSBwYXJlbnRTdmdFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgdmFyIHZpZXdCb3hBdHRyID0gZ2V0QXR0cmlidXRlKHBhcmVudFN2Z0VsLCAndmlld0JveCcpO1xuICB2YXIgd2lkdGggPSByZWN0LndpZHRoO1xuICB2YXIgaGVpZ2h0ID0gcmVjdC5oZWlnaHQ7XG4gIHZhciB2aWV3Qm94ID0gc3ZnLnZpZXdCb3ggfHwgKHZpZXdCb3hBdHRyID8gdmlld0JveEF0dHIuc3BsaXQoJyAnKSA6IFswLCAwLCB3aWR0aCwgaGVpZ2h0XSk7XG4gIHJldHVybiB7XG4gICAgZWw6IHBhcmVudFN2Z0VsLFxuICAgIHZpZXdCb3g6IHZpZXdCb3gsXG4gICAgeDogdmlld0JveFswXSAvIDEsXG4gICAgeTogdmlld0JveFsxXSAvIDEsXG4gICAgdzogd2lkdGgsXG4gICAgaDogaGVpZ2h0LFxuICAgIHZXOiB2aWV3Qm94WzJdLFxuICAgIHZIOiB2aWV3Qm94WzNdXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGF0aChwYXRoLCBwZXJjZW50KSB7XG4gIHZhciBwYXRoRWwgPSBpcy5zdHIocGF0aCkgPyBzZWxlY3RTdHJpbmcocGF0aClbMF0gOiBwYXRoO1xuICB2YXIgcCA9IHBlcmNlbnQgfHwgMTAwO1xuICByZXR1cm4gZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvcGVydHk6IHByb3BlcnR5LFxuICAgICAgZWw6IHBhdGhFbCxcbiAgICAgIHN2ZzogZ2V0UGFyZW50U3ZnKHBhdGhFbCksXG4gICAgICB0b3RhbExlbmd0aDogZ2V0VG90YWxMZW5ndGgocGF0aEVsKSAqIChwIC8gMTAwKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXRoUHJvZ3Jlc3MocGF0aCwgcHJvZ3Jlc3MsIGlzUGF0aFRhcmdldEluc2lkZVNWRykge1xuICBmdW5jdGlvbiBwb2ludChvZmZzZXQpIHtcbiAgICBpZiAoIG9mZnNldCA9PT0gdm9pZCAwICkgb2Zmc2V0ID0gMDtcblxuICAgIHZhciBsID0gcHJvZ3Jlc3MgKyBvZmZzZXQgPj0gMSA/IHByb2dyZXNzICsgb2Zmc2V0IDogMDtcbiAgICByZXR1cm4gcGF0aC5lbC5nZXRQb2ludEF0TGVuZ3RoKGwpO1xuICB9XG4gIHZhciBzdmcgPSBnZXRQYXJlbnRTdmcocGF0aC5lbCwgcGF0aC5zdmcpO1xuICB2YXIgcCA9IHBvaW50KCk7XG4gIHZhciBwMCA9IHBvaW50KC0xKTtcbiAgdmFyIHAxID0gcG9pbnQoKzEpO1xuICB2YXIgc2NhbGVYID0gaXNQYXRoVGFyZ2V0SW5zaWRlU1ZHID8gMSA6IHN2Zy53IC8gc3ZnLnZXO1xuICB2YXIgc2NhbGVZID0gaXNQYXRoVGFyZ2V0SW5zaWRlU1ZHID8gMSA6IHN2Zy5oIC8gc3ZnLnZIO1xuICBzd2l0Y2ggKHBhdGgucHJvcGVydHkpIHtcbiAgICBjYXNlICd4JzogcmV0dXJuIChwLnggLSBzdmcueCkgKiBzY2FsZVg7XG4gICAgY2FzZSAneSc6IHJldHVybiAocC55IC0gc3ZnLnkpICogc2NhbGVZO1xuICAgIGNhc2UgJ2FuZ2xlJzogcmV0dXJuIE1hdGguYXRhbjIocDEueSAtIHAwLnksIHAxLnggLSBwMC54KSAqIDE4MCAvIE1hdGguUEk7XG4gIH1cbn1cblxuLy8gRGVjb21wb3NlIHZhbHVlXG5cbmZ1bmN0aW9uIGRlY29tcG9zZVZhbHVlKHZhbCwgdW5pdCkge1xuICAvLyBjb25zdCByZ3ggPSAvLT9cXGQqXFwuP1xcZCsvZzsgLy8gaGFuZGxlcyBiYXNpYyBudW1iZXJzXG4gIC8vIGNvbnN0IHJneCA9IC9bKy1dP1xcZCsoPzpcXC5cXGQrKT8oPzpbZUVdWystXT9cXGQrKT8vZzsgLy8gaGFuZGxlcyBleHBvbmVudHMgbm90YXRpb25cbiAgdmFyIHJneCA9IC9bKy1dP1xcZCpcXC4/XFxkKyg/OlxcLlxcZCspPyg/OltlRV1bKy1dP1xcZCspPy9nOyAvLyBoYW5kbGVzIGV4cG9uZW50cyBub3RhdGlvblxuICB2YXIgdmFsdWUgPSB2YWxpZGF0ZVZhbHVlKChpcy5wdGgodmFsKSA/IHZhbC50b3RhbExlbmd0aCA6IHZhbCksIHVuaXQpICsgJyc7XG4gIHJldHVybiB7XG4gICAgb3JpZ2luYWw6IHZhbHVlLFxuICAgIG51bWJlcnM6IHZhbHVlLm1hdGNoKHJneCkgPyB2YWx1ZS5tYXRjaChyZ3gpLm1hcChOdW1iZXIpIDogWzBdLFxuICAgIHN0cmluZ3M6IChpcy5zdHIodmFsKSB8fCB1bml0KSA/IHZhbHVlLnNwbGl0KHJneCkgOiBbXVxuICB9XG59XG5cbi8vIEFuaW1hdGFibGVzXG5cbmZ1bmN0aW9uIHBhcnNlVGFyZ2V0cyh0YXJnZXRzKSB7XG4gIHZhciB0YXJnZXRzQXJyYXkgPSB0YXJnZXRzID8gKGZsYXR0ZW5BcnJheShpcy5hcnIodGFyZ2V0cykgPyB0YXJnZXRzLm1hcCh0b0FycmF5KSA6IHRvQXJyYXkodGFyZ2V0cykpKSA6IFtdO1xuICByZXR1cm4gZmlsdGVyQXJyYXkodGFyZ2V0c0FycmF5LCBmdW5jdGlvbiAoaXRlbSwgcG9zLCBzZWxmKSB7IHJldHVybiBzZWxmLmluZGV4T2YoaXRlbSkgPT09IHBvczsgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEFuaW1hdGFibGVzKHRhcmdldHMpIHtcbiAgdmFyIHBhcnNlZCA9IHBhcnNlVGFyZ2V0cyh0YXJnZXRzKTtcbiAgcmV0dXJuIHBhcnNlZC5tYXAoZnVuY3Rpb24gKHQsIGkpIHtcbiAgICByZXR1cm4ge3RhcmdldDogdCwgaWQ6IGksIHRvdGFsOiBwYXJzZWQubGVuZ3RoLCB0cmFuc2Zvcm1zOiB7IGxpc3Q6IGdldEVsZW1lbnRUcmFuc2Zvcm1zKHQpIH0gfTtcbiAgfSk7XG59XG5cbi8vIFByb3BlcnRpZXNcblxuZnVuY3Rpb24gbm9ybWFsaXplUHJvcGVydHlUd2VlbnMocHJvcCwgdHdlZW5TZXR0aW5ncykge1xuICB2YXIgc2V0dGluZ3MgPSBjbG9uZU9iamVjdCh0d2VlblNldHRpbmdzKTtcbiAgLy8gT3ZlcnJpZGUgZHVyYXRpb24gaWYgZWFzaW5nIGlzIGEgc3ByaW5nXG4gIGlmICgvXnNwcmluZy8udGVzdChzZXR0aW5ncy5lYXNpbmcpKSB7IHNldHRpbmdzLmR1cmF0aW9uID0gc3ByaW5nKHNldHRpbmdzLmVhc2luZyk7IH1cbiAgaWYgKGlzLmFycihwcm9wKSkge1xuICAgIHZhciBsID0gcHJvcC5sZW5ndGg7XG4gICAgdmFyIGlzRnJvbVRvID0gKGwgPT09IDIgJiYgIWlzLm9iaihwcm9wWzBdKSk7XG4gICAgaWYgKCFpc0Zyb21Ubykge1xuICAgICAgLy8gRHVyYXRpb24gZGl2aWRlZCBieSB0aGUgbnVtYmVyIG9mIHR3ZWVuc1xuICAgICAgaWYgKCFpcy5mbmModHdlZW5TZXR0aW5ncy5kdXJhdGlvbikpIHsgc2V0dGluZ3MuZHVyYXRpb24gPSB0d2VlblNldHRpbmdzLmR1cmF0aW9uIC8gbDsgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUcmFuc2Zvcm0gW2Zyb20sIHRvXSB2YWx1ZXMgc2hvcnRoYW5kIHRvIGEgdmFsaWQgdHdlZW4gdmFsdWVcbiAgICAgIHByb3AgPSB7dmFsdWU6IHByb3B9O1xuICAgIH1cbiAgfVxuICB2YXIgcHJvcEFycmF5ID0gaXMuYXJyKHByb3ApID8gcHJvcCA6IFtwcm9wXTtcbiAgcmV0dXJuIHByb3BBcnJheS5tYXAoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICB2YXIgb2JqID0gKGlzLm9iaih2KSAmJiAhaXMucHRoKHYpKSA/IHYgOiB7dmFsdWU6IHZ9O1xuICAgIC8vIERlZmF1bHQgZGVsYXkgdmFsdWUgc2hvdWxkIG9ubHkgYmUgYXBwbGllZCB0byB0aGUgZmlyc3QgdHdlZW5cbiAgICBpZiAoaXMudW5kKG9iai5kZWxheSkpIHsgb2JqLmRlbGF5ID0gIWkgPyB0d2VlblNldHRpbmdzLmRlbGF5IDogMDsgfVxuICAgIC8vIERlZmF1bHQgZW5kRGVsYXkgdmFsdWUgc2hvdWxkIG9ubHkgYmUgYXBwbGllZCB0byB0aGUgbGFzdCB0d2VlblxuICAgIGlmIChpcy51bmQob2JqLmVuZERlbGF5KSkgeyBvYmouZW5kRGVsYXkgPSBpID09PSBwcm9wQXJyYXkubGVuZ3RoIC0gMSA/IHR3ZWVuU2V0dGluZ3MuZW5kRGVsYXkgOiAwOyB9XG4gICAgcmV0dXJuIG9iajtcbiAgfSkubWFwKGZ1bmN0aW9uIChrKSB7IHJldHVybiBtZXJnZU9iamVjdHMoaywgc2V0dGluZ3MpOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBmbGF0dGVuS2V5ZnJhbWVzKGtleWZyYW1lcykge1xuICB2YXIgcHJvcGVydHlOYW1lcyA9IGZpbHRlckFycmF5KGZsYXR0ZW5BcnJheShrZXlmcmFtZXMubWFwKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIE9iamVjdC5rZXlzKGtleSk7IH0pKSwgZnVuY3Rpb24gKHApIHsgcmV0dXJuIGlzLmtleShwKTsgfSlcbiAgLnJlZHVjZShmdW5jdGlvbiAoYSxiKSB7IGlmIChhLmluZGV4T2YoYikgPCAwKSB7IGEucHVzaChiKTsgfSByZXR1cm4gYTsgfSwgW10pO1xuICB2YXIgcHJvcGVydGllcyA9IHt9O1xuICB2YXIgbG9vcCA9IGZ1bmN0aW9uICggaSApIHtcbiAgICB2YXIgcHJvcE5hbWUgPSBwcm9wZXJ0eU5hbWVzW2ldO1xuICAgIHByb3BlcnRpZXNbcHJvcE5hbWVdID0ga2V5ZnJhbWVzLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICB2YXIgbmV3S2V5ID0ge307XG4gICAgICBmb3IgKHZhciBwIGluIGtleSkge1xuICAgICAgICBpZiAoaXMua2V5KHApKSB7XG4gICAgICAgICAgaWYgKHAgPT0gcHJvcE5hbWUpIHsgbmV3S2V5LnZhbHVlID0ga2V5W3BdOyB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3S2V5W3BdID0ga2V5W3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3S2V5O1xuICAgIH0pO1xuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcGVydHlOYW1lcy5sZW5ndGg7IGkrKykgbG9vcCggaSApO1xuICByZXR1cm4gcHJvcGVydGllcztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcGVydGllcyh0d2VlblNldHRpbmdzLCBwYXJhbXMpIHtcbiAgdmFyIHByb3BlcnRpZXMgPSBbXTtcbiAgdmFyIGtleWZyYW1lcyA9IHBhcmFtcy5rZXlmcmFtZXM7XG4gIGlmIChrZXlmcmFtZXMpIHsgcGFyYW1zID0gbWVyZ2VPYmplY3RzKGZsYXR0ZW5LZXlmcmFtZXMoa2V5ZnJhbWVzKSwgcGFyYW1zKTsgfVxuICBmb3IgKHZhciBwIGluIHBhcmFtcykge1xuICAgIGlmIChpcy5rZXkocCkpIHtcbiAgICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHAsXG4gICAgICAgIHR3ZWVuczogbm9ybWFsaXplUHJvcGVydHlUd2VlbnMocGFyYW1zW3BdLCB0d2VlblNldHRpbmdzKVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wZXJ0aWVzO1xufVxuXG4vLyBUd2VlbnNcblxuZnVuY3Rpb24gbm9ybWFsaXplVHdlZW5WYWx1ZXModHdlZW4sIGFuaW1hdGFibGUpIHtcbiAgdmFyIHQgPSB7fTtcbiAgZm9yICh2YXIgcCBpbiB0d2Vlbikge1xuICAgIHZhciB2YWx1ZSA9IGdldEZ1bmN0aW9uVmFsdWUodHdlZW5bcF0sIGFuaW1hdGFibGUpO1xuICAgIGlmIChpcy5hcnIodmFsdWUpKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gZ2V0RnVuY3Rpb25WYWx1ZSh2LCBhbmltYXRhYmxlKTsgfSk7XG4gICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAxKSB7IHZhbHVlID0gdmFsdWVbMF07IH1cbiAgICB9XG4gICAgdFtwXSA9IHZhbHVlO1xuICB9XG4gIHQuZHVyYXRpb24gPSBwYXJzZUZsb2F0KHQuZHVyYXRpb24pO1xuICB0LmRlbGF5ID0gcGFyc2VGbG9hdCh0LmRlbGF5KTtcbiAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVR3ZWVucyhwcm9wLCBhbmltYXRhYmxlKSB7XG4gIHZhciBwcmV2aW91c1R3ZWVuO1xuICByZXR1cm4gcHJvcC50d2VlbnMubWFwKGZ1bmN0aW9uICh0KSB7XG4gICAgdmFyIHR3ZWVuID0gbm9ybWFsaXplVHdlZW5WYWx1ZXModCwgYW5pbWF0YWJsZSk7XG4gICAgdmFyIHR3ZWVuVmFsdWUgPSB0d2Vlbi52YWx1ZTtcbiAgICB2YXIgdG8gPSBpcy5hcnIodHdlZW5WYWx1ZSkgPyB0d2VlblZhbHVlWzFdIDogdHdlZW5WYWx1ZTtcbiAgICB2YXIgdG9Vbml0ID0gZ2V0VW5pdCh0byk7XG4gICAgdmFyIG9yaWdpbmFsVmFsdWUgPSBnZXRPcmlnaW5hbFRhcmdldFZhbHVlKGFuaW1hdGFibGUudGFyZ2V0LCBwcm9wLm5hbWUsIHRvVW5pdCwgYW5pbWF0YWJsZSk7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBwcmV2aW91c1R3ZWVuID8gcHJldmlvdXNUd2Vlbi50by5vcmlnaW5hbCA6IG9yaWdpbmFsVmFsdWU7XG4gICAgdmFyIGZyb20gPSBpcy5hcnIodHdlZW5WYWx1ZSkgPyB0d2VlblZhbHVlWzBdIDogcHJldmlvdXNWYWx1ZTtcbiAgICB2YXIgZnJvbVVuaXQgPSBnZXRVbml0KGZyb20pIHx8IGdldFVuaXQob3JpZ2luYWxWYWx1ZSk7XG4gICAgdmFyIHVuaXQgPSB0b1VuaXQgfHwgZnJvbVVuaXQ7XG4gICAgaWYgKGlzLnVuZCh0bykpIHsgdG8gPSBwcmV2aW91c1ZhbHVlOyB9XG4gICAgdHdlZW4uZnJvbSA9IGRlY29tcG9zZVZhbHVlKGZyb20sIHVuaXQpO1xuICAgIHR3ZWVuLnRvID0gZGVjb21wb3NlVmFsdWUoZ2V0UmVsYXRpdmVWYWx1ZSh0bywgZnJvbSksIHVuaXQpO1xuICAgIHR3ZWVuLnN0YXJ0ID0gcHJldmlvdXNUd2VlbiA/IHByZXZpb3VzVHdlZW4uZW5kIDogMDtcbiAgICB0d2Vlbi5lbmQgPSB0d2Vlbi5zdGFydCArIHR3ZWVuLmRlbGF5ICsgdHdlZW4uZHVyYXRpb24gKyB0d2Vlbi5lbmREZWxheTtcbiAgICB0d2Vlbi5lYXNpbmcgPSBwYXJzZUVhc2luZ3ModHdlZW4uZWFzaW5nLCB0d2Vlbi5kdXJhdGlvbik7XG4gICAgdHdlZW4uaXNQYXRoID0gaXMucHRoKHR3ZWVuVmFsdWUpO1xuICAgIHR3ZWVuLmlzUGF0aFRhcmdldEluc2lkZVNWRyA9IHR3ZWVuLmlzUGF0aCAmJiBpcy5zdmcoYW5pbWF0YWJsZS50YXJnZXQpO1xuICAgIHR3ZWVuLmlzQ29sb3IgPSBpcy5jb2wodHdlZW4uZnJvbS5vcmlnaW5hbCk7XG4gICAgaWYgKHR3ZWVuLmlzQ29sb3IpIHsgdHdlZW4ucm91bmQgPSAxOyB9XG4gICAgcHJldmlvdXNUd2VlbiA9IHR3ZWVuO1xuICAgIHJldHVybiB0d2VlbjtcbiAgfSk7XG59XG5cbi8vIFR3ZWVuIHByb2dyZXNzXG5cbnZhciBzZXRQcm9ncmVzc1ZhbHVlID0ge1xuICBjc3M6IGZ1bmN0aW9uICh0LCBwLCB2KSB7IHJldHVybiB0LnN0eWxlW3BdID0gdjsgfSxcbiAgYXR0cmlidXRlOiBmdW5jdGlvbiAodCwgcCwgdikgeyByZXR1cm4gdC5zZXRBdHRyaWJ1dGUocCwgdik7IH0sXG4gIG9iamVjdDogZnVuY3Rpb24gKHQsIHAsIHYpIHsgcmV0dXJuIHRbcF0gPSB2OyB9LFxuICB0cmFuc2Zvcm06IGZ1bmN0aW9uICh0LCBwLCB2LCB0cmFuc2Zvcm1zLCBtYW51YWwpIHtcbiAgICB0cmFuc2Zvcm1zLmxpc3Quc2V0KHAsIHYpO1xuICAgIGlmIChwID09PSB0cmFuc2Zvcm1zLmxhc3QgfHwgbWFudWFsKSB7XG4gICAgICB2YXIgc3RyID0gJyc7XG4gICAgICB0cmFuc2Zvcm1zLmxpc3QuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIHByb3ApIHsgc3RyICs9IHByb3AgKyBcIihcIiArIHZhbHVlICsgXCIpIFwiOyB9KTtcbiAgICAgIHQuc3R5bGUudHJhbnNmb3JtID0gc3RyO1xuICAgIH1cbiAgfVxufTtcblxuLy8gU2V0IFZhbHVlIGhlbHBlclxuXG5mdW5jdGlvbiBzZXRUYXJnZXRzVmFsdWUodGFyZ2V0cywgcHJvcGVydGllcykge1xuICB2YXIgYW5pbWF0YWJsZXMgPSBnZXRBbmltYXRhYmxlcyh0YXJnZXRzKTtcbiAgYW5pbWF0YWJsZXMuZm9yRWFjaChmdW5jdGlvbiAoYW5pbWF0YWJsZSkge1xuICAgIGZvciAodmFyIHByb3BlcnR5IGluIHByb3BlcnRpZXMpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGdldEZ1bmN0aW9uVmFsdWUocHJvcGVydGllc1twcm9wZXJ0eV0sIGFuaW1hdGFibGUpO1xuICAgICAgdmFyIHRhcmdldCA9IGFuaW1hdGFibGUudGFyZ2V0O1xuICAgICAgdmFyIHZhbHVlVW5pdCA9IGdldFVuaXQodmFsdWUpO1xuICAgICAgdmFyIG9yaWdpbmFsVmFsdWUgPSBnZXRPcmlnaW5hbFRhcmdldFZhbHVlKHRhcmdldCwgcHJvcGVydHksIHZhbHVlVW5pdCwgYW5pbWF0YWJsZSk7XG4gICAgICB2YXIgdW5pdCA9IHZhbHVlVW5pdCB8fCBnZXRVbml0KG9yaWdpbmFsVmFsdWUpO1xuICAgICAgdmFyIHRvID0gZ2V0UmVsYXRpdmVWYWx1ZSh2YWxpZGF0ZVZhbHVlKHZhbHVlLCB1bml0KSwgb3JpZ2luYWxWYWx1ZSk7XG4gICAgICB2YXIgYW5pbVR5cGUgPSBnZXRBbmltYXRpb25UeXBlKHRhcmdldCwgcHJvcGVydHkpO1xuICAgICAgc2V0UHJvZ3Jlc3NWYWx1ZVthbmltVHlwZV0odGFyZ2V0LCBwcm9wZXJ0eSwgdG8sIGFuaW1hdGFibGUudHJhbnNmb3JtcywgdHJ1ZSk7XG4gICAgfVxuICB9KTtcbn1cblxuLy8gQW5pbWF0aW9uc1xuXG5mdW5jdGlvbiBjcmVhdGVBbmltYXRpb24oYW5pbWF0YWJsZSwgcHJvcCkge1xuICB2YXIgYW5pbVR5cGUgPSBnZXRBbmltYXRpb25UeXBlKGFuaW1hdGFibGUudGFyZ2V0LCBwcm9wLm5hbWUpO1xuICBpZiAoYW5pbVR5cGUpIHtcbiAgICB2YXIgdHdlZW5zID0gbm9ybWFsaXplVHdlZW5zKHByb3AsIGFuaW1hdGFibGUpO1xuICAgIHZhciBsYXN0VHdlZW4gPSB0d2VlbnNbdHdlZW5zLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBhbmltVHlwZSxcbiAgICAgIHByb3BlcnR5OiBwcm9wLm5hbWUsXG4gICAgICBhbmltYXRhYmxlOiBhbmltYXRhYmxlLFxuICAgICAgdHdlZW5zOiB0d2VlbnMsXG4gICAgICBkdXJhdGlvbjogbGFzdFR3ZWVuLmVuZCxcbiAgICAgIGRlbGF5OiB0d2VlbnNbMF0uZGVsYXksXG4gICAgICBlbmREZWxheTogbGFzdFR3ZWVuLmVuZERlbGF5XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEFuaW1hdGlvbnMoYW5pbWF0YWJsZXMsIHByb3BlcnRpZXMpIHtcbiAgcmV0dXJuIGZpbHRlckFycmF5KGZsYXR0ZW5BcnJheShhbmltYXRhYmxlcy5tYXAoZnVuY3Rpb24gKGFuaW1hdGFibGUpIHtcbiAgICByZXR1cm4gcHJvcGVydGllcy5tYXAoZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHJldHVybiBjcmVhdGVBbmltYXRpb24oYW5pbWF0YWJsZSwgcHJvcCk7XG4gICAgfSk7XG4gIH0pKSwgZnVuY3Rpb24gKGEpIHsgcmV0dXJuICFpcy51bmQoYSk7IH0pO1xufVxuXG4vLyBDcmVhdGUgSW5zdGFuY2VcblxuZnVuY3Rpb24gZ2V0SW5zdGFuY2VUaW1pbmdzKGFuaW1hdGlvbnMsIHR3ZWVuU2V0dGluZ3MpIHtcbiAgdmFyIGFuaW1MZW5ndGggPSBhbmltYXRpb25zLmxlbmd0aDtcbiAgdmFyIGdldFRsT2Zmc2V0ID0gZnVuY3Rpb24gKGFuaW0pIHsgcmV0dXJuIGFuaW0udGltZWxpbmVPZmZzZXQgPyBhbmltLnRpbWVsaW5lT2Zmc2V0IDogMDsgfTtcbiAgdmFyIHRpbWluZ3MgPSB7fTtcbiAgdGltaW5ncy5kdXJhdGlvbiA9IGFuaW1MZW5ndGggPyBNYXRoLm1heC5hcHBseShNYXRoLCBhbmltYXRpb25zLm1hcChmdW5jdGlvbiAoYW5pbSkgeyByZXR1cm4gZ2V0VGxPZmZzZXQoYW5pbSkgKyBhbmltLmR1cmF0aW9uOyB9KSkgOiB0d2VlblNldHRpbmdzLmR1cmF0aW9uO1xuICB0aW1pbmdzLmRlbGF5ID0gYW5pbUxlbmd0aCA/IE1hdGgubWluLmFwcGx5KE1hdGgsIGFuaW1hdGlvbnMubWFwKGZ1bmN0aW9uIChhbmltKSB7IHJldHVybiBnZXRUbE9mZnNldChhbmltKSArIGFuaW0uZGVsYXk7IH0pKSA6IHR3ZWVuU2V0dGluZ3MuZGVsYXk7XG4gIHRpbWluZ3MuZW5kRGVsYXkgPSBhbmltTGVuZ3RoID8gdGltaW5ncy5kdXJhdGlvbiAtIE1hdGgubWF4LmFwcGx5KE1hdGgsIGFuaW1hdGlvbnMubWFwKGZ1bmN0aW9uIChhbmltKSB7IHJldHVybiBnZXRUbE9mZnNldChhbmltKSArIGFuaW0uZHVyYXRpb24gLSBhbmltLmVuZERlbGF5OyB9KSkgOiB0d2VlblNldHRpbmdzLmVuZERlbGF5O1xuICByZXR1cm4gdGltaW5ncztcbn1cblxudmFyIGluc3RhbmNlSUQgPSAwO1xuXG5mdW5jdGlvbiBjcmVhdGVOZXdJbnN0YW5jZShwYXJhbXMpIHtcbiAgdmFyIGluc3RhbmNlU2V0dGluZ3MgPSByZXBsYWNlT2JqZWN0UHJvcHMoZGVmYXVsdEluc3RhbmNlU2V0dGluZ3MsIHBhcmFtcyk7XG4gIHZhciB0d2VlblNldHRpbmdzID0gcmVwbGFjZU9iamVjdFByb3BzKGRlZmF1bHRUd2VlblNldHRpbmdzLCBwYXJhbXMpO1xuICB2YXIgcHJvcGVydGllcyA9IGdldFByb3BlcnRpZXModHdlZW5TZXR0aW5ncywgcGFyYW1zKTtcbiAgdmFyIGFuaW1hdGFibGVzID0gZ2V0QW5pbWF0YWJsZXMocGFyYW1zLnRhcmdldHMpO1xuICB2YXIgYW5pbWF0aW9ucyA9IGdldEFuaW1hdGlvbnMoYW5pbWF0YWJsZXMsIHByb3BlcnRpZXMpO1xuICB2YXIgdGltaW5ncyA9IGdldEluc3RhbmNlVGltaW5ncyhhbmltYXRpb25zLCB0d2VlblNldHRpbmdzKTtcbiAgdmFyIGlkID0gaW5zdGFuY2VJRDtcbiAgaW5zdGFuY2VJRCsrO1xuICByZXR1cm4gbWVyZ2VPYmplY3RzKGluc3RhbmNlU2V0dGluZ3MsIHtcbiAgICBpZDogaWQsXG4gICAgY2hpbGRyZW46IFtdLFxuICAgIGFuaW1hdGFibGVzOiBhbmltYXRhYmxlcyxcbiAgICBhbmltYXRpb25zOiBhbmltYXRpb25zLFxuICAgIGR1cmF0aW9uOiB0aW1pbmdzLmR1cmF0aW9uLFxuICAgIGRlbGF5OiB0aW1pbmdzLmRlbGF5LFxuICAgIGVuZERlbGF5OiB0aW1pbmdzLmVuZERlbGF5XG4gIH0pO1xufVxuXG4vLyBDb3JlXG5cbnZhciBhY3RpdmVJbnN0YW5jZXMgPSBbXTtcblxudmFyIGVuZ2luZSA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciByYWY7XG5cbiAgZnVuY3Rpb24gcGxheSgpIHtcbiAgICBpZiAoIXJhZiAmJiAoIWlzRG9jdW1lbnRIaWRkZW4oKSB8fCAhYW5pbWUuc3VzcGVuZFdoZW5Eb2N1bWVudEhpZGRlbikgJiYgYWN0aXZlSW5zdGFuY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJhZiA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShzdGVwKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gc3RlcCh0KSB7XG4gICAgLy8gbWVtbyBvbiBhbGdvcml0aG0gaXNzdWU6XG4gICAgLy8gZGFuZ2Vyb3VzIGl0ZXJhdGlvbiBvdmVyIG11dGFibGUgYGFjdGl2ZUluc3RhbmNlc2BcbiAgICAvLyAodGhhdCBjb2xsZWN0aW9uIG1heSBiZSB1cGRhdGVkIGZyb20gd2l0aGluIGNhbGxiYWNrcyBvZiBgdGlja2AtZWQgYW5pbWF0aW9uIGluc3RhbmNlcylcbiAgICB2YXIgYWN0aXZlSW5zdGFuY2VzTGVuZ3RoID0gYWN0aXZlSW5zdGFuY2VzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBhY3RpdmVJbnN0YW5jZXNMZW5ndGgpIHtcbiAgICAgIHZhciBhY3RpdmVJbnN0YW5jZSA9IGFjdGl2ZUluc3RhbmNlc1tpXTtcbiAgICAgIGlmICghYWN0aXZlSW5zdGFuY2UucGF1c2VkKSB7XG4gICAgICAgIGFjdGl2ZUluc3RhbmNlLnRpY2sodCk7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGl2ZUluc3RhbmNlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGFjdGl2ZUluc3RhbmNlc0xlbmd0aC0tO1xuICAgICAgfVxuICAgIH1cbiAgICByYWYgPSBpID4gMCA/IHJlcXVlc3RBbmltYXRpb25GcmFtZShzdGVwKSA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UoKSB7XG4gICAgaWYgKCFhbmltZS5zdXNwZW5kV2hlbkRvY3VtZW50SGlkZGVuKSB7IHJldHVybjsgfVxuXG4gICAgaWYgKGlzRG9jdW1lbnRIaWRkZW4oKSkge1xuICAgICAgLy8gc3VzcGVuZCB0aWNrc1xuICAgICAgcmFmID0gY2FuY2VsQW5pbWF0aW9uRnJhbWUocmFmKTtcbiAgICB9IGVsc2UgeyAvLyBpcyBiYWNrIHRvIGFjdGl2ZSB0YWJcbiAgICAgIC8vIGZpcnN0IGFkanVzdCBhbmltYXRpb25zIHRvIGNvbnNpZGVyIHRoZSB0aW1lIHRoYXQgdGlja3Mgd2VyZSBzdXNwZW5kZWRcbiAgICAgIGFjdGl2ZUluc3RhbmNlcy5mb3JFYWNoKFxuICAgICAgICBmdW5jdGlvbiAoaW5zdGFuY2UpIHsgcmV0dXJuIGluc3RhbmNlIC5fb25Eb2N1bWVudFZpc2liaWxpdHkoKTsgfVxuICAgICAgKTtcbiAgICAgIGVuZ2luZSgpO1xuICAgIH1cbiAgfVxuICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcbiAgfVxuXG4gIHJldHVybiBwbGF5O1xufSkoKTtcblxuZnVuY3Rpb24gaXNEb2N1bWVudEhpZGRlbigpIHtcbiAgcmV0dXJuICEhZG9jdW1lbnQgJiYgZG9jdW1lbnQuaGlkZGVuO1xufVxuXG4vLyBQdWJsaWMgSW5zdGFuY2VcblxuZnVuY3Rpb24gYW5pbWUocGFyYW1zKSB7XG4gIGlmICggcGFyYW1zID09PSB2b2lkIDAgKSBwYXJhbXMgPSB7fTtcblxuXG4gIHZhciBzdGFydFRpbWUgPSAwLCBsYXN0VGltZSA9IDAsIG5vdyA9IDA7XG4gIHZhciBjaGlsZHJlbiwgY2hpbGRyZW5MZW5ndGggPSAwO1xuICB2YXIgcmVzb2x2ZSA9IG51bGw7XG5cbiAgZnVuY3Rpb24gbWFrZVByb21pc2UoaW5zdGFuY2UpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlICYmIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChfcmVzb2x2ZSkgeyByZXR1cm4gcmVzb2x2ZSA9IF9yZXNvbHZlOyB9KTtcbiAgICBpbnN0YW5jZS5maW5pc2hlZCA9IHByb21pc2U7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICB2YXIgaW5zdGFuY2UgPSBjcmVhdGVOZXdJbnN0YW5jZShwYXJhbXMpO1xuICB2YXIgcHJvbWlzZSA9IG1ha2VQcm9taXNlKGluc3RhbmNlKTtcblxuICBmdW5jdGlvbiB0b2dnbGVJbnN0YW5jZURpcmVjdGlvbigpIHtcbiAgICB2YXIgZGlyZWN0aW9uID0gaW5zdGFuY2UuZGlyZWN0aW9uO1xuICAgIGlmIChkaXJlY3Rpb24gIT09ICdhbHRlcm5hdGUnKSB7XG4gICAgICBpbnN0YW5jZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb24gIT09ICdub3JtYWwnID8gJ25vcm1hbCcgOiAncmV2ZXJzZSc7XG4gICAgfVxuICAgIGluc3RhbmNlLnJldmVyc2VkID0gIWluc3RhbmNlLnJldmVyc2VkO1xuICAgIGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7IHJldHVybiBjaGlsZC5yZXZlcnNlZCA9IGluc3RhbmNlLnJldmVyc2VkOyB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkanVzdFRpbWUodGltZSkge1xuICAgIHJldHVybiBpbnN0YW5jZS5yZXZlcnNlZCA/IGluc3RhbmNlLmR1cmF0aW9uIC0gdGltZSA6IHRpbWU7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldFRpbWUoKSB7XG4gICAgc3RhcnRUaW1lID0gMDtcbiAgICBsYXN0VGltZSA9IGFkanVzdFRpbWUoaW5zdGFuY2UuY3VycmVudFRpbWUpICogKDEgLyBhbmltZS5zcGVlZCk7XG4gIH1cblxuICBmdW5jdGlvbiBzZWVrQ2hpbGQodGltZSwgY2hpbGQpIHtcbiAgICBpZiAoY2hpbGQpIHsgY2hpbGQuc2Vlayh0aW1lIC0gY2hpbGQudGltZWxpbmVPZmZzZXQpOyB9XG4gIH1cblxuICBmdW5jdGlvbiBzeW5jSW5zdGFuY2VDaGlsZHJlbih0aW1lKSB7XG4gICAgaWYgKCFpbnN0YW5jZS5yZXZlcnNlUGxheWJhY2spIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW5MZW5ndGg7IGkrKykgeyBzZWVrQ2hpbGQodGltZSwgY2hpbGRyZW5baV0pOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkkMSA9IGNoaWxkcmVuTGVuZ3RoOyBpJDEtLTspIHsgc2Vla0NoaWxkKHRpbWUsIGNoaWxkcmVuW2kkMV0pOyB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0QW5pbWF0aW9uc1Byb2dyZXNzKGluc1RpbWUpIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGFuaW1hdGlvbnMgPSBpbnN0YW5jZS5hbmltYXRpb25zO1xuICAgIHZhciBhbmltYXRpb25zTGVuZ3RoID0gYW5pbWF0aW9ucy5sZW5ndGg7XG4gICAgd2hpbGUgKGkgPCBhbmltYXRpb25zTGVuZ3RoKSB7XG4gICAgICB2YXIgYW5pbSA9IGFuaW1hdGlvbnNbaV07XG4gICAgICB2YXIgYW5pbWF0YWJsZSA9IGFuaW0uYW5pbWF0YWJsZTtcbiAgICAgIHZhciB0d2VlbnMgPSBhbmltLnR3ZWVucztcbiAgICAgIHZhciB0d2Vlbkxlbmd0aCA9IHR3ZWVucy5sZW5ndGggLSAxO1xuICAgICAgdmFyIHR3ZWVuID0gdHdlZW5zW3R3ZWVuTGVuZ3RoXTtcbiAgICAgIC8vIE9ubHkgY2hlY2sgZm9yIGtleWZyYW1lcyBpZiB0aGVyZSBpcyBtb3JlIHRoYW4gb25lIHR3ZWVuXG4gICAgICBpZiAodHdlZW5MZW5ndGgpIHsgdHdlZW4gPSBmaWx0ZXJBcnJheSh0d2VlbnMsIGZ1bmN0aW9uICh0KSB7IHJldHVybiAoaW5zVGltZSA8IHQuZW5kKTsgfSlbMF0gfHwgdHdlZW47IH1cbiAgICAgIHZhciBlbGFwc2VkID0gbWluTWF4KGluc1RpbWUgLSB0d2Vlbi5zdGFydCAtIHR3ZWVuLmRlbGF5LCAwLCB0d2Vlbi5kdXJhdGlvbikgLyB0d2Vlbi5kdXJhdGlvbjtcbiAgICAgIHZhciBlYXNlZCA9IGlzTmFOKGVsYXBzZWQpID8gMSA6IHR3ZWVuLmVhc2luZyhlbGFwc2VkKTtcbiAgICAgIHZhciBzdHJpbmdzID0gdHdlZW4udG8uc3RyaW5ncztcbiAgICAgIHZhciByb3VuZCA9IHR3ZWVuLnJvdW5kO1xuICAgICAgdmFyIG51bWJlcnMgPSBbXTtcbiAgICAgIHZhciB0b051bWJlcnNMZW5ndGggPSB0d2Vlbi50by5udW1iZXJzLmxlbmd0aDtcbiAgICAgIHZhciBwcm9ncmVzcyA9ICh2b2lkIDApO1xuICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCB0b051bWJlcnNMZW5ndGg7IG4rKykge1xuICAgICAgICB2YXIgdmFsdWUgPSAodm9pZCAwKTtcbiAgICAgICAgdmFyIHRvTnVtYmVyID0gdHdlZW4udG8ubnVtYmVyc1tuXTtcbiAgICAgICAgdmFyIGZyb21OdW1iZXIgPSB0d2Vlbi5mcm9tLm51bWJlcnNbbl0gfHwgMDtcbiAgICAgICAgaWYgKCF0d2Vlbi5pc1BhdGgpIHtcbiAgICAgICAgICB2YWx1ZSA9IGZyb21OdW1iZXIgKyAoZWFzZWQgKiAodG9OdW1iZXIgLSBmcm9tTnVtYmVyKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSBnZXRQYXRoUHJvZ3Jlc3ModHdlZW4udmFsdWUsIGVhc2VkICogdG9OdW1iZXIsIHR3ZWVuLmlzUGF0aFRhcmdldEluc2lkZVNWRyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJvdW5kKSB7XG4gICAgICAgICAgaWYgKCEodHdlZW4uaXNDb2xvciAmJiBuID4gMikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAqIHJvdW5kKSAvIHJvdW5kO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBudW1iZXJzLnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgICAgLy8gTWFudWFsIEFycmF5LnJlZHVjZSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlc1xuICAgICAgdmFyIHN0cmluZ3NMZW5ndGggPSBzdHJpbmdzLmxlbmd0aDtcbiAgICAgIGlmICghc3RyaW5nc0xlbmd0aCkge1xuICAgICAgICBwcm9ncmVzcyA9IG51bWJlcnNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9ncmVzcyA9IHN0cmluZ3NbMF07XG4gICAgICAgIGZvciAodmFyIHMgPSAwOyBzIDwgc3RyaW5nc0xlbmd0aDsgcysrKSB7XG4gICAgICAgICAgdmFyIGEgPSBzdHJpbmdzW3NdO1xuICAgICAgICAgIHZhciBiID0gc3RyaW5nc1tzICsgMV07XG4gICAgICAgICAgdmFyIG4kMSA9IG51bWJlcnNbc107XG4gICAgICAgICAgaWYgKCFpc05hTihuJDEpKSB7XG4gICAgICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICAgICAgcHJvZ3Jlc3MgKz0gbiQxICsgJyAnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcHJvZ3Jlc3MgKz0gbiQxICsgYjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNldFByb2dyZXNzVmFsdWVbYW5pbS50eXBlXShhbmltYXRhYmxlLnRhcmdldCwgYW5pbS5wcm9wZXJ0eSwgcHJvZ3Jlc3MsIGFuaW1hdGFibGUudHJhbnNmb3Jtcyk7XG4gICAgICBhbmltLmN1cnJlbnRWYWx1ZSA9IHByb2dyZXNzO1xuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldENhbGxiYWNrKGNiKSB7XG4gICAgaWYgKGluc3RhbmNlW2NiXSAmJiAhaW5zdGFuY2UucGFzc1Rocm91Z2gpIHsgaW5zdGFuY2VbY2JdKGluc3RhbmNlKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gY291bnRJdGVyYXRpb24oKSB7XG4gICAgaWYgKGluc3RhbmNlLnJlbWFpbmluZyAmJiBpbnN0YW5jZS5yZW1haW5pbmcgIT09IHRydWUpIHtcbiAgICAgIGluc3RhbmNlLnJlbWFpbmluZy0tO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEluc3RhbmNlUHJvZ3Jlc3MoZW5naW5lVGltZSkge1xuICAgIHZhciBpbnNEdXJhdGlvbiA9IGluc3RhbmNlLmR1cmF0aW9uO1xuICAgIHZhciBpbnNEZWxheSA9IGluc3RhbmNlLmRlbGF5O1xuICAgIHZhciBpbnNFbmREZWxheSA9IGluc0R1cmF0aW9uIC0gaW5zdGFuY2UuZW5kRGVsYXk7XG4gICAgdmFyIGluc1RpbWUgPSBhZGp1c3RUaW1lKGVuZ2luZVRpbWUpO1xuICAgIGluc3RhbmNlLnByb2dyZXNzID0gbWluTWF4KChpbnNUaW1lIC8gaW5zRHVyYXRpb24pICogMTAwLCAwLCAxMDApO1xuICAgIGluc3RhbmNlLnJldmVyc2VQbGF5YmFjayA9IGluc1RpbWUgPCBpbnN0YW5jZS5jdXJyZW50VGltZTtcbiAgICBpZiAoY2hpbGRyZW4pIHsgc3luY0luc3RhbmNlQ2hpbGRyZW4oaW5zVGltZSk7IH1cbiAgICBpZiAoIWluc3RhbmNlLmJlZ2FuICYmIGluc3RhbmNlLmN1cnJlbnRUaW1lID4gMCkge1xuICAgICAgaW5zdGFuY2UuYmVnYW4gPSB0cnVlO1xuICAgICAgc2V0Q2FsbGJhY2soJ2JlZ2luJyk7XG4gICAgfVxuICAgIGlmICghaW5zdGFuY2UubG9vcEJlZ2FuICYmIGluc3RhbmNlLmN1cnJlbnRUaW1lID4gMCkge1xuICAgICAgaW5zdGFuY2UubG9vcEJlZ2FuID0gdHJ1ZTtcbiAgICAgIHNldENhbGxiYWNrKCdsb29wQmVnaW4nKTtcbiAgICB9XG4gICAgaWYgKGluc1RpbWUgPD0gaW5zRGVsYXkgJiYgaW5zdGFuY2UuY3VycmVudFRpbWUgIT09IDApIHtcbiAgICAgIHNldEFuaW1hdGlvbnNQcm9ncmVzcygwKTtcbiAgICB9XG4gICAgaWYgKChpbnNUaW1lID49IGluc0VuZERlbGF5ICYmIGluc3RhbmNlLmN1cnJlbnRUaW1lICE9PSBpbnNEdXJhdGlvbikgfHwgIWluc0R1cmF0aW9uKSB7XG4gICAgICBzZXRBbmltYXRpb25zUHJvZ3Jlc3MoaW5zRHVyYXRpb24pO1xuICAgIH1cbiAgICBpZiAoaW5zVGltZSA+IGluc0RlbGF5ICYmIGluc1RpbWUgPCBpbnNFbmREZWxheSkge1xuICAgICAgaWYgKCFpbnN0YW5jZS5jaGFuZ2VCZWdhbikge1xuICAgICAgICBpbnN0YW5jZS5jaGFuZ2VCZWdhbiA9IHRydWU7XG4gICAgICAgIGluc3RhbmNlLmNoYW5nZUNvbXBsZXRlZCA9IGZhbHNlO1xuICAgICAgICBzZXRDYWxsYmFjaygnY2hhbmdlQmVnaW4nKTtcbiAgICAgIH1cbiAgICAgIHNldENhbGxiYWNrKCdjaGFuZ2UnKTtcbiAgICAgIHNldEFuaW1hdGlvbnNQcm9ncmVzcyhpbnNUaW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGluc3RhbmNlLmNoYW5nZUJlZ2FuKSB7XG4gICAgICAgIGluc3RhbmNlLmNoYW5nZUNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgIGluc3RhbmNlLmNoYW5nZUJlZ2FuID0gZmFsc2U7XG4gICAgICAgIHNldENhbGxiYWNrKCdjaGFuZ2VDb21wbGV0ZScpO1xuICAgICAgfVxuICAgIH1cbiAgICBpbnN0YW5jZS5jdXJyZW50VGltZSA9IG1pbk1heChpbnNUaW1lLCAwLCBpbnNEdXJhdGlvbik7XG4gICAgaWYgKGluc3RhbmNlLmJlZ2FuKSB7IHNldENhbGxiYWNrKCd1cGRhdGUnKTsgfVxuICAgIGlmIChlbmdpbmVUaW1lID49IGluc0R1cmF0aW9uKSB7XG4gICAgICBsYXN0VGltZSA9IDA7XG4gICAgICBjb3VudEl0ZXJhdGlvbigpO1xuICAgICAgaWYgKCFpbnN0YW5jZS5yZW1haW5pbmcpIHtcbiAgICAgICAgaW5zdGFuY2UucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgaWYgKCFpbnN0YW5jZS5jb21wbGV0ZWQpIHtcbiAgICAgICAgICBpbnN0YW5jZS5jb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgIHNldENhbGxiYWNrKCdsb29wQ29tcGxldGUnKTtcbiAgICAgICAgICBzZXRDYWxsYmFjaygnY29tcGxldGUnKTtcbiAgICAgICAgICBpZiAoIWluc3RhbmNlLnBhc3NUaHJvdWdoICYmICdQcm9taXNlJyBpbiB3aW5kb3cpIHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIHByb21pc2UgPSBtYWtlUHJvbWlzZShpbnN0YW5jZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydFRpbWUgPSBub3c7XG4gICAgICAgIHNldENhbGxiYWNrKCdsb29wQ29tcGxldGUnKTtcbiAgICAgICAgaW5zdGFuY2UubG9vcEJlZ2FuID0gZmFsc2U7XG4gICAgICAgIGlmIChpbnN0YW5jZS5kaXJlY3Rpb24gPT09ICdhbHRlcm5hdGUnKSB7XG4gICAgICAgICAgdG9nZ2xlSW5zdGFuY2VEaXJlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGluc3RhbmNlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGluc3RhbmNlLmRpcmVjdGlvbjtcbiAgICBpbnN0YW5jZS5wYXNzVGhyb3VnaCA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmN1cnJlbnRUaW1lID0gMDtcbiAgICBpbnN0YW5jZS5wcm9ncmVzcyA9IDA7XG4gICAgaW5zdGFuY2UucGF1c2VkID0gdHJ1ZTtcbiAgICBpbnN0YW5jZS5iZWdhbiA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmxvb3BCZWdhbiA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmNoYW5nZUJlZ2FuID0gZmFsc2U7XG4gICAgaW5zdGFuY2UuY29tcGxldGVkID0gZmFsc2U7XG4gICAgaW5zdGFuY2UuY2hhbmdlQ29tcGxldGVkID0gZmFsc2U7XG4gICAgaW5zdGFuY2UucmV2ZXJzZVBsYXliYWNrID0gZmFsc2U7XG4gICAgaW5zdGFuY2UucmV2ZXJzZWQgPSBkaXJlY3Rpb24gPT09ICdyZXZlcnNlJztcbiAgICBpbnN0YW5jZS5yZW1haW5pbmcgPSBpbnN0YW5jZS5sb29wO1xuICAgIGNoaWxkcmVuID0gaW5zdGFuY2UuY2hpbGRyZW47XG4gICAgY2hpbGRyZW5MZW5ndGggPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IGNoaWxkcmVuTGVuZ3RoOyBpLS07KSB7IGluc3RhbmNlLmNoaWxkcmVuW2ldLnJlc2V0KCk7IH1cbiAgICBpZiAoaW5zdGFuY2UucmV2ZXJzZWQgJiYgaW5zdGFuY2UubG9vcCAhPT0gdHJ1ZSB8fCAoZGlyZWN0aW9uID09PSAnYWx0ZXJuYXRlJyAmJiBpbnN0YW5jZS5sb29wID09PSAxKSkgeyBpbnN0YW5jZS5yZW1haW5pbmcrKzsgfVxuICAgIHNldEFuaW1hdGlvbnNQcm9ncmVzcyhpbnN0YW5jZS5yZXZlcnNlZCA/IGluc3RhbmNlLmR1cmF0aW9uIDogMCk7XG4gIH07XG5cbiAgLy8gaW50ZXJuYWwgbWV0aG9kIChmb3IgZW5naW5lKSB0byBhZGp1c3QgYW5pbWF0aW9uIHRpbWluZ3MgYmVmb3JlIHJlc3RvcmluZyBlbmdpbmUgdGlja3MgKHJBRilcbiAgaW5zdGFuY2UuX29uRG9jdW1lbnRWaXNpYmlsaXR5ID0gcmVzZXRUaW1lO1xuXG4gIC8vIFNldCBWYWx1ZSBoZWxwZXJcblxuICBpbnN0YW5jZS5zZXQgPSBmdW5jdGlvbih0YXJnZXRzLCBwcm9wZXJ0aWVzKSB7XG4gICAgc2V0VGFyZ2V0c1ZhbHVlKHRhcmdldHMsIHByb3BlcnRpZXMpO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfTtcblxuICBpbnN0YW5jZS50aWNrID0gZnVuY3Rpb24odCkge1xuICAgIG5vdyA9IHQ7XG4gICAgaWYgKCFzdGFydFRpbWUpIHsgc3RhcnRUaW1lID0gbm93OyB9XG4gICAgc2V0SW5zdGFuY2VQcm9ncmVzcygobm93ICsgKGxhc3RUaW1lIC0gc3RhcnRUaW1lKSkgKiBhbmltZS5zcGVlZCk7XG4gIH07XG5cbiAgaW5zdGFuY2Uuc2VlayA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICBzZXRJbnN0YW5jZVByb2dyZXNzKGFkanVzdFRpbWUodGltZSkpO1xuICB9O1xuXG4gIGluc3RhbmNlLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgaW5zdGFuY2UucGF1c2VkID0gdHJ1ZTtcbiAgICByZXNldFRpbWUoKTtcbiAgfTtcblxuICBpbnN0YW5jZS5wbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFpbnN0YW5jZS5wYXVzZWQpIHsgcmV0dXJuOyB9XG4gICAgaWYgKGluc3RhbmNlLmNvbXBsZXRlZCkgeyBpbnN0YW5jZS5yZXNldCgpOyB9XG4gICAgaW5zdGFuY2UucGF1c2VkID0gZmFsc2U7XG4gICAgYWN0aXZlSW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpO1xuICAgIHJlc2V0VGltZSgpO1xuICAgIGVuZ2luZSgpO1xuICB9O1xuXG4gIGluc3RhbmNlLnJldmVyc2UgPSBmdW5jdGlvbigpIHtcbiAgICB0b2dnbGVJbnN0YW5jZURpcmVjdGlvbigpO1xuICAgIGluc3RhbmNlLmNvbXBsZXRlZCA9IGluc3RhbmNlLnJldmVyc2VkID8gZmFsc2UgOiB0cnVlO1xuICAgIHJlc2V0VGltZSgpO1xuICB9O1xuXG4gIGluc3RhbmNlLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICBpbnN0YW5jZS5yZXNldCgpO1xuICAgIGluc3RhbmNlLnBsYXkoKTtcbiAgfTtcblxuICBpbnN0YW5jZS5yZW1vdmUgPSBmdW5jdGlvbih0YXJnZXRzKSB7XG4gICAgdmFyIHRhcmdldHNBcnJheSA9IHBhcnNlVGFyZ2V0cyh0YXJnZXRzKTtcbiAgICByZW1vdmVUYXJnZXRzRnJvbUluc3RhbmNlKHRhcmdldHNBcnJheSwgaW5zdGFuY2UpO1xuICB9O1xuXG4gIGluc3RhbmNlLnJlc2V0KCk7XG5cbiAgaWYgKGluc3RhbmNlLmF1dG9wbGF5KSB7IGluc3RhbmNlLnBsYXkoKTsgfVxuXG4gIHJldHVybiBpbnN0YW5jZTtcblxufVxuXG4vLyBSZW1vdmUgdGFyZ2V0cyBmcm9tIGFuaW1hdGlvblxuXG5mdW5jdGlvbiByZW1vdmVUYXJnZXRzRnJvbUFuaW1hdGlvbnModGFyZ2V0c0FycmF5LCBhbmltYXRpb25zKSB7XG4gIGZvciAodmFyIGEgPSBhbmltYXRpb25zLmxlbmd0aDsgYS0tOykge1xuICAgIGlmIChhcnJheUNvbnRhaW5zKHRhcmdldHNBcnJheSwgYW5pbWF0aW9uc1thXS5hbmltYXRhYmxlLnRhcmdldCkpIHtcbiAgICAgIGFuaW1hdGlvbnMuc3BsaWNlKGEsIDEpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVUYXJnZXRzRnJvbUluc3RhbmNlKHRhcmdldHNBcnJheSwgaW5zdGFuY2UpIHtcbiAgdmFyIGFuaW1hdGlvbnMgPSBpbnN0YW5jZS5hbmltYXRpb25zO1xuICB2YXIgY2hpbGRyZW4gPSBpbnN0YW5jZS5jaGlsZHJlbjtcbiAgcmVtb3ZlVGFyZ2V0c0Zyb21BbmltYXRpb25zKHRhcmdldHNBcnJheSwgYW5pbWF0aW9ucyk7XG4gIGZvciAodmFyIGMgPSBjaGlsZHJlbi5sZW5ndGg7IGMtLTspIHtcbiAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltjXTtcbiAgICB2YXIgY2hpbGRBbmltYXRpb25zID0gY2hpbGQuYW5pbWF0aW9ucztcbiAgICByZW1vdmVUYXJnZXRzRnJvbUFuaW1hdGlvbnModGFyZ2V0c0FycmF5LCBjaGlsZEFuaW1hdGlvbnMpO1xuICAgIGlmICghY2hpbGRBbmltYXRpb25zLmxlbmd0aCAmJiAhY2hpbGQuY2hpbGRyZW4ubGVuZ3RoKSB7IGNoaWxkcmVuLnNwbGljZShjLCAxKTsgfVxuICB9XG4gIGlmICghYW5pbWF0aW9ucy5sZW5ndGggJiYgIWNoaWxkcmVuLmxlbmd0aCkgeyBpbnN0YW5jZS5wYXVzZSgpOyB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVRhcmdldHNGcm9tQWN0aXZlSW5zdGFuY2VzKHRhcmdldHMpIHtcbiAgdmFyIHRhcmdldHNBcnJheSA9IHBhcnNlVGFyZ2V0cyh0YXJnZXRzKTtcbiAgZm9yICh2YXIgaSA9IGFjdGl2ZUluc3RhbmNlcy5sZW5ndGg7IGktLTspIHtcbiAgICB2YXIgaW5zdGFuY2UgPSBhY3RpdmVJbnN0YW5jZXNbaV07XG4gICAgcmVtb3ZlVGFyZ2V0c0Zyb21JbnN0YW5jZSh0YXJnZXRzQXJyYXksIGluc3RhbmNlKTtcbiAgfVxufVxuXG4vLyBTdGFnZ2VyIGhlbHBlcnNcblxuZnVuY3Rpb24gc3RhZ2dlcih2YWwsIHBhcmFtcykge1xuICBpZiAoIHBhcmFtcyA9PT0gdm9pZCAwICkgcGFyYW1zID0ge307XG5cbiAgdmFyIGRpcmVjdGlvbiA9IHBhcmFtcy5kaXJlY3Rpb24gfHwgJ25vcm1hbCc7XG4gIHZhciBlYXNpbmcgPSBwYXJhbXMuZWFzaW5nID8gcGFyc2VFYXNpbmdzKHBhcmFtcy5lYXNpbmcpIDogbnVsbDtcbiAgdmFyIGdyaWQgPSBwYXJhbXMuZ3JpZDtcbiAgdmFyIGF4aXMgPSBwYXJhbXMuYXhpcztcbiAgdmFyIGZyb21JbmRleCA9IHBhcmFtcy5mcm9tIHx8IDA7XG4gIHZhciBmcm9tRmlyc3QgPSBmcm9tSW5kZXggPT09ICdmaXJzdCc7XG4gIHZhciBmcm9tQ2VudGVyID0gZnJvbUluZGV4ID09PSAnY2VudGVyJztcbiAgdmFyIGZyb21MYXN0ID0gZnJvbUluZGV4ID09PSAnbGFzdCc7XG4gIHZhciBpc1JhbmdlID0gaXMuYXJyKHZhbCk7XG4gIHZhciB2YWwxID0gaXNSYW5nZSA/IHBhcnNlRmxvYXQodmFsWzBdKSA6IHBhcnNlRmxvYXQodmFsKTtcbiAgdmFyIHZhbDIgPSBpc1JhbmdlID8gcGFyc2VGbG9hdCh2YWxbMV0pIDogMDtcbiAgdmFyIHVuaXQgPSBnZXRVbml0KGlzUmFuZ2UgPyB2YWxbMV0gOiB2YWwpIHx8IDA7XG4gIHZhciBzdGFydCA9IHBhcmFtcy5zdGFydCB8fCAwICsgKGlzUmFuZ2UgPyB2YWwxIDogMCk7XG4gIHZhciB2YWx1ZXMgPSBbXTtcbiAgdmFyIG1heFZhbHVlID0gMDtcbiAgcmV0dXJuIGZ1bmN0aW9uIChlbCwgaSwgdCkge1xuICAgIGlmIChmcm9tRmlyc3QpIHsgZnJvbUluZGV4ID0gMDsgfVxuICAgIGlmIChmcm9tQ2VudGVyKSB7IGZyb21JbmRleCA9ICh0IC0gMSkgLyAyOyB9XG4gICAgaWYgKGZyb21MYXN0KSB7IGZyb21JbmRleCA9IHQgLSAxOyB9XG4gICAgaWYgKCF2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdDsgaW5kZXgrKykge1xuICAgICAgICBpZiAoIWdyaWQpIHtcbiAgICAgICAgICB2YWx1ZXMucHVzaChNYXRoLmFicyhmcm9tSW5kZXggLSBpbmRleCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBmcm9tWCA9ICFmcm9tQ2VudGVyID8gZnJvbUluZGV4JWdyaWRbMF0gOiAoZ3JpZFswXS0xKS8yO1xuICAgICAgICAgIHZhciBmcm9tWSA9ICFmcm9tQ2VudGVyID8gTWF0aC5mbG9vcihmcm9tSW5kZXgvZ3JpZFswXSkgOiAoZ3JpZFsxXS0xKS8yO1xuICAgICAgICAgIHZhciB0b1ggPSBpbmRleCVncmlkWzBdO1xuICAgICAgICAgIHZhciB0b1kgPSBNYXRoLmZsb29yKGluZGV4L2dyaWRbMF0pO1xuICAgICAgICAgIHZhciBkaXN0YW5jZVggPSBmcm9tWCAtIHRvWDtcbiAgICAgICAgICB2YXIgZGlzdGFuY2VZID0gZnJvbVkgLSB0b1k7XG4gICAgICAgICAgdmFyIHZhbHVlID0gTWF0aC5zcXJ0KGRpc3RhbmNlWCAqIGRpc3RhbmNlWCArIGRpc3RhbmNlWSAqIGRpc3RhbmNlWSk7XG4gICAgICAgICAgaWYgKGF4aXMgPT09ICd4JykgeyB2YWx1ZSA9IC1kaXN0YW5jZVg7IH1cbiAgICAgICAgICBpZiAoYXhpcyA9PT0gJ3knKSB7IHZhbHVlID0gLWRpc3RhbmNlWTsgfVxuICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBtYXhWYWx1ZSA9IE1hdGgubWF4LmFwcGx5KE1hdGgsIHZhbHVlcyk7XG4gICAgICB9XG4gICAgICBpZiAoZWFzaW5nKSB7IHZhbHVlcyA9IHZhbHVlcy5tYXAoZnVuY3Rpb24gKHZhbCkgeyByZXR1cm4gZWFzaW5nKHZhbCAvIG1heFZhbHVlKSAqIG1heFZhbHVlOyB9KTsgfVxuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3JldmVyc2UnKSB7IHZhbHVlcyA9IHZhbHVlcy5tYXAoZnVuY3Rpb24gKHZhbCkgeyByZXR1cm4gYXhpcyA/ICh2YWwgPCAwKSA/IHZhbCAqIC0xIDogLXZhbCA6IE1hdGguYWJzKG1heFZhbHVlIC0gdmFsKTsgfSk7IH1cbiAgICB9XG4gICAgdmFyIHNwYWNpbmcgPSBpc1JhbmdlID8gKHZhbDIgLSB2YWwxKSAvIG1heFZhbHVlIDogdmFsMTtcbiAgICByZXR1cm4gc3RhcnQgKyAoc3BhY2luZyAqIChNYXRoLnJvdW5kKHZhbHVlc1tpXSAqIDEwMCkgLyAxMDApKSArIHVuaXQ7XG4gIH1cbn1cblxuLy8gVGltZWxpbmVcblxuZnVuY3Rpb24gdGltZWxpbmUocGFyYW1zKSB7XG4gIGlmICggcGFyYW1zID09PSB2b2lkIDAgKSBwYXJhbXMgPSB7fTtcblxuICB2YXIgdGwgPSBhbmltZShwYXJhbXMpO1xuICB0bC5kdXJhdGlvbiA9IDA7XG4gIHRsLmFkZCA9IGZ1bmN0aW9uKGluc3RhbmNlUGFyYW1zLCB0aW1lbGluZU9mZnNldCkge1xuICAgIHZhciB0bEluZGV4ID0gYWN0aXZlSW5zdGFuY2VzLmluZGV4T2YodGwpO1xuICAgIHZhciBjaGlsZHJlbiA9IHRsLmNoaWxkcmVuO1xuICAgIGlmICh0bEluZGV4ID4gLTEpIHsgYWN0aXZlSW5zdGFuY2VzLnNwbGljZSh0bEluZGV4LCAxKTsgfVxuICAgIGZ1bmN0aW9uIHBhc3NUaHJvdWdoKGlucykgeyBpbnMucGFzc1Rocm91Z2ggPSB0cnVlOyB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykgeyBwYXNzVGhyb3VnaChjaGlsZHJlbltpXSk7IH1cbiAgICB2YXIgaW5zUGFyYW1zID0gbWVyZ2VPYmplY3RzKGluc3RhbmNlUGFyYW1zLCByZXBsYWNlT2JqZWN0UHJvcHMoZGVmYXVsdFR3ZWVuU2V0dGluZ3MsIHBhcmFtcykpO1xuICAgIGluc1BhcmFtcy50YXJnZXRzID0gaW5zUGFyYW1zLnRhcmdldHMgfHwgcGFyYW1zLnRhcmdldHM7XG4gICAgdmFyIHRsRHVyYXRpb24gPSB0bC5kdXJhdGlvbjtcbiAgICBpbnNQYXJhbXMuYXV0b3BsYXkgPSBmYWxzZTtcbiAgICBpbnNQYXJhbXMuZGlyZWN0aW9uID0gdGwuZGlyZWN0aW9uO1xuICAgIGluc1BhcmFtcy50aW1lbGluZU9mZnNldCA9IGlzLnVuZCh0aW1lbGluZU9mZnNldCkgPyB0bER1cmF0aW9uIDogZ2V0UmVsYXRpdmVWYWx1ZSh0aW1lbGluZU9mZnNldCwgdGxEdXJhdGlvbik7XG4gICAgcGFzc1Rocm91Z2godGwpO1xuICAgIHRsLnNlZWsoaW5zUGFyYW1zLnRpbWVsaW5lT2Zmc2V0KTtcbiAgICB2YXIgaW5zID0gYW5pbWUoaW5zUGFyYW1zKTtcbiAgICBwYXNzVGhyb3VnaChpbnMpO1xuICAgIGNoaWxkcmVuLnB1c2goaW5zKTtcbiAgICB2YXIgdGltaW5ncyA9IGdldEluc3RhbmNlVGltaW5ncyhjaGlsZHJlbiwgcGFyYW1zKTtcbiAgICB0bC5kZWxheSA9IHRpbWluZ3MuZGVsYXk7XG4gICAgdGwuZW5kRGVsYXkgPSB0aW1pbmdzLmVuZERlbGF5O1xuICAgIHRsLmR1cmF0aW9uID0gdGltaW5ncy5kdXJhdGlvbjtcbiAgICB0bC5zZWVrKDApO1xuICAgIHRsLnJlc2V0KCk7XG4gICAgaWYgKHRsLmF1dG9wbGF5KSB7IHRsLnBsYXkoKTsgfVxuICAgIHJldHVybiB0bDtcbiAgfTtcbiAgcmV0dXJuIHRsO1xufVxuXG5hbmltZS52ZXJzaW9uID0gJzMuMi4xJztcbmFuaW1lLnNwZWVkID0gMTtcbi8vIFRPRE86I3JldmlldzogbmFtaW5nLCBkb2N1bWVudGF0aW9uXG5hbmltZS5zdXNwZW5kV2hlbkRvY3VtZW50SGlkZGVuID0gdHJ1ZTtcbmFuaW1lLnJ1bm5pbmcgPSBhY3RpdmVJbnN0YW5jZXM7XG5hbmltZS5yZW1vdmUgPSByZW1vdmVUYXJnZXRzRnJvbUFjdGl2ZUluc3RhbmNlcztcbmFuaW1lLmdldCA9IGdldE9yaWdpbmFsVGFyZ2V0VmFsdWU7XG5hbmltZS5zZXQgPSBzZXRUYXJnZXRzVmFsdWU7XG5hbmltZS5jb252ZXJ0UHggPSBjb252ZXJ0UHhUb1VuaXQ7XG5hbmltZS5wYXRoID0gZ2V0UGF0aDtcbmFuaW1lLnNldERhc2hvZmZzZXQgPSBzZXREYXNob2Zmc2V0O1xuYW5pbWUuc3RhZ2dlciA9IHN0YWdnZXI7XG5hbmltZS50aW1lbGluZSA9IHRpbWVsaW5lO1xuYW5pbWUuZWFzaW5nID0gcGFyc2VFYXNpbmdzO1xuYW5pbWUucGVubmVyID0gcGVubmVyO1xuYW5pbWUucmFuZG9tID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7IHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluOyB9O1xuXG5leHBvcnQgZGVmYXVsdCBhbmltZTtcbiIsIi8vIGNhbnZhcy1jb25mZXR0aSB2MS4zLjMgYnVpbHQgb24gMjAyMS0wMS0xNlQyMjo1MDo0Ni45MzJaXG52YXIgbW9kdWxlID0ge307XG5cbi8vIHNvdXJjZSBjb250ZW50XG4oZnVuY3Rpb24gbWFpbihnbG9iYWwsIG1vZHVsZSwgaXNXb3JrZXIsIHdvcmtlclNpemUpIHtcbiAgdmFyIGNhblVzZVdvcmtlciA9ICEhKFxuICAgIGdsb2JhbC5Xb3JrZXIgJiZcbiAgICBnbG9iYWwuQmxvYiAmJlxuICAgIGdsb2JhbC5Qcm9taXNlICYmXG4gICAgZ2xvYmFsLk9mZnNjcmVlbkNhbnZhcyAmJlxuICAgIGdsb2JhbC5PZmZzY3JlZW5DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgJiZcbiAgICBnbG9iYWwuSFRNTENhbnZhc0VsZW1lbnQgJiZcbiAgICBnbG9iYWwuSFRNTENhbnZhc0VsZW1lbnQucHJvdG90eXBlLnRyYW5zZmVyQ29udHJvbFRvT2Zmc2NyZWVuICYmXG4gICAgZ2xvYmFsLlVSTCAmJlxuICAgIGdsb2JhbC5VUkwuY3JlYXRlT2JqZWN0VVJMKTtcblxuICBmdW5jdGlvbiBub29wKCkge31cblxuICAvLyBjcmVhdGUgYSBwcm9taXNlIGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlLCBqdXN0XG4gIC8vIGNhbGwgdGhlIGZ1bmN0aW9uIGRpcmVjdGx5XG4gIGZ1bmN0aW9uIHByb21pc2UoZnVuYykge1xuICAgIHZhciBNb2R1bGVQcm9taXNlID0gbW9kdWxlLmV4cG9ydHMuUHJvbWlzZTtcbiAgICB2YXIgUHJvbSA9IE1vZHVsZVByb21pc2UgIT09IHZvaWQgMCA/IE1vZHVsZVByb21pc2UgOiBnbG9iYWwuUHJvbWlzZTtcblxuICAgIGlmICh0eXBlb2YgUHJvbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIG5ldyBQcm9tKGZ1bmMpO1xuICAgIH1cblxuICAgIGZ1bmMobm9vcCwgbm9vcCk7XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciByYWYgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBUSU1FID0gTWF0aC5mbG9vcigxMDAwIC8gNjApO1xuICAgIHZhciBmcmFtZSwgY2FuY2VsO1xuICAgIHZhciBmcmFtZXMgPSB7fTtcbiAgICB2YXIgbGFzdEZyYW1lVGltZSA9IDA7XG5cbiAgICBpZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGZyYW1lID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHZhciBpZCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICAgICAgZnJhbWVzW2lkXSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiBvbkZyYW1lKHRpbWUpIHtcbiAgICAgICAgICBpZiAobGFzdEZyYW1lVGltZSA9PT0gdGltZSB8fCBsYXN0RnJhbWVUaW1lICsgVElNRSAtIDEgPCB0aW1lKSB7XG4gICAgICAgICAgICBsYXN0RnJhbWVUaW1lID0gdGltZTtcbiAgICAgICAgICAgIGRlbGV0ZSBmcmFtZXNbaWRdO1xuXG4gICAgICAgICAgICBjYigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcmFtZXNbaWRdID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG9uRnJhbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgfTtcbiAgICAgIGNhbmNlbCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICBpZiAoZnJhbWVzW2lkXSkge1xuICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGZyYW1lc1tpZF0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBmcmFtZSA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChjYiwgVElNRSk7XG4gICAgICB9O1xuICAgICAgY2FuY2VsID0gZnVuY3Rpb24gKHRpbWVyKSB7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBmcmFtZTogZnJhbWUsIGNhbmNlbDogY2FuY2VsIH07XG4gIH0oKSk7XG5cbiAgdmFyIGdldFdvcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHdvcmtlcjtcbiAgICB2YXIgcHJvbTtcbiAgICB2YXIgcmVzb2x2ZXMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGRlY29yYXRlKHdvcmtlcikge1xuICAgICAgZnVuY3Rpb24gZXhlY3V0ZShvcHRpb25zLCBjYWxsYmFjaykge1xuICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UoeyBvcHRpb25zOiBvcHRpb25zIHx8IHt9LCBjYWxsYmFjazogY2FsbGJhY2sgfSk7XG4gICAgICB9XG4gICAgICB3b3JrZXIuaW5pdCA9IGZ1bmN0aW9uIGluaXRXb3JrZXIoY2FudmFzKSB7XG4gICAgICAgIHZhciBvZmZzY3JlZW4gPSBjYW52YXMudHJhbnNmZXJDb250cm9sVG9PZmZzY3JlZW4oKTtcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHsgY2FudmFzOiBvZmZzY3JlZW4gfSwgW29mZnNjcmVlbl0pO1xuICAgICAgfTtcblxuICAgICAgd29ya2VyLmZpcmUgPSBmdW5jdGlvbiBmaXJlV29ya2VyKG9wdGlvbnMsIHNpemUsIGRvbmUpIHtcbiAgICAgICAgaWYgKHByb20pIHtcbiAgICAgICAgICBleGVjdXRlKG9wdGlvbnMsIG51bGwpO1xuICAgICAgICAgIHJldHVybiBwcm9tO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7XG5cbiAgICAgICAgcHJvbSA9IHByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgICBmdW5jdGlvbiB3b3JrZXJEb25lKG1zZykge1xuICAgICAgICAgICAgaWYgKG1zZy5kYXRhLmNhbGxiYWNrICE9PSBpZCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGV0ZSByZXNvbHZlc1tpZF07XG4gICAgICAgICAgICB3b3JrZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHdvcmtlckRvbmUpO1xuXG4gICAgICAgICAgICBwcm9tID0gbnVsbDtcbiAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHdvcmtlckRvbmUpO1xuICAgICAgICAgIGV4ZWN1dGUob3B0aW9ucywgaWQpO1xuXG4gICAgICAgICAgcmVzb2x2ZXNbaWRdID0gd29ya2VyRG9uZS5iaW5kKG51bGwsIHsgZGF0YTogeyBjYWxsYmFjazogaWQgfX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcHJvbTtcbiAgICAgIH07XG5cbiAgICAgIHdvcmtlci5yZXNldCA9IGZ1bmN0aW9uIHJlc2V0V29ya2VyKCkge1xuICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UoeyByZXNldDogdHJ1ZSB9KTtcblxuICAgICAgICBmb3IgKHZhciBpZCBpbiByZXNvbHZlcykge1xuICAgICAgICAgIHJlc29sdmVzW2lkXSgpO1xuICAgICAgICAgIGRlbGV0ZSByZXNvbHZlc1tpZF07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh3b3JrZXIpIHtcbiAgICAgICAgcmV0dXJuIHdvcmtlcjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc1dvcmtlciAmJiBjYW5Vc2VXb3JrZXIpIHtcbiAgICAgICAgdmFyIGNvZGUgPSBbXG4gICAgICAgICAgJ3ZhciBDT05GRVRUSSwgU0laRSA9IHt9LCBtb2R1bGUgPSB7fTsnLFxuICAgICAgICAgICcoJyArIG1haW4udG9TdHJpbmcoKSArICcpKHRoaXMsIG1vZHVsZSwgdHJ1ZSwgU0laRSk7JyxcbiAgICAgICAgICAnb25tZXNzYWdlID0gZnVuY3Rpb24obXNnKSB7JyxcbiAgICAgICAgICAnICBpZiAobXNnLmRhdGEub3B0aW9ucykgeycsXG4gICAgICAgICAgJyAgICBDT05GRVRUSShtc2cuZGF0YS5vcHRpb25zKS50aGVuKGZ1bmN0aW9uICgpIHsnLFxuICAgICAgICAgICcgICAgICBpZiAobXNnLmRhdGEuY2FsbGJhY2spIHsnLFxuICAgICAgICAgICcgICAgICAgIHBvc3RNZXNzYWdlKHsgY2FsbGJhY2s6IG1zZy5kYXRhLmNhbGxiYWNrIH0pOycsXG4gICAgICAgICAgJyAgICAgIH0nLFxuICAgICAgICAgICcgICAgfSk7JyxcbiAgICAgICAgICAnICB9IGVsc2UgaWYgKG1zZy5kYXRhLnJlc2V0KSB7JyxcbiAgICAgICAgICAnICAgIENPTkZFVFRJLnJlc2V0KCk7JyxcbiAgICAgICAgICAnICB9IGVsc2UgaWYgKG1zZy5kYXRhLnJlc2l6ZSkgeycsXG4gICAgICAgICAgJyAgICBTSVpFLndpZHRoID0gbXNnLmRhdGEucmVzaXplLndpZHRoOycsXG4gICAgICAgICAgJyAgICBTSVpFLmhlaWdodCA9IG1zZy5kYXRhLnJlc2l6ZS5oZWlnaHQ7JyxcbiAgICAgICAgICAnICB9IGVsc2UgaWYgKG1zZy5kYXRhLmNhbnZhcykgeycsXG4gICAgICAgICAgJyAgICBTSVpFLndpZHRoID0gbXNnLmRhdGEuY2FudmFzLndpZHRoOycsXG4gICAgICAgICAgJyAgICBTSVpFLmhlaWdodCA9IG1zZy5kYXRhLmNhbnZhcy5oZWlnaHQ7JyxcbiAgICAgICAgICAnICAgIENPTkZFVFRJID0gbW9kdWxlLmV4cG9ydHMuY3JlYXRlKG1zZy5kYXRhLmNhbnZhcyk7JyxcbiAgICAgICAgICAnICB9JyxcbiAgICAgICAgICAnfScsXG4gICAgICAgIF0uam9pbignXFxuJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgd29ya2VyID0gbmV3IFdvcmtlcihVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtjb2RlXSkpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgdHlwZW9mIGNvbnNvbGUgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgY29uc29sZS53YXJuID09PSAnZnVuY3Rpb24nID8gY29uc29sZS53YXJuKCfwn46KIENvdWxkIG5vdCBsb2FkIHdvcmtlcicsIGUpIDogbnVsbDtcblxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVjb3JhdGUod29ya2VyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHdvcmtlcjtcbiAgICB9O1xuICB9KSgpO1xuXG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBwYXJ0aWNsZUNvdW50OiA1MCxcbiAgICBhbmdsZTogOTAsXG4gICAgc3ByZWFkOiA0NSxcbiAgICBzdGFydFZlbG9jaXR5OiA0NSxcbiAgICBkZWNheTogMC45LFxuICAgIGdyYXZpdHk6IDEsXG4gICAgdGlja3M6IDIwMCxcbiAgICB4OiAwLjUsXG4gICAgeTogMC41LFxuICAgIHNoYXBlczogWydzcXVhcmUnLCAnY2lyY2xlJ10sXG4gICAgekluZGV4OiAxMDAsXG4gICAgY29sb3JzOiBbXG4gICAgICAnIzI2Y2NmZicsXG4gICAgICAnI2EyNWFmZCcsXG4gICAgICAnI2ZmNWU3ZScsXG4gICAgICAnIzg4ZmY1YScsXG4gICAgICAnI2ZjZmY0MicsXG4gICAgICAnI2ZmYTYyZCcsXG4gICAgICAnI2ZmMzZmZidcbiAgICBdLFxuICAgIC8vIHByb2JhYmx5IHNob3VsZCBiZSB0cnVlLCBidXQgYmFjay1jb21wYXRcbiAgICBkaXNhYmxlRm9yUmVkdWNlZE1vdGlvbjogZmFsc2UsXG4gICAgc2NhbGFyOiAxXG4gIH07XG5cbiAgZnVuY3Rpb24gY29udmVydCh2YWwsIHRyYW5zZm9ybSkge1xuICAgIHJldHVybiB0cmFuc2Zvcm0gPyB0cmFuc2Zvcm0odmFsKSA6IHZhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzT2sodmFsKSB7XG4gICAgcmV0dXJuICEodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb3Aob3B0aW9ucywgbmFtZSwgdHJhbnNmb3JtKSB7XG4gICAgcmV0dXJuIGNvbnZlcnQoXG4gICAgICBvcHRpb25zICYmIGlzT2sob3B0aW9uc1tuYW1lXSkgPyBvcHRpb25zW25hbWVdIDogZGVmYXVsdHNbbmFtZV0sXG4gICAgICB0cmFuc2Zvcm1cbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gb25seVBvc2l0aXZlSW50KG51bWJlcil7XG4gICAgcmV0dXJuIG51bWJlciA8IDAgPyAwIDogTWF0aC5mbG9vcihudW1iZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tSW50KG1pbiwgbWF4KSB7XG4gICAgLy8gW21pbiwgbWF4KVxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW47XG4gIH1cblxuICBmdW5jdGlvbiB0b0RlY2ltYWwoc3RyKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50KHN0ciwgMTYpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29sb3JzVG9SZ2IoY29sb3JzKSB7XG4gICAgcmV0dXJuIGNvbG9ycy5tYXAoaGV4VG9SZ2IpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGV4VG9SZ2Ioc3RyKSB7XG4gICAgdmFyIHZhbCA9IFN0cmluZyhzdHIpLnJlcGxhY2UoL1teMC05YS1mXS9naSwgJycpO1xuXG4gICAgaWYgKHZhbC5sZW5ndGggPCA2KSB7XG4gICAgICAgIHZhbCA9IHZhbFswXSt2YWxbMF0rdmFsWzFdK3ZhbFsxXSt2YWxbMl0rdmFsWzJdO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICByOiB0b0RlY2ltYWwodmFsLnN1YnN0cmluZygwLDIpKSxcbiAgICAgIGc6IHRvRGVjaW1hbCh2YWwuc3Vic3RyaW5nKDIsNCkpLFxuICAgICAgYjogdG9EZWNpbWFsKHZhbC5zdWJzdHJpbmcoNCw2KSlcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0T3JpZ2luKG9wdGlvbnMpIHtcbiAgICB2YXIgb3JpZ2luID0gcHJvcChvcHRpb25zLCAnb3JpZ2luJywgT2JqZWN0KTtcbiAgICBvcmlnaW4ueCA9IHByb3Aob3JpZ2luLCAneCcsIE51bWJlcik7XG4gICAgb3JpZ2luLnkgPSBwcm9wKG9yaWdpbiwgJ3knLCBOdW1iZXIpO1xuXG4gICAgcmV0dXJuIG9yaWdpbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldENhbnZhc1dpbmRvd1NpemUoY2FudmFzKSB7XG4gICAgY2FudmFzLndpZHRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0Q2FudmFzUmVjdFNpemUoY2FudmFzKSB7XG4gICAgdmFyIHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY2FudmFzLndpZHRoID0gcmVjdC53aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gcmVjdC5oZWlnaHQ7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDYW52YXMoekluZGV4KSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXG4gICAgY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICBjYW52YXMuc3R5bGUudG9wID0gJzBweCc7XG4gICAgY2FudmFzLnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgICBjYW52YXMuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICBjYW52YXMuc3R5bGUuekluZGV4ID0gekluZGV4O1xuXG4gICAgcmV0dXJuIGNhbnZhcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGVsbGlwc2UoY29udGV4dCwgeCwgeSwgcmFkaXVzWCwgcmFkaXVzWSwgcm90YXRpb24sIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpQ2xvY2t3aXNlKSB7XG4gICAgY29udGV4dC5zYXZlKCk7XG4gICAgY29udGV4dC50cmFuc2xhdGUoeCwgeSk7XG4gICAgY29udGV4dC5yb3RhdGUocm90YXRpb24pO1xuICAgIGNvbnRleHQuc2NhbGUocmFkaXVzWCwgcmFkaXVzWSk7XG4gICAgY29udGV4dC5hcmMoMCwgMCwgMSwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGlDbG9ja3dpc2UpO1xuICAgIGNvbnRleHQucmVzdG9yZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tUGh5c2ljcyhvcHRzKSB7XG4gICAgdmFyIHJhZEFuZ2xlID0gb3B0cy5hbmdsZSAqIChNYXRoLlBJIC8gMTgwKTtcbiAgICB2YXIgcmFkU3ByZWFkID0gb3B0cy5zcHJlYWQgKiAoTWF0aC5QSSAvIDE4MCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogb3B0cy54LFxuICAgICAgeTogb3B0cy55LFxuICAgICAgd29iYmxlOiBNYXRoLnJhbmRvbSgpICogMTAsXG4gICAgICB2ZWxvY2l0eTogKG9wdHMuc3RhcnRWZWxvY2l0eSAqIDAuNSkgKyAoTWF0aC5yYW5kb20oKSAqIG9wdHMuc3RhcnRWZWxvY2l0eSksXG4gICAgICBhbmdsZTJEOiAtcmFkQW5nbGUgKyAoKDAuNSAqIHJhZFNwcmVhZCkgLSAoTWF0aC5yYW5kb20oKSAqIHJhZFNwcmVhZCkpLFxuICAgICAgdGlsdEFuZ2xlOiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSxcbiAgICAgIGNvbG9yOiBvcHRzLmNvbG9yLFxuICAgICAgc2hhcGU6IG9wdHMuc2hhcGUsXG4gICAgICB0aWNrOiAwLFxuICAgICAgdG90YWxUaWNrczogb3B0cy50aWNrcyxcbiAgICAgIGRlY2F5OiBvcHRzLmRlY2F5LFxuICAgICAgcmFuZG9tOiBNYXRoLnJhbmRvbSgpICsgNSxcbiAgICAgIHRpbHRTaW46IDAsXG4gICAgICB0aWx0Q29zOiAwLFxuICAgICAgd29iYmxlWDogMCxcbiAgICAgIHdvYmJsZVk6IDAsXG4gICAgICBncmF2aXR5OiBvcHRzLmdyYXZpdHkgKiAzLFxuICAgICAgb3ZhbFNjYWxhcjogMC42LFxuICAgICAgc2NhbGFyOiBvcHRzLnNjYWxhclxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVGZXR0aShjb250ZXh0LCBmZXR0aSkge1xuICAgIGZldHRpLnggKz0gTWF0aC5jb3MoZmV0dGkuYW5nbGUyRCkgKiBmZXR0aS52ZWxvY2l0eTtcbiAgICBmZXR0aS55ICs9IE1hdGguc2luKGZldHRpLmFuZ2xlMkQpICogZmV0dGkudmVsb2NpdHkgKyBmZXR0aS5ncmF2aXR5O1xuICAgIGZldHRpLndvYmJsZSArPSAwLjE7XG4gICAgZmV0dGkudmVsb2NpdHkgKj0gZmV0dGkuZGVjYXk7XG4gICAgZmV0dGkudGlsdEFuZ2xlICs9IDAuMTtcbiAgICBmZXR0aS50aWx0U2luID0gTWF0aC5zaW4oZmV0dGkudGlsdEFuZ2xlKTtcbiAgICBmZXR0aS50aWx0Q29zID0gTWF0aC5jb3MoZmV0dGkudGlsdEFuZ2xlKTtcbiAgICBmZXR0aS5yYW5kb20gPSBNYXRoLnJhbmRvbSgpICsgNTtcbiAgICBmZXR0aS53b2JibGVYID0gZmV0dGkueCArICgoMTAgKiBmZXR0aS5zY2FsYXIpICogTWF0aC5jb3MoZmV0dGkud29iYmxlKSk7XG4gICAgZmV0dGkud29iYmxlWSA9IGZldHRpLnkgKyAoKDEwICogZmV0dGkuc2NhbGFyKSAqIE1hdGguc2luKGZldHRpLndvYmJsZSkpO1xuXG4gICAgdmFyIHByb2dyZXNzID0gKGZldHRpLnRpY2srKykgLyBmZXR0aS50b3RhbFRpY2tzO1xuXG4gICAgdmFyIHgxID0gZmV0dGkueCArIChmZXR0aS5yYW5kb20gKiBmZXR0aS50aWx0Q29zKTtcbiAgICB2YXIgeTEgPSBmZXR0aS55ICsgKGZldHRpLnJhbmRvbSAqIGZldHRpLnRpbHRTaW4pO1xuICAgIHZhciB4MiA9IGZldHRpLndvYmJsZVggKyAoZmV0dGkucmFuZG9tICogZmV0dGkudGlsdENvcyk7XG4gICAgdmFyIHkyID0gZmV0dGkud29iYmxlWSArIChmZXR0aS5yYW5kb20gKiBmZXR0aS50aWx0U2luKTtcblxuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJ3JnYmEoJyArIGZldHRpLmNvbG9yLnIgKyAnLCAnICsgZmV0dGkuY29sb3IuZyArICcsICcgKyBmZXR0aS5jb2xvci5iICsgJywgJyArICgxIC0gcHJvZ3Jlc3MpICsgJyknO1xuICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG5cbiAgICBpZiAoZmV0dGkuc2hhcGUgPT09ICdjaXJjbGUnKSB7XG4gICAgICBjb250ZXh0LmVsbGlwc2UgP1xuICAgICAgICBjb250ZXh0LmVsbGlwc2UoZmV0dGkueCwgZmV0dGkueSwgTWF0aC5hYnMoeDIgLSB4MSkgKiBmZXR0aS5vdmFsU2NhbGFyLCBNYXRoLmFicyh5MiAtIHkxKSAqIGZldHRpLm92YWxTY2FsYXIsIE1hdGguUEkgLyAxMCAqIGZldHRpLndvYmJsZSwgMCwgMiAqIE1hdGguUEkpIDpcbiAgICAgICAgZWxsaXBzZShjb250ZXh0LCBmZXR0aS54LCBmZXR0aS55LCBNYXRoLmFicyh4MiAtIHgxKSAqIGZldHRpLm92YWxTY2FsYXIsIE1hdGguYWJzKHkyIC0geTEpICogZmV0dGkub3ZhbFNjYWxhciwgTWF0aC5QSSAvIDEwICogZmV0dGkud29iYmxlLCAwLCAyICogTWF0aC5QSSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQubW92ZVRvKE1hdGguZmxvb3IoZmV0dGkueCksIE1hdGguZmxvb3IoZmV0dGkueSkpO1xuICAgICAgY29udGV4dC5saW5lVG8oTWF0aC5mbG9vcihmZXR0aS53b2JibGVYKSwgTWF0aC5mbG9vcih5MSkpO1xuICAgICAgY29udGV4dC5saW5lVG8oTWF0aC5mbG9vcih4MiksIE1hdGguZmxvb3IoeTIpKTtcbiAgICAgIGNvbnRleHQubGluZVRvKE1hdGguZmxvb3IoeDEpLCBNYXRoLmZsb29yKGZldHRpLndvYmJsZVkpKTtcbiAgICB9XG5cbiAgICBjb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgIGNvbnRleHQuZmlsbCgpO1xuXG4gICAgcmV0dXJuIGZldHRpLnRpY2sgPCBmZXR0aS50b3RhbFRpY2tzO1xuICB9XG5cbiAgZnVuY3Rpb24gYW5pbWF0ZShjYW52YXMsIGZldHRpcywgcmVzaXplciwgc2l6ZSwgZG9uZSkge1xuICAgIHZhciBhbmltYXRpbmdGZXR0aXMgPSBmZXR0aXMuc2xpY2UoKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHZhciBhbmltYXRpb25GcmFtZTtcbiAgICB2YXIgZGVzdHJveTtcblxuICAgIHZhciBwcm9tID0gcHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgZnVuY3Rpb24gb25Eb25lKCkge1xuICAgICAgICBhbmltYXRpb25GcmFtZSA9IGRlc3Ryb3kgPSBudWxsO1xuXG4gICAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KTtcblxuICAgICAgICBkb25lKCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICAgICBpZiAoaXNXb3JrZXIgJiYgIShzaXplLndpZHRoID09PSB3b3JrZXJTaXplLndpZHRoICYmIHNpemUuaGVpZ2h0ID09PSB3b3JrZXJTaXplLmhlaWdodCkpIHtcbiAgICAgICAgICBzaXplLndpZHRoID0gY2FudmFzLndpZHRoID0gd29ya2VyU2l6ZS53aWR0aDtcbiAgICAgICAgICBzaXplLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQgPSB3b3JrZXJTaXplLmhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2l6ZS53aWR0aCAmJiAhc2l6ZS5oZWlnaHQpIHtcbiAgICAgICAgICByZXNpemVyKGNhbnZhcyk7XG4gICAgICAgICAgc2l6ZS53aWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgICAgICBzaXplLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBzaXplLndpZHRoLCBzaXplLmhlaWdodCk7XG5cbiAgICAgICAgYW5pbWF0aW5nRmV0dGlzID0gYW5pbWF0aW5nRmV0dGlzLmZpbHRlcihmdW5jdGlvbiAoZmV0dGkpIHtcbiAgICAgICAgICByZXR1cm4gdXBkYXRlRmV0dGkoY29udGV4dCwgZmV0dGkpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoYW5pbWF0aW5nRmV0dGlzLmxlbmd0aCkge1xuICAgICAgICAgIGFuaW1hdGlvbkZyYW1lID0gcmFmLmZyYW1lKHVwZGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb25Eb25lKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYW5pbWF0aW9uRnJhbWUgPSByYWYuZnJhbWUodXBkYXRlKTtcbiAgICAgIGRlc3Ryb3kgPSBvbkRvbmU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWRkRmV0dGlzOiBmdW5jdGlvbiAoZmV0dGlzKSB7XG4gICAgICAgIGFuaW1hdGluZ0ZldHRpcyA9IGFuaW1hdGluZ0ZldHRpcy5jb25jYXQoZmV0dGlzKTtcblxuICAgICAgICByZXR1cm4gcHJvbTtcbiAgICAgIH0sXG4gICAgICBjYW52YXM6IGNhbnZhcyxcbiAgICAgIHByb21pc2U6IHByb20sXG4gICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgICAgICByYWYuY2FuY2VsKGFuaW1hdGlvbkZyYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkZXN0cm95KSB7XG4gICAgICAgICAgZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbmZldHRpQ2Fubm9uKGNhbnZhcywgZ2xvYmFsT3B0cykge1xuICAgIHZhciBpc0xpYkNhbnZhcyA9ICFjYW52YXM7XG4gICAgdmFyIGFsbG93UmVzaXplID0gISFwcm9wKGdsb2JhbE9wdHMgfHwge30sICdyZXNpemUnKTtcbiAgICB2YXIgZ2xvYmFsRGlzYWJsZUZvclJlZHVjZWRNb3Rpb24gPSBwcm9wKGdsb2JhbE9wdHMsICdkaXNhYmxlRm9yUmVkdWNlZE1vdGlvbicsIEJvb2xlYW4pO1xuICAgIHZhciBzaG91bGRVc2VXb3JrZXIgPSBjYW5Vc2VXb3JrZXIgJiYgISFwcm9wKGdsb2JhbE9wdHMgfHwge30sICd1c2VXb3JrZXInKTtcbiAgICB2YXIgd29ya2VyID0gc2hvdWxkVXNlV29ya2VyID8gZ2V0V29ya2VyKCkgOiBudWxsO1xuICAgIHZhciByZXNpemVyID0gaXNMaWJDYW52YXMgPyBzZXRDYW52YXNXaW5kb3dTaXplIDogc2V0Q2FudmFzUmVjdFNpemU7XG4gICAgdmFyIGluaXRpYWxpemVkID0gKGNhbnZhcyAmJiB3b3JrZXIpID8gISFjYW52YXMuX19jb25mZXR0aV9pbml0aWFsaXplZCA6IGZhbHNlO1xuICAgIHZhciBwcmVmZXJMZXNzTW90aW9uID0gdHlwZW9mIG1hdGNoTWVkaWEgPT09ICdmdW5jdGlvbicgJiYgbWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb24pJykubWF0Y2hlcztcbiAgICB2YXIgYW5pbWF0aW9uT2JqO1xuXG4gICAgZnVuY3Rpb24gZmlyZUxvY2FsKG9wdGlvbnMsIHNpemUsIGRvbmUpIHtcbiAgICAgIHZhciBwYXJ0aWNsZUNvdW50ID0gcHJvcChvcHRpb25zLCAncGFydGljbGVDb3VudCcsIG9ubHlQb3NpdGl2ZUludCk7XG4gICAgICB2YXIgYW5nbGUgPSBwcm9wKG9wdGlvbnMsICdhbmdsZScsIE51bWJlcik7XG4gICAgICB2YXIgc3ByZWFkID0gcHJvcChvcHRpb25zLCAnc3ByZWFkJywgTnVtYmVyKTtcbiAgICAgIHZhciBzdGFydFZlbG9jaXR5ID0gcHJvcChvcHRpb25zLCAnc3RhcnRWZWxvY2l0eScsIE51bWJlcik7XG4gICAgICB2YXIgZGVjYXkgPSBwcm9wKG9wdGlvbnMsICdkZWNheScsIE51bWJlcik7XG4gICAgICB2YXIgZ3Jhdml0eSA9IHByb3Aob3B0aW9ucywgJ2dyYXZpdHknLCBOdW1iZXIpO1xuICAgICAgdmFyIGNvbG9ycyA9IHByb3Aob3B0aW9ucywgJ2NvbG9ycycsIGNvbG9yc1RvUmdiKTtcbiAgICAgIHZhciB0aWNrcyA9IHByb3Aob3B0aW9ucywgJ3RpY2tzJywgTnVtYmVyKTtcbiAgICAgIHZhciBzaGFwZXMgPSBwcm9wKG9wdGlvbnMsICdzaGFwZXMnKTtcbiAgICAgIHZhciBzY2FsYXIgPSBwcm9wKG9wdGlvbnMsICdzY2FsYXInKTtcbiAgICAgIHZhciBvcmlnaW4gPSBnZXRPcmlnaW4ob3B0aW9ucyk7XG5cbiAgICAgIHZhciB0ZW1wID0gcGFydGljbGVDb3VudDtcbiAgICAgIHZhciBmZXR0aXMgPSBbXTtcblxuICAgICAgdmFyIHN0YXJ0WCA9IGNhbnZhcy53aWR0aCAqIG9yaWdpbi54O1xuICAgICAgdmFyIHN0YXJ0WSA9IGNhbnZhcy5oZWlnaHQgKiBvcmlnaW4ueTtcblxuICAgICAgd2hpbGUgKHRlbXAtLSkge1xuICAgICAgICBmZXR0aXMucHVzaChcbiAgICAgICAgICByYW5kb21QaHlzaWNzKHtcbiAgICAgICAgICAgIHg6IHN0YXJ0WCxcbiAgICAgICAgICAgIHk6IHN0YXJ0WSxcbiAgICAgICAgICAgIGFuZ2xlOiBhbmdsZSxcbiAgICAgICAgICAgIHNwcmVhZDogc3ByZWFkLFxuICAgICAgICAgICAgc3RhcnRWZWxvY2l0eTogc3RhcnRWZWxvY2l0eSxcbiAgICAgICAgICAgIGNvbG9yOiBjb2xvcnNbdGVtcCAlIGNvbG9ycy5sZW5ndGhdLFxuICAgICAgICAgICAgc2hhcGU6IHNoYXBlc1tyYW5kb21JbnQoMCwgc2hhcGVzLmxlbmd0aCldLFxuICAgICAgICAgICAgdGlja3M6IHRpY2tzLFxuICAgICAgICAgICAgZGVjYXk6IGRlY2F5LFxuICAgICAgICAgICAgZ3Jhdml0eTogZ3Jhdml0eSxcbiAgICAgICAgICAgIHNjYWxhcjogc2NhbGFyXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYgd2UgaGF2ZSBhIHByZXZpb3VzIGNhbnZhcyBhbHJlYWR5IGFuaW1hdGluZyxcbiAgICAgIC8vIGFkZCB0byBpdFxuICAgICAgaWYgKGFuaW1hdGlvbk9iaikge1xuICAgICAgICByZXR1cm4gYW5pbWF0aW9uT2JqLmFkZEZldHRpcyhmZXR0aXMpO1xuICAgICAgfVxuXG4gICAgICBhbmltYXRpb25PYmogPSBhbmltYXRlKGNhbnZhcywgZmV0dGlzLCByZXNpemVyLCBzaXplICwgZG9uZSk7XG5cbiAgICAgIHJldHVybiBhbmltYXRpb25PYmoucHJvbWlzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaXJlKG9wdGlvbnMpIHtcbiAgICAgIHZhciBkaXNhYmxlRm9yUmVkdWNlZE1vdGlvbiA9IGdsb2JhbERpc2FibGVGb3JSZWR1Y2VkTW90aW9uIHx8IHByb3Aob3B0aW9ucywgJ2Rpc2FibGVGb3JSZWR1Y2VkTW90aW9uJywgQm9vbGVhbik7XG4gICAgICB2YXIgekluZGV4ID0gcHJvcChvcHRpb25zLCAnekluZGV4JywgTnVtYmVyKTtcblxuICAgICAgaWYgKGRpc2FibGVGb3JSZWR1Y2VkTW90aW9uICYmIHByZWZlckxlc3NNb3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNMaWJDYW52YXMgJiYgYW5pbWF0aW9uT2JqKSB7XG4gICAgICAgIC8vIHVzZSBleGlzdGluZyBjYW52YXMgZnJvbSBpbi1wcm9ncmVzcyBhbmltYXRpb25cbiAgICAgICAgY2FudmFzID0gYW5pbWF0aW9uT2JqLmNhbnZhcztcbiAgICAgIH0gZWxzZSBpZiAoaXNMaWJDYW52YXMgJiYgIWNhbnZhcykge1xuICAgICAgICAvLyBjcmVhdGUgYW5kIGluaXRpYWxpemUgYSBuZXcgY2FudmFzXG4gICAgICAgIGNhbnZhcyA9IGdldENhbnZhcyh6SW5kZXgpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChhbGxvd1Jlc2l6ZSAmJiAhaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgc2l6ZSBvZiBhIHVzZXItc3VwcGxpZWQgY2FudmFzXG4gICAgICAgIHJlc2l6ZXIoY2FudmFzKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNpemUgPSB7XG4gICAgICAgIHdpZHRoOiBjYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogY2FudmFzLmhlaWdodFxuICAgICAgfTtcblxuICAgICAgaWYgKHdvcmtlciAmJiAhaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgd29ya2VyLmluaXQoY2FudmFzKTtcbiAgICAgIH1cblxuICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgICBpZiAod29ya2VyKSB7XG4gICAgICAgIGNhbnZhcy5fX2NvbmZldHRpX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25SZXNpemUoKSB7XG4gICAgICAgIGlmICh3b3JrZXIpIHtcbiAgICAgICAgICAvLyBUT0RPIHRoaXMgcmVhbGx5IHNob3VsZG4ndCBiZSBpbW1lZGlhdGUsIGJlY2F1c2UgaXQgaXMgZXhwZW5zaXZlXG4gICAgICAgICAgdmFyIG9iaiA9IHtcbiAgICAgICAgICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAoIWlzTGliQ2FudmFzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICByZXNpemVyKG9iaik7XG5cbiAgICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgcmVzaXplOiB7XG4gICAgICAgICAgICAgIHdpZHRoOiBvYmoud2lkdGgsXG4gICAgICAgICAgICAgIGhlaWdodDogb2JqLmhlaWdodFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRvbid0IGFjdHVhbGx5IHF1ZXJ5IHRoZSBzaXplIGhlcmUsIHNpbmNlIHRoaXNcbiAgICAgICAgLy8gY2FuIGV4ZWN1dGUgZnJlcXVlbnRseSBhbmQgcmFwaWRseVxuICAgICAgICBzaXplLndpZHRoID0gc2l6ZS5oZWlnaHQgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBkb25lKCkge1xuICAgICAgICBhbmltYXRpb25PYmogPSBudWxsO1xuXG4gICAgICAgIGlmIChhbGxvd1Jlc2l6ZSkge1xuICAgICAgICAgIGdsb2JhbC5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvblJlc2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNMaWJDYW52YXMgJiYgY2FudmFzKSB7XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChjYW52YXMpO1xuICAgICAgICAgIGNhbnZhcyA9IG51bGw7XG4gICAgICAgICAgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYWxsb3dSZXNpemUpIHtcbiAgICAgICAgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uUmVzaXplLCBmYWxzZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh3b3JrZXIpIHtcbiAgICAgICAgcmV0dXJuIHdvcmtlci5maXJlKG9wdGlvbnMsIHNpemUsIGRvbmUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmlyZUxvY2FsKG9wdGlvbnMsIHNpemUsIGRvbmUpO1xuICAgIH1cblxuICAgIGZpcmUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAod29ya2VyKSB7XG4gICAgICAgIHdvcmtlci5yZXNldCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoYW5pbWF0aW9uT2JqKSB7XG4gICAgICAgIGFuaW1hdGlvbk9iai5yZXNldCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZmlyZTtcbiAgfVxuXG4gIG1vZHVsZS5leHBvcnRzID0gY29uZmV0dGlDYW5ub24obnVsbCwgeyB1c2VXb3JrZXI6IHRydWUsIHJlc2l6ZTogdHJ1ZSB9KTtcbiAgbW9kdWxlLmV4cG9ydHMuY3JlYXRlID0gY29uZmV0dGlDYW5ub247XG59KChmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiB3aW5kb3c7XG4gIH1cblxuICBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICByZXR1cm4gdGhpcyB8fCB7fTtcbn0pKCksIG1vZHVsZSwgZmFsc2UpKTtcblxuLy8gZW5kIHNvdXJjZSBjb250ZW50XG5cbmV4cG9ydCBkZWZhdWx0IG1vZHVsZS5leHBvcnRzO1xuZXhwb3J0IHZhciBjcmVhdGUgPSBtb2R1bGUuZXhwb3J0cy5jcmVhdGU7XG4iLCIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbmV4cG9ydCB7fTsiLCJpbXBvcnQgYW5pbWUgZnJvbSAnLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2FuaW1lanMvbGliL2FuaW1lLmVzLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gYW5pbWVCbG9ja3MoKSB7XG5cdC8vIHZpc3VhbGl6ZXJcblx0Y29uc3Qgc3RhZ2dlclZpc3VhbGl6ZXJFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG5cdFx0Jy5zdGFnZ2VyLXZpc3VhbGl6ZXInXG5cdCk7XG5cdGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRjb25zdCBncmlkID0gWzE3LCAxN107XG5cdGNvbnN0IGNvbCA9IGdyaWRbMF07XG5cdGNvbnN0IHJvdyA9IGdyaWRbMV07XG5cdGNvbnN0IG51bWJlck9mRWxlbWVudHMgPSBjb2wgKiByb3c7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZkVsZW1lbnRzOyBpKyspIHtcblx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSk7XG5cdH1cblxuXHRzdGFnZ2VyVmlzdWFsaXplckVsLmFwcGVuZENoaWxkKGZyYWdtZW50KTtcblxuXHRjb25zdCBzdGFnZ2Vyc0FuaW1hdGlvbiA9IGFuaW1lXG5cdFx0LnRpbWVsaW5lKHtcblx0XHRcdHRhcmdldHM6ICcuc3RhZ2dlci12aXN1YWxpemVyIGRpdicsXG5cdFx0XHRlYXNpbmc6ICdlYXNlSW5PdXRTaW5lJyxcblx0XHRcdGRlbGF5OiBhbmltZS5zdGFnZ2VyKDUwKSxcblx0XHRcdGxvb3A6IHRydWUsXG5cdFx0XHRhdXRvcGxheTogZmFsc2UsXG5cdFx0fSlcblx0XHQuYWRkKHtcblx0XHRcdHRyYW5zbGF0ZVg6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhbHVlOiBhbmltZS5zdGFnZ2VyKCctLjFyZW0nLCB7XG5cdFx0XHRcdFx0XHRncmlkOiBncmlkLFxuXHRcdFx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHRcdFx0XHRheGlzOiAneCcsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YWx1ZTogYW5pbWUuc3RhZ2dlcignLjFyZW0nLCB7XG5cdFx0XHRcdFx0XHRncmlkOiBncmlkLFxuXHRcdFx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHRcdFx0XHRheGlzOiAneCcsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdFx0dHJhbnNsYXRlWTogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFsdWU6IGFuaW1lLnN0YWdnZXIoJy0uMXJlbScsIHtcblx0XHRcdFx0XHRcdGdyaWQ6IGdyaWQsXG5cdFx0XHRcdFx0XHRmcm9tOiAnY2VudGVyJyxcblx0XHRcdFx0XHRcdGF4aXM6ICd5Jyxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhbHVlOiBhbmltZS5zdGFnZ2VyKCcuMXJlbScsIHtcblx0XHRcdFx0XHRcdGdyaWQ6IGdyaWQsXG5cdFx0XHRcdFx0XHRmcm9tOiAnY2VudGVyJyxcblx0XHRcdFx0XHRcdGF4aXM6ICd5Jyxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0XHRkdXJhdGlvbjogMTAwMCxcblx0XHRcdHNjYWxlOiAwLjUsXG5cdFx0XHRkZWxheTogYW5pbWUuc3RhZ2dlcigxMDAsIHtcblx0XHRcdFx0Z3JpZDogZ3JpZCxcblx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHR9KSxcblx0XHR9KVxuXHRcdC5hZGQoe1xuXHRcdFx0dHJhbnNsYXRlWDogKCkgPT4gYW5pbWUucmFuZG9tKC0xMCwgMTApLFxuXHRcdFx0dHJhbnNsYXRlWTogKCkgPT4gYW5pbWUucmFuZG9tKC0xMCwgMTApLFxuXHRcdFx0ZGVsYXk6IGFuaW1lLnN0YWdnZXIoOCwgeyBmcm9tOiAnbGFzdCcgfSksXG5cdFx0fSlcblx0XHQuYWRkKHtcblx0XHRcdHRyYW5zbGF0ZVg6IGFuaW1lLnN0YWdnZXIoJy4yNXJlbScsIHtcblx0XHRcdFx0Z3JpZDogZ3JpZCxcblx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHRcdGF4aXM6ICd4Jyxcblx0XHRcdH0pLFxuXHRcdFx0dHJhbnNsYXRlWTogYW5pbWUuc3RhZ2dlcignLjI1cmVtJywge1xuXHRcdFx0XHRncmlkOiBncmlkLFxuXHRcdFx0XHRmcm9tOiAnY2VudGVyJyxcblx0XHRcdFx0YXhpczogJ3knLFxuXHRcdFx0fSksXG5cdFx0XHRyb3RhdGU6IDAsXG5cdFx0XHRzY2FsZVg6IDIuNSxcblx0XHRcdHNjYWxlWTogMC4yNSxcblx0XHRcdGRlbGF5OiBhbmltZS5zdGFnZ2VyKDQsIHsgZnJvbTogJ2NlbnRlcicgfSksXG5cdFx0fSlcblx0XHQuYWRkKHtcblx0XHRcdHJvdGF0ZTogYW5pbWUuc3RhZ2dlcihbOTAsIDBdLCB7XG5cdFx0XHRcdGdyaWQ6IGdyaWQsXG5cdFx0XHRcdGZyb206ICdjZW50ZXInLFxuXHRcdFx0fSksXG5cdFx0XHRkZWxheTogYW5pbWUuc3RhZ2dlcig1MCwge1xuXHRcdFx0XHRncmlkOiBncmlkLFxuXHRcdFx0XHRmcm9tOiAnY2VudGVyJyxcblx0XHRcdH0pLFxuXHRcdH0pXG5cdFx0LmFkZCh7XG5cdFx0XHR0cmFuc2xhdGVYOiAwLFxuXHRcdFx0dHJhbnNsYXRlWTogMCxcblx0XHRcdHNjYWxlOiAwLjUsXG5cdFx0XHRzY2FsZVg6IDEsXG5cdFx0XHRyb3RhdGU6IDE4MCxcblx0XHRcdGR1cmF0aW9uOiAxMDAwLFxuXHRcdFx0ZGVsYXk6IGFuaW1lLnN0YWdnZXIoMTAwLCB7XG5cdFx0XHRcdGdyaWQ6IGdyaWQsXG5cdFx0XHRcdGZyb206ICdjZW50ZXInLFxuXHRcdFx0fSksXG5cdFx0fSlcblx0XHQuYWRkKHtcblx0XHRcdHNjYWxlWTogMSxcblx0XHRcdHNjYWxlOiAxLFxuXHRcdFx0ZGVsYXk6IGFuaW1lLnN0YWdnZXIoMjAsIHtcblx0XHRcdFx0Z3JpZDogZ3JpZCxcblx0XHRcdFx0ZnJvbTogJ2NlbnRlcicsXG5cdFx0XHR9KSxcblx0XHR9KTtcblxuXHRzdGFnZ2Vyc0FuaW1hdGlvbi5wbGF5KCk7XG59XG4iLCJpbXBvcnQgYW5pbWUgZnJvbSAnLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2FuaW1lanMvbGliL2FuaW1lLmVzLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29sb3JTcGxhc2goKSB7XG5cdC8vIFNwbGFzaCBvZiBjb2xvclxuXHR2YXIgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjJyk7XG5cdHZhciBjdHggPSBjLmdldENvbnRleHQoJzJkJyk7XG5cdHZhciBjSDtcblx0dmFyIGNXO1xuXHR2YXIgYmdDb2xvciA9ICcjMDAwJztcblx0dmFyIGFuaW1hdGlvbnMgPSBbXTtcblx0dmFyIGNpcmNsZXMgPSBbXTtcblxuXHR2YXIgY29sb3JQaWNrZXIgPSAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjb2xvcnMgPSBbJyNGRjYxMzgnLCAnI0ZGQkU1MycsICcjMjk4MEI5JywgJyMyODI3NDEnXTtcblx0XHR2YXIgaW5kZXggPSAwO1xuXHRcdGZ1bmN0aW9uIG5leHQoKSB7XG5cdFx0XHRpbmRleCA9IGluZGV4KysgPCBjb2xvcnMubGVuZ3RoIC0gMSA/IGluZGV4IDogMDtcblx0XHRcdHJldHVybiBjb2xvcnNbaW5kZXhdO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBjdXJyZW50KCkge1xuXHRcdFx0cmV0dXJuIGNvbG9yc1tpbmRleF07XG5cdFx0fVxuXHRcdHJldHVybiB7XG5cdFx0XHRuZXh0OiBuZXh0LFxuXHRcdFx0Y3VycmVudDogY3VycmVudCxcblx0XHR9O1xuXHR9KSgpO1xuXG5cdGZ1bmN0aW9uIHJlbW92ZUFuaW1hdGlvbihhbmltYXRpb24pIHtcblx0XHR2YXIgaW5kZXggPSBhbmltYXRpb25zLmluZGV4T2YoYW5pbWF0aW9uKTtcblx0XHRpZiAoaW5kZXggPiAtMSkgYW5pbWF0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FsY1BhZ2VGaWxsUmFkaXVzKHgsIHkpIHtcblx0XHR2YXIgbCA9IE1hdGgubWF4KHggLSAwLCBjVyAtIHgpO1xuXHRcdHZhciBoID0gTWF0aC5tYXgoeSAtIDAsIGNIIC0geSk7XG5cdFx0cmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhsLCAyKSArIE1hdGgucG93KGgsIDIpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFkZENsaWNrTGlzdGVuZXJzKCkge1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBoYW5kbGVFdmVudCk7XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlRXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlRXZlbnQoZSkge1xuXHRcdGlmIChlLnRvdWNoZXMpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGUgPSBlLnRvdWNoZXNbMF07XG5cdFx0fVxuXHRcdHZhciBjdXJyZW50Q29sb3IgPSBjb2xvclBpY2tlci5jdXJyZW50KCk7XG5cdFx0dmFyIG5leHRDb2xvciA9IGNvbG9yUGlja2VyLm5leHQoKTtcblx0XHR2YXIgdGFyZ2V0UiA9IGNhbGNQYWdlRmlsbFJhZGl1cyhlLnBhZ2VYLCBlLnBhZ2VZKTtcblx0XHR2YXIgcmlwcGxlU2l6ZSA9IE1hdGgubWluKDIwMCwgY1cgKiAwLjQpO1xuXHRcdHZhciBtaW5Db3ZlckR1cmF0aW9uID0gNzUwO1xuXG5cdFx0dmFyIHBhZ2VGaWxsID0gbmV3IENpcmNsZSh7XG5cdFx0XHR4OiBlLmNsaWVudFgsXG5cdFx0XHR5OiBlLmNsaWVudFksXG5cdFx0XHRyOiAwLFxuXHRcdFx0ZmlsbDogbmV4dENvbG9yLFxuXHRcdH0pO1xuXHRcdHZhciBmaWxsQW5pbWF0aW9uID0gYW5pbWUoe1xuXHRcdFx0dGFyZ2V0czogcGFnZUZpbGwsXG5cdFx0XHRyOiB0YXJnZXRSLFxuXHRcdFx0ZHVyYXRpb246IE1hdGgubWF4KHRhcmdldFIgLyAyLCBtaW5Db3ZlckR1cmF0aW9uKSxcblx0XHRcdGVhc2luZzogJ2Vhc2VPdXRRdWFydCcsXG5cdFx0XHRjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRiZ0NvbG9yID0gcGFnZUZpbGwuZmlsbDtcblx0XHRcdFx0cmVtb3ZlQW5pbWF0aW9uKGZpbGxBbmltYXRpb24pO1xuXHRcdFx0fSxcblx0XHR9KTtcblxuXHRcdHZhciByaXBwbGUgPSBuZXcgQ2lyY2xlKHtcblx0XHRcdHg6IGUuY2xpZW50WCxcblx0XHRcdHk6IGUuY2xpZW50WSxcblx0XHRcdHI6IDAsXG5cdFx0XHRmaWxsOiBjdXJyZW50Q29sb3IsXG5cdFx0XHRzdHJva2U6IHtcblx0XHRcdFx0d2lkdGg6IDMsXG5cdFx0XHRcdGNvbG9yOiBjdXJyZW50Q29sb3IsXG5cdFx0XHR9LFxuXHRcdFx0b3BhY2l0eTogMSxcblx0XHR9KTtcblx0XHR2YXIgcmlwcGxlQW5pbWF0aW9uID0gYW5pbWUoe1xuXHRcdFx0dGFyZ2V0czogcmlwcGxlLFxuXHRcdFx0cjogcmlwcGxlU2l6ZSxcblx0XHRcdG9wYWNpdHk6IDAsXG5cdFx0XHRlYXNpbmc6ICdlYXNlT3V0RXhwbycsXG5cdFx0XHRkdXJhdGlvbjogOTAwLFxuXHRcdFx0Y29tcGxldGU6IHJlbW92ZUFuaW1hdGlvbixcblx0XHR9KTtcblxuXHRcdHZhciBwYXJ0aWNsZXMgPSBbXTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDMyOyBpKyspIHtcblx0XHRcdHZhciBwYXJ0aWNsZSA9IG5ldyBDaXJjbGUoe1xuXHRcdFx0XHR4OiBlLmNsaWVudFgsXG5cdFx0XHRcdHk6IGUuY2xpZW50WSxcblx0XHRcdFx0ZmlsbDogY3VycmVudENvbG9yLFxuXHRcdFx0XHRyOiBhbmltZS5yYW5kb20oMjQsIDQ4KSxcblx0XHRcdH0pO1xuXHRcdFx0cGFydGljbGVzLnB1c2gocGFydGljbGUpO1xuXHRcdH1cblx0XHR2YXIgcGFydGljbGVzQW5pbWF0aW9uID0gYW5pbWUoe1xuXHRcdFx0dGFyZ2V0czogcGFydGljbGVzLFxuXHRcdFx0eDogZnVuY3Rpb24gKHBhcnRpY2xlKSB7XG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0cGFydGljbGUueCArXG5cdFx0XHRcdFx0YW5pbWUucmFuZG9tKHJpcHBsZVNpemUsIC1yaXBwbGVTaXplKVxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHRcdHk6IGZ1bmN0aW9uIChwYXJ0aWNsZSkge1xuXHRcdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRcdHBhcnRpY2xlLnkgK1xuXHRcdFx0XHRcdGFuaW1lLnJhbmRvbShcblx0XHRcdFx0XHRcdHJpcHBsZVNpemUgKiAxLjE1LFxuXHRcdFx0XHRcdFx0LXJpcHBsZVNpemUgKiAxLjE1XG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHRcdHI6IDAsXG5cdFx0XHRlYXNpbmc6ICdlYXNlT3V0RXhwbycsXG5cdFx0XHRkdXJhdGlvbjogYW5pbWUucmFuZG9tKDEwMDAsIDEzMDApLFxuXHRcdFx0Y29tcGxldGU6IHJlbW92ZUFuaW1hdGlvbixcblx0XHR9KTtcblx0XHRhbmltYXRpb25zLnB1c2goXG5cdFx0XHRmaWxsQW5pbWF0aW9uLFxuXHRcdFx0cmlwcGxlQW5pbWF0aW9uLFxuXHRcdFx0cGFydGljbGVzQW5pbWF0aW9uXG5cdFx0KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG5cdFx0Zm9yICh2YXIga2V5IGluIGIpIHtcblx0XHRcdGlmIChiLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0YVtrZXldID0gYltrZXldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gYTtcblx0fVxuXG5cdHZhciBDaXJjbGUgPSBmdW5jdGlvbiAob3B0cykge1xuXHRcdGV4dGVuZCh0aGlzLCBvcHRzKTtcblx0fTtcblxuXHRDaXJjbGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0Y3R4Lmdsb2JhbEFscGhhID0gdGhpcy5vcGFjaXR5IHx8IDE7XG5cdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdGN0eC5hcmModGhpcy54LCB0aGlzLnksIHRoaXMuciwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcblx0XHRpZiAodGhpcy5zdHJva2UpIHtcblx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuc3Ryb2tlLmNvbG9yO1xuXHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMuc3Ryb2tlLndpZHRoO1xuXHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5maWxsKSB7XG5cdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xuXHRcdFx0Y3R4LmZpbGwoKTtcblx0XHR9XG5cdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdGN0eC5nbG9iYWxBbHBoYSA9IDE7XG5cdH07XG5cblx0dmFyIGFuaW1hdGUgPSBhbmltZSh7XG5cdFx0ZHVyYXRpb246IEluZmluaXR5LFxuXHRcdHVwZGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGJnQ29sb3I7XG5cdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY1csIGNIKTtcblx0XHRcdGFuaW1hdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoYW5pbSkge1xuXHRcdFx0XHRhbmltLmFuaW1hdGFibGVzLmZvckVhY2goZnVuY3Rpb24gKGFuaW1hdGFibGUpIHtcblx0XHRcdFx0XHRhbmltYXRhYmxlLnRhcmdldC5kcmF3KCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0fSk7XG5cblx0dmFyIHJlc2l6ZUNhbnZhcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRjVyA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRcdGNIID0gd2luZG93LmlubmVySGVpZ2h0O1xuXHRcdGMud2lkdGggPSBjVyAqIGRldmljZVBpeGVsUmF0aW87XG5cdFx0Yy5oZWlnaHQgPSBjSCAqIGRldmljZVBpeGVsUmF0aW87XG5cdFx0Y3R4LnNjYWxlKGRldmljZVBpeGVsUmF0aW8sIGRldmljZVBpeGVsUmF0aW8pO1xuXHR9O1xuXG5cdChmdW5jdGlvbiBpbml0KCkge1xuXHRcdHJlc2l6ZUNhbnZhcygpO1xuXHRcdGlmICh3aW5kb3cuQ1ApIHtcblx0XHRcdC8vIENvZGVQZW4ncyBsb29wIGRldGVjdGlvbiB3YXMgY2F1c2luJyBwcm9ibGVtc1xuXHRcdFx0Ly8gYW5kIEkgaGF2ZSBubyBpZGVhIHdoeSwgc28uLi5cblx0XHRcdHdpbmRvdy5DUC5QZW5UaW1lci5NQVhfVElNRV9JTl9MT09QX1dPX0VYSVQgPSA2MDAwO1xuXHRcdH1cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplQ2FudmFzKTtcblx0XHRhZGRDbGlja0xpc3RlbmVycygpO1xuXHRcdGlmICghIXdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaCgvZnVsbGNwZ3JpZC8pKSB7XG5cdFx0XHRzdGFydEZhdXhDbGlja2luZygpO1xuXHRcdH1cblx0XHRoYW5kbGVJbmFjdGl2ZVVzZXIoKTtcblx0fSkoKTtcblxuXHRmdW5jdGlvbiBoYW5kbGVJbmFjdGl2ZVVzZXIoKSB7XG5cdFx0dmFyIGluYWN0aXZlID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRmYXV4Q2xpY2soY1cgLyAyLCBjSCAvIDIpO1xuXHRcdH0sIDIwMDApO1xuXG5cdFx0ZnVuY3Rpb24gY2xlYXJJbmFjdGl2ZVRpbWVvdXQoKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQoaW5hY3RpdmUpO1xuXHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0J21vdXNlZG93bicsXG5cdFx0XHRcdGNsZWFySW5hY3RpdmVUaW1lb3V0XG5cdFx0XHQpO1xuXHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0J3RvdWNoc3RhcnQnLFxuXHRcdFx0XHRjbGVhckluYWN0aXZlVGltZW91dFxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBjbGVhckluYWN0aXZlVGltZW91dCk7XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGNsZWFySW5hY3RpdmVUaW1lb3V0KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHN0YXJ0RmF1eENsaWNraW5nKCkge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0ZmF1eENsaWNrKFxuXHRcdFx0XHRhbmltZS5yYW5kb20oY1cgKiAwLjIsIGNXICogMC44KSxcblx0XHRcdFx0YW5pbWUucmFuZG9tKGNIICogMC4yLCBjSCAqIDAuOClcblx0XHRcdCk7XG5cdFx0XHRzdGFydEZhdXhDbGlja2luZygpO1xuXHRcdH0sIGFuaW1lLnJhbmRvbSgyMDAsIDkwMCkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZmF1eENsaWNrKHgsIHkpIHtcblx0XHR2YXIgZmF1eENsaWNrID0gbmV3IEV2ZW50KCdtb3VzZWRvd24nKTtcblx0XHRmYXV4Q2xpY2suY2xpZW50WCA9IHg7XG5cdFx0ZmF1eENsaWNrLmNsaWVudFkgPSB5O1xuXHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZmF1eENsaWNrKTtcblx0fVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGFya01vZGUoKSB7XG5cdC8vIFN0YXJ0IGluIGRhcmsgbW9kZVxuXHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLXRoZW1lJywgJ2RhcmsnKTtcblx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3RoZW1lJywgJ2RhcmsnKTtcblxuXHQvLyBEYXJrIE1vZGVcblx0Y29uc3QgdG9nZ2xlU3dpdGNoID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihcblx0XHQnLnRoZW1lLXN3aXRjaCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nXG5cdCk7XG5cblx0ZnVuY3Rpb24gc3dpdGNoVGhlbWUoZSkge1xuXHRcdGlmIChlLnRhcmdldC5jaGVja2VkKSB7XG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2V0QXR0cmlidXRlKFxuXHRcdFx0XHQnZGF0YS10aGVtZScsXG5cdFx0XHRcdCdkYXJrJ1xuXHRcdFx0KTtcblx0XHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0aGVtZScsICdkYXJrJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoXG5cdFx0XHRcdCdkYXRhLXRoZW1lJyxcblx0XHRcdFx0J2xpZ2h0J1xuXHRcdFx0KTtcblx0XHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0aGVtZScsICdsaWdodCcpO1xuXHRcdH1cblx0fVxuXG5cdHRvZ2dsZVN3aXRjaC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBzd2l0Y2hUaGVtZSwgZmFsc2UpO1xuXG5cdGNvbnN0IGN1cnJlbnRUaGVtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0aGVtZScpXG5cdFx0PyBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndGhlbWUnKVxuXHRcdDogbnVsbDtcblxuXHRpZiAoY3VycmVudFRoZW1lKSB7XG5cdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZShcblx0XHRcdCdkYXRhLXRoZW1lJyxcblx0XHRcdGN1cnJlbnRUaGVtZVxuXHRcdCk7XG5cblx0XHRpZiAoY3VycmVudFRoZW1lID09PSAnZGFyaycpIHtcblx0XHRcdHRvZ2dsZVN3aXRjaC5jaGVja2VkID0gdHJ1ZTtcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCAqIGFzIGNvbmZldHRpIGZyb20gJ2NhbnZhcy1jb25mZXR0aSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZvcm1TdWJtaXQoKSB7XG5cdHZhciBlbWFpbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJlbWFpbFwiXScpO1xuXG5cdC8vIFBsYXkgTG90dGllXG5cdGZ1bmN0aW9uIHBsYXlBbmltYXRpb24oKSB7XG5cdFx0Y29uc3QgcGxheWVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJvY2tldCcpO1xuXHRcdHBsYXllci5wbGF5KCk7XG5cdH1cblxuXHQvLyBDb25mZXR0aVxuXHR2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZldHRpJyk7XG5cdGNhbnZhcy5jb25mZXR0aSA9XG5cdFx0Y2FudmFzLmNvbmZldHRpIHx8IGNvbmZldHRpLmNyZWF0ZShjYW52YXMsIHsgcmVzaXplOiB0cnVlIH0pO1xuXG5cdGZ1bmN0aW9uIG1ha2VJdEZseSgpIHtcblx0XHR2YXIgZW5kID0gRGF0ZS5ub3coKSArIDE1ICogMTAwMDtcblx0XHR2YXIgY29sb3JzID0gW1xuXHRcdFx0JyMwMEZGQzAnLFxuXHRcdFx0JyNGOUZGMDAnLFxuXHRcdFx0JyNGRjAwMDAnLFxuXHRcdFx0JyNGRkYnLFxuXHRcdFx0JyNGRjAwMDAnLFxuXHRcdF07XG5cdFx0KGZ1bmN0aW9uIGZyYW1lKCkge1xuXHRcdFx0Y2FudmFzLmNvbmZldHRpKHtcblx0XHRcdFx0cGFydGljbGVDb3VudDogMixcblx0XHRcdFx0YW5nbGU6IDYwLFxuXHRcdFx0XHRzcHJlYWQ6IDU1LFxuXHRcdFx0XHRvcmlnaW46IHsgeDogMCB9LFxuXHRcdFx0XHRjb2xvcnM6IGNvbG9ycyxcblx0XHRcdFx0cmVzaXplOiB0cnVlLFxuXHRcdFx0XHR1c2VXb3JrZXI6IHRydWUsXG5cdFx0XHR9KTtcblx0XHRcdGNhbnZhcy5jb25mZXR0aSh7XG5cdFx0XHRcdHBhcnRpY2xlQ291bnQ6IDIsXG5cdFx0XHRcdGFuZ2xlOiAxMjAsXG5cdFx0XHRcdHNwcmVhZDogNTUsXG5cdFx0XHRcdG9yaWdpbjogeyB4OiAxIH0sXG5cdFx0XHRcdGNvbG9yczogY29sb3JzLFxuXHRcdFx0XHRyZXNpemU6IHRydWUsXG5cdFx0XHRcdHVzZVdvcmtlcjogdHJ1ZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoRGF0ZS5ub3coKSA8IGVuZCkge1xuXHRcdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuXHRcdFx0fVxuXHRcdH0pKCk7XG5cdH1cblxuXHRmdW5jdGlvbiB2YWxpZGF0ZUVtYWlsKGVtYWlsKSB7XG5cdFx0Y29uc3QgcmUgPSAvXigoW148PigpW1xcXVxcXFwuLDs6XFxzQFxcXCJdKyhcXC5bXjw+KClbXFxdXFxcXC4sOzpcXHNAXFxcIl0rKSopfChcXFwiLitcXFwiKSlAKChcXFtbMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFxdKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkLztcblx0XHRyZXR1cm4gcmUudGVzdChlbWFpbCk7XG5cdH1cblxuXHRmdW5jdGlvbiB2YWxpZGF0ZSgpIHtcblx0XHRjb25zdCByZXN1bHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdWx0Jyk7XG5cdFx0dmFyIGVtYWlsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImVtYWlsXCJdJykudmFsdWU7XG5cdFx0cmVzdWx0LmlubmVySFRNTCA9ICcnO1xuXG5cdFx0aWYgKHZhbGlkYXRlRW1haWwoZW1haWwpKSB7XG5cdFx0XHR2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXJ0eScpO1xuXHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzdWNjZXNzJyk7XG5cblx0XHRcdHBsYXlBbmltYXRpb24oKTtcblx0XHRcdG1ha2VJdEZseSgpO1xuXG5cdFx0XHRyZXN1bHQuaW5uZXJIVE1MID1cblx0XHRcdFx0XCI8aDI+WWVhISEhIE5vdyB3ZSdyZSB0YWxraW4hPC9oMj48cD5XZSB3aWxsIHJldmlldyB5b3VyIG1lc3NhZ2UgYW5kIGJlIGluIHRvdWNoIHNvb24uPC9wPlwiO1xuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0LmlubmVySFRNTCA9XG5cdFx0XHRcdCc8cD5IbW0uLi5zb21ldGhpbmcgaXMgb2ZmLiBUcnkgY2hlY2tpbmcgXCInICtcblx0XHRcdFx0ZW1haWwgK1xuXHRcdFx0XHQnXCIgYW5kIHRyeSBhZ2Fpbi48L3A+Jztcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Y29uc3QgdGFkYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWRhJyk7XG5cdHRhZGEuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB2YWxpZGF0ZSk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwYXJ0aWNsZXMoKSB7XG5cdC8vIFBhcnRpY2xlIEpTXG5cdGZ1bmN0aW9uIHN0YXJ0UGFydGljbGVzKCkge1xuXHRcdHBhcnRpY2xlc0pTKCdwYXJ0aWNsZXMtanMnLCB7XG5cdFx0XHRwYXJ0aWNsZXM6IHtcblx0XHRcdFx0bnVtYmVyOiB7XG5cdFx0XHRcdFx0dmFsdWU6IDgwLFxuXHRcdFx0XHRcdGRlbnNpdHk6IHtcblx0XHRcdFx0XHRcdGVuYWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRcdHZhbHVlX2FyZWE6IDgwMCxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjb2xvcjogeyB2YWx1ZTogJyNmZmZmZmYnIH0sXG5cdFx0XHRcdHNoYXBlOiB7XG5cdFx0XHRcdFx0dHlwZTogJ2NpcmNsZScsXG5cdFx0XHRcdFx0c3Ryb2tlOiB7IHdpZHRoOiAwLCBjb2xvcjogJyMwMDAwMDAnIH0sXG5cdFx0XHRcdFx0cG9seWdvbjogeyBuYl9zaWRlczogNSB9LFxuXHRcdFx0XHRcdGltYWdlOiB7XG5cdFx0XHRcdFx0XHRzcmM6ICdpbWcvZ2l0aHViLnN2ZycsXG5cdFx0XHRcdFx0XHR3aWR0aDogMTAwLFxuXHRcdFx0XHRcdFx0aGVpZ2h0OiAxMDAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0b3BhY2l0eToge1xuXHRcdFx0XHRcdHZhbHVlOiAwLjUsXG5cdFx0XHRcdFx0cmFuZG9tOiBmYWxzZSxcblx0XHRcdFx0XHRhbmltOiB7XG5cdFx0XHRcdFx0XHRlbmFibGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0c3BlZWQ6IDEsXG5cdFx0XHRcdFx0XHRvcGFjaXR5X21pbjogMC4xLFxuXHRcdFx0XHRcdFx0c3luYzogZmFsc2UsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0c2l6ZToge1xuXHRcdFx0XHRcdHZhbHVlOiAzLFxuXHRcdFx0XHRcdHJhbmRvbTogdHJ1ZSxcblx0XHRcdFx0XHRhbmltOiB7XG5cdFx0XHRcdFx0XHRlbmFibGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0c3BlZWQ6IDQwLFxuXHRcdFx0XHRcdFx0c2l6ZV9taW46IDAuMSxcblx0XHRcdFx0XHRcdHN5bmM6IGZhbHNlLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxpbmVfbGlua2VkOiB7XG5cdFx0XHRcdFx0ZW5hYmxlOiB0cnVlLFxuXHRcdFx0XHRcdGRpc3RhbmNlOiAxNTAsXG5cdFx0XHRcdFx0Y29sb3I6ICcjZmZmZmZmJyxcblx0XHRcdFx0XHRvcGFjaXR5OiAwLjQsXG5cdFx0XHRcdFx0d2lkdGg6IDEsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG1vdmU6IHtcblx0XHRcdFx0XHRlbmFibGU6IHRydWUsXG5cdFx0XHRcdFx0c3BlZWQ6IDYsXG5cdFx0XHRcdFx0ZGlyZWN0aW9uOiAnbm9uZScsXG5cdFx0XHRcdFx0cmFuZG9tOiBmYWxzZSxcblx0XHRcdFx0XHRzdHJhaWdodDogZmFsc2UsXG5cdFx0XHRcdFx0b3V0X21vZGU6ICdvdXQnLFxuXHRcdFx0XHRcdGJvdW5jZTogZmFsc2UsXG5cdFx0XHRcdFx0YXR0cmFjdDoge1xuXHRcdFx0XHRcdFx0ZW5hYmxlOiBmYWxzZSxcblx0XHRcdFx0XHRcdHJvdGF0ZVg6IDYwMCxcblx0XHRcdFx0XHRcdHJvdGF0ZVk6IDEyMDAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRpbnRlcmFjdGl2aXR5OiB7XG5cdFx0XHRcdGRldGVjdF9vbjogJ2NhbnZhcycsXG5cdFx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRcdG9uaG92ZXI6IHtcblx0XHRcdFx0XHRcdGVuYWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRcdG1vZGU6ICdyZXB1bHNlJyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uY2xpY2s6IHsgZW5hYmxlOiB0cnVlLCBtb2RlOiAncHVzaCcgfSxcblx0XHRcdFx0XHRyZXNpemU6IHRydWUsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG1vZGVzOiB7XG5cdFx0XHRcdFx0Z3JhYjoge1xuXHRcdFx0XHRcdFx0ZGlzdGFuY2U6IDQwMCxcblx0XHRcdFx0XHRcdGxpbmVfbGlua2VkOiB7IG9wYWNpdHk6IDEgfSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGJ1YmJsZToge1xuXHRcdFx0XHRcdFx0ZGlzdGFuY2U6IDQwMCxcblx0XHRcdFx0XHRcdHNpemU6IDQwLFxuXHRcdFx0XHRcdFx0ZHVyYXRpb246IDIsXG5cdFx0XHRcdFx0XHRvcGFjaXR5OiA4LFxuXHRcdFx0XHRcdFx0c3BlZWQ6IDMsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRyZXB1bHNlOiB7XG5cdFx0XHRcdFx0XHRkaXN0YW5jZTogMjAwLFxuXHRcdFx0XHRcdFx0ZHVyYXRpb246IDAuNCxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHB1c2g6IHsgcGFydGljbGVzX25iOiA0IH0sXG5cdFx0XHRcdFx0cmVtb3ZlOiB7IHBhcnRpY2xlc19uYjogMiB9LFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHJldGluYV9kZXRlY3Q6IHRydWUsXG5cdFx0fSk7XG5cdH1cblxuXHRzdGFydFBhcnRpY2xlcygpO1xufVxuIiwiaW1wb3J0ICcuLi9zY3NzL21haW4uc2Nzcyc7XG5cbmltcG9ydCBhbmltZUJsb2NrcyBmcm9tICcuL2NvbXBvbmVudHMvYW5pbWUtYmxvY2tzJztcbmltcG9ydCBjb2xvclNwbGFzaCBmcm9tICcuL2NvbXBvbmVudHMvY29sb3Itc3BsYXNoJztcbmltcG9ydCBkYXJrTW9kZSBmcm9tICcuL2NvbXBvbmVudHMvZGFyay1tb2RlJztcbmltcG9ydCBmb3JtU3VibWl0IGZyb20gJy4vY29tcG9uZW50cy9mb3JtLXN1Ym1pdCc7XG5pbXBvcnQgcGFydGljbGVzIGZyb20gJy4vY29tcG9uZW50cy9wYXJ0aWNsZXMnO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xuXHRhbmltZUJsb2NrcygpO1xuXHRjb2xvclNwbGFzaCgpO1xuXHRkYXJrTW9kZSgpO1xuXHRmb3JtU3VibWl0KCk7XG5cdHBhcnRpY2xlcygpO1xufSk7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHRpZihfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdKSB7XG5cdFx0cmV0dXJuIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0uZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGVcbl9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9qcy9pbmRleC5qc1wiKTtcbi8vIFRoaXMgZW50cnkgbW9kdWxlIHVzZWQgJ2V4cG9ydHMnIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbiJdLCJzb3VyY2VSb290IjoiIn0=