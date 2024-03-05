import { Plugin } from '../types.js';

export default (): Plugin => {
  return {
    name: 'asset',
    transform: async (file) => {
      if (!file.query.url) {
        return
      }
      return `export default ${JSON.stringify(file.name.split('?')[0])};`
    }
  }
}
