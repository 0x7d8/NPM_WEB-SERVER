import page from "../interfaces/page";
import ctr from "../interfaces/ctr";
import types from "../misc/types";
interface staticOptions {
    /** If true then files will be loaded into RAM */ preload: boolean;
    /** If true then .html will be removed automatically */ remHTML: boolean;
}
declare const _default: {
    new (): {
        urls: page[];
        set(type: (typeof types)[number], path: string, code: (ctr: ctr) => Promise<void>): void;
        static(path: string, folder: string, options: staticOptions): void;
        load(folder: string): void;
        list(): page[];
    };
};
export = _default;
//# sourceMappingURL=routeList.d.ts.map