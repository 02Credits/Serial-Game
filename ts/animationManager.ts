import {EventManager0, EventManager1} from "./eventManager";
import * as ces from "./ces";

export let Time: number = null;
export let Running = true;
export let Update = new EventManager1<number>();
export let Draw = new EventManager1<number>();
export let Init = new EventManager0();

function loop(time: number) {
  time = time / 1000;
  if (!Time) {
    Time = time;
  }

  if (time - Time > 0.01667) {
    if (Running) {
      let iterations = 0;
      while (time - Time > 0.01667) {
        if (iterations > 2) {
          Time = time;
        }
        Update.Publish(Time);
        Time += 0.01667
        iterations++;
      }
      Draw.Publish(Time);
    } else {
      Time = time;
    }
  }
  requestAnimationFrame(loop);
}

export function Setup() {
  Init.Publish();
  requestAnimationFrame(loop);
}
