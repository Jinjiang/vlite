import { transform as t } from 'sucrase'
import { compile } from 'vue-simple-compiler';
import { Plugin, Transformer } from '../types.js';
import { tCss, tScopedCss, parseCssModules } from './css.js';

const genCssModuleAssignment = (module: string, value: string) => {
  const moduleString = JSON.stringify(module)
  return `cssModules[${moduleString}] = ${value};`
}

const tVueCss = (content: string, classNames?: object, module?: string) => {
  const cssModulesInsertion = module ? genCssModuleAssignment(module, JSON.stringify(classNames || {})) : ''
  return `
${tCss(content)}
${cssModulesInsertion}
`.trim()
}

const transform: Transformer = async (file) => {
  const { name, content } = file

  if (!name.endsWith('.vue')) {
    return
  }

  if (typeof content !== 'string') {
    return
  }

  // script + template
  const compiled = compile(content, {
    filename: name,
    tsTransform: (src) => {
      return {
        code: t(src, { transforms: ["typescript"] }).code
      }
    }
  })

  // styles
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

  // external imports
  const externalImports: string[] = []
  const externalCssModules: string[] = []
  await Promise.all(compiled.externalJs.map(async jsFile => {
    externalImports.push(`import ${JSON.stringify(jsFile.filename)};`)
  }))
  await Promise.all(compiled.externalCss.map(async cssFile => {
    if (cssFile.module) {
      externalImports.push(`import ${cssFile.module} from ${JSON.stringify(`${cssFile.filename}?module`)};`)
      externalCssModules.push(genCssModuleAssignment(cssFile.module, cssFile.module))
    } else {
      const specifier = cssFile.scoped ? `${cssFile.filename}?scoped=${cssFile.scoped}` : cssFile.filename
      externalImports.push(`import ${JSON.stringify(specifier)};`)
    }
  }))

  const generatedCode =  `${externalImports.join('\n')}\n${compiled.js.code}\n${compiledCss.join('\n')}\n${externalCssModules.join('\n')}`

  return {
    name,
    query: {},
    content: generatedCode
  }
}

export default (): Plugin => {
  return {
    name: 'vue',
    transform: transform
  }
}