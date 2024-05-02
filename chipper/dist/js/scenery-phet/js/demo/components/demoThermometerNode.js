// Copyright 2022-2024, University of Colorado Boulder

/**
 * Demo for ThermometerNode
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import ThermometerNode from '../../ThermometerNode.js';
import { Node } from '../../../../scenery/js/imports.js';
import Range from '../../../../dot/js/Range.js';
import Property from '../../../../axon/js/Property.js';
import HSlider from '../../../../sun/js/HSlider.js';
import Dimension2 from '../../../../dot/js/Dimension2.js';
export default function demoThermometerNode(layoutBounds) {
  const temperatureProperty = new Property(50);
  const thermometer = new ThermometerNode(temperatureProperty, 0, 100, {
    scale: 1.5
  });
  const temperatureSlider = new HSlider(temperatureProperty, new Range(0, 100), {
    trackSize: new Dimension2(200, 5),
    thumbSize: new Dimension2(25, 50),
    thumbFillHighlighted: 'red',
    thumbFill: 'rgb(158,35,32)'
  });
  temperatureSlider.rotation = -Math.PI / 2;
  temperatureSlider.right = thermometer.left - 50;
  temperatureSlider.centerY = thermometer.centerY;
  return new Node({
    children: [thermometer, temperatureSlider],
    center: layoutBounds.center
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaGVybW9tZXRlck5vZGUiLCJOb2RlIiwiUmFuZ2UiLCJQcm9wZXJ0eSIsIkhTbGlkZXIiLCJEaW1lbnNpb24yIiwiZGVtb1RoZXJtb21ldGVyTm9kZSIsImxheW91dEJvdW5kcyIsInRlbXBlcmF0dXJlUHJvcGVydHkiLCJ0aGVybW9tZXRlciIsInNjYWxlIiwidGVtcGVyYXR1cmVTbGlkZXIiLCJ0cmFja1NpemUiLCJ0aHVtYlNpemUiLCJ0aHVtYkZpbGxIaWdobGlnaHRlZCIsInRodW1iRmlsbCIsInJvdGF0aW9uIiwiTWF0aCIsIlBJIiwicmlnaHQiLCJsZWZ0IiwiY2VudGVyWSIsImNoaWxkcmVuIiwiY2VudGVyIl0sInNvdXJjZXMiOlsiZGVtb1RoZXJtb21ldGVyTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBEZW1vIGZvciBUaGVybW9tZXRlck5vZGVcclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgVGhlcm1vbWV0ZXJOb2RlIGZyb20gJy4uLy4uL1RoZXJtb21ldGVyTm9kZS5qcyc7XHJcbmltcG9ydCB7IE5vZGUgfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBIU2xpZGVyIGZyb20gJy4uLy4uLy4uLy4uL3N1bi9qcy9IU2xpZGVyLmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGVtb1RoZXJtb21ldGVyTm9kZSggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICk6IE5vZGUge1xyXG5cclxuICBjb25zdCB0ZW1wZXJhdHVyZVByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCA1MCApO1xyXG5cclxuICBjb25zdCB0aGVybW9tZXRlciA9IG5ldyBUaGVybW9tZXRlck5vZGUoIHRlbXBlcmF0dXJlUHJvcGVydHksIDAsIDEwMCwge1xyXG4gICAgc2NhbGU6IDEuNVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgdGVtcGVyYXR1cmVTbGlkZXIgPSBuZXcgSFNsaWRlciggdGVtcGVyYXR1cmVQcm9wZXJ0eSwgbmV3IFJhbmdlKCAwLCAxMDAgKSwge1xyXG4gICAgdHJhY2tTaXplOiBuZXcgRGltZW5zaW9uMiggMjAwLCA1ICksXHJcbiAgICB0aHVtYlNpemU6IG5ldyBEaW1lbnNpb24yKCAyNSwgNTAgKSxcclxuICAgIHRodW1iRmlsbEhpZ2hsaWdodGVkOiAncmVkJyxcclxuICAgIHRodW1iRmlsbDogJ3JnYigxNTgsMzUsMzIpJ1xyXG4gIH0gKTtcclxuICB0ZW1wZXJhdHVyZVNsaWRlci5yb3RhdGlvbiA9IC1NYXRoLlBJIC8gMjtcclxuICB0ZW1wZXJhdHVyZVNsaWRlci5yaWdodCA9IHRoZXJtb21ldGVyLmxlZnQgLSA1MDtcclxuICB0ZW1wZXJhdHVyZVNsaWRlci5jZW50ZXJZID0gdGhlcm1vbWV0ZXIuY2VudGVyWTtcclxuXHJcbiAgcmV0dXJuIG5ldyBOb2RlKCB7XHJcbiAgICBjaGlsZHJlbjogWyB0aGVybW9tZXRlciwgdGVtcGVyYXR1cmVTbGlkZXIgXSxcclxuICAgIGNlbnRlcjogbGF5b3V0Qm91bmRzLmNlbnRlclxyXG4gIH0gKTtcclxufSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sMEJBQTBCO0FBQ3RELFNBQVNDLElBQUksUUFBUSxtQ0FBbUM7QUFFeEQsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxPQUFPQyxRQUFRLE1BQU0saUNBQWlDO0FBQ3RELE9BQU9DLE9BQU8sTUFBTSwrQkFBK0I7QUFDbkQsT0FBT0MsVUFBVSxNQUFNLGtDQUFrQztBQUV6RCxlQUFlLFNBQVNDLG1CQUFtQkEsQ0FBRUMsWUFBcUIsRUFBUztFQUV6RSxNQUFNQyxtQkFBbUIsR0FBRyxJQUFJTCxRQUFRLENBQUUsRUFBRyxDQUFDO0VBRTlDLE1BQU1NLFdBQVcsR0FBRyxJQUFJVCxlQUFlLENBQUVRLG1CQUFtQixFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUU7SUFDcEVFLEtBQUssRUFBRTtFQUNULENBQUUsQ0FBQztFQUVILE1BQU1DLGlCQUFpQixHQUFHLElBQUlQLE9BQU8sQ0FBRUksbUJBQW1CLEVBQUUsSUFBSU4sS0FBSyxDQUFFLENBQUMsRUFBRSxHQUFJLENBQUMsRUFBRTtJQUMvRVUsU0FBUyxFQUFFLElBQUlQLFVBQVUsQ0FBRSxHQUFHLEVBQUUsQ0FBRSxDQUFDO0lBQ25DUSxTQUFTLEVBQUUsSUFBSVIsVUFBVSxDQUFFLEVBQUUsRUFBRSxFQUFHLENBQUM7SUFDbkNTLG9CQUFvQixFQUFFLEtBQUs7SUFDM0JDLFNBQVMsRUFBRTtFQUNiLENBQUUsQ0FBQztFQUNISixpQkFBaUIsQ0FBQ0ssUUFBUSxHQUFHLENBQUNDLElBQUksQ0FBQ0MsRUFBRSxHQUFHLENBQUM7RUFDekNQLGlCQUFpQixDQUFDUSxLQUFLLEdBQUdWLFdBQVcsQ0FBQ1csSUFBSSxHQUFHLEVBQUU7RUFDL0NULGlCQUFpQixDQUFDVSxPQUFPLEdBQUdaLFdBQVcsQ0FBQ1ksT0FBTztFQUUvQyxPQUFPLElBQUlwQixJQUFJLENBQUU7SUFDZnFCLFFBQVEsRUFBRSxDQUFFYixXQUFXLEVBQUVFLGlCQUFpQixDQUFFO0lBQzVDWSxNQUFNLEVBQUVoQixZQUFZLENBQUNnQjtFQUN2QixDQUFFLENBQUM7QUFDTCIsImlnbm9yZUxpc3QiOltdfQ==