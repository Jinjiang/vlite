import { File, Plugin } from '../types';

const SETUP_PATH = '/__import-map-setup'

const IMPORT_MAP = {
  react: 'https://esm.sh/react',
  'react-dom': 'https://esm.sh/react-dom',
  'react-router-dom': 'https://esm.sh/react-router-dom',
  vue: 'https://esm.sh/vue',
  pinia: 'https://esm.sh/pinia',
  'vue-router': 'https://esm.sh/vue-router',
  '@vueuse/core': 'https://esm.sh/@vueuse/core',
}

const genImportMapCode = (importMap: object) => {
  return `
const im = document.createElement('script');
im.type = 'importmap';
im.textContent = ${JSON.stringify(importMap)};
document.currentScript.after(im);
`.trim()
}

const t = (content: string) => {
  return `
import '${SETUP_PATH}'
${content}
`.trim()
}

const resolvedId = (id: string) => {
  return id
}

const transform = (file: File) => {
  if (file.name === SETUP_PATH) {
    return {
      name: file.name,
      content: genImportMapCode(IMPORT_MAP)
    }
  }
  return {
    name: file.name,
    content: t(file.content)
  }
}

export default (): Plugin => {
  return {
    name: 'esm-sh',
    resolveId: resolvedId,
    transform: transform
  }
}