// Copyright 2013-2022, University of Colorado Boulder

/**
 * Main entry point for the 'ohms law' sim.
 * @author Vasily Shakhov (Mlearner)
 * @author Anton Ulyanov (Mlearner)
 */

import Sim from '../../joist/js/Sim.js';
import simLauncher from '../../joist/js/simLauncher.js';
import Tandem from '../../tandem/js/Tandem.js';
import OhmsLawScreen from './ohms-law/OhmsLawScreen.js';
import OhmsLawStrings from './OhmsLawStrings.js';
const ohmsLawTitleStringProperty = OhmsLawStrings['ohms-law'].titleStringProperty;

// constants
const tandem = Tandem.ROOT;
const simOptions = {
  credits: {
    leadDesign: 'Michael Dubson',
    softwareDevelopment: 'John Blanco, Michael Dubson, Jesse Greenberg, Michael Kauzmann, Martin Veillette',
    team: 'Mindy Gratny, Emily B. Moore, Ariel Paul, Kathy Perkins, Taliesin Smith, Brianna Tomlinson',
    qualityAssurance: 'Steele Dalton, Alex Dornan, Bryce Griebenow, Ethan Johnson, Elise Morgan, Liam Mulhall, Oliver Orejola, Benjamin Roberts, Ethan Ward, Kathryn Woessner, Bryan Yoelin',
    soundDesign: 'Ashton Morris, Mike Winters',
    thanks: 'Thanks to Mobile Learner Labs for working with the PhET development team to convert this ' + 'simulation to HTML5.'
  }
};
simLauncher.launch(() => {
  // Create and start the sim
  const sim = new Sim(ohmsLawTitleStringProperty, [new OhmsLawScreen(tandem.createTandem('ohmsLawScreen'))], simOptions);
  sim.start();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaW0iLCJzaW1MYXVuY2hlciIsIlRhbmRlbSIsIk9obXNMYXdTY3JlZW4iLCJPaG1zTGF3U3RyaW5ncyIsIm9obXNMYXdUaXRsZVN0cmluZ1Byb3BlcnR5IiwidGl0bGVTdHJpbmdQcm9wZXJ0eSIsInRhbmRlbSIsIlJPT1QiLCJzaW1PcHRpb25zIiwiY3JlZGl0cyIsImxlYWREZXNpZ24iLCJzb2Z0d2FyZURldmVsb3BtZW50IiwidGVhbSIsInF1YWxpdHlBc3N1cmFuY2UiLCJzb3VuZERlc2lnbiIsInRoYW5rcyIsImxhdW5jaCIsInNpbSIsImNyZWF0ZVRhbmRlbSIsInN0YXJ0Il0sInNvdXJjZXMiOlsib2htcy1sYXctbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBNYWluIGVudHJ5IHBvaW50IGZvciB0aGUgJ29obXMgbGF3JyBzaW0uXHJcbiAqIEBhdXRob3IgVmFzaWx5IFNoYWtob3YgKE1sZWFybmVyKVxyXG4gKiBAYXV0aG9yIEFudG9uIFVseWFub3YgKE1sZWFybmVyKVxyXG4gKi9cclxuXHJcbmltcG9ydCBTaW0gZnJvbSAnLi4vLi4vam9pc3QvanMvU2ltLmpzJztcclxuaW1wb3J0IHNpbUxhdW5jaGVyIGZyb20gJy4uLy4uL2pvaXN0L2pzL3NpbUxhdW5jaGVyLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IE9obXNMYXdTY3JlZW4gZnJvbSAnLi9vaG1zLWxhdy9PaG1zTGF3U2NyZWVuLmpzJztcclxuaW1wb3J0IE9obXNMYXdTdHJpbmdzIGZyb20gJy4vT2htc0xhd1N0cmluZ3MuanMnO1xyXG5cclxuY29uc3Qgb2htc0xhd1RpdGxlU3RyaW5nUHJvcGVydHkgPSBPaG1zTGF3U3RyaW5nc1sgJ29obXMtbGF3JyBdLnRpdGxlU3RyaW5nUHJvcGVydHk7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgdGFuZGVtID0gVGFuZGVtLlJPT1Q7XHJcblxyXG5jb25zdCBzaW1PcHRpb25zID0ge1xyXG4gIGNyZWRpdHM6IHtcclxuICAgIGxlYWREZXNpZ246ICdNaWNoYWVsIER1YnNvbicsXHJcbiAgICBzb2Z0d2FyZURldmVsb3BtZW50OiAnSm9obiBCbGFuY28sIE1pY2hhZWwgRHVic29uLCBKZXNzZSBHcmVlbmJlcmcsIE1pY2hhZWwgS2F1em1hbm4sIE1hcnRpbiBWZWlsbGV0dGUnLFxyXG4gICAgdGVhbTogJ01pbmR5IEdyYXRueSwgRW1pbHkgQi4gTW9vcmUsIEFyaWVsIFBhdWwsIEthdGh5IFBlcmtpbnMsIFRhbGllc2luIFNtaXRoLCBCcmlhbm5hIFRvbWxpbnNvbicsXHJcbiAgICBxdWFsaXR5QXNzdXJhbmNlOiAnU3RlZWxlIERhbHRvbiwgQWxleCBEb3JuYW4sIEJyeWNlIEdyaWViZW5vdywgRXRoYW4gSm9obnNvbiwgRWxpc2UgTW9yZ2FuLCBMaWFtIE11bGhhbGwsIE9saXZlciBPcmVqb2xhLCBCZW5qYW1pbiBSb2JlcnRzLCBFdGhhbiBXYXJkLCBLYXRocnluIFdvZXNzbmVyLCBCcnlhbiBZb2VsaW4nLFxyXG4gICAgc291bmREZXNpZ246ICdBc2h0b24gTW9ycmlzLCBNaWtlIFdpbnRlcnMnLFxyXG4gICAgdGhhbmtzOiAnVGhhbmtzIHRvIE1vYmlsZSBMZWFybmVyIExhYnMgZm9yIHdvcmtpbmcgd2l0aCB0aGUgUGhFVCBkZXZlbG9wbWVudCB0ZWFtIHRvIGNvbnZlcnQgdGhpcyAnICtcclxuICAgICAgICAgICAgJ3NpbXVsYXRpb24gdG8gSFRNTDUuJ1xyXG4gIH1cclxufTtcclxuXHJcbnNpbUxhdW5jaGVyLmxhdW5jaCggKCkgPT4ge1xyXG5cclxuICAvLyBDcmVhdGUgYW5kIHN0YXJ0IHRoZSBzaW1cclxuICBjb25zdCBzaW0gPSBuZXcgU2ltKCBvaG1zTGF3VGl0bGVTdHJpbmdQcm9wZXJ0eSwgWyBuZXcgT2htc0xhd1NjcmVlbiggdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ29obXNMYXdTY3JlZW4nICkgKSBdLCBzaW1PcHRpb25zICk7XHJcbiAgc2ltLnN0YXJ0KCk7XHJcbn0gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsR0FBRyxNQUFNLHVCQUF1QjtBQUN2QyxPQUFPQyxXQUFXLE1BQU0sK0JBQStCO0FBQ3ZELE9BQU9DLE1BQU0sTUFBTSwyQkFBMkI7QUFDOUMsT0FBT0MsYUFBYSxNQUFNLDZCQUE2QjtBQUN2RCxPQUFPQyxjQUFjLE1BQU0scUJBQXFCO0FBRWhELE1BQU1DLDBCQUEwQixHQUFHRCxjQUFjLENBQUUsVUFBVSxDQUFFLENBQUNFLG1CQUFtQjs7QUFFbkY7QUFDQSxNQUFNQyxNQUFNLEdBQUdMLE1BQU0sQ0FBQ00sSUFBSTtBQUUxQixNQUFNQyxVQUFVLEdBQUc7RUFDakJDLE9BQU8sRUFBRTtJQUNQQyxVQUFVLEVBQUUsZ0JBQWdCO0lBQzVCQyxtQkFBbUIsRUFBRSxrRkFBa0Y7SUFDdkdDLElBQUksRUFBRSw0RkFBNEY7SUFDbEdDLGdCQUFnQixFQUFFLHNLQUFzSztJQUN4TEMsV0FBVyxFQUFFLDZCQUE2QjtJQUMxQ0MsTUFBTSxFQUFFLDJGQUEyRixHQUMzRjtFQUNWO0FBQ0YsQ0FBQztBQUVEZixXQUFXLENBQUNnQixNQUFNLENBQUUsTUFBTTtFQUV4QjtFQUNBLE1BQU1DLEdBQUcsR0FBRyxJQUFJbEIsR0FBRyxDQUFFSywwQkFBMEIsRUFBRSxDQUFFLElBQUlGLGFBQWEsQ0FBRUksTUFBTSxDQUFDWSxZQUFZLENBQUUsZUFBZ0IsQ0FBRSxDQUFDLENBQUUsRUFBRVYsVUFBVyxDQUFDO0VBQzlIUyxHQUFHLENBQUNFLEtBQUssQ0FBQyxDQUFDO0FBQ2IsQ0FBRSxDQUFDIiwiaWdub3JlTGlzdCI6W119