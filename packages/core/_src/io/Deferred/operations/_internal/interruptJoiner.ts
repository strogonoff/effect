import { concreteDeferred } from "@effect/core/io/Deferred/operations/_internal/DeferredInternal";
import { DeferredState } from "@effect/core/io/Deferred/operations/_internal/DeferredState";

export function interruptJoiner<E, A>(
  self: Deferred<E, A>,
  joiner: (a: IO<E, A>) => void,
  __tsplusTrace?: string
): Canceler<unknown> {
  return Effect.succeed(() => {
    concreteDeferred(self);
    const state = self.state.get;
    if (state._tag === "Pending") {
      self.state.set(DeferredState.pending(state.joiners.filter((j) => j !== joiner)));
    }
  });
}