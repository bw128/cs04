// Copyright 2020-2024, University of Colorado Boulder

/**
 * PhET-iO Type for JS's built-in Float64Array type
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Klusendorf
 */

import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import StateSchema from './StateSchema.js';
const Float64ArrayIO = new IOType('Float64ArrayIO', {
  valueType: Float64Array,
  toStateObject: array => {
    const result = [];
    array.forEach(float => result.push(float));
    return result;
  },
  fromStateObject: stateObject => new Float64Array(stateObject),
  stateSchema: StateSchema.asValue('Float64Array', {
    isValidValue: value => Array.isArray(value) && value.find(v => typeof v !== 'number' || isNaN(v)) === undefined
  }),
  // Float64ArrayIO is a data type, and uses the toStateObject/fromStateObject exclusively for data type serialization.
  // Sites that use Float64ArrayIO as a reference type can use this method to update the state of an existing Float64Arary.
  applyState: (array, stateObject) => array.set(stateObject)
});
tandemNamespace.register('Float64ArrayIO', Float64ArrayIO);
export default Float64ArrayIO;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0YW5kZW1OYW1lc3BhY2UiLCJJT1R5cGUiLCJTdGF0ZVNjaGVtYSIsIkZsb2F0NjRBcnJheUlPIiwidmFsdWVUeXBlIiwiRmxvYXQ2NEFycmF5IiwidG9TdGF0ZU9iamVjdCIsImFycmF5IiwicmVzdWx0IiwiZm9yRWFjaCIsImZsb2F0IiwicHVzaCIsImZyb21TdGF0ZU9iamVjdCIsInN0YXRlT2JqZWN0Iiwic3RhdGVTY2hlbWEiLCJhc1ZhbHVlIiwiaXNWYWxpZFZhbHVlIiwidmFsdWUiLCJBcnJheSIsImlzQXJyYXkiLCJmaW5kIiwidiIsImlzTmFOIiwidW5kZWZpbmVkIiwiYXBwbHlTdGF0ZSIsInNldCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRmxvYXQ2NEFycmF5SU8udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUGhFVC1pTyBUeXBlIGZvciBKUydzIGJ1aWx0LWluIEZsb2F0NjRBcnJheSB0eXBlXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICogQGF1dGhvciBDaHJpcyBLbHVzZW5kb3JmXHJcbiAqL1xyXG5cclxuaW1wb3J0IHRhbmRlbU5hbWVzcGFjZSBmcm9tICcuLi90YW5kZW1OYW1lc3BhY2UuanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4vSU9UeXBlLmpzJztcclxuaW1wb3J0IFN0YXRlU2NoZW1hIGZyb20gJy4vU3RhdGVTY2hlbWEuanMnO1xyXG5cclxuY29uc3QgRmxvYXQ2NEFycmF5SU8gPSBuZXcgSU9UeXBlPEZsb2F0NjRBcnJheSwgbnVtYmVyW10+KCAnRmxvYXQ2NEFycmF5SU8nLCB7XHJcbiAgdmFsdWVUeXBlOiBGbG9hdDY0QXJyYXksXHJcbiAgdG9TdGF0ZU9iamVjdDogYXJyYXkgPT4ge1xyXG4gICAgY29uc3QgcmVzdWx0OiBudW1iZXJbXSA9IFtdO1xyXG4gICAgYXJyYXkuZm9yRWFjaCggZmxvYXQgPT4gcmVzdWx0LnB1c2goIGZsb2F0ICkgKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfSxcclxuICBmcm9tU3RhdGVPYmplY3Q6IHN0YXRlT2JqZWN0ID0+IG5ldyBGbG9hdDY0QXJyYXkoIHN0YXRlT2JqZWN0ICksXHJcbiAgc3RhdGVTY2hlbWE6IFN0YXRlU2NoZW1hLmFzVmFsdWU8RmxvYXQ2NEFycmF5LCBudW1iZXJbXT4oICdGbG9hdDY0QXJyYXknLCB7XHJcbiAgICBpc1ZhbGlkVmFsdWU6ICggdmFsdWU6IG51bWJlcltdICkgPT4gQXJyYXkuaXNBcnJheSggdmFsdWUgKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLmZpbmQoIHYgPT4gdHlwZW9mIHYgIT09ICdudW1iZXInIHx8IGlzTmFOKCB2ICkgKSA9PT0gdW5kZWZpbmVkXHJcbiAgfSApLFxyXG5cclxuICAvLyBGbG9hdDY0QXJyYXlJTyBpcyBhIGRhdGEgdHlwZSwgYW5kIHVzZXMgdGhlIHRvU3RhdGVPYmplY3QvZnJvbVN0YXRlT2JqZWN0IGV4Y2x1c2l2ZWx5IGZvciBkYXRhIHR5cGUgc2VyaWFsaXphdGlvbi5cclxuICAvLyBTaXRlcyB0aGF0IHVzZSBGbG9hdDY0QXJyYXlJTyBhcyBhIHJlZmVyZW5jZSB0eXBlIGNhbiB1c2UgdGhpcyBtZXRob2QgdG8gdXBkYXRlIHRoZSBzdGF0ZSBvZiBhbiBleGlzdGluZyBGbG9hdDY0QXJhcnkuXHJcbiAgYXBwbHlTdGF0ZTogKCBhcnJheSwgc3RhdGVPYmplY3QgKSA9PiBhcnJheS5zZXQoIHN0YXRlT2JqZWN0IClcclxufSApO1xyXG5cclxudGFuZGVtTmFtZXNwYWNlLnJlZ2lzdGVyKCAnRmxvYXQ2NEFycmF5SU8nLCBGbG9hdDY0QXJyYXlJTyApO1xyXG5leHBvcnQgZGVmYXVsdCBGbG9hdDY0QXJyYXlJTzsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sdUJBQXVCO0FBQ25ELE9BQU9DLE1BQU0sTUFBTSxhQUFhO0FBQ2hDLE9BQU9DLFdBQVcsTUFBTSxrQkFBa0I7QUFFMUMsTUFBTUMsY0FBYyxHQUFHLElBQUlGLE1BQU0sQ0FBMEIsZ0JBQWdCLEVBQUU7RUFDM0VHLFNBQVMsRUFBRUMsWUFBWTtFQUN2QkMsYUFBYSxFQUFFQyxLQUFLLElBQUk7SUFDdEIsTUFBTUMsTUFBZ0IsR0FBRyxFQUFFO0lBQzNCRCxLQUFLLENBQUNFLE9BQU8sQ0FBRUMsS0FBSyxJQUFJRixNQUFNLENBQUNHLElBQUksQ0FBRUQsS0FBTSxDQUFFLENBQUM7SUFDOUMsT0FBT0YsTUFBTTtFQUNmLENBQUM7RUFDREksZUFBZSxFQUFFQyxXQUFXLElBQUksSUFBSVIsWUFBWSxDQUFFUSxXQUFZLENBQUM7RUFDL0RDLFdBQVcsRUFBRVosV0FBVyxDQUFDYSxPQUFPLENBQTBCLGNBQWMsRUFBRTtJQUN4RUMsWUFBWSxFQUFJQyxLQUFlLElBQU1DLEtBQUssQ0FBQ0MsT0FBTyxDQUFFRixLQUFNLENBQUMsSUFDdEJBLEtBQUssQ0FBQ0csSUFBSSxDQUFFQyxDQUFDLElBQUksT0FBT0EsQ0FBQyxLQUFLLFFBQVEsSUFBSUMsS0FBSyxDQUFFRCxDQUFFLENBQUUsQ0FBQyxLQUFLRTtFQUNsRyxDQUFFLENBQUM7RUFFSDtFQUNBO0VBQ0FDLFVBQVUsRUFBRUEsQ0FBRWpCLEtBQUssRUFBRU0sV0FBVyxLQUFNTixLQUFLLENBQUNrQixHQUFHLENBQUVaLFdBQVk7QUFDL0QsQ0FBRSxDQUFDO0FBRUhiLGVBQWUsQ0FBQzBCLFFBQVEsQ0FBRSxnQkFBZ0IsRUFBRXZCLGNBQWUsQ0FBQztBQUM1RCxlQUFlQSxjQUFjIiwiaWdub3JlTGlzdCI6W119