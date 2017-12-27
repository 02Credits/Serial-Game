import * as ces from "./ces";

export function Setup() {
  ces.addEntity({
    "id": "playerParticleBase",
    "position": {x: 0, y: 0, z: 5},
    "dimensions": {
      x: 2, y: 2, z: 0
    },
    "texture": "DustGrey.png",
    "collidable": true,
    "collisionShape": {
      kind: "circle"
    },
    "friction": 0.93,
    "restitution": 1.5,
    "lightIntensity": 1/50,
    "enabled": false,
    "jittery": {
      "roughness": 0.08,
      "amount": 0.3,
      "speed": 0.1
    }
  });

  ces.addEntity({
    "id": "playerFootBase",
    "texture": "Foot.png",
    "position": {
      "x": 2,
      "y": 0,
      "z": 0
    },
    "dimensions": {
      "x": 1.8,
      "y": 2.5,
      "z": 0
    },
    "parent": "player",
    "foot": true,
    "enabled": false
  });

  ces.addEntity({
    "id": "body",
    "texture": "CharacterBody.png",
    "parent": "player",
    "position": {
      "x": 0,
      "y": 0,
      "z": 4
    },
    "dimensions": {
      "x": 7,
      "y": 8,
      "z": 0
    },
    "child": {
      "relativePosition": {
        "x": 0,
        "y": 0,
        "z": 5
      }
    }
  });

  ces.addEntity({
    "id": "player",
    "texture": "CharacterHead.png",
    "position": {
      "x": 0,
      "y": 0,
      "z": 5
    },
    "dimensions": {
      "x": 6.5,
      "y": 6.5,
      "z": 0
    },
    "friction": 0.85,
    "collidable": true,
    "collisionShape": {
      "kind": "circle"
    },
    "color": {r: 1, g: 1, b: 1, a: 1},
    "lightIntensity": 1,
    "player": {
      "stepSpeed": 0.3,
      "stepSize": 1.4,
      "bodyWiggle": 0.3,
      "dashLength": 1.5,
      "particleCount": 50,
      "particleBase": "playerParticleBase",
      "footBase": "playerFootBase"
    }
  });
}
