/// <reference types="node" />
export type Content = string | Buffer | Map<any, any> | number | boolean | Record<any, any> | symbol | Function;
export interface Returns {
    headers: Record<string, string>;
    content: Buffer;
}
export default function parseContent(content: Content): Promise<Returns>;
