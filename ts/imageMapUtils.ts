import * as twgl from "twgl.js";

export interface TextureInfo {
  size: number,
  canvas: HTMLCanvasElement,
  texCoords: { [id: string]: number[] },
  texture?: WebGLTexture
}

export function packTextures(images: { [id: string]: HTMLImageElement }): TextureInfo {
  let imageArray: {image: HTMLImageElement, id: string}[] = [];
  for (let id in images) {
    imageArray.push({image: images[id], id: id});
  }
  imageArray = imageArray.sort((a, b) => b.image.height - a.image.height);
  let size = 16;
  let correctSize = true;
  let imageLayoutInfo: { [id: string]: number[] };
  do {
    imageLayoutInfo = {};
    correctSize = true;
    let gap = 5;
    size *= 2;
    let x = gap;
    let y = gap;
    let rowHeight = imageArray[0].image.height;
    for (let imageData of imageArray) {
      let image = imageData.image;
      if (x > size) {
        x = gap;
        y += rowHeight + gap;
        if (y + image.height + gap > size) {
          correctSize = false;
          break;
        }
        rowHeight = image.height + gap;
      }
      imageLayoutInfo[imageData.id] = [
        x, y,
        x + image.width, y,
        x, y + image.height,
        x + image.width, y + image.height
      ]
      x += image.width + gap;
    }
  } while (!correctSize)

  let canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  // document.body.appendChild(canvas);
  let ctx = canvas.getContext('2d');
  for (var imageData of imageArray) {
    let info = imageLayoutInfo[imageData.id];
    ctx.drawImage(imageData.image, info[0], info[1]);
  }
  return {size: size, canvas: canvas, texCoords: imageLayoutInfo};
}

export async function setupTextures(gl: WebGLRenderingContext, basePath: string, texturePaths: string[]) {
  let result = await loadTextures(basePath, texturePaths);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  let texture = twgl.createTexture(gl, {
    src: result.canvas,
    // wrap: gl.CLAMP_TO_EDGE,
    // mag: gl.NEAREST,
    // min: gl.NEAREST
  });

  return {texture: texture, ...result};
}

export async function loadTextures(basePath: string, texturePaths: string[]) {
  let images: { [id: string]: HTMLImageElement } = {};
  for (let path of texturePaths) {
    let imagePath = basePath + "assets/Images/" + path;
    let image = new Image();
    let loadedPromise = new Promise((resolve) => {
      let handler = () => {
        resolve();
        image.removeEventListener('load', handler);
      }
      image.addEventListener('load', handler, false);
      image.src = imagePath;
    });
    await loadedPromise;
    images[path] = image;
  }

  return packTextures(images);
}
