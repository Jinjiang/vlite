import { Context, Plugin, Request, RequestedFile } from './types.js';
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

export const compileRequest = async (req: Request, context?: Context): Promise<string | Buffer> => {
  const defaultPlugin: Plugin = {
    name: 'default',
    load: context?.defaultLoader,
  }
  const resolvedPlugins = [...plugins, defaultPlugin]
  let content: string | Buffer = ''
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
      query: req.query,
      content,
      binary: typeof content !== 'string'
    }
    if (plugin.transform) {
      const transformedContent = await plugin.transform(tempFile, context)
      if (transformedContent) {
        content = transformedContent
      }
    }
  }

  return content
}
