import {CombinedEntity} from "./entity";
import {Update} from "./animationManager";
import {EventManager1} from "./eventManager";
import * as ces from "./ces";

export interface Entity {
  interpolated: {
    start: any;
    end: any;
    length: number;
    state?: {
      collapsedStart: any;
      collapsedEnd: any;
      timeStarted: number;
      reverse: boolean;
      initialized: boolean;
    }
    reversable?: boolean;
    repeating?: boolean;
    kill?: boolean
  }
}
export function isInterpolated(entity: CombinedEntity): entity is Entity { return "interpolated" in entity; }

export let AnimationFinished = new EventManager1<Entity>();

function mix(x: number, y: number, a: number) {
  return x * (1 - a) + y * a;
}

export function collapseTarget(target: any, destination: any) {
  for (let id in target) {
    let value : any = target[id];
    if (!isNaN(value)) {
      destination[id] = value;
    } else if (Array.isArray(value)) {
      let max = Math.max(value[0], value[1]);
      let min = Math.min(value[0], value[1]);
      destination[id] = Math.random() * (max - min) + min;
    } else if (typeof value == "object") {
      if (!destination[id]) {
        destination[id] = {}
      }
      collapseTarget(value, destination[id]);
    } else {
      destination[id] = target[id];
    }
  }
}

function initializeState(entity: Entity, time: number) {
  let state = entity.interpolated.state;
  collapseTarget(entity.interpolated.start, state.collapsedStart);
  collapseTarget(entity.interpolated.end, state.collapsedEnd);
  state.timeStarted = time;
  state.reverse = false;
  state.initialized = true;
}

function repeat(entity: Entity, time: number) {
  if (entity.interpolated.reversable) {
    entity.interpolated.state.reverse = !entity.interpolated.state.reverse;
    if (entity.interpolated.state.reverse) {
      collapseTarget(entity.interpolated.start, entity.interpolated.state.collapsedStart);
    } else {
      collapseTarget(entity.interpolated.end, entity.interpolated.state.collapsedEnd);
    }
  } else {
    initializeState(entity, time);
  }
  entity.interpolated.state.timeStarted = time;
}

function interpolate(start: any, end: any, target: any, amount: number) {
  for (let id in start) {
    if (id in end) {
      let startValue = start[id];
      let endValue = end[id];
      if (typeof startValue == "object") {
        interpolate(startValue, endValue, target[id], amount);
      } else {
        target[id] = mix(startValue, endValue, amount);
      }
    }
  }
}

function interpolateState(entity: Entity, time: number) {
  let start = entity.interpolated.state.collapsedStart;
  let end = entity.interpolated.state.collapsedEnd;
  let amount = (time - entity.interpolated.state.timeStarted) / entity.interpolated.length;
  amount = entity.interpolated.state.reverse ? 1 - amount : amount;
  interpolate(start, end, entity, amount);
}

export function setup() {
  ces.CheckEntity.Subscribe((entity) => {
    if (isInterpolated(entity)) {
      if (!("state" in entity.interpolated))
      entity.interpolated.state = {
        collapsedStart: {},
        collapsedEnd: {},
        timeStarted: NaN,
        reverse: false,
        initialized: false
      }
    }
    return true;
  })
  Update.Subscribe((time) => {
    let interpolatedEntities = ces.getEntities(isInterpolated);

    for (let entity of interpolatedEntities) {
      let interpolated = entity.interpolated;
      let state = entity.interpolated.state;
      if (!state.initialized) {
        initializeState(entity, time);
      } else {
        if (time - state.timeStarted > interpolated.length) {
          if (interpolated.repeating) {
            repeat(entity, time);
          } else {
            if (interpolated.kill) {
              ces.removeEntity(entity);
            } else {
              AnimationFinished.Publish(entity);
            }
          }
        } else {
          interpolateState(entity, time);
        }
      }
    }
  });
}
