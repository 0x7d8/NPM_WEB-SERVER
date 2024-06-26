import { AnyClass } from "@/types/internal"

export default function mergeClasses<Target extends AnyClass>(target: Target, ...sources: AnyClass[]): Target {
  sources.forEach((s) => {
    const source = s?.prototype ?? {}

    const descriptors: Record<string | symbol, PropertyDescriptor> = Object.keys(source).reduce((descriptors: Record<string, PropertyDescriptor>, key) => {
      if (target.prototype.hasOwnProperty(key)) return descriptors

      descriptors[key] = Object.getOwnPropertyDescriptor(source, key)!
      return descriptors
    }, {})

    Object.getOwnPropertyNames(source).forEach((key) => {
      if (target.prototype.hasOwnProperty(key)) return

      descriptors[key] = Object.getOwnPropertyDescriptor(source, key)!
      return descriptors
    })

    Object.getOwnPropertySymbols(source).forEach((sym) => {
      if (target.prototype.hasOwnProperty(sym)) return

      const descriptor = Object.getOwnPropertyDescriptor(source, sym)!
      if (descriptor.enumerable) {
        descriptors[sym] = descriptor!
      }
    })

    Object.defineProperties(target.prototype, descriptors)
  })

  return target
}