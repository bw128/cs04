// Copyright 2013-2024, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects. In general when possible, modules are imported lazily in their task
 * declaration to save on overall load time of this file. The pattern is to require all modules needed at the top of the
 * grunt task registration. If a module is used in multiple tasks, it is best to lazily require in each
 * task.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

///////////////////////////
// NOTE: to improve performance, the vast majority of modules are lazily imported in task registrations. Even duplicating
// require statements improves the load time of this file noticeably. For details, see https://github.com/phetsims/chipper/issues/1107
const assert = require('assert');
require('./checkNodeVersion');
///////////////////////////

// Allow other Gruntfiles to potentially handle exiting and errors differently`
if (!global.processEventOptOut) {
  // See https://medium.com/@dtinth/making-unhandled-promise-rejections-crash-the-node-js-process-ffc27cfcc9dd for how
  // to get unhandled promise rejections to fail out the node process.
  // Relevant for https://github.com/phetsims/wave-interference/issues/491
  process.on('unhandledRejection', up => {
    throw up;
  });

  // Exit on Ctrl + C case
  process.on('SIGINT', () => {
    console.log('\n\nCaught interrupt signal, exiting');
    process.exit();
  });
}
const Transpiler = require('../common/Transpiler');
const transpiler = new Transpiler({
  silent: true
});
module.exports = function (grunt) {
  const packageObject = grunt.file.readJSON('package.json');

  // Handle the lack of build.json
  let buildLocal;
  try {
    buildLocal = grunt.file.readJSON(`${process.env.HOME}/.phet/build-local.json`);
  } catch (e) {
    buildLocal = {};
  }
  const repo = grunt.option('repo') || packageObject.name;
  assert(typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test(repo), 'repo name should be composed of lower-case characters, optionally with dashes used as separators');

  /**
   * Wraps a promise's completion with grunt's asynchronous handling, with added helpful failure messages (including
   * stack traces, regardless of whether --stack was provided).
   * @public
   *
   * @param {Promise} promise
   */
  async function wrap(promise) {
    const done = grunt.task.current.async();
    try {
      await promise;
    } catch (e) {
      if (e.stack) {
        grunt.fail.fatal(`Perennial task failed:\n${e.stack}\nFull Error details:\n${e}`);
      }

      // The toString check handles a weird case found from an Error object from puppeteer that doesn't stringify with
      // JSON or have a stack, JSON.stringifies to "{}", but has a `toString` method
      else if (typeof e === 'string' || JSON.stringify(e).length === 2 && e.toString) {
        grunt.fail.fatal(`Perennial task failed: ${e}`);
      } else {
        grunt.fail.fatal(`Perennial task failed with unknown error: ${JSON.stringify(e, null, 2)}`);
      }
    }
    done();
  }

  /**
   * Wraps an async function for a grunt task. Will run the async function when the task should be executed. Will
   * properly handle grunt's async handling, and provides improved error reporting.
   * @public
   *
   * @param {async function} asyncTaskFunction
   */
  function wrapTask(asyncTaskFunction) {
    return () => {
      wrap(asyncTaskFunction());
    };
  }
  grunt.registerTask('default', 'Builds the repository', [...(grunt.option('lint') === false ? [] : ['lint-all']), ...(grunt.option('report-media') === false ? [] : ['report-media']), 'clean', 'build']);
  grunt.registerTask('clean', 'Erases the build/ directory and all its contents, and recreates the build/ directory', wrapTask(async () => {
    const buildDirectory = `../${repo}/build`;
    if (grunt.file.exists(buildDirectory)) {
      grunt.file.delete(buildDirectory);
    }
    grunt.file.mkdir(buildDirectory);
  }));
  grunt.registerTask('build-images', 'Build images only', wrapTask(async () => {
    const jimp = require('jimp');
    const generateThumbnails = require('./generateThumbnails');
    const generateTwitterCard = require('./generateTwitterCard');
    const brand = 'phet';
    grunt.log.writeln(`Building images for brand: ${brand}`);
    const buildDir = `../${repo}/build/${brand}`;
    // Thumbnails and twitter card
    if (grunt.file.exists(`../${repo}/assets/${repo}-screenshot.png`)) {
      const thumbnailSizes = [{
        width: 900,
        height: 591
      }, {
        width: 600,
        height: 394
      }, {
        width: 420,
        height: 276
      }, {
        width: 128,
        height: 84
      }, {
        width: 15,
        height: 10
      }];
      for (const size of thumbnailSizes) {
        grunt.file.write(`${buildDir}/${repo}-${size.width}.png`, await generateThumbnails(repo, size.width, size.height, 100, jimp.MIME_PNG));
      }
      const altScreenshots = grunt.file.expand({
        filter: 'isFile',
        cwd: `../${repo}/assets`
      }, [`./${repo}-screenshot-alt[0123456789].png`]);
      for (const altScreenshot of altScreenshots) {
        const imageNumber = Number(altScreenshot.substr(`./${repo}-screenshot-alt`.length, 1));
        grunt.file.write(`${buildDir}/${repo}-${600}-alt${imageNumber}.png`, await generateThumbnails(repo, 600, 394, 100, jimp.MIME_PNG, `-alt${imageNumber}`));
        grunt.file.write(`${buildDir}/${repo}-${900}-alt${imageNumber}.png`, await generateThumbnails(repo, 900, 591, 100, jimp.MIME_PNG, `-alt${imageNumber}`));
      }
      if (brand === 'phet') {
        grunt.file.write(`${buildDir}/${repo}-ios.png`, await generateThumbnails(repo, 420, 276, 90, jimp.MIME_JPEG));
        grunt.file.write(`${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard(repo));
      }
    }
  }));
  grunt.registerTask('output-js', 'Outputs JS just for the specified repo', wrapTask(async () => {
    transpiler.transpileRepo(repo);
  }));
  grunt.registerTask('output-js-project', 'Outputs JS for the specified repo and its dependencies', wrapTask(async () => {
    const getPhetLibs = require('./getPhetLibs');
    transpiler.transpileRepos(getPhetLibs(repo));
  }));
  grunt.registerTask('output-js-all', 'Outputs JS for all repos', wrapTask(async () => {
    transpiler.transpileAll();
  }));
  grunt.registerTask('build', `Builds the repository. Depending on the repository type (runnable/wrapper/standalone), the result may vary.
Runnable build options:
 --report-media - Will iterate over all of the license.json files and reports any media files, set to false to opt out.
 --brands={{BRANDS} - Can be * (build all supported brands), or a comma-separated list of brand names. Will fall back to using
                      build-local.json's brands (or adapted-from-phet if that does not exist)
 --allHTML - If provided, will include the _all.html file (if it would not otherwise be built, e.g. phet brand)
 --XHTML - Includes an xhtml/ directory in the build output that contains a runnable XHTML form of the sim (with
           a separated-out JS file).
 --locales={{LOCALES}} - Can be * (build all available locales, "en" and everything in babel), or a comma-separated list of locales
 --noTranspile - Flag to opt out of transpiling repos before build. This should only be used if you are confident that chipper/dist is already correct (to save time).
 --noTSC - Flag to opt out of type checking before build. This should only be used if you are confident that TypeScript is already errorless (to save time).
 --encodeStringMap=false - Disables the encoding of the string map in the built file. This is useful for debugging.
 
Minify-specific options: 
 --minify.babelTranspile=false - Disables babel transpilation phase.
 --minify.uglify=false - Disables uglification, so the built file will include (essentially) concatenated source files.
 --minify.mangle=false - During uglification, it will not "mangle" variable names (where they get renamed to short constants to reduce file size.)
 --minify.beautify=true - After uglification, the source code will be syntax formatted nicely
 --minify.stripAssertions=false - During uglification, it will strip assertions.
 --minify.stripLogging=false - During uglification, it will not strip logging statements.
 `, wrapTask(async () => {
    const buildStandalone = require('./buildStandalone');
    const buildRunnable = require('./buildRunnable');
    const minify = require('./minify');
    const tsc = require('./tsc');
    const reportTscResults = require('./reportTscResults');
    const path = require('path');
    const fs = require('fs');
    const getPhetLibs = require('./getPhetLibs');
    const phetTimingLog = require('../../../perennial-alias/js/common/phetTimingLog');
    await phetTimingLog.startAsync('grunt-build', async () => {
      // Parse minification keys
      const minifyKeys = Object.keys(minify.MINIFY_DEFAULTS);
      const minifyOptions = {};
      minifyKeys.forEach(minifyKey => {
        const option = grunt.option(`minify.${minifyKey}`);
        if (option === true || option === false) {
          minifyOptions[minifyKey] = option;
        }
      });
      const repoPackageObject = grunt.file.readJSON(`../${repo}/package.json`);

      // Run the type checker first.
      const brands = getBrands(grunt, repo, buildLocal);
      !grunt.option('noTSC') && (await phetTimingLog.startAsync('tsc', async () => {
        // We must have phet-io code checked out to type check, since simLauncher imports phetioEngine
        if (brands.includes('phet-io') || brands.includes('phet')) {
          const results = await tsc(`../${repo}`);
          reportTscResults(results, grunt);
        } else {
          grunt.log.writeln('skipping type checking');
        }
      }));
      !grunt.option('noTranspile') && (await phetTimingLog.startAsync('transpile', () => {
        // If that succeeds, then convert the code to JS
        transpiler.transpileRepos(getPhetLibs(repo));
      }));

      // standalone
      if (repoPackageObject.phet.buildStandalone) {
        grunt.log.writeln('Building standalone repository');
        const parentDir = `../${repo}/build/`;
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir);
        }
        fs.writeFileSync(`${parentDir}/${repo}.min.js`, await buildStandalone(repo, minifyOptions));

        // Build a debug version
        minifyOptions.minify = false;
        minifyOptions.babelTranspile = false;
        minifyOptions.uglify = false;
        minifyOptions.isDebug = true;
        fs.writeFileSync(`${parentDir}/${repo}.debug.js`, await buildStandalone(repo, minifyOptions, true));
        if (repoPackageObject.phet.standaloneTranspiles) {
          for (const file of repoPackageObject.phet.standaloneTranspiles) {
            fs.writeFileSync(`../${repo}/build/${path.basename(file)}`, minify(grunt.file.read(file)));
          }
        }
      } else {
        const localPackageObject = grunt.file.readJSON(`../${repo}/package.json`);
        assert(localPackageObject.phet.runnable, `${repo} does not appear to be runnable`);
        grunt.log.writeln(`Building runnable repository (${repo}, brands: ${brands.join(', ')})`);

        // Other options
        const allHTML = !!grunt.option('allHTML');
        const encodeStringMap = grunt.option('encodeStringMap') !== false;
        const compressScripts = !!grunt.option('compressScripts');
        const profileFileSize = !!grunt.option('profileFileSize');
        const localesOption = grunt.option('locales') || 'en'; // Default back to English for now

        for (const brand of brands) {
          grunt.log.writeln(`Building brand: ${brand}`);
          await phetTimingLog.startAsync('build-brand-' + brand, async () => {
            await buildRunnable(repo, minifyOptions, allHTML, brand, localesOption, buildLocal, encodeStringMap, compressScripts, profileFileSize);
          });
        }
      }
    });
  }));
  grunt.registerTask('generate-used-strings-file', 'Writes used strings to phet-io-sim-specific/ so that PhET-iO sims only output relevant strings to the API in unbuilt mode', wrapTask(async () => {
    const getPhetLibs = require('./getPhetLibs');
    const fs = require('fs');
    const webpackBuild = require('./webpackBuild');
    const ChipperConstants = require('../common/ChipperConstants');
    const getLocalesFromRepository = require('./getLocalesFromRepository');
    const getStringMap = require('./getStringMap');
    transpiler.transpileRepos(getPhetLibs(repo));
    const webpackResult = await webpackBuild(repo, 'phet');
    const phetLibs = getPhetLibs(repo, 'phet');
    const allLocales = [ChipperConstants.FALLBACK_LOCALE, ...getLocalesFromRepository(repo)];
    const {
      stringMap
    } = getStringMap(repo, allLocales, phetLibs, webpackResult.usedModules);

    // TODO: https://github.com/phetsims/phet-io/issues/1877 This is only pertinent for phet-io, so I'm outputting
    // it to phet-io-sim-specific.  But none of intrinsic data is phet-io-specific.
    // Do we want a different path for it?
    // TODO: https://github.com/phetsims/phet-io/issues/1877 How do we indicate that it is a build artifact, and
    // should not be manually updated?
    fs.writeFileSync(`../phet-io-sim-specific/repos/${repo}/used-strings_en.json`, JSON.stringify(stringMap.en, null, 2));
  }));
  grunt.registerTask('build-for-server', 'meant for use by build-server only', ['build']);
  grunt.registerTask('lint', `lint js files. Options:
--disable-eslint-cache: cache will not be read from, and cache will be cleared for next run.
--fix: autofixable changes will be written to disk
--chip-away: output a list of responsible devs for each repo with lint problems
--repos: comma separated list of repos to lint in addition to the repo from running`, wrapTask(async () => {
    const lint = require('./lint');

    // --disable-eslint-cache disables the cache, useful for developing rules
    const cache = !grunt.option('disable-eslint-cache');
    const fix = grunt.option('fix');
    const chipAway = grunt.option('chip-away');
    const extraRepos = grunt.option('repos') ? grunt.option('repos').split(',') : [];
    const lintReturnValue = await lint([repo, ...extraRepos], {
      cache: cache,
      fix: fix,
      chipAway: chipAway
    });
    if (!lintReturnValue.ok) {
      grunt.fail.fatal('Lint failed');
    }
  }));
  grunt.registerTask('lint-all', 'lint all js files that are required to build this repository (for the specified brands)', wrapTask(async () => {
    const lint = require('./lint');

    // --disable-eslint-cache disables the cache, useful for developing rules
    const cache = !grunt.option('disable-eslint-cache');
    const fix = grunt.option('fix');
    const chipAway = grunt.option('chip-away');
    assert && assert(!grunt.option('patterns'), 'patterns not support for lint-all');
    const getPhetLibs = require('./getPhetLibs');
    const brands = getBrands(grunt, repo, buildLocal);
    const lintReturnValue = await lint(getPhetLibs(repo, brands), {
      cache: cache,
      fix: fix,
      chipAway: chipAway
    });

    // Output results on errors.
    if (!lintReturnValue.ok) {
      grunt.fail.fatal('Lint failed');
    }
  }));
  grunt.registerTask('generate-development-html', 'Generates top-level SIM_en.html file based on the preloads in package.json.', wrapTask(async () => {
    const generateDevelopmentHTML = require('./generateDevelopmentHTML');
    await generateDevelopmentHTML(repo);
  }));
  grunt.registerTask('generate-test-html', 'Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/main/doc/adding-unit-tests.md ' + 'for more information on automated testing. Usually you should ' + 'set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.', wrapTask(async () => {
    const generateTestHTML = require('./generateTestHTML');
    await generateTestHTML(repo);
  }));
  grunt.registerTask('generate-a11y-view-html', 'Generates top-level SIM-a11y-view.html file used for visualizing accessible content. Usually you should ' + 'set the "phet.simFeatures.supportsInteractiveDescription":true flag in the sim package.json and run `grunt update` ' + 'instead of manually generating this.', wrapTask(async () => {
    const generateA11yViewHTML = require('./generateA11yViewHTML');
    await generateA11yViewHTML(repo);
  }));
  grunt.registerTask('update', `
Updates the normal automatically-generated files for this repository. Includes:
  * runnables: generate-development-html and modulify
  * accessible runnables: generate-a11y-view-html
  * unit tests: generate-test-html
  * simulations: generateREADME()
  * phet-io simulations: generate overrides file if needed
  * create the conglomerate string files for unbuilt mode, for this repo and its dependencies`, wrapTask(async () => {
    const generateREADME = require('./generateREADME');
    const fs = require('fs');
    const _ = require('lodash');

    // support repos that don't have a phet object
    if (!packageObject.phet) {
      return;
    }

    // modulify is graceful if there are no files that need modulifying.
    grunt.task.run('modulify');

    // update README.md only for simulations
    if (packageObject.phet.simulation && !packageObject.phet.readmeCreatedManually) {
      await generateREADME(repo, !!packageObject.phet.published);
    }
    if (packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes('phet-io')) {
      // Copied from build.json and used as a preload for phet-io brand
      const overridesFile = `js/${repo}-phet-io-overrides.js`;

      // If there is already an overrides file, don't overwrite it with an empty one
      if (!fs.existsSync(`../${repo}/${overridesFile}`)) {
        const writeFileAndGitAdd = require('../../../perennial-alias/js/common/writeFileAndGitAdd');
        const overridesContent = '/* eslint-disable */\nwindow.phet.preloads.phetio.phetioElementsOverrides = {};';
        await writeFileAndGitAdd(repo, overridesFile, overridesContent);
      }
      let simSpecificWrappers;
      try {
        // Populate sim-specific wrappers into the package.json
        simSpecificWrappers = fs.readdirSync(`../phet-io-sim-specific/repos/${repo}/wrappers/`, {
          withFileTypes: true
        }).filter(dirent => dirent.isDirectory()).map(dirent => `phet-io-sim-specific/repos/${repo}/wrappers/${dirent.name}`);
        if (simSpecificWrappers.length > 0) {
          packageObject.phet['phet-io'] = packageObject.phet['phet-io'] || {};
          packageObject.phet['phet-io'].wrappers = _.uniq(simSpecificWrappers.concat(packageObject.phet['phet-io'].wrappers || []));
          grunt.file.write('package.json', JSON.stringify(packageObject, null, 2));
        }
      } catch (e) {
        if (!e.message.includes('no such file or directory')) {
          throw e;
        }
      }
    }

    // The above code can mutate the package.json, so do these after
    if (packageObject.phet.runnable) {
      grunt.task.run('generate-development-html');
      if (packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsInteractiveDescription) {
        grunt.task.run('generate-a11y-view-html');
      }
    }
    if (packageObject.phet.generatedUnitTests) {
      grunt.task.run('generate-test-html');
    }
  }));

  // This is not run in grunt update because it affects dependencies and outputs files outside of the repo.
  grunt.registerTask('generate-development-strings', 'To support locales=* in unbuilt mode, generate a conglomerate JSON file for each repo with translations in babel. Run on all repos via:\n' + '* for-each.sh perennial-alias/data/active-repos npm install\n' + '* for-each.sh perennial-alias/data/active-repos grunt generate-development-strings', wrapTask(async () => {
    const generateDevelopmentStrings = require('../scripts/generateDevelopmentStrings');
    const fs = require('fs');
    if (fs.existsSync(`../${repo}/${repo}-strings_en.json`)) {
      generateDevelopmentStrings(repo);
    }
  }));
  grunt.registerTask('published-README', 'Generates README.md file for a published simulation.', wrapTask(async () => {
    const generateREADME = require('./generateREADME'); // used by multiple tasks
    await generateREADME(repo, true /* published */);
  }));
  grunt.registerTask('unpublished-README', 'Generates README.md file for an unpublished simulation.', wrapTask(async () => {
    const generateREADME = require('./generateREADME'); // used by multiple tasks
    await generateREADME(repo, false /* published */);
  }));
  grunt.registerTask('sort-imports', 'Sort the import statements for a single file (if --file={{FILE}} is provided), or does so for all JS files if not specified', wrapTask(async () => {
    const sortImports = require('./sortImports');
    const file = grunt.option('file');
    if (file) {
      sortImports(file);
    } else {
      grunt.file.recurse(`../${repo}/js`, absfile => sortImports(absfile));
    }
  }));
  grunt.registerTask('commits-since', 'Shows commits since a specified date. Use --date=<date> to specify the date.', wrapTask(async () => {
    const dateString = grunt.option('date');
    assert(dateString, 'missing required option: --date={{DATE}}');
    const commitsSince = require('./commitsSince');
    await commitsSince(repo, dateString);
  }));

  // See reportMedia.js
  grunt.registerTask('report-media', '(project-wide) Report on license.json files throughout all working copies. ' + 'Reports any media (such as images or sound) files that have any of the following problems:\n' + '(1) incompatible-license (resource license not approved)\n' + '(2) not-annotated (license.json missing or entry missing from license.json)\n' + '(3) missing-file (entry in the license.json but not on the file system)', wrapTask(async () => {
    const reportMedia = require('./reportMedia');
    await reportMedia(repo);
  }));

  // see reportThirdParty.js
  grunt.registerTask('report-third-party', 'Creates a report of third-party resources (code, images, sound, etc) used in the published PhET simulations by ' + 'reading the license information in published HTML files on the PhET website. This task must be run from main.  ' + 'After running this task, you must push sherpa/third-party-licenses.md.', wrapTask(async () => {
    const reportThirdParty = require('./reportThirdParty');
    await reportThirdParty();
  }));
  grunt.registerTask('modulify', 'Creates *.js modules for all images/strings/audio/etc in a repo', wrapTask(async () => {
    const modulify = require('./modulify');
    const reportMedia = require('./reportMedia');
    const generateDevelopmentStrings = require('../scripts/generateDevelopmentStrings');
    const fs = require('fs');
    await modulify(repo);
    if (fs.existsSync(`../${repo}/${repo}-strings_en.json`)) {
      generateDevelopmentStrings(repo);
    }

    // Do this last to help with prototyping before commit (it would be frustrating if this errored out before giving
    // you the asset you could use in the sim).
    await reportMedia(repo);
  }));

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask('update-copyright-dates', 'Update the copyright dates in JS source files based on Github dates', wrapTask(async () => {
    const updateCopyrightDates = require('./updateCopyrightDates');
    await updateCopyrightDates(repo);
  }));
  grunt.registerTask('webpack-dev-server', `Runs a webpack server for a given list of simulations.
--repos=REPOS for a comma-separated list of repos (defaults to current repo)
--port=9000 to adjust the running port
--devtool=string value for sourcemap generation specified at https://webpack.js.org/configuration/devtool or undefined for (none)
--chrome: open the sims in Chrome tabs (Mac)`, () => {
    // We don't finish! Don't tell grunt this...
    grunt.task.current.async();
    const repos = grunt.option('repos') ? grunt.option('repos').split(',') : [repo];
    const port = grunt.option('port') || 9000;
    let devtool = grunt.option('devtool') || 'inline-source-map';
    if (devtool === 'none' || devtool === 'undefined') {
      devtool = undefined;
    }
    const openChrome = grunt.option('chrome') || false;
    const webpackDevServer = require('./webpackDevServer');

    // NOTE: We don't care about the promise that is returned here, because we are going to keep this task running
    // until the user manually kills it.
    webpackDevServer(repos, port, devtool, openChrome);
  });
  grunt.registerTask('generate-phet-io-api', 'Output the PhET-iO API as JSON to phet-io-sim-specific/api.\n' + 'Options\n:' + '--sims=... a list of sims to compare (defaults to the sim in the current dir)\n' + '--simList=... a file with a list of sims to compare (defaults to the sim in the current dir)\n' + '--stable - regenerate for all "stable sims" (see perennial/data/phet-io-api-stable/)\n' + '--temporary - outputs to the temporary directory', wrapTask(async () => {
    const formatPhetioAPI = require('../phet-io/formatPhetioAPI');
    const getSimList = require('../common/getSimList');
    const generatePhetioMacroAPI = require('../phet-io/generatePhetioMacroAPI');
    const fs = require('fs');
    const sims = getSimList().length === 0 ? [repo] : getSimList();
    transpiler.transpileAll();
    const results = await generatePhetioMacroAPI(sims, {
      showProgressBar: sims.length > 1,
      throwAPIGenerationErrors: false // Write as many as we can, and print what we didn't write
    });
    sims.forEach(sim => {
      const dir = `../phet-io-sim-specific/repos/${sim}`;
      try {
        fs.mkdirSync(dir);
      } catch (e) {
        // Directory exists
      }
      const filePath = `${dir}/${sim}-phet-io-api${grunt.option('temporary') ? '-temporary' : ''}.json`;
      const api = results[sim];
      api && fs.writeFileSync(filePath, formatPhetioAPI(api));
    });
  }));
  grunt.registerTask('compare-phet-io-api', 'Compares the phet-io-api against the reference version(s) if this sim\'s package.json marks compareDesignedAPIChanges.  ' + 'This will by default compare designed changes only. Options:\n' + '--sims=... a list of sims to compare (defaults to the sim in the current dir)\n' + '--simList=... a file with a list of sims to compare (defaults to the sim in the current dir)\n' + '--stable, generate the phet-io-apis for each phet-io sim considered to have a stable API (see perennial-alias/data/phet-io-api-stable)\n' + '--delta, by default a breaking-compatibility comparison is done, but --delta shows all changes\n' + '--temporary, compares API files in the temporary directory (otherwise compares to freshly generated APIs)\n' + '--compareBreakingAPIChanges - add this flag to compare breaking changes in addition to designed changes', wrapTask(async () => {
    const getSimList = require('../common/getSimList');
    const generatePhetioMacroAPI = require('../phet-io/generatePhetioMacroAPI');
    const fs = require('fs');
    const sims = getSimList().length === 0 ? [repo] : getSimList();
    const temporary = grunt.option('temporary');
    let proposedAPIs = null;
    if (temporary) {
      proposedAPIs = {};
      sims.forEach(sim => {
        proposedAPIs[sim] = JSON.parse(fs.readFileSync(`../phet-io-sim-specific/repos/${repo}/${repo}-phet-io-api-temporary.json`, 'utf8'));
      });
    } else {
      transpiler.transpileAll();
      proposedAPIs = await generatePhetioMacroAPI(sims, {
        showProgressBar: sims.length > 1,
        showMessagesFromSim: false
      });
    }

    // Don't add to options object if values are `undefined` (as _.extend will keep those entries and not mix in defaults
    const options = {};
    if (grunt.option('delta')) {
      options.delta = grunt.option('delta');
    }
    if (grunt.option('compareBreakingAPIChanges')) {
      options.compareBreakingAPIChanges = grunt.option('compareBreakingAPIChanges');
    }
    const ok = await require('../phet-io/phetioCompareAPISets')(sims, proposedAPIs, options);
    !ok && grunt.fail.fatal('PhET-iO API comparison failed');
  }));
  grunt.registerTask('profile-file-size', 'Profiles the file size of the built JS file for a given repo', wrapTask(async () => {
    const profileFileSize = require('../grunt/profileFileSize');
    await profileFileSize(repo);
  }));

  /**
   * Creates grunt tasks that effectively get forwarded to perennial. It will execute a grunt process running from
   * perennial's directory with the same options (but with --repo={{REPO}} added, so that perennial is aware of what
   * repository is the target).
   * @public
   *
   * @param {string} task - The name of the task
   */
  function forwardToPerennialGrunt(task) {
    grunt.registerTask(task, 'Run grunt --help in perennial to see documentation', () => {
      grunt.log.writeln('(Forwarding task to perennial)');
      const child_process = require('child_process');
      const done = grunt.task.current.async();

      // Include the --repo flag
      const args = [`--repo=${repo}`, ...process.argv.slice(2)];
      const argsString = args.map(arg => `"${arg}"`).join(' ');
      const spawned = child_process.spawn(/^win/.test(process.platform) ? 'grunt.cmd' : 'grunt', args, {
        cwd: '../perennial'
      });
      grunt.log.debug(`running grunt ${argsString} in ../${repo}`);
      spawned.stderr.on('data', data => grunt.log.error(data.toString()));
      spawned.stdout.on('data', data => grunt.log.write(data.toString()));
      process.stdin.pipe(spawned.stdin);
      spawned.on('close', code => {
        if (code !== 0) {
          throw new Error(`perennial grunt ${argsString} failed with code ${code}`);
        } else {
          done();
        }
      });
    });
  }
  ['checkout-shas', 'checkout-target', 'checkout-release', 'checkout-main', 'checkout-main-all', 'create-one-off', 'sha-check', 'sim-list', 'npm-update', 'create-release', 'cherry-pick', 'wrapper', 'dev', 'one-off', 'rc', 'production', 'prototype', 'create-sim', 'insert-require-statement', 'lint-everything', 'generate-data', 'pdom-comparison', 'release-branch-list'].forEach(forwardToPerennialGrunt);
};
const getBrands = (grunt, repo, buildLocal) => {
  // Determine what brands we want to build
  assert(!grunt.option('brand'), 'Use --brands={{BRANDS}} instead of brand');
  const localPackageObject = grunt.file.readJSON(`../${repo}/package.json`);
  const supportedBrands = localPackageObject.phet.supportedBrands || [];
  let brands;
  if (grunt.option('brands')) {
    if (grunt.option('brands') === '*') {
      brands = supportedBrands;
    } else {
      brands = grunt.option('brands').split(',');
    }
  } else if (buildLocal.brands) {
    // Extra check, see https://github.com/phetsims/chipper/issues/640
    assert(Array.isArray(buildLocal.brands), 'If brands exists in build-local.json, it should be an array');
    brands = buildLocal.brands.filter(brand => supportedBrands.includes(brand));
  } else {
    brands = ['adapted-from-phet'];
  }

  // Ensure all listed brands are valid
  brands.forEach(brand => assert(supportedBrands.includes(brand), `Unsupported brand: ${brand}`));
  return brands;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiZ2xvYmFsIiwicHJvY2Vzc0V2ZW50T3B0T3V0IiwicHJvY2VzcyIsIm9uIiwidXAiLCJjb25zb2xlIiwibG9nIiwiZXhpdCIsIlRyYW5zcGlsZXIiLCJ0cmFuc3BpbGVyIiwic2lsZW50IiwibW9kdWxlIiwiZXhwb3J0cyIsImdydW50IiwicGFja2FnZU9iamVjdCIsImZpbGUiLCJyZWFkSlNPTiIsImJ1aWxkTG9jYWwiLCJlbnYiLCJIT01FIiwiZSIsInJlcG8iLCJvcHRpb24iLCJuYW1lIiwidGVzdCIsIndyYXAiLCJwcm9taXNlIiwiZG9uZSIsInRhc2siLCJjdXJyZW50IiwiYXN5bmMiLCJzdGFjayIsImZhaWwiLCJmYXRhbCIsIkpTT04iLCJzdHJpbmdpZnkiLCJsZW5ndGgiLCJ0b1N0cmluZyIsIndyYXBUYXNrIiwiYXN5bmNUYXNrRnVuY3Rpb24iLCJyZWdpc3RlclRhc2siLCJidWlsZERpcmVjdG9yeSIsImV4aXN0cyIsImRlbGV0ZSIsIm1rZGlyIiwiamltcCIsImdlbmVyYXRlVGh1bWJuYWlscyIsImdlbmVyYXRlVHdpdHRlckNhcmQiLCJicmFuZCIsIndyaXRlbG4iLCJidWlsZERpciIsInRodW1ibmFpbFNpemVzIiwid2lkdGgiLCJoZWlnaHQiLCJzaXplIiwid3JpdGUiLCJNSU1FX1BORyIsImFsdFNjcmVlbnNob3RzIiwiZXhwYW5kIiwiZmlsdGVyIiwiY3dkIiwiYWx0U2NyZWVuc2hvdCIsImltYWdlTnVtYmVyIiwiTnVtYmVyIiwic3Vic3RyIiwiTUlNRV9KUEVHIiwidHJhbnNwaWxlUmVwbyIsImdldFBoZXRMaWJzIiwidHJhbnNwaWxlUmVwb3MiLCJ0cmFuc3BpbGVBbGwiLCJidWlsZFN0YW5kYWxvbmUiLCJidWlsZFJ1bm5hYmxlIiwibWluaWZ5IiwidHNjIiwicmVwb3J0VHNjUmVzdWx0cyIsInBhdGgiLCJmcyIsInBoZXRUaW1pbmdMb2ciLCJzdGFydEFzeW5jIiwibWluaWZ5S2V5cyIsIk9iamVjdCIsImtleXMiLCJNSU5JRllfREVGQVVMVFMiLCJtaW5pZnlPcHRpb25zIiwiZm9yRWFjaCIsIm1pbmlmeUtleSIsInJlcG9QYWNrYWdlT2JqZWN0IiwiYnJhbmRzIiwiZ2V0QnJhbmRzIiwiaW5jbHVkZXMiLCJyZXN1bHRzIiwicGhldCIsInBhcmVudERpciIsImV4aXN0c1N5bmMiLCJta2RpclN5bmMiLCJ3cml0ZUZpbGVTeW5jIiwiYmFiZWxUcmFuc3BpbGUiLCJ1Z2xpZnkiLCJpc0RlYnVnIiwic3RhbmRhbG9uZVRyYW5zcGlsZXMiLCJiYXNlbmFtZSIsInJlYWQiLCJsb2NhbFBhY2thZ2VPYmplY3QiLCJydW5uYWJsZSIsImpvaW4iLCJhbGxIVE1MIiwiZW5jb2RlU3RyaW5nTWFwIiwiY29tcHJlc3NTY3JpcHRzIiwicHJvZmlsZUZpbGVTaXplIiwibG9jYWxlc09wdGlvbiIsIndlYnBhY2tCdWlsZCIsIkNoaXBwZXJDb25zdGFudHMiLCJnZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkiLCJnZXRTdHJpbmdNYXAiLCJ3ZWJwYWNrUmVzdWx0IiwicGhldExpYnMiLCJhbGxMb2NhbGVzIiwiRkFMTEJBQ0tfTE9DQUxFIiwic3RyaW5nTWFwIiwidXNlZE1vZHVsZXMiLCJlbiIsImxpbnQiLCJjYWNoZSIsImZpeCIsImNoaXBBd2F5IiwiZXh0cmFSZXBvcyIsInNwbGl0IiwibGludFJldHVyblZhbHVlIiwib2siLCJnZW5lcmF0ZURldmVsb3BtZW50SFRNTCIsImdlbmVyYXRlVGVzdEhUTUwiLCJnZW5lcmF0ZUExMXlWaWV3SFRNTCIsImdlbmVyYXRlUkVBRE1FIiwiXyIsInJ1biIsInNpbXVsYXRpb24iLCJyZWFkbWVDcmVhdGVkTWFudWFsbHkiLCJwdWJsaXNoZWQiLCJzdXBwb3J0ZWRCcmFuZHMiLCJvdmVycmlkZXNGaWxlIiwid3JpdGVGaWxlQW5kR2l0QWRkIiwib3ZlcnJpZGVzQ29udGVudCIsInNpbVNwZWNpZmljV3JhcHBlcnMiLCJyZWFkZGlyU3luYyIsIndpdGhGaWxlVHlwZXMiLCJkaXJlbnQiLCJpc0RpcmVjdG9yeSIsIm1hcCIsIndyYXBwZXJzIiwidW5pcSIsImNvbmNhdCIsIm1lc3NhZ2UiLCJzaW1GZWF0dXJlcyIsInN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbiIsImdlbmVyYXRlZFVuaXRUZXN0cyIsImdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzIiwic29ydEltcG9ydHMiLCJyZWN1cnNlIiwiYWJzZmlsZSIsImRhdGVTdHJpbmciLCJjb21taXRzU2luY2UiLCJyZXBvcnRNZWRpYSIsInJlcG9ydFRoaXJkUGFydHkiLCJtb2R1bGlmeSIsInVwZGF0ZUNvcHlyaWdodERhdGVzIiwicmVwb3MiLCJwb3J0IiwiZGV2dG9vbCIsInVuZGVmaW5lZCIsIm9wZW5DaHJvbWUiLCJ3ZWJwYWNrRGV2U2VydmVyIiwiZm9ybWF0UGhldGlvQVBJIiwiZ2V0U2ltTGlzdCIsImdlbmVyYXRlUGhldGlvTWFjcm9BUEkiLCJzaW1zIiwic2hvd1Byb2dyZXNzQmFyIiwidGhyb3dBUElHZW5lcmF0aW9uRXJyb3JzIiwic2ltIiwiZGlyIiwiZmlsZVBhdGgiLCJhcGkiLCJ0ZW1wb3JhcnkiLCJwcm9wb3NlZEFQSXMiLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsInNob3dNZXNzYWdlc0Zyb21TaW0iLCJvcHRpb25zIiwiZGVsdGEiLCJjb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzIiwiZm9yd2FyZFRvUGVyZW5uaWFsR3J1bnQiLCJjaGlsZF9wcm9jZXNzIiwiYXJncyIsImFyZ3YiLCJzbGljZSIsImFyZ3NTdHJpbmciLCJhcmciLCJzcGF3bmVkIiwic3Bhd24iLCJwbGF0Zm9ybSIsImRlYnVnIiwic3RkZXJyIiwiZGF0YSIsImVycm9yIiwic3Rkb3V0Iiwic3RkaW4iLCJwaXBlIiwiY29kZSIsIkVycm9yIiwiQXJyYXkiLCJpc0FycmF5Il0sInNvdXJjZXMiOlsiR3J1bnRmaWxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEdydW50IGNvbmZpZ3VyYXRpb24gZmlsZSBmb3IgUGhFVCBwcm9qZWN0cy4gSW4gZ2VuZXJhbCB3aGVuIHBvc3NpYmxlLCBtb2R1bGVzIGFyZSBpbXBvcnRlZCBsYXppbHkgaW4gdGhlaXIgdGFza1xyXG4gKiBkZWNsYXJhdGlvbiB0byBzYXZlIG9uIG92ZXJhbGwgbG9hZCB0aW1lIG9mIHRoaXMgZmlsZS4gVGhlIHBhdHRlcm4gaXMgdG8gcmVxdWlyZSBhbGwgbW9kdWxlcyBuZWVkZWQgYXQgdGhlIHRvcCBvZiB0aGVcclxuICogZ3J1bnQgdGFzayByZWdpc3RyYXRpb24uIElmIGEgbW9kdWxlIGlzIHVzZWQgaW4gbXVsdGlwbGUgdGFza3MsIGl0IGlzIGJlc3QgdG8gbGF6aWx5IHJlcXVpcmUgaW4gZWFjaFxyXG4gKiB0YXNrLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIE5PVEU6IHRvIGltcHJvdmUgcGVyZm9ybWFuY2UsIHRoZSB2YXN0IG1ham9yaXR5IG9mIG1vZHVsZXMgYXJlIGxhemlseSBpbXBvcnRlZCBpbiB0YXNrIHJlZ2lzdHJhdGlvbnMuIEV2ZW4gZHVwbGljYXRpbmdcclxuLy8gcmVxdWlyZSBzdGF0ZW1lbnRzIGltcHJvdmVzIHRoZSBsb2FkIHRpbWUgb2YgdGhpcyBmaWxlIG5vdGljZWFibHkuIEZvciBkZXRhaWxzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzExMDdcclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxucmVxdWlyZSggJy4vY2hlY2tOb2RlVmVyc2lvbicgKTtcclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4vLyBBbGxvdyBvdGhlciBHcnVudGZpbGVzIHRvIHBvdGVudGlhbGx5IGhhbmRsZSBleGl0aW5nIGFuZCBlcnJvcnMgZGlmZmVyZW50bHlgXHJcbmlmICggIWdsb2JhbC5wcm9jZXNzRXZlbnRPcHRPdXQgKSB7XHJcblxyXG4vLyBTZWUgaHR0cHM6Ly9tZWRpdW0uY29tL0BkdGludGgvbWFraW5nLXVuaGFuZGxlZC1wcm9taXNlLXJlamVjdGlvbnMtY3Jhc2gtdGhlLW5vZGUtanMtcHJvY2Vzcy1mZmMyN2NmY2M5ZGQgZm9yIGhvd1xyXG4vLyB0byBnZXQgdW5oYW5kbGVkIHByb21pc2UgcmVqZWN0aW9ucyB0byBmYWlsIG91dCB0aGUgbm9kZSBwcm9jZXNzLlxyXG4vLyBSZWxldmFudCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3dhdmUtaW50ZXJmZXJlbmNlL2lzc3Vlcy80OTFcclxuICBwcm9jZXNzLm9uKCAndW5oYW5kbGVkUmVqZWN0aW9uJywgdXAgPT4geyB0aHJvdyB1cDsgfSApO1xyXG5cclxuLy8gRXhpdCBvbiBDdHJsICsgQyBjYXNlXHJcbiAgcHJvY2Vzcy5vbiggJ1NJR0lOVCcsICgpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCAnXFxuXFxuQ2F1Z2h0IGludGVycnVwdCBzaWduYWwsIGV4aXRpbmcnICk7XHJcbiAgICBwcm9jZXNzLmV4aXQoKTtcclxuICB9ICk7XHJcbn1cclxuXHJcbmNvbnN0IFRyYW5zcGlsZXIgPSByZXF1aXJlKCAnLi4vY29tbW9uL1RyYW5zcGlsZXInICk7XHJcbmNvbnN0IHRyYW5zcGlsZXIgPSBuZXcgVHJhbnNwaWxlciggeyBzaWxlbnQ6IHRydWUgfSApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggZ3J1bnQgKSB7XHJcbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IGdydW50LmZpbGUucmVhZEpTT04oICdwYWNrYWdlLmpzb24nICk7XHJcblxyXG4gIC8vIEhhbmRsZSB0aGUgbGFjayBvZiBidWlsZC5qc29uXHJcbiAgbGV0IGJ1aWxkTG9jYWw7XHJcbiAgdHJ5IHtcclxuICAgIGJ1aWxkTG9jYWwgPSBncnVudC5maWxlLnJlYWRKU09OKCBgJHtwcm9jZXNzLmVudi5IT01FfS8ucGhldC9idWlsZC1sb2NhbC5qc29uYCApO1xyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuICAgIGJ1aWxkTG9jYWwgPSB7fTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJlcG8gPSBncnVudC5vcHRpb24oICdyZXBvJyApIHx8IHBhY2thZ2VPYmplY3QubmFtZTtcclxuICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyAmJiAvXlthLXpdKygtW2Etel0rKSokL3UudGVzdCggcmVwbyApLCAncmVwbyBuYW1lIHNob3VsZCBiZSBjb21wb3NlZCBvZiBsb3dlci1jYXNlIGNoYXJhY3RlcnMsIG9wdGlvbmFsbHkgd2l0aCBkYXNoZXMgdXNlZCBhcyBzZXBhcmF0b3JzJyApO1xyXG5cclxuICAvKipcclxuICAgKiBXcmFwcyBhIHByb21pc2UncyBjb21wbGV0aW9uIHdpdGggZ3J1bnQncyBhc3luY2hyb25vdXMgaGFuZGxpbmcsIHdpdGggYWRkZWQgaGVscGZ1bCBmYWlsdXJlIG1lc3NhZ2VzIChpbmNsdWRpbmdcclxuICAgKiBzdGFjayB0cmFjZXMsIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciAtLXN0YWNrIHdhcyBwcm92aWRlZCkuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtQcm9taXNlfSBwcm9taXNlXHJcbiAgICovXHJcbiAgYXN5bmMgZnVuY3Rpb24gd3JhcCggcHJvbWlzZSApIHtcclxuICAgIGNvbnN0IGRvbmUgPSBncnVudC50YXNrLmN1cnJlbnQuYXN5bmMoKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBwcm9taXNlO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgIGlmICggZS5zdGFjayApIHtcclxuICAgICAgICBncnVudC5mYWlsLmZhdGFsKCBgUGVyZW5uaWFsIHRhc2sgZmFpbGVkOlxcbiR7ZS5zdGFja31cXG5GdWxsIEVycm9yIGRldGFpbHM6XFxuJHtlfWAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUaGUgdG9TdHJpbmcgY2hlY2sgaGFuZGxlcyBhIHdlaXJkIGNhc2UgZm91bmQgZnJvbSBhbiBFcnJvciBvYmplY3QgZnJvbSBwdXBwZXRlZXIgdGhhdCBkb2Vzbid0IHN0cmluZ2lmeSB3aXRoXHJcbiAgICAgIC8vIEpTT04gb3IgaGF2ZSBhIHN0YWNrLCBKU09OLnN0cmluZ2lmaWVzIHRvIFwie31cIiwgYnV0IGhhcyBhIGB0b1N0cmluZ2AgbWV0aG9kXHJcbiAgICAgIGVsc2UgaWYgKCB0eXBlb2YgZSA9PT0gJ3N0cmluZycgfHwgKCBKU09OLnN0cmluZ2lmeSggZSApLmxlbmd0aCA9PT0gMiAmJiBlLnRvU3RyaW5nICkgKSB7XHJcbiAgICAgICAgZ3J1bnQuZmFpbC5mYXRhbCggYFBlcmVubmlhbCB0YXNrIGZhaWxlZDogJHtlfWAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBncnVudC5mYWlsLmZhdGFsKCBgUGVyZW5uaWFsIHRhc2sgZmFpbGVkIHdpdGggdW5rbm93biBlcnJvcjogJHtKU09OLnN0cmluZ2lmeSggZSwgbnVsbCwgMiApfWAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRvbmUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdyYXBzIGFuIGFzeW5jIGZ1bmN0aW9uIGZvciBhIGdydW50IHRhc2suIFdpbGwgcnVuIHRoZSBhc3luYyBmdW5jdGlvbiB3aGVuIHRoZSB0YXNrIHNob3VsZCBiZSBleGVjdXRlZC4gV2lsbFxyXG4gICAqIHByb3Blcmx5IGhhbmRsZSBncnVudCdzIGFzeW5jIGhhbmRsaW5nLCBhbmQgcHJvdmlkZXMgaW1wcm92ZWQgZXJyb3IgcmVwb3J0aW5nLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7YXN5bmMgZnVuY3Rpb259IGFzeW5jVGFza0Z1bmN0aW9uXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gd3JhcFRhc2soIGFzeW5jVGFza0Z1bmN0aW9uICkge1xyXG4gICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgd3JhcCggYXN5bmNUYXNrRnVuY3Rpb24oKSApO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2RlZmF1bHQnLCAnQnVpbGRzIHRoZSByZXBvc2l0b3J5JywgW1xyXG4gICAgLi4uKCBncnVudC5vcHRpb24oICdsaW50JyApID09PSBmYWxzZSA/IFtdIDogWyAnbGludC1hbGwnIF0gKSxcclxuICAgIC4uLiggZ3J1bnQub3B0aW9uKCAncmVwb3J0LW1lZGlhJyApID09PSBmYWxzZSA/IFtdIDogWyAncmVwb3J0LW1lZGlhJyBdICksXHJcbiAgICAnY2xlYW4nLFxyXG4gICAgJ2J1aWxkJ1xyXG4gIF0gKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnY2xlYW4nLFxyXG4gICAgJ0VyYXNlcyB0aGUgYnVpbGQvIGRpcmVjdG9yeSBhbmQgYWxsIGl0cyBjb250ZW50cywgYW5kIHJlY3JlYXRlcyB0aGUgYnVpbGQvIGRpcmVjdG9yeScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBidWlsZERpcmVjdG9yeSA9IGAuLi8ke3JlcG99L2J1aWxkYDtcclxuICAgICAgaWYgKCBncnVudC5maWxlLmV4aXN0cyggYnVpbGREaXJlY3RvcnkgKSApIHtcclxuICAgICAgICBncnVudC5maWxlLmRlbGV0ZSggYnVpbGREaXJlY3RvcnkgKTtcclxuICAgICAgfVxyXG4gICAgICBncnVudC5maWxlLm1rZGlyKCBidWlsZERpcmVjdG9yeSApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2J1aWxkLWltYWdlcycsXHJcbiAgICAnQnVpbGQgaW1hZ2VzIG9ubHknLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgamltcCA9IHJlcXVpcmUoICdqaW1wJyApO1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVRodW1ibmFpbHMgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZVRodW1ibmFpbHMnICk7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlVHdpdHRlckNhcmQgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZVR3aXR0ZXJDYXJkJyApO1xyXG5cclxuICAgICAgY29uc3QgYnJhbmQgPSAncGhldCc7XHJcbiAgICAgIGdydW50LmxvZy53cml0ZWxuKCBgQnVpbGRpbmcgaW1hZ2VzIGZvciBicmFuZDogJHticmFuZH1gICk7XHJcblxyXG4gICAgICBjb25zdCBidWlsZERpciA9IGAuLi8ke3JlcG99L2J1aWxkLyR7YnJhbmR9YDtcclxuICAgICAgLy8gVGh1bWJuYWlscyBhbmQgdHdpdHRlciBjYXJkXHJcbiAgICAgIGlmICggZ3J1bnQuZmlsZS5leGlzdHMoIGAuLi8ke3JlcG99L2Fzc2V0cy8ke3JlcG99LXNjcmVlbnNob3QucG5nYCApICkge1xyXG4gICAgICAgIGNvbnN0IHRodW1ibmFpbFNpemVzID0gW1xyXG4gICAgICAgICAgeyB3aWR0aDogOTAwLCBoZWlnaHQ6IDU5MSB9LFxyXG4gICAgICAgICAgeyB3aWR0aDogNjAwLCBoZWlnaHQ6IDM5NCB9LFxyXG4gICAgICAgICAgeyB3aWR0aDogNDIwLCBoZWlnaHQ6IDI3NiB9LFxyXG4gICAgICAgICAgeyB3aWR0aDogMTI4LCBoZWlnaHQ6IDg0IH0sXHJcbiAgICAgICAgICB7IHdpZHRoOiAxNSwgaGVpZ2h0OiAxMCB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICBmb3IgKCBjb25zdCBzaXplIG9mIHRodW1ibmFpbFNpemVzICkge1xyXG4gICAgICAgICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9LyR7cmVwb30tJHtzaXplLndpZHRofS5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIHNpemUud2lkdGgsIHNpemUuaGVpZ2h0LCAxMDAsIGppbXAuTUlNRV9QTkcgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYWx0U2NyZWVuc2hvdHMgPSBncnVudC5maWxlLmV4cGFuZCggeyBmaWx0ZXI6ICdpc0ZpbGUnLCBjd2Q6IGAuLi8ke3JlcG99L2Fzc2V0c2AgfSwgWyBgLi8ke3JlcG99LXNjcmVlbnNob3QtYWx0WzAxMjM0NTY3ODldLnBuZ2AgXSApO1xyXG4gICAgICAgIGZvciAoIGNvbnN0IGFsdFNjcmVlbnNob3Qgb2YgYWx0U2NyZWVuc2hvdHMgKSB7XHJcbiAgICAgICAgICBjb25zdCBpbWFnZU51bWJlciA9IE51bWJlciggYWx0U2NyZWVuc2hvdC5zdWJzdHIoIGAuLyR7cmVwb30tc2NyZWVuc2hvdC1hbHRgLmxlbmd0aCwgMSApICk7XHJcbiAgICAgICAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfS0kezYwMH0tYWx0JHtpbWFnZU51bWJlcn0ucG5nYCwgYXdhaXQgZ2VuZXJhdGVUaHVtYm5haWxzKCByZXBvLCA2MDAsIDM5NCwgMTAwLCBqaW1wLk1JTUVfUE5HLCBgLWFsdCR7aW1hZ2VOdW1iZXJ9YCApICk7XHJcbiAgICAgICAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfS0kezkwMH0tYWx0JHtpbWFnZU51bWJlcn0ucG5nYCwgYXdhaXQgZ2VuZXJhdGVUaHVtYm5haWxzKCByZXBvLCA5MDAsIDU5MSwgMTAwLCBqaW1wLk1JTUVfUE5HLCBgLWFsdCR7aW1hZ2VOdW1iZXJ9YCApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIGJyYW5kID09PSAncGhldCcgKSB7XHJcbiAgICAgICAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfS1pb3MucG5nYCwgYXdhaXQgZ2VuZXJhdGVUaHVtYm5haWxzKCByZXBvLCA0MjAsIDI3NiwgOTAsIGppbXAuTUlNRV9KUEVHICkgKTtcclxuICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LXR3aXR0ZXItY2FyZC5wbmdgLCBhd2FpdCBnZW5lcmF0ZVR3aXR0ZXJDYXJkKCByZXBvICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdvdXRwdXQtanMnLCAnT3V0cHV0cyBKUyBqdXN0IGZvciB0aGUgc3BlY2lmaWVkIHJlcG8nLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgdHJhbnNwaWxlci50cmFuc3BpbGVSZXBvKCByZXBvICk7XHJcbiAgICB9IClcclxuICApO1xyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ291dHB1dC1qcy1wcm9qZWN0JywgJ091dHB1dHMgSlMgZm9yIHRoZSBzcGVjaWZpZWQgcmVwbyBhbmQgaXRzIGRlcGVuZGVuY2llcycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZXRQaGV0TGlicyA9IHJlcXVpcmUoICcuL2dldFBoZXRMaWJzJyApO1xyXG5cclxuICAgICAgdHJhbnNwaWxlci50cmFuc3BpbGVSZXBvcyggZ2V0UGhldExpYnMoIHJlcG8gKSApO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnb3V0cHV0LWpzLWFsbCcsICdPdXRwdXRzIEpTIGZvciBhbGwgcmVwb3MnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgdHJhbnNwaWxlci50cmFuc3BpbGVBbGwoKTtcclxuICAgIH0gKVxyXG4gICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2J1aWxkJyxcclxuICAgIGBCdWlsZHMgdGhlIHJlcG9zaXRvcnkuIERlcGVuZGluZyBvbiB0aGUgcmVwb3NpdG9yeSB0eXBlIChydW5uYWJsZS93cmFwcGVyL3N0YW5kYWxvbmUpLCB0aGUgcmVzdWx0IG1heSB2YXJ5LlxyXG5SdW5uYWJsZSBidWlsZCBvcHRpb25zOlxyXG4gLS1yZXBvcnQtbWVkaWEgLSBXaWxsIGl0ZXJhdGUgb3ZlciBhbGwgb2YgdGhlIGxpY2Vuc2UuanNvbiBmaWxlcyBhbmQgcmVwb3J0cyBhbnkgbWVkaWEgZmlsZXMsIHNldCB0byBmYWxzZSB0byBvcHQgb3V0LlxyXG4gLS1icmFuZHM9e3tCUkFORFN9IC0gQ2FuIGJlICogKGJ1aWxkIGFsbCBzdXBwb3J0ZWQgYnJhbmRzKSwgb3IgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBicmFuZCBuYW1lcy4gV2lsbCBmYWxsIGJhY2sgdG8gdXNpbmdcclxuICAgICAgICAgICAgICAgICAgICAgIGJ1aWxkLWxvY2FsLmpzb24ncyBicmFuZHMgKG9yIGFkYXB0ZWQtZnJvbS1waGV0IGlmIHRoYXQgZG9lcyBub3QgZXhpc3QpXHJcbiAtLWFsbEhUTUwgLSBJZiBwcm92aWRlZCwgd2lsbCBpbmNsdWRlIHRoZSBfYWxsLmh0bWwgZmlsZSAoaWYgaXQgd291bGQgbm90IG90aGVyd2lzZSBiZSBidWlsdCwgZS5nLiBwaGV0IGJyYW5kKVxyXG4gLS1YSFRNTCAtIEluY2x1ZGVzIGFuIHhodG1sLyBkaXJlY3RvcnkgaW4gdGhlIGJ1aWxkIG91dHB1dCB0aGF0IGNvbnRhaW5zIGEgcnVubmFibGUgWEhUTUwgZm9ybSBvZiB0aGUgc2ltICh3aXRoXHJcbiAgICAgICAgICAgYSBzZXBhcmF0ZWQtb3V0IEpTIGZpbGUpLlxyXG4gLS1sb2NhbGVzPXt7TE9DQUxFU319IC0gQ2FuIGJlICogKGJ1aWxkIGFsbCBhdmFpbGFibGUgbG9jYWxlcywgXCJlblwiIGFuZCBldmVyeXRoaW5nIGluIGJhYmVsKSwgb3IgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBsb2NhbGVzXHJcbiAtLW5vVHJhbnNwaWxlIC0gRmxhZyB0byBvcHQgb3V0IG9mIHRyYW5zcGlsaW5nIHJlcG9zIGJlZm9yZSBidWlsZC4gVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGlmIHlvdSBhcmUgY29uZmlkZW50IHRoYXQgY2hpcHBlci9kaXN0IGlzIGFscmVhZHkgY29ycmVjdCAodG8gc2F2ZSB0aW1lKS5cclxuIC0tbm9UU0MgLSBGbGFnIHRvIG9wdCBvdXQgb2YgdHlwZSBjaGVja2luZyBiZWZvcmUgYnVpbGQuIFRoaXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBpZiB5b3UgYXJlIGNvbmZpZGVudCB0aGF0IFR5cGVTY3JpcHQgaXMgYWxyZWFkeSBlcnJvcmxlc3MgKHRvIHNhdmUgdGltZSkuXHJcbiAtLWVuY29kZVN0cmluZ01hcD1mYWxzZSAtIERpc2FibGVzIHRoZSBlbmNvZGluZyBvZiB0aGUgc3RyaW5nIG1hcCBpbiB0aGUgYnVpbHQgZmlsZS4gVGhpcyBpcyB1c2VmdWwgZm9yIGRlYnVnZ2luZy5cclxuIFxyXG5NaW5pZnktc3BlY2lmaWMgb3B0aW9uczogXHJcbiAtLW1pbmlmeS5iYWJlbFRyYW5zcGlsZT1mYWxzZSAtIERpc2FibGVzIGJhYmVsIHRyYW5zcGlsYXRpb24gcGhhc2UuXHJcbiAtLW1pbmlmeS51Z2xpZnk9ZmFsc2UgLSBEaXNhYmxlcyB1Z2xpZmljYXRpb24sIHNvIHRoZSBidWlsdCBmaWxlIHdpbGwgaW5jbHVkZSAoZXNzZW50aWFsbHkpIGNvbmNhdGVuYXRlZCBzb3VyY2UgZmlsZXMuXHJcbiAtLW1pbmlmeS5tYW5nbGU9ZmFsc2UgLSBEdXJpbmcgdWdsaWZpY2F0aW9uLCBpdCB3aWxsIG5vdCBcIm1hbmdsZVwiIHZhcmlhYmxlIG5hbWVzICh3aGVyZSB0aGV5IGdldCByZW5hbWVkIHRvIHNob3J0IGNvbnN0YW50cyB0byByZWR1Y2UgZmlsZSBzaXplLilcclxuIC0tbWluaWZ5LmJlYXV0aWZ5PXRydWUgLSBBZnRlciB1Z2xpZmljYXRpb24sIHRoZSBzb3VyY2UgY29kZSB3aWxsIGJlIHN5bnRheCBmb3JtYXR0ZWQgbmljZWx5XHJcbiAtLW1pbmlmeS5zdHJpcEFzc2VydGlvbnM9ZmFsc2UgLSBEdXJpbmcgdWdsaWZpY2F0aW9uLCBpdCB3aWxsIHN0cmlwIGFzc2VydGlvbnMuXHJcbiAtLW1pbmlmeS5zdHJpcExvZ2dpbmc9ZmFsc2UgLSBEdXJpbmcgdWdsaWZpY2F0aW9uLCBpdCB3aWxsIG5vdCBzdHJpcCBsb2dnaW5nIHN0YXRlbWVudHMuXHJcbiBgLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgYnVpbGRTdGFuZGFsb25lID0gcmVxdWlyZSggJy4vYnVpbGRTdGFuZGFsb25lJyApO1xyXG4gICAgICBjb25zdCBidWlsZFJ1bm5hYmxlID0gcmVxdWlyZSggJy4vYnVpbGRSdW5uYWJsZScgKTtcclxuICAgICAgY29uc3QgbWluaWZ5ID0gcmVxdWlyZSggJy4vbWluaWZ5JyApO1xyXG4gICAgICBjb25zdCB0c2MgPSByZXF1aXJlKCAnLi90c2MnICk7XHJcbiAgICAgIGNvbnN0IHJlcG9ydFRzY1Jlc3VsdHMgPSByZXF1aXJlKCAnLi9yZXBvcnRUc2NSZXN1bHRzJyApO1xyXG4gICAgICBjb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcbiAgICAgIGNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG4gICAgICBjb25zdCBnZXRQaGV0TGlicyA9IHJlcXVpcmUoICcuL2dldFBoZXRMaWJzJyApO1xyXG4gICAgICBjb25zdCBwaGV0VGltaW5nTG9nID0gcmVxdWlyZSggJy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vcGhldFRpbWluZ0xvZycgKTtcclxuXHJcbiAgICAgIGF3YWl0IHBoZXRUaW1pbmdMb2cuc3RhcnRBc3luYyggJ2dydW50LWJ1aWxkJywgYXN5bmMgKCkgPT4ge1xyXG5cclxuICAgICAgICAvLyBQYXJzZSBtaW5pZmljYXRpb24ga2V5c1xyXG4gICAgICAgIGNvbnN0IG1pbmlmeUtleXMgPSBPYmplY3Qua2V5cyggbWluaWZ5Lk1JTklGWV9ERUZBVUxUUyApO1xyXG4gICAgICAgIGNvbnN0IG1pbmlmeU9wdGlvbnMgPSB7fTtcclxuICAgICAgICBtaW5pZnlLZXlzLmZvckVhY2goIG1pbmlmeUtleSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb24gPSBncnVudC5vcHRpb24oIGBtaW5pZnkuJHttaW5pZnlLZXl9YCApO1xyXG4gICAgICAgICAgaWYgKCBvcHRpb24gPT09IHRydWUgfHwgb3B0aW9uID09PSBmYWxzZSApIHtcclxuICAgICAgICAgICAgbWluaWZ5T3B0aW9uc1sgbWluaWZ5S2V5IF0gPSBvcHRpb247XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICBjb25zdCByZXBvUGFja2FnZU9iamVjdCA9IGdydW50LmZpbGUucmVhZEpTT04oIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcclxuXHJcbiAgICAgICAgLy8gUnVuIHRoZSB0eXBlIGNoZWNrZXIgZmlyc3QuXHJcbiAgICAgICAgY29uc3QgYnJhbmRzID0gZ2V0QnJhbmRzKCBncnVudCwgcmVwbywgYnVpbGRMb2NhbCApO1xyXG5cclxuICAgICAgICAhZ3J1bnQub3B0aW9uKCAnbm9UU0MnICkgJiYgYXdhaXQgcGhldFRpbWluZ0xvZy5zdGFydEFzeW5jKCAndHNjJywgYXN5bmMgKCkgPT4ge1xyXG5cclxuICAgICAgICAgIC8vIFdlIG11c3QgaGF2ZSBwaGV0LWlvIGNvZGUgY2hlY2tlZCBvdXQgdG8gdHlwZSBjaGVjaywgc2luY2Ugc2ltTGF1bmNoZXIgaW1wb3J0cyBwaGV0aW9FbmdpbmVcclxuICAgICAgICAgIGlmICggYnJhbmRzLmluY2x1ZGVzKCAncGhldC1pbycgKSB8fCBicmFuZHMuaW5jbHVkZXMoICdwaGV0JyApICkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdHNjKCBgLi4vJHtyZXBvfWAgKTtcclxuICAgICAgICAgICAgcmVwb3J0VHNjUmVzdWx0cyggcmVzdWx0cywgZ3J1bnQgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ3NraXBwaW5nIHR5cGUgY2hlY2tpbmcnICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICAhZ3J1bnQub3B0aW9uKCAnbm9UcmFuc3BpbGUnICkgJiYgYXdhaXQgcGhldFRpbWluZ0xvZy5zdGFydEFzeW5jKCAndHJhbnNwaWxlJywgKCkgPT4ge1xyXG4gICAgICAgICAgLy8gSWYgdGhhdCBzdWNjZWVkcywgdGhlbiBjb252ZXJ0IHRoZSBjb2RlIHRvIEpTXHJcbiAgICAgICAgICB0cmFuc3BpbGVyLnRyYW5zcGlsZVJlcG9zKCBnZXRQaGV0TGlicyggcmVwbyApICk7XHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICAvLyBzdGFuZGFsb25lXHJcbiAgICAgICAgaWYgKCByZXBvUGFja2FnZU9iamVjdC5waGV0LmJ1aWxkU3RhbmRhbG9uZSApIHtcclxuICAgICAgICAgIGdydW50LmxvZy53cml0ZWxuKCAnQnVpbGRpbmcgc3RhbmRhbG9uZSByZXBvc2l0b3J5JyApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHBhcmVudERpciA9IGAuLi8ke3JlcG99L2J1aWxkL2A7XHJcbiAgICAgICAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBwYXJlbnREaXIgKSApIHtcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKCBwYXJlbnREaXIgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKCBgJHtwYXJlbnREaXJ9LyR7cmVwb30ubWluLmpzYCwgYXdhaXQgYnVpbGRTdGFuZGFsb25lKCByZXBvLCBtaW5pZnlPcHRpb25zICkgKTtcclxuXHJcbiAgICAgICAgICAvLyBCdWlsZCBhIGRlYnVnIHZlcnNpb25cclxuICAgICAgICAgIG1pbmlmeU9wdGlvbnMubWluaWZ5ID0gZmFsc2U7XHJcbiAgICAgICAgICBtaW5pZnlPcHRpb25zLmJhYmVsVHJhbnNwaWxlID0gZmFsc2U7XHJcbiAgICAgICAgICBtaW5pZnlPcHRpb25zLnVnbGlmeSA9IGZhbHNlO1xyXG4gICAgICAgICAgbWluaWZ5T3B0aW9ucy5pc0RlYnVnID0gdHJ1ZTtcclxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoIGAke3BhcmVudERpcn0vJHtyZXBvfS5kZWJ1Zy5qc2AsIGF3YWl0IGJ1aWxkU3RhbmRhbG9uZSggcmVwbywgbWluaWZ5T3B0aW9ucywgdHJ1ZSApICk7XHJcblxyXG4gICAgICAgICAgaWYgKCByZXBvUGFja2FnZU9iamVjdC5waGV0LnN0YW5kYWxvbmVUcmFuc3BpbGVzICkge1xyXG4gICAgICAgICAgICBmb3IgKCBjb25zdCBmaWxlIG9mIHJlcG9QYWNrYWdlT2JqZWN0LnBoZXQuc3RhbmRhbG9uZVRyYW5zcGlsZXMgKSB7XHJcbiAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyggYC4uLyR7cmVwb30vYnVpbGQvJHtwYXRoLmJhc2VuYW1lKCBmaWxlICl9YCwgbWluaWZ5KCBncnVudC5maWxlLnJlYWQoIGZpbGUgKSApICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgY29uc3QgbG9jYWxQYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG4gICAgICAgICAgYXNzZXJ0KCBsb2NhbFBhY2thZ2VPYmplY3QucGhldC5ydW5uYWJsZSwgYCR7cmVwb30gZG9lcyBub3QgYXBwZWFyIHRvIGJlIHJ1bm5hYmxlYCApO1xyXG4gICAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBCdWlsZGluZyBydW5uYWJsZSByZXBvc2l0b3J5ICgke3JlcG99LCBicmFuZHM6ICR7YnJhbmRzLmpvaW4oICcsICcgKX0pYCApO1xyXG5cclxuICAgICAgICAgIC8vIE90aGVyIG9wdGlvbnNcclxuICAgICAgICAgIGNvbnN0IGFsbEhUTUwgPSAhIWdydW50Lm9wdGlvbiggJ2FsbEhUTUwnICk7XHJcbiAgICAgICAgICBjb25zdCBlbmNvZGVTdHJpbmdNYXAgPSBncnVudC5vcHRpb24oICdlbmNvZGVTdHJpbmdNYXAnICkgIT09IGZhbHNlO1xyXG4gICAgICAgICAgY29uc3QgY29tcHJlc3NTY3JpcHRzID0gISFncnVudC5vcHRpb24oICdjb21wcmVzc1NjcmlwdHMnICk7XHJcbiAgICAgICAgICBjb25zdCBwcm9maWxlRmlsZVNpemUgPSAhIWdydW50Lm9wdGlvbiggJ3Byb2ZpbGVGaWxlU2l6ZScgKTtcclxuICAgICAgICAgIGNvbnN0IGxvY2FsZXNPcHRpb24gPSBncnVudC5vcHRpb24oICdsb2NhbGVzJyApIHx8ICdlbic7IC8vIERlZmF1bHQgYmFjayB0byBFbmdsaXNoIGZvciBub3dcclxuXHJcbiAgICAgICAgICBmb3IgKCBjb25zdCBicmFuZCBvZiBicmFuZHMgKSB7XHJcbiAgICAgICAgICAgIGdydW50LmxvZy53cml0ZWxuKCBgQnVpbGRpbmcgYnJhbmQ6ICR7YnJhbmR9YCApO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgcGhldFRpbWluZ0xvZy5zdGFydEFzeW5jKCAnYnVpbGQtYnJhbmQtJyArIGJyYW5kLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgYnVpbGRSdW5uYWJsZSggcmVwbywgbWluaWZ5T3B0aW9ucywgYWxsSFRNTCwgYnJhbmQsIGxvY2FsZXNPcHRpb24sIGJ1aWxkTG9jYWwsIGVuY29kZVN0cmluZ01hcCwgY29tcHJlc3NTY3JpcHRzLCBwcm9maWxlRmlsZVNpemUgKTtcclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnZ2VuZXJhdGUtdXNlZC1zdHJpbmdzLWZpbGUnLFxyXG4gICAgJ1dyaXRlcyB1c2VkIHN0cmluZ3MgdG8gcGhldC1pby1zaW0tc3BlY2lmaWMvIHNvIHRoYXQgUGhFVC1pTyBzaW1zIG9ubHkgb3V0cHV0IHJlbGV2YW50IHN0cmluZ3MgdG8gdGhlIEFQSSBpbiB1bmJ1aWx0IG1vZGUnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZ2V0UGhldExpYnMgPSByZXF1aXJlKCAnLi9nZXRQaGV0TGlicycgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbiAgICAgIGNvbnN0IHdlYnBhY2tCdWlsZCA9IHJlcXVpcmUoICcuL3dlYnBhY2tCdWlsZCcgKTtcclxuICAgICAgY29uc3QgQ2hpcHBlckNvbnN0YW50cyA9IHJlcXVpcmUoICcuLi9jb21tb24vQ2hpcHBlckNvbnN0YW50cycgKTtcclxuICAgICAgY29uc3QgZ2V0TG9jYWxlc0Zyb21SZXBvc2l0b3J5ID0gcmVxdWlyZSggJy4vZ2V0TG9jYWxlc0Zyb21SZXBvc2l0b3J5JyApO1xyXG4gICAgICBjb25zdCBnZXRTdHJpbmdNYXAgPSByZXF1aXJlKCAnLi9nZXRTdHJpbmdNYXAnICk7XHJcblxyXG4gICAgICB0cmFuc3BpbGVyLnRyYW5zcGlsZVJlcG9zKCBnZXRQaGV0TGlicyggcmVwbyApICk7XHJcbiAgICAgIGNvbnN0IHdlYnBhY2tSZXN1bHQgPSBhd2FpdCB3ZWJwYWNrQnVpbGQoIHJlcG8sICdwaGV0JyApO1xyXG5cclxuICAgICAgY29uc3QgcGhldExpYnMgPSBnZXRQaGV0TGlicyggcmVwbywgJ3BoZXQnICk7XHJcbiAgICAgIGNvbnN0IGFsbExvY2FsZXMgPSBbIENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFLCAuLi5nZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkoIHJlcG8gKSBdO1xyXG4gICAgICBjb25zdCB7IHN0cmluZ01hcCB9ID0gZ2V0U3RyaW5nTWFwKCByZXBvLCBhbGxMb2NhbGVzLCBwaGV0TGlicywgd2VicGFja1Jlc3VsdC51c2VkTW9kdWxlcyApO1xyXG5cclxuICAgICAgLy8gVE9ETzogaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vaXNzdWVzLzE4NzcgVGhpcyBpcyBvbmx5IHBlcnRpbmVudCBmb3IgcGhldC1pbywgc28gSSdtIG91dHB1dHRpbmdcclxuICAgICAgLy8gaXQgdG8gcGhldC1pby1zaW0tc3BlY2lmaWMuICBCdXQgbm9uZSBvZiBpbnRyaW5zaWMgZGF0YSBpcyBwaGV0LWlvLXNwZWNpZmljLlxyXG4gICAgICAvLyBEbyB3ZSB3YW50IGEgZGlmZmVyZW50IHBhdGggZm9yIGl0P1xyXG4gICAgICAvLyBUT0RPOiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg3NyBIb3cgZG8gd2UgaW5kaWNhdGUgdGhhdCBpdCBpcyBhIGJ1aWxkIGFydGlmYWN0LCBhbmRcclxuICAgICAgLy8gc2hvdWxkIG5vdCBiZSBtYW51YWxseSB1cGRhdGVkP1xyXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKCBgLi4vcGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvJHtyZXBvfS91c2VkLXN0cmluZ3NfZW4uanNvbmAsIEpTT04uc3RyaW5naWZ5KCBzdHJpbmdNYXAuZW4sIG51bGwsIDIgKSApO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnYnVpbGQtZm9yLXNlcnZlcicsICdtZWFudCBmb3IgdXNlIGJ5IGJ1aWxkLXNlcnZlciBvbmx5JyxcclxuICAgIFsgJ2J1aWxkJyBdXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnbGludCcsXHJcbiAgICBgbGludCBqcyBmaWxlcy4gT3B0aW9uczpcclxuLS1kaXNhYmxlLWVzbGludC1jYWNoZTogY2FjaGUgd2lsbCBub3QgYmUgcmVhZCBmcm9tLCBhbmQgY2FjaGUgd2lsbCBiZSBjbGVhcmVkIGZvciBuZXh0IHJ1bi5cclxuLS1maXg6IGF1dG9maXhhYmxlIGNoYW5nZXMgd2lsbCBiZSB3cml0dGVuIHRvIGRpc2tcclxuLS1jaGlwLWF3YXk6IG91dHB1dCBhIGxpc3Qgb2YgcmVzcG9uc2libGUgZGV2cyBmb3IgZWFjaCByZXBvIHdpdGggbGludCBwcm9ibGVtc1xyXG4tLXJlcG9zOiBjb21tYSBzZXBhcmF0ZWQgbGlzdCBvZiByZXBvcyB0byBsaW50IGluIGFkZGl0aW9uIHRvIHRoZSByZXBvIGZyb20gcnVubmluZ2AsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBsaW50ID0gcmVxdWlyZSggJy4vbGludCcgKTtcclxuXHJcbiAgICAgIC8vIC0tZGlzYWJsZS1lc2xpbnQtY2FjaGUgZGlzYWJsZXMgdGhlIGNhY2hlLCB1c2VmdWwgZm9yIGRldmVsb3BpbmcgcnVsZXNcclxuICAgICAgY29uc3QgY2FjaGUgPSAhZ3J1bnQub3B0aW9uKCAnZGlzYWJsZS1lc2xpbnQtY2FjaGUnICk7XHJcbiAgICAgIGNvbnN0IGZpeCA9IGdydW50Lm9wdGlvbiggJ2ZpeCcgKTtcclxuICAgICAgY29uc3QgY2hpcEF3YXkgPSBncnVudC5vcHRpb24oICdjaGlwLWF3YXknICk7XHJcblxyXG4gICAgICBjb25zdCBleHRyYVJlcG9zID0gZ3J1bnQub3B0aW9uKCAncmVwb3MnICkgPyBncnVudC5vcHRpb24oICdyZXBvcycgKS5zcGxpdCggJywnICkgOiBbXTtcclxuXHJcbiAgICAgIGNvbnN0IGxpbnRSZXR1cm5WYWx1ZSA9IGF3YWl0IGxpbnQoIFsgcmVwbywgLi4uZXh0cmFSZXBvcyBdLCB7XHJcbiAgICAgICAgY2FjaGU6IGNhY2hlLFxyXG4gICAgICAgIGZpeDogZml4LFxyXG4gICAgICAgIGNoaXBBd2F5OiBjaGlwQXdheVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBpZiAoICFsaW50UmV0dXJuVmFsdWUub2sgKSB7XHJcbiAgICAgICAgZ3J1bnQuZmFpbC5mYXRhbCggJ0xpbnQgZmFpbGVkJyApO1xyXG4gICAgICB9XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnbGludC1hbGwnLCAnbGludCBhbGwganMgZmlsZXMgdGhhdCBhcmUgcmVxdWlyZWQgdG8gYnVpbGQgdGhpcyByZXBvc2l0b3J5IChmb3IgdGhlIHNwZWNpZmllZCBicmFuZHMpJywgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IGxpbnQgPSByZXF1aXJlKCAnLi9saW50JyApO1xyXG5cclxuICAgIC8vIC0tZGlzYWJsZS1lc2xpbnQtY2FjaGUgZGlzYWJsZXMgdGhlIGNhY2hlLCB1c2VmdWwgZm9yIGRldmVsb3BpbmcgcnVsZXNcclxuICAgIGNvbnN0IGNhY2hlID0gIWdydW50Lm9wdGlvbiggJ2Rpc2FibGUtZXNsaW50LWNhY2hlJyApO1xyXG4gICAgY29uc3QgZml4ID0gZ3J1bnQub3B0aW9uKCAnZml4JyApO1xyXG4gICAgY29uc3QgY2hpcEF3YXkgPSBncnVudC5vcHRpb24oICdjaGlwLWF3YXknICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhZ3J1bnQub3B0aW9uKCAncGF0dGVybnMnICksICdwYXR0ZXJucyBub3Qgc3VwcG9ydCBmb3IgbGludC1hbGwnICk7XHJcblxyXG4gICAgY29uc3QgZ2V0UGhldExpYnMgPSByZXF1aXJlKCAnLi9nZXRQaGV0TGlicycgKTtcclxuXHJcbiAgICBjb25zdCBicmFuZHMgPSBnZXRCcmFuZHMoIGdydW50LCByZXBvLCBidWlsZExvY2FsICk7XHJcblxyXG4gICAgY29uc3QgbGludFJldHVyblZhbHVlID0gYXdhaXQgbGludCggZ2V0UGhldExpYnMoIHJlcG8sIGJyYW5kcyApLCB7XHJcbiAgICAgIGNhY2hlOiBjYWNoZSxcclxuICAgICAgZml4OiBmaXgsXHJcbiAgICAgIGNoaXBBd2F5OiBjaGlwQXdheVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIE91dHB1dCByZXN1bHRzIG9uIGVycm9ycy5cclxuICAgIGlmICggIWxpbnRSZXR1cm5WYWx1ZS5vayApIHtcclxuICAgICAgZ3J1bnQuZmFpbC5mYXRhbCggJ0xpbnQgZmFpbGVkJyApO1xyXG4gICAgfVxyXG4gIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdnZW5lcmF0ZS1kZXZlbG9wbWVudC1odG1sJyxcclxuICAgICdHZW5lcmF0ZXMgdG9wLWxldmVsIFNJTV9lbi5odG1sIGZpbGUgYmFzZWQgb24gdGhlIHByZWxvYWRzIGluIHBhY2thZ2UuanNvbi4nLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZ2VuZXJhdGVEZXZlbG9wbWVudEhUTUwgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZURldmVsb3BtZW50SFRNTCcgKTtcclxuXHJcbiAgICAgIGF3YWl0IGdlbmVyYXRlRGV2ZWxvcG1lbnRIVE1MKCByZXBvICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnZ2VuZXJhdGUtdGVzdC1odG1sJyxcclxuICAgICdHZW5lcmF0ZXMgdG9wLWxldmVsIFNJTS10ZXN0cy5odG1sIGZpbGUgYmFzZWQgb24gdGhlIHByZWxvYWRzIGluIHBhY2thZ2UuanNvbi4gIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXF1YS9ibG9iL21haW4vZG9jL2FkZGluZy11bml0LXRlc3RzLm1kICcgK1xyXG4gICAgJ2ZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGF1dG9tYXRlZCB0ZXN0aW5nLiBVc3VhbGx5IHlvdSBzaG91bGQgJyArXHJcbiAgICAnc2V0IHRoZSBcImdlbmVyYXRlZFVuaXRUZXN0c1wiOnRydWUgZmxhZyBpbiB0aGUgc2ltIHBhY2thZ2UuanNvbiBhbmQgcnVuIGBncnVudCB1cGRhdGVgIGluc3RlYWQgb2YgbWFudWFsbHkgZ2VuZXJhdGluZyB0aGlzLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVRlc3RIVE1MID0gcmVxdWlyZSggJy4vZ2VuZXJhdGVUZXN0SFRNTCcgKTtcclxuXHJcbiAgICAgIGF3YWl0IGdlbmVyYXRlVGVzdEhUTUwoIHJlcG8gKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdnZW5lcmF0ZS1hMTF5LXZpZXctaHRtbCcsXHJcbiAgICAnR2VuZXJhdGVzIHRvcC1sZXZlbCBTSU0tYTExeS12aWV3Lmh0bWwgZmlsZSB1c2VkIGZvciB2aXN1YWxpemluZyBhY2Nlc3NpYmxlIGNvbnRlbnQuIFVzdWFsbHkgeW91IHNob3VsZCAnICtcclxuICAgICdzZXQgdGhlIFwicGhldC5zaW1GZWF0dXJlcy5zdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb25cIjp0cnVlIGZsYWcgaW4gdGhlIHNpbSBwYWNrYWdlLmpzb24gYW5kIHJ1biBgZ3J1bnQgdXBkYXRlYCAnICtcclxuICAgICdpbnN0ZWFkIG9mIG1hbnVhbGx5IGdlbmVyYXRpbmcgdGhpcy4nLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuXHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlQTExeVZpZXdIVE1MID0gcmVxdWlyZSggJy4vZ2VuZXJhdGVBMTF5Vmlld0hUTUwnICk7XHJcbiAgICAgIGF3YWl0IGdlbmVyYXRlQTExeVZpZXdIVE1MKCByZXBvICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAndXBkYXRlJywgYFxyXG5VcGRhdGVzIHRoZSBub3JtYWwgYXV0b21hdGljYWxseS1nZW5lcmF0ZWQgZmlsZXMgZm9yIHRoaXMgcmVwb3NpdG9yeS4gSW5jbHVkZXM6XHJcbiAgKiBydW5uYWJsZXM6IGdlbmVyYXRlLWRldmVsb3BtZW50LWh0bWwgYW5kIG1vZHVsaWZ5XHJcbiAgKiBhY2Nlc3NpYmxlIHJ1bm5hYmxlczogZ2VuZXJhdGUtYTExeS12aWV3LWh0bWxcclxuICAqIHVuaXQgdGVzdHM6IGdlbmVyYXRlLXRlc3QtaHRtbFxyXG4gICogc2ltdWxhdGlvbnM6IGdlbmVyYXRlUkVBRE1FKClcclxuICAqIHBoZXQtaW8gc2ltdWxhdGlvbnM6IGdlbmVyYXRlIG92ZXJyaWRlcyBmaWxlIGlmIG5lZWRlZFxyXG4gICogY3JlYXRlIHRoZSBjb25nbG9tZXJhdGUgc3RyaW5nIGZpbGVzIGZvciB1bmJ1aWx0IG1vZGUsIGZvciB0aGlzIHJlcG8gYW5kIGl0cyBkZXBlbmRlbmNpZXNgLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZ2VuZXJhdGVSRUFETUUgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZVJFQURNRScgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbiAgICAgIGNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5cclxuICAgICAgLy8gc3VwcG9ydCByZXBvcyB0aGF0IGRvbid0IGhhdmUgYSBwaGV0IG9iamVjdFxyXG4gICAgICBpZiAoICFwYWNrYWdlT2JqZWN0LnBoZXQgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBtb2R1bGlmeSBpcyBncmFjZWZ1bCBpZiB0aGVyZSBhcmUgbm8gZmlsZXMgdGhhdCBuZWVkIG1vZHVsaWZ5aW5nLlxyXG4gICAgICBncnVudC50YXNrLnJ1biggJ21vZHVsaWZ5JyApO1xyXG5cclxuICAgICAgLy8gdXBkYXRlIFJFQURNRS5tZCBvbmx5IGZvciBzaW11bGF0aW9uc1xyXG4gICAgICBpZiAoIHBhY2thZ2VPYmplY3QucGhldC5zaW11bGF0aW9uICYmICFwYWNrYWdlT2JqZWN0LnBoZXQucmVhZG1lQ3JlYXRlZE1hbnVhbGx5ICkge1xyXG4gICAgICAgIGF3YWl0IGdlbmVyYXRlUkVBRE1FKCByZXBvLCAhIXBhY2thZ2VPYmplY3QucGhldC5wdWJsaXNoZWQgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQuc3VwcG9ydGVkQnJhbmRzICYmIHBhY2thZ2VPYmplY3QucGhldC5zdXBwb3J0ZWRCcmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICkge1xyXG5cclxuICAgICAgICAvLyBDb3BpZWQgZnJvbSBidWlsZC5qc29uIGFuZCB1c2VkIGFzIGEgcHJlbG9hZCBmb3IgcGhldC1pbyBicmFuZFxyXG4gICAgICAgIGNvbnN0IG92ZXJyaWRlc0ZpbGUgPSBganMvJHtyZXBvfS1waGV0LWlvLW92ZXJyaWRlcy5qc2A7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFscmVhZHkgYW4gb3ZlcnJpZGVzIGZpbGUsIGRvbid0IG92ZXJ3cml0ZSBpdCB3aXRoIGFuIGVtcHR5IG9uZVxyXG4gICAgICAgIGlmICggIWZzLmV4aXN0c1N5bmMoIGAuLi8ke3JlcG99LyR7b3ZlcnJpZGVzRmlsZX1gICkgKSB7XHJcbiAgICAgICAgICBjb25zdCB3cml0ZUZpbGVBbmRHaXRBZGQgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi93cml0ZUZpbGVBbmRHaXRBZGQnICk7XHJcblxyXG4gICAgICAgICAgY29uc3Qgb3ZlcnJpZGVzQ29udGVudCA9ICcvKiBlc2xpbnQtZGlzYWJsZSAqL1xcbndpbmRvdy5waGV0LnByZWxvYWRzLnBoZXRpby5waGV0aW9FbGVtZW50c092ZXJyaWRlcyA9IHt9Oyc7XHJcbiAgICAgICAgICBhd2FpdCB3cml0ZUZpbGVBbmRHaXRBZGQoIHJlcG8sIG92ZXJyaWRlc0ZpbGUsIG92ZXJyaWRlc0NvbnRlbnQgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzaW1TcGVjaWZpY1dyYXBwZXJzO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAvLyBQb3B1bGF0ZSBzaW0tc3BlY2lmaWMgd3JhcHBlcnMgaW50byB0aGUgcGFja2FnZS5qc29uXHJcbiAgICAgICAgICBzaW1TcGVjaWZpY1dyYXBwZXJzID0gZnMucmVhZGRpclN5bmMoIGAuLi9waGV0LWlvLXNpbS1zcGVjaWZpYy9yZXBvcy8ke3JlcG99L3dyYXBwZXJzL2AsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9IClcclxuICAgICAgICAgICAgLmZpbHRlciggZGlyZW50ID0+IGRpcmVudC5pc0RpcmVjdG9yeSgpIClcclxuICAgICAgICAgICAgLm1hcCggZGlyZW50ID0+IGBwaGV0LWlvLXNpbS1zcGVjaWZpYy9yZXBvcy8ke3JlcG99L3dyYXBwZXJzLyR7ZGlyZW50Lm5hbWV9YCApO1xyXG4gICAgICAgICAgaWYgKCBzaW1TcGVjaWZpY1dyYXBwZXJzLmxlbmd0aCA+IDAgKSB7XHJcblxyXG4gICAgICAgICAgICBwYWNrYWdlT2JqZWN0LnBoZXRbICdwaGV0LWlvJyBdID0gcGFja2FnZU9iamVjdC5waGV0WyAncGhldC1pbycgXSB8fCB7fTtcclxuICAgICAgICAgICAgcGFja2FnZU9iamVjdC5waGV0WyAncGhldC1pbycgXS53cmFwcGVycyA9IF8udW5pcSggc2ltU3BlY2lmaWNXcmFwcGVycy5jb25jYXQoIHBhY2thZ2VPYmplY3QucGhldFsgJ3BoZXQtaW8nIF0ud3JhcHBlcnMgfHwgW10gKSApO1xyXG4gICAgICAgICAgICBncnVudC5maWxlLndyaXRlKCAncGFja2FnZS5qc29uJywgSlNPTi5zdHJpbmdpZnkoIHBhY2thZ2VPYmplY3QsIG51bGwsIDIgKSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIGlmICggIWUubWVzc2FnZS5pbmNsdWRlcyggJ25vIHN1Y2ggZmlsZSBvciBkaXJlY3RvcnknICkgKSB7XHJcbiAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBUaGUgYWJvdmUgY29kZSBjYW4gbXV0YXRlIHRoZSBwYWNrYWdlLmpzb24sIHNvIGRvIHRoZXNlIGFmdGVyXHJcbiAgICAgIGlmICggcGFja2FnZU9iamVjdC5waGV0LnJ1bm5hYmxlICkge1xyXG4gICAgICAgIGdydW50LnRhc2sucnVuKCAnZ2VuZXJhdGUtZGV2ZWxvcG1lbnQtaHRtbCcgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQuc2ltRmVhdHVyZXMgJiYgcGFja2FnZU9iamVjdC5waGV0LnNpbUZlYXR1cmVzLnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbiApIHtcclxuICAgICAgICAgIGdydW50LnRhc2sucnVuKCAnZ2VuZXJhdGUtYTExeS12aWV3LWh0bWwnICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmICggcGFja2FnZU9iamVjdC5waGV0LmdlbmVyYXRlZFVuaXRUZXN0cyApIHtcclxuICAgICAgICBncnVudC50YXNrLnJ1biggJ2dlbmVyYXRlLXRlc3QtaHRtbCcgKTtcclxuICAgICAgfVxyXG4gICAgfSApICk7XHJcblxyXG4gIC8vIFRoaXMgaXMgbm90IHJ1biBpbiBncnVudCB1cGRhdGUgYmVjYXVzZSBpdCBhZmZlY3RzIGRlcGVuZGVuY2llcyBhbmQgb3V0cHV0cyBmaWxlcyBvdXRzaWRlIG9mIHRoZSByZXBvLlxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2dlbmVyYXRlLWRldmVsb3BtZW50LXN0cmluZ3MnLFxyXG4gICAgJ1RvIHN1cHBvcnQgbG9jYWxlcz0qIGluIHVuYnVpbHQgbW9kZSwgZ2VuZXJhdGUgYSBjb25nbG9tZXJhdGUgSlNPTiBmaWxlIGZvciBlYWNoIHJlcG8gd2l0aCB0cmFuc2xhdGlvbnMgaW4gYmFiZWwuIFJ1biBvbiBhbGwgcmVwb3MgdmlhOlxcbicgK1xyXG4gICAgJyogZm9yLWVhY2guc2ggcGVyZW5uaWFsLWFsaWFzL2RhdGEvYWN0aXZlLXJlcG9zIG5wbSBpbnN0YWxsXFxuJyArXHJcbiAgICAnKiBmb3ItZWFjaC5zaCBwZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcmVwb3MgZ3J1bnQgZ2VuZXJhdGUtZGV2ZWxvcG1lbnQtc3RyaW5ncycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZURldmVsb3BtZW50U3RyaW5ncyA9IHJlcXVpcmUoICcuLi9zY3JpcHRzL2dlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzJyApO1xyXG4gICAgICBjb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuXHJcbiAgICAgIGlmICggZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vJHtyZXBvfS1zdHJpbmdzX2VuLmpzb25gICkgKSB7XHJcbiAgICAgICAgZ2VuZXJhdGVEZXZlbG9wbWVudFN0cmluZ3MoIHJlcG8gKTtcclxuICAgICAgfVxyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAncHVibGlzaGVkLVJFQURNRScsXHJcbiAgICAnR2VuZXJhdGVzIFJFQURNRS5tZCBmaWxlIGZvciBhIHB1Ymxpc2hlZCBzaW11bGF0aW9uLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVJFQURNRSA9IHJlcXVpcmUoICcuL2dlbmVyYXRlUkVBRE1FJyApOyAvLyB1c2VkIGJ5IG11bHRpcGxlIHRhc2tzXHJcbiAgICAgIGF3YWl0IGdlbmVyYXRlUkVBRE1FKCByZXBvLCB0cnVlIC8qIHB1Ymxpc2hlZCAqLyApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3VucHVibGlzaGVkLVJFQURNRScsXHJcbiAgICAnR2VuZXJhdGVzIFJFQURNRS5tZCBmaWxlIGZvciBhbiB1bnB1Ymxpc2hlZCBzaW11bGF0aW9uLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVJFQURNRSA9IHJlcXVpcmUoICcuL2dlbmVyYXRlUkVBRE1FJyApOyAvLyB1c2VkIGJ5IG11bHRpcGxlIHRhc2tzXHJcbiAgICAgIGF3YWl0IGdlbmVyYXRlUkVBRE1FKCByZXBvLCBmYWxzZSAvKiBwdWJsaXNoZWQgKi8gKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdzb3J0LWltcG9ydHMnLCAnU29ydCB0aGUgaW1wb3J0IHN0YXRlbWVudHMgZm9yIGEgc2luZ2xlIGZpbGUgKGlmIC0tZmlsZT17e0ZJTEV9fSBpcyBwcm92aWRlZCksIG9yIGRvZXMgc28gZm9yIGFsbCBKUyBmaWxlcyBpZiBub3Qgc3BlY2lmaWVkJywgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IHNvcnRJbXBvcnRzID0gcmVxdWlyZSggJy4vc29ydEltcG9ydHMnICk7XHJcblxyXG4gICAgY29uc3QgZmlsZSA9IGdydW50Lm9wdGlvbiggJ2ZpbGUnICk7XHJcblxyXG4gICAgaWYgKCBmaWxlICkge1xyXG4gICAgICBzb3J0SW1wb3J0cyggZmlsZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGdydW50LmZpbGUucmVjdXJzZSggYC4uLyR7cmVwb30vanNgLCBhYnNmaWxlID0+IHNvcnRJbXBvcnRzKCBhYnNmaWxlICkgKTtcclxuICAgIH1cclxuICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnY29tbWl0cy1zaW5jZScsXHJcbiAgICAnU2hvd3MgY29tbWl0cyBzaW5jZSBhIHNwZWNpZmllZCBkYXRlLiBVc2UgLS1kYXRlPTxkYXRlPiB0byBzcGVjaWZ5IHRoZSBkYXRlLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBkYXRlU3RyaW5nID0gZ3J1bnQub3B0aW9uKCAnZGF0ZScgKTtcclxuICAgICAgYXNzZXJ0KCBkYXRlU3RyaW5nLCAnbWlzc2luZyByZXF1aXJlZCBvcHRpb246IC0tZGF0ZT17e0RBVEV9fScgKTtcclxuXHJcbiAgICAgIGNvbnN0IGNvbW1pdHNTaW5jZSA9IHJlcXVpcmUoICcuL2NvbW1pdHNTaW5jZScgKTtcclxuXHJcbiAgICAgIGF3YWl0IGNvbW1pdHNTaW5jZSggcmVwbywgZGF0ZVN0cmluZyApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIC8vIFNlZSByZXBvcnRNZWRpYS5qc1xyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3JlcG9ydC1tZWRpYScsXHJcbiAgICAnKHByb2plY3Qtd2lkZSkgUmVwb3J0IG9uIGxpY2Vuc2UuanNvbiBmaWxlcyB0aHJvdWdob3V0IGFsbCB3b3JraW5nIGNvcGllcy4gJyArXHJcbiAgICAnUmVwb3J0cyBhbnkgbWVkaWEgKHN1Y2ggYXMgaW1hZ2VzIG9yIHNvdW5kKSBmaWxlcyB0aGF0IGhhdmUgYW55IG9mIHRoZSBmb2xsb3dpbmcgcHJvYmxlbXM6XFxuJyArXHJcbiAgICAnKDEpIGluY29tcGF0aWJsZS1saWNlbnNlIChyZXNvdXJjZSBsaWNlbnNlIG5vdCBhcHByb3ZlZClcXG4nICtcclxuICAgICcoMikgbm90LWFubm90YXRlZCAobGljZW5zZS5qc29uIG1pc3Npbmcgb3IgZW50cnkgbWlzc2luZyBmcm9tIGxpY2Vuc2UuanNvbilcXG4nICtcclxuICAgICcoMykgbWlzc2luZy1maWxlIChlbnRyeSBpbiB0aGUgbGljZW5zZS5qc29uIGJ1dCBub3Qgb24gdGhlIGZpbGUgc3lzdGVtKScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXBvcnRNZWRpYSA9IHJlcXVpcmUoICcuL3JlcG9ydE1lZGlhJyApO1xyXG5cclxuICAgICAgYXdhaXQgcmVwb3J0TWVkaWEoIHJlcG8gKTtcclxuICAgIH0gKSApO1xyXG5cclxuICAvLyBzZWUgcmVwb3J0VGhpcmRQYXJ0eS5qc1xyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3JlcG9ydC10aGlyZC1wYXJ0eScsXHJcbiAgICAnQ3JlYXRlcyBhIHJlcG9ydCBvZiB0aGlyZC1wYXJ0eSByZXNvdXJjZXMgKGNvZGUsIGltYWdlcywgc291bmQsIGV0YykgdXNlZCBpbiB0aGUgcHVibGlzaGVkIFBoRVQgc2ltdWxhdGlvbnMgYnkgJyArXHJcbiAgICAncmVhZGluZyB0aGUgbGljZW5zZSBpbmZvcm1hdGlvbiBpbiBwdWJsaXNoZWQgSFRNTCBmaWxlcyBvbiB0aGUgUGhFVCB3ZWJzaXRlLiBUaGlzIHRhc2sgbXVzdCBiZSBydW4gZnJvbSBtYWluLiAgJyArXHJcbiAgICAnQWZ0ZXIgcnVubmluZyB0aGlzIHRhc2ssIHlvdSBtdXN0IHB1c2ggc2hlcnBhL3RoaXJkLXBhcnR5LWxpY2Vuc2VzLm1kLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXBvcnRUaGlyZFBhcnR5ID0gcmVxdWlyZSggJy4vcmVwb3J0VGhpcmRQYXJ0eScgKTtcclxuXHJcbiAgICAgIGF3YWl0IHJlcG9ydFRoaXJkUGFydHkoKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdtb2R1bGlmeScsICdDcmVhdGVzICouanMgbW9kdWxlcyBmb3IgYWxsIGltYWdlcy9zdHJpbmdzL2F1ZGlvL2V0YyBpbiBhIHJlcG8nLCB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3QgbW9kdWxpZnkgPSByZXF1aXJlKCAnLi9tb2R1bGlmeScgKTtcclxuICAgIGNvbnN0IHJlcG9ydE1lZGlhID0gcmVxdWlyZSggJy4vcmVwb3J0TWVkaWEnICk7XHJcbiAgICBjb25zdCBnZW5lcmF0ZURldmVsb3BtZW50U3RyaW5ncyA9IHJlcXVpcmUoICcuLi9zY3JpcHRzL2dlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzJyApO1xyXG4gICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4gICAgYXdhaXQgbW9kdWxpZnkoIHJlcG8gKTtcclxuXHJcbiAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIGAuLi8ke3JlcG99LyR7cmVwb30tc3RyaW5nc19lbi5qc29uYCApICkge1xyXG4gICAgICBnZW5lcmF0ZURldmVsb3BtZW50U3RyaW5ncyggcmVwbyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERvIHRoaXMgbGFzdCB0byBoZWxwIHdpdGggcHJvdG90eXBpbmcgYmVmb3JlIGNvbW1pdCAoaXQgd291bGQgYmUgZnJ1c3RyYXRpbmcgaWYgdGhpcyBlcnJvcmVkIG91dCBiZWZvcmUgZ2l2aW5nXHJcbiAgICAvLyB5b3UgdGhlIGFzc2V0IHlvdSBjb3VsZCB1c2UgaW4gdGhlIHNpbSkuXHJcbiAgICBhd2FpdCByZXBvcnRNZWRpYSggcmVwbyApO1xyXG4gIH0gKSApO1xyXG5cclxuICAvLyBHcnVudCB0YXNrIHRoYXQgZGV0ZXJtaW5lcyBjcmVhdGVkIGFuZCBsYXN0IG1vZGlmaWVkIGRhdGVzIGZyb20gZ2l0LCBhbmRcclxuICAvLyB1cGRhdGVzIGNvcHlyaWdodCBzdGF0ZW1lbnRzIGFjY29yZGluZ2x5LCBzZWUgIzQwM1xyXG4gIGdydW50LnJlZ2lzdGVyVGFzayhcclxuICAgICd1cGRhdGUtY29weXJpZ2h0LWRhdGVzJyxcclxuICAgICdVcGRhdGUgdGhlIGNvcHlyaWdodCBkYXRlcyBpbiBKUyBzb3VyY2UgZmlsZXMgYmFzZWQgb24gR2l0aHViIGRhdGVzJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHVwZGF0ZUNvcHlyaWdodERhdGVzID0gcmVxdWlyZSggJy4vdXBkYXRlQ29weXJpZ2h0RGF0ZXMnICk7XHJcblxyXG4gICAgICBhd2FpdCB1cGRhdGVDb3B5cmlnaHREYXRlcyggcmVwbyApO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKFxyXG4gICAgJ3dlYnBhY2stZGV2LXNlcnZlcicsIGBSdW5zIGEgd2VicGFjayBzZXJ2ZXIgZm9yIGEgZ2l2ZW4gbGlzdCBvZiBzaW11bGF0aW9ucy5cclxuLS1yZXBvcz1SRVBPUyBmb3IgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiByZXBvcyAoZGVmYXVsdHMgdG8gY3VycmVudCByZXBvKVxyXG4tLXBvcnQ9OTAwMCB0byBhZGp1c3QgdGhlIHJ1bm5pbmcgcG9ydFxyXG4tLWRldnRvb2w9c3RyaW5nIHZhbHVlIGZvciBzb3VyY2VtYXAgZ2VuZXJhdGlvbiBzcGVjaWZpZWQgYXQgaHR0cHM6Ly93ZWJwYWNrLmpzLm9yZy9jb25maWd1cmF0aW9uL2RldnRvb2wgb3IgdW5kZWZpbmVkIGZvciAobm9uZSlcclxuLS1jaHJvbWU6IG9wZW4gdGhlIHNpbXMgaW4gQ2hyb21lIHRhYnMgKE1hYylgLFxyXG4gICAgKCkgPT4ge1xyXG4gICAgICAvLyBXZSBkb24ndCBmaW5pc2ghIERvbid0IHRlbGwgZ3J1bnQgdGhpcy4uLlxyXG4gICAgICBncnVudC50YXNrLmN1cnJlbnQuYXN5bmMoKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlcG9zID0gZ3J1bnQub3B0aW9uKCAncmVwb3MnICkgPyBncnVudC5vcHRpb24oICdyZXBvcycgKS5zcGxpdCggJywnICkgOiBbIHJlcG8gXTtcclxuICAgICAgY29uc3QgcG9ydCA9IGdydW50Lm9wdGlvbiggJ3BvcnQnICkgfHwgOTAwMDtcclxuICAgICAgbGV0IGRldnRvb2wgPSBncnVudC5vcHRpb24oICdkZXZ0b29sJyApIHx8ICdpbmxpbmUtc291cmNlLW1hcCc7XHJcbiAgICAgIGlmICggZGV2dG9vbCA9PT0gJ25vbmUnIHx8IGRldnRvb2wgPT09ICd1bmRlZmluZWQnICkge1xyXG4gICAgICAgIGRldnRvb2wgPSB1bmRlZmluZWQ7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgb3BlbkNocm9tZSA9IGdydW50Lm9wdGlvbiggJ2Nocm9tZScgKSB8fCBmYWxzZTtcclxuXHJcbiAgICAgIGNvbnN0IHdlYnBhY2tEZXZTZXJ2ZXIgPSByZXF1aXJlKCAnLi93ZWJwYWNrRGV2U2VydmVyJyApO1xyXG5cclxuICAgICAgLy8gTk9URTogV2UgZG9uJ3QgY2FyZSBhYm91dCB0aGUgcHJvbWlzZSB0aGF0IGlzIHJldHVybmVkIGhlcmUsIGJlY2F1c2Ugd2UgYXJlIGdvaW5nIHRvIGtlZXAgdGhpcyB0YXNrIHJ1bm5pbmdcclxuICAgICAgLy8gdW50aWwgdGhlIHVzZXIgbWFudWFsbHkga2lsbHMgaXQuXHJcbiAgICAgIHdlYnBhY2tEZXZTZXJ2ZXIoIHJlcG9zLCBwb3J0LCBkZXZ0b29sLCBvcGVuQ2hyb21lICk7XHJcbiAgICB9XHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKFxyXG4gICAgJ2dlbmVyYXRlLXBoZXQtaW8tYXBpJyxcclxuICAgICdPdXRwdXQgdGhlIFBoRVQtaU8gQVBJIGFzIEpTT04gdG8gcGhldC1pby1zaW0tc3BlY2lmaWMvYXBpLlxcbicgK1xyXG4gICAgJ09wdGlvbnNcXG46JyArXHJcbiAgICAnLS1zaW1zPS4uLiBhIGxpc3Qgb2Ygc2ltcyB0byBjb21wYXJlIChkZWZhdWx0cyB0byB0aGUgc2ltIGluIHRoZSBjdXJyZW50IGRpcilcXG4nICtcclxuICAgICctLXNpbUxpc3Q9Li4uIGEgZmlsZSB3aXRoIGEgbGlzdCBvZiBzaW1zIHRvIGNvbXBhcmUgKGRlZmF1bHRzIHRvIHRoZSBzaW0gaW4gdGhlIGN1cnJlbnQgZGlyKVxcbicgK1xyXG4gICAgJy0tc3RhYmxlIC0gcmVnZW5lcmF0ZSBmb3IgYWxsIFwic3RhYmxlIHNpbXNcIiAoc2VlIHBlcmVubmlhbC9kYXRhL3BoZXQtaW8tYXBpLXN0YWJsZS8pXFxuJyArXHJcbiAgICAnLS10ZW1wb3JhcnkgLSBvdXRwdXRzIHRvIHRoZSB0ZW1wb3JhcnkgZGlyZWN0b3J5JyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGZvcm1hdFBoZXRpb0FQSSA9IHJlcXVpcmUoICcuLi9waGV0LWlvL2Zvcm1hdFBoZXRpb0FQSScgKTtcclxuICAgICAgY29uc3QgZ2V0U2ltTGlzdCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0U2ltTGlzdCcgKTtcclxuICAgICAgY29uc3QgZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSSA9IHJlcXVpcmUoICcuLi9waGV0LWlvL2dlbmVyYXRlUGhldGlvTWFjcm9BUEknICk7XHJcbiAgICAgIGNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5cclxuICAgICAgY29uc3Qgc2ltcyA9IGdldFNpbUxpc3QoKS5sZW5ndGggPT09IDAgPyBbIHJlcG8gXSA6IGdldFNpbUxpc3QoKTtcclxuXHJcbiAgICAgIHRyYW5zcGlsZXIudHJhbnNwaWxlQWxsKCk7XHJcblxyXG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSSggc2ltcywge1xyXG4gICAgICAgIHNob3dQcm9ncmVzc0Jhcjogc2ltcy5sZW5ndGggPiAxLFxyXG4gICAgICAgIHRocm93QVBJR2VuZXJhdGlvbkVycm9yczogZmFsc2UgLy8gV3JpdGUgYXMgbWFueSBhcyB3ZSBjYW4sIGFuZCBwcmludCB3aGF0IHdlIGRpZG4ndCB3cml0ZVxyXG4gICAgICB9ICk7XHJcbiAgICAgIHNpbXMuZm9yRWFjaCggc2ltID0+IHtcclxuICAgICAgICBjb25zdCBkaXIgPSBgLi4vcGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvJHtzaW19YDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgZnMubWtkaXJTeW5jKCBkaXIgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICAvLyBEaXJlY3RvcnkgZXhpc3RzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gYCR7ZGlyfS8ke3NpbX0tcGhldC1pby1hcGkke2dydW50Lm9wdGlvbiggJ3RlbXBvcmFyeScgKSA/ICctdGVtcG9yYXJ5JyA6ICcnfS5qc29uYDtcclxuICAgICAgICBjb25zdCBhcGkgPSByZXN1bHRzWyBzaW0gXTtcclxuICAgICAgICBhcGkgJiYgZnMud3JpdGVGaWxlU3luYyggZmlsZVBhdGgsIGZvcm1hdFBoZXRpb0FQSSggYXBpICkgKTtcclxuICAgICAgfSApO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKFxyXG4gICAgJ2NvbXBhcmUtcGhldC1pby1hcGknLFxyXG4gICAgJ0NvbXBhcmVzIHRoZSBwaGV0LWlvLWFwaSBhZ2FpbnN0IHRoZSByZWZlcmVuY2UgdmVyc2lvbihzKSBpZiB0aGlzIHNpbVxcJ3MgcGFja2FnZS5qc29uIG1hcmtzIGNvbXBhcmVEZXNpZ25lZEFQSUNoYW5nZXMuICAnICtcclxuICAgICdUaGlzIHdpbGwgYnkgZGVmYXVsdCBjb21wYXJlIGRlc2lnbmVkIGNoYW5nZXMgb25seS4gT3B0aW9uczpcXG4nICtcclxuICAgICctLXNpbXM9Li4uIGEgbGlzdCBvZiBzaW1zIHRvIGNvbXBhcmUgKGRlZmF1bHRzIHRvIHRoZSBzaW0gaW4gdGhlIGN1cnJlbnQgZGlyKVxcbicgK1xyXG4gICAgJy0tc2ltTGlzdD0uLi4gYSBmaWxlIHdpdGggYSBsaXN0IG9mIHNpbXMgdG8gY29tcGFyZSAoZGVmYXVsdHMgdG8gdGhlIHNpbSBpbiB0aGUgY3VycmVudCBkaXIpXFxuJyArXHJcbiAgICAnLS1zdGFibGUsIGdlbmVyYXRlIHRoZSBwaGV0LWlvLWFwaXMgZm9yIGVhY2ggcGhldC1pbyBzaW0gY29uc2lkZXJlZCB0byBoYXZlIGEgc3RhYmxlIEFQSSAoc2VlIHBlcmVubmlhbC1hbGlhcy9kYXRhL3BoZXQtaW8tYXBpLXN0YWJsZSlcXG4nICtcclxuICAgICctLWRlbHRhLCBieSBkZWZhdWx0IGEgYnJlYWtpbmctY29tcGF0aWJpbGl0eSBjb21wYXJpc29uIGlzIGRvbmUsIGJ1dCAtLWRlbHRhIHNob3dzIGFsbCBjaGFuZ2VzXFxuJyArXHJcbiAgICAnLS10ZW1wb3JhcnksIGNvbXBhcmVzIEFQSSBmaWxlcyBpbiB0aGUgdGVtcG9yYXJ5IGRpcmVjdG9yeSAob3RoZXJ3aXNlIGNvbXBhcmVzIHRvIGZyZXNobHkgZ2VuZXJhdGVkIEFQSXMpXFxuJyArXHJcbiAgICAnLS1jb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzIC0gYWRkIHRoaXMgZmxhZyB0byBjb21wYXJlIGJyZWFraW5nIGNoYW5nZXMgaW4gYWRkaXRpb24gdG8gZGVzaWduZWQgY2hhbmdlcycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZXRTaW1MaXN0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRTaW1MaXN0JyApO1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSScgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4gICAgICBjb25zdCBzaW1zID0gZ2V0U2ltTGlzdCgpLmxlbmd0aCA9PT0gMCA/IFsgcmVwbyBdIDogZ2V0U2ltTGlzdCgpO1xyXG4gICAgICBjb25zdCB0ZW1wb3JhcnkgPSBncnVudC5vcHRpb24oICd0ZW1wb3JhcnknICk7XHJcbiAgICAgIGxldCBwcm9wb3NlZEFQSXMgPSBudWxsO1xyXG4gICAgICBpZiAoIHRlbXBvcmFyeSApIHtcclxuICAgICAgICBwcm9wb3NlZEFQSXMgPSB7fTtcclxuICAgICAgICBzaW1zLmZvckVhY2goIHNpbSA9PiB7XHJcbiAgICAgICAgICBwcm9wb3NlZEFQSXNbIHNpbSBdID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgLi4vcGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvJHtyZXBvfS8ke3JlcG99LXBoZXQtaW8tYXBpLXRlbXBvcmFyeS5qc29uYCwgJ3V0ZjgnICkgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIHRyYW5zcGlsZXIudHJhbnNwaWxlQWxsKCk7XHJcbiAgICAgICAgcHJvcG9zZWRBUElzID0gYXdhaXQgZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSSggc2ltcywge1xyXG4gICAgICAgICAgc2hvd1Byb2dyZXNzQmFyOiBzaW1zLmxlbmd0aCA+IDEsXHJcbiAgICAgICAgICBzaG93TWVzc2FnZXNGcm9tU2ltOiBmYWxzZVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRG9uJ3QgYWRkIHRvIG9wdGlvbnMgb2JqZWN0IGlmIHZhbHVlcyBhcmUgYHVuZGVmaW5lZGAgKGFzIF8uZXh0ZW5kIHdpbGwga2VlcCB0aG9zZSBlbnRyaWVzIGFuZCBub3QgbWl4IGluIGRlZmF1bHRzXHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7fTtcclxuICAgICAgaWYgKCBncnVudC5vcHRpb24oICdkZWx0YScgKSApIHtcclxuICAgICAgICBvcHRpb25zLmRlbHRhID0gZ3J1bnQub3B0aW9uKCAnZGVsdGEnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBncnVudC5vcHRpb24oICdjb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzJyApICkge1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGFyZUJyZWFraW5nQVBJQ2hhbmdlcyA9IGdydW50Lm9wdGlvbiggJ2NvbXBhcmVCcmVha2luZ0FQSUNoYW5nZXMnICk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgb2sgPSBhd2FpdCByZXF1aXJlKCAnLi4vcGhldC1pby9waGV0aW9Db21wYXJlQVBJU2V0cycgKSggc2ltcywgcHJvcG9zZWRBUElzLCBvcHRpb25zICk7XHJcbiAgICAgICFvayAmJiBncnVudC5mYWlsLmZhdGFsKCAnUGhFVC1pTyBBUEkgY29tcGFyaXNvbiBmYWlsZWQnICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soXHJcbiAgICAncHJvZmlsZS1maWxlLXNpemUnLFxyXG4gICAgJ1Byb2ZpbGVzIHRoZSBmaWxlIHNpemUgb2YgdGhlIGJ1aWx0IEpTIGZpbGUgZm9yIGEgZ2l2ZW4gcmVwbycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlRmlsZVNpemUgPSByZXF1aXJlKCAnLi4vZ3J1bnQvcHJvZmlsZUZpbGVTaXplJyApO1xyXG5cclxuICAgICAgYXdhaXQgcHJvZmlsZUZpbGVTaXplKCByZXBvICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGdydW50IHRhc2tzIHRoYXQgZWZmZWN0aXZlbHkgZ2V0IGZvcndhcmRlZCB0byBwZXJlbm5pYWwuIEl0IHdpbGwgZXhlY3V0ZSBhIGdydW50IHByb2Nlc3MgcnVubmluZyBmcm9tXHJcbiAgICogcGVyZW5uaWFsJ3MgZGlyZWN0b3J5IHdpdGggdGhlIHNhbWUgb3B0aW9ucyAoYnV0IHdpdGggLS1yZXBvPXt7UkVQT319IGFkZGVkLCBzbyB0aGF0IHBlcmVubmlhbCBpcyBhd2FyZSBvZiB3aGF0XHJcbiAgICogcmVwb3NpdG9yeSBpcyB0aGUgdGFyZ2V0KS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFzayAtIFRoZSBuYW1lIG9mIHRoZSB0YXNrXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZm9yd2FyZFRvUGVyZW5uaWFsR3J1bnQoIHRhc2sgKSB7XHJcbiAgICBncnVudC5yZWdpc3RlclRhc2soIHRhc2ssICdSdW4gZ3J1bnQgLS1oZWxwIGluIHBlcmVubmlhbCB0byBzZWUgZG9jdW1lbnRhdGlvbicsICgpID0+IHtcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICcoRm9yd2FyZGluZyB0YXNrIHRvIHBlcmVubmlhbCknICk7XHJcblxyXG4gICAgICBjb25zdCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICk7XHJcblxyXG5cclxuICAgICAgY29uc3QgZG9uZSA9IGdydW50LnRhc2suY3VycmVudC5hc3luYygpO1xyXG5cclxuICAgICAgLy8gSW5jbHVkZSB0aGUgLS1yZXBvIGZsYWdcclxuICAgICAgY29uc3QgYXJncyA9IFsgYC0tcmVwbz0ke3JlcG99YCwgLi4ucHJvY2Vzcy5hcmd2LnNsaWNlKCAyICkgXTtcclxuICAgICAgY29uc3QgYXJnc1N0cmluZyA9IGFyZ3MubWFwKCBhcmcgPT4gYFwiJHthcmd9XCJgICkuam9pbiggJyAnICk7XHJcbiAgICAgIGNvbnN0IHNwYXduZWQgPSBjaGlsZF9wcm9jZXNzLnNwYXduKCAvXndpbi8udGVzdCggcHJvY2Vzcy5wbGF0Zm9ybSApID8gJ2dydW50LmNtZCcgOiAnZ3J1bnQnLCBhcmdzLCB7XHJcbiAgICAgICAgY3dkOiAnLi4vcGVyZW5uaWFsJ1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGdydW50LmxvZy5kZWJ1ZyggYHJ1bm5pbmcgZ3J1bnQgJHthcmdzU3RyaW5nfSBpbiAuLi8ke3JlcG99YCApO1xyXG5cclxuICAgICAgc3Bhd25lZC5zdGRlcnIub24oICdkYXRhJywgZGF0YSA9PiBncnVudC5sb2cuZXJyb3IoIGRhdGEudG9TdHJpbmcoKSApICk7XHJcbiAgICAgIHNwYXduZWQuc3Rkb3V0Lm9uKCAnZGF0YScsIGRhdGEgPT4gZ3J1bnQubG9nLndyaXRlKCBkYXRhLnRvU3RyaW5nKCkgKSApO1xyXG4gICAgICBwcm9jZXNzLnN0ZGluLnBpcGUoIHNwYXduZWQuc3RkaW4gKTtcclxuXHJcbiAgICAgIHNwYXduZWQub24oICdjbG9zZScsIGNvZGUgPT4ge1xyXG4gICAgICAgIGlmICggY29kZSAhPT0gMCApIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYHBlcmVubmlhbCBncnVudCAke2FyZ3NTdHJpbmd9IGZhaWxlZCB3aXRoIGNvZGUgJHtjb2RlfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBkb25lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICBbXHJcbiAgICAnY2hlY2tvdXQtc2hhcycsXHJcbiAgICAnY2hlY2tvdXQtdGFyZ2V0JyxcclxuICAgICdjaGVja291dC1yZWxlYXNlJyxcclxuICAgICdjaGVja291dC1tYWluJyxcclxuICAgICdjaGVja291dC1tYWluLWFsbCcsXHJcbiAgICAnY3JlYXRlLW9uZS1vZmYnLFxyXG4gICAgJ3NoYS1jaGVjaycsXHJcbiAgICAnc2ltLWxpc3QnLFxyXG4gICAgJ25wbS11cGRhdGUnLFxyXG4gICAgJ2NyZWF0ZS1yZWxlYXNlJyxcclxuICAgICdjaGVycnktcGljaycsXHJcbiAgICAnd3JhcHBlcicsXHJcbiAgICAnZGV2JyxcclxuICAgICdvbmUtb2ZmJyxcclxuICAgICdyYycsXHJcbiAgICAncHJvZHVjdGlvbicsXHJcbiAgICAncHJvdG90eXBlJyxcclxuICAgICdjcmVhdGUtc2ltJyxcclxuICAgICdpbnNlcnQtcmVxdWlyZS1zdGF0ZW1lbnQnLFxyXG4gICAgJ2xpbnQtZXZlcnl0aGluZycsXHJcbiAgICAnZ2VuZXJhdGUtZGF0YScsXHJcbiAgICAncGRvbS1jb21wYXJpc29uJyxcclxuICAgICdyZWxlYXNlLWJyYW5jaC1saXN0J1xyXG4gIF0uZm9yRWFjaCggZm9yd2FyZFRvUGVyZW5uaWFsR3J1bnQgKTtcclxufTtcclxuXHJcbmNvbnN0IGdldEJyYW5kcyA9ICggZ3J1bnQsIHJlcG8sIGJ1aWxkTG9jYWwgKSA9PiB7XHJcblxyXG4gIC8vIERldGVybWluZSB3aGF0IGJyYW5kcyB3ZSB3YW50IHRvIGJ1aWxkXHJcbiAgYXNzZXJ0KCAhZ3J1bnQub3B0aW9uKCAnYnJhbmQnICksICdVc2UgLS1icmFuZHM9e3tCUkFORFN9fSBpbnN0ZWFkIG9mIGJyYW5kJyApO1xyXG5cclxuICBjb25zdCBsb2NhbFBhY2thZ2VPYmplY3QgPSBncnVudC5maWxlLnJlYWRKU09OKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkQnJhbmRzID0gbG9jYWxQYWNrYWdlT2JqZWN0LnBoZXQuc3VwcG9ydGVkQnJhbmRzIHx8IFtdO1xyXG5cclxuICBsZXQgYnJhbmRzO1xyXG4gIGlmICggZ3J1bnQub3B0aW9uKCAnYnJhbmRzJyApICkge1xyXG4gICAgaWYgKCBncnVudC5vcHRpb24oICdicmFuZHMnICkgPT09ICcqJyApIHtcclxuICAgICAgYnJhbmRzID0gc3VwcG9ydGVkQnJhbmRzO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGJyYW5kcyA9IGdydW50Lm9wdGlvbiggJ2JyYW5kcycgKS5zcGxpdCggJywnICk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2UgaWYgKCBidWlsZExvY2FsLmJyYW5kcyApIHtcclxuICAgIC8vIEV4dHJhIGNoZWNrLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzY0MFxyXG4gICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBidWlsZExvY2FsLmJyYW5kcyApLCAnSWYgYnJhbmRzIGV4aXN0cyBpbiBidWlsZC1sb2NhbC5qc29uLCBpdCBzaG91bGQgYmUgYW4gYXJyYXknICk7XHJcbiAgICBicmFuZHMgPSBidWlsZExvY2FsLmJyYW5kcy5maWx0ZXIoIGJyYW5kID0+IHN1cHBvcnRlZEJyYW5kcy5pbmNsdWRlcyggYnJhbmQgKSApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGJyYW5kcyA9IFsgJ2FkYXB0ZWQtZnJvbS1waGV0JyBdO1xyXG4gIH1cclxuXHJcbiAgLy8gRW5zdXJlIGFsbCBsaXN0ZWQgYnJhbmRzIGFyZSB2YWxpZFxyXG4gIGJyYW5kcy5mb3JFYWNoKCBicmFuZCA9PiBhc3NlcnQoIHN1cHBvcnRlZEJyYW5kcy5pbmNsdWRlcyggYnJhbmQgKSwgYFVuc3VwcG9ydGVkIGJyYW5kOiAke2JyYW5kfWAgKSApO1xyXG5cclxuICByZXR1cm4gYnJhbmRzO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQSxNQUFNLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDbENBLE9BQU8sQ0FBRSxvQkFBcUIsQ0FBQztBQUMvQjs7QUFFQTtBQUNBLElBQUssQ0FBQ0MsTUFBTSxDQUFDQyxrQkFBa0IsRUFBRztFQUVsQztFQUNBO0VBQ0E7RUFDRUMsT0FBTyxDQUFDQyxFQUFFLENBQUUsb0JBQW9CLEVBQUVDLEVBQUUsSUFBSTtJQUFFLE1BQU1BLEVBQUU7RUFBRSxDQUFFLENBQUM7O0VBRXpEO0VBQ0VGLE9BQU8sQ0FBQ0MsRUFBRSxDQUFFLFFBQVEsRUFBRSxNQUFNO0lBQzFCRSxPQUFPLENBQUNDLEdBQUcsQ0FBRSxzQ0FBdUMsQ0FBQztJQUNyREosT0FBTyxDQUFDSyxJQUFJLENBQUMsQ0FBQztFQUNo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