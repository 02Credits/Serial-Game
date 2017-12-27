export function absoluteMin(xs: number[]) {
  let currentMin = xs[0];
  for (let i = 1; i < xs.length; i ++) {
    if (Math.abs(currentMin) > Math.abs(xs[i])) {
      currentMin = xs[i];
    }
  }
  return currentMin;
}

export function spliceArray(dest: Uint16Array | Float32Array, offset: number, data: number[]) {
  for (let i = 0; i < data.length; i++) {
    dest[offset + i] = data[i];
  }
}

export interface Point {
  x: number,
  y: number,
  z: number
}

export function clone(p: Point): Point {
  return {x: p.x, y: p.y, z: p.z};
}

export function xyNormal(p: Point): Point {
  return {x: p.y, y: -p.x, z: p.z};
}

export function sum(p1: Point, p2: Point): Point {
  return {x: p1.x + p2.x, y: p1.y + p2.y, z: p1.z + p2.z};
}

export function sub(p1: Point, p2: Point): Point {
  return sum(p1, scale(p2, -1));
}

export function mult(p1: Point, p2: Point): Point {
  return {x: p1.x * p2.x, y: p1.y * p2.y, z: p1.z * p2.z};
}

export function div(p1: Point, p2: Point): Point {
  return {x: p1.x / p2.x, y: p1.y / p2.y, z: p1.z / p2.z};
}

export function dot(p1: Point, p2: Point): number {
  return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
}

export function scale(p: Point, s: number): Point {
  return {x: p.x * s, y: p.y * s, z: p.z * s};
}

export function shrink(p: Point, s: number): Point {
  return scale(p, 1/s);
}

export function length(p: Point): number {
  return Math.sqrt(dot(p, p));
}

export function xyAngle(p: Point): number {
  return Math.atan2(p.y, p.x);
}

export function flatten(p: Point): Point {
  return {x: p.x, y: p.y, z: 0};
}

export function average(ps: Point[]): Point {
  let returnPoint = {x: 0, y: 0, z: 0};
  if (ps.length > 0) {
    for (let p of ps) {
      returnPoint = sum(returnPoint, p);
    }
    return shrink(returnPoint, ps.length);
  } else {
    return returnPoint;
  }
}

export let distance = length;

export function normalize(p: Point): Point {
  let len = length(p);
  if (len != 0) {
    return shrink(p, len);
  } else {
    return p;
  }
}

export function unit(p: Point): Point {
  return shrink(p, length(p));
}

export function transform(p: Point, position: Point, rotation: number = 0, s: number = 1) {
  position = clone(position);
  let rel = scale(sub(p, position), s);
  position.x += rel.x * Math.cos(rotation) - rel.y * Math.sin(rotation);
  position.y += rel.x * Math.sin(rotation) + rel.y * Math.cos(rotation);
  return position;
}

export type Polygon = Point[];

export function polyFromCircle(x: number, y: number, z: number, r: number, points: number = 20) {
  let retList: Polygon = [];
  for (let i = 0; i < points; i++) {
    let theta = i * 2 * Math.PI / points;
    retList.push({x: x + r * Math.cos(theta), y: y + r * Math.sin(theta), z: z});
  }
  return retList;
}

export function polyFromRect(x: number, y: number, z: number, width: number, height: number, pointMode: "topLeft" | "center" | "twoPoint" = "topLeft"): Polygon {
  switch (pointMode) {
  case "topLeft":
    return [
      {x: x, y: y, z: z},
      {x: x + width, y: y, z: z},
      {x: x + width, y: y + height, z: z},
      {x: x, y: y + height, z: z}
    ];
  case "center":
    let halfW = width / 2;
    let halfH = height / 2;
    return [
      {x: x - halfW, y: y - halfH, z: z},
      {x: x + halfW, y: y - halfH, z: z},
      {x: x + halfW, y: y + halfH, z: z},
      {x: x - halfW, y: y + halfH, z: z}
    ];
  case "twoPoint":
    return [
      {x: x, y: y, z: z},
      {x: width, y: y, z: z},
      {x: width, y: height, z: z},
      {x: x, y: height, z: z}
    ];
  }
}

export function transformPoly(poly: Polygon, position: Point, rotation: number = 0, scale: number = 1) {
  let retPoly: Polygon = [];
  for (let point of poly) {
    retPoly.push(transform(point, position, rotation, scale));
  }
  return retPoly;
}

export function castOnSegment(rp: Point, rd: Point, s1: Point, s2: Point): Point | undefined {
  let sp = s1;
  let sd = sub(s2, s1);
  let sLen = length(sd);
  let st = (rd.x * (sp.y - rp.y) + rd.y * (rp.x - sp.x))/(rd.y * sd.x - rd.x * sd.y);
  let rt = (sp.y + sd.x * st - rp.x) / rd.x;
  if (st < sLen && rt > 0) {
    return sum(rp, scale(rd, rt));
  }
}

export function castOnPolygon(rp: Point, rd: Point, poly: Polygon): Point | undefined {
  let closest;
  let closestDist;
  let pPrevious = poly[poly.length - 1];
  for (let p of poly) {
    let i = castOnSegment(rp, rd, pPrevious, p);
    let newDist = length(sub(i, rp));
    if (!closestDist || newDist < closestDist) {
      closest = i;
      closestDist = newDist;
    }
    pPrevious = p;
  }
  return closest;
}

export function spliceData(array: {numComponents: number, data: Float32Array | Uint16Array}, entityIndex: number, data: number[]) {
  let expectedCount = array.numComponents * 4;
  for (let i = 0; i < expectedCount; i += data.length) {
    spliceArray(array.data, entityIndex * expectedCount + i, data);
  }
}
