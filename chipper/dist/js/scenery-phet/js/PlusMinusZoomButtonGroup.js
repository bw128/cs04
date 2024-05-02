// Copyright 2020-2023, University of Colorado Boulder

/**
 * A ZoomButtonGroup that shows a "+" and "-" sign for the button icons.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Dimension2 from '../../dot/js/Dimension2.js';
import optionize from '../../phet-core/js/optionize.js';
import { AlignBox, AlignGroup } from '../../scenery/js/imports.js';
import ButtonNode from '../../sun/js/buttons/ButtonNode.js';
import MinusNode from './MinusNode.js';
import PlusNode from './PlusNode.js';
import sceneryPhet from './sceneryPhet.js';
import ZoomButtonGroup from './ZoomButtonGroup.js';

// constants
const DEFAULT_ICON_SIZE = new Dimension2(7, 1.26); // chosen to match existing sim defaults

export default class PlusMinusZoomButtonGroup extends ZoomButtonGroup {
  /**
   * @param zoomLevelProperty - smaller value means more zoomed out
   * @param providedOptions
   */
  constructor(zoomLevelProperty, providedOptions) {
    const options = optionize()({
      // SelfOptions
      iconOptions: {
        size: DEFAULT_ICON_SIZE
      },
      // ZoomButtonGroupOptions
      buttonOptions: {
        baseColor: 'white',
        xMargin: 9,
        yMargin: 10,
        cornerRadius: 0,
        buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy
      }
    }, providedOptions);

    // To make the icons have the same effective size
    const alignBoxOptions = {
      group: new AlignGroup()
    };
    super(zoomLevelProperty, new AlignBox(new PlusNode(options.iconOptions), alignBoxOptions), new AlignBox(new MinusNode(options.iconOptions), alignBoxOptions), options);
  }
}
sceneryPhet.register('PlusMinusZoomButtonGroup', PlusMinusZoomButtonGroup);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEaW1lbnNpb24yIiwib3B0aW9uaXplIiwiQWxpZ25Cb3giLCJBbGlnbkdyb3VwIiwiQnV0dG9uTm9kZSIsIk1pbnVzTm9kZSIsIlBsdXNOb2RlIiwic2NlbmVyeVBoZXQiLCJab29tQnV0dG9uR3JvdXAiLCJERUZBVUxUX0lDT05fU0laRSIsIlBsdXNNaW51c1pvb21CdXR0b25Hcm91cCIsImNvbnN0cnVjdG9yIiwiem9vbUxldmVsUHJvcGVydHkiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiaWNvbk9wdGlvbnMiLCJzaXplIiwiYnV0dG9uT3B0aW9ucyIsImJhc2VDb2xvciIsInhNYXJnaW4iLCJ5TWFyZ2luIiwiY29ybmVyUmFkaXVzIiwiYnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5IiwiRmxhdEFwcGVhcmFuY2VTdHJhdGVneSIsImFsaWduQm94T3B0aW9ucyIsImdyb3VwIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJQbHVzTWludXNab29tQnV0dG9uR3JvdXAudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBab29tQnV0dG9uR3JvdXAgdGhhdCBzaG93cyBhIFwiK1wiIGFuZCBcIi1cIiBzaWduIGZvciB0aGUgYnV0dG9uIGljb25zLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBUUmFuZ2VkUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmFuZ2VkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRGltZW5zaW9uMiBmcm9tICcuLi8uLi9kb3QvanMvRGltZW5zaW9uMi5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IEFsaWduQm94LCBBbGlnbkdyb3VwLCBQYXRoT3B0aW9ucyB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBCdXR0b25Ob2RlIGZyb20gJy4uLy4uL3N1bi9qcy9idXR0b25zL0J1dHRvbk5vZGUuanMnO1xyXG5pbXBvcnQgTWludXNOb2RlIGZyb20gJy4vTWludXNOb2RlLmpzJztcclxuaW1wb3J0IFBsdXNOb2RlIGZyb20gJy4vUGx1c05vZGUuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCBab29tQnV0dG9uR3JvdXAsIHsgWm9vbUJ1dHRvbkdyb3VwT3B0aW9ucyB9IGZyb20gJy4vWm9vbUJ1dHRvbkdyb3VwLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBERUZBVUxUX0lDT05fU0laRSA9IG5ldyBEaW1lbnNpb24yKCA3LCAxLjI2ICk7IC8vIGNob3NlbiB0byBtYXRjaCBleGlzdGluZyBzaW0gZGVmYXVsdHNcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIG9wdGlvbnMgcHJvcGFnYXRlZCB0byBQbHVzTm9kZSBhbmQgTWludXNOb2RlXHJcbiAgaWNvbk9wdGlvbnM/OiB7XHJcbiAgICBzaXplPzogRGltZW5zaW9uMjtcclxuICB9ICYgUGF0aE9wdGlvbnM7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBQbHVzTWludXNab29tQnV0dG9uR3JvdXBPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBab29tQnV0dG9uR3JvdXBPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGx1c01pbnVzWm9vbUJ1dHRvbkdyb3VwIGV4dGVuZHMgWm9vbUJ1dHRvbkdyb3VwIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHpvb21MZXZlbFByb3BlcnR5IC0gc21hbGxlciB2YWx1ZSBtZWFucyBtb3JlIHpvb21lZCBvdXRcclxuICAgKiBAcGFyYW0gcHJvdmlkZWRPcHRpb25zXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB6b29tTGV2ZWxQcm9wZXJ0eTogVFJhbmdlZFByb3BlcnR5LCBwcm92aWRlZE9wdGlvbnM/OiBQbHVzTWludXNab29tQnV0dG9uR3JvdXBPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UGx1c01pbnVzWm9vbUJ1dHRvbkdyb3VwT3B0aW9ucywgU2VsZk9wdGlvbnMsIFpvb21CdXR0b25Hcm91cE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFNlbGZPcHRpb25zXHJcbiAgICAgIGljb25PcHRpb25zOiB7XHJcbiAgICAgICAgc2l6ZTogREVGQVVMVF9JQ09OX1NJWkVcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIFpvb21CdXR0b25Hcm91cE9wdGlvbnNcclxuICAgICAgYnV0dG9uT3B0aW9uczoge1xyXG4gICAgICAgIGJhc2VDb2xvcjogJ3doaXRlJyxcclxuICAgICAgICB4TWFyZ2luOiA5LFxyXG4gICAgICAgIHlNYXJnaW46IDEwLFxyXG4gICAgICAgIGNvcm5lclJhZGl1czogMCxcclxuICAgICAgICBidXR0b25BcHBlYXJhbmNlU3RyYXRlZ3k6IEJ1dHRvbk5vZGUuRmxhdEFwcGVhcmFuY2VTdHJhdGVneVxyXG4gICAgICB9XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBUbyBtYWtlIHRoZSBpY29ucyBoYXZlIHRoZSBzYW1lIGVmZmVjdGl2ZSBzaXplXHJcbiAgICBjb25zdCBhbGlnbkJveE9wdGlvbnMgPSB7IGdyb3VwOiBuZXcgQWxpZ25Hcm91cCgpIH07XHJcblxyXG4gICAgc3VwZXIoIHpvb21MZXZlbFByb3BlcnR5LCBuZXcgQWxpZ25Cb3goIG5ldyBQbHVzTm9kZSggb3B0aW9ucy5pY29uT3B0aW9ucyApLCBhbGlnbkJveE9wdGlvbnMgKSwgbmV3IEFsaWduQm94KCBuZXcgTWludXNOb2RlKCBvcHRpb25zLmljb25PcHRpb25zICksIGFsaWduQm94T3B0aW9ucyApLCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ1BsdXNNaW51c1pvb21CdXR0b25Hcm91cCcsIFBsdXNNaW51c1pvb21CdXR0b25Hcm91cCApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxPQUFPQSxVQUFVLE1BQU0sNEJBQTRCO0FBQ25ELE9BQU9DLFNBQVMsTUFBTSxpQ0FBaUM7QUFDdkQsU0FBU0MsUUFBUSxFQUFFQyxVQUFVLFFBQXFCLDZCQUE2QjtBQUMvRSxPQUFPQyxVQUFVLE1BQU0sb0NBQW9DO0FBQzNELE9BQU9DLFNBQVMsTUFBTSxnQkFBZ0I7QUFDdEMsT0FBT0MsUUFBUSxNQUFNLGVBQWU7QUFDcEMsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjtBQUMxQyxPQUFPQyxlQUFlLE1BQWtDLHNCQUFzQjs7QUFFOUU7QUFDQSxNQUFNQyxpQkFBaUIsR0FBRyxJQUFJVCxVQUFVLENBQUUsQ0FBQyxFQUFFLElBQUssQ0FBQyxDQUFDLENBQUM7O0FBWXJELGVBQWUsTUFBTVUsd0JBQXdCLFNBQVNGLGVBQWUsQ0FBQztFQUVwRTtBQUNGO0FBQ0E7QUFDQTtFQUNTRyxXQUFXQSxDQUFFQyxpQkFBa0MsRUFBRUMsZUFBaUQsRUFBRztJQUUxRyxNQUFNQyxPQUFPLEdBQUdiLFNBQVMsQ0FBdUUsQ0FBQyxDQUFFO01BRWpHO01BQ0FjLFdBQVcsRUFBRTtRQUNYQyxJQUFJLEVBQUVQO01BQ1IsQ0FBQztNQUVEO01BQ0FRLGFBQWEsRUFBRTtRQUNiQyxTQUFTLEVBQUUsT0FBTztRQUNsQkMsT0FBTyxFQUFFLENBQUM7UUFDVkMsT0FBTyxFQUFFLEVBQUU7UUFDWEMsWUFBWSxFQUFFLENBQUM7UUFDZkMsd0JBQXdCLEVBQUVsQixVQUFVLENBQUNtQjtNQUN2QztJQUNGLENBQUMsRUFBRVYsZUFBZ0IsQ0FBQzs7SUFFcEI7SUFDQSxNQUFNVyxlQUFlLEdBQUc7TUFBRUMsS0FBSyxFQUFFLElBQUl0QixVQUFVLENBQUM7SUFBRSxDQUFDO0lBRW5ELEtBQUssQ0FBRVMsaUJBQWlCLEVBQUUsSUFBSVYsUUFBUSxDQUFFLElBQUlJLFFBQVEsQ0FBRVEsT0FBTyxDQUFDQyxXQUFZLENBQUMsRUFBRVMsZUFBZ0IsQ0FBQyxFQUFFLElBQUl0QixRQUFRLENBQUUsSUFBSUcsU0FBUyxDQUFFUyxPQUFPLENBQUNDLFdBQVksQ0FBQyxFQUFFUyxlQUFnQixDQUFDLEVBQUVWLE9BQVEsQ0FBQztFQUNsTDtBQUNGO0FBRUFQLFdBQVcsQ0FBQ21CLFFBQVEsQ0FBRSwwQkFBMEIsRUFBRWhCLHdCQUF5QixDQUFDIiwiaWdub3JlTGlzdCI6W119