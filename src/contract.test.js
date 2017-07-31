const _ = require('lodash');
const { Type, StringType, NumberType, BooleanType, ArrayType, MapType, Optional, EnumType } = require('./contract');

describe('contract tests', () => {

  it('StringType', () => {
    expect(() => StringType().validate('hello')).not.toThrow();
    expect(() => StringType().validate('')).not.toThrow();
    expect(() => StringType().validate()).toThrowError(`expected undefined to be a StringType`);
    expect(() => StringType().validate(null)).toThrowError(`expected null to be a StringType`);
    expect(() => StringType().validate(123)).toThrowError(`expected 123 to be a StringType`);
  });

  it('NumberType', () => {
    expect(() => NumberType().validate(123)).not.toThrow();
    expect(() => NumberType().validate(-123.456)).not.toThrow();
    expect(() => NumberType().validate()).toThrowError(`expected undefined to be a NumberType`);
    expect(() => NumberType().validate(null)).toThrowError(`expected null to be a NumberType`);
    expect(() => NumberType().validate('123')).toThrowError(`expected 123 to be a NumberType`);
  });

  it('BooleanType', () => {
    expect(() => BooleanType().validate()).toThrowError(`expected undefined to be a BooleanType`);
    expect(() => BooleanType().validate(null)).toThrow();
    expect(() => BooleanType().validate(false)).not.toThrow();
  });

  it('ArrayType', () => {
    expect(() => ArrayType(NumberType()).validate([1, 2, 3])).not.toThrow();
    expect(() => ArrayType(NumberType()).validate('hello')).toThrowError();
    expect(() => ArrayType(NumberType()).validate(['hi'])).toThrowError();
  });

  it('custom type: MinMaxNumberType', () => {
    const MinMaxNumberType = Type((instance, min, max) => {
      if (!_.isNumber(instance)) {
        throw new Error(`expected ${instance} to be a NumberType`);
      }
      if (instance < min || instance > max) {
        throw new Error(`${instance} out of range`);
      }
    });

    expect(() => MinMaxNumberType(10, 20).validate()).toThrow();
    expect(() => MinMaxNumberType(10, 20).validate(15)).not.toThrow();
    expect(() => MinMaxNumberType(10, 20).validate(8)).toThrowError(`8 out of range`);
    expect(() => MinMaxNumberType(10, 20).validate(22)).toThrowError(`22 out of range`);
  });

  it('MapType', () => {
    const mapType = MapType({
      name: StringType(),
      age: NumberType()
    });

    expect(() => mapType.validate()).toThrowError();
    expect(() => mapType.validate('hello')).toThrowError();
    expect(() => mapType.validate(['hi'])).toThrowError();
    class A { }
    expect(() => mapType.validate(new A())).toThrowError(`expected a plain object`);
    expect(() => mapType.validate({})).toThrowError('expected undefined to be a StringType');
    expect(() => mapType.validate({ name: 123 })).toThrowError('expected 123 to be a StringType');
    expect(() => mapType.validate({ name: 'the name', age: 'ageless' })).toThrowError('expected ageless to be a NumberType');
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

    expect(() => mapType.validate({ name: 'the name', age: 123, foo: 'bar' })).toThrowError('expected exact keys');
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
    expect(() => MinMaxNumberType(10, 20).validate(8)).toThrowError(`8 out of range`);
    expect(() => MinMaxNumberType(10, 20).validate(22)).toThrowError(`22 out of range`);
    expect(() => MinMaxNumberType(10, 20).validate('hi')).toThrow();
    expect(() => MinMaxNumberType(10, 20).validate()).toThrow();
  });

  it('EnumType', () => {
    expect(() => EnumType('foo', 'bar').validate()).toThrowError('expected one of foo,bar');
    expect(() => EnumType('foo', 'bar').validate('foo')).not.toThrow();
    expect(() => EnumType('foo', 'bar').validate('bar')).not.toThrow();
    expect(() => EnumType('foo', 'bar').validate('bAr')).toThrowError('expected one of foo,bar');
    expect(() => EnumType('foo', 'bar').validate('FOO')).toThrowError('expected one of foo,bar');
  });
});

