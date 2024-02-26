import crypto from 'crypto';
import { File, Plugin } from './types';
import typescript from './plugins/typescript';
import css from './plugins/css';

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
];

const arraify = <T>(value: T | T[]): T[] => Array.isArray(value) ? value : [value]

export const compile = async (files: File[]): Promise<File[]> => {
  const compiledFiles: File[] = []
  await Promise.all(files.map(async (file) => {
    const plugin = plugins.find(plugin => plugin.resolveId && plugin.resolveId(file.name))
    if (plugin) {
      const resolvedId = await plugin.resolveId!(file.name)
      if (!resolvedId) {
        return
      }
      const loadedContent = plugin.load && await plugin.load(resolvedId) || file.content
      const transformedResult = plugin.transform && await plugin.transform({ name: resolvedId, content: loadedContent }) || file
      if (transformedResult) {
        arraify(transformedResult).forEach(compiledFile => {
          compiledFiles.push(compiledFile)
        })
      }
    } else {
      compiledFiles.push(file)
    }
  }))
  return compiledFiles;
}

// ESM

export const install = async (name: string, version: string): Promise<void> => {
  // TODO:
  name
  version
}
