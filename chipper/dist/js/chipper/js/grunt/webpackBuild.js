// Copyright 2019-2024, University of Colorado Boulder

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
const ChipperConstants = require('../common/ChipperConstants');
const webpackGlobalLibraries = require('../common/webpackGlobalLibraries');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const webpack = require('webpack');
// eslint-disable-next-line require-statement-match
const {
  ModifySourcePlugin,
  ConcatOperation
} = require('modify-source-webpack-plugin');
const activeRepos = fs.readFileSync(path.resolve(__dirname, '../../../perennial-alias/data/active-repos'), 'utf-8').trim().split(/\r?\n/).map(s => s.trim());
const reposByNamespace = {};
const aliases = {};
for (const repo of activeRepos) {
  const packageFile = path.resolve(__dirname, `../../../${repo}/package.json`);
  if (fs.existsSync(packageFile)) {
    const packageObject = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
    if (packageObject.phet && packageObject.phet.requirejsNamespace) {
      reposByNamespace[packageObject.phet.requirejsNamespace] = repo;
      aliases[packageObject.phet.requirejsNamespace] = path.resolve(__dirname, `../../../${repo}${repo === 'brand' ? '/phet' : ''}/js`);
    }
  }
}
const getModuleRules = function getModuleRules() {
  return Object.keys(webpackGlobalLibraries).map(globalKey => {
    return {
      // path.join to normalize on the right path separator, perhaps there is another way?!
      test: fileName => fileName.includes(path.join(webpackGlobalLibraries[globalKey])),
      loader: '../chipper/node_modules/expose-loader',
      options: {
        exposes: globalKey
      }
    };
  });
};

/**
 * Convert absolute paths of modules to relative ones
 * @param {Array.<string>} modules
 * @returns {Array.<string>}
 */
const getRelativeModules = modules => {
  const root = path.resolve(__dirname, '../../../');
  return modules

  // Webpack 5 reports intermediate paths which need to be filtered out
  .filter(m => fs.lstatSync(m).isFile())

  // Get the relative path to the root, like "joist/js/Sim.js" or, on Windows, "joist\js\Sim.js"
  .map(m => path.relative(root, m))

  // Some developers check in a package.json to the root of the checkouts, as described in https://github.com/phetsims/chipper/issues/494#issuecomment-821292542
  // like: /Users/samreid/apache-document-root/package.json. This powers grunt only and should not be included in the modules
  .filter(m => m !== '../package.json' && m !== '..\\package.json');
};

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 * @public
 *
 * @param {string} repo
 * @param {string} brand
 * @param {Object} [options]
 * @returns {Promise.<string>} - The combined JS output from the process
 */
const webpackBuild = function webpackBuild(repo, brand, options) {
  return new Promise((resolve, reject) => {
    options = _.merge({
      outputDir: repo
    }, options);
    const outputDir = path.resolve(__dirname, `../../${ChipperConstants.BUILD_DIR}`, options.outputDir);
    const outputFileName = `${repo}.js`;
    const outputPath = path.resolve(outputDir, outputFileName);

    // Create plugins to ignore brands that we are not building at this time. Here "resource" is the module getting
    // imported, and "context" is the directory that holds the module doing the importing. This is split up because
    // of how brands are loaded in simLauncher.js. They are a dynamic import who's import path resolves to the current
    // brand. The way that webpack builds this is by creating a map of all the potential resources that could be loaded
    // by that import (by looking at the file structure). Thus the following resource/context regex split is accounting
    // for the "map" created in the built webpack file, in which the "resource" starts with "./{{brand}}" even though
    // the simLauncher line includes the parent directory: "brand/". For more details see https://github.com/phetsims/chipper/issues/879
    const ignorePhetBrand = new webpack.IgnorePlugin({
      resourceRegExp: /\/phet\//,
      contextRegExp: /brand/
    });
    const ignorePhetioBrand = new webpack.IgnorePlugin({
      resourceRegExp: /\/phet-io\//,
      contextRegExp: /brand/
    });
    const ignoreAdaptedFromPhetBrand = new webpack.IgnorePlugin({
      resourceRegExp: /\/adapted-from-phet\//,
      contextRegExp: /brand/
    });

    // Allow builds for developers that do not have the phet-io repo checked out. IgnorePlugin will skip any require
    // that matches the following regex.
    const ignorePhetioRepo = new webpack.IgnorePlugin({
      resourceRegExp: /\/phet-io\// // ignore anything in a phet-io named directory
    });
    const compiler = webpack({
      module: {
        rules: getModuleRules()
      },
      // We uglify as a step after this, with many custom rules. So we do NOT optimize or uglify in this step.
      optimization: {
        minimize: false
      },
      // Simulations or runnables will have a single entry point
      entry: {
        repo: `../chipper/dist/js/${repo}/js/${repo}-main.js`
      },
      // We output our builds to the following dir
      output: {
        path: outputDir,
        filename: outputFileName,
        hashFunction: 'xxhash64' // for Node 17+, see https://github.com/webpack/webpack/issues/14532
      },
      // {Array.<Plugin>}
      plugins: [
      // Exclude brand specific code. This includes all of the `phet-io` repo for non phet-io builds.
      ...(brand === 'phet' ? [ignorePhetioBrand, ignorePhetioRepo, ignoreAdaptedFromPhetBrand] : brand === 'phet-io' ? [ignorePhetBrand, ignoreAdaptedFromPhetBrand] :
      // adapted-from-phet and all other brands
      [ignorePhetBrand, ignorePhetioBrand, ignorePhetioRepo]), ...(options.profileFileSize ? [new ModifySourcePlugin({
        rules: [{
          test: /.*/,
          operations: [new ConcatOperation('start', 'console.log(\'START_MODULE\',\'$FILE_PATH\');\n\n'), new ConcatOperation('end', '\n\nconsole.log(\'END_MODULE\',\'$FILE_PATH\');\n\n')]
        }]
      })] : [])]
    });
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        console.error('Webpack build errors:', stats.compilation.errors);
        reject(err || stats.compilation.errors[0]);
      } else {
        const jsFile = outputPath;
        const js = fs.readFileSync(jsFile, 'utf-8');
        fs.unlinkSync(jsFile);
        resolve({
          js: js,
          usedModules: getRelativeModules(Array.from(stats.compilation.fileDependencies))
        });
      }
    });
  });
};
module.exports = webpackBuild;
webpackBuild.getModuleRules = getModuleRules;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDaGlwcGVyQ29uc3RhbnRzIiwicmVxdWlyZSIsIndlYnBhY2tHbG9iYWxMaWJyYXJpZXMiLCJmcyIsInBhdGgiLCJfIiwid2VicGFjayIsIk1vZGlmeVNvdXJjZVBsdWdpbiIsIkNvbmNhdE9wZXJhdGlvbiIsImFjdGl2ZVJlcG9zIiwicmVhZEZpbGVTeW5jIiwicmVzb2x2ZSIsIl9fZGlybmFtZSIsInRyaW0iLCJzcGxpdCIsIm1hcCIsInMiLCJyZXBvc0J5TmFtZXNwYWNlIiwiYWxpYXNlcyIsInJlcG8iLCJwYWNrYWdlRmlsZSIsImV4aXN0c1N5bmMiLCJwYWNrYWdlT2JqZWN0IiwiSlNPTiIsInBhcnNlIiwicGhldCIsInJlcXVpcmVqc05hbWVzcGFjZSIsImdldE1vZHVsZVJ1bGVzIiwiT2JqZWN0Iiwia2V5cyIsImdsb2JhbEtleSIsInRlc3QiLCJmaWxlTmFtZSIsImluY2x1ZGVzIiwiam9pbiIsImxvYWRlciIsIm9wdGlvbnMiLCJleHBvc2VzIiwiZ2V0UmVsYXRpdmVNb2R1bGVzIiwibW9kdWxlcyIsInJvb3QiLCJmaWx0ZXIiLCJtIiwibHN0YXRTeW5jIiwiaXNGaWxlIiwicmVsYXRpdmUiLCJ3ZWJwYWNrQnVpbGQiLCJicmFuZCIsIlByb21pc2UiLCJyZWplY3QiLCJtZXJnZSIsIm91dHB1dERpciIsIkJVSUxEX0RJUiIsIm91dHB1dEZpbGVOYW1lIiwib3V0cHV0UGF0aCIsImlnbm9yZVBoZXRCcmFuZCIsIklnbm9yZVBsdWdpbiIsInJlc291cmNlUmVnRXhwIiwiY29udGV4dFJlZ0V4cCIsImlnbm9yZVBoZXRpb0JyYW5kIiwiaWdub3JlQWRhcHRlZEZyb21QaGV0QnJhbmQiLCJpZ25vcmVQaGV0aW9SZXBvIiwiY29tcGlsZXIiLCJtb2R1bGUiLCJydWxlcyIsIm9wdGltaXphdGlvbiIsIm1pbmltaXplIiwiZW50cnkiLCJvdXRwdXQiLCJmaWxlbmFtZSIsImhhc2hGdW5jdGlvbiIsInBsdWdpbnMiLCJwcm9maWxlRmlsZVNpemUiLCJvcGVyYXRpb25zIiwicnVuIiwiZXJyIiwic3RhdHMiLCJoYXNFcnJvcnMiLCJjb25zb2xlIiwiZXJyb3IiLCJjb21waWxhdGlvbiIsImVycm9ycyIsImpzRmlsZSIsImpzIiwidW5saW5rU3luYyIsInVzZWRNb2R1bGVzIiwiQXJyYXkiLCJmcm9tIiwiZmlsZURlcGVuZGVuY2llcyIsImV4cG9ydHMiXSwic291cmNlcyI6WyJ3ZWJwYWNrQnVpbGQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUnVucyB3ZWJwYWNrIC0gRE8gTk9UIFJVTiBNVUxUSVBMRSBDT05DVVJSRU5UTFlcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG4vLyBtb2R1bGVzXHJcbmNvbnN0IENoaXBwZXJDb25zdGFudHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJDb25zdGFudHMnICk7XHJcbmNvbnN0IHdlYnBhY2tHbG9iYWxMaWJyYXJpZXMgPSByZXF1aXJlKCAnLi4vY29tbW9uL3dlYnBhY2tHbG9iYWxMaWJyYXJpZXMnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCB3ZWJwYWNrID0gcmVxdWlyZSggJ3dlYnBhY2snICk7XHJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxyXG5jb25zdCB7IE1vZGlmeVNvdXJjZVBsdWdpbiwgQ29uY2F0T3BlcmF0aW9uIH0gPSByZXF1aXJlKCAnbW9kaWZ5LXNvdXJjZS13ZWJwYWNrLXBsdWdpbicgKTtcclxuXHJcbmNvbnN0IGFjdGl2ZVJlcG9zID0gZnMucmVhZEZpbGVTeW5jKCBwYXRoLnJlc29sdmUoIF9fZGlybmFtZSwgJy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9kYXRhL2FjdGl2ZS1yZXBvcycgKSwgJ3V0Zi04JyApLnRyaW0oKS5zcGxpdCggL1xccj9cXG4vICkubWFwKCBzID0+IHMudHJpbSgpICk7XHJcbmNvbnN0IHJlcG9zQnlOYW1lc3BhY2UgPSB7fTtcclxuY29uc3QgYWxpYXNlcyA9IHt9O1xyXG5cclxuZm9yICggY29uc3QgcmVwbyBvZiBhY3RpdmVSZXBvcyApIHtcclxuICBjb25zdCBwYWNrYWdlRmlsZSA9IHBhdGgucmVzb2x2ZSggX19kaXJuYW1lLCBgLi4vLi4vLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBwYWNrYWdlRmlsZSApICkge1xyXG4gICAgY29uc3QgcGFja2FnZU9iamVjdCA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggcGFja2FnZUZpbGUsICd1dGYtOCcgKSApO1xyXG4gICAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQgJiYgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSApIHtcclxuICAgICAgcmVwb3NCeU5hbWVzcGFjZVsgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSBdID0gcmVwbztcclxuICAgICAgYWxpYXNlc1sgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSBdID0gcGF0aC5yZXNvbHZlKCBfX2Rpcm5hbWUsIGAuLi8uLi8uLi8ke3JlcG99JHtyZXBvID09PSAnYnJhbmQnID8gJy9waGV0JyA6ICcnfS9qc2AgKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGdldE1vZHVsZVJ1bGVzID0gZnVuY3Rpb24gZ2V0TW9kdWxlUnVsZXMoKSB7XHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKCB3ZWJwYWNrR2xvYmFsTGlicmFyaWVzICkubWFwKCBnbG9iYWxLZXkgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuXHJcbiAgICAgIC8vIHBhdGguam9pbiB0byBub3JtYWxpemUgb24gdGhlIHJpZ2h0IHBhdGggc2VwYXJhdG9yLCBwZXJoYXBzIHRoZXJlIGlzIGFub3RoZXIgd2F5PyFcclxuICAgICAgdGVzdDogZmlsZU5hbWUgPT4gZmlsZU5hbWUuaW5jbHVkZXMoIHBhdGguam9pbiggd2VicGFja0dsb2JhbExpYnJhcmllc1sgZ2xvYmFsS2V5IF0gKSApLFxyXG4gICAgICBsb2FkZXI6ICcuLi9jaGlwcGVyL25vZGVfbW9kdWxlcy9leHBvc2UtbG9hZGVyJyxcclxuICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgIGV4cG9zZXM6IGdsb2JhbEtleVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0gKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0IGFic29sdXRlIHBhdGhzIG9mIG1vZHVsZXMgdG8gcmVsYXRpdmUgb25lc1xyXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBtb2R1bGVzXHJcbiAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn1cclxuICovXHJcbmNvbnN0IGdldFJlbGF0aXZlTW9kdWxlcyA9IG1vZHVsZXMgPT4ge1xyXG4gIGNvbnN0IHJvb3QgPSBwYXRoLnJlc29sdmUoIF9fZGlybmFtZSwgJy4uLy4uLy4uLycgKTtcclxuICByZXR1cm4gbW9kdWxlc1xyXG5cclxuICAgIC8vIFdlYnBhY2sgNSByZXBvcnRzIGludGVybWVkaWF0ZSBwYXRocyB3aGljaCBuZWVkIHRvIGJlIGZpbHRlcmVkIG91dFxyXG4gICAgLmZpbHRlciggbSA9PiBmcy5sc3RhdFN5bmMoIG0gKS5pc0ZpbGUoKSApXHJcblxyXG4gICAgLy8gR2V0IHRoZSByZWxhdGl2ZSBwYXRoIHRvIHRoZSByb290LCBsaWtlIFwiam9pc3QvanMvU2ltLmpzXCIgb3IsIG9uIFdpbmRvd3MsIFwiam9pc3RcXGpzXFxTaW0uanNcIlxyXG4gICAgLm1hcCggbSA9PiBwYXRoLnJlbGF0aXZlKCByb290LCBtICkgKVxyXG5cclxuICAgIC8vIFNvbWUgZGV2ZWxvcGVycyBjaGVjayBpbiBhIHBhY2thZ2UuanNvbiB0byB0aGUgcm9vdCBvZiB0aGUgY2hlY2tvdXRzLCBhcyBkZXNjcmliZWQgaW4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzQ5NCNpc3N1ZWNvbW1lbnQtODIxMjkyNTQyXHJcbiAgICAvLyBsaWtlOiAvVXNlcnMvc2FtcmVpZC9hcGFjaGUtZG9jdW1lbnQtcm9vdC9wYWNrYWdlLmpzb24uIFRoaXMgcG93ZXJzIGdydW50IG9ubHkgYW5kIHNob3VsZCBub3QgYmUgaW5jbHVkZWQgaW4gdGhlIG1vZHVsZXNcclxuICAgIC5maWx0ZXIoIG0gPT4gbSAhPT0gJy4uL3BhY2thZ2UuanNvbicgJiYgbSAhPT0gJy4uXFxcXHBhY2thZ2UuanNvbicgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSdW5zIHdlYnBhY2sgLSBETyBOT1QgUlVOIE1VTFRJUExFIENPTkNVUlJFTlRMWVxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuZFxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIFRoZSBjb21iaW5lZCBKUyBvdXRwdXQgZnJvbSB0aGUgcHJvY2Vzc1xyXG4gKi9cclxuY29uc3Qgd2VicGFja0J1aWxkID0gZnVuY3Rpb24gd2VicGFja0J1aWxkKCByZXBvLCBicmFuZCwgb3B0aW9ucyApIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xyXG5cclxuICAgIG9wdGlvbnMgPSBfLm1lcmdlKCB7XHJcbiAgICAgIG91dHB1dERpcjogcmVwb1xyXG4gICAgfSwgb3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IG91dHB1dERpciA9IHBhdGgucmVzb2x2ZSggX19kaXJuYW1lLCBgLi4vLi4vJHtDaGlwcGVyQ29uc3RhbnRzLkJVSUxEX0RJUn1gLCBvcHRpb25zLm91dHB1dERpciApO1xyXG4gICAgY29uc3Qgb3V0cHV0RmlsZU5hbWUgPSBgJHtyZXBvfS5qc2A7XHJcbiAgICBjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5yZXNvbHZlKCBvdXRwdXREaXIsIG91dHB1dEZpbGVOYW1lICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHBsdWdpbnMgdG8gaWdub3JlIGJyYW5kcyB0aGF0IHdlIGFyZSBub3QgYnVpbGRpbmcgYXQgdGhpcyB0aW1lLiBIZXJlIFwicmVzb3VyY2VcIiBpcyB0aGUgbW9kdWxlIGdldHRpbmdcclxuICAgIC8vIGltcG9ydGVkLCBhbmQgXCJjb250ZXh0XCIgaXMgdGhlIGRpcmVjdG9yeSB0aGF0IGhvbGRzIHRoZSBtb2R1bGUgZG9pbmcgdGhlIGltcG9ydGluZy4gVGhpcyBpcyBzcGxpdCB1cCBiZWNhdXNlXHJcbiAgICAvLyBvZiBob3cgYnJhbmRzIGFyZSBsb2FkZWQgaW4gc2ltTGF1bmNoZXIuanMuIFRoZXkgYXJlIGEgZHluYW1pYyBpbXBvcnQgd2hvJ3MgaW1wb3J0IHBhdGggcmVzb2x2ZXMgdG8gdGhlIGN1cnJlbnRcclxuICAgIC8vIGJyYW5kLiBUaGUgd2F5IHRoYXQgd2VicGFjayBidWlsZHMgdGhpcyBpcyBieSBjcmVhdGluZyBhIG1hcCBvZiBhbGwgdGhlIHBvdGVudGlhbCByZXNvdXJjZXMgdGhhdCBjb3VsZCBiZSBsb2FkZWRcclxuICAgIC8vIGJ5IHRoYXQgaW1wb3J0IChieSBsb29raW5nIGF0IHRoZSBmaWxlIHN0cnVjdHVyZSkuIFRodXMgdGhlIGZvbGxvd2luZyByZXNvdXJjZS9jb250ZXh0IHJlZ2V4IHNwbGl0IGlzIGFjY291bnRpbmdcclxuICAgIC8vIGZvciB0aGUgXCJtYXBcIiBjcmVhdGVkIGluIHRoZSBidWlsdCB3ZWJwYWNrIGZpbGUsIGluIHdoaWNoIHRoZSBcInJlc291cmNlXCIgc3RhcnRzIHdpdGggXCIuL3t7YnJhbmR9fVwiIGV2ZW4gdGhvdWdoXHJcbiAgICAvLyB0aGUgc2ltTGF1bmNoZXIgbGluZSBpbmNsdWRlcyB0aGUgcGFyZW50IGRpcmVjdG9yeTogXCJicmFuZC9cIi4gRm9yIG1vcmUgZGV0YWlscyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzg3OVxyXG4gICAgY29uc3QgaWdub3JlUGhldEJyYW5kID0gbmV3IHdlYnBhY2suSWdub3JlUGx1Z2luKCB7IHJlc291cmNlUmVnRXhwOiAvXFwvcGhldFxcLy8sIGNvbnRleHRSZWdFeHA6IC9icmFuZC8gfSApO1xyXG4gICAgY29uc3QgaWdub3JlUGhldGlvQnJhbmQgPSBuZXcgd2VicGFjay5JZ25vcmVQbHVnaW4oIHsgcmVzb3VyY2VSZWdFeHA6IC9cXC9waGV0LWlvXFwvLywgY29udGV4dFJlZ0V4cDogL2JyYW5kLyB9ICk7XHJcbiAgICBjb25zdCBpZ25vcmVBZGFwdGVkRnJvbVBoZXRCcmFuZCA9IG5ldyB3ZWJwYWNrLklnbm9yZVBsdWdpbigge1xyXG4gICAgICByZXNvdXJjZVJlZ0V4cDogL1xcL2FkYXB0ZWQtZnJvbS1waGV0XFwvLyxcclxuICAgICAgY29udGV4dFJlZ0V4cDogL2JyYW5kL1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEFsbG93IGJ1aWxkcyBmb3IgZGV2ZWxvcGVycyB0aGF0IGRvIG5vdCBoYXZlIHRoZSBwaGV0LWlvIHJlcG8gY2hlY2tlZCBvdXQuIElnbm9yZVBsdWdpbiB3aWxsIHNraXAgYW55IHJlcXVpcmVcclxuICAgIC8vIHRoYXQgbWF0Y2hlcyB0aGUgZm9sbG93aW5nIHJlZ2V4LlxyXG4gICAgY29uc3QgaWdub3JlUGhldGlvUmVwbyA9IG5ldyB3ZWJwYWNrLklnbm9yZVBsdWdpbigge1xyXG4gICAgICByZXNvdXJjZVJlZ0V4cDogL1xcL3BoZXQtaW9cXC8vIC8vIGlnbm9yZSBhbnl0aGluZyBpbiBhIHBoZXQtaW8gbmFtZWQgZGlyZWN0b3J5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgY29tcGlsZXIgPSB3ZWJwYWNrKCB7XHJcblxyXG4gICAgICBtb2R1bGU6IHtcclxuICAgICAgICBydWxlczogZ2V0TW9kdWxlUnVsZXMoKVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gV2UgdWdsaWZ5IGFzIGEgc3RlcCBhZnRlciB0aGlzLCB3aXRoIG1hbnkgY3VzdG9tIHJ1bGVzLiBTbyB3ZSBkbyBOT1Qgb3B0aW1pemUgb3IgdWdsaWZ5IGluIHRoaXMgc3RlcC5cclxuICAgICAgb3B0aW1pemF0aW9uOiB7XHJcbiAgICAgICAgbWluaW1pemU6IGZhbHNlXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBTaW11bGF0aW9ucyBvciBydW5uYWJsZXMgd2lsbCBoYXZlIGEgc2luZ2xlIGVudHJ5IHBvaW50XHJcbiAgICAgIGVudHJ5OiB7XHJcbiAgICAgICAgcmVwbzogYC4uL2NoaXBwZXIvZGlzdC9qcy8ke3JlcG99L2pzLyR7cmVwb30tbWFpbi5qc2BcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIFdlIG91dHB1dCBvdXIgYnVpbGRzIHRvIHRoZSBmb2xsb3dpbmcgZGlyXHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIHBhdGg6IG91dHB1dERpcixcclxuICAgICAgICBmaWxlbmFtZTogb3V0cHV0RmlsZU5hbWUsXHJcbiAgICAgICAgaGFzaEZ1bmN0aW9uOiAneHhoYXNoNjQnIC8vIGZvciBOb2RlIDE3Kywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrL3dlYnBhY2svaXNzdWVzLzE0NTMyXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyB7QXJyYXkuPFBsdWdpbj59XHJcbiAgICAgIHBsdWdpbnM6IFtcclxuXHJcbiAgICAgICAgLy8gRXhjbHVkZSBicmFuZCBzcGVjaWZpYyBjb2RlLiBUaGlzIGluY2x1ZGVzIGFsbCBvZiB0aGUgYHBoZXQtaW9gIHJlcG8gZm9yIG5vbiBwaGV0LWlvIGJ1aWxkcy5cclxuICAgICAgICAuLi4oIGJyYW5kID09PSAncGhldCcgPyBbIGlnbm9yZVBoZXRpb0JyYW5kLCBpZ25vcmVQaGV0aW9SZXBvLCBpZ25vcmVBZGFwdGVkRnJvbVBoZXRCcmFuZCBdIDpcclxuICAgICAgICAgIGJyYW5kID09PSAncGhldC1pbycgPyBbIGlnbm9yZVBoZXRCcmFuZCwgaWdub3JlQWRhcHRlZEZyb21QaGV0QnJhbmQgXSA6XHJcblxyXG4gICAgICAgICAgICAvLyBhZGFwdGVkLWZyb20tcGhldCBhbmQgYWxsIG90aGVyIGJyYW5kc1xyXG4gICAgICAgICAgICBbIGlnbm9yZVBoZXRCcmFuZCwgaWdub3JlUGhldGlvQnJhbmQsIGlnbm9yZVBoZXRpb1JlcG8gXSApLFxyXG4gICAgICAgIC4uLiggb3B0aW9ucy5wcm9maWxlRmlsZVNpemUgPyBbXHJcbiAgICAgICAgICBuZXcgTW9kaWZ5U291cmNlUGx1Z2luKCB7XHJcbiAgICAgICAgICAgIHJ1bGVzOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGVzdDogLy4qLyxcclxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgbmV3IENvbmNhdE9wZXJhdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAnc3RhcnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdjb25zb2xlLmxvZyhcXCdTVEFSVF9NT0RVTEVcXCcsXFwnJEZJTEVfUEFUSFxcJyk7XFxuXFxuJ1xyXG4gICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgICBuZXcgQ29uY2F0T3BlcmF0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgICdlbmQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdcXG5cXG5jb25zb2xlLmxvZyhcXCdFTkRfTU9EVUxFXFwnLFxcJyRGSUxFX1BBVEhcXCcpO1xcblxcbidcclxuICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfSApXHJcbiAgICAgICAgXSA6IFtdIClcclxuICAgICAgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbXBpbGVyLnJ1biggKCBlcnIsIHN0YXRzICkgPT4ge1xyXG4gICAgICBpZiAoIGVyciB8fCBzdGF0cy5oYXNFcnJvcnMoKSApIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCAnV2VicGFjayBidWlsZCBlcnJvcnM6Jywgc3RhdHMuY29tcGlsYXRpb24uZXJyb3JzICk7XHJcbiAgICAgICAgcmVqZWN0KCBlcnIgfHwgc3RhdHMuY29tcGlsYXRpb24uZXJyb3JzWyAwIF0gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCBqc0ZpbGUgPSBvdXRwdXRQYXRoO1xyXG4gICAgICAgIGNvbnN0IGpzID0gZnMucmVhZEZpbGVTeW5jKCBqc0ZpbGUsICd1dGYtOCcgKTtcclxuXHJcbiAgICAgICAgZnMudW5saW5rU3luYygganNGaWxlICk7XHJcblxyXG4gICAgICAgIHJlc29sdmUoIHtcclxuICAgICAgICAgIGpzOiBqcyxcclxuICAgICAgICAgIHVzZWRNb2R1bGVzOiBnZXRSZWxhdGl2ZU1vZHVsZXMoIEFycmF5LmZyb20oIHN0YXRzLmNvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMgKSApXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3ZWJwYWNrQnVpbGQ7XHJcbndlYnBhY2tCdWlsZC5nZXRNb2R1bGVSdWxlcyA9IGdldE1vZHVsZVJ1bGVzOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQTtBQUNBLE1BQU1BLGdCQUFnQixHQUFHQyxPQUFPLENBQUUsNEJBQTZCLENBQUM7QUFDaEUsTUFBTUMsc0JBQXNCLEdBQUdELE9BQU8sQ0FBRSxrQ0FBbUMsQ0FBQztBQUM1RSxNQUFNRSxF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