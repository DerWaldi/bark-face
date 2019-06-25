import { writePath } from "./SVGUtils";
import { random } from "./random";

// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d

export function rounden(srcPath, points, normals, roundingMagnitude) {
  let newPath = srcPath;

  // calc bounding box
  let bbox = points.reduce((acc, val) => {
    acc.x0 = ( acc.x0 === undefined || val.x < acc.x0 ) ? val.x : acc.x0
    acc.x1 = ( acc.x1 === undefined || val.x > acc.x1 ) ? val.x : acc.x1
    acc.y0 = ( acc.y0 === undefined || val.y < acc.y0 ) ? val.y : acc.y0
    acc.y1 = ( acc.y1 === undefined || val.y > acc.y1 ) ? val.y : acc.y1
    return acc;
  }, {x0: undefined, x1: undefined, y0:undefined, y1: undefined});

  let roundingFunction = (point) => roundingMagnitude * Math.sin((point.y - bbox.y0) * (Math.PI / (bbox.y1-bbox.y0))) * (point.x < (bbox.x0 + bbox.x1)/2 ? -1 : 1);

  // rounden
  for(let i = 0; i < srcPath.length; i++) {
    let pointer = points[i];
    let lastSeg = srcPath[i];

    let lastNormal = i > 0 ? normals[i-1] : new Vector2D();
    if(lastSeg[0] === "M" || lastSeg[0] === "L") {
      newPath[i][1] += roundingFunction(pointer);
    } else if(lastSeg[0] === "C") {
      newPath[i][1] += roundingFunction(pointer);
      newPath[i][3] += roundingFunction(pointer);
      newPath[i][5] += roundingFunction(pointer);
    } else if(lastSeg[0] === "S") {
      newPath[i][1] += roundingFunction(pointer);
      newPath[i][3] += roundingFunction(pointer);
    }
  }
  return newPath;
}

export function stretch(newPath, points, normals, magn) {
  for(let i = 0; i < newPath.length; i++) {
    let pointer = points[i];
    let lastSeg = newPath[i];
    let totalNormal = normals[i];

    let lastNormal = i > 0 ? normals[i-1] : new Vector2D();

    if(lastSeg[0] === "M" || lastSeg[0] === "L") {
      newPath[i][1] += totalNormal.x * magn.x;
      newPath[i][2] += totalNormal.y * magn.y;
    } else if(lastSeg[0] === "C") {
      newPath[i][1] += lastNormal.x * magn.x;
      newPath[i][2] += lastNormal.y * magn.y;
      newPath[i][3] += totalNormal.x * magn.x;
      newPath[i][4] += totalNormal.y * magn.y;
      newPath[i][5] += totalNormal.x * magn.x;
      newPath[i][6] += totalNormal.y * magn.y;
    } else if(lastSeg[0] === "S") {
      newPath[i][1] += lastNormal.x * magn.x;
      newPath[i][2] += lastNormal.y * magn.y;
      newPath[i][3] += totalNormal.x * magn.x;
      newPath[i][4] += totalNormal.y * magn.y;
    } else if(lastSeg[0] === "V") {
      newPath[i][1] += totalNormal.y * magn.y;
    }

    // start points
    if( i > 0 && i + 1 < newPath.length && totalNormal.y > 0.5 && normals[i-1].y < 0.5 && normals[i+1].y < 0.5 &&
      points[i].y > points[i+1].y && points[i].y > points[i-1].y) {
      if(lastSeg[0] === "C") {
        //newPath[i][5] = newPath[i][5] + totalNormal.x * magn.x;
        newPath[i][4] = newPath[i][4] + totalNormal.y * magn.y* 3;
        newPath[i][6] = newPath[i][6] + totalNormal.y * magn.y* 3;
      } else if(lastSeg[0] === "V") {
        newPath[i][1] = newPath[i][1] + totalNormal.y * magn.y* 3;
      }
    }
    /*lines.push({
      x0: pointer.x, y0: pointer.y, 
      x1: pointer.x + totalNormal.x * 40, y1: pointer.y + totalNormal.y * 40, 
      stroke: "green"
    });
    
    circles.push({
      x: pointer.x, y: pointer.y, 
      r: 3, 
      fill: "red"
    });*/
  }
  return newPath;
}

export function roughenPath(newPathSmoothed, magn) {
  let roughPath = [];
  // roughen
  for(let subPath of getSubPaths(newPathSmoothed)) {
    var path = require("svg-path-properties");
    var properties = path.svgPathProperties(writePath(subPath));
    var length = properties.getTotalLength();
    
    var startPoint = properties.getPointAtLength(0);
    roughPath.push(["M", startPoint.x, startPoint.y]);

    for(let i = 1; i < length; i+=20) {
      var point = properties.getPointAtLength(i);
      roughPath.push(["L", random() * magn - magn/2 + point.x, random() * magn - magn/2 + point.y]);      
    }
    roughPath.push(["z"]);
  }
  return roughPath;
}

export function getSubPaths(path) {
  let subPaths = [];
  let j = 0;
  for (let i = 0; i < path.length; i++) {
    if(!subPaths[j]) 
      subPaths[j] = [];

    subPaths[j].push(path[i]);

    if(path[i][0] === "z") {
      j++;
    }
  }
  return subPaths;
}

export function crackPoints(newPathSmoothed, age) {
  // add zacken
  let { points, normals } = analyzePath(newPathSmoothed);

  let subPath = getSubPaths(newPathSmoothed)[0]
  var path = require("svg-path-properties");
  var properties = path.svgPathProperties(writePath(subPath));
  var length = properties.getTotalLength();

  let crackPoints = [];
  for(let j = 0; j < 100; j+=5) {
    let l = j / 100 * length; 
    let crackPoint = properties.getPointAtLength(l);
    let tangent = properties.getTangentAtLength(l);  
    let crackNormal = new Vector2D(-tangent.y, tangent.x);

    let crackWidth = age * 4 / 100 + Math.random()*1 + 1;
    let crackLength = age * 40 / 100 + Math.random()*5;
    let crackLength2 = crackLength * (0.2 + Math.random()*0.1);
    let crackWidth2 = crackWidth/2 - 1 + Math.random()*2;

    let crackOpositePoint = new Vector2D(
      crackPoint.x - crackNormal.x * 5,
      crackPoint.y - crackNormal.y * 5
    );
    for(let i = 0; i < 500; i++) {
      if(!insidePolygon(crackOpositePoint, points)) {
        break;
      }
      crackOpositePoint = crackOpositePoint.add(new Vector2D(
        - crackNormal.x * 5,
        - crackNormal.y * 5
      ));
    }
    let crackMidPoint = new Vector2D((crackPoint.x + crackOpositePoint.x)/2, (crackPoint.y + crackOpositePoint.y)/2);

    if(crackPoints.some(c => Math.pow(c.x - crackMidPoint.x, 2) + Math.pow(c.y - crackMidPoint.y, 2) < 200)) {
      l--;
      continue;
    }

    crackPoints.push(crackMidPoint)

    let crack = [];
    crack.push(["M", 
      crackPoint.x - crackNormal.x * 5,
      crackPoint.y - crackNormal.y * 5
    ]);
    crack.push(["L", 
      crackPoint.x + crackNormal.x * crackLength2,// + Math.random()*4-2, 
      crackPoint.y + crackNormal.y * crackLength2// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackPoint.x + crackNormal.x * crackLength - crackNormal.y * -crackWidth2,// + Math.random()*4-2, 
      crackPoint.y + crackNormal.y * crackLength + crackNormal.x * -crackWidth2// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackPoint.x + crackNormal.x * crackLength2 - crackNormal.y * -crackWidth,// + Math.random()*4-2, 
      crackPoint.y + crackNormal.y * crackLength2 + crackNormal.x * -crackWidth// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackPoint.x - crackNormal.x * 5 - crackNormal.y * -crackWidth,// + Math.random()*4-2, 
      crackPoint.y - crackNormal.y * 5 + crackNormal.x * -crackWidth// + Math.random()*4-2
    ]);
    // back side
    crack.push(["L", 
      crackOpositePoint.x + crackNormal.x * 5 - crackNormal.y * -crackWidth,// + Math.random()*4-2, 
      crackOpositePoint.y + crackNormal.y * 5 + crackNormal.x * -crackWidth// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackOpositePoint.x - crackNormal.x * crackLength2 - crackNormal.y * -crackWidth,// + Math.random()*4-2, 
      crackOpositePoint.y - crackNormal.y * crackLength2 + crackNormal.x * -crackWidth// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackOpositePoint.x - crackNormal.x * crackLength - crackNormal.y * -crackWidth2,// + Math.random()*4-2, 
      crackOpositePoint.y - crackNormal.y * crackLength + crackNormal.x * -crackWidth2// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackOpositePoint.x - crackNormal.x * crackLength2,// + Math.random()*4-2, 
      crackOpositePoint.y - crackNormal.y * crackLength2// + Math.random()*4-2
    ]);
    crack.push(["z"]);
    newPathSmoothed.push(...crack);
  }

  /*
  for(let i = 0; i < 10; i++) {
    let crackIndex = Math.floor(Math.random() * (points.length - 1));
    let crackPoint = points[crackIndex];
    let crackNormal = normals[crackIndex].norm();      

    let crackWidth = 2 + Math.random()*4;
    let crackLength = 30 + Math.random()*20;
    let crackLength2 = 5 + Math.random()*4;
    let crackWidth2 = crackWidth/2 - 1 + Math.random()*2;

    // can insert Crack?
    if(newPathSmoothed[crackIndex][0] !== "C" || newPathSmoothed[crackIndex + 1][0] !== "C" || (crackNormal.x < 0.8 && crackNormal.x > -0.8)) {
      i--;
      continue;
    }
    
    let crackOpositePoint = new Vector2D(
      crackPoint.x - crackNormal.x * 5,
      crackPoint.y - crackNormal.y * 5
    );
    for(let i = 0; i < 500; i++) {
      if(!insidePolygon(crackOpositePoint, points)) {
        break;
      }
      crackOpositePoint = crackOpositePoint.add(new Vector2D(
        - crackNormal.x * 5,
        - crackNormal.y * 5
      ));
    }

    let crackMidPoint = new Vector2D((crackPoint.x + crackOpositePoint.x)/2, (crackPoint.y + crackOpositePoint.y)/2);

    if(crackPoints.some(c => Math.pow(c.x - crackMidPoint.x, 2) + Math.pow(c.y - crackMidPoint.y, 2) < 200)) {
      i--;
      continue;
    }

    crackPoints.push(crackMidPoint)

    let crack = [];
    crack.push(["M", 
      crackPoint.x - crackNormal.x * 5,
      crackPoint.y - crackNormal.y * 5
    ]);
    crack.push(["L", 
      crackPoint.x + crackNormal.x * crackLength2,// + Math.random()*4-2, 
      crackPoint.y + crackNormal.y * crackLength2// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackPoint.x + crackNormal.x * crackLength - crackNormal.y * -crackWidth2,// + Math.random()*4-2, 
      crackPoint.y + crackNormal.y * crackLength + crackNormal.x * -crackWidth2// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackPoint.x + crackNormal.x * crackLength2 - crackNormal.y * -crackWidth,// + Math.random()*4-2, 
      crackPoint.y + crackNormal.y * crackLength2 + crackNormal.x * -crackWidth// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackPoint.x - crackNormal.x * 5 - crackNormal.y * -crackWidth,// + Math.random()*4-2, 
      crackPoint.y - crackNormal.y * 5 + crackNormal.x * -crackWidth// + Math.random()*4-2
    ]);
    // back side
    crack.push(["L", 
      crackOpositePoint.x + crackNormal.x * 5 - crackNormal.y * -crackWidth,// + Math.random()*4-2, 
      crackOpositePoint.y + crackNormal.y * 5 + crackNormal.x * -crackWidth// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackOpositePoint.x - crackNormal.x * crackLength2 - crackNormal.y * -crackWidth,// + Math.random()*4-2, 
      crackOpositePoint.y - crackNormal.y * crackLength2 + crackNormal.x * -crackWidth// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackOpositePoint.x - crackNormal.x * crackLength - crackNormal.y * -crackWidth2,// + Math.random()*4-2, 
      crackOpositePoint.y - crackNormal.y * crackLength + crackNormal.x * -crackWidth2// + Math.random()*4-2
    ]);
    crack.push(["L", 
      crackOpositePoint.x - crackNormal.x * crackLength2,// + Math.random()*4-2, 
      crackOpositePoint.y - crackNormal.y * crackLength2// + Math.random()*4-2
    ]);
    crack.push(["z"]);
    newPathSmoothed.push(...crack);
    //newPathSmoothed.splice(crackIndex+1, 0, ...crack)
  }*/

  return newPathSmoothed;
}

export function insidePolygon(point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point.x, y = point.y;

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i].x, yi = vs[i].y;
      var xj = vs[j].x, yj = vs[j].y;

      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }

  return inside;
};

export function pathToPoints(newPath) {
  let newPoints = [];
  for(let i = 0; i < newPath.length; i++) {
    let segment = newPath[i];
    // move pointer
    if(segment[0] === "M") {
      newPoints[i] = new Vector2D(segment[1], segment[2]);
    } else if(segment[0] === "L") {
      newPoints[i] = new Vector2D(segment[1], segment[2]);
    } else if(segment[0] === "C") {
      newPoints[i] = new Vector2D(segment[5], segment[6]);
    } else if(segment[0] === "V") {
      newPoints[i] = new Vector2D(newPoints[i-1].x, segment[1]);
    } else if(segment[0] === "S") {
      newPoints[i] = new Vector2D(segment[3], segment[4]);
    } else {
      newPoints[i] = newPoints[i-1]
    }
  }
  return newPoints;
}

export function smoothPath(newPath, smoothing) {
  
  const line = (pointA, pointB) => {
    const lengthX = pointB.x - pointA.x
    const lengthY = pointB.y - pointA.y
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX)
    }
  }
  
  const controlPoint = (line, smooth) => (current, previous, next, reverse) => {
    const p = previous || current
    const n = next || current
    const l = line(p, n)

    const angle = l.angle + (reverse ? Math.PI : 0)
    const length = l.length * smooth
    const x = current.x + Math.cos(angle) * length
    const y = current.y + Math.sin(angle) * length
    return new Vector2D(x, y);
  }

  const bezierCommand = (controlPoint) => (point, i, a) => {
    const cps = controlPoint(a[i - 1], a[i - 2], point)
    const cpe = controlPoint(point, a[i - 1], a[i + 1], true)
    return ['C', cps.x, cps.y, cpe.x, cpe.y, point.x, point.y];
  }

  let newPathSmoothed = [];
  let newPoints = pathToPoints(newPath);
  
  const bezierCommandCalc = bezierCommand(controlPoint(line, smoothing))    

  for(let i = 0; i < newPath.length; i++) {
    if(newPath[i][0] === "M" || newPath[i][0] === "z") {
      newPathSmoothed.push(newPath[i]);
    } else {
      //newPathSmoothed.push(["L", newPoints[i].x, newPoints[i].y]);
      newPathSmoothed.push(bezierCommandCalc(newPoints[i], i, newPoints));
    }
  }

  return newPathSmoothed;
}

export function analyzePath(path) {

  let pointer = new Vector2D();
  let endNormal = new Vector2D();    

  let lastMIndex = 0;
  let lastMNormal = new Vector2D();
  let normals = Array(path.length).fill(new Vector2D());
  let points = Array(path.length).fill(new Vector2D());
  
  for(let i = 0; i < path.length; i++) {
    let segment = path[i];

    let startNormal = new Vector2D();
    let totalNormal = endNormal.copy();

    // end of a subpath -> close back to beginning
    if(i+1 < path.length && path[i+1][0] === "z") {
      // calc normal
      normals[lastMIndex] = lastMNormal.add(endNormal).norm();
    }

    // update pointer
    if(segment[0] === "M") {
      // move pointer
      pointer = new Vector2D(segment[1], segment[2]);
      // calc normal
      endNormal = new Vector2D();
    } else if(segment[0] === "L") {
      // calc normal
      endNormal = startNormal = new Vector2D(segment[1], segment[2]).normal();
      // move pointer
      pointer = new Vector2D(segment[1], segment[2]);
    } else if(segment[0] === "l") {
      // calc normal
      endNormal = startNormal = new Vector2D(segment[1], segment[2]).normal();
      // to absolute coords
      segment[0] = "L"
      segment[1] = pointer.x + segment[1];
      segment[2] = pointer.y + segment[2];
      // move pointer
      pointer = new Vector2D(segment[1], segment[2]);
    } else if(segment[0] === "c") {
      // calc normal
      endNormal = new Vector2D(segment[3], segment[4]).normal();
      startNormal = new Vector2D(segment[1], segment[2]).normal();
      // to absolute coords
      segment[0] = "C"
      segment[1] = pointer.x + segment[1];
      segment[2] = pointer.y + segment[2];
      segment[3] = pointer.x + segment[3];
      segment[4] = pointer.y + segment[4];
      segment[5] = pointer.x + segment[5];
      segment[6] = pointer.y + segment[6];
      // move pointer
      pointer = new Vector2D(segment[5], segment[6]);
    } else if(segment[0] === "C") {
      // move pointer
      pointer = new Vector2D(segment[5], segment[6]);
      // calc normal
      endNormal = new Vector2D(segment[3], segment[4]).normal();
      startNormal = new Vector2D(segment[1], segment[2]).normal();
    } else if(segment[0] === "V") {
      // calc normal
      startNormal = new Vector2D(-Math.sign(segment[1]), 0);
      endNormal = new Vector2D(-Math.sign(segment[1]), 0);
      // move pointer
      pointer = new Vector2D(pointer.x, segment[1]);
    } else if(segment[0] === "v") {
      // calc normal
      startNormal = new Vector2D(-Math.sign(segment[1]), 0);
      endNormal = new Vector2D(-Math.sign(segment[1]), 0);
      // to absolute coords
      segment[0] = "V"
      segment[1] = pointer.y + segment[1];
      // move pointer
      pointer = new Vector2D(pointer.x, segment[1]);
    } else if(segment[0] === "S") {
      // move pointer
      pointer = new Vector2D(segment[3], segment[4]);
    } else if(segment[0] === "s") {
      // to absolute coords
      segment[0] = "S"
      segment[1] = pointer.x + segment[1];
      segment[2] = pointer.y + segment[2];
      segment[3] = pointer.x + segment[3];
      segment[4] = pointer.y + segment[4];
      // move pointer
      pointer = new Vector2D(segment[3], segment[4]);
    } else if(segment[0] === "z") {
      endNormal = new Vector2D();
    }

    if(i+1 < path.length && path[i+1][0] === "z") {
      // totalNormal stays unchanged
    } else if(segment[0] === "z")
      totalNormal = normals[lastMIndex].copy();
    else if(segment[0] === "S")
      totalNormal = endNormal.copy();
    else
      totalNormal = totalNormal.add(startNormal).norm();

    // merge last end normal with this start normal
    if(i > 0) {
      normals[i-1] = totalNormal.copy();
      // if last seg was start point, pointsve normal seperately
      if(path[i-1][0] === "M") {
        lastMNormal = totalNormal.copy();
        lastMIndex = i-1;
      }
    }

    // pointsve edge point position
    points[i] = pointer.copy();
  }

  return {points, normals, path}
}

export class Path {
  segments = [];
}

export class CubicBezier {
  constructor(x0=0, y0=0, cx0=0, cy0=0, cx1=0, cy1=0, x1=0, y1=0) {
    this.x0 = x0;
    this.y0 = y0;
    this.cx0 = cx0;
    this.cy0 = cy0;
    this.cx1 = cx1;
    this.cy1 = cy1;
    this.x1 = x1;
    this.y1 = y1;
  }

  toString() {

  }

  static parse(str){

  }
}

export class QuadraticBezier {

}

export class Line {

}

export class VertivalLine {

}

export class Move {
  
}

export class EndPath {
  
}

export class Vector2D {
  constructor(x=0,y=0) {
    this.x = x;
    this.y = y;
  }

  add(vec) {
    return new Vector2D(this.x + vec.x, this.y + vec.y);
  }

  isNull() {
    return this.x === 0 && this.y === 0;
  }

  copy() {
    return new Vector2D(this.x, this.y);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  norm() {
    if(this.isNull()) {
      return new Vector2D();
    }
    let len = this.length();
    return new Vector2D(this.x / len, this.y / len);
  }

  normal() {
    let norm = this.norm();
    return new Vector2D(-norm.y, norm.x);
  }
}