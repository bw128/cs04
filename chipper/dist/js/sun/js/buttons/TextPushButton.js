// Copyright 2014-2024, University of Colorado Boulder

/**
 * TextPushButton is a convenience class for creating a rectangular push button with a text label.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import { Font, Text } from '../../../scenery/js/imports.js';
import Tandem from '../../../tandem/js/Tandem.js';
import sun from '../sun.js';
import RectangularPushButton from './RectangularPushButton.js';
export default class TextPushButton extends RectangularPushButton {
  constructor(string, providedOptions) {
    const options = optionize()({
      // TextPushButtonOptions
      font: Font.DEFAULT,
      textFill: 'black',
      maxTextWidth: null,
      // RectangularPushButtonOptions
      tandem: Tandem.REQUIRED,
      innerContent: string
    }, providedOptions);
    const text = new Text(string, combineOptions({
      font: options.font,
      fill: options.textFill,
      maxWidth: options.maxTextWidth
    }, options.textNodeOptions));
    options.content = text;
    super(options);
    this.disposeTextPushButton = () => {
      text.dispose();
    };
  }
  dispose() {
    this.disposeTextPushButton();
    super.dispose();
  }
}
sun.register('TextPushButton', TextPushButton);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIkZvbnQiLCJUZXh0IiwiVGFuZGVtIiwic3VuIiwiUmVjdGFuZ3VsYXJQdXNoQnV0dG9uIiwiVGV4dFB1c2hCdXR0b24iLCJjb25zdHJ1Y3RvciIsInN0cmluZyIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJmb250IiwiREVGQVVMVCIsInRleHRGaWxsIiwibWF4VGV4dFdpZHRoIiwidGFuZGVtIiwiUkVRVUlSRUQiLCJpbm5lckNvbnRlbnQiLCJ0ZXh0IiwiZmlsbCIsIm1heFdpZHRoIiwidGV4dE5vZGVPcHRpb25zIiwiY29udGVudCIsImRpc3Bvc2VUZXh0UHVzaEJ1dHRvbiIsImRpc3Bvc2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlRleHRQdXNoQnV0dG9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRleHRQdXNoQnV0dG9uIGlzIGEgY29udmVuaWVuY2UgY2xhc3MgZm9yIGNyZWF0aW5nIGEgcmVjdGFuZ3VsYXIgcHVzaCBidXR0b24gd2l0aCBhIHRleHQgbGFiZWwuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9obiBCbGFuY28gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IEZvbnQsIFRleHQsIFRleHRPcHRpb25zLCBUUGFpbnQgfSBmcm9tICcuLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgc3VuIGZyb20gJy4uL3N1bi5qcyc7XHJcbmltcG9ydCBSZWN0YW5ndWxhclB1c2hCdXR0b24sIHsgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uT3B0aW9ucyB9IGZyb20gJy4vUmVjdGFuZ3VsYXJQdXNoQnV0dG9uLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBmb250PzogRm9udDtcclxuICB0ZXh0RmlsbD86IFRQYWludDtcclxuICBtYXhUZXh0V2lkdGg/OiBudW1iZXIgfCBudWxsO1xyXG4gIHRleHROb2RlT3B0aW9ucz86IFRleHRPcHRpb25zO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgVGV4dFB1c2hCdXR0b25PcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbk9wdGlvbnMsICdjb250ZW50Jz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0UHVzaEJ1dHRvbiBleHRlbmRzIFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbiB7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZVRleHRQdXNoQnV0dG9uOiAoKSA9PiB2b2lkO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHN0cmluZzogc3RyaW5nIHwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiwgcHJvdmlkZWRPcHRpb25zPzogVGV4dFB1c2hCdXR0b25PcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8VGV4dFB1c2hCdXR0b25PcHRpb25zLCBTdHJpY3RPbWl0PFNlbGZPcHRpb25zLCAndGV4dE5vZGVPcHRpb25zJz4sIFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbk9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFRleHRQdXNoQnV0dG9uT3B0aW9uc1xyXG4gICAgICBmb250OiBGb250LkRFRkFVTFQsXHJcbiAgICAgIHRleHRGaWxsOiAnYmxhY2snLFxyXG4gICAgICBtYXhUZXh0V2lkdGg6IG51bGwsXHJcblxyXG4gICAgICAvLyBSZWN0YW5ndWxhclB1c2hCdXR0b25PcHRpb25zXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVELFxyXG4gICAgICBpbm5lckNvbnRlbnQ6IHN0cmluZ1xyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgdGV4dCA9IG5ldyBUZXh0KCBzdHJpbmcsIGNvbWJpbmVPcHRpb25zPFRleHRPcHRpb25zPigge1xyXG4gICAgICBmb250OiBvcHRpb25zLmZvbnQsXHJcbiAgICAgIGZpbGw6IG9wdGlvbnMudGV4dEZpbGwsXHJcbiAgICAgIG1heFdpZHRoOiBvcHRpb25zLm1heFRleHRXaWR0aFxyXG4gICAgfSwgb3B0aW9ucy50ZXh0Tm9kZU9wdGlvbnMgKSApO1xyXG4gICAgb3B0aW9ucy5jb250ZW50ID0gdGV4dDtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZVRleHRQdXNoQnV0dG9uID0gKCkgPT4ge1xyXG4gICAgICB0ZXh0LmRpc3Bvc2UoKTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZVRleHRQdXNoQnV0dG9uKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zdW4ucmVnaXN0ZXIoICdUZXh0UHVzaEJ1dHRvbicsIFRleHRQdXNoQnV0dG9uICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE9BQU9BLFNBQVMsSUFBSUMsY0FBYyxRQUFRLG9DQUFvQztBQUM5RSxTQUFTQyxJQUFJLEVBQUVDLElBQUksUUFBNkIsZ0NBQWdDO0FBQ2hGLE9BQU9DLE1BQU0sTUFBTSw4QkFBOEI7QUFDakQsT0FBT0MsR0FBRyxNQUFNLFdBQVc7QUFDM0IsT0FBT0MscUJBQXFCLE1BQXdDLDRCQUE0QjtBQVloRyxlQUFlLE1BQU1DLGNBQWMsU0FBU0QscUJBQXFCLENBQUM7RUFJekRFLFdBQVdBLENBQUVDLE1BQTBDLEVBQUVDLGVBQXVDLEVBQUc7SUFFeEcsTUFBTUMsT0FBTyxHQUFHWCxTQUFTLENBQWtHLENBQUMsQ0FBRTtNQUU1SDtNQUNBWSxJQUFJLEVBQUVWLElBQUksQ0FBQ1csT0FBTztNQUNsQkMsUUFBUSxFQUFFLE9BQU87TUFDakJDLFlBQVksRUFBRSxJQUFJO01BRWxCO01BQ0FDLE1BQU0sRUFBRVosTUFBTSxDQUFDYSxRQUFRO01BQ3ZCQyxZQUFZLEVBQUVUO0lBQ2hCLENBQUMsRUFBRUMsZUFBZ0IsQ0FBQztJQUVwQixNQUFNUyxJQUFJLEdBQUcsSUFBSWhCLElBQUksQ0FBRU0sTUFBTSxFQUFFUixjQUFjLENBQWU7TUFDMURXLElBQUksRUFBRUQsT0FBTyxDQUFDQyxJQUFJO01BQ2xCUSxJQUFJLEVBQUVULE9BQU8sQ0FBQ0csUUFBUTtNQUN0Qk8sUUFBUSxFQUFFVixPQUFPLENBQUNJO0lBQ3BCLENBQUMsRUFBRUosT0FBTyxDQUFDVyxlQUFnQixDQUFFLENBQUM7SUFDOUJYLE9BQU8sQ0FBQ1ksT0FBTyxHQUFHSixJQUFJO0lBRXRCLEtBQUssQ0FBRVIsT0FBUSxDQUFDO0lBRWhCLElBQUksQ0FBQ2EscUJBQXFCLEdBQUcsTUFBTTtNQUNqQ0wsSUFBSSxDQUFDTSxPQUFPLENBQUMsQ0FBQztJQUNoQixDQUFDO0VBQ0g7RUFFZ0JBLE9BQU9BLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUNELHFCQUFxQixDQUFDLENBQUM7SUFDNUIsS0FBSyxDQUFDQyxPQUFPLENBQUMsQ0FBQztFQUNqQjtBQUNGO0FBRUFwQixHQUFHLENBQUNxQixRQUFRLENBQUUsZ0JBQWdCLEVBQUVuQixjQUFlLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=