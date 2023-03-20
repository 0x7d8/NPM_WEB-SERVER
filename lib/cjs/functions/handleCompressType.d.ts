/// <reference types="node" />
import { PassThrough } from "stream";
export type CompressTypes = 'none' | 'gzip' | 'brotli' | 'deflate';
export declare const CompressMapping: Record<CompressTypes, string>;
export default function handleCompressType(type: CompressTypes): PassThrough;
