"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2015-2024, University of Colorado Boulder

/**
 * Returns a map such that map["locale"]["REPO/stringKey"] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var _ = require('lodash');
var assert = require('assert');
var ChipperConstants = require('../common/ChipperConstants');
var pascalCase = require('../common/pascalCase');
var ChipperStringUtils = require('../common/ChipperStringUtils');
var fs = require('fs');
var grunt = require('grunt');
var localeInfo = require('../data/localeInfo'); // Locale information
var path = require('path');

/**
 * Load all the required string files into memory, so we don't load them multiple times (for each usage).
 *
 * @param {Array.<string>} reposWithUsedStrings - All of the repos that have 1+ used strings
 * @param {Array.<string>} locales - All supported locales for this build
 * @returns {Object} - maps {locale:string} => Another map with: {stringKey:string} => {stringValue:string}
 */
var getStringFilesContents = function getStringFilesContents(reposWithUsedStrings, locales) {
  var stringFilesContents = {}; // maps [repositoryName][locale] => contents of locale string file

  reposWithUsedStrings.forEach(function (repo) {
    stringFilesContents[repo] = {};

    /**
     * Adds a locale into our stringFilesContents map.
     *
     * @param {string} locale
     * @param {boolean} isRTL
     */
    var addLocale = function addLocale(locale, isRTL) {
      // Read optional string file
      var stringsFilename = path.normalize("../".concat(locale === ChipperConstants.FALLBACK_LOCALE ? '' : 'babel/').concat(repo, "/").concat(repo, "-strings_").concat(locale, ".json"));
      var fileContents;
      try {
        fileContents = grunt.file.readJSON(stringsFilename);
      } catch (error) {
        grunt.log.debug("missing string file: ".concat(stringsFilename));
        fileContents = {};
      }

      // Format the string values
      ChipperStringUtils.formatStringValues(fileContents, isRTL);
      stringFilesContents[repo][locale] = fileContents;
    };
    locales.forEach(function (locale) {
      assert(localeInfo[locale], "unsupported locale: ".concat(locale));
      var isRTL = localeInfo[locale].direction === 'rtl';

      // Handle fallback locales
      addLocale(locale, isRTL);
      if (locale.length > 2) {
        var middleLocale = locale.slice(0, 2);
        if (!locales.includes(middleLocale)) {
          addLocale(middleLocale, isRTL);
        }
      }
    });
  });
  return stringFilesContents;
};

/**
 * @param {string} mainRepo
 * @param {Array.<string>} locales
 * @param {Array.<string>} phetLibs - Used to check for bad string dependencies
 * @param {Array.<string>} usedModules - relative file path of the module (filename) from the repos root
 *
 * @returns {Object} - map[locale][stringKey] => {string}
 */
module.exports = function (mainRepo, locales, phetLibs, usedModules) {
  assert(locales.indexOf(ChipperConstants.FALLBACK_LOCALE) !== -1, 'fallback locale is required');

  /**
   * For a given locale, return an array of specific locales that we'll use as fallbacks, e.g.
   * 'zh_CN' => [ 'zh_CN', 'zh', 'en' ]
   * 'es' => [ 'es', 'en' ]
   * 'en' => [ 'en' ]
   *
   * @param {string} locale
   * @returns {Array.<string>}
   */
  var localeFallbacks = function localeFallbacks(locale) {
    return [].concat(_toConsumableArray(locale !== ChipperConstants.FALLBACK_LOCALE ? [locale] : []), _toConsumableArray(locale.length > 2 && locale.slice(0, 2) !== ChipperConstants.FALLBACK_LOCALE ? [locale.slice(0, 2)] : []), [
    // e.g. 'zh'
    ChipperConstants.FALLBACK_LOCALE // e.g. 'en'
    ]);
  };

  // Load the file contents of every single JS module that used any strings
  var usedFileContents = usedModules.map(function (usedModule) {
    return fs.readFileSync("../".concat(usedModule), 'utf-8');
  });

  // Compute which repositories contain one more more used strings (since we'll need to load string files for those
  // repositories).
  var reposWithUsedStrings = [];
  usedFileContents.forEach(function (fileContent) {
    // [a-zA-Z_$][a-zA-Z0-9_$] ---- general JS identifiers, first character can't be a number
    // [^\n\r] ---- grab everything except for newlines here, so we get everything
    var allImportStatements = fileContent.match(/import [a-zA-Z_$][a-zA-Z0-9_$]*Strings from '[^\n\r]+Strings.js';/g);
    if (allImportStatements) {
      var _reposWithUsedStrings;
      (_reposWithUsedStrings = reposWithUsedStrings).push.apply(_reposWithUsedStrings, _toConsumableArray(allImportStatements.map(function (importStatement) {
        // Grabs out the prefix before `Strings.js` (without the leading slash too)
        var importName = importStatement.match(/\/([\w-]+)Strings\.js/)[1];

        // kebab case the repo
        return _.kebabCase(importName);
      })));
    }
  });
  reposWithUsedStrings = _.uniq(reposWithUsedStrings).filter(function (repo) {
    return fs.existsSync("../".concat(repo, "/package.json"));
  });

  // Compute a map of {repo:string} => {requirejsNamepsace:string}, so we can construct full string keys from strings
  // that would be accessing them, e.g. `JoistStrings.ResetAllButton.name` => `JOIST/ResetAllButton.name`.
  var requirejsNamespaceMap = {};
  reposWithUsedStrings.forEach(function (repo) {
    var packageObject = JSON.parse(fs.readFileSync("../".concat(repo, "/package.json"), 'utf-8'));
    requirejsNamespaceMap[repo] = packageObject.phet.requirejsNamespace;
  });

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  // maps [repositoryName][locale] => contents of locale string file
  var stringFilesContents = getStringFilesContents(reposWithUsedStrings, locales);

  // Initialize our full stringMap object (which will be filled with results and then returned as our string map).
  var stringMap = {};
  var stringMetadata = {};
  locales.forEach(function (locale) {
    stringMap[locale] = {};
  });

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary. In regards to nested
  // strings, this data structure doesn't nest. Instead it gets nested string values, and then sets them with the
  // flat key string like `"FRICTION/a11y.some.string.here": { value: 'My Some String' }`
  reposWithUsedStrings.forEach(function (repo) {
    // Scan all of the files with string module references, scanning for anything that looks like a string access for
    // our repo. This will include the string module reference, e.g. `JoistStrings.ResetAllButton.name`, but could also
    // include slightly more (since we're string parsing), e.g. `JoistStrings.ResetAllButton.name.length` would be
    // included, even though only part of that is a string access.
    var stringAccesses = [];
    var prefix = "".concat(pascalCase(repo), "Strings"); // e.g. JoistStrings
    usedFileContents.forEach(function (fileContent, i) {
      // Only scan files where we can identify an import for it
      if (fileContent.includes("import ".concat(prefix, " from"))) {
        // Look for normal matches, e.g. `JoistStrings.` followed by one or more chunks like:
        // .somethingVaguely_alphaNum3r1c
        // [ 'aStringInBracketsBecauseOfSpecialCharacters' ]
        //
        // It will also then end on anything that doesn't look like another one of those chunks
        // [a-zA-Z_$][a-zA-Z0-9_$]* ---- this grabs things that looks like valid JS identifiers
        // \\[ '[^']+' \\])+ ---- this grabs things like our second case above
        // [^\\.\\[] ---- matches something at the end that is NOT either of those other two cases
        // It is also generalized to support arbitrary whitespace and requires that ' match ' or " match ", since
        // this must support JS code and minified TypeScript code
        // Matches one final character that is not '.' or '[', since any valid string accesses should NOT have that
        // after. NOTE: there are some degenerate cases that will break this, e.g.:
        // - JoistStrings.someStringProperty[ 0 ]
        // - JoistStrings.something[ 0 ]
        // - JoistStrings.something[ 'length' ]
        var matches = fileContent.match(new RegExp("".concat(prefix, "(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[\\s*['\"][^'\"]+['\"]\\s*\\])+[^\\.\\[]"), 'g'));
        if (matches) {
          var _stringAccesses;
          (_stringAccesses = stringAccesses).push.apply(_stringAccesses, _toConsumableArray(matches.map(function (match) {
            return match
            // We always have to strip off the last character - it's a character that shouldn't be in a string access
            .slice(0, match.length - 1)
            // Handle JoistStrings[ 'some-thingStringProperty' ].value => JoistStrings[ 'some-thing' ]
            // -- Anything after StringProperty should go
            // away, but we need to add the final '] to maintain the format
            .replace(/StringProperty'].*/, '\']')
            // Handle JoistStrings.somethingStringProperty.value => JoistStrings.something
            .replace(/StringProperty.*/, '');
          })));
        }
      }
    });

    // Strip off our prefixes, so our stringAccesses will have things like `'ResetAllButton.name'` inside.
    stringAccesses = _.uniq(stringAccesses).map(function (str) {
      return str.slice(prefix.length);
    });

    // The JS outputted by TS is minified and missing the whitespace
    var depth = 2;

    // Turn each string access into an array of parts, e.g. '.ResetAllButton.name' => [ 'ResetAllButton', 'name' ]
    // or '[ \'A\' ].B[ \'C\' ]' => [ 'A', 'B', 'C' ]
    // Regex grabs either `.identifier` or `[ 'text' ]`.
    var stringKeysByParts = stringAccesses.map(function (access) {
      return access.match(/\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\s*['"][^'"]+['"]\s*\]/g).map(function (token) {
        return token.startsWith('.') ? token.slice(1) : token.slice(depth, token.length - depth);
      });
    });

    // Concatenate the string parts for each access into something that looks like a partial string key, e.g.
    // [ 'ResetAllButton', 'name' ] => 'ResetAllButton.name'
    var partialStringKeys = _.uniq(stringKeysByParts.map(function (parts) {
      return parts.join('.');
    })).filter(function (key) {
      return key !== 'js';
    });

    // For each string key and locale, we'll look up the string entry and fill it into the stringMap
    partialStringKeys.forEach(function (partialStringKey) {
      locales.forEach(function (locale) {
        var stringEntry = null;
        var _iterator = _createForOfIteratorHelper(localeFallbacks(locale)),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var fallbackLocale = _step.value;
            var stringFileContents = stringFilesContents[repo][fallbackLocale];
            if (stringFileContents) {
              stringEntry = ChipperStringUtils.getStringEntryFromMap(stringFileContents, partialStringKey);
              if (stringEntry) {
                break;
              }
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        if (!partialStringKey.endsWith('StringProperty')) {
          assert(stringEntry !== null, "Missing string information for ".concat(repo, " ").concat(partialStringKey));
          var stringKey = "".concat(requirejsNamespaceMap[repo], "/").concat(partialStringKey);
          stringMap[locale][stringKey] = stringEntry.value;
          if (stringEntry.metadata && locale === ChipperConstants.FALLBACK_LOCALE) {
            stringMetadata[stringKey] = stringEntry.metadata;
          }
        }
      });
    });
  });
  return {
    stringMap: stringMap,
    stringMetadata: stringMetadata
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsIkNoaXBwZXJDb25zdGFudHMiLCJwYXNjYWxDYXNlIiwiQ2hpcHBlclN0cmluZ1V0aWxzIiwiZnMiLCJncnVudCIsImxvY2FsZUluZm8iLCJwYXRoIiwiZ2V0U3RyaW5nRmlsZXNDb250ZW50cyIsInJlcG9zV2l0aFVzZWRTdHJpbmdzIiwibG9jYWxlcyIsInN0cmluZ0ZpbGVzQ29udGVudHMiLCJmb3JFYWNoIiwicmVwbyIsImFkZExvY2FsZSIsImxvY2FsZSIsImlzUlRMIiwic3RyaW5nc0ZpbGVuYW1lIiwibm9ybWFsaXplIiwiY29uY2F0IiwiRkFMTEJBQ0tfTE9DQUxFIiwiZmlsZUNvbnRlbnRzIiwiZmlsZSIsInJlYWRKU09OIiwiZXJyb3IiLCJsb2ciLCJkZWJ1ZyIsImZvcm1hdFN0cmluZ1ZhbHVlcyIsImRpcmVjdGlvbiIsImxlbmd0aCIsIm1pZGRsZUxvY2FsZSIsInNsaWNlIiwiaW5jbHVkZXMiLCJtb2R1bGUiLCJleHBvcnRzIiwibWFpblJlcG8iLCJwaGV0TGlicyIsInVzZWRNb2R1bGVzIiwiaW5kZXhPZiIsImxvY2FsZUZhbGxiYWNrcyIsIl90b0NvbnN1bWFibGVBcnJheSIsInVzZWRGaWxlQ29udGVudHMiLCJtYXAiLCJ1c2VkTW9kdWxlIiwicmVhZEZpbGVTeW5jIiwiZmlsZUNvbnRlbnQiLCJhbGxJbXBvcnRTdGF0ZW1lbnRzIiwibWF0Y2giLCJfcmVwb3NXaXRoVXNlZFN0cmluZ3MiLCJwdXNoIiwiYXBwbHkiLCJpbXBvcnRTdGF0ZW1lbnQiLCJpbXBvcnROYW1lIiwia2ViYWJDYXNlIiwidW5pcSIsImZpbHRlciIsImV4aXN0c1N5bmMiLCJyZXF1aXJlanNOYW1lc3BhY2VNYXAiLCJwYWNrYWdlT2JqZWN0IiwiSlNPTiIsInBhcnNlIiwicGhldCIsInJlcXVpcmVqc05hbWVzcGFjZSIsInN0cmluZ01hcCIsInN0cmluZ01ldGFkYXRhIiwic3RyaW5nQWNjZXNzZXMiLCJwcmVmaXgiLCJpIiwibWF0Y2hlcyIsIlJlZ0V4cCIsIl9zdHJpbmdBY2Nlc3NlcyIsInJlcGxhY2UiLCJzdHIiLCJkZXB0aCIsInN0cmluZ0tleXNCeVBhcnRzIiwiYWNjZXNzIiwidG9rZW4iLCJzdGFydHNXaXRoIiwicGFydGlhbFN0cmluZ0tleXMiLCJwYXJ0cyIsImpvaW4iLCJrZXkiLCJwYXJ0aWFsU3RyaW5nS2V5Iiwic3RyaW5nRW50cnkiLCJfaXRlcmF0b3IiLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsIl9zdGVwIiwicyIsIm4iLCJkb25lIiwiZmFsbGJhY2tMb2NhbGUiLCJ2YWx1ZSIsInN0cmluZ0ZpbGVDb250ZW50cyIsImdldFN0cmluZ0VudHJ5RnJvbU1hcCIsImVyciIsImUiLCJmIiwiZW5kc1dpdGgiLCJzdHJpbmdLZXkiLCJtZXRhZGF0YSJdLCJzb3VyY2VzIjpbImdldFN0cmluZ01hcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgbWFwIHN1Y2ggdGhhdCBtYXBbXCJsb2NhbGVcIl1bXCJSRVBPL3N0cmluZ0tleVwiXSB3aWxsIGJlIHRoZSBzdHJpbmcgdmFsdWUgKHdpdGggZmFsbGJhY2tzIHRvIEVuZ2xpc2ggd2hlcmUgbmVlZGVkKS5cclxuICogTG9hZHMgZWFjaCBzdHJpbmcgZmlsZSBvbmx5IG9uY2UsIGFuZCBvbmx5IGxvYWRzIHRoZSByZXBvc2l0b3J5L2xvY2FsZSBjb21iaW5hdGlvbnMgbmVjZXNzYXJ5LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5jb25zdCBDaGlwcGVyQ29uc3RhbnRzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9DaGlwcGVyQ29uc3RhbnRzJyApO1xyXG5jb25zdCBwYXNjYWxDYXNlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9wYXNjYWxDYXNlJyApO1xyXG5jb25zdCBDaGlwcGVyU3RyaW5nVXRpbHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJTdHJpbmdVdGlscycgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IGdydW50ID0gcmVxdWlyZSggJ2dydW50JyApO1xyXG5jb25zdCBsb2NhbGVJbmZvID0gcmVxdWlyZSggJy4uL2RhdGEvbG9jYWxlSW5mbycgKTsgLy8gTG9jYWxlIGluZm9ybWF0aW9uXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkIGFsbCB0aGUgcmVxdWlyZWQgc3RyaW5nIGZpbGVzIGludG8gbWVtb3J5LCBzbyB3ZSBkb24ndCBsb2FkIHRoZW0gbXVsdGlwbGUgdGltZXMgKGZvciBlYWNoIHVzYWdlKS5cclxuICpcclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gcmVwb3NXaXRoVXNlZFN0cmluZ3MgLSBBbGwgb2YgdGhlIHJlcG9zIHRoYXQgaGF2ZSAxKyB1c2VkIHN0cmluZ3NcclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbG9jYWxlcyAtIEFsbCBzdXBwb3J0ZWQgbG9jYWxlcyBmb3IgdGhpcyBidWlsZFxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIG1hcHMge2xvY2FsZTpzdHJpbmd9ID0+IEFub3RoZXIgbWFwIHdpdGg6IHtzdHJpbmdLZXk6c3RyaW5nfSA9PiB7c3RyaW5nVmFsdWU6c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgZ2V0U3RyaW5nRmlsZXNDb250ZW50cyA9ICggcmVwb3NXaXRoVXNlZFN0cmluZ3MsIGxvY2FsZXMgKSA9PiB7XHJcbiAgY29uc3Qgc3RyaW5nRmlsZXNDb250ZW50cyA9IHt9OyAvLyBtYXBzIFtyZXBvc2l0b3J5TmFtZV1bbG9jYWxlXSA9PiBjb250ZW50cyBvZiBsb2NhbGUgc3RyaW5nIGZpbGVcclxuXHJcbiAgcmVwb3NXaXRoVXNlZFN0cmluZ3MuZm9yRWFjaCggcmVwbyA9PiB7XHJcbiAgICBzdHJpbmdGaWxlc0NvbnRlbnRzWyByZXBvIF0gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBsb2NhbGUgaW50byBvdXIgc3RyaW5nRmlsZXNDb250ZW50cyBtYXAuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsZVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc1JUTFxyXG4gICAgICovXHJcbiAgICBjb25zdCBhZGRMb2NhbGUgPSAoIGxvY2FsZSwgaXNSVEwgKSA9PiB7XHJcbiAgICAgIC8vIFJlYWQgb3B0aW9uYWwgc3RyaW5nIGZpbGVcclxuICAgICAgY29uc3Qgc3RyaW5nc0ZpbGVuYW1lID0gcGF0aC5ub3JtYWxpemUoIGAuLi8ke2xvY2FsZSA9PT0gQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgPyAnJyA6ICdiYWJlbC8nfSR7cmVwb30vJHtyZXBvfS1zdHJpbmdzXyR7bG9jYWxlfS5qc29uYCApO1xyXG4gICAgICBsZXQgZmlsZUNvbnRlbnRzO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGZpbGVDb250ZW50cyA9IGdydW50LmZpbGUucmVhZEpTT04oIHN0cmluZ3NGaWxlbmFtZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoKCBlcnJvciApIHtcclxuICAgICAgICBncnVudC5sb2cuZGVidWcoIGBtaXNzaW5nIHN0cmluZyBmaWxlOiAke3N0cmluZ3NGaWxlbmFtZX1gICk7XHJcbiAgICAgICAgZmlsZUNvbnRlbnRzID0ge307XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEZvcm1hdCB0aGUgc3RyaW5nIHZhbHVlc1xyXG4gICAgICBDaGlwcGVyU3RyaW5nVXRpbHMuZm9ybWF0U3RyaW5nVmFsdWVzKCBmaWxlQ29udGVudHMsIGlzUlRMICk7XHJcblxyXG4gICAgICBzdHJpbmdGaWxlc0NvbnRlbnRzWyByZXBvIF1bIGxvY2FsZSBdID0gZmlsZUNvbnRlbnRzO1xyXG4gICAgfTtcclxuXHJcbiAgICBsb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcbiAgICAgIGFzc2VydCggbG9jYWxlSW5mb1sgbG9jYWxlIF0sIGB1bnN1cHBvcnRlZCBsb2NhbGU6ICR7bG9jYWxlfWAgKTtcclxuICAgICAgY29uc3QgaXNSVEwgPSBsb2NhbGVJbmZvWyBsb2NhbGUgXS5kaXJlY3Rpb24gPT09ICdydGwnO1xyXG5cclxuICAgICAgLy8gSGFuZGxlIGZhbGxiYWNrIGxvY2FsZXNcclxuICAgICAgYWRkTG9jYWxlKCBsb2NhbGUsIGlzUlRMICk7XHJcbiAgICAgIGlmICggbG9jYWxlLmxlbmd0aCA+IDIgKSB7XHJcbiAgICAgICAgY29uc3QgbWlkZGxlTG9jYWxlID0gbG9jYWxlLnNsaWNlKCAwLCAyICk7XHJcbiAgICAgICAgaWYgKCAhbG9jYWxlcy5pbmNsdWRlcyggbWlkZGxlTG9jYWxlICkgKSB7XHJcbiAgICAgICAgICBhZGRMb2NhbGUoIG1pZGRsZUxvY2FsZSwgaXNSVEwgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9ICk7XHJcblxyXG4gIHJldHVybiBzdHJpbmdGaWxlc0NvbnRlbnRzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtYWluUmVwb1xyXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBsb2NhbGVzXHJcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHBoZXRMaWJzIC0gVXNlZCB0byBjaGVjayBmb3IgYmFkIHN0cmluZyBkZXBlbmRlbmNpZXNcclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gdXNlZE1vZHVsZXMgLSByZWxhdGl2ZSBmaWxlIHBhdGggb2YgdGhlIG1vZHVsZSAoZmlsZW5hbWUpIGZyb20gdGhlIHJlcG9zIHJvb3RcclxuICpcclxuICogQHJldHVybnMge09iamVjdH0gLSBtYXBbbG9jYWxlXVtzdHJpbmdLZXldID0+IHtzdHJpbmd9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBtYWluUmVwbywgbG9jYWxlcywgcGhldExpYnMsIHVzZWRNb2R1bGVzICkge1xyXG5cclxuICBhc3NlcnQoIGxvY2FsZXMuaW5kZXhPZiggQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgKSAhPT0gLTEsICdmYWxsYmFjayBsb2NhbGUgaXMgcmVxdWlyZWQnICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvciBhIGdpdmVuIGxvY2FsZSwgcmV0dXJuIGFuIGFycmF5IG9mIHNwZWNpZmljIGxvY2FsZXMgdGhhdCB3ZSdsbCB1c2UgYXMgZmFsbGJhY2tzLCBlLmcuXHJcbiAgICogJ3poX0NOJyA9PiBbICd6aF9DTicsICd6aCcsICdlbicgXVxyXG4gICAqICdlcycgPT4gWyAnZXMnLCAnZW4nIF1cclxuICAgKiAnZW4nID0+IFsgJ2VuJyBdXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbG9jYWxlXHJcbiAgICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fVxyXG4gICAqL1xyXG4gIGNvbnN0IGxvY2FsZUZhbGxiYWNrcyA9IGxvY2FsZSA9PiB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAuLi4oIGxvY2FsZSAhPT0gQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgPyBbIGxvY2FsZSBdIDogW10gKSwgLy8gZS5nLiAnemhfQ04nXHJcbiAgICAgIC4uLiggKCBsb2NhbGUubGVuZ3RoID4gMiAmJiBsb2NhbGUuc2xpY2UoIDAsIDIgKSAhPT0gQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgKSA/IFsgbG9jYWxlLnNsaWNlKCAwLCAyICkgXSA6IFtdICksIC8vIGUuZy4gJ3poJ1xyXG4gICAgICBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSAvLyBlLmcuICdlbidcclxuICAgIF07XHJcbiAgfTtcclxuXHJcbiAgLy8gTG9hZCB0aGUgZmlsZSBjb250ZW50cyBvZiBldmVyeSBzaW5nbGUgSlMgbW9kdWxlIHRoYXQgdXNlZCBhbnkgc3RyaW5nc1xyXG4gIGNvbnN0IHVzZWRGaWxlQ29udGVudHMgPSB1c2VkTW9kdWxlcy5tYXAoIHVzZWRNb2R1bGUgPT4gZnMucmVhZEZpbGVTeW5jKCBgLi4vJHt1c2VkTW9kdWxlfWAsICd1dGYtOCcgKSApO1xyXG5cclxuICAvLyBDb21wdXRlIHdoaWNoIHJlcG9zaXRvcmllcyBjb250YWluIG9uZSBtb3JlIG1vcmUgdXNlZCBzdHJpbmdzIChzaW5jZSB3ZSdsbCBuZWVkIHRvIGxvYWQgc3RyaW5nIGZpbGVzIGZvciB0aG9zZVxyXG4gIC8vIHJlcG9zaXRvcmllcykuXHJcbiAgbGV0IHJlcG9zV2l0aFVzZWRTdHJpbmdzID0gW107XHJcbiAgdXNlZEZpbGVDb250ZW50cy5mb3JFYWNoKCBmaWxlQ29udGVudCA9PiB7XHJcbiAgICAvLyBbYS16QS1aXyRdW2EtekEtWjAtOV8kXSAtLS0tIGdlbmVyYWwgSlMgaWRlbnRpZmllcnMsIGZpcnN0IGNoYXJhY3RlciBjYW4ndCBiZSBhIG51bWJlclxyXG4gICAgLy8gW15cXG5cXHJdIC0tLS0gZ3JhYiBldmVyeXRoaW5nIGV4Y2VwdCBmb3IgbmV3bGluZXMgaGVyZSwgc28gd2UgZ2V0IGV2ZXJ5dGhpbmdcclxuICAgIGNvbnN0IGFsbEltcG9ydFN0YXRlbWVudHMgPSBmaWxlQ29udGVudC5tYXRjaCggL2ltcG9ydCBbYS16QS1aXyRdW2EtekEtWjAtOV8kXSpTdHJpbmdzIGZyb20gJ1teXFxuXFxyXStTdHJpbmdzLmpzJzsvZyApO1xyXG4gICAgaWYgKCBhbGxJbXBvcnRTdGF0ZW1lbnRzICkge1xyXG4gICAgICByZXBvc1dpdGhVc2VkU3RyaW5ncy5wdXNoKCAuLi5hbGxJbXBvcnRTdGF0ZW1lbnRzLm1hcCggaW1wb3J0U3RhdGVtZW50ID0+IHtcclxuICAgICAgICAvLyBHcmFicyBvdXQgdGhlIHByZWZpeCBiZWZvcmUgYFN0cmluZ3MuanNgICh3aXRob3V0IHRoZSBsZWFkaW5nIHNsYXNoIHRvbylcclxuICAgICAgICBjb25zdCBpbXBvcnROYW1lID0gaW1wb3J0U3RhdGVtZW50Lm1hdGNoKCAvXFwvKFtcXHctXSspU3RyaW5nc1xcLmpzLyApWyAxIF07XHJcblxyXG4gICAgICAgIC8vIGtlYmFiIGNhc2UgdGhlIHJlcG9cclxuICAgICAgICByZXR1cm4gXy5rZWJhYkNhc2UoIGltcG9ydE5hbWUgKTtcclxuICAgICAgfSApICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG4gIHJlcG9zV2l0aFVzZWRTdHJpbmdzID0gXy51bmlxKCByZXBvc1dpdGhVc2VkU3RyaW5ncyApLmZpbHRlciggcmVwbyA9PiB7XHJcbiAgICByZXR1cm4gZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gQ29tcHV0ZSBhIG1hcCBvZiB7cmVwbzpzdHJpbmd9ID0+IHtyZXF1aXJlanNOYW1lcHNhY2U6c3RyaW5nfSwgc28gd2UgY2FuIGNvbnN0cnVjdCBmdWxsIHN0cmluZyBrZXlzIGZyb20gc3RyaW5nc1xyXG4gIC8vIHRoYXQgd291bGQgYmUgYWNjZXNzaW5nIHRoZW0sIGUuZy4gYEpvaXN0U3RyaW5ncy5SZXNldEFsbEJ1dHRvbi5uYW1lYCA9PiBgSk9JU1QvUmVzZXRBbGxCdXR0b24ubmFtZWAuXHJcbiAgY29uc3QgcmVxdWlyZWpzTmFtZXNwYWNlTWFwID0ge307XHJcbiAgcmVwb3NXaXRoVXNlZFN0cmluZ3MuZm9yRWFjaCggcmVwbyA9PiB7XHJcbiAgICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gLCAndXRmLTgnICkgKTtcclxuICAgIHJlcXVpcmVqc05hbWVzcGFjZU1hcFsgcmVwbyBdID0gcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZTtcclxuICB9ICk7XHJcblxyXG4gIC8vIExvYWQgYWxsIHRoZSByZXF1aXJlZCBzdHJpbmcgZmlsZXMgaW50byBtZW1vcnksIHNvIHdlIGRvbid0IGxvYWQgdGhlbSBtdWx0aXBsZSB0aW1lcyAoZm9yIGVhY2ggdXNhZ2UpXHJcbiAgLy8gbWFwcyBbcmVwb3NpdG9yeU5hbWVdW2xvY2FsZV0gPT4gY29udGVudHMgb2YgbG9jYWxlIHN0cmluZyBmaWxlXHJcbiAgY29uc3Qgc3RyaW5nRmlsZXNDb250ZW50cyA9IGdldFN0cmluZ0ZpbGVzQ29udGVudHMoIHJlcG9zV2l0aFVzZWRTdHJpbmdzLCBsb2NhbGVzICk7XHJcblxyXG4gIC8vIEluaXRpYWxpemUgb3VyIGZ1bGwgc3RyaW5nTWFwIG9iamVjdCAod2hpY2ggd2lsbCBiZSBmaWxsZWQgd2l0aCByZXN1bHRzIGFuZCB0aGVuIHJldHVybmVkIGFzIG91ciBzdHJpbmcgbWFwKS5cclxuICBjb25zdCBzdHJpbmdNYXAgPSB7fTtcclxuICBjb25zdCBzdHJpbmdNZXRhZGF0YSA9IHt9O1xyXG4gIGxvY2FsZXMuZm9yRWFjaCggbG9jYWxlID0+IHtcclxuICAgIHN0cmluZ01hcFsgbG9jYWxlIF0gPSB7fTtcclxuICB9ICk7XHJcblxyXG4gIC8vIGNvbWJpbmUgb3VyIHN0cmluZ3MgaW50byBbbG9jYWxlXVtzdHJpbmdLZXldIG1hcCwgdXNpbmcgdGhlIGZhbGxiYWNrIGxvY2FsZSB3aGVyZSBuZWNlc3NhcnkuIEluIHJlZ2FyZHMgdG8gbmVzdGVkXHJcbiAgLy8gc3RyaW5ncywgdGhpcyBkYXRhIHN0cnVjdHVyZSBkb2Vzbid0IG5lc3QuIEluc3RlYWQgaXQgZ2V0cyBuZXN0ZWQgc3RyaW5nIHZhbHVlcywgYW5kIHRoZW4gc2V0cyB0aGVtIHdpdGggdGhlXHJcbiAgLy8gZmxhdCBrZXkgc3RyaW5nIGxpa2UgYFwiRlJJQ1RJT04vYTExeS5zb21lLnN0cmluZy5oZXJlXCI6IHsgdmFsdWU6ICdNeSBTb21lIFN0cmluZycgfWBcclxuICByZXBvc1dpdGhVc2VkU3RyaW5ncy5mb3JFYWNoKCByZXBvID0+IHtcclxuXHJcbiAgICAvLyBTY2FuIGFsbCBvZiB0aGUgZmlsZXMgd2l0aCBzdHJpbmcgbW9kdWxlIHJlZmVyZW5jZXMsIHNjYW5uaW5nIGZvciBhbnl0aGluZyB0aGF0IGxvb2tzIGxpa2UgYSBzdHJpbmcgYWNjZXNzIGZvclxyXG4gICAgLy8gb3VyIHJlcG8uIFRoaXMgd2lsbCBpbmNsdWRlIHRoZSBzdHJpbmcgbW9kdWxlIHJlZmVyZW5jZSwgZS5nLiBgSm9pc3RTdHJpbmdzLlJlc2V0QWxsQnV0dG9uLm5hbWVgLCBidXQgY291bGQgYWxzb1xyXG4gICAgLy8gaW5jbHVkZSBzbGlnaHRseSBtb3JlIChzaW5jZSB3ZSdyZSBzdHJpbmcgcGFyc2luZyksIGUuZy4gYEpvaXN0U3RyaW5ncy5SZXNldEFsbEJ1dHRvbi5uYW1lLmxlbmd0aGAgd291bGQgYmVcclxuICAgIC8vIGluY2x1ZGVkLCBldmVuIHRob3VnaCBvbmx5IHBhcnQgb2YgdGhhdCBpcyBhIHN0cmluZyBhY2Nlc3MuXHJcbiAgICBsZXQgc3RyaW5nQWNjZXNzZXMgPSBbXTtcclxuXHJcbiAgICBjb25zdCBwcmVmaXggPSBgJHtwYXNjYWxDYXNlKCByZXBvICl9U3RyaW5nc2A7IC8vIGUuZy4gSm9pc3RTdHJpbmdzXHJcbiAgICB1c2VkRmlsZUNvbnRlbnRzLmZvckVhY2goICggZmlsZUNvbnRlbnQsIGkgKSA9PiB7XHJcbiAgICAgIC8vIE9ubHkgc2NhbiBmaWxlcyB3aGVyZSB3ZSBjYW4gaWRlbnRpZnkgYW4gaW1wb3J0IGZvciBpdFxyXG4gICAgICBpZiAoIGZpbGVDb250ZW50LmluY2x1ZGVzKCBgaW1wb3J0ICR7cHJlZml4fSBmcm9tYCApICkge1xyXG5cclxuICAgICAgICAvLyBMb29rIGZvciBub3JtYWwgbWF0Y2hlcywgZS5nLiBgSm9pc3RTdHJpbmdzLmAgZm9sbG93ZWQgYnkgb25lIG9yIG1vcmUgY2h1bmtzIGxpa2U6XHJcbiAgICAgICAgLy8gLnNvbWV0aGluZ1ZhZ3VlbHlfYWxwaGFOdW0zcjFjXHJcbiAgICAgICAgLy8gWyAnYVN0cmluZ0luQnJhY2tldHNCZWNhdXNlT2ZTcGVjaWFsQ2hhcmFjdGVycycgXVxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gSXQgd2lsbCBhbHNvIHRoZW4gZW5kIG9uIGFueXRoaW5nIHRoYXQgZG9lc24ndCBsb29rIGxpa2UgYW5vdGhlciBvbmUgb2YgdGhvc2UgY2h1bmtzXHJcbiAgICAgICAgLy8gW2EtekEtWl8kXVthLXpBLVowLTlfJF0qIC0tLS0gdGhpcyBncmFicyB0aGluZ3MgdGhhdCBsb29rcyBsaWtlIHZhbGlkIEpTIGlkZW50aWZpZXJzXHJcbiAgICAgICAgLy8gXFxcXFsgJ1teJ10rJyBcXFxcXSkrIC0tLS0gdGhpcyBncmFicyB0aGluZ3MgbGlrZSBvdXIgc2Vjb25kIGNhc2UgYWJvdmVcclxuICAgICAgICAvLyBbXlxcXFwuXFxcXFtdIC0tLS0gbWF0Y2hlcyBzb21ldGhpbmcgYXQgdGhlIGVuZCB0aGF0IGlzIE5PVCBlaXRoZXIgb2YgdGhvc2Ugb3RoZXIgdHdvIGNhc2VzXHJcbiAgICAgICAgLy8gSXQgaXMgYWxzbyBnZW5lcmFsaXplZCB0byBzdXBwb3J0IGFyYml0cmFyeSB3aGl0ZXNwYWNlIGFuZCByZXF1aXJlcyB0aGF0ICcgbWF0Y2ggJyBvciBcIiBtYXRjaCBcIiwgc2luY2VcclxuICAgICAgICAvLyB0aGlzIG11c3Qgc3VwcG9ydCBKUyBjb2RlIGFuZCBtaW5pZmllZCBUeXBlU2NyaXB0IGNvZGVcclxuICAgICAgICAvLyBNYXRjaGVzIG9uZSBmaW5hbCBjaGFyYWN0ZXIgdGhhdCBpcyBub3QgJy4nIG9yICdbJywgc2luY2UgYW55IHZhbGlkIHN0cmluZyBhY2Nlc3NlcyBzaG91bGQgTk9UIGhhdmUgdGhhdFxyXG4gICAgICAgIC8vIGFmdGVyLiBOT1RFOiB0aGVyZSBhcmUgc29tZSBkZWdlbmVyYXRlIGNhc2VzIHRoYXQgd2lsbCBicmVhayB0aGlzLCBlLmcuOlxyXG4gICAgICAgIC8vIC0gSm9pc3RTdHJpbmdzLnNvbWVTdHJpbmdQcm9wZXJ0eVsgMCBdXHJcbiAgICAgICAgLy8gLSBKb2lzdFN0cmluZ3Muc29tZXRoaW5nWyAwIF1cclxuICAgICAgICAvLyAtIEpvaXN0U3RyaW5ncy5zb21ldGhpbmdbICdsZW5ndGgnIF1cclxuICAgICAgICBjb25zdCBtYXRjaGVzID0gZmlsZUNvbnRlbnQubWF0Y2goIG5ldyBSZWdFeHAoIGAke3ByZWZpeH0oXFxcXC5bYS16QS1aXyRdW2EtekEtWjAtOV8kXSp8XFxcXFtcXFxccypbJ1wiXVteJ1wiXStbJ1wiXVxcXFxzKlxcXFxdKStbXlxcXFwuXFxcXFtdYCwgJ2cnICkgKTtcclxuICAgICAgICBpZiAoIG1hdGNoZXMgKSB7XHJcbiAgICAgICAgICBzdHJpbmdBY2Nlc3Nlcy5wdXNoKCAuLi5tYXRjaGVzLm1hcCggbWF0Y2ggPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hcclxuICAgICAgICAgICAgICAvLyBXZSBhbHdheXMgaGF2ZSB0byBzdHJpcCBvZmYgdGhlIGxhc3QgY2hhcmFjdGVyIC0gaXQncyBhIGNoYXJhY3RlciB0aGF0IHNob3VsZG4ndCBiZSBpbiBhIHN0cmluZyBhY2Nlc3NcclxuICAgICAgICAgICAgICAuc2xpY2UoIDAsIG1hdGNoLmxlbmd0aCAtIDEgKVxyXG4gICAgICAgICAgICAgIC8vIEhhbmRsZSBKb2lzdFN0cmluZ3NbICdzb21lLXRoaW5nU3RyaW5nUHJvcGVydHknIF0udmFsdWUgPT4gSm9pc3RTdHJpbmdzWyAnc29tZS10aGluZycgXVxyXG4gICAgICAgICAgICAgIC8vIC0tIEFueXRoaW5nIGFmdGVyIFN0cmluZ1Byb3BlcnR5IHNob3VsZCBnb1xyXG4gICAgICAgICAgICAgIC8vIGF3YXksIGJ1dCB3ZSBuZWVkIHRvIGFkZCB0aGUgZmluYWwgJ10gdG8gbWFpbnRhaW4gdGhlIGZvcm1hdFxyXG4gICAgICAgICAgICAgIC5yZXBsYWNlKCAvU3RyaW5nUHJvcGVydHknXS4qLywgJ1xcJ10nIClcclxuICAgICAgICAgICAgICAvLyBIYW5kbGUgSm9pc3RTdHJpbmdzLnNvbWV0aGluZ1N0cmluZ1Byb3BlcnR5LnZhbHVlID0+IEpvaXN0U3RyaW5ncy5zb21ldGhpbmdcclxuICAgICAgICAgICAgICAucmVwbGFjZSggL1N0cmluZ1Byb3BlcnR5LiovLCAnJyApO1xyXG4gICAgICAgICAgfSApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gU3RyaXAgb2ZmIG91ciBwcmVmaXhlcywgc28gb3VyIHN0cmluZ0FjY2Vzc2VzIHdpbGwgaGF2ZSB0aGluZ3MgbGlrZSBgJ1Jlc2V0QWxsQnV0dG9uLm5hbWUnYCBpbnNpZGUuXHJcbiAgICBzdHJpbmdBY2Nlc3NlcyA9IF8udW5pcSggc3RyaW5nQWNjZXNzZXMgKS5tYXAoIHN0ciA9PiBzdHIuc2xpY2UoIHByZWZpeC5sZW5ndGggKSApO1xyXG5cclxuICAgIC8vIFRoZSBKUyBvdXRwdXR0ZWQgYnkgVFMgaXMgbWluaWZpZWQgYW5kIG1pc3NpbmcgdGhlIHdoaXRlc3BhY2VcclxuICAgIGNvbnN0IGRlcHRoID0gMjtcclxuXHJcbiAgICAvLyBUdXJuIGVhY2ggc3RyaW5nIGFjY2VzcyBpbnRvIGFuIGFycmF5IG9mIHBhcnRzLCBlLmcuICcuUmVzZXRBbGxCdXR0b24ubmFtZScgPT4gWyAnUmVzZXRBbGxCdXR0b24nLCAnbmFtZScgXVxyXG4gICAgLy8gb3IgJ1sgXFwnQVxcJyBdLkJbIFxcJ0NcXCcgXScgPT4gWyAnQScsICdCJywgJ0MnIF1cclxuICAgIC8vIFJlZ2V4IGdyYWJzIGVpdGhlciBgLmlkZW50aWZpZXJgIG9yIGBbICd0ZXh0JyBdYC5cclxuICAgIGNvbnN0IHN0cmluZ0tleXNCeVBhcnRzID0gc3RyaW5nQWNjZXNzZXMubWFwKCBhY2Nlc3MgPT4gYWNjZXNzLm1hdGNoKCAvXFwuW2EtekEtWl8kXVthLXpBLVowLTlfJF0qfFxcW1xccypbJ1wiXVteJ1wiXStbJ1wiXVxccypcXF0vZyApLm1hcCggdG9rZW4gPT4ge1xyXG4gICAgICByZXR1cm4gdG9rZW4uc3RhcnRzV2l0aCggJy4nICkgPyB0b2tlbi5zbGljZSggMSApIDogdG9rZW4uc2xpY2UoIGRlcHRoLCB0b2tlbi5sZW5ndGggLSBkZXB0aCApO1xyXG4gICAgfSApICk7XHJcblxyXG4gICAgLy8gQ29uY2F0ZW5hdGUgdGhlIHN0cmluZyBwYXJ0cyBmb3IgZWFjaCBhY2Nlc3MgaW50byBzb21ldGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgcGFydGlhbCBzdHJpbmcga2V5LCBlLmcuXHJcbiAgICAvLyBbICdSZXNldEFsbEJ1dHRvbicsICduYW1lJyBdID0+ICdSZXNldEFsbEJ1dHRvbi5uYW1lJ1xyXG4gICAgY29uc3QgcGFydGlhbFN0cmluZ0tleXMgPSBfLnVuaXEoIHN0cmluZ0tleXNCeVBhcnRzLm1hcCggcGFydHMgPT4gcGFydHMuam9pbiggJy4nICkgKSApLmZpbHRlcigga2V5ID0+IGtleSAhPT0gJ2pzJyApO1xyXG5cclxuICAgIC8vIEZvciBlYWNoIHN0cmluZyBrZXkgYW5kIGxvY2FsZSwgd2UnbGwgbG9vayB1cCB0aGUgc3RyaW5nIGVudHJ5IGFuZCBmaWxsIGl0IGludG8gdGhlIHN0cmluZ01hcFxyXG4gICAgcGFydGlhbFN0cmluZ0tleXMuZm9yRWFjaCggcGFydGlhbFN0cmluZ0tleSA9PiB7XHJcbiAgICAgIGxvY2FsZXMuZm9yRWFjaCggbG9jYWxlID0+IHtcclxuICAgICAgICBsZXQgc3RyaW5nRW50cnkgPSBudWxsO1xyXG4gICAgICAgIGZvciAoIGNvbnN0IGZhbGxiYWNrTG9jYWxlIG9mIGxvY2FsZUZhbGxiYWNrcyggbG9jYWxlICkgKSB7XHJcbiAgICAgICAgICBjb25zdCBzdHJpbmdGaWxlQ29udGVudHMgPSBzdHJpbmdGaWxlc0NvbnRlbnRzWyByZXBvIF1bIGZhbGxiYWNrTG9jYWxlIF07XHJcbiAgICAgICAgICBpZiAoIHN0cmluZ0ZpbGVDb250ZW50cyApIHtcclxuICAgICAgICAgICAgc3RyaW5nRW50cnkgPSBDaGlwcGVyU3RyaW5nVXRpbHMuZ2V0U3RyaW5nRW50cnlGcm9tTWFwKCBzdHJpbmdGaWxlQ29udGVudHMsIHBhcnRpYWxTdHJpbmdLZXkgKTtcclxuICAgICAgICAgICAgaWYgKCBzdHJpbmdFbnRyeSApIHtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICFwYXJ0aWFsU3RyaW5nS2V5LmVuZHNXaXRoKCAnU3RyaW5nUHJvcGVydHknICkgKSB7XHJcbiAgICAgICAgICBhc3NlcnQoIHN0cmluZ0VudHJ5ICE9PSBudWxsLCBgTWlzc2luZyBzdHJpbmcgaW5mb3JtYXRpb24gZm9yICR7cmVwb30gJHtwYXJ0aWFsU3RyaW5nS2V5fWAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBzdHJpbmdLZXkgPSBgJHtyZXF1aXJlanNOYW1lc3BhY2VNYXBbIHJlcG8gXX0vJHtwYXJ0aWFsU3RyaW5nS2V5fWA7XHJcbiAgICAgICAgICBzdHJpbmdNYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXSA9IHN0cmluZ0VudHJ5LnZhbHVlO1xyXG4gICAgICAgICAgaWYgKCBzdHJpbmdFbnRyeS5tZXRhZGF0YSAmJiBsb2NhbGUgPT09IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFICkge1xyXG4gICAgICAgICAgICBzdHJpbmdNZXRhZGF0YVsgc3RyaW5nS2V5IF0gPSBzdHJpbmdFbnRyeS5tZXRhZGF0YTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuICB9ICk7XHJcblxyXG4gIHJldHVybiB7IHN0cmluZ01hcDogc3RyaW5nTWFwLCBzdHJpbmdNZXRhZGF0YTogc3RyaW5nTWV0YWRhdGEgfTtcclxufTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxJQUFNQSxDQUFDLEdBQUdDLE9BQU8sQ0FBRSxR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