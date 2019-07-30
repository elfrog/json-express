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
    byte: any;
    percentage: any;
    currency: any;
    byteLength: any;
    pad: any;
    truncate: any;
    upperCase: any;
    lowerCase: any;
    date: any;
    timeAgo: any;
};
export default pipes;
