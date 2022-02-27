import { Option } from "../../../data/Option"
import type { Fiber } from "../../Fiber"
import { Scope } from "../../Scope"
import type { RIO } from "../definition"
import { Effect, IFork } from "../definition"

/**
 * Forks the effect into a new fiber attached to the global scope. Because the
 * new fiber is attached to the global scope, when the fiber executing the
 * returned effect terminates, the forked fiber will continue running.
 *
 * @tsplus fluent ets/Effect forkDaemon
 */
export function forkDaemon<R, E, A>(
  self: Effect<R, E, A>,
  __tsplusTrace?: string
): RIO<R, Fiber.Runtime<E, A>> {
  return Effect.suspendSucceed(
    new IFork(self, () => Option.some(Scope.global.value), __tsplusTrace)
  )
}