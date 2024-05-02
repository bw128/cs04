"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * The dependencies.json of a repository
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var loadJSON = require('./loadJSON');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes git checkout
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise} - Resolves to the dependencies.json content
 */
module.exports = function getDependencies(repo) {
  winston.info("getting dependencies.json for ".concat(repo));
  return loadJSON("../".concat(repo, "/dependencies.json"));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJsb2FkSlNPTiIsInJlcXVpcmUiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsImdldERlcGVuZGVuY2llcyIsInJlcG8iLCJpbmZvIiwiY29uY2F0Il0sInNvdXJjZXMiOlsiZ2V0RGVwZW5kZW5jaWVzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGUgZGVwZW5kZW5jaWVzLmpzb24gb2YgYSByZXBvc2l0b3J5XHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBsb2FkSlNPTiA9IHJlcXVpcmUoICcuL2xvYWRKU09OJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcblxyXG4vKipcclxuICogRXhlY3V0ZXMgZ2l0IGNoZWNrb3V0XHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSAtIFJlc29sdmVzIHRvIHRoZSBkZXBlbmRlbmNpZXMuanNvbiBjb250ZW50XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldERlcGVuZGVuY2llcyggcmVwbyApIHtcclxuICB3aW5zdG9uLmluZm8oIGBnZXR0aW5nIGRlcGVuZGVuY2llcy5qc29uIGZvciAke3JlcG99YCApO1xyXG5cclxuICByZXR1cm4gbG9hZEpTT04oIGAuLi8ke3JlcG99L2RlcGVuZGVuY2llcy5qc29uYCApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLFFBQVEsR0FBR0MsT0FBTyxDQUFFLFlBQWEsQ0FBQztBQUN4QyxJQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFNBQVNDLGVBQWVBLENBQUVDLElBQUksRUFBRztFQUNoREosT0FBTyxDQUFDSyxJQUFJLGtDQUFBQyxNQUFBLENBQW1DRixJQUFJLENBQUcsQ0FBQztFQUV2RCxPQUFPTixRQUFRLE9BQUFRLE1BQUEsQ0FBUUYsSUFBSSx1QkFBcUIsQ0FBQztBQUNuRCxDQUFDIiwiaWdub3JlTGlzdCI6W119