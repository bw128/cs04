// Copyright 2021-2023, University of Colorado Boulder

/**
 * Support gracefully binding a global function to itself. Returns null if the global doesn't exist.
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import phetCore from './phetCore.js';

/**
 * If the path exists on the window global, return it as a bound function, otherwise returns null
 * @param path a path to a method, dot-separated, including the method, such as 'phet.joist.sim.showPopup'
 */
const gracefulBind = path => {
  assert && assert(path.split('.').length > 1, 'path must have multiple parts');
  assert && assert(path.trim() === path, 'path must be trimmed');
  const terms = path.split('.');
  const method = terms.pop(); // mutates terms to become the method container
  const object = _.get(window, terms);
  return object ? object[method].bind(object) : null;
};
phetCore.register('gracefulBind', gracefulBind);
export default gracefulBind;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsImdyYWNlZnVsQmluZCIsInBhdGgiLCJhc3NlcnQiLCJzcGxpdCIsImxlbmd0aCIsInRyaW0iLCJ0ZXJtcyIsIm1ldGhvZCIsInBvcCIsIm9iamVjdCIsIl8iLCJnZXQiLCJ3aW5kb3ciLCJiaW5kIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJncmFjZWZ1bEJpbmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3VwcG9ydCBncmFjZWZ1bGx5IGJpbmRpbmcgYSBnbG9iYWwgZnVuY3Rpb24gdG8gaXRzZWxmLiBSZXR1cm5zIG51bGwgaWYgdGhlIGdsb2JhbCBkb2Vzbid0IGV4aXN0LlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxuLyoqXHJcbiAqIElmIHRoZSBwYXRoIGV4aXN0cyBvbiB0aGUgd2luZG93IGdsb2JhbCwgcmV0dXJuIGl0IGFzIGEgYm91bmQgZnVuY3Rpb24sIG90aGVyd2lzZSByZXR1cm5zIG51bGxcclxuICogQHBhcmFtIHBhdGggYSBwYXRoIHRvIGEgbWV0aG9kLCBkb3Qtc2VwYXJhdGVkLCBpbmNsdWRpbmcgdGhlIG1ldGhvZCwgc3VjaCBhcyAncGhldC5qb2lzdC5zaW0uc2hvd1BvcHVwJ1xyXG4gKi9cclxuY29uc3QgZ3JhY2VmdWxCaW5kID0gKCBwYXRoOiBzdHJpbmcgKTogbnVsbCB8IFZvaWRGdW5jdGlvbiA9PiB7XHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggcGF0aC5zcGxpdCggJy4nICkubGVuZ3RoID4gMSwgJ3BhdGggbXVzdCBoYXZlIG11bHRpcGxlIHBhcnRzJyApO1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIHBhdGgudHJpbSgpID09PSBwYXRoLCAncGF0aCBtdXN0IGJlIHRyaW1tZWQnICk7XHJcbiAgY29uc3QgdGVybXMgPSBwYXRoLnNwbGl0KCAnLicgKTtcclxuICBjb25zdCBtZXRob2QgPSB0ZXJtcy5wb3AoKSE7IC8vIG11dGF0ZXMgdGVybXMgdG8gYmVjb21lIHRoZSBtZXRob2QgY29udGFpbmVyXHJcbiAgY29uc3Qgb2JqZWN0ID0gXy5nZXQoIHdpbmRvdywgdGVybXMgKTtcclxuICByZXR1cm4gb2JqZWN0ID8gb2JqZWN0WyBtZXRob2QgXS5iaW5kKCBvYmplY3QgKSA6IG51bGw7XHJcbn07XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ2dyYWNlZnVsQmluZCcsIGdyYWNlZnVsQmluZCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ3JhY2VmdWxCaW5kOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sZUFBZTs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQyxZQUFZLEdBQUtDLElBQVksSUFBMkI7RUFDNURDLE1BQU0sSUFBSUEsTUFBTSxDQUFFRCxJQUFJLENBQUNFLEtBQUssQ0FBRSxHQUFJLENBQUMsQ0FBQ0MsTUFBTSxHQUFHLENBQUMsRUFBRSwrQkFBZ0MsQ0FBQztFQUNqRkYsTUFBTSxJQUFJQSxNQUFNLENBQUVELElBQUksQ0FBQ0ksSUFBSSxDQUFDLENBQUMsS0FBS0osSUFBSSxFQUFFLHNCQUF1QixDQUFDO0VBQ2hFLE1BQU1LLEtBQUssR0FBR0wsSUFBSSxDQUFDRSxLQUFLLENBQUUsR0FBSSxDQUFDO0VBQy9CLE1BQU1JLE1BQU0sR0FBR0QsS0FBSyxDQUFDRSxHQUFHLENBQUMsQ0FBRSxDQUFDLENBQUM7RUFDN0IsTUFBTUMsTUFBTSxHQUFHQyxDQUFDLENBQUNDLEdBQUcsQ0FBRUMsTUFBTSxFQUFFTixLQUFNLENBQUM7RUFDckMsT0FBT0csTUFBTSxHQUFHQSxNQUFNLENBQUVGLE1BQU0sQ0FBRSxDQUFDTSxJQUFJLENBQUVKLE1BQU8sQ0FBQyxHQUFHLElBQUk7QUFDeEQsQ0FBQztBQUVEVixRQUFRLENBQUNlLFFBQVEsQ0FBRSxjQUFjLEVBQUVkLFlBQWEsQ0FBQztBQUVqRCxlQUFlQSxZQUFZIiwiaWdub3JlTGlzdCI6W119