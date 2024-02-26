import { transform as t } from 'sucrase'
import { File, Plugin } from '../types';

const resolvedId = (id: string) => {
  if (id.endsWith('.ts') || id.endsWith('.tsx')) {
    return id;
  }
}

const transform = (file: File) => {
  return {
    name: file.name.replace(/\.tsx?$/, '.js'),
    content: t(file.content, { transforms: ["typescript", "imports"] }).code
  }
}

export default (): Plugin => {
  return {
    name: 'typescript',
    resolveId: resolvedId,
    transform: transform
  }
}