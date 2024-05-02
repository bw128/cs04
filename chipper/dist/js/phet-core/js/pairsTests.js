// Copyright 2017-2023, University of Colorado Boulder

/**
 * pairs tests
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import pairs from './pairs.js';
QUnit.module('pairs');
QUnit.test('pairs', assert => {
  assert.equal(pairs([]).length, 0);
  assert.equal(pairs(['a']).length, 0);
  assert.equal(pairs(['a', 'b']).length, 1);
  assert.equal(pairs(['a', 'b', 'c']).length, 3);
  assert.equal(pairs(['a', 'b', 'c'])[0][0], 'a');
  assert.equal(pairs(['a', 'b', 'c'])[0][1], 'b');
  assert.equal(pairs(['a', 'b', 'c'])[1][0], 'a');
  assert.equal(pairs(['a', 'b', 'c'])[1][1], 'c');
  assert.equal(pairs(['a', 'b', 'c'])[2][0], 'b');
  assert.equal(pairs(['a', 'b', 'c'])[2][1], 'c');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwYWlycyIsIlFVbml0IiwibW9kdWxlIiwidGVzdCIsImFzc2VydCIsImVxdWFsIiwibGVuZ3RoIl0sInNvdXJjZXMiOlsicGFpcnNUZXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBwYWlycyB0ZXN0c1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBwYWlycyBmcm9tICcuL3BhaXJzLmpzJztcclxuXHJcblFVbml0Lm1vZHVsZSggJ3BhaXJzJyApO1xyXG5cclxuUVVuaXQudGVzdCggJ3BhaXJzJywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQuZXF1YWwoIHBhaXJzKCBbXSApLmxlbmd0aCwgMCApO1xyXG4gIGFzc2VydC5lcXVhbCggcGFpcnMoIFsgJ2EnIF0gKS5sZW5ndGgsIDAgKTtcclxuICBhc3NlcnQuZXF1YWwoIHBhaXJzKCBbICdhJywgJ2InIF0gKS5sZW5ndGgsIDEgKTtcclxuICBhc3NlcnQuZXF1YWwoIHBhaXJzKCBbICdhJywgJ2InLCAnYycgXSApLmxlbmd0aCwgMyApO1xyXG4gIGFzc2VydC5lcXVhbCggcGFpcnMoIFsgJ2EnLCAnYicsICdjJyBdIClbIDAgXVsgMCBdLCAnYScgKTtcclxuICBhc3NlcnQuZXF1YWwoIHBhaXJzKCBbICdhJywgJ2InLCAnYycgXSApWyAwIF1bIDEgXSwgJ2InICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBwYWlycyggWyAnYScsICdiJywgJ2MnIF0gKVsgMSBdWyAwIF0sICdhJyApO1xyXG4gIGFzc2VydC5lcXVhbCggcGFpcnMoIFsgJ2EnLCAnYicsICdjJyBdIClbIDEgXVsgMSBdLCAnYycgKTtcclxuICBhc3NlcnQuZXF1YWwoIHBhaXJzKCBbICdhJywgJ2InLCAnYycgXSApWyAyIF1bIDAgXSwgJ2InICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBwYWlycyggWyAnYScsICdiJywgJ2MnIF0gKVsgMiBdWyAxIF0sICdjJyApO1xyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsS0FBSyxNQUFNLFlBQVk7QUFFOUJDLEtBQUssQ0FBQ0MsTUFBTSxDQUFFLE9BQVEsQ0FBQztBQUV2QkQsS0FBSyxDQUFDRSxJQUFJLENBQUUsT0FBTyxFQUFFQyxNQUFNLElBQUk7RUFDN0JBLE1BQU0sQ0FBQ0MsS0FBSyxDQUFFTCxLQUFLLENBQUUsRUFBRyxDQUFDLENBQUNNLE1BQU0sRUFBRSxDQUFFLENBQUM7RUFDckNGLE1BQU0sQ0FBQ0MsS0FBSyxDQUFFTCxLQUFLLENBQUUsQ0FBRSxHQUFHLENBQUcsQ0FBQyxDQUFDTSxNQUFNLEVBQUUsQ0FBRSxDQUFDO0VBQzFDRixNQUFNLENBQUNDLEtBQUssQ0FBRUwsS0FBSyxDQUFFLENBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRyxDQUFDLENBQUNNLE1BQU0sRUFBRSxDQUFFLENBQUM7RUFDL0NGLE1BQU0sQ0FBQ0MsS0FBSyxDQUFFTCxLQUFLLENBQUUsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRyxDQUFDLENBQUNNLE1BQU0sRUFBRSxDQUFFLENBQUM7RUFDcERGLE1BQU0sQ0FBQ0MsS0FBSyxDQUFFTCxLQUFLLENBQUUsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQyxDQUFFLEVBQUUsR0FBSSxDQUFDO0VBQ3pESSxNQUFNLENBQUNDLEtBQUssQ0FBRUwsS0FBSyxDQUFFLENBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUMsQ0FBRSxFQUFFLEdBQUksQ0FBQztFQUN6REksTUFBTSxDQUFDQyxLQUFLLENBQUVMLEtBQUssQ0FBRSxDQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFHLENBQUMsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDLENBQUUsRUFBRSxHQUFJLENBQUM7RUFDekRJLE1BQU0sQ0FBQ0MsS0FBSyxDQUFFTCxLQUFLLENBQUUsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQyxDQUFFLEVBQUUsR0FBSSxDQUFDO0VBQ3pESSxNQUFNLENBQUNDLEtBQUssQ0FBRUwsS0FBSyxDQUFFLENBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUMsQ0FBRSxFQUFFLEdBQUksQ0FBQztFQUN6REksTUFBTSxDQUFDQyxLQUFLLENBQUVMLEtBQUssQ0FBRSxDQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFHLENBQUMsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDLENBQUUsRUFBRSxHQUFJLENBQUM7QUFDM0QsQ0FBRSxDQUFDIiwiaWdub3JlTGlzdCI6W119