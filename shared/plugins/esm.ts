import parseImports, { Import } from 'parse-imports'
import { File, BuildFile, Plugin, Context } from '../types.ts';
import { createLogger } from '../utils.ts';

const replaceImport = (content: string, $import: Import, resolved: string): string => {
  const { startIndex, endIndex, moduleSpecifier: { code: specifier } } = $import
  const before = content.slice(0, startIndex)
  const importStatement = content.slice(startIndex, endIndex)
  const after = content.slice(endIndex)
  return `${before}${importStatement.replace(specifier, JSON.stringify(resolved))}${after}`
}

export default (): Plugin => {
  return {
    name: 'esm',
    resolveId: (id: string) => {
      if (id.match(/\.(js|mjs|ts|tsx|jsx|css|vue)(\?.*)?$/)) {
        return id
      }
    },
    transform: async (file: File, context?: Context) => {
      const logger = createLogger('compileFile', context)
      logger.log('[esm]', file.name)
      const result: BuildFile = {
        name: file.name,
        content: file.content
      }
      const imports = [...(await parseImports(file.content))]
      imports.reverse().forEach($import => {
        const { moduleSpecifier } = $import
        if (moduleSpecifier.type === 'package') {
          const resolved = `https://esm.sh/${moduleSpecifier.value}`
          result.content = replaceImport(result.content, $import, resolved)
        }
      })
      logger.log(result.content)
      return result
    }
  }
}
