// Copyright 2015-2024, University of Colorado Boulder

/**
 * Returns a map such that map["locale"]["REPO/stringKey"] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const _ = require('lodash');
const assert = require('assert');
const ChipperConstants = require('../common/ChipperConstants');
const pascalCase = require('../common/pascalCase');
const ChipperStringUtils = require('../common/ChipperStringUtils');
const fs = require('fs');
const grunt = require('grunt');
const localeInfo = require('../data/localeInfo'); // Locale information
const path = require('path');

/**
 * Load all the required string files into memory, so we don't load them multiple times (for each usage).
 *
 * @param {Array.<string>} reposWithUsedStrings - All of the repos that have 1+ used strings
 * @param {Array.<string>} locales - All supported locales for this build
 * @returns {Object} - maps {locale:string} => Another map with: {stringKey:string} => {stringValue:string}
 */
const getStringFilesContents = (reposWithUsedStrings, locales) => {
  const stringFilesContents = {}; // maps [repositoryName][locale] => contents of locale string file

  reposWithUsedStrings.forEach(repo => {
    stringFilesContents[repo] = {};

    /**
     * Adds a locale into our stringFilesContents map.
     *
     * @param {string} locale
     * @param {boolean} isRTL
     */
    const addLocale = (locale, isRTL) => {
      // Read optional string file
      const stringsFilename = path.normalize(`../${locale === ChipperConstants.FALLBACK_LOCALE ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json`);
      let fileContents;
      try {
        fileContents = grunt.file.readJSON(stringsFilename);
      } catch (error) {
        grunt.log.debug(`missing string file: ${stringsFilename}`);
        fileContents = {};
      }

      // Format the string values
      ChipperStringUtils.formatStringValues(fileContents, isRTL);
      stringFilesContents[repo][locale] = fileContents;
    };
    locales.forEach(locale => {
      assert(localeInfo[locale], `unsupported locale: ${locale}`);
      const isRTL = localeInfo[locale].direction === 'rtl';

      // Handle fallback locales
      addLocale(locale, isRTL);
      if (locale.length > 2) {
        const middleLocale = locale.slice(0, 2);
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
  const localeFallbacks = locale => {
    return [...(locale !== ChipperConstants.FALLBACK_LOCALE ? [locale] : []),
    // e.g. 'zh_CN'
    ...(locale.length > 2 && locale.slice(0, 2) !== ChipperConstants.FALLBACK_LOCALE ? [locale.slice(0, 2)] : []),
    // e.g. 'zh'
    ChipperConstants.FALLBACK_LOCALE // e.g. 'en'
    ];
  };

  // Load the file contents of every single JS module that used any strings
  const usedFileContents = usedModules.map(usedModule => fs.readFileSync(`../${usedModule}`, 'utf-8'));

  // Compute which repositories contain one more more used strings (since we'll need to load string files for those
  // repositories).
  let reposWithUsedStrings = [];
  usedFileContents.forEach(fileContent => {
    // [a-zA-Z_$][a-zA-Z0-9_$] ---- general JS identifiers, first character can't be a number
    // [^\n\r] ---- grab everything except for newlines here, so we get everything
    const allImportStatements = fileContent.match(/import [a-zA-Z_$][a-zA-Z0-9_$]*Strings from '[^\n\r]+Strings.js';/g);
    if (allImportStatements) {
      reposWithUsedStrings.push(...allImportStatements.map(importStatement => {
        // Grabs out the prefix before `Strings.js` (without the leading slash too)
        const importName = importStatement.match(/\/([\w-]+)Strings\.js/)[1];

        // kebab case the repo
        return _.kebabCase(importName);
      }));
    }
  });
  reposWithUsedStrings = _.uniq(reposWithUsedStrings).filter(repo => {
    return fs.existsSync(`../${repo}/package.json`);
  });

  // Compute a map of {repo:string} => {requirejsNamepsace:string}, so we can construct full string keys from strings
  // that would be accessing them, e.g. `JoistStrings.ResetAllButton.name` => `JOIST/ResetAllButton.name`.
  const requirejsNamespaceMap = {};
  reposWithUsedStrings.forEach(repo => {
    const packageObject = JSON.parse(fs.readFileSync(`../${repo}/package.json`, 'utf-8'));
    requirejsNamespaceMap[repo] = packageObject.phet.requirejsNamespace;
  });

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  // maps [repositoryName][locale] => contents of locale string file
  const stringFilesContents = getStringFilesContents(reposWithUsedStrings, locales);

  // Initialize our full stringMap object (which will be filled with results and then returned as our string map).
  const stringMap = {};
  const stringMetadata = {};
  locales.forEach(locale => {
    stringMap[locale] = {};
  });

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary. In regards to nested
  // strings, this data structure doesn't nest. Instead it gets nested string values, and then sets them with the
  // flat key string like `"FRICTION/a11y.some.string.here": { value: 'My Some String' }`
  reposWithUsedStrings.forEach(repo => {
    // Scan all of the files with string module references, scanning for anything that looks like a string access for
    // our repo. This will include the string module reference, e.g. `JoistStrings.ResetAllButton.name`, but could also
    // include slightly more (since we're string parsing), e.g. `JoistStrings.ResetAllButton.name.length` would be
    // included, even though only part of that is a string access.
    let stringAccesses = [];
    const prefix = `${pascalCase(repo)}Strings`; // e.g. JoistStrings
    usedFileContents.forEach((fileContent, i) => {
      // Only scan files where we can identify an import for it
      if (fileContent.includes(`import ${prefix} from`)) {
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
        const matches = fileContent.match(new RegExp(`${prefix}(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[\\s*['"][^'"]+['"]\\s*\\])+[^\\.\\[]`, 'g'));
        if (matches) {
          stringAccesses.push(...matches.map(match => {
            return match
            // We always have to strip off the last character - it's a character that shouldn't be in a string access
            .slice(0, match.length - 1)
            // Handle JoistStrings[ 'some-thingStringProperty' ].value => JoistStrings[ 'some-thing' ]
            // -- Anything after StringProperty should go
            // away, but we need to add the final '] to maintain the format
            .replace(/StringProperty'].*/, '\']')
            // Handle JoistStrings.somethingStringProperty.value => JoistStrings.something
            .replace(/StringProperty.*/, '');
          }));
        }
      }
    });

    // Strip off our prefixes, so our stringAccesses will have things like `'ResetAllButton.name'` inside.
    stringAccesses = _.uniq(stringAccesses).map(str => str.slice(prefix.length));

    // The JS outputted by TS is minified and missing the whitespace
    const depth = 2;

    // Turn each string access into an array of parts, e.g. '.ResetAllButton.name' => [ 'ResetAllButton', 'name' ]
    // or '[ \'A\' ].B[ \'C\' ]' => [ 'A', 'B', 'C' ]
    // Regex grabs either `.identifier` or `[ 'text' ]`.
    const stringKeysByParts = stringAccesses.map(access => access.match(/\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\s*['"][^'"]+['"]\s*\]/g).map(token => {
      return token.startsWith('.') ? token.slice(1) : token.slice(depth, token.length - depth);
    }));

    // Concatenate the string parts for each access into something that looks like a partial string key, e.g.
    // [ 'ResetAllButton', 'name' ] => 'ResetAllButton.name'
    const partialStringKeys = _.uniq(stringKeysByParts.map(parts => parts.join('.'))).filter(key => key !== 'js');

    // For each string key and locale, we'll look up the string entry and fill it into the stringMap
    partialStringKeys.forEach(partialStringKey => {
      locales.forEach(locale => {
        let stringEntry = null;
        for (const fallbackLocale of localeFallbacks(locale)) {
          const stringFileContents = stringFilesContents[repo][fallbackLocale];
          if (stringFileContents) {
            stringEntry = ChipperStringUtils.getStringEntryFromMap(stringFileContents, partialStringKey);
            if (stringEntry) {
              break;
            }
          }
        }
        if (!partialStringKey.endsWith('StringProperty')) {
          assert(stringEntry !== null, `Missing string information for ${repo} ${partialStringKey}`);
          const stringKey = `${requirejsNamespaceMap[repo]}/${partialStringKey}`;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsIkNoaXBwZXJDb25zdGFudHMiLCJwYXNjYWxDYXNlIiwiQ2hpcHBlclN0cmluZ1V0aWxzIiwiZnMiLCJncnVudCIsImxvY2FsZUluZm8iLCJwYXRoIiwiZ2V0U3RyaW5nRmlsZXNDb250ZW50cyIsInJlcG9zV2l0aFVzZWRTdHJpbmdzIiwibG9jYWxlcyIsInN0cmluZ0ZpbGVzQ29udGVudHMiLCJmb3JFYWNoIiwicmVwbyIsImFkZExvY2FsZSIsImxvY2FsZSIsImlzUlRMIiwic3RyaW5nc0ZpbGVuYW1lIiwibm9ybWFsaXplIiwiRkFMTEJBQ0tfTE9DQUxFIiwiZmlsZUNvbnRlbnRzIiwiZmlsZSIsInJlYWRKU09OIiwiZXJyb3IiLCJsb2ciLCJkZWJ1ZyIsImZvcm1hdFN0cmluZ1ZhbHVlcyIsImRpcmVjdGlvbiIsImxlbmd0aCIsIm1pZGRsZUxvY2FsZSIsInNsaWNlIiwiaW5jbHVkZXMiLCJtb2R1bGUiLCJleHBvcnRzIiwibWFpblJlcG8iLCJwaGV0TGlicyIsInVzZWRNb2R1bGVzIiwiaW5kZXhPZiIsImxvY2FsZUZhbGxiYWNrcyIsInVzZWRGaWxlQ29udGVudHMiLCJtYXAiLCJ1c2VkTW9kdWxlIiwicmVhZEZpbGVTeW5jIiwiZmlsZUNvbnRlbnQiLCJhbGxJbXBvcnRTdGF0ZW1lbnRzIiwibWF0Y2giLCJwdXNoIiwiaW1wb3J0U3RhdGVtZW50IiwiaW1wb3J0TmFtZSIsImtlYmFiQ2FzZSIsInVuaXEiLCJmaWx0ZXIiLCJleGlzdHNTeW5jIiwicmVxdWlyZWpzTmFtZXNwYWNlTWFwIiwicGFja2FnZU9iamVjdCIsIkpTT04iLCJwYXJzZSIsInBoZXQiLCJyZXF1aXJlanNOYW1lc3BhY2UiLCJzdHJpbmdNYXAiLCJzdHJpbmdNZXRhZGF0YSIsInN0cmluZ0FjY2Vzc2VzIiwicHJlZml4IiwiaSIsIm1hdGNoZXMiLCJSZWdFeHAiLCJyZXBsYWNlIiwic3RyIiwiZGVwdGgiLCJzdHJpbmdLZXlzQnlQYXJ0cyIsImFjY2VzcyIsInRva2VuIiwic3RhcnRzV2l0aCIsInBhcnRpYWxTdHJpbmdLZXlzIiwicGFydHMiLCJqb2luIiwia2V5IiwicGFydGlhbFN0cmluZ0tleSIsInN0cmluZ0VudHJ5IiwiZmFsbGJhY2tMb2NhbGUiLCJzdHJpbmdGaWxlQ29udGVudHMiLCJnZXRTdHJpbmdFbnRyeUZyb21NYXAiLCJlbmRzV2l0aCIsInN0cmluZ0tleSIsInZhbHVlIiwibWV0YWRhdGEiXSwic291cmNlcyI6WyJnZXRTdHJpbmdNYXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIG1hcCBzdWNoIHRoYXQgbWFwW1wibG9jYWxlXCJdW1wiUkVQTy9zdHJpbmdLZXlcIl0gd2lsbCBiZSB0aGUgc3RyaW5nIHZhbHVlICh3aXRoIGZhbGxiYWNrcyB0byBFbmdsaXNoIHdoZXJlIG5lZWRlZCkuXHJcbiAqIExvYWRzIGVhY2ggc3RyaW5nIGZpbGUgb25seSBvbmNlLCBhbmQgb25seSBsb2FkcyB0aGUgcmVwb3NpdG9yeS9sb2NhbGUgY29tYmluYXRpb25zIG5lY2Vzc2FyeS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuY29uc3QgQ2hpcHBlckNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi9jb21tb24vQ2hpcHBlckNvbnN0YW50cycgKTtcclxuY29uc3QgcGFzY2FsQ2FzZSA9IHJlcXVpcmUoICcuLi9jb21tb24vcGFzY2FsQ2FzZScgKTtcclxuY29uc3QgQ2hpcHBlclN0cmluZ1V0aWxzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9DaGlwcGVyU3RyaW5nVXRpbHMnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuY29uc3QgbG9jYWxlSW5mbyA9IHJlcXVpcmUoICcuLi9kYXRhL2xvY2FsZUluZm8nICk7IC8vIExvY2FsZSBpbmZvcm1hdGlvblxyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcblxyXG4vKipcclxuICogTG9hZCBhbGwgdGhlIHJlcXVpcmVkIHN0cmluZyBmaWxlcyBpbnRvIG1lbW9yeSwgc28gd2UgZG9uJ3QgbG9hZCB0aGVtIG11bHRpcGxlIHRpbWVzIChmb3IgZWFjaCB1c2FnZSkuXHJcbiAqXHJcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHJlcG9zV2l0aFVzZWRTdHJpbmdzIC0gQWxsIG9mIHRoZSByZXBvcyB0aGF0IGhhdmUgMSsgdXNlZCBzdHJpbmdzXHJcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGxvY2FsZXMgLSBBbGwgc3VwcG9ydGVkIGxvY2FsZXMgZm9yIHRoaXMgYnVpbGRcclxuICogQHJldHVybnMge09iamVjdH0gLSBtYXBzIHtsb2NhbGU6c3RyaW5nfSA9PiBBbm90aGVyIG1hcCB3aXRoOiB7c3RyaW5nS2V5OnN0cmluZ30gPT4ge3N0cmluZ1ZhbHVlOnN0cmluZ31cclxuICovXHJcbmNvbnN0IGdldFN0cmluZ0ZpbGVzQ29udGVudHMgPSAoIHJlcG9zV2l0aFVzZWRTdHJpbmdzLCBsb2NhbGVzICkgPT4ge1xyXG4gIGNvbnN0IHN0cmluZ0ZpbGVzQ29udGVudHMgPSB7fTsgLy8gbWFwcyBbcmVwb3NpdG9yeU5hbWVdW2xvY2FsZV0gPT4gY29udGVudHMgb2YgbG9jYWxlIHN0cmluZyBmaWxlXHJcblxyXG4gIHJlcG9zV2l0aFVzZWRTdHJpbmdzLmZvckVhY2goIHJlcG8gPT4ge1xyXG4gICAgc3RyaW5nRmlsZXNDb250ZW50c1sgcmVwbyBdID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgbG9jYWxlIGludG8gb3VyIHN0cmluZ0ZpbGVzQ29udGVudHMgbWFwLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhbGVcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNSVExcclxuICAgICAqL1xyXG4gICAgY29uc3QgYWRkTG9jYWxlID0gKCBsb2NhbGUsIGlzUlRMICkgPT4ge1xyXG4gICAgICAvLyBSZWFkIG9wdGlvbmFsIHN0cmluZyBmaWxlXHJcbiAgICAgIGNvbnN0IHN0cmluZ3NGaWxlbmFtZSA9IHBhdGgubm9ybWFsaXplKCBgLi4vJHtsb2NhbGUgPT09IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFID8gJycgOiAnYmFiZWwvJ30ke3JlcG99LyR7cmVwb30tc3RyaW5nc18ke2xvY2FsZX0uanNvbmAgKTtcclxuICAgICAgbGV0IGZpbGVDb250ZW50cztcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBmaWxlQ29udGVudHMgPSBncnVudC5maWxlLnJlYWRKU09OKCBzdHJpbmdzRmlsZW5hbWUgKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCggZXJyb3IgKSB7XHJcbiAgICAgICAgZ3J1bnQubG9nLmRlYnVnKCBgbWlzc2luZyBzdHJpbmcgZmlsZTogJHtzdHJpbmdzRmlsZW5hbWV9YCApO1xyXG4gICAgICAgIGZpbGVDb250ZW50cyA9IHt9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBGb3JtYXQgdGhlIHN0cmluZyB2YWx1ZXNcclxuICAgICAgQ2hpcHBlclN0cmluZ1V0aWxzLmZvcm1hdFN0cmluZ1ZhbHVlcyggZmlsZUNvbnRlbnRzLCBpc1JUTCApO1xyXG5cclxuICAgICAgc3RyaW5nRmlsZXNDb250ZW50c1sgcmVwbyBdWyBsb2NhbGUgXSA9IGZpbGVDb250ZW50cztcclxuICAgIH07XHJcblxyXG4gICAgbG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG4gICAgICBhc3NlcnQoIGxvY2FsZUluZm9bIGxvY2FsZSBdLCBgdW5zdXBwb3J0ZWQgbG9jYWxlOiAke2xvY2FsZX1gICk7XHJcbiAgICAgIGNvbnN0IGlzUlRMID0gbG9jYWxlSW5mb1sgbG9jYWxlIF0uZGlyZWN0aW9uID09PSAncnRsJztcclxuXHJcbiAgICAgIC8vIEhhbmRsZSBmYWxsYmFjayBsb2NhbGVzXHJcbiAgICAgIGFkZExvY2FsZSggbG9jYWxlLCBpc1JUTCApO1xyXG4gICAgICBpZiAoIGxvY2FsZS5sZW5ndGggPiAyICkge1xyXG4gICAgICAgIGNvbnN0IG1pZGRsZUxvY2FsZSA9IGxvY2FsZS5zbGljZSggMCwgMiApO1xyXG4gICAgICAgIGlmICggIWxvY2FsZXMuaW5jbHVkZXMoIG1pZGRsZUxvY2FsZSApICkge1xyXG4gICAgICAgICAgYWRkTG9jYWxlKCBtaWRkbGVMb2NhbGUsIGlzUlRMICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG5cclxuICByZXR1cm4gc3RyaW5nRmlsZXNDb250ZW50cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWFpblJlcG9cclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbG9jYWxlc1xyXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBwaGV0TGlicyAtIFVzZWQgdG8gY2hlY2sgZm9yIGJhZCBzdHJpbmcgZGVwZW5kZW5jaWVzXHJcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHVzZWRNb2R1bGVzIC0gcmVsYXRpdmUgZmlsZSBwYXRoIG9mIHRoZSBtb2R1bGUgKGZpbGVuYW1lKSBmcm9tIHRoZSByZXBvcyByb290XHJcbiAqXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbWFwW2xvY2FsZV1bc3RyaW5nS2V5XSA9PiB7c3RyaW5nfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggbWFpblJlcG8sIGxvY2FsZXMsIHBoZXRMaWJzLCB1c2VkTW9kdWxlcyApIHtcclxuXHJcbiAgYXNzZXJ0KCBsb2NhbGVzLmluZGV4T2YoIENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFICkgIT09IC0xLCAnZmFsbGJhY2sgbG9jYWxlIGlzIHJlcXVpcmVkJyApO1xyXG5cclxuICAvKipcclxuICAgKiBGb3IgYSBnaXZlbiBsb2NhbGUsIHJldHVybiBhbiBhcnJheSBvZiBzcGVjaWZpYyBsb2NhbGVzIHRoYXQgd2UnbGwgdXNlIGFzIGZhbGxiYWNrcywgZS5nLlxyXG4gICAqICd6aF9DTicgPT4gWyAnemhfQ04nLCAnemgnLCAnZW4nIF1cclxuICAgKiAnZXMnID0+IFsgJ2VzJywgJ2VuJyBdXHJcbiAgICogJ2VuJyA9PiBbICdlbicgXVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsZVxyXG4gICAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn1cclxuICAgKi9cclxuICBjb25zdCBsb2NhbGVGYWxsYmFja3MgPSBsb2NhbGUgPT4ge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgLi4uKCBsb2NhbGUgIT09IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFID8gWyBsb2NhbGUgXSA6IFtdICksIC8vIGUuZy4gJ3poX0NOJ1xyXG4gICAgICAuLi4oICggbG9jYWxlLmxlbmd0aCA+IDIgJiYgbG9jYWxlLnNsaWNlKCAwLCAyICkgIT09IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFICkgPyBbIGxvY2FsZS5zbGljZSggMCwgMiApIF0gOiBbXSApLCAvLyBlLmcuICd6aCdcclxuICAgICAgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgLy8gZS5nLiAnZW4nXHJcbiAgICBdO1xyXG4gIH07XHJcblxyXG4gIC8vIExvYWQgdGhlIGZpbGUgY29udGVudHMgb2YgZXZlcnkgc2luZ2xlIEpTIG1vZHVsZSB0aGF0IHVzZWQgYW55IHN0cmluZ3NcclxuICBjb25zdCB1c2VkRmlsZUNvbnRlbnRzID0gdXNlZE1vZHVsZXMubWFwKCB1c2VkTW9kdWxlID0+IGZzLnJlYWRGaWxlU3luYyggYC4uLyR7dXNlZE1vZHVsZX1gLCAndXRmLTgnICkgKTtcclxuXHJcbiAgLy8gQ29tcHV0ZSB3aGljaCByZXBvc2l0b3JpZXMgY29udGFpbiBvbmUgbW9yZSBtb3JlIHVzZWQgc3RyaW5ncyAoc2luY2Ugd2UnbGwgbmVlZCB0byBsb2FkIHN0cmluZyBmaWxlcyBmb3IgdGhvc2VcclxuICAvLyByZXBvc2l0b3JpZXMpLlxyXG4gIGxldCByZXBvc1dpdGhVc2VkU3RyaW5ncyA9IFtdO1xyXG4gIHVzZWRGaWxlQ29udGVudHMuZm9yRWFjaCggZmlsZUNvbnRlbnQgPT4ge1xyXG4gICAgLy8gW2EtekEtWl8kXVthLXpBLVowLTlfJF0gLS0tLSBnZW5lcmFsIEpTIGlkZW50aWZpZXJzLCBmaXJzdCBjaGFyYWN0ZXIgY2FuJ3QgYmUgYSBudW1iZXJcclxuICAgIC8vIFteXFxuXFxyXSAtLS0tIGdyYWIgZXZlcnl0aGluZyBleGNlcHQgZm9yIG5ld2xpbmVzIGhlcmUsIHNvIHdlIGdldCBldmVyeXRoaW5nXHJcbiAgICBjb25zdCBhbGxJbXBvcnRTdGF0ZW1lbnRzID0gZmlsZUNvbnRlbnQubWF0Y2goIC9pbXBvcnQgW2EtekEtWl8kXVthLXpBLVowLTlfJF0qU3RyaW5ncyBmcm9tICdbXlxcblxccl0rU3RyaW5ncy5qcyc7L2cgKTtcclxuICAgIGlmICggYWxsSW1wb3J0U3RhdGVtZW50cyApIHtcclxuICAgICAgcmVwb3NXaXRoVXNlZFN0cmluZ3MucHVzaCggLi4uYWxsSW1wb3J0U3RhdGVtZW50cy5tYXAoIGltcG9ydFN0YXRlbWVudCA9PiB7XHJcbiAgICAgICAgLy8gR3JhYnMgb3V0IHRoZSBwcmVmaXggYmVmb3JlIGBTdHJpbmdzLmpzYCAod2l0aG91dCB0aGUgbGVhZGluZyBzbGFzaCB0b28pXHJcbiAgICAgICAgY29uc3QgaW1wb3J0TmFtZSA9IGltcG9ydFN0YXRlbWVudC5tYXRjaCggL1xcLyhbXFx3LV0rKVN0cmluZ3NcXC5qcy8gKVsgMSBdO1xyXG5cclxuICAgICAgICAvLyBrZWJhYiBjYXNlIHRoZSByZXBvXHJcbiAgICAgICAgcmV0dXJuIF8ua2ViYWJDYXNlKCBpbXBvcnROYW1lICk7XHJcbiAgICAgIH0gKSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuICByZXBvc1dpdGhVc2VkU3RyaW5ncyA9IF8udW5pcSggcmVwb3NXaXRoVXNlZFN0cmluZ3MgKS5maWx0ZXIoIHJlcG8gPT4ge1xyXG4gICAgcmV0dXJuIGZzLmV4aXN0c1N5bmMoIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcclxuICB9ICk7XHJcblxyXG4gIC8vIENvbXB1dGUgYSBtYXAgb2Yge3JlcG86c3RyaW5nfSA9PiB7cmVxdWlyZWpzTmFtZXBzYWNlOnN0cmluZ30sIHNvIHdlIGNhbiBjb25zdHJ1Y3QgZnVsbCBzdHJpbmcga2V5cyBmcm9tIHN0cmluZ3NcclxuICAvLyB0aGF0IHdvdWxkIGJlIGFjY2Vzc2luZyB0aGVtLCBlLmcuIGBKb2lzdFN0cmluZ3MuUmVzZXRBbGxCdXR0b24ubmFtZWAgPT4gYEpPSVNUL1Jlc2V0QWxsQnV0dG9uLm5hbWVgLlxyXG4gIGNvbnN0IHJlcXVpcmVqc05hbWVzcGFjZU1hcCA9IHt9O1xyXG4gIHJlcG9zV2l0aFVzZWRTdHJpbmdzLmZvckVhY2goIHJlcG8gPT4ge1xyXG4gICAgY29uc3QgcGFja2FnZU9iamVjdCA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCwgJ3V0Zi04JyApICk7XHJcbiAgICByZXF1aXJlanNOYW1lc3BhY2VNYXBbIHJlcG8gXSA9IHBhY2thZ2VPYmplY3QucGhldC5yZXF1aXJlanNOYW1lc3BhY2U7XHJcbiAgfSApO1xyXG5cclxuICAvLyBMb2FkIGFsbCB0aGUgcmVxdWlyZWQgc3RyaW5nIGZpbGVzIGludG8gbWVtb3J5LCBzbyB3ZSBkb24ndCBsb2FkIHRoZW0gbXVsdGlwbGUgdGltZXMgKGZvciBlYWNoIHVzYWdlKVxyXG4gIC8vIG1hcHMgW3JlcG9zaXRvcnlOYW1lXVtsb2NhbGVdID0+IGNvbnRlbnRzIG9mIGxvY2FsZSBzdHJpbmcgZmlsZVxyXG4gIGNvbnN0IHN0cmluZ0ZpbGVzQ29udGVudHMgPSBnZXRTdHJpbmdGaWxlc0NvbnRlbnRzKCByZXBvc1dpdGhVc2VkU3RyaW5ncywgbG9jYWxlcyApO1xyXG5cclxuICAvLyBJbml0aWFsaXplIG91ciBmdWxsIHN0cmluZ01hcCBvYmplY3QgKHdoaWNoIHdpbGwgYmUgZmlsbGVkIHdpdGggcmVzdWx0cyBhbmQgdGhlbiByZXR1cm5lZCBhcyBvdXIgc3RyaW5nIG1hcCkuXHJcbiAgY29uc3Qgc3RyaW5nTWFwID0ge307XHJcbiAgY29uc3Qgc3RyaW5nTWV0YWRhdGEgPSB7fTtcclxuICBsb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcbiAgICBzdHJpbmdNYXBbIGxvY2FsZSBdID0ge307XHJcbiAgfSApO1xyXG5cclxuICAvLyBjb21iaW5lIG91ciBzdHJpbmdzIGludG8gW2xvY2FsZV1bc3RyaW5nS2V5XSBtYXAsIHVzaW5nIHRoZSBmYWxsYmFjayBsb2NhbGUgd2hlcmUgbmVjZXNzYXJ5LiBJbiByZWdhcmRzIHRvIG5lc3RlZFxyXG4gIC8vIHN0cmluZ3MsIHRoaXMgZGF0YSBzdHJ1Y3R1cmUgZG9lc24ndCBuZXN0LiBJbnN0ZWFkIGl0IGdldHMgbmVzdGVkIHN0cmluZyB2YWx1ZXMsIGFuZCB0aGVuIHNldHMgdGhlbSB3aXRoIHRoZVxyXG4gIC8vIGZsYXQga2V5IHN0cmluZyBsaWtlIGBcIkZSSUNUSU9OL2ExMXkuc29tZS5zdHJpbmcuaGVyZVwiOiB7IHZhbHVlOiAnTXkgU29tZSBTdHJpbmcnIH1gXHJcbiAgcmVwb3NXaXRoVXNlZFN0cmluZ3MuZm9yRWFjaCggcmVwbyA9PiB7XHJcblxyXG4gICAgLy8gU2NhbiBhbGwgb2YgdGhlIGZpbGVzIHdpdGggc3RyaW5nIG1vZHVsZSByZWZlcmVuY2VzLCBzY2FubmluZyBmb3IgYW55dGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgc3RyaW5nIGFjY2VzcyBmb3JcclxuICAgIC8vIG91ciByZXBvLiBUaGlzIHdpbGwgaW5jbHVkZSB0aGUgc3RyaW5nIG1vZHVsZSByZWZlcmVuY2UsIGUuZy4gYEpvaXN0U3RyaW5ncy5SZXNldEFsbEJ1dHRvbi5uYW1lYCwgYnV0IGNvdWxkIGFsc29cclxuICAgIC8vIGluY2x1ZGUgc2xpZ2h0bHkgbW9yZSAoc2luY2Ugd2UncmUgc3RyaW5nIHBhcnNpbmcpLCBlLmcuIGBKb2lzdFN0cmluZ3MuUmVzZXRBbGxCdXR0b24ubmFtZS5sZW5ndGhgIHdvdWxkIGJlXHJcbiAgICAvLyBpbmNsdWRlZCwgZXZlbiB0aG91Z2ggb25seSBwYXJ0IG9mIHRoYXQgaXMgYSBzdHJpbmcgYWNjZXNzLlxyXG4gICAgbGV0IHN0cmluZ0FjY2Vzc2VzID0gW107XHJcblxyXG4gICAgY29uc3QgcHJlZml4ID0gYCR7cGFzY2FsQ2FzZSggcmVwbyApfVN0cmluZ3NgOyAvLyBlLmcuIEpvaXN0U3RyaW5nc1xyXG4gICAgdXNlZEZpbGVDb250ZW50cy5mb3JFYWNoKCAoIGZpbGVDb250ZW50LCBpICkgPT4ge1xyXG4gICAgICAvLyBPbmx5IHNjYW4gZmlsZXMgd2hlcmUgd2UgY2FuIGlkZW50aWZ5IGFuIGltcG9ydCBmb3IgaXRcclxuICAgICAgaWYgKCBmaWxlQ29udGVudC5pbmNsdWRlcyggYGltcG9ydCAke3ByZWZpeH0gZnJvbWAgKSApIHtcclxuXHJcbiAgICAgICAgLy8gTG9vayBmb3Igbm9ybWFsIG1hdGNoZXMsIGUuZy4gYEpvaXN0U3RyaW5ncy5gIGZvbGxvd2VkIGJ5IG9uZSBvciBtb3JlIGNodW5rcyBsaWtlOlxyXG4gICAgICAgIC8vIC5zb21ldGhpbmdWYWd1ZWx5X2FscGhhTnVtM3IxY1xyXG4gICAgICAgIC8vIFsgJ2FTdHJpbmdJbkJyYWNrZXRzQmVjYXVzZU9mU3BlY2lhbENoYXJhY3RlcnMnIF1cclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIEl0IHdpbGwgYWxzbyB0aGVuIGVuZCBvbiBhbnl0aGluZyB0aGF0IGRvZXNuJ3QgbG9vayBsaWtlIGFub3RoZXIgb25lIG9mIHRob3NlIGNodW5rc1xyXG4gICAgICAgIC8vIFthLXpBLVpfJF1bYS16QS1aMC05XyRdKiAtLS0tIHRoaXMgZ3JhYnMgdGhpbmdzIHRoYXQgbG9va3MgbGlrZSB2YWxpZCBKUyBpZGVudGlmaWVyc1xyXG4gICAgICAgIC8vIFxcXFxbICdbXiddKycgXFxcXF0pKyAtLS0tIHRoaXMgZ3JhYnMgdGhpbmdzIGxpa2Ugb3VyIHNlY29uZCBjYXNlIGFib3ZlXHJcbiAgICAgICAgLy8gW15cXFxcLlxcXFxbXSAtLS0tIG1hdGNoZXMgc29tZXRoaW5nIGF0IHRoZSBlbmQgdGhhdCBpcyBOT1QgZWl0aGVyIG9mIHRob3NlIG90aGVyIHR3byBjYXNlc1xyXG4gICAgICAgIC8vIEl0IGlzIGFsc28gZ2VuZXJhbGl6ZWQgdG8gc3VwcG9ydCBhcmJpdHJhcnkgd2hpdGVzcGFjZSBhbmQgcmVxdWlyZXMgdGhhdCAnIG1hdGNoICcgb3IgXCIgbWF0Y2ggXCIsIHNpbmNlXHJcbiAgICAgICAgLy8gdGhpcyBtdXN0IHN1cHBvcnQgSlMgY29kZSBhbmQgbWluaWZpZWQgVHlwZVNjcmlwdCBjb2RlXHJcbiAgICAgICAgLy8gTWF0Y2hlcyBvbmUgZmluYWwgY2hhcmFjdGVyIHRoYXQgaXMgbm90ICcuJyBvciAnWycsIHNpbmNlIGFueSB2YWxpZCBzdHJpbmcgYWNjZXNzZXMgc2hvdWxkIE5PVCBoYXZlIHRoYXRcclxuICAgICAgICAvLyBhZnRlci4gTk9URTogdGhlcmUgYXJlIHNvbWUgZGVnZW5lcmF0ZSBjYXNlcyB0aGF0IHdpbGwgYnJlYWsgdGhpcywgZS5nLjpcclxuICAgICAgICAvLyAtIEpvaXN0U3RyaW5ncy5zb21lU3RyaW5nUHJvcGVydHlbIDAgXVxyXG4gICAgICAgIC8vIC0gSm9pc3RTdHJpbmdzLnNvbWV0aGluZ1sgMCBdXHJcbiAgICAgICAgLy8gLSBKb2lzdFN0cmluZ3Muc29tZXRoaW5nWyAnbGVuZ3RoJyBdXHJcbiAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGZpbGVDb250ZW50Lm1hdGNoKCBuZXcgUmVnRXhwKCBgJHtwcmVmaXh9KFxcXFwuW2EtekEtWl8kXVthLXpBLVowLTlfJF0qfFxcXFxbXFxcXHMqWydcIl1bXidcIl0rWydcIl1cXFxccypcXFxcXSkrW15cXFxcLlxcXFxbXWAsICdnJyApICk7XHJcbiAgICAgICAgaWYgKCBtYXRjaGVzICkge1xyXG4gICAgICAgICAgc3RyaW5nQWNjZXNzZXMucHVzaCggLi4ubWF0Y2hlcy5tYXAoIG1hdGNoID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoXHJcbiAgICAgICAgICAgICAgLy8gV2UgYWx3YXlzIGhhdmUgdG8gc3RyaXAgb2ZmIHRoZSBsYXN0IGNoYXJhY3RlciAtIGl0J3MgYSBjaGFyYWN0ZXIgdGhhdCBzaG91bGRuJ3QgYmUgaW4gYSBzdHJpbmcgYWNjZXNzXHJcbiAgICAgICAgICAgICAgLnNsaWNlKCAwLCBtYXRjaC5sZW5ndGggLSAxIClcclxuICAgICAgICAgICAgICAvLyBIYW5kbGUgSm9pc3RTdHJpbmdzWyAnc29tZS10aGluZ1N0cmluZ1Byb3BlcnR5JyBdLnZhbHVlID0+IEpvaXN0U3RyaW5nc1sgJ3NvbWUtdGhpbmcnIF1cclxuICAgICAgICAgICAgICAvLyAtLSBBbnl0aGluZyBhZnRlciBTdHJpbmdQcm9wZXJ0eSBzaG91bGQgZ29cclxuICAgICAgICAgICAgICAvLyBhd2F5LCBidXQgd2UgbmVlZCB0byBhZGQgdGhlIGZpbmFsICddIHRvIG1haW50YWluIHRoZSBmb3JtYXRcclxuICAgICAgICAgICAgICAucmVwbGFjZSggL1N0cmluZ1Byb3BlcnR5J10uKi8sICdcXCddJyApXHJcbiAgICAgICAgICAgICAgLy8gSGFuZGxlIEpvaXN0U3RyaW5ncy5zb21ldGhpbmdTdHJpbmdQcm9wZXJ0eS52YWx1ZSA9PiBKb2lzdFN0cmluZ3Muc29tZXRoaW5nXHJcbiAgICAgICAgICAgICAgLnJlcGxhY2UoIC9TdHJpbmdQcm9wZXJ0eS4qLywgJycgKTtcclxuICAgICAgICAgIH0gKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFN0cmlwIG9mZiBvdXIgcHJlZml4ZXMsIHNvIG91ciBzdHJpbmdBY2Nlc3NlcyB3aWxsIGhhdmUgdGhpbmdzIGxpa2UgYCdSZXNldEFsbEJ1dHRvbi5uYW1lJ2AgaW5zaWRlLlxyXG4gICAgc3RyaW5nQWNjZXNzZXMgPSBfLnVuaXEoIHN0cmluZ0FjY2Vzc2VzICkubWFwKCBzdHIgPT4gc3RyLnNsaWNlKCBwcmVmaXgubGVuZ3RoICkgKTtcclxuXHJcbiAgICAvLyBUaGUgSlMgb3V0cHV0dGVkIGJ5IFRTIGlzIG1pbmlmaWVkIGFuZCBtaXNzaW5nIHRoZSB3aGl0ZXNwYWNlXHJcbiAgICBjb25zdCBkZXB0aCA9IDI7XHJcblxyXG4gICAgLy8gVHVybiBlYWNoIHN0cmluZyBhY2Nlc3MgaW50byBhbiBhcnJheSBvZiBwYXJ0cywgZS5nLiAnLlJlc2V0QWxsQnV0dG9uLm5hbWUnID0+IFsgJ1Jlc2V0QWxsQnV0dG9uJywgJ25hbWUnIF1cclxuICAgIC8vIG9yICdbIFxcJ0FcXCcgXS5CWyBcXCdDXFwnIF0nID0+IFsgJ0EnLCAnQicsICdDJyBdXHJcbiAgICAvLyBSZWdleCBncmFicyBlaXRoZXIgYC5pZGVudGlmaWVyYCBvciBgWyAndGV4dCcgXWAuXHJcbiAgICBjb25zdCBzdHJpbmdLZXlzQnlQYXJ0cyA9IHN0cmluZ0FjY2Vzc2VzLm1hcCggYWNjZXNzID0+IGFjY2Vzcy5tYXRjaCggL1xcLlthLXpBLVpfJF1bYS16QS1aMC05XyRdKnxcXFtcXHMqWydcIl1bXidcIl0rWydcIl1cXHMqXFxdL2cgKS5tYXAoIHRva2VuID0+IHtcclxuICAgICAgcmV0dXJuIHRva2VuLnN0YXJ0c1dpdGgoICcuJyApID8gdG9rZW4uc2xpY2UoIDEgKSA6IHRva2VuLnNsaWNlKCBkZXB0aCwgdG9rZW4ubGVuZ3RoIC0gZGVwdGggKTtcclxuICAgIH0gKSApO1xyXG5cclxuICAgIC8vIENvbmNhdGVuYXRlIHRoZSBzdHJpbmcgcGFydHMgZm9yIGVhY2ggYWNjZXNzIGludG8gc29tZXRoaW5nIHRoYXQgbG9va3MgbGlrZSBhIHBhcnRpYWwgc3RyaW5nIGtleSwgZS5nLlxyXG4gICAgLy8gWyAnUmVzZXRBbGxCdXR0b24nLCAnbmFtZScgXSA9PiAnUmVzZXRBbGxCdXR0b24ubmFtZSdcclxuICAgIGNvbnN0IHBhcnRpYWxTdHJpbmdLZXlzID0gXy51bmlxKCBzdHJpbmdLZXlzQnlQYXJ0cy5tYXAoIHBhcnRzID0+IHBhcnRzLmpvaW4oICcuJyApICkgKS5maWx0ZXIoIGtleSA9PiBrZXkgIT09ICdqcycgKTtcclxuXHJcbiAgICAvLyBGb3IgZWFjaCBzdHJpbmcga2V5IGFuZCBsb2NhbGUsIHdlJ2xsIGxvb2sgdXAgdGhlIHN0cmluZyBlbnRyeSBhbmQgZmlsbCBpdCBpbnRvIHRoZSBzdHJpbmdNYXBcclxuICAgIHBhcnRpYWxTdHJpbmdLZXlzLmZvckVhY2goIHBhcnRpYWxTdHJpbmdLZXkgPT4ge1xyXG4gICAgICBsb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcbiAgICAgICAgbGV0IHN0cmluZ0VudHJ5ID0gbnVsbDtcclxuICAgICAgICBmb3IgKCBjb25zdCBmYWxsYmFja0xvY2FsZSBvZiBsb2NhbGVGYWxsYmFja3MoIGxvY2FsZSApICkge1xyXG4gICAgICAgICAgY29uc3Qgc3RyaW5nRmlsZUNvbnRlbnRzID0gc3RyaW5nRmlsZXNDb250ZW50c1sgcmVwbyBdWyBmYWxsYmFja0xvY2FsZSBdO1xyXG4gICAgICAgICAgaWYgKCBzdHJpbmdGaWxlQ29udGVudHMgKSB7XHJcbiAgICAgICAgICAgIHN0cmluZ0VudHJ5ID0gQ2hpcHBlclN0cmluZ1V0aWxzLmdldFN0cmluZ0VudHJ5RnJvbU1hcCggc3RyaW5nRmlsZUNvbnRlbnRzLCBwYXJ0aWFsU3RyaW5nS2V5ICk7XHJcbiAgICAgICAgICAgIGlmICggc3RyaW5nRW50cnkgKSB7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCAhcGFydGlhbFN0cmluZ0tleS5lbmRzV2l0aCggJ1N0cmluZ1Byb3BlcnR5JyApICkge1xyXG4gICAgICAgICAgYXNzZXJ0KCBzdHJpbmdFbnRyeSAhPT0gbnVsbCwgYE1pc3Npbmcgc3RyaW5nIGluZm9ybWF0aW9uIGZvciAke3JlcG99ICR7cGFydGlhbFN0cmluZ0tleX1gICk7XHJcblxyXG4gICAgICAgICAgY29uc3Qgc3RyaW5nS2V5ID0gYCR7cmVxdWlyZWpzTmFtZXNwYWNlTWFwWyByZXBvIF19LyR7cGFydGlhbFN0cmluZ0tleX1gO1xyXG4gICAgICAgICAgc3RyaW5nTWFwWyBsb2NhbGUgXVsgc3RyaW5nS2V5IF0gPSBzdHJpbmdFbnRyeS52YWx1ZTtcclxuICAgICAgICAgIGlmICggc3RyaW5nRW50cnkubWV0YWRhdGEgJiYgbG9jYWxlID09PSBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSApIHtcclxuICAgICAgICAgICAgc3RyaW5nTWV0YWRhdGFbIHN0cmluZ0tleSBdID0gc3RyaW5nRW50cnkubWV0YWRhdGE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG5cclxuICByZXR1cm4geyBzdHJpbmdNYXA6IHN0cmluZ01hcCwgc3RyaW5nTWV0YWRhdGE6IHN0cmluZ01ldGFkYXRhIH07XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsTUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQzdCLE1BQU1DLE1BQU0sR0FBR0QsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUNsQyxNQUFNRSxnQkFBZ0IsR0FBR0YsT0FBTyxDQUFFLDRCQUE2QixDQUFDO0FBQ2hFLE1BQU1HLFVBQVUsR0FBR0gsT0FBTyxDQUFFLHNCQUF1QixDQUFDO0FBQ3BELE1BQU1JLGtCQUFrQixHQUFH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