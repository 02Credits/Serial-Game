import * as ces from "./ces";
import {Update} from "./animationManager";
import {isCamera} from "./cameraManager";

import {CombinedEntity} from "./entity";

import * as pixi from "pixi.js";

export interface RenderInfo {
  texture: string;
  alpha?: number;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
  cx?: number;
  cy?: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Entity {
  rendered: RenderInfo;
  position: Position;
  dimensions?: Dimensions;
  rotation?: number;
}
// export function isRenderable(entity: CombinedEntity): entity is Entity { return "rendered" in entity; }

// let sprites: { [id: string]: pixi.Sprite }  = { };
// let size = Math.min(window.innerWidth, window.innerHeight);
// export let renderer: pixi.CanvasRenderer;

// let stages: { [id: string]: pixi.Container } =  { };
// let uiStages: { [id: string]: pixi.Container } = { };

// let textures: { [id: string]: pixi.loaders.Resource } = {};

// export let root: pixi.Container;
// export let overlay: pixi.Container;

// function afterLoad() {
//   ces.EntityRemoved.Subscribe((entity) => {
//     if (isRenderable(entity) && sprites[entity.id]) {
//       stages[entity.position.z].removeChild(sprites[entity.id]);
//     }
//   });

//   ces.EntityRemoved.Subscribe((entity) => {
//     if (isRenderable(entity) && sprites[entity.id]) {
//       uiStages[entity.position.z].removeChild(sprites[entity.id]);
//     }
//   });

//   ces.EntityAdded.Subscribe((entity) => {
//     if (isRenderable(entity)) {
//       let rendered = entity.rendered;
//       sprites[entity.id] = new pixi.Sprite(textures[rendered.texture].texture);
//       updateSprite(entity);
//       let stage;
//       if (!("z" in entity.position)) {
//         entity.position.z = 5;
//       }
//       if (!(entity.position.z.toString() in stages)) {
//         stages[entity.position.z] = new pixi.Container();
//         root.addChild(stages[entity.position.z]);
//       }
//       stage = stages[entity.position.z];
//       stage.addChild(sprites[entity.id]);
//     }
//   });

//   Update.Subscribe(() => {
//     for (let entity of ces.GetEntities(isRenderable)) {
//       updateSprite(entity);
//     }
//   });

//   Update.Subscribe(() => {
//     let cameras = ces.GetEntities(isCamera);
//     if (cameras.length > 0) {
//       let cameraEntity = cameras[0];
//       let scale = 1;
//       if ("scale" in cameraEntity.camera) {
//         scale = cameraEntity.camera.scale;
//       }
//       root.x = -cameraEntity.position.x + (renderer.width / 2);
//       root.y = -cameraEntity.position.y + (renderer.height / 2);
//       root.scale.x = scale * renderer.width / 100;
//       root.scale.y = scale * renderer.height / 100;
//     }

//     root.children = root.children.sort((stage1, stage2) => {
//       if (stage1 === overlay) {
//         return -1;
//       } else if (stage2 === overlay) {
//         return 1;
//       }
//       let zIndex1, zIndex2;
//       for (let index of Object.keys(stages)) {
//         if (stages[index] === stage1) {
//           zIndex1 = index;
//         }
//         if (stages[index] === stage2) {
//           zIndex2 = index;
//         }
//       }
//       return zIndex1.localeCompare(zIndex2);
//     });

//     renderer.render(root);
//   });
// }

// function updateSprite(entity: Entity & {id: string}) {
//   if (sprites[entity.id]) {
//     let rendered = entity.rendered;
//     let position = entity.position;
//     let sprite = sprites[entity.id];

//     sprite.x = position.x;
//     sprite.y = position.y;

//     if (sprite.texture !== textures[rendered.texture].texture) {
//       sprite.texture = textures[rendered.texture].texture;
//     }

//     if ("alpha" in rendered) {
//       sprite.alpha = rendered.alpha;
//     }

//     let scale = 1;
//     if ("scale" in rendered) {
//       scale = rendered.scale;
//     }

//     if ("dimensions" in entity) {
//       sprite.width = entity.dimensions.width * scale;
//       sprite.height = entity.dimensions.height * scale;
//     } else {
//       entity.dimensions = {
//         width: sprite.width,
//         height: sprite.height
//       }
//     }

//     if ("rotation" in entity) {
//       sprite.rotation = entity.rotation;
//     }

//     if ("cx" in position) {
//       sprite.anchor.x = position.cx;
//     }

//     if ("cy" in position) {
//       sprite.anchor.y = position.cy;
//     }
//   }
// }

// function positionRenderer() {
//   let size = Math.min(window.innerWidth, window.innerHeight) - 100;
//   renderer.view.style.width = size + "px";
//   renderer.view.style.height = size + "px";
//   renderer.view.style.marginLeft = -size / 2 + "px";
//   renderer.view.style.marginTop = -size / 2 + "px";
//   renderer.resize(size, size);
// }

// export async function Setup(texturePaths: string[]) {
//   renderer = new pixi.CanvasRenderer(size, size);
//   root = new pixi.Container();
//   overlay = new pixi.Container();
//   root.addChild(overlay);

//   document.getElementById("game").appendChild(renderer.view);
//   renderer.view.focus();

//   window.onresize = positionRenderer;
//   positionRenderer();

//   return new Promise((resolve) => {
//     for (let path of texturePaths) {
//       let location = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
//       pixi.loader.add(path, location + "assets/" + path).load((loader: pixi.loaders.Loader, resources: { [id: string]: pixi.loaders.Resource }) => {
//         textures[path] = resources[path];
//         if (Object.keys(textures).length == texturePaths.length) {
//           afterLoad();
//           resolve();
//         }
//       });
//     }
//   });
// }
