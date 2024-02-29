import { Context } from "./types.ts";

export const createLogger = (name: string, context?: Context) => {
  return {
    log: (...argv: any[]) => {
      if (context?.debug) {
        console.log(`[${name}]`, ...argv);
      }
    },
  };
}

export const codeExtNamesRegExp = /(js|mjs|ts|tsx|jsx|css|vue)/

export const removeQuery = (name: string): string => {
  return name.indexOf('?') > -1 ? name.slice(0, name.indexOf('?')) : name;
}

export const getExtName = (name: string): string => {
  const endIndex = name.indexOf('?') > -1 ? name.indexOf('?') : name.indexOf('#') > -1 ? name.indexOf('#') : name.length
  const extIndex = name.lastIndexOf('.');
  if (extIndex === -1) return '';
  return name.slice(extIndex + 1, endIndex);
}

export const getQuery = (name: string): Record<string, string | boolean> => {
  const query = name.indexOf('?') > -1 ? name.slice(name.indexOf('?') + 1) : '';
  const queries = query.split('&');
  const result: Record<string, string | boolean> = {};
  queries.forEach((query) => {
    const [key, value] = query.split('=', 2);
    result[key] = value || true;
  });
  return result;
}

export const setQuery = (name: string, query: Record<string, string | boolean>): string => {
  const queries = Object.entries(query).map(([key, value]) => {
    return value === true ? key : `${key}=${value}`;
  });
  return name.indexOf('?') > -1 ? `${name}&${queries.join('&')}` : `${name}?${queries.join('&')}`;
}