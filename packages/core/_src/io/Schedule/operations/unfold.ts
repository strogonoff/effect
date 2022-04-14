import { Decision } from "@effect/core/io/Schedule/Decision";
import { Interval } from "@effect/core/io/Schedule/Interval";
import { makeWithState } from "@effect/core/io/Schedule/operations/_internal/makeWithState";

/**
 * Unfolds a schedule that repeats one time from the specified state and
 * iterator.
 *
 * @tsplus static ets/Schedule/Ops unfold
 */
export function unfold<A>(
  initial: A,
  f: (a: A) => A
): Schedule<A, unknown, unknown, A> {
  return makeWithState(
    initial,
    (now, _, state) => Effect.succeed(Tuple(f(state), state, Decision.Continue(Interval.after(now))))
  );
}