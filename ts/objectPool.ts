export default class ObjectPool<T> {
  private pool: T[] = [];
  private proto: T;

  static copy<T>(source: T, dest: T) {
    for (let id in source) {
      if (typeof source[id] == "object") {
        if (!dest[id]) {
          dest[id] = {} as any;
        }
        this.copy(source[id], dest[id]);
      } else {
        dest[id] = this.clone(source[id]);
      }
    }
  }

  static clone<T>(el: T): T {
    if (typeof el == "object") {
      let newEl: any = {} as any;
      this.copy(el, newEl);
      return newEl;
    } else if (Array.isArray(el)) {
      let returnArray: any[] = [];
      for (let child of el as any[]) {
        returnArray.push(this.clone(child));
      }
      return returnArray as any as T;
    } else {
      return el;
    }
  }

  constructor(proto: T) {
    this.proto = proto;
  }

  public New(): T {
    if (this.pool.length != 0) {
      return this.pool.pop();
    } else {
      return ObjectPool.clone(this.proto);
    }
  }

  public Free(obj: T) {
    ObjectPool.copy(this.proto, obj);
    this.pool.push(obj);
  }
}
