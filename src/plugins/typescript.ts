import { transform as t } from 'sucrase'
import { File, Plugin } from '../types.js';

const resolvedId = (id: string) => {
  if (id.endsWith('.ts') || id.endsWith('.tsx')) {
    return id;
  }
}

const transform = (file: File) => {
  if (typeof file.content !== 'string') {
    return
  }
  return {
    name: file.name.replace(/\.tsx?$/, '.mjs'),
    content: t(file.content, { transforms: ["typescript", "jsx"] }).code
  }
}

export default (): Plugin => {
  return {
    name: 'typescript',
    resolveId: resolvedId,
    transform: transform
  }
}