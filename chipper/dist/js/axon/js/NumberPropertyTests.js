// Copyright 2017-2024, University of Colorado Boulder

/**
 * QUnit tests for NumberProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Range from '../../dot/js/Range.js';
import Tandem from '../../tandem/js/Tandem.js';
import NumberProperty, { DEFAULT_RANGE } from './NumberProperty.js';
import Property from './Property.js';
QUnit.module('NumberProperty');
QUnit.test('Test NumberProperty', assert => {
  assert.ok(true, 'one test needed when running without assertions');
  let property = new NumberProperty(42); // highly random, do not change

  // valueType
  window.assert && assert.throws(() => {
    // @ts-expect-error INTENTIONAL
    property = new NumberProperty('foo');
  }, 'initial value has invalid valueType');
  property = new NumberProperty(0);
  property.value = 1;
  window.assert && assert.throws(() => {
    // @ts-expect-error INTENTIONAL
    property.value = 'foo';
  }, 'set value has invalid valueType');

  // numberType
  property = new NumberProperty(0, {
    numberType: 'FloatingPoint'
  });
  property.value = 1;
  property.value = 1.2;
  window.assert && assert.throws(() => {
    property = new NumberProperty(1.2, {
      numberType: 'Integer'
    });
  }, 'initial value has invalid numberType');
  window.assert && assert.throws(() => {
    property = new NumberProperty(0, {
      numberType: 'Integer',
      validValues: [0, 1, 1.2, 2]
    });
  }, 'member of validValues has invalid numberType');
  property = new NumberProperty(0, {
    numberType: 'Integer'
  });
  property.value = 1;
  window.assert && assert.throws(() => {
    property.value = 1.2;
  }, 'set value has invalid numberType');

  // range
  window.assert && assert.throws(() => {
    // @ts-expect-error INTENTIONAL
    property = new NumberProperty(0, {
      range: [0, 10]
    });
  }, 'bad range');
  window.assert && assert.throws(() => {
    property = new NumberProperty(11, {
      range: new Range(0, 10)
    });
  }, 'initial value is greater than range.max');
  window.assert && assert.throws(() => {
    property = new NumberProperty(-1, {
      range: new Range(0, 10)
    });
  }, 'initial value is less than range.min');
  window.assert && assert.throws(() => {
    property = new NumberProperty(0, {
      range: new Range(0, 10),
      validValues: [0, 1, 2, 11]
    });
  }, 'member of validValues is greater than range.max');
  window.assert && assert.throws(() => {
    property = new NumberProperty(0, {
      range: new Range(0, 10),
      validValues: [-1, 0, 1, 2]
    });
  }, 'member of validValues is less than range.min');
  property = new NumberProperty(0, {
    range: new Range(0, 10)
  });
  property.value = 5;
  window.assert && assert.throws(() => {
    property.value = 11;
  }, 'set value is greater than range.max');
  window.assert && assert.throws(() => {
    property.value = -1;
  }, 'set value is less than range.min');

  // units
  window.assert && assert.throws(() => {
    property = new NumberProperty(0, {
      units: 'elephants'
    });
  }, 'bad units');

  ///////////////////////////////
  property = new NumberProperty(0, {
    range: new Range(0, 10)
  });
  property.rangeProperty.value = new Range(0, 100);
  property.value = 99;
  property.rangeProperty.value = new Range(90, 100);

  // This should not fail, but will until we support nested deferral for PhET-iO support, see https://github.com/phetsims/axon/issues/282
  // p.reset();

  ///////////////////////////////
  property = new NumberProperty(0, {
    range: new Range(0, 10)
  });
  property.value = 5;
  property.rangeProperty.value = new Range(4, 10);
  property.reset();
  assert.ok(property.value === 0, 'reset');
  assert.ok(property.rangeProperty.value.min === 0, 'reset range');
});
QUnit.test('Test NumberProperty range option as Property', assert => {
  let rangeProperty = new Property(new Range(0, 1));
  let property = new NumberProperty(4);

  // valueType
  window.assert && assert.throws(() => {
    // @ts-expect-error INTENTIONAL
    property = new NumberProperty(0, {
      range: 'hi'
    });
  }, 'incorrect range type');
  property = new NumberProperty(0, {
    range: rangeProperty
  });
  assert.ok(property.rangeProperty === rangeProperty, 'rangeProperty should be set');
  assert.ok(property.range === rangeProperty.value, 'rangeProperty value should be set NumberProperty.set on construction');
  property.value = 1;
  property.value = 0;
  property.value = 0.5;
  window.assert && assert.throws(() => {
    property.value = 2;
  }, 'larger than range');
  window.assert && assert.throws(() => {
    property.value = -2;
  }, 'smaller than range');
  window.assert && assert.throws(() => {
    rangeProperty.value = new Range(5, 10);
  }, 'current value outside of range');

  // reset from previous test setting to [5,10]
  property.dispose();
  rangeProperty.dispose();
  rangeProperty = new Property(new Range(0, 1));
  property = new NumberProperty(0, {
    range: rangeProperty
  });
  rangeProperty.value = new Range(0, 10);
  property.value = 2;
  property.setValueAndRange(100, new Range(99, 101));
  const myRange = new Range(5, 10);
  property.setValueAndRange(6, myRange);
  assert.ok(myRange === property.rangeProperty.value, 'reference should be kept');
  property = new NumberProperty(0, {
    range: new Range(0, 1)
  });
  assert.ok(property.rangeProperty instanceof Property, 'created a rangeProperty from a range');

  // deferring ordering dependencies
  ///////////////////////////////////////////////////////
  let pCalled = 0;
  let pRangeCalled = 0;
  property.lazyLink(() => pCalled++);
  property.rangeProperty.lazyLink(() => pRangeCalled++);
  property.setDeferred(true);
  property.rangeProperty.setDeferred(true);
  property.set(3);
  assert.ok(pCalled === 0, 'p is still deferred, should not call listeners');
  property.rangeProperty.set(new Range(2, 3));
  assert.ok(pRangeCalled === 0, 'p.rangeProperty is still deferred, should not call listeners');
  const notifyPListeners = property.setDeferred(false);
  if (window.assert) {
    assert.throws(() => {
      notifyPListeners && notifyPListeners();
    }, 'rangeProperty is not yet undeferred and so has the wrong value');
    property['notifying'] = false; // since the above threw an error, reset
  }
  const notifyRangeListeners = property.rangeProperty.setDeferred(false);
  notifyPListeners && notifyPListeners();
  assert.ok(pCalled === 1, 'p listeners should have been called');
  notifyRangeListeners && notifyRangeListeners();
  assert.ok(pRangeCalled === 1, 'p.rangeProperty is still deferred, should not call listeners');
  property.setValueAndRange(-100, new Range(-101, -99));
  assert.ok(pCalled === 2, 'p listeners should have been called again');
  assert.ok(pRangeCalled === 2, 'p.rangeProperty is still deferred, should not call listeners again');
  property = new NumberProperty(0);
  property.value = 4;
  assert.ok(property.rangeProperty.value === DEFAULT_RANGE, 'rangeProperty should have been created');
  property.rangeProperty.value = new Range(0, 4);
  window.assert && assert.throws(() => {
    property.value = 5;
  }, 'current value outside of range');
});
QUnit.test('Test NumberProperty phet-io options', assert => {
  const tandem = Tandem.ROOT_TEST;
  let numberProperty = new NumberProperty(0, {
    range: new Range(0, 20),
    tandem: tandem.createTandem('numberProperty'),
    rangePropertyOptions: {
      tandem: tandem.createTandem('rangeProperty')
    }
  });
  assert.ok(numberProperty.rangeProperty.isPhetioInstrumented(), 'rangeProperty instrumented');
  assert.ok(numberProperty.rangeProperty.tandem.name === 'rangeProperty', 'rangeProperty instrumented');
  numberProperty.dispose();
  numberProperty = new NumberProperty(0, {
    range: DEFAULT_RANGE
  });
  assert.ok(!numberProperty.rangeProperty.isPhetioInstrumented(), 'null ranges do not get instrumented rangeProperty');
  window.assert && Tandem.VALIDATION && assert.throws(() => {
    numberProperty = new NumberProperty(0, {
      range: new Range(0, 20),
      tandem: tandem.createTandem('numberProperty2'),
      rangePropertyOptions: {
        tandem: tandem.createTandem('rangePropertyfdsa')
      }
    });
  }, 'cannot instrument default rangeProperty with tandem other than "rangeProperty"');
  numberProperty.dispose();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSYW5nZSIsIlRhbmRlbSIsIk51bWJlclByb3BlcnR5IiwiREVGQVVMVF9SQU5HRSIsIlByb3BlcnR5IiwiUVVuaXQiLCJtb2R1bGUiLCJ0ZXN0IiwiYXNzZXJ0Iiwib2siLCJwcm9wZXJ0eSIsIndpbmRvdyIsInRocm93cyIsInZhbHVlIiwibnVtYmVyVHlwZSIsInZhbGlkVmFsdWVzIiwicmFuZ2UiLCJ1bml0cyIsInJhbmdlUHJvcGVydHkiLCJyZXNldCIsIm1pbiIsImRpc3Bvc2UiLCJzZXRWYWx1ZUFuZFJhbmdlIiwibXlSYW5nZSIsInBDYWxsZWQiLCJwUmFuZ2VDYWxsZWQiLCJsYXp5TGluayIsInNldERlZmVycmVkIiwic2V0Iiwibm90aWZ5UExpc3RlbmVycyIsIm5vdGlmeVJhbmdlTGlzdGVuZXJzIiwidGFuZGVtIiwiUk9PVF9URVNUIiwibnVtYmVyUHJvcGVydHkiLCJjcmVhdGVUYW5kZW0iLCJyYW5nZVByb3BlcnR5T3B0aW9ucyIsImlzUGhldGlvSW5zdHJ1bWVudGVkIiwibmFtZSIsIlZBTElEQVRJT04iXSwic291cmNlcyI6WyJOdW1iZXJQcm9wZXJ0eVRlc3RzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFFVbml0IHRlc3RzIGZvciBOdW1iZXJQcm9wZXJ0eVxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHksIHsgREVGQVVMVF9SQU5HRSB9IGZyb20gJy4vTnVtYmVyUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi9Qcm9wZXJ0eS5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdOdW1iZXJQcm9wZXJ0eScgKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IE51bWJlclByb3BlcnR5JywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQub2soIHRydWUsICdvbmUgdGVzdCBuZWVkZWQgd2hlbiBydW5uaW5nIHdpdGhvdXQgYXNzZXJ0aW9ucycgKTtcclxuXHJcbiAgbGV0IHByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCA0MiApOyAvLyBoaWdobHkgcmFuZG9tLCBkbyBub3QgY2hhbmdlXHJcblxyXG4gIC8vIHZhbHVlVHlwZVxyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgSU5URU5USU9OQUxcclxuICAgIHByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCAnZm9vJyApO1xyXG4gIH0sICdpbml0aWFsIHZhbHVlIGhhcyBpbnZhbGlkIHZhbHVlVHlwZScgKTtcclxuICBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCApO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gMTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIElOVEVOVElPTkFMXHJcbiAgICBwcm9wZXJ0eS52YWx1ZSA9ICdmb28nO1xyXG4gIH0sICdzZXQgdmFsdWUgaGFzIGludmFsaWQgdmFsdWVUeXBlJyApO1xyXG5cclxuICAvLyBudW1iZXJUeXBlXHJcbiAgcHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHsgbnVtYmVyVHlwZTogJ0Zsb2F0aW5nUG9pbnQnIH0gKTtcclxuICBwcm9wZXJ0eS52YWx1ZSA9IDE7XHJcbiAgcHJvcGVydHkudmFsdWUgPSAxLjI7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMS4yLCB7IG51bWJlclR5cGU6ICdJbnRlZ2VyJyB9ICk7XHJcbiAgfSwgJ2luaXRpYWwgdmFsdWUgaGFzIGludmFsaWQgbnVtYmVyVHlwZScgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCAwLCB7XHJcbiAgICAgIG51bWJlclR5cGU6ICdJbnRlZ2VyJyxcclxuICAgICAgdmFsaWRWYWx1ZXM6IFsgMCwgMSwgMS4yLCAyIF1cclxuICAgIH0gKTtcclxuICB9LCAnbWVtYmVyIG9mIHZhbGlkVmFsdWVzIGhhcyBpbnZhbGlkIG51bWJlclR5cGUnICk7XHJcbiAgcHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHsgbnVtYmVyVHlwZTogJ0ludGVnZXInIH0gKTtcclxuICBwcm9wZXJ0eS52YWx1ZSA9IDE7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eS52YWx1ZSA9IDEuMjtcclxuICB9LCAnc2V0IHZhbHVlIGhhcyBpbnZhbGlkIG51bWJlclR5cGUnICk7XHJcblxyXG4gIC8vIHJhbmdlXHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBJTlRFTlRJT05BTFxyXG4gICAgcHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHsgcmFuZ2U6IFsgMCwgMTAgXSB9ICk7XHJcbiAgfSwgJ2JhZCByYW5nZScgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCAxMSwgeyByYW5nZTogbmV3IFJhbmdlKCAwLCAxMCApIH0gKTtcclxuICB9LCAnaW5pdGlhbCB2YWx1ZSBpcyBncmVhdGVyIHRoYW4gcmFuZ2UubWF4JyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIC0xLCB7IHJhbmdlOiBuZXcgUmFuZ2UoIDAsIDEwICkgfSApO1xyXG4gIH0sICdpbml0aWFsIHZhbHVlIGlzIGxlc3MgdGhhbiByYW5nZS5taW4nICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCwge1xyXG4gICAgICByYW5nZTogbmV3IFJhbmdlKCAwLCAxMCApLFxyXG4gICAgICB2YWxpZFZhbHVlczogWyAwLCAxLCAyLCAxMSBdXHJcbiAgICB9ICk7XHJcbiAgfSwgJ21lbWJlciBvZiB2YWxpZFZhbHVlcyBpcyBncmVhdGVyIHRoYW4gcmFuZ2UubWF4JyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHtcclxuICAgICAgcmFuZ2U6IG5ldyBSYW5nZSggMCwgMTAgKSxcclxuICAgICAgdmFsaWRWYWx1ZXM6IFsgLTEsIDAsIDEsIDIgXVxyXG4gICAgfSApO1xyXG4gIH0sICdtZW1iZXIgb2YgdmFsaWRWYWx1ZXMgaXMgbGVzcyB0aGFuIHJhbmdlLm1pbicgKTtcclxuICBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCwgeyByYW5nZTogbmV3IFJhbmdlKCAwLCAxMCApIH0gKTtcclxuICBwcm9wZXJ0eS52YWx1ZSA9IDU7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eS52YWx1ZSA9IDExO1xyXG4gIH0sICdzZXQgdmFsdWUgaXMgZ3JlYXRlciB0aGFuIHJhbmdlLm1heCcgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5LnZhbHVlID0gLTE7XHJcbiAgfSwgJ3NldCB2YWx1ZSBpcyBsZXNzIHRoYW4gcmFuZ2UubWluJyApO1xyXG5cclxuICAvLyB1bml0c1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHsgdW5pdHM6ICdlbGVwaGFudHMnIH0gKTtcclxuICB9LCAnYmFkIHVuaXRzJyApO1xyXG5cclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgcHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHsgcmFuZ2U6IG5ldyBSYW5nZSggMCwgMTAgKSB9ICk7XHJcbiAgcHJvcGVydHkucmFuZ2VQcm9wZXJ0eS52YWx1ZSA9IG5ldyBSYW5nZSggMCwgMTAwICk7XHJcbiAgcHJvcGVydHkudmFsdWUgPSA5OTtcclxuICBwcm9wZXJ0eS5yYW5nZVByb3BlcnR5LnZhbHVlID0gbmV3IFJhbmdlKCA5MCwgMTAwICk7XHJcblxyXG4gIC8vIFRoaXMgc2hvdWxkIG5vdCBmYWlsLCBidXQgd2lsbCB1bnRpbCB3ZSBzdXBwb3J0IG5lc3RlZCBkZWZlcnJhbCBmb3IgUGhFVC1pTyBzdXBwb3J0LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzI4MlxyXG4gIC8vIHAucmVzZXQoKTtcclxuXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIHByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCAwLCB7IHJhbmdlOiBuZXcgUmFuZ2UoIDAsIDEwICkgfSApO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gNTtcclxuICBwcm9wZXJ0eS5yYW5nZVByb3BlcnR5LnZhbHVlID0gbmV3IFJhbmdlKCA0LCAxMCApO1xyXG4gIHByb3BlcnR5LnJlc2V0KCk7XHJcbiAgYXNzZXJ0Lm9rKCBwcm9wZXJ0eS52YWx1ZSA9PT0gMCwgJ3Jlc2V0JyApO1xyXG4gIGFzc2VydC5vayggcHJvcGVydHkucmFuZ2VQcm9wZXJ0eS52YWx1ZS5taW4gPT09IDAsICdyZXNldCByYW5nZScgKTtcclxufSApO1xyXG5cclxuXHJcblFVbml0LnRlc3QoICdUZXN0IE51bWJlclByb3BlcnR5IHJhbmdlIG9wdGlvbiBhcyBQcm9wZXJ0eScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGxldCByYW5nZVByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBuZXcgUmFuZ2UoIDAsIDEgKSApO1xyXG4gIGxldCBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggNCApO1xyXG5cclxuICAvLyB2YWx1ZVR5cGVcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIElOVEVOVElPTkFMXHJcbiAgICBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCwgeyByYW5nZTogJ2hpJyB9ICk7XHJcbiAgfSwgJ2luY29ycmVjdCByYW5nZSB0eXBlJyApO1xyXG5cclxuICBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCwgeyByYW5nZTogcmFuZ2VQcm9wZXJ0eSB9ICk7XHJcbiAgYXNzZXJ0Lm9rKCBwcm9wZXJ0eS5yYW5nZVByb3BlcnR5ID09PSByYW5nZVByb3BlcnR5LCAncmFuZ2VQcm9wZXJ0eSBzaG91bGQgYmUgc2V0JyApO1xyXG4gIGFzc2VydC5vayggcHJvcGVydHkucmFuZ2UgPT09IHJhbmdlUHJvcGVydHkudmFsdWUsICdyYW5nZVByb3BlcnR5IHZhbHVlIHNob3VsZCBiZSBzZXQgTnVtYmVyUHJvcGVydHkuc2V0IG9uIGNvbnN0cnVjdGlvbicgKTtcclxuICBwcm9wZXJ0eS52YWx1ZSA9IDE7XHJcbiAgcHJvcGVydHkudmFsdWUgPSAwO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gMC41O1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkudmFsdWUgPSAyO1xyXG4gIH0sICdsYXJnZXIgdGhhbiByYW5nZScgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5LnZhbHVlID0gLTI7XHJcbiAgfSwgJ3NtYWxsZXIgdGhhbiByYW5nZScgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHJhbmdlUHJvcGVydHkudmFsdWUgPSBuZXcgUmFuZ2UoIDUsIDEwICk7XHJcbiAgfSwgJ2N1cnJlbnQgdmFsdWUgb3V0c2lkZSBvZiByYW5nZScgKTtcclxuXHJcbiAgLy8gcmVzZXQgZnJvbSBwcmV2aW91cyB0ZXN0IHNldHRpbmcgdG8gWzUsMTBdXHJcbiAgcHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gIHJhbmdlUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gIHJhbmdlUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIG5ldyBSYW5nZSggMCwgMSApICk7XHJcblxyXG4gIHByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCAwLCB7IHJhbmdlOiByYW5nZVByb3BlcnR5IH0gKTtcclxuICByYW5nZVByb3BlcnR5LnZhbHVlID0gbmV3IFJhbmdlKCAwLCAxMCApO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gMjtcclxuXHJcbiAgcHJvcGVydHkuc2V0VmFsdWVBbmRSYW5nZSggMTAwLCBuZXcgUmFuZ2UoIDk5LCAxMDEgKSApO1xyXG5cclxuICBjb25zdCBteVJhbmdlID0gbmV3IFJhbmdlKCA1LCAxMCApO1xyXG4gIHByb3BlcnR5LnNldFZhbHVlQW5kUmFuZ2UoIDYsIG15UmFuZ2UgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBteVJhbmdlID09PSBwcm9wZXJ0eS5yYW5nZVByb3BlcnR5LnZhbHVlLCAncmVmZXJlbmNlIHNob3VsZCBiZSBrZXB0JyApO1xyXG5cclxuICBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCwgeyByYW5nZTogbmV3IFJhbmdlKCAwLCAxICkgfSApO1xyXG4gIGFzc2VydC5vayggcHJvcGVydHkucmFuZ2VQcm9wZXJ0eSBpbnN0YW5jZW9mIFByb3BlcnR5LCAnY3JlYXRlZCBhIHJhbmdlUHJvcGVydHkgZnJvbSBhIHJhbmdlJyApO1xyXG5cclxuICAvLyBkZWZlcnJpbmcgb3JkZXJpbmcgZGVwZW5kZW5jaWVzXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIGxldCBwQ2FsbGVkID0gMDtcclxuICBsZXQgcFJhbmdlQ2FsbGVkID0gMDtcclxuICBwcm9wZXJ0eS5sYXp5TGluayggKCkgPT4gcENhbGxlZCsrICk7XHJcbiAgcHJvcGVydHkucmFuZ2VQcm9wZXJ0eS5sYXp5TGluayggKCkgPT4gcFJhbmdlQ2FsbGVkKysgKTtcclxuICBwcm9wZXJ0eS5zZXREZWZlcnJlZCggdHJ1ZSApO1xyXG4gIHByb3BlcnR5LnJhbmdlUHJvcGVydHkuc2V0RGVmZXJyZWQoIHRydWUgKTtcclxuICBwcm9wZXJ0eS5zZXQoIDMgKTtcclxuICBhc3NlcnQub2soIHBDYWxsZWQgPT09IDAsICdwIGlzIHN0aWxsIGRlZmVycmVkLCBzaG91bGQgbm90IGNhbGwgbGlzdGVuZXJzJyApO1xyXG4gIHByb3BlcnR5LnJhbmdlUHJvcGVydHkuc2V0KCBuZXcgUmFuZ2UoIDIsIDMgKSApO1xyXG4gIGFzc2VydC5vayggcFJhbmdlQ2FsbGVkID09PSAwLCAncC5yYW5nZVByb3BlcnR5IGlzIHN0aWxsIGRlZmVycmVkLCBzaG91bGQgbm90IGNhbGwgbGlzdGVuZXJzJyApO1xyXG4gIGNvbnN0IG5vdGlmeVBMaXN0ZW5lcnMgPSBwcm9wZXJ0eS5zZXREZWZlcnJlZCggZmFsc2UgKTtcclxuXHJcblxyXG4gIGlmICggd2luZG93LmFzc2VydCApIHtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgICAgbm90aWZ5UExpc3RlbmVycyAmJiBub3RpZnlQTGlzdGVuZXJzKCk7XHJcbiAgICB9LCAncmFuZ2VQcm9wZXJ0eSBpcyBub3QgeWV0IHVuZGVmZXJyZWQgYW5kIHNvIGhhcyB0aGUgd3JvbmcgdmFsdWUnICk7XHJcblxyXG4gICAgcHJvcGVydHlbICdub3RpZnlpbmcnIF0gPSBmYWxzZTsgLy8gc2luY2UgdGhlIGFib3ZlIHRocmV3IGFuIGVycm9yLCByZXNldFxyXG4gIH1cclxuICBjb25zdCBub3RpZnlSYW5nZUxpc3RlbmVycyA9IHByb3BlcnR5LnJhbmdlUHJvcGVydHkuc2V0RGVmZXJyZWQoIGZhbHNlICk7XHJcbiAgbm90aWZ5UExpc3RlbmVycyAmJiBub3RpZnlQTGlzdGVuZXJzKCk7XHJcbiAgYXNzZXJ0Lm9rKCBwQ2FsbGVkID09PSAxLCAncCBsaXN0ZW5lcnMgc2hvdWxkIGhhdmUgYmVlbiBjYWxsZWQnICk7XHJcbiAgbm90aWZ5UmFuZ2VMaXN0ZW5lcnMgJiYgbm90aWZ5UmFuZ2VMaXN0ZW5lcnMoKTtcclxuICBhc3NlcnQub2soIHBSYW5nZUNhbGxlZCA9PT0gMSwgJ3AucmFuZ2VQcm9wZXJ0eSBpcyBzdGlsbCBkZWZlcnJlZCwgc2hvdWxkIG5vdCBjYWxsIGxpc3RlbmVycycgKTtcclxuXHJcbiAgcHJvcGVydHkuc2V0VmFsdWVBbmRSYW5nZSggLTEwMCwgbmV3IFJhbmdlKCAtMTAxLCAtOTkgKSApO1xyXG4gIGFzc2VydC5vayggcENhbGxlZCA9PT0gMiwgJ3AgbGlzdGVuZXJzIHNob3VsZCBoYXZlIGJlZW4gY2FsbGVkIGFnYWluJyApO1xyXG4gIGFzc2VydC5vayggcFJhbmdlQ2FsbGVkID09PSAyLCAncC5yYW5nZVByb3BlcnR5IGlzIHN0aWxsIGRlZmVycmVkLCBzaG91bGQgbm90IGNhbGwgbGlzdGVuZXJzIGFnYWluJyApO1xyXG5cclxuICBwcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCApO1xyXG4gIHByb3BlcnR5LnZhbHVlID0gNDtcclxuICBhc3NlcnQub2soIHByb3BlcnR5LnJhbmdlUHJvcGVydHkudmFsdWUgPT09IERFRkFVTFRfUkFOR0UsICdyYW5nZVByb3BlcnR5IHNob3VsZCBoYXZlIGJlZW4gY3JlYXRlZCcgKTtcclxuICBwcm9wZXJ0eS5yYW5nZVByb3BlcnR5LnZhbHVlID0gbmV3IFJhbmdlKCAwLCA0ICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eS52YWx1ZSA9IDU7XHJcbiAgfSwgJ2N1cnJlbnQgdmFsdWUgb3V0c2lkZSBvZiByYW5nZScgKTtcclxufSApO1xyXG5RVW5pdC50ZXN0KCAnVGVzdCBOdW1iZXJQcm9wZXJ0eSBwaGV0LWlvIG9wdGlvbnMnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCB0YW5kZW0gPSBUYW5kZW0uUk9PVF9URVNUO1xyXG4gIGxldCBudW1iZXJQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCwge1xyXG4gICAgcmFuZ2U6IG5ldyBSYW5nZSggMCwgMjAgKSxcclxuICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ251bWJlclByb3BlcnR5JyApLFxyXG4gICAgcmFuZ2VQcm9wZXJ0eU9wdGlvbnM6IHsgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAncmFuZ2VQcm9wZXJ0eScgKSB9XHJcbiAgfSApO1xyXG5cclxuICBhc3NlcnQub2soIG51bWJlclByb3BlcnR5LnJhbmdlUHJvcGVydHkuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ3JhbmdlUHJvcGVydHkgaW5zdHJ1bWVudGVkJyApO1xyXG4gIGFzc2VydC5vayggbnVtYmVyUHJvcGVydHkucmFuZ2VQcm9wZXJ0eS50YW5kZW0ubmFtZSA9PT0gJ3JhbmdlUHJvcGVydHknLCAncmFuZ2VQcm9wZXJ0eSBpbnN0cnVtZW50ZWQnICk7XHJcblxyXG4gIG51bWJlclByb3BlcnR5LmRpc3Bvc2UoKTtcclxuXHJcbiAgbnVtYmVyUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHtcclxuICAgIHJhbmdlOiBERUZBVUxUX1JBTkdFXHJcbiAgfSApO1xyXG4gIGFzc2VydC5vayggIW51bWJlclByb3BlcnR5LnJhbmdlUHJvcGVydHkuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ251bGwgcmFuZ2VzIGRvIG5vdCBnZXQgaW5zdHJ1bWVudGVkIHJhbmdlUHJvcGVydHknICk7XHJcblxyXG4gIHdpbmRvdy5hc3NlcnQgJiYgVGFuZGVtLlZBTElEQVRJT04gJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgbnVtYmVyUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHtcclxuICAgICAgcmFuZ2U6IG5ldyBSYW5nZSggMCwgMjAgKSxcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAnbnVtYmVyUHJvcGVydHkyJyApLFxyXG4gICAgICByYW5nZVByb3BlcnR5T3B0aW9uczogeyB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdyYW5nZVByb3BlcnR5ZmRzYScgKSB9XHJcbiAgICB9ICk7XHJcbiAgfSwgJ2Nhbm5vdCBpbnN0cnVtZW50IGRlZmF1bHQgcmFuZ2VQcm9wZXJ0eSB3aXRoIHRhbmRlbSBvdGhlciB0aGFuIFwicmFuZ2VQcm9wZXJ0eVwiJyApO1xyXG4gIG51bWJlclByb3BlcnR5LmRpc3Bvc2UoKTtcclxufSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLEtBQUssTUFBTSx1QkFBdUI7QUFDekMsT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjtBQUM5QyxPQUFPQyxjQUFjLElBQUlDLGFBQWEsUUFBUSxxQkFBcUI7QUFDbkUsT0FBT0MsUUFBUSxNQUFNLGVBQWU7QUFFcENDLEtBQUssQ0FBQ0MsTUFBTSxDQUFFLGdCQUFpQixDQUFD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