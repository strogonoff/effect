/**
 * @since 1.0.0
 */
import type * as A from "@fp-ts/codec/Arbitrary"
import * as DE from "@fp-ts/codec/DecodeError"
import type * as D from "@fp-ts/codec/Decoder"
import type * as E from "@fp-ts/codec/Encoder"
import type * as G from "@fp-ts/codec/Guard"
import * as I from "@fp-ts/codec/internal/common"
import * as P from "@fp-ts/codec/Provider"
import type * as S from "@fp-ts/codec/Schema"
import type * as Sh from "@fp-ts/codec/Show"
import { identity } from "@fp-ts/data/Function"
import * as O from "@fp-ts/data/Option"

/**
 * @since 1.0.0
 */
export const id = Symbol.for("@fp-ts/codec/data/any")

/**
 * @since 1.0.0
 */
export const Provider: P.Provider = P.make(id, {
  [I.GuardId]: () => Guard,
  [I.ArbitraryId]: () => Arbitrary,
  [I.DecoderId]: () => Decoder,
  [I.JsonDecoderId]: () => Decoder,
  [I.EncoderId]: () => Encoder,
  [I.ShowId]: () => Show
})

/**
 * @since 1.0.0
 */
export const Schema: S.Schema<any> = I.declareSchema(id, O.none, Provider)

const Guard: G.Guard<any> = I.makeGuard(Schema, (_u): _u is any => true)

const Decoder: D.Decoder<unknown, any> = I.fromGuard(
  Guard,
  (u) => DE.notType("any", u)
)

const Encoder: E.Encoder<unknown, any> = I.makeEncoder(Schema, identity)

const Arbitrary: A.Arbitrary<any> = I.makeArbitrary(Schema, (fc) => fc.anything())

const Show: Sh.Show<any> = I.makeShow(Schema, () => "<any>")