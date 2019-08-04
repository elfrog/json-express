interface BuildTypeRecord {
    [key: string]: BuildType;
}
declare class BuildType {
    type: string;
    record: BuildTypeRecord;
    children: BuildType[];
    constructor(value: string);
}
export default BuildType;
export { BuildTypeRecord };
