// Copyright 2017-2023, University of Colorado Boulder

/**
 * Semi-transparent black barrier used to block input events when a dialog (or other popup) is present, and fade out
 * the background.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { FireListener, Plane } from '../../scenery/js/imports.js';
import EventType from '../../tandem/js/EventType.js';
import dotRandom from '../../dot/js/dotRandom.js';
import sceneryPhet from './sceneryPhet.js';
import optionize from '../../phet-core/js/optionize.js';
import Tandem from '../../tandem/js/Tandem.js';
export default class BarrierRectangle extends Plane {
  constructor(modalNodeStack, providedOptions) {
    const options = optionize()({
      fill: 'rgba( 0, 0, 0, 0.3 )',
      pickable: true,
      phetioReadOnly: true,
      // Disable controls in the PhET-iO Studio wrapper
      phetioEventType: EventType.USER,
      visiblePropertyOptions: {
        phetioState: false
      }
    }, providedOptions);
    super(options);
    const lengthListener = numberOfBarriers => {
      this.visible = numberOfBarriers > 0;
    };
    modalNodeStack.lengthProperty.link(lengthListener);
    this.addInputListener(new FireListener({
      tandem: Tandem.OPT_OUT,
      phetioReadOnly: options.phetioReadOnly,
      fire() {
        assert && assert(modalNodeStack.length > 0, 'There must be a Node in the stack to hide.');

        // If fuzzing is enabled, close popups with a reduced probability, to improve testing coverage.
        // As of this writing, this addresses Dialogs and the PhET menu.
        // See https://github.com/phetsims/aqua/issues/136
        if (!phet.chipper.isFuzzEnabled() || dotRandom.nextDouble() < 0.005) {
          modalNodeStack.get(modalNodeStack.length - 1).hide();
        }
      }
    }));
    this.disposeBarrierRectangle = () => {
      if (modalNodeStack.lengthProperty.hasListener(lengthListener)) {
        modalNodeStack.lengthProperty.unlink(lengthListener);
      }
    };
  }
  dispose() {
    this.disposeBarrierRectangle();
    super.dispose();
  }
}
sceneryPhet.register('BarrierRectangle', BarrierRectangle);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJGaXJlTGlzdGVuZXIiLCJQbGFuZSIsIkV2ZW50VHlwZSIsImRvdFJhbmRvbSIsInNjZW5lcnlQaGV0Iiwib3B0aW9uaXplIiwiVGFuZGVtIiwiQmFycmllclJlY3RhbmdsZSIsImNvbnN0cnVjdG9yIiwibW9kYWxOb2RlU3RhY2siLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiZmlsbCIsInBpY2thYmxlIiwicGhldGlvUmVhZE9ubHkiLCJwaGV0aW9FdmVudFR5cGUiLCJVU0VSIiwidmlzaWJsZVByb3BlcnR5T3B0aW9ucyIsInBoZXRpb1N0YXRlIiwibGVuZ3RoTGlzdGVuZXIiLCJudW1iZXJPZkJhcnJpZXJzIiwidmlzaWJsZSIsImxlbmd0aFByb3BlcnR5IiwibGluayIsImFkZElucHV0TGlzdGVuZXIiLCJ0YW5kZW0iLCJPUFRfT1VUIiwiZmlyZSIsImFzc2VydCIsImxlbmd0aCIsInBoZXQiLCJjaGlwcGVyIiwiaXNGdXp6RW5hYmxlZCIsIm5leHREb3VibGUiLCJnZXQiLCJoaWRlIiwiZGlzcG9zZUJhcnJpZXJSZWN0YW5nbGUiLCJoYXNMaXN0ZW5lciIsInVubGluayIsImRpc3Bvc2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkJhcnJpZXJSZWN0YW5nbGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU2VtaS10cmFuc3BhcmVudCBibGFjayBiYXJyaWVyIHVzZWQgdG8gYmxvY2sgaW5wdXQgZXZlbnRzIHdoZW4gYSBkaWFsb2cgKG9yIG90aGVyIHBvcHVwKSBpcyBwcmVzZW50LCBhbmQgZmFkZSBvdXRcclxuICogdGhlIGJhY2tncm91bmQuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgeyBGaXJlTGlzdGVuZXIsIFBsYW5lLCBQbGFuZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgRXZlbnRUeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9FdmVudFR5cGUuanMnO1xyXG5pbXBvcnQgZG90UmFuZG9tIGZyb20gJy4uLy4uL2RvdC9qcy9kb3RSYW5kb20uanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCB7IE9ic2VydmFibGVBcnJheSB9IGZyb20gJy4uLy4uL2F4b24vanMvY3JlYXRlT2JzZXJ2YWJsZUFycmF5LmpzJztcclxuaW1wb3J0IHsgUG9wdXBhYmxlTm9kZSB9IGZyb20gJy4uLy4uL3N1bi9qcy9Qb3B1cGFibGUuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IEVtcHR5U2VsZk9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSBFbXB0eVNlbGZPcHRpb25zO1xyXG5cclxuZXhwb3J0IHR5cGUgQmFycmllclJlY3RhbmdsZU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFBsYW5lT3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJhcnJpZXJSZWN0YW5nbGUgZXh0ZW5kcyBQbGFuZSB7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZUJhcnJpZXJSZWN0YW5nbGU6ICgpID0+IHZvaWQ7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggbW9kYWxOb2RlU3RhY2s6IE9ic2VydmFibGVBcnJheTxQb3B1cGFibGVOb2RlPiwgcHJvdmlkZWRPcHRpb25zPzogQmFycmllclJlY3RhbmdsZU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxCYXJyaWVyUmVjdGFuZ2xlT3B0aW9ucywgU2VsZk9wdGlvbnMsIFBsYW5lT3B0aW9ucz4oKSgge1xyXG4gICAgICBmaWxsOiAncmdiYSggMCwgMCwgMCwgMC4zICknLFxyXG4gICAgICBwaWNrYWJsZTogdHJ1ZSxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWUsIC8vIERpc2FibGUgY29udHJvbHMgaW4gdGhlIFBoRVQtaU8gU3R1ZGlvIHdyYXBwZXJcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgdmlzaWJsZVByb3BlcnR5T3B0aW9uczoge1xyXG4gICAgICAgIHBoZXRpb1N0YXRlOiBmYWxzZVxyXG4gICAgICB9XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IGxlbmd0aExpc3RlbmVyID0gKCBudW1iZXJPZkJhcnJpZXJzOiBudW1iZXIgKSA9PiB7XHJcbiAgICAgIHRoaXMudmlzaWJsZSA9ICggbnVtYmVyT2ZCYXJyaWVycyA+IDAgKTtcclxuICAgIH07XHJcbiAgICBtb2RhbE5vZGVTdGFjay5sZW5ndGhQcm9wZXJ0eS5saW5rKCBsZW5ndGhMaXN0ZW5lciApO1xyXG5cclxuICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lciggbmV3IEZpcmVMaXN0ZW5lcigge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VULFxyXG4gICAgICBwaGV0aW9SZWFkT25seTogb3B0aW9ucy5waGV0aW9SZWFkT25seSxcclxuICAgICAgZmlyZSgpIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtb2RhbE5vZGVTdGFjay5sZW5ndGggPiAwLCAnVGhlcmUgbXVzdCBiZSBhIE5vZGUgaW4gdGhlIHN0YWNrIHRvIGhpZGUuJyApO1xyXG5cclxuICAgICAgICAvLyBJZiBmdXp6aW5nIGlzIGVuYWJsZWQsIGNsb3NlIHBvcHVwcyB3aXRoIGEgcmVkdWNlZCBwcm9iYWJpbGl0eSwgdG8gaW1wcm92ZSB0ZXN0aW5nIGNvdmVyYWdlLlxyXG4gICAgICAgIC8vIEFzIG9mIHRoaXMgd3JpdGluZywgdGhpcyBhZGRyZXNzZXMgRGlhbG9ncyBhbmQgdGhlIFBoRVQgbWVudS5cclxuICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2FxdWEvaXNzdWVzLzEzNlxyXG4gICAgICAgIGlmICggIXBoZXQuY2hpcHBlci5pc0Z1enpFbmFibGVkKCkgfHwgZG90UmFuZG9tLm5leHREb3VibGUoKSA8IDAuMDA1ICkge1xyXG4gICAgICAgICAgbW9kYWxOb2RlU3RhY2suZ2V0KCBtb2RhbE5vZGVTdGFjay5sZW5ndGggLSAxICkuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApICk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlQmFycmllclJlY3RhbmdsZSA9ICgpID0+IHtcclxuICAgICAgaWYgKCBtb2RhbE5vZGVTdGFjay5sZW5ndGhQcm9wZXJ0eS5oYXNMaXN0ZW5lciggbGVuZ3RoTGlzdGVuZXIgKSApIHtcclxuICAgICAgICBtb2RhbE5vZGVTdGFjay5sZW5ndGhQcm9wZXJ0eS51bmxpbmsoIGxlbmd0aExpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZUJhcnJpZXJSZWN0YW5nbGUoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnlQaGV0LnJlZ2lzdGVyKCAnQmFycmllclJlY3RhbmdsZScsIEJhcnJpZXJSZWN0YW5nbGUgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxZQUFZLEVBQUVDLEtBQUssUUFBc0IsNkJBQTZCO0FBQy9FLE9BQU9DLFNBQVMsTUFBTSw4QkFBOEI7QUFDcEQsT0FBT0MsU0FBUyxNQUFNLDJCQUEyQjtBQUNqRCxPQUFPQyxXQUFXLE1BQU0sa0JBQWtCO0FBRzFDLE9BQU9DLFNBQVMsTUFBNEIsaUNBQWlDO0FBQzdFLE9BQU9DLE1BQU0sTUFBTSwyQkFBMkI7QUFNOUMsZUFBZSxNQUFNQyxnQkFBZ0IsU0FBU04sS0FBSyxDQUFDO0VBSTNDTyxXQUFXQSxDQUFFQyxjQUE4QyxFQUFFQyxlQUF5QyxFQUFHO0lBRTlHLE1BQU1DLE9BQU8sR0FBR04sU0FBUyxDQUFxRCxDQUFDLENBQUU7TUFDL0VPLElBQUksRUFBRSxzQkFBc0I7TUFDNUJDLFFBQVEsRUFBRSxJQUFJO01BQ2RDLGNBQWMsRUFBRSxJQUFJO01BQUU7TUFDdEJDLGVBQWUsRUFBRWIsU0FBUyxDQUFDYyxJQUFJO01BQy9CQyxzQkFBc0IsRUFBRTtRQUN0QkMsV0FBVyxFQUFFO01BQ2Y7SUFDRixDQUFDLEVBQUVSLGVBQWdCLENBQUM7SUFFcEIsS0FBSyxDQUFFQyxPQUFRLENBQUM7SUFFaEIsTUFBTVEsY0FBYyxHQUFLQyxnQkFBd0IsSUFBTTtNQUNyRCxJQUFJLENBQUNDLE9BQU8sR0FBS0QsZ0JBQWdCLEdBQUcsQ0FBRztJQUN6QyxDQUFDO0lBQ0RYLGNBQWMsQ0FBQ2EsY0FBYyxDQUFDQyxJQUFJLENBQUVKLGNBQWUsQ0FBQztJQUVwRCxJQUFJLENBQUNLLGdCQUFnQixDQUFFLElBQUl4QixZQUFZLENBQUU7TUFDdkN5QixNQUFNLEVBQUVuQixNQUFNLENBQUNvQixPQUFPO01BQ3RCWixjQUFjLEVBQUVILE9BQU8sQ0FBQ0csY0FBYztNQUN0Q2EsSUFBSUEsQ0FBQSxFQUFHO1FBQ0xDLE1BQU0sSUFBSUEsTUFBTSxDQUFFbkIsY0FBYyxDQUFDb0IsTUFBTSxHQUFHLENBQUMsRUFBRSw0Q0FBNkMsQ0FBQzs7UUFFM0Y7UUFDQTtRQUNBO1FBQ0EsSUFBSyxDQUFDQyxJQUFJLENBQUNDLE9BQU8sQ0FBQ0MsYUFBYSxDQUFDLENBQUMsSUFBSTdCLFNBQVMsQ0FBQzhCLFVBQVUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUFHO1VBQ3JFeEIsY0FBYyxDQUFDeUIsR0FBRyxDQUFFekIsY0FBYyxDQUFDb0IsTUFBTSxHQUFHLENBQUUsQ0FBQyxDQUFDTSxJQUFJLENBQUMsQ0FBQztRQUN4RDtNQUNGO0lBQ0YsQ0FBRSxDQUFFLENBQUM7SUFFTCxJQUFJLENBQUNDLHVCQUF1QixHQUFHLE1BQU07TUFDbkMsSUFBSzNCLGNBQWMsQ0FBQ2EsY0FBYyxDQUFDZSxXQUFXLENBQUVsQixjQUFlLENBQUMsRUFBRztRQUNqRVYsY0FBYyxDQUFDYSxjQUFjLENBQUNnQixNQUFNLENBQUVuQixjQUFlLENBQUM7TUFDeEQ7SUFDRixDQUFDO0VBQ0g7RUFFZ0JvQixPQUFPQSxDQUFBLEVBQVM7SUFDOUIsSUFBSSxDQUFDSCx1QkFBdUIsQ0FBQyxDQUFDO0lBQzlCLEtBQUssQ0FBQ0csT0FBTyxDQUFDLENBQUM7RUFDakI7QUFDRjtBQUVBbkMsV0FBVyxDQUFDb0MsUUFBUSxDQUFFLGtCQUFrQixFQUFFakMsZ0JBQWlCLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=