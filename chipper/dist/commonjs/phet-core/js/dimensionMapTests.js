"use strict";

var _dimensionMap = _interopRequireDefault(require("./dimensionMap.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2018-2023, University of Colorado Boulder

/**
 * Tests for dimensionMap
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

QUnit.module('dimensionMap');
QUnit.test('1 dimensional', function (assert) {
  function checkMap(values, map, message) {
    assert.ok(_.isEqual((0, _dimensionMap["default"])(1, values, map), values.map(map)), message);
  }
  checkMap([1, 2, 4], function (x) {
    return x;
  }, 'Identity');
  checkMap([1, 2, 4], function (x) {
    return 2 * x;
  }, 'Simple map');
  checkMap([1, 2, 4], function (x, index) {
    return 2 * x + index;
  }, 'Indexed map');
});
QUnit.test('multidimensional', function (assert) {
  var dim2 = [[1, 4, 10], [5, 3, -1]];
  var dim3 = [[[1, 9, 25], [23]], [[5, 5, 5, 5], [2, 9], [1], [3, -10]]];
  assert.ok(_.isEqual((0, _dimensionMap["default"])(2, dim2, function (x) {
    return x;
  }), dim2), '2-dimensional identity');
  assert.ok(_.isEqual((0, _dimensionMap["default"])(3, dim3, function (x) {
    return x;
  }), dim3), '3-dimensional identity');
  assert.ok(_.isEqual((0, _dimensionMap["default"])(2, dim2, function (x, idx1, idx2) {
    return dim2[idx1][idx2];
  }), dim2), '2-dimensional indexing-based');
  assert.ok(_.isEqual((0, _dimensionMap["default"])(3, dim3, function (x, idx1, idx2, idx3) {
    return dim3[idx1][idx2][idx3];
  }), dim3), '3-dimensional indexing-based');
  assert.ok(_.isEqual((0, _dimensionMap["default"])(2, dim2, function (x) {
    return 2 * x;
  }), [[2, 8, 20], [10, 6, -2]]), '2-dimensional times 2');
  assert.ok(_.isEqual((0, _dimensionMap["default"])(3, dim3, function (x) {
    return 2 * x;
  }), [[[2, 18, 50], [46]], [[10, 10, 10, 10], [4, 18], [2], [6, -20]]]), '3-dimensional times 2');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZGltZW5zaW9uTWFwIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJvYmoiLCJfX2VzTW9kdWxlIiwiUVVuaXQiLCJtb2R1bGUiLCJ0ZXN0IiwiYXNzZXJ0IiwiY2hlY2tNYXAiLCJ2YWx1ZXMiLCJtYXAiLCJtZXNzYWdlIiwib2siLCJfIiwiaXNFcXVhbCIsImRpbWVuc2lvbk1hcCIsIngiLCJpbmRleCIsImRpbTIiLCJkaW0zIiwiaWR4MSIsImlkeDIiLCJpZHgzIl0sInNvdXJjZXMiOlsiZGltZW5zaW9uTWFwVGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGVzdHMgZm9yIGRpbWVuc2lvbk1hcFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IGRpbWVuc2lvbk1hcCBmcm9tICcuL2RpbWVuc2lvbk1hcC5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdkaW1lbnNpb25NYXAnICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnMSBkaW1lbnNpb25hbCcsIGFzc2VydCA9PiB7XHJcbiAgZnVuY3Rpb24gY2hlY2tNYXAoIHZhbHVlczogbnVtYmVyW10sIG1hcDogKCBpbnB1dDogbnVtYmVyLCBpbmRleDogbnVtYmVyICkgPT4gbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQub2soIF8uaXNFcXVhbCggZGltZW5zaW9uTWFwKCAxLCB2YWx1ZXMsIG1hcCApLCB2YWx1ZXMubWFwKCBtYXAgKSApLCBtZXNzYWdlICk7XHJcbiAgfVxyXG5cclxuICBjaGVja01hcCggWyAxLCAyLCA0IF0sIHggPT4geCwgJ0lkZW50aXR5JyApO1xyXG4gIGNoZWNrTWFwKCBbIDEsIDIsIDQgXSwgeCA9PiAyICogeCwgJ1NpbXBsZSBtYXAnICk7XHJcbiAgY2hlY2tNYXAoIFsgMSwgMiwgNCBdLCAoIHgsIGluZGV4ICkgPT4gMiAqIHggKyBpbmRleCwgJ0luZGV4ZWQgbWFwJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnbXVsdGlkaW1lbnNpb25hbCcsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgZGltMiA9IFtcclxuICAgIFsgMSwgNCwgMTAgXSxcclxuICAgIFsgNSwgMywgLTEgXVxyXG4gIF07XHJcblxyXG4gIGNvbnN0IGRpbTMgPSBbXHJcbiAgICBbXHJcbiAgICAgIFsgMSwgOSwgMjUgXSxcclxuICAgICAgWyAyMyBdXHJcbiAgICBdLFxyXG4gICAgW1xyXG4gICAgICBbIDUsIDUsIDUsIDUgXSxcclxuICAgICAgWyAyLCA5IF0sXHJcbiAgICAgIFsgMSBdLFxyXG4gICAgICBbIDMsIC0xMCBdXHJcbiAgICBdXHJcbiAgXTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBfLmlzRXF1YWwoIGRpbWVuc2lvbk1hcDxudW1iZXIsIG51bWJlcj4oIDIsIGRpbTIsIHggPT4geCApLCBkaW0yICksICcyLWRpbWVuc2lvbmFsIGlkZW50aXR5JyApO1xyXG4gIGFzc2VydC5vayggXy5pc0VxdWFsKCBkaW1lbnNpb25NYXA8bnVtYmVyLCBudW1iZXI+KCAzLCBkaW0zLCB4ID0+IHggKSwgZGltMyApLCAnMy1kaW1lbnNpb25hbCBpZGVudGl0eScgKTtcclxuICBhc3NlcnQub2soIF8uaXNFcXVhbCggZGltZW5zaW9uTWFwPG51bWJlciwgbnVtYmVyPiggMiwgZGltMiwgKCB4LCBpZHgxLCBpZHgyICkgPT4gZGltMlsgaWR4MSBdWyBpZHgyIF0gKSwgZGltMiApLCAnMi1kaW1lbnNpb25hbCBpbmRleGluZy1iYXNlZCcgKTtcclxuICBhc3NlcnQub2soIF8uaXNFcXVhbCggZGltZW5zaW9uTWFwPG51bWJlciwgbnVtYmVyPiggMywgZGltMywgKCB4LCBpZHgxLCBpZHgyLCBpZHgzICkgPT4gZGltM1sgaWR4MSBdWyBpZHgyIF1bIGlkeDMgXSApLCBkaW0zICksICczLWRpbWVuc2lvbmFsIGluZGV4aW5nLWJhc2VkJyApO1xyXG4gIGFzc2VydC5vayggXy5pc0VxdWFsKCBkaW1lbnNpb25NYXA8bnVtYmVyLCBudW1iZXI+KCAyLCBkaW0yLCB4ID0+IDIgKiB4ICksIFtcclxuICAgIFsgMiwgOCwgMjAgXSxcclxuICAgIFsgMTAsIDYsIC0yIF1cclxuICBdICksICcyLWRpbWVuc2lvbmFsIHRpbWVzIDInICk7XHJcbiAgYXNzZXJ0Lm9rKCBfLmlzRXF1YWwoIGRpbWVuc2lvbk1hcCggMywgZGltMywgeCA9PiAyICogeCApLCBbXHJcbiAgICBbXHJcbiAgICAgIFsgMiwgMTgsIDUwIF0sXHJcbiAgICAgIFsgNDYgXVxyXG4gICAgXSxcclxuICAgIFtcclxuICAgICAgWyAxMCwgMTAsIDEwLCAxMCBdLFxyXG4gICAgICBbIDQsIDE4IF0sXHJcbiAgICAgIFsgMiBdLFxyXG4gICAgICBbIDYsIC0yMCBdXHJcbiAgICBdXHJcbiAgXSApLCAnMy1kaW1lbnNpb25hbCB0aW1lcyAyJyApO1xyXG59ICk7Il0sIm1hcHBpbmdzIjoiOztBQVFBLElBQUFBLGFBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUE2QyxTQUFBRCx1QkFBQUUsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBUjdDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBSUFFLEtBQUssQ0FBQ0MsTUFBTSxDQUFFLGNBQWUsQ0FBQztBQUU5QkQsS0FBSyxDQUFDRSxJQUFJLENBQUUsZUFBZSxFQUFFLFVBQUFDLE1BQU0sRUFBSTtFQUNyQyxTQUFTQyxRQUFRQSxDQUFFQyxNQUFnQixFQUFFQyxHQUErQyxFQUFFQyxPQUFlLEVBQVM7SUFDNUdKLE1BQU0sQ0FBQ0ssRUFBRSxDQUFFQyxDQUFDLENBQUNDLE9BQU8sQ0FBRSxJQUFBQyx3QkFBWSxFQUFFLENBQUMsRUFBRU4s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