import {CheckEntity} from "./ces";
import {Collision, Entity as CollidableEntity} from "./collisionManager";
import {isPlayer, isPlayerParticle} from "./playerManager";

import {CombinedEntity} from "./entity";

export interface Entity extends CollidableEntity {
  trigger: {
    action: () => void
    once?: boolean,
    complete?: boolean,
  }
}
export function isTrigger(entity: CombinedEntity): entity is Entity { return "trigger" in entity; }

export function setup() {
  Collision.Subscribe((player, collidable, details) => {
    if (isPlayer(player) || isPlayerParticle(player)) {
      if (isTrigger(collidable)) {
        if (collidable.trigger.once) {
          if (!collidable.trigger.complete) {
            collidable.trigger.action();
          }
        } else {
          collidable.trigger.action();
        }
        collidable.trigger.complete = true;
      }
    }
  });
}
