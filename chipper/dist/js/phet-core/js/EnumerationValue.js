// Copyright 2021-2023, University of Colorado Boulder

/**
 * EnumerationValue is the base class for enumeration value instances.
 * See https://github.com/phetsims/phet-info/blob/main/doc/phet-software-design-patterns.md#enumeration
 *
 * PhET's Enumeration pattern is:
 *
 * class MyEnumeration extends EnumerationValue {
 *   public static readonly VALUE_1 = new MyEnumeration();
 *   public static readonly VALUE_2 = new MyEnumeration();
 *
 *   // Make sure this is last, once all EnumerationValues have been declared statically.
 *   public static readonly enumeration = new Enumeration( MyEnumeration );
 * }
 *
 * // Usage
 * console.log( MyEnumeration.VALUE_1 );
 * const printValue = enumValue => {
 *   assert && assert( enumValue.enumeration.values.includes(enumValue));
 *   console.log( enumValue );
 * };
 * printValue( MyEnumeration.VALUE_2 );
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import phetCore from './phetCore.js';
class EnumerationValue {
  // null until set by Enumeration. Once set, cannot be changed.

  // After an Enumeration is constructed, no new instances of that exact type can be made (though it is OK to
  // create subtypes)
  static sealedCache = new Set();
  toString() {
    return this.name;
  }

  // This method is unused, but needs to remain here so other types don't accidentally structurally match
  // enumeration values.  Without this, string satisfies the EnumerationValue interface, but we don't want it to.
  isEnumerationValue() {
    return true;
  }
  constructor() {
    const c = this.constructor;
    assert && assert(!EnumerationValue.sealedCache.has(c), 'cannot create instanceof of a sealed constructor');
    this._name = null;
    this._enumeration = null;
  }
  set name(name) {
    assert && assert(!this._name, 'name cannot be changed once defined.');
    this._name = name;
  }
  get name() {
    assert && assert(this._name, 'name cannot be retrieved until it has been filled in by Enumeration.');
    return this._name;
  }
  set enumeration(enumeration) {
    assert && assert(!this._enumeration, 'enumeration cannot be changed once defined.');
    this._enumeration = enumeration;
  }
  get enumeration() {
    assert && assert(this._enumeration, 'enumeration cannot be retrieved until it has been filled in by Enumeration.');
    return this._enumeration;
  }
}
phetCore.register('EnumerationValue', EnumerationValue);
export default EnumerationValue;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsIkVudW1lcmF0aW9uVmFsdWUiLCJzZWFsZWRDYWNoZSIsIlNldCIsInRvU3RyaW5nIiwibmFtZSIsImlzRW51bWVyYXRpb25WYWx1ZSIsImNvbnN0cnVjdG9yIiwiYyIsImFzc2VydCIsImhhcyIsIl9uYW1lIiwiX2VudW1lcmF0aW9uIiwiZW51bWVyYXRpb24iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkVudW1lcmF0aW9uVmFsdWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRW51bWVyYXRpb25WYWx1ZSBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgZW51bWVyYXRpb24gdmFsdWUgaW5zdGFuY2VzLlxyXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW5mby9ibG9iL21haW4vZG9jL3BoZXQtc29mdHdhcmUtZGVzaWduLXBhdHRlcm5zLm1kI2VudW1lcmF0aW9uXHJcbiAqXHJcbiAqIFBoRVQncyBFbnVtZXJhdGlvbiBwYXR0ZXJuIGlzOlxyXG4gKlxyXG4gKiBjbGFzcyBNeUVudW1lcmF0aW9uIGV4dGVuZHMgRW51bWVyYXRpb25WYWx1ZSB7XHJcbiAqICAgcHVibGljIHN0YXRpYyByZWFkb25seSBWQUxVRV8xID0gbmV3IE15RW51bWVyYXRpb24oKTtcclxuICogICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFZBTFVFXzIgPSBuZXcgTXlFbnVtZXJhdGlvbigpO1xyXG4gKlxyXG4gKiAgIC8vIE1ha2Ugc3VyZSB0aGlzIGlzIGxhc3QsIG9uY2UgYWxsIEVudW1lcmF0aW9uVmFsdWVzIGhhdmUgYmVlbiBkZWNsYXJlZCBzdGF0aWNhbGx5LlxyXG4gKiAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgZW51bWVyYXRpb24gPSBuZXcgRW51bWVyYXRpb24oIE15RW51bWVyYXRpb24gKTtcclxuICogfVxyXG4gKlxyXG4gKiAvLyBVc2FnZVxyXG4gKiBjb25zb2xlLmxvZyggTXlFbnVtZXJhdGlvbi5WQUxVRV8xICk7XHJcbiAqIGNvbnN0IHByaW50VmFsdWUgPSBlbnVtVmFsdWUgPT4ge1xyXG4gKiAgIGFzc2VydCAmJiBhc3NlcnQoIGVudW1WYWx1ZS5lbnVtZXJhdGlvbi52YWx1ZXMuaW5jbHVkZXMoZW51bVZhbHVlKSk7XHJcbiAqICAgY29uc29sZS5sb2coIGVudW1WYWx1ZSApO1xyXG4gKiB9O1xyXG4gKiBwcmludFZhbHVlKCBNeUVudW1lcmF0aW9uLlZBTFVFXzIgKTtcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuaW1wb3J0IEVudW1lcmF0aW9uIGZyb20gJy4vRW51bWVyYXRpb24uanMnO1xyXG5pbXBvcnQgQ29uc3RydWN0b3IgZnJvbSAnLi90eXBlcy9Db25zdHJ1Y3Rvci5qcyc7XHJcblxyXG5jbGFzcyBFbnVtZXJhdGlvblZhbHVlIHtcclxuXHJcbiAgLy8gbnVsbCB1bnRpbCBzZXQgYnkgRW51bWVyYXRpb24uIE9uY2Ugc2V0LCBjYW5ub3QgYmUgY2hhbmdlZC5cclxuICBwcml2YXRlIF9uYW1lOiBzdHJpbmcgfCBudWxsO1xyXG4gIHByaXZhdGUgX2VudW1lcmF0aW9uOiBFbnVtZXJhdGlvbjx0aGlzPiB8IG51bGw7XHJcblxyXG4gIC8vIEFmdGVyIGFuIEVudW1lcmF0aW9uIGlzIGNvbnN0cnVjdGVkLCBubyBuZXcgaW5zdGFuY2VzIG9mIHRoYXQgZXhhY3QgdHlwZSBjYW4gYmUgbWFkZSAodGhvdWdoIGl0IGlzIE9LIHRvXHJcbiAgLy8gY3JlYXRlIHN1YnR5cGVzKVxyXG4gIHB1YmxpYyBzdGF0aWMgc2VhbGVkQ2FjaGUgPSBuZXcgU2V0PENvbnN0cnVjdG9yPEVudW1lcmF0aW9uVmFsdWU+PigpO1xyXG5cclxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbiAgfVxyXG5cclxuICAvLyBUaGlzIG1ldGhvZCBpcyB1bnVzZWQsIGJ1dCBuZWVkcyB0byByZW1haW4gaGVyZSBzbyBvdGhlciB0eXBlcyBkb24ndCBhY2NpZGVudGFsbHkgc3RydWN0dXJhbGx5IG1hdGNoXHJcbiAgLy8gZW51bWVyYXRpb24gdmFsdWVzLiAgV2l0aG91dCB0aGlzLCBzdHJpbmcgc2F0aXNmaWVzIHRoZSBFbnVtZXJhdGlvblZhbHVlIGludGVyZmFjZSwgYnV0IHdlIGRvbid0IHdhbnQgaXQgdG8uXHJcbiAgcHJpdmF0ZSBpc0VudW1lcmF0aW9uVmFsdWUoKTogYm9vbGVhbiB7cmV0dXJuIHRydWU7fVxyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICBjb25zdCBjID0gdGhpcy5jb25zdHJ1Y3RvciBhcyBDb25zdHJ1Y3RvcjxFbnVtZXJhdGlvblZhbHVlPjtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFFbnVtZXJhdGlvblZhbHVlLnNlYWxlZENhY2hlLmhhcyggYyApLCAnY2Fubm90IGNyZWF0ZSBpbnN0YW5jZW9mIG9mIGEgc2VhbGVkIGNvbnN0cnVjdG9yJyApO1xyXG5cclxuICAgIHRoaXMuX25hbWUgPSBudWxsO1xyXG4gICAgdGhpcy5fZW51bWVyYXRpb24gPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBuYW1lKCBuYW1lOiBzdHJpbmcgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5fbmFtZSwgJ25hbWUgY2Fubm90IGJlIGNoYW5nZWQgb25jZSBkZWZpbmVkLicgKTtcclxuICAgIHRoaXMuX25hbWUgPSBuYW1lO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBuYW1lKCk6IHN0cmluZyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9uYW1lLCAnbmFtZSBjYW5ub3QgYmUgcmV0cmlldmVkIHVudGlsIGl0IGhhcyBiZWVuIGZpbGxlZCBpbiBieSBFbnVtZXJhdGlvbi4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fbmFtZSE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGVudW1lcmF0aW9uKCBlbnVtZXJhdGlvbjogRW51bWVyYXRpb248dGhpcz4gKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5fZW51bWVyYXRpb24sICdlbnVtZXJhdGlvbiBjYW5ub3QgYmUgY2hhbmdlZCBvbmNlIGRlZmluZWQuJyApO1xyXG4gICAgdGhpcy5fZW51bWVyYXRpb24gPSBlbnVtZXJhdGlvbjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZW51bWVyYXRpb24oKTogRW51bWVyYXRpb248dGhpcz4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fZW51bWVyYXRpb24sICdlbnVtZXJhdGlvbiBjYW5ub3QgYmUgcmV0cmlldmVkIHVudGlsIGl0IGhhcyBiZWVuIGZpbGxlZCBpbiBieSBFbnVtZXJhdGlvbi4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fZW51bWVyYXRpb24hO1xyXG4gIH1cclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdFbnVtZXJhdGlvblZhbHVlJywgRW51bWVyYXRpb25WYWx1ZSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgRW51bWVyYXRpb25WYWx1ZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFFBQVEsTUFBTSxlQUFlO0FBSXBDLE1BQU1DLGdCQUFnQixDQUFDO0VBRXJCOztFQUlBO0VBQ0E7RUFDQSxPQUFjQyxXQUFXLEdBQUcsSUFBSUMsR0FBRyxDQUFnQyxDQUFDO0VBRTdEQyxRQUFRQSxDQUFBLEVBQVc7SUFDeEIsT0FBTyxJQUFJLENBQUNDLElBQUk7RUFDbEI7O0VBRUE7RUFDQTtFQUNRQyxrQkFBa0JBLENBQUEsRUFBWTtJQUFDLE9BQU8sSUFBSTtFQUFDO0VBRTVDQyxXQUFXQSxDQUFBLEVBQUc7SUFDbkIsTUFBTUMsQ0FBQyxHQUFHLElBQUksQ0FBQ0QsV0FBNEM7SUFDM0RFLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUNSLGdCQUFnQixDQUFDQyxXQUFXLENBQUNRLEdBQUcsQ0FBRUYsQ0FBRSxDQUFDLEVBQUUsa0RBQW1ELENBQUM7SUFFOUcsSUFBSSxDQUFDRyxLQUFLLEdBQUcsSUFBSTtJQUNqQixJQUFJLENBQUNDLFlBQVksR0FBRyxJQUFJO0VBQzFCO0VBRUEsSUFBV1AsSUFBSUEsQ0FBRUEsSUFBWSxFQUFHO0lBQzlCSSxNQUFNLElBQUlBLE1BQU0sQ0FBRSxDQUFDLElBQUksQ0FBQ0UsS0FBSyxFQUFFLHNDQUF1QyxDQUFDO0lBQ3ZFLElBQUksQ0FBQ0EsS0FBSyxHQUFHTixJQUFJO0VBQ25CO0VBRUEsSUFBV0EsSUFBSUEsQ0FBQSxFQUFXO0lBQ3hCSSxNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNFLEtBQUssRUFBRSxzRUFBdUUsQ0FBQztJQUN0RyxPQUFPLElBQUksQ0FBQ0EsS0FBSztFQUNuQjtFQUVBLElBQVdFLFdBQVdBLENBQUVBLFdBQThCLEVBQUc7SUFDdkRKLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUMsSUFBSSxDQUFDRyxZQUFZLEVBQUUsNkNBQThDLENBQUM7SUFDckYsSUFBSSxDQUFDQSxZQUFZLEdBQUdDLFdBQVc7RUFDakM7RUFFQSxJQUFXQSxXQUFXQSxDQUFBLEVBQXNCO0lBQzFDSixNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNHLFlBQVksRUFBRSw2RUFBOEUsQ0FBQztJQUNwSCxPQUFPLElBQUksQ0FBQ0EsWUFBWTtFQUMxQjtBQUNGO0FBRUFaLFFBQVEsQ0FBQ2MsUUFBUSxDQUFFLGtCQUFrQixFQUFFYixnQkFBaUIsQ0FBQztBQUV6RCxlQUFlQSxnQkFBZ0IiLCJpZ25vcmVMaXN0IjpbXX0=