import * as Chunk from "@effect/data/Chunk"
import { pipe } from "@effect/data/Function"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as FiberRef from "@effect/io/FiberRef"
import * as NodeStream from "@effect/platform-node/Stream"
import * as FileSystem from "@effect/platform/FileSystem"
import * as FormData from "@effect/platform/Http/FormData"
import * as Path from "@effect/platform/Path"
import * as Stream from "@effect/stream/Stream"
import Busboy from "busboy"
import * as NodeFs from "node:fs"
import type * as Http from "node:http"
import type { Readable } from "node:stream"
import * as NodeStreamP from "node:stream/promises"

export const fromRequest = (
  source: Http.IncomingMessage
): Stream.Stream<never, FormData.FormDataError, FormData.Part> =>
  pipe(
    Effect.Do,
    Effect.bind("fieldMimeTypes", () => FiberRef.get(FormData.fieldMimeTypes)),
    Effect.bind("maxFieldSize", () => FiberRef.get(FormData.maxFieldSize)),
    Effect.bind("maxFileSize", () => FiberRef.get(FormData.maxFileSize)),
    Effect.bind("busboy", ({ maxFieldSize, maxFileSize }) =>
      Effect.acquireRelease(
        Effect.sync(
          () =>
            Busboy({
              headers: source.headers,
              limits: {
                fieldSize: Number(maxFieldSize),
                fileSize: Option.getOrUndefined(Option.map(maxFileSize, Number))
              }
            })
        ),
        (busboy) =>
          Effect.sync(() => {
            busboy.removeAllListeners()
            if (!busboy.closed) {
              busboy.destroy()
            }
          })
      )),
    Effect.map(({ busboy, fieldMimeTypes }) =>
      Stream.mapEffect(
        Stream.async<never, FormData.FormDataError, FieldImpl | FileImpl>((emit) => {
          busboy.on("field", (name, value, info) => {
            if (info.valueTruncated) {
              emit.fail(FormData.FormDataError("FieldTooLarge", new Error("maxFieldSize exceeded")))
            } else {
              emit.single(new FieldImpl(name, info.mimeType, value))
            }
          })

          busboy.on("file", (name, stream, info) => {
            stream.once("limit", () => {
              emit.fail(FormData.FormDataError("FileTooLarge", new Error("maxFileSize exceeded")))
            })
            emit.single(
              new FileImpl(
                name,
                info.filename,
                info.mimeType,
                NodeStream.fromReadable(() => stream, (error) => FormData.FormDataError("InternalError", error)),
                stream
              )
            )
          })

          busboy.on("error", (_) => {
            emit.fail(FormData.FormDataError("InternalError", _))
          })

          busboy.on("finish", () => {
            emit.end()
          })

          source.pipe(busboy)
        }),
        (part) =>
          part._tag === "File" && Chunk.some(fieldMimeTypes, (_) => part.contentType.includes(_)) ?
            Effect.map(
              NodeStream.toString({
                readable: () => part.source,
                onFailure: (error) => FormData.FormDataError("InternalError", error)
              }),
              (content) => new FieldImpl(part.key, part.contentType, content)
            )
            : Effect.succeed(part)
      )
    ),
    Stream.unwrapScoped
  )

class FieldImpl implements FormData.Field {
  readonly [FormData.TypeId]: FormData.TypeId
  readonly _tag = "Field"
  constructor(
    readonly key: string,
    readonly contentType: string,
    readonly value: string
  ) {
    this[FormData.TypeId] = FormData.TypeId
  }
}

class FileImpl implements FormData.File {
  readonly [FormData.TypeId]: FormData.TypeId
  readonly _tag = "File"
  constructor(
    readonly key: string,
    readonly name: string,
    readonly contentType: string,
    readonly content: Stream.Stream<never, FormData.FormDataError, Uint8Array>,
    readonly source: Readable
  ) {
    this[FormData.TypeId] = FormData.TypeId
  }
}

/** @internal */
export const formData = (
  source: Http.IncomingMessage
) =>
  Effect.flatMap(
    Effect.all([
      Effect.mapError(
        Effect.flatMap(FileSystem.FileSystem, (_) => _.makeTempDirectoryScoped()),
        (error) => FormData.FormDataError("InternalError", error)
      ),
      Path.Path
    ]),
    ([dir, path_]) =>
      Stream.runFoldEffect(
        fromRequest(source),
        new globalThis.FormData(),
        (formData, part) => {
          if (part._tag === "Field") {
            formData.append(part.key, part.value)
            return Effect.succeed(formData)
          }
          const file = part as FileImpl
          const path = path_.join(dir, file.name)
          formData.append(part.key, new Blob([], { type: file.contentType }), path)
          return Effect.as(
            Effect.tryPromise({
              try: (signal) =>
                NodeStreamP.pipeline(file.source, NodeFs.createWriteStream(path), {
                  signal
                }),
              catch: (error) => FormData.FormDataError("InternalError", error)
            }),
            formData
          )
        }
      )
  )