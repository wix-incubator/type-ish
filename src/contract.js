const _ = require('lodash');

class TypeClass {
  constructor({ params, validateFn }) {
    this.validateFn = validateFn;
    this.validate = this.validate.bind(this);
    this.params = params;
  }
  validate(instance) {
    this.validateFn(instance, ...this.params);
  }
  extend(extendingValidateFn) {
    return Type((...p) => {
      this.validateFn(...p);
      extendingValidateFn(...p);
    });
  }
}

function Type(validateFn) {
  return (...params) => new TypeClass({ params, validateFn });
}

const StringType = Type((instance) => {
  if (!_.isString(instance)) {
    throw new Error(`expected ${instance} to be a StringType`);
  }
});

const NumberType = Type((instance) => {
  if (!_.isNumber(instance)) {
    throw new Error(`expected ${instance} to be a NumberType`);
  }
});

const BooleanType = Type((instance) => {
  if (!_.isBoolean(instance)) {
    throw new Error(`expected ${instance} to be a BooleanType`);
  }
});

const ArrayType = Type((instance, valueType) => {
  if (!_.isArray(instance)) {
    throw new Error();
  }
  _.forEach(instance, (element) => {
    valueType.validate(element);
  });
});

const MapType = Type((instance, scheme) => {
  if (!_.isPlainObject(instance)) {
    throw new Error(`expected a plain object`);
  }

  const cloned = _.cloneDeep(instance);

  _.forEach(scheme, (valueType, key) => {
    valueType.validate(instance[key]);
    _.unset(cloned, key);
  });

  if (!_.isEmpty(cloned)) {
    throw new Error('expected exact keys');
  }
});

const Optional = Type((instance, valueType) => {
  if (_.isUndefined(instance)) {
    return;
  }
  valueType.validate(instance);
});

const EnumType = Type((instance, ...enums) => {
  if (!_.includes(enums, instance)) {
    throw new Error(`expected one of ${enums}`);
  }
});

module.exports = {
  Type,
  StringType,
  NumberType,
  BooleanType,
  ArrayType,
  MapType,
  EnumType,
  Optional
};
