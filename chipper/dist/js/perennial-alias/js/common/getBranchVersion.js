// Copyright 2023, University of Colorado Boulder

/**
 * Returns the version of the repo's package.json on a given branch
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const SimVersion = require('./SimVersion');
const getFileAtBranch = require('./getFileAtBranch');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Returns the version of the repo's package.json on a given branch
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The branch name
 * @returns {Promise.<SimVersion>}
 */
module.exports = async function (repo, branch) {
  winston.debug(`Reading version from package.json for ${repo}`);
  return SimVersion.parse(JSON.parse(await getFileAtBranch(repo, branch, 'package.json')).version);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaW1WZXJzaW9uIiwicmVxdWlyZSIsImdldEZpbGVBdEJyYW5jaCIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImJyYW5jaCIsImRlYnVnIiwicGFyc2UiLCJKU09OIiwidmVyc2lvbiJdLCJzb3VyY2VzIjpbImdldEJyYW5jaFZlcnNpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHZlcnNpb24gb2YgdGhlIHJlcG8ncyBwYWNrYWdlLmpzb24gb24gYSBnaXZlbiBicmFuY2hcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IFNpbVZlcnNpb24gPSByZXF1aXJlKCAnLi9TaW1WZXJzaW9uJyApO1xyXG5jb25zdCBnZXRGaWxlQXRCcmFuY2ggPSByZXF1aXJlKCAnLi9nZXRGaWxlQXRCcmFuY2gnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSB2ZXJzaW9uIG9mIHRoZSByZXBvJ3MgcGFja2FnZS5qc29uIG9uIGEgZ2l2ZW4gYnJhbmNoXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2ggLSBUaGUgYnJhbmNoIG5hbWVcclxuICogQHJldHVybnMge1Byb21pc2UuPFNpbVZlcnNpb24+fVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbywgYnJhbmNoICkge1xyXG4gIHdpbnN0b24uZGVidWcoIGBSZWFkaW5nIHZlcnNpb24gZnJvbSBwYWNrYWdlLmpzb24gZm9yICR7cmVwb31gICk7XHJcblxyXG4gIHJldHVybiBTaW1WZXJzaW9uLnBhcnNlKCBKU09OLnBhcnNlKCBhd2FpdCBnZXRGaWxlQXRCcmFuY2goIHJlcG8sIGJyYW5jaCwgJ3BhY2thZ2UuanNvbicgKSApLnZlcnNpb24gKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsVUFBVSxHQUFHQyxPQUFPLENBQUUsY0FBZSxDQUFDO0FBQzVDLE1BQU1DLGVBQWUsR0FBR0QsT0FBTyxDQUFFLG1CQUFvQixDQUFDO0FBQ3RELE1BQU1FLE9BQU8sR0FBR0YsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRyxNQUFNLENBQUNDLE9BQU8sR0FBRyxnQkFBZ0JDLElBQUksRUFBRUMsTUFBTSxFQUFHO0VBQzlDSixPQUFPLENBQUNLLEtBQUssQ0FBRyx5Q0FBd0NGLElBQUssRUFBRSxDQUFDO0VBRWhFLE9BQU9OLFVBQVUsQ0FBQ1MsS0FBSyxDQUFFQyxJQUFJLENBQUNELEtBQUssQ0FBRSxNQUFNUCxlQUFlLENBQUVJLElBQUksRUFBRUMsTUFBTSxFQUFFLGNBQWUsQ0FBRSxDQUFDLENBQUNJLE9BQVEsQ0FBQztBQUN4RyxDQUFDIiwiaWdub3JlTGlzdCI6W119