// Copyright 2019-2023, University of Colorado Boulder

/**
 * Preload file that sorts the keys in an object intended for JSON, using the strategy defined in
 * https://stackoverflow.com/questions/5467129/sort-javascript-object-by-key
 *
 * This is used in the simulation side to make sure the elements-baseline file is sorted, and used in the phet-io
 * wrapper side to make sure the elements-overrides file is sorted.
 *
 * Namespacing and naming are discussed in https://github.com/phetsims/phet-io/issues/1446#issuecomment-476842068 and below
 * NOTE: Please be mindful of the copy in formatPhetioAPI, see https://github.com/phetsims/phet-io/issues/1733
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
import phetCore from './phetCore.js';

/**
 * Creates a new object, recursively, by sorting the keys at each level.
 * @param unordered - jsonifiable object to be sorted by key name.  Sorting is recursive and hence.
 */
function copyWithSortedKeys(unordered) {
  if (Array.isArray(unordered)) {
    return unordered.map(copyWithSortedKeys);
  } else if (typeof unordered !== 'object' || unordered === null) {
    return unordered;
  }
  const ordered = {};
  Object.keys(unordered).sort().forEach(key => {
    // @ts-expect-error
    const value = unordered[key];
    // @ts-expect-error
    ordered[key] = copyWithSortedKeys(value);
  });
  return ordered;
}
phetCore.register('copyWithSortedKeys', copyWithSortedKeys);
export default copyWithSortedKeys;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsImNvcHlXaXRoU29ydGVkS2V5cyIsInVub3JkZXJlZCIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsIm9yZGVyZWQiLCJPYmplY3QiLCJrZXlzIiwic29ydCIsImZvckVhY2giLCJrZXkiLCJ2YWx1ZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiY29weVdpdGhTb3J0ZWRLZXlzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFByZWxvYWQgZmlsZSB0aGF0IHNvcnRzIHRoZSBrZXlzIGluIGFuIG9iamVjdCBpbnRlbmRlZCBmb3IgSlNPTiwgdXNpbmcgdGhlIHN0cmF0ZWd5IGRlZmluZWQgaW5cclxuICogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTQ2NzEyOS9zb3J0LWphdmFzY3JpcHQtb2JqZWN0LWJ5LWtleVxyXG4gKlxyXG4gKiBUaGlzIGlzIHVzZWQgaW4gdGhlIHNpbXVsYXRpb24gc2lkZSB0byBtYWtlIHN1cmUgdGhlIGVsZW1lbnRzLWJhc2VsaW5lIGZpbGUgaXMgc29ydGVkLCBhbmQgdXNlZCBpbiB0aGUgcGhldC1pb1xyXG4gKiB3cmFwcGVyIHNpZGUgdG8gbWFrZSBzdXJlIHRoZSBlbGVtZW50cy1vdmVycmlkZXMgZmlsZSBpcyBzb3J0ZWQuXHJcbiAqXHJcbiAqIE5hbWVzcGFjaW5nIGFuZCBuYW1pbmcgYXJlIGRpc2N1c3NlZCBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTQ0NiNpc3N1ZWNvbW1lbnQtNDc2ODQyMDY4IGFuZCBiZWxvd1xyXG4gKiBOT1RFOiBQbGVhc2UgYmUgbWluZGZ1bCBvZiB0aGUgY29weSBpbiBmb3JtYXRQaGV0aW9BUEksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTczM1xyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIENocmlzIEtsdXNlbmRvcmYgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBvYmplY3QsIHJlY3Vyc2l2ZWx5LCBieSBzb3J0aW5nIHRoZSBrZXlzIGF0IGVhY2ggbGV2ZWwuXHJcbiAqIEBwYXJhbSB1bm9yZGVyZWQgLSBqc29uaWZpYWJsZSBvYmplY3QgdG8gYmUgc29ydGVkIGJ5IGtleSBuYW1lLiAgU29ydGluZyBpcyByZWN1cnNpdmUgYW5kIGhlbmNlLlxyXG4gKi9cclxuZnVuY3Rpb24gY29weVdpdGhTb3J0ZWRLZXlzPFQ+KCB1bm9yZGVyZWQ6IFQgKTogVCB7XHJcbiAgaWYgKCBBcnJheS5pc0FycmF5KCB1bm9yZGVyZWQgKSApIHtcclxuICAgIHJldHVybiB1bm9yZGVyZWQubWFwKCBjb3B5V2l0aFNvcnRlZEtleXMgKSBhcyBUO1xyXG4gIH1cclxuICBlbHNlIGlmICggdHlwZW9mIHVub3JkZXJlZCAhPT0gJ29iamVjdCcgfHwgdW5vcmRlcmVkID09PSBudWxsICkge1xyXG4gICAgcmV0dXJuIHVub3JkZXJlZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IG9yZGVyZWQgPSB7fTtcclxuICBPYmplY3Qua2V5cyggdW5vcmRlcmVkICkuc29ydCgpLmZvckVhY2goIGtleSA9PiB7XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgY29uc3QgdmFsdWUgPSB1bm9yZGVyZWRbIGtleSBdO1xyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgb3JkZXJlZFsga2V5IF0gPSBjb3B5V2l0aFNvcnRlZEtleXMoIHZhbHVlICk7XHJcbiAgfSApO1xyXG4gIHJldHVybiBvcmRlcmVkIGFzIFQ7XHJcbn1cclxuXHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnY29weVdpdGhTb3J0ZWRLZXlzJywgY29weVdpdGhTb3J0ZWRLZXlzICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb3B5V2l0aFNvcnRlZEtleXM7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU9BLFFBQVEsTUFBTSxlQUFlOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNDLGtCQUFrQkEsQ0FBS0MsU0FBWSxFQUFNO0VBQ2hELElBQUtDLEtBQUssQ0FBQ0MsT0FBTyxDQUFFRixTQUFVLENBQUMsRUFBRztJQUNoQyxPQUFPQSxTQUFTLENBQUNHLEdBQUcsQ0FBRUosa0JBQW1CLENBQUM7RUFDNUMsQ0FBQyxNQUNJLElBQUssT0FBT0MsU0FBUyxLQUFLLFFBQVEsSUFBSUEsU0FBUyxLQUFLLElBQUksRUFBRztJQUM5RCxPQUFPQSxTQUFTO0VBQ2xCO0VBRUEsTUFBTUksT0FBTyxHQUFHLENBQUMsQ0FBQztFQUNsQkMsTUFBTSxDQUFDQyxJQUFJLENBQUVOLFNBQVUsQ0FBQyxDQUFDTyxJQUFJLENBQUMsQ0FBQyxDQUFDQyxPQUFPLENBQUVDLEdBQUcsSUFBSTtJQUU5QztJQUNBLE1BQU1DLEtBQUssR0FBR1YsU0FBUyxDQUFFUyxHQUFHLENBQUU7SUFDOUI7SUFDQUwsT0FBTyxDQUFFSyxHQUFHLENBQUUsR0FBR1Ysa0JBQWtCLENBQUVXLEtBQU0sQ0FBQztFQUM5QyxDQUFFLENBQUM7RUFDSCxPQUFPTixPQUFPO0FBQ2hCO0FBRUFOLFFBQVEsQ0FBQ2EsUUFBUSxDQUFFLG9CQUFvQixFQUFFWixrQkFBbUIsQ0FBQztBQUU3RCxlQUFlQSxrQkFBa0IiLCJpZ25vcmVMaXN0IjpbXX0=