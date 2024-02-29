import { File, Plugin } from '../types.ts';
import { getQuery } from '../utils.ts';

export default (): Plugin => {
  return {
    name: 'asset',
    resolveId: (id: string) => {
      const query = getQuery(id)
      if (query.url) {
        return id
      }
    },
    transform: async (file: File) => {
      return {
        name: file.name,
        content: `export default ${JSON.stringify(file.name.split('?')[0])};`
      }
    }
  }
}
