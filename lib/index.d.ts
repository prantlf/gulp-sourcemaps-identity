import { ThroughStream } from 'event-stream'
import File from 'vinyl'

interface FileWithSourceMap extends File {
  sourceMap?: Record<string, unknown>
}

declare type Filter = (file: FileWithSourceMap) => boolean

interface Options {
  filter?: Filter
  verbose?: boolean
}

export function ensureMappings(options?: Options): ThroughStream
