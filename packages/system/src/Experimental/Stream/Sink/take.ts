// ets_tracing: off

import * as CK from "../../../Collections/Immutable/Chunk"
import { pipe } from "../../../Function"
import * as CH from "../Channel"
import * as Chain from "./chain"
import * as C from "./core"
import * as FoldChunks from "./foldChunks"

/*
 * A sink that takes the specified number of values.
 */
export function take<Err, In>(
  n: number
): C.Sink<unknown, Err, In, Err, In, CK.Chunk<In>> {
  return pipe(
    FoldChunks.foldChunks<Err, In, CK.Chunk<In>>(
      CK.empty(),
      (_) => CK.size(_) < n,
      (a, b) => CK.concat_(a, b)
    ),
    Chain.chain((acc) => {
      const {
        tuple: [taken, leftover]
      } = CK.splitAt_(acc, n)

      return new C.Sink(CH.zipRight_(CH.write(leftover), CH.end(taken)))
    })
  )
}