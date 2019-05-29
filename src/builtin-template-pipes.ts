import moment from 'moment';

function strpad(n, width, z = '0') {
  n = n.toString();

  while (n.length < width) {
    n = z + n;
  }

  return n;
}

function getByteLength(str) {
  let len = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charAt(i);
    const charLen = escape(ch).length;

    len += charLen > 4 ? 2 : 1;
  }

  return len;
}

function formatBytes(bytes, decimals) {
  if (bytes == 0) {
    return '0 Byte';
  }

  let k = 1024; // or 1024 for binary
  let dm = decimals + 1 || 1;
  let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + '' + sizes[i];
}

function truncateString(str, limit, ellipsis = '…') {
  let t = str.toString();
  let b = 0;
  let c = 0;

  // for getting character width rather than byte length
  // count it only 2 bytes if greater than 1 byte.
  for (let i = 0; c = t.charCodeAt(i); i++) {
    b += c >> 7 ? 2 : 1;
  }

  if (b > limit) {
    let byteLimit = Math.floor(limit * (t.length / b));

    t = t.substring(0, byteLimit - ellipsis.length) + ellipsis;
  }

  return t;
}

/**
 * Convert to currency expression.
 * ex) 1024 => 1,024
 * @param {number} value 
 * @param {number} decimals 
 */
function formatCurrency(value, decimals = 0) {
  let str = Number(value).toFixed(decimals);

  if (decimals) {
    return str.replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
  } else {
    return str.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  }
}

const humanTimeDiffKorean = {
  now: '방금 전',
  min: '1분 전',
  mins: '%d분 전',
  hour: '한 시간 전',
  hours: '%d시간 전',
  today: '오늘',
  yesterday: '어제',
  days: '%d일 전',
  week: '1주 전',
  weeks: '%d주 전',
  month: '한달 전',
  months: '%d달 전',
  year: '1년 전',
  years: '%d년 전'
};

const humanTimeDiffEnglish = {
  now: 'now',
  min: '1 min',
  mins: '%d mins',
  hour: '1 hour',
  hours: '%d hours',
  today: 'today',
  yesterday: 'yesterday',
  days: '%d days',
  week: '1 week',
  weeks: '%d weeks',
  month: '1 month',
  months: '%d months',
  year: '1 year',
  years: '%d years'
};

function replaceNumber(tmp, n) {
  return tmp.replace(/%d/i, n);
}

/**
 * Get human readable time difference.
 * @param {Date} from
 * @param {Date} to
 * @param {any} lang
 */
export function getHumanTimeDiff(from, to = new Date(), lang = humanTimeDiffEnglish) {
  from = new Date(from);
  to = new Date(to);

  const diff = Math.ceil((to.getTime() - from.getTime()) / 1000);

  if (diff < 60) {
    return lang.now;
  }

  if (diff < 3600) {
    const t = Math.ceil(diff / 60);

    if (t === 1) {
      return lang.min;
    } else {
      return replaceNumber(lang.mins, t);
    }
  }

  if (diff < 3600 * 12) {
    const t = Math.ceil(diff / 3600);

    if (t === 1) {
      return lang.hour;
    } else {
      return replaceNumber(lang.hours, t);
    }
  }

  if (diff < 3600 * 24 * 2) {
    if (from.getDate() === to.getDate()) {
      return lang.today;
    } else {
      return lang.yesterday;
    }
  }

  if (diff < 3600 * 24 * 7) {
    const t = Math.ceil(diff / 3600 / 24);

    return replaceNumber(lang.days, t);
  }

  if (diff < 3600 * 24 * 30) {
    const t = Math.floor(diff / 3600 / 24 / 7);

    if (t === 1) {
      return lang.week;
    } else {
      return replaceNumber(lang.weeks, t);
    }
  }

  if (diff < 3600 * 24 * 30 * 2) {
    return lang.month;
  }

  if (diff < 3600 * 24 * 365) {
    const t = Math.ceil(diff / 3600 / 24 / 30);

    if (t === 1) {
      return lang.month;
    } else {
      return replaceNumber(lang.months, t);
    }
  }

  const t = Math.ceil(diff / 3600 / 24 / 365);

  if (t === 1) {
    return lang.year;
  } else {
    return replaceNumber(lang.years, t);
  }
}

const pipes = {
  byte: function (v) {
    return formatBytes(Number(v), 0);
  },
  percentage: function (v) {
    return (Number(v) * 100) + '%';
  },
  currency: function (v, args) {
    if (args.length === 1 && typeof args[0] === 'number') {
      return formatCurrency(Number(v), args[0]);
    }

    return formatCurrency(Number(v));
  },
  byteLength: function (v) {
    return getByteLength(v);
  },
  pad: function (v, args) {
    if (args.length !== 1 || typeof args[0] !== 'number') {
      throw new Error('Invalid Argument: pad ' + args.join(' '));
    }

    return strpad(v, args[0]);
  },
  truncate: function (v, args) {
    if (args.length === 0 || typeof args[0] !== 'number') {
      throw new Error('Invalid Argument: truncate ' + args.join(' '));
    }

    if (args.length === 2 && typeof args[1] === 'string') {
      return truncateString(v, args[0], args[1]);
    }

    return truncateString(v, args[0]);
  },
  upperCase: function (v) {
    return v.toString().toUpperCase();
  },
  lowerCase: function (v) {
    return v.toString().toLowerCase();
  },
  date: function (v, args) {
    if (args.length === 1 && typeof args[0] === 'string') {
      return moment(v).format(args[0]);
    } else {
      return moment(v).format('YYYY-MM-DD');
    }
  },
  timeAgo: function (v, args) {
    if (args.length === 1 && typeof args[0] === 'string') {
      const lang = args[0].toLowerCase();

      if (lang === 'ko') {
        return getHumanTimeDiff(v, new Date(), humanTimeDiffKorean);
      }
    }

    return getHumanTimeDiff(v);
  }
};

export default pipes;
