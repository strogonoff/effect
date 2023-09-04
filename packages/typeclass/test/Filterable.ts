import * as E from "@effect/data/Either"
import { pipe } from "@effect/data/Function"
import * as O from "@effect/data/Option"
import * as OptionInstances from "@effect/typeclass/data/Option"
import * as ReadonlyArrayInstances from "@effect/typeclass/data/ReadonlyArray"
import * as _ from "@effect/typeclass/Filterable"
import * as U from "./util"

describe.concurrent("Filterable", () => {
  it("filterMapComposition", () => {
    const filterMap = _.filterMapComposition(
      ReadonlyArrayInstances.Covariant,
      OptionInstances.Filterable
    )
    const f = (s: string) => s.length > 1 ? O.some(s.length) : O.none()
    U.deepStrictEqual(filterMap([], f), [])
    U.deepStrictEqual(filterMap([O.none()], f), [O.none()])
    U.deepStrictEqual(filterMap([O.some("a")], f), [O.none()])
    U.deepStrictEqual(filterMap([O.some("aa")], f), [O.some(2)])
  })

  it("partitionMapComposition", () => {
    const partitionMap = _.partitionMapComposition(
      ReadonlyArrayInstances.Covariant,
      OptionInstances.Filterable
    )
    const f = (s: string) => s.length > 1 ? E.right(s.length) : E.left(s + "!")
    U.deepStrictEqual(partitionMap([], f), [[], []])
    U.deepStrictEqual(partitionMap([O.none()], f), [[O.none()], [O.none()]])
    U.deepStrictEqual(partitionMap([O.some("a")], f), [[O.some("a!")], [O.none()]])
    U.deepStrictEqual(partitionMap([O.some("aa")], f), [[O.none()], [O.some(2)]])
  })

  it("filter", () => {
    const filter = _.filter(ReadonlyArrayInstances.Filterable)
    const f = filter((n: number) => n > 0)
    U.deepStrictEqual(pipe([], f), [])
    U.deepStrictEqual(pipe([1], f), [1])
    U.deepStrictEqual(pipe([-1], f), [])
    U.deepStrictEqual(pipe([1, -1], f), [1])
  })

  it("partition", () => {
    const partition = _.partition(ReadonlyArrayInstances.Filterable)
    const f = partition((n: number) => n > 0)
    U.deepStrictEqual(pipe([], f), [[], []])
    U.deepStrictEqual(pipe([1], f), [[], [1]])
    U.deepStrictEqual(pipe([-1], f), [[-1], []])
    U.deepStrictEqual(pipe([1, -1], f), [[-1], [1]])
  })

  it("compact", () => {
    const compact = _.compact(ReadonlyArrayInstances.Filterable)
    assert.deepStrictEqual(compact([]), [])
    assert.deepStrictEqual(compact([O.some(1), O.some(2), O.some(3)]), [
      1,
      2,
      3
    ])
    assert.deepStrictEqual(compact([O.some(1), O.none(), O.some(3)]), [
      1,
      3
    ])
  })

  it("separate", () => {
    const separate = _.separate(ReadonlyArrayInstances.Filterable)
    U.deepStrictEqual(pipe([], separate), [[], []])
    U.deepStrictEqual(pipe([E.right(1), E.left("e"), E.right(2)], separate), [
      ["e"],
      [1, 2]
    ])
  })
})