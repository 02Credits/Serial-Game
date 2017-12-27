import * as ces from "./ces";
import {Update} from "./animationManager";

import {Entity as RenderableEntity} from "./webglManager";
import {EventManager3} from "./eventManager";

import {CombinedEntity} from "./entity";

import * as utils from "./utils";

interface Circle {
  kind: "circle"
}

interface Rectangle {
  kind: "rectangle"
}

interface Poly {
  kind: "polygon"
  points: utils.Polygon
}

interface CompoundPoly {
  kind: "compound polygon"
  children: utils.Polygon[]
}

const obj: any = {};

export interface GeometryEntity {
  collisionShape?: Circle | Rectangle | Poly | CompoundPoly;
  position: utils.Point;
  dimensions: utils.Point;
  scale?: number,
  rotation?: number,
  center?: utils.Point
}

export interface Entity extends GeometryEntity {
  collidable: boolean;
}
export function isCollidable(entity: CombinedEntity): entity is Entity { return "collidable" in entity; }

// Algorithm modified from http://wiki.roblox.com/index.php?title=2D_Collision_Detection
export function getCorners(entity: GeometryEntity) : utils.Polygon[]{
  let scale = entity.scale || 1;
  let rotation = entity.rotation || 0;
  let center = entity.center || {x: 0.5, y: 0.5};
  let corners: utils.Polygon[] = [];
  if (entity.collisionShape == null || entity.collisionShape.kind === "rectangle") {
    let left = entity.position.x + entity.dimensions.x * center.x;
    let right = entity.position.x - entity.dimensions.x * (1 - center.x);
    let bottom = entity.position.y + entity.dimensions.y * center.y;
    let top = entity.position.y - entity.dimensions.y * (1 - center.x);

    corners.push([
      {x: left, y: top, z: entity.position.z},
      {x: right, y: top, z: entity.position.z},
      {x: right, y: bottom, z: entity.position.z},
      {x: left, y: bottom, z: entity.position.z}
    ]);
  } else if (entity.collisionShape.kind === "polygon") {
    corners = [entity.collisionShape.points];
  } else if (entity.collisionShape.kind === "compound polygon"){
    for (let child of entity.collisionShape.children) {
      corners.push(child);
    }
  }
  let retList: utils.Polygon[] = [];
  for (let cornersList of corners) {
    retList.push(utils.transformPoly(cornersList, entity.position, rotation, scale));
  }
  return retList;
}

function getAxis(entity: Entity) {
  if (entity.collisionShape == null || entity.collisionShape.kind != "circle") {
    let axis: utils.Point[] = [];
    let childCorners = getCorners(entity);
    for (let child of childCorners) {
      let previous = child[child.length - 1];
      for (let corner of child) {
        axis.push(utils.xyNormal(utils.unit(utils.sub(corner, previous))));
        previous = corner;
      }
    }
    return axis;
  } else {
    return [];
  }
}

function projectedBounds(entity: Entity, axis: utils.Point) {
  if (entity.collisionShape != null && entity.collisionShape.kind === "circle") {
    let scale = ((entity || obj).renderer || obj).scale || 1;
    let center = utils.dot(entity.position, axis);
    let radius = Math.max(entity.dimensions.x * scale, entity.dimensions.y * scale) / 2;
    return {max: center + radius, min: center - radius};
  } else {
    let corners = getCorners(entity);
    let min = utils.dot(corners[0][0], axis);
    let max = min;
    for (let child of corners) {
      for (let corner of child) {
        let projectedCorner = utils.dot(corner, axis);
        if (projectedCorner > max) max = projectedCorner;
        if (projectedCorner < min) min = projectedCorner;
      }
    }
    return {min: min, max: max};
  }
}

function calculateOverlap(e1: Entity, e2: Entity, axis: utils.Point) {
  let b1 = projectedBounds(e1, axis);
  let b2 = projectedBounds(e2, axis);
  if (b2.min > b1.max || b2.max < b1.min) {
    return null;
  }
  return b1.max > b2.max ? -(b2.max - b1.min) : (b1.max - b2.min);
}

function getOverlap(e1: Entity, e2: Entity) {
  let c1 = getCorners(e1);
  let c2 = getCorners(e2)
  let result: {depth: number, normal: utils.Point} = null;
  let normal: utils.Point = {x: 0, y: 0, z: 0};
  for (let axis of getAxis(e1).concat(getAxis(e2))) {
    let overlap = calculateOverlap(e1, e2, axis);
    if (overlap == null) return null;

    if (result == null || Math.abs(overlap) < result.depth) {
      if (overlap < 0) {
        result = {
          depth: -overlap,
          normal: utils.scale(axis, -1)
        }
      } else {
        result = {
          depth: overlap,
          normal: axis
        }
      }
    }
  }
  return result;
}

export let Collision = new EventManager3<Entity, Entity, {depth: number, normal: utils.Point, time: number}>();

export function setup() {
  Update.Subscribe((time) => {
    let collidables = ces.getEntities(isCollidable);

    for (let collider of collidables) {
      for (let collidable of collidables) {
        if (collidable !== collider) {
          let result = getOverlap(collider, collidable);
          if (result !== null) {
            Collision.Publish(collider, collidable, {...result, time: time});
          }
        }
      }
    }
  });
}
