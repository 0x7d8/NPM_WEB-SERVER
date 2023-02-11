/// <reference types="node" />
/// <reference types="node" />
import { PassThrough } from "stream";
import * as zlib from "zlib";
export type CompressTypes = 'none' | 'gzip' | 'brotli' | 'deflate';
export declare const CompressMapping: Record<CompressTypes, string>;
declare class createNone extends PassThrough {
    close: () => {};
}
export default function handleCompressType(type: CompressTypes): createNone | zlib.Gzip;
export {};
