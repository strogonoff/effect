/**
 * @since 1.0.0
 */

import type { Arbitrary } from "@fp-ts/codec/Arbitrary"
import * as DE from "@fp-ts/codec/DecodeError"
import type { Decoder } from "@fp-ts/codec/Decoder"
import type { Guard } from "@fp-ts/codec/Guard"
import * as I from "@fp-ts/codec/internal/common"
import * as P from "@fp-ts/codec/Provider"
import type { Schema } from "@fp-ts/codec/Schema"
import type { Show } from "@fp-ts/codec/Show"
import { pipe } from "@fp-ts/data/Function"
import * as O from "@fp-ts/data/Option"

/**
 * @since 1.0.0
 */
export const id = Symbol.for("@fp-ts/codec/data/max")

const guard = (max: number) =>
  <A extends number>(self: Guard<A>): Guard<A> =>
    I.makeGuard(schema(max)(self), (u): u is A => self.is(u) && u <= max)

const decoder = (max: number) =>
  <I, A extends number>(self: Decoder<I, A>): Decoder<I, A> =>
    I.makeDecoder(
      schema(max)(self),
      (i) => pipe(self.decode(i), I.flatMap((a) => a <= max ? I.succeed(a) : I.fail(DE.max(max))))
    )

const arbitrary = (max: number) =>
  <A extends number>(self: Arbitrary<A>): Arbitrary<A> =>
    I.makeArbitrary(schema(max)(self), (fc) => self.arbitrary(fc).filter((a) => a <= max))

const show = (max: number) =>
  <A extends number>(self: Show<A>): Show<A> => I.makeShow(schema(max)(self), (a) => self.show(a))

/**
 * @since 1.0.0
 */
export const Provider: P.Provider = P.make(id, {
  [I.ArbitraryId]: arbitrary,
  [I.DecoderId]: decoder,
  [I.GuardId]: guard,
  [I.JsonDecoderId]: decoder,
  [I.ShowId]: show
})

/**
 * @since 1.0.0
 */
export const schema = (max: number) =>
  <A extends number>(self: Schema<A>): Schema<A> => I.declareSchema(id, O.some(max), Provider, self)