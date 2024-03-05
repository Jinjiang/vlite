import { transform as t } from 'sucrase'
import { Plugin, Transformer } from '../types.js';

const transform: Transformer = (file) => {
  const { name, content } = file

  if (!name.endsWith('.ts') && !name.endsWith('.tsx')) {
    return
  }

  if (typeof content !== 'string') {
    return
  }

  return t(content, { transforms: ["typescript", "jsx"] }).code
}

export default (): Plugin => {
  return {
    name: 'typescript',
    transform: transform
  }
}
