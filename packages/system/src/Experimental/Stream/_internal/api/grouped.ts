// ets_tracing: off

import type * as CK from "../../../../Collections/Immutable/Chunk"
import * as SK from "../../Sink"
import type * as C from "../core"
import * as Transduce from "./transduce"

/**
 * Partitions the stream with specified chunkSize
 * @param chunkSize size of the chunk
 */
export function grouped_<R, E, A>(
  self: C.Stream<R, E, A>,
  chunkSize: number
): C.Stream<R, E, CK.Chunk<A>> {
  return Transduce.transduce_(self, SK.collectAllN<E, A>(chunkSize))
}

/**
 * Partitions the stream with specified chunkSize
 * @param chunkSize size of the chunk
 *
 * @ets_data_first grouped_
 */
export function grouped(chunkSize: number) {
  return <R, E, A>(self: C.Stream<R, E, A>) => grouped_(self, chunkSize)
}