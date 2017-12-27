import * as ces from "./ces";
import * as utils from "./utils";
import {Update} from "./animationManager";
import {isPlayer, isPlayerParticle} from "./playerManager";
import {Entity as RenderedEntity} from "./webglManager";

import {CombinedEntity} from "./entity";

let shake = 0;
let shakeFade = 0.95;

export interface CameraZone {
  cameraZone: true,
  dimensions: utils.Point,
  position: utils.Point
}
export function isCameraZone(entity: CombinedEntity): entity is CameraZone { return "cameraZone" in entity; }

export interface Camera {
  camera: {
    targetX: number,
    targetY: number,
  },
  dimensions: utils.Point,
  position: utils.Point
}
export function isCamera(entity: CombinedEntity): entity is Camera { return "camera" in entity; }

export type Entity = CameraZone | Camera;

export function Shake(amount: number) {
  shake = amount;
}

export function Retarget(target: {targetX: number, targetY: number}) {
  var cameraEntity = ces.getEntities(isCamera)[0];
  cameraEntity.camera.targetX = target.targetX;
  cameraEntity.camera.targetY = target.targetY;
}

export function setup() {
  Update.Subscribe(() => {
    let cameraEntities = ces.getEntities(isCamera);
    for (let cameraEntity of cameraEntities) {
      var dy = cameraEntity.camera.targetY - cameraEntity.position.y;
      var dx = cameraEntity.camera.targetX - cameraEntity.position.x;

      cameraEntity.position.x += dx * 0.05 + (Math.random() - 0.5) * shake;
      cameraEntity.position.y += dy * 0.05 + (Math.random() - 0.5) * shake;

      shake = shake * shakeFade;
    }

    let cameraZones = ces.getEntities(isCameraZone);
    let playerEntities = (ces.getEntities(isPlayer) as RenderedEntity[]).concat(ces.getEntities(isPlayerParticle));
    let bestZone: CameraZone;
    let playerEntityCount = 0;
    for (let cameraZone of cameraZones) {
      let count = 0;
      let {dimensions: {x: zw, y: zh}, position: {x: zx, y: zy}} = cameraZone;
      let zl = zx - zw / 2;
      let zr = zx + zw / 2;
      let zb = zy - zh / 2;
      let zt = zy + zh / 2;
      for (let playerEntity of playerEntities) {
        let {dimensions: {x: pw, y: ph}, position: {x: px, y: py}} = playerEntity;
        let pl = px - pw / 2;
        let pr = px + pw / 2;
        let pb = py - ph / 2;
        let pt = py + ph / 2;
        if (pl <= zr &&
            pr >= zl &&
            pt >= zb &&
            pb <= zt) {
          count += 1;
        }
      }
      if (count > playerEntityCount) {
        bestZone = cameraZone;
      }
    }

    if (bestZone) {
      cameraEntities[0].camera.targetX = bestZone.position.x;
      cameraEntities[0].camera.targetY = bestZone.position.y;
    }
  });
}
