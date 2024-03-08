export type Query = Record<string, string | boolean>;

export type Request = {
  id: string;
  name: string;
  query: Query;
}

export type File = {
  name: string;
  content: string | Buffer;
};

export type RequestedFile = File & {
  query: Query;
};

export type MaybePromise<T> = T | undefined | Promise<T | undefined>;

export type Loader = (req: Request, context?: Context) => MaybePromise<string | Buffer>;

export type Transformer = (file: RequestedFile, context?: Context) => MaybePromise<RequestedFile>;

export type Context = {
  mode?: 'development' | 'production';
  debug?: boolean;
  defaultLoader?: Loader;
};

export type Plugin = {
  name: string;
  load?: Loader;
  transform?: Transformer;
}
