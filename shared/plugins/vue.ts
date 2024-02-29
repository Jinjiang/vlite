import { transform as t } from 'sucrase'
import { compile } from 'vue-simple-compiler';
import { File, Plugin } from '../types.ts';
import { tCss, tScopedCss, parseCssModules } from './css.ts';

const tVueCss = (content: string, classNames?: object, module?: string) => {
  const cssModulesInsertion = module ? `cssModules[${JSON.stringify(module)}] = ${JSON.stringify(classNames || {})};` : ''
  return `
${tCss(content)}
${cssModulesInsertion}
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
      return tVueCss(code, classNames, cssFile.module)
    }
    if (cssFile.scoped) {
      return tVueCss(tScopedCss({
        name: cssFile.filename,
        content: cssFile.code
      }, cssFile.scoped))
    }
    return tVueCss(cssFile.code)
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