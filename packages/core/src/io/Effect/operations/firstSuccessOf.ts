import * as A from "../../../collection/immutable/Array"
import * as NA from "../../../collection/immutable/NonEmptyArray"
import { Effect } from "../definition"

/**
 * Returns an effect that runs this effect and in case of failure, runs each
 * of the specified effects in order until one of them succeeds.
 *
 * @tsplus static ets/EffectOps firstSuccessOf
 */
export function firstSuccessOf<R, E, A>(
  effects: NA.NonEmptyArray<Effect<R, E, A>>,
  __tsplusTrace?: string
): Effect<R, E, A> {
  return Effect.suspendSucceed(() => {
    const head = NA.head(effects)
    const rest = NA.tail(effects)
    return A.reduce_(rest, head, (b, a) => b | a)
  })
}