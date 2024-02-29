import { transform as t } from 'sucrase'
import { compile } from 'vue-simple-compiler';
import postcss from 'postcss';
import modules from 'postcss-modules';
import { compileStyle } from 'vue/compiler-sfc';
import { File, Plugin } from '../types.ts';

const parseCssModules = async (file: File) => {
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

const tCss = (content: string, classNames?: object, module?: string) => {
  const cssModulesInsertion = module ? `cssModules[${JSON.stringify(module)}] = ${JSON.stringify(classNames || {})};` : ''
  return `
{
  const style = document.createElement('style');
  style.innerHTML = ${JSON.stringify(content)};
  document.head.appendChild(style);
  ${cssModulesInsertion}
}
`.trim()
}

const resolvedId = (id: string) => {
  if (id.endsWith('.vue')) {
    return id;
  }
}

const transform = async (file: File) => {
  if (typeof file.content !== 'string') {
    return
  }
  const compiled = compile(file.content, {
    filename: file.name,
    tsTransform: (src) => {
      return {
        code: t(src, { transforms: ["typescript"] }).code
      }
    }
  })
  const compiledCss = await Promise.all(compiled.css.map(async cssFile => {
    if (cssFile.module) {
      const { code, classNames } = await parseCssModules({
        name: cssFile.filename,
        content: cssFile.code
      })
      return tCss(code, classNames, cssFile.module)
    }
    if (cssFile.scoped) {
      const result = compileStyle({
        source: cssFile.code,
        filename: cssFile.filename,
        id: `data-v-${cssFile.scoped}`,
        scoped: true,
      })
      return tCss(result.code)
    }
    return tCss(cssFile.code)
  }))
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