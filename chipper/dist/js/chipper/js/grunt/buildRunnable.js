// Copyright 2017-2024, University of Colorado Boulder

/**
 * Builds a runnable (something that builds like a simulation)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
const _ = require('lodash');
const assert = require('assert');
const ChipperConstants = require('../common/ChipperConstants');
const ChipperStringUtils = require('../common/ChipperStringUtils');
const getLicenseEntry = require('../common/getLicenseEntry');
const copyDirectory = require('./copyDirectory');
const copySupplementalPhetioFiles = require('./copySupplementalPhetioFiles');
const generateThumbnails = require('./generateThumbnails');
const generateTwitterCard = require('./generateTwitterCard');
const getA11yViewHTMLFromTemplate = require('./getA11yViewHTMLFromTemplate');
const getAllThirdPartyEntries = require('./getAllThirdPartyEntries');
const getDependencies = require('./getDependencies');
const getInitializationScript = require('./getInitializationScript');
const getLocalesFromRepository = require('./getLocalesFromRepository');
const getPhetLibs = require('./getPhetLibs');
const getPreloads = require('./getPreloads');
const getStringMap = require('./getStringMap');
const getTitleStringKey = require('./getTitleStringKey');
const grunt = require('grunt');
const path = require('path');
const jimp = require('jimp');
const loadFileAsDataURI = require('../common/loadFileAsDataURI');
const minify = require('./minify');
const nodeHTMLEncoder = require('node-html-encoder'); // eslint-disable-line require-statement-match
const packageRunnable = require('./packageRunnable');
const packageXHTML = require('./packageXHTML');
const reportUnusedMedia = require('./reportUnusedMedia');
const reportUnusedStrings = require('./reportUnusedStrings');
const webpackBuild = require('./webpackBuild');
const zlib = require('zlib');
const phetTimingLog = require('../../../perennial-alias/js/common/phetTimingLog');
const recordTime = async (name, asyncCallback, timeCallback) => {
  const beforeTime = Date.now();
  const result = await phetTimingLog.startAsync(name, async () => {
    const result = await asyncCallback();
    return result;
  });
  const afterTime = Date.now();
  timeCallback(afterTime - beforeTime, result);
  return result;
};

/**
 * Builds a runnable (e.g. a simulation).
 * @public
 *
 * @param {string} repo
 * @param {Object} minifyOptions - see minify.js
 * @param {boolean} allHTML - If the _all.html file should be generated
 * @param {string} brand
 * @param {string} localesOption - e.g,. '*', 'en,es', etc.
 * @param {boolean} buildLocal
 * @param {boolean} encodeStringMap
 * @param {boolean} compressScripts
 * @param {boolean} profileFileSize
 * @returns {Promise} - Does not resolve a value
 */
module.exports = async function (repo, minifyOptions, allHTML, brand, localesOption, buildLocal, encodeStringMap, compressScripts, profileFileSize) {
  assert(typeof repo === 'string');
  assert(typeof minifyOptions === 'object');
  if (brand === 'phet-io') {
    assert(grunt.file.exists('../phet-io'), 'Aborting the build of phet-io brand since proprietary repositories are not checked out.\nPlease use --brands=={{BRAND}} in the future to avoid this.');
  }
  const packageObject = grunt.file.readJSON(`../${repo}/package.json`);
  const encoder = new nodeHTMLEncoder.Encoder('entity');

  // All html files share the same build timestamp
  let timestamp = new Date().toISOString().split('T').join(' ');
  timestamp = `${timestamp.substring(0, timestamp.indexOf('.'))} UTC`;

  // Start running webpack
  const webpackResult = await recordTime('webpack', async () => webpackBuild(repo, brand, {
    profileFileSize: profileFileSize
  }), time => {
    grunt.log.ok(`Webpack build complete: ${time}ms`);
  });

  // NOTE: This build currently (due to the string/mipmap plugins) modifies globals. Some operations need to be done after this.
  const webpackJS = wrapProfileFileSize(`phet.chipper.runWebpack = function() {${webpackResult.js}};`, profileFileSize, 'WEBPACK');

  // Debug version is independent of passed in minifyOptions.  PhET-iO brand is minified, but leaves assertions & logging.
  const debugMinifyOptions = brand === 'phet-io' ? {
    stripAssertions: false,
    stripLogging: false
  } : {
    minify: false
  };

  // If turning off minification for the main build, don't minify the debug version also
  if (minifyOptions.minify === false) {
    debugMinifyOptions.minify = false;
  }
  const usedModules = webpackResult.usedModules;
  reportUnusedMedia(repo, usedModules);
  const licenseEntries = {};
  ChipperConstants.MEDIA_TYPES.forEach(mediaType => {
    licenseEntries[mediaType] = {};
  });
  usedModules.forEach(module => {
    ChipperConstants.MEDIA_TYPES.forEach(mediaType => {
      if (module.split('/')[1] === mediaType) {
        // The file suffix is stripped and restored to its non-js extension. This is because getLicenseEntry doesn't
        // handle modulified media files.
        const index = module.lastIndexOf('_');
        const path = `${module.slice(0, index)}.${module.slice(index + 1, -3)}`;
        licenseEntries[mediaType][module] = getLicenseEntry(`../${path}`);
      }
    });
  });
  const phetLibs = getPhetLibs(repo, brand);
  const allLocales = [ChipperConstants.FALLBACK_LOCALE, ...getLocalesFromRepository(repo)];
  const locales = localesOption === '*' ? allLocales : localesOption.split(',');
  const dependencies = await getDependencies(repo);
  webpackResult.usedModules.forEach(moduleDependency => {
    // The first part of the path is the repo.  Or if no directory is specified, the file is in the sim repo.
    const pathSeparatorIndex = moduleDependency.indexOf(path.sep);
    const moduleRepo = pathSeparatorIndex >= 0 ? moduleDependency.slice(0, pathSeparatorIndex) : repo;
    assert(Object.keys(dependencies).includes(moduleRepo), `repo ${moduleRepo} missing from package.json's phetLibs for ${moduleDependency}`);
  });
  const version = packageObject.version; // Include the one-off name in the version
  const thirdPartyEntries = getAllThirdPartyEntries(repo, brand, licenseEntries);
  const simTitleStringKey = getTitleStringKey(repo);
  const {
    stringMap,
    stringMetadata
  } = getStringMap(repo, allLocales, phetLibs, webpackResult.usedModules);

  // After our string map is constructed, report which of the translatable strings are unused.
  reportUnusedStrings(repo, packageObject.phet.requirejsNamespace, stringMap[ChipperConstants.FALLBACK_LOCALE]);

  // If we have NO strings for a given locale that we want, we'll need to fill it in with all English strings, see
  // https://github.com/phetsims/perennial/issues/83
  for (const locale of locales) {
    if (!stringMap[locale]) {
      stringMap[locale] = stringMap[ChipperConstants.FALLBACK_LOCALE];
    }
  }
  const englishTitle = stringMap[ChipperConstants.FALLBACK_LOCALE][simTitleStringKey];
  assert(englishTitle, `missing entry for sim title, key = ${simTitleStringKey}`);

  // Select the HTML comment header based on the brand, see https://github.com/phetsims/chipper/issues/156
  let htmlHeader;
  if (brand === 'phet-io') {
    // License text provided by @kathy-phet in https://github.com/phetsims/chipper/issues/148#issuecomment-112584773
    htmlHeader = `${englishTitle} ${version}\n` + `Copyright 2002-${grunt.template.today('yyyy')}, Regents of the University of Colorado\n` + 'PhET Interactive Simulations, University of Colorado Boulder\n' + '\n' + 'This Interoperable PhET Simulation file requires a license.\n' + 'USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' + 'Contact phethelp@colorado.edu regarding licensing.\n' + 'https://phet.colorado.edu/en/licensing';
  } else {
    htmlHeader = `${englishTitle} ${version}\n` + `Copyright 2002-${grunt.template.today('yyyy')}, Regents of the University of Colorado\n` + 'PhET Interactive Simulations, University of Colorado Boulder\n' + '\n' + 'This file is licensed under Creative Commons Attribution 4.0\n' + 'For alternate source code licensing, see https://github.com/phetsims\n' + 'For licenses for third-party software used by this simulation, see below\n' + 'For more information, see https://phet.colorado.edu/en/licensing/html\n' + '\n' + 'The PhET name and PhET logo are registered trademarks of The Regents of the\n' + 'University of Colorado. Permission is granted to use the PhET name and PhET logo\n' + 'only for attribution purposes. Use of the PhET name and/or PhET logo for promotional,\n' + 'marketing, or advertising purposes requires a separate license agreement from the\n' + 'University of Colorado. Contact phethelp@colorado.edu regarding licensing.';
  }

  // Scripts that are run before our main minifiable content
  const startupScripts = [
  // Splash image
  wrapProfileFileSize(`window.PHET_SPLASH_DATA_URI="${loadFileAsDataURI(`../brand/${brand}/images/splash.svg`)}";`, profileFileSize, 'SPLASH')];
  const minifiableScripts = [
  // Preloads
  ...getPreloads(repo, brand, true).map(filename => wrapProfileFileSize(grunt.file.read(filename), profileFileSize, 'PRELOAD', filename)),
  // Our main module content, wrapped in a function called in the startup below
  webpackJS,
  // Main startup
  wrapProfileFileSize(grunt.file.read('../chipper/templates/chipper-startup.js'), profileFileSize, 'STARTUP')];
  const productionScripts = await recordTime('minify-production', async () => {
    return [...startupScripts, ...minifiableScripts.map(js => minify(js, minifyOptions))];
  }, (time, scripts) => {
    grunt.log.ok(`Production minification complete: ${time}ms (${_.sum(scripts.map(js => js.length))} bytes)`);
  });
  const debugScripts = await recordTime('minify-debug', async () => {
    return [...startupScripts, ...minifiableScripts.map(js => minify(js, debugMinifyOptions))];
  }, (time, scripts) => {
    grunt.log.ok(`Debug minification complete: ${time}ms (${_.sum(scripts.map(js => js.length))} bytes)`);
  });
  const licenseScript = wrapProfileFileSize(ChipperStringUtils.replacePlaceholders(grunt.file.read('../chipper/templates/license-initialization.js'), {
    PHET_START_THIRD_PARTY_LICENSE_ENTRIES: ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES,
    PHET_THIRD_PARTY_LICENSE_ENTRIES: JSON.stringify(thirdPartyEntries, null, 2),
    PHET_END_THIRD_PARTY_LICENSE_ENTRIES: ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES
  }), profileFileSize, 'LICENSE');
  const commonInitializationOptions = {
    brand: brand,
    repo: repo,
    stringMap: stringMap,
    stringMetadata: stringMetadata,
    dependencies: dependencies,
    timestamp: timestamp,
    version: version,
    packageObject: packageObject,
    allowLocaleSwitching: false,
    encodeStringMap: encodeStringMap,
    profileFileSize: profileFileSize,
    wrapStringsJS: stringsJS => wrapProfileFileSize(stringsJS, profileFileSize, 'STRINGS')
  };

  // Create the build-specific directory
  const buildDir = `../${repo}/build/${brand}`;
  grunt.file.mkdir(buildDir);

  // {{locale}}.html
  if (brand !== 'phet-io') {
    for (const locale of locales) {
      const initializationScript = getInitializationScript(_.assignIn({
        locale: locale,
        includeAllLocales: false,
        isDebugBuild: false
      }, commonInitializationOptions));
      grunt.file.write(`${buildDir}/${repo}_${locale}_${brand}.html`, packageRunnable({
        repo: repo,
        stringMap: stringMap,
        htmlHeader: htmlHeader,
        locale: locale,
        compressScripts: compressScripts,
        licenseScript: licenseScript,
        scripts: [initializationScript, ...productionScripts]
      }));
    }
  }

  // _all.html (forced for phet-io)
  if (allHTML || brand === 'phet-io') {
    const initializationScript = getInitializationScript(_.assignIn({
      locale: ChipperConstants.FALLBACK_LOCALE,
      includeAllLocales: true,
      isDebugBuild: false
    }, commonInitializationOptions, {
      allowLocaleSwitching: true
    }));
    const allHTMLFilename = `${buildDir}/${repo}_all_${brand}.html`;
    const allHTMLContents = packageRunnable({
      repo: repo,
      stringMap: stringMap,
      htmlHeader: htmlHeader,
      locale: ChipperConstants.FALLBACK_LOCALE,
      compressScripts: compressScripts,
      licenseScript: licenseScript,
      scripts: [initializationScript, ...productionScripts]
    });
    grunt.file.write(allHTMLFilename, allHTMLContents);

    // Add a compressed file to improve performance in the iOS app, see https://github.com/phetsims/chipper/issues/746
    grunt.file.write(`${allHTMLFilename}.gz`, zlib.gzipSync(allHTMLContents));
  }

  // Debug build (always included)
  const debugInitializationScript = getInitializationScript(_.assignIn({
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true,
    isDebugBuild: true
  }, commonInitializationOptions, {
    allowLocaleSwitching: true
  }));
  grunt.file.write(`${buildDir}/${repo}_all_${brand}_debug.html`, packageRunnable({
    repo: repo,
    stringMap: stringMap,
    htmlHeader: htmlHeader,
    locale: ChipperConstants.FALLBACK_LOCALE,
    compressScripts: compressScripts,
    licenseScript: licenseScript,
    scripts: [debugInitializationScript, ...debugScripts]
  }));

  // XHTML build (ePub compatibility, etc.)
  const xhtmlDir = `${buildDir}/xhtml`;
  grunt.file.mkdir(xhtmlDir);
  const xhtmlInitializationScript = getInitializationScript(_.assignIn({
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true,
    isDebugBuild: false
  }, commonInitializationOptions, {
    allowLocaleSwitching: true
  }));
  packageXHTML(xhtmlDir, {
    repo: repo,
    brand: brand,
    stringMap: stringMap,
    htmlHeader: htmlHeader,
    initializationScript: xhtmlInitializationScript,
    licenseScript: licenseScript,
    scripts: productionScripts
  });

  // dependencies.json
  grunt.file.write(`${buildDir}/dependencies.json`, JSON.stringify(dependencies, null, 2));

  // string-map.json and english-string-map.json, for things like Rosetta that need to know what strings are used
  grunt.file.write(`${buildDir}/string-map.json`, JSON.stringify(stringMap, null, 2));
  grunt.file.write(`${buildDir}/english-string-map.json`, JSON.stringify(stringMap.en, null, 2));

  // -iframe.html (English is assumed as the locale).
  if (_.includes(locales, ChipperConstants.FALLBACK_LOCALE) && brand === 'phet') {
    const englishTitle = stringMap[ChipperConstants.FALLBACK_LOCALE][getTitleStringKey(repo)];
    grunt.log.debug('Constructing HTML for iframe testing from template');
    let iframeTestHtml = grunt.file.read('../chipper/templates/sim-iframe.html');
    iframeTestHtml = ChipperStringUtils.replaceFirst(iframeTestHtml, '{{PHET_SIM_TITLE}}', encoder.htmlEncode(`${englishTitle} iframe test`));
    iframeTestHtml = ChipperStringUtils.replaceFirst(iframeTestHtml, '{{PHET_REPOSITORY}}', repo);
    const iframeLocales = ['en'].concat(allHTML ? ['all'] : []);
    iframeLocales.forEach(locale => {
      const iframeHtml = ChipperStringUtils.replaceFirst(iframeTestHtml, '{{PHET_LOCALE}}', locale);
      grunt.file.write(`${buildDir}/${repo}_${locale}_iframe_phet.html`, iframeHtml);
    });
  }

  // If the sim is a11y outfitted, then add the a11y pdom viewer to the build dir. NOTE: Not for phet-io builds.
  if (packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsInteractiveDescription && brand === 'phet') {
    // (a11y) Create the a11y-view HTML file for PDOM viewing.
    let a11yHTML = getA11yViewHTMLFromTemplate(repo);

    // this replaceAll is outside of the getA11yViewHTMLFromTemplate because we only want it filled in during the build
    a11yHTML = ChipperStringUtils.replaceAll(a11yHTML, '{{IS_BUILT}}', 'true');
    grunt.file.write(`${buildDir}/${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, a11yHTML);
  }

  // copy over supplemental files or dirs to package with the build. Only supported in phet brand
  if (packageObject.phet && packageObject.phet.packageWithBuild) {
    assert(Array.isArray(packageObject.phet.packageWithBuild));
    packageObject.phet.packageWithBuild.forEach(path => {
      assert(typeof path === 'string', 'path should be a string');
      assert(grunt.file.exists(path), `path does not exist: ${path}`);
      if (grunt.file.isDir(path)) {
        copyDirectory(path, `${buildDir}/${path}`);
      } else {
        grunt.file.copy(path, `${buildDir}/${path}`);
      }
    });
  }
  if (brand === 'phet-io') {
    await copySupplementalPhetioFiles(repo, version, englishTitle, packageObject, buildLocal, true);
  }

  // Thumbnails and twitter card
  if (grunt.file.exists(`../${repo}/assets/${repo}-screenshot.png`)) {
    const thumbnailSizes = [{
      width: 128,
      height: 84
    }, {
      width: 600,
      height: 394
    }];
    for (const size of thumbnailSizes) {
      grunt.file.write(`${buildDir}/${repo}-${size.width}.png`, await generateThumbnails(repo, size.width, size.height, 100, jimp.MIME_PNG));
    }
    if (brand === 'phet') {
      grunt.file.write(`${buildDir}/${repo}-ios.png`, await generateThumbnails(repo, 420, 276, 90, jimp.MIME_JPEG));
      grunt.file.write(`${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard(repo));
    }
  }
};

// For profiling file size. Name is optional
const wrapProfileFileSize = (string, profileFileSize, type, name) => {
  if (profileFileSize) {
    const conditionalName = name ? `,"${name}"` : '';
    return `console.log("START_${type.toUpperCase()}"${conditionalName});\n${string}\nconsole.log("END_${type.toUpperCase()}"${conditionalName});\n\n`;
  } else {
    return string;
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsIkNoaXBwZXJDb25zdGFudHMiLCJDaGlwcGVyU3RyaW5nVXRpbHMiLCJnZXRMaWNlbnNlRW50cnkiLCJjb3B5RGlyZWN0b3J5IiwiY29weVN1cHBsZW1lbnRhbFBoZXRpb0ZpbGVzIiwiZ2VuZXJhdGVUaHVtYm5haWxzIiwiZ2VuZXJhdGVUd2l0dGVyQ2FyZCIsImdldEExMXlWaWV3SFRNTEZyb21UZW1wbGF0ZSIsImdldEFsbFRoaXJkUGFydHlFbnRyaWVzIiwiZ2V0RGVwZW5kZW5jaWVzIiwiZ2V0SW5pdGlhbGl6YXRpb25TY3JpcHQiLCJnZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkiLCJnZXRQaGV0TGlicyIsImdldFByZWxvYWRzIiwiZ2V0U3RyaW5nTWFwIiwiZ2V0VGl0bGVTdHJpbmdLZXkiLCJncnVudCIsInBhdGgiLCJqaW1wIiwibG9hZEZpbGVBc0RhdGFVUkkiLCJtaW5pZnkiLCJub2RlSFRNTEVuY29kZXIiLCJwYWNrYWdlUnVubmFibGUiLCJwYWNrYWdlWEhUTUwiLCJyZXBvcnRVbnVzZWRNZWRpYSIsInJlcG9ydFVudXNlZFN0cmluZ3MiLCJ3ZWJwYWNrQnVpbGQiLCJ6bGliIiwicGhldFRpbWluZ0xvZyIsInJlY29yZFRpbWUiLCJuYW1lIiwiYXN5bmNDYWxsYmFjayIsInRpbWVDYWxsYmFjayIsImJlZm9yZVRpbWUiLCJEYXRlIiwibm93IiwicmVzdWx0Iiwic3RhcnRBc3luYyIsImFmdGVyVGltZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwibWluaWZ5T3B0aW9ucyIsImFsbEhUTUwiLCJicmFuZCIsImxvY2FsZXNPcHRpb24iLCJidWlsZExvY2FsIiwiZW5jb2RlU3RyaW5nTWFwIiwiY29tcHJlc3NTY3JpcHRzIiwicHJvZmlsZUZpbGVTaXplIiwiZmlsZSIsImV4aXN0cyIsInBhY2thZ2VPYmplY3QiLCJyZWFkSlNPTiIsImVuY29kZXIiLCJFbmNvZGVyIiwidGltZXN0YW1wIiwidG9JU09TdHJpbmciLCJzcGxpdCIsImpvaW4iLCJzdWJzdHJpbmciLCJpbmRleE9mIiwid2VicGFja1Jlc3VsdCIsInRpbWUiLCJsb2ciLCJvayIsIndlYnBhY2tKUyIsIndyYXBQcm9maWxlRmlsZVNpemUiLCJqcyIsImRlYnVnTWluaWZ5T3B0aW9ucyIsInN0cmlwQXNzZXJ0aW9ucyIsInN0cmlwTG9nZ2luZyIsInVzZWRNb2R1bGVzIiwibGljZW5zZUVudHJpZXMiLCJNRURJQV9UWVBFUyIsImZvckVhY2giLCJtZWRpYVR5cGUiLCJpbmRleCIsImxhc3RJbmRleE9mIiwic2xpY2UiLCJwaGV0TGlicyIsImFsbExvY2FsZXMiLCJGQUxMQkFDS19MT0NBTEUiLCJsb2NhbGVzIiwiZGVwZW5kZW5jaWVzIiwibW9kdWxlRGVwZW5kZW5jeSIsInBhdGhTZXBhcmF0b3JJbmRleCIsInNlcCIsIm1vZHVsZVJlcG8iLCJPYmplY3QiLCJrZXlzIiwiaW5jbHVkZXMiLCJ2ZXJzaW9uIiwidGhpcmRQYXJ0eUVudHJpZXMiLCJzaW1UaXRsZVN0cmluZ0tleSIsInN0cmluZ01hcCIsInN0cmluZ01ldGFkYXRhIiwicGhldCIsInJlcXVpcmVqc05hbWVzcGFjZSIsImxvY2FsZSIsImVuZ2xpc2hUaXRsZSIsImh0bWxIZWFkZXIiLCJ0ZW1wbGF0ZSIsInRvZGF5Iiwic3RhcnR1cFNjcmlwdHMiLCJtaW5pZmlhYmxlU2NyaXB0cyIsIm1hcCIsImZpbGVuYW1lIiwicmVhZCIsInByb2R1Y3Rpb25TY3JpcHRzIiwic2NyaXB0cyIsInN1bSIsImxlbmd0aCIsImRlYnVnU2NyaXB0cyIsImxpY2Vuc2VTY3JpcHQiLCJyZXBsYWNlUGxhY2Vob2xkZXJzIiwiUEhFVF9TVEFSVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVMiLCJTVEFSVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVMiLCJQSEVUX1RISVJEX1BBUlRZX0xJQ0VOU0VfRU5UUklFUyIsIkpTT04iLCJzdHJpbmdpZnkiLCJQSEVUX0VORF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVMiLCJFTkRfVEhJUkRfUEFSVFlfTElDRU5TRV9FTlRSSUVTIiwiY29tbW9uSW5pdGlhbGl6YXRpb25PcHRpb25zIiwiYWxsb3dMb2NhbGVTd2l0Y2hpbmciLCJ3cmFwU3RyaW5nc0pTIiwic3RyaW5nc0pTIiwiYnVpbGREaXIiLCJta2RpciIsImluaXRpYWxpemF0aW9uU2NyaXB0IiwiYXNzaWduSW4iLCJpbmNsdWRlQWxsTG9jYWxlcyIsImlzRGVidWdCdWlsZCIsIndyaXRlIiwiYWxsSFRNTEZpbGVuYW1lIiwiYWxsSFRNTENvbnRlbnRzIiwiZ3ppcFN5bmMiLCJkZWJ1Z0luaXRpYWxpemF0aW9uU2NyaXB0IiwieGh0bWxEaXIiLCJ4aHRtbEluaXRpYWxpemF0aW9uU2NyaXB0IiwiZW4iLCJkZWJ1ZyIsImlmcmFtZVRlc3RIdG1sIiwicmVwbGFjZUZpcnN0IiwiaHRtbEVuY29kZSIsImlmcmFtZUxvY2FsZXMiLCJjb25jYXQiLCJpZnJhbWVIdG1sIiwic2ltRmVhdHVyZXMiLCJzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24iLCJhMTF5SFRNTCIsInJlcGxhY2VBbGwiLCJBMTFZX1ZJRVdfSFRNTF9TVUZGSVgiLCJwYWNrYWdlV2l0aEJ1aWxkIiwiQXJyYXkiLCJpc0FycmF5IiwiaXNEaXIiLCJjb3B5IiwidGh1bWJuYWlsU2l6ZXMiLCJ3aWR0aCIsImhlaWdodCIsInNpemUiLCJNSU1FX1BORyIsIk1JTUVfSlBFRyIsInN0cmluZyIsInR5cGUiLCJjb25kaXRpb25hbE5hbWUiLCJ0b1VwcGVyQ2FzZSJdLCJzb3VyY2VzIjpbImJ1aWxkUnVubmFibGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQnVpbGRzIGEgcnVubmFibGUgKHNvbWV0aGluZyB0aGF0IGJ1aWxkcyBsaWtlIGEgc2ltdWxhdGlvbilcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG4vLyBtb2R1bGVzXHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5jb25zdCBDaGlwcGVyQ29uc3RhbnRzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9DaGlwcGVyQ29uc3RhbnRzJyApO1xyXG5jb25zdCBDaGlwcGVyU3RyaW5nVXRpbHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJTdHJpbmdVdGlscycgKTtcclxuY29uc3QgZ2V0TGljZW5zZUVudHJ5ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRMaWNlbnNlRW50cnknICk7XHJcbmNvbnN0IGNvcHlEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9jb3B5RGlyZWN0b3J5JyApO1xyXG5jb25zdCBjb3B5U3VwcGxlbWVudGFsUGhldGlvRmlsZXMgPSByZXF1aXJlKCAnLi9jb3B5U3VwcGxlbWVudGFsUGhldGlvRmlsZXMnICk7XHJcbmNvbnN0IGdlbmVyYXRlVGh1bWJuYWlscyA9IHJlcXVpcmUoICcuL2dlbmVyYXRlVGh1bWJuYWlscycgKTtcclxuY29uc3QgZ2VuZXJhdGVUd2l0dGVyQ2FyZCA9IHJlcXVpcmUoICcuL2dlbmVyYXRlVHdpdHRlckNhcmQnICk7XHJcbmNvbnN0IGdldEExMXlWaWV3SFRNTEZyb21UZW1wbGF0ZSA9IHJlcXVpcmUoICcuL2dldEExMXlWaWV3SFRNTEZyb21UZW1wbGF0ZScgKTtcclxuY29uc3QgZ2V0QWxsVGhpcmRQYXJ0eUVudHJpZXMgPSByZXF1aXJlKCAnLi9nZXRBbGxUaGlyZFBhcnR5RW50cmllcycgKTtcclxuY29uc3QgZ2V0RGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4vZ2V0RGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnZXRJbml0aWFsaXphdGlvblNjcmlwdCA9IHJlcXVpcmUoICcuL2dldEluaXRpYWxpemF0aW9uU2NyaXB0JyApO1xyXG5jb25zdCBnZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkgPSByZXF1aXJlKCAnLi9nZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnknICk7XHJcbmNvbnN0IGdldFBoZXRMaWJzID0gcmVxdWlyZSggJy4vZ2V0UGhldExpYnMnICk7XHJcbmNvbnN0IGdldFByZWxvYWRzID0gcmVxdWlyZSggJy4vZ2V0UHJlbG9hZHMnICk7XHJcbmNvbnN0IGdldFN0cmluZ01hcCA9IHJlcXVpcmUoICcuL2dldFN0cmluZ01hcCcgKTtcclxuY29uc3QgZ2V0VGl0bGVTdHJpbmdLZXkgPSByZXF1aXJlKCAnLi9nZXRUaXRsZVN0cmluZ0tleScgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuY29uc3QgamltcCA9IHJlcXVpcmUoICdqaW1wJyApO1xyXG5jb25zdCBsb2FkRmlsZUFzRGF0YVVSSSA9IHJlcXVpcmUoICcuLi9jb21tb24vbG9hZEZpbGVBc0RhdGFVUkknICk7XHJcbmNvbnN0IG1pbmlmeSA9IHJlcXVpcmUoICcuL21pbmlmeScgKTtcclxuY29uc3Qgbm9kZUhUTUxFbmNvZGVyID0gcmVxdWlyZSggJ25vZGUtaHRtbC1lbmNvZGVyJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtc3RhdGVtZW50LW1hdGNoXHJcbmNvbnN0IHBhY2thZ2VSdW5uYWJsZSA9IHJlcXVpcmUoICcuL3BhY2thZ2VSdW5uYWJsZScgKTtcclxuY29uc3QgcGFja2FnZVhIVE1MID0gcmVxdWlyZSggJy4vcGFja2FnZVhIVE1MJyApO1xyXG5jb25zdCByZXBvcnRVbnVzZWRNZWRpYSA9IHJlcXVpcmUoICcuL3JlcG9ydFVudXNlZE1lZGlhJyApO1xyXG5jb25zdCByZXBvcnRVbnVzZWRTdHJpbmdzID0gcmVxdWlyZSggJy4vcmVwb3J0VW51c2VkU3RyaW5ncycgKTtcclxuY29uc3Qgd2VicGFja0J1aWxkID0gcmVxdWlyZSggJy4vd2VicGFja0J1aWxkJyApO1xyXG5jb25zdCB6bGliID0gcmVxdWlyZSggJ3psaWInICk7XHJcbmNvbnN0IHBoZXRUaW1pbmdMb2cgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi9waGV0VGltaW5nTG9nJyApO1xyXG5cclxuY29uc3QgcmVjb3JkVGltZSA9IGFzeW5jICggbmFtZSwgYXN5bmNDYWxsYmFjaywgdGltZUNhbGxiYWNrICkgPT4ge1xyXG4gIGNvbnN0IGJlZm9yZVRpbWUgPSBEYXRlLm5vdygpO1xyXG5cclxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoIG5hbWUsIGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFzeW5jQ2FsbGJhY2soKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBhZnRlclRpbWUgPSBEYXRlLm5vdygpO1xyXG4gIHRpbWVDYWxsYmFjayggYWZ0ZXJUaW1lIC0gYmVmb3JlVGltZSwgcmVzdWx0ICk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBCdWlsZHMgYSBydW5uYWJsZSAoZS5nLiBhIHNpbXVsYXRpb24pLlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBtaW5pZnlPcHRpb25zIC0gc2VlIG1pbmlmeS5qc1xyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGFsbEhUTUwgLSBJZiB0aGUgX2FsbC5odG1sIGZpbGUgc2hvdWxkIGJlIGdlbmVyYXRlZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmRcclxuICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsZXNPcHRpb24gLSBlLmcsLiAnKicsICdlbixlcycsIGV0Yy5cclxuICogQHBhcmFtIHtib29sZWFufSBidWlsZExvY2FsXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5jb2RlU3RyaW5nTWFwXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY29tcHJlc3NTY3JpcHRzXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gcHJvZmlsZUZpbGVTaXplXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSAtIERvZXMgbm90IHJlc29sdmUgYSB2YWx1ZVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbywgbWluaWZ5T3B0aW9ucywgYWxsSFRNTCwgYnJhbmQsIGxvY2FsZXNPcHRpb24sIGJ1aWxkTG9jYWwsIGVuY29kZVN0cmluZ01hcCwgY29tcHJlc3NTY3JpcHRzLCBwcm9maWxlRmlsZVNpemUgKSB7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgcmVwbyA9PT0gJ3N0cmluZycgKTtcclxuICBhc3NlcnQoIHR5cGVvZiBtaW5pZnlPcHRpb25zID09PSAnb2JqZWN0JyApO1xyXG5cclxuICBpZiAoIGJyYW5kID09PSAncGhldC1pbycgKSB7XHJcbiAgICBhc3NlcnQoIGdydW50LmZpbGUuZXhpc3RzKCAnLi4vcGhldC1pbycgKSwgJ0Fib3J0aW5nIHRoZSBidWlsZCBvZiBwaGV0LWlvIGJyYW5kIHNpbmNlIHByb3ByaWV0YXJ5IHJlcG9zaXRvcmllcyBhcmUgbm90IGNoZWNrZWQgb3V0LlxcblBsZWFzZSB1c2UgLS1icmFuZHM9PXt7QlJBTkR9fSBpbiB0aGUgZnV0dXJlIHRvIGF2b2lkIHRoaXMuJyApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IGdydW50LmZpbGUucmVhZEpTT04oIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcclxuICBjb25zdCBlbmNvZGVyID0gbmV3IG5vZGVIVE1MRW5jb2Rlci5FbmNvZGVyKCAnZW50aXR5JyApO1xyXG5cclxuICAvLyBBbGwgaHRtbCBmaWxlcyBzaGFyZSB0aGUgc2FtZSBidWlsZCB0aW1lc3RhbXBcclxuICBsZXQgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCAnVCcgKS5qb2luKCAnICcgKTtcclxuICB0aW1lc3RhbXAgPSBgJHt0aW1lc3RhbXAuc3Vic3RyaW5nKCAwLCB0aW1lc3RhbXAuaW5kZXhPZiggJy4nICkgKX0gVVRDYDtcclxuXHJcbiAgLy8gU3RhcnQgcnVubmluZyB3ZWJwYWNrXHJcbiAgY29uc3Qgd2VicGFja1Jlc3VsdCA9IGF3YWl0IHJlY29yZFRpbWUoICd3ZWJwYWNrJywgYXN5bmMgKCkgPT4gd2VicGFja0J1aWxkKCByZXBvLCBicmFuZCwge1xyXG4gICAgcHJvZmlsZUZpbGVTaXplOiBwcm9maWxlRmlsZVNpemVcclxuICB9ICksIHRpbWUgPT4ge1xyXG4gICAgZ3J1bnQubG9nLm9rKCBgV2VicGFjayBidWlsZCBjb21wbGV0ZTogJHt0aW1lfW1zYCApO1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gTk9URTogVGhpcyBidWlsZCBjdXJyZW50bHkgKGR1ZSB0byB0aGUgc3RyaW5nL21pcG1hcCBwbHVnaW5zKSBtb2RpZmllcyBnbG9iYWxzLiBTb21lIG9wZXJhdGlvbnMgbmVlZCB0byBiZSBkb25lIGFmdGVyIHRoaXMuXHJcbiAgY29uc3Qgd2VicGFja0pTID0gd3JhcFByb2ZpbGVGaWxlU2l6ZSggYHBoZXQuY2hpcHBlci5ydW5XZWJwYWNrID0gZnVuY3Rpb24oKSB7JHt3ZWJwYWNrUmVzdWx0LmpzfX07YCwgcHJvZmlsZUZpbGVTaXplLCAnV0VCUEFDSycgKTtcclxuXHJcbiAgLy8gRGVidWcgdmVyc2lvbiBpcyBpbmRlcGVuZGVudCBvZiBwYXNzZWQgaW4gbWluaWZ5T3B0aW9ucy4gIFBoRVQtaU8gYnJhbmQgaXMgbWluaWZpZWQsIGJ1dCBsZWF2ZXMgYXNzZXJ0aW9ucyAmIGxvZ2dpbmcuXHJcbiAgY29uc3QgZGVidWdNaW5pZnlPcHRpb25zID0gYnJhbmQgPT09ICdwaGV0LWlvJyA/IHtcclxuICAgIHN0cmlwQXNzZXJ0aW9uczogZmFsc2UsXHJcbiAgICBzdHJpcExvZ2dpbmc6IGZhbHNlXHJcbiAgfSA6IHtcclxuICAgIG1pbmlmeTogZmFsc2VcclxuICB9O1xyXG5cclxuICAvLyBJZiB0dXJuaW5nIG9mZiBtaW5pZmljYXRpb24gZm9yIHRoZSBtYWluIGJ1aWxkLCBkb24ndCBtaW5pZnkgdGhlIGRlYnVnIHZlcnNpb24gYWxzb1xyXG4gIGlmICggbWluaWZ5T3B0aW9ucy5taW5pZnkgPT09IGZhbHNlICkge1xyXG4gICAgZGVidWdNaW5pZnlPcHRpb25zLm1pbmlmeSA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdXNlZE1vZHVsZXMgPSB3ZWJwYWNrUmVzdWx0LnVzZWRNb2R1bGVzO1xyXG4gIHJlcG9ydFVudXNlZE1lZGlhKCByZXBvLCB1c2VkTW9kdWxlcyApO1xyXG5cclxuICBjb25zdCBsaWNlbnNlRW50cmllcyA9IHt9O1xyXG4gIENoaXBwZXJDb25zdGFudHMuTUVESUFfVFlQRVMuZm9yRWFjaCggbWVkaWFUeXBlID0+IHtcclxuICAgIGxpY2Vuc2VFbnRyaWVzWyBtZWRpYVR5cGUgXSA9IHt9O1xyXG4gIH0gKTtcclxuXHJcbiAgdXNlZE1vZHVsZXMuZm9yRWFjaCggbW9kdWxlID0+IHtcclxuICAgIENoaXBwZXJDb25zdGFudHMuTUVESUFfVFlQRVMuZm9yRWFjaCggbWVkaWFUeXBlID0+IHtcclxuICAgICAgaWYgKCBtb2R1bGUuc3BsaXQoICcvJyApWyAxIF0gPT09IG1lZGlhVHlwZSApIHtcclxuXHJcbiAgICAgICAgLy8gVGhlIGZpbGUgc3VmZml4IGlzIHN0cmlwcGVkIGFuZCByZXN0b3JlZCB0byBpdHMgbm9uLWpzIGV4dGVuc2lvbi4gVGhpcyBpcyBiZWNhdXNlIGdldExpY2Vuc2VFbnRyeSBkb2Vzbid0XHJcbiAgICAgICAgLy8gaGFuZGxlIG1vZHVsaWZpZWQgbWVkaWEgZmlsZXMuXHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBtb2R1bGUubGFzdEluZGV4T2YoICdfJyApO1xyXG4gICAgICAgIGNvbnN0IHBhdGggPSBgJHttb2R1bGUuc2xpY2UoIDAsIGluZGV4ICl9LiR7bW9kdWxlLnNsaWNlKCBpbmRleCArIDEsIC0zICl9YDtcclxuICAgICAgICBsaWNlbnNlRW50cmllc1sgbWVkaWFUeXBlIF1bIG1vZHVsZSBdID0gZ2V0TGljZW5zZUVudHJ5KCBgLi4vJHtwYXRofWAgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgcGhldExpYnMgPSBnZXRQaGV0TGlicyggcmVwbywgYnJhbmQgKTtcclxuICBjb25zdCBhbGxMb2NhbGVzID0gWyBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSwgLi4uZ2V0TG9jYWxlc0Zyb21SZXBvc2l0b3J5KCByZXBvICkgXTtcclxuICBjb25zdCBsb2NhbGVzID0gbG9jYWxlc09wdGlvbiA9PT0gJyonID8gYWxsTG9jYWxlcyA6IGxvY2FsZXNPcHRpb24uc3BsaXQoICcsJyApO1xyXG4gIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggcmVwbyApO1xyXG5cclxuICB3ZWJwYWNrUmVzdWx0LnVzZWRNb2R1bGVzLmZvckVhY2goIG1vZHVsZURlcGVuZGVuY3kgPT4ge1xyXG5cclxuICAgIC8vIFRoZSBmaXJzdCBwYXJ0IG9mIHRoZSBwYXRoIGlzIHRoZSByZXBvLiAgT3IgaWYgbm8gZGlyZWN0b3J5IGlzIHNwZWNpZmllZCwgdGhlIGZpbGUgaXMgaW4gdGhlIHNpbSByZXBvLlxyXG4gICAgY29uc3QgcGF0aFNlcGFyYXRvckluZGV4ID0gbW9kdWxlRGVwZW5kZW5jeS5pbmRleE9mKCBwYXRoLnNlcCApO1xyXG4gICAgY29uc3QgbW9kdWxlUmVwbyA9IHBhdGhTZXBhcmF0b3JJbmRleCA+PSAwID8gbW9kdWxlRGVwZW5kZW5jeS5zbGljZSggMCwgcGF0aFNlcGFyYXRvckluZGV4ICkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgIHJlcG87XHJcbiAgICBhc3NlcnQoIE9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXMgKS5pbmNsdWRlcyggbW9kdWxlUmVwbyApLCBgcmVwbyAke21vZHVsZVJlcG99IG1pc3NpbmcgZnJvbSBwYWNrYWdlLmpzb24ncyBwaGV0TGlicyBmb3IgJHttb2R1bGVEZXBlbmRlbmN5fWAgKTtcclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IHZlcnNpb24gPSBwYWNrYWdlT2JqZWN0LnZlcnNpb247IC8vIEluY2x1ZGUgdGhlIG9uZS1vZmYgbmFtZSBpbiB0aGUgdmVyc2lvblxyXG4gIGNvbnN0IHRoaXJkUGFydHlFbnRyaWVzID0gZ2V0QWxsVGhpcmRQYXJ0eUVudHJpZXMoIHJlcG8sIGJyYW5kLCBsaWNlbnNlRW50cmllcyApO1xyXG4gIGNvbnN0IHNpbVRpdGxlU3RyaW5nS2V5ID0gZ2V0VGl0bGVTdHJpbmdLZXkoIHJlcG8gKTtcclxuXHJcbiAgY29uc3QgeyBzdHJpbmdNYXAsIHN0cmluZ01ldGFkYXRhIH0gPSBnZXRTdHJpbmdNYXAoIHJlcG8sIGFsbExvY2FsZXMsIHBoZXRMaWJzLCB3ZWJwYWNrUmVzdWx0LnVzZWRNb2R1bGVzICk7XHJcblxyXG4gIC8vIEFmdGVyIG91ciBzdHJpbmcgbWFwIGlzIGNvbnN0cnVjdGVkLCByZXBvcnQgd2hpY2ggb2YgdGhlIHRyYW5zbGF0YWJsZSBzdHJpbmdzIGFyZSB1bnVzZWQuXHJcbiAgcmVwb3J0VW51c2VkU3RyaW5ncyggcmVwbywgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSwgc3RyaW5nTWFwWyBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSBdICk7XHJcblxyXG4gIC8vIElmIHdlIGhhdmUgTk8gc3RyaW5ncyBmb3IgYSBnaXZlbiBsb2NhbGUgdGhhdCB3ZSB3YW50LCB3ZSdsbCBuZWVkIHRvIGZpbGwgaXQgaW4gd2l0aCBhbGwgRW5nbGlzaCBzdHJpbmdzLCBzZWVcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy84M1xyXG4gIGZvciAoIGNvbnN0IGxvY2FsZSBvZiBsb2NhbGVzICkge1xyXG4gICAgaWYgKCAhc3RyaW5nTWFwWyBsb2NhbGUgXSApIHtcclxuICAgICAgc3RyaW5nTWFwWyBsb2NhbGUgXSA9IHN0cmluZ01hcFsgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGVuZ2xpc2hUaXRsZSA9IHN0cmluZ01hcFsgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgXVsgc2ltVGl0bGVTdHJpbmdLZXkgXTtcclxuICBhc3NlcnQoIGVuZ2xpc2hUaXRsZSwgYG1pc3NpbmcgZW50cnkgZm9yIHNpbSB0aXRsZSwga2V5ID0gJHtzaW1UaXRsZVN0cmluZ0tleX1gICk7XHJcblxyXG4gIC8vIFNlbGVjdCB0aGUgSFRNTCBjb21tZW50IGhlYWRlciBiYXNlZCBvbiB0aGUgYnJhbmQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTU2XHJcbiAgbGV0IGh0bWxIZWFkZXI7XHJcbiAgaWYgKCBicmFuZCA9PT0gJ3BoZXQtaW8nICkge1xyXG5cclxuICAgIC8vIExpY2Vuc2UgdGV4dCBwcm92aWRlZCBieSBAa2F0aHktcGhldCBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTQ4I2lzc3VlY29tbWVudC0xMTI1ODQ3NzNcclxuICAgIGh0bWxIZWFkZXIgPSBgJHtlbmdsaXNoVGl0bGV9ICR7dmVyc2lvbn1cXG5gICtcclxuICAgICAgICAgICAgICAgICBgQ29weXJpZ2h0IDIwMDItJHtncnVudC50ZW1wbGF0ZS50b2RheSggJ3l5eXknICl9LCBSZWdlbnRzIG9mIHRoZSBVbml2ZXJzaXR5IG9mIENvbG9yYWRvXFxuYCArXHJcbiAgICAgICAgICAgICAgICAgJ1BoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxcbicgK1xyXG4gICAgICAgICAgICAgICAgICdcXG4nICtcclxuICAgICAgICAgICAgICAgICAnVGhpcyBJbnRlcm9wZXJhYmxlIFBoRVQgU2ltdWxhdGlvbiBmaWxlIHJlcXVpcmVzIGEgbGljZW5zZS5cXG4nICtcclxuICAgICAgICAgICAgICAgICAnVVNFIFdJVEhPVVQgQSBMSUNFTlNFIEFHUkVFTUVOVCBJUyBTVFJJQ1RMWSBQUk9ISUJJVEVELlxcbicgK1xyXG4gICAgICAgICAgICAgICAgICdDb250YWN0IHBoZXRoZWxwQGNvbG9yYWRvLmVkdSByZWdhcmRpbmcgbGljZW5zaW5nLlxcbicgK1xyXG4gICAgICAgICAgICAgICAgICdodHRwczovL3BoZXQuY29sb3JhZG8uZWR1L2VuL2xpY2Vuc2luZyc7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgaHRtbEhlYWRlciA9IGAke2VuZ2xpc2hUaXRsZX0gJHt2ZXJzaW9ufVxcbmAgK1xyXG4gICAgICAgICAgICAgICAgIGBDb3B5cmlnaHQgMjAwMi0ke2dydW50LnRlbXBsYXRlLnRvZGF5KCAneXl5eScgKX0sIFJlZ2VudHMgb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG9cXG5gICtcclxuICAgICAgICAgICAgICAgICAnUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ1xcbicgK1xyXG4gICAgICAgICAgICAgICAgICdUaGlzIGZpbGUgaXMgbGljZW5zZWQgdW5kZXIgQ3JlYXRpdmUgQ29tbW9ucyBBdHRyaWJ1dGlvbiA0LjBcXG4nICtcclxuICAgICAgICAgICAgICAgICAnRm9yIGFsdGVybmF0ZSBzb3VyY2UgY29kZSBsaWNlbnNpbmcsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXNcXG4nICtcclxuICAgICAgICAgICAgICAgICAnRm9yIGxpY2Vuc2VzIGZvciB0aGlyZC1wYXJ0eSBzb2Z0d2FyZSB1c2VkIGJ5IHRoaXMgc2ltdWxhdGlvbiwgc2VlIGJlbG93XFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ0ZvciBtb3JlIGluZm9ybWF0aW9uLCBzZWUgaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdS9lbi9saWNlbnNpbmcvaHRtbFxcbicgK1xyXG4gICAgICAgICAgICAgICAgICdcXG4nICtcclxuICAgICAgICAgICAgICAgICAnVGhlIFBoRVQgbmFtZSBhbmQgUGhFVCBsb2dvIGFyZSByZWdpc3RlcmVkIHRyYWRlbWFya3Mgb2YgVGhlIFJlZ2VudHMgb2YgdGhlXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ1VuaXZlcnNpdHkgb2YgQ29sb3JhZG8uIFBlcm1pc3Npb24gaXMgZ3JhbnRlZCB0byB1c2UgdGhlIFBoRVQgbmFtZSBhbmQgUGhFVCBsb2dvXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ29ubHkgZm9yIGF0dHJpYnV0aW9uIHB1cnBvc2VzLiBVc2Ugb2YgdGhlIFBoRVQgbmFtZSBhbmQvb3IgUGhFVCBsb2dvIGZvciBwcm9tb3Rpb25hbCxcXG4nICtcclxuICAgICAgICAgICAgICAgICAnbWFya2V0aW5nLCBvciBhZHZlcnRpc2luZyBwdXJwb3NlcyByZXF1aXJlcyBhIHNlcGFyYXRlIGxpY2Vuc2UgYWdyZWVtZW50IGZyb20gdGhlXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ1VuaXZlcnNpdHkgb2YgQ29sb3JhZG8uIENvbnRhY3QgcGhldGhlbHBAY29sb3JhZG8uZWR1IHJlZ2FyZGluZyBsaWNlbnNpbmcuJztcclxuICB9XHJcblxyXG4gIC8vIFNjcmlwdHMgdGhhdCBhcmUgcnVuIGJlZm9yZSBvdXIgbWFpbiBtaW5pZmlhYmxlIGNvbnRlbnRcclxuICBjb25zdCBzdGFydHVwU2NyaXB0cyA9IFtcclxuICAgIC8vIFNwbGFzaCBpbWFnZVxyXG4gICAgd3JhcFByb2ZpbGVGaWxlU2l6ZSggYHdpbmRvdy5QSEVUX1NQTEFTSF9EQVRBX1VSST1cIiR7bG9hZEZpbGVBc0RhdGFVUkkoIGAuLi9icmFuZC8ke2JyYW5kfS9pbWFnZXMvc3BsYXNoLnN2Z2AgKX1cIjtgLCBwcm9maWxlRmlsZVNpemUsICdTUExBU0gnIClcclxuICBdO1xyXG5cclxuICBjb25zdCBtaW5pZmlhYmxlU2NyaXB0cyA9IFtcclxuICAgIC8vIFByZWxvYWRzXHJcbiAgICAuLi5nZXRQcmVsb2FkcyggcmVwbywgYnJhbmQsIHRydWUgKS5tYXAoIGZpbGVuYW1lID0+IHdyYXBQcm9maWxlRmlsZVNpemUoIGdydW50LmZpbGUucmVhZCggZmlsZW5hbWUgKSwgcHJvZmlsZUZpbGVTaXplLCAnUFJFTE9BRCcsIGZpbGVuYW1lICkgKSxcclxuXHJcbiAgICAvLyBPdXIgbWFpbiBtb2R1bGUgY29udGVudCwgd3JhcHBlZCBpbiBhIGZ1bmN0aW9uIGNhbGxlZCBpbiB0aGUgc3RhcnR1cCBiZWxvd1xyXG4gICAgd2VicGFja0pTLFxyXG5cclxuICAgIC8vIE1haW4gc3RhcnR1cFxyXG4gICAgd3JhcFByb2ZpbGVGaWxlU2l6ZSggZ3J1bnQuZmlsZS5yZWFkKCAnLi4vY2hpcHBlci90ZW1wbGF0ZXMvY2hpcHBlci1zdGFydHVwLmpzJyApLCBwcm9maWxlRmlsZVNpemUsICdTVEFSVFVQJyApXHJcbiAgXTtcclxuXHJcbiAgY29uc3QgcHJvZHVjdGlvblNjcmlwdHMgPSBhd2FpdCByZWNvcmRUaW1lKCAnbWluaWZ5LXByb2R1Y3Rpb24nLCBhc3luYyAoKSA9PiB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAuLi5zdGFydHVwU2NyaXB0cyxcclxuICAgICAgLi4ubWluaWZpYWJsZVNjcmlwdHMubWFwKCBqcyA9PiBtaW5pZnkoIGpzLCBtaW5pZnlPcHRpb25zICkgKVxyXG4gICAgXTtcclxuICB9LCAoIHRpbWUsIHNjcmlwdHMgKSA9PiB7XHJcbiAgICBncnVudC5sb2cub2soIGBQcm9kdWN0aW9uIG1pbmlmaWNhdGlvbiBjb21wbGV0ZTogJHt0aW1lfW1zICgke18uc3VtKCBzY3JpcHRzLm1hcCgganMgPT4ganMubGVuZ3RoICkgKX0gYnl0ZXMpYCApO1xyXG4gIH0gKTtcclxuICBjb25zdCBkZWJ1Z1NjcmlwdHMgPSBhd2FpdCByZWNvcmRUaW1lKCAnbWluaWZ5LWRlYnVnJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgLi4uc3RhcnR1cFNjcmlwdHMsXHJcbiAgICAgIC4uLm1pbmlmaWFibGVTY3JpcHRzLm1hcCgganMgPT4gbWluaWZ5KCBqcywgZGVidWdNaW5pZnlPcHRpb25zICkgKVxyXG4gICAgXTtcclxuICB9LCAoIHRpbWUsIHNjcmlwdHMgKSA9PiB7XHJcbiAgICBncnVudC5sb2cub2soIGBEZWJ1ZyBtaW5pZmljYXRpb24gY29tcGxldGU6ICR7dGltZX1tcyAoJHtfLnN1bSggc2NyaXB0cy5tYXAoIGpzID0+IGpzLmxlbmd0aCApICl9IGJ5dGVzKWAgKTtcclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IGxpY2Vuc2VTY3JpcHQgPSB3cmFwUHJvZmlsZUZpbGVTaXplKCBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZVBsYWNlaG9sZGVycyggZ3J1bnQuZmlsZS5yZWFkKCAnLi4vY2hpcHBlci90ZW1wbGF0ZXMvbGljZW5zZS1pbml0aWFsaXphdGlvbi5qcycgKSwge1xyXG4gICAgUEhFVF9TVEFSVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVM6IENoaXBwZXJDb25zdGFudHMuU1RBUlRfVEhJUkRfUEFSVFlfTElDRU5TRV9FTlRSSUVTLFxyXG4gICAgUEhFVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVM6IEpTT04uc3RyaW5naWZ5KCB0aGlyZFBhcnR5RW50cmllcywgbnVsbCwgMiApLFxyXG4gICAgUEhFVF9FTkRfVEhJUkRfUEFSVFlfTElDRU5TRV9FTlRSSUVTOiBDaGlwcGVyQ29uc3RhbnRzLkVORF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVNcclxuICB9ICksIHByb2ZpbGVGaWxlU2l6ZSwgJ0xJQ0VOU0UnICk7XHJcblxyXG4gIGNvbnN0IGNvbW1vbkluaXRpYWxpemF0aW9uT3B0aW9ucyA9IHtcclxuICAgIGJyYW5kOiBicmFuZCxcclxuICAgIHJlcG86IHJlcG8sXHJcbiAgICBzdHJpbmdNYXA6IHN0cmluZ01hcCxcclxuICAgIHN0cmluZ01ldGFkYXRhOiBzdHJpbmdNZXRhZGF0YSxcclxuICAgIGRlcGVuZGVuY2llczogZGVwZW5kZW5jaWVzLFxyXG4gICAgdGltZXN0YW1wOiB0aW1lc3RhbXAsXHJcbiAgICB2ZXJzaW9uOiB2ZXJzaW9uLFxyXG4gICAgcGFja2FnZU9iamVjdDogcGFja2FnZU9iamVjdCxcclxuICAgIGFsbG93TG9jYWxlU3dpdGNoaW5nOiBmYWxzZSxcclxuICAgIGVuY29kZVN0cmluZ01hcDogZW5jb2RlU3RyaW5nTWFwLFxyXG4gICAgcHJvZmlsZUZpbGVTaXplOiBwcm9maWxlRmlsZVNpemUsXHJcbiAgICB3cmFwU3RyaW5nc0pTOiBzdHJpbmdzSlMgPT4gd3JhcFByb2ZpbGVGaWxlU2l6ZSggc3RyaW5nc0pTLCBwcm9maWxlRmlsZVNpemUsICdTVFJJTkdTJyApXHJcbiAgfTtcclxuXHJcbiAgLy8gQ3JlYXRlIHRoZSBidWlsZC1zcGVjaWZpYyBkaXJlY3RvcnlcclxuICBjb25zdCBidWlsZERpciA9IGAuLi8ke3JlcG99L2J1aWxkLyR7YnJhbmR9YDtcclxuICBncnVudC5maWxlLm1rZGlyKCBidWlsZERpciApO1xyXG5cclxuICAvLyB7e2xvY2FsZX19Lmh0bWxcclxuICBpZiAoIGJyYW5kICE9PSAncGhldC1pbycgKSB7XHJcbiAgICBmb3IgKCBjb25zdCBsb2NhbGUgb2YgbG9jYWxlcyApIHtcclxuICAgICAgY29uc3QgaW5pdGlhbGl6YXRpb25TY3JpcHQgPSBnZXRJbml0aWFsaXphdGlvblNjcmlwdCggXy5hc3NpZ25Jbigge1xyXG4gICAgICAgIGxvY2FsZTogbG9jYWxlLFxyXG4gICAgICAgIGluY2x1ZGVBbGxMb2NhbGVzOiBmYWxzZSxcclxuICAgICAgICBpc0RlYnVnQnVpbGQ6IGZhbHNlXHJcbiAgICAgIH0sIGNvbW1vbkluaXRpYWxpemF0aW9uT3B0aW9ucyApICk7XHJcblxyXG4gICAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfV8ke2xvY2FsZX1fJHticmFuZH0uaHRtbGAsIHBhY2thZ2VSdW5uYWJsZSgge1xyXG4gICAgICAgIHJlcG86IHJlcG8sXHJcbiAgICAgICAgc3RyaW5nTWFwOiBzdHJpbmdNYXAsXHJcbiAgICAgICAgaHRtbEhlYWRlcjogaHRtbEhlYWRlcixcclxuICAgICAgICBsb2NhbGU6IGxvY2FsZSxcclxuICAgICAgICBjb21wcmVzc1NjcmlwdHM6IGNvbXByZXNzU2NyaXB0cyxcclxuICAgICAgICBsaWNlbnNlU2NyaXB0OiBsaWNlbnNlU2NyaXB0LFxyXG4gICAgICAgIHNjcmlwdHM6IFsgaW5pdGlhbGl6YXRpb25TY3JpcHQsIC4uLnByb2R1Y3Rpb25TY3JpcHRzIF1cclxuICAgICAgfSApICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBfYWxsLmh0bWwgKGZvcmNlZCBmb3IgcGhldC1pbylcclxuICBpZiAoIGFsbEhUTUwgfHwgYnJhbmQgPT09ICdwaGV0LWlvJyApIHtcclxuICAgIGNvbnN0IGluaXRpYWxpemF0aW9uU2NyaXB0ID0gZ2V0SW5pdGlhbGl6YXRpb25TY3JpcHQoIF8uYXNzaWduSW4oIHtcclxuICAgICAgbG9jYWxlOiBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSxcclxuICAgICAgaW5jbHVkZUFsbExvY2FsZXM6IHRydWUsXHJcbiAgICAgIGlzRGVidWdCdWlsZDogZmFsc2VcclxuICAgIH0sIGNvbW1vbkluaXRpYWxpemF0aW9uT3B0aW9ucywge1xyXG4gICAgICBhbGxvd0xvY2FsZVN3aXRjaGluZzogdHJ1ZVxyXG4gICAgfSApICk7XHJcblxyXG4gICAgY29uc3QgYWxsSFRNTEZpbGVuYW1lID0gYCR7YnVpbGREaXJ9LyR7cmVwb31fYWxsXyR7YnJhbmR9Lmh0bWxgO1xyXG4gICAgY29uc3QgYWxsSFRNTENvbnRlbnRzID0gcGFja2FnZVJ1bm5hYmxlKCB7XHJcbiAgICAgIHJlcG86IHJlcG8sXHJcbiAgICAgIHN0cmluZ01hcDogc3RyaW5nTWFwLFxyXG4gICAgICBodG1sSGVhZGVyOiBodG1sSGVhZGVyLFxyXG4gICAgICBsb2NhbGU6IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFLFxyXG4gICAgICBjb21wcmVzc1NjcmlwdHM6IGNvbXByZXNzU2NyaXB0cyxcclxuICAgICAgbGljZW5zZVNjcmlwdDogbGljZW5zZVNjcmlwdCxcclxuICAgICAgc2NyaXB0czogWyBpbml0aWFsaXphdGlvblNjcmlwdCwgLi4ucHJvZHVjdGlvblNjcmlwdHMgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIGdydW50LmZpbGUud3JpdGUoIGFsbEhUTUxGaWxlbmFtZSwgYWxsSFRNTENvbnRlbnRzICk7XHJcblxyXG4gICAgLy8gQWRkIGEgY29tcHJlc3NlZCBmaWxlIHRvIGltcHJvdmUgcGVyZm9ybWFuY2UgaW4gdGhlIGlPUyBhcHAsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvNzQ2XHJcbiAgICBncnVudC5maWxlLndyaXRlKCBgJHthbGxIVE1MRmlsZW5hbWV9Lmd6YCwgemxpYi5nemlwU3luYyggYWxsSFRNTENvbnRlbnRzICkgKTtcclxuICB9XHJcblxyXG4gIC8vIERlYnVnIGJ1aWxkIChhbHdheXMgaW5jbHVkZWQpXHJcbiAgY29uc3QgZGVidWdJbml0aWFsaXphdGlvblNjcmlwdCA9IGdldEluaXRpYWxpemF0aW9uU2NyaXB0KCBfLmFzc2lnbkluKCB7XHJcbiAgICBsb2NhbGU6IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFLFxyXG4gICAgaW5jbHVkZUFsbExvY2FsZXM6IHRydWUsXHJcbiAgICBpc0RlYnVnQnVpbGQ6IHRydWVcclxuICB9LCBjb21tb25Jbml0aWFsaXphdGlvbk9wdGlvbnMsIHtcclxuICAgIGFsbG93TG9jYWxlU3dpdGNoaW5nOiB0cnVlXHJcbiAgfSApICk7XHJcblxyXG4gIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99X2FsbF8ke2JyYW5kfV9kZWJ1Zy5odG1sYCwgcGFja2FnZVJ1bm5hYmxlKCB7XHJcbiAgICByZXBvOiByZXBvLFxyXG4gICAgc3RyaW5nTWFwOiBzdHJpbmdNYXAsXHJcbiAgICBodG1sSGVhZGVyOiBodG1sSGVhZGVyLFxyXG4gICAgbG9jYWxlOiBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSxcclxuICAgIGNvbXByZXNzU2NyaXB0czogY29tcHJlc3NTY3JpcHRzLFxyXG4gICAgbGljZW5zZVNjcmlwdDogbGljZW5zZVNjcmlwdCxcclxuICAgIHNjcmlwdHM6IFsgZGVidWdJbml0aWFsaXphdGlvblNjcmlwdCwgLi4uZGVidWdTY3JpcHRzIF1cclxuICB9ICkgKTtcclxuXHJcbiAgLy8gWEhUTUwgYnVpbGQgKGVQdWIgY29tcGF0aWJpbGl0eSwgZXRjLilcclxuICBjb25zdCB4aHRtbERpciA9IGAke2J1aWxkRGlyfS94aHRtbGA7XHJcbiAgZ3J1bnQuZmlsZS5ta2RpciggeGh0bWxEaXIgKTtcclxuICBjb25zdCB4aHRtbEluaXRpYWxpemF0aW9uU2NyaXB0ID0gZ2V0SW5pdGlhbGl6YXRpb25TY3JpcHQoIF8uYXNzaWduSW4oIHtcclxuICAgIGxvY2FsZTogQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUsXHJcbiAgICBpbmNsdWRlQWxsTG9jYWxlczogdHJ1ZSxcclxuICAgIGlzRGVidWdCdWlsZDogZmFsc2VcclxuICB9LCBjb21tb25Jbml0aWFsaXphdGlvbk9wdGlvbnMsIHtcclxuICAgIGFsbG93TG9jYWxlU3dpdGNoaW5nOiB0cnVlXHJcbiAgfSApICk7XHJcblxyXG4gIHBhY2thZ2VYSFRNTCggeGh0bWxEaXIsIHtcclxuICAgIHJlcG86IHJlcG8sXHJcbiAgICBicmFuZDogYnJhbmQsXHJcbiAgICBzdHJpbmdNYXA6IHN0cmluZ01hcCxcclxuICAgIGh0bWxIZWFkZXI6IGh0bWxIZWFkZXIsXHJcbiAgICBpbml0aWFsaXphdGlvblNjcmlwdDogeGh0bWxJbml0aWFsaXphdGlvblNjcmlwdCxcclxuICAgIGxpY2Vuc2VTY3JpcHQ6IGxpY2Vuc2VTY3JpcHQsXHJcbiAgICBzY3JpcHRzOiBwcm9kdWN0aW9uU2NyaXB0c1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gZGVwZW5kZW5jaWVzLmpzb25cclxuICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vZGVwZW5kZW5jaWVzLmpzb25gLCBKU09OLnN0cmluZ2lmeSggZGVwZW5kZW5jaWVzLCBudWxsLCAyICkgKTtcclxuXHJcbiAgLy8gc3RyaW5nLW1hcC5qc29uIGFuZCBlbmdsaXNoLXN0cmluZy1tYXAuanNvbiwgZm9yIHRoaW5ncyBsaWtlIFJvc2V0dGEgdGhhdCBuZWVkIHRvIGtub3cgd2hhdCBzdHJpbmdzIGFyZSB1c2VkXHJcbiAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9L3N0cmluZy1tYXAuanNvbmAsIEpTT04uc3RyaW5naWZ5KCBzdHJpbmdNYXAsIG51bGwsIDIgKSApO1xyXG4gIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS9lbmdsaXNoLXN0cmluZy1tYXAuanNvbmAsIEpTT04uc3RyaW5naWZ5KCBzdHJpbmdNYXAuZW4sIG51bGwsIDIgKSApO1xyXG5cclxuICAvLyAtaWZyYW1lLmh0bWwgKEVuZ2xpc2ggaXMgYXNzdW1lZCBhcyB0aGUgbG9jYWxlKS5cclxuICBpZiAoIF8uaW5jbHVkZXMoIGxvY2FsZXMsIENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFICkgJiYgYnJhbmQgPT09ICdwaGV0JyApIHtcclxuICAgIGNvbnN0IGVuZ2xpc2hUaXRsZSA9IHN0cmluZ01hcFsgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgXVsgZ2V0VGl0bGVTdHJpbmdLZXkoIHJlcG8gKSBdO1xyXG5cclxuICAgIGdydW50LmxvZy5kZWJ1ZyggJ0NvbnN0cnVjdGluZyBIVE1MIGZvciBpZnJhbWUgdGVzdGluZyBmcm9tIHRlbXBsYXRlJyApO1xyXG4gICAgbGV0IGlmcmFtZVRlc3RIdG1sID0gZ3J1bnQuZmlsZS5yZWFkKCAnLi4vY2hpcHBlci90ZW1wbGF0ZXMvc2ltLWlmcmFtZS5odG1sJyApO1xyXG4gICAgaWZyYW1lVGVzdEh0bWwgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUZpcnN0KCBpZnJhbWVUZXN0SHRtbCwgJ3t7UEhFVF9TSU1fVElUTEV9fScsIGVuY29kZXIuaHRtbEVuY29kZSggYCR7ZW5nbGlzaFRpdGxlfSBpZnJhbWUgdGVzdGAgKSApO1xyXG4gICAgaWZyYW1lVGVzdEh0bWwgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUZpcnN0KCBpZnJhbWVUZXN0SHRtbCwgJ3t7UEhFVF9SRVBPU0lUT1JZfX0nLCByZXBvICk7XHJcblxyXG4gICAgY29uc3QgaWZyYW1lTG9jYWxlcyA9IFsgJ2VuJyBdLmNvbmNhdCggYWxsSFRNTCA/IFsgJ2FsbCcgXSA6IFtdICk7XHJcbiAgICBpZnJhbWVMb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcbiAgICAgIGNvbnN0IGlmcmFtZUh0bWwgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUZpcnN0KCBpZnJhbWVUZXN0SHRtbCwgJ3t7UEhFVF9MT0NBTEV9fScsIGxvY2FsZSApO1xyXG4gICAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfV8ke2xvY2FsZX1faWZyYW1lX3BoZXQuaHRtbGAsIGlmcmFtZUh0bWwgKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8vIElmIHRoZSBzaW0gaXMgYTExeSBvdXRmaXR0ZWQsIHRoZW4gYWRkIHRoZSBhMTF5IHBkb20gdmlld2VyIHRvIHRoZSBidWlsZCBkaXIuIE5PVEU6IE5vdCBmb3IgcGhldC1pbyBidWlsZHMuXHJcbiAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQuc2ltRmVhdHVyZXMgJiYgcGFja2FnZU9iamVjdC5waGV0LnNpbUZlYXR1cmVzLnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbiAmJiBicmFuZCA9PT0gJ3BoZXQnICkge1xyXG4gICAgLy8gKGExMXkpIENyZWF0ZSB0aGUgYTExeS12aWV3IEhUTUwgZmlsZSBmb3IgUERPTSB2aWV3aW5nLlxyXG4gICAgbGV0IGExMXlIVE1MID0gZ2V0QTExeVZpZXdIVE1MRnJvbVRlbXBsYXRlKCByZXBvICk7XHJcblxyXG4gICAgLy8gdGhpcyByZXBsYWNlQWxsIGlzIG91dHNpZGUgb2YgdGhlIGdldEExMXlWaWV3SFRNTEZyb21UZW1wbGF0ZSBiZWNhdXNlIHdlIG9ubHkgd2FudCBpdCBmaWxsZWQgaW4gZHVyaW5nIHRoZSBidWlsZFxyXG4gICAgYTExeUhUTUwgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggYTExeUhUTUwsICd7e0lTX0JVSUxUfX0nLCAndHJ1ZScgKTtcclxuXHJcbiAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfSR7Q2hpcHBlckNvbnN0YW50cy5BMTFZX1ZJRVdfSFRNTF9TVUZGSVh9YCwgYTExeUhUTUwgKTtcclxuICB9XHJcblxyXG4gIC8vIGNvcHkgb3ZlciBzdXBwbGVtZW50YWwgZmlsZXMgb3IgZGlycyB0byBwYWNrYWdlIHdpdGggdGhlIGJ1aWxkLiBPbmx5IHN1cHBvcnRlZCBpbiBwaGV0IGJyYW5kXHJcbiAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQgJiYgcGFja2FnZU9iamVjdC5waGV0LnBhY2thZ2VXaXRoQnVpbGQgKSB7XHJcblxyXG4gICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBwYWNrYWdlT2JqZWN0LnBoZXQucGFja2FnZVdpdGhCdWlsZCApICk7XHJcbiAgICBwYWNrYWdlT2JqZWN0LnBoZXQucGFja2FnZVdpdGhCdWlsZC5mb3JFYWNoKCBwYXRoID0+IHtcclxuXHJcbiAgICAgIGFzc2VydCggdHlwZW9mIHBhdGggPT09ICdzdHJpbmcnLCAncGF0aCBzaG91bGQgYmUgYSBzdHJpbmcnICk7XHJcbiAgICAgIGFzc2VydCggZ3J1bnQuZmlsZS5leGlzdHMoIHBhdGggKSwgYHBhdGggZG9lcyBub3QgZXhpc3Q6ICR7cGF0aH1gICk7XHJcbiAgICAgIGlmICggZ3J1bnQuZmlsZS5pc0RpciggcGF0aCApICkge1xyXG4gICAgICAgIGNvcHlEaXJlY3RvcnkoIHBhdGgsIGAke2J1aWxkRGlyfS8ke3BhdGh9YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGdydW50LmZpbGUuY29weSggcGF0aCwgYCR7YnVpbGREaXJ9LyR7cGF0aH1gICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIGlmICggYnJhbmQgPT09ICdwaGV0LWlvJyApIHtcclxuICAgIGF3YWl0IGNvcHlTdXBwbGVtZW50YWxQaGV0aW9GaWxlcyggcmVwbywgdmVyc2lvbiwgZW5nbGlzaFRpdGxlLCBwYWNrYWdlT2JqZWN0LCBidWlsZExvY2FsLCB0cnVlICk7XHJcbiAgfVxyXG5cclxuICAvLyBUaHVtYm5haWxzIGFuZCB0d2l0dGVyIGNhcmRcclxuICBpZiAoIGdydW50LmZpbGUuZXhpc3RzKCBgLi4vJHtyZXBvfS9hc3NldHMvJHtyZXBvfS1zY3JlZW5zaG90LnBuZ2AgKSApIHtcclxuICAgIGNvbnN0IHRodW1ibmFpbFNpemVzID0gW1xyXG4gICAgICB7IHdpZHRoOiAxMjgsIGhlaWdodDogODQgfSxcclxuICAgICAgeyB3aWR0aDogNjAwLCBoZWlnaHQ6IDM5NCB9XHJcbiAgICBdO1xyXG4gICAgZm9yICggY29uc3Qgc2l6ZSBvZiB0aHVtYm5haWxTaXplcyApIHtcclxuICAgICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9LyR7cmVwb30tJHtzaXplLndpZHRofS5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIHNpemUud2lkdGgsIHNpemUuaGVpZ2h0LCAxMDAsIGppbXAuTUlNRV9QTkcgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggYnJhbmQgPT09ICdwaGV0JyApIHtcclxuICAgICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9LyR7cmVwb30taW9zLnBuZ2AsIGF3YWl0IGdlbmVyYXRlVGh1bWJuYWlscyggcmVwbywgNDIwLCAyNzYsIDkwLCBqaW1wLk1JTUVfSlBFRyApICk7XHJcbiAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LXR3aXR0ZXItY2FyZC5wbmdgLCBhd2FpdCBnZW5lcmF0ZVR3aXR0ZXJDYXJkKCByZXBvICkgKTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vLyBGb3IgcHJvZmlsaW5nIGZpbGUgc2l6ZS4gTmFtZSBpcyBvcHRpb25hbFxyXG5jb25zdCB3cmFwUHJvZmlsZUZpbGVTaXplID0gKCBzdHJpbmcsIHByb2ZpbGVGaWxlU2l6ZSwgdHlwZSwgbmFtZSApID0+IHtcclxuICBpZiAoIHByb2ZpbGVGaWxlU2l6ZSApIHtcclxuICAgIGNvbnN0IGNvbmRpdGlvbmFsTmFtZSA9IG5hbWUgPyBgLFwiJHtuYW1lfVwiYCA6ICcnO1xyXG4gICAgcmV0dXJuIGBjb25zb2xlLmxvZyhcIlNUQVJUXyR7dHlwZS50b1VwcGVyQ2FzZSgpfVwiJHtjb25kaXRpb25hbE5hbWV9KTtcXG4ke3N0cmluZ31cXG5jb25zb2xlLmxvZyhcIkVORF8ke3R5cGUudG9VcHBlckNhc2UoKX1cIiR7Y29uZGl0aW9uYWxOYW1lfSk7XFxuXFxuYDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICByZXR1cm4gc3RyaW5nO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0E7QUFDQSxNQUFNQSxDQUFDLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDN0IsTUFBTUMsTUFBTSxHQUFHRCxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQ2xDLE1BQU1FLGdCQUFnQixHQUFHRixPQUFPLENBQUUsNEJBQTZCLENBQUM7QUFDaEUsTUFBTUcsa0JBQWtCLEdBQUdILE9BQU8sQ0FBRSw4QkFBK0IsQ0FBQztBQUNwRSxN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