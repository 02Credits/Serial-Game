import * as ces from "./ces"
import * as utils from "./utils";
import {Update} from "./animationManager";
import {Entity as RenderableEntity, isRenderable} from "./webglManager";
import {CombinedEntity} from "./entity";

export interface Entity extends RenderableEntity {
  child: {
    relativePosition?: utils.Point,
    relativeRotation?: number,
    relativeScale?: number,
    relativeAlpha?: number
  },
  parent: string,
  enabled?: boolean
}
export function isChild(entity: CombinedEntity): entity is Entity { return "child" in entity; }

export function setup() {
  Update.Subscribe(() => {
    for (let childEntity of ces.getEntities(isChild, true)) {
      let parent = ces.getEntity(childEntity.parent);
      if (isRenderable(parent)) {
        let parentRotation = parent.rotation || 0;
        let parentScale = parent.scale || 1;
        let parentX = parent.position.x || 0;
        let parentY = parent.position.y || 0;
        let parentAlpha = isNaN(parent.color.a) ? 1 : parent.color.a;
        childEntity.child.relativePosition = childEntity.child.relativePosition || {x: 0, y: 0, z: 0};
        childEntity.position.x =
          (Math.cos(parentRotation) * childEntity.child.relativePosition.x -
           Math.sin(parentRotation) * childEntity.child.relativePosition.y) * parentScale +
          parentX;
        childEntity.position.y =
          (Math.sin(parentRotation) * childEntity.child.relativePosition.x +
           Math.cos(parentRotation) * childEntity.child.relativePosition.y) * parentScale +
          parentY;
        childEntity.child.relativeRotation = childEntity.child.relativeRotation || 0;
        childEntity.rotation = childEntity.child.relativeRotation + parentRotation;
        childEntity.child.relativeScale = childEntity.child.relativeScale || 1;
        childEntity.scale = childEntity.child.relativeScale * parentScale;
        childEntity.child.relativeAlpha = childEntity.child.relativeAlpha || 1;
        childEntity.color.a = childEntity.child.relativeAlpha * parentAlpha;
        if ("enabled" in parent) {
          childEntity.enabled = parent.enabled;
        } else {
          childEntity.enabled = true;
        }
      }
    }
  });
}
