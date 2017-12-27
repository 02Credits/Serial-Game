import * as ces from "./ces";

import * as playerEntities from "./playerEntities";
import * as mapEntities from "./mapEntities";

import * as webglManager from "./webglManager";
import * as playerManager from "./playerManager";
import * as collisionManager from "./collisionManager";
import * as cameraManager from "./cameraManager";
import * as triggerManager from "./triggerManager";
import * as wallManager from "./wallManager";
import * as holeManager from "./holeManager";
import * as statueManager from "./statueManager";
import * as animationManager from "./animationManager";
import * as interpolationManager from "./interpolationManager";
import * as particleManager from "./particleManager";
import * as inputManager from "./inputManager";
import * as parentManager from "./parentManager";
import * as motionManager from "./motionManager";
import * as noiseManager from "./noiseManager";

webglManager.Setup(["GroundDebugTexture.png", "Wall.png", "Player.png", "CharacterBody.png", "CharacterHead.png", "Foot.png", "DustGrey.png", "FlashFuzz.png", "OpaqueSmoke.png"]).then(async () => {
  await collisionManager.setup();
  await playerManager.setup();
  await cameraManager.setup();
  await triggerManager.setup();
  await wallManager.setup();
  await holeManager.setup();
  await statueManager.setup();
  await interpolationManager.setup();
  await particleManager.setup();
  await inputManager.setup();
  await motionManager.setup();
  await parentManager.setup();
  await noiseManager.setup();

  ces.addEntity({
    "position": {
      "x": 0,
      "y": 0,
      "z": 0
    },
    "dimensions": {
      "x": 100,
      "y": 75,
      "z": 0
    },
    "camera": {
      "targetX": 0,
      "targetY": 0
    }
  });

  playerEntities.Setup();
  mapEntities.Setup();

  animationManager.Setup();
});
