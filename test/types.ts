import { ensureMappings, FileWithSourceMap } from 'gulp-sourcemaps-identity'
import { ThroughStream } from 'event-stream'

let _result: ThroughStream
_result = ensureMappings()
_result = ensureMappings({})
_result = ensureMappings({ verbose: true })
_result = ensureMappings({
  filter(_file: FileWithSourceMap): boolean {
    return true
  }
})
