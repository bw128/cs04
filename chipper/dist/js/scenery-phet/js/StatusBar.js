// Copyright 2018-2022, University of Colorado Boulder

/**
 * StatusBar is the base class for the status bar that appears at the top of games. It sizes itself to match the bounds
 * of the browser window (the visible bounds) and float to either the top of the browser window or the layout bounds.
 * Subclasses are responsible for adding UI components to the bar.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Property from '../../axon/js/Property.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import optionize from '../../phet-core/js/optionize.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import { Color, Node, Rectangle } from '../../scenery/js/imports.js';
import sceneryPhet from './sceneryPhet.js';
class StatusBar extends Node {
  static DEFAULT_FONT = new PhetFont(20);
  static DEFAULT_TEXT_FILL = Color.BLACK;

  /**
   * @param layoutBounds
   * @param visibleBoundsProperty - visible bounds of the parent ScreenView
   * @param [providedOptions]
   */
  constructor(layoutBounds, visibleBoundsProperty, providedOptions) {
    const options = optionize()({
      // StatusBarOptions
      barFill: 'lightGray',
      barStroke: null,
      barHeight: 50,
      xMargin: 10,
      yMargin: 8,
      floatToTop: false,
      dynamicAlignment: true
    }, providedOptions);

    // size will be set by visibleBoundsListener
    const barNode = new Rectangle({
      fill: options.barFill,
      stroke: options.barStroke
    });

    // Support decoration, with the bar behind everything else
    const rectangles = [barNode];
    options.children = rectangles.concat(options.children || []);
    super(options);

    // for layout of UI components on the status bar, compensated for margins
    const positioningBoundsProperty = new Property(Bounds2.EVERYTHING, {
      valueType: Bounds2
    });
    this.positioningBoundsProperty = positioningBoundsProperty;
    const visibleBoundsListener = visibleBounds => {
      // Resize and position the bar to match the visible bounds.
      const y = options.floatToTop ? visibleBounds.top : layoutBounds.top;
      barNode.setRect(visibleBounds.minX, y, visibleBounds.width, options.barHeight);

      // Update the bounds inside which components on the status bar should be positioned.
      positioningBoundsProperty.value = new Bounds2((options.dynamicAlignment ? barNode.left : layoutBounds.minX) + options.xMargin, barNode.top, (options.dynamicAlignment ? barNode.right : layoutBounds.maxX) - options.xMargin, barNode.bottom);
    };
    visibleBoundsProperty.link(visibleBoundsListener);
    this.disposeStatusBar = () => {
      if (visibleBoundsProperty.hasListener(visibleBoundsListener)) {
        visibleBoundsProperty.unlink(visibleBoundsListener);
      }
    };
  }
  dispose() {
    this.disposeStatusBar();
    super.dispose();
  }
}
sceneryPhet.register('StatusBar', StatusBar);
export default StatusBar;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIkJvdW5kczIiLCJvcHRpb25pemUiLCJQaGV0Rm9udCIsIkNvbG9yIiwiTm9kZSIsIlJlY3RhbmdsZSIsInNjZW5lcnlQaGV0IiwiU3RhdHVzQmFyIiwiREVGQVVMVF9GT05UIiwiREVGQVVMVF9URVhUX0ZJTEwiLCJCTEFDSyIsImNvbnN0cnVjdG9yIiwibGF5b3V0Qm91bmRzIiwidmlzaWJsZUJvdW5kc1Byb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImJhckZpbGwiLCJiYXJTdHJva2UiLCJiYXJIZWlnaHQiLCJ4TWFyZ2luIiwieU1hcmdpbiIsImZsb2F0VG9Ub3AiLCJkeW5hbWljQWxpZ25tZW50IiwiYmFyTm9kZSIsImZpbGwiLCJzdHJva2UiLCJyZWN0YW5nbGVzIiwiY2hpbGRyZW4iLCJjb25jYXQiLCJwb3NpdGlvbmluZ0JvdW5kc1Byb3BlcnR5IiwiRVZFUllUSElORyIsInZhbHVlVHlwZSIsInZpc2libGVCb3VuZHNMaXN0ZW5lciIsInZpc2libGVCb3VuZHMiLCJ5IiwidG9wIiwic2V0UmVjdCIsIm1pblgiLCJ3aWR0aCIsInZhbHVlIiwibGVmdCIsInJpZ2h0IiwibWF4WCIsImJvdHRvbSIsImxpbmsiLCJkaXNwb3NlU3RhdHVzQmFyIiwiaGFzTGlzdGVuZXIiLCJ1bmxpbmsiLCJkaXNwb3NlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTdGF0dXNCYXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3RhdHVzQmFyIGlzIHRoZSBiYXNlIGNsYXNzIGZvciB0aGUgc3RhdHVzIGJhciB0aGF0IGFwcGVhcnMgYXQgdGhlIHRvcCBvZiBnYW1lcy4gSXQgc2l6ZXMgaXRzZWxmIHRvIG1hdGNoIHRoZSBib3VuZHNcclxuICogb2YgdGhlIGJyb3dzZXIgd2luZG93ICh0aGUgdmlzaWJsZSBib3VuZHMpIGFuZCBmbG9hdCB0byBlaXRoZXIgdGhlIHRvcCBvZiB0aGUgYnJvd3NlciB3aW5kb3cgb3IgdGhlIGxheW91dCBib3VuZHMuXHJcbiAqIFN1YmNsYXNzZXMgYXJlIHJlc3BvbnNpYmxlIGZvciBhZGRpbmcgVUkgY29tcG9uZW50cyB0byB0aGUgYmFyLlxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQaGV0Rm9udCBmcm9tICcuLi8uLi9zY2VuZXJ5LXBoZXQvanMvUGhldEZvbnQuanMnO1xyXG5pbXBvcnQgeyBDb2xvciwgTm9kZSwgTm9kZU9wdGlvbnMsIFJlY3RhbmdsZSwgVENvbG9yIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4vc2NlbmVyeVBoZXQuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBiYXJGaWxsPzogVENvbG9yO1xyXG4gIGJhclN0cm9rZT86IFRDb2xvcjtcclxuICBiYXJIZWlnaHQ/OiBudW1iZXI7XHJcbiAgeE1hcmdpbj86IG51bWJlcjtcclxuICB5TWFyZ2luPzogbnVtYmVyO1xyXG5cclxuICAvLyB0cnVlOiBmbG9hdCBiYXIgdG8gdG9wIG9mIHZpc2libGUgYm91bmRzXHJcbiAgLy8gZmFsc2U6IGJhciBhdCB0b3Agb2YgbGF5b3V0Qm91bmRzXHJcbiAgZmxvYXRUb1RvcD86IGJvb2xlYW47XHJcblxyXG4gIC8vIHRydWU6IGtlZXBzIHRoaW5ncyBvbiB0aGUgc3RhdHVzIGJhciBhbGlnbmVkIHdpdGggbGVmdCBhbmQgcmlnaHQgZWRnZXMgb2Ygd2luZG93IGJvdW5kcyAoYWthIHZpc2libGUgYm91bmRzKVxyXG4gIC8vIGZhbHNlOiBrZWVwcyB0aGluZ3Mgb24gdGhlIHN0YXR1cyBiYXIgYWxpZ25lZCB3aXRoIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzIG9mIGxheW91dEJvdW5kc1xyXG4gIGR5bmFtaWNBbGlnbm1lbnQ/OiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgU3RhdHVzQmFyT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgTm9kZU9wdGlvbnM7XHJcblxyXG5jbGFzcyBTdGF0dXNCYXIgZXh0ZW5kcyBOb2RlIHtcclxuXHJcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHBvc2l0aW9uaW5nQm91bmRzUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PEJvdW5kczI+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZVN0YXR1c0JhcjogKCkgPT4gdm9pZDtcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfRk9OVCA9IG5ldyBQaGV0Rm9udCggMjAgKTtcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfVEVYVF9GSUxMID0gQ29sb3IuQkxBQ0s7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBsYXlvdXRCb3VuZHNcclxuICAgKiBAcGFyYW0gdmlzaWJsZUJvdW5kc1Byb3BlcnR5IC0gdmlzaWJsZSBib3VuZHMgb2YgdGhlIHBhcmVudCBTY3JlZW5WaWV3XHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBsYXlvdXRCb3VuZHM6IEJvdW5kczIsIHZpc2libGVCb3VuZHNQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Qm91bmRzMj4sIHByb3ZpZGVkT3B0aW9ucz86IFN0YXR1c0Jhck9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTdGF0dXNCYXJPcHRpb25zLCBTZWxmT3B0aW9ucywgTm9kZU9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFN0YXR1c0Jhck9wdGlvbnNcclxuICAgICAgYmFyRmlsbDogJ2xpZ2h0R3JheScsXHJcbiAgICAgIGJhclN0cm9rZTogbnVsbCxcclxuICAgICAgYmFySGVpZ2h0OiA1MCxcclxuICAgICAgeE1hcmdpbjogMTAsXHJcbiAgICAgIHlNYXJnaW46IDgsXHJcbiAgICAgIGZsb2F0VG9Ub3A6IGZhbHNlLFxyXG4gICAgICBkeW5hbWljQWxpZ25tZW50OiB0cnVlXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBzaXplIHdpbGwgYmUgc2V0IGJ5IHZpc2libGVCb3VuZHNMaXN0ZW5lclxyXG4gICAgY29uc3QgYmFyTm9kZSA9IG5ldyBSZWN0YW5nbGUoIHtcclxuICAgICAgZmlsbDogb3B0aW9ucy5iYXJGaWxsLFxyXG4gICAgICBzdHJva2U6IG9wdGlvbnMuYmFyU3Ryb2tlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBkZWNvcmF0aW9uLCB3aXRoIHRoZSBiYXIgYmVoaW5kIGV2ZXJ5dGhpbmcgZWxzZVxyXG4gICAgY29uc3QgcmVjdGFuZ2xlczogTm9kZVtdID0gWyBiYXJOb2RlIF07XHJcbiAgICBvcHRpb25zLmNoaWxkcmVuID0gcmVjdGFuZ2xlcy5jb25jYXQoIG9wdGlvbnMuY2hpbGRyZW4gfHwgW10gKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIGZvciBsYXlvdXQgb2YgVUkgY29tcG9uZW50cyBvbiB0aGUgc3RhdHVzIGJhciwgY29tcGVuc2F0ZWQgZm9yIG1hcmdpbnNcclxuICAgIGNvbnN0IHBvc2l0aW9uaW5nQm91bmRzUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIEJvdW5kczIuRVZFUllUSElORywge1xyXG4gICAgICB2YWx1ZVR5cGU6IEJvdW5kczJcclxuICAgIH0gKTtcclxuICAgIHRoaXMucG9zaXRpb25pbmdCb3VuZHNQcm9wZXJ0eSA9IHBvc2l0aW9uaW5nQm91bmRzUHJvcGVydHk7XHJcblxyXG4gICAgY29uc3QgdmlzaWJsZUJvdW5kc0xpc3RlbmVyID0gKCB2aXNpYmxlQm91bmRzOiBCb3VuZHMyICkgPT4ge1xyXG5cclxuICAgICAgLy8gUmVzaXplIGFuZCBwb3NpdGlvbiB0aGUgYmFyIHRvIG1hdGNoIHRoZSB2aXNpYmxlIGJvdW5kcy5cclxuICAgICAgY29uc3QgeSA9ICggb3B0aW9ucy5mbG9hdFRvVG9wICkgPyB2aXNpYmxlQm91bmRzLnRvcCA6IGxheW91dEJvdW5kcy50b3A7XHJcbiAgICAgIGJhck5vZGUuc2V0UmVjdCggdmlzaWJsZUJvdW5kcy5taW5YLCB5LCB2aXNpYmxlQm91bmRzLndpZHRoLCBvcHRpb25zLmJhckhlaWdodCApO1xyXG5cclxuICAgICAgLy8gVXBkYXRlIHRoZSBib3VuZHMgaW5zaWRlIHdoaWNoIGNvbXBvbmVudHMgb24gdGhlIHN0YXR1cyBiYXIgc2hvdWxkIGJlIHBvc2l0aW9uZWQuXHJcbiAgICAgIHBvc2l0aW9uaW5nQm91bmRzUHJvcGVydHkudmFsdWUgPSBuZXcgQm91bmRzMihcclxuICAgICAgICAoICggb3B0aW9ucy5keW5hbWljQWxpZ25tZW50ICkgPyBiYXJOb2RlLmxlZnQgOiBsYXlvdXRCb3VuZHMubWluWCApICsgb3B0aW9ucy54TWFyZ2luLFxyXG4gICAgICAgIGJhck5vZGUudG9wLFxyXG4gICAgICAgICggKCBvcHRpb25zLmR5bmFtaWNBbGlnbm1lbnQgKSA/IGJhck5vZGUucmlnaHQgOiBsYXlvdXRCb3VuZHMubWF4WCApIC0gb3B0aW9ucy54TWFyZ2luLFxyXG4gICAgICAgIGJhck5vZGUuYm90dG9tXHJcbiAgICAgICk7XHJcbiAgICB9O1xyXG4gICAgdmlzaWJsZUJvdW5kc1Byb3BlcnR5LmxpbmsoIHZpc2libGVCb3VuZHNMaXN0ZW5lciApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZVN0YXR1c0JhciA9ICgpID0+IHtcclxuICAgICAgaWYgKCB2aXNpYmxlQm91bmRzUHJvcGVydHkuaGFzTGlzdGVuZXIoIHZpc2libGVCb3VuZHNMaXN0ZW5lciApICkge1xyXG4gICAgICAgIHZpc2libGVCb3VuZHNQcm9wZXJ0eS51bmxpbmsoIHZpc2libGVCb3VuZHNMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VTdGF0dXNCYXIoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnlQaGV0LnJlZ2lzdGVyKCAnU3RhdHVzQmFyJywgU3RhdHVzQmFyICk7XHJcbmV4cG9ydCBkZWZhdWx0IFN0YXR1c0JhcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE9BQU9BLFFBQVEsTUFBTSwyQkFBMkI7QUFDaEQsT0FBT0MsT0FBTyxNQUFNLHlCQUF5QjtBQUM3QyxPQUFPQyxTQUFTLE1BQU0saUNBQWlDO0FBQ3ZELE9BQU9DLFFBQVEsTUFBTSxtQ0FBbUM7QUFDeEQsU0FBU0MsS0FBSyxFQUFFQyxJQUFJLEVBQWVDLFNBQVMsUUFBZ0IsNkJBQTZCO0FBQ3pGLE9BQU9DLFdBQVcsTUFBTSxrQkFBa0I7QUFvQjFDLE1BQU1DLFNBQVMsU0FBU0gsSUFBSSxDQUFDO0VBSTNCLE9BQXVCSSxZQUFZLEdBQUcsSUFBSU4sUUFBUSxDQUFFLEVBQUcsQ0FBQztFQUN4RCxPQUF1Qk8saUJBQWlCLEdBQUdOLEtBQUssQ0FBQ08sS0FBSzs7RUFFdEQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNTQyxXQUFXQSxDQUFFQyxZQUFxQixFQUFFQyxxQkFBaUQsRUFBRUMsZUFBa0MsRUFBRztJ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