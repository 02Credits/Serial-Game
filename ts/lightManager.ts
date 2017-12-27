import * as twgl from "twgl.js";
import {Point} from "./utils";
import {CombinedEntity} from "./entity";
import * as ces from "./ces";

export interface Entity {
  position: Point;
  lightIntensity: number;
}
export function isLightSource(entity: CombinedEntity): entity is Entity { return "lightIntensity" in entity; }

let lightUniforms = {
  u_light_position: new Array(100 * 2),
  u_light_intensity: new Array(100),
  u_light_enabled: new Array(100),
  u_ambient_light: 0.2
}

export function UpdateLightSourceUniforms(spriteProgram: twgl.ProgramInfo) {
  let lightSources = ces.getEntities(isLightSource);
  for (let i = 0; i < 100; i++) {
    if (i < lightSources.length) {
      lightUniforms.u_light_enabled[i] = true;
      lightUniforms.u_light_intensity[i] = lightSources[i].lightIntensity;
      lightUniforms.u_light_position[i * 2] = lightSources[i].position.x;
      lightUniforms.u_light_position[i * 2 + 1] = lightSources[i].position.y;
    } else {
      lightUniforms.u_light_enabled[i] = false;
    }
  }

  twgl.setUniforms(spriteProgram, lightUniforms);
}
