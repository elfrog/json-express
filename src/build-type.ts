import parse from  './build-type-parser';

interface BuildTypeRecord {
  [key: string]: BuildType;
}

class BuildType {
  type: string;
  record: BuildTypeRecord = null;
  children: BuildType[] = null;

  constructor(value: string) {
    const parsed = parse(value, {}) as BuildType;

    this.type = parsed.type;
    this.record = parsed.record;
    this.children = parsed.children;
  }
}

export default BuildType;

export {
  BuildTypeRecord
};
