/**
 * A sink that collects all of its inputs into a set.
 *
 * @tsplus static ets/Sink/Ops collectAllToSet
 */
export function collectAllToSet<In>(): Sink<unknown, never, In, never, HashSet<In>> {
  return Sink.foldLeftChunks(HashSet.empty(), (acc, c) => c.reduce(acc, (set, a) => set.add(a)));
}