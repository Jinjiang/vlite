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