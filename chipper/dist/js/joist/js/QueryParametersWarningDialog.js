// Copyright 2020-2024, University of Colorado Boulder

/**
 * Message dialog displayed when any public query parameters have invalid values, see https://github.com/phetsims/joist/issues/593
 *
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize from '../../phet-core/js/optionize.js';
import OopsDialog from '../../scenery-phet/js/OopsDialog.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import { Text } from '../../scenery/js/imports.js';
import joist from './joist.js';
import JoistStrings from './JoistStrings.js';
import Tandem from '../../tandem/js/Tandem.js';
class QueryParametersWarningDialog extends OopsDialog {
  /**
   * @param warnings - see QueryStringMachine.warnings
   * @param [providedOptions]
   */
  constructor(
  // See phet-types.d.ts
  warnings,
  // eslint-disable-line no-undef
  providedOptions) {
    assert && assert(warnings.length > 0, `expected 1 or more warnings: ${warnings.length}`);
    const options = optionize()({
      // OopsDialogOptions
      richTextOptions: {
        font: new PhetFont(16)
      },
      title: new Text(JoistStrings.queryParametersWarningDialog.invalidQueryParametersStringProperty, {
        font: new PhetFont(28)
      }),
      tandem: Tandem.OPT_OUT
    }, providedOptions);

    // add warnings to generic message
    let message = `${JoistStrings.queryParametersWarningDialog.oneOrMoreQueryParametersStringProperty.value}<br><br>`;
    warnings.forEach(warning => {
      message += `${warning.key}=${warning.value}<br>`;
    });
    message += `<br>${JoistStrings.queryParametersWarningDialog.theSimulationWillStartStringProperty.value}`;
    super(message, options);
  }
}
joist.register('QueryParametersWarningDialog', QueryParametersWarningDialog);
export default QueryParametersWarningDialog;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJPb3BzRGlhbG9nIiwiUGhldEZvbnQiLCJUZXh0Iiwiam9pc3QiLCJKb2lzdFN0cmluZ3MiLCJUYW5kZW0iLCJRdWVyeVBhcmFtZXRlcnNXYXJuaW5nRGlhbG9nIiwiY29uc3RydWN0b3IiLCJ3YXJuaW5ncyIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsImxlbmd0aCIsIm9wdGlvbnMiLCJyaWNoVGV4dE9wdGlvbnMiLCJmb250IiwidGl0bGUiLCJxdWVyeVBhcmFtZXRlcnNXYXJuaW5nRGlhbG9nIiwiaW52YWxpZFF1ZXJ5UGFyYW1ldGVyc1N0cmluZ1Byb3BlcnR5IiwidGFuZGVtIiwiT1BUX09VVCIsIm1lc3NhZ2UiLCJvbmVPck1vcmVRdWVyeVBhcmFtZXRlcnNTdHJpbmdQcm9wZXJ0eSIsInZhbHVlIiwiZm9yRWFjaCIsIndhcm5pbmciLCJrZXkiLCJ0aGVTaW11bGF0aW9uV2lsbFN0YXJ0U3RyaW5nUHJvcGVydHkiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlF1ZXJ5UGFyYW1ldGVyc1dhcm5pbmdEaWFsb2cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogTWVzc2FnZSBkaWFsb2cgZGlzcGxheWVkIHdoZW4gYW55IHB1YmxpYyBxdWVyeSBwYXJhbWV0ZXJzIGhhdmUgaW52YWxpZCB2YWx1ZXMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzU5M1xyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIEtsdXNlbmRvcmYgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBPb3BzRGlhbG9nLCB7IE9vcHNEaWFsb2dPcHRpb25zIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS1waGV0L2pzL09vcHNEaWFsb2cuanMnO1xyXG5pbXBvcnQgUGhldEZvbnQgZnJvbSAnLi4vLi4vc2NlbmVyeS1waGV0L2pzL1BoZXRGb250LmpzJztcclxuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBqb2lzdCBmcm9tICcuL2pvaXN0LmpzJztcclxuaW1wb3J0IEpvaXN0U3RyaW5ncyBmcm9tICcuL0pvaXN0U3RyaW5ncy5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxuZXhwb3J0IHR5cGUgUXVlcnlQYXJhbWV0ZXJzV2FybmluZ0RpYWxvZ09wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIE9vcHNEaWFsb2dPcHRpb25zO1xyXG5cclxuY2xhc3MgUXVlcnlQYXJhbWV0ZXJzV2FybmluZ0RpYWxvZyBleHRlbmRzIE9vcHNEaWFsb2cge1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gd2FybmluZ3MgLSBzZWUgUXVlcnlTdHJpbmdNYWNoaW5lLndhcm5pbmdzXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgLy8gU2VlIHBoZXQtdHlwZXMuZC50c1xyXG4gICAgd2FybmluZ3M6IFdhcm5pbmdbXSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxyXG4gICAgcHJvdmlkZWRPcHRpb25zPzogUXVlcnlQYXJhbWV0ZXJzV2FybmluZ0RpYWxvZ09wdGlvbnMgKSB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggd2FybmluZ3MubGVuZ3RoID4gMCwgYGV4cGVjdGVkIDEgb3IgbW9yZSB3YXJuaW5nczogJHt3YXJuaW5ncy5sZW5ndGh9YCApO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UXVlcnlQYXJhbWV0ZXJzV2FybmluZ0RpYWxvZ09wdGlvbnMsIFNlbGZPcHRpb25zLCBPb3BzRGlhbG9nT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gT29wc0RpYWxvZ09wdGlvbnNcclxuICAgICAgcmljaFRleHRPcHRpb25zOiB7XHJcbiAgICAgICAgZm9udDogbmV3IFBoZXRGb250KCAxNiApXHJcbiAgICAgIH0sXHJcbiAgICAgIHRpdGxlOiBuZXcgVGV4dCggSm9pc3RTdHJpbmdzLnF1ZXJ5UGFyYW1ldGVyc1dhcm5pbmdEaWFsb2cuaW52YWxpZFF1ZXJ5UGFyYW1ldGVyc1N0cmluZ1Byb3BlcnR5LCB7XHJcbiAgICAgICAgZm9udDogbmV3IFBoZXRGb250KCAyOCApXHJcbiAgICAgIH0gKSxcclxuXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVRcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIGFkZCB3YXJuaW5ncyB0byBnZW5lcmljIG1lc3NhZ2VcclxuICAgIGxldCBtZXNzYWdlID0gYCR7Sm9pc3RTdHJpbmdzLnF1ZXJ5UGFyYW1ldGVyc1dhcm5pbmdEaWFsb2cub25lT3JNb3JlUXVlcnlQYXJhbWV0ZXJzU3RyaW5nUHJvcGVydHkudmFsdWV9PGJyPjxicj5gO1xyXG4gICAgd2FybmluZ3MuZm9yRWFjaCggd2FybmluZyA9PiB7XHJcbiAgICAgIG1lc3NhZ2UgKz0gYCR7d2FybmluZy5rZXl9PSR7d2FybmluZy52YWx1ZX08YnI+YDtcclxuICAgIH0gKTtcclxuICAgIG1lc3NhZ2UgKz0gYDxicj4ke0pvaXN0U3RyaW5ncy5xdWVyeVBhcmFtZXRlcnNXYXJuaW5nRGlhbG9nLnRoZVNpbXVsYXRpb25XaWxsU3RhcnRTdHJpbmdQcm9wZXJ0eS52YWx1ZX1gO1xyXG5cclxuICAgIHN1cGVyKCBtZXNzYWdlLCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ1F1ZXJ5UGFyYW1ldGVyc1dhcm5pbmdEaWFsb2cnLCBRdWVyeVBhcmFtZXRlcnNXYXJuaW5nRGlhbG9nICk7XHJcbmV4cG9ydCBkZWZhdWx0IFF1ZXJ5UGFyYW1ldGVyc1dhcm5pbmdEaWFsb2c7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsU0FBUyxNQUE0QixpQ0FBaUM7QUFDN0UsT0FBT0MsVUFBVSxNQUE2QixxQ0FBcUM7QUFDbkYsT0FBT0MsUUFBUSxNQUFNLG1DQUFtQztBQUN4RCxTQUFTQyxJQUFJLFFBQVEsNkJBQTZCO0FBQ2xELE9BQU9DLEtBQUssTUFBTSxZQUFZO0FBQzlCLE9BQU9DLFlBQVksTUFBTSxtQkFBbUI7QUFDNUMsT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjtBQUs5QyxNQUFNQyw0QkFBNEIsU0FBU04sVUFBVSxDQUFDO0VBRXBEO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NPLFdBQVdBO0VBQ2hCO0VBQ0FDLFFBQW1CO0VBQUU7RUFDckJDLGVBQXFELEVBQUc7SUFFeERDLE1BQU0sSUFBSUEsTUFBTSxDQUFFRixRQUFRLENBQUNHLE1BQU0sR0FBRyxDQUFDLEVBQUcsZ0NBQStCSCxRQUFRLENBQUNHLE1BQU8sRUFBRSxDQUFDO0lBRTFGLE1BQU1DLE9BQU8sR0FBR2IsU0FBUyxDQUFzRSxDQUFDLENBQUU7TUFFaEc7TUFDQWMsZUFBZSxFQUFFO1FBQ2ZDLElBQUksRUFBRSxJQUFJYixRQUFRLENBQUUsRUFBRztNQUN6QixDQUFDO01BQ0RjLEtBQUssRUFBRSxJQUFJYixJQUFJLENBQUVFLFlBQVksQ0FBQ1ksNEJBQTRCLENBQUNDLG9DQUFvQyxFQUFFO1FBQy9GSCxJQUFJLEVBQUUsSUFBSWIsUUFBUSxDQUFFLEVBQUc7TUFDekIsQ0FBRSxDQUFDO01BRUhpQixNQUFNLEVBQUViLE1BQU0sQ0FBQ2M7SUFDakIsQ0FBQyxFQUFFVixlQUFnQixDQUFDOztJQUVwQjtJQUNBLElBQUlXLE9BQU8sR0FBSSxHQUFFaEIsWUFBWSxDQUFDWSw0QkFBNEIsQ0FBQ0ssc0NBQXNDLENBQUNDLEtBQU0sVUFBUztJQUNqSGQsUUFBUSxDQUFDZSxPQUFPLENBQUVDLE9BQU8sSUFBSTtNQUMzQkosT0FBTyxJQUFLLEdBQUVJLE9BQU8sQ0FBQ0MsR0FBSSxJQUFHRCxPQUFPLENBQUNGLEtBQU0sTUFBSztJQUNsRCxDQUFFLENBQUM7SUFDSEYsT0FBTyxJQUFLLE9BQU1oQixZQUFZLENBQUNZLDRCQUE0QixDQUFDVSxvQ0FBb0MsQ0FBQ0osS0FBTSxFQUFDO0lBRXhHLEtBQUssQ0FBRUYsT0FBTyxFQUFFUixPQUFRLENBQUM7RUFDM0I7QUFDRjtBQUVBVCxLQUFLLENBQUN3QixRQUFRLENBQUUsOEJBQThCLEVBQUVyQiw0QkFBNkIsQ0FBQztBQUM5RSxlQUFlQSw0QkFBNEIiLCJpZ25vcmVMaXN0IjpbXX0=