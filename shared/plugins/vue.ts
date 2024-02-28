import { transform as t } from 'sucrase'
import { compile } from 'vue-simple-compiler';
import postcss from 'postcss';
import modules from 'postcss-modules';
import { compileStyle } from 'vue/compiler-sfc';
import { File, Plugin } from '../types';

// TODO: CSS Modules, scoped CSS, preprocessors

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

const tCss = (content: string, classNames?: object) => {
  return `
{
  const style = document.createElement('style');
  style.innerHTML = ${JSON.stringify(content)};
  document.head.appendChild(style);
}

// export default ${JSON.stringify(classNames || {})};
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
  const compiledCss = await Promise.all(compiled.css.map(async cssFile => {
    if (cssFile.filename.endsWith('.module.css')) {
      // TODO: get module index and pass into tCss() as the third argument
      const { code, classNames } = await parseCssModules({
        name: cssFile.filename,
        content: cssFile.code
      })
      return tCss(code, classNames)
    }
    // TODO: scoped CSS
    if ((cssFile as any).scoped) {
      const result = compileStyle({
        source: cssFile.code,
        filename: cssFile.filename,
        id: 'data-v-id',
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