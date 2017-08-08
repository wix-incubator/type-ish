const _ = require('lodash');

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

const OpenMapType = Type((instance, scheme) => {
  assert(
    _.isPlainObject(instance),
    `expected ${instance} to be a OpenMapType`
  );

  _.forEach(scheme, (valueType, key) => {
    valueType.validate(instance[key]);
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

const ContainingMapType = Type((instance, scheme) => {
  assert(
    _.isPlainObject(instance),
    `expected ${instance} to be a MapType`
  );

  assert(
    _.size(instance),
    `expected ${instance} to contain all keys matching the schema`
  );

  _.forEach(scheme, (valueType, key) => {
    _.forEach(instance, (outerValue) => {
      valueType.validate(outerValue[key]);
    });
  });
});

const Optional = Type((instance, valueType) => {
  if (!_.isUndefined(instance)) {
    valueType.validate(instance);
  }
});

const Not = Type((instance, valueType) => {
  try {
    valueType.validate(instance);
  } catch (err) {
    return;
  }
  throw new Error(`expected ${instance} not to be valueType`);
});

const OneOf = Type((instance, valueTypes) => {
  let matches = 0;
  let theError = new Error(`expected ${instance} to match exactly once`);

  _.forEach(valueTypes, (t) => {
    try {
      t.validate(instance);
      matches++;
    } catch (err) {
      theError = err;
    }
  });

  if (matches !== 1) {
    throw theError;
  }
});

const AllOf = Type((instance, valueTypes) => {
  _.forEach(valueTypes, (t) => {
    t.validate(instance);
  });
});

const AnyOf = Type((instance, valueTypes) => {
  let theError;
  const matches = _.find(valueTypes, (t) => {
    try {
      t.validate(instance);
      return true;
    } catch (err) {
      theError = err;
      return false;
    }
  });

  if (!matches) {
    throw theError;
  }
});

const EnumType = Type((instance, ...enums) => {
  assert(
    _.includes(enums, instance),
    `expected one of ${enums}`
  );
});

const RegexStringType = Type((instance, regex) => {
  assert(
    _.isString(instance),
    `expected ${instance} to be a StringType`
  );
  assert(
    new RegExp(regex).test(instance),
    `expected ${instance} to match ${regex}`
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
  OpenMapType,
  ContainingMapType,
  EnumType,
  Optional,
  Not,
  OneOf,
  AllOf,
  AnyOf,
  RegexStringType
};
