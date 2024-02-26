export type File = {
  name: string;
  content: string;
};

type MaybePromise<T> = T | Promise<T> | undefined | Promise<undefined>;

export type Plugin = {
  name: string;
  resolveId?: (id: string) => MaybePromise<string>;
  load?: (id: string) => MaybePromise<string>;
  transform?: (file: File) => MaybePromise<File>;
}

