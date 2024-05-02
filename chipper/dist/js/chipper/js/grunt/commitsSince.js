// Copyright 2017-2024, University of Colorado Boulder

/**
 * Prints commits since a specified date, for all dependencies of the build target.
 * The output is grouped by repository, and condensed to one line per commit.
 * The date is in ISO 8601 format
 *
 * For example, to see all commits since Oct 1, 2015 at 3:52pm:
 * grunt commits-since --date="2015-10-01 15:52"
 *
 * To count the number of commits, use the power of the shell:
 * grunt commits-since --date="2015-10-01 15:52" | grep -v since | wc -l
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

const execute = require('../../../perennial-alias/js/common/execute');
const getPhetLibs = require('./getPhetLibs');
const grunt = require('grunt');

/**
 * @param {string} repo
 * @param {string} dateString
 * @returns {Promise}
 */
module.exports = async function (repo, dateString) {
  let output = '';
  for (const dependency of getPhetLibs(repo)) {
    output += `${dependency} since ${dateString} ----------------------------------------------\n`;
    output += await execute('git', ['log', `--since="${dateString}"`, '--pretty=tformat:"%h | %ci | %cn | %s"'], `../${dependency}`);
  }
  grunt.log.writeln(output);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImdldFBoZXRMaWJzIiwiZ3J1bnQiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImRhdGVTdHJpbmciLCJvdXRwdXQiLCJkZXBlbmRlbmN5IiwibG9nIiwid3JpdGVsbiJdLCJzb3VyY2VzIjpbImNvbW1pdHNTaW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBQcmludHMgY29tbWl0cyBzaW5jZSBhIHNwZWNpZmllZCBkYXRlLCBmb3IgYWxsIGRlcGVuZGVuY2llcyBvZiB0aGUgYnVpbGQgdGFyZ2V0LlxyXG4gKiBUaGUgb3V0cHV0IGlzIGdyb3VwZWQgYnkgcmVwb3NpdG9yeSwgYW5kIGNvbmRlbnNlZCB0byBvbmUgbGluZSBwZXIgY29tbWl0LlxyXG4gKiBUaGUgZGF0ZSBpcyBpbiBJU08gODYwMSBmb3JtYXRcclxuICpcclxuICogRm9yIGV4YW1wbGUsIHRvIHNlZSBhbGwgY29tbWl0cyBzaW5jZSBPY3QgMSwgMjAxNSBhdCAzOjUycG06XHJcbiAqIGdydW50IGNvbW1pdHMtc2luY2UgLS1kYXRlPVwiMjAxNS0xMC0wMSAxNTo1MlwiXHJcbiAqXHJcbiAqIFRvIGNvdW50IHRoZSBudW1iZXIgb2YgY29tbWl0cywgdXNlIHRoZSBwb3dlciBvZiB0aGUgc2hlbGw6XHJcbiAqIGdydW50IGNvbW1pdHMtc2luY2UgLS1kYXRlPVwiMjAxNS0xMC0wMSAxNTo1MlwiIHwgZ3JlcCAtdiBzaW5jZSB8IHdjIC1sXHJcbiAqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi9leGVjdXRlJyApO1xyXG5jb25zdCBnZXRQaGV0TGlicyA9IHJlcXVpcmUoICcuL2dldFBoZXRMaWJzJyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0ZVN0cmluZ1xyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIHJlcG8sIGRhdGVTdHJpbmcgKSB7XHJcblxyXG4gIGxldCBvdXRwdXQgPSAnJztcclxuICBmb3IgKCBjb25zdCBkZXBlbmRlbmN5IG9mIGdldFBoZXRMaWJzKCByZXBvICkgKSB7XHJcbiAgICBvdXRwdXQgKz0gYCR7ZGVwZW5kZW5jeX0gc2luY2UgJHtkYXRlU3RyaW5nfSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXFxuYDtcclxuICAgIG91dHB1dCArPSBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnbG9nJywgYC0tc2luY2U9XCIke2RhdGVTdHJpbmd9XCJgLCAnLS1wcmV0dHk9dGZvcm1hdDpcIiVoIHwgJWNpIHwgJWNuIHwgJXNcIicgXSwgYC4uLyR7ZGVwZW5kZW5jeX1gICk7XHJcbiAgfVxyXG5cclxuICBncnVudC5sb2cud3JpdGVsbiggb3V0cHV0ICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxNQUFNQSxPQUFPLEdBQUdDLE9BQU8sQ0FBRSw0Q0FBNkMsQ0FBQztBQUN2RSxNQUFNQyxXQUFXLEdBQUdELE9BQU8sQ0FBRSxlQUFnQixDQUFDO0FBQzlDLE1BQU1FLEtBQUssR0FBR0YsT0FBTyxDQUFFLE9BQVEsQ0FBQzs7QUFFaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRyxNQUFNLENBQUNDLE9BQU8sR0FBRyxnQkFBZ0JDLElBQUksRUFBRUMsVUFBVSxFQUFHO0VBRWxELElBQUlDLE1BQU0sR0FBRyxFQUFFO0VBQ2YsS0FBTSxNQUFNQyxVQUFVLElBQUlQLFdBQVcsQ0FBRUksSUFBSyxDQUFDLEVBQUc7SUFDOUNFLE1BQU0sSUFBSyxHQUFFQyxVQUFXLFVBQVNGLFVBQVcsbURBQWtEO0lBQzlGQyxNQUFNLElBQUksTUFBTVIsT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFFLEtBQUssRUFBRyxZQUFXTyxVQUFXLEdBQUUsRUFBRSx3Q0FBd0MsQ0FBRSxFQUFHLE1BQUtFLFVBQVcsRUFBRSxDQUFDO0VBQ3RJO0VBRUFOLEtBQUssQ0FBQ08sR0FBRyxDQUFDQyxPQUFPLENBQUVILE1BQU8sQ0FBQztBQUM3QixDQUFDIiwiaWdub3JlTGlzdCI6W119