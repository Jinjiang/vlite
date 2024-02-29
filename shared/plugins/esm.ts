import parseImports, { Import } from 'parse-imports'
import { File, BuildFile, Plugin, Context } from '../types.ts';
import { createLogger, codeExtNamesRegExp, getExtName, setQuery } from '../utils.ts';

const replaceImport = (content: string, $import: Import, resolved: string): string => {
  const { startIndex, endIndex, moduleSpecifier: { code: specifier } } = $import
  const before = content.slice(0, startIndex)
  const importStatement = content.slice(startIndex, endIndex)
  const after = content.slice(endIndex)
  return `${before}${importStatement.replace(specifier, JSON.stringify(resolved))}${after}`
}

const resolveId = (id: string) => {
  const extName = getExtName(id)
  if (extName.match(codeExtNamesRegExp)) {
    return id
  }
}

const transform = async (file: File, context?: Context) => {
  if (typeof file.content !== 'string') {
    return
  }
  const logger = createLogger('compileFile', context)
  logger.log('[esm]', file.name)
  const result: BuildFile = {
    name: file.name,
    content: file.content
  }
  const imports = [...(await parseImports(file.content))]
  imports.reverse().forEach($import => {
    const { moduleSpecifier } = $import
    if (moduleSpecifier.value) {
      if (moduleSpecifier.type === 'package') {
        const resolved = `https://esm.sh/${moduleSpecifier.value}`
        result.content = replaceImport(result.content as string, $import, resolved)
      }
      if (!getExtName(moduleSpecifier.value).match(codeExtNamesRegExp)) {
        const resolved = setQuery(moduleSpecifier.value, { url: true })
        result.content = replaceImport(result.content as string, $import, resolved)
      }
    }
  })
  logger.log(result.content)
  return result
}

export default (): Plugin => {
  return {
    name: 'esm',
    resolveId: resolveId,
    transform: transform
  }
}
