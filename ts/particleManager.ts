import {CombinedEntity} from "./entity";
import {Update} from "./animationManager";
import * as ces from "./ces";
import {collapseTarget} from "./interpolationManager";
import ObjectPool from "./objectPool";

export interface Entity {
  particleGenerator: {
    relativeStart: any;
    relativeEnd: any;
    constant: any;
    length: number;
    frequency: number;
    particleIds?: Set<string>;
    pool?: ObjectPool<any>;
  }
}
export function isGenerator(entity: CombinedEntity): entity is Entity { return "particleGenerator" in entity; }



function makeRelative(entity: any, target: any) {
  for (let id in target) {
    if (id in entity) {
      if (!isNaN(target[id]) || !isNaN(entity[id])) {
        target[id] += entity[id];
      } else if (typeof entity[id] == "object" && typeof target[id] == "object") {
        makeRelative(entity[id], target[id]);
      }
    }
  }
}

export function setup() {
  ces.CheckEntity.Subscribe((entity) => {
    if (isGenerator(entity)) {
      let generator = entity.particleGenerator;
      generator.particleIds = new Set<string>();
      let start: any = {};
      collapseTarget(generator.relativeStart, start);
      generator.pool = new ObjectPool({...generator.constant, ...start, interpolated: {
        start: start,
        end: start,
        length: generator.length,
        kill: true,
        state: {
          collapsedStart: {},
          collapsedEnd: {},
          timeStarted: NaN,
          reverse: false,
          initialized: false
        }
      }});
    }
    return true;
  });

  ces.EntityRemoved.Subscribe((entity) => {
    let generatorEntities = ces.getEntities(isGenerator);
    for (let generatorEntity of generatorEntities) {
      let generator = generatorEntity.particleGenerator;
      if (generator.particleIds.has(entity.id)) {
        generator.pool.Free(entity);
      }
    }
  })

  Update.Subscribe((time) => {
    let generatorEntities = ces.getEntities(isGenerator);
    for (let entity of generatorEntities) {
      let generator = entity.particleGenerator;
      for (let i = 0; i < 100; i++) {
        if (Math.random() < 0.01666 * generator.frequency / 100) {
          let particle = generator.pool.New();
          collapseTarget(generator.relativeStart, particle.interpolated.start);
          makeRelative(entity, particle.interpolated.start);
          collapseTarget(generator.relativeEnd, particle.interpolated.end);
          makeRelative(entity, particle.interpolated.end);
          ObjectPool.copy(particle.interpolated.start, particle);
          let addedEntity = ces.addEntity(particle);
          generator.particleIds.add(addedEntity.id);
        }
      }
    }
  })
}

