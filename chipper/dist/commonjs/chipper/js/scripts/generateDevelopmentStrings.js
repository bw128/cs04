"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2022-2023, University of Colorado Boulder

/**
 * This script makes a JSON file that combines translations for all locales in a repo. Each locale object has every
 * string key/translated-value pair we have for that locale. This is used when running the unbuilt mode simulation with
 * locales=*
 *
 * @author Liam Mulhall (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

// imports
var fs = require('fs');
var path = require('path');

/**
 * @param {string} repo - repo to generate strings for
 */
module.exports = function (repo) {
  var start = Date.now();
  var rootPath = path.join(__dirname, '..', '..', '..');

  // OS-independent path to babel repo.
  var babelPath = path.join(rootPath, 'babel');

  // Create a file name for the conglomerate string file.
  var conglomerateStringFileName = "".concat(repo, "_all.json");

  // Create an empty object for the conglomerate string file that we will add to later.
  var conglomerateStringObject = {};

  // Get an array of files (string files) in the repo subdirectory.
  var babelRepoPath = path.join(babelPath, repo);

  // Regex for extracting locale from file name.
  var localeRegex = /(?<=_)(.*)(?=.json)/;
  var stringFiles = [];
  try {
    var paths = fs.readdirSync(babelRepoPath);
    stringFiles.push.apply(stringFiles, _toConsumableArray(paths.map(function (p) {
      return path.join(babelRepoPath, p);
    })));
  } catch (e) {

    // no translations found in babel. But we still must continue in order to generate an (albeit empty) string file.
  }
  var englishStringPath = path.join(rootPath, repo, "".concat(repo, "-strings_en.json"));
  if (fs.existsSync(englishStringPath)) {
    stringFiles.push(englishStringPath);
  }

  // Do not generate a file if no translations were found.
  if (stringFiles.length > 0) {
    // For each string file in the repo subdirectory...
    var _iterator = _createForOfIteratorHelper(stringFiles),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var stringFile = _step.value;
        // Extract the locale.
        var join = stringFile.split('\\').join('/');
        var localeMatches = join.substring(join.lastIndexOf('/')).match(localeRegex);
        var locale = localeMatches[0];

        // Get the contents of the string file.
        var stringFileContents = fs.readFileSync(stringFile, 'utf8');

        // Parse the string file contents.
        var parsedStringFileContents = JSON.parse(stringFileContents);

        // Add only the values of the string file to the new conglomerate string file, and ignore other fields, such as
        // the history.
        var objectToAddToLocale = {};
        for (var _i = 0, _Object$keys = Object.keys(parsedStringFileContents); _i < _Object$keys.length; _i++) {
          var stringKey = _Object$keys[_i];
          objectToAddToLocale[stringKey] = {
            value: parsedStringFileContents[stringKey].value
          };
        }

        // Add the string values to the locale object of the conglomerate string object.
        conglomerateStringObject[locale] = objectToAddToLocale;
      }

      // Make sure the output directory exists.  The name starts with an underscore so that it appears alphabetically
      // first and looks different from the repo names.
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    var outputDir = path.join(babelPath, '_generated_development_strings');
    try {
      fs.mkdirSync(outputDir);
    } catch (e) {
      // already exists
    }
    var outputPath = path.join(outputDir, conglomerateStringFileName);
    fs.writeFileSync(outputPath, JSON.stringify(conglomerateStringObject, null, 2));
    var end = Date.now();
    console.log('Wrote ' + outputPath + ' in ' + (end - start) + 'ms');
  } else {
    console.log('no translations found');
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJwYXRoIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJzdGFydCIsIkRhdGUiLCJub3ciLCJyb290UGF0aCIsImpvaW4iLCJfX2Rpcm5hbWUiLCJiYWJlbFBhdGgiLCJjb25nbG9tZXJhdGVTdHJpbmdGaWxlTmFtZSIsImNvbmNhdCIsImNvbmdsb21lcmF0ZVN0cmluZ09iamVjdCIsImJhYmVsUmVwb1BhdGgiLCJsb2NhbGVSZWdleCIsInN0cmluZ0ZpbGVzIiwicGF0aHMiLCJyZWFkZGlyU3luYyIsInB1c2giLCJhcHBseSIsIl90b0NvbnN1bWFibGVBcnJheSIsIm1hcCIsInAiLCJlIiwiZW5nbGlzaFN0cmluZ1BhdGgiLCJleGlzdHNTeW5jIiwibGVuZ3RoIiwiX2l0ZXJhdG9yIiwiX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIiLCJfc3RlcCIsInMiLCJuIiwiZG9uZSIsInN0cmluZ0ZpbGUiLCJ2YWx1ZSIsInNwbGl0IiwibG9jYWxlTWF0Y2hlcyIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwibWF0Y2giLCJsb2NhbGUiLCJzdHJpbmdGaWxlQ29udGVudHMiLCJyZWFkRmlsZVN5bmMiLCJwYXJzZWRTdHJpbmdGaWxlQ29udGVudHMiLCJKU09OIiwicGFyc2UiLCJvYmplY3RUb0FkZFRvTG9jYWxlIiwiX2kiLCJfT2JqZWN0JGtleXMiLCJPYmplY3QiLCJrZXlzIiwic3RyaW5nS2V5IiwiZXJyIiwiZiIsIm91dHB1dERpciIsIm1rZGlyU3luYyIsIm91dHB1dFBhdGgiLCJ3cml0ZUZpbGVTeW5jIiwic3RyaW5naWZ5IiwiZW5kIiwiY29uc29sZSIsImxvZyJdLCJzb3VyY2VzIjpbImdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoaXMgc2NyaXB0IG1ha2VzIGEgSlNPTiBmaWxlIHRoYXQgY29tYmluZXMgdHJhbnNsYXRpb25zIGZvciBhbGwgbG9jYWxlcyBpbiBhIHJlcG8uIEVhY2ggbG9jYWxlIG9iamVjdCBoYXMgZXZlcnlcclxuICogc3RyaW5nIGtleS90cmFuc2xhdGVkLXZhbHVlIHBhaXIgd2UgaGF2ZSBmb3IgdGhhdCBsb2NhbGUuIFRoaXMgaXMgdXNlZCB3aGVuIHJ1bm5pbmcgdGhlIHVuYnVpbHQgbW9kZSBzaW11bGF0aW9uIHdpdGhcclxuICogbG9jYWxlcz0qXHJcbiAqXHJcbiAqIEBhdXRob3IgTGlhbSBNdWxoYWxsIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbi8vIGltcG9ydHNcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIHJlcG8gdG8gZ2VuZXJhdGUgc3RyaW5ncyBmb3JcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVwbyA9PiB7XHJcblxyXG4gIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmpvaW4oIF9fZGlybmFtZSwgJy4uJywgJy4uJywgJy4uJyApO1xyXG5cclxuICAvLyBPUy1pbmRlcGVuZGVudCBwYXRoIHRvIGJhYmVsIHJlcG8uXHJcbiAgY29uc3QgYmFiZWxQYXRoID0gcGF0aC5qb2luKCByb290UGF0aCwgJ2JhYmVsJyApO1xyXG5cclxuICAvLyBDcmVhdGUgYSBmaWxlIG5hbWUgZm9yIHRoZSBjb25nbG9tZXJhdGUgc3RyaW5nIGZpbGUuXHJcbiAgY29uc3QgY29uZ2xvbWVyYXRlU3RyaW5nRmlsZU5hbWUgPSBgJHtyZXBvfV9hbGwuanNvbmA7XHJcblxyXG4gIC8vIENyZWF0ZSBhbiBlbXB0eSBvYmplY3QgZm9yIHRoZSBjb25nbG9tZXJhdGUgc3RyaW5nIGZpbGUgdGhhdCB3ZSB3aWxsIGFkZCB0byBsYXRlci5cclxuICBjb25zdCBjb25nbG9tZXJhdGVTdHJpbmdPYmplY3QgPSB7fTtcclxuXHJcbiAgLy8gR2V0IGFuIGFycmF5IG9mIGZpbGVzIChzdHJpbmcgZmlsZXMpIGluIHRoZSByZXBvIHN1YmRpcmVjdG9yeS5cclxuICBjb25zdCBiYWJlbFJlcG9QYXRoID0gcGF0aC5qb2luKCBiYWJlbFBhdGgsIHJlcG8gKTtcclxuXHJcbiAgLy8gUmVnZXggZm9yIGV4dHJhY3RpbmcgbG9jYWxlIGZyb20gZmlsZSBuYW1lLlxyXG4gIGNvbnN0IGxvY2FsZVJlZ2V4ID0gLyg/PD1fKSguKikoPz0uanNvbikvO1xyXG5cclxuICBjb25zdCBzdHJpbmdGaWxlcyA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwYXRocyA9IGZzLnJlYWRkaXJTeW5jKCBiYWJlbFJlcG9QYXRoICk7XHJcbiAgICBzdHJpbmdGaWxlcy5wdXNoKCAuLi5wYXRocy5tYXAoIHAgPT4gcGF0aC5qb2luKCBiYWJlbFJlcG9QYXRoLCBwICkgKSApO1xyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuXHJcbiAgICAvLyBubyB0cmFuc2xhdGlvbnMgZm91bmQgaW4gYmFiZWwuIEJ1dCB3ZSBzdGlsbCBtdXN0IGNvbnRpbnVlIGluIG9yZGVyIHRvIGdlbmVyYXRlIGFuIChhbGJlaXQgZW1wdHkpIHN0cmluZyBmaWxlLlxyXG4gIH1cclxuXHJcbiAgY29uc3QgZW5nbGlzaFN0cmluZ1BhdGggPSBwYXRoLmpvaW4oIHJvb3RQYXRoLCByZXBvLCBgJHtyZXBvfS1zdHJpbmdzX2VuLmpzb25gICk7XHJcbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBlbmdsaXNoU3RyaW5nUGF0aCApICkge1xyXG4gICAgc3RyaW5nRmlsZXMucHVzaCggZW5nbGlzaFN0cmluZ1BhdGggKTtcclxuICB9XHJcblxyXG4gIC8vIERvIG5vdCBnZW5lcmF0ZSBhIGZpbGUgaWYgbm8gdHJhbnNsYXRpb25zIHdlcmUgZm91bmQuXHJcbiAgaWYgKCBzdHJpbmdGaWxlcy5sZW5ndGggPiAwICkge1xyXG5cclxuICAgIC8vIEZvciBlYWNoIHN0cmluZyBmaWxlIGluIHRoZSByZXBvIHN1YmRpcmVjdG9yeS4uLlxyXG4gICAgZm9yICggY29uc3Qgc3RyaW5nRmlsZSBvZiBzdHJpbmdGaWxlcyApIHtcclxuXHJcbiAgICAgIC8vIEV4dHJhY3QgdGhlIGxvY2FsZS5cclxuICAgICAgY29uc3Qgam9pbiA9IHN0cmluZ0ZpbGUuc3BsaXQoICdcXFxcJyApLmpvaW4oICcvJyApO1xyXG4gICAgICBjb25zdCBsb2NhbGVNYXRjaGVzID0gam9pbi5zdWJzdHJpbmcoIGpvaW4ubGFzdEluZGV4T2YoICcvJyApICkubWF0Y2goIGxvY2FsZVJlZ2V4ICk7XHJcbiAgICAgIGNvbnN0IGxvY2FsZSA9IGxvY2FsZU1hdGNoZXNbIDAgXTtcclxuXHJcbiAgICAgIC8vIEdldCB0aGUgY29udGVudHMgb2YgdGhlIHN0cmluZyBmaWxlLlxyXG4gICAgICBjb25zdCBzdHJpbmdGaWxlQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoIHN0cmluZ0ZpbGUsICd1dGY4JyApO1xyXG5cclxuICAgICAgLy8gUGFyc2UgdGhlIHN0cmluZyBmaWxlIGNvbnRlbnRzLlxyXG4gICAgICBjb25zdCBwYXJzZWRTdHJpbmdGaWxlQ29udGVudHMgPSBKU09OLnBhcnNlKCBzdHJpbmdGaWxlQ29udGVudHMgKTtcclxuXHJcbiAgICAgIC8vIEFkZCBvbmx5IHRoZSB2YWx1ZXMgb2YgdGhlIHN0cmluZyBmaWxlIHRvIHRoZSBuZXcgY29uZ2xvbWVyYXRlIHN0cmluZyBmaWxlLCBhbmQgaWdub3JlIG90aGVyIGZpZWxkcywgc3VjaCBhc1xyXG4gICAgICAvLyB0aGUgaGlzdG9yeS5cclxuICAgICAgY29uc3Qgb2JqZWN0VG9BZGRUb0xvY2FsZSA9IHt9O1xyXG4gICAgICBmb3IgKCBjb25zdCBzdHJpbmdLZXkgb2YgT2JqZWN0LmtleXMoIHBhcnNlZFN0cmluZ0ZpbGVDb250ZW50cyApICkge1xyXG4gICAgICAgIG9iamVjdFRvQWRkVG9Mb2NhbGVbIHN0cmluZ0tleSBdID0ge1xyXG4gICAgICAgICAgdmFsdWU6IHBhcnNlZFN0cmluZ0ZpbGVDb250ZW50c1sgc3RyaW5nS2V5IF0udmFsdWVcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBZGQgdGhlIHN0cmluZyB2YWx1ZXMgdG8gdGhlIGxvY2FsZSBvYmplY3Qgb2YgdGhlIGNvbmdsb21lcmF0ZSBzdHJpbmcgb2JqZWN0LlxyXG4gICAgICBjb25nbG9tZXJhdGVTdHJpbmdPYmplY3RbIGxvY2FsZSBdID0gb2JqZWN0VG9BZGRUb0xvY2FsZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhlIG91dHB1dCBkaXJlY3RvcnkgZXhpc3RzLiAgVGhlIG5hbWUgc3RhcnRzIHdpdGggYW4gdW5kZXJzY29yZSBzbyB0aGF0IGl0IGFwcGVhcnMgYWxwaGFiZXRpY2FsbHlcclxuICAgIC8vIGZpcnN0IGFuZCBsb29rcyBkaWZmZXJlbnQgZnJvbSB0aGUgcmVwbyBuYW1lcy5cclxuICAgIGNvbnN0IG91dHB1dERpciA9IHBhdGguam9pbiggYmFiZWxQYXRoLCAnX2dlbmVyYXRlZF9kZXZlbG9wbWVudF9zdHJpbmdzJyApO1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMubWtkaXJTeW5jKCBvdXRwdXREaXIgKTtcclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAvLyBhbHJlYWR5IGV4aXN0c1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4oIG91dHB1dERpciwgY29uZ2xvbWVyYXRlU3RyaW5nRmlsZU5hbWUgKTtcclxuICAgIGZzLndyaXRlRmlsZVN5bmMoIG91dHB1dFBhdGgsIEpTT04uc3RyaW5naWZ5KCBjb25nbG9tZXJhdGVTdHJpbmdPYmplY3QsIG51bGwsIDIgKSApO1xyXG5cclxuICAgIGNvbnN0IGVuZCA9IERhdGUubm93KCk7XHJcbiAgICBjb25zb2xlLmxvZyggJ1dyb3RlICcgKyBvdXRwdXRQYXRoICsgJyBpbiAnICsgKCBlbmQgLSBzdGFydCApICsgJ21zJyApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGNvbnNvbGUubG9nKCAnbm8gdHJhbnNsYXRpb25zIGZvdW5kJyApO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxJQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBRSxJQUFLLENBQUM7QUFDMUIsSUFBTUMsSUFBSSxHQUFHRCxPQUFPLENBQUUsTUFBTyxDQUFDOztBQUU5QjtBQUNBO0FBQ0E7QUFDQUUsTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBQUMsSUFBSSxFQUFJO0VBRXZCLElBQU1DLEtBQUssR0FBR0MsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQztFQUV4QixJQUFNQyxRQUFRLEdBQUdQLElBQUksQ0FBQ1EsSUFBSSxDQUFFQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFLLENBQUM7O0VBRXpEO0VBQ0EsSUFBTUMsU0FBUyxHQUFHVixJQUFJLENBQUNRLElBQUksQ0FBRUQsUUFBUSxFQUFFLE9BQVEsQ0FBQzs7RUFFaEQ7RUFDQSxJQUFNSSwwQkFBMEIsTUFBQUMsTUFBQSxDQUFNVCxJQUFJLGNBQVc7O0VBRXJEO0VBQ0EsSUFBTVUsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDOztFQUVuQztFQUNBLElBQU1DLGFBQWEsR0FBR2QsSUFBSSxDQUFDUSxJQUFJLENBQUVFLFNBQVMsRUFBRVAsSUFBSyxDQUFDOztFQUVsRDtFQUNBLElBQU1ZLFdBQVcsR0FBRyxxQkFBcUI7RUFFekMsSUFBTUMsV0FBVyxHQUFHLEVBQUU7RUFDdEIsSUFBSTtJQUNGLElBQU1DLEtBQUssR0FBR25CLEVBQUUs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