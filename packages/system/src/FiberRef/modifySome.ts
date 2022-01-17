// ets_tracing: off

import * as Tp from "../Collections/Immutable/Tuple"
import type { Option } from "../Option"
import { getOrElse_ } from "../Option"
import { modify } from "./modify"

/**
 * Atomically modifies the `FiberRef` with the specified partial function, which computes
 * a return value for the modification if the function is defined in the current value
 * otherwise it returns a default value.
 * This is a more powerful version of `updateSome`.
 */
export function modifySome<B>(defaultValue: () => B) {
  return <A>(f: (a: A) => Option<Tp.Tuple<[B, A]>>) =>
    modify<A, B>((v) => getOrElse_(f(v), () => Tp.tuple(defaultValue(), v)))
}