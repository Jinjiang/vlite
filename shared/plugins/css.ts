import { File, Plugin } from '../types';

// TODO: get css modules working

const t = (content: string) => {
  return `
const style = document.createElement('style');
style.innerHTML = ${JSON.stringify(content)};
document.head.appendChild(style);
`.trim()
}

const resolvedId = (id: string) => {
  if (id.endsWith('.css')) {
    return id;
  }
}

const transform = (file: File) => {
  return {
    name: file.name.replace(/\.css?$/, '.js'),
    content: t(file.content)
  }
}

export default (): Plugin => {
  return {
    name: 'css',
    resolveId: resolvedId,
    transform: transform
  }
}