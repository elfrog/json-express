
class PeekableString {
  index = 0;
  source: string = null;

  constructor(source: string) {
    this.source = source;
  }

  clear() {
    this.index = 0;
  }

  peek(rel = 0) {
    const index = this.index + rel;

    if (index >= this.source.length || index < 0) {
      return null;
    }

    return this.source.charAt(index);
  }

  next(rel = 1) {
    const index = this.index + rel;

    if (index > this.source.length || index < 0) {
      return;
    }

    this.index = index;
  }

  trim() {
    while (this.index < this.source.length) {
      const ch = this.source.charAt(this.index);

      if (ch !== ' ' && ch !== '\n' && ch !== '\t') {
        return;
      }

      this.index++;
    }
  }
}

export default PeekableString;
