import * as ces from "./ces";
import {isCamera} from "./cameraManager";

export function Setup() {
  function addWall(left: number, right: number, top: number, bottom: number) {
    ces.addEntity({
      "position": {
        "x": (left + right) / 2,
        "y": (top + bottom) / 2,
        "z": 0
      },
      "dimensions": {
        "x": right - left,
        "y": top - bottom,
        "z": 0
      },
      "wall": true,
      "collidable": true,
      "texture": "Wall.png"
    });
  }

  function addCameraZone(left: number, right: number, top: number, bottom: number) {
    ces.addEntity({
      "cameraZone": true,
      "texture": "Wall.png",
      "position": {
        "x": (left + right) / 2,
        "y": (top + bottom) / 2,
        "z": 0
      },
      "dimensions": {
        "x": right - left,
        "y": top - bottom,
        "z": 0
      },
      "color": {
        "r": 0,
        "g": 1,
        "b": 0
      }
    })
  }

  //Room 1
  addWall(-15.625, 6.25, 3.125, -3.125); // Coffin
  addWall(-31.25, -25, 25, -25);  // Left Wall
  addWall(-25, 25, -18.75, -25);  // Bottom Wall
  addWall(-25, 25, 25, 18.75);  // Top Wall
  addWall(21.875, 28.125, 25, 6.25); // Top Right Wall
  addWall(21.875, 28.125, -6.25, -25); // Bottom Right Wall
  addCameraZone(-28.125, 28.125, 18.75, -18.75); // Left Trigger

}
