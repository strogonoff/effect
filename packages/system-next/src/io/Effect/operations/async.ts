import * as O from "../../../data/Option"
import type { FiberId } from "../../FiberId"
import { none } from "../../FiberId/operations/none"
import type { Effect } from "../definition"
import { asyncMaybeBlockingOn } from "./asyncMaybe"
import type { Cb } from "./Cb"

/**
 * Imports an asynchronous side-effect into a pure `Effect` value. See
 * `asyncMaybe` for the more expressive variant of this function that can
 * return a value synchronously.
 *
 * The callback function `Effect<R, E, A] => Any` must be called at most once.
 *
 * @ets static ets/EffectOps async
 */
export function _async<R, E, A>(
  register: (callback: Cb<Effect<R, E, A>>) => void,
  __etsTrace?: string
): Effect<R, E, A> {
  return asyncBlockingOn(register, none, __etsTrace)
}

export { _async as async }

/**
 * Imports an asynchronous side-effect into a pure `ZIO` value. See
 * `asyncMaybe` for the more expressive variant of this function that can
 * return a value synchronously.
 *
 * The callback function `ZIO[R, E, A] => Any` must be called at most once.
 *
 * The list of fibers, that may complete the async callback, is used to
 * provide better diagnostics.
 *
 * @ets static ets/EffectOps asyncBlockingOn
 */
export function asyncBlockingOn<R, E, A>(
  register: (callback: Cb<Effect<R, E, A>>) => void,
  blockingOn: FiberId,
  __etsTrace?: string
): Effect<R, E, A> {
  return asyncMaybeBlockingOn(
    (cb) => {
      register(cb)
      return O.none
    },
    blockingOn,
    __etsTrace
  )
}
