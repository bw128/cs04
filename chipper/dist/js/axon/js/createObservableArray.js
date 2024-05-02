// Copyright 2020-2024, University of Colorado Boulder

// createObservableArray conforms to the Proxy interface, which is polluted with `any` types.  Therefore we disable
// this rule for this file.
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Creates an object that has the same API as an Array, but also supports notifications and PhET-iO. When an item
 * is added or removed, the lengthProperty changes before elementAddedEmitter or elementRemovedEmitter emit.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import axon from './axon.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';
import Validation from './Validation.js';
import isSettingPhetioStateProperty from '../../tandem/js/isSettingPhetioStateProperty.js';
import IOTypeCache from '../../tandem/js/IOTypeCache.js';

// NOTE: Is this up-to-date and correct? Looks like we tack on phet-io stuff depending on the phetioType.

// eslint-disable-line -- futureproof type param if we type this
// // We don't import because of the repo dependency

// Typed for internal usage

const createObservableArray = providedOptions => {
  assertMutuallyExclusiveOptions(providedOptions, ['length'], ['elements']);
  const options = optionize()({
    hasListenerOrderDependencies: false,
    // Also supports phetioType or validator options.  If both are supplied, only the phetioType is respected

    length: 0,
    elements: [],
    elementAddedEmitterOptions: {},
    elementRemovedEmitterOptions: {},
    lengthPropertyOptions: {}
  }, providedOptions);
  let emitterParameterOptions = null;
  if (options.phetioType) {
    assert && assert(options.phetioType.typeName.startsWith('ObservableArrayIO'));
    emitterParameterOptions = {
      name: 'value',
      phetioType: options.phetioType.parameterTypes[0]
    };
  }
  // NOTE: Improve with Validation
  else if (!Validation.getValidatorValidationError(options)) {
    const validator = _.pick(options, Validation.VALIDATOR_KEYS);
    emitterParameterOptions = merge({
      name: 'value'
    }, validator);
  } else {
    emitterParameterOptions = merge({
      name: 'value'
    }, {
      isValidValue: _.stubTrue
    });
  }

  // notifies when an element has been added
  const elementAddedEmitter = new Emitter(combineOptions({
    tandem: options.tandem?.createTandem('elementAddedEmitter'),
    parameters: [emitterParameterOptions],
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.elementAddedEmitterOptions));

  // notifies when an element has been removed
  const elementRemovedEmitter = new Emitter(combineOptions({
    tandem: options.tandem?.createTandem('elementRemovedEmitter'),
    parameters: [emitterParameterOptions],
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.elementRemovedEmitterOptions));

  // observe this, but don't set it. Updated when Array modifiers are called (except array.length=...)
  const lengthProperty = new NumberProperty(0, combineOptions({
    numberType: 'Integer',
    tandem: options.tandem?.createTandem('lengthProperty'),
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.lengthPropertyOptions));

  // The underlying array which is wrapped by the Proxy
  const targetArray = [];

  // Verify that lengthProperty is updated before listeners are notified, but not when setting PhET-iO State,
  // This is because we cannot specify ordering dependencies between Properties and ObservableArrays,
  // TODO: Maybe this can be improved when we have better support for this in https://github.com/phetsims/phet-io/issues/1661
  assert && elementAddedEmitter.addListener(() => {
    if (!isSettingPhetioStateProperty.value) {
      assert && assert(lengthProperty.value === targetArray.length, 'lengthProperty out of sync while adding element');
    }
  });
  assert && elementRemovedEmitter.addListener(() => {
    if (!isSettingPhetioStateProperty.value) {
      assert && assert(lengthProperty.value === targetArray.length, 'lengthProperty out of sync while removing element');
    }
  });

  // The Proxy which will intercept method calls and trigger notifications.
  const observableArray = new Proxy(targetArray, {
    /**
     * Trap for getting a property or method.
     * @param array - the targetArray
     * @param key
     * @param receiver
     * @returns - the requested value
     */
    get: function (array, key, receiver) {
      assert && assert(array === targetArray, 'array should match the targetArray');
      if (methods.hasOwnProperty(key)) {
        return methods[key];
      } else {
        return Reflect.get(array, key, receiver);
      }
    },
    /**
     * Trap for setting a property value.
     * @param array - the targetArray
     * @param key
     * @param newValue
     * @returns - success
     */
    set: function (array, key, newValue) {
      assert && assert(array === targetArray, 'array should match the targetArray');
      const oldValue = array[key];
      let removedElements = null;

      // See which items are removed
      if (key === 'length') {
        removedElements = array.slice(newValue);
      }
      const returnValue = Reflect.set(array, key, newValue);

      // If we're using the bracket operator [index] of Array, then parse the index between the brackets.
      const numberKey = Number(key);
      if (Number.isInteger(numberKey) && numberKey >= 0 && oldValue !== newValue) {
        lengthProperty.value = array.length;
        if (oldValue !== undefined) {
          elementRemovedEmitter.emit(array[key]);
        }
        if (newValue !== undefined) {
          elementAddedEmitter.emit(newValue);
        }
      } else if (key === 'length') {
        lengthProperty.value = newValue;
        assert && assert(removedElements, 'removedElements should be defined for key===length');
        removedElements && removedElements.forEach(element => elementRemovedEmitter.emit(element));
      }
      return returnValue;
    },
    /**
     * This is the trap for the delete operator.
     */
    deleteProperty: function (array, key) {
      assert && assert(array === targetArray, 'array should match the targetArray');

      // If we're using the bracket operator [index] of Array, then parse the index between the brackets.
      const numberKey = Number(key);
      let removed;
      if (Number.isInteger(numberKey) && numberKey >= 0) {
        removed = array[key];
      }
      const returnValue = Reflect.deleteProperty(array, key);
      if (removed !== undefined) {
        elementRemovedEmitter.emit(removed);
      }
      return returnValue;
    }
  });
  observableArray.targetArray = targetArray;
  observableArray.elementAddedEmitter = elementAddedEmitter;
  observableArray.elementRemovedEmitter = elementRemovedEmitter;
  observableArray.lengthProperty = lengthProperty;
  const init = () => {
    if (options.length >= 0) {
      observableArray.length = options.length;
    }
    if (options.elements.length > 0) {
      Array.prototype.push.apply(observableArray, options.elements);
    }
  };
  init();

  //TODO https://github.com/phetsims/axon/issues/334 Move to "prototype" above or drop support
  observableArray.reset = () => {
    observableArray.length = 0;
    init();
  };

  /******************************************
   * PhET-iO support
   *******************************************/
  if (options.tandem?.supplied) {
    assert && assert(options.phetioType);
    observableArray.phetioElementType = options.phetioType.parameterTypes[0];

    // for managing state in phet-io
    // Use the same tandem and phetioState options so it can "masquerade" as the real object.  When PhetioObject is a mixin this can be changed.
    observableArray._observableArrayPhetioObject = new ObservableArrayPhetioObject(observableArray, options);
  }
  return observableArray;
};

/**
 * Manages state save/load. This implementation uses Proxy and hence cannot be instrumented as a PhetioObject.  This type
 * provides that functionality.
 */
class ObservableArrayPhetioObject extends PhetioObject {
  // internal, don't use

  /**
   * @param observableArray
   * @param [providedOptions] - same as the options to the parent ObservableArrayDef
   */
  constructor(observableArray, providedOptions) {
    super(providedOptions);
    this.observableArray = observableArray;
  }
}

// Methods shared by all ObservableArrayDef instances
const methods = {
  /******************************************
   * Overridden Array methods
   *******************************************/

  pop(...args) {
    const thisArray = this;
    const initialLength = thisArray.targetArray.length;
    const returnValue = Array.prototype.pop.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    initialLength > 0 && thisArray.elementRemovedEmitter.emit(returnValue);
    return returnValue;
  },
  shift(...args) {
    const thisArray = this;
    const initialLength = thisArray.targetArray.length;
    const returnValue = Array.prototype.shift.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    initialLength > 0 && thisArray.elementRemovedEmitter.emit(returnValue);
    return returnValue;
  },
  push(...args) {
    const thisArray = this;
    const returnValue = Array.prototype.push.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    for (let i = 0; i < arguments.length; i++) {
      thisArray.elementAddedEmitter.emit(args[i]);
    }
    return returnValue;
  },
  unshift(...args) {
    const thisArray = this;
    const returnValue = Array.prototype.unshift.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    for (let i = 0; i < args.length; i++) {
      thisArray.elementAddedEmitter.emit(args[i]);
    }
    return returnValue;
  },
  splice(...args) {
    const thisArray = this;
    const returnValue = Array.prototype.splice.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    const deletedElements = returnValue;
    for (let i = 2; i < args.length; i++) {
      thisArray.elementAddedEmitter.emit(args[i]);
    }
    deletedElements.forEach(deletedElement => thisArray.elementRemovedEmitter.emit(deletedElement));
    return returnValue;
  },
  copyWithin(...args) {
    const thisArray = this;
    const before = thisArray.targetArray.slice();
    const returnValue = Array.prototype.copyWithin.apply(thisArray.targetArray, args);
    reportDifference(before, thisArray);
    return returnValue;
  },
  fill(...args) {
    const thisArray = this;
    const before = thisArray.targetArray.slice();
    const returnValue = Array.prototype.fill.apply(thisArray.targetArray, args);
    reportDifference(before, thisArray);
    return returnValue;
  },
  /******************************************
   * For compatibility with ObservableArrayDef
   * TODO https://github.com/phetsims/axon/issues/334 consider deleting after migration
   * TODO https://github.com/phetsims/axon/issues/334 if not deleted, rename 'Item' with 'Element'
   *******************************************/
  get: function (index) {
    return this[index];
  },
  addItemAddedListener: function (listener) {
    this.elementAddedEmitter.addListener(listener);
  },
  removeItemAddedListener: function (listener) {
    this.elementAddedEmitter.removeListener(listener);
  },
  addItemRemovedListener: function (listener) {
    this.elementRemovedEmitter.addListener(listener);
  },
  removeItemRemovedListener: function (listener) {
    this.elementRemovedEmitter.removeListener(listener);
  },
  add: function (element) {
    this.push(element);
  },
  addAll: function (elements) {
    this.push(...elements);
  },
  remove: function (element) {
    arrayRemove(this, element);
  },
  removeAll: function (elements) {
    elements.forEach(element => arrayRemove(this, element));
  },
  clear: function () {
    while (this.length > 0) {
      this.pop();
    }
  },
  count: function (predicate) {
    let count = 0;
    for (let i = 0; i < this.length; i++) {
      if (predicate(this[i])) {
        count++;
      }
    }
    return count;
  },
  find: function (predicate, fromIndex) {
    assert && fromIndex !== undefined && assert(typeof fromIndex === 'number', 'fromIndex must be numeric, if provided');
    assert && typeof fromIndex === 'number' && assert(fromIndex >= 0 && fromIndex < this.length, `fromIndex out of bounds: ${fromIndex}`);
    return _.find(this, predicate, fromIndex);
  },
  shuffle: function (random) {
    assert && assert(random, 'random must be supplied');

    // preserve the same _array reference in case any clients got a reference to it with getArray()
    const shuffled = random.shuffle(this);

    // Act on the targetArray so that removal and add notifications aren't sent.
    this.targetArray.length = 0;
    Array.prototype.push.apply(this.targetArray, shuffled);
  },
  // TODO https://github.com/phetsims/axon/issues/334 This also seems important to eliminate
  getArrayCopy: function () {
    return this.slice();
  },
  dispose: function () {
    const thisArray = this;
    thisArray.elementAddedEmitter.dispose();
    thisArray.elementRemovedEmitter.dispose();
    thisArray.lengthProperty.dispose();
    thisArray._observableArrayPhetioObject && thisArray._observableArrayPhetioObject.dispose();
  },
  /******************************************
   * PhET-iO
   *******************************************/
  toStateObject: function () {
    return {
      array: this.map(item => this.phetioElementType.toStateObject(item))
    };
  },
  applyState: function (stateObject) {
    this.length = 0;
    const elements = stateObject.array.map(paramStateObject => this.phetioElementType.fromStateObject(paramStateObject));
    this.push(...elements);
  }
};

/**
 * For copyWithin and fill, which have more complex behavior, we treat the array as a black box, making a shallow copy
 * before the operation in order to identify what has been added and removed.
 */
const reportDifference = (shallowCopy, observableArray) => {
  const before = shallowCopy;
  const after = observableArray.targetArray.slice();
  for (let i = 0; i < before.length; i++) {
    const beforeElement = before[i];
    const afterIndex = after.indexOf(beforeElement);
    if (afterIndex >= 0) {
      before.splice(i, 1);
      after.splice(afterIndex, 1);
      i--;
    }
  }
  before.forEach(element => observableArray.elementRemovedEmitter.emit(element));
  after.forEach(element => observableArray.elementAddedEmitter.emit(element));
};

// Cache each parameterized ObservableArrayIO
// based on the parameter type, so that it is only created once.
const cache = new IOTypeCache();

/**
 * ObservableArrayIO is the IOType for ObservableArrayDef. It delegates most of its implementation to ObservableArrayDef.
 * Instead of being a parametric type, it leverages the phetioElementType on ObservableArrayDef.
 */
const ObservableArrayIO = parameterType => {
  if (!cache.has(parameterType)) {
    cache.set(parameterType, new IOType(`ObservableArrayIO<${parameterType.typeName}>`, {
      valueType: ObservableArrayPhetioObject,
      parameterTypes: [parameterType],
      toStateObject: observableArrayPhetioObject => observableArrayPhetioObject.observableArray.toStateObject(),
      applyState: (observableArrayPhetioObject, state) => observableArrayPhetioObject.observableArray.applyState(state),
      stateSchema: {
        array: ArrayIO(parameterType)
      }
    }));
  }
  return cache.get(parameterType);
};
createObservableArray.ObservableArrayIO = ObservableArrayIO;
axon.register('createObservableArray', createObservableArray);
export default createObservableArray;
export { ObservableArrayIO };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhcnJheVJlbW92ZSIsImFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyIsIm1lcmdlIiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJQaGV0aW9PYmplY3QiLCJBcnJheUlPIiwiSU9UeXBlIiwiYXhvbiIsIkVtaXR0ZXIiLCJOdW1iZXJQcm9wZXJ0eSIsIlZhbGlkYXRpb24iLCJpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IiwiSU9UeXBlQ2FjaGUiLCJjcmVhdGVPYnNlcnZhYmxlQXJyYXkiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcyIsImxlbmd0aCIsImVsZW1lbnRzIiwiZWxlbWVudEFkZGVkRW1pdHRlck9wdGlvbnMiLCJlbGVtZW50UmVtb3ZlZEVtaXR0ZXJPcHRpb25zIiwibGVuZ3RoUHJvcGVydHlPcHRpb25zIiwiZW1pdHRlclBhcmFtZXRlck9wdGlvbnMiLCJwaGV0aW9UeXBlIiwiYXNzZXJ0IiwidHlwZU5hbWUiLCJzdGFydHNXaXRoIiwibmFtZSIsInBhcmFtZXRlclR5cGVzIiwiZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yIiwidmFsaWRhdG9yIiwiXyIsInBpY2siLCJWQUxJREFUT1JfS0VZUyIsImlzVmFsaWRWYWx1ZSIsInN0dWJUcnVlIiwiZWxlbWVudEFkZGVkRW1pdHRlciIsInRhbmRlbSIsImNyZWF0ZVRhbmRlbSIsInBhcmFtZXRlcnMiLCJwaGV0aW9SZWFkT25seSIsImVsZW1lbnRSZW1vdmVkRW1pdHRlciIsImxlbmd0aFByb3BlcnR5IiwibnVtYmVyVHlwZSIsInRhcmdldEFycmF5IiwiYWRkTGlzdGVuZXIiLCJ2YWx1ZSIsIm9ic2VydmFibGVBcnJheSIsIlByb3h5IiwiZ2V0IiwiYXJyYXkiLCJrZXkiLCJyZWNlaXZlciIsIm1ldGhvZHMiLCJoYXNPd25Qcm9wZXJ0eSIsIlJlZmxlY3QiLCJzZXQiLCJuZXdWYWx1ZSIsIm9sZFZhbHVlIiwicmVtb3ZlZEVsZW1lbnRzIiwic2xpY2UiLCJyZXR1cm5WYWx1ZSIsIm51bWJlcktleSIsIk51bWJlciIsImlzSW50ZWdlciIsInVuZGVmaW5lZCIsImVtaXQiLCJmb3JFYWNoIiwiZWxlbWVudCIsImRlbGV0ZVByb3BlcnR5IiwicmVtb3ZlZCIsImluaXQiLCJBcnJheSIsInByb3RvdHlwZSIsInB1c2giLCJhcHBseSIsInJlc2V0Iiwic3VwcGxpZWQiLCJwaGV0aW9FbGVtZW50VHlwZSIsIl9vYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3QiLCJPYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3QiLCJjb25zdHJ1Y3RvciIsInBvcCIsImFyZ3MiLCJ0aGlzQXJyYXkiLCJpbml0aWFsTGVuZ3RoIiwic2hpZnQiLCJpIiwiYXJndW1lbnRzIiwidW5zaGlmdCIsInNwbGljZSIsImRlbGV0ZWRFbGVtZW50cyIsImRlbGV0ZWRFbGVtZW50IiwiY29weVdpdGhpbiIsImJlZm9yZSIsInJlcG9ydERpZmZlcmVuY2UiLCJmaWxsIiwiaW5kZXgiLCJhZGRJdGVtQWRkZWRMaXN0ZW5lciIsImxpc3RlbmVyIiwicmVtb3ZlSXRlbUFkZGVkTGlzdGVuZXIiLCJyZW1vdmVMaXN0ZW5lciIsImFkZEl0ZW1SZW1vdmVkTGlzdGVuZXIiLCJyZW1vdmVJdGVtUmVtb3ZlZExpc3RlbmVyIiwiYWRkIiwiYWRkQWxsIiwicmVtb3ZlIiwicmVtb3ZlQWxsIiwiY2xlYXIiLCJjb3VudCIsInByZWRpY2F0ZSIsImZpbmQiLCJmcm9tSW5kZXgiLCJzaHVmZmxlIiwicmFuZG9tIiwic2h1ZmZsZWQiLCJnZXRBcnJheUNvcHkiLCJkaXNwb3NlIiwidG9TdGF0ZU9iamVjdCIsIm1hcCIsIml0ZW0iLCJhcHBseVN0YXRlIiwic3RhdGVPYmplY3QiLCJwYXJhbVN0YXRlT2JqZWN0IiwiZnJvbVN0YXRlT2JqZWN0Iiwic2hhbGxvd0NvcHkiLCJhZnRlciIsImJlZm9yZUVsZW1lbnQiLCJhZnRlckluZGV4IiwiaW5kZXhPZiIsImNhY2hlIiwiT2JzZXJ2YWJsZUFycmF5SU8iLCJwYXJhbWV0ZXJUeXBlIiwiaGFzIiwidmFsdWVUeXBlIiwib2JzZXJ2YWJsZUFycmF5UGhldGlvT2JqZWN0Iiwic3RhdGUiLCJzdGF0ZVNjaGVtYSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiY3JlYXRlT2JzZXJ2YWJsZUFycmF5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLy8gY3JlYXRlT2JzZXJ2YWJsZUFycmF5IGNvbmZvcm1zIHRvIHRoZSBQcm94eSBpbnRlcmZhY2UsIHdoaWNoIGlzIHBvbGx1dGVkIHdpdGggYGFueWAgdHlwZXMuICBUaGVyZWZvcmUgd2UgZGlzYWJsZVxyXG4vLyB0aGlzIHJ1bGUgZm9yIHRoaXMgZmlsZS5cclxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xyXG4vKipcclxuICogQ3JlYXRlcyBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIHNhbWUgQVBJIGFzIGFuIEFycmF5LCBidXQgYWxzbyBzdXBwb3J0cyBub3RpZmljYXRpb25zIGFuZCBQaEVULWlPLiBXaGVuIGFuIGl0ZW1cclxuICogaXMgYWRkZWQgb3IgcmVtb3ZlZCwgdGhlIGxlbmd0aFByb3BlcnR5IGNoYW5nZXMgYmVmb3JlIGVsZW1lbnRBZGRlZEVtaXR0ZXIgb3IgZWxlbWVudFJlbW92ZWRFbWl0dGVyIGVtaXQuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IGFycmF5UmVtb3ZlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9hcnJheVJlbW92ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IGFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBBcnJheUlPIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9BcnJheUlPLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IGF4b24gZnJvbSAnLi9heG9uLmpzJztcclxuaW1wb3J0IEVtaXR0ZXIsIHsgRW1pdHRlck9wdGlvbnMgfSBmcm9tICcuL0VtaXR0ZXIuanMnO1xyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHksIHsgTnVtYmVyUHJvcGVydHlPcHRpb25zIH0gZnJvbSAnLi9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBWYWxpZGF0aW9uIGZyb20gJy4vVmFsaWRhdGlvbi5qcyc7XHJcbmltcG9ydCBURW1pdHRlciBmcm9tICcuL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL2lzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgSU9UeXBlQ2FjaGUgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL0lPVHlwZUNhY2hlLmpzJztcclxuXHJcbi8vIE5PVEU6IElzIHRoaXMgdXAtdG8tZGF0ZSBhbmQgY29ycmVjdD8gTG9va3MgbGlrZSB3ZSB0YWNrIG9uIHBoZXQtaW8gc3R1ZmYgZGVwZW5kaW5nIG9uIHRoZSBwaGV0aW9UeXBlLlxyXG50eXBlIE9ic2VydmFibGVBcnJheUxpc3RlbmVyPFQ+ID0gKCBlbGVtZW50OiBUICkgPT4gdm9pZDtcclxudHlwZSBQcmVkaWNhdGU8VD4gPSAoIGVsZW1lbnQ6IFQgKSA9PiBib29sZWFuO1xyXG50eXBlIE9ic2VydmFibGVBcnJheVN0YXRlT2JqZWN0PFQ+ID0geyBhcnJheTogYW55W10gfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSAtLSBmdXR1cmVwcm9vZiB0eXBlIHBhcmFtIGlmIHdlIHR5cGUgdGhpc1xyXG50eXBlIEZha2VSYW5kb208VD4gPSB7IHNodWZmbGU6ICggYXJyOiBUW10gKSA9PiBUW10gfTsgLy8gLy8gV2UgZG9uJ3QgaW1wb3J0IGJlY2F1c2Ugb2YgdGhlIHJlcG8gZGVwZW5kZW5jeVxyXG50eXBlIFNlbGZPcHRpb25zPFQ+ID0ge1xyXG4gIGxlbmd0aD86IG51bWJlcjtcclxuICBlbGVtZW50cz86IFRbXTtcclxuICBoYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzPzogYm9vbGVhbjsgLy8gU2VlIFRpbnlFbWl0dGVyLmhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXNcclxuXHJcbiAgLy8gT3B0aW9ucyBmb3IgdGhlIGFycmF5J3MgY2hpbGQgZWxlbWVudHMuIE9taXR0ZWQgb3B0aW9ucyBhcmUgdGhlIHJlc3BvbnNpYmlsaXR5IG9mIHRoZSBhcnJheS5cclxuICBlbGVtZW50QWRkZWRFbWl0dGVyT3B0aW9ucz86IFN0cmljdE9taXQ8RW1pdHRlck9wdGlvbnMsICd0YW5kZW0nIHwgJ3BhcmFtZXRlcnMnIHwgJ3BoZXRpb1JlYWRPbmx5Jz47XHJcbiAgZWxlbWVudFJlbW92ZWRFbWl0dGVyT3B0aW9ucz86IFN0cmljdE9taXQ8RW1pdHRlck9wdGlvbnMsICd0YW5kZW0nIHwgJ3BhcmFtZXRlcnMnIHwgJ3BoZXRpb1JlYWRPbmx5Jz47XHJcbiAgbGVuZ3RoUHJvcGVydHlPcHRpb25zPzogU3RyaWN0T21pdDxOdW1iZXJQcm9wZXJ0eU9wdGlvbnMsICd0YW5kZW0nIHwgJ251bWJlclR5cGUnIHwgJ3BoZXRpb1JlYWRPbmx5Jz47XHJcbn07XHJcbmV4cG9ydCB0eXBlIE9ic2VydmFibGVBcnJheU9wdGlvbnM8VD4gPSBTZWxmT3B0aW9uczxUPiAmIFBoZXRpb09iamVjdE9wdGlvbnM7XHJcblxyXG50eXBlIE9ic2VydmFibGVBcnJheTxUPiA9IHtcclxuICBnZXQ6ICggaW5kZXg6IG51bWJlciApID0+IFQ7XHJcbiAgYWRkSXRlbUFkZGVkTGlzdGVuZXI6ICggbGlzdGVuZXI6IE9ic2VydmFibGVBcnJheUxpc3RlbmVyPFQ+ICkgPT4gdm9pZDtcclxuICByZW1vdmVJdGVtQWRkZWRMaXN0ZW5lcjogKCBsaXN0ZW5lcjogT2JzZXJ2YWJsZUFycmF5TGlzdGVuZXI8VD4gKSA9PiB2b2lkO1xyXG4gIGFkZEl0ZW1SZW1vdmVkTGlzdGVuZXI6ICggbGlzdGVuZXI6IE9ic2VydmFibGVBcnJheUxpc3RlbmVyPFQ+ICkgPT4gdm9pZDtcclxuICByZW1vdmVJdGVtUmVtb3ZlZExpc3RlbmVyOiAoIGxpc3RlbmVyOiBPYnNlcnZhYmxlQXJyYXlMaXN0ZW5lcjxUPiApID0+IHZvaWQ7XHJcbiAgYWRkOiAoIGVsZW1lbnQ6IFQgKSA9PiB2b2lkO1xyXG4gIGFkZEFsbDogKCBlbGVtZW50czogVFtdICkgPT4gdm9pZDtcclxuICByZW1vdmU6ICggZWxlbWVudDogVCApID0+IHZvaWQ7XHJcbiAgcmVtb3ZlQWxsOiAoIGVsZW1lbnRzOiBUW10gKSA9PiB2b2lkO1xyXG4gIGNsZWFyOiAoKSA9PiB2b2lkO1xyXG4gIGNvdW50OiAoIHByZWRpY2F0ZTogUHJlZGljYXRlPFQ+ICkgPT4gbnVtYmVyO1xyXG4gIGZpbmQ6ICggcHJlZGljYXRlOiBQcmVkaWNhdGU8VD4sIGZyb21JbmRleD86IG51bWJlciApID0+IFQgfCB1bmRlZmluZWQ7XHJcbiAgc2h1ZmZsZTogKCByYW5kb206IEZha2VSYW5kb208VD4gKSA9PiB2b2lkO1xyXG4gIGdldEFycmF5Q29weTogKCkgPT4gVFtdO1xyXG4gIGRpc3Bvc2U6ICgpID0+IHZvaWQ7XHJcbiAgdG9TdGF0ZU9iamVjdDogKCkgPT4gT2JzZXJ2YWJsZUFycmF5U3RhdGVPYmplY3Q8VD47XHJcbiAgYXBwbHlTdGF0ZTogKCBzdGF0ZTogT2JzZXJ2YWJsZUFycmF5U3RhdGVPYmplY3Q8VD4gKSA9PiB2b2lkO1xyXG5cclxuICAvLyBsaXN0ZW4gb25seSBwbGVhc2VcclxuICBlbGVtZW50QWRkZWRFbWl0dGVyOiBURW1pdHRlcjxbIFQgXT47XHJcbiAgZWxlbWVudFJlbW92ZWRFbWl0dGVyOiBURW1pdHRlcjxbIFQgXT47XHJcbiAgbGVuZ3RoUHJvcGVydHk6IE51bWJlclByb3BlcnR5O1xyXG5cclxuICAvL1RPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzMzNCBNb3ZlIHRvIFwicHJvdG90eXBlXCIgYWJvdmUgb3IgZHJvcCBzdXBwb3J0XHJcbiAgcmVzZXQ6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8vIFBvc3NpYmx5IHBhc3NlZCB0aHJvdWdoIHRvIHRoZSBFbWl0dGVyXHJcbiAgcGhldGlvRWxlbWVudFR5cGU/OiBJT1R5cGU7XHJcbn0gJiBUW107XHJcblxyXG4vLyBUeXBlZCBmb3IgaW50ZXJuYWwgdXNhZ2VcclxudHlwZSBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PFQ+ID0ge1xyXG4gIC8vIE1ha2UgaXQgcG9zc2libGUgdG8gdXNlIHRoZSB0YXJnZXRBcnJheSBpbiB0aGUgb3ZlcnJpZGRlbiBtZXRob2RzLlxyXG4gIHRhcmdldEFycmF5OiBUW107XHJcblxyXG4gIF9vYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3Q/OiBPYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3Q8VD47XHJcbn0gJiBPYnNlcnZhYmxlQXJyYXk8VD47XHJcblxyXG5cclxuY29uc3QgY3JlYXRlT2JzZXJ2YWJsZUFycmF5ID0gPFQ+KCBwcm92aWRlZE9wdGlvbnM/OiBPYnNlcnZhYmxlQXJyYXlPcHRpb25zPFQ+ICk6IE9ic2VydmFibGVBcnJheTxUPiA9PiB7XHJcblxyXG4gIGFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyggcHJvdmlkZWRPcHRpb25zLCBbICdsZW5ndGgnIF0sIFsgJ2VsZW1lbnRzJyBdICk7XHJcblxyXG4gIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8T2JzZXJ2YWJsZUFycmF5T3B0aW9uczxUPiwgU2VsZk9wdGlvbnM8VD4sIFBoZXRpb09iamVjdE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICBoYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzOiBmYWxzZSxcclxuXHJcbiAgICAvLyBBbHNvIHN1cHBvcnRzIHBoZXRpb1R5cGUgb3IgdmFsaWRhdG9yIG9wdGlvbnMuICBJZiBib3RoIGFyZSBzdXBwbGllZCwgb25seSB0aGUgcGhldGlvVHlwZSBpcyByZXNwZWN0ZWRcclxuXHJcbiAgICBsZW5ndGg6IDAsXHJcbiAgICBlbGVtZW50czogW10sXHJcbiAgICBlbGVtZW50QWRkZWRFbWl0dGVyT3B0aW9uczoge30sXHJcbiAgICBlbGVtZW50UmVtb3ZlZEVtaXR0ZXJPcHRpb25zOiB7fSxcclxuICAgIGxlbmd0aFByb3BlcnR5T3B0aW9uczoge31cclxuICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgbGV0IGVtaXR0ZXJQYXJhbWV0ZXJPcHRpb25zID0gbnVsbDtcclxuICBpZiAoIG9wdGlvbnMucGhldGlvVHlwZSApIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnBoZXRpb1R5cGUudHlwZU5hbWUuc3RhcnRzV2l0aCggJ09ic2VydmFibGVBcnJheUlPJyApICk7XHJcbiAgICBlbWl0dGVyUGFyYW1ldGVyT3B0aW9ucyA9IHsgbmFtZTogJ3ZhbHVlJywgcGhldGlvVHlwZTogb3B0aW9ucy5waGV0aW9UeXBlLnBhcmFtZXRlclR5cGVzIVsgMCBdIH07XHJcbiAgfVxyXG4gIC8vIE5PVEU6IEltcHJvdmUgd2l0aCBWYWxpZGF0aW9uXHJcbiAgZWxzZSBpZiAoICFWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggb3B0aW9ucyApICkge1xyXG4gICAgY29uc3QgdmFsaWRhdG9yID0gXy5waWNrKCBvcHRpb25zLCBWYWxpZGF0aW9uLlZBTElEQVRPUl9LRVlTICk7XHJcbiAgICBlbWl0dGVyUGFyYW1ldGVyT3B0aW9ucyA9IG1lcmdlKCB7IG5hbWU6ICd2YWx1ZScgfSwgdmFsaWRhdG9yICk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgZW1pdHRlclBhcmFtZXRlck9wdGlvbnMgPSBtZXJnZSggeyBuYW1lOiAndmFsdWUnIH0sIHsgaXNWYWxpZFZhbHVlOiBfLnN0dWJUcnVlIH0gKTtcclxuICB9XHJcblxyXG4gIC8vIG5vdGlmaWVzIHdoZW4gYW4gZWxlbWVudCBoYXMgYmVlbiBhZGRlZFxyXG4gIGNvbnN0IGVsZW1lbnRBZGRlZEVtaXR0ZXIgPSBuZXcgRW1pdHRlcjxbIFQgXT4oIGNvbWJpbmVPcHRpb25zPEVtaXR0ZXJPcHRpb25zPigge1xyXG4gICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnZWxlbWVudEFkZGVkRW1pdHRlcicgKSxcclxuICAgIHBhcmFtZXRlcnM6IFsgZW1pdHRlclBhcmFtZXRlck9wdGlvbnMgXSxcclxuICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlLFxyXG4gICAgaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llczogb3B0aW9ucy5oYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzXHJcbiAgfSwgb3B0aW9ucy5lbGVtZW50QWRkZWRFbWl0dGVyT3B0aW9ucyApICk7XHJcblxyXG4gIC8vIG5vdGlmaWVzIHdoZW4gYW4gZWxlbWVudCBoYXMgYmVlbiByZW1vdmVkXHJcbiAgY29uc3QgZWxlbWVudFJlbW92ZWRFbWl0dGVyID0gbmV3IEVtaXR0ZXI8WyBUIF0+KCBjb21iaW5lT3B0aW9uczxFbWl0dGVyT3B0aW9ucz4oIHtcclxuICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ2VsZW1lbnRSZW1vdmVkRW1pdHRlcicgKSxcclxuICAgIHBhcmFtZXRlcnM6IFsgZW1pdHRlclBhcmFtZXRlck9wdGlvbnMgXSxcclxuICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlLFxyXG4gICAgaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llczogb3B0aW9ucy5oYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzXHJcbiAgfSwgb3B0aW9ucy5lbGVtZW50UmVtb3ZlZEVtaXR0ZXJPcHRpb25zICkgKTtcclxuXHJcbiAgLy8gb2JzZXJ2ZSB0aGlzLCBidXQgZG9uJ3Qgc2V0IGl0LiBVcGRhdGVkIHdoZW4gQXJyYXkgbW9kaWZpZXJzIGFyZSBjYWxsZWQgKGV4Y2VwdCBhcnJheS5sZW5ndGg9Li4uKVxyXG4gIGNvbnN0IGxlbmd0aFByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCAwLCBjb21iaW5lT3B0aW9uczxOdW1iZXJQcm9wZXJ0eU9wdGlvbnM+KCB7XHJcbiAgICBudW1iZXJUeXBlOiAnSW50ZWdlcicsXHJcbiAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICdsZW5ndGhQcm9wZXJ0eScgKSxcclxuICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlLFxyXG4gICAgaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llczogb3B0aW9ucy5oYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzXHJcbiAgfSwgb3B0aW9ucy5sZW5ndGhQcm9wZXJ0eU9wdGlvbnMgKSApO1xyXG5cclxuICAvLyBUaGUgdW5kZXJseWluZyBhcnJheSB3aGljaCBpcyB3cmFwcGVkIGJ5IHRoZSBQcm94eVxyXG4gIGNvbnN0IHRhcmdldEFycmF5OiBUW10gPSBbXTtcclxuXHJcbiAgLy8gVmVyaWZ5IHRoYXQgbGVuZ3RoUHJvcGVydHkgaXMgdXBkYXRlZCBiZWZvcmUgbGlzdGVuZXJzIGFyZSBub3RpZmllZCwgYnV0IG5vdCB3aGVuIHNldHRpbmcgUGhFVC1pTyBTdGF0ZSxcclxuICAvLyBUaGlzIGlzIGJlY2F1c2Ugd2UgY2Fubm90IHNwZWNpZnkgb3JkZXJpbmcgZGVwZW5kZW5jaWVzIGJldHdlZW4gUHJvcGVydGllcyBhbmQgT2JzZXJ2YWJsZUFycmF5cyxcclxuICAvLyBUT0RPOiBNYXliZSB0aGlzIGNhbiBiZSBpbXByb3ZlZCB3aGVuIHdlIGhhdmUgYmV0dGVyIHN1cHBvcnQgZm9yIHRoaXMgaW4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vaXNzdWVzLzE2NjFcclxuICBhc3NlcnQgJiYgZWxlbWVudEFkZGVkRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4ge1xyXG4gICAgaWYgKCAhaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbGVuZ3RoUHJvcGVydHkudmFsdWUgPT09IHRhcmdldEFycmF5Lmxlbmd0aCwgJ2xlbmd0aFByb3BlcnR5IG91dCBvZiBzeW5jIHdoaWxlIGFkZGluZyBlbGVtZW50JyApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuICBhc3NlcnQgJiYgZWxlbWVudFJlbW92ZWRFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICBpZiAoICFpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsZW5ndGhQcm9wZXJ0eS52YWx1ZSA9PT0gdGFyZ2V0QXJyYXkubGVuZ3RoLCAnbGVuZ3RoUHJvcGVydHkgb3V0IG9mIHN5bmMgd2hpbGUgcmVtb3ZpbmcgZWxlbWVudCcgKTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIFRoZSBQcm94eSB3aGljaCB3aWxsIGludGVyY2VwdCBtZXRob2QgY2FsbHMgYW5kIHRyaWdnZXIgbm90aWZpY2F0aW9ucy5cclxuICBjb25zdCBvYnNlcnZhYmxlQXJyYXk6IFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8VD4gPSBuZXcgUHJveHkoIHRhcmdldEFycmF5LCB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFwIGZvciBnZXR0aW5nIGEgcHJvcGVydHkgb3IgbWV0aG9kLlxyXG4gICAgICogQHBhcmFtIGFycmF5IC0gdGhlIHRhcmdldEFycmF5XHJcbiAgICAgKiBAcGFyYW0ga2V5XHJcbiAgICAgKiBAcGFyYW0gcmVjZWl2ZXJcclxuICAgICAqIEByZXR1cm5zIC0gdGhlIHJlcXVlc3RlZCB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKCBhcnJheTogVFtdLCBrZXk6IGtleW9mIHR5cGVvZiBtZXRob2RzLCByZWNlaXZlciApOiBhbnkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhcnJheSA9PT0gdGFyZ2V0QXJyYXksICdhcnJheSBzaG91bGQgbWF0Y2ggdGhlIHRhcmdldEFycmF5JyApO1xyXG4gICAgICBpZiAoIG1ldGhvZHMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xyXG4gICAgICAgIHJldHVybiBtZXRob2RzWyBrZXkgXTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUmVmbGVjdC5nZXQoIGFycmF5LCBrZXksIHJlY2VpdmVyICk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFwIGZvciBzZXR0aW5nIGEgcHJvcGVydHkgdmFsdWUuXHJcbiAgICAgKiBAcGFyYW0gYXJyYXkgLSB0aGUgdGFyZ2V0QXJyYXlcclxuICAgICAqIEBwYXJhbSBrZXlcclxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZVxyXG4gICAgICogQHJldHVybnMgLSBzdWNjZXNzXHJcbiAgICAgKi9cclxuICAgIHNldDogZnVuY3Rpb24oIGFycmF5OiBUW10sIGtleTogc3RyaW5nIHwgc3ltYm9sLCBuZXdWYWx1ZTogYW55ICk6IGJvb2xlYW4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhcnJheSA9PT0gdGFyZ2V0QXJyYXksICdhcnJheSBzaG91bGQgbWF0Y2ggdGhlIHRhcmdldEFycmF5JyApO1xyXG4gICAgICBjb25zdCBvbGRWYWx1ZSA9IGFycmF5WyBrZXkgYXMgYW55IF07XHJcblxyXG4gICAgICBsZXQgcmVtb3ZlZEVsZW1lbnRzID0gbnVsbDtcclxuXHJcbiAgICAgIC8vIFNlZSB3aGljaCBpdGVtcyBhcmUgcmVtb3ZlZFxyXG4gICAgICBpZiAoIGtleSA9PT0gJ2xlbmd0aCcgKSB7XHJcbiAgICAgICAgcmVtb3ZlZEVsZW1lbnRzID0gYXJyYXkuc2xpY2UoIG5ld1ZhbHVlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHJldHVyblZhbHVlID0gUmVmbGVjdC5zZXQoIGFycmF5LCBrZXksIG5ld1ZhbHVlICk7XHJcblxyXG4gICAgICAvLyBJZiB3ZSdyZSB1c2luZyB0aGUgYnJhY2tldCBvcGVyYXRvciBbaW5kZXhdIG9mIEFycmF5LCB0aGVuIHBhcnNlIHRoZSBpbmRleCBiZXR3ZWVuIHRoZSBicmFja2V0cy5cclxuICAgICAgY29uc3QgbnVtYmVyS2V5ID0gTnVtYmVyKCBrZXkgKTtcclxuICAgICAgaWYgKCBOdW1iZXIuaXNJbnRlZ2VyKCBudW1iZXJLZXkgKSAmJiBudW1iZXJLZXkgPj0gMCAmJiBvbGRWYWx1ZSAhPT0gbmV3VmFsdWUgKSB7XHJcbiAgICAgICAgbGVuZ3RoUHJvcGVydHkudmFsdWUgPSBhcnJheS5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggb2xkVmFsdWUgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgIGVsZW1lbnRSZW1vdmVkRW1pdHRlci5lbWl0KCBhcnJheVsga2V5IGFzIGFueSBdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggbmV3VmFsdWUgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgIGVsZW1lbnRBZGRlZEVtaXR0ZXIuZW1pdCggbmV3VmFsdWUgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGtleSA9PT0gJ2xlbmd0aCcgKSB7XHJcbiAgICAgICAgbGVuZ3RoUHJvcGVydHkudmFsdWUgPSBuZXdWYWx1ZTtcclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcmVtb3ZlZEVsZW1lbnRzLCAncmVtb3ZlZEVsZW1lbnRzIHNob3VsZCBiZSBkZWZpbmVkIGZvciBrZXk9PT1sZW5ndGgnICk7XHJcbiAgICAgICAgcmVtb3ZlZEVsZW1lbnRzICYmIHJlbW92ZWRFbGVtZW50cy5mb3JFYWNoKCBlbGVtZW50ID0+IGVsZW1lbnRSZW1vdmVkRW1pdHRlci5lbWl0KCBlbGVtZW50ICkgKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmV0dXJuVmFsdWU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBpcyB0aGUgdHJhcCBmb3IgdGhlIGRlbGV0ZSBvcGVyYXRvci5cclxuICAgICAqL1xyXG4gICAgZGVsZXRlUHJvcGVydHk6IGZ1bmN0aW9uKCBhcnJheTogVFtdLCBrZXk6IHN0cmluZyB8IHN5bWJvbCApOiBib29sZWFuIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYXJyYXkgPT09IHRhcmdldEFycmF5LCAnYXJyYXkgc2hvdWxkIG1hdGNoIHRoZSB0YXJnZXRBcnJheScgKTtcclxuXHJcbiAgICAgIC8vIElmIHdlJ3JlIHVzaW5nIHRoZSBicmFja2V0IG9wZXJhdG9yIFtpbmRleF0gb2YgQXJyYXksIHRoZW4gcGFyc2UgdGhlIGluZGV4IGJldHdlZW4gdGhlIGJyYWNrZXRzLlxyXG4gICAgICBjb25zdCBudW1iZXJLZXkgPSBOdW1iZXIoIGtleSApO1xyXG5cclxuICAgICAgbGV0IHJlbW92ZWQ7XHJcbiAgICAgIGlmICggTnVtYmVyLmlzSW50ZWdlciggbnVtYmVyS2V5ICkgJiYgbnVtYmVyS2V5ID49IDAgKSB7XHJcbiAgICAgICAgcmVtb3ZlZCA9IGFycmF5WyBrZXkgYXMgYW55IF07XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmV0dXJuVmFsdWUgPSBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KCBhcnJheSwga2V5ICk7XHJcbiAgICAgIGlmICggcmVtb3ZlZCAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgIGVsZW1lbnRSZW1vdmVkRW1pdHRlci5lbWl0KCByZW1vdmVkICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcclxuICAgIH1cclxuICB9ICkgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxUPjtcclxuXHJcbiAgb2JzZXJ2YWJsZUFycmF5LnRhcmdldEFycmF5ID0gdGFyZ2V0QXJyYXk7XHJcbiAgb2JzZXJ2YWJsZUFycmF5LmVsZW1lbnRBZGRlZEVtaXR0ZXIgPSBlbGVtZW50QWRkZWRFbWl0dGVyO1xyXG4gIG9ic2VydmFibGVBcnJheS5lbGVtZW50UmVtb3ZlZEVtaXR0ZXIgPSBlbGVtZW50UmVtb3ZlZEVtaXR0ZXI7XHJcbiAgb2JzZXJ2YWJsZUFycmF5Lmxlbmd0aFByb3BlcnR5ID0gbGVuZ3RoUHJvcGVydHk7XHJcblxyXG4gIGNvbnN0IGluaXQgPSAoKSA9PiB7XHJcbiAgICBpZiAoIG9wdGlvbnMubGVuZ3RoID49IDAgKSB7XHJcbiAgICAgIG9ic2VydmFibGVBcnJheS5sZW5ndGggPSBvcHRpb25zLmxlbmd0aDtcclxuICAgIH1cclxuICAgIGlmICggb3B0aW9ucy5lbGVtZW50cy5sZW5ndGggPiAwICkge1xyXG4gICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSggb2JzZXJ2YWJsZUFycmF5LCBvcHRpb25zLmVsZW1lbnRzICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaW5pdCgpO1xyXG5cclxuICAvL1RPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzMzNCBNb3ZlIHRvIFwicHJvdG90eXBlXCIgYWJvdmUgb3IgZHJvcCBzdXBwb3J0XHJcbiAgb2JzZXJ2YWJsZUFycmF5LnJlc2V0ID0gKCkgPT4ge1xyXG4gICAgb2JzZXJ2YWJsZUFycmF5Lmxlbmd0aCA9IDA7XHJcbiAgICBpbml0KCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAqIFBoRVQtaU8gc3VwcG9ydFxyXG4gICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gIGlmICggb3B0aW9ucy50YW5kZW0/LnN1cHBsaWVkICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5waGV0aW9UeXBlICk7XHJcblxyXG4gICAgb2JzZXJ2YWJsZUFycmF5LnBoZXRpb0VsZW1lbnRUeXBlID0gb3B0aW9ucy5waGV0aW9UeXBlLnBhcmFtZXRlclR5cGVzIVsgMCBdO1xyXG5cclxuICAgIC8vIGZvciBtYW5hZ2luZyBzdGF0ZSBpbiBwaGV0LWlvXHJcbiAgICAvLyBVc2UgdGhlIHNhbWUgdGFuZGVtIGFuZCBwaGV0aW9TdGF0ZSBvcHRpb25zIHNvIGl0IGNhbiBcIm1hc3F1ZXJhZGVcIiBhcyB0aGUgcmVhbCBvYmplY3QuICBXaGVuIFBoZXRpb09iamVjdCBpcyBhIG1peGluIHRoaXMgY2FuIGJlIGNoYW5nZWQuXHJcbiAgICBvYnNlcnZhYmxlQXJyYXkuX29ic2VydmFibGVBcnJheVBoZXRpb09iamVjdCA9IG5ldyBPYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3QoIG9ic2VydmFibGVBcnJheSwgb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG9ic2VydmFibGVBcnJheTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYW5hZ2VzIHN0YXRlIHNhdmUvbG9hZC4gVGhpcyBpbXBsZW1lbnRhdGlvbiB1c2VzIFByb3h5IGFuZCBoZW5jZSBjYW5ub3QgYmUgaW5zdHJ1bWVudGVkIGFzIGEgUGhldGlvT2JqZWN0LiAgVGhpcyB0eXBlXHJcbiAqIHByb3ZpZGVzIHRoYXQgZnVuY3Rpb25hbGl0eS5cclxuICovXHJcbmNsYXNzIE9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdDxUPiBleHRlbmRzIFBoZXRpb09iamVjdCB7XHJcblxyXG4gIC8vIGludGVybmFsLCBkb24ndCB1c2VcclxuICBwdWJsaWMgb2JzZXJ2YWJsZUFycmF5OiBPYnNlcnZhYmxlQXJyYXk8VD47XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBvYnNlcnZhYmxlQXJyYXlcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc10gLSBzYW1lIGFzIHRoZSBvcHRpb25zIHRvIHRoZSBwYXJlbnQgT2JzZXJ2YWJsZUFycmF5RGVmXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvYnNlcnZhYmxlQXJyYXk6IE9ic2VydmFibGVBcnJheTxUPiwgcHJvdmlkZWRPcHRpb25zPzogT2JzZXJ2YWJsZUFycmF5T3B0aW9uczxUPiApIHtcclxuXHJcbiAgICBzdXBlciggcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5vYnNlcnZhYmxlQXJyYXkgPSBvYnNlcnZhYmxlQXJyYXk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBNZXRob2RzIHNoYXJlZCBieSBhbGwgT2JzZXJ2YWJsZUFycmF5RGVmIGluc3RhbmNlc1xyXG5jb25zdCBtZXRob2RzID0ge1xyXG5cclxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICogT3ZlcnJpZGRlbiBBcnJheSBtZXRob2RzXHJcbiAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gIHBvcCggLi4uYXJnczogYW55W10gKTogYW55IHtcclxuICAgIGNvbnN0IHRoaXNBcnJheSA9IHRoaXMgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+O1xyXG5cclxuICAgIGNvbnN0IGluaXRpYWxMZW5ndGggPSB0aGlzQXJyYXkudGFyZ2V0QXJyYXkubGVuZ3RoO1xyXG4gICAgY29uc3QgcmV0dXJuVmFsdWUgPSBBcnJheS5wcm90b3R5cGUucG9wLmFwcGx5KCB0aGlzQXJyYXkudGFyZ2V0QXJyYXksIGFyZ3MgYXMgYW55ICk7XHJcbiAgICB0aGlzQXJyYXkubGVuZ3RoUHJvcGVydHkudmFsdWUgPSB0aGlzQXJyYXkubGVuZ3RoO1xyXG4gICAgaW5pdGlhbExlbmd0aCA+IDAgJiYgdGhpc0FycmF5LmVsZW1lbnRSZW1vdmVkRW1pdHRlci5lbWl0KCByZXR1cm5WYWx1ZSApO1xyXG4gICAgcmV0dXJuIHJldHVyblZhbHVlO1xyXG4gIH0sXHJcblxyXG4gIHNoaWZ0KCAuLi5hcmdzOiBhbnlbXSApOiBhbnkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcblxyXG4gICAgY29uc3QgaW5pdGlhbExlbmd0aCA9IHRoaXNBcnJheS50YXJnZXRBcnJheS5sZW5ndGg7XHJcbiAgICBjb25zdCByZXR1cm5WYWx1ZSA9IEFycmF5LnByb3RvdHlwZS5zaGlmdC5hcHBseSggdGhpc0FycmF5LnRhcmdldEFycmF5LCBhcmdzIGFzIGFueSApO1xyXG4gICAgdGhpc0FycmF5Lmxlbmd0aFByb3BlcnR5LnZhbHVlID0gdGhpc0FycmF5Lmxlbmd0aDtcclxuICAgIGluaXRpYWxMZW5ndGggPiAwICYmIHRoaXNBcnJheS5lbGVtZW50UmVtb3ZlZEVtaXR0ZXIuZW1pdCggcmV0dXJuVmFsdWUgKTtcclxuICAgIHJldHVybiByZXR1cm5WYWx1ZTtcclxuICB9LFxyXG5cclxuICBwdXNoKCAuLi5hcmdzOiBhbnlbXSApOiBhbnkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcblxyXG4gICAgY29uc3QgcmV0dXJuVmFsdWUgPSBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSggdGhpc0FycmF5LnRhcmdldEFycmF5LCBhcmdzICk7XHJcbiAgICB0aGlzQXJyYXkubGVuZ3RoUHJvcGVydHkudmFsdWUgPSB0aGlzQXJyYXkubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzQXJyYXkuZWxlbWVudEFkZGVkRW1pdHRlci5lbWl0KCBhcmdzWyBpIF0gKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXR1cm5WYWx1ZTtcclxuICB9LFxyXG5cclxuICB1bnNoaWZ0KCAuLi5hcmdzOiBhbnlbXSApOiBhbnkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcblxyXG4gICAgY29uc3QgcmV0dXJuVmFsdWUgPSBBcnJheS5wcm90b3R5cGUudW5zaGlmdC5hcHBseSggdGhpc0FycmF5LnRhcmdldEFycmF5LCBhcmdzICk7XHJcbiAgICB0aGlzQXJyYXkubGVuZ3RoUHJvcGVydHkudmFsdWUgPSB0aGlzQXJyYXkubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgdGhpc0FycmF5LmVsZW1lbnRBZGRlZEVtaXR0ZXIuZW1pdCggYXJnc1sgaSBdICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0dXJuVmFsdWU7XHJcbiAgfSxcclxuXHJcbiAgc3BsaWNlKCAuLi5hcmdzOiBhbnlbXSApOiBhbnkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcblxyXG4gICAgY29uc3QgcmV0dXJuVmFsdWUgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmFwcGx5KCB0aGlzQXJyYXkudGFyZ2V0QXJyYXksIGFyZ3MgYXMgYW55ICk7XHJcbiAgICB0aGlzQXJyYXkubGVuZ3RoUHJvcGVydHkudmFsdWUgPSB0aGlzQXJyYXkubGVuZ3RoO1xyXG4gICAgY29uc3QgZGVsZXRlZEVsZW1lbnRzID0gcmV0dXJuVmFsdWU7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDI7IGkgPCBhcmdzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzQXJyYXkuZWxlbWVudEFkZGVkRW1pdHRlci5lbWl0KCBhcmdzWyBpIF0gKTtcclxuICAgIH1cclxuICAgIGRlbGV0ZWRFbGVtZW50cy5mb3JFYWNoKCBkZWxldGVkRWxlbWVudCA9PiB0aGlzQXJyYXkuZWxlbWVudFJlbW92ZWRFbWl0dGVyLmVtaXQoIGRlbGV0ZWRFbGVtZW50ICkgKTtcclxuICAgIHJldHVybiByZXR1cm5WYWx1ZTtcclxuICB9LFxyXG5cclxuICBjb3B5V2l0aGluKCAuLi5hcmdzOiBhbnlbXSApOiBhbnkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcblxyXG4gICAgY29uc3QgYmVmb3JlID0gdGhpc0FycmF5LnRhcmdldEFycmF5LnNsaWNlKCk7XHJcbiAgICBjb25zdCByZXR1cm5WYWx1ZSA9IEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluLmFwcGx5KCB0aGlzQXJyYXkudGFyZ2V0QXJyYXksIGFyZ3MgYXMgYW55ICk7XHJcbiAgICByZXBvcnREaWZmZXJlbmNlKCBiZWZvcmUsIHRoaXNBcnJheSApO1xyXG4gICAgcmV0dXJuIHJldHVyblZhbHVlO1xyXG4gIH0sXHJcblxyXG4gIGZpbGwoIC4uLmFyZ3M6IGFueVtdICk6IGFueSB7XHJcbiAgICBjb25zdCB0aGlzQXJyYXkgPSB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PjtcclxuXHJcbiAgICBjb25zdCBiZWZvcmUgPSB0aGlzQXJyYXkudGFyZ2V0QXJyYXkuc2xpY2UoKTtcclxuICAgIGNvbnN0IHJldHVyblZhbHVlID0gQXJyYXkucHJvdG90eXBlLmZpbGwuYXBwbHkoIHRoaXNBcnJheS50YXJnZXRBcnJheSwgYXJncyBhcyBhbnkgKTtcclxuICAgIHJlcG9ydERpZmZlcmVuY2UoIGJlZm9yZSwgdGhpc0FycmF5ICk7XHJcbiAgICByZXR1cm4gcmV0dXJuVmFsdWU7XHJcbiAgfSxcclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAqIEZvciBjb21wYXRpYmlsaXR5IHdpdGggT2JzZXJ2YWJsZUFycmF5RGVmXHJcbiAgICogVE9ETyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXhvbi9pc3N1ZXMvMzM0IGNvbnNpZGVyIGRlbGV0aW5nIGFmdGVyIG1pZ3JhdGlvblxyXG4gICAqIFRPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzMzNCBpZiBub3QgZGVsZXRlZCwgcmVuYW1lICdJdGVtJyB3aXRoICdFbGVtZW50J1xyXG4gICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gIGdldDogZnVuY3Rpb24oIGluZGV4OiBudW1iZXIgKSB7IHJldHVybiAoIHRoaXMgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+IClbIGluZGV4IF07IH0sXHJcbiAgYWRkSXRlbUFkZGVkTGlzdGVuZXI6IGZ1bmN0aW9uKCBsaXN0ZW5lcjogT2JzZXJ2YWJsZUFycmF5TGlzdGVuZXI8YW55PiApIHsgKCB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PiApLmVsZW1lbnRBZGRlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIGxpc3RlbmVyICk7IH0sXHJcbiAgcmVtb3ZlSXRlbUFkZGVkTGlzdGVuZXI6IGZ1bmN0aW9uKCBsaXN0ZW5lcjogT2JzZXJ2YWJsZUFycmF5TGlzdGVuZXI8YW55PiApIHsgKCB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PiApLmVsZW1lbnRBZGRlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIGxpc3RlbmVyICk7IH0sXHJcbiAgYWRkSXRlbVJlbW92ZWRMaXN0ZW5lcjogZnVuY3Rpb24oIGxpc3RlbmVyOiBPYnNlcnZhYmxlQXJyYXlMaXN0ZW5lcjxhbnk+ICkgeyAoIHRoaXMgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+ICkuZWxlbWVudFJlbW92ZWRFbWl0dGVyLmFkZExpc3RlbmVyKCBsaXN0ZW5lciApOyB9LFxyXG4gIHJlbW92ZUl0ZW1SZW1vdmVkTGlzdGVuZXI6IGZ1bmN0aW9uKCBsaXN0ZW5lcjogT2JzZXJ2YWJsZUFycmF5TGlzdGVuZXI8YW55PiApIHsgKCB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PiApLmVsZW1lbnRSZW1vdmVkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggbGlzdGVuZXIgKTsgfSxcclxuICBhZGQ6IGZ1bmN0aW9uKCBlbGVtZW50OiBhbnkgKSB7ICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKS5wdXNoKCBlbGVtZW50ICk7fSxcclxuICBhZGRBbGw6IGZ1bmN0aW9uKCBlbGVtZW50czogYW55W10gKSB7ICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKS5wdXNoKCAuLi5lbGVtZW50cyApO30sXHJcbiAgcmVtb3ZlOiBmdW5jdGlvbiggZWxlbWVudDogYW55ICkgeyBhcnJheVJlbW92ZSggKCB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PiApLCBlbGVtZW50ICk7fSxcclxuICByZW1vdmVBbGw6IGZ1bmN0aW9uKCBlbGVtZW50czogYW55W10gKSB7XHJcbiAgICBlbGVtZW50cy5mb3JFYWNoKCBlbGVtZW50ID0+IGFycmF5UmVtb3ZlKCAoIHRoaXMgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+ICksIGVsZW1lbnQgKSApO1xyXG4gIH0sXHJcbiAgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgd2hpbGUgKCAoIHRoaXMgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+ICkubGVuZ3RoID4gMCApIHtcclxuICAgICAgKCB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PiApLnBvcCgpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgY291bnQ6IGZ1bmN0aW9uKCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxhbnk+ICkge1xyXG4gICAgbGV0IGNvdW50ID0gMDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8ICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaWYgKCBwcmVkaWNhdGUoICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKVsgaSBdICkgKSB7XHJcbiAgICAgICAgY291bnQrKztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNvdW50O1xyXG4gIH0sXHJcbiAgZmluZDogZnVuY3Rpb24oIHByZWRpY2F0ZTogUHJlZGljYXRlPGFueT4sIGZyb21JbmRleD86IG51bWJlciApIHtcclxuICAgIGFzc2VydCAmJiAoIGZyb21JbmRleCAhPT0gdW5kZWZpbmVkICkgJiYgYXNzZXJ0KCB0eXBlb2YgZnJvbUluZGV4ID09PSAnbnVtYmVyJywgJ2Zyb21JbmRleCBtdXN0IGJlIG51bWVyaWMsIGlmIHByb3ZpZGVkJyApO1xyXG4gICAgYXNzZXJ0ICYmICggdHlwZW9mIGZyb21JbmRleCA9PT0gJ251bWJlcicgKSAmJiBhc3NlcnQoIGZyb21JbmRleCA+PSAwICYmIGZyb21JbmRleCA8ICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKS5sZW5ndGgsXHJcbiAgICAgIGBmcm9tSW5kZXggb3V0IG9mIGJvdW5kczogJHtmcm9tSW5kZXh9YCApO1xyXG4gICAgcmV0dXJuIF8uZmluZCggKCB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PiApLCBwcmVkaWNhdGUsIGZyb21JbmRleCApO1xyXG4gIH0sXHJcbiAgc2h1ZmZsZTogZnVuY3Rpb24oIHJhbmRvbTogRmFrZVJhbmRvbTxhbnk+ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmFuZG9tLCAncmFuZG9tIG11c3QgYmUgc3VwcGxpZWQnICk7XHJcblxyXG4gICAgLy8gcHJlc2VydmUgdGhlIHNhbWUgX2FycmF5IHJlZmVyZW5jZSBpbiBjYXNlIGFueSBjbGllbnRzIGdvdCBhIHJlZmVyZW5jZSB0byBpdCB3aXRoIGdldEFycmF5KClcclxuICAgIGNvbnN0IHNodWZmbGVkID0gcmFuZG9tLnNodWZmbGUoICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKSApO1xyXG5cclxuICAgIC8vIEFjdCBvbiB0aGUgdGFyZ2V0QXJyYXkgc28gdGhhdCByZW1vdmFsIGFuZCBhZGQgbm90aWZpY2F0aW9ucyBhcmVuJ3Qgc2VudC5cclxuICAgICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKS50YXJnZXRBcnJheS5sZW5ndGggPSAwO1xyXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKS50YXJnZXRBcnJheSwgc2h1ZmZsZWQgKTtcclxuICB9LFxyXG5cclxuICAvLyBUT0RPIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy8zMzQgVGhpcyBhbHNvIHNlZW1zIGltcG9ydGFudCB0byBlbGltaW5hdGVcclxuICBnZXRBcnJheUNvcHk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gKCB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PiApLnNsaWNlKCk7IH0sXHJcblxyXG4gIGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcbiAgICB0aGlzQXJyYXkuZWxlbWVudEFkZGVkRW1pdHRlci5kaXNwb3NlKCk7XHJcbiAgICB0aGlzQXJyYXkuZWxlbWVudFJlbW92ZWRFbWl0dGVyLmRpc3Bvc2UoKTtcclxuICAgIHRoaXNBcnJheS5sZW5ndGhQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzQXJyYXkuX29ic2VydmFibGVBcnJheVBoZXRpb09iamVjdCAmJiB0aGlzQXJyYXkuX29ic2VydmFibGVBcnJheVBoZXRpb09iamVjdC5kaXNwb3NlKCk7XHJcbiAgfSxcclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAqIFBoRVQtaU9cclxuICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuICB0b1N0YXRlT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7IGFycmF5OiAoIHRoaXMgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+ICkubWFwKCBpdGVtID0+ICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKS5waGV0aW9FbGVtZW50VHlwZSEudG9TdGF0ZU9iamVjdCggaXRlbSApICkgfTtcclxuICB9LFxyXG4gIGFwcGx5U3RhdGU6IGZ1bmN0aW9uKCBzdGF0ZU9iamVjdDogT2JzZXJ2YWJsZUFycmF5U3RhdGVPYmplY3Q8YW55PiApIHtcclxuICAgICggdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKS5sZW5ndGggPSAwO1xyXG4gICAgY29uc3QgZWxlbWVudHMgPSBzdGF0ZU9iamVjdC5hcnJheS5tYXAoIHBhcmFtU3RhdGVPYmplY3QgPT4gKCB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PiApLnBoZXRpb0VsZW1lbnRUeXBlIS5mcm9tU3RhdGVPYmplY3QoIHBhcmFtU3RhdGVPYmplY3QgKSApO1xyXG4gICAgdGhpcy5wdXNoKCAuLi5lbGVtZW50cyApO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGb3IgY29weVdpdGhpbiBhbmQgZmlsbCwgd2hpY2ggaGF2ZSBtb3JlIGNvbXBsZXggYmVoYXZpb3IsIHdlIHRyZWF0IHRoZSBhcnJheSBhcyBhIGJsYWNrIGJveCwgbWFraW5nIGEgc2hhbGxvdyBjb3B5XHJcbiAqIGJlZm9yZSB0aGUgb3BlcmF0aW9uIGluIG9yZGVyIHRvIGlkZW50aWZ5IHdoYXQgaGFzIGJlZW4gYWRkZWQgYW5kIHJlbW92ZWQuXHJcbiAqL1xyXG5jb25zdCByZXBvcnREaWZmZXJlbmNlID0gKCBzaGFsbG93Q29weTogYW55W10sIG9ic2VydmFibGVBcnJheTogUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+ICkgPT4ge1xyXG5cclxuICBjb25zdCBiZWZvcmUgPSBzaGFsbG93Q29weTtcclxuICBjb25zdCBhZnRlciA9IG9ic2VydmFibGVBcnJheS50YXJnZXRBcnJheS5zbGljZSgpO1xyXG5cclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBiZWZvcmUubGVuZ3RoOyBpKysgKSB7XHJcbiAgICBjb25zdCBiZWZvcmVFbGVtZW50ID0gYmVmb3JlWyBpIF07XHJcbiAgICBjb25zdCBhZnRlckluZGV4ID0gYWZ0ZXIuaW5kZXhPZiggYmVmb3JlRWxlbWVudCApO1xyXG4gICAgaWYgKCBhZnRlckluZGV4ID49IDAgKSB7XHJcbiAgICAgIGJlZm9yZS5zcGxpY2UoIGksIDEgKTtcclxuICAgICAgYWZ0ZXIuc3BsaWNlKCBhZnRlckluZGV4LCAxICk7XHJcbiAgICAgIGktLTtcclxuICAgIH1cclxuICB9XHJcbiAgYmVmb3JlLmZvckVhY2goIGVsZW1lbnQgPT4gb2JzZXJ2YWJsZUFycmF5LmVsZW1lbnRSZW1vdmVkRW1pdHRlci5lbWl0KCBlbGVtZW50ICkgKTtcclxuICBhZnRlci5mb3JFYWNoKCBlbGVtZW50ID0+IG9ic2VydmFibGVBcnJheS5lbGVtZW50QWRkZWRFbWl0dGVyLmVtaXQoIGVsZW1lbnQgKSApO1xyXG59O1xyXG5cclxuLy8gQ2FjaGUgZWFjaCBwYXJhbWV0ZXJpemVkIE9ic2VydmFibGVBcnJheUlPXHJcbi8vIGJhc2VkIG9uIHRoZSBwYXJhbWV0ZXIgdHlwZSwgc28gdGhhdCBpdCBpcyBvbmx5IGNyZWF0ZWQgb25jZS5cclxuY29uc3QgY2FjaGUgPSBuZXcgSU9UeXBlQ2FjaGUoKTtcclxuXHJcblxyXG4vKipcclxuICogT2JzZXJ2YWJsZUFycmF5SU8gaXMgdGhlIElPVHlwZSBmb3IgT2JzZXJ2YWJsZUFycmF5RGVmLiBJdCBkZWxlZ2F0ZXMgbW9zdCBvZiBpdHMgaW1wbGVtZW50YXRpb24gdG8gT2JzZXJ2YWJsZUFycmF5RGVmLlxyXG4gKiBJbnN0ZWFkIG9mIGJlaW5nIGEgcGFyYW1ldHJpYyB0eXBlLCBpdCBsZXZlcmFnZXMgdGhlIHBoZXRpb0VsZW1lbnRUeXBlIG9uIE9ic2VydmFibGVBcnJheURlZi5cclxuICovXHJcbmNvbnN0IE9ic2VydmFibGVBcnJheUlPID0gKCBwYXJhbWV0ZXJUeXBlOiBJT1R5cGUgKTogSU9UeXBlID0+IHtcclxuICBpZiAoICFjYWNoZS5oYXMoIHBhcmFtZXRlclR5cGUgKSApIHtcclxuICAgIGNhY2hlLnNldCggcGFyYW1ldGVyVHlwZSwgbmV3IElPVHlwZSggYE9ic2VydmFibGVBcnJheUlPPCR7cGFyYW1ldGVyVHlwZS50eXBlTmFtZX0+YCwge1xyXG4gICAgICB2YWx1ZVR5cGU6IE9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdCxcclxuICAgICAgcGFyYW1ldGVyVHlwZXM6IFsgcGFyYW1ldGVyVHlwZSBdLFxyXG4gICAgICB0b1N0YXRlT2JqZWN0OiAoIG9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdDogT2JzZXJ2YWJsZUFycmF5UGhldGlvT2JqZWN0PGFueT4gKSA9PiBvYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3Qub2JzZXJ2YWJsZUFycmF5LnRvU3RhdGVPYmplY3QoKSxcclxuICAgICAgYXBwbHlTdGF0ZTogKCBvYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3Q6IE9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdDxhbnk+LCBzdGF0ZTogT2JzZXJ2YWJsZUFycmF5U3RhdGVPYmplY3Q8YW55PiApID0+IG9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdC5vYnNlcnZhYmxlQXJyYXkuYXBwbHlTdGF0ZSggc3RhdGUgKSxcclxuICAgICAgc3RhdGVTY2hlbWE6IHtcclxuICAgICAgICBhcnJheTogQXJyYXlJTyggcGFyYW1ldGVyVHlwZSApXHJcbiAgICAgIH1cclxuICAgIH0gKSApO1xyXG4gIH1cclxuICByZXR1cm4gY2FjaGUuZ2V0KCBwYXJhbWV0ZXJUeXBlICkhO1xyXG59O1xyXG5cclxuY3JlYXRlT2JzZXJ2YWJsZUFycmF5Lk9ic2VydmFibGVBcnJheUlPID0gT2JzZXJ2YWJsZUFycmF5SU87XHJcblxyXG5heG9uLnJlZ2lzdGVyKCAnY3JlYXRlT2JzZXJ2YWJsZUFycmF5JywgY3JlYXRlT2JzZXJ2YWJsZUFycmF5ICk7XHJcbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZU9ic2VydmFibGVBcnJheTtcclxuZXhwb3J0IHsgT2JzZXJ2YWJsZUFycmF5SU8gfTtcclxuZXhwb3J0IHR5cGUgeyBPYnNlcnZhYmxlQXJyYXkgfTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sbUNBQW1DO0FBRTNELE9BQU9DLDhCQUE4QixNQUFNLHNEQUFzRDtBQUNqRyxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLFNBQVMsSUFBSUMsY0FBYyxRQUFRLGlDQUFpQztBQUMzRSxPQUFPQyxZQUFZLE1BQStCLGlDQUFpQztBQUNuRixPQUFPQyxPQUFPLE1BQU0sa0NBQWtDO0FBQ3RELE9BQU9DLE1BQU0sTUFBTSxpQ0FBaUM7QUFDcEQsT0FBT0MsSUFBSSxNQUFNLFdBQVc7QUFDNUIsT0FBT0MsT0FBTyxNQUEwQixjQUFjO0FBQ3RELE9BQU9DLGNBQWMsTUFBaUMscUJBQXFCO0FBQzNFLE9BQU9DLFVBQVUsTUFBTSxpQkFBaUI7QUFFeEMsT0FBT0MsNEJBQTRCLE1BQU0saURBQWlEO0FBQzFGLE9BQU9DLFdBQVcsTUFBTSxnQ0FBZ0M7O0FBRXhEOztBQUd1RDtBQUNBOztBQTRDdkQ7O0FBU0EsTUFBTUMscUJBQXFCLEdBQVFDLGVBQTJDLElBQTBC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