import * as twgl from "twgl.js";

import {Init, Draw} from "./animationManager";
import * as ces from "./ces";
import {isCamera} from "./cameraManager";
import {isCollidable, getCorners} from "./collisionManager";
import {spliceArray, spliceData, Point} from "./utils";
import {CombinedEntity} from "./entity";
import * as ImageMapUtils from "./imageMapUtils";
import * as LightManager from "./lightManager";

let spriteVert: string = require<string>('../assets/Shaders/Sprite/vert.glsl');
let spriteFrag: string = require<string>('../assets/Shaders/Sprite/frag.glsl');

const obj: any = {};

export let canvasDimensions: Point = {x: 1000, y: 750, z: 1};
export let visibleDimensions: Point = {x: 0, y: 0, z: 1};

export interface Color {
  h?: number;
  s?: number;
  v?: number;
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}

export interface Entity {
  texture: string;
  position: Point;
  dimensions: Point;
  center?: Point;
  scale?: number;
  rotation?: number;
  color?: Color;
}

export function isRenderable(entity: CombinedEntity): entity is Entity { return "texture" in entity; }

function positionCanvas(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
  if (window.innerWidth > window.innerHeight) {
    let visibleHeight = window.innerHeight - 100;
    let visibleWidth = visibleHeight * 4 / 3;
    visibleDimensions = {x: visibleWidth, y: visibleHeight, z: 0};
  } else {
    let visibleWidth = window.innerWidth - 100;
    let visibleHeight = visibleWidth * 3 / 4;
    visibleDimensions = {x: visibleWidth, y: visibleHeight, z: 0};
  }

  canvas.style.width = visibleDimensions.x + "px";
  canvas.style.height = visibleDimensions.y + "px";
  canvas.style.marginLeft = -visibleDimensions.x / 2 + "px";
  canvas.style.marginTop = -visibleDimensions.y / 2 + "px";
  canvas.width = canvasDimensions.x;
  canvas.height = canvasDimensions.y;
  gl.viewport(0, 0, canvasDimensions.x, canvasDimensions.y);
}

function setCameraUniforms(program: twgl.ProgramInfo) {
  let camera = ces.getEntities(isCamera)[0];
  let cameraWidth = (camera.dimensions || obj).x || 100;
  let cameraHeight = (camera.dimensions || obj).y || 100;

  let cameraUniforms = {
    u_camera_dimensions: [camera.position.x, camera.position.y, cameraWidth, cameraHeight]
  };
  twgl.setUniforms(program, cameraUniforms);

}

function clearCanvas(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
  positionCanvas(canvas, gl);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function drawSprites(gl: WebGLRenderingContext,
                     spriteArrays: {[id: string]: {numComponents: number, data: Float32Array | Uint16Array, drawType: number}},
                     spriteProgram: twgl.ProgramInfo,
                     textureInfo: ImageMapUtils.TextureInfo,
                     bufferInfo: twgl.BufferInfo) {
  gl.useProgram(spriteProgram.program)
  let renderables = ces.getEntities(isRenderable).sort((a, b) => (a.position.z || 0) - (b.position.z || 0));

  for (let id in spriteArrays) {
    let expectedLength = 0;
    if (id == "indices") {
      expectedLength = renderables.length * spriteArrays[id].numComponents * 2;
    } else {
      expectedLength = renderables.length * spriteArrays[id].numComponents * 4;
    }

    if (spriteArrays[id].data.length < expectedLength) {
      console.log(expectedLength);
      if (id == "indices") {
        spriteArrays[id].data = new Uint16Array(expectedLength);
      } else {
        spriteArrays[id].data = new Float32Array(expectedLength);
      }
    }
  }

  let index = 0;
  for (let entity of renderables) {
    spliceData(spriteArrays.a_coord, index, [ 0, 0, 1, 0, 0, 1, 1, 1 ]);
    spliceData(spriteArrays.a_position, index, [
      entity.position.x,
      entity.position.y,
      entity.position.z || 0
    ]);
    spliceData(spriteArrays.a_texcoord, index, textureInfo.texCoords[entity.texture]);
    spliceData(spriteArrays.a_rotation, index, [entity.rotation || 0]);
    spliceData(spriteArrays.a_dimensions, index, [
      entity.dimensions.x,
      entity.dimensions.y
    ]);
    spliceData(spriteArrays.a_center, index, [
      (entity.center || obj).x || 0.5,
      (entity.center || obj).y || 0.5
    ]);
    spliceData(spriteArrays.a_scale, index, [entity.scale || 1]);
    spliceData(spriteArrays.a_color, index, [entity.color.r, entity.color.g, entity.color.b, entity.color.a]);
    let offset = index * 4;
    spliceArray(spriteArrays.indices.data, index * 6,
                [offset + 0, offset + 1, offset + 2, offset + 2, offset + 1, offset + 3]);
    index++;
  }

  for (let id in spriteArrays) {
    if (id != "indices") {
      twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs[id], spriteArrays[id]);
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, spriteArrays[id].data, spriteArrays[id].drawType);
    }
  }
  twgl.setBuffersAndAttributes(gl, spriteProgram, bufferInfo);
  twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo, renderables.length * 6);
}

export async function Setup(texturePaths: string[]) {
  let canvas = document.createElement('canvas');
  document.getElementById("game").appendChild(canvas);
  let gl = canvas.getContext('webgl', {alpha: false});
  let basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  canvas.focus();

  let textures = await ImageMapUtils.setupTextures(gl, basePath, texturePaths);
  let spriteProgram = twgl.createProgramInfo(gl, [spriteVert, spriteFrag]);

  let spriteArrays: {[id: string]: {numComponents: number, data: Float32Array | Uint16Array, drawType: number}} = {
    a_coord: {numComponents: 2, data: new Float32Array(800), drawType: gl.DYNAMIC_DRAW},
    a_position: {numComponents: 3, data: new Float32Array(800), drawType: gl.DYNAMIC_DRAW},
    a_texcoord: {numComponents: 2, data: new Float32Array(800), drawType: gl.DYNAMIC_DRAW},
    a_rotation: {numComponents: 1, data: new Float32Array(800), drawType: gl.DYNAMIC_DRAW},
    a_dimensions: {numComponents: 2, data: new Float32Array(800), drawType: gl.DYNAMIC_DRAW},
    a_center: {numComponents: 2, data: new Float32Array(800), drawType: gl.DYNAMIC_DRAW},
    a_scale: {numComponents: 1, data: new Float32Array(800), drawType: gl.DYNAMIC_DRAW},
    a_color: {numComponents: 4, data: new Float32Array(400), drawType: gl.DYNAMIC_DRAW},
    indices: {numComponents: 3, data: new Uint16Array(800), drawType: gl.DYNAMIC_DRAW}
  };

  let bufferInfo = twgl.createBufferInfoFromArrays(gl, spriteArrays);

  Init.Subscribe(() => {
    gl.useProgram(spriteProgram.program);

    setCameraUniforms(spriteProgram);
    twgl.setUniforms(spriteProgram, {
      u_texmap: textures.texture,
      u_map_dimensions: textures.size
    });
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  });

  ces.CheckEntity.Subscribe((entity) => {
    if (isRenderable(entity)) {
      entity.color = entity.color || { h: 1, s: 1, v: 1, a: 1, r: 1, g: 1, b: 1 };
    }
    return true;
  });

  Draw.Subscribe((time) => {
    clearCanvas(gl, canvas);
    setCameraUniforms(spriteProgram);
    twgl.setUniforms(spriteProgram, {
      u_time: time
    });
    LightManager.UpdateLightSourceUniforms(spriteProgram);
    drawSprites(gl, spriteArrays, spriteProgram, textures, bufferInfo);
  });
}
