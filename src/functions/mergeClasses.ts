import { AnyClass } from "../types/internal"

export default function mergeClasses<Target extends AnyClass>(target: Target, ...sources: AnyClass[]): Target {
  sources.forEach(({ prototype: source }) => {
    const descriptors: Record<string | symbol, PropertyDescriptor> = Object.keys(source).reduce((descriptors: Record<string, PropertyDescriptor>, key) => {
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key)!
      return descriptors
    }, {})

    Object.getOwnPropertyNames(source).forEach((key) => {
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key)!
      return descriptors
    })

    Object.getOwnPropertySymbols(source).forEach((sym) => {
      const descriptor = Object.getOwnPropertyDescriptor(source, sym)!
      if (descriptor.enumerable) {
        descriptors[sym] = descriptor!
      }
    })

    Object.defineProperties(target.prototype, descriptors)
  })

  return target
}