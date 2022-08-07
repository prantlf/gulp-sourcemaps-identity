import eventStream from 'event-stream'
import log from 'fancy-log'
import { tokenizer } from 'acorn'
import { SourceMapConsumer, SourceMapGenerator } from 'source-map'

const { through } = eventStream

function parseMap(map, file, verbose) {
  let parsedMap
  if (map) {
  	if (typeof map === 'string') {
  		try {
  			parsedMap = JSON.parse(map)
  		} catch (err) {
  		  log.warn(file, 'contains invalid source map:', err.message)
  		}
  	} else {
  		parsedMap = map
  	}
    verbose && log(file, `contains ${parsedMap.mappings ? '' : 'no '}mappings`)
  } else {
    verbose && log(file, 'contains no source map')
  }
  return parsedMap
}

function addMappings(source, map, file) {
  for (const token of tokenizer(source, {
      ecmaVersion: 'latest', allowHashBang: true, locations: true
    })) {
    const { start } = token.loc
    const mapping = { source: file, original: start, generated: start }
    if (token.type.label === 'name') {
      mapping.name = token.value
    }
    map.addMapping(mapping)
  }
}

function completeMap(source, map, file) {
  return SourceMapConsumer.with(map, null, consumer => {
    const map = SourceMapGenerator.fromSourceMap(consumer)
    addMappings(source, map, file)
    return map
  })
}

export function ensureMappings(options = {}) {
  const promises = []
	return through(function (file) {
    const { contents, sourceMap, relative } = file
		if (!file.isBuffer()) {
			this.emit('error', `reading ${relative} failed`)
			return
		}

    const { filter, verbose } = options
    if (filter && !filter(file)) {
      this.queue(file)
      return
    }

    const parsedMap = parseMap(sourceMap, relative, verbose)
    if (!parsedMap || parsedMap.mappings) {
      this.queue(file)
      return
    }

    promises.push(completeMap(contents.toString('utf8'), parsedMap, relative)
      .then(map => {
        file.sourceMap = map.toJSON()
        this.queue(file)
      })
      .catch(err => {
        log.warn('parsing', relative, 'failed:', err.message)
        this.queue(file)
      }))
	}, function () {
		Promise
      .all(promises)
			.then(() => this.queue(null))
	})
}
