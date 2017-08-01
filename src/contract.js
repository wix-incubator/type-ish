const _ = require('lodash');

function Type(validateFn) {
  return (...params) => new TypeValidator({ params, validateFn });
}

const StringType = Type((instance) => {
  assert(
    _.isString(instance),
    `expected ${instance} to be a StringType`
  );
});

const NumberType = Type((instance) => {
  assert(
    _.isNumber(instance),
    `expected ${instance} to be a NumberType`
  );
});

const BooleanType = Type((instance) => {
  assert(
    _.isBoolean(instance),
    `expected ${instance} to be a BooleanType`
  );
});

const ArrayType = Type((instance, valueType) => {
  assert(
    _.isArray(instance),
    `expected ${instance} to be a ArrayType`
  );

  _.forEach(instance, (element) => {
    valueType.validate(element);
  });
});

const MapType = Type((instance, scheme) => {
  assert(
    _.isPlainObject(instance),
    `expected ${instance} to be a MapType`
  );

  const cloned = _.cloneDeep(instance);

  _.forEach(scheme, (valueType, key) => {
    valueType.validate(instance[key]);
    _.unset(cloned, key);
  });

  assert(
    _.isEmpty(cloned),
    'expected exact keys'
  );
});

const Optional = Type((instance, valueType) => {
  if (!_.isUndefined(instance)) {
    valueType.validate(instance);
  }
});

const EnumType = Type((instance, ...enums) => {
  assert(
    _.includes(enums, instance),
    `expected one of ${enums}`
  );
});

function assert(what, msg) {
  if (!what) {
    throw new Error(msg);
  }
}

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

class TypeValidator {
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

