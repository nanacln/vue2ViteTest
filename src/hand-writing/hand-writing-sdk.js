/* eslint-disable */
var SETTING_INK = {
  color: '#000000',
  penWidth: 1.6
};

var SETTING_ERASER_CIRCLE = {
  color: 'transparent',
  strokeColor: '#000000',
  penWidth: 15,
  lineWidth: 1,
  pointer: false
};

var SETTING_ERASER_RECT = {
  pointer: './img/eraser/eraser_small.png',
  penWidth: 64,
  pointerWidth: 64,
  pointerHeight: 76,
  radius: 4
};
var SETTING_MODES = ['pen', 'select', 'eraser', 'wiper'];

/**
 * @typedef {Object} Constants
 */

var Constants = {
  EventType: {
    IDLE: 'idle',
    CHANGED: 'changed',
    RENDERED: 'rendered', // Internal use only
    LOADED: 'loaded',
    UNDO: 'undo',
    REDO: 'redo',
    CLEAR: 'clear',
    ERROR: 'error'
  }
};

/**
 * Default configuration
 * @type {Configuration}
 */
var defaultConfiguration = {
  listenerOptions: {
    capture: false,
    passive: true
  },
  undoRedoMaxStackSize: 50,
  xyFloatPrecision: 4,
  timestampFloatPrecision: 0,
  renderingParams: {
    stroker: 'quadratic',
    minHeight: 100,
    minWidth: 100
  }

  /**
   * Generate parameters
   * @param {Configuration} configuration Configuration to be used
   * @return {Configuration} Overridden configuration
   */
};function overrideDefaultConfiguration(configuration) {
  var currentConfiguration = void 0;

  currentConfiguration = Object.assign({}, defaultConfiguration, configuration === undefined ? {} : configuration);
  return currentConfiguration;
}

/**
 * @typedef {Object} PenStyle
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} -pen-width=1 Width of strokes and primitives in mm (no other unit is supported yet)
 * @property {String} -pen-fill-style=none
 * @property {String} -pen-fill-color=#FFFFFF00 Color filled inside the area delimited by strokes and primitives
 */

/**
 * Default style
 * @type {PenStyle}
 */
var defaultPenStyle = undefined;

/**
 * Generate style
 * @param {PenStyle} style Custom style to be applied
 * @return {PenStyle} Overridden style
 */
function overrideDefaultPenStyle(style) {
  var currentStyle = Object.assign({
    type: 'pen'
  }, defaultPenStyle, style === undefined ? {} : style);
  return currentStyle;
}

/**
 * @typedef {PenStyle} InkTheme
 */

/**
 * @typedef {Object} TextTheme
 * @property {String} font-family=OpenSans Font-family to be used
 * @property {Number} font-size=10 Font-size to be used
 */
/**
 * @typedef {Object} Theme
 * @property {InkTheme} ink General settings
 * @property {MathTheme} .math Math theme
 * @property {GeneratedTheme} .math-solver Theme to be used for generated items
 * @property {TextTheme} .text Text theme
 */

/**
 * Default theme
 * @type {Theme}
 */
var defaultTheme = {
  ink: {
    color: '#000000',
    penWidth: 1
  },
  text: {},
  eraser: {
    color: 'transparent',
    strokeColor: '#000000',
    penWidth: 15,
    lineWidth: 1
  },
  shape: {
    lineWidth: 1,
    color: '#000000'
  }
  // const parser = new JsonCSS();

  /**
   * Generate theme
   * @param {Theme} theme Custom theme to be applied
   * @return {Theme} Overridden theme
   */
};function overrideDefaultTheme() {
  var theme = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var newTheme = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var currentTheme = Object.assign({}, defaultTheme, theme, newTheme);
  return currentTheme;
}

var floatPrecisionArray = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000];

function roundFloat(oneFloat, requestedFloatPrecision) {
  if (requestedFloatPrecision || requestedFloatPrecision === 0) {
    var floatPrecision = void 0;
    if (requestedFloatPrecision > 10) {
      floatPrecision = floatPrecisionArray[10];
    } else {
      floatPrecision = floatPrecisionArray[requestedFloatPrecision];
    }
    return Math.round(oneFloat * floatPrecision) / floatPrecision;
  }
  return oneFloat;
}

function extractPoint(event, domElement) {
  var configuration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    xyFloatPrecision: 0,
    timestampFloatPrecision: 0
  };
  var offsetTop = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  var offsetLeft = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

  var eventRef = event;
  if (eventRef.changedTouches) {
    eventRef = eventRef.changedTouches[0];
  }
  var rect = domElement.getBoundingClientRect();
  return {
    x: roundFloat(eventRef.clientX - rect.left - domElement.clientLeft - offsetLeft, configuration.xyFloatPrecision),
    y: roundFloat(eventRef.clientY - rect.top - domElement.clientTop - offsetTop, configuration.xyFloatPrecision),
    t: roundFloat(Date.now(), configuration.timestampFloatPrecision),
    p: event.pressure && event.pressure !== 0.5 ? event.pressure : 0
  };
}

/**
 * Grab pointerDown, pointerMove and pointerUp events
 * @typedef {Object} Grabber
 * @property {function(element: Element, editor: Editor): GrabberContext} attach Attach events and decide when to call editor pointerDown/Move/Up methods
 * @property {function(element: Element, context: GrabberContext)} detach Detach the grabber
 */

/**
 * Grabber listener
 * @typedef {Object} GrabberListener
 * @property {Array<String>} types Event types to listen
 * @property {function(event: Event)} listener Event listener for these events
 */

/**
 * Grabber context
 * @typedef {Object} GrabberContext
 * @property {Boolean|Object} options Options object that specifies characteristics about the event listener. (@see addEventListener.options for detail)
 * @property {Array<GrabberListener>} listeners Registered listeners
 */

/**
 * Listen for the desired events
 * @param {Element} element DOM element to attach events listeners
 * @param {Editor} editor Editor to received down/move/up events
 * @param {Number} [offsetTop=0]
 * @param {Number} [offsetLeft=0]
 * @return {GrabberContext} Grabber context
 * @listens {Event} pointermove: a pointer moves, similar to touchmove or mousemove.
 * @listens {Event} pointerdown: a pointer is activated, or a device button held.
 * @listens {Event} pointerup: a pointer is deactivated, or a device button released.
 * @listens {Event} pointerover: a pointer has moved onto an element.
 * @listens {Event} pointerout: a pointer is no longer on an element it once was.
 * @listens {Event} pointerenter: a pointer enters the bounding box of an element.
 * @listens {Event} pointerleave: a pointer leaves the bounding box of an element.
 * @listens {Event} pointercancel: a pointer will no longer generate events.
 */
function attach(element, editor) {
  var offsetTop = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var offsetLeft = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  function unfocus() {
    if (window.getSelection().type !== 'None') {
      window.getSelection().removeAllRanges();
    }
  }

  function pointerDownHandler(evt) {
    // Trigger a pointerDown
    // evt.target.id === editor.domElement.id ||
    var pointerDownOnEditor = evt.target.classList.contains('mw-capturing-canvas');
    if (!editor.activePointerId && evt.button !== 2 && evt.buttons !== 2 && pointerDownOnEditor) {
      editor.startDraw && editor.startDraw();
      // Ignore right click
      editor.activePointerId = evt.pointerId;
      this.startPoint = extractPoint(evt, element, editor.configuration, offsetTop, offsetLeft);
      // Hack for iOS 9 Safari : pointerId has to be int so -1 if > max value
      var pointerId = evt.pointerId > 2147483647 ? -1 : evt.pointerId;
      unfocus();
      evt.stopPropagation();
      editor.pointerDown(this.startPoint, evt.pointerType, pointerId);
    }
  }

  function pointerMoveHandler(evt) {
    // Trigger a pointerMove
    // Only considering the active pointer
    if (editor.activePointerId !== undefined && editor.activePointerId === evt.pointerId) {
      // const t = t1 - t0
      // console.log(t)
      // console.log(count++)
      // t0 = t1
      unfocus();
      var point = extractPoint(evt, element, editor.configuration, offsetTop, offsetLeft);
      editor.pointerMove(point);
    }
  }

  function pointerUpHandler(evt) {
    // Trigger a pointerUp
    if (editor.activePointerId !== undefined && editor.activePointerId === evt.pointerId) {
      // evt.stopPropagation()
      // Only considering the active pointer
      editor.activePointerId = undefined; // Managing the active pointer
      var point = extractPoint(evt, element, editor.configuration, offsetTop, offsetLeft);
      editor.pointerUp(point);
      editor.endDraw && editor.endDraw();
    }
  }

  var context = {
    options: editor.configuration.listenerOptions,
    listeners: [{
      types: ['pointerdown'],
      listener: pointerDownHandler
    }, {
      types: ['pointermove'],
      listener: pointerMoveHandler
    }, {
      types: ['pointerup', 'pointerleave', 'pointercancel'],
      listener: pointerUpHandler
    }]

    // 'pointerout',
  };context.listeners.forEach(function (item) {
    item.types.forEach(function (type) {
      return element.addEventListener(type, item.listener, context.options);
    });
  });
  return context;
}

function detach(element, context) {
  context.listeners.forEach(function (item) {
    item.types.forEach(function (type) {
      return element.removeEventListener(type, item.listener, context.options);
    });
  });
}

var PointerEventGrabber = /*#__PURE__*/Object.freeze({
  attach: attach,
  detach: detach
});

// import { getCurvePoints } from '../util/SplineCurve'
// import { smooth } from '../util/PathCalculation'

/**
 * Stroke symbol
 * @typedef {Object} Stroke
 * @property {String} type=stroke Symbol type, 'stroke' for stroke
 * @property {String} pointerType=undefined Pointer type
 * @property {Number} pointerId=undefined Pointer id
 * @property {Array<Number>} x=[] X coordinates
 * @property {Array<Number>} y=[] Y coordinates
 * @property {Array<Number>} t=[] Timestamps matching x,y coordinates
 * @property {Array<Number>} p=[] Pressure
 * @property {Array<Number>} l=[] Length from origin
 * @property {Number} width=0 (for rendering) Pen/brush width
 * @property {String} color=undefined (for rendering) Pen/brush color
 */

function computeDistance(x, y, xArray, yArray, lastIndexPoint) {
  var distance = Math.sqrt(Math.pow(y - yArray[lastIndexPoint - 1], 2) + Math.pow(x - xArray[lastIndexPoint - 1], 2));
  return isNaN(distance) ? 0 : distance;
}

function computeLength(x, y, xArray, yArray, lArray, lastIndexPoint) {
  var length = lArray[lastIndexPoint - 1] + computeDistance(x, y, xArray, yArray, lastIndexPoint);
  return isNaN(length) ? 0 : length;
}
/**
 * 计算模拟压力
 */
function computePressure(x, y, xArray, yArray, lArray, lastIndexPoint, d, l) {
  var ratio = 0.75;
  var distance = d || computeDistance(x, y, xArray, yArray, lastIndexPoint);
  var length = l || computeLength(x, y, xArray, yArray, lArray, lastIndexPoint);

  if (length === 0) {
    ratio = 0.75;
  } else if (distance === length) {
    ratio = 1;
  } else if (distance < 3) {
    ratio = 0.85;
  } else if (distance < 10) {
    // console.log('case 4', distance)
    ratio = Math.pow(0.1 * distance, -0.1) - 0.28;
  } else if (distance > 50) {
    // console.log('case 6', distance)
    ratio = 1;
  }
  var f = ratio * Math.max(0.25, 1.0 - 0.1 * Math.pow(distance, 0.4));
  // console.log(ratio, f)
  var pressure = isNaN(parseFloat(f)) ? 0.5 : f;
  return pressure;
}

function filterPointByAcquisitionDelta(x, y, xArray, yArray, width) {
  var delta = 1 + Math.min(Math.pow(width, 0.5), 8);
  // let delta = 0.1
  var ret = false;
  if (xArray.length === 0 || yArray.length === 0 || Math.abs(xArray[xArray.length - 1] - x) >= delta || Math.abs(yArray[yArray.length - 1] - y) >= delta) {
    ret = true;
  }
  return ret;
}

/**
 * Create a new stroke
 * @param {Object} properties Properties to be applied to the stroke.
 * @return {Stroke} New stroke with properties for quadratics draw
 */
function createStrokeComponent(properties) {
  var defaultStroke = {
    type: 'stroke',
    x: [],
    y: [],
    t: [],
    p: [],
    l: [],
    b: [],
    r: [],
    s: 1,
    _x: [],
    _y: [],
    center: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
    time: Date.now()
    // 新的数据格式
    // const defaultStroke = {
    //   type: 'stroke',
    //   subType: '', // pen, pencil, brush
    //   startTime: 0,
    //   x: [],
    //   y: [],
    //   t: [],   // 时间戳
    //   p: [],   // 压力
    //   b: [],   // 截断
    //   s: 1,    // 缩放倍数
    //   _l: [],
    //   _r: [],
    //   _x: [],
    //   _y: [],
    //   center: { x: 0, y: 0 },
    //   delta: { x: 0, y: 0 },
    //   size: 0,
    //   opacity: 1
    // }
  };return Object.assign({}, defaultStroke, properties);
}

function createImageComponent(properties) {
  var defaultStroke = {
    type: 'image',
    src: '',
    width: null,
    height: null,
    top: null,
    left: null,
    s: 1,
    center: { x: 0, y: 0 },
    delta: { x: 0, y: 0 }
  };
  return Object.assign({}, defaultStroke, properties);
}

function addPointToStroke(stroke, point, origin) {
  if (origin) {
    stroke._x.push(point.x);
    stroke._y.push(point.y);
  }
  stroke.x.push(point.x);
  stroke.y.push(point.y);
  stroke.t.push(point.t);
  stroke.b.push(0);

  var args = [point.x, point.y, stroke._x, stroke._y, stroke.l, stroke._x.length - 1];
  var l = void 0;
  var p = void 0;
  if (stroke.hasPressure) {
    var d = computeDistance.apply(undefined, args);
    l = computeLength.apply(undefined, args);
    stroke.l.push(l);
    if (point.p) {
      // if (stroke.x.length === 0) point.p = 0.65
      // else if (stroke.x.length < 6) point.p = 0.75
      stroke.p.push(point.p);
    } else {
      p = computePressure.apply(undefined, [].concat(args, [d, l]));
      // const lastP = stroke.p.slice(-1)[0] || 0.75
      // const stepP = 0.075
      // const diff = p - lastP
      // if (d < 30 && Math.abs(diff) > stepP) {
      //   if (diff > 0) {
      //     p = lastP + stepP
      //   } else {
      //     p = lastP - stepP
      //   }
      // }
      stroke.p.push(p);
    }
  }
  return stroke;
}

/**
 * Mutate a stroke by adding a point to it.
 * @param {Stroke} stroke Current stroke
 * @param {{x: Number, y: Number, t: Number}} point Point to add
 * @return {Stroke} Updated stroke
 */
function addPoint(stroke, point) {
  var strokeReference = stroke;
  if (filterPointByAcquisitionDelta(point.x, point.y, strokeReference.x, strokeReference.y, strokeReference.penWidth)) {
    addPointToStroke(strokeReference, point, true);
    strokeReference.discardPoint = null;

    // 笔迹进行样条拟合
    // let points = [point]
    // const l = computeDistance(
    //   point.x,
    //   point.y,
    //   strokeReference._x,
    //   strokeReference._y,
    //   strokeReference._x.length - 1
    // )
    // if (
    //   (stroke.type === 'brush' || stroke.type === 'pencil') &&
    //   strokeReference.x.length > 1 &&
    //   l > stroke.width
    // ) {
    //   console.log('样条插值')
    //   const p =
    //     point.p ||
    //     computePressure(
    //       point.x,
    //       point.y,
    //       strokeReference._x,
    //       strokeReference._y,
    //       strokeReference.l,
    //       strokeReference._x.length - 1
    //     )
    //   const t = point.t
    //   const lastP = strokeReference.p[strokeReference.p.length - 1]
    //   const lastT = strokeReference.t[strokeReference.t.length - 1]
    //   const numOfSeg = 2
    //   const curvePoints = getCurvePoints(
    //     {
    //       x: strokeReference._x.slice(-3).concat(point.x),
    //       y: strokeReference._y.slice(-3).concat(point.y)
    //     },
    //     0.6,
    //     numOfSeg
    //   )
    //   const stepP = (p - lastP) / (curvePoints.length || 1)
    //   const stepT = (t - lastT) / (curvePoints.length || 1)
    //   curvePoints.forEach((cp, i) => {
    //     cp.p = lastP + stepP * (i + 1)
    //     cp.t = lastT + Math.floor(stepT * (i + 1))
    //   })
    //   points = curvePoints
    // }
    // points.forEach((p, i) => {
    //   addPointToStroke(strokeReference, p, i === points.length - 1)
    // })

    // repair stroke
    // if (stroke.type === 'pen' && !point.p) {
    //   const length = strokeReference.p.length
    //   let startP = 0.75
    //   let endP = 0.35
    //   let step = 6
    //   let stepP = 0.1
    //   if (length > step) {
    //     const index = length - step - 1
    //     startP = computePressure(
    //       strokeReference.x[index],
    //       strokeReference.y[index],
    //       strokeReference.x.slice(0, index + 1),
    //       strokeReference.y.slice(0, index + 1),
    //       strokeReference.l.slice(0, index + 1),
    //       index
    //     )
    //     const lastP = strokeReference.p[index - 1]
    //     const diffP = startP - lastP
    //     if (Math.abs(diffP) > 0.125) {
    //       startP = lastP + (0.125 * diffP) / Math.abs(diffP)
    //     }
    //     endP = Math.max(endP, startP - 0.05 * step)
    //   } else {
    //     step = length - 1
    //   }
    //   if (step) {
    //     stepP = (startP - endP) / step
    //   }
    //   for (let i = 0; i <= step; i++) {
    //     strokeReference.p[length - i - 1] = endP + stepP * i
    //   }
    // }

    // smooth path
    // if (
    //   (stroke.type === 'pencil' || stroke.type === 'brush') &&
    //   strokeReference.x.length > 2
    // ) {
    //   const path = smooth({
    //     x: strokeReference._x,
    //     y: strokeReference._y,
    //     p: strokeReference.p
    //   })
    //   strokeReference.x = path.x
    //   strokeReference.y = path.y
    // }
  } else {
    strokeReference.discardPoint = point;
  }
  return strokeReference;
}

/**
 * Extract point by index
 * @param {Stroke} stroke Current stroke
 * @param {Number} index Zero-based index
 * @return {{x: Number, y: Number, t: Number, p: Number, l: Number}} Point with properties for quadratics draw
 */
function getPointByIndex(context, stroke, index) {
  var point = void 0;
  if (index !== undefined && index >= 0 && index < stroke.x.length) {
    var x = stroke.x[index];
    var y = stroke.y[index];
    // if (x < 2 || y < 2) {
    //   x = x * context.canvas.offsetWidth
    //   y = y * context.canvas.offsetHeight
    // }
    point = {
      x: stroke.center.x + stroke.s * (x - stroke.center.x) + stroke.delta.x,
      y: stroke.center.y + stroke.s * (y - stroke.center.y) + stroke.delta.y,
      t: stroke.t[index],
      p: stroke.p[index],
      b: stroke.b ? stroke.b[index] : undefined
    };
    if (stroke.r) {
      point.r = stroke.r[index];
    }
  }
  return point;
}

var EraserSymbols = {
  eraser: 'eraser',
  wiper: 'wiper'

  // 缓存Path
};var curvePath = new Path2D();

function drawRoundedRect(ctx, _x, _y, width, height, r) {
  var x = _x - width / 2;
  var y = _y - height / 2;
  // ctx.beginPath()
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.arcTo(x, y, x + r, y, r);
  // ctx.closePath()
  // ctx.globalCompositeOperation = 'destination-out'
  // ctx.fill()
  // ctx.stroke()
}

function drawArcTo(ctx, x1, y1, x2, y2, radius) {
  ctx.arcTo(x1, y1, x2, y2, radius);
}

function drawRoundedStroke(ctx, p1, p2, width, height, radius) {
  var xx = 1,
      o1 = void 0,
      o2 = void 0,
      m1 = void 0,
      n1 = void 0,
      n2 = void 0,
      q1 = void 0,
      q2 = void 0;
  var arc1 = Math.atan2(Math.abs(p1.y - p2.y), Math.abs(p2.x - p1.x));
  var arc2 = Math.atan2(Math.abs(p2.x - p1.x), Math.abs(p1.y - p2.y));
  var halfw = width / 2;
  var halfh = height / 2;
  if (p2.x > p1.x && p2.y < p1.y) {
    xx = 1; // 2点
  } else if (p2.x > p1.x && p2.y > p1.y) {
    xx = 4; // 4点
  } else if (p2.x < p1.x && p2.y > p1.y) {
    xx = 3; // 8点
  } else if (p2.x < p1.x && p2.y < p1.y) {
    xx = 2; // 10点
  } else if (p2.x > p1.x && p2.y === p1.y) {
    xx = 5; // 3点
  } else if (p2.x === p1.x && p2.y < p1.y) {
    xx = 6; // 12点
  } else if (p2.x < p1.x && p2.y === p1.y) {
    xx = 7; // 9点
  } else if (p2.x === p1.x && p2.y > p1.y) {
    xx = 8; // 6点
  }
  // ctx.beginPath()
  switch (xx) {
    case 1:
      o1 = {
        x: p1.x - (halfw - radius),
        y: p1.y - (halfh - radius)
      };
      o2 = {
        x: p2.x - (halfw - radius),
        y: p2.y - (halfh - radius)
      };
      q1 = {
        x: p1.x + (halfw - radius),
        y: p1.y + (halfh - radius)
      };
      q2 = {
        x: p2.x + (halfw - radius),
        y: p2.y + (halfh - radius)
      };
      m1 = {
        x: o1.x - Math.sin(arc1) * radius,
        y: o1.y - Math.cos(arc1) * radius
      };
      n1 = {
        x: q1.x + Math.sin(arc1) * radius,
        y: q1.y + Math.cos(arc1) * radius
      };
      n2 = {
        x: q2.x + Math.sin(arc1) * radius,
        y: q2.y + Math.cos(arc1) * radius
      };
      ctx.moveTo(m1.x, m1.y);
      drawArcTo(ctx, o2.x - Math.tan(arc1 / 2) * radius, o2.y - radius, o2.x, o2.y - radius, radius);
      drawArcTo(ctx, p2.x + halfw, p2.y - halfh, p2.x + halfw, o2.y, radius);
      drawArcTo(ctx, q2.x + radius, q2.y + Math.tanh(arc2 / 2) * radius, n2.x, n2.y, radius);
      ctx.lineTo(n1.x, n1.y);
      break;
    case 2:
      o1 = {
        x: p1.x + (halfw - radius),
        y: p1.y - (halfh - radius)
      };
      o2 = {
        x: p2.x + (halfw - radius),
        y: p2.y - (halfh - radius)
      };
      q1 = {
        x: p1.x - (halfw - radius),
        y: p1.y + (halfh - radius)
      };
      q2 = {
        x: p2.x - (halfw - radius),
        y: p2.y + (halfh - radius)
      };
      m1 = {
        x: o1.x + Math.sin(arc1) * radius,
        y: o1.y - Math.cos(arc1) * radius
      };
      n1 = {
        x: q1.x - Math.sin(arc1) * radius,
        y: q1.y + Math.cos(arc1) * radius
      };
      n2 = {
        x: q2.x - Math.sin(arc1) * radius,
        y: q2.y + Math.cos(arc1) * radius
        // ctx.moveTo(m1.x, m1.y)
        // drawArcTo(
        //   ctx,
        //   o2.x + Math.tan(arc1 / 2) * radius,
        //   o2.y - radius,
        //   o2.x,
        //   o2.y - radius,
        //   radius
        // )
        // drawArcTo(ctx, p2.x - halfw, p2.y - halfh, p2.x - halfw, o2.y, radius)
        // drawArcTo(
        //   ctx,
        //   p2.x - halfw,
        //   q2.y + Math.tanh(arc2 / 2) * radius,
        //   n2.x,
        //   n2.y,
        //   radius
        // )
        // ctx.lineTo(n1.x, n1.y)
      };ctx.moveTo(n1.x, n1.y);
      drawArcTo(ctx, p2.x - halfw, q2.y + Math.tanh(arc2 / 2) * radius, p2.x - halfw, q2.y, radius);
      drawArcTo(ctx, p2.x - halfw, p2.y - halfh, o2.x, p2.y - halfh, radius);
      drawArcTo(ctx, o2.x + Math.tan(arc1 / 2) * radius, o2.y - radius, m1.x, m1.y, radius);
      ctx.lineTo(m1.x, m1.y);
      break;
    case 3:
      o1 = {
        x: p1.x - (halfw - radius),
        y: p1.y - (halfh - radius)
      };
      o2 = {
        x: p2.x - (halfw - radius),
        y: p2.y - (halfh - radius)
      };
      q1 = {
        x: p1.x + (halfw - radius),
        y: p1.y + (halfh - radius)
      };
      q2 = {
        x: p2.x + (halfw - radius),
        y: p2.y + (halfh - radius)
      };
      m1 = {
        x: o1.x - Math.sin(arc1) * radius,
        y: o1.y - Math.cos(arc1) * radius
      };
      n1 = {
        x: q1.x + Math.sin(arc1) * radius,
        y: q1.y + Math.cos(arc1) * radius
      };
      n2 = {
        x: q2.x + Math.sin(arc1) * radius,
        y: q2.y + Math.cos(arc1) * radius
        // ctx.moveTo(m1.x, m1.y)
        // drawArcTo(
        //   ctx,
        //   o2.x - radius,
        //   o2.y - Math.tan(arc2 / 2) * radius,
        //   o2.x - radius,
        //   o2.y,
        //   radius
        // )
        // drawArcTo(
        //   ctx,
        //   p2.x - halfw,
        //   p2.y + halfh,
        //   q2.x - radius,
        //   p2.y + halfh,
        //   radius
        // )
        // drawArcTo(
        //   ctx,
        //   q2.x + Math.tanh(arc1 / 2) * radius,
        //   p2.y + halfh,
        //   n2.x,
        //   n2.y,
        //   radius
        // )
        // ctx.lineTo(n1.x, n1.y)
      };ctx.moveTo(n1.x, n1.y);
      drawArcTo(ctx, q2.x + Math.tanh(arc1 / 2) * radius, p2.y + halfh, q2.x, p2.y + halfh, radius);
      drawArcTo(ctx, p2.x - halfw, p2.y + halfh, p2.x - halfw, q2.y, radius);
      drawArcTo(ctx, o2.x - radius, o2.y - Math.tan(arc2 / 2) * radius, m1.x, m1.y, radius);
      ctx.lineTo(m1.x, m1.y);
      break;
    case 4:
      o1 = {
        x: p1.x + (halfw - radius),
        y: p1.y - (halfh - radius)
      };
      o2 = {
        x: p2.x + (halfw - radius),
        y: p2.y - (halfh - radius)
      };
      q1 = {
        x: p1.x - (halfw - radius),
        y: p1.y + (halfh - radius)
      };
      q2 = {
        x: p2.x - (halfw - radius),
        y: p2.y + (halfh - radius)
      };
      m1 = {
        x: o1.x + Math.sin(arc1) * radius,
        y: o1.y - Math.cos(arc1) * radius
      };
      n1 = {
        x: q1.x - Math.sin(arc1) * radius,
        y: q1.y + Math.cos(arc1) * radius
      };
      n2 = {
        x: q2.x - Math.sin(arc1) * radius,
        y: q2.y + Math.cos(arc1) * radius
      };
      ctx.moveTo(m1.x, m1.y);
      drawArcTo(ctx, o2.x + radius, o2.y - Math.tan(arc2 / 2) * radius, o2.x + radius, o2.y, radius);
      drawArcTo(ctx, p2.x + halfw, p2.y + halfh, o2.x, p2.y + halfh, radius);
      drawArcTo(ctx, q2.x - Math.tanh(arc1 / 2) * radius, q2.y + radius, n2.x, n2.y, radius);
      ctx.lineTo(n1.x, n1.y);
      break;
    case 5:
      ctx.moveTo(p1.x + halfw - radius, p1.y - halfh);
      ctx.arcTo(p2.x + halfw, p2.y - halfh, p2.x + halfw, p2.y - halfh + radius, radius);
      ctx.arcTo(p2.x + halfw, p2.y + halfh, p2.x + halfw - radius, p2.y + halfh, radius);
      ctx.lineTo(p1.x + halfw - radius, p1.y + halfh);
      break;
    case 6:
      ctx.moveTo(p1.x - halfw, p1.y - halfh + radius);
      ctx.arcTo(p2.x - halfw, p2.y - halfh, p2.x - halfw + radius, p2.y - halfh, radius);
      ctx.arcTo(p2.x + halfw, p2.y - halfh, p2.x + halfw, p2.y - halfh + radius, radius);
      ctx.lineTo(p1.x + halfw, p1.y - halfh + radius);
      break;
    case 7:
      // ctx.moveTo(p1.x - halfw + radius, p1.y - halfh)
      // ctx.arcTo(
      //   p2.x - halfw,
      //   p2.y - halfh,
      //   p2.x - halfw,
      //   p2.y - halfh + radius,
      //   radius
      // )
      // ctx.arcTo(
      //   p2.x - halfw,
      //   p2.y + halfh,
      //   p2.x - halfw + radius,
      //   p2.y + halfh,
      //   radius
      // )
      // ctx.lineTo(p1.x - halfw + radius, p1.y + halfh)
      ctx.moveTo(p1.x - halfw + radius, p1.y + halfh);
      ctx.arcTo(p2.x - halfw, p2.y + halfh, p2.x - halfw, p2.y + halfh - radius, radius);
      ctx.arcTo(p2.x - halfw, p2.y - halfh, p2.x - halfw + radius, p2.y - halfh, radius);
      ctx.lineTo(p1.x - halfw + radius, p1.y - halfh);
      break;
    case 8:
      // ctx.moveTo(p1.x - halfw, p1.y + halfh - radius)
      // ctx.arcTo(
      //   p2.x - halfw,
      //   p2.y + halfh,
      //   p2.x - halfw + radius,
      //   p2.y + halfh,
      //   radius
      // )
      // ctx.arcTo(
      //   p2.x + halfw,
      //   p2.y + halfh,
      //   p2.x + halfw,
      //   p2.y + halfh - radius,
      //   radius
      // )
      // ctx.lineTo(p1.x + halfw, p1.y + halfh - radius)
      ctx.moveTo(p1.x + halfw, p1.y + halfh - radius);
      ctx.arcTo(p2.x + halfw, p2.y + halfh, p2.x + halfw - radius, p2.y + halfh, radius);
      ctx.arcTo(p2.x - halfw, p2.y + halfh, p2.x - halfw, p2.y + halfh - radius, radius);
      ctx.lineTo(p1.x - halfw, p1.y + halfh - radius);
      break;
  }
  // ctx.closePath()
  // if (!isCurrent) {
  // ctx.globalCompositeOperation = 'destination-out'
  // ctx.fill()
  // }
}

function drawEraser(context, stroke) {
  var contextReference = context;
  var length = stroke.x.length;
  var color = 'black';
  var penWidthScaleVal = stroke.penWidthScaleVal || 1;
  var firstPoint = getPointByIndex(context, stroke, 0);
  contextReference.save();
  // debugger
  try {
    contextReference.beginPath();
    curvePath = new Path2D();

    if (stroke.type === 'eraser') {
      var width = stroke.width * penWidthScaleVal * stroke.s;
      curvePath.moveTo(firstPoint.x, firstPoint.y);
      for (var i = 0; i < length - 1; i++) {
        var nextPoint = getPointByIndex(context, stroke, i + 1);
        curvePath.lineTo(nextPoint.x, nextPoint.y);
      }
      contextReference.lineCap = 'round';
      contextReference.lineJoin = 'round';
      contextReference.lineWidth = width;
      contextReference.strokeStyle = color;
      contextReference.globalCompositeOperation = 'destination-out';
      contextReference.stroke(curvePath);
    } else {
      var pointerWidth = stroke.pointerWidth * penWidthScaleVal * stroke.s;
      var pointerHeight = stroke.pointerHeight * penWidthScaleVal * stroke.s;
      drawRoundedRect(curvePath, firstPoint.x, firstPoint.y, pointerWidth, pointerHeight, stroke.radius);

      for (var _i = 0; _i < length - 1; _i++) {
        var currPoint = getPointByIndex(context, stroke, _i);
        var _nextPoint = getPointByIndex(context, stroke, _i + 1);
        drawRoundedStroke(curvePath, currPoint, _nextPoint, pointerWidth, pointerHeight, stroke.radius);
      }

      contextReference.globalCompositeOperation = 'destination-out';
      contextReference.fillStyle = color;
      contextReference.fill(curvePath);
      contextReference.closePath();
    }
  } finally {
    contextReference.restore();
  }
}

function drawCurrentEraser(context, stroke) {
  var contextReference = context;
  var length = stroke.x.length;
  var renderedLength = stroke.r.length;
  var penWidthScaleVal = stroke.penWidthScaleVal || 1;
  var width = stroke.width * penWidthScaleVal;
  var color = 'black';
  var firstPoint = getPointByIndex(context, stroke, 0);
  contextReference.save();
  // debugger
  try {
    contextReference.beginPath();

    if (stroke.type === 'eraser') {
      if (length && renderedLength === 0) {
        curvePath = new Path2D();
        curvePath.moveTo(firstPoint.x, firstPoint.y);
        stroke.r.push(1);
      }
      for (var i = Math.max(1, renderedLength); i < length; i++) {
        var nextPoint = getPointByIndex(context, stroke, i);
        curvePath.lineTo(nextPoint.x, nextPoint.y);
      }
      contextReference.lineCap = 'round';
      contextReference.lineJoin = 'round';
      contextReference.lineWidth = width;
      contextReference.strokeStyle = color;
      contextReference.globalCompositeOperation = 'destination-out';
      contextReference.stroke(curvePath);
    } else {
      if (length && renderedLength === 0) {
        curvePath = new Path2D();
        drawRoundedRect(curvePath, firstPoint.x, firstPoint.y, stroke.pointerWidth * penWidthScaleVal, stroke.pointerHeight * penWidthScaleVal, stroke.radius);
        stroke.r.push(1);
      } else {
        var currPoint = void 0,
            _nextPoint2 = void 0;
        for (var _i2 = renderedLength - 1; _i2 < length - 1; _i2++) {
          currPoint = _nextPoint2 || getPointByIndex(context, stroke, _i2);
          _nextPoint2 = getPointByIndex(context, stroke, _i2 + 1);
          drawRoundedStroke(curvePath, currPoint, _nextPoint2, stroke.pointerWidth * penWidthScaleVal, stroke.pointerHeight * penWidthScaleVal, stroke.radius);
          stroke.r.push(1);
        }
      }

      contextReference.fillStyle = color;
      contextReference.globalCompositeOperation = 'destination-out';
      contextReference.fill(curvePath);
      contextReference.closePath();
    }
  } finally {
    contextReference.restore();
  }
}

var ImageSymbols = {
  image: 1
};

function drawImage(context, stroke, image) {
  var contextReference = context;
  if (!image) return;
  contextReference.save();
  try {
    var left = stroke.center.x + stroke.s * (stroke.left - stroke.center.x) + stroke.delta.x;
    var top = stroke.center.y + stroke.s * (stroke.top - stroke.center.y) + stroke.delta.y;
    contextReference.drawImage(image, left, top, stroke.width * stroke.s, stroke.height * stroke.s);
  } finally {
    contextReference.restore();
  }
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

function mergeBounds(boundsA, boundsB) {
  return {
    minX: Math.min(boundsA.minX, boundsB.minX),
    maxX: Math.max(boundsA.maxX, boundsB.maxX),
    minY: Math.min(boundsA.minY, boundsB.minY),
    maxY: Math.max(boundsA.maxY, boundsB.maxY)
  };
}

function getLineBounds(line) {
  return {
    minX: Math.min(line.firstPoint.x, line.lastPoint.x),
    maxX: Math.max(line.firstPoint.x, line.lastPoint.x),
    minY: Math.min(line.firstPoint.y, line.lastPoint.y),
    maxY: Math.max(line.firstPoint.y, line.lastPoint.y)
  };
}

function getEllipseBounds(ellipse) {
  var angleStep = 0.02; // angle delta between interpolated points on the arc, in radian

  var z1 = Math.cos(ellipse.orientation);
  var z3 = Math.sin(ellipse.orientation);
  var z2 = z1;
  var z4 = z3;
  z1 *= ellipse.maxRadius;
  z2 *= ellipse.minRadius;
  z3 *= ellipse.maxRadius;
  z4 *= ellipse.minRadius;

  var n = Math.abs(ellipse.sweepAngle) / angleStep;

  var x = [];
  var y = [];

  for (var i = 0; i <= n; i++) {
    var angle = ellipse.startAngle + i / n * ellipse.sweepAngle;
    var alpha = Math.atan2(Math.sin(angle) / ellipse.minRadius, Math.cos(angle) / ellipse.maxRadius);

    var cosAlpha = Math.cos(alpha);
    var sinAlpha = Math.sin(alpha);

    x.push(ellipse.center.x + (z1 * cosAlpha - z4 * sinAlpha));
    y.push(ellipse.center.y + (z2 * sinAlpha + z3 * cosAlpha));
  }

  return {
    minX: Math.min.apply(Math, x),
    maxX: Math.max.apply(Math, x),
    minY: Math.min.apply(Math, y),
    maxY: Math.max.apply(Math, y)
  };
}

function getStrokeBounds(stroke) {
  var width = (stroke.width || 5) * 2;
  return {
    minX: Math.min.apply(Math, toConsumableArray(stroke.x)) - width,
    maxX: Math.max.apply(Math, toConsumableArray(stroke.x)) + width,
    minY: Math.min.apply(Math, toConsumableArray(stroke.y)) - width,
    maxY: Math.max.apply(Math, toConsumableArray(stroke.y)) + width
  };
}

/**
 * Get the box enclosing the given symbols
 * @param {Array} symbols Symbols to extract bounds from
 * @param {Bounds} [bounds] Starting bounds for recursion
 * @return {Bounds} Bounding box enclosing symbols
 */
function getSymbolsBounds(symbols) {
  var bounds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    minX: Number.MAX_VALUE,
    maxX: Number.MIN_VALUE,
    minY: Number.MAX_VALUE,
    maxY: Number.MIN_VALUE
  };

  var boundsRef = bounds;
  boundsRef = symbols.filter(function (symbol) {
    return symbol.type === 'pen';
  }).map(getStrokeBounds).reduce(mergeBounds, boundsRef);
  boundsRef = symbols.filter(function (symbol) {
    return symbol.type === 'line';
  }).map(getLineBounds).reduce(mergeBounds, boundsRef);
  boundsRef = symbols.filter(function (symbol) {
    return symbol.type === 'ellipse';
  }).map(getEllipseBounds).reduce(mergeBounds, boundsRef);
  return boundsRef;
}

/**
 * Renderer info
 * @typedef {Object} RendererInfo
 * @property {String} type Renderer type.
 */

/**
 * Default renderer
 * @typedef {Object} Renderer
 * @property {function(): RendererInfo} getInfo Get some information about this renderer
 * @property {function(element: Element, minHeight: Number, minWidth: Number): Object} attach Populate the DOM element to create rendering area.
 * @property {function(element: Element, context: Object)} detach Remove rendering area from the DOM element.
 * @property {function(context: Object, model: Model, stroker: Stroker)} resize Explicitly resize the rendering area.
 * @property {function(context: Object, model: Model, stroker: Stroker): Model} drawCurrentStroke Draw the model currentStroke.
 * @property {function(context: Object, model: Model, stroker: Stroker): Model} drawModel Draw the model defaultSymbols and recognizedSymbols.
 */

/**
 * Get info
 * @return {RendererInfo} Information about this renderer
 */
function getInfo() {
  return {
    type: 'canvas'
  };
}

function createCanvas(element, type) {
  // eslint-disable-next-line no-undef
  var canvas = element.querySelector(`.mw-canvas.mw-${type}-canvas`)
  if (!canvas) {
    canvas = element.ownerDocument.createElement('canvas');
    canvas.classList.add('mw-canvas', 'mw-' + type + '-canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    if (type !== 'capturing') {
      canvas.style.pointerEvents = 'none';
    }
    element.appendChild(canvas);
  }

  return canvas;
}

function resizeContent(context) {
  var canvases = [context.capturingCanvas, context.temporaryCanvas, context.renderingCanvas];
  var rendering = context.renderingCanvas;
  var domElement = rendering.parentNode;
  var width = domElement.clientWidth < context.minWidth ? context.minWidth : domElement.clientWidth;
  var height = domElement.clientHeight < context.minHeight ? context.minHeight : domElement.clientHeight;

  canvases.forEach(function (canvas) {
    /* eslint-disable no-param-reassign */
    canvas.width = width * context.pixelRatio;
    canvas.height = height * context.pixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    /* eslint-enable no-param-reassign */
    canvas.getContext('2d').scale(context.pixelRatio, context.pixelRatio);
  });
  return context;
}

function clearRect(canvas, bound) {
  if (bound) {
    canvas.getContext('2d').clearRect(bound.minX - 40, bound.minY - 40, bound.maxX - bound.minX + 80, bound.maxY - bound.minY + 80);
  } else {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
}

function computeImageSize(context, img, currentStroke) {
  var width = img.width;
  var height = img.height;
  var w = context.element.clientWidth;
  var h = context.element.clientHeight;
  if (!currentStroke.width && !currentStroke.height) {
    if (width / height > w / h) {
      currentStroke.width = Math.round(w * 0.6);
      currentStroke.height = Math.round(height * currentStroke.width / width);
    } else {
      currentStroke.height = Math.round(h * 0.6);
      currentStroke.width = Math.round(width * currentStroke.height / height);
    }
  }
  if (currentStroke.top === null) {
    currentStroke.top = Math.round((h - currentStroke.height) / 2);
  }
  if (currentStroke.left === null) {
    currentStroke.left = Math.round((w - currentStroke.width) / 2);
  }
}

/**
 * Attach the renderer to the DOM element
 * @param {Element} element DOM element to attach the rendering elements
 * @param {Number} [minHeight=0] Minimal height of the editor
 * @param {Number} [minWidth=0] Minimal width of the editor
 * @return {Object} The renderer context to give as parameter when a draw model will be call
 */
function attach$1(element, brushes) {
  var minHeight = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var minWidth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  // let pixelRatio = detectPixelRatio(element)
  var pixelRatio = 1;
  var renderingCanvas = createCanvas(element, 'rendering');
  var capturingCanvas = createCanvas(element, 'capturing');
  var temporaryCanvas = createCanvas(element, 'temporary');
  var renderingCanvasContext = renderingCanvas.getContext('2d');
  var capturingCanvasContext = capturingCanvas.getContext('2d');
  var temporaryCanvasContext = temporaryCanvas.getContext('2d');

  var context = {
    element: element,
    pixelRatio: pixelRatio,
    minHeight: minHeight,
    minWidth: minWidth,
    brushes: brushes,
    renderingCanvas: renderingCanvas,
    renderingCanvasContext: renderingCanvasContext,
    capturingCanvas: capturingCanvas,
    capturingCanvasContext: capturingCanvasContext,
    temporaryCanvas: temporaryCanvas,
    temporaryCanvasContext: temporaryCanvasContext,
    temporaryImages: {}
  };

  resizeContent(context);
  return context;
}

/**
 * Detach the renderer from the DOM element
 * @param {Element} element DOM element to attach the rendering elements
 * @param {Object} context Current rendering context
 */
function detach$1(element, context) {
  // context.resources.forEach(res => element.removeChild(res))
  element.removeChild(context.renderingCanvas);
  element.removeChild(context.capturingCanvas);
  element.removeChild(context.temporaryCanvas);
  // element.removeChild(context.animationCanvas)
}

/**
 * Update the rendering context size
 * @param {Object} context Current rendering context
 * @param {Model} model Current model
 * @return {Model}
 */
function resize(context, model) {
  return this.drawModel(resizeContent(context), model);
}

function drawSymbol(context, symbol) {
  var type = symbol.type;
  if (context.brushes[type]) {
    context.brushes[type].drawStroke(context.renderingCanvasContext, symbol);
  } else if (EraserSymbols[type]) {
    drawEraser(context.renderingCanvasContext, symbol);
  } else if (ImageSymbols[type]) {
    var img = context.temporaryImages[symbol.src];
    drawImage(context.renderingCanvasContext, symbol, img);
  }
}

/**
 * Draw the current stroke from the model
 * @param {Object} context Current rendering context
 * @param {Model} model Current model
 * @return {Model}
 */
function drawCurrentSymbol(context, model) {
  var opt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!model.currentStroke) return model;
  var modelRef = model;
  var currentStroke = modelRef.currentStroke;
  var pixelRatio = context.pixelRatio;
  var type = currentStroke && currentStroke.type;
  var StrokeBrush = void 0;

  if (StrokeBrush = context.brushes[type]) {
    // 清除缓存笔迹
    clearRect(context.capturingCanvas, getStrokeBounds(currentStroke));
    // 重新绘制当前笔画
    StrokeBrush.drawCurrentStroke(context.capturingCanvasContext, currentStroke, opt);
    // 抬笔时固化笔迹
    if (opt.drawFinal) {
      var _getStrokeBounds = getStrokeBounds(currentStroke),
          minX = _getStrokeBounds.minX,
          maxX = _getStrokeBounds.maxX,
          minY = _getStrokeBounds.minY,
          maxY = _getStrokeBounds.maxY;

      context.renderingCanvasContext.drawImage(context.capturingCanvas, minX * pixelRatio, minY * pixelRatio, (maxX - minX) * pixelRatio, (maxY - minY) * pixelRatio, minX, minY, maxX - minX, maxY - minY);
      clearRect(context.capturingCanvas, { minX: minX, maxX: maxX, minY: minY, maxY: maxY });
    }
  } else if (EraserSymbols[type]) {
    drawCurrentEraser(context.renderingCanvasContext, currentStroke);
  } else if (ImageSymbols[type]) {
    var img = context.temporaryImages[currentStroke.src];
    if (!img) {
      img = context.temporaryImages[currentStroke.src] = new Image();
      var onload = function onload() {
        computeImageSize(context, img, currentStroke);
        drawImage(context.renderingCanvasContext, currentStroke, img);
        img.removeEventListener('load', onload);
      };
      img.src = currentStroke.src;
      img.addEventListener('load', onload);
    } else {
      computeImageSize(context, img, currentStroke);
      drawImage(context.renderingCanvasContext, currentStroke, img);
    }
  }
  return modelRef;
}

/**
 * Draw all symbols contained into the model
 * @param {Object} context Current rendering context
 * @param {Model} model Current model
 * @return {Model}
 */
function drawModel(context, model) {
  clearRect(context.renderingCanvas);
  model.rawStrokes.forEach(function (symbol) {
    resizeStroke(context, symbol);
    drawSymbol(context, symbol);
  });
  clearRect(context.capturingCanvas);
  clearRect(context.temporaryCanvas);
  return model;
}

function resizeStroke(context, stroke) {
  var width = context.element.clientWidth;
  var height = context.element.clientHeight;
  var pageWidth = stroke.pageWidth,
      pageHeight = stroke.pageHeight;
  // stroke.x = stroke.x.map((x, i) => {
  //   return x * pageWidth / width
  // })
  // stroke.y = stroke.y.map((y, i) => {
  //   return y * pageHeight / height
  // })

  stroke.pageWidth = width;
  stroke.pageHeight = height;
  stroke.s = context.element.clientWidth / stroke.oriWidth;
}

var CanvasRenderer = /*#__PURE__*/Object.freeze({
  getInfo: getInfo,
  attach: attach$1,
  detach: detach$1,
  resize: resize,
  drawCurrentSymbol: drawCurrentSymbol,
  drawModel: drawModel
});

var type = 'pen';

// 渐隐的点的数量
var fadingNum = 3;
// 笔迹结束点的压力值
var endPressure = 0.4;
// 缓存Path
var curvePath$1 = new Path2D();

function getPoint(context, stroke, index) {
  var num = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  var endP = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.25;

  var point = getPointByIndex(context, stroke, index);
  if (stroke.drawByPen) return point;

  var length = stroke.x.length;
  if (!point || index < length - num) {
    return point;
  }

  var startIndex = length <= num ? 0 : length - num - 1;
  var startPressure = length <= num ? 0.75 : stroke.p[startIndex];
  var step = Math.min(length - 1, num);
  var stepPressure = (startPressure - endP) / step;
  point.p = startPressure - stepPressure * (index - startIndex);
  return point;
}

function computePressure$1(stroke, p) {
  var endP = endPressure;
  return Math.max(endP, p - fadingNum * 0.1);
  var x = stroke.x.slice(-fadingNum).map(function (x) {
    if (x <= 1) return x * stroke.pageWidth;
    return x;
  });
  var y = stroke.y.slice(-fadingNum).map(function (y) {
    if (y <= 1) return y * stroke.pageHeight;
    return y;
  });
  var firstX = x[0];
  var lastX = x[x.length - 1];
  var firstY = y[0];
  var lastY = y[y.length - 1];
  x.sort();
  y.sort();
  var diffX = x[x.length - 1] - x[0];
  var diffY = y[y.length - 1] - y[0];

  if (lastX - firstX > 2 && lastX - firstX < stroke.pageWidth / 60 && diffY < stroke.pageHeight / 120) {
    endP = p ? p : 0.75;
  }
  return endP;
}

/**
 * 计算连接点
 * @param {{x: Number, y: Number, p: Number}} point
 * @param angle
 * @param width
 * @return {[{x: Number, y: Number},{x: Number, y: Number}]}
 */
function computeLinksPoints(point, angle, width) {
  var radius = point.p * width;
  return [{
    x: point.x - Math.sin(angle) * radius,
    y: point.y + Math.cos(angle) * radius
  }, {
    x: point.x + Math.sin(angle) * radius,
    y: point.y - Math.cos(angle) * radius
  }];
}

/**
 * 计算中点
 * @param {{x: Number, y: Number, p: Number}} point1
 * @param {{x: Number, y: Number, p: Number}} point2
 * @return {{x: Number, y: Number, p: Number}}
 */
function computePoint(point1, point2) {
  var k = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.5;

  return {
    x: point1.x - (point1.x - point2.x) * k,
    y: point1.y - (point1.y - point2.y) * k,
    p: point1.p - (point1.p - point2.p) * k
  };
}

/**
 *
 * @param {{x: Number, y: Number}} begin
 * @param {{x: Number, y: Number}} end
 * @return {Number}
 */
function computeAxeAngle(begin, end) {
  return Math.atan2(end.y - begin.y, end.x - begin.x);
}

function renderArc(context, center, radius) {
  context.arc(center.x, center.y, radius * (center.p || 1), 0, Math.PI * 2, true);
}

function renderLine(context, begin, end, width) {
  var linkPoints1 = computeLinksPoints(begin, computeAxeAngle(begin, end), width);
  var linkPoints2 = computeLinksPoints(end, computeAxeAngle(begin, end), width);

  context.moveTo(linkPoints1[0].x, linkPoints1[0].y);
  context.lineTo(linkPoints2[0].x, linkPoints2[0].y);
  context.lineTo(linkPoints2[1].x, linkPoints2[1].y);
  context.lineTo(linkPoints1[1].x, linkPoints1[1].y);
}

function renderFinal(context, begin, end, width) {
  var ARCSPLIT = 6;
  var angle = computeAxeAngle(begin, end);
  var linkPoints = computeLinksPoints(end, angle, width);
  context.moveTo(linkPoints[0].x, linkPoints[0].y);
  for (var i = 1; i <= ARCSPLIT; i++) {
    var newAngle = angle - i * Math.PI / ARCSPLIT;
    context.lineTo(end.x - end.p * width * Math.sin(newAngle), end.y + end.p * width * Math.cos(newAngle));
  }
}

/**
 * 绘制二次贝塞尔曲线
 * @param {*} context
 * @param {*} begin
 * @param {*} end
 * @param {*} ctrl
 * @param {*} width
 */
function renderQuadratic(context, begin, end, ctrl, width) {
  var linkPoints1 = computeLinksPoints(begin, computeAxeAngle(begin, ctrl), width);
  var linkPoints2 = computeLinksPoints(end, computeAxeAngle(ctrl, end), width);
  var linkPoints3 = computeLinksPoints(ctrl, computeAxeAngle(begin, end), width);

  context.moveTo(linkPoints1[0].x, linkPoints1[0].y);
  context.quadraticCurveTo(linkPoints3[0].x, linkPoints3[0].y, linkPoints2[0].x, linkPoints2[0].y);
  context.lineTo(linkPoints2[1].x, linkPoints2[1].y);
  context.quadraticCurveTo(linkPoints3[1].x, linkPoints3[1].y, linkPoints1[1].x, linkPoints1[1].y);
}

/**
 * Draw a stroke on a canvas, using quadratics
 * @param {Object} context Current rendering context
 * @param {Stroke} stroke Current stroke to be drawn
 */
function drawStroke(context, stroke) {
  var contextReference = context;
  var color = stroke.color;
  var penWidthScaleVal = stroke.penWidthScaleVal || 1;
  var width = stroke.penWidth * Math.pow(penWidthScaleVal, 0.5) * Math.pow(stroke.s, 0.5);
  var length = stroke.x.length;

  contextReference.save();
  try {
    // 已有点的数量不足以绘制
    if (length <= fadingNum) return;

    contextReference.beginPath();
    curvePath$1 = new Path2D();

    var firstPoint = getPointByIndex(context, stroke, 0);
    var secondPoint = getPointByIndex(context, stroke, 1);
    var prev = void 0,
        curr = void 0,
        next = void 0;

    // 绘制第一个点，画圆
    renderArc(curvePath$1, firstPoint, width);

    // 绘制第二个点，连接至中点
    renderLine(curvePath$1, firstPoint, computePoint(firstPoint, secondPoint), width);

    // 绘制其他点，使用二次曲线
    for (var i = 2; i < length - fadingNum; i++) {
      prev = curr || getPointByIndex(context, stroke, i - 2);
      curr = next || getPointByIndex(context, stroke, i - 1);
      next = getPointByIndex(context, stroke, i);
      renderQuadratic(curvePath$1, computePoint(prev, curr), computePoint(curr, next), curr, width);
    }

    contextReference.fillStyle = color;
    contextReference.fill(curvePath$1);
    contextReference.closePath();
  } finally {
    contextReference.restore();
    drawFadingStroke(context, stroke);
  }
}

function drawCurrentStroke(context, stroke) {
  var contextReference = context;
  var penWidth = stroke.penWidth,
      color = stroke.color,
      penWidthScaleVal = stroke.penWidthScaleVal;

  var width = penWidth * penWidthScaleVal;
  var length = stroke.x.length;
  // const fadingNum = drawByPen ? 1 : 5

  contextReference.save();
  try {
    // 已有点的数量不足以绘制
    if (length <= fadingNum) return;

    contextReference.beginPath();

    var firstPoint = getPointByIndex(context, stroke, 0);
    var secondPoint = getPointByIndex(context, stroke, 1);
    var prev = void 0,
        curr = void 0,
        next = void 0;

    // 绘制第一个点，画圆
    if (stroke.r.length === 0) {
      curvePath$1 = new Path2D();
      renderArc(curvePath$1, firstPoint, width);
      stroke.r.push(1);
    }

    // 绘制第二个点，连接至中点
    if (stroke.r.length === 1) {
      renderLine(curvePath$1, firstPoint, computePoint(firstPoint, secondPoint), width);
      stroke.r.push(1);
    }

    // 绘制其他点，使用二次曲线
    if (stroke.r.length > 1) {
      for (var i = stroke.r.length; i < length - fadingNum; i++) {
        prev = curr || getPointByIndex(context, stroke, i - 2);
        curr = next || getPointByIndex(context, stroke, i - 1);
        next = getPointByIndex(context, stroke, i);
        renderQuadratic(curvePath$1, computePoint(prev, curr), computePoint(curr, next), curr, width);
        stroke.r.push(1);
      }
    }

    contextReference.fillStyle = color;
    contextReference.fill(curvePath$1);
    contextReference.closePath();
  } finally {
    contextReference.restore();
    drawFadingStroke(context, stroke);
  }
}

function drawFadingStroke(context, stroke) {
  var contextReference = context;
  var penWidth = stroke.penWidth,
      color = stroke.color,
      penWidthScaleVal = stroke.penWidthScaleVal;

  var width = penWidth * penWidthScaleVal;
  var length = stroke.x.length;

  // 结束绘制
  if (length === 0) return;

  contextReference.save();
  try {
    contextReference.beginPath();

    var _curvePath = new Path2D();
    var firstPoint = getPoint(context, stroke, 0, fadingNum);
    var secondPoint = getPoint(context, stroke, 1, fadingNum);
    var prev = void 0,
        curr = void 0,
        next = void 0;

    if (length === 1) {
      renderArc(_curvePath, firstPoint, width * 0.75);
    } else if (length === 2) {
      renderArc(_curvePath, firstPoint, width);
      renderLine(_curvePath, firstPoint, secondPoint, width);
      renderFinal(_curvePath, firstPoint, secondPoint, width);
    } else {
      var endP = endPressure;
      if (length <= fadingNum) {
        renderArc(_curvePath, firstPoint, width);
        renderLine(_curvePath, firstPoint, secondPoint, width);
      } else {
        endP = computePressure$1(stroke, stroke.p.slice(-1)[0]);
      }

      var penultimatePoint = getPoint(context, stroke, length - 2, fadingNum, endP);
      var lastPoint = getPoint(context, stroke, length - 1, fadingNum, endP);

      for (var i = Math.max(2, length - fadingNum); i < length; i++) {
        prev = curr || getPoint(context, stroke, i - 2, fadingNum, endP);
        curr = next || getPoint(context, stroke, i - 1, fadingNum, endP);
        next = getPoint(context, stroke, i, fadingNum, endP);
        renderQuadratic(_curvePath, computePoint(prev, curr), computePoint(curr, next), curr, width, true);
      }

      renderLine(_curvePath, computePoint(penultimatePoint, lastPoint), lastPoint, width);
      renderFinal(_curvePath, penultimatePoint, lastPoint, width);
    }

    contextReference.fillStyle = color;
    contextReference.fill(_curvePath);
    contextReference.closePath();
  } finally {
    contextReference.restore();
  }
}

var penBrush = /*#__PURE__*/Object.freeze({
  type: type,
  drawStroke: drawStroke,
  drawCurrentStroke: drawCurrentStroke,
  drawFadingStroke: drawFadingStroke
});

var type$1 = 'marker';

// 缓存Path
var curvePath$2 = new Path2D();

var THETA = Math.PI / 80;

function computeAxeAngle$1(begin, end) {
  return Math.atan2(end.y - begin.y, end.x - begin.x);
}

function computeQuadrant(begin, end) {
  var beginY = -begin.y;
  var endY = -end.y;
  var xx = 0;
  if (end.x > begin.x && endY < beginY) {
    xx = 1;
  } else if (end.x > begin.x && endY > beginY) {
    xx = 4;
  } else if (end.x < begin.x && endY > beginY) {
    xx = 3;
  } else if (end.x < begin.x && endY < beginY) {
    xx = 2;
  } else if (end.x > begin.x && endY === beginY) {
    xx = 5;
  } else if (end.x === begin.x && endY < beginY) {
    xx = 6;
  } else if (end.x < begin.x && endY === beginY) {
    xx = 7;
  } else if (end.x === begin.x && endY > beginY) {
    xx = 8;
  }
  return xx;
}

function computeEllipseParam(ellipse) {
  var sin = Math.sin(ellipse.theta);
  var cos = Math.cos(ellipse.theta);
  var sin_2 = Math.pow(sin, 2);
  var cos_2 = Math.pow(cos, 2);
  var a1_2 = Math.pow(ellipse.a, 2);
  var b1_2 = Math.pow(ellipse.b, 2);
  var A = a1_2 * sin_2 + b1_2 * cos_2;
  var B = 2 * (b1_2 - a1_2) * sin * cos;
  var C = a1_2 * cos_2 + b1_2 * sin_2;
  var D = -2 * A * ellipse.x - B * ellipse.y;
  var E = -B * ellipse.x - 2 * C * ellipse.y;
  var F = A * Math.pow(ellipse.x, 2) + B * ellipse.x * ellipse.y + C * Math.pow(ellipse.y, 2) - a1_2 * b1_2;
  return { A: A, B: B, C: C, D: D, E: E, F: F };
}

function computeTangentPoint(A, B, C, D, E, F, k, b) {
  var aa = A + B * k + C * Math.pow(k, 2);
  var bb = B * b + 2 * C * k * b + D + E * k;
  var x = -bb / (2 * aa);
  var y = k * x + b;
  return { x: x, y: y };
}

function computeTangentPoint2(A, B, C, D, E, F, t) {
  var x = t;
  var y = -(B * t + E) / (2 * C);
  return { x: x, y: y };
}

function computeCommonTangent(ellipse1, ellipse2) {
  var _computeEllipseParam = computeEllipseParam(ellipse1),
      A = _computeEllipseParam.A,
      B = _computeEllipseParam.B,
      C = _computeEllipseParam.C,
      D = _computeEllipseParam.D,
      E = _computeEllipseParam.E,
      F = _computeEllipseParam.F;

  var param2 = computeEllipseParam(ellipse2);
  var k = (ellipse1.y - ellipse2.y) / (ellipse1.x - ellipse2.x);
  var param_a = Math.pow(B, 2) - 4 * A * C;
  var param_b = 2 * B * D + 4 * C * D * k - 4 * A * E - 2 * B * E * k;
  var param_c = Math.pow(D + E * k, 2) - 4 * (A + B * k + C * Math.pow(k, 2)) * F;
  var result_b1 = (-param_b + Math.sqrt(Math.pow(param_b, 2) - 4 * param_a * param_c, 2)) / (2 * param_a);
  var result_b2 = (-param_b - Math.sqrt(Math.pow(param_b, 2) - 4 * param_a * param_c, 2)) / (2 * param_a);
  var p1 = computeTangentPoint(A, B, C, D, E, F, k, result_b1);
  var q1 = computeTangentPoint(A, B, C, D, E, F, k, result_b2);
  var p2 = computeTangentPoint(param2.A, param2.B, param2.C, param2.D, param2.E, param2.F, k, result_b1);
  var q2 = computeTangentPoint(param2.A, param2.B, param2.C, param2.D, param2.E, param2.F, k, result_b2);
  return { p1: p1, p2: p2, q1: q1, q2: q2 };
}

function computeCommonTangent2(ellipse1, ellipse2) {
  var _computeEllipseParam2 = computeEllipseParam(ellipse1),
      A = _computeEllipseParam2.A,
      B = _computeEllipseParam2.B,
      C = _computeEllipseParam2.C,
      D = _computeEllipseParam2.D,
      E = _computeEllipseParam2.E,
      F = _computeEllipseParam2.F;

  var param2 = computeEllipseParam(ellipse2);
  var param_a = Math.pow(B, 2) - 4 * A * C;
  var param_b = 2 * B * E - 4 * C * D;
  var param_c = Math.pow(E, 2) - 4 * C * F;
  var t1 = (-param_b + Math.sqrt(Math.pow(param_b, 2) - 4 * param_a * param_c, 2)) / (2 * param_a);
  var t2 = (-param_b - Math.sqrt(Math.pow(param_b, 2) - 4 * param_a * param_c, 2)) / (2 * param_a);
  var p1 = computeTangentPoint2(A, B, C, D, E, F, t1);
  var q1 = computeTangentPoint2(A, B, C, D, E, F, t2);
  var p2 = computeTangentPoint2(param2.A, param2.B, param2.C, param2.D, param2.E, param2.F, t1);
  var q2 = computeTangentPoint2(param2.A, param2.B, param2.C, param2.D, param2.E, param2.F, t2);
  return { p1: p1, p2: p2, q1: q1, q2: q2 };
}

function createEllipse(point, a, b, theta) {
  return {
    x: point.x,
    y: -point.y,
    a: a,
    b: b,
    theta: -theta
    // return {
    //   x: point.x,
    //   y: -point.y,
    //   a: a * point.p,
    //   b: b * point.p,
    //   theta: -theta
    // }
  };
}

function renderEllipse(context, ellipse) {
  if (!context.ellipse) return;
  var x = ellipse.x,
      y = ellipse.y,
      a = ellipse.a,
      b = ellipse.b,
      theta = ellipse.theta;

  context.ellipse(x, -y, a, b, -theta, 0, Math.PI * 2);
}

function renderCurve(context, ellipse1, ellipse2) {
  var quadrant = computeQuadrant(ellipse1, ellipse2);

  var _ref = quadrant === 6 || quadrant === 8 ? computeCommonTangent2(ellipse1, ellipse2) : computeCommonTangent(ellipse1, ellipse2),
      p1 = _ref.p1,
      p2 = _ref.p2,
      q1 = _ref.q1,
      q2 = _ref.q2;

  if (quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8) {
    context.moveTo(q1.x, -q1.y);
    context.lineTo(q2.x, -q2.y);
    context.ellipse(ellipse2.x, -ellipse2.y, ellipse2.a, ellipse2.b, -ellipse2.theta, ellipse2.theta - (Math.PI + computeAxeAngle$1(q2, ellipse2)), ellipse2.theta - (Math.PI + computeAxeAngle$1(p2, ellipse2)));
    context.lineTo(p1.x, -p1.y);
    context.lineTo(q1.x, -q1.y);
  } else if (quadrant === 2 || quadrant === 3 || quadrant === 7 || quadrant === 6) {
    context.moveTo(p1.x, -p1.y);
    context.lineTo(p2.x, -p2.y);
    context.ellipse(ellipse2.x, -ellipse2.y, ellipse2.a, ellipse2.b, -ellipse2.theta, ellipse2.theta - (Math.PI + computeAxeAngle$1(p2, ellipse2)), ellipse2.theta - (Math.PI + computeAxeAngle$1(q2, ellipse2)));
    context.lineTo(q1.x, -q1.y);
    context.lineTo(p1.x, -p1.y);
  }
}

function drawStroke$1(context, stroke) {
  var contextReference = context;
  var length = stroke.x.length;
  var color = stroke.color;
  var scaleVal = stroke.penWidthScaleVal || 1;
  var width = stroke.penWidth * Math.pow(scaleVal, 0.5) * Math.pow(stroke.s, 0.5);
  var firstPoint = getPointByIndex(context, stroke, 0);
  var a = width * (stroke.longAxis || 0.75);
  var b = width * (stroke.shortAxis || 0.3);
  var theta = stroke.theta || THETA;

  contextReference.save();
  try {
    contextReference.beginPath();
    curvePath$2 = new Path2D();

    if (firstPoint) {
      renderEllipse(curvePath$2, createEllipse(firstPoint, a, b, theta));
    }
    for (var i = 1; i < length; i++) {
      renderCurve(curvePath$2, createEllipse(getPointByIndex(context, stroke, i - 1), a, b, theta), createEllipse(getPointByIndex(context, stroke, i), a, b, theta));
    }

    contextReference.fillStyle = color;
    contextReference.fill(curvePath$2);
    contextReference.closePath();
  } finally {
    contextReference.restore();
  }
}

function drawCurrentStroke$1(context, stroke) {
  var contextReference = context;
  var length = stroke.x.length;
  var renderedLength = stroke.r.length;
  var color = stroke.color;
  var scaleVal = stroke.penWidthScaleVal || 1;
  var width = stroke.penWidth * Math.pow(scaleVal, 0.5) * Math.pow(stroke.s, 0.5);
  var firstPoint = getPointByIndex(context, stroke, 0);
  var a = width * (stroke.longAxis || 0.75);
  var b = width * (stroke.shortAxis || 0.3);
  var theta = stroke.theta || THETA;

  contextReference.save();
  try {
    contextReference.beginPath();

    if (length && renderedLength === 0) {
      curvePath$2 = new Path2D();
      renderEllipse(curvePath$2, createEllipse(firstPoint, a, b, theta));
      stroke.r.push(1);
    } else {
      var prevPoint = void 0,
          currPoint = void 0;
      for (var i = renderedLength; i < length; i++) {
        prevPoint = currPoint || getPointByIndex(context, stroke, i - 1);
        currPoint = getPointByIndex(context, stroke, i);
        renderCurve(curvePath$2, createEllipse(prevPoint, a, b, theta), createEllipse(currPoint, a, b, theta));
        stroke.r.push(1);
      }
    }

    contextReference.fillStyle = color;
    contextReference.fill(curvePath$2);
    contextReference.closePath();
  } finally {
    contextReference.restore();
  }
}

var markerBrush = /*#__PURE__*/Object.freeze({
  type: type$1,
  drawStroke: drawStroke$1,
  drawCurrentStroke: drawCurrentStroke$1
});

var distanceByPoints = function distanceByPoints(p1, p2) {
  return Math.floor(Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)));
};

var vector = function vector(p1, p2) {
  return [p2.x - p1.x, p2.y - p1.y];
};

var getTensionControlPoints = function getTensionControlPoints(p1, p2, p3) {
  var t = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.5;
  var x2 = p2.x,
      y2 = p2.y;

  var v = vector(p1, p3);
  var d01 = distanceByPoints(p1, p2);
  var d12 = distanceByPoints(p2, p3);
  var d012 = d01 + d12;
  return [{ x: x2 - v[0] * t * d01 / d012, y: y2 - v[1] * t * d01 / d012 }, { x: x2 + v[0] * t * d12 / d012, y: y2 + v[1] * t * d12 / d012 }];
};

var computeCurveControlPoints = function computeCurveControlPoints(pathPoints) {
  var tension = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.5;

  var pathControlPoints = [];
  var len = pathPoints.length;
  for (var i = 0; i < len - 2; i += 1) {
    var _getTensionControlPoi = getTensionControlPoints(pathPoints[i], pathPoints[i + 1], pathPoints[i + 2], tension),
        _getTensionControlPoi2 = slicedToArray(_getTensionControlPoi, 2),
        ctrl1 = _getTensionControlPoi2[0],
        ctrl2 = _getTensionControlPoi2[1];

    pathControlPoints.push(ctrl1, ctrl2);
  }
  return pathControlPoints;
};

/* eslint-disable */
// import paper from 'paper'

var tempProject = null;

function init() {
  if (!tempProject) {
    tempProject = new paper.Project(document.createElement('canvas'));
  }
  tempProject.activate();
  tempProject.clear();
}

var computeFlattenPoints = function computeFlattenPoints(pathPoints) {
  var tension = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  if (pathPoints.length < 3) return [];
  init();
  // pathPoints.forEach(p => {
  //   p.x = p.x * 10
  //   p.y = p.y * 10
  // })
  var myPath = new paper.Path(pathPoints);
  var points = Array.from(new Array(pathPoints.length - 1), function () {
    return [];
  });
  var i = 0;
  myPath.smooth({ type: 'catmull-rom', factor: tension });
  // myPath.simplify()
  myPath.flatten(0);
  myPath.segments.forEach(function (s) {
    if (s.point.x === pathPoints[i].x && s.point.y === pathPoints[i].y) {
      i++;
    } else {
      points[i - 1].push({ x: s.point.x, y: s.point.y });
    }
  });
  points.forEach(function (ps, t) {
    var start = pathPoints[t].p;
    var step = (pathPoints[t].p - pathPoints[t + 1].p) / (ps.length + 1);
    ps.forEach(function (p, m) {
      p.p = start - step * (m + 1);
      // p.x = p.x / 10
      // p.y = p.y / 10
    });
  });
  return points;
};

var computeFlattenPoints2 = function computeFlattenPoints2(pathPoints) {
  var tension = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  if (pathPoints.length < 3) return [];
  init();
  var myPath = new paper.Path(pathPoints);

  myPath.smooth({ type: 'continuous', factor: tension });
  myPath.simplify();

  var i = 0;
  var l = pathPoints.length;
  var segPoints = myPath.segments.map(function (s) {
    var p = 0.75;
    for (; i < l; i++) {
      if (s.point.x === pathPoints[i].x && s.point.y === pathPoints[i].y) {
        p = pathPoints[i].p;
        i++;
        break;
      }
    }
    // console.log(p)
    if (p === 0.75) i = 0;
    return { p: p, x: s.point.x, y: s.point.y };
  });

  myPath.flatten(0);

  var j = 0;
  var iplPoints = Array.from(new Array(segPoints.length - 1), function () {
    return [];
  });
  myPath.segments.forEach(function (s) {
    if (s.point.x === segPoints[j].x && s.point.y === segPoints[j].y) {
      j++;
    } else {
      iplPoints[j - 1].push({ x: s.point.x, y: s.point.y });
    }
  });
  iplPoints.forEach(function (ps, t) {
    var start = segPoints[t].p;
    var step = (segPoints[t].p - segPoints[t + 1].p) / (ps.length + 1);
    ps.forEach(function (p, m) {
      p.p = start - step * (m + 1);
    });
  });
  return { segPoints: segPoints, iplPoints: iplPoints };
};

// import { renderCurve } from '../stroker/CircleStroker'

var type$2 = 'ink';

// 渐隐的点的数量
var fadingNum$1 = 3;
// 笔迹结束点的压力值
var endPressure$1 = 0.4;
// 缓存Path
var curvePath$3 = new Path2D();

function getPoint$1(context, stroke, index) {
  var num = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  var endP = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.35;

  var point = getPointByIndex(context, stroke, index);
  if (stroke.drawByPen) return point;

  var length = stroke.x.length;
  if (!point || index < length - num) {
    return point;
  }

  var startIndex = length <= num ? 0 : length - num - 1;
  var startPressure = length <= num ? 0.75 : stroke.p[startIndex];
  var step = Math.min(length - 1, num);
  var stepPressure = (startPressure - endP) / step;
  point.p = startPressure - stepPressure * (index - startIndex);
  return point;
}

function computePressure$2(stroke, p) {
  var endP = endPressure$1;
  return Math.max(endP, p - fadingNum$1 * 0.1);
  // let x = stroke.x.slice(-fadingNum).map(x => {
  //   if (x <= 1) return x * stroke.pageWidth
  //   return x
  // })
  // let y = stroke.y.slice(-fadingNum).map(y => {
  //   if (y <= 1) return y * stroke.pageHeight
  //   return y
  // })
  // const firstX = x[0]
  // const lastX = x[x.length - 1]
  // const firstY = y[0]
  // const lastY = y[y.length - 1]
  // x.sort()
  // y.sort()
  // const diffX = x[x.length - 1] - x[0]
  // const diffY = y[y.length - 1] - y[0]
  // if (
  //   lastX - firstX > 2 &&
  //   lastX - firstX < stroke.pageWidth / 60 &&
  //   diffY < stroke.pageHeight / 120
  // ) {
  //   endP = p ? p : 0.65
  // }
  // return endP
}

function computeLinksPoints$1(point, angle, width) {
  var radius = point.p * width;
  return [{
    x: point.x - Math.sin(angle) * radius,
    y: point.y + Math.cos(angle) * radius
  }, {
    x: point.x + Math.sin(angle) * radius,
    y: point.y - Math.cos(angle) * radius
  }];
}

function computeAxeAngle$2(begin, end) {
  return Math.atan2(end.y - begin.y, end.x - begin.x);
}

/**
 * 绘制圆点
 * @param {*} context
 * @param {*} center
 * @param {*} radius
 */
function renderArc$1(context, center, radius) {
  context.arc(center.x, center.y, radius * (center.p || 0.75), 0, Math.PI * 2, true);
}

/**
 * 绘制直线
 * @param {*} context
 * @param {*} begin
 * @param {*} end
 * @param {*} width
 */
function renderLine$1(context, begin, end, width) {
  var linkPoints1 = computeLinksPoints$1(begin, computeAxeAngle$2(begin, end), width);
  var linkPoints2 = computeLinksPoints$1(end, computeAxeAngle$2(begin, end), width);

  context.moveTo(linkPoints1[0].x, linkPoints1[0].y);
  context.lineTo(linkPoints2[0].x, linkPoints2[0].y);
  context.lineTo(linkPoints2[1].x, linkPoints2[1].y);
  context.lineTo(linkPoints1[1].x, linkPoints1[1].y);
}

function renderLine2(context, begin, end, next, width) {
  var linkPoints1 = computeLinksPoints$1(begin, computeAxeAngle$2(begin, end), width);
  var linkPoints2 = computeLinksPoints$1(end, next ? computeAxeAngle$2(end, next) : computeAxeAngle$2(begin, end), width);

  context.moveTo(linkPoints1[0].x, linkPoints1[0].y);
  context.lineTo(linkPoints2[0].x, linkPoints2[0].y);
  context.lineTo(linkPoints2[1].x, linkPoints2[1].y);
  context.lineTo(linkPoints1[1].x, linkPoints1[1].y);
}

/**
 * 绘制二次贝塞尔曲线
 * @param {*} context
 * @param {*} begin
 * @param {*} end
 * @param {*} ctrl
 * @param {*} width
 */
function renderQuadratic$1(context, begin, end, ctrl, width) {
  var linkPoints1 = computeLinksPoints$1(begin, computeAxeAngle$2(begin, ctrl), width);
  var linkPoints2 = computeLinksPoints$1(end, computeAxeAngle$2(ctrl, end), width);
  var linkPoints3 = computeLinksPoints$1(ctrl, computeAxeAngle$2(begin, end), width);

  context.moveTo(linkPoints1[0].x, linkPoints1[0].y);
  context.quadraticCurveTo(linkPoints3[0].x, linkPoints3[0].y, linkPoints2[0].x, linkPoints2[0].y);
  context.lineTo(linkPoints2[1].x, linkPoints2[1].y);
  context.quadraticCurveTo(linkPoints3[1].x, linkPoints3[1].y, linkPoints1[1].x, linkPoints1[1].y);
}

/**
 * 绘制三次贝塞尔曲线
 * @param {*} context
 * @param {*} begin
 * @param {*} end
 * @param {*} control1
 * @param {*} control2
 * @param {*} width
 */
function renderBezier(context, begin, end, control1, control2, width) {
  var angle1 = computeAxeAngle$2(begin, control1);
  var angle2 = computeAxeAngle$2(control2, end);
  var linkPoints1 = computeLinksPoints$1(begin, angle1, width);
  var linkPoints2 = computeLinksPoints$1(end, angle2, width);
  var controlPoints1 = computeLinksPoints$1(control1, angle1, width);
  var controlPoints2 = computeLinksPoints$1(control2, angle2, width);
  context.moveTo(linkPoints1[0].x, linkPoints1[0].y);
  context.bezierCurveTo(controlPoints1[0].x, controlPoints1[0].y, controlPoints2[0].x, controlPoints2[0].y, linkPoints2[0].x, linkPoints2[0].y);
  context.lineTo(linkPoints2[1].x, linkPoints2[1].y);
  context.bezierCurveTo(controlPoints2[1].x, controlPoints2[1].y, controlPoints1[1].x, controlPoints1[1].y, linkPoints1[1].x, linkPoints1[1].y);
}

function renderBezier3(context, begin, end, flattenPoints, width) {
  var points = [begin].concat(toConsumableArray(flattenPoints), [end]);
  var length = points.length;
  for (var i = 0; i < length - 1; i++) {
    renderLine2(context, points[i], points[i + 1], points[i + 2], width);
  }
  context.moveTo(end.x, end.y);
  renderArc$1(context, end, width);
}

/**
 * 绘制结束点
 * @param {*} context
 * @param {*} begin
 * @param {*} end
 * @param {*} width
 */
function renderFinal$1(context, begin, end, width) {
  var ARCSPLIT = 6;
  var angle = computeAxeAngle$2(begin, end);
  var linkPoints = computeLinksPoints$1(end, angle, width);
  context.moveTo(linkPoints[0].x, linkPoints[0].y);
  for (var i = 1; i <= ARCSPLIT; i++) {
    var newAngle = angle - i * Math.PI / ARCSPLIT;
    context.lineTo(end.x - end.p * width * Math.sin(newAngle), end.y + end.p * width * Math.cos(newAngle));
  }
}

function drawStroke$2(context, stroke) {
  var contextReference = context;
  var color = stroke.color;
  var scaleVal = stroke.penWidthScaleVal || 1;
  var width = stroke.penWidth * Math.pow(scaleVal, 0.5) * Math.pow(stroke.s, 0.5);
  var length = stroke.x.length;

  contextReference.save();
  try {
    contextReference.beginPath();
    curvePath$3 = new Path2D();

    var pathPoints = [];
    for (var i = 0; i < length; i++) {
      pathPoints.push(getPointByIndex(context, stroke, i));
    }

    renderArc$1(curvePath$3, pathPoints[0], width);

    if (pathPoints.length > 2) {
      var _computeFlattenPoints = computeFlattenPoints2(pathPoints),
          segPoints = _computeFlattenPoints.segPoints,
          iplPoints = _computeFlattenPoints.iplPoints;

      for (var _i2 = 0; _i2 < segPoints.length - 1; _i2++) {
        renderBezier3(curvePath$3, segPoints[_i2], segPoints[_i2 + 1], iplPoints[_i2], width);
      }
    } else if (pathPoints.length > 1) {
      renderLine$1(curvePath$3, pathPoints[0], pathPoints[1], width);
    }

    contextReference.fillStyle = color;
    contextReference.fill(curvePath$3);
    contextReference.closePath();

    return;

    // 已有点的数量不足以绘制
    if (length <= fadingNum$1) return;

    contextReference.beginPath();

    curvePath$3 = new Path2D();
    var firstPoint = getPointByIndex(context, stroke, 0);
    var secondPoint = getPointByIndex(context, stroke, 1);
    var start = void 0,
        end = void 0;

    // 绘制第一个点，画圆
    renderArc$1(curvePath$3, firstPoint, width);

    // 计算控制点
    var endIndex = length - fadingNum$1 + 2;
    var points = [];
    for (var _i3 = 0; _i3 < endIndex; _i3++) {
      points.push(getPointByIndex(context, stroke, _i3));
    }
    var controlPoints = computeCurveControlPoints(points);

    // 合并path
    // const linkPoints1 = []
    // const linkPoints2 = []
    // const firstLinkPoint = computeLinksPoints(
    //   points[0],
    //   computeAxeAngle(
    //     points[0],
    //     Object.assign({ p: points[0].p }, controlPoints[0])
    //   ),
    //   width
    // )
    // linkPoints1.push(firstLinkPoint[0])
    // linkPoints2.push(firstLinkPoint[1])
    // for (let i = 1; i < endIndex; i++) {
    //   const linkPoint = computeLinksPoints(
    //     points[i],
    //     computeAxeAngle(
    //       points[i],
    //       Object.assign(
    //         { p: points[i].p },
    //         controlPoints[Math.min(2 * (i - 1), controlPoints.length - 1)]
    //       )
    //     ),
    //     width
    //   )
    //   linkPoints1.push(linkPoint[1])
    //   linkPoints2.push(linkPoint[0])
    // }
    // const ctrlPoints1 = computeCurveControlPoints(linkPoints1)
    // const ctrlPoints2 = computeCurveControlPoints(linkPoints2)
    // curvePath.moveTo(linkPoints1[0].x, linkPoints1[0].y)
    // curvePath.quadraticCurveTo(
    //   ctrlPoints1[0].x,
    //   ctrlPoints1[0].y,
    //   linkPoints1[1].x,
    //   linkPoints1[1].y
    // )
    // renderBezier2(curvePath, linkPoints1, ctrlPoints1)
    // linkPoints2.reverse()
    // ctrlPoints2.reverse()
    // curvePath.lineTo(linkPoints2[1].x, linkPoints2[1].y)
    // renderBezier2(curvePath, linkPoints2, ctrlPoints2)
    // curvePath.quadraticCurveTo(
    //   ctrlPoints2[ctrlPoints2.length - 1].x,
    //   ctrlPoints2[ctrlPoints2.length - 1].y,
    //   linkPoints2[linkPoints2.length - 1].x,
    //   linkPoints2[linkPoints2.length - 1].y
    // )

    // 绘制第二个点，使用二次曲线
    renderQuadratic$1(curvePath$3, firstPoint, secondPoint, Object.assign({ p: (firstPoint.p + secondPoint.p) / 2 }, controlPoints[0]), width);

    // 绘制其他点，使用三次曲线
    for (var _i4 = 2; _i4 < length - fadingNum$1; _i4++) {
      start = end || getPointByIndex(context, stroke, _i4 - 1);
      end = getPointByIndex(context, stroke, _i4);
      var control1 = controlPoints[2 * (_i4 - 1) - 1];
      var control2 = controlPoints[2 * (_i4 - 1)];
      control1.p = start.p;
      control2.p = end.p;
      renderBezier(curvePath$3, start, end, control1, control2, width);
    }

    contextReference.fillStyle = 'yellow';
    contextReference.stroke(curvePath$3);
    contextReference.closePath();
  } finally {
    contextReference.restore();
    // drawFadingStroke(context, stroke)
  }
}

function drawCurrentStroke$2(context, stroke) {
  var contextReference = context;
  var penWidth = stroke.penWidth,
      color = stroke.color,
      penWidthScaleVal = stroke.penWidthScaleVal;

  var width = penWidth * penWidthScaleVal;
  var length = stroke.x.length;
  // const fadingNum = drawByPen ? 1 : 5

  contextReference.save();
  try {
    // 已有点的数量不足以绘制
    if (length <= fadingNum$1) return;

    contextReference.beginPath();

    var firstPoint = getPointByIndex(context, stroke, 0);
    var secondPoint = getPointByIndex(context, stroke, 1);
    var start = void 0,
        end = void 0;

    // 绘制第一个点，画圆
    if (stroke.r.length === 0) {
      curvePath$3 = new Path2D();
      renderArc$1(curvePath$3, firstPoint, width);
      stroke.r.push(1);
    }

    // 计算控制点
    var startIndex = Math.max(0, stroke.r.length - 2);
    var points = stroke.x.slice(startIndex, length - fadingNum$1 + 1).map(function (x, i) {
      return {
        x: x,
        y: stroke.y[startIndex + i],
        p: stroke.p[startIndex + i]
      };
    });
    // let controlPoints = computeCurveControlPoints(points)
    // let controlPoints = computeCurveHandles(points)
    var flattenPoints = computeFlattenPoints(points);

    // 绘制第二个点，使用二次曲线
    if (stroke.r.length === 1 && flattenPoints.length > 1) {
      // const control = Object.assign(
      //   { p: (firstPoint.p + secondPoint.p) / 2 },
      //   controlPoints[0]
      // )
      // renderQuadratic(curvePath, firstPoint, secondPoint, control, width)
      renderBezier3(curvePath$3, firstPoint, secondPoint, flattenPoints[0], width);
      stroke.r.push(1);
    }

    // 绘制其他点，使用三次曲线
    if (stroke.r.length > 1 && stroke.r.length < length - fadingNum$1) {
      // renderBezier2(curvePath, points, controlPoints, width)

      for (var i = stroke.r.length, j = 2; i < length - fadingNum$1; i++, j++) {
        start = end || getPointByIndex(context, stroke, i - 1);
        end = getPointByIndex(context, stroke, i);
        renderBezier3(curvePath$3, start, end, flattenPoints[j - 1], width);
        stroke.r.push(1);
      }
      // for (let i = stroke.r.length, j = 2; i < length - fadingNum; i++, j++) {
      //   // prev = start || getPointByIndex(context, stroke, i - 2)
      //   start = end || getPointByIndex(context, stroke, i - 1)
      //   end = next || getPointByIndex(context, stroke, i)
      //   // next = getPointByIndex(context, stroke, i + 1)
      //   let control1 = controlPoints[2 * (j - 1) - 1]
      //   let control2 = controlPoints[2 * (j - 1)]
      //   control1.p = start.p
      //   control2.p = end.p
      //   renderBezier(curvePath, prev, start, end, next, control1, control2, width)
      //   stroke.r.push(1)
      // }
    }

    contextReference.fillStyle = color;
    contextReference.fill(curvePath$3);
    contextReference.closePath();
  } finally {
    contextReference.restore();
    drawFadingStroke$1(context, stroke);
  }
}

function drawFadingStroke$1(context, stroke) {
  var contextReference = context;
  var penWidth = stroke.penWidth,
      color = stroke.color,
      penWidthScaleVal = stroke.penWidthScaleVal;

  var width = penWidth * penWidthScaleVal;
  var length = stroke.x.length;

  // 结束绘制
  if (length === 0) return;

  contextReference.save();
  try {
    contextReference.beginPath();

    var _curvePath = new Path2D();
    var firstPoint = getPoint$1(context, stroke, 0, fadingNum$1);
    var secondPoint = getPoint$1(context, stroke, 1, fadingNum$1);
    var start = void 0,
        end = void 0;

    if (length === 1) {
      renderArc$1(_curvePath, firstPoint, width * 0.75);
    } else if (length === 2) {
      renderArc$1(_curvePath, firstPoint, width);
      renderLine$1(_curvePath, firstPoint, secondPoint, width);
      renderFinal$1(_curvePath, firstPoint, secondPoint, width);
    } else {
      var endP = endPressure$1;

      if (length <= fadingNum$1) {
        renderArc$1(_curvePath, firstPoint, width);
      } else {
        endP = computePressure$2(stroke, stroke.p.slice(-1)[0]);
      }

      // 计算控制点
      secondPoint = getPoint$1(context, stroke, 1, fadingNum$1, endP);
      var startIndex = Math.max(0, length - fadingNum$1 - 2);
      var points = [];
      for (var i = startIndex; i < length; i++) {
        points.push(getPoint$1(context, stroke, i, fadingNum$1, endP));
      }
      var flattenPoints = computeFlattenPoints(points);
      // const controlPoints = computeCurveControlPoints(points)
      var penultimatePoint = getPoint$1(context, stroke, length - 2, fadingNum$1, endP);
      var lastPoint = getPoint$1(context, stroke, length - 1, fadingNum$1, endP);

      if (length <= fadingNum$1 + 1) {
        // renderQuadratic(
        //   curvePath,
        //   firstPoint,
        //   secondPoint,
        //   Object.assign(
        //     { p: (firstPoint.p + secondPoint.p) / 2 },
        //     controlPoints[0]
        //   ),
        //   width
        // )
        renderBezier3(_curvePath, firstPoint, secondPoint, flattenPoints[0], width);
      }

      for (var _i5 = startIndex + 2, j = 2; _i5 < length - 1; _i5++, j++) {
        start = end || getPoint$1(context, stroke, _i5 - 1, fadingNum$1, endP);
        end = getPoint$1(context, stroke, _i5, fadingNum$1, endP);
        renderBezier3(_curvePath, start, end, flattenPoints[j - 1], width);
        // let control1 = controlPoints[2 * (j - 1) - 1]
        // let control2 = controlPoints[2 * (j - 1)]
        // control1.p = start.p
        // control2.p = end.p
        // renderBezier(curvePath, start, end, control1, control2, width)
      }

      // renderQuadratic(
      //   curvePath,
      //   penultimatePoint,
      //   lastPoint,
      //   Object.assign(
      //     { p: (penultimatePoint.p + lastPoint.p) / 2 },
      //     controlPoints[controlPoints.length - 1]
      //   ),
      //   width
      // )
      renderBezier3(_curvePath, penultimatePoint, lastPoint, flattenPoints[flattenPoints.length - 1], width);
      renderFinal$1(_curvePath, penultimatePoint, lastPoint, width);
    }

    contextReference.fillStyle = color;
    contextReference.fill(_curvePath);
    contextReference.closePath();
  } finally {
    contextReference.restore();
  }
}

var inkBrush = /*#__PURE__*/Object.freeze({
  type: type$2,
  drawStroke: drawStroke$2,
  drawCurrentStroke: drawCurrentStroke$2,
  drawFadingStroke: drawFadingStroke$1
});

/**
 * Emits an event when the editor state change
 * @param {String} type
 * @param {Object} data
 * @emits {Event}
 */
function eventCallback(type, data) {
  // logger.info(`emitting ${type} event`, data);
  // We are making usage of a browser provided class
  // eslint-disable-next-line no-undef
  this.dispatchEvent(new CustomEvent(type, Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined)));
}

/**
 * Default behaviors
 * @type {Behaviors}
 */
var defaultBehaviors = {
  grabberList: [PointerEventGrabber],
  rendererList: [CanvasRenderer],
  brushList: [penBrush, markerBrush, inkBrush],
  recognizerList: [],
  callbacks: [eventCallback],
  getBehaviorFromConfiguration: function getBehaviorFromConfiguration(behaviors, configuration) {
    var behavior = {};
    var brushes = {};
    behavior.grabber = PointerEventGrabber;
    behavior.renderer = CanvasRenderer;
    behavior.callbacks = behaviors.callbacks;
    behaviors.brushList.forEach(function (brush) {
      if (brush.type) {
        brushes[brush.type] = brush;
      }
    });
    behavior.brushes = brushes;
    return behavior;
  }

  /**
   * Generate behaviors
   * @param {Behaviors} behaviors Behaviors to be used
   * @return {Behaviors} Overridden behaviors
   */
};function overrideDefaultBehaviors() {
  return defaultBehaviors;
}

/**
 * Recognition positions
 * @typedef {Object} RecognitionPositions
 * @property {Number} [lastSentPosition=-1] Index of the last sent stroke.
 * @property {Number} [lastReceivedPosition=-1] Index of the last received stroke.
 * @property {Number} [lastRenderedPosition=-1] Last rendered recognized symbol position
 */

/**
 * Raw results
 * @typedef {Object} RawResults
 * @property {Object} convert=undefined The convert result
 * @property {Object} exports=undefined The exports output as return by the recognition service.
 */

/**
 * Editor model
 * @typedef {Object} Model
 * @property {Stroke} currentStroke=undefined Stroke in building process.
 * @property {Array<Stroke>} rawStrokes=[] List of captured strokes.
 * @property {Array} strokeGroups=[] Group of strokes with same pen style.
 * @property {Array<Object>} defaultSymbols=[] Default symbols, relative to the current recognition type.
 * @property {Array<Object>} recognizedSymbols=undefined Symbols to render (e.g. stroke, shape primitives, string, characters...).
 * @property {Object} exports=undefined Result of the export (e.g. mathml, latex, text...).
 * @property {RawResults} rawResults The recognition output as return by the recognition service.
 * @property {Number} creationTime Date of creation timestamp.
 * @property {Number} modificationTime=undefined Date of lastModification.
 */

/**
 * Bounding box
 * @typedef {Object} Bounds
 * @property {Number} minX Minimal x coordinate
 * @property {Number} maxX Maximal x coordinate
 * @property {Number} minY Minimal y coordinate
 * @property {Number} maxY Maximal y coordinate
 */

/**
 * Create a new model
 * @param {Configuration} [configuration] Parameters to use to populate default recognition symbols
 * @return {Model} New model
 */
function createModel(configuration) {
  // see @typedef documentation on top
  return {
    currentStroke: undefined,
    // currentStrokes: [],
    rawStrokes: [],
    strokeGroups: [],
    defaultSymbols: [],
    recognizedSymbols: undefined,
    exports: undefined,
    rawResults: {
      convert: undefined,
      exports: undefined
    },
    creationTime: new Date().getTime(),
    modificationTime: undefined
  };
}

/**
 * Clear the model.
 * @param {Model} model Current model
 * @return {Model} Cleared model
 */
function clearModel(model) {
  var modelReference = model;
  modelReference.currentStroke = undefined;
  modelReference.rawStrokes = [];
  modelReference.strokeGroups = [];
  modelReference.recognizedSymbols = undefined;
  modelReference.exports = undefined;
  modelReference.rawResults.convert = undefined;
  modelReference.rawResults.exports = undefined;
  return modelReference;
}

/**
 * Check if the model needs to be redrawn.
 * @param {Model} model Current model
 * @return {Boolean} True if the model needs to be redrawn, false otherwise
 */
function needRedraw(model) {
  debugger;
  var lastStroke = model.rawStrokes.slice(-1)[0];
  return !(lastStroke && lastStroke.pathChange);
}

/**
 * Mutate the model given in parameter by adding the new strokeToAdd.
 * @param {Model} model Current model
 * @param {Stroke} stroke Stroke to be added to pending ones
 * @return {Model} Updated model
 */
function addStroke(context, model, stroke) {
  // We use a reference to the model. The purpose here is to update the pending stroke only.
  var modelReference = model;
  if (!stroke.id) {
    stroke.id = stroke.type + '-' + Date.now();
  }
  if (stroke._x) delete stroke._x;
  if (stroke._y) delete stroke._y;
  if (stroke.l) delete stroke.l;
  if (stroke.r) delete stroke.r;
  if (stroke.pointer) delete stroke.pointer;

  // 转换为相对坐标
  var pageWidth = stroke.pageWidth || context.canvas.offsetWidth;
  var pageHeight = stroke.pageHeight || context.canvas.offsetHeight;
  if (stroke.x && stroke.y && stroke.x[0] > 2 && stroke.y[0] > 2) ;
  stroke.pageWidth = pageWidth;
  stroke.pageHeight = pageHeight;

  modelReference.rawStrokes.push(stroke);
  return modelReference;
}

/**
 * Mutate the model by adding a point and close the current stroke.
 * @param {Model} model Current model
 * @param {{x: Number, y: Number, t: Number}} point Captured point to create current stroke
 * @param {Object} properties Properties to be applied to the current stroke
 * @param {Number} [dpi=96] The screen dpi resolution
 * @return {Model} Updated model
 */
function initPendingStroke(model, point, properties, context) {
  // if (properties && properties['penWidth']) {
  //   Object.assign(properties, { width: properties['penWidth'] })
  // }
  if (context) {
    properties.pageWidth = context.canvas.offsetWidth;
    properties.pageHeight = context.canvas.offsetHeight;
    properties.oriWidth = context.canvas.offsetWidth;
    properties.oriHeight = context.canvas.offsetHeight;
  }
  var modelReference = model;
  modelReference.currentStroke = createStrokeComponent(properties);
  modelReference.currentStroke = addPoint(modelReference.currentStroke, point);
  return modelReference;
}

/**
 * Mutate the model by adding a point to the current pending stroke.
 * @param {Model} model Current model
 * @param {{x: Number, y: Number, t: Number}} point Captured point to be append to the current stroke
 * @return {Model} Updated model
 */
function appendToPendingStroke(model, point) {
  var modelReference = model;
  if (modelReference.currentStroke) {
    modelReference.currentStroke = addPoint(modelReference.currentStroke, point);
  }
  return modelReference;
}

/**
 * Mutate the model by adding the new point on a initPendingStroke.
 * @param {Model} model Current model
 * @param {{x: Number, y: Number, t: Number}} point Captured point to be append to the current stroke
 * @param {PenStyle} penStyle
 * @return {Model} Updated model
 */
function endPendingStroke(model, context) {
  var modelReference = model;
  if (modelReference.currentStroke) {
    var currentStroke = modelReference.currentStroke;
    addStroke(context, modelReference, currentStroke);
    delete modelReference.currentStroke;
  }
  return modelReference;
}

function initPendingImage(model, properties, context) {
  if (context) {
    properties.pageWidth = context.canvas.offsetWidth;
    properties.pageHeight = context.canvas.offsetHeight;
  }
  var modelReference = model;
  modelReference.currentStroke = createImageComponent(properties);
  return modelReference;
}

/**
 * Get the bounds of the current model.
 * @param {Model} model Current model
 * @return {Bounds} Bounding box enclosing the current drawn model
 */
function getBorderCoordinates(model) {
  var modelBounds = {
    minX: Number.MAX_VALUE,
    maxX: Number.MIN_VALUE,
    minY: Number.MAX_VALUE,
    maxY: Number.MIN_VALUE
  };
  modelBounds = getSymbolsBounds(model.rawStrokes, modelBounds);
  return modelBounds;
}

/**
 * Clone model
 * @param {Model} model Current model
 * @return {Model} Clone of the current model
 */
function cloneModel(model) {
  var clonedModel = Object.assign({}, model);
  // We clone the properties that need to be. Take care of arrays.
  clonedModel.defaultSymbols = [].concat(toConsumableArray(model.defaultSymbols));
  clonedModel.currentStroke = model.currentStroke ? Object.assign({}, model.currentStroke) : undefined;
  clonedModel.rawStrokes = [].concat(toConsumableArray(model.rawStrokes));
  clonedModel.strokeGroups = JSON.parse(JSON.stringify(model.strokeGroups));
  clonedModel.exports = model.exports ? Object.assign({}, model.exports) : undefined;
  clonedModel.rawResults = Object.assign({}, model.rawResults);
  clonedModel.recognizedSymbols = model.recognizedSymbols ? [].concat(toConsumableArray(model.recognizedSymbols)) : undefined;
  return clonedModel;
}

/**
 * Merge models
 * @param {...Model} models Models to merge (ordered)
 * @return {Model} Updated model
 */
function mergeModels() {
  for (var _len = arguments.length, models = Array(_len), _key = 0; _key < _len; _key++) {
    models[_key] = arguments[_key];
  }

  return models.reduce(function (a, b) {
    var modelRef = a;
    modelRef.recognizedSymbols = b.recognizedSymbols;
    modelRef.rawResults = b.rawResults;
    modelRef.exports = b.exports;
    return modelRef;
  });
}

var InkModel = /*#__PURE__*/Object.freeze({
  createModel: createModel,
  clearModel: clearModel,
  needRedraw: needRedraw,
  addStroke: addStroke,
  initPendingStroke: initPendingStroke,
  appendToPendingStroke: appendToPendingStroke,
  endPendingStroke: endPendingStroke,
  initPendingImage: initPendingImage,
  getBorderCoordinates: getBorderCoordinates,
  cloneModel: cloneModel,
  mergeModels: mergeModels
});

/**
 * Undo/redo context
 * @typedef {Object} UndoRedoContext
 * @property {Array<Model>} stack=[] List of processed models.
 * @property {Number} currentPosition=-1 Current model index into the stack.
 * @property {Number} maxSize Max size of the stack.
 * @property {Boolean} canUndo=false
 * @property {Boolean} canRedo=false
 */

/**
 * Create a new undo/redo context
 * @param {Configuration} configuration Current configuration
 * @return {UndoRedoContext} New undo/redo context
 */
function createUndoRedoContext(configuration) {
  return {
    stack: [],
    currentPosition: -1,
    maxSize: configuration.undoRedoMaxStackSize,
    canUndo: false,
    canRedo: false
  };
}

/**
 * Update the undo/redo state
 * @param {UndoRedoContext} undoRedoContext Current undo/redo context
 * @return {UndoRedoContext} Updated undo/redo context
 */
function updateUndoRedoState(undoRedoContext) {
  var undoRedoContextRef = undoRedoContext;
  undoRedoContextRef.canUndo = undoRedoContext.currentPosition > 0;
  undoRedoContextRef.canRedo = undoRedoContext.currentPosition < undoRedoContext.stack.length - 1;
  return undoRedoContextRef;
}

function resetUndoRedoState(undoRedoContext) {
  var undoRedoContextRef = undoRedoContext;
  undoRedoContextRef.currentPosition = -1;
  undoRedoContextRef.canUndo = false;
  undoRedoContextRef.canRedo = false;
  undoRedoContextRef.stack = [];
  return undoRedoContextRef;
}

/**
 * Undo/redo manager
 * @typedef {Object} UndoRedoManager
 * @property {function(undoRedoContext: UndoRedoContext, model: Model, callback: UpdateCallback)} updateModel Push the current model into the undo/redo context.
 * @property {function(undoRedoContext: UndoRedoContext, model: Model, callback: UpdateCallback)} undo Undo.
 * @property {function(undoRedoContext: UndoRedoContext, model: Model, callback: UpdateCallback)} redo Redo.
 * @property {function(undoRedoContext: UndoRedoContext, model: Model, callback: UpdateCallback)} clear Clear.
 */

/**
 * Get current model in stack
 * @param {UndoRedoContext} undoRedoContext Current undo/redo context
 * @param {function(err: Object, res: Model, types: ...String)} callback
 * @param {Boolean} [clone=true] Whether or not to clone the model
 * @param {...String} types
 */
function getModel(undoRedoContext, callback) {
  var clone = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var model = undoRedoContext.stack[undoRedoContext.currentPosition];

  for (var _len = arguments.length, types = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    types[_key - 3] = arguments[_key];
  }

  callback.apply(undefined, [clone ? cloneModel(model) : model].concat(types));
}

/**
 * Mutate the undoRedo stack by adding a new model to it.
 * @param {UndoRedoContext} undoRedoContext Current undo/redo context.
 * @param {Model} model Current model.
 * @param {function(err: Object, res: Model, types: ...String)} callback
 */
function updateModel(undoRedoContext, model, callback) {
  // Used to update the model with the recognition result if relevant
  var modelIndex = undoRedoContext.stack.findIndex(function (item) {
    return item.modificationTime === model.modificationTime && item.rawStrokes.length === model.rawStrokes.length;
  });

  var modelReference = model;
  modelReference.modificationTime = new Date().getTime();

  var types = [];
  if (modelIndex > -1) {
    undoRedoContext.stack.splice(modelIndex, 1, cloneModel(modelReference));
    // logger.debug('model updated', modelReference)
  } else {
    var undoRedoContextReference = undoRedoContext;
    undoRedoContextReference.currentPosition += 1;
    undoRedoContextReference.stack = undoRedoContextReference.stack.slice(0, undoRedoContextReference.currentPosition);
    undoRedoContextReference.stack.push(cloneModel(modelReference));
    if (undoRedoContextReference.stack.length > undoRedoContextReference.maxSize) {
      undoRedoContextReference.stack.shift();
      undoRedoContextReference.currentPosition--;
    }
    // logger.debug('model pushed', modelReference)
    types.push(Constants.EventType.CHANGED);
  }
  updateUndoRedoState(undoRedoContext);
  // logger.debug('undo/redo stack updated', undoRedoContext)
  getModel.apply(undefined, [undoRedoContext, callback, false].concat(types));
}

/**
 * Undo
 * @param {UndoRedoContext} undoRedoContext Current undo/redo context.
 * @param {Model} model Current model.
 * @param {function(err: Object, res: Model, types: ...String)} callback
 */
function undo(undoRedoContext, model, callback) {
  var undoRedoContextReference = undoRedoContext;
  if (undoRedoContextReference.currentPosition > 0) {
    undoRedoContextReference.currentPosition -= 1;
    updateUndoRedoState(undoRedoContext);
    // logger.debug('undo index', undoRedoContextReference.currentPosition)
  }
  getModel(undoRedoContext, callback, true, Constants.EventType.CHANGED);
}

/**
 * Redo
 * @param {UndoRedoContext} undoRedoContext Current undo/redo context.
 * @param {Model} model Current model.
 * @param {function(err: Object, res: Model, types: ...String)} callback
 */
function redo(undoRedoContext, model, callback) {
  var undoRedoContextReference = undoRedoContext;
  if (undoRedoContextReference.currentPosition < undoRedoContextReference.stack.length - 1) {
    undoRedoContextReference.currentPosition += 1;
    updateUndoRedoState(undoRedoContext);
    // logger.debug('redo index', undoRedoContextReference.currentPosition)
  }
  getModel(undoRedoContext, callback, true, Constants.EventType.CHANGED);
}

var UndoRedoManager = /*#__PURE__*/Object.freeze({
  getModel: getModel,
  updateModel: updateModel,
  undo: undo,
  redo: redo
});

function createCanvas$1(borderCoordinates) {
  var margin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

  // eslint-disable-next-line no-undef
  var browserDocument = document;
  var canvas = browserDocument.createElement('canvas');
  canvas.width = Math.abs(borderCoordinates.maxX - borderCoordinates.minX) + 2 * margin;
  canvas.style.width = canvas.width + 'px';
  canvas.height = Math.abs(borderCoordinates.maxY - borderCoordinates.minY) + 2 * margin;
  canvas.style.height = canvas.height + 'px';
  return canvas;
}

/**
 * Generate a PNG image data url from the model
 * @param {Model} model Current model
 * @param {Number} [margin=10] Margins to apply around the image
 * @return {String} Image data string result
 */
function getImage(model) {
  var margin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

  if (model.rawStrokes.length > 0) {
    var borderCoordinates = getBorderCoordinates(model);
    var capturingCanvas = createCanvas$1(borderCoordinates, margin);
    var renderingCanvas = createCanvas$1(borderCoordinates, margin);
    var renderStructure = {
      renderingCanvas: renderingCanvas,
      renderingCanvasContext: renderingCanvas.getContext('2d'),
      capturingCanvas: capturingCanvas,
      capturingCanvasContext: capturingCanvas.getContext('2d')
      // Change canvas origin
    };renderStructure.renderingCanvasContext.translate(-borderCoordinates.minX + margin, -borderCoordinates.minY + margin);
    drawModel(renderStructure, model);
    return renderStructure.renderingCanvas.toDataURL('image/png');
  }
  return null;
}

/* eslint-disable no-underscore-dangle */

var EventType = Constants.EventType;

var requestAnimFrame = function () {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
}();

function triggerCallbacks(editor, data) {
  for (var _len = arguments.length, types = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    types[_key - 2] = arguments[_key];
  }

  types.forEach(function (type) {
    switch (type) {
      case EventType.RENDERED:
        break; // Internal use only
      case EventType.UNDO:
      case EventType.REDO:
      case EventType.CLEAR:
        editor.callbacks.forEach(function (callback) {
          return callback.call(editor.domElement, type);
        });
        break;
      case EventType.LOADED:
      case EventType.CHANGED:
        editor.callbacks.forEach(function (callback) {
          return callback.call(editor.domElement, type, {
            initialized: editor.initialized,
            canUndo: editor.canUndo,
            canRedo: editor.canRedo,
            canClear: editor.canClear,
            isEmpty: editor.isEmpty
          });
        });
        break;
      case EventType.ERROR:
        editor.callbacks.forEach(function (callback) {
          return callback.call(editor.domElement, type, data);
        });
        break;
      case 'pointer-down':
      case 'pointer-move':
      case 'pointer-up':
        editor.callbacks.forEach(function (callback) {
          return callback.call(editor.domElement, type, data);
        });
        break;
      default:
        break;
    }
  });
}

/**
 * Manage recognized model
 * @param {Editor} editor
 * @param {Model} model
 * @param {...String} types
 */
function manageModel(editor, model) {
  var editorRef = editor;
  var modelRef = model;
  if (modelRef.creationTime === editor.model.creationTime) {
    for (var _len2 = arguments.length, types = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      types[_key2 - 2] = arguments[_key2];
    }

    if (modelRef.rawStrokes.length === editor.model.rawStrokes.length) {
      editorRef.model = mergeModels(editorRef.model, modelRef);
      // InkModel.needRedraw(editorRef.model)
      if (types.includes(EventType.RENDERED)) {
        editor.renderer.drawModel(editor.rendererContext, editorRef.model);
      }
    } else {
      editorRef.model = modelRef;
      editor.renderer.drawModel(editor.rendererContext, editorRef.model);
    }
    triggerCallbacks.apply(undefined, [editor, undefined].concat(types));
  }
}

/**
 * Update callback
 * @param {Editor} editor
 * @param {Object} error
 * @param {Model} model
 * @param {...String} events
 */
function updateCallback(editor, model) {
  for (var _len3 = arguments.length, events = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
    events[_key3 - 2] = arguments[_key3];
  }

  var editorRef = editor;

  var handleResult = function handleResult(res) {
    for (var _len4 = arguments.length, types = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      types[_key4 - 1] = arguments[_key4];
    }

    manageModel.apply(undefined, [editorRef, res].concat(toConsumableArray([].concat(events, types).filter(function (el, i, a) {
      return i === a.indexOf(el);
    }))));
  };

  editor.undoRedoManager.updateModel(editor.undoRedoContext, model, handleResult);
}

/**
 * Editor
 */

