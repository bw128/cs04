// Copyright 2017-2024, University of Colorado Boulder

/**
 * QUnit tests for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import Multilink from './Multilink.js';
import NumberProperty from './NumberProperty.js';
import Property from './Property.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import Vector2 from '../../dot/js/Vector2.js';
QUnit.module('Property');
QUnit.test('Test unlink', assert => {
  const property = new Property(1);
  const startingPListenerCount = property['getListenerCount']();
  const a = function (a) {
    _.noop;
  };
  const b = function (b) {
    _.noop;
  };
  const c = function (c) {
    _.noop;
  };
  property.link(a);
  property.link(b);
  property.link(c);
  assert.equal(property['getListenerCount'](), 3 + startingPListenerCount, 'should have 3 observers now');
  property.unlink(b);
  assert.ok(property.hasListener(a), 'should have removed b');
  assert.ok(property.hasListener(c), 'should have removed b');
  assert.equal(property['getListenerCount'](), 2 + startingPListenerCount, 'should have removed an item');
});
QUnit.test('Test Multilink.multilink', assert => {
  const aProperty = new Property(1);
  const bProperty = new Property(2);
  let callbacks = 0;
  Multilink.multilink([aProperty, bProperty], (a, b) => {
    callbacks++;
    assert.equal(a, 1, 'first value should pass through');
    assert.equal(b, 2, 'second value should pass through');
  });
  assert.equal(callbacks, 1, 'should have called back to a multilink');
});
QUnit.test('Test Multilink.lazyMultilink', assert => {
  const aProperty = new Property(1);
  const bProperty = new Property(2);
  let callbacks = 0;
  Multilink.lazyMultilink([aProperty, bProperty], (a, b) => {
    callbacks++;
    assert.equal(a, 1);
    assert.equal(b, 2);
  });
  assert.equal(callbacks, 0, 'should not call back to a lazy multilink');
});
QUnit.test('Test defer', assert => {
  const property = new Property(0);
  let callbacks = 0;
  property.lazyLink((newValue, oldValue) => {
    callbacks++;
    assert.equal(newValue, 2, 'newValue should be the final value after the transaction');
    assert.equal(oldValue, 0, 'oldValue should be the original value before the transaction');
  });
  property.setDeferred(true);
  property.value = 1;
  property.value = 2;
  assert.equal(property.value, 0, 'should have original value');
  const update = property.setDeferred(false);
  assert.equal(callbacks, 0, 'should not call back while deferred');
  assert.equal(property.value, 2, 'should have new value');

  // @ts-expect-error .setDeferred(false) will always return () => void
  update();
  assert.equal(callbacks, 1, 'should have been called back after update');
  assert.equal(property.value, 2, 'should take final value');
});
QUnit.test('Property ID checks', assert => {
  assert.ok(new Property(1)['id'] !== new Property(1)['id'], 'Properties should have unique IDs'); // eslint-disable-line no-self-compare
});
QUnit.test('Property link parameters', assert => {
  const property = new Property(1);
  const calls = [];
  property.link((newValue, oldValue, property) => {
    calls.push({
      newValue: newValue,
      oldValue: oldValue,
      property: property
    });
  });
  property.value = 2;
  assert.ok(calls.length === 2);
  assert.ok(calls[0].newValue === 1);
  assert.ok(calls[0].oldValue === null);
  assert.ok(calls[0].property === property);
  assert.ok(calls[1].newValue === 2);
  assert.ok(calls[1].oldValue === 1);
  assert.ok(calls[1].property === property);
});

/**
 * Make sure linking attributes and unlinking attributes works on Property
 */
QUnit.test('Property.linkAttribute', assert => {
  const property = new Property(7);
  const state = {
    age: 99
  };
  const listener = age => {
    state.age = age;
  };
  property.link(listener);
  assert.equal(state.age, 7, 'link should synchronize values');
  property.value = 8;
  assert.equal(state.age, 8, 'link should update values');
  property.unlink(listener);
  property.value = 9;
  assert.equal(state.age, 8, 'state should not have changed after unlink');
});
QUnit.test('Property value validation', assert => {
  // Type that is specific to valueType tests
  class TestType {
    constructor() {
      _.noop();
    }
  }
  let property = null;
  let options = {};

  // valueType is a primitive type (typeof validation)
  options = {
    valueType: 'string'
  };
  window.assert && assert.throws(() => {
    new Property(0, {
      valueType: 'foo'
    }); // eslint-disable-line no-new
  }, 'options.valueType is invalid, expected a primitive data type');
  window.assert && assert.throws(() => {
    new Property(0, options); // eslint-disable-line no-new
  }, 'invalid initial value with options.valueType typeof validation');
  property = new Property('horizontal', options);
  property.set('vertical');
  window.assert && assert.throws(() => {
    property.set(0);
  }, 'invalid set value with options.valueType typeof validation');

  // valueType is a constructor (instanceof validation)
  options = {
    valueType: TestType
  };
  window.assert && assert.throws(() => {
    new Property(0, options); // eslint-disable-line no-new
  }, 'invalid initial value for options.valueType instanceof validation');
  property = new Property(new TestType(), options);
  property.set(new TestType());
  window.assert && assert.throws(() => {
    property.set(0);
  }, 'invalid set value with options.valueType instanceof validation');

  // validValues
  options = {
    validValues: [1, 2, 3]
  };
  window.assert && assert.throws(() => {
    // @ts-expect-error INTENTIONAL value is invalid for testing
    new Property(0, {
      validValues: 0
    }); // eslint-disable-line no-new
  }, 'options.validValues is invalid');
  window.assert && assert.throws(() => {
    new Property(0, options); // eslint-disable-line no-new
  }, 'invalid initial value with options.validValues');
  property = new Property(1, options);
  property.set(3);
  window.assert && assert.throws(() => {
    property.set(4);
  }, 'invalid set value with options.validValues');

  // isValidValues
  options = {
    isValidValue: function (value) {
      return value > 0 && value < 4;
    }
  };
  window.assert && assert.throws(() => {
    // @ts-expect-error INTENTIONAL value is invalid for testing
    new Property(0, {
      isValidValue: 0
    }); // eslint-disable-line no-new
  }, 'options.isValidValue is invalid');
  window.assert && assert.throws(() => {
    new Property(0, options); // eslint-disable-line no-new
  }, 'invalid initial value with options.isValidValue');
  property = new Property(1, options);
  property.set(3);
  window.assert && assert.throws(() => {
    property.set(4);
  }, 'invalid set value with options.isValidValue');

  // Compatible combinations of validation options, possibly redundant (not exhaustive)
  options = {
    valueType: 'string',
    validValues: ['bob', 'joe', 'sam'],
    isValidValue: function (value) {
      return value.length === 3;
    }
  };
  property = new Property('bob', options);
  window.assert && assert.throws(() => {
    property.set(0);
  }, 'invalid set value with compatible combination of validation options');
  window.assert && assert.throws(() => {
    property.set('ted');
  }, 'invalid set value with compatible combination of validation options');

  // Incompatible combinations of validation options (not exhaustive)
  // These tests will always fail on initialization, since the validation criteria are contradictory.
  options = {
    valueType: 'number',
    validValues: ['bob', 'joe', 'sam'],
    isValidValue: function (value) {
      return value.length === 4;
    }
  };
  window.assert && assert.throws(() => {
    property = new Property(0, options);
  }, 'invalid initial value with incompatible combination of validation options');
  window.assert && assert.throws(() => {
    property = new Property('bob', options);
  }, 'invalid initial value with incompatible combination of validation options');
  window.assert && assert.throws(() => {
    property = new Property('fred', options);
  }, 'invalid initial value with incompatible combination of validation options');
  assert.ok(true, 'so we have at least 1 test in this set');
});
QUnit.test('reentrantNotificationStrategy', assert => {
  assert.ok(new Property('hi')['tinyProperty']['reentrantNotificationStrategy'] === 'queue', 'default notification strategy for Property should be "queue"');

  ////////////////////////////////////////////
  // queue
  let queueCount = 2; // starts as a value of 1, so 2 is the first value we change to.

  // queue is default
  const queueProperty = new Property(1, {
    reentrantNotificationStrategy: 'queue',
    reentrant: true
  });
  queueProperty.lazyLink(value => {
    if (value < 10) {
      queueProperty.value = value + 1;
    }
  });

  // notify-queue:
  // 1->2
  // 2->3
  // 3->4
  // ...
  // 8->9

  queueProperty.lazyLink((value, oldValue) => {
    assert.ok(value === oldValue + 1, `increment each time: ${oldValue} -> ${value}`);
    assert.ok(value === queueCount++, `increment by most recent changed: ${queueCount - 2}->${queueCount - 1}, received: ${oldValue} -> ${value}`);
  });
  queueProperty.value = queueCount;
  let stackCount = 2; // starts as a value of 1, so 2 is the first value we change to.
  const finalCount = 10;
  let lastListenerCount = 10;
  ////////////////////////////////////////////

  ////////////////////////////////////////////
  // stack
  const stackProperty = new Property(stackCount - 1, {
    reentrantNotificationStrategy: 'stack',
    reentrant: true
  });
  stackProperty.lazyLink(value => {
    if (value < finalCount) {
      stackProperty.value = value + 1;
    }
  });

  // stack-notify:
  // 8->9
  // 7->8
  // 6->7
  // ...
  // 1->2
  stackProperty.lazyLink((value, oldValue) => {
    stackCount++;
    assert.ok(value === oldValue + 1, `increment each time: ${oldValue} -> ${value}`);
    assert.ok(value === lastListenerCount--, `increment in order expected: ${lastListenerCount}->${lastListenerCount + 1}, received: ${oldValue} -> ${value}`);
    assert.ok(oldValue === lastListenerCount, `new count is ${lastListenerCount}: the oldValue (most recent first in stack first`);
  });
  stackProperty.value = stackCount;
  //////////////////////////////////////////////////
});
QUnit.test('options.valueComparisonStrategy', assert => {
  let calledCount = 0;
  let myProperty = new Property(new Vector2(0, 0), {
    valueComparisonStrategy: 'equalsFunction'
  });
  myProperty.lazyLink(() => calledCount++);
  myProperty.value = new Vector2(0, 0);
  assert.ok(calledCount === 0, 'equal');
  myProperty.value = new Vector2(0, 3);
  assert.ok(calledCount === 1, 'not equal');
  calledCount = 0;
  myProperty = new Property(new Vector2(0, 0), {
    valueComparisonStrategy: 'lodashDeep'
  });
  myProperty.lazyLink(() => calledCount++);
  myProperty.value = {
    something: 'hi'
  };
  assert.ok(calledCount === 1, 'not equal');
  myProperty.value = {
    something: 'hi'
  };
  assert.ok(calledCount === 1, 'equal');
  myProperty.value = {
    something: 'hi',
    other: false
  };
  assert.ok(calledCount === 2, 'not equal with other key');
});

// Tests that can only run in phet-io mode
if (Tandem.PHET_IO_ENABLED) {
  QUnit.test('Test PropertyIO toStateObject/fromStateObject', assert => {
    const done = assert.async();
    const tandem = Tandem.ROOT_TEST.createTandem('testTandemProperty');
    const phetioType = NumberProperty.NumberPropertyIO;
    const propertyValue = 123;
    const validValues = [0, 1, 2, 3, propertyValue];

    // @ts-expect-error redefining function for testing
    tandem.addPhetioObject = function (instance, options) {
      // PhET-iO operates under the assumption that nothing will access a PhetioObject until the next animation frame
      // when the object is fully constructed.  For example, Property state variables are set after the callback
      // to addPhetioObject, which occurs during Property.constructor.super().
      setTimeout(() => {
        // eslint-disable-line bad-sim-text

        // Run in the next frame after the object finished getting constructed
        const stateObject = phetioType.toStateObject(instance);
        assert.equal(stateObject.value, propertyValue, 'toStateObject should match');
        assert.deepEqual(stateObject.validValues, validValues, 'toStateObject should match');
        done();
      }, 0);
    };
    new NumberProperty(propertyValue, {
      // eslint-disable-line no-new
      tandem: tandem,
      validValues: validValues
    });
  });
  QUnit.test('propertyStateHandlerSingleton tests for Property', assert => {
    const parentTandem = Tandem.ROOT_TEST;
    const originalOrderDependencyLength = propertyStateHandlerSingleton.getNumberOfOrderDependencies();
    const getOrderDependencyLength = () => propertyStateHandlerSingleton.getNumberOfOrderDependencies() - originalOrderDependencyLength;
    const firstProperty = new Property(1, {
      tandem: parentTandem.createTandem('firstProperty'),
      phetioValueType: NumberIO
    });
    const secondProperty = new Property(1, {
      tandem: parentTandem.createTandem('secondProperty'),
      phetioValueType: NumberIO
    });
    propertyStateHandlerSingleton.registerPhetioOrderDependency(firstProperty, PropertyStatePhase.NOTIFY, secondProperty, PropertyStatePhase.UNDEFER);
    firstProperty.dispose();
    assert.ok(getOrderDependencyLength() === 0, 'dispose removes order dependency');
    const thirdProperty = new Property(1, {
      tandem: parentTandem.createTandem('thirdProperty'),
      phetioValueType: NumberIO
    });
    secondProperty.link(() => {
      thirdProperty.value = 2;
    }, {
      phetioDependencies: [thirdProperty]
    });
    assert.ok(getOrderDependencyLength() === 1, 'just added orderDependency from phetioDependencies');
    secondProperty.dispose();
    assert.ok(getOrderDependencyLength() === 0, 'dispose removes order dependency');
    thirdProperty.dispose();
  });
}
///////////////////////////////
// END PHET_IO ONLY TESTS
///////////////////////////////
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUYW5kZW0iLCJOdW1iZXJJTyIsIk11bHRpbGluayIsIk51bWJlclByb3BlcnR5IiwiUHJvcGVydHkiLCJwcm9wZXJ0eVN0YXRlSGFuZGxlclNpbmdsZXRvbiIsIlByb3BlcnR5U3RhdGVQaGFzZSIsIlZlY3RvcjIiLCJRVW5pdCIsIm1vZHVsZSIsInRlc3QiLCJhc3NlcnQiLCJwcm9wZXJ0eSIsInN0YXJ0aW5nUExpc3RlbmVyQ291bnQiLCJhIiwiXyIsIm5vb3AiLCJiIiwiYyIsImxpbmsiLCJlcXVhbCIsInVubGluayIsIm9rIiwiaGFzTGlzdGVuZXIiLCJhUHJvcGVydHkiLCJiUHJvcGVydHkiLCJjYWxsYmFja3MiLCJtdWx0aWxpbmsiLCJsYXp5TXVsdGlsaW5rIiwibGF6eUxpbmsiLCJuZXdWYWx1ZSIsIm9sZFZhbHVlIiwic2V0RGVmZXJyZWQiLCJ2YWx1ZSIsInVwZGF0ZSIsImNhbGxzIiwicHVzaCIsImxlbmd0aCIsInN0YXRlIiwiYWdlIiwibGlzdGVuZXIiLCJUZXN0VHlwZSIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsInZhbHVlVHlwZSIsIndpbmRvdyIsInRocm93cyIsInNldCIsInZhbGlkVmFsdWVzIiwiaXNWYWxpZFZhbHVlIiwicXVldWVDb3VudCIsInF1ZXVlUHJvcGVydHkiLCJyZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneSIsInJlZW50cmFudCIsInN0YWNrQ291bnQiLCJmaW5hbENvdW50IiwibGFzdExpc3RlbmVyQ291bnQiLCJzdGFja1Byb3BlcnR5IiwiY2FsbGVkQ291bnQiLCJteVByb3BlcnR5IiwidmFsdWVDb21wYXJpc29uU3RyYXRlZ3kiLCJzb21ldGhpbmciLCJvdGhlciIsIlBIRVRfSU9fRU5BQkxFRCIsImRvbmUiLCJhc3luYyIsInRhbmRlbSIsIlJPT1RfVEVTVCIsImNyZWF0ZVRhbmRlbSIsInBoZXRpb1R5cGUiLCJOdW1iZXJQcm9wZXJ0eUlPIiwicHJvcGVydHlWYWx1ZSIsImFkZFBoZXRpb09iamVjdCIsImluc3RhbmNlIiwic2V0VGltZW91dCIsInN0YXRlT2JqZWN0IiwidG9TdGF0ZU9iamVjdCIsImRlZXBFcXVhbCIsInBhcmVudFRhbmRlbSIsIm9yaWdpbmFsT3JkZXJEZXBlbmRlbmN5TGVuZ3RoIiwiZ2V0TnVtYmVyT2ZPcmRlckRlcGVuZGVuY2llcyIsImdldE9yZGVyRGVwZW5kZW5jeUxlbmd0aCIsImZpcnN0UHJvcGVydHkiLCJwaGV0aW9WYWx1ZVR5cGUiLCJzZWNvbmRQcm9wZXJ0eSIsInJlZ2lzdGVyUGhldGlvT3JkZXJEZXBlbmRlbmN5IiwiTk9USUZZIiwiVU5ERUZFUiIsImRpc3Bvc2UiLCJ0aGlyZFByb3BlcnR5IiwicGhldGlvRGVwZW5kZW5jaWVzIl0sInNvdXJjZXMiOlsiUHJvcGVydHlUZXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBRVW5pdCB0ZXN0cyBmb3IgUHJvcGVydHlcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgTnVtYmVySU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL051bWJlcklPLmpzJztcclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBOdW1iZXJQcm9wZXJ0eSBmcm9tICcuL051bWJlclByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4vUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgcHJvcGVydHlTdGF0ZUhhbmRsZXJTaW5nbGV0b24gZnJvbSAnLi9wcm9wZXJ0eVN0YXRlSGFuZGxlclNpbmdsZXRvbi5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eVN0YXRlUGhhc2UgZnJvbSAnLi9Qcm9wZXJ0eVN0YXRlUGhhc2UuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdQcm9wZXJ0eScgKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IHVubGluaycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDEgKTtcclxuICBjb25zdCBzdGFydGluZ1BMaXN0ZW5lckNvdW50ID0gcHJvcGVydHlbICdnZXRMaXN0ZW5lckNvdW50JyBdKCk7XHJcbiAgY29uc3QgYSA9IGZ1bmN0aW9uKCBhOiB1bmtub3duICkgeyBfLm5vb3A7IH07XHJcbiAgY29uc3QgYiA9IGZ1bmN0aW9uKCBiOiB1bmtub3duICkgeyBfLm5vb3A7IH07XHJcbiAgY29uc3QgYyA9IGZ1bmN0aW9uKCBjOiB1bmtub3duICkgeyBfLm5vb3A7IH07XHJcbiAgcHJvcGVydHkubGluayggYSApO1xyXG4gIHByb3BlcnR5LmxpbmsoIGIgKTtcclxuICBwcm9wZXJ0eS5saW5rKCBjICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBwcm9wZXJ0eVsgJ2dldExpc3RlbmVyQ291bnQnIF0oKSwgMyArIHN0YXJ0aW5nUExpc3RlbmVyQ291bnQsICdzaG91bGQgaGF2ZSAzIG9ic2VydmVycyBub3cnICk7XHJcbiAgcHJvcGVydHkudW5saW5rKCBiICk7XHJcbiAgYXNzZXJ0Lm9rKCBwcm9wZXJ0eS5oYXNMaXN0ZW5lciggYSApLCAnc2hvdWxkIGhhdmUgcmVtb3ZlZCBiJyApO1xyXG4gIGFzc2VydC5vayggcHJvcGVydHkuaGFzTGlzdGVuZXIoIGMgKSwgJ3Nob3VsZCBoYXZlIHJlbW92ZWQgYicgKTtcclxuICBhc3NlcnQuZXF1YWwoIHByb3BlcnR5WyAnZ2V0TGlzdGVuZXJDb3VudCcgXSgpLCAyICsgc3RhcnRpbmdQTGlzdGVuZXJDb3VudCwgJ3Nob3VsZCBoYXZlIHJlbW92ZWQgYW4gaXRlbScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgTXVsdGlsaW5rLm11bHRpbGluaycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgYVByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAxICk7XHJcbiAgY29uc3QgYlByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAyICk7XHJcbiAgbGV0IGNhbGxiYWNrcyA9IDA7XHJcbiAgTXVsdGlsaW5rLm11bHRpbGluayggWyBhUHJvcGVydHksIGJQcm9wZXJ0eSBdLCAoIGEsIGIgKSA9PiB7XHJcbiAgICBjYWxsYmFja3MrKztcclxuICAgIGFzc2VydC5lcXVhbCggYSwgMSwgJ2ZpcnN0IHZhbHVlIHNob3VsZCBwYXNzIHRocm91Z2gnICk7XHJcbiAgICBhc3NlcnQuZXF1YWwoIGIsIDIsICdzZWNvbmQgdmFsdWUgc2hvdWxkIHBhc3MgdGhyb3VnaCcgKTtcclxuICB9ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjYWxsYmFja3MsIDEsICdzaG91bGQgaGF2ZSBjYWxsZWQgYmFjayB0byBhIG11bHRpbGluaycgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgTXVsdGlsaW5rLmxhenlNdWx0aWxpbmsnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGFQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggMSApO1xyXG4gIGNvbnN0IGJQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggMiApO1xyXG4gIGxldCBjYWxsYmFja3MgPSAwO1xyXG4gIE11bHRpbGluay5sYXp5TXVsdGlsaW5rKCBbIGFQcm9wZXJ0eSwgYlByb3BlcnR5IF0sICggYSwgYiApID0+IHtcclxuICAgIGNhbGxiYWNrcysrO1xyXG4gICAgYXNzZXJ0LmVxdWFsKCBhLCAxICk7XHJcbiAgICBhc3NlcnQuZXF1YWwoIGIsIDIgKTtcclxuICB9ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjYWxsYmFja3MsIDAsICdzaG91bGQgbm90IGNhbGwgYmFjayB0byBhIGxhenkgbXVsdGlsaW5rJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnVGVzdCBkZWZlcicsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDAgKTtcclxuICBsZXQgY2FsbGJhY2tzID0gMDtcclxuICBwcm9wZXJ0eS5sYXp5TGluayggKCBuZXdWYWx1ZSwgb2xkVmFsdWUgKSA9PiB7XHJcbiAgICBjYWxsYmFja3MrKztcclxuICAgIGFzc2VydC5lcXVhbCggbmV3VmFsdWUsIDIsICduZXdWYWx1ZSBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlIGFmdGVyIHRoZSB0cmFuc2FjdGlvbicgKTtcclxuICAgIGFzc2VydC5lcXVhbCggb2xkVmFsdWUsIDAsICdvbGRWYWx1ZSBzaG91bGQgYmUgdGhlIG9yaWdpbmFsIHZhbHVlIGJlZm9yZSB0aGUgdHJhbnNhY3Rpb24nICk7XHJcbiAgfSApO1xyXG4gIHByb3BlcnR5LnNldERlZmVycmVkKCB0cnVlICk7XHJcbiAgcHJvcGVydHkudmFsdWUgPSAxO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gMjtcclxuICBhc3NlcnQuZXF1YWwoIHByb3BlcnR5LnZhbHVlLCAwLCAnc2hvdWxkIGhhdmUgb3JpZ2luYWwgdmFsdWUnICk7XHJcbiAgY29uc3QgdXBkYXRlID0gcHJvcGVydHkuc2V0RGVmZXJyZWQoIGZhbHNlICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBjYWxsYmFja3MsIDAsICdzaG91bGQgbm90IGNhbGwgYmFjayB3aGlsZSBkZWZlcnJlZCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIHByb3BlcnR5LnZhbHVlLCAyLCAnc2hvdWxkIGhhdmUgbmV3IHZhbHVlJyApO1xyXG5cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yIC5zZXREZWZlcnJlZChmYWxzZSkgd2lsbCBhbHdheXMgcmV0dXJuICgpID0+IHZvaWRcclxuICB1cGRhdGUoKTtcclxuICBhc3NlcnQuZXF1YWwoIGNhbGxiYWNrcywgMSwgJ3Nob3VsZCBoYXZlIGJlZW4gY2FsbGVkIGJhY2sgYWZ0ZXIgdXBkYXRlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggcHJvcGVydHkudmFsdWUsIDIsICdzaG91bGQgdGFrZSBmaW5hbCB2YWx1ZScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Byb3BlcnR5IElEIGNoZWNrcycsIGFzc2VydCA9PiB7XHJcbiAgYXNzZXJ0Lm9rKCBuZXcgUHJvcGVydHkoIDEgKVsgJ2lkJyBdICE9PSBuZXcgUHJvcGVydHkoIDEgKVsgJ2lkJyBdLCAnUHJvcGVydGllcyBzaG91bGQgaGF2ZSB1bmlxdWUgSURzJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxyXG59ICk7XHJcblxyXG50eXBlIGNhbGxWYWx1ZXMgPSB7XHJcbiAgbmV3VmFsdWU6IG51bWJlcjtcclxuICBvbGRWYWx1ZTogbnVtYmVyIHwgbnVsbDtcclxuICBwcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPjtcclxufTtcclxuXHJcblFVbml0LnRlc3QoICdQcm9wZXJ0eSBsaW5rIHBhcmFtZXRlcnMnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAxICk7XHJcbiAgY29uc3QgY2FsbHM6IEFycmF5PGNhbGxWYWx1ZXM+ID0gW107XHJcbiAgcHJvcGVydHkubGluayggKCBuZXdWYWx1ZSwgb2xkVmFsdWUsIHByb3BlcnR5ICkgPT4ge1xyXG4gICAgY2FsbHMucHVzaCgge1xyXG4gICAgICBuZXdWYWx1ZTogbmV3VmFsdWUsXHJcbiAgICAgIG9sZFZhbHVlOiBvbGRWYWx1ZSxcclxuICAgICAgcHJvcGVydHk6IHByb3BlcnR5XHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gMjtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBjYWxscy5sZW5ndGggPT09IDIgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBjYWxsc1sgMCBdLm5ld1ZhbHVlID09PSAxICk7XHJcbiAgYXNzZXJ0Lm9rKCBjYWxsc1sgMCBdLm9sZFZhbHVlID09PSBudWxsICk7XHJcbiAgYXNzZXJ0Lm9rKCBjYWxsc1sgMCBdLnByb3BlcnR5ID09PSBwcm9wZXJ0eSApO1xyXG5cclxuICBhc3NlcnQub2soIGNhbGxzWyAxIF0ubmV3VmFsdWUgPT09IDIgKTtcclxuICBhc3NlcnQub2soIGNhbGxzWyAxIF0ub2xkVmFsdWUgPT09IDEgKTtcclxuICBhc3NlcnQub2soIGNhbGxzWyAxIF0ucHJvcGVydHkgPT09IHByb3BlcnR5ICk7XHJcbn0gKTtcclxuXHJcbi8qKlxyXG4gKiBNYWtlIHN1cmUgbGlua2luZyBhdHRyaWJ1dGVzIGFuZCB1bmxpbmtpbmcgYXR0cmlidXRlcyB3b3JrcyBvbiBQcm9wZXJ0eVxyXG4gKi9cclxuUVVuaXQudGVzdCggJ1Byb3BlcnR5LmxpbmtBdHRyaWJ1dGUnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCA3ICk7XHJcbiAgY29uc3Qgc3RhdGUgPSB7IGFnZTogOTkgfTtcclxuICBjb25zdCBsaXN0ZW5lciA9ICggYWdlOiBudW1iZXIgKSA9PiB7XHJcbiAgICBzdGF0ZS5hZ2UgPSBhZ2U7XHJcbiAgfTtcclxuICBwcm9wZXJ0eS5saW5rKCBsaXN0ZW5lciApO1xyXG4gIGFzc2VydC5lcXVhbCggc3RhdGUuYWdlLCA3LCAnbGluayBzaG91bGQgc3luY2hyb25pemUgdmFsdWVzJyApO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gODtcclxuICBhc3NlcnQuZXF1YWwoIHN0YXRlLmFnZSwgOCwgJ2xpbmsgc2hvdWxkIHVwZGF0ZSB2YWx1ZXMnICk7XHJcbiAgcHJvcGVydHkudW5saW5rKCBsaXN0ZW5lciApO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gOTtcclxuICBhc3NlcnQuZXF1YWwoIHN0YXRlLmFnZSwgOCwgJ3N0YXRlIHNob3VsZCBub3QgaGF2ZSBjaGFuZ2VkIGFmdGVyIHVubGluaycgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Byb3BlcnR5IHZhbHVlIHZhbGlkYXRpb24nLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyBUeXBlIHRoYXQgaXMgc3BlY2lmaWMgdG8gdmFsdWVUeXBlIHRlc3RzXHJcbiAgY2xhc3MgVGVzdFR5cGUge1xyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKCkgeyBfLm5vb3AoKTsgfVxyXG4gIH1cclxuXHJcbiAgbGV0IHByb3BlcnR5OiBJbnRlbnRpb25hbEFueSA9IG51bGw7XHJcbiAgbGV0IG9wdGlvbnMgPSB7fTtcclxuXHJcbiAgLy8gdmFsdWVUeXBlIGlzIGEgcHJpbWl0aXZlIHR5cGUgKHR5cGVvZiB2YWxpZGF0aW9uKVxyXG4gIG9wdGlvbnMgPSB7XHJcbiAgICB2YWx1ZVR5cGU6ICdzdHJpbmcnXHJcbiAgfTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIG5ldyBQcm9wZXJ0eSggMCwgeyB2YWx1ZVR5cGU6ICdmb28nIH0gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXdcclxuICB9LCAnb3B0aW9ucy52YWx1ZVR5cGUgaXMgaW52YWxpZCwgZXhwZWN0ZWQgYSBwcmltaXRpdmUgZGF0YSB0eXBlJyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgbmV3IFByb3BlcnR5KCAwLCBvcHRpb25zICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3XHJcbiAgfSwgJ2ludmFsaWQgaW5pdGlhbCB2YWx1ZSB3aXRoIG9wdGlvbnMudmFsdWVUeXBlIHR5cGVvZiB2YWxpZGF0aW9uJyApO1xyXG4gIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAnaG9yaXpvbnRhbCcsIG9wdGlvbnMgKTtcclxuICBwcm9wZXJ0eS5zZXQoICd2ZXJ0aWNhbCcgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5LnNldCggMCApO1xyXG4gIH0sICdpbnZhbGlkIHNldCB2YWx1ZSB3aXRoIG9wdGlvbnMudmFsdWVUeXBlIHR5cGVvZiB2YWxpZGF0aW9uJyApO1xyXG5cclxuICAvLyB2YWx1ZVR5cGUgaXMgYSBjb25zdHJ1Y3RvciAoaW5zdGFuY2VvZiB2YWxpZGF0aW9uKVxyXG4gIG9wdGlvbnMgPSB7XHJcbiAgICB2YWx1ZVR5cGU6IFRlc3RUeXBlXHJcbiAgfTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIG5ldyBQcm9wZXJ0eSggMCwgb3B0aW9ucyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ld1xyXG4gIH0sICdpbnZhbGlkIGluaXRpYWwgdmFsdWUgZm9yIG9wdGlvbnMudmFsdWVUeXBlIGluc3RhbmNlb2YgdmFsaWRhdGlvbicgKTtcclxuICBwcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggbmV3IFRlc3RUeXBlKCksIG9wdGlvbnMgKTtcclxuICBwcm9wZXJ0eS5zZXQoIG5ldyBUZXN0VHlwZSgpICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eS5zZXQoIDAgKTtcclxuICB9LCAnaW52YWxpZCBzZXQgdmFsdWUgd2l0aCBvcHRpb25zLnZhbHVlVHlwZSBpbnN0YW5jZW9mIHZhbGlkYXRpb24nICk7XHJcblxyXG4gIC8vIHZhbGlkVmFsdWVzXHJcbiAgb3B0aW9ucyA9IHtcclxuICAgIHZhbGlkVmFsdWVzOiBbIDEsIDIsIDMgXVxyXG4gIH07XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBJTlRFTlRJT05BTCB2YWx1ZSBpcyBpbnZhbGlkIGZvciB0ZXN0aW5nXHJcbiAgICBuZXcgUHJvcGVydHkoIDAsIHsgdmFsaWRWYWx1ZXM6IDAgfSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ld1xyXG4gIH0sICdvcHRpb25zLnZhbGlkVmFsdWVzIGlzIGludmFsaWQnICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBuZXcgUHJvcGVydHkoIDAsIG9wdGlvbnMgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXdcclxuICB9LCAnaW52YWxpZCBpbml0aWFsIHZhbHVlIHdpdGggb3B0aW9ucy52YWxpZFZhbHVlcycgKTtcclxuICBwcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggMSwgb3B0aW9ucyApO1xyXG4gIHByb3BlcnR5LnNldCggMyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkuc2V0KCA0ICk7XHJcbiAgfSwgJ2ludmFsaWQgc2V0IHZhbHVlIHdpdGggb3B0aW9ucy52YWxpZFZhbHVlcycgKTtcclxuXHJcbiAgLy8gaXNWYWxpZFZhbHVlc1xyXG4gIG9wdGlvbnMgPSB7XHJcbiAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgICByZXR1cm4gKCB2YWx1ZSA+IDAgJiYgdmFsdWUgPCA0ICk7XHJcbiAgICB9XHJcbiAgfTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIElOVEVOVElPTkFMIHZhbHVlIGlzIGludmFsaWQgZm9yIHRlc3RpbmdcclxuICAgIG5ldyBQcm9wZXJ0eSggMCwgeyBpc1ZhbGlkVmFsdWU6IDAgfSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ld1xyXG4gIH0sICdvcHRpb25zLmlzVmFsaWRWYWx1ZSBpcyBpbnZhbGlkJyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgbmV3IFByb3BlcnR5KCAwLCBvcHRpb25zICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3XHJcbiAgfSwgJ2ludmFsaWQgaW5pdGlhbCB2YWx1ZSB3aXRoIG9wdGlvbnMuaXNWYWxpZFZhbHVlJyApO1xyXG4gIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAxLCBvcHRpb25zICk7XHJcbiAgcHJvcGVydHkuc2V0KCAzICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eS5zZXQoIDQgKTtcclxuICB9LCAnaW52YWxpZCBzZXQgdmFsdWUgd2l0aCBvcHRpb25zLmlzVmFsaWRWYWx1ZScgKTtcclxuXHJcbiAgLy8gQ29tcGF0aWJsZSBjb21iaW5hdGlvbnMgb2YgdmFsaWRhdGlvbiBvcHRpb25zLCBwb3NzaWJseSByZWR1bmRhbnQgKG5vdCBleGhhdXN0aXZlKVxyXG4gIG9wdGlvbnMgPSB7XHJcbiAgICB2YWx1ZVR5cGU6ICdzdHJpbmcnLFxyXG4gICAgdmFsaWRWYWx1ZXM6IFsgJ2JvYicsICdqb2UnLCAnc2FtJyBdLFxyXG4gICAgaXNWYWxpZFZhbHVlOiBmdW5jdGlvbiggdmFsdWU6IHN0cmluZyApIHtcclxuICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCA9PT0gMztcclxuICAgIH1cclxuICB9O1xyXG4gIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAnYm9iJywgb3B0aW9ucyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkuc2V0KCAwICk7XHJcbiAgfSwgJ2ludmFsaWQgc2V0IHZhbHVlIHdpdGggY29tcGF0aWJsZSBjb21iaW5hdGlvbiBvZiB2YWxpZGF0aW9uIG9wdGlvbnMnICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eS5zZXQoICd0ZWQnICk7XHJcbiAgfSwgJ2ludmFsaWQgc2V0IHZhbHVlIHdpdGggY29tcGF0aWJsZSBjb21iaW5hdGlvbiBvZiB2YWxpZGF0aW9uIG9wdGlvbnMnICk7XHJcblxyXG4gIC8vIEluY29tcGF0aWJsZSBjb21iaW5hdGlvbnMgb2YgdmFsaWRhdGlvbiBvcHRpb25zIChub3QgZXhoYXVzdGl2ZSlcclxuICAvLyBUaGVzZSB0ZXN0cyB3aWxsIGFsd2F5cyBmYWlsIG9uIGluaXRpYWxpemF0aW9uLCBzaW5jZSB0aGUgdmFsaWRhdGlvbiBjcml0ZXJpYSBhcmUgY29udHJhZGljdG9yeS5cclxuICBvcHRpb25zID0ge1xyXG4gICAgdmFsdWVUeXBlOiAnbnVtYmVyJyxcclxuICAgIHZhbGlkVmFsdWVzOiBbICdib2InLCAnam9lJywgJ3NhbScgXSxcclxuICAgIGlzVmFsaWRWYWx1ZTogZnVuY3Rpb24oIHZhbHVlOiBzdHJpbmcgKSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGggPT09IDQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAwLCBvcHRpb25zICk7XHJcbiAgfSwgJ2ludmFsaWQgaW5pdGlhbCB2YWx1ZSB3aXRoIGluY29tcGF0aWJsZSBjb21iaW5hdGlvbiBvZiB2YWxpZGF0aW9uIG9wdGlvbnMnICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggJ2JvYicsIG9wdGlvbnMgKTtcclxuICB9LCAnaW52YWxpZCBpbml0aWFsIHZhbHVlIHdpdGggaW5jb21wYXRpYmxlIGNvbWJpbmF0aW9uIG9mIHZhbGlkYXRpb24gb3B0aW9ucycgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAnZnJlZCcsIG9wdGlvbnMgKTtcclxuICB9LCAnaW52YWxpZCBpbml0aWFsIHZhbHVlIHdpdGggaW5jb21wYXRpYmxlIGNvbWJpbmF0aW9uIG9mIHZhbGlkYXRpb24gb3B0aW9ucycgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCB0cnVlLCAnc28gd2UgaGF2ZSBhdCBsZWFzdCAxIHRlc3QgaW4gdGhpcyBzZXQnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdyZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneScsIGFzc2VydCA9PiB7XHJcbiAgYXNzZXJ0Lm9rKCBuZXcgUHJvcGVydHkoICdoaScgKVsgJ3RpbnlQcm9wZXJ0eScgXVsgJ3JlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5JyBdID09PSAncXVldWUnLFxyXG4gICAgJ2RlZmF1bHQgbm90aWZpY2F0aW9uIHN0cmF0ZWd5IGZvciBQcm9wZXJ0eSBzaG91bGQgYmUgXCJxdWV1ZVwiJyApO1xyXG5cclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIC8vIHF1ZXVlXHJcbiAgbGV0IHF1ZXVlQ291bnQgPSAyOyAvLyBzdGFydHMgYXMgYSB2YWx1ZSBvZiAxLCBzbyAyIGlzIHRoZSBmaXJzdCB2YWx1ZSB3ZSBjaGFuZ2UgdG8uXHJcblxyXG4gIC8vIHF1ZXVlIGlzIGRlZmF1bHRcclxuICBjb25zdCBxdWV1ZVByb3BlcnR5ID0gbmV3IFByb3BlcnR5PG51bWJlcj4oIDEsIHtcclxuICAgIHJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5OiAncXVldWUnLFxyXG4gICAgcmVlbnRyYW50OiB0cnVlXHJcbiAgfSApO1xyXG5cclxuICBxdWV1ZVByb3BlcnR5LmxhenlMaW5rKCB2YWx1ZSA9PiB7XHJcbiAgICBpZiAoIHZhbHVlIDwgMTAgKSB7XHJcbiAgICAgIHF1ZXVlUHJvcGVydHkudmFsdWUgPSB2YWx1ZSArIDE7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICAvLyBub3RpZnktcXVldWU6XHJcbiAgLy8gMS0+MlxyXG4gIC8vIDItPjNcclxuICAvLyAzLT40XHJcbiAgLy8gLi4uXHJcbiAgLy8gOC0+OVxyXG5cclxuICBxdWV1ZVByb3BlcnR5LmxhenlMaW5rKCAoIHZhbHVlLCBvbGRWYWx1ZSApID0+IHtcclxuICAgIGFzc2VydC5vayggdmFsdWUgPT09IG9sZFZhbHVlICsgMSwgYGluY3JlbWVudCBlYWNoIHRpbWU6ICR7b2xkVmFsdWV9IC0+ICR7dmFsdWV9YCApO1xyXG4gICAgYXNzZXJ0Lm9rKCB2YWx1ZSA9PT0gcXVldWVDb3VudCsrLCBgaW5jcmVtZW50IGJ5IG1vc3QgcmVjZW50IGNoYW5nZWQ6ICR7cXVldWVDb3VudCAtIDJ9LT4ke3F1ZXVlQ291bnQgLSAxfSwgcmVjZWl2ZWQ6ICR7b2xkVmFsdWV9IC0+ICR7dmFsdWV9YCApO1xyXG4gIH0gKTtcclxuICBxdWV1ZVByb3BlcnR5LnZhbHVlID0gcXVldWVDb3VudDtcclxuXHJcbiAgbGV0IHN0YWNrQ291bnQgPSAyOyAvLyBzdGFydHMgYXMgYSB2YWx1ZSBvZiAxLCBzbyAyIGlzIHRoZSBmaXJzdCB2YWx1ZSB3ZSBjaGFuZ2UgdG8uXHJcbiAgY29uc3QgZmluYWxDb3VudCA9IDEwO1xyXG4gIGxldCBsYXN0TGlzdGVuZXJDb3VudCA9IDEwO1xyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgLy8gc3RhY2tcclxuICBjb25zdCBzdGFja1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5PG51bWJlcj4oIHN0YWNrQ291bnQgLSAxLCB7XHJcbiAgICByZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneTogJ3N0YWNrJyxcclxuICAgIHJlZW50cmFudDogdHJ1ZVxyXG4gIH0gKTtcclxuXHJcbiAgc3RhY2tQcm9wZXJ0eS5sYXp5TGluayggdmFsdWUgPT4ge1xyXG4gICAgaWYgKCB2YWx1ZSA8IGZpbmFsQ291bnQgKSB7XHJcbiAgICAgIHN0YWNrUHJvcGVydHkudmFsdWUgPSB2YWx1ZSArIDE7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICAvLyBzdGFjay1ub3RpZnk6XHJcbiAgLy8gOC0+OVxyXG4gIC8vIDctPjhcclxuICAvLyA2LT43XHJcbiAgLy8gLi4uXHJcbiAgLy8gMS0+MlxyXG4gIHN0YWNrUHJvcGVydHkubGF6eUxpbmsoICggdmFsdWUsIG9sZFZhbHVlICkgPT4ge1xyXG4gICAgc3RhY2tDb3VudCsrO1xyXG4gICAgYXNzZXJ0Lm9rKCB2YWx1ZSA9PT0gb2xkVmFsdWUgKyAxLCBgaW5jcmVtZW50IGVhY2ggdGltZTogJHtvbGRWYWx1ZX0gLT4gJHt2YWx1ZX1gICk7XHJcbiAgICBhc3NlcnQub2soIHZhbHVlID09PSBsYXN0TGlzdGVuZXJDb3VudC0tLCBgaW5jcmVtZW50IGluIG9yZGVyIGV4cGVjdGVkOiAke2xhc3RMaXN0ZW5lckNvdW50fS0+JHtsYXN0TGlzdGVuZXJDb3VudCArIDF9LCByZWNlaXZlZDogJHtvbGRWYWx1ZX0gLT4gJHt2YWx1ZX1gICk7XHJcbiAgICBhc3NlcnQub2soIG9sZFZhbHVlID09PSBsYXN0TGlzdGVuZXJDb3VudCwgYG5ldyBjb3VudCBpcyAke2xhc3RMaXN0ZW5lckNvdW50fTogdGhlIG9sZFZhbHVlIChtb3N0IHJlY2VudCBmaXJzdCBpbiBzdGFjayBmaXJzdGAgKTtcclxuICB9ICk7XHJcbiAgc3RhY2tQcm9wZXJ0eS52YWx1ZSA9IHN0YWNrQ291bnQ7XHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdvcHRpb25zLnZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5JywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgbGV0IGNhbGxlZENvdW50ID0gMDtcclxuICBsZXQgbXlQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eTxJbnRlbnRpb25hbEFueT4oIG5ldyBWZWN0b3IyKCAwLCAwICksIHtcclxuICAgIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5OiAnZXF1YWxzRnVuY3Rpb24nXHJcbiAgfSApO1xyXG4gIG15UHJvcGVydHkubGF6eUxpbmsoICgpID0+IGNhbGxlZENvdW50KysgKTtcclxuXHJcbiAgbXlQcm9wZXJ0eS52YWx1ZSA9IG5ldyBWZWN0b3IyKCAwLCAwICk7XHJcbiAgYXNzZXJ0Lm9rKCBjYWxsZWRDb3VudCA9PT0gMCwgJ2VxdWFsJyApO1xyXG4gIG15UHJvcGVydHkudmFsdWUgPSBuZXcgVmVjdG9yMiggMCwgMyApO1xyXG4gIGFzc2VydC5vayggY2FsbGVkQ291bnQgPT09IDEsICdub3QgZXF1YWwnICk7XHJcblxyXG4gIGNhbGxlZENvdW50ID0gMDtcclxuICBteVByb3BlcnR5ID0gbmV3IFByb3BlcnR5PEludGVudGlvbmFsQW55PiggbmV3IFZlY3RvcjIoIDAsIDAgKSwge1xyXG4gICAgdmFsdWVDb21wYXJpc29uU3RyYXRlZ3k6ICdsb2Rhc2hEZWVwJ1xyXG4gIH0gKTtcclxuICBteVByb3BlcnR5LmxhenlMaW5rKCAoKSA9PiBjYWxsZWRDb3VudCsrICk7XHJcblxyXG4gIG15UHJvcGVydHkudmFsdWUgPSB7IHNvbWV0aGluZzogJ2hpJyB9O1xyXG4gIGFzc2VydC5vayggY2FsbGVkQ291bnQgPT09IDEsICdub3QgZXF1YWwnICk7XHJcbiAgbXlQcm9wZXJ0eS52YWx1ZSA9IHsgc29tZXRoaW5nOiAnaGknIH07XHJcbiAgYXNzZXJ0Lm9rKCBjYWxsZWRDb3VudCA9PT0gMSwgJ2VxdWFsJyApO1xyXG4gIG15UHJvcGVydHkudmFsdWUgPSB7IHNvbWV0aGluZzogJ2hpJywgb3RoZXI6IGZhbHNlIH07XHJcbiAgYXNzZXJ0Lm9rKCBjYWxsZWRDb3VudCA9PT0gMiwgJ25vdCBlcXVhbCB3aXRoIG90aGVyIGtleScgKTtcclxufSApO1xyXG5cclxuLy8gVGVzdHMgdGhhdCBjYW4gb25seSBydW4gaW4gcGhldC1pbyBtb2RlXHJcbmlmICggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCApIHtcclxuICBRVW5pdC50ZXN0KCAnVGVzdCBQcm9wZXJ0eUlPIHRvU3RhdGVPYmplY3QvZnJvbVN0YXRlT2JqZWN0JywgYXNzZXJ0ID0+IHtcclxuICAgIGNvbnN0IGRvbmUgPSBhc3NlcnQuYXN5bmMoKTtcclxuICAgIGNvbnN0IHRhbmRlbSA9IFRhbmRlbS5ST09UX1RFU1QuY3JlYXRlVGFuZGVtKCAndGVzdFRhbmRlbVByb3BlcnR5JyApO1xyXG4gICAgY29uc3QgcGhldGlvVHlwZSA9IE51bWJlclByb3BlcnR5Lk51bWJlclByb3BlcnR5SU87XHJcbiAgICBjb25zdCBwcm9wZXJ0eVZhbHVlID0gMTIzO1xyXG4gICAgY29uc3QgdmFsaWRWYWx1ZXMgPSBbIDAsIDEsIDIsIDMsIHByb3BlcnR5VmFsdWUgXTtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHJlZGVmaW5pbmcgZnVuY3Rpb24gZm9yIHRlc3RpbmdcclxuICAgIHRhbmRlbS5hZGRQaGV0aW9PYmplY3QgPSBmdW5jdGlvbiggaW5zdGFuY2U6IE51bWJlclByb3BlcnR5LCBvcHRpb25zOiBJbnRlbnRpb25hbEFueSApOiB2b2lkIHtcclxuXHJcbiAgICAgIC8vIFBoRVQtaU8gb3BlcmF0ZXMgdW5kZXIgdGhlIGFzc3VtcHRpb24gdGhhdCBub3RoaW5nIHdpbGwgYWNjZXNzIGEgUGhldGlvT2JqZWN0IHVudGlsIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG4gICAgICAvLyB3aGVuIHRoZSBvYmplY3QgaXMgZnVsbHkgY29uc3RydWN0ZWQuICBGb3IgZXhhbXBsZSwgUHJvcGVydHkgc3RhdGUgdmFyaWFibGVzIGFyZSBzZXQgYWZ0ZXIgdGhlIGNhbGxiYWNrXHJcbiAgICAgIC8vIHRvIGFkZFBoZXRpb09iamVjdCwgd2hpY2ggb2NjdXJzIGR1cmluZyBQcm9wZXJ0eS5jb25zdHJ1Y3Rvci5zdXBlcigpLlxyXG4gICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcblxyXG4gICAgICAgIC8vIFJ1biBpbiB0aGUgbmV4dCBmcmFtZSBhZnRlciB0aGUgb2JqZWN0IGZpbmlzaGVkIGdldHRpbmcgY29uc3RydWN0ZWRcclxuICAgICAgICBjb25zdCBzdGF0ZU9iamVjdCA9IHBoZXRpb1R5cGUudG9TdGF0ZU9iamVjdCggaW5zdGFuY2UgKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoIHN0YXRlT2JqZWN0LnZhbHVlLCBwcm9wZXJ0eVZhbHVlLCAndG9TdGF0ZU9iamVjdCBzaG91bGQgbWF0Y2gnICk7XHJcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCggc3RhdGVPYmplY3QudmFsaWRWYWx1ZXMsIHZhbGlkVmFsdWVzLCAndG9TdGF0ZU9iamVjdCBzaG91bGQgbWF0Y2gnICk7XHJcbiAgICAgICAgZG9uZSgpO1xyXG4gICAgICB9LCAwICk7XHJcbiAgICB9O1xyXG4gICAgbmV3IE51bWJlclByb3BlcnR5KCBwcm9wZXJ0eVZhbHVlLCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3XHJcbiAgICAgIHRhbmRlbTogdGFuZGVtLFxyXG4gICAgICB2YWxpZFZhbHVlczogdmFsaWRWYWx1ZXNcclxuICAgIH0gKTtcclxuICB9ICk7XHJcblxyXG4gIFFVbml0LnRlc3QoICdwcm9wZXJ0eVN0YXRlSGFuZGxlclNpbmdsZXRvbiB0ZXN0cyBmb3IgUHJvcGVydHknLCBhc3NlcnQgPT4ge1xyXG4gICAgY29uc3QgcGFyZW50VGFuZGVtID0gVGFuZGVtLlJPT1RfVEVTVDtcclxuXHJcbiAgICBjb25zdCBvcmlnaW5hbE9yZGVyRGVwZW5kZW5jeUxlbmd0aCA9IHByb3BlcnR5U3RhdGVIYW5kbGVyU2luZ2xldG9uLmdldE51bWJlck9mT3JkZXJEZXBlbmRlbmNpZXMoKTtcclxuICAgIGNvbnN0IGdldE9yZGVyRGVwZW5kZW5jeUxlbmd0aCA9ICgpID0+IHByb3BlcnR5U3RhdGVIYW5kbGVyU2luZ2xldG9uLmdldE51bWJlck9mT3JkZXJEZXBlbmRlbmNpZXMoKSAtIG9yaWdpbmFsT3JkZXJEZXBlbmRlbmN5TGVuZ3RoO1xyXG5cclxuICAgIGNvbnN0IGZpcnN0UHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDEsIHtcclxuICAgICAgdGFuZGVtOiBwYXJlbnRUYW5kZW0uY3JlYXRlVGFuZGVtKCAnZmlyc3RQcm9wZXJ0eScgKSxcclxuICAgICAgcGhldGlvVmFsdWVUeXBlOiBOdW1iZXJJT1xyXG4gICAgfSApO1xyXG4gICAgY29uc3Qgc2Vjb25kUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDEsIHtcclxuICAgICAgdGFuZGVtOiBwYXJlbnRUYW5kZW0uY3JlYXRlVGFuZGVtKCAnc2Vjb25kUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb1ZhbHVlVHlwZTogTnVtYmVySU9cclxuICAgIH0gKTtcclxuXHJcbiAgICBwcm9wZXJ0eVN0YXRlSGFuZGxlclNpbmdsZXRvbi5yZWdpc3RlclBoZXRpb09yZGVyRGVwZW5kZW5jeSggZmlyc3RQcm9wZXJ0eSwgUHJvcGVydHlTdGF0ZVBoYXNlLk5PVElGWSwgc2Vjb25kUHJvcGVydHksIFByb3BlcnR5U3RhdGVQaGFzZS5VTkRFRkVSICk7XHJcblxyXG4gICAgZmlyc3RQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICBhc3NlcnQub2soIGdldE9yZGVyRGVwZW5kZW5jeUxlbmd0aCgpID09PSAwLCAnZGlzcG9zZSByZW1vdmVzIG9yZGVyIGRlcGVuZGVuY3knICk7XHJcblxyXG4gICAgY29uc3QgdGhpcmRQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggMSwge1xyXG4gICAgICB0YW5kZW06IHBhcmVudFRhbmRlbS5jcmVhdGVUYW5kZW0oICd0aGlyZFByb3BlcnR5JyApLFxyXG4gICAgICBwaGV0aW9WYWx1ZVR5cGU6IE51bWJlcklPXHJcbiAgICB9ICk7XHJcbiAgICBzZWNvbmRQcm9wZXJ0eS5saW5rKCAoKSA9PiB7IHRoaXJkUHJvcGVydHkudmFsdWUgPSAyO30sIHtcclxuICAgICAgcGhldGlvRGVwZW5kZW5jaWVzOiBbIHRoaXJkUHJvcGVydHkgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIGFzc2VydC5vayggZ2V0T3JkZXJEZXBlbmRlbmN5TGVuZ3RoKCkgPT09IDEsICdqdXN0IGFkZGVkIG9yZGVyRGVwZW5kZW5jeSBmcm9tIHBoZXRpb0RlcGVuZGVuY2llcycgKTtcclxuXHJcbiAgICBzZWNvbmRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICBhc3NlcnQub2soIGdldE9yZGVyRGVwZW5kZW5jeUxlbmd0aCgpID09PSAwLCAnZGlzcG9zZSByZW1vdmVzIG9yZGVyIGRlcGVuZGVuY3knICk7XHJcblxyXG4gICAgdGhpcmRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgfSApO1xyXG59XHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gRU5EIFBIRVRfSU8gT05MWSBURVNUU1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE1BQU0sTUFBTSwyQkFBMkI7QUFDOUMsT0FBT0MsUUFBUSxNQUFNLG1DQUFtQztBQUN4RCxPQUFPQyxTQUFTLE1BQU0sZ0JBQWdCO0FBQ3RDLE9BQU9DLGNBQWMsTUFBTSxxQkFBcUI7QUFDaEQsT0FBT0MsUUFBUSxNQUFNLGVBQWU7QUFDcEMsT0FBT0MsNkJBQTZCLE1BQU0sb0NBQW9DO0FBQzlFLE9BQU9DLGtCQUFrQixNQUFNLHlCQUF5QjtBQUd4RCxPQUFPQyxPQUFPLE1BQU0seUJBQXlCO0FBRTdDQyxLQUFLLENBQUNDLE1BQU0sQ0FBRSxVQUFXLENBQUM7QUFFMUJELEtBQUssQ0FBQ0UsSUFBSSxDQUFFLGFBQWEsRUFBRUMsTUFBTSxJQUFJO0VBQ25DLE1BQU1DLFFBQVEsR0FBRyxJQUFJUixRQUFRLENBQUUsQ0FBRSxDQUFDO0VBQ2xDLE1BQU1TLHNCQUFzQixHQUFHRCxRQUFRLENBQUUs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QUNtRSxTQUFTO0lBRXJDLE1BQU1ZLDZCQUE2QixHQUFHMUUsNkJBQTZCLENBQUMyRSw0QkFBNEIsQ0FBQyxDQUFDO0lBQ2xHLE1BQU1DLHdCQUF3QixHQUFHQSxDQUFBLEtBQU01RSw2QkFBNkIsQ0FBQzJFLDRCQUE0QixDQUFDLENBQUMsR0FBR0QsNkJBQTZCO0lBRW5JLE1BQU1HLGFBQWEsR0FBRyxJQUFJOUUsUUFBUSxDQUFFLENBQUMsRUFBRTtNQUNyQzhELE1BQU0sRUFBRVksWUFBWSxDQUFDVixZQUFZLENBQUUsZUFBZ0IsQ0FBQztNQUNwRGUsZUFBZSxFQUFFbEY7SUFDbkIsQ0FBRSxDQUFDO0lBQ0gsTUFBTW1GLGNBQWMsR0FBRyxJQUFJaEYsUUFBUSxDQUFFLENBQUMsRUFBRTtNQUN0QzhELE1BQU0sRUFBRVksWUFBWSxDQUFDVixZQUFZLENBQUUsZ0JBQWlCLENBQUM7TUFDckRlLGVBQWUsRUFBRWxGO0lBQ25CLENBQUUsQ0FBQztJQUVISSw2QkFBNkIsQ0FBQ2dGLDZCQUE2QixDQUFFSCxhQUFhLEVBQUU1RSxrQkFBa0IsQ0FBQ2dGLE1BQU0sRUFBRUYsY0FBYyxFQUFFOUUsa0JBQWtCLENBQUNpRixPQUFRLENBQUM7SUFFbkpMLGFBQWEsQ0FBQ00sT0FBTyxDQUFDLENBQUM7SUFDdkI3RSxNQUFNLENBQUNXLEVBQUUsQ0FBRTJELHdCQUF3QixDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsa0NBQW1DLENBQUM7SUFFakYsTUFBTVEsYUFBYSxHQUFHLElBQUlyRixRQUFRLENBQUUsQ0FBQyxFQUFFO01BQ3JDOEQsTUFBTSxFQUFFWSxZQUFZLENBQUNWLFlBQVksQ0FBRSxlQUFnQixDQUFDO01BQ3BEZSxlQUFlLEVBQUVsRjtJQUNuQixDQUFFLENBQUM7SUFDSG1GLGNBQWMsQ0FBQ2pFLElBQUksQ0FBRSxNQUFNO01BQUVzRSxhQUFhLENBQUN4RCxLQUFLLEdBQUcsQ0FBQztJQUFDLENBQUMsRUFBRTtNQUN0RHlELGtCQUFrQixFQUFFLENBQUVELGFBQWE7SUFDckMsQ0FBRSxDQUFDO0lBRUg5RSxNQUFNLENBQUNXLEVBQUUsQ0FBRTJELHdCQUF3QixDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsb0RBQXFELENBQUM7SUFFbkdHLGNBQWMsQ0FBQ0ksT0FBTyxDQUFDLENBQUM7SUFDeEI3RSxNQUFNLENBQUNXLEVBQUUsQ0FBRTJELHdCQUF3QixDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsa0NBQW1DLENBQUM7SUFFakZRLGFBQWEsQ0FBQ0QsT0FBTyxDQUFDLENBQUM7RUFDekIsQ0FBRSxDQUFDO0FBQ0w7QUFDQTtBQUNBO0FBQ0EiLCJpZ25vcmVMaXN0IjpbXX0=