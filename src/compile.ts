import { Context, File, Plugin } from './types.js';
import typescript from './plugins/typescript.js';
import css from './plugins/css.js';
import vue from './plugins/vue.js';
import esm from './plugins/esm.js';
import assets from './plugins/assets.js';
import { createLogger } from './utils.js';

const plugins: Plugin[] = [
  typescript(),
  css(),
  vue(),
  esm(),
  assets(),
];

export const compileFile = async (file: File, context?: Context): Promise<File> => {
  const logger = createLogger('main', 'blue', context)
  logger.log('[start]', file.name)
  logger.log(file.content)
  let currentFile: File = file
  const defaultPlugin: Plugin = {
    name: 'default',
    resolveId: context?.defaultResolver,
    load: context?.defaultLoader,
  }
  for await (const plugin of [defaultPlugin, ...plugins]) {
    if (plugin.resolveId) {
      const resolvedId = await plugin.resolveId(currentFile.name, context)
      logger.log('[resolvedId]', currentFile.name)
      logger.log(resolvedId)
      if (resolvedId) {
        const loadedContent = plugin.load && await plugin.load(resolvedId, context) || currentFile.content
        logger.log('[load]', resolvedId)
        logger.log(loadedContent)
        const tempFile: File = {
          name: resolvedId,
          content: loadedContent,
          binary: typeof loadedContent !== 'string'
        }
        currentFile = plugin.transform && await plugin.transform(tempFile, context) || tempFile
        logger.log('[transform]', currentFile.name)
        logger.log(currentFile.content)
      }
    }
  }
  logger.log('[done]', currentFile.name)
  logger.log(currentFile.content)
  return currentFile
}
