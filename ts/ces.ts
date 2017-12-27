import {PollManager1, EventManager1} from "./eventManager";
import {CombinedEntity} from "./entity";

let currentId = 0;
export let entities: Map<string, TrackedEntity> = new Map<string, TrackedEntity>();
export let sortedEntities: Map<(entity: TrackedEntity) => boolean, Set<TrackedEntity>> = new Map();

export type TrackedEntity = { id: string, enabled?: boolean } & CombinedEntity;
function isTracked(entity: CombinedEntity | TrackedEntity): entity is TrackedEntity { return "id" in entity; }

export let CheckEntity = new PollManager1<CombinedEntity, boolean>();
export let EntityAdded = new EventManager1<TrackedEntity>();
export let EntityRemoved = new EventManager1<TrackedEntity>();

function addToLists(entity: TrackedEntity) {
  for (let condition of sortedEntities.keys()) {
    if (condition(entity)) {
      sortedEntities.get(condition).add(entity);
    }
  }
  entities.set(entity.id, entity);
}

export function addEntity(entity: CombinedEntity | TrackedEntity) {
  let results = CheckEntity.Poll(entity);
  if (results.every(result => result || result === undefined)) {
    let trackedEntity: TrackedEntity;
    if (isTracked(entity)) {
      if (entity.id in entities) {
        console.warn("WARNING: repeat id for " + JSON.stringify(entity));
        return null;
      }
      trackedEntity = entity;
    } else {
      trackedEntity = {...entity, id: currentId.toString()};
      currentId++;
    }

    addToLists(trackedEntity);
    EntityAdded.Publish(trackedEntity);
    return trackedEntity;
  }
  return null;
}

export function removeEntity(entity: any) {
  EntityRemoved.Publish(entity);
  for (let guard of sortedEntities.keys()) {
    let entitySet = sortedEntities.get(guard);
    if (entitySet.has(entity)) {
      entitySet.delete(entity);
    }
  }
  entities.delete(entity.id);
}

export function getEntities<T extends CombinedEntity>(guard: (entity: CombinedEntity) => entity is T, includeDisabled: boolean = false): (T & { id: string })[] {
  if (sortedEntities.has(guard)) {
    return Array.from(sortedEntities.get(guard).values()).filter((entity) => !("enabled" in entity) || entity.enabled || includeDisabled) as any;
  } else {
    let newSet = new Set();
    for (let id of entities.keys()) {
      let entity = entities.get(id);
      if (guard(entity)) {
        newSet.add(entity);
      }
    }
    sortedEntities.set(guard, newSet);
    return Array.from(newSet.values()).filter((entity) => !("enabled" in entity) || entity.enabled || includeDisabled) as any;
  }
}

export function getEntity(id: string) {
  return entities.get(id);
}

export function hasEntity(entity: TrackedEntity) {
  return entities.has(entity.id);
}
