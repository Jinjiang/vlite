import { transform as t } from 'sucrase'
import { compile } from 'vue-simple-compiler';
import { File, Plugin } from '../types';

// TODO: CSS Modules, scoped CSS, preprocessors

const tCss = (content: string) => {
  return `
const style = document.createElement('style');
style.innerHTML = ${JSON.stringify(content)};
document.head.appendChild(style);
`.trim()
}

const resolvedId = (id: string) => {
  if (id.endsWith('.vue')) {
    return id;
  }
}

const transform = async (file: File) => {
  const compiled = compile(file.content, {
    filename: file.name,
    tsTransform: (src) => {
      return {
        code: t(src, { transforms: ["typescript"] }).code
      }
    }
  })
  const compiledCss = compiled.css.map(cssFile => tCss(cssFile.code))
  return {
    name: `${file.name}.mjs`,
    content: `${compiled.js.code}\n${compiledCss.join('\n')}`
  }
}

export default (): Plugin => {
  return {
    name: 'vue',
    resolveId: resolvedId,
    transform: transform
  }
}