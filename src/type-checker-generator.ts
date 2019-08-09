import BuildType from "./build-type";

function checkValueType(value: any, type: BuildType) {
  switch(type.type) {
    case '@choice':
      if (!type.children.some(subType => checkValueType(value, subType))) {
        return false;
      }
      break;
    case '@tuple':
      if (!Array.isArray(value)) {
        return false;
      }

      if (value.length !== type.children.length) {
        return false;
      }

      for (let i = 0; i < type.children.length; i++) {
        if (!checkValueType(value[i], type.children[i])) {
          return false;
        }
      }
      break;
    case '@record':
      {
        const restType = type.record['...'];
        const restValues = [];

        for (const key in value) {
          if (!(key in type.record)) {
            if (!restType) {
              return false;
            }

            restValues.push(value[key]);
          }
        }

        for (const key in type.record) {
          if (key === '...') {
            continue;
          }

          if (!(key in value)) {
            if (!type.record[key].optional) {
              return false;
            }
          } else if (!checkValueType(value[key], type.record[key])) {
            return false;
          }
        }

        if (restType) {
          if (!restValues.every(v => checkValueType(v, restType))) {
            return false;
          }
        }
      }
      break;
    case 'string':
      if (typeof value !== 'string') {
        return false;
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        return false;
      }

      if (!!type.children) {
        const subType = type.children[0];

        if (!value.every(v => checkValueType(v, subType))) {
          return false;
        }
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return false;
      }
      break;
    case 'number':
      if (typeof value !== 'number') {
        return false;
      }
      break;
    case 'null':
      if (typeof value !== null) {
        return false;
      }
      break;
    case 'any':
      break;
    default:
      return false;
  }

  return true;
}

function typeCheckerGenerator(types: object) {
  const parsedTypes = {};

  for (const key in types) {
    parsedTypes[key] = new BuildType(types[key]);
  }

  return function (target: object) {
    for (const key in target) {
      const type = parsedTypes[key];

      if (!type) {
        continue;
      }

      if (!checkValueType(target[key], type)) {
        throw new TypeError('Invalid type with: ' + JSON.stringify(target[key]));
      }
    }
  };
}

export default typeCheckerGenerator;
