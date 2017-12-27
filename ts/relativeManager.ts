export type Wrapped<T> = { unwrap: T } | {
  [P in keyof T]: (val?: T[P]) => Wrapped<T[P]>
}

export function wrap<T>(source: T): Wrapped<T> {
  let obj = source as any;
  let wrapped = obj as any;
  for (let key in obj) {
    let propType = typeof obj[key];
    if (propType == "number") {
      wrapped[key] = (prop?: number) => {
        if (prop) {
          obj[key] = prop;
        }
        let result: number = obj[key];
        let sumKey = "+" + key;
        if (sumKey in obj) {
          result += obj[sumKey];
        }
        let subKey = "-" + key;
        if (subKey in obj) {
          result -= obj[subKey];
        }
        let prodKey = "*" + key;
        if (prodKey in obj) {
          result *= obj[prodKey];
        }
        let divKey = "/" + key;
        if (divKey in obj) {
          result /= obj[divKey];
        }
        return result;
      }
    } else if (propType == "string") {
      wrapped[key] = (prop?: string) => {
        if (prop) {
          obj[key] = prop;
        }
        let result: string = obj[key];
        let sumKey = "+" + key;
        if (sumKey in obj) {
          result += obj[sumKey];
        }
        return result;
      }
    } else {
      let wrappedProp = wrap(obj[key]);
      wrapped[key] = (prop?: any) => {
        if (prop) {
          obj[key] = prop;
        }
        return wrappedProp;
      }
    }
  }
  wrapped.unwrap = obj;
  return wrapped;
}
