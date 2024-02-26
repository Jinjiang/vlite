import postcss from 'postcss';
import modules from 'postcss-modules';
import { File, Plugin } from '../types';

const parseCssModules = async (file: File) => {
  let classNames
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

const t = (content: string, classNames?: object) => {
  return `
const style = document.createElement('style');
style.innerHTML = ${JSON.stringify(content)};
document.head.appendChild(style);

export default ${JSON.stringify(classNames || {})};
`.trim()
}

const resolvedId = (id: string) => {
  if (id.endsWith('.css')) {
    return id;
  }
}

const transform = async (file: File) => {
  let content = file.content
  let classNames
  if (file.name.endsWith('.module.css')) {
    const result = await parseCssModules(file)
    content = result.code
    classNames = result.classNames
  }
  return {
    name: `${file.name}.js`,
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