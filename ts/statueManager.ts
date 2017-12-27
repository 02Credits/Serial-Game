import * as ces from "./ces";
import * as utils from "./utils";
import {Update} from "./animationManager";
import {Entity as RenderedEntity} from "./webglManager";
import {isPlayer} from "./playerManager";
import {Collision} from "./collisionManager";

import {CombinedEntity} from "./entity";

export interface StatueComponent {
  // Current Jump progress
  jumpState?: {
    jumpTime: number;
    jumping: boolean;
    direction: utils.Point;
    jumpDistance: number;
  }
  lastJumped?: number;
  // Light activated
  active?: boolean;
  // Home Position
  home?: utils.Point;
  // Appearance
  activeTexture?: string;
  inactiveTexture?: string;
  // Jump triggering
  activationRadius: number;
  timeBetweenJumps: number;
  // Jump Characteristics
  maxJumpDistance: number;
  jumpTimeLength: number;
  jumpScaling: number;
  originalScale?: number;
  // Player Knockback
  knockBack: number;
  // Rotation Mechanics
  rotationSpeed: number;
  rotationSlowdown: number; // fraction to slow down by
}

export interface Entity extends RenderedEntity {
  statue: StatueComponent;
}
export function isStatue(entity: CombinedEntity): entity is Entity { return "statue" in entity; }

const obj: any = {};
export function setup() {
  ces.EntityAdded.Subscribe((entity) => {
    if (isStatue(entity)) {
      let statue = entity.statue;
      statue.jumpState = {jumpTime: 0, jumping: false, direction: {x:0, y:0, z:0}, jumpDistance: 0};
      statue.active = false;
      statue.home = (statue || obj).home || utils.clone(entity.position);
      statue.activeTexture = (statue || obj).activeTexture || entity.texture;
      statue.inactiveTexture = (statue || obj).inactiveTexture || entity.texture;
      statue.originalScale = entity.scale || 1;
      statue.lastJumped = 0;
      entity.position = (entity.position || obj) || {x: 0, y: 0, z: 0};
      entity.rotation = ((entity || obj).position || obj).rotation || 0;
    }
  });

  Collision.Subscribe((collider, collidee, details) => {
    if (isPlayer(collider) && isStatue(collidee)) {
      collider.velocity = utils.sub(collider.velocity, utils.scale(details.normal, 2));
    }
  });

  Update.Subscribe((time) => {
    for (let entity of ces.getEntities(isStatue)) {
      let statue = entity.statue;
      if (statue.jumpState.jumping) {
        let state = statue.jumpState;
        if (state.jumpTime > statue.jumpTimeLength) {     // Jump Finished
          state.jumping = false;
          statue.lastJumped = time;
          entity.scale = statue.originalScale;
        } else {    // Jump in progress
          state.jumpTime += 0.01667;
          let jumpPosition = state.jumpTime / statue.jumpTimeLength; // calculate what part of the jump we are in.
          // Effectively we are integrating the sin function. Since we want each jump to go the distance in the
          // Statue component settings, and the integral of sin(x)dx from 0 to pi is 2. We need to divide the value
          // we multiply with the direction by 2 so that we go the proper distance
          let jumpAmount = Math.sin(jumpPosition * Math.PI) / 2;
          let distanceScaling = state.jumpDistance / statue.maxJumpDistance;
          entity.position = utils.sum(entity.position, utils.scale(state.direction, jumpAmount * distanceScaling));
          entity.scale = statue.originalScale + statue.jumpScaling * jumpAmount;
        }
      } else {
        let playerEntities = ces.getEntities(isPlayer);
        let target = statue.home;
        let homeDelta = utils.sub(target, entity.position);
        let homeDistance = utils.distance(homeDelta);
        // Dunno why I did this... There should only ever be one player. Oh well
        let closestPlayerPosition;
        let closestDistance = Number.MAX_VALUE;
        for (let player of playerEntities) {
          let playerDelta = utils.sub(player.position, entity.position);
          let playerDistance = utils.distance(playerDelta);
          if (playerDistance < statue.activationRadius) {
            if (closestDistance > playerDistance) {
              closestPlayerPosition = player.position;
              closestDistance = playerDistance;
            }
          }
        }

        let distance = homeDistance;
        if (closestDistance != Number.MAX_VALUE) {
          target = closestPlayerPosition;
          distance = closestDistance;
        }
        if (distance > 0.01) {
          let targetDelta = utils.sub(target, entity.position);
          targetDelta = utils.shrink(targetDelta, distance);
          let targetRotation = utils.xyAngle(targetDelta);
          let r = entity.rotation;
          let dr = utils.absoluteMin([(targetRotation + (2 * Math.PI)) - (r + (2 * Math.PI)), (r + (2 * Math.PI)) - (targetRotation + (2 * Math.PI))]);
          if (time - statue.lastJumped > statue.timeBetweenJumps && Math.abs(dr) < 0.01) {
            statue.jumpState = {
              jumpTime: 0,
              jumping: true,
              direction: targetDelta,
              jumpDistance: Math.min(distance, statue.maxJumpDistance)
            };
          } else {
            if (Math.abs(dr) > statue.rotationSpeed) {
              entity.rotation += dr * statue.rotationSpeed / Math.abs(dr);
              entity.rotation = entity.rotation % (Math.PI * 2);
            } else {
              entity.rotation += dr * statue.rotationSlowdown;
            }
          }
        } else {
          statue.lastJumped = time;
        }
      }
    }
  });
}
