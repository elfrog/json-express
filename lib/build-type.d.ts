interface BuildTypeRecord {
    [key: string]: BuildType;
}
declare class BuildType {
    type: string;
    record: BuildTypeRecord;
    children: BuildType[];
    optional: boolean;
    constructor(value: string);
}
export default BuildType;
export { BuildTypeRecord };
