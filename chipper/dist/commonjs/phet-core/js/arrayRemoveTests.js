"use strict";

var _arrayRemove = _interopRequireDefault(require("./arrayRemove.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2017-2023, University of Colorado Boulder

/**
 * arrayRemove tests
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

QUnit.module('arrayRemove');
QUnit.test('arrayRemove', function (assert) {
  var arr = [4, 3, 2, 1, 3];
  (0, _arrayRemove["default"])(arr, 3);
  assert.equal(arr[0], 4);
  assert.equal(arr[1], 2);
  assert.equal(arr[2], 1);
  assert.equal(arr[3], 3); // doesn't remove the second instance
  assert.equal(arr.length, 4);

  // check reference removal
  var a = {};
  var b = {};
  var c = {};
  var arr2 = [a, b, c];
  (0, _arrayRemove["default"])(arr2, b);
  assert.equal(arr2[0], a);
  assert.equal(arr2[1], c);
  assert.equal(arr2.length, 2);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXJyYXlSZW1vdmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJRVW5pdCIsIm1vZHVsZSIsInRlc3QiLCJhc3NlcnQiLCJhcnIiLCJhcnJheVJlbW92ZSIsImVxdWFsIiwibGVuZ3RoIiwiYSIsImIiLCJjIiwiYXJyMiJdLCJzb3VyY2VzIjpbImFycmF5UmVtb3ZlVGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogYXJyYXlSZW1vdmUgdGVzdHNcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgYXJyYXlSZW1vdmUgZnJvbSAnLi9hcnJheVJlbW92ZS5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdhcnJheVJlbW92ZScgKTtcclxuXHJcblFVbml0LnRlc3QoICdhcnJheVJlbW92ZScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgYXJyID0gWyA0LCAzLCAyLCAxLCAzIF07XHJcbiAgYXJyYXlSZW1vdmUoIGFyciwgMyApO1xyXG5cclxuICBhc3NlcnQuZXF1YWwoIGFyclsgMCBdLCA0ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhcnJbIDEgXSwgMiApO1xyXG4gIGFzc2VydC5lcXVhbCggYXJyWyAyIF0sIDEgKTtcclxuICBhc3NlcnQuZXF1YWwoIGFyclsgMyBdLCAzICk7IC8vIGRvZXNuJ3QgcmVtb3ZlIHRoZSBzZWNvbmQgaW5zdGFuY2VcclxuICBhc3NlcnQuZXF1YWwoIGFyci5sZW5ndGgsIDQgKTtcclxuXHJcbiAgLy8gY2hlY2sgcmVmZXJlbmNlIHJlbW92YWxcclxuICBjb25zdCBhID0ge307XHJcbiAgY29uc3QgYiA9IHt9O1xyXG4gIGNvbnN0IGMgPSB7fTtcclxuXHJcbiAgY29uc3QgYXJyMiA9IFsgYSwgYiwgYyBdO1xyXG4gIGFycmF5UmVtb3ZlKCBhcnIyLCBiICk7XHJcblxyXG4gIGFzc2VydC5lcXVhbCggYXJyMlsgMCBdLCBhICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhcnIyWyAxIF0sIGMgKTtcclxuICBhc3NlcnQuZXF1YWwoIGFycjIubGVuZ3RoLCAyICk7XHJcbn0gKTsiXSwibWFwcGluZ3MiOiI7O0FBU0EsSUFBQUEsWUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQTJDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFUM0M7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBRSxLQUFLLENBQUNDLE1BQU0sQ0FBRSxhQUFjLENBQUM7QUFFN0JELEtBQUssQ0FBQ0UsSUFBSSxDQUFFLGFBQWEsRUFBRSxVQUFBQyxNQUFNLEVBQUk7RUFDbkMsSUFBTUMsR0FBRyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRTtFQUM3QixJQUFBQyx1QkFBVyxFQUFFRCxHQUFHLEVBQUUsQ0FBRSxDQUFDO0VBRXJCRCxNQUFNLENBQUNHLEtBQUssQ0FBRUYsR0FBRyxDQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQztFQUMzQkQsTUFBTSxDQUFDRyxLQUFLLENBQUVGLEdBQUcsQ0FBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUM7RUFDM0JELE1BQU0sQ0FBQ0csS0FBSyxDQUFFRixHQUFHLENBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBRSxDQUFDO0VBQzNCRCxNQUFNLENBQUNHLEtBQUssQ0FBRUYsR0FBRyxDQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxDQUFDLENBQUM7RUFDN0JELE1BQU0sQ0FBQ0csS0FBSyxDQUFFRixHQUFHLENBQUNHLE1BQU0sRUFBRSxDQUFFLENBQUM7O0VBRTdCO0VBQ0EsSUFBTUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNaLElBQU1DLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDWixJQUFNQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBRVosSUFBTUMsSUFBSSxHQUFHLENBQUVILENBQUMsRUFBRUMsQ0FBQyxFQUFFQyxDQUFDLENBQUU7RUFDeEIsSUFBQUwsdUJBQVcsRUFBRU0sSUFBSSxFQUFFRixDQUFFLENBQUM7RUFFdEJOLE1BQU0sQ0FBQ0csS0FBSyxDQUFFSyxJQUFJLENBQUUsQ0FBQyxDQUFFLEVBQUVILENBQUUsQ0FBQztFQUM1QkwsTUFBTSxDQUFDRyxLQUFLLENBQUVLLElBQUksQ0FBRSxDQUFDLENBQUUsRUFBRUQsQ0FBRSxDQUFDO0VBQzVCUCxNQUFNLENBQUNHLEtBQUssQ0FBRUssSUFBSSxDQUFDSixNQUFNLEVBQUUsQ0FBRSxDQUFDO0FBQ2hDLENBQUUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==