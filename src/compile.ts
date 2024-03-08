import { Context, Plugin, Query, Request, RequestedFile } from './types.js';
import typescript from './plugins/typescript.js';
import css from './plugins/css.js';
import vue from './plugins/vue.js';
import esm from './plugins/esm.js';
import assets from './plugins/assets.js';

const plugins: Plugin[] = [
  typescript(),
  css(),
  vue(),
  esm(),
  assets(),
];

export const compileRequest = async (req: Request, context?: Context): Promise<RequestedFile> => {
  const defaultPlugin: Plugin = {
    name: 'default',
    load: context?.defaultLoader,
  }
  const resolvedPlugins = [...plugins, defaultPlugin]
  let content: string | Buffer = ''
  let query: Query = req.query
  for await (const plugin of resolvedPlugins) {
    if (plugin.load) {
      const loadedContent = await plugin.load(req, context)
      if (typeof loadedContent === 'string' || Buffer.isBuffer(loadedContent)) {
        content = loadedContent
        break
      }
    }
  }

  for await (const plugin of resolvedPlugins) {
    const tempFile: RequestedFile = {
      name: req.name,
      query,
      content,
    }
    if (plugin.transform) {
      const transformedFile = await plugin.transform(tempFile, context)
      if (transformedFile) {
        content = transformedFile.content
        query = transformedFile.query
      }
    }
  }

  return {
    name: req.name,
    content,
    query,
  }
}
