import postcss from 'postcss';
import modules from 'postcss-modules';
import { compileStyle } from 'vue/compiler-sfc';
import { File, Plugin } from '../types.ts';
import { getQuery, removeQuery } from '../utils.ts';

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
}
`.trim()
}

const t = (content: string, classNames?: object) => {
  const cssModulesInsertion = classNames ? `cssModules = ${JSON.stringify(classNames)};` : ''
  return `
${tCss(content)}
${cssModulesInsertion}
`.trim()
}

const resolvedId = (id: string) => {
  if (id.endsWith('.css')) {
    return id;
  }
}

const transform = async (file: File) => {
  if (typeof file.content !== 'string') {
    return
  }
  const query = getQuery(file.name)
  const scopedId = typeof query.scoped === 'string' ? query.scoped : query.id as string
  const name = removeQuery(file.name)
  let content = query.scoped ? tScopedCss(file, scopedId) : file.content
  let classNames
  if (name.endsWith('.module.css') || query.module) {
    const result = await parseCssModules(file)
    content = result.code
    classNames = result.classNames
  }
  return {
    name: `${name}.mjs`,
    content: t(content, classNames)
  }
}

export default (): Plugin => {
  return {
    name: 'css',
    resolveId: resolvedId,
    transform: transform
  }
}