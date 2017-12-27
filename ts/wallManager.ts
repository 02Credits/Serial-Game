import {CheckEntity} from "./ces";
import {Collision, Entity as CollidableEntity, isCollidable} from "./collisionManager";
import {isPlayer} from "./playerManager";
import {CombinedEntity} from "./entity";
import {isMoving, Entity as MovingEntity} from "./motionManager";
import * as utils from "./utils";

// export interface PhysicalEntity extends CollidableEntity {
//   physical: boolean
// }
// export function isPhysical(entity: CombinedEntity): entity is PhysicalEntity { return "physical" in entity; }

export interface WallEntity extends CollidableEntity {
  wall: boolean
  position: utils.Point,
  dimensions: utils.Point,
}
export function isWall(entity: CombinedEntity): entity is WallEntity { return "wall" in entity; }

export interface BouncyEntity extends MovingEntity {
  restitution: number;
}
export function isBouncy(entity: CombinedEntity): entity is BouncyEntity { return "restitution" in entity; }

export type Entity = WallEntity | BouncyEntity;

export function setup() {
  Collision.Subscribe((collidable, wall, details) => {
    if (isWall(wall)) {
      collidable.position = utils.sub(collidable.position, utils.scale(details.normal, details.depth));
      if (isMoving(collidable)) {
        let restitution = 0;
        if (isBouncy(collidable)) {
          restitution = collidable.restitution;
        }
        let component = utils.dot(details.normal, collidable.velocity) / utils.length(details.normal);
        let correction = utils.scale(utils.normalize(details.normal), component);

        collidable.velocity = utils.sub(collidable.velocity, utils.scale(correction, restitution + 1));
      }
    }
  });
}
