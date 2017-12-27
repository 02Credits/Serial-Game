import * as ces from "./ces";
import * as utils from "./utils";
import {CombinedEntity} from "./entity";
import {Update} from "./animationManager";

export interface Entity {
  rotation?: number,
  position: utils.Point,
  velocity: utils.Point,
  angularVelocity: number,
  friction?: number
}
export function isMoving(entity: CombinedEntity): entity is Entity { return "velocity" in entity; }

export function setup() {
  Update.Subscribe(() => {
    for (let entity of ces.getEntities(isMoving)) {
      entity.position = utils.sum(entity.position, entity.velocity);
      if ("friction" in entity) {
        entity.velocity = utils.scale(entity.velocity, entity.friction);
      }
    }
  });
}
