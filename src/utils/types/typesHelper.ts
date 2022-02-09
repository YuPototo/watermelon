/*
https://docs.microsoft.com/en-us/javascript/api/@azure/keyvault-certificates/requireatleastone?view=azure-node-latest
*/
export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> &
        Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

/*
https://stackoverflow.com/questions/68399257/typescript-neither-either-but-not-both-properties
*/

type Simplify<T> = T extends infer S ? { [K in keyof S]: S[K] } : never
type NoneOf<T> = Simplify<{ [K in keyof T]?: never }>
export type AtMostOneOf<T> =
    | NoneOf<T>
    | { [K in keyof T]: Simplify<Pick<T, K> & NoneOf<Omit<T, K>>> }[keyof T]
