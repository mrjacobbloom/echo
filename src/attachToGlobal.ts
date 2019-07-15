/**
 * Attach a getter to a given property of the global object
 * @param property Property to attach to global
 * @param getter Getter function when that property is accessed
 */
export default function attachToGlobal(property: string, getter: () => void) {
  const global_ = typeof globalThis !== 'undefined' ? globalThis :
    typeof self !== 'undefined' ? self :
    typeof window !== 'undefined' ? window :
    typeof global !== 'undefined' ? global : null;
  if (global_ === null) throw new Error('Unable to locate global object');

  Object.defineProperty(global_, property, { get: getter });
}