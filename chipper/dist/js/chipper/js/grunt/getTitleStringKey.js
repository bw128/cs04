// Copyright 2017-2024, University of Colorado Boulder

/**
 * Returns the string key for the title of a runnable.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const grunt = require('grunt');

/**
 * Returns the string key for the title of a runnable.
 * @public
 *
 * @param {string} repo
 */
module.exports = function getPhetLibs(repo) {
  const packageObject = grunt.file.readJSON(`../${repo}/package.json`);
  return `${packageObject.phet.requirejsNamespace}/${repo}.title`;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJncnVudCIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwiZ2V0UGhldExpYnMiLCJyZXBvIiwicGFja2FnZU9iamVjdCIsImZpbGUiLCJyZWFkSlNPTiIsInBoZXQiLCJyZXF1aXJlanNOYW1lc3BhY2UiXSwic291cmNlcyI6WyJnZXRUaXRsZVN0cmluZ0tleS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBzdHJpbmcga2V5IGZvciB0aGUgdGl0bGUgb2YgYSBydW5uYWJsZS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBzdHJpbmcga2V5IGZvciB0aGUgdGl0bGUgb2YgYSBydW5uYWJsZS5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRQaGV0TGlicyggcmVwbyApIHtcclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG5cclxuICByZXR1cm4gYCR7cGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZX0vJHtyZXBvfS50aXRsZWA7XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE1BQU1BLEtBQUssR0FBR0MsT0FBTyxDQUFFLE9BQVEsQ0FBQzs7QUFFaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFNBQVNDLFdBQVdBLENBQUVDLElBQUksRUFBRztFQUM1QyxNQUFNQyxhQUFhLEdBQUdOLEtBQUssQ0FBQ08sSUFBSSxDQUFDQyxRQUFRLENBQUcsTUFBS0gsSUFBSyxlQUFlLENBQUM7RUFFdEUsT0FBUSxHQUFFQyxhQUFhLENBQUNHLElBQUksQ0FBQ0Msa0JBQW1CLElBQUdMLElBQUssUUFBTztBQUNqRSxDQUFDIiwiaWdub3JlTGlzdCI6W119