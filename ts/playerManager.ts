import * as input from "./inputManager";
import * as ces from "./ces";
import * as utils from "./utils"
import ObjectPool from "./objectPool";
import {Update} from "./animationManager";
import {Entity as RenderedEntity} from "./webglManager";
import {Entity as ChildEntity} from "./parentManager";
import {Entity as MotionEntity} from "./motionManager";
import {CombinedEntity} from "./entity";

export interface PlayerEntity extends RenderedEntity, MotionEntity {
  player: {
    particleCount: number,
    bodyWiggle: number,
    stepSpeed: number,
    stepSize: number,
    dashLength: number,
    particleBase: string,
    footBase: string,
    lightPerParticle?: number,
    storedParticles?: number,
    speed?: number,
    walkAnimation?: number,
    dashStartTime?: number,
    lastDashed?: number,
    pool?: ObjectPool<PlayerParticle>
  },
  lightIntensity: number,
  enabled?: boolean
}
export function isPlayer(entity: CombinedEntity): entity is PlayerEntity { return "player" in entity; };

export interface FootEntity extends RenderedEntity, ChildEntity {
  foot: boolean
}
export function isFoot(entity: CombinedEntity): entity is FootEntity { return "foot" in entity; }

export interface PlayerParticle extends RenderedEntity, MotionEntity {
  playerParticle: boolean
}
export function isPlayerParticle(entity: CombinedEntity): entity is PlayerParticle { return "playerParticle" in entity; }

export type Entity = PlayerEntity | FootEntity | PlayerParticle;

function updateFeet(playerEntity: PlayerEntity) {
  var scale = 1;
  if ("scale" in playerEntity) {
    scale = playerEntity.scale;
  }

  var feet = ces.getEntities(isFoot);
  for (let entity of feet) {
    entity.child.relativePosition.y =
      Math.sin(playerEntity.player.walkAnimation) * // Move steps by sin wave
      playerEntity.player.stepSize *                // Account for settings
      playerEntity.player.speed *                   // Step faster as you walk faster
      entity.child.relativePosition.x *             // Account for which foot and scale a bit
      scale;
  }
}

function updateBody(entity: PlayerEntity) {
  var body = ces.getEntity("body") as ChildEntity;
  body.child.relativeRotation =
    Math.sin(entity.player.walkAnimation) *
    entity.player.speed *
    entity.player.bodyWiggle;
}

function updatePlayer(entity: PlayerEntity, time: number) {
  let mouseState = input.MouseState();
  if ("enabled" in entity && !entity.enabled) {
    let particles = ces.getEntities(isPlayerParticle);
    let effectingParticles: PlayerParticle[];
    if (time - entity.player.dashStartTime > entity.player.dashLength) {
      effectingParticles = particles;
    } else {
      let closeParticles = particles.filter(p => utils.length(utils.sub(p.position, mouseState.position)) < entity.dimensions.x / 2);
      if (closeParticles.length > 0) {
        effectingParticles = closeParticles;
      }
    }

    if (effectingParticles) {
      entity.position = utils.sum(
        {x: 0, y: 0, z: entity.position.z},
        utils.flatten(utils.average(effectingParticles.map(p => p.position)))
      );
      entity.velocity = utils.flatten(utils.average(effectingParticles.map(p => p.velocity)));
      entity.player.lastDashed = time;
      entity.enabled = true;
      entity.rotation = utils.xyAngle(entity.velocity) + Math.PI / 2;
    }
  } else {
    let strengthLevel = (entity.player.particleCount - 5) / 25;
    if (mouseState.mouseButtons.left && (time - entity.player.lastDashed) > (1 - strengthLevel) * 1.5 && entity.player.storedParticles == entity.player.particleCount) {
      for (let i = 0; i < entity.player.particleCount; i++) {
        let particle = entity.player.pool.New();
        let perterbation = Math.random() - 0.5
        let dashAngle = utils.xyAngle(utils.sub(mouseState.position, entity.position)) + perterbation * Math.PI;
        let dashDir = {x: Math.cos(dashAngle), y: Math.sin(dashAngle), z: 0};
        particle.velocity = utils.scale(dashDir, Math.random() * (1 + Math.abs(perterbation)));
        particle.position = entity.position;
        particle.rotation = Math.random() * Math.PI * 2;
        ces.addEntity(particle);
      }
      entity.enabled = false;
      entity.player.storedParticles = 0;
      entity.player.dashStartTime = time;
      entity.lightIntensity = 0;
      entity.color.a = 0;
    } else {
      let delta = {x: 0, y: 0, z: 0};
      if (input.KeyDown("a")) {
        delta.x -=  10;
      }
      if (input.KeyDown("d")) {
        delta.x += 10;
      }
      if (input.KeyDown("w")) {
        delta.y += 10;
      }
      if (input.KeyDown("s")) {
        delta.y -= 10;
      }
      if (delta.x != 0 || delta.y != 0) {
        let targetRotation = utils.xyAngle(delta) + Math.PI / 2;
        let r = entity.rotation;
        if (targetRotation >= r + Math.PI) {
          r += Math.PI * 2;
        } else {
          if (targetRotation < (r - Math.PI)) {
            targetRotation += Math.PI * 2;
          }
        }
        let dr = targetRotation - r;
        entity.rotation += dr * 0.2;
        entity.rotation = entity.rotation % (Math.PI * 2)
      }
      let length = utils.length(delta);
      if (length != 0) {
        delta = utils.shrink(delta, length);
      }
      entity.velocity = utils.sum(entity.velocity, utils.scale(delta, 0.1));

      var playerSpeed = utils.length(entity.velocity);
      entity.player.speed = playerSpeed;
      entity.player.walkAnimation += playerSpeed * entity.player.stepSpeed;
      entity.color.a += ((entity.player.storedParticles / entity.player.particleCount) - entity.color.a) * 0.1;
    }
  }
}

function updatePlayerParticle(entity: PlayerParticle) {
  let mouseState = input.MouseState();
  let playerEntities = ces.getEntities(isPlayer)
  let target: utils.Point;
  if (playerEntities.length != 0) {
    let playerEntity = playerEntities[0];
    target = playerEntity.position;
    if (utils.length(utils.sub(entity.position, playerEntity.position)) < playerEntity.dimensions.x / 2) {
      ces.removeEntity(entity);
      playerEntity.player.pool.Free(entity);
      playerEntity.player.storedParticles ++;
      playerEntity.lightIntensity = playerEntity.player.lightPerParticle * playerEntity.player.storedParticles;
    }
  } else {
    target = mouseState.position;
  }
  entity.velocity = utils.sum(utils.scale(utils.normalize(utils.sub(target, entity.position)), 0.08), entity.velocity);
}

export function setup() {
  ces.EntityAdded.Subscribe((entity) => {
    if (isPlayer(entity)) {
      entity.rotation = 0;
      entity.velocity = {x: 0, y: 0, z: 0};
      entity.player.walkAnimation = 0;
      entity.player.lastDashed = -Infinity;
      let particleBase = ces.getEntity(entity.player.particleBase) as any;
      entity.player.pool = new ObjectPool({
        ...particleBase,
        velocity: {x: 0, y: 0, z: 0},
        playerParticle: true,
        enabled: true
      });
      entity.player.lightPerParticle = particleBase.lightIntensity;
      entity.player.storedParticles = entity.player.particleCount;
      let footBase = ces.getEntity(entity.player.footBase);
      let footPool = new ObjectPool({
          ...footBase,
        enabled: true
      });
      let rightFoot = ces.addEntity({
          ...footPool.New(),
        id: "rightFoot",
        dimensions: {
          x: -(footBase as any).dimensions.x,
          y: (footBase as any).dimensions.y,
          z: 0
        },
        child: {
          relativePosition: {
            x: (footBase as any).position.x
          }
        }
      });
      let leftFoot = ces.addEntity({
          ...footPool.New(),
        id: "leftFoot",
        child: {
          relativePosition: {
            x: -(footBase as any).position.x
          }
        }
      });
    }
  });

  Update.Subscribe((time) => {
    for (let entity of ces.getEntities(isPlayer, true)) {
      updatePlayer(entity, time);
      updateFeet(entity);
      updateBody(entity);
    }

    for (let entity of ces.getEntities(isPlayerParticle)) {
      updatePlayerParticle(entity);
    }
  });
}
