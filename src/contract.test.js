const _ = require('lodash');
const {
  Type,
  StringType,
  NumberType,
  BooleanType,
  ArrayType,
  MapType,
  OpenMapType,
  Optional,
  EnumType,
  Not,
  OneOf,
  AllOf,
  AnyOf,
  ContainingMapType
} = require('./contract');

describe('contract tests', () => {
  it('StringType', () => {
    expect(() => StringType().validate('hello')).not.toThrow();
    expect(() => StringType().validate('')).not.toThrow();
    expect(() => StringType().validate()).toThrow(`expected undefined to be a StringType`);
    expect(() => StringType().validate(null)).toThrow(`expected null to be a StringType`);
    expect(() => StringType().validate(123)).toThrow(`expected 123 to be a StringType`);
  });

  it('NumberType', () => {
    expect(() => NumberType().validate(123)).not.toThrow();
    expect(() => NumberType().validate(-123.456)).not.toThrow();
    expect(() => NumberType().validate()).toThrow(`expected undefined to be a NumberType`);
    expect(() => NumberType().validate(null)).toThrow(`expected null to be a NumberType`);
    expect(() => NumberType().validate('123')).toThrow(`expected 123 to be a NumberType`);
  });

  it('BooleanType', () => {
    expect(() => BooleanType().validate()).toThrow(`expected undefined to be a BooleanType`);
    expect(() => BooleanType().validate(null)).toThrow();
    expect(() => BooleanType().validate(false)).not.toThrow();
  });

  it('ArrayType', () => {
    expect(() => ArrayType(NumberType()).validate([1, 2, 3])).not.toThrow();
    expect(() => ArrayType(NumberType()).validate('hello')).toThrow('expected hello to be a ArrayType');
    expect(() => ArrayType(NumberType()).validate(['hi'])).toThrow('expected hi to be a NumberType');
  });

  it('custom type: MinMaxNumberType', () => {
    const MinMaxNumberType = Type((instance, min, max) => {
      if (!_.isNumber(instance)) {
        throw new TypeError(`expected ${instance} to be a NumberType`);
      }
      if (instance < min || instance > max) {
        throw new Error(`${instance} out of range`);
      }
    });

    expect(() => MinMaxNumberType(10, 20).validate()).toThrow();
    expect(() => MinMaxNumberType(10, 20).validate(15)).not.toThrow();
    expect(() => MinMaxNumberType(10, 20).validate(8)).toThrow(`8 out of range`);
    expect(() => MinMaxNumberType(10, 20).validate(22)).toThrow(`22 out of range`);
  });

  it('MapType', () => {
    const mapType = MapType({
      name: StringType(),
      age: NumberType()
    });

    expect(() => mapType.validate()).toThrow();
    expect(() => mapType.validate('hello')).toThrow();
    expect(() => mapType.validate(['hi'])).toThrow();
    class A { }
    expect(() => mapType.validate(new A())).toThrow(`expected [object Object] to be a MapType`);
    expect(() => mapType.validate({})).toThrow('expected undefined to be a StringType');
    expect(() => mapType.validate({ name: 123 })).toThrow('expected 123 to be a StringType');
    expect(() => mapType.validate({ name: 'the name', age: 'ageless' })).toThrow('expected ageless to be a NumberType');
    expect(() => mapType.validate({ name: 'the name', age: 123 })).not.toThrow();

    const transitiveMapType = MapType({
      inner: MapType({
        name: StringType()
      })
    });
    expect(() => transitiveMapType.validate({})).toThrow();
    expect(() => transitiveMapType.validate({ inner: {} })).toThrow();
    expect(() => transitiveMapType.validate({ inner: '' })).toThrow();
    expect(() => transitiveMapType.validate({ inner: { name: 'hi' } })).not.toThrow();
  });

  it('MapType exact', () => {
    const mapType = MapType({
      name: StringType(),
      age: NumberType()
    });

    expect(() => mapType.validate({ name: 'the name', age: 123, foo: 'bar' })).toThrow('expected exact keys');
  });

  it('Optional', () => {
    expect(() => Optional(StringType()).validate('ho')).not.toThrow();
    expect(() => Optional(StringType()).validate(123)).toThrow();
    expect(() => Optional(StringType()).validate()).not.toThrow();

    const mapWithOptional = MapType({
      name: StringType(),
      nickname: Optional(StringType())
    });

    expect(() => mapWithOptional.validate({ name: 'ho' })).not.toThrow();
    expect(() => mapWithOptional.validate({ name: 'ho', nickname: 123 })).toThrow();
  });

  it('Type inheritance', () => {
    const MinMaxNumberType = NumberType().extend((instance, min, max) => {
      if (instance < min || instance > max) {
        throw new Error(`${instance} out of range`);
      }
    });

    expect(() => MinMaxNumberType(10, 20).validate(15)).not.toThrow();
    expect(() => MinMaxNumberType(10, 20).validate(8)).toThrow(`8 out of range`);
    expect(() => MinMaxNumberType(10, 20).validate(22)).toThrow(`22 out of range`);
    expect(() => MinMaxNumberType(10, 20).validate('hi')).toThrow();
    expect(() => MinMaxNumberType(10, 20).validate()).toThrow();
  });

  it('EnumType', () => {
    expect(() => EnumType('foo', 'bar').validate()).toThrow('expected one of foo,bar');
    expect(() => EnumType('foo', 'bar').validate('foo')).not.toThrow();
    expect(() => EnumType('foo', 'bar').validate('bar')).not.toThrow();
    expect(() => EnumType('foo', 'bar').validate('bAr')).toThrow('expected one of foo,bar');
    expect(() => EnumType('foo', 'bar').validate('FOO')).toThrow('expected one of foo,bar');
    expect(() => EnumType(1, 3).validate(2)).toThrow('expected one of 1,3');
    expect(() => EnumType(1, 3).validate(3)).not.toThrow();
    expect(() => EnumType(1, 3).validate('1')).toThrow('expected one of 1,3');
  });

  it('OpenMapType', () => {
    const contract = OpenMapType({
      name: StringType()
    });
    expect(() => contract.validate({ name: 'bob' })).not.toThrow();
    expect(() => contract.validate({ name: 123 })).toThrow();
    expect(() => contract.validate(123)).toThrow();
    expect(() => contract.validate({ name: 'bob', age: 30 })).not.toThrow();
  });

  it('Not operator', () => {
    const contract = Not(StringType());
    expect(() => contract.validate()).not.toThrow();
    expect(() => contract.validate(123)).not.toThrow();
    expect(() => contract.validate('hello')).toThrow('expected hello not to be valueType');
  });

  it('OneOf operator', () => {
    const contract = OneOf([StringType(), BooleanType()]);
    expect(() => contract.validate()).toThrow();
    expect(() => contract.validate(123)).toThrow();
    expect(() => contract.validate('123')).not.toThrow();
    expect(() => contract.validate(true)).not.toThrow();
    expect(() => contract.validate({})).toThrow();
  });

  it('OneOf is exactly one', () => {
    const contract = OneOf([NumberType(), NumberType()]);
    expect(() => contract.validate()).toThrow();
    expect(() => contract.validate(123)).toThrow();
  });

  it('AllOf operator', () => {
    const MinLengthType = Type((instance, length) => {
      if (instance.length < length) {
        throw new Error();
      }
    });
    const contract = AllOf([StringType(), MinLengthType(5)]);
    expect(() => contract.validate()).toThrow();
    expect(() => contract.validate([1, 2, 3])).toThrow();
    expect(() => contract.validate('123')).toThrow();
    expect(() => contract.validate('123456')).not.toThrow();
  });

  it('AnyOf operator', () => {
    const MinLengthType = Type((instance, length) => {
      if (instance.length < length) {
        throw new Error();
      }
    });
    const contract = AnyOf([StringType(), MinLengthType(5)]);
    expect(() => contract.validate()).toThrow();
    expect(() => contract.validate('123')).not.toThrow();
    expect(() => contract.validate('1234567')).not.toThrow();
    expect(() => contract.validate([1, 2, 3, 4, 5, 6, 7])).not.toThrow();
    expect(() => contract.validate([1, 2, 3])).toThrow();
  });

  it('AllKeysMapType', () => {
    const contract = ContainingMapType({
      name: StringType()
    });
    expect(() => contract.validate({ someKey: { name: 'bob' } })).not.toThrow();
    expect(() => contract.validate({ someKey: { name: 'bob' }, otherKey: { name: 'goos' } })).not.toThrow();
    expect(() => contract.validate({ someKey: { name: 123 } })).toThrow();
    expect(() => contract.validate({ someKey: { name: 'bob' }, otherKey: { name: 456 } })).toThrow();
    expect(() => contract.validate({ name: 'bob' })).toThrow();
    expect(() => contract.validate({})).toThrow();
  });
});

