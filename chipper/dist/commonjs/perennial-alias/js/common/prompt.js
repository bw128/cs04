"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * Prompts the user to confirm a message (or enter a specific string or message).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var readline = require('readline');
var winston = require('../../../../../../perennial-alias/node_modules/winston');
var MAGENTA = "\x1B[35m";
var RESET = "\x1B[0m";

/**
 * Prompts the user to confirm a message (or enter a specific string or message).
 * @public
 *
 * @param {string} prompt - The string to be shown to the user
 * @returns {Promise.<string>} - Resolves with the string entered by the user.
 */
module.exports = function (prompt) {
  return new Promise(function (resolve, reject) {
    winston.debug("prompting the user with ".concat(prompt));
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(MAGENTA + prompt + RESET, function (answer) {
      rl.close();
      winston.debug("received answer: ".concat(answer));
      resolve(answer);
    });
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZWFkbGluZSIsInJlcXVpcmUiLCJ3aW5zdG9uIiwiTUFHRU5UQSIsIlJFU0VUIiwibW9kdWxlIiwiZXhwb3J0cyIsInByb21wdCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZGVidWciLCJjb25jYXQiLCJybCIsImNyZWF0ZUludGVyZmFjZSIsImlucHV0IiwicHJvY2VzcyIsInN0ZGluIiwib3V0cHV0Iiwic3Rkb3V0IiwicXVlc3Rpb24iLCJhbnN3ZXIiLCJjbG9zZSJdLCJzb3VyY2VzIjpbInByb21wdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUHJvbXB0cyB0aGUgdXNlciB0byBjb25maXJtIGEgbWVzc2FnZSAob3IgZW50ZXIgYSBzcGVjaWZpYyBzdHJpbmcgb3IgbWVzc2FnZSkuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCByZWFkbGluZSA9IHJlcXVpcmUoICdyZWFkbGluZScgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuY29uc3QgTUFHRU5UQSA9ICdcXHUwMDFCWzM1bSc7XHJcbmNvbnN0IFJFU0VUID0gJ1xcdTAwMUJbMG0nO1xyXG5cclxuLyoqXHJcbiAqIFByb21wdHMgdGhlIHVzZXIgdG8gY29uZmlybSBhIG1lc3NhZ2UgKG9yIGVudGVyIGEgc3BlY2lmaWMgc3RyaW5nIG9yIG1lc3NhZ2UpLlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9tcHQgLSBUaGUgc3RyaW5nIHRvIGJlIHNob3duIHRvIHRoZSB1c2VyXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIFJlc29sdmVzIHdpdGggdGhlIHN0cmluZyBlbnRlcmVkIGJ5IHRoZSB1c2VyLlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcHJvbXB0ICkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XHJcbiAgICB3aW5zdG9uLmRlYnVnKCBgcHJvbXB0aW5nIHRoZSB1c2VyIHdpdGggJHtwcm9tcHR9YCApO1xyXG5cclxuICAgIGNvbnN0IHJsID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKCB7IGlucHV0OiBwcm9jZXNzLnN0ZGluLCBvdXRwdXQ6IHByb2Nlc3Muc3Rkb3V0IH0gKTtcclxuXHJcbiAgICBybC5xdWVzdGlvbiggTUFHRU5UQSArIHByb21wdCArIFJFU0VULCBhbnN3ZXIgPT4ge1xyXG4gICAgICBybC5jbG9zZSgpO1xyXG5cclxuICAgICAgd2luc3Rvbi5kZWJ1ZyggYHJlY2VpdmVkIGFuc3dlcjogJHthbnN3ZXJ9YCApO1xyXG5cclxuICAgICAgcmVzb2x2ZSggYW5zd2VyICk7XHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLFFBQVEsR0FBR0MsT0FBTyxDQUFFLFVBQVcsQ0FBQztBQUN0QyxJQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7QUFFcEMsSUFBTUUsT0FBTyxHQUFHLFVBQVk7QUFDNUIsSUFBTUMsS0FBSyxHQUFHLFNBQVc7O0FBRXpCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLE1BQU0sRUFBRztFQUNsQyxPQUFPLElBQUlDLE9BQU8sQ0FBRSxVQUFFQyxPQUFPLEVBQUVDLE1BQU0sRUFBTTtJQUN6Q1IsT0FBTyxDQUFDUyxLQUFLLDRCQUFBQyxNQUFBLENBQTZCTCxNQUFNLENBQUcsQ0FBQztJQUVwRCxJQUFNTSxFQUFFLEdBQUdiLFFBQVEsQ0FBQ2MsZUFBZSxDQUFFO01BQUVDLEtBQUssRUFBRUMsT0FBTyxDQUFDQyxLQUFLO01BQUVDLE1BQU0sRUFBRUYsT0FBTyxDQUFDRztJQUFPLENBQUUsQ0FBQztJQUV2Rk4sRUFBRSxDQUFDTyxRQUFRLENBQUVqQixPQUFPLEdBQUdJLE1BQU0sR0FBR0gsS0FBSyxFQUFFLFVBQUFpQixNQUFNLEVBQUk7TUFDL0NSLEVBQUUsQ0FBQ1MsS0FBSyxDQUFDLENBQUM7TUFFVnBCLE9BQU8sQ0FBQ1MsS0FBSyxxQkFBQUMsTUFBQSxDQUFzQlMsTUFBTSxDQUFHLENBQUM7TUFFN0NaLE9BQU8sQ0FBRVksTUFBTyxDQUFDO0lBQ25CLENBQUUsQ0FBQztFQUNMLENBQUUsQ0FBQztBQUNMLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=