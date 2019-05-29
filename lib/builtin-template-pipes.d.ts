/**
 * Get human readable time difference.
 * @param {Date} from
 * @param {Date} to
 * @param {any} lang
 */
export declare function getHumanTimeDiff(from: any, to?: Date, lang?: {
    now: string;
    min: string;
    mins: string;
    hour: string;
    hours: string;
    today: string;
    yesterday: string;
    days: string;
    week: string;
    weeks: string;
    month: string;
    months: string;
    year: string;
    years: string;
}): any;
declare const pipes: {
    byte: (v: any) => string;
    percentage: (v: any) => string;
    currency: (v: any, args: any) => string;
    byteLength: (v: any) => number;
    pad: (v: any, args: any) => any;
    truncate: (v: any, args: any) => any;
    upperCase: (v: any) => any;
    lowerCase: (v: any) => any;
    date: (v: any, args: any) => string;
    timeAgo: (v: any, args: any) => any;
};
export default pipes;
