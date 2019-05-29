declare class PeekableString {
    index: number;
    source: string;
    constructor(source: string);
    clear(): void;
    peek(rel?: number): string;
    next(rel?: number): void;
    trim(): void;
}
export default PeekableString;
