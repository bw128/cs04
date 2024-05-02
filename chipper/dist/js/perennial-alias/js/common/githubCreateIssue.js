// Copyright 2019, University of Colorado Boulder

/**
 * Creates an issue in a phetsims github repository
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const buildLocal = require('./buildLocal');
const Octokit = require('@octokit/rest'); // eslint-disable-line require-statement-match
const _ = require('lodash');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Creates an issue in a phetsims github repository
 * @public
 *
 * The options include the body/assignees/labels and milestone number, e.g.:
 *
 * githubCreateIssue( 'bumper', 'test issue 2', {
 *   body: 'issue body',
 *   assignees: [ 'jonathanolson' ],
 *   labels: [ 'type:automated-testing' ]
 * } )
 *
 * created https://github.com/phetsims/bumper/issues/3
 *
 * @param {string} repo - The repository name
 * @param {string} title - The title of the issue
 * @param {Object} [options] - Other options to pass in. `body` is recommended. See
 *                             https://octokit.github.io/rest.js/#octokit-routes-issues-create
 * @returns {Promise.<Array.<string>>} - Resolves with checkedOutRepos
 */
module.exports = async function (repo, title, options) {
  winston.info(`Creating issue for ${repo}`);
  const octokit = new Octokit({
    auth: buildLocal.phetDevGitHubAccessToken
  });
  await octokit.issues.create(_.extend({
    owner: 'phetsims',
    repo: repo,
    title: title
  }, options));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJidWlsZExvY2FsIiwicmVxdWlyZSIsIk9jdG9raXQiLCJfIiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwidGl0bGUiLCJvcHRpb25zIiwiaW5mbyIsIm9jdG9raXQiLCJhdXRoIiwicGhldERldkdpdEh1YkFjY2Vzc1Rva2VuIiwiaXNzdWVzIiwiY3JlYXRlIiwiZXh0ZW5kIiwib3duZXIiXSwic291cmNlcyI6WyJnaXRodWJDcmVhdGVJc3N1ZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbiBpc3N1ZSBpbiBhIHBoZXRzaW1zIGdpdGh1YiByZXBvc2l0b3J5XHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBidWlsZExvY2FsID0gcmVxdWlyZSggJy4vYnVpbGRMb2NhbCcgKTtcclxuY29uc3QgT2N0b2tpdCA9IHJlcXVpcmUoICdAb2N0b2tpdC9yZXN0JyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtc3RhdGVtZW50LW1hdGNoXHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhbiBpc3N1ZSBpbiBhIHBoZXRzaW1zIGdpdGh1YiByZXBvc2l0b3J5XHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogVGhlIG9wdGlvbnMgaW5jbHVkZSB0aGUgYm9keS9hc3NpZ25lZXMvbGFiZWxzIGFuZCBtaWxlc3RvbmUgbnVtYmVyLCBlLmcuOlxyXG4gKlxyXG4gKiBnaXRodWJDcmVhdGVJc3N1ZSggJ2J1bXBlcicsICd0ZXN0IGlzc3VlIDInLCB7XHJcbiAqICAgYm9keTogJ2lzc3VlIGJvZHknLFxyXG4gKiAgIGFzc2lnbmVlczogWyAnam9uYXRoYW5vbHNvbicgXSxcclxuICogICBsYWJlbHM6IFsgJ3R5cGU6YXV0b21hdGVkLXRlc3RpbmcnIF1cclxuICogfSApXHJcbiAqXHJcbiAqIGNyZWF0ZWQgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2J1bXBlci9pc3N1ZXMvM1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IHRpdGxlIC0gVGhlIHRpdGxlIG9mIHRoZSBpc3N1ZVxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3RoZXIgb3B0aW9ucyB0byBwYXNzIGluLiBgYm9keWAgaXMgcmVjb21tZW5kZWQuIFNlZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaHR0cHM6Ly9vY3Rva2l0LmdpdGh1Yi5pby9yZXN0LmpzLyNvY3Rva2l0LXJvdXRlcy1pc3N1ZXMtY3JlYXRlXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxBcnJheS48c3RyaW5nPj59IC0gUmVzb2x2ZXMgd2l0aCBjaGVja2VkT3V0UmVwb3NcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIHJlcG8sIHRpdGxlLCBvcHRpb25zICkge1xyXG4gIHdpbnN0b24uaW5mbyggYENyZWF0aW5nIGlzc3VlIGZvciAke3JlcG99YCApO1xyXG5cclxuICBjb25zdCBvY3Rva2l0ID0gbmV3IE9jdG9raXQoIHtcclxuICAgIGF1dGg6IGJ1aWxkTG9jYWwucGhldERldkdpdEh1YkFjY2Vzc1Rva2VuXHJcbiAgfSApO1xyXG4gIGF3YWl0IG9jdG9raXQuaXNzdWVzLmNyZWF0ZSggXy5leHRlbmQoIHtcclxuICAgIG93bmVyOiAncGhldHNpbXMnLFxyXG4gICAgcmVwbzogcmVwbyxcclxuICAgIHRpdGxlOiB0aXRsZVxyXG4gIH0sIG9wdGlvbnMgKSApO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxVQUFVLEdBQUdDLE9BQU8sQ0FBRSxjQUFlLENBQUM7QUFDNUMsTUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUUsZUFBZ0IsQ0FBQyxDQUFDLENBQUM7QUFDNUMsTUFBTUUsQ0FBQyxHQUFHRixPQUFPLENBQUUsUUFBUyxDQUFDO0FBQzdCLE1BQU1HLE9BQU8sR0FBR0gsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBSSxNQUFNLENBQUNDLE9BQU8sR0FBRyxnQkFBZ0JDLElBQUksRUFBRUMsS0FBSyxFQUFFQyxPQUFPLEVBQUc7RUFDdERMLE9BQU8sQ0FBQ00sSUFBSSxDQUFHLHNCQUFxQkgsSUFBSyxFQUFFLENBQUM7RUFFNUMsTUFBTUksT0FBTyxHQUFHLElBQUlULE9BQU8sQ0FBRTtJQUMzQlUsSUFBSSxFQUFFWixVQUFVLENBQUNhO0VBQ25CLENBQUUsQ0FBQztFQUNILE1BQU1GLE9BQU8sQ0FBQ0csTUFBTSxDQUFDQyxNQUFNLENBQUVaLENBQUMsQ0FBQ2EsTUFBTSxDQUFFO0lBQ3JDQyxLQUFLLEVBQUUsVUFBVTtJQUNqQlYsSUFBSSxFQUFFQSxJQUFJO0lBQ1ZDLEtBQUssRUFBRUE7RUFDVCxDQUFDLEVBQUVDLE9BQVEsQ0FBRSxDQUFDO0FBQ2hCLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=