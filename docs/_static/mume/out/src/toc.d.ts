/**
 *  ordered: boolean
 *  depthFrom: number, default 1
 *  depthTo: number, default 6
 *  tab: string, default `\t`
 */
export interface tocOption {
    ordered: boolean;
    depthFrom: number;
    depthTo: number;
    tab: string;
    ignoreLink?: boolean;
}
/**
 *
 * @param opt:tocOption =
 * @param tokens = [{content:string, level:number, id:optional|string }]
 * @return {content, array}
 */
export declare function toc(tokens: any, opt: tocOption): {
    content: string;
    array: any[];
};
