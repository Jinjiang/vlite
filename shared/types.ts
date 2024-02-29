export type File = {
  name: string;
  content: string | Buffer;
  binary?: boolean;
};

export type BuildFile = File & {
  build?: File[]; // preserved for later
}

export type MaybePromise<T> = T | undefined | Promise<T | undefined>;

export type Context = {
  mode?: 'development' | 'production';
  debug?: boolean;
  defaultResolver?: (id: string, context?: Context) => MaybePromise<string>;
  defaultLoader?: (id: string, context?: Context) => MaybePromise<string | Buffer>;
};

export type Plugin = {
  name: string;
  resolveId?: (id: string, context?: Context) => MaybePromise<string>;
  load?: (id: string, context?: Context) => MaybePromise<string | Buffer>;
  transform?: (file: File, context?: Context) => MaybePromise<BuildFile>;
}

