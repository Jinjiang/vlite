import crypto from 'crypto';
import { Context, File, Plugin } from './types.ts';
import typescript from './plugins/typescript.ts';
import css from './plugins/css.ts';
// import esmSh from './plugins/esm-sh.ts';

export const shared = 'shared';

// SFC <-> BFS
// - `\x00\x00<filename1>\x00<content1>\x00\x00<filename2>\x00<content2>\x00\x00...`
// - filenames should be sorted before calculating hash
// - binary files (later)

const sortFiles = (files: File[]): File[] => {
  return files.sort((a, b) => a.name < b.name ? -1 : 1)
}

export const extract = (content: string): {
  files: File[]
  hash: string
  content: string
} => {
  const files = content.split('\x00\x00').map(item => {
    const [filename, itemContent] = item.split('\x00')
    if (filename && itemContent) {
      return { name: filename, content: itemContent }
    }
  }).filter(Boolean) as File[]

  const normalizedContent = compress(files)

  const hash = crypto.createHash('sha256').update(normalizedContent).digest('hex')

  return {
    files,
    hash,
    content: normalizedContent
  };
};

export const compress = (files: File[], skipSorting?: boolean): string => {
  if (!skipSorting) {
    sortFiles(files)
  }
  return files.map(file => `${file.name}\x00${file.content}`).join('\x00\x00');
}

// BFS -> ESM
// - ts/jsx -> tsc
// - css/less (later)/sass (later)/css modules -> dom insert & export class names
// - assets (later) -> binary & export url

const plugins: Plugin[] = [
  typescript(),
  css(),
  // esmSh(),
];

export const compileFile = async (file: File, context?: Context): Promise<File> => {
  let currentFile = file
  console.log('[compileFile]', currentFile.name)
  for await (const plugin of plugins) {
    if (plugin.resolveId) {
      const resolvedId = await plugin.resolveId(currentFile.name, context)
      console.log('[resolvedId]', resolvedId)
      if (resolvedId) {
        const loadedContent = plugin.load && await plugin.load(resolvedId, context) || currentFile.content
        currentFile = plugin.transform && await plugin.transform({ name: resolvedId, content: loadedContent }, context) || currentFile
        console.log('[transform]', currentFile.name)
        console.log(currentFile.content)
      }
    }
  }
  console.log('[compileFile]', currentFile.name, 'done')
  console.log(currentFile.content)
  return currentFile
}

export const compile = async (files: File[], context?: Context): Promise<File[]> => {
  const compiledFiles: File[] = []
  await Promise.all(files.map(async (file): Promise<void> => {
    compiledFiles.push(await compileFile(file, context))
  }))
  return compiledFiles;
}

// ESM

export const install = async (name: string, version: string): Promise<void> => {
  // TODO:
  name
  version
}
