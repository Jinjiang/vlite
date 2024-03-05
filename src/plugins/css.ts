import postcss from 'postcss';
import modules from 'postcss-modules';
import { compileStyle } from 'vue/compiler-sfc';
import { File, Plugin, Transformer } from '../types.js';

export const tScopedCss = (file: File, id: string): string => {
  const result = compileStyle({
    source: file.content as string,
    filename: file.name,
    id: `data-v-${id}`,
    scoped: true,
  })
  return result.code
}

export const parseCssModules = async (file: File) => {
  let classNames: object | undefined
  const result = await postcss(
    [modules({ getJSON: (_, json) => {
      classNames = json
    } })]
  ).process(
    file.content, { from: file.name }
  )
  return {
    code: result.css,
    classNames
  }
}

export const tCss = (content: string): string => {
  return `
{
  const style = document.createElement('style');
  style.innerHTML = ${JSON.stringify(content)};
  document.head.appendChild(style);
};
`.trim()
}

const t = (content: string, classNames?: object) => {
  const cssModulesInsertion = classNames ? `export default ${JSON.stringify(classNames)};` : ''
  return `
${tCss(content)}
${cssModulesInsertion}
`.trim()
}

const transform: Transformer = async (file) => {
  const { name, query, content } = file

  if (!name.endsWith('.css')) {
    return
  }

  if (typeof content !== 'string') {
    return
  }

  // scoped css or css modules
  const scopedId = typeof query.scoped === 'string' ? query.scoped : query.id as string
  let code = query.scoped ? tScopedCss(file, scopedId) : content as string
  let classNames
  if (name.endsWith('.module.css') || query.module) {
    const result = await parseCssModules(file)
    code = result.code
    classNames = result.classNames
  }

  return t(code, classNames)
}

export default (): Plugin => {
  return {
    name: 'css',
    transform: transform
  }
}