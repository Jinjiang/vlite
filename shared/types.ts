export type File = {
  name: string;
  content: string;
  binary?: boolean; // preserved for later
};

export type BuildFile = File & {
  build?: File[]; // preserved for later
}

export type MaybePromise<T> = T | Promise<T> | undefined | Promise<undefined>;

export type Context = {
  mode?: 'development' | 'production';
  debug?: boolean;
}; // preserved for later

export type Plugin = {
  name: string;
  resolveId?: (id: string, context?: Context) => MaybePromise<string>;
  load?: (id: string, context?: Context) => MaybePromise<string>;
  transform?: (file: File, context?: Context) => MaybePromise<BuildFile>;
}

