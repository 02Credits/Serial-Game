import {Collision, Entity as CollidableEntity} from "./collisionManager";
import {isRenderable} from "./webglManager";
import {EventManager1} from "./eventManager";

import {CombinedEntity} from "./entity";
import * as utils from "./utils";

export let Fell = new EventManager1<any>();

interface FallableEntity extends CollidableEntity {
  fallable: boolean
}
export function isFallable(entity: CombinedEntity): entity is FallableEntity { return "fallable" in entity; };

interface HoleEntity extends CollidableEntity {
  hole: {
    steepness: number
  }
}
export function isHole(entity: CombinedEntity): entity is HoleEntity { return "hole" in entity; };

export type Entity = FallableEntity | HoleEntity;

export function setup() {
  Collision.Subscribe((fallable, collidable, details) => {
    if (isFallable(fallable)) {
      if (isHole(collidable)) {
        if (details.depth > Math.max(fallable.dimensions.x, fallable.dimensions.y)) {
          fallable.position.x = collidable.position.x;
          fallable.position.y = collidable.position.y;
          Fell.Publish(fallable);
        } else {
          fallable.position = utils.scale(details.normal, details.depth * collidable.hole.steepness);
        }

        var factor = 1.2 - details.depth * 0.2;
        if (factor < 0) {
          factor = 0;
        }

        if (factor > 1) {
          factor = 1;
        }

        if (isRenderable(fallable)) {
          if ("color" in fallable) {
            fallable.color.a = factor;
          }
          fallable.scale = factor;
        }
      }
    }
  });
}
