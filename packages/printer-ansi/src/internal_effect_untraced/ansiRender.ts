import { dual } from "@effect/data/Function"
import * as List from "@effect/data/List"
import * as Effect from "@effect/io/Effect"
import type * as AnsiDoc from "@effect/printer-ansi/AnsiDoc"
import type * as AnsiStyle from "@effect/printer-ansi/AnsiStyle"
import * as ansiStyle from "@effect/printer-ansi/internal_effect_untraced/ansiStyle"
import type * as DocStream from "@effect/printer/DocStream"
import * as Layout from "@effect/printer/Layout"
import * as PageWidth from "@effect/printer/PageWidth"

// -----------------------------------------------------------------------------
// Rendering Algorithms
// -----------------------------------------------------------------------------

/** @internal */
export const render = (self: DocStream.DocStream<AnsiStyle.AnsiStyle>): string =>
  Effect.runSync(renderSafe(self, List.of(ansiStyle.Monoid.empty)))

const unsafePeek = (stack: List.List<AnsiStyle.AnsiStyle>): AnsiStyle.AnsiStyle => {
  if (List.isNil(stack)) {
    throw new Error(
      "BUG: AnsiRender.unsafePeek - peeked at an empty stack" +
        " - please report an issue at https://github.com/Effect-TS/printer/issues"
    )
  }
  return stack.head
}

const unsafePop = (
  stack: List.List<AnsiStyle.AnsiStyle>
): readonly [AnsiStyle.AnsiStyle, List.List<AnsiStyle.AnsiStyle>] => {
  if (List.isNil(stack)) {
    throw new Error(
      "BUG: AnsiRender.unsafePop - popped from an empty stack" +
        " - please report an issue at https://github.com/Effect-TS/printer/issues"
    )
  }
  return [stack.head, stack.tail]
}

const renderSafe = (
  self: DocStream.DocStream<AnsiStyle.AnsiStyle>,
  stack: List.List<AnsiStyle.AnsiStyle>
): Effect.Effect<never, never, string> => {
  switch (self._tag) {
    case "FailedStream": {
      return Effect.dieMessage(
        "BUG: AnsiRender.renderSafe - attempted to render a failed doc stream" +
          " - please report an issue at https://github.com/Effect-TS/printer/issues"
      )
    }
    case "EmptyStream": {
      return Effect.succeed("")
    }
    case "CharStream": {
      return Effect.map(
        Effect.suspendSucceed(() => renderSafe(self.stream, stack)),
        (rest) => self.char + rest
      )
    }
    case "TextStream": {
      return Effect.map(
        Effect.suspendSucceed(() => renderSafe(self.stream, stack)),
        (rest) => self.text + rest
      )
    }
    case "LineStream": {
      let indent = "\n"
      for (let i = 0; i < self.indentation; i++) {
        indent = indent += " "
      }
      return Effect.map(
        Effect.suspendSucceed(() => renderSafe(self.stream, stack)),
        (rest) => indent + rest
      )
    }
    case "PushAnnotationStream": {
      const currentStyle = unsafePeek(stack)
      const nextStyle = ansiStyle.Monoid.combine(self.annotation, currentStyle)
      return Effect.map(
        Effect.suspendSucceed(() => renderSafe(self.stream, List.cons(self.annotation, stack))),
        (rest) => ansiStyle.stringify(nextStyle) + rest
      )
    }
    case "PopAnnotationStream": {
      const [, styles] = unsafePop(stack)
      const nextStyle = unsafePeek(styles)
      return Effect.map(
        Effect.suspendSucceed(() => renderSafe(self.stream, styles)),
        (rest) => ansiStyle.stringify(nextStyle) + rest
      )
    }
  }
}

/** @internal */
export const compact = (self: AnsiDoc.AnsiDoc): string => render(Layout.compact(self))

/** @internal */
export const pretty = dual<
  (options: Partial<Omit<PageWidth.AvailablePerLine, "_tag">>) => (self: AnsiDoc.AnsiDoc) => string,
  (self: AnsiDoc.AnsiDoc, options: Partial<Omit<PageWidth.AvailablePerLine, "_tag">>) => string
>(2, (self, options) => {
  const width = Object.assign({}, PageWidth.defaultPageWidth, options)
  const layoutOptions = Layout.options(width)
  return render(Layout.pretty(self, layoutOptions))
})

/** @internal */
export const prettyDefault = (self: AnsiDoc.AnsiDoc): string => render(Layout.pretty(self, Layout.defaultOptions))

/** @internal */
export const prettyUnbounded = (self: AnsiDoc.AnsiDoc): string =>
  render(Layout.pretty(self, Layout.options(PageWidth.unbounded)))

/** @internal */
export const smart = dual<
  (options: Partial<Omit<PageWidth.AvailablePerLine, "_tag">>) => (self: AnsiDoc.AnsiDoc) => string,
  (self: AnsiDoc.AnsiDoc, options: Partial<Omit<PageWidth.AvailablePerLine, "_tag">>) => string
>(2, (self, options) => {
  const width = Object.assign({}, PageWidth.defaultPageWidth, options)
  const layoutOptions = Layout.options(width)
  return render(Layout.smart(self, layoutOptions))
})

/** @internal */
export const smartDefault = (self: AnsiDoc.AnsiDoc): string => render(Layout.smart(self, Layout.defaultOptions))

/** @internal */
export const smartUnbounded = (self: AnsiDoc.AnsiDoc): string =>
  render(Layout.smart(self, Layout.options(PageWidth.unbounded)))