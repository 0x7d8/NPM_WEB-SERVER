/// <reference types="node" />
/// <reference types="node" />
import { PassThrough } from "stream";
import zlib from "zlib";
export type CompressTypes = 'none' | 'gzip' | 'brotli' | 'deflate';
export declare const CompressMapping: Record<CompressTypes, string>;
declare class CreateNone extends PassThrough {
    close: () => {};
}
export default function handleCompressType(type: CompressTypes): CreateNone | zlib.Gzip;
export {};
