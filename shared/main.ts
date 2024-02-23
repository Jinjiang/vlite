import crypto from 'crypto';

export const shared = 'shared';

type File = {
  name: string;
  content: string;
};

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

export const compile = (files: File[]): File[] => {
  // TODO:

  return files;
}

// ESM

export const install = async (name: string, version: string): Promise<void> => {
  // TODO:
  name
  version
}
