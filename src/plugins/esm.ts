import parseImports, { Import } from 'parse-imports'
import { File, Plugin, Context, Transformer } from '../types.js';
import { createLogger, codeExtNamesRegExp, getExtName, setQuery } from '../utils.js';

const replaceImport = (content: string, $import: Import, resolved: string): string => {
  const { startIndex, endIndex, moduleSpecifier: { code: specifier } } = $import
  const before = content.slice(0, startIndex)
  const importStatement = content.slice(startIndex, endIndex)
  const after = content.slice(endIndex)
  return `${before}${importStatement.replace(specifier, JSON.stringify(resolved))}${after}`
}

const transform: Transformer = async (file, context?: Context) => {
  const { name, content } = file
  const extName = getExtName(name)

  if (!extName.match(codeExtNamesRegExp)) {
    return
  }

  if (typeof content !== 'string') {
    return
  }

  const logger = createLogger('esm', 'green', context)
  logger.log('[transform]', name)

  const result: File = {
    name,
    content
  }

  // process package imports: reverse order to replace with esm.sh from bottom to top
  const imports = [...(await parseImports(content))]
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
  return result.content
}

export default (): Plugin => {
  return {
    name: 'esm',
    transform: transform
  }
}
