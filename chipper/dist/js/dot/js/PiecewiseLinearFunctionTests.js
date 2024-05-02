// Copyright 2019-2021, University of Colorado Boulder

/**
 * PiecewiseLinearFunction tests
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import PiecewiseLinearFunction from './PiecewiseLinearFunction.js';
QUnit.module('PiecewiseLinearFunction');
function approximateEquals(assert, a, b, msg) {
  assert.ok(Math.abs(a - b) < 0.00000001, `${msg} expected: ${b}, result: ${a}`);
}
QUnit.test('PiecewiseLinearFunction', assert => {
  approximateEquals(assert, PiecewiseLinearFunction.evaluate([0, 0, 1, 1], 0), 0);
  approximateEquals(assert, PiecewiseLinearFunction.evaluate([0, 0, 1, 1], 0.5), 0.5);
  approximateEquals(assert, PiecewiseLinearFunction.evaluate([0, 0, 1, 2], 0.5), 1);
  approximateEquals(assert, PiecewiseLinearFunction.evaluate([1, -1, -1, 1], 0), 0);
  approximateEquals(assert, PiecewiseLinearFunction.evaluate([100, 100, 1, -1, -1, 1], 0), 0);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQaWVjZXdpc2VMaW5lYXJGdW5jdGlvbiIsIlFVbml0IiwibW9kdWxlIiwiYXBwcm94aW1hdGVFcXVhbHMiLCJhc3NlcnQiLCJhIiwiYiIsIm1zZyIsIm9rIiwiTWF0aCIsImFicyIsInRlc3QiLCJldmFsdWF0ZSJdLCJzb3VyY2VzIjpbIlBpZWNld2lzZUxpbmVhckZ1bmN0aW9uVGVzdHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUGllY2V3aXNlTGluZWFyRnVuY3Rpb24gdGVzdHNcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgUGllY2V3aXNlTGluZWFyRnVuY3Rpb24gZnJvbSAnLi9QaWVjZXdpc2VMaW5lYXJGdW5jdGlvbi5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdQaWVjZXdpc2VMaW5lYXJGdW5jdGlvbicgKTtcclxuXHJcbmZ1bmN0aW9uIGFwcHJveGltYXRlRXF1YWxzKCBhc3NlcnQsIGEsIGIsIG1zZyApIHtcclxuICBhc3NlcnQub2soIE1hdGguYWJzKCBhIC0gYiApIDwgMC4wMDAwMDAwMSwgYCR7bXNnfSBleHBlY3RlZDogJHtifSwgcmVzdWx0OiAke2F9YCApO1xyXG59XHJcblxyXG5RVW5pdC50ZXN0KCAnUGllY2V3aXNlTGluZWFyRnVuY3Rpb24nLCBhc3NlcnQgPT4ge1xyXG4gIGFwcHJveGltYXRlRXF1YWxzKCBhc3NlcnQsIFBpZWNld2lzZUxpbmVhckZ1bmN0aW9uLmV2YWx1YXRlKCBbIDAsIDAsIDEsIDEgXSwgMCApLCAwICk7XHJcbiAgYXBwcm94aW1hdGVFcXVhbHMoIGFzc2VydCwgUGllY2V3aXNlTGluZWFyRnVuY3Rpb24uZXZhbHVhdGUoIFsgMCwgMCwgMSwgMSBdLCAwLjUgKSwgMC41ICk7XHJcbiAgYXBwcm94aW1hdGVFcXVhbHMoIGFzc2VydCwgUGllY2V3aXNlTGluZWFyRnVuY3Rpb24uZXZhbHVhdGUoIFsgMCwgMCwgMSwgMiBdLCAwLjUgKSwgMSApO1xyXG4gIGFwcHJveGltYXRlRXF1YWxzKCBhc3NlcnQsIFBpZWNld2lzZUxpbmVhckZ1bmN0aW9uLmV2YWx1YXRlKCBbIDEsIC0xLCAtMSwgMSBdLCAwICksIDAgKTtcclxuICBhcHByb3hpbWF0ZUVxdWFscyggYXNzZXJ0LCBQaWVjZXdpc2VMaW5lYXJGdW5jdGlvbi5ldmFsdWF0ZSggWyAxMDAsIDEwMCwgMSwgLTEsIC0xLCAxIF0sIDAgKSwgMCApO1xyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLHVCQUF1QixNQUFNLDhCQUE4QjtBQUVsRUMsS0FBSyxDQUFDQyxNQUFNLENBQUUseUJBQTBCLENBQUM7QUFFekMsU0FBU0MsaUJBQWlCQSxDQUFFQyxNQUFNLEVBQUVDLENBQUMsRUFBRUMsQ0FBQyxFQUFFQyxHQUFHLEVBQUc7RUFDOUNILE1BQU0sQ0FBQ0ksRUFBRSxDQUFFQyxJQUFJLENBQUNDLEdBQUcsQ0FBRUwsQ0FBQyxHQUFHQyxDQUFFLENBQUMsR0FBRyxVQUFVLEVBQUcsR0FBRUMsR0FBSSxjQUFhRCxDQUFFLGFBQVlELENBQUUsRUFBRSxDQUFDO0FBQ3BGO0FBRUFKLEtBQUssQ0FBQ1UsSUFBSSxDQUFFLHlCQUF5QixFQUFFUCxNQUFNLElBQUk7RUFDL0NELGlCQUFpQixDQUFFQyxNQUFNLEVBQUVKLHVCQUF1QixDQUFDWSxRQUFRLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7RUFDckZULGlCQUFpQixDQUFFQyxNQUFNLEVBQUVKLHVCQUF1QixDQUFDWSxRQUFRLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxHQUFJLENBQUMsRUFBRSxHQUFJLENBQUM7RUFDekZULGlCQUFpQixDQUFFQyxNQUFNLEVBQUVKLHVCQUF1QixDQUFDWSxRQUFRLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxHQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7RUFDdkZULGlCQUFpQixDQUFFQyxNQUFNLEVBQUVKLHVCQUF1QixDQUFDWSxRQUFRLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0VBQ3ZGVCxpQkFBaUIsQ0FBRUMsTUFBTSxFQUFFSix1QkFBdUIsQ0FBQ1ksUUFBUSxDQUFFLENBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0FBQ25HLENBQUUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==