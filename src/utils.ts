import chalk from 'chalk';
import { Context } from "./types.js";

// logger

type CHALK_COLOR_LIST = 
 | 'black'
 | 'red'
 | 'green'
 | 'yellow'
 | 'blue'
 | 'magenta'
 | 'cyan'
 | 'white'

export const createLogger = (name: string, color: CHALK_COLOR_LIST = 'blue', context?: Context) => {
  return {
    log: (...argv: any[]) => {
      const primary = chalk[color].underline;
      const secondary = chalk.dim;
      if (process.env.DEBUG || context?.debug) {
        console.log(primary(`[${name}]`), ...argv.map((arg) => secondary(arg)));
      }
    },
  };
}

// extention name

export const codeExtNamesRegExp = /(js|mjs|ts|tsx|jsx|css|vue)/

export const getExtName = (name: string): string => {
  const endIndex = name.indexOf('?') > -1 ? name.indexOf('?') : name.indexOf('#') > -1 ? name.indexOf('#') : name.length
  const extIndex = name.lastIndexOf('.');
  if (extIndex === -1) return '';
  return name.slice(extIndex + 1, endIndex);
}

// query string

export const getQuery = (name: string): Record<string, string | boolean> => {
  const query = name.indexOf('?') > -1 ? name.slice(name.indexOf('?') + 1) : '';
  const queries = query.split('&');
  const result: Record<string, string | boolean> = {};
  queries.forEach((query) => {
    if (query) {
      const [key, value] = query.split('=', 2);
      result[key] = value || true;
    }
  });
  return result;
}

export const setQuery = (name: string, query: Record<string, string | boolean>): string => {
  const queries = Object.entries(query).map(([key, value]) => {
    return value === true ? key : `${key}=${value}`;
  });
  return name.indexOf('?') > -1 ? `${name}&${queries.join('&')}` : `${name}?${queries.join('&')}`;
}

export const removeQuery = (name: string): string => {
  return name.indexOf('?') > -1 ? name.slice(0, name.indexOf('?')) : name;
}

// build result

/**
 * e.g.
 * - `foo, { x: true }` => `foo__x`
 * - `bar, { x: '1', y: true }` => `bar__x-1_y`
 */
export const genId = (name: string, query: Record<string, string | boolean>): string => {
  const queryStringList: string[] = [];
  Object.keys(query).sort().forEach((key) => {
    if (typeof query[key] === 'string' && query[key] !== '') {
      queryStringList.push(`${encodeURIComponent(key)}-${encodeURIComponent(query[key])}`);
    } else if (query[key] === true) {
      queryStringList.push(encodeURIComponent(key));
    }
  });
  return `${name}__${queryStringList.join('_')}`;
}