var Editor = function () {
  /**
   * @param {Element} element DOM element to attach this editor
   * @param {Configuration} [configuration] Configuration to apply
   * @param {Theme} [theme] Custom theme to apply
   * @param {PenStyle} [penStyle] Custom style to apply
   * @param {Behaviors} [behaviors] Custom behaviors to apply
   */
  function Editor(element, configuration, theme, penStyle) {
    classCallCheck(this, Editor);

    /**
     * Inner reference to the DOM Element
     * @type {Element}
     */
    element.classList.add('mw-editor');

    element.style.inset = 'auto'
    element.style.top = 0
    element.style.left = 0;
    element.style.right = 0;

    // element.style.position = 'relative' // 通过 configuration 来配置
    element.style.touchAction = 'none';
    let banSetHeight = Boolean(element.dataset.banSetHeight)
    if (!banSetHeight) {
      element.style.height = '100%'; // FIXME: 设置高度100%的化只能让传入SDK的dom元素的父级有高度
    }
    this.domElement = element;
    this.editorId = 'editor-' + Date.now();
    this.transformScale = 1;
    // 0正立，1左转90度，2左转180度，3右转90度
    this.rotateType = 0

    /**
     * @private
     * @type {Behaviors}
     */
    this.innerBehaviors = overrideDefaultBehaviors({});
    this.configuration = configuration;
    this.startDraw = function () {};
    this.endDraw = function () {};

    /**
     * Pen color used only for pending stroke
     * @type {string}
     */
    this.localTheme = '';
    this.theme = theme;
    this.penStyle = penStyle;

    this.ticking = false;
    this.domElement.editor = this;

    var eraserElement = document.createElement('img');
    eraserElement.style.position = 'absolute';
    eraserElement.style.display = 'none';
    eraserElement.style.pointerEvents = 'none';
    eraserElement.style.transform = 'translate(-50%, -50%)';
    element.appendChild(eraserElement);
    this.eraserElement = eraserElement;
  }

  /**
   * Set the recognition parameters
   * WARNING : Need to fire a clear if user have already input some strokes.
   * @param {Configuration} configuration
   */


  createClass(Editor, [{
    key: 'setGroup',


    // 设置 groupID
    value: function setGroup() {
      var _this = this;

      var newGroup = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var oldGroup = this.innerConfiguration.group;
      if (oldGroup && oldGroup != newGroup) {
        var _Editor$groupMap$oldG = Editor.groupMap[oldGroup],
            _Editor$groupMap$oldG2 = _Editor$groupMap$oldG.editors,
            editors = _Editor$groupMap$oldG2 === undefined ? [] : _Editor$groupMap$oldG2,
            _Editor$groupMap$oldG3 = _Editor$groupMap$oldG.undoRedoContext,
            undoRedoContext = _Editor$groupMap$oldG3 === undefined ? [] : _Editor$groupMap$oldG3;

        editors = editors.filter(function (ele) {
          return ele.editorId !== _this.editorId;
        });
        undoRedoContext = undoRedoContext.filter(function (ele) {
          return ele.editorId !== _this.editorId;
        });
        Editor.groupMap[oldGroup].editors = editors;
        Editor.groupMap[oldGroup].undoRedoContext = undoRedoContext;
      }
      this.innerConfiguration.group = newGroup;
      if (newGroup) {
        if (Editor.groupMap[newGroup]) {
          Editor.groupMap[newGroup].editors.push(this);
        } else {
          Editor.groupMap[newGroup] = {
            editors: [this],
            undoRedoContext: []
          };
        }
      }
    }

    /**
     * Set the pen style
     * @param {PenStyle} penStyle
     */

  }, {
    key: 'setPenStyle',
    value: function setPenStyle(penStyle) {
      var editors = this.getEditorGroup();
      editors.forEach(function (editor) {
        editor.penStyle = penStyle;
      });
    }

    /**
     * Set the theme
     * @param {Theme} theme
     */

  }, {
    key: 'setTheme',
    value: function setTheme(theme) {
      var editors = this.getEditorGroup();
      editors.forEach(function (editor) {
        editor.theme = theme;
      });
    }

    /**
     * Get behaviors
     * @return {Behaviors}
     */

  }, {
    key: 'updateEraser',
    value: function updateEraser(point) {
      this.eraserElement.style.top = point.y + 'px';
      this.eraserElement.style.left = point.x + 'px';
    }

    /**
     * 处理 pointerDown 事件
     * @param {{x: Number, y: Number, t: Number}} point Captured point coordinates
     */

  }, {
    key: 'getRoatePoint',
    value: function getRoatePoint(point) {
      // 画布的宽高
      let rect = this.domElement.getBoundingClientRect()
      if (this.rotateType === 1) {
        let x1 = rect.height - point.y
        let y1 = point.x
        point.x = x1
        point.y = y1
      } else if (this.rotateType === 2) {
        let x1 = rect.width - point.x
        let y1 = rect.height - point.y
        point.x = x1
        point.y = y1
      } else if (this.rotateType === 3) {
        let x1 = point.y
        let y1 = rect.width - point.x
        point.x = x1
        point.y = y1
      }
      return point
    }
    /**
     * 将点根据旋转做转换
     */
  }, {
    key: 'pointerDown',
    value: function pointerDown(point) {
      point = this.getRoatePoint(point)
      point.x /= this.transformScale;
      point.y /= this.transformScale;

      triggerCallbacks(this, point, 'pointer-down');

      var style = this.theme.ink;

      if (this.checkStrokeType('eraser')) {
        style = this.theme.eraser;
        // 初始化板擦,板擦UI大小根据传入的缩放比等比缩放
        var width = (style.pointerWidth || style.penWidth || 20) * (style.penWidthScaleVal || 1);
        var height = (style.pointerHeight || Math.round(width * 1.25)) * (style.penWidthScaleVal || 1);
        this.eraserElement.style.display = 'block';
        this.eraserElement.src = style.pointer || ''; // 最好给一个默认图片
        this.eraserElement.style.width = width + 'px';
        this.eraserElement.style.height = height + 'px';
        this.updateEraser(point);
      } else if (this.checkStrokeType('ink')) {
        style = Object.assign({}, this.theme.ink, {
          hasPressure: true,
          drawByPen: !!point.p // 检测是否由压感笔书写
        });
      }

      // 初始化笔迹
      this.model = initPendingStroke(this.model, point, Object.assign(style, this.localPenStyle), this.rendererContext.renderingCanvasContext);

      // 绘制当前笔迹
      this.renderer.drawCurrentSymbol(this.rendererContext, this.model, {
        drawByPen: this.drawByPen,
        drawStart: true
      });
    }

    /**
     * 处理 pointerMove 事件
     * @param {{x: Number, y: Number, t: Number}} point Captured point coordinates
     */

  }, {
    key: 'pointerMove',
    value: function pointerMove(point) {
      point = this.getRoatePoint(point)
      point.x /= this.transformScale;
      point.y /= this.transformScale;

      triggerCallbacks(this, point, 'pointer-move');

      // 更新板擦位置
      if (this.checkStrokeType('eraser')) {
        this.updateEraser(point);
      }

      var editor = this;
      this.model = appendToPendingStroke(this.model, point);

      // 忽略过近的点
      if (this.model.currentStroke.discardPoint) {
        return;
      }

      // 绘制当前笔迹，使用 requestAnimationFrame
      if (!this.ticking) {
        requestAnimFrame(function () {
          window.isDrawing = true;
          console.time('time check:draw current stroke move');
          editor.renderer.drawCurrentSymbol(editor.rendererContext, editor.model);
          editor.ticking = false;
          console.timeEnd('time check:draw current stroke move');
        });
        this.ticking = true;
      }
    }

    /**
     * 处理 pointerUp 事件
     * @param {{x: Number, y: Number, t: Number}} point Captured point coordinates
     */

  }, {
    key: 'pointerUp',
    value: function pointerUp(point) {
      window.isDrawing = false;
      // console.time('time check:draw in render');
      point = this.getRoatePoint(point)
      point.x /= this.transformScale;
      point.y /= this.transformScale;

      triggerCallbacks(this, point, 'pointer-up');

      // 隐藏板擦
      this.eraserElement.style.display = 'none';

      // 绘制当前笔迹
      this.renderer.drawCurrentSymbol(this.rendererContext, this.model, {
        drawFinal: true
      });

      // 更新模型
      this.model = endPendingStroke(this.model, this.rendererContext.renderingCanvasContext);
      updateCallback(this, this.model);
      // console.timeEnd('time check:draw in render');
      // 延时组合
      // clearTimeout(this.renderTimer)
      // if (this.checkStrokeType()) {
      //   this.renderTimer = setTimeout(() => {
      //     this.model.currentStrokes = []
      //     updateCallback(this, this.model)
      //   }, 1000)
      // } else {
      //   updateCallback(this, this.model)
      // }
    }
  }, {
    key: 'checkStrokeType',
    value: function checkStrokeType() {
      var stype = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'ink';

      var type = this.innerPenStyle.type;
      if (stype === 'ink') {
        return type === 'pen' || type === 'ink' || type === 'marker' || type === 'pencil';
      } else if (stype === 'eraser') {
        return type === 'eraser' || type === 'wiper';
      }
    }
  }, {
    key: 'forceUpdate',
    value: function forceUpdate() {
      clearTimeout(this.renderTimer);
      // this.model.currentStrokes = []
      updateCallback(this, this.model, EventType.RENDERED);
    }
  }, {
    key: 'cancelWrite',
    value: function cancelWrite() {
      this.activePointerId = undefined;
      delete this.model.currentStroke;
      clearTimeout(this.renderTimer);
    }
  }, {
    key: 'removeStroke',
    value: function removeStroke(stroke) {
      var stringRawStrokes = this.model.rawStrokes.map(function (strokes) {
        return JSON.stringify(strokes);
      });
      var strokeIndex = stringRawStrokes.indexOf(JSON.stringify(stroke));
      if (strokeIndex !== -1) {
        this.model.rawStrokes.splice(strokeIndex, 1);
      }
      this.forceUpdate();
    }
  }, {
    key: '_addStroke',
    value: function _addStroke(stroke) {
      addStroke(this.rendererContext.renderingCanvasContext, this.model, stroke);
    }
  }, {
    key: 'addImage',
    value: function addImage(src) {
      var properties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var modelRef = initPendingImage(this.model, Object.assign({
        src: src
      }, properties), this.rendererContext.renderingCanvasContext);
      this.renderer.drawCurrentSymbol(this.rendererContext, modelRef);
      this.model = endPendingStroke(this.model, this.rendererContext.renderingCanvasContext);
      this.forceUpdate();
    }

    /**
     * @Deprecated
     * @param rawStrokes
     * @param strokeGroups
     */

  }, {
    key: 'reDraw',
    value: function reDraw() {
      var _this2 = this;

      var rawStrokes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var isClear = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      isClear && this.clear();
      rawStrokes.forEach(function (stroke) {
        _this2._addStroke(stroke);
      });
      this.forceUpdate();
    }

    /**
     * True if can undo, false otherwise.
     * @return {Boolean}
     */

  }, {
    key: 'canUndoOr',
    value: function canUndoOr() {
      var editor = this.getUndoEditor(false);
      if (!editor) return false;
      return editor.undoRedoContext.canUndo;
    }

    /**
     * Undo the last action.
     */

  }, {
    key: 'undo',
    value: function undo$$1() {
      var editor = this.getUndoEditor();
      if (!editor) return;
      triggerCallbacks(editor, undefined, EventType.UNDO);
      editor.undoRedoManager.undo(editor.undoRedoContext, editor.model, function (res) {
        for (var _len5 = arguments.length, types = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
          types[_key5 - 1] = arguments[_key5];
        }

        manageModel.apply(undefined, [editor, res].concat(types));
      });
    }
  }, {
    key: 'getUndoEditor',
    value: function getUndoEditor() {
      var flag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      var group = this.configuration.group;
      var editor = this;
      if (group) {
        var editors = Editor.groupMap[group].editors;
        var maxTime = -1;
        editors.forEach(function (item) {
          var rawStrokes = item.model.rawStrokes;
          var stroke = rawStrokes[rawStrokes.length - 1];
          if (stroke && stroke.time > maxTime) {
            editor = item;
            maxTime = stroke.time;
          }
        });
        if (maxTime === -1) return null;
      }
      if (editor.model.rawStrokes.length === 0) return null;
      group && flag && Editor.groupMap[group].undoRedoContext.push(editor);
      return editor;
    }

    /**
     * True if can redo, false otherwise.
     * @return {Boolean}
     */

  }, {
    key: 'canRedoOr',
    value: function canRedoOr() {
      var group = this.configuration.group;
      var editors = group ? Editor.groupMap[group].undoRedoContext : [editor];
      var editor = editors[editors.length - 1];
      if (!editor) return false;
      return editor.undoRedoContext.canRedo;
    }

    /**
     * Redo the last action.
     */

  }, {
    key: 'redo',
    value: function redo$$1() {
      var editor = this.getRedoEditor();
      if (!editor) return;
      triggerCallbacks(editor, undefined, EventType.REDO);
      editor.undoRedoManager.redo(editor.undoRedoContext, editor.model, function (res) {
        for (var _len6 = arguments.length, types = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
          types[_key6 - 1] = arguments[_key6];
        }

        manageModel.apply(undefined, [editor, res].concat(types));
      });
    }
  }, {
    key: 'getRedoEditor',
    value: function getRedoEditor() {
      var group = this.configuration.group;
      return group ? Editor.groupMap[group].undoRedoContext.pop() : this;
    }

    /**
     * True if empty, false otherwise
     * @returns {boolean}
     */

  }, {
    key: 'clear',


    /**
     * Clear the output and the recognition result.
     */
    value: function clear() {
      var modelRef = clearModel(this.model);
      triggerCallbacks(this, undefined, EventType.CLEAR);
      this.undoRedoContext = resetUndoRedoState(this.undoRedoContext);
      updateCallback(this, modelRef, EventType.RENDERED);
    }

    // 多个画板同时清楚

  }, {
    key: 'clearGroup',
    value: function clearGroup() {
      var editors = this.getEditorGroup();
      editors.forEach(function (editor) {
        editor.clear();
      });
    }

    /**
     * Function to call when the dom element link to the current ink paper has been resize.
     */

  }, {
    key: 'resize',
    value: function resize() {
      this.renderer.resize(this.rendererContext, this.model, this.configuration.renderingParams.minHeight, this.configuration.renderingParams.minWidth);
    }

    /**
     * Detach event listeners from the DOM element created at editor creation.
     */

  }, {
    key: 'unload',
    value: function unload() {
      if (this.grabber) {
        this.grabber.detach(this.domElement, this.grabberContext);
      }
      if (this.innerRenderer) {
        this.innerRenderer.detach(this.domElement, this.rendererContext);
      }
    }
  }, {
    key: 'scale',
    value: function scale(_scale, center, _ref, _ref2) {
      var x = _ref.x,
          y = _ref.y;
      var start = _ref2.start,
          end = _ref2.end;

      this.model.rawStrokes.forEach(function (s) {
        if (start) {
          s._s = s.s;
          s._center = {
            x: s.center.x,
            y: s.center.y
          };
          s._delta = {
            x: s.delta.x,
            y: s.delta.y
          };
          return;
        }
        if (end) {
          delete s._s;
          delete s._center;
          delete s._delta;
        }
        if (s._center && s._s) {
          s.s = s._s * _scale;
          s.delta = {
            x: _scale * s._delta.x + x,
            y: _scale * s._delta.y + y
          };
          if (s.s === 1) {
            s.center.x = s._center.x;
            s.center.y = s._center.y;
          } else {
            s.center.x = (center.x * (1 - _scale) + s._center.x * (_scale - s.s)) / (1 - s.s);
            s.center.y = (center.y * (1 - _scale) + s._center.y * (_scale - s.s)) / (1 - s.s);
          }
        }
      });
      this.renderer.drawModel(this.rendererContext, this.model);
    }
  }, {
    key: 'getEditorGroup',
    value: function getEditorGroup() {
      var group = this.configuration.group;
      if (!group) return [this];
      return Editor.groupMap[group].editors;
    }

    /**
     * 开始绘制钩子函数
     */

  }, {
    key: 'observeResize',
    value: function observeResize() {
      this.configuration.observeResize = true;
      this.observeElement();
    }
  }, {
    key: 'unobserveResize',
    value: function unobserveResize() {
      this.configuration.observeResize = false;
      this.unobserveElement();
    }

    /**
     * 监听元素宽高变化
     */

  }, {
    key: 'observeElement',
    value: function observeElement() {
      if (!this.configuration.observeResize) return;
      var editor = this;
      this.observer = this.observer || new ResizeObserver(function (entries) {
        if (!editor.rendererContext || !editor.rendererContext.renderingCanvas.parentNode) return;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = entries[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var entry = _step.value;
            var _entry$contentRect = entry.contentRect,
                width = _entry$contentRect.width,
                height = _entry$contentRect.height;

            if (width && height && editor.oldWidth !== width || editor.oldHeight !== height) {
              editor.oldWidth = width;
              editor.oldHeight = height;
              editor.resize();
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      });
      this.observer.observe(this.domElement);
    }

    /**
     * 解除监听元素宽高变化
     */

  }, {
    key: 'unobserveElement',
    value: function unobserveElement() {
      if (this.configuration.observeResize) return;
      this.observer.unobserve(this.domElement);
    }
  }, {
    key: 'setTransformScale',
    value: function setTransformScale(value) {
      this.transformScale = value;
    }
  }, {
    key: 'setRotateType',
    value: function setRotateType(value) {
      // 0正立，1左转90度，2左转180度，3右转90度
      this.rotateType = value;
    }
  }, {
    key: 'configuration',
    set: function set$$1(configuration) {
      /**
       * @private
       * @type {Configuration}
       */
      this.innerConfiguration = overrideDefaultConfiguration(configuration);
      this.behavior = this.behaviors.getBehaviorFromConfiguration(this.behaviors, this.innerConfiguration);
      var group = this.innerConfiguration.group;
      if (group) {
        Editor.groupMap = Editor.groupMap || {};
        Editor.groupMap[group] = Editor.groupMap[group] || {
          editors: [],
          undoRedoContext: []
        };
        Editor.groupMap[group].editors.push(this);
      }
      if (this.innerConfiguration.observeResize) {
        this.observeElement();
      }
      if (this.innerConfiguration.position) {
        this.domElement.style.position = this.innerConfiguration.position;
      }
    }

    /**
     * Get the current recognition parameters
     * @return {Configuration}
     */
    ,
    get: function get$$1() {
      return this.innerConfiguration;
    }
  }, {
    key: 'penStyle',
    set: function set$$1(penStyle) {
      if (this.grabber) {
        this.grabber.detach(this.domElement, this.grabberContext);
      }
      if (penStyle.type !== 'select') {
        this.grabberContext = this.grabber.attach(this.domElement, this);
        this.domElement.classList.remove('disabled');
        this.domElement.style.pointerEvents = 'auto';
      } else {
        this.domElement.classList.add('disabled');
        this.domElement.style.pointerEvents = 'none';
      }
      this.innerPenStyle = overrideDefaultPenStyle(penStyle);
      this.localPenStyle = this.innerPenStyle;
    }

    /**
     * Get the pen style
     * @return {PenStyle}
     */
    ,
    get: function get$$1() {
      return this.innerPenStyle;
    }
  }, {
    key: 'theme',
    set: function set$$1(theme) {
      /**
       * @private
       * @type {Theme}
       */
      this.innerTheme = overrideDefaultTheme(this.innerTheme, theme);
    }

    /**
     * Get the theme
     * @return {Theme}
     */
    ,
    get: function get$$1() {
      return this.innerTheme;
    }
  }, {
    key: 'behaviors',
    get: function get$$1() {
      return this.innerBehaviors;
    }

    /**
     * @private
     * @param {Behavior} behavior
     */

  }, {
    key: 'behavior',
    set: function set$$1(behavior) {
      if (behavior) {
        if (this.grabber) {
          // Remove event handlers to avoid multiplication (detach grabber)
          this.grabber.detach(this.domElement, this.grabberContext);
        }
        /**
         * @private
         * @type {Behavior}
         */
        this.innerBehavior = behavior;
        this.renderer = this.innerBehavior.renderer;
        /**
         * 动作管理器
         */
        this.undoRedoContext = createUndoRedoContext(this.configuration);
        this.undoRedoManager = UndoRedoManager;
        this.model = createModel(this.configuration);
        updateCallback(this, this.model, EventType.RENDERED);

        /**
         * Current grabber context
         * @type {GrabberContext}
         */
        this.grabberContext = this.grabber.attach(this.domElement, this);
      }
    }

    /**
     * Get current behavior
     * @return {Behavior}
     */
    ,
    get: function get$$1() {
      return this.innerBehavior;
    }

    /**
     * Set the current renderer
     * @private
     * @param {Renderer} renderer
     */

  }, {
    key: 'renderer',
    set: function set$$1(renderer) {
      if (!renderer) return;
      if (this.innerRenderer) {
        this.innerRenderer.detach(this.domElement, this.rendererContext);
      }

      /**
       * @private
       * @type {Renderer}
       */
      this.innerRenderer = renderer;

      /**
       * Current rendering context
       * @type {Object}
       */
      this.rendererContext = this.innerRenderer.attach(this.domElement, this.behavior.brushes, this.configuration.renderingParams.minHeight, this.configuration.renderingParams.minWidth);
    }

    /**
     * Get current renderer
     * @return {Renderer}
     */
    ,
    get: function get$$1() {
      return this.innerRenderer;
    }

    /**
     * Get current grabber
     * @return {Grabber}
     */

  }, {
    key: 'grabber',
    get: function get$$1() {
      return this.behavior ? this.behavior.grabber : undefined;
    }

    /**
     * Get current callbacks
     * @return {Array}
     */

  }, {
    key: 'callbacks',
    get: function get$$1() {
      return this.behavior ? this.behavior.callbacks : undefined;
    }

    /**
     * Get a PNG image data url from the data model
     * @return {String}
     */

  }, {
    key: 'png',
    get: function get$$1() {
      return getImage(this.model);
    }

    /**
     * True if initialized, false otherwise
     * @return {Boolean}
     */

  }, {
    key: 'initialized',
    get: function get$$1() {
      return true;
    }

    /**
     * Set the rawStrokes
     * @private
     * @param {[Stroke]} strokes
     */

  }, {
    key: 'strokes',
    set: function set$$1(strokes) {
      this.model.rawStrokes = strokes;
    }
  }, {
    key: 'canUndo',
    get: function get$$1() {
      return this.undoRedoContext.canUndo;
    }
  }, {
    key: 'canRedo',
    get: function get$$1() {
      return this.undoRedoContext.canRedo;
    }
  }, {
    key: 'isEmpty',
    get: function get$$1() {
      return false;
      // return this.recognizerContext.isEmpty
    }

    /**
     * True if can clear, false otherwise.
     * @return {Boolean}
     */

  }, {
    key: 'canClear',
    get: function get$$1() {
      return this.canUndo && this.model.rawStrokes.length > 0;
    }
  }, {
    key: 'startDraw',
    set: function set$$1(fn) {
      this.innerStartDraw = fn;
    },
    get: function get$$1() {
      return this.innerStartDraw;
    }

    /**
     * 结束绘制钩子函数
     */

  }, {
    key: 'endDraw',
    set: function set$$1(fn) {
      this.innerEndDraw = fn;
    },
    get: function get$$1() {
      return this.innerEndDraw;
    }
  }]);
  return Editor;
}();

/**
 * Attach an Editor to a DOMElement
 * @param {Element} element DOM element to attach an editor
 * @param {Configuration} [configuration] Configuration to apply
 * @param {PenStyle} [penStyle] Pen style to apply
 * @param {Theme} [theme] Theme to apply
 * @param {Behaviors} [behaviors] Custom behaviors to apply
 * @return {Editor} New editor
 */
function register(element, configuration, penStyle, theme, behaviors) {
  return new Editor(element, configuration, penStyle, theme, behaviors);
}

var MyWriting = {
  Constants: Constants,
  // Default instantiations
  DefaultConfiguration: defaultConfiguration,
  DefaultBehaviors: defaultBehaviors,
  DefaultPenStyle: defaultPenStyle,
  DefaultTheme: defaultTheme,
  // Helper functions
  register: register,
  Editor: Editor,
  InkModel: InkModel
};

/**
 * 手写sdk
 */

var HandWritingSDK = function () {
  /**
   * uuid sdk dom uuid
   * currentMode 当前的模式(sdk局部配置)
   * penStyle 笔类型(sdk全局配置,和currentMode对应)
   * setting 设置
   * setting.ink 墨水设置
   * setting.eraserCircle 圆形擦除
   * setting.eraserRect 矩形擦除，支持设置指针图片
   * rawStrokeChanged 手写数据是否发生变更
   */
  function HandWritingSDK(_ref) {
    var dom = _ref.dom,
        _ref$type = _ref.type,
        type = _ref$type === undefined ? 'pen' : _ref$type,
        _ref$group = _ref.group,
        group = _ref$group === undefined ? '' : _ref$group,
        _ref$observeResize = _ref.observeResize,
        observeResize = _ref$observeResize === undefined ? false : _ref$observeResize,
        _ref$setting = _ref.setting,
        setting = _ref$setting === undefined ? {} : _ref$setting;
    classCallCheck(this, HandWritingSDK);

    this.uuid = Date.now();
    this.currentMode = 'select';
    this.editor = MyWriting.register(dom, { render: 'canvas', group: group, observeResize: observeResize }, {
      ink: {
        color: '#000000',
        penWidth: 1.6,
        penWidthScaleVal: 1
      }
    }, { type: type });
    dom.ebook_placeholder_uuid = this.uuid;
    var defaultSetting = {
      ink: Object.assign({ penWidthScaleVal: 1 }, SETTING_INK),
      eraserCircle: SETTING_ERASER_CIRCLE,
      eraserRect: SETTING_ERASER_RECT,
      penGroup: true,
      eraserGroup: true,
      wiperGroup: true,
      selectGroup: true
    };
    this.setting = Object.assign({}, defaultSetting, setting);
    this.isRawStrokeChanged = true;
    this.setHandWritingBehave(type);
  }

  createClass(HandWritingSDK, [{
    key: 'setUuid',
    value: function setUuid(uuid) {
      this.uuid = uuid;
    }
  }, {
    key: 'getUuid',
    value: function getUuid() {
      return this.uuid;
    }
  }, {
    key: 'setEditor',
    value: function setEditor(editor) {
      this.editor = editor;
    }
  }, {
    key: 'getEditor',
    value: function getEditor() {
      return this.editor;
    }
  }, {
    key: 'setCurrentMode',
    value: function setCurrentMode(mode) {
      if (this.getSupportMode().includes(mode)) {
        this.currentMode = mode;
      }
    }
  }, {
    key: 'getCurrentMode',
    value: function getCurrentMode() {
      return this.currentMode;
    }
  }, {
    key: 'getSupportMode',
    value: function getSupportMode() {
      return SETTING_MODES;
    }
  }, {
    key: 'setPenStyle',
    value: function setPenStyle(mode, groupFlag) {
      this.setCurrentMode(mode);
      var editor = this.getEditor();
      groupFlag ? editor.setPenStyle({ type: this.getCurrentMode() }) : editor.penStyle = { type: this.getCurrentMode() };
    }
  }, {
    key: 'setTheme',
    value: function setTheme(theme, groupFlag) {
      var editor = this.getEditor();
      groupFlag ? editor.setTheme(theme) : editor.theme = theme;
    }

    /**
     * theme.color
     * theme.penWidth
     */

  }, {
    key: 'setPenThem',
    value: function setPenThem(theme, groupFlag) {
      var config = Object.assign({}, SETTING_INK, theme);
      this.setPenStyle('pen', groupFlag);
      this.setTheme({ ink: config }, groupFlag);
    }
  }, {
    key: 'setEraserCircleThem',
    value: function setEraserCircleThem(theme, groupFlag) {
      var config = Object.assign({}, SETTING_ERASER_CIRCLE, theme);
      this.setPenStyle('eraser', groupFlag);
      this.setTheme({ eraser: config }, groupFlag);
    }
  }, {
    key: 'setEraserRectThem',
    value: function setEraserRectThem(theme, groupFlag) {
      var config = Object.assign({}, SETTING_ERASER_RECT, theme);
      this.setPenStyle('wiper', groupFlag);
      this.setTheme({ eraser: config }, groupFlag);
    }
  }, {
    key: 'setSelectThem',
    value: function setSelectThem(groupFlag) {
      this.setPenStyle('select', groupFlag);
    }
  }, {
    key: 'setSetting',
    value: function setSetting(setting) {
      var inkSetting = this.setting.ink || {};
      var eraserRectSetting = this.setting.eraserRect || {};
      if (setting && (typeof setting === 'undefined' ? 'undefined' : _typeof(setting)) === 'object' && setting.hasOwnProperty('ink')) {
        // Object.assign不能深层递归合并，ink属性单独合并
        inkSetting = Object.assign({}, inkSetting, setting.ink);
      }
      if (setting && (typeof setting === 'undefined' ? 'undefined' : _typeof(setting)) === 'object' && setting.hasOwnProperty('eraserRect')) {
        eraserRectSetting = Object.assign({}, eraserRectSetting, setting.eraserRect);
      }
      this.setting = Object.assign({}, this.setting, setting, {
        ink: inkSetting,
        eraserRect: eraserRectSetting
      });
    }
  }, {
    key: 'getSetting',
    value: function getSetting(setting) {
      return this.setting;
    }

    // 切换画笔

  }, {
    key: 'setHandWritingBehave',
    value: function setHandWritingBehave(mode, setting) {
      if (this.getSupportMode().includes(mode) > -1) {
        this.setSetting(setting);
        var set$$1 = this.getSetting();
        switch (mode) {
          case 'pen':
            this.setPenThem(set$$1.ink, set$$1.penGroup);
            break;
          case 'select':
            this.setSelectThem(set$$1.selectGroup);
            break;
          case 'eraser':
            this.setEraserRectThem(set$$1.eraserRect, set$$1.eraserGroup);
            break;
          default:
        }
      } else {
        throw new Error('Invalid mode');
      }
    }

    // 重绘

  }, {
    key: 'reDraw',
    value: function reDraw(rawData, isClear) {
      var editor = this.getEditor();
      if (Array.isArray(rawData)) {
        editor.reDraw(rawData, isClear);
        this.setIsDrawStrokeChanged(true);
      } else {
        console.error('Invalid rawData', rawData);
      }
    }

    // 窗口适应

  }, {
    key: 'resize',
    value: function resize() {
      var editor = this.getEditor();
      editor.resize();
      this.setIsDrawStrokeChanged(true);
    }

    // 撤销

  }, {
    key: 'undo',
    value: function undo() {
      var editor = this.getEditor();
      editor.undo();
      this.setIsDrawStrokeChanged(true);
    }

    // 是否可撤销

  }, {
    key: 'canUndoOr',
    value: function canUndoOr() {
      var editor = this.getEditor();
      return editor.canUndoOr();
    }

    // 恢复

  }, {
    key: 'redo',
    value: function redo() {
      var editor = this.getEditor();
      editor.redo();
      this.setIsDrawStrokeChanged(true);
    }

    // 是否可恢复

  }, {
    key: 'canRedoOr',
    value: function canRedoOr() {
      var editor = this.getEditor();
      return editor.canRedoOr();
    }

    // 清除当前画板

  }, {
    key: 'clear',
    value: function clear() {
      var editor = this.getEditor();
      editor.clear();
      this.setIsDrawStrokeChanged(true);
    }

    // 清除与当前画板相同group的所有画板

  }, {
    key: 'clearGroup',
    value: function clearGroup() {
      var editor = this.getEditor();
      editor.clearGroup();
      this.setIsDrawStrokeChanged(true);
    }

    // 获取笔迹数据

  }, {
    key: 'getModelRawStrokes',
    value: function getModelRawStrokes() {
      var editor = this.getEditor();
      return editor.model.rawStrokes;
    }
  }, {
    key: 'setIsDrawStrokeChanged',
    value: function setIsDrawStrokeChanged(isChanged) {
      this.isRawStrokeChanged = !!isChanged;
    }
  }, {
    key: 'getIsRrawStrokeChanged',
    value: function getIsRrawStrokeChanged() {
      return this.isRawStrokeChanged;
    }

    // 监听元素宽高变化

  }, {
    key: 'observeResize',
    value: function observeResize() {
      var editor = this.getEditor();
      editor.observeResize();
    }

    // 取消监听元素宽高变化

  }, {
    key: 'unobserveResize',
    value: function unobserveResize() {
      var editor = this.getEditor();
      editor.observeResize();
    }

    // 设置开始绘画钩子函数

  }, {
    key: 'setStartDraw',
    value: function setStartDraw(fn) {
      var editor = this.getEditor();
      editor.startDraw = fn;
    }

    // 设置结束绘画钩子函数

  }, {
    key: 'setEndDraw',
    value: function setEndDraw(fn) {
      var editor = this.getEditor();
      editor.endDraw = fn;
    }

    // 设置 groupID

  }, {
    key: 'setGroup',
    value: function setGroup(group) {
      var editor = this.getEditor();
      editor.setGroup(group);
    }
  }]);
  return HandWritingSDK;
}();

export default HandWritingSDK;
