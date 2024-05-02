// Copyright 2018, University of Colorado Boulder

/**
 * Returns phet-io metadata from the production website
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const _ = require('lodash');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
const axios = require('axios');

/**
 * Returns metadata from the production website.
 * @public
 *
 * @param {Object} [options]
 * @returns {Promise.<Object[]>} - Resolves with metadata objects in an array
 */
module.exports = async function (options) {
  options = _.assignIn({
    active: null,
    // {boolean|null} - If set, will only include active branches
    latest: null // {boolean|null} - If set, will only include latest branches
  }, options);
  let metadataURL = 'https://phet.colorado.edu/services/metadata/phetio?';
  if (options.active !== null) {
    metadataURL += `&active=${options.active}`;
  }
  if (options.latest !== null) {
    metadataURL += `&latest=${options.latest}`;
  }
  winston.info(`getting phet-io metadata request with ${metadataURL}`);
  let response;
  try {
    response = await axios(metadataURL);
  } catch (e) {
    throw new Error(`metadata request failed with ${e}`);
  }
  if (response.status !== 200) {
    throw new Error(`metadata request failed with status ${response.status} ${response}`);
  } else {
    return response.data;
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsIndpbnN0b24iLCJheGlvcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJvcHRpb25zIiwiYXNzaWduSW4iLCJhY3RpdmUiLCJsYXRlc3QiLCJtZXRhZGF0YVVSTCIsImluZm8iLCJyZXNwb25zZSIsImUiLCJFcnJvciIsInN0YXR1cyIsImRhdGEiXSwic291cmNlcyI6WyJzaW1QaGV0aW9NZXRhZGF0YS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmV0dXJucyBwaGV0LWlvIG1ldGFkYXRhIGZyb20gdGhlIHByb2R1Y3Rpb24gd2Vic2l0ZVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuY29uc3QgYXhpb3MgPSByZXF1aXJlKCAnYXhpb3MnICk7XHJcblxyXG4vKipcclxuICogUmV0dXJucyBtZXRhZGF0YSBmcm9tIHRoZSBwcm9kdWN0aW9uIHdlYnNpdGUuXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48T2JqZWN0W10+fSAtIFJlc29sdmVzIHdpdGggbWV0YWRhdGEgb2JqZWN0cyBpbiBhbiBhcnJheVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggb3B0aW9ucyApIHtcclxuICBvcHRpb25zID0gXy5hc3NpZ25Jbigge1xyXG4gICAgYWN0aXZlOiBudWxsLCAvLyB7Ym9vbGVhbnxudWxsfSAtIElmIHNldCwgd2lsbCBvbmx5IGluY2x1ZGUgYWN0aXZlIGJyYW5jaGVzXHJcbiAgICBsYXRlc3Q6IG51bGwgLy8ge2Jvb2xlYW58bnVsbH0gLSBJZiBzZXQsIHdpbGwgb25seSBpbmNsdWRlIGxhdGVzdCBicmFuY2hlc1xyXG4gIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgbGV0IG1ldGFkYXRhVVJMID0gJ2h0dHBzOi8vcGhldC5jb2xvcmFkby5lZHUvc2VydmljZXMvbWV0YWRhdGEvcGhldGlvPyc7XHJcbiAgaWYgKCBvcHRpb25zLmFjdGl2ZSAhPT0gbnVsbCApIHtcclxuICAgIG1ldGFkYXRhVVJMICs9IGAmYWN0aXZlPSR7b3B0aW9ucy5hY3RpdmV9YDtcclxuICB9XHJcbiAgaWYgKCBvcHRpb25zLmxhdGVzdCAhPT0gbnVsbCApIHtcclxuICAgIG1ldGFkYXRhVVJMICs9IGAmbGF0ZXN0PSR7b3B0aW9ucy5sYXRlc3R9YDtcclxuICB9XHJcblxyXG4gIHdpbnN0b24uaW5mbyggYGdldHRpbmcgcGhldC1pbyBtZXRhZGF0YSByZXF1ZXN0IHdpdGggJHttZXRhZGF0YVVSTH1gICk7XHJcbiAgbGV0IHJlc3BvbnNlO1xyXG4gIHRyeSB7XHJcbiAgICByZXNwb25zZSA9IGF3YWl0IGF4aW9zKCBtZXRhZGF0YVVSTCApO1xyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggYG1ldGFkYXRhIHJlcXVlc3QgZmFpbGVkIHdpdGggJHtlfWAgKTtcclxuICB9XHJcblxyXG4gIGlmICggcmVzcG9uc2Uuc3RhdHVzICE9PSAyMDAgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBtZXRhZGF0YSByZXF1ZXN0IGZhaWxlZCB3aXRoIHN0YXR1cyAke3Jlc3BvbnNlLnN0YXR1c30gJHtyZXNwb25zZX1gICk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcbiAgfVxyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxDQUFDLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDN0IsTUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsU0FBVSxDQUFDO0FBQ3BDLE1BQU1FLEtBQUssR0FBR0YsT0FBTyxDQUFFLE9BQVEsQ0FBQzs7QUFFaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUcsTUFBTSxDQUFDQyxPQUFPLEdBQUcsZ0JBQWdCQyxPQUFPLEVBQUc7RUFDekNBLE9BQU8sR0FBR04sQ0FBQyxDQUFDTyxRQUFRLENBQUU7SUFDcEJDLE1BQU0sRUFBRSxJQUFJO0lBQUU7SUFDZEMsTUFBTSxFQUFFLElBQUksQ0FBQztFQUNmLENBQUMsRUFBRUgsT0FBUSxDQUFDO0VBRVosSUFBSUksV0FBVyxHQUFHLHFEQUFxRDtFQUN2RSxJQUFLSixPQUFPLENBQUNFLE1BQU0sS0FBSyxJQUFJLEVBQUc7SUFDN0JFLFdBQVcsSUFBSyxXQUFVSixPQUFPLENBQUNFLE1BQU8sRUFBQztFQUM1QztFQUNBLElBQUtGLE9BQU8sQ0FBQ0csTUFBTSxLQUFLLElBQUksRUFBRztJQUM3QkMsV0FBVyxJQUFLLFdBQVVKLE9BQU8sQ0FBQ0csTUFBTyxFQUFDO0VBQzVDO0VBRUFQLE9BQU8sQ0FBQ1MsSUFBSSxDQUFHLHlDQUF3Q0QsV0FBWSxFQUFFLENBQUM7RUFDdEUsSUFBSUUsUUFBUTtFQUNaLElBQUk7SUFDRkEsUUFBUSxHQUFHLE1BQU1ULEtBQUssQ0FBRU8sV0FBWSxDQUFDO0VBQ3ZDLENBQUMsQ0FDRCxPQUFPRyxDQUFDLEVBQUc7SUFDVCxNQUFNLElBQUlDLEtBQUssQ0FBRyxnQ0FBK0JELENBQUUsRUFBRSxDQUFDO0VBQ3hEO0VBRUEsSUFBS0QsUUFBUSxDQUFDRyxNQUFNLEtBQUssR0FBRyxFQUFHO0lBQzdCLE1BQU0sSUFBSUQsS0FBSyxDQUFHLHVDQUFzQ0YsUUFBUSxDQUFDRyxNQUFPLElBQUdILFFBQVMsRUFBRSxDQUFDO0VBQ3pGLENBQUMsTUFDSTtJQUNILE9BQU9BLFFBQVEsQ0FBQ0ksSUFBSTtFQUN0QjtBQUNGLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=