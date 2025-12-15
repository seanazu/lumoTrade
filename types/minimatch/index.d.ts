declare module "minimatch" {
  export interface IOptions {
    matchBase?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    debug?: boolean;
    flipNegate?: boolean;
  }

  export interface Minimatch {
    pattern: string;
    options: IOptions;
    makeRe(): RegExp;
    match(fname: string): boolean;
  }

  export function minimatch(target: string, pattern: string, options?: IOptions): boolean;
  export function filter(pattern: string, options?: IOptions): (target: string) => boolean;
  export function match(list: readonly string[], pattern: string, options?: IOptions): string[];
  export function makeRe(pattern: string, options?: IOptions): RegExp;
  export { minimatch as default };
}
