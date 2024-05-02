// Copyright 2018, University of Colorado Boulder

/**
 * Represents a simulation release branch for deployment
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const buildLocal = require('./buildLocal');
const buildServerRequest = require('./buildServerRequest');
const ChipperVersion = require('./ChipperVersion');
const checkoutMain = require('./checkoutMain');
const checkoutTarget = require('./checkoutTarget');
const createDirectory = require('./createDirectory');
const execute = require('./execute');
const getActiveSims = require('./getActiveSims');
const getBranchDependencies = require('./getBranchDependencies');
const getBranches = require('./getBranches');
const getBuildArguments = require('./getBuildArguments');
const getDependencies = require('./getDependencies');
const getBranchMap = require('./getBranchMap');
const getBranchVersion = require('./getBranchVersion');
const getFileAtBranch = require('./getFileAtBranch');
const getRepoVersion = require('./getRepoVersion');
const gitCheckout = require('./gitCheckout');
const gitCheckoutDirectory = require('./gitCheckoutDirectory');
const gitCloneOrFetchDirectory = require('./gitCloneOrFetchDirectory');
const gitFirstDivergingCommit = require('./gitFirstDivergingCommit');
const gitIsAncestor = require('./gitIsAncestor');
const gitPull = require('./gitPull');
const gitPullDirectory = require('./gitPullDirectory');
const gitRevParse = require('./gitRevParse');
const gitTimestamp = require('./gitTimestamp');
const gruntCommand = require('./gruntCommand');
const loadJSON = require('./loadJSON');
const npmUpdateDirectory = require('./npmUpdateDirectory');
const puppeteerLoad = require('./puppeteerLoad');
const simMetadata = require('./simMetadata');
const simPhetioMetadata = require('./simPhetioMetadata');
const withServer = require('./withServer');
const assert = require('assert');
const fs = require('fs');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
const _ = require('lodash');
module.exports = function () {
  const MAINTENANCE_DIRECTORY = '../release-branches';
  class ReleaseBranch {
    /**
     * @public
     * @constructor
     *
     * @param {string} repo
     * @param {string} branch
     * @param {Array.<string>} brands
     * @param {boolean} isReleased
     */
    constructor(repo, branch, brands, isReleased) {
      assert(typeof repo === 'string');
      assert(typeof branch === 'string');
      assert(Array.isArray(brands));
      assert(typeof isReleased === 'boolean');

      // @public {string}
      this.repo = repo;
      this.branch = branch;

      // @public {Array.<string>}
      this.brands = brands;

      // @public {boolean}
      this.isReleased = isReleased;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {Object}
     */
    serialize() {
      return {
        repo: this.repo,
        branch: this.branch,
        brands: this.brands,
        isReleased: this.isReleased
      };
    }

    /**
     * Takes a serialized form of the ReleaseBranch and returns an actual instance.
     * @public
     *
     * @param {Object}
     * @returns {ReleaseBranch}
     */
    static deserialize({
      repo,
      branch,
      brands,
      isReleased
    }) {
      return new ReleaseBranch(repo, branch, brands, isReleased);
    }

    /**
     * Returns whether the two release branches contain identical information.
     * @public
     *
     * @param {ReleaseBranch} releaseBranch
     * @returns {boolean}
     */
    equals(releaseBranch) {
      return this.repo === releaseBranch.repo && this.branch === releaseBranch.branch && this.brands.join(',') === releaseBranch.brands.join(',') && this.isReleased === releaseBranch.isReleased;
    }

    /**
     * Converts it to a (debuggable) string form.
     * @public
     *
     * @returns {string}
     */
    toString() {
      return `${this.repo} ${this.branch} ${this.brands.join(',')}${this.isReleased ? '' : ' (unpublished)'}`;
    }

    /**
     * @public
     *
     * @param repo {string}
     * @param branch {string}
     * @returns {string}
     */
    static getCheckoutDirectory(repo, branch) {
      return `${MAINTENANCE_DIRECTORY}/${repo}-${branch}`;
    }

    /**
     * Returns the maintenance directory, for things that want to use it directly.
     * @public
     *
     * @returns {string}
     */
    static getMaintenanceDirectory() {
      return MAINTENANCE_DIRECTORY;
    }

    /**
     * Returns the path (relative to the repo) to the built phet-brand HTML file
     * @public
     *
     * @returns {Promise<string>}
     */
    async getLocalPhetBuiltHTMLPath() {
      const usesChipper2 = await this.usesChipper2();
      return `build/${usesChipper2 ? 'phet/' : ''}${this.repo}_en${usesChipper2 ? '_phet' : ''}.html`;
    }

    /**
     * Returns the path (relative to the repo) to the built phet-io-brand HTML file
     * @public
     *
     * @returns {Promise<string>}
     */
    async getLocalPhetIOBuiltHTMLPath() {
      const usesChipper2 = await this.usesChipper2();
      return `build/${usesChipper2 ? 'phet-io/' : ''}${this.repo}${usesChipper2 ? '_all_phet-io' : '_en-phetio'}.html`;
    }

    /**
     * Returns the query parameter to use for activating phet-io standalone mode
     * @public
     *
     * @returns {Promise<string>}
     */
    async getPhetioStandaloneQueryParameter() {
      return (await this.usesOldPhetioStandalone()) ? 'phet-io.standalone' : 'phetioStandalone';
    }

    /**
     * @public
     *
     * @returns {ChipperVersion}
     */
    getChipperVersion() {
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
      return ChipperVersion.getFromPackageJSON(JSON.parse(fs.readFileSync(`${checkoutDirectory}/chipper/package.json`, 'utf8')));
    }

    /**
     * @public
     */
    async updateCheckout(overrideDependencies = {}) {
      winston.info(`updating checkout for ${this.toString()}`);
      if (!fs.existsSync(MAINTENANCE_DIRECTORY)) {
        winston.info(`creating directory ${MAINTENANCE_DIRECTORY}`);
        await createDirectory(MAINTENANCE_DIRECTORY);
      }
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
      if (!fs.existsSync(checkoutDirectory)) {
        winston.info(`creating directory ${checkoutDirectory}`);
        await createDirectory(checkoutDirectory);
      }
      await gitCloneOrFetchDirectory(this.repo, checkoutDirectory);
      await gitCheckoutDirectory(this.branch, `${checkoutDirectory}/${this.repo}`);
      await gitPullDirectory(`${checkoutDirectory}/${this.repo}`);
      const dependenciesOnBranchTip = await loadJSON(`${checkoutDirectory}/${this.repo}/dependencies.json`);
      dependenciesOnBranchTip.babel = {
        sha: buildLocal.babelBranch,
        branch: buildLocal.babelBranch
      };
      const dependencyRepos = _.uniq([...Object.keys(dependenciesOnBranchTip), ...Object.keys(overrideDependencies)].filter(repo => repo !== 'comment'));
      await Promise.all(dependencyRepos.map(async repo => {
        const repoPwd = `${checkoutDirectory}/${repo}`;
        await gitCloneOrFetchDirectory(repo, checkoutDirectory);
        const sha = overrideDependencies[repo] ? overrideDependencies[repo].sha : dependenciesOnBranchTip[repo].sha;
        await gitCheckoutDirectory(sha, repoPwd);

        // Pull babel, since we don't give it a specific SHA (just a branch),
        // see https://github.com/phetsims/perennial/issues/326
        if (repo === 'babel') {
          await gitPullDirectory(repoPwd);
        }
        if (repo === 'chipper' || repo === 'perennial-alias' || repo === this.repo) {
          winston.info(`npm ${repo} in ${checkoutDirectory}`);
          await npmUpdateDirectory(repoPwd);
        }
      }));

      // Perennial can be a nice manual addition in each dir, in case you need to go in and run commands to these
      // branches manually (like build or checkout or update). No need to npm install, you can do that yourself if needed.
      await gitCloneOrFetchDirectory('perennial', checkoutDirectory);
    }

    /**
     * @public
     *
     * @param {Object} [options] - optional parameters for getBuildArguments
     */
    async build(options) {
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
      const repoDirectory = `${checkoutDirectory}/${this.repo}`;
      const args = getBuildArguments(this.getChipperVersion(), _.merge({
        brands: this.brands,
        allHTML: true,
        debugHTML: true,
        lint: false
      }, options));
      winston.info(`building ${checkoutDirectory} with grunt ${args.join(' ')}`);
      await execute(gruntCommand, args, repoDirectory);
    }

    /**
     * @public
     */
    async transpile() {
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
      const repoDirectory = `${checkoutDirectory}/${this.repo}`;
      winston.info(`transpiling ${checkoutDirectory}`);

      // We might not be able to run this command!
      await execute(gruntCommand, ['output-js-project'], repoDirectory, {
        errors: 'resolve'
      });
    }

    /**
     * @public
     *
     * @returns {Promise<string|null>} - Error string, or null if no error
     */
    async checkUnbuilt() {
      try {
        return await withServer(async port => {
          const url = `http://localhost:${port}/${this.repo}/${this.repo}_en.html?brand=phet&ea&fuzzMouse&fuzzTouch`;
          try {
            return await puppeteerLoad(url, {
              waitAfterLoad: 20000
            });
          } catch (e) {
            return `Failure for ${url}: ${e}`;
          }
        }, {
          path: ReleaseBranch.getCheckoutDirectory(this.repo, this.branch)
        });
      } catch (e) {
        return `[ERROR] Failure to check: ${e}`;
      }
    }

    /**
     * @public
     *
     * @returns {Promise<string|null>} - Error string, or null if no error
     */
    async checkBuilt() {
      try {
        const usesChipper2 = await this.usesChipper2();
        return await withServer(async port => {
          const url = `http://localhost:${port}/${this.repo}/build/${usesChipper2 ? 'phet/' : ''}${this.repo}_en${usesChipper2 ? '_phet' : ''}.html?fuzzMouse&fuzzTouch`;
          try {
            return puppeteerLoad(url, {
              waitAfterLoad: 20000
            });
          } catch (error) {
            return `Failure for ${url}: ${error}`;
          }
        }, {
          path: ReleaseBranch.getCheckoutDirectory(this.repo, this.branch)
        });
      } catch (e) {
        return `[ERROR] Failure to check: ${e}`;
      }
    }

    /**
     * Checks this release branch out.
     * @public
     *
     * @param {boolean} includeNpmUpdate
     */
    async checkout(includeNpmUpdate) {
      await checkoutTarget(this.repo, this.branch, includeNpmUpdate);
    }

    /**
     * Whether this release branch includes the given SHA for the given repo dependency. Will be false if it doesn't
     * depend on this repository.
     * @public
     *
     * @param {string} repo
     * @param {string} sha
     * @returns {Promise.<boolean>}
     */
    async includesSHA(repo, sha) {
      let result = false;
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      if (dependencies[repo]) {
        const currentSHA = dependencies[repo].sha;
        result = sha === currentSHA || (await gitIsAncestor(repo, sha, currentSHA));
      }
      await gitCheckout(this.repo, 'main');
      return result;
    }

    /**
     * Whether this release branch does NOT include the given SHA for the given repo dependency. Will be false if it doesn't
     * depend on this repository.
     * @public
     *
     * @param {string} repo
     * @param {string} sha
     * @returns {Promise.<boolean>}
     */
    async isMissingSHA(repo, sha) {
      let result = false;
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      if (dependencies[repo]) {
        const currentSHA = dependencies[repo].sha;
        result = sha !== currentSHA && !(await gitIsAncestor(repo, sha, currentSHA));
      }
      await gitCheckout(this.repo, 'main');
      return result;
    }

    /**
     * The SHA at which this release branch's main repository diverged from main.
     * @public
     *
     * @returns {Promise.<string>}
     */
    async getDivergingSHA() {
      await gitCheckout(this.repo, this.branch);
      await gitPull(this.repo);
      await gitCheckout(this.repo, 'main');
      return gitFirstDivergingCommit(this.repo, this.branch, 'main');
    }

    /**
     * The timestamp at which this release branch's main repository diverged from main.
     * @public
     *
     * @returns {Promise.<number>}
     */
    async getDivergingTimestamp() {
      return gitTimestamp(this.repo, await this.getDivergingSHA());
    }

    /**
     * Returns the dependencies.json for this release branch
     * @public
     *
     * @returns {Promise}
     */
    async getDependencies() {
      return getBranchDependencies(this.repo, this.branch);
    }

    /**
     * Returns the SimVersion for this release branch
     * @public
     *
     * @returns {Promise<SimVersion>}
     */
    async getSimVersion() {
      return getBranchVersion(this.repo, this.branch);
    }

    /**
     * Returns a list of status messages of anything out-of-the-ordinary
     * @public
     *
     * @returns {Promise.<Array.<string>>}
     */
    async getStatus(getBranchMapAsyncCallback = getBranchMap) {
      const results = [];
      const dependencies = await this.getDependencies();
      const dependencyNames = Object.keys(dependencies).filter(key => {
        return key !== 'comment' && key !== this.repo && key !== 'phet-io-wrapper-sonification';
      });

      // Check our own dependency
      if (dependencies[this.repo]) {
        try {
          const currentCommit = await gitRevParse(this.repo, this.branch);
          const previousCommit = await gitRevParse(this.repo, `${currentCommit}^`);
          if (dependencies[this.repo].sha !== previousCommit) {
            results.push('[INFO] Potential changes (dependency is not previous commit)');
            results.push(`[INFO] ${currentCommit} ${previousCommit} ${dependencies[this.repo].sha}`);
          }
          if ((await this.getSimVersion()).testType === 'rc' && this.isReleased) {
            results.push('[INFO] Release candidate version detected (see if there is a QA issue)');
          }
        } catch (e) {
          results.push(`[ERROR] Failure to check current/previous commit: ${e.message}`);
        }
      } else {
        results.push('[WARNING] Own repository not included in dependencies');
      }
      for (const dependency of dependencyNames) {
        const potentialReleaseBranch = `${this.repo}-${this.branch}`;
        const branchMap = await getBranchMapAsyncCallback(dependency);
        if (Object.keys(branchMap).includes(potentialReleaseBranch)) {
          if (dependencies[dependency].sha !== branchMap[potentialReleaseBranch]) {
            results.push(`[WARNING] Dependency mismatch for ${dependency} on branch ${potentialReleaseBranch}`);
          }
        }
      }
      return results;
    }

    /**
     * Returns whether the sim is compatible with ES6 features
     * @public
     *
     * @returns {Promise<boolean>}
     */
    async usesES6() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const sha = dependencies.chipper.sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('chipper', '80b4ad62cd8f2057b844f18d3c00cf5c0c89ed8d', sha);
    }

    /**
     * Returns whether this sim uses initialize-globals based query parameters
     * @public
     *
     * If true:
     *   phet.chipper.queryParameters.WHATEVER
     *   AND it needs to be in the schema
     *
     * If false:
     *   phet.chipper.getQueryParameter( 'WHATEVER' )
     *   FLAGS should use !!phet.chipper.getQueryParameter( 'WHATEVER' )
     *
     * @returns {Promise<boolean>}
     */
    async usesInitializeGlobalsQueryParameters() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const sha = dependencies.chipper.sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('chipper', 'e454f88ff51d1e3fabdb3a076d7407a2a9e9133c', sha);
    }

    /**
     * Returns whether phet-io.standalone is the correct phet-io query parameter (otherwise it's the newer
     * phetioStandalone).
     * Looks for the presence of https://github.com/phetsims/chipper/commit/4814d6966c54f250b1c0f3909b71f2b9cfcc7665.
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesOldPhetioStandalone() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const sha = dependencies.chipper.sha;
      await gitCheckout(this.repo, 'main');
      return !(await gitIsAncestor('chipper', '4814d6966c54f250b1c0f3909b71f2b9cfcc7665', sha));
    }

    /**
     * Returns whether the relativeSimPath query parameter is used for wrappers (instead of launchLocalVersion).
     * Looks for the presence of https://github.com/phetsims/phet-io/commit/e3fc26079358d86074358a6db3ebaf1af9725632
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesRelativeSimPath() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      if (!dependencies['phet-io']) {
        return true; // Doesn't really matter now, does it?
      }
      const sha = dependencies['phet-io'].sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('phet-io', 'e3fc26079358d86074358a6db3ebaf1af9725632', sha);
    }

    /**
     * Returns whether phet-io Studio is being used instead of deprecated instance proxies wrapper.
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesPhetioStudio() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const sha = dependencies.chipper.sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('chipper', '7375f6a57b5874b6bbf97a54c9a908f19f88d38f', sha);
    }

    /**
     * Returns whether phet-io Studio top-level (index.html) is used instead of studio.html.
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesPhetioStudioIndex() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const dependency = dependencies['phet-io-wrappers'];
      if (!dependency) {
        return false;
      }
      const sha = dependency.sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('phet-io-wrappers', '7ec1a04a70fb9707b381b8bcab3ad070815ef7fe', sha);
    }

    /**
     * Returns whether an additional folder exists in the build directory of the sim based on the brand.
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesChipper2() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      await gitCheckout('chipper', dependencies.chipper.sha);
      const chipperVersion = ChipperVersion.getFromRepository();
      const result = chipperVersion.major !== 0 || chipperVersion.minor !== 0;
      await gitCheckout(this.repo, 'main');
      await gitCheckout('chipper', 'main');
      return result;
    }

    /**
     * Runs a predicate function with the contents of a specific file's contents in the release branch (with false if
     * it doesn't exist).
     * @public
     *
     * @param {string} file
     * @param {function(contents:string):boolean} predicate
     * @returns {Promise.<boolean>}
     */
    async withFile(file, predicate) {
      await this.checkout(false);
      if (fs.existsSync(file)) {
        const contents = fs.readFileSync(file, 'utf-8');
        return predicate(contents);
      }
      return false;
    }

    /**
     * Re-runs a production deploy for a specific branch.
     * @public
     */
    async redeployProduction(locales = '*') {
      if (this.isReleased) {
        await checkoutTarget(this.repo, this.branch, false);
        const version = await getRepoVersion(this.repo);
        const dependencies = await getDependencies(this.repo);
        await checkoutMain(this.repo, false);
        await buildServerRequest(this.repo, version, this.branch, dependencies, {
          locales: locales,
          brands: this.brands,
          servers: ['production']
        });
      } else {
        throw new Error('Should not redeploy a non-released branch');
      }
    }

    /**
     * Gets a list of ReleaseBranches which would be potential candidates for a maintenance release. This includes:
     * - All published phet brand release branches (from metadata)
     * - All published phet-io brand release branches (from metadata)
     * - All unpublished local release branches
     *
     * @public
     * @returns {Promise.<ReleaseBranch[]>}
     * @rejects {ExecuteError}
     */
    static async getAllMaintenanceBranches() {
      winston.debug('retrieving available sim branches');
      console.log('loading phet brand ReleaseBranches');
      const simMetadataResult = await simMetadata({
        type: 'html'
      });

      // Released phet branches
      const phetBranches = simMetadataResult.projects.map(simData => {
        const repo = simData.name.slice(simData.name.indexOf('/') + 1);
        const branch = `${simData.version.major}.${simData.version.minor}`;
        return new ReleaseBranch(repo, branch, ['phet'], true);
      });
      console.log('loading phet-io brand ReleaseBranches');
      const phetioBranches = (await simPhetioMetadata({
        active: true,
        latest: true
      })).filter(simData => simData.active && simData.latest).map(simData => {
        let branch = `${simData.versionMajor}.${simData.versionMinor}`;
        if (simData.versionSuffix.length) {
          branch += `-${simData.versionSuffix}`; // additional dash required
        }
        return new ReleaseBranch(simData.name, branch, ['phet-io'], true);
      });
      console.log('loading unreleased ReleaseBranches');
      const unreleasedBranches = [];
      for (const repo of getActiveSims()) {
        // Exclude explicitly excluded repos
        if (JSON.parse(fs.readFileSync(`../${repo}/package.json`, 'utf8')).phet.ignoreForAutomatedMaintenanceReleases) {
          continue;
        }
        const branches = await getBranches(repo);
        const releasedBranches = phetBranches.concat(phetioBranches);
        for (const branch of branches) {
          // We aren't unreleased if we're included in either phet or phet-io metadata.
          // See https://github.com/phetsims/balancing-act/issues/118
          if (releasedBranches.filter(releaseBranch => releaseBranch.repo === repo && releaseBranch.branch === branch).length) {
            continue;
          }
          const match = branch.match(/^(\d+)\.(\d+)$/);
          if (match) {
            const major = Number(match[1]);
            const minor = Number(match[2]);

            // Assumption that there is no phet-io brand sim that isn't also released with phet brand
            const projectMetadata = simMetadataResult.projects.find(project => project.name === `html/${repo}`) || null;
            const productionVersion = projectMetadata ? projectMetadata.version : null;
            if (!productionVersion || major > productionVersion.major || major === productionVersion.major && minor > productionVersion.minor) {
              // Do a checkout so we can determine supported brands
              const packageObject = JSON.parse(await getFileAtBranch(repo, branch, 'package.json'));
              const includesPhetio = packageObject.phet && packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes('phet-io');
              const brands = ['phet',
              // Assumption that there is no phet-io brand sim that isn't also released with phet brand
              ...(includesPhetio ? ['phet-io'] : [])];
              if (!packageObject.phet.ignoreForAutomatedMaintenanceReleases) {
                unreleasedBranches.push(new ReleaseBranch(repo, branch, brands, false));
              }
            }
          }
        }
      }
      const allReleaseBranches = ReleaseBranch.combineLists([...phetBranches, ...phetioBranches, ...unreleasedBranches]);

      // FAMB 2.3-phetio keeps ending up in the MR list when we don't want it to, see https://github.com/phetsims/phet-io/issues/1957.
      return allReleaseBranches.filter(rb => !(rb.repo === 'forces-and-motion-basics' && rb.branch === '2.3-phetio'));
    }

    /**
     * Combines multiple matching ReleaseBranches into one where appropriate, and sorts. For example, two ReleaseBranches
     * of the same repo but for different brands are combined into a single ReleaseBranch with multiple brands.
     * @public
     *
     * @param {Array.<ReleaseBranch>} simBranches
     * @returns {Array.<ReleaseBranch>}
     */
    static combineLists(simBranches) {
      const resultBranches = [];
      for (const simBranch of simBranches) {
        let foundBranch = false;
        for (const resultBranch of resultBranches) {
          if (simBranch.repo === resultBranch.repo && simBranch.branch === resultBranch.branch) {
            foundBranch = true;
            resultBranch.brands = [...resultBranch.brands, ...simBranch.brands];
            break;
          }
        }
        if (!foundBranch) {
          resultBranches.push(simBranch);
        }
      }
      resultBranches.sort((a, b) => {
        if (a.repo !== b.repo) {
          return a.repo < b.repo ? -1 : 1;
        }
        if (a.branch !== b.branch) {
          return a.branch < b.branch ? -1 : 1;
        }
        return 0;
      });
      return resultBranches;
    }
  }
  return ReleaseBranch;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJidWlsZExvY2FsIiwicmVxdWlyZSIsImJ1aWxkU2VydmVyUmVxdWVzdCIsIkNoaXBwZXJWZXJzaW9uIiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJjcmVhdGVEaXJlY3RvcnkiLCJleGVjdXRlIiwiZ2V0QWN0aXZlU2ltcyIsImdldEJyYW5jaERlcGVuZGVuY2llcyIsImdldEJyYW5jaGVzIiwiZ2V0QnVpbGRBcmd1bWVudHMiLCJnZXREZXBlbmRlbmNpZXMiLCJnZXRCcmFuY2hNYXAiLCJnZXRCcmFuY2hWZXJzaW9uIiwiZ2V0RmlsZUF0QnJhbmNoIiwiZ2V0UmVwb1ZlcnNpb24iLCJnaXRDaGVja291dCIsImdpdENoZWNrb3V0RGlyZWN0b3J5IiwiZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5IiwiZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQiLCJnaXRJc0FuY2VzdG9yIiwiZ2l0UHVsbCIsImdpdFB1bGxEaXJlY3RvcnkiLCJnaXRSZXZQYXJzZSIsImdpdFRpbWVzdGFtcCIsImdydW50Q29tbWFuZCIsImxvYWRKU09OIiwibnBtVXBkYXRlRGlyZWN0b3J5IiwicHVwcGV0ZWVyTG9hZCIsInNpbU1ldGFkYXRhIiwic2ltUGhldGlvTWV0YWRhdGEiLCJ3aXRoU2VydmVyIiwiYXNzZXJ0IiwiZnMiLCJ3aW5zdG9uIiwiXyIsIm1vZHVsZSIsImV4cG9ydHMiLCJNQUlOVEVOQU5DRV9ESVJFQ1RPUlkiLCJSZWxlYXNlQnJhbmNoIiwiY29uc3RydWN0b3IiLCJyZXBvIiwiYnJhbmNoIiwiYnJhbmRzIiwiaXNSZWxlYXNlZCIsIkFycmF5IiwiaXNBcnJheSIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplIiwiZXF1YWxzIiwicmVsZWFzZUJyYW5jaCIsImpvaW4iLCJ0b1N0cmluZyIsImdldENoZWNrb3V0RGlyZWN0b3J5IiwiZ2V0TWFpbnRlbmFuY2VEaXJlY3RvcnkiLCJnZXRMb2NhbFBoZXRCdWlsdEhUTUxQYXRoIiwidXNlc0NoaXBwZXIyIiwiZ2V0TG9jYWxQaGV0SU9CdWlsdEhUTUxQYXRoIiwiZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwidXNlc09sZFBoZXRpb1N0YW5kYWxvbmUiLCJnZXRDaGlwcGVyVmVyc2lvbiIsImNoZWNrb3V0RGlyZWN0b3J5IiwiZ2V0RnJvbVBhY2thZ2VKU09OIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwidXBkYXRlQ2hlY2tvdXQiLCJvdmVycmlkZURlcGVuZGVuY2llcyIsImluZm8iLCJleGlzdHNTeW5jIiwiZGVwZW5kZW5jaWVzT25CcmFuY2hUaXAiLCJiYWJlbCIsInNoYSIsImJhYmVsQnJhbmNoIiwiZGVwZW5kZW5jeVJlcG9zIiwidW5pcSIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJQcm9taXNlIiwiYWxsIiwibWFwIiwicmVwb1B3ZCIsImJ1aWxkIiwib3B0aW9ucyIsInJlcG9EaXJlY3RvcnkiLCJhcmdzIiwibWVyZ2UiLCJhbGxIVE1MIiwiZGVidWdIVE1MIiwibGludCIsInRyYW5zcGlsZSIsImVycm9ycyIsImNoZWNrVW5idWlsdCIsInBvcnQiLCJ1cmwiLCJ3YWl0QWZ0ZXJMb2FkIiwiZSIsInBhdGgiLCJjaGVja0J1aWx0IiwiZXJyb3IiLCJjaGVja291dCIsImluY2x1ZGVOcG1VcGRhdGUiLCJpbmNsdWRlc1NIQSIsInJlc3VsdCIsImRlcGVuZGVuY2llcyIsImN1cnJlbnRTSEEiLCJpc01pc3NpbmdTSEEiLCJnZXREaXZlcmdpbmdTSEEiLCJnZXREaXZlcmdpbmdUaW1lc3RhbXAiLCJnZXRTaW1WZXJzaW9uIiwiZ2V0U3RhdHVzIiwiZ2V0QnJhbmNoTWFwQXN5bmNDYWxsYmFjayIsInJlc3VsdHMiLCJkZXBlbmRlbmN5TmFtZXMiLCJrZXkiLCJjdXJyZW50Q29tbWl0IiwicHJldmlvdXNDb21taXQiLCJwdXNoIiwidGVzdFR5cGUiLCJtZXNzYWdlIiwiZGVwZW5kZW5jeSIsInBvdGVudGlhbFJlbGVhc2VCcmFuY2giLCJicmFuY2hNYXAiLCJpbmNsdWRlcyIsInVzZXNFUzYiLCJjaGlwcGVyIiwidXNlc0luaXRpYWxpemVHbG9iYWxzUXVlcnlQYXJhbWV0ZXJzIiwidXNlc1JlbGF0aXZlU2ltUGF0aCIsInVzZXNQaGV0aW9TdHVkaW8iLCJ1c2VzUGhldGlvU3R1ZGlvSW5kZXgiLCJjaGlwcGVyVmVyc2lvbiIsImdldEZyb21SZXBvc2l0b3J5IiwibWFqb3IiLCJtaW5vciIsIndpdGhGaWxlIiwiZmlsZSIsInByZWRpY2F0ZSIsImNvbnRlbnRzIiwicmVkZXBsb3lQcm9kdWN0aW9uIiwibG9jYWxlcyIsInZlcnNpb24iLCJzZXJ2ZXJzIiwiRXJyb3IiLCJnZXRBbGxNYWludGVuYW5jZUJyYW5jaGVzIiwiZGVidWciLCJjb25zb2xlIiwibG9nIiwic2ltTWV0YWRhdGFSZXN1bHQiLCJ0eXBlIiwicGhldEJyYW5jaGVzIiwicHJvamVjdHMiLCJzaW1EYXRhIiwibmFtZSIsInNsaWNlIiwiaW5kZXhPZiIsInBoZXRpb0JyYW5jaGVzIiwiYWN0aXZlIiwibGF0ZXN0IiwidmVyc2lvbk1ham9yIiwidmVyc2lvbk1pbm9yIiwidmVyc2lvblN1ZmZpeCIsImxlbmd0aCIsInVucmVsZWFzZWRCcmFuY2hlcyIsInBoZXQiLCJpZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzIiwiYnJhbmNoZXMiLCJyZWxlYXNlZEJyYW5jaGVzIiwiY29uY2F0IiwibWF0Y2giLCJOdW1iZXIiLCJwcm9qZWN0TWV0YWRhdGEiLCJmaW5kIiwicHJvamVjdCIsInByb2R1Y3Rpb25WZXJzaW9uIiwicGFja2FnZU9iamVjdCIsImluY2x1ZGVzUGhldGlvIiwic3VwcG9ydGVkQnJhbmRzIiwiYWxsUmVsZWFzZUJyYW5jaGVzIiwiY29tYmluZUxpc3RzIiwicmIiLCJzaW1CcmFuY2hlcyIsInJlc3VsdEJyYW5jaGVzIiwic2ltQnJhbmNoIiwiZm91bmRCcmFuY2giLCJyZXN1bHRCcmFuY2giLCJzb3J0IiwiYSIsImIiXSwic291cmNlcyI6WyJSZWxlYXNlQnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgc2ltdWxhdGlvbiByZWxlYXNlIGJyYW5jaCBmb3IgZGVwbG95bWVudFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgYnVpbGRMb2NhbCA9IHJlcXVpcmUoICcuL2J1aWxkTG9jYWwnICk7XHJcbmNvbnN0IGJ1aWxkU2VydmVyUmVxdWVzdCA9IHJlcXVpcmUoICcuL2J1aWxkU2VydmVyUmVxdWVzdCcgKTtcclxuY29uc3QgQ2hpcHBlclZlcnNpb24gPSByZXF1aXJlKCAnLi9DaGlwcGVyVmVyc2lvbicgKTtcclxuY29uc3QgY2hlY2tvdXRNYWluID0gcmVxdWlyZSggJy4vY2hlY2tvdXRNYWluJyApO1xyXG5jb25zdCBjaGVja291dFRhcmdldCA9IHJlcXVpcmUoICcuL2NoZWNrb3V0VGFyZ2V0JyApO1xyXG5jb25zdCBjcmVhdGVEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9jcmVhdGVEaXJlY3RvcnknICk7XHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCBnZXRBY3RpdmVTaW1zID0gcmVxdWlyZSggJy4vZ2V0QWN0aXZlU2ltcycgKTtcclxuY29uc3QgZ2V0QnJhbmNoRGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4vZ2V0QnJhbmNoRGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnZXRCcmFuY2hlcyA9IHJlcXVpcmUoICcuL2dldEJyYW5jaGVzJyApO1xyXG5jb25zdCBnZXRCdWlsZEFyZ3VtZW50cyA9IHJlcXVpcmUoICcuL2dldEJ1aWxkQXJndW1lbnRzJyApO1xyXG5jb25zdCBnZXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdldEJyYW5jaE1hcCA9IHJlcXVpcmUoICcuL2dldEJyYW5jaE1hcCcgKTtcclxuY29uc3QgZ2V0QnJhbmNoVmVyc2lvbiA9IHJlcXVpcmUoICcuL2dldEJyYW5jaFZlcnNpb24nICk7XHJcbmNvbnN0IGdldEZpbGVBdEJyYW5jaCA9IHJlcXVpcmUoICcuL2dldEZpbGVBdEJyYW5jaCcgKTtcclxuY29uc3QgZ2V0UmVwb1ZlcnNpb24gPSByZXF1aXJlKCAnLi9nZXRSZXBvVmVyc2lvbicgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXQgPSByZXF1aXJlKCAnLi9naXRDaGVja291dCcgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXREaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9naXRDaGVja291dERpcmVjdG9yeScgKTtcclxuY29uc3QgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4vZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5JyApO1xyXG5jb25zdCBnaXRGaXJzdERpdmVyZ2luZ0NvbW1pdCA9IHJlcXVpcmUoICcuL2dpdEZpcnN0RGl2ZXJnaW5nQ29tbWl0JyApO1xyXG5jb25zdCBnaXRJc0FuY2VzdG9yID0gcmVxdWlyZSggJy4vZ2l0SXNBbmNlc3RvcicgKTtcclxuY29uc3QgZ2l0UHVsbCA9IHJlcXVpcmUoICcuL2dpdFB1bGwnICk7XHJcbmNvbnN0IGdpdFB1bGxEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9naXRQdWxsRGlyZWN0b3J5JyApO1xyXG5jb25zdCBnaXRSZXZQYXJzZSA9IHJlcXVpcmUoICcuL2dpdFJldlBhcnNlJyApO1xyXG5jb25zdCBnaXRUaW1lc3RhbXAgPSByZXF1aXJlKCAnLi9naXRUaW1lc3RhbXAnICk7XHJcbmNvbnN0IGdydW50Q29tbWFuZCA9IHJlcXVpcmUoICcuL2dydW50Q29tbWFuZCcgKTtcclxuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi9sb2FkSlNPTicgKTtcclxuY29uc3QgbnBtVXBkYXRlRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4vbnBtVXBkYXRlRGlyZWN0b3J5JyApO1xyXG5jb25zdCBwdXBwZXRlZXJMb2FkID0gcmVxdWlyZSggJy4vcHVwcGV0ZWVyTG9hZCcgKTtcclxuY29uc3Qgc2ltTWV0YWRhdGEgPSByZXF1aXJlKCAnLi9zaW1NZXRhZGF0YScgKTtcclxuY29uc3Qgc2ltUGhldGlvTWV0YWRhdGEgPSByZXF1aXJlKCAnLi9zaW1QaGV0aW9NZXRhZGF0YScgKTtcclxuY29uc3Qgd2l0aFNlcnZlciA9IHJlcXVpcmUoICcuL3dpdGhTZXJ2ZXInICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICBjb25zdCBNQUlOVEVOQU5DRV9ESVJFQ1RPUlkgPSAnLi4vcmVsZWFzZS1icmFuY2hlcyc7XHJcblxyXG4gIGNsYXNzIFJlbGVhc2VCcmFuY2gge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJyYW5jaFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gYnJhbmRzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzUmVsZWFzZWRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBpc1JlbGVhc2VkICkge1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiBicmFuY2ggPT09ICdzdHJpbmcnICk7XHJcbiAgICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggYnJhbmRzICkgKTtcclxuICAgICAgYXNzZXJ0KCB0eXBlb2YgaXNSZWxlYXNlZCA9PT0gJ2Jvb2xlYW4nICk7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtzdHJpbmd9XHJcbiAgICAgIHRoaXMucmVwbyA9IHJlcG87XHJcbiAgICAgIHRoaXMuYnJhbmNoID0gYnJhbmNoO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7QXJyYXkuPHN0cmluZz59XHJcbiAgICAgIHRoaXMuYnJhbmRzID0gYnJhbmRzO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7Ym9vbGVhbn1cclxuICAgICAgdGhpcy5pc1JlbGVhc2VkID0gaXNSZWxlYXNlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnQgaW50byBhIHBsYWluIEpTIG9iamVjdCBtZWFudCBmb3IgSlNPTiBzZXJpYWxpemF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHNlcmlhbGl6ZSgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXBvOiB0aGlzLnJlcG8sXHJcbiAgICAgICAgYnJhbmNoOiB0aGlzLmJyYW5jaCxcclxuICAgICAgICBicmFuZHM6IHRoaXMuYnJhbmRzLFxyXG4gICAgICAgIGlzUmVsZWFzZWQ6IHRoaXMuaXNSZWxlYXNlZFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFrZXMgYSBzZXJpYWxpemVkIGZvcm0gb2YgdGhlIFJlbGVhc2VCcmFuY2ggYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fVxyXG4gICAgICogQHJldHVybnMge1JlbGVhc2VCcmFuY2h9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZXNlcmlhbGl6ZSggeyByZXBvLCBicmFuY2gsIGJyYW5kcywgaXNSZWxlYXNlZCB9ICkge1xyXG4gICAgICByZXR1cm4gbmV3IFJlbGVhc2VCcmFuY2goIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBpc1JlbGVhc2VkICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHR3byByZWxlYXNlIGJyYW5jaGVzIGNvbnRhaW4gaWRlbnRpY2FsIGluZm9ybWF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7UmVsZWFzZUJyYW5jaH0gcmVsZWFzZUJyYW5jaFxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGVxdWFscyggcmVsZWFzZUJyYW5jaCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMucmVwbyA9PT0gcmVsZWFzZUJyYW5jaC5yZXBvICYmXHJcbiAgICAgICAgICAgICB0aGlzLmJyYW5jaCA9PT0gcmVsZWFzZUJyYW5jaC5icmFuY2ggJiZcclxuICAgICAgICAgICAgIHRoaXMuYnJhbmRzLmpvaW4oICcsJyApID09PSByZWxlYXNlQnJhbmNoLmJyYW5kcy5qb2luKCAnLCcgKSAmJlxyXG4gICAgICAgICAgICAgdGhpcy5pc1JlbGVhc2VkID09PSByZWxlYXNlQnJhbmNoLmlzUmVsZWFzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0cyBpdCB0byBhIChkZWJ1Z2dhYmxlKSBzdHJpbmcgZm9ybS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0b1N0cmluZygpIHtcclxuICAgICAgcmV0dXJuIGAke3RoaXMucmVwb30gJHt0aGlzLmJyYW5jaH0gJHt0aGlzLmJyYW5kcy5qb2luKCAnLCcgKX0ke3RoaXMuaXNSZWxlYXNlZCA/ICcnIDogJyAodW5wdWJsaXNoZWQpJ31gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZXBvIHtzdHJpbmd9XHJcbiAgICAgKiBAcGFyYW0gYnJhbmNoIHtzdHJpbmd9XHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHJlcG8sIGJyYW5jaCApIHtcclxuICAgICAgcmV0dXJuIGAke01BSU5URU5BTkNFX0RJUkVDVE9SWX0vJHtyZXBvfS0ke2JyYW5jaH1gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgbWFpbnRlbmFuY2UgZGlyZWN0b3J5LCBmb3IgdGhpbmdzIHRoYXQgd2FudCB0byB1c2UgaXQgZGlyZWN0bHkuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGdldE1haW50ZW5hbmNlRGlyZWN0b3J5KCkge1xyXG4gICAgICByZXR1cm4gTUFJTlRFTkFOQ0VfRElSRUNUT1JZO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCAocmVsYXRpdmUgdG8gdGhlIHJlcG8pIHRvIHRoZSBidWlsdCBwaGV0LWJyYW5kIEhUTUwgZmlsZVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldExvY2FsUGhldEJ1aWx0SFRNTFBhdGgoKSB7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICByZXR1cm4gYGJ1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQvJyA6ICcnfSR7dGhpcy5yZXBvfV9lbiR7dXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnfS5odG1sYDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIHBhdGggKHJlbGF0aXZlIHRvIHRoZSByZXBvKSB0byB0aGUgYnVpbHQgcGhldC1pby1icmFuZCBIVE1MIGZpbGVcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRMb2NhbFBoZXRJT0J1aWx0SFRNTFBhdGgoKSB7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICByZXR1cm4gYGJ1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQtaW8vJyA6ICcnfSR7dGhpcy5yZXBvfSR7dXNlc0NoaXBwZXIyID8gJ19hbGxfcGhldC1pbycgOiAnX2VuLXBoZXRpbyd9Lmh0bWxgO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgcXVlcnkgcGFyYW1ldGVyIHRvIHVzZSBmb3IgYWN0aXZhdGluZyBwaGV0LWlvIHN0YW5kYWxvbmUgbW9kZVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldFBoZXRpb1N0YW5kYWxvbmVRdWVyeVBhcmFtZXRlcigpIHtcclxuICAgICAgcmV0dXJuICggYXdhaXQgdGhpcy51c2VzT2xkUGhldGlvU3RhbmRhbG9uZSgpICkgPyAncGhldC1pby5zdGFuZGFsb25lJyA6ICdwaGV0aW9TdGFuZGFsb25lJztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Q2hpcHBlclZlcnNpb259XHJcbiAgICAgKi9cclxuICAgIGdldENoaXBwZXJWZXJzaW9uKCkge1xyXG4gICAgICBjb25zdCBjaGVja291dERpcmVjdG9yeSA9IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuXHJcbiAgICAgIHJldHVybiBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUGFja2FnZUpTT04oXHJcbiAgICAgICAgSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgJHtjaGVja291dERpcmVjdG9yeX0vY2hpcHBlci9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVwZGF0ZUNoZWNrb3V0KCBvdmVycmlkZURlcGVuZGVuY2llcyA9IHt9ICkge1xyXG4gICAgICB3aW5zdG9uLmluZm8oIGB1cGRhdGluZyBjaGVja291dCBmb3IgJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgICAgaWYgKCAhZnMuZXhpc3RzU3luYyggTUFJTlRFTkFOQ0VfRElSRUNUT1JZICkgKSB7XHJcbiAgICAgICAgd2luc3Rvbi5pbmZvKCBgY3JlYXRpbmcgZGlyZWN0b3J5ICR7TUFJTlRFTkFOQ0VfRElSRUNUT1JZfWAgKTtcclxuICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoIE1BSU5URU5BTkNFX0RJUkVDVE9SWSApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBjaGVja291dERpcmVjdG9yeSApICkge1xyXG4gICAgICAgIHdpbnN0b24uaW5mbyggYGNyZWF0aW5nIGRpcmVjdG9yeSAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoIGNoZWNrb3V0RGlyZWN0b3J5ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGF3YWl0IGdpdENsb25lT3JGZXRjaERpcmVjdG9yeSggdGhpcy5yZXBvLCBjaGVja291dERpcmVjdG9yeSApO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggdGhpcy5icmFuY2gsIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gICk7XHJcbiAgICAgIGF3YWl0IGdpdFB1bGxEaXJlY3RvcnkoIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llc09uQnJhbmNoVGlwID0gYXdhaXQgbG9hZEpTT04oIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb30vZGVwZW5kZW5jaWVzLmpzb25gICk7XHJcblxyXG4gICAgICBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcC5iYWJlbCA9IHsgc2hhOiBidWlsZExvY2FsLmJhYmVsQnJhbmNoLCBicmFuY2g6IGJ1aWxkTG9jYWwuYmFiZWxCcmFuY2ggfTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3lSZXBvcyA9IF8udW5pcSggW1xyXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcCApLFxyXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKCBvdmVycmlkZURlcGVuZGVuY2llcyApXHJcbiAgICAgIF0uZmlsdGVyKCByZXBvID0+IHJlcG8gIT09ICdjb21tZW50JyApICk7XHJcblxyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbCggZGVwZW5kZW5jeVJlcG9zLm1hcCggYXN5bmMgcmVwbyA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVwb1B3ZCA9IGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3JlcG99YDtcclxuXHJcbiAgICAgICAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCByZXBvLCBjaGVja291dERpcmVjdG9yeSApO1xyXG5cclxuICAgICAgICBjb25zdCBzaGEgPSBvdmVycmlkZURlcGVuZGVuY2llc1sgcmVwbyBdID8gb3ZlcnJpZGVEZXBlbmRlbmNpZXNbIHJlcG8gXS5zaGEgOiBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcFsgcmVwbyBdLnNoYTtcclxuICAgICAgICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggc2hhLCByZXBvUHdkICk7XHJcblxyXG4gICAgICAgIC8vIFB1bGwgYmFiZWwsIHNpbmNlIHdlIGRvbid0IGdpdmUgaXQgYSBzcGVjaWZpYyBTSEEgKGp1c3QgYSBicmFuY2gpLFxyXG4gICAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zMjZcclxuICAgICAgICBpZiAoIHJlcG8gPT09ICdiYWJlbCcgKSB7XHJcbiAgICAgICAgICBhd2FpdCBnaXRQdWxsRGlyZWN0b3J5KCByZXBvUHdkICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHJlcG8gPT09ICdjaGlwcGVyJyB8fCByZXBvID09PSAncGVyZW5uaWFsLWFsaWFzJyB8fCByZXBvID09PSB0aGlzLnJlcG8gKSB7XHJcbiAgICAgICAgICB3aW5zdG9uLmluZm8oIGBucG0gJHtyZXBvfSBpbiAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuXHJcbiAgICAgICAgICBhd2FpdCBucG1VcGRhdGVEaXJlY3RvcnkoIHJlcG9Qd2QgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKSApO1xyXG5cclxuICAgICAgLy8gUGVyZW5uaWFsIGNhbiBiZSBhIG5pY2UgbWFudWFsIGFkZGl0aW9uIGluIGVhY2ggZGlyLCBpbiBjYXNlIHlvdSBuZWVkIHRvIGdvIGluIGFuZCBydW4gY29tbWFuZHMgdG8gdGhlc2VcclxuICAgICAgLy8gYnJhbmNoZXMgbWFudWFsbHkgKGxpa2UgYnVpbGQgb3IgY2hlY2tvdXQgb3IgdXBkYXRlKS4gTm8gbmVlZCB0byBucG0gaW5zdGFsbCwgeW91IGNhbiBkbyB0aGF0IHlvdXJzZWxmIGlmIG5lZWRlZC5cclxuICAgICAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCAncGVyZW5uaWFsJywgY2hlY2tvdXREaXJlY3RvcnkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gb3B0aW9uYWwgcGFyYW1ldGVycyBmb3IgZ2V0QnVpbGRBcmd1bWVudHNcclxuICAgICAqL1xyXG4gICAgYXN5bmMgYnVpbGQoIG9wdGlvbnMgKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCByZXBvRGlyZWN0b3J5ID0gYCR7Y2hlY2tvdXREaXJlY3Rvcnl9LyR7dGhpcy5yZXBvfWA7XHJcblxyXG4gICAgICBjb25zdCBhcmdzID0gZ2V0QnVpbGRBcmd1bWVudHMoIHRoaXMuZ2V0Q2hpcHBlclZlcnNpb24oKSwgXy5tZXJnZSgge1xyXG4gICAgICAgIGJyYW5kczogdGhpcy5icmFuZHMsXHJcbiAgICAgICAgYWxsSFRNTDogdHJ1ZSxcclxuICAgICAgICBkZWJ1Z0hUTUw6IHRydWUsXHJcbiAgICAgICAgbGludDogZmFsc2VcclxuICAgICAgfSwgb3B0aW9ucyApICk7XHJcblxyXG4gICAgICB3aW5zdG9uLmluZm8oIGBidWlsZGluZyAke2NoZWNrb3V0RGlyZWN0b3J5fSB3aXRoIGdydW50ICR7YXJncy5qb2luKCAnICcgKX1gICk7XHJcbiAgICAgIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgYXJncywgcmVwb0RpcmVjdG9yeSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBhc3luYyB0cmFuc3BpbGUoKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCByZXBvRGlyZWN0b3J5ID0gYCR7Y2hlY2tvdXREaXJlY3Rvcnl9LyR7dGhpcy5yZXBvfWA7XHJcblxyXG4gICAgICB3aW5zdG9uLmluZm8oIGB0cmFuc3BpbGluZyAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuXHJcbiAgICAgIC8vIFdlIG1pZ2h0IG5vdCBiZSBhYmxlIHRvIHJ1biB0aGlzIGNvbW1hbmQhXHJcbiAgICAgIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgWyAnb3V0cHV0LWpzLXByb2plY3QnIF0sIHJlcG9EaXJlY3RvcnksIHtcclxuICAgICAgICBlcnJvcnM6ICdyZXNvbHZlJ1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8c3RyaW5nfG51bGw+fSAtIEVycm9yIHN0cmluZywgb3IgbnVsbCBpZiBubyBlcnJvclxyXG4gICAgICovXHJcbiAgICBhc3luYyBjaGVja1VuYnVpbHQoKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHdpdGhTZXJ2ZXIoIGFzeW5jIHBvcnQgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS8ke3RoaXMucmVwb30vJHt0aGlzLnJlcG99X2VuLmh0bWw/YnJhbmQ9cGhldCZlYSZmdXp6TW91c2UmZnV6elRvdWNoYDtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBwdXBwZXRlZXJMb2FkKCB1cmwsIHtcclxuICAgICAgICAgICAgICB3YWl0QWZ0ZXJMb2FkOiAyMDAwMFxyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBGYWlsdXJlIGZvciAke3VybH06ICR7ZX1gO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIHBhdGg6IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICByZXR1cm4gYFtFUlJPUl0gRmFpbHVyZSB0byBjaGVjazogJHtlfWA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmd8bnVsbD59IC0gRXJyb3Igc3RyaW5nLCBvciBudWxsIGlmIG5vIGVycm9yXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGNoZWNrQnVpbHQoKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgdXNlc0NoaXBwZXIyID0gYXdhaXQgdGhpcy51c2VzQ2hpcHBlcjIoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHdpdGhTZXJ2ZXIoIGFzeW5jIHBvcnQgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS8ke3RoaXMucmVwb30vYnVpbGQvJHt1c2VzQ2hpcHBlcjIgPyAncGhldC8nIDogJyd9JHt0aGlzLnJlcG99X2VuJHt1c2VzQ2hpcHBlcjIgPyAnX3BoZXQnIDogJyd9Lmh0bWw/ZnV6ek1vdXNlJmZ1enpUb3VjaGA7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gcHVwcGV0ZWVyTG9hZCggdXJsLCB7XHJcbiAgICAgICAgICAgICAgd2FpdEFmdGVyTG9hZDogMjAwMDBcclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2F0Y2goIGVycm9yICkge1xyXG4gICAgICAgICAgICByZXR1cm4gYEZhaWx1cmUgZm9yICR7dXJsfTogJHtlcnJvcn1gO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIHBhdGg6IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICByZXR1cm4gYFtFUlJPUl0gRmFpbHVyZSB0byBjaGVjazogJHtlfWA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrcyB0aGlzIHJlbGVhc2UgYnJhbmNoIG91dC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluY2x1ZGVOcG1VcGRhdGVcclxuICAgICAqL1xyXG4gICAgYXN5bmMgY2hlY2tvdXQoIGluY2x1ZGVOcG1VcGRhdGUgKSB7XHJcbiAgICAgIGF3YWl0IGNoZWNrb3V0VGFyZ2V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoLCBpbmNsdWRlTnBtVXBkYXRlICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHRoaXMgcmVsZWFzZSBicmFuY2ggaW5jbHVkZXMgdGhlIGdpdmVuIFNIQSBmb3IgdGhlIGdpdmVuIHJlcG8gZGVwZW5kZW5jeS4gV2lsbCBiZSBmYWxzZSBpZiBpdCBkb2Vzbid0XHJcbiAgICAgKiBkZXBlbmQgb24gdGhpcyByZXBvc2l0b3J5LlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGluY2x1ZGVzU0hBKCByZXBvLCBzaGEgKSB7XHJcbiAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcclxuXHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcblxyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG5cclxuICAgICAgaWYgKCBkZXBlbmRlbmNpZXNbIHJlcG8gXSApIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50U0hBID0gZGVwZW5kZW5jaWVzWyByZXBvIF0uc2hhO1xyXG4gICAgICAgIHJlc3VsdCA9IHNoYSA9PT0gY3VycmVudFNIQSB8fCBhd2FpdCBnaXRJc0FuY2VzdG9yKCByZXBvLCBzaGEsIGN1cnJlbnRTSEEgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGlzIHJlbGVhc2UgYnJhbmNoIGRvZXMgTk9UIGluY2x1ZGUgdGhlIGdpdmVuIFNIQSBmb3IgdGhlIGdpdmVuIHJlcG8gZGVwZW5kZW5jeS4gV2lsbCBiZSBmYWxzZSBpZiBpdCBkb2Vzbid0XHJcbiAgICAgKiBkZXBlbmQgb24gdGhpcyByZXBvc2l0b3J5LlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGlzTWlzc2luZ1NIQSggcmVwbywgc2hhICkge1xyXG4gICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG5cclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuXHJcbiAgICAgIGlmICggZGVwZW5kZW5jaWVzWyByZXBvIF0gKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFNIQSA9IGRlcGVuZGVuY2llc1sgcmVwbyBdLnNoYTtcclxuICAgICAgICByZXN1bHQgPSBzaGEgIT09IGN1cnJlbnRTSEEgJiYgISggYXdhaXQgZ2l0SXNBbmNlc3RvciggcmVwbywgc2hhLCBjdXJyZW50U0hBICkgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIFNIQSBhdCB3aGljaCB0aGlzIHJlbGVhc2UgYnJhbmNoJ3MgbWFpbiByZXBvc2l0b3J5IGRpdmVyZ2VkIGZyb20gbWFpbi5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgZ2V0RGl2ZXJnaW5nU0hBKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBhd2FpdCBnaXRQdWxsKCB0aGlzLnJlcG8gKTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2gsICdtYWluJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHRpbWVzdGFtcCBhdCB3aGljaCB0aGlzIHJlbGVhc2UgYnJhbmNoJ3MgbWFpbiByZXBvc2l0b3J5IGRpdmVyZ2VkIGZyb20gbWFpbi5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48bnVtYmVyPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgZ2V0RGl2ZXJnaW5nVGltZXN0YW1wKCkge1xyXG4gICAgICByZXR1cm4gZ2l0VGltZXN0YW1wKCB0aGlzLnJlcG8sIGF3YWl0IHRoaXMuZ2V0RGl2ZXJnaW5nU0hBKCkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGRlcGVuZGVuY2llcy5qc29uIGZvciB0aGlzIHJlbGVhc2UgYnJhbmNoXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldERlcGVuZGVuY2llcygpIHtcclxuICAgICAgcmV0dXJuIGdldEJyYW5jaERlcGVuZGVuY2llcyggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgU2ltVmVyc2lvbiBmb3IgdGhpcyByZWxlYXNlIGJyYW5jaFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFNpbVZlcnNpb24+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRTaW1WZXJzaW9uKCkge1xyXG4gICAgICByZXR1cm4gZ2V0QnJhbmNoVmVyc2lvbiggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGxpc3Qgb2Ygc3RhdHVzIG1lc3NhZ2VzIG9mIGFueXRoaW5nIG91dC1vZi10aGUtb3JkaW5hcnlcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPHN0cmluZz4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRTdGF0dXMoIGdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2sgPSBnZXRCcmFuY2hNYXAgKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IHRoaXMuZ2V0RGVwZW5kZW5jaWVzKCk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3lOYW1lcyA9IE9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXMgKS5maWx0ZXIoIGtleSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGtleSAhPT0gJ2NvbW1lbnQnICYmIGtleSAhPT0gdGhpcy5yZXBvICYmIGtleSAhPT0gJ3BoZXQtaW8td3JhcHBlci1zb25pZmljYXRpb24nO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBDaGVjayBvdXIgb3duIGRlcGVuZGVuY3lcclxuICAgICAgaWYgKCBkZXBlbmRlbmNpZXNbIHRoaXMucmVwbyBdICkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBjdXJyZW50Q29tbWl0ID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgICAgIGNvbnN0IHByZXZpb3VzQ29tbWl0ID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHRoaXMucmVwbywgYCR7Y3VycmVudENvbW1pdH1eYCApO1xyXG4gICAgICAgICAgaWYgKCBkZXBlbmRlbmNpZXNbIHRoaXMucmVwbyBdLnNoYSAhPT0gcHJldmlvdXNDb21taXQgKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCggJ1tJTkZPXSBQb3RlbnRpYWwgY2hhbmdlcyAoZGVwZW5kZW5jeSBpcyBub3QgcHJldmlvdXMgY29tbWl0KScgKTtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBgW0lORk9dICR7Y3VycmVudENvbW1pdH0gJHtwcmV2aW91c0NvbW1pdH0gJHtkZXBlbmRlbmNpZXNbIHRoaXMucmVwbyBdLnNoYX1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoICggYXdhaXQgdGhpcy5nZXRTaW1WZXJzaW9uKCkgKS50ZXN0VHlwZSA9PT0gJ3JjJyAmJiB0aGlzLmlzUmVsZWFzZWQgKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCggJ1tJTkZPXSBSZWxlYXNlIGNhbmRpZGF0ZSB2ZXJzaW9uIGRldGVjdGVkIChzZWUgaWYgdGhlcmUgaXMgYSBRQSBpc3N1ZSknICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgcmVzdWx0cy5wdXNoKCBgW0VSUk9SXSBGYWlsdXJlIHRvIGNoZWNrIGN1cnJlbnQvcHJldmlvdXMgY29tbWl0OiAke2UubWVzc2FnZX1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdHMucHVzaCggJ1tXQVJOSU5HXSBPd24gcmVwb3NpdG9yeSBub3QgaW5jbHVkZWQgaW4gZGVwZW5kZW5jaWVzJyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBkZXBlbmRlbmN5IG9mIGRlcGVuZGVuY3lOYW1lcyApIHtcclxuICAgICAgICBjb25zdCBwb3RlbnRpYWxSZWxlYXNlQnJhbmNoID0gYCR7dGhpcy5yZXBvfS0ke3RoaXMuYnJhbmNofWA7XHJcbiAgICAgICAgY29uc3QgYnJhbmNoTWFwID0gYXdhaXQgZ2V0QnJhbmNoTWFwQXN5bmNDYWxsYmFjayggZGVwZW5kZW5jeSApO1xyXG5cclxuICAgICAgICBpZiAoIE9iamVjdC5rZXlzKCBicmFuY2hNYXAgKS5pbmNsdWRlcyggcG90ZW50aWFsUmVsZWFzZUJyYW5jaCApICkge1xyXG4gICAgICAgICAgaWYgKCBkZXBlbmRlbmNpZXNbIGRlcGVuZGVuY3kgXS5zaGEgIT09IGJyYW5jaE1hcFsgcG90ZW50aWFsUmVsZWFzZUJyYW5jaCBdICkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goIGBbV0FSTklOR10gRGVwZW5kZW5jeSBtaXNtYXRjaCBmb3IgJHtkZXBlbmRlbmN5fSBvbiBicmFuY2ggJHtwb3RlbnRpYWxSZWxlYXNlQnJhbmNofWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBzaW0gaXMgY29tcGF0aWJsZSB3aXRoIEVTNiBmZWF0dXJlc1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzRVM2KCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXMuY2hpcHBlci5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdjaGlwcGVyJywgJzgwYjRhZDYyY2Q4ZjIwNTdiODQ0ZjE4ZDNjMDBjZjVjMGM4OWVkOGQnLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciB0aGlzIHNpbSB1c2VzIGluaXRpYWxpemUtZ2xvYmFscyBiYXNlZCBxdWVyeSBwYXJhbWV0ZXJzXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogSWYgdHJ1ZTpcclxuICAgICAqICAgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5XSEFURVZFUlxyXG4gICAgICogICBBTkQgaXQgbmVlZHMgdG8gYmUgaW4gdGhlIHNjaGVtYVxyXG4gICAgICpcclxuICAgICAqIElmIGZhbHNlOlxyXG4gICAgICogICBwaGV0LmNoaXBwZXIuZ2V0UXVlcnlQYXJhbWV0ZXIoICdXSEFURVZFUicgKVxyXG4gICAgICogICBGTEFHUyBzaG91bGQgdXNlICEhcGhldC5jaGlwcGVyLmdldFF1ZXJ5UGFyYW1ldGVyKCAnV0hBVEVWRVInIClcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgdXNlc0luaXRpYWxpemVHbG9iYWxzUXVlcnlQYXJhbWV0ZXJzKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXMuY2hpcHBlci5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdjaGlwcGVyJywgJ2U0NTRmODhmZjUxZDFlM2ZhYmRiM2EwNzZkNzQwN2EyYTllOTEzM2MnLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciBwaGV0LWlvLnN0YW5kYWxvbmUgaXMgdGhlIGNvcnJlY3QgcGhldC1pbyBxdWVyeSBwYXJhbWV0ZXIgKG90aGVyd2lzZSBpdCdzIHRoZSBuZXdlclxyXG4gICAgICogcGhldGlvU3RhbmRhbG9uZSkuXHJcbiAgICAgKiBMb29rcyBmb3IgdGhlIHByZXNlbmNlIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2NvbW1pdC80ODE0ZDY5NjZjNTRmMjUwYjFjMGYzOTA5YjcxZjJiOWNmY2M3NjY1LlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgdXNlc09sZFBoZXRpb1N0YW5kYWxvbmUoKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcbiAgICAgIGNvbnN0IHNoYSA9IGRlcGVuZGVuY2llcy5jaGlwcGVyLnNoYTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gISggYXdhaXQgZ2l0SXNBbmNlc3RvciggJ2NoaXBwZXInLCAnNDgxNGQ2OTY2YzU0ZjI1MGIxYzBmMzkwOWI3MWYyYjljZmNjNzY2NScsIHNoYSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHJlbGF0aXZlU2ltUGF0aCBxdWVyeSBwYXJhbWV0ZXIgaXMgdXNlZCBmb3Igd3JhcHBlcnMgKGluc3RlYWQgb2YgbGF1bmNoTG9jYWxWZXJzaW9uKS5cclxuICAgICAqIExvb2tzIGZvciB0aGUgcHJlc2VuY2Ugb2YgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vY29tbWl0L2UzZmMyNjA3OTM1OGQ4NjA3NDM1OGE2ZGIzZWJhZjFhZjk3MjU2MzJcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNSZWxhdGl2ZVNpbVBhdGgoKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcblxyXG4gICAgICBpZiAoICFkZXBlbmRlbmNpZXNbICdwaGV0LWlvJyBdICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBEb2Vzbid0IHJlYWxseSBtYXR0ZXIgbm93LCBkb2VzIGl0P1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXNbICdwaGV0LWlvJyBdLnNoYTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gZ2l0SXNBbmNlc3RvciggJ3BoZXQtaW8nLCAnZTNmYzI2MDc5MzU4ZDg2MDc0MzU4YTZkYjNlYmFmMWFmOTcyNTYzMicsIHNoYSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHBoZXQtaW8gU3R1ZGlvIGlzIGJlaW5nIHVzZWQgaW5zdGVhZCBvZiBkZXByZWNhdGVkIGluc3RhbmNlIHByb3hpZXMgd3JhcHBlci5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNQaGV0aW9TdHVkaW8oKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcblxyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXMuY2hpcHBlci5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdjaGlwcGVyJywgJzczNzVmNmE1N2I1ODc0YjZiYmY5N2E1NGM5YTkwOGYxOWY4OGQzOGYnLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciBwaGV0LWlvIFN0dWRpbyB0b3AtbGV2ZWwgKGluZGV4Lmh0bWwpIGlzIHVzZWQgaW5zdGVhZCBvZiBzdHVkaW8uaHRtbC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNQaGV0aW9TdHVkaW9JbmRleCgpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSBkZXBlbmRlbmNpZXNbICdwaGV0LWlvLXdyYXBwZXJzJyBdO1xyXG4gICAgICBpZiAoICFkZXBlbmRlbmN5ICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jeS5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdwaGV0LWlvLXdyYXBwZXJzJywgJzdlYzFhMDRhNzBmYjk3MDdiMzgxYjhiY2FiM2FkMDcwODE1ZWY3ZmUnLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciBhbiBhZGRpdGlvbmFsIGZvbGRlciBleGlzdHMgaW4gdGhlIGJ1aWxkIGRpcmVjdG9yeSBvZiB0aGUgc2ltIGJhc2VkIG9uIHRoZSBicmFuZC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNDaGlwcGVyMigpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoICdjaGlwcGVyJywgZGVwZW5kZW5jaWVzLmNoaXBwZXIuc2hhICk7XHJcblxyXG4gICAgICBjb25zdCBjaGlwcGVyVmVyc2lvbiA9IENoaXBwZXJWZXJzaW9uLmdldEZyb21SZXBvc2l0b3J5KCk7XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBjaGlwcGVyVmVyc2lvbi5tYWpvciAhPT0gMCB8fCBjaGlwcGVyVmVyc2lvbi5taW5vciAhPT0gMDtcclxuXHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggJ2NoaXBwZXInLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSdW5zIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHdpdGggdGhlIGNvbnRlbnRzIG9mIGEgc3BlY2lmaWMgZmlsZSdzIGNvbnRlbnRzIGluIHRoZSByZWxlYXNlIGJyYW5jaCAod2l0aCBmYWxzZSBpZlxyXG4gICAgICogaXQgZG9lc24ndCBleGlzdCkuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oY29udGVudHM6c3RyaW5nKTpib29sZWFufSBwcmVkaWNhdGVcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgd2l0aEZpbGUoIGZpbGUsIHByZWRpY2F0ZSApIHtcclxuICAgICAgYXdhaXQgdGhpcy5jaGVja291dCggZmFsc2UgKTtcclxuXHJcbiAgICAgIGlmICggZnMuZXhpc3RzU3luYyggZmlsZSApICkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKCBmaWxlLCAndXRmLTgnICk7XHJcbiAgICAgICAgcmV0dXJuIHByZWRpY2F0ZSggY29udGVudHMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmUtcnVucyBhIHByb2R1Y3Rpb24gZGVwbG95IGZvciBhIHNwZWNpZmljIGJyYW5jaC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgYXN5bmMgcmVkZXBsb3lQcm9kdWN0aW9uKCBsb2NhbGVzID0gJyonICkge1xyXG4gICAgICBpZiAoIHRoaXMuaXNSZWxlYXNlZCApIHtcclxuICAgICAgICBhd2FpdCBjaGVja291dFRhcmdldCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCwgZmFsc2UgKTtcclxuXHJcbiAgICAgICAgY29uc3QgdmVyc2lvbiA9IGF3YWl0IGdldFJlcG9WZXJzaW9uKCB0aGlzLnJlcG8gKTtcclxuICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG5cclxuICAgICAgICBhd2FpdCBjaGVja291dE1haW4oIHRoaXMucmVwbywgZmFsc2UgKTtcclxuXHJcbiAgICAgICAgYXdhaXQgYnVpbGRTZXJ2ZXJSZXF1ZXN0KCB0aGlzLnJlcG8sIHZlcnNpb24sIHRoaXMuYnJhbmNoLCBkZXBlbmRlbmNpZXMsIHtcclxuICAgICAgICAgIGxvY2FsZXM6IGxvY2FsZXMsXHJcbiAgICAgICAgICBicmFuZHM6IHRoaXMuYnJhbmRzLFxyXG4gICAgICAgICAgc2VydmVyczogWyAncHJvZHVjdGlvbicgXVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdTaG91bGQgbm90IHJlZGVwbG95IGEgbm9uLXJlbGVhc2VkIGJyYW5jaCcgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyBhIGxpc3Qgb2YgUmVsZWFzZUJyYW5jaGVzIHdoaWNoIHdvdWxkIGJlIHBvdGVudGlhbCBjYW5kaWRhdGVzIGZvciBhIG1haW50ZW5hbmNlIHJlbGVhc2UuIFRoaXMgaW5jbHVkZXM6XHJcbiAgICAgKiAtIEFsbCBwdWJsaXNoZWQgcGhldCBicmFuZCByZWxlYXNlIGJyYW5jaGVzIChmcm9tIG1ldGFkYXRhKVxyXG4gICAgICogLSBBbGwgcHVibGlzaGVkIHBoZXQtaW8gYnJhbmQgcmVsZWFzZSBicmFuY2hlcyAoZnJvbSBtZXRhZGF0YSlcclxuICAgICAqIC0gQWxsIHVucHVibGlzaGVkIGxvY2FsIHJlbGVhc2UgYnJhbmNoZXNcclxuICAgICAqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48UmVsZWFzZUJyYW5jaFtdPn1cclxuICAgICAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBnZXRBbGxNYWludGVuYW5jZUJyYW5jaGVzKCkge1xyXG4gICAgICB3aW5zdG9uLmRlYnVnKCAncmV0cmlldmluZyBhdmFpbGFibGUgc2ltIGJyYW5jaGVzJyApO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coICdsb2FkaW5nIHBoZXQgYnJhbmQgUmVsZWFzZUJyYW5jaGVzJyApO1xyXG4gICAgICBjb25zdCBzaW1NZXRhZGF0YVJlc3VsdCA9IGF3YWl0IHNpbU1ldGFkYXRhKCB7XHJcbiAgICAgICAgdHlwZTogJ2h0bWwnXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIFJlbGVhc2VkIHBoZXQgYnJhbmNoZXNcclxuICAgICAgY29uc3QgcGhldEJyYW5jaGVzID0gc2ltTWV0YWRhdGFSZXN1bHQucHJvamVjdHMubWFwKCBzaW1EYXRhID0+IHtcclxuICAgICAgICBjb25zdCByZXBvID0gc2ltRGF0YS5uYW1lLnNsaWNlKCBzaW1EYXRhLm5hbWUuaW5kZXhPZiggJy8nICkgKyAxICk7XHJcbiAgICAgICAgY29uc3QgYnJhbmNoID0gYCR7c2ltRGF0YS52ZXJzaW9uLm1ham9yfS4ke3NpbURhdGEudmVyc2lvbi5taW5vcn1gO1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVsZWFzZUJyYW5jaCggcmVwbywgYnJhbmNoLCBbICdwaGV0JyBdLCB0cnVlICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnbG9hZGluZyBwaGV0LWlvIGJyYW5kIFJlbGVhc2VCcmFuY2hlcycgKTtcclxuICAgICAgY29uc3QgcGhldGlvQnJhbmNoZXMgPSAoIGF3YWl0IHNpbVBoZXRpb01ldGFkYXRhKCB7XHJcbiAgICAgICAgYWN0aXZlOiB0cnVlLFxyXG4gICAgICAgIGxhdGVzdDogdHJ1ZVxyXG4gICAgICB9ICkgKS5maWx0ZXIoIHNpbURhdGEgPT4gc2ltRGF0YS5hY3RpdmUgJiYgc2ltRGF0YS5sYXRlc3QgKS5tYXAoIHNpbURhdGEgPT4ge1xyXG4gICAgICAgIGxldCBicmFuY2ggPSBgJHtzaW1EYXRhLnZlcnNpb25NYWpvcn0uJHtzaW1EYXRhLnZlcnNpb25NaW5vcn1gO1xyXG4gICAgICAgIGlmICggc2ltRGF0YS52ZXJzaW9uU3VmZml4Lmxlbmd0aCApIHtcclxuICAgICAgICAgIGJyYW5jaCArPSBgLSR7c2ltRGF0YS52ZXJzaW9uU3VmZml4fWA7IC8vIGFkZGl0aW9uYWwgZGFzaCByZXF1aXJlZFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IFJlbGVhc2VCcmFuY2goIHNpbURhdGEubmFtZSwgYnJhbmNoLCBbICdwaGV0LWlvJyBdLCB0cnVlICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnbG9hZGluZyB1bnJlbGVhc2VkIFJlbGVhc2VCcmFuY2hlcycgKTtcclxuICAgICAgY29uc3QgdW5yZWxlYXNlZEJyYW5jaGVzID0gW107XHJcbiAgICAgIGZvciAoIGNvbnN0IHJlcG8gb2YgZ2V0QWN0aXZlU2ltcygpICkge1xyXG5cclxuICAgICAgICAvLyBFeGNsdWRlIGV4cGxpY2l0bHkgZXhjbHVkZWQgcmVwb3NcclxuICAgICAgICBpZiAoIEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCwgJ3V0ZjgnICkgKS5waGV0Lmlnbm9yZUZvckF1dG9tYXRlZE1haW50ZW5hbmNlUmVsZWFzZXMgKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGJyYW5jaGVzID0gYXdhaXQgZ2V0QnJhbmNoZXMoIHJlcG8gKTtcclxuICAgICAgICBjb25zdCByZWxlYXNlZEJyYW5jaGVzID0gcGhldEJyYW5jaGVzLmNvbmNhdCggcGhldGlvQnJhbmNoZXMgKTtcclxuXHJcbiAgICAgICAgZm9yICggY29uc3QgYnJhbmNoIG9mIGJyYW5jaGVzICkge1xyXG4gICAgICAgICAgLy8gV2UgYXJlbid0IHVucmVsZWFzZWQgaWYgd2UncmUgaW5jbHVkZWQgaW4gZWl0aGVyIHBoZXQgb3IgcGhldC1pbyBtZXRhZGF0YS5cclxuICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYmFsYW5jaW5nLWFjdC9pc3N1ZXMvMTE4XHJcbiAgICAgICAgICBpZiAoIHJlbGVhc2VkQnJhbmNoZXMuZmlsdGVyKCByZWxlYXNlQnJhbmNoID0+IHJlbGVhc2VCcmFuY2gucmVwbyA9PT0gcmVwbyAmJiByZWxlYXNlQnJhbmNoLmJyYW5jaCA9PT0gYnJhbmNoICkubGVuZ3RoICkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IGJyYW5jaC5tYXRjaCggL14oXFxkKylcXC4oXFxkKykkLyApO1xyXG5cclxuICAgICAgICAgIGlmICggbWF0Y2ggKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1ham9yID0gTnVtYmVyKCBtYXRjaFsgMSBdICk7XHJcbiAgICAgICAgICAgIGNvbnN0IG1pbm9yID0gTnVtYmVyKCBtYXRjaFsgMiBdICk7XHJcblxyXG4gICAgICAgICAgICAvLyBBc3N1bXB0aW9uIHRoYXQgdGhlcmUgaXMgbm8gcGhldC1pbyBicmFuZCBzaW0gdGhhdCBpc24ndCBhbHNvIHJlbGVhc2VkIHdpdGggcGhldCBicmFuZFxyXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0TWV0YWRhdGEgPSBzaW1NZXRhZGF0YVJlc3VsdC5wcm9qZWN0cy5maW5kKCBwcm9qZWN0ID0+IHByb2plY3QubmFtZSA9PT0gYGh0bWwvJHtyZXBvfWAgKSB8fCBudWxsO1xyXG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0aW9uVmVyc2lvbiA9IHByb2plY3RNZXRhZGF0YSA/IHByb2plY3RNZXRhZGF0YS52ZXJzaW9uIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICggIXByb2R1Y3Rpb25WZXJzaW9uIHx8XHJcbiAgICAgICAgICAgICAgICAgbWFqb3IgPiBwcm9kdWN0aW9uVmVyc2lvbi5tYWpvciB8fFxyXG4gICAgICAgICAgICAgICAgICggbWFqb3IgPT09IHByb2R1Y3Rpb25WZXJzaW9uLm1ham9yICYmIG1pbm9yID4gcHJvZHVjdGlvblZlcnNpb24ubWlub3IgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gRG8gYSBjaGVja291dCBzbyB3ZSBjYW4gZGV0ZXJtaW5lIHN1cHBvcnRlZCBicmFuZHNcclxuICAgICAgICAgICAgICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gSlNPTi5wYXJzZSggYXdhaXQgZ2V0RmlsZUF0QnJhbmNoKCByZXBvLCBicmFuY2gsICdwYWNrYWdlLmpzb24nICkgKTtcclxuICAgICAgICAgICAgICBjb25zdCBpbmNsdWRlc1BoZXRpbyA9IHBhY2thZ2VPYmplY3QucGhldCAmJiBwYWNrYWdlT2JqZWN0LnBoZXQuc3VwcG9ydGVkQnJhbmRzICYmIHBhY2thZ2VPYmplY3QucGhldC5zdXBwb3J0ZWRCcmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBicmFuZHMgPSBbXHJcbiAgICAgICAgICAgICAgICAncGhldCcsIC8vIEFzc3VtcHRpb24gdGhhdCB0aGVyZSBpcyBubyBwaGV0LWlvIGJyYW5kIHNpbSB0aGF0IGlzbid0IGFsc28gcmVsZWFzZWQgd2l0aCBwaGV0IGJyYW5kXHJcbiAgICAgICAgICAgICAgICAuLi4oIGluY2x1ZGVzUGhldGlvID8gWyAncGhldC1pbycgXSA6IFtdIClcclxuICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoICFwYWNrYWdlT2JqZWN0LnBoZXQuaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyApIHtcclxuICAgICAgICAgICAgICAgIHVucmVsZWFzZWRCcmFuY2hlcy5wdXNoKCBuZXcgUmVsZWFzZUJyYW5jaCggcmVwbywgYnJhbmNoLCBicmFuZHMsIGZhbHNlICkgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGFsbFJlbGVhc2VCcmFuY2hlcyA9IFJlbGVhc2VCcmFuY2guY29tYmluZUxpc3RzKCBbIC4uLnBoZXRCcmFuY2hlcywgLi4ucGhldGlvQnJhbmNoZXMsIC4uLnVucmVsZWFzZWRCcmFuY2hlcyBdICk7XHJcblxyXG4gICAgICAvLyBGQU1CIDIuMy1waGV0aW8ga2VlcHMgZW5kaW5nIHVwIGluIHRoZSBNUiBsaXN0IHdoZW4gd2UgZG9uJ3Qgd2FudCBpdCB0bywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xOTU3LlxyXG4gICAgICByZXR1cm4gYWxsUmVsZWFzZUJyYW5jaGVzLmZpbHRlciggcmIgPT4gISggcmIucmVwbyA9PT0gJ2ZvcmNlcy1hbmQtbW90aW9uLWJhc2ljcycgJiYgcmIuYnJhbmNoID09PSAnMi4zLXBoZXRpbycgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tYmluZXMgbXVsdGlwbGUgbWF0Y2hpbmcgUmVsZWFzZUJyYW5jaGVzIGludG8gb25lIHdoZXJlIGFwcHJvcHJpYXRlLCBhbmQgc29ydHMuIEZvciBleGFtcGxlLCB0d28gUmVsZWFzZUJyYW5jaGVzXHJcbiAgICAgKiBvZiB0aGUgc2FtZSByZXBvIGJ1dCBmb3IgZGlmZmVyZW50IGJyYW5kcyBhcmUgY29tYmluZWQgaW50byBhIHNpbmdsZSBSZWxlYXNlQnJhbmNoIHdpdGggbXVsdGlwbGUgYnJhbmRzLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPFJlbGVhc2VCcmFuY2g+fSBzaW1CcmFuY2hlc1xyXG4gICAgICogQHJldHVybnMge0FycmF5LjxSZWxlYXNlQnJhbmNoPn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNvbWJpbmVMaXN0cyggc2ltQnJhbmNoZXMgKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdEJyYW5jaGVzID0gW107XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBzaW1CcmFuY2ggb2Ygc2ltQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgbGV0IGZvdW5kQnJhbmNoID0gZmFsc2U7XHJcbiAgICAgICAgZm9yICggY29uc3QgcmVzdWx0QnJhbmNoIG9mIHJlc3VsdEJyYW5jaGVzICkge1xyXG4gICAgICAgICAgaWYgKCBzaW1CcmFuY2gucmVwbyA9PT0gcmVzdWx0QnJhbmNoLnJlcG8gJiYgc2ltQnJhbmNoLmJyYW5jaCA9PT0gcmVzdWx0QnJhbmNoLmJyYW5jaCApIHtcclxuICAgICAgICAgICAgZm91bmRCcmFuY2ggPSB0cnVlO1xyXG4gICAgICAgICAgICByZXN1bHRCcmFuY2guYnJhbmRzID0gWyAuLi5yZXN1bHRCcmFuY2guYnJhbmRzLCAuLi5zaW1CcmFuY2guYnJhbmRzIF07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICFmb3VuZEJyYW5jaCApIHtcclxuICAgICAgICAgIHJlc3VsdEJyYW5jaGVzLnB1c2goIHNpbUJyYW5jaCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmVzdWx0QnJhbmNoZXMuc29ydCggKCBhLCBiICkgPT4ge1xyXG4gICAgICAgIGlmICggYS5yZXBvICE9PSBiLnJlcG8gKSB7XHJcbiAgICAgICAgICByZXR1cm4gYS5yZXBvIDwgYi5yZXBvID8gLTEgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIGEuYnJhbmNoICE9PSBiLmJyYW5jaCApIHtcclxuICAgICAgICAgIHJldHVybiBhLmJyYW5jaCA8IGIuYnJhbmNoID8gLTEgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdEJyYW5jaGVzO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFJlbGVhc2VCcmFuY2g7XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxVQUFVLEdBQUdDLE9BQU8sQ0FBRSxjQUFlLENBQUM7QUFDNUMsTUFBTUMsa0JBQWtCLEdBQUdELE9BQU8sQ0FBRSxzQkFBdUIsQ0FBQztBQUM1RCxNQUFNRSxjQUFjLEdBQUdGLE9BQU8sQ0FBRSxrQkFBbUIsQ0FBQztBQUNwRCxNQUFNRyxZQUFZLEdBQUdILE9BQU8sQ0FBRSxnQkFBaUIsQ0FBQztBQUNoRCxNQUFNSSxjQUFjLEdBQUdKLE9BQU8sQ0FBRSxrQkFBbUIsQ0FBQztBQUNwRCxNQUFNSyxlQUFlLEdBQUdMLE9BQU8sQ0FBRSxtQkFBb0IsQ0FBQztBQUN0RCxNQUFNTSxPQUFPLEdBQUdOLE9BQU8sQ0FBRSxXQUFZLENBQUM7QUFDdEMsTUFBTU8sYUFBYSxHQUFHUCxPQUFPLENBQUUsaUJBQWtCLENBQUM7QUFDbEQsTUFBTVEscUJBQXFCLEdBQUdSLE9BQU8sQ0FBRSx5QkFBMEIsQ0FBQztBQUNsRSxNQUFNUyxXQUFXLEdBQUdULE9BQU8sQ0FBRSxlQUFnQixDQUFDO0FBQzlDLE1BQU1VLGlCQUFpQixHQUFHVixPQUFPLENBQUUscUJBQXNCLENBQUM7QUFDMUQsTUFBTVcsZUFBZSxHQUFHWCxPQUFPLENBQUUsbUJBQW9CLENBQUM7QUFDdEQsTUFBTVksWUFBWSxHQUFHWixPQUFPLENBQUUsZ0JBQWlCLENBQUM7QUFDaEQsTUFBTWEsZ0JBQWdCLEdBQUdiLE9BQU8sQ0FBRSxvQkFBcUIsQ0FBQztBQUN4RCxNQUFNYyxlQUFlLEdBQUdkLE9BQU8sQ0FBRSxtQkFBb0IsQ0FBQztBQUN0RCxNQUFNZSxjQUFjLEdBQUdmLE9BQU8sQ0FBRSxrQkFBbUIsQ0FBQztBQUNwRCxNQUFNZ0IsV0FBVyxHQUFHaEIsT0FBTyxDQUFFLGVBQWdCLENBQUM7QUFDOUMsTUFBTWlCLG9CQUFvQixHQUFHakIsT0FBTyxDQUFFLHdCQUF5QixDQUFDO0FBQ2hFLE1BQU1rQix3QkFBd0IsR0FBR2xCLE9BQU8sQ0FBRSw0QkFBNkIsQ0FBQztBQUN4RSxNQUFNbUIsdUJBQXVCLEdBQUduQixPQUFPLENBQUUsMkJBQTRCLENBQUM7QUFDdEUsTUFBTW9CLGFBQWEsR0FBR3BCLE9BQU8sQ0FBRSxpQkFBa0IsQ0FBQztBQUNsRCxNQUFNcUIsT0FBTyxHQUFHckIsT0FBTyxDQUFFLFdBQVksQ0FBQztBQUN0QyxNQUFNc0IsZ0JBQWdCLEdBQUd0QixPQUFPLENBQUUsb0JBQXFCLENBQUM7QUFDeEQsTUFBTXVCLFdBQVcsR0FBR3ZCLE9BQU8sQ0FBRSxlQUFnQixDQUFDO0FBQzlDLE1BQU13QixZQUFZLEdBQUd4QixPQUFPLENBQUUsZ0JBQWlCLENBQUM7QUFDaEQsTUFBTXlCLFlBQVksR0FBR3pCLE9BQU8sQ0FBRSxnQkFBaUIsQ0FBQztBQUNoRCxNQUFNMEIsUUFBUSxHQUFHMUIsT0FBTyxDQUFFLFlBQWEsQ0FBQztBQUN4QyxNQUFNMkIsa0JBQWtCLEdBQUczQixPQUFPLENBQUUsc0JBQXVCLENBQUM7QUFDNUQsTUFBTTRCLGFBQWEsR0FBRzVCLE9BQU8sQ0FBRSxpQkFBa0IsQ0FBQztBQUNsRCxNQUFNNkIsV0FBVyxHQUFHN0IsT0FBTyxDQUFFLGVBQWdCLENBQUM7QUFDOUMsTUFBTThCLGlCQUFpQixHQUFHOUIsT0FBTyxDQUFFLHFCQUFzQixDQUFDO0FBQzFELE1BQU0rQixVQUFVLEdBQUcvQixPQUFPLENBQUUsY0FBZSxDQUFDO0FBQzVDLE1BQU1nQyxNQUFNLEdBQUdoQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQ2xDLE1BQU1pQyxFQUFFLEdBQUdqQyxPQUFPLENBQUUsSUFBSyxDQUFDO0FBQzFCLE1BQU1rQyxPQUFPLEdBQUdsQyxPQUFPLENBQUUsU0FBVSxDQUFDO0FBQ3BDLE1BQU1tQyxDQUFDLEdBQUduQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBRTdCb0MsTUFBTSxDQUFDQyxPQUFPLEdBQUssWUFBVztFQUU1QixNQUFNQyxxQkFBcUIsR0FBRyxxQkFBcUI7RUFFbkQsTUFBTUMsYUFBYSxDQUFDO0lBQ2xCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJQyxXQUFXQSxDQUFFQyxJQUFJLEVBQUVDLE1BQU0sRUFBRUMsTUFBTSxFQUFFQyxVQUFVLEVBQUc7TUFDOUNaLE1BQU0sQ0FBRSxPQUFPUyxJQUFJLEtBQUssUUFBUyxDQUFDO01BQ2xDVCxNQUFNLENBQUUsT0FBT1UsTUFBTSxLQUFLLFFBQVMsQ0FBQztNQUNwQ1YsTUFBTSxDQUFFYSxLQUFLLENBQUNDLE9BQU8sQ0FBRUgsTUFBTyxDQUFFLENBQUM7TUFDakNYLE1BQU0sQ0FBRSxPQUFPWSxVQUFVLEtBQUssU0FBVSxDQUFDOztNQUV6QztNQUNBLElBQUksQ0FBQ0gsSUFBSSxHQUFHQSxJQUFJO01BQ2hCLElBQUksQ0FBQ0MsTUFBTSxHQUFHQSxNQUFNOztNQUVwQjtNQUNBLElBQUksQ0FBQ0MsTUFBTSxHQUFHQSxNQUFNOztNQUVwQjtNQUNBLElBQUksQ0FBQ0MsVUFBVSxHQUFHQSxVQUFVO0lBQzlCOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJRyxTQUFTQSxDQUFBLEVBQUc7TUFDVixPQUFPO1FBQ0xOLElBQUksRUFBRSxJQUFJLENBQUNBLElBQUk7UUFDZkMsTUFBTSxFQUFFLElBQUksQ0FBQ0EsTUFBTTtRQUNuQkMsTUFBTSxFQUFFLElBQUksQ0FBQ0EsTUFBTTtRQUNuQkMsVUFBVSxFQUFFLElBQUksQ0FBQ0E7TUFDbkIsQ0FBQztJQUNIOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksT0FBT0ksV0FBV0EsQ0FBRTtNQUFFUCxJQUFJO01BQUVDLE1BQU07TUFBRUMsTUFBTTtNQUFFQztJQUFXLENBQUMsRUFBRztNQUN6RCxPQUFPLElBQUlMLGFBQWEsQ0FBRUUsSUFBSSxFQUFFQyxNQUFNLEVBQUVDLE1BQU0sRUFBRUMsVUFBVyxDQUFDO0lBQzlEOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0lLLE1BQU1BLENBQUVDLGFBQWEsRUFBRztNQUN0QixPQUFPLElBQUksQ0FBQ1QsSUFBSSxLQUFLUyxhQUFhLENBQUNULElBQUksSUFDaEMsSUFBSSxDQUFDQyxNQUFNLEtBQUtRLGFBQWEsQ0FBQ1IsTUFBTSxJQUNwQyxJQUFJLENBQUNDLE1BQU0sQ0FBQ1EsSUFBSSxDQUFFLEdBQUksQ0FBQyxLQUFLRCxhQUFhLENBQUNQLE1BQU0sQ0FBQ1EsSUFBSSxDQUFFLEdBQUksQ0FBQyxJQUM1RCxJQUFJLENBQUNQLFVBQVUsS0FBS00sYUFBYSxDQUFDTixVQUFVO0lBQ3JEOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJUSxRQUFRQSxDQUFBLEVBQUc7TUFDVCxPQUFRLEdBQUUsSUFBSSxDQUFDWCxJQUFLLElBQUcsSUFBSSxDQUFDQyxNQUFPLElBQUcsSUFBSSxDQUFDQyxNQUFNLENBQUNRLElBQUksQ0FBRSxHQUFJLENBQUUsR0FBRSxJQUFJLENBQUNQLFVBQVUsR0FBRyxFQUFFLEdBQUcsZ0JBQWlCLEVBQUM7SUFDM0c7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxPQUFPUyxvQkFBb0JBLENBQUVaLElBQUksRUFBRUMsTUFBTSxFQUFHO01BQzFDLE9BQVEsR0FBRUoscUJBQXNCLElBQUdHLElBQUssSUFBR0MsTUFBTyxFQUFDO0lBQ3JEOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJLE9BQU9ZLHVCQUF1QkEsQ0FBQSxFQUFHO01BQy9CLE9BQU9oQixxQkFBcUI7SUFDOUI7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksTUFBTWlCLHlCQUF5QkEsQ0FBQSxFQUFHO01BQ2hDLE1BQU1DLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQ0EsWUFBWSxDQUFDLENBQUM7TUFFOUMsT0FBUSxTQUFRQSxZQUFZLEdBQUcsT0FBTyxHQUFHLEVBQUcsR0FBRSxJQUFJLENBQUNmLElBQUssTUFBS2UsWUFBWSxHQUFHLE9BQU8sR0FBRyxFQUFHLE9BQU07SUFDakc7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksTUFBTUMsMkJBQTJCQSxDQUFBLEVBQUc7TUFDbEMsTUFBTUQsWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDQSxZQUFZLENBQUMsQ0FBQztNQUU5QyxPQUFRLFNBQVFBLFlBQVksR0FBRyxVQUFVLEdBQUcsRUFBRyxHQUFFLElBQUksQ0FBQ2YsSUFBSyxHQUFFZSxZQUFZLEdBQUcsY0FBYyxHQUFHLFlBQWEsT0FBTTtJQUNsSDs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNRSxpQ0FBaUNBLENBQUEsRUFBRztNQUN4QyxPQUFPLENBQUUsTUFBTSxJQUFJLENBQUNDLHVCQUF1QixDQUFDLENBQUMsSUFBSyxvQkFBb0IsR0FBRyxrQkFBa0I7SUFDN0Y7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtJQUNJQyxpQkFBaUJBLENBQUEsRUFBRztNQUNsQixNQUFNQyxpQkFBaUIsR0FBR3RCLGFBQWEsQ0FBQ2Msb0JBQW9CLENBQUUsSUFBSSxDQUFDWixJQUFJLEVBQUUsSUFBSSxDQUFDQyxNQUFPLENBQUM7TUFFdEYsT0FBT3hDLGNBQWMsQ0FBQzRELGtCQUFrQixDQUN0Q0MsSUFBSSxDQUFDQyxLQUFLLENBQUUvQixFQUFFLENBQUNnQyxZQUFZLENBQUcsR0FBRUosaUJBQWtCLHVCQUFzQixFQUFFLE1BQU8sQ0FBRSxDQUNyRixDQUFDO0lBQ0g7O0lBRUE7QUFDSjtBQUNBO0lBQ0ksTUFBTUssY0FBY0EsQ0FBRUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLEVBQUc7TUFDaERqQyxPQUFPLENBQUNrQyxJQUFJLENBQUcseUJBQXdCLElBQUksQ0FBQ2hCLFFBQVEsQ0FBQyxDQUFFLEVBQUUsQ0FBQztNQUUxRCxJQUFLLENBQUNuQixFQUFFLENBQUNvQyxVQUFVLENBQUUvQixxQkFBc0IsQ0FBQyxFQUFHO1FBQzdDSixPQUFPLENBQUNrQyxJQUFJLENBQUcsc0JBQXFCOUIscUJBQXNCLEVBQUUsQ0FBQztRQUM3RCxNQUFNakMsZUFBZSxDQUFFaUMscUJBQXNCLENBQUM7TUFDaEQ7TUFDQSxNQUFNdUIsaUJBQWlCLEdBQUd0QixhQUFhLENBQUNjLG9CQUFvQixDQUFFLElBQUksQ0FBQ1osSUFBSSxFQUFFLElBQUksQ0FBQ0MsTUFBTyxDQUFDO01BQ3RGLElBQUssQ0FBQ1QsRUFBRSxDQUFDb0MsVUFBVSxDQUFFUixpQkFBa0IsQ0FBQyxFQUFHO1FBQ3pDM0IsT0FBTyxDQUFDa0MsSUFBSSxDQUFHLHNCQUFxQlAsaUJBQWtCLEVBQUUsQ0FBQztRQUN6RCxNQUFNeEQsZUFBZSxDQUFFd0QsaUJBQWtCLENBQUM7TUFDNUM7TUFFQSxNQUFNM0Msd0JBQXdCLENBQUUsSUFBSSxDQUFDdUIsSUFBSSxFQUFFb0IsaUJBQWtCLENBQUM7TUFDOUQsTUFBTTVDLG9CQUFvQixDQUFFLElBQUksQ0FBQ3lCLE1BQU0sRUFBRyxHQUFFbUIsaUJBQWtCLElBQUcsSUFBSSxDQUFDcEIsSUFBSyxFQUFFLENBQUM7TUFDOUUsTUFBTW5CLGdCQUFnQixDQUFHLEdBQUV1QyxpQkFBa0IsSUFBRyxJQUFJLENBQUNwQixJQUFLLEVBQUUsQ0FBQztNQUM3RCxNQUFNNkIsdUJBQXVCLEdBQUcsTUFBTTVDLFFBQVEsQ0FBRyxHQUFFbUMsaUJBQWtCLElBQUcsSUFBSSxDQUFDcEIsSUFBSyxvQkFBb0IsQ0FBQztNQUV2RzZCLHVCQUF1QixDQUFDQyxLQUFLLEdBQUc7UUFBRUMsR0FBRyxFQUFFekUsVUFBVSxDQUFDMEUsV0FBVztRQUFFL0IsTUFBTSxFQUFFM0MsVUFBVSxDQUFDMEU7TUFBWSxDQUFDO01BRS9GLE1BQU1DLGVBQWUsR0FBR3ZDLENBQUMsQ0FBQ3dDLElBQUksQ0FBRSxDQUM5QixHQUFHQyxNQUFNLENBQUNDLElBQUksQ0FBRVAsdUJBQXdCLENBQUMsRUFDekMsR0FBR00sTUFBTSxDQUFDQyxJQUFJLENBQUVWLG9CQUFxQixDQUFDLENBQ3ZDLENBQUNXLE1BQU0sQ0FBRXJDLElBQUksSUFBSUEsSUFBSSxLQUFLLFNBQVUsQ0FBRSxDQUFDO01BRXhDLE1BQU1zQyxPQUFPLENBQUNDLEdBQUcsQ0FBRU4sZUFBZSxDQUFDTyxHQUFHLENBQUUsTUFBTXhDLElBQUksSUFBSTtRQUNwRCxNQUFNeUMsT0FBTyxHQUFJLEdBQUVyQixpQkFBa0IsSUFBR3BCLElBQUssRUFBQztRQUU5QyxNQUFNdkIsd0JBQXdCLENBQUV1QixJQUFJLEVBQUVvQixpQkFBa0IsQ0FBQztRQUV6RCxNQUFNVyxHQUFHLEdBQUdMLG9CQUFvQixDQUFFMUIsSUFBSSxDQUFFLEdBQUcwQixvQkFBb0IsQ0FBRTFCLElBQUksQ0FBRSxDQUFDK0IsR0FBRyxHQUFHRix1QkFBdUIsQ0FBRTdCLElBQUksQ0FBRSxDQUFDK0IsR0FBRztRQUNqSCxNQUFNdkQsb0JBQW9CLENBQUV1RCxHQUFHLEVBQUVVLE9BQVEsQ0FBQzs7UUFFMUM7UUFDQTtRQUNBLElBQUt6QyxJQUFJLEtBQUssT0FBTyxFQUFHO1VBQ3RCLE1BQU1uQixnQkFBZ0IsQ0FBRTRELE9BQVEsQ0FBQztRQUNuQztRQUVBLElBQUt6QyxJQUFJLEtBQUssU0FBUyxJQUFJQSxJQUFJLEtBQUssaUJBQWlCLElBQUlBLElBQUksS0FBSyxJQUFJLENBQUNBLElBQUksRUFBRztVQUM1RVAsT0FBTyxDQUFDa0MsSUFBSSxDQUFHLE9BQU0zQixJQUFLLE9BQU1vQixpQkFBa0IsRUFBRSxDQUFDO1VBRXJELE1BQU1sQyxrQkFBa0IsQ0FBRXVELE9BQVEsQ0FBQztRQUNyQztNQUNGLENBQUUsQ0FBRSxDQUFDOztNQUVMO01BQ0E7TUFDQSxNQUFNaEUsd0JBQXdCLENBQUUsV0FBVyxFQUFFMkMsaUJBQWtCLENBQUM7SUFDbEU7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtJQUNJLE1BQU1zQixLQUFLQSxDQUFFQyxPQUFPLEVBQUc7TUFDckIsTUFBTXZCLGlCQUFpQixHQUFHdEIsYUFBYSxDQUFDYyxvQkFBb0IsQ0FBRSxJQUFJLENBQUNaLElBQUksRUFBRSxJQUFJLENBQUNDLE1BQU8sQ0FBQztNQUN0RixNQUFNMkMsYUFBYSxHQUFJLEdBQUV4QixpQkFBa0IsSUFBRyxJQUFJLENBQUNwQixJQUFLLEVBQUM7TUFFekQsTUFBTTZDLElBQUksR0FBRzVFLGlCQUFpQixDQUFFLElBQUksQ0FBQ2tELGlCQUFpQixDQUFDLENBQUMsRUFBRXpCLENBQUMsQ0FBQ29ELEtBQUssQ0FBRTtRQUNqRTVDLE1BQU0sRUFBRSxJQUFJLENBQUNBLE1BQU07UUFDbkI2QyxPQUFPLEVBQUUsSUFBSTtRQUNiQyxTQUFTLEVBQUUsSUFBSTtRQUNmQyxJQUFJLEVBQUU7TUFDUixDQUFDLEVBQUVOLE9BQVEsQ0FBRSxDQUFDO01BRWRsRCxPQUFPLENBQUNrQyxJQUFJLENBQUcsWUFBV1AsaUJBQWtCLGVBQWN5QixJQUFJLENBQUNuQyxJQUFJLENBQUUsR0FBSSxDQUFFLEVBQUUsQ0FBQztNQUM5RSxNQUFNN0MsT0FBTyxDQUFFbUIsWUFBWSxFQUFFNkQsSUFBSSxFQUFFRCxhQUFjLENBQUM7SUFDcEQ7O0lBRUE7QUFDSjtBQUNBO0lBQ0ksTUFBTU0sU0FBU0EsQ0FBQSxFQUFHO01BQ2hCLE1BQU05QixpQkFBaUIsR0FBR3RCLGFBQWEsQ0FBQ2Msb0JBQW9CLENBQUUsSUFBSSxDQUFDWixJQUFJLEVBQUUsSUFBSSxDQUFDQyxNQUFPLENBQUM7TUFDdEYsTUFBTTJDLGFBQWEsR0FBSSxHQUFFeEIsaUJBQWtCLElBQUcsSUFBSSxDQUFDcEIsSUFBSyxFQUFDO01BRXpEUCxPQUFPLENBQUNrQyxJQUFJLENBQUcsZUFBY1AsaUJBQWtCLEVBQUUsQ0FBQzs7TUFFbEQ7TUFDQSxNQUFNdkQsT0FBTyxDQUFFbUIsWUFBWSxFQUFFLENBQUUsbUJBQW1CLENBQUUsRUFBRTRELGFBQWEsRUFBRTtRQUNuRU8sTUFBTSxFQUFFO01BQ1YsQ0FBRSxDQUFDO0lBQ0w7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtJQUNJLE1BQU1DLFlBQVlBLENBQUEsRUFBRztNQUNuQixJQUFJO1FBQ0YsT0FBTyxNQUFNOUQsVUFBVSxDQUFFLE1BQU0rRCxJQUFJLElBQUk7VUFDckMsTUFBTUMsR0FBRyxHQUFJLG9CQUFtQkQsSUFBSyxJQUFHLElBQUksQ0FBQ3JELElBQUssSUFBRyxJQUFJLENBQUNBLElBQUssNENBQTJDO1VBQzFHLElBQUk7WUFDRixPQUFPLE1BQU1iLGFBQWEsQ0FBRW1FLEdBQUcsRUFBRTtjQUMvQkMsYUFBYSxFQUFFO1lBQ2pCLENBQUUsQ0FBQztVQUNMLENBQUMsQ0FDRCxPQUFPQyxDQUFDLEVBQUc7WUFDVCxPQUFRLGVBQWNGLEdBQUksS0FBSUUsQ0FBRSxFQUFDO1VBQ25DO1FBQ0YsQ0FBQyxFQUFFO1VBQ0RDLElBQUksRUFBRTNELGFBQWEsQ0FBQ2Msb0JBQW9CLENBQUUsSUFBSSxDQUFDWixJQUFJLEVBQUUsSUFBSSxDQUFDQyxNQUFPO1FBQ25FLENBQUUsQ0FBQztNQUNMLENBQUMsQ0FDRCxPQUFPdUQsQ0FBQyxFQUFHO1FBQ1QsT0FBUSw2QkFBNEJBLENBQUUsRUFBQztNQUN6QztJQUNGOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNRSxVQUFVQSxDQUFBLEVBQUc7TUFDakIsSUFBSTtRQUNGLE1BQU0zQyxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUNBLFlBQVksQ0FBQyxDQUFDO1FBRTlDLE9BQU8sTUFBTXpCLFVBQVUsQ0FBRSxNQUFNK0QsSUFBSSxJQUFJO1VBQ3JDLE1BQU1DLEdBQUcsR0FBSSxvQkFBbUJELElBQUssSUFBRyxJQUFJLENBQUNyRCxJQUFLLFVBQVNlLFlBQVksR0FBRyxPQUFPLEdBQUcsRUFBRyxHQUFFLElBQUksQ0FBQ2YsSUFBSyxNQUFLZSxZQUFZLEdBQUcsT0FBTyxHQUFHLEVBQUcsMkJBQTBCO1VBQzlKLElBQUk7WUFDRixPQUFPNUIsYUFBYSxDQUFFbUUsR0FBRyxFQUFFO2NBQ3pCQyxhQUFhLEVBQUU7WUFDakIsQ0FBRSxDQUFDO1VBQ0wsQ0FBQyxDQUNELE9BQU9JLEtBQUssRUFBRztZQUNiLE9BQVEsZUFBY0wsR0FBSSxLQUFJSyxLQUFNLEVBQUM7VUFDdkM7UUFDRixDQUFDLEVBQUU7VUFDREYsSUFBSSxFQUFFM0QsYUFBYSxDQUFDYyxvQkFBb0IsQ0FBRSxJQUFJLENBQUNaLElBQUksRUFBRSxJQUFJLENBQUNDLE1BQU87UUFDbkUsQ0FBRSxDQUFDO01BQ0wsQ0FBQyxDQUNELE9BQU91RCxDQUFDLEVBQUc7UUFDVCxPQUFRLDZCQUE0QkEsQ0FBRSxFQUFDO01BQ3pDO0lBQ0Y7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksTUFBTUksUUFBUUEsQ0FBRUMsZ0JBQWdCLEVBQUc7TUFDakMsTUFBTWxHLGNBQWMsQ0FBRSxJQUFJLENBQUNxQyxJQUFJLEVBQUUsSUFBSSxDQUFDQyxNQUFNLEVBQUU0RCxnQkFBaUIsQ0FBQztJQUNsRTs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNQyxXQUFXQSxDQUFFOUQsSUFBSSxFQUFFK0IsR0FBRyxFQUFHO01BQzdCLElBQUlnQyxNQUFNLEdBQUcsS0FBSztNQUVsQixNQUFNeEYsV0FBVyxDQUFFLElBQUksQ0FBQ3lCLElBQUksRUFBRSxJQUFJLENBQUNDLE1BQU8sQ0FBQztNQUUzQyxNQUFNK0QsWUFBWSxHQUFHLE1BQU05RixlQUFlLENBQUUsSUFBSSxDQUFDOEIsSUFBSyxDQUFDO01BRXZELElBQUtnRSxZQUFZLENBQUVoRSxJQUFJLENBQUUsRUFBRztRQUMxQixNQUFNaUUsVUFBVSxHQUFHRCxZQUFZLENBQUVoRSxJQUFJLENBQUUsQ0FBQytCLEdBQUc7UUFDM0NnQyxNQUFNLEdBQUdoQyxHQUFHLEtBQUtrQyxVQUFVLEtBQUksTUFBTXRGLGFBQWEsQ0FBRXFCLElBQUksRUFBRStCLEdBQUcsRUFBRWtDLFVBQVcsQ0FBQztNQUM3RTtNQUVBLE1BQU0xRixXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLE1BQU8sQ0FBQztNQUV0QyxPQUFPK0QsTUFBTTtJQUNmOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJLE1BQU1HLFlBQVlBLENBQUVsRSxJQUFJLEVBQUUrQixHQUFHLEVBQUc7TUFDOUIsSUFBSWdDLE1BQU0sR0FBRyxLQUFLO01BRWxCLE1BQU14RixXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLElBQUksQ0FBQ0MsTUFBTyxDQUFDO01BRTNDLE1BQU0rRCxZQUFZLEdBQUcsTUFBTTlGLGVBQWUsQ0FBRSxJQUFJLENBQUM4QixJQUFLLENBQUM7TUFFdkQsSUFBS2dFLFlBQVksQ0FBRWhFLElBQUksQ0FBRSxFQUFHO1FBQzFCLE1BQU1pRSxVQUFVLEdBQUdELFlBQVksQ0FBRWhFLElBQUksQ0FBRSxDQUFDK0IsR0FBRztRQUMzQ2dDLE1BQU0sR0FBR2hDLEdBQUcsS0FBS2tDLFVBQVUsSUFBSSxFQUFHLE1BQU10RixhQUFhLENBQUVxQixJQUFJLEVBQUUrQixHQUFHLEVBQUVrQyxVQUFXLENBQUMsQ0FBRTtNQUNsRjtNQUVBLE1BQU0xRixXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLE1BQU8sQ0FBQztNQUV0QyxPQUFPK0QsTUFBTTtJQUNmOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJLE1BQU1JLGVBQWVBLENBQUEsRUFBRztNQUN0QixNQUFNNUYsV0FBVyxDQUFFLElBQUksQ0FBQ3lCLElBQUksRUFBRSxJQUFJLENBQUNDLE1BQU8sQ0FBQztNQUMzQyxNQUFNckIsT0FBTyxDQUFFLElBQUksQ0FBQ29CLElBQUssQ0FBQztNQUMxQixNQUFNekIsV0FBVyxDQUFFLElBQUksQ0FBQ3lCLElBQUksRUFBRSxNQUFPLENBQUM7TUFFdEMsT0FBT3RCLHVCQUF1QixDQUFFLElBQUksQ0FBQ3NCLElBQUksRUFBRSxJQUFJLENBQUNDLE1BQU0sRUFBRSxNQUFPLENBQUM7SUFDbEU7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksTUFBTW1FLHFCQUFxQkEsQ0FBQSxFQUFHO01BQzVCLE9BQU9yRixZQUFZLENBQUUsSUFBSSxDQUFDaUIsSUFBSSxFQUFFLE1BQU0sSUFBSSxDQUFDbUUsZUFBZSxDQUFDLENBQUUsQ0FBQztJQUNoRTs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNakcsZUFBZUEsQ0FBQSxFQUFHO01BQ3RCLE9BQU9ILHFCQUFxQixDQUFFLElBQUksQ0FBQ2lDLElBQUksRUFBRSxJQUFJLENBQUNDLE1BQU8sQ0FBQztJQUN4RDs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNb0UsYUFBYUEsQ0FBQSxFQUFHO01BQ3BCLE9BQU9qRyxnQkFBZ0IsQ0FBRSxJQUFJLENBQUM0QixJQUFJLEVBQUUsSUFBSSxDQUFDQyxNQUFPLENBQUM7SUFDbkQ7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksTUFBTXFFLFNBQVNBLENBQUVDLHlCQUF5QixHQUFHcEcsWUFBWSxFQUFHO01BQzFELE1BQU1xRyxPQUFPLEdBQUcsRUFBRTtNQUVsQixNQUFNUixZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUM5RixlQUFlLENBQUMsQ0FBQztNQUNqRCxNQUFNdUcsZUFBZSxHQUFHdEMsTUFBTSxDQUFDQyxJQUFJLENBQUU0QixZQUFhLENBQUMsQ0FBQzNCLE1BQU0sQ0FBRXFDLEdBQUcsSUFBSTtRQUNqRSxPQUFPQSxHQUFHLEtBQUssU0FBUyxJQUFJQSxHQUFHLEtBQUssSUFBSSxDQUFDMUUsSUFBSSxJQUFJMEUsR0FBRyxLQUFLLDhCQUE4QjtNQUN6RixDQUFFLENBQUM7O01BRUg7TUFDQSxJQUFLVixZQUFZLENBQUUsSUFBSSxDQUFDaEUsSUFBSSxDQUFFLEVBQUc7UUFDL0IsSUFBSTtVQUNGLE1BQU0yRSxhQUFhLEdBQUcsTUFBTTdGLFdBQVcsQ0FBRSxJQUFJLENBQUNrQixJQUFJLEVBQUUsSUFBSSxDQUFDQyxNQUFPLENBQUM7VUFDakUsTUFBTTJFLGNBQWMsR0FBRyxNQUFNOUYsV0FBVyxDQUFFLElBQUksQ0FBQ2tCLElBQUksRUFBRyxHQUFFMkUsYUFBYyxHQUFHLENBQUM7VUFDMUUsSUFBS1gsWUFBWSxDQUFFLElBQUksQ0FBQ2hFLElBQUksQ0FBRSxDQUFDK0IsR0FBRyxLQUFLNkMsY0FBYyxFQUFHO1lBQ3RESixPQUFPLENBQUNLLElBQUksQ0FBRSw4REFBK0QsQ0FBQztZQUM5RUwsT0FBTyxDQUFDSyxJQUFJLENBQUcsVUFBU0YsYUFBYyxJQUFHQyxjQUFlLElBQUdaLFlBQVksQ0FBRSxJQUFJLENBQUNoRSxJQUFJLENBQUUsQ0FBQytCLEdBQUksRUFBRSxDQUFDO1VBQzlGO1VBQ0EsSUFBSyxDQUFFLE1BQU0sSUFBSSxDQUFDc0MsYUFBYSxDQUFDLENBQUMsRUFBR1MsUUFBUSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMzRSxVQUFVLEVBQUc7WUFDekVxRSxPQUFPLENBQUNLLElBQUksQ0FBRSx3RUFBeUUsQ0FBQztVQUMxRjtRQUNGLENBQUMsQ0FDRCxPQUFPckIsQ0FBQyxFQUFHO1VBQ1RnQixPQUFPLENBQUNLLElBQUksQ0FBRyxxREFBb0RyQixDQUFDLENBQUN1QixPQUFRLEVBQUUsQ0FBQztRQUNsRjtNQUNGLENBQUMsTUFDSTtRQUNIUCxPQUFPLENBQUNLLElBQUksQ0FBRSx1REFBd0QsQ0FBQztNQUN6RTtNQUVBLEtBQU0sTUFBTUcsVUFBVSxJQUFJUCxlQUFlLEVBQUc7UUFDMUMsTUFBTVEsc0JBQXNCLEdBQUksR0FBRSxJQUFJLENBQUNqRixJQUFLLElBQUcsSUFBSSxDQUFDQyxNQUFPLEVBQUM7UUFDNUQsTUFBTWlGLFNBQVMsR0FBRyxNQUFNWCx5QkFBeUIsQ0FBRVMsVUFBVyxDQUFDO1FBRS9ELElBQUs3QyxNQUFNLENBQUNDLElBQUksQ0FBRThDLFNBQVUsQ0FBQyxDQUFDQyxRQUFRLENBQUVGLHNCQUF1QixDQUFDLEVBQUc7VUFDakUsSUFBS2pCLFlBQVksQ0FBRWdCLFVBQVUsQ0FBRSxDQUFDakQsR0FBRyxLQUFLbUQsU0FBUyxDQUFFRCxzQkFBc0IsQ0FBRSxFQUFHO1lBQzVFVCxPQUFPLENBQUNLLElBQUksQ0FBRyxxQ0FBb0NHLFVBQVcsY0FBYUMsc0JBQXVCLEVBQUUsQ0FBQztVQUN2RztRQUNGO01BQ0Y7TUFFQSxPQUFPVCxPQUFPO0lBQ2hCOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJLE1BQU1ZLE9BQU9BLENBQUEsRUFBRztNQUNkLE1BQU03RyxXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLElBQUksQ0FBQ0MsTUFBTyxDQUFDO01BQzNDLE1BQU0rRCxZQUFZLEdBQUcsTUFBTTlGLGVBQWUsQ0FBRSxJQUFJLENBQUM4QixJQUFLLENBQUM7TUFDdkQsTUFBTStCLEdBQUcsR0FBR2lDLFlBQVksQ0FBQ3FCLE9BQU8sQ0FBQ3RELEdBQUc7TUFDcEMsTUFBTXhELFdBQVcsQ0FBRSxJQUFJLENBQUN5QixJQUFJLEVBQUUsTUFBTyxDQUFDO01BRXRDLE9BQU9yQixhQUFhLENBQUUsU0FBUyxFQUFFLDBDQUEwQyxFQUFFb0QsR0FBSSxDQUFDO0lBQ3BGOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNdUQsb0NBQW9DQSxDQUFBLEVBQUc7TUFDM0MsTUFBTS9HLFdBQVcsQ0FBRSxJQUFJLENBQUN5QixJQUFJLEVBQUUsSUFBSSxDQUFDQyxNQUFPLENBQUM7TUFDM0MsTUFBTStELFlBQVksR0FBRyxNQUFNOUYsZUFBZSxDQUFFLElBQUksQ0FBQzhCLElBQUssQ0FBQztNQUN2RCxNQUFNK0IsR0FBRyxHQUFHaUMsWUFBWSxDQUFDcUIsT0FBTyxDQUFDdEQsR0FBRztNQUNwQyxNQUFNeEQsV0FBVyxDQUFFLElBQUksQ0FBQ3lCLElBQUksRUFBRSxNQUFPLENBQUM7TUFFdEMsT0FBT3JCLGFBQWEsQ0FBRSxTQUFTLEVBQUUsMENBQTBDLEVBQUVvRCxHQUFJLENBQUM7SUFDcEY7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJLE1BQU1iLHVCQUF1QkEsQ0FBQSxFQUFHO01BQzlCLE1BQU0zQyxXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLElBQUksQ0FBQ0MsTUFBTyxDQUFDO01BQzNDLE1BQU0rRCxZQUFZLEdBQUcsTUFBTTlGLGVBQWUsQ0FBRSxJQUFJLENBQUM4QixJQUFLLENBQUM7TUFDdkQsTUFBTStCLEdBQUcsR0FBR2lDLFlBQVksQ0FBQ3FCLE9BQU8sQ0FBQ3RELEdBQUc7TUFDcEMsTUFBTXhELFdBQVcsQ0FBRSxJQUFJLENBQUN5QixJQUFJLEVBQUUsTUFBTyxDQUFDO01BRXRDLE9BQU8sRUFBRyxNQUFNckIsYUFBYSxDQUFFLFNBQVMsRUFBRSwwQ0FBMEMsRUFBRW9ELEdBQUksQ0FBQyxDQUFFO0lBQy9GOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksTUFBTXdELG1CQUFtQkEsQ0FBQSxFQUFHO01BQzFCLE1BQU1oSCxXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLElBQUksQ0FBQ0MsTUFBTyxDQUFDO01BQzNDLE1BQU0rRCxZQUFZLEdBQUcsTUFBTTlGLGVBQWUsQ0FBRSxJQUFJLENBQUM4QixJQUFLLENBQUM7TUFFdkQsSUFBSyxDQUFDZ0UsWUFBWSxDQUFFLFNBQVMsQ0FBRSxFQUFHO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLENBQUM7TUFDZjtNQUVBLE1BQU1qQyxHQUFHLEdBQUdpQyxZQUFZLENBQUUsU0FBUyxDQUFFLENBQUNqQyxHQUFHO01BQ3pDLE1BQU14RCxXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLE1BQU8sQ0FBQztNQUV0QyxPQUFPckIsYUFBYSxDQUFFLFNBQVMsRUFBRSwwQ0FBMEMsRUFBRW9ELEdBQUksQ0FBQztJQUNwRjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNeUQsZ0JBQWdCQSxDQUFBLEVBQUc7TUFDdkIsTUFBTWpILFdBQVcsQ0FBRSxJQUFJLENBQUN5QixJQUFJLEVBQUUsSUFBSSxDQUFDQyxNQUFPLENBQUM7TUFDM0MsTUFBTStELFlBQVksR0FBRyxNQUFNOUYsZUFBZSxDQUFFLElBQUksQ0FBQzhCLElBQUssQ0FBQztNQUV2RCxNQUFNK0IsR0FBRyxHQUFHaUMsWUFBWSxDQUFDcUIsT0FBTyxDQUFDdEQsR0FBRztNQUNwQyxNQUFNeEQsV0FBVyxDQUFFLElBQUksQ0FBQ3lCLElBQUksRUFBRSxNQUFPLENBQUM7TUFFdEMsT0FBT3JCLGFBQWEsQ0FBRSxTQUFTLEVBQUUsMENBQTBDLEVBQUVvRCxHQUFJLENBQUM7SUFDcEY7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksTUFBTTBELHFCQUFxQkEsQ0FBQSxFQUFHO01BQzVCLE1BQU1sSCxXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLElBQUksQ0FBQ0MsTUFBTyxDQUFDO01BQzNDLE1BQU0rRCxZQUFZLEdBQUcsTUFBTTlGLGVBQWUsQ0FBRSxJQUFJLENBQUM4QixJQUFLLENBQUM7TUFFdkQsTUFBTWdGLFVBQVUsR0FBR2hCLFlBQVksQ0FBRSxrQkFBa0IsQ0FBRTtNQUNyRCxJQUFLLENBQUNnQixVQUFVLEVBQUc7UUFDakIsT0FBTyxLQUFLO01BQ2Q7TUFFQSxNQUFNakQsR0FBRyxHQUFHaUQsVUFBVSxDQUFDakQsR0FBRztNQUMxQixNQUFNeEQsV0FBVyxDQUFFLElBQUksQ0FBQ3lCLElBQUksRUFBRSxNQUFPLENBQUM7TUFFdEMsT0FBT3JCLGFBQWEsQ0FBRSxrQkFBa0IsRUFBRSwwQ0FBMEMsRUFBRW9ELEdBQUksQ0FBQztJQUM3Rjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNaEIsWUFBWUEsQ0FBQSxFQUFHO01BQ25CLE1BQU14QyxXQUFXLENBQUUsSUFBSSxDQUFDeUIsSUFBSSxFQUFFLElBQUksQ0FBQ0MsTUFBTyxDQUFDO01BQzNDLE1BQU0rRCxZQUFZLEdBQUcsTUFBTTlGLGVBQWUsQ0FBRSxJQUFJLENBQUM4QixJQUFLLENBQUM7TUFDdkQsTUFBTXpCLFdBQVcsQ0FBRSxTQUFTLEVBQUV5RixZQUFZLENBQUNxQixPQUFPLENBQUN0RCxHQUFJLENBQUM7TUFFeEQsTUFBTTJELGNBQWMsR0FBR2pJLGNBQWMsQ0FBQ2tJLGlCQUFpQixDQUFDLENBQUM7TUFFekQsTUFBTTVCLE1BQU0sR0FBRzJCLGNBQWMsQ0FBQ0UsS0FBSyxLQUFLLENBQUMsSUFBSUYsY0FBYyxDQUFDRyxLQUFLLEtBQUssQ0FBQztNQUV2RSxNQUFNdEgsV0FBVyxDQUFFLElBQUksQ0FBQ3lCLElBQUksRUFBRSxNQUFPLENBQUM7TUFDdEMsTUFBTXpCLFdBQVcsQ0FBRSxTQUFTLEVBQUUsTUFBTyxDQUFDO01BRXRDLE9BQU93RixNQUFNO0lBQ2Y7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0ksTUFBTStCLFFBQVFBLENBQUVDLElBQUksRUFBRUMsU0FBUyxFQUFHO01BQ2hDLE1BQU0sSUFBSSxDQUFDcEMsUUFBUSxDQUFFLEtBQU0sQ0FBQztNQUU1QixJQUFLcEUsRUFBRSxDQUFDb0MsVUFBVSxDQUFFbUUsSUFBSyxDQUFDLEVBQUc7UUFDM0IsTUFBTUUsUUFBUSxHQUFHekcsRUFBRSxDQUFDZ0MsWUFBWSxDQUFFdUUsSUFBSSxFQUFFLE9BQVEsQ0FBQztRQUNqRCxPQUFPQyxTQUFTLENBQUVDLFFBQVMsQ0FBQztNQUM5QjtNQUVBLE9BQU8sS0FBSztJQUNkOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0lBQ0ksTUFBTUMsa0JBQWtCQSxDQUFFQyxPQUFPLEdBQUcsR0FBRyxFQUFHO01BQ3hDLElBQUssSUFBSSxDQUFDaEcsVUFBVSxFQUFHO1FBQ3JCLE1BQU14QyxjQUFjLENBQUUsSUFBSSxDQUFDcUMsSUFBSSxFQUFFLElBQUksQ0FBQ0MsTUFBTSxFQUFFLEtBQU0sQ0FBQztRQUVyRCxNQUFNbUcsT0FBTyxHQUFHLE1BQU05SCxjQUFjLENBQUUsSUFBSSxDQUFDMEIsSUFBSyxDQUFDO1FBQ2pELE1BQU1nRSxZQUFZLEdBQUcsTUFBTTlGLGVBQWUsQ0FBRSxJQUFJLENBQUM4QixJQUFLLENBQUM7UUFFdkQsTUFBTXRDLFlBQVksQ0FBRSxJQUFJLENBQUNzQyxJQUFJLEVBQUUsS0FBTSxDQUFDO1FBRXRDLE1BQU14QyxrQkFBa0IsQ0FBRSxJQUFJLENBQUN3QyxJQUFJLEVBQUVvRyxPQUFPLEVBQUUsSUFBSSxDQUFDbkcsTUFBTSxFQUFFK0QsWUFBWSxFQUFFO1VBQ3ZFbUMsT0FBTyxFQUFFQSxPQUFPO1VBQ2hCakcsTUFBTSxFQUFFLElBQUksQ0FBQ0EsTUFBTTtVQUNuQm1HLE9BQU8sRUFBRSxDQUFFLFlBQVk7UUFDekIsQ0FBRSxDQUFDO01BQ0wsQ0FBQyxNQUNJO1FBQ0gsTUFBTSxJQUFJQyxLQUFLLENBQUUsMkNBQTRDLENBQUM7TUFDaEU7SUFDRjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJLGFBQWFDLHlCQUF5QkEsQ0FBQSxFQUFHO01BQ3ZDOUcsT0FBTyxDQUFDK0csS0FBSyxDQUFFLG1DQUFvQyxDQUFDO01BRXBEQyxPQUFPLENBQUNDLEdBQUcsQ0FBRSxvQ0FBcUMsQ0FBQztNQUNuRCxNQUFNQyxpQkFBaUIsR0FBRyxNQUFNdkgsV0FBVyxDQUFFO1FBQzNDd0gsSUFBSSxFQUFFO01BQ1IsQ0FBRSxDQUFDOztNQUVIO01BQ0EsTUFBTUMsWUFBWSxHQUFHRixpQkFBaUIsQ0FBQ0csUUFBUSxDQUFDdEUsR0FBRyxDQUFFdUUsT0FBTyxJQUFJO1FBQzlELE1BQU0vRyxJQUFJLEdBQUcrRyxPQUFPLENBQUNDLElBQUksQ0FBQ0MsS0FBSyxDQUFFRixPQUFPLENBQUNDLElBQUksQ0FBQ0UsT0FBTyxDQUFFLEdBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQztRQUNsRSxNQUFNakgsTUFBTSxHQUFJLEdBQUU4RyxPQUFPLENBQUNYLE9BQU8sQ0FBQ1IsS0FBTSxJQUFHbUIsT0FBTyxDQUFDWCxPQUFPLENBQUNQLEtBQU0sRUFBQztRQUNsRSxPQUFPLElBQUkvRixhQUFhLENBQUVFLElBQUksRUFBRUMsTUFBTSxFQUFFLENBQUUsTUFBTSxDQUFFLEVBQUUsSUFBSyxDQUFDO01BQzVELENBQUUsQ0FBQztNQUVId0csT0FBTyxDQUFDQyxHQUFHLENBQUUsdUNBQXdDLENBQUM7TUFDdEQsTUFBTVMsY0FBYyxHQUFHLENBQUUsTUFBTTlILGlCQUFpQixDQUFFO1FBQ2hEK0gsTUFBTSxFQUFFLElBQUk7UUFDWkMsTUFBTSxFQUFFO01BQ1YsQ0FBRSxDQUFDLEVBQUdoRixNQUFNLENBQUUwRSxPQUFPLElBQUlBLE9BQU8sQ0FBQ0ssTUFBTSxJQUFJTCxPQUFPLENBQUNNLE1BQU8sQ0FBQyxDQUFDN0UsR0FBRyxDQUFFdUUsT0FBTyxJQUFJO1FBQzFFLElBQUk5RyxNQUFNLEdBQUksR0FBRThHLE9BQU8sQ0FBQ08sWUFBYSxJQUFHUCxPQUFPLENBQUNRLFlBQWEsRUFBQztRQUM5RCxJQUFLUixPQUFPLENBQUNTLGFBQWEsQ0FBQ0MsTUFBTSxFQUFHO1VBQ2xDeEgsTUFBTSxJQUFLLElBQUc4RyxPQUFPLENBQUNTLGFBQWMsRUFBQyxDQUFDLENBQUM7UUFDekM7UUFDQSxPQUFPLElBQUkxSCxhQUFhLENBQUVpSCxPQUFPLENBQUNDLElBQUksRUFBRS9HLE1BQU0sRUFBRSxDQUFFLFNBQVMsQ0FBRSxFQUFFLElBQUssQ0FBQztNQUN2RSxDQUFFLENBQUM7TUFFSHdHLE9BQU8sQ0FBQ0MsR0FBRyxDQUFFLG9DQUFxQyxDQUFDO01BQ25ELE1BQU1nQixrQkFBa0IsR0FBRyxFQUFFO01BQzdCLEtBQU0sTUFBTTFILElBQUksSUFBSWxDLGFBQWEsQ0FBQyxDQUFDLEVBQUc7UUFFcEM7UUFDQSxJQUFLd0QsSUFBSSxDQUFDQyxLQUFLLENBQUUvQixFQUFFLENBQUNnQyxZQUFZLENBQUcsTUFBS3hCLElBQUssZUFBYyxFQUFFLE1BQU8sQ0FBRSxDQUFDLENBQUMySCxJQUFJLENBQUNDLHFDQUFxQyxFQUFHO1VBQ25IO1FBQ0Y7UUFFQSxNQUFNQyxRQUFRLEdBQUcsTUFBTTdKLFdBQVcsQ0FBRWdDLElBQUssQ0FBQztRQUMxQyxNQUFNOEgsZ0JBQWdCLEdBQUdqQixZQUFZLENBQUNrQixNQUFNLENBQUVaLGNBQWUsQ0FBQztRQUU5RCxLQUFNLE1BQU1sSCxNQUFNLElBQUk0SCxRQUFRLEVBQUc7VUFDL0I7VUFDQTtVQUNBLElBQUtDLGdCQUFnQixDQUFDekYsTUFBTSxDQUFFNUIsYUFBYSxJQUFJQSxhQUFhLENBQUNULElBQUksS0FBS0EsSUFBSSxJQUFJUyxhQUFhLENBQUNSLE1BQU0sS0FBS0EsTUFBTyxDQUFDLENBQUN3SCxNQUFNLEVBQUc7WUFDdkg7VUFDRjtVQUVBLE1BQU1PLEtBQUssR0FBRy9ILE1BQU0sQ0FBQytILEtBQUssQ0FBRSxnQkFBaUIsQ0FBQztVQUU5QyxJQUFLQSxLQUFLLEVBQUc7WUFDWCxNQUFNcEMsS0FBSyxHQUFHcUMsTUFBTSxDQUFFRCxLQUFLLENBQUUsQ0FBQyxDQUFHLENBQUM7WUFDbEMsTUFBTW5DLEtBQUssR0FBR29DLE1BQU0sQ0FBRUQsS0FBSyxDQUFFLENBQUMsQ0FBRyxDQUFDOztZQUVsQztZQUNBLE1BQU1FLGVBQWUsR0FBR3ZCLGlCQUFpQixDQUFDRyxRQUFRLENBQUNxQixJQUFJLENBQUVDLE9BQU8sSUFBSUEsT0FBTyxDQUFDcEIsSUFBSSxLQUFNLFFBQU9oSCxJQUFLLEVBQUUsQ0FBQyxJQUFJLElBQUk7WUFDN0csTUFBTXFJLGlCQUFpQixHQUFHSCxlQUFlLEdBQUdBLGVBQWUsQ0FBQzlCLE9BQU8sR0FBRyxJQUFJO1lBRTFFLElBQUssQ0FBQ2lDLGlCQUFpQixJQUNsQnpDLEtBQUssR0FBR3lDLGlCQUFpQixDQUFDekMsS0FBSyxJQUM3QkEsS0FBSyxLQUFLeUMsaUJBQWlCLENBQUN6QyxLQUFLLElBQUlDLEtBQUssR0FBR3dDLGlCQUFpQixDQUFDeEMsS0FBTyxFQUFHO2NBRTlFO2NBQ0EsTUFBTXlDLGFBQWEsR0FBR2hILElBQUksQ0FBQ0MsS0FBSyxDQUFFLE1BQU1sRCxlQUFlLENBQUUyQixJQUFJLEVBQUVDLE1BQU0sRUFBRSxjQUFlLENBQUUsQ0FBQztjQUN6RixNQUFNc0ksY0FBYyxHQUFHRCxhQUFhLENBQUNYLElBQUksSUFBSVcsYUFBYSxDQUFDWCxJQUFJLENBQUNhLGVBQWUsSUFBSUYsYUFBYSxDQUFDWCxJQUFJLENBQUNhLGVBQWUsQ0FBQ3JELFFBQVEsQ0FBRSxTQUFVLENBQUM7Y0FFM0ksTUFBTWpGLE1BQU0sR0FBRyxDQUNiLE1BQU07Y0FBRTtjQUNSLElBQUtxSSxjQUFjLEdBQUcsQ0FBRSxTQUFTLENBQUUsR0FBRyxFQUFFLENBQUUsQ0FDM0M7Y0FFRCxJQUFLLENBQUNELGFBQWEsQ0FBQ1gsSUFBSSxDQUFDQyxxQ0FBcUMsRUFBRztnQkFDL0RGLGtCQUFrQixDQUFDN0MsSUFBSSxDQUFFLElBQUkvRSxhQUFhLENBQUVFLElBQUksRUFBRUMsTUFBTSxFQUFFQyxNQUFNLEVBQUUsS0FBTSxDQUFFLENBQUM7Y0FDN0U7WUFDRjtVQUNGO1FBQ0Y7TUFDRjtNQUVBLE1BQU11SSxrQkFBa0IsR0FBRzNJLGFBQWEsQ0FBQzRJLFlBQVksQ0FBRSxDQUFFLEdBQUc3QixZQUFZLEVBQUUsR0FBR00sY0FBYyxFQUFFLEdBQUdPLGtCQUFrQixDQUFHLENBQUM7O01BRXRIO01BQ0EsT0FBT2Usa0JBQWtCLENBQUNwRyxNQUFNLENBQUVzRyxFQUFFLElBQUksRUFBR0EsRUFBRSxDQUFDM0ksSUFBSSxLQUFLLDBCQUEwQixJQUFJMkksRUFBRSxDQUFDMUksTUFBTSxLQUFLLFlBQVksQ0FBRyxDQUFDO0lBQ3JIOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxPQUFPeUksWUFBWUEsQ0FBRUUsV0FBVyxFQUFHO01BQ2pDLE1BQU1DLGNBQWMsR0FBRyxFQUFFO01BRXpCLEtBQU0sTUFBTUMsU0FBUyxJQUFJRixXQUFXLEVBQUc7UUFDckMsSUFBSUcsV0FBVyxHQUFHLEtBQUs7UUFDdkIsS0FBTSxNQUFNQyxZQUFZLElBQUlILGNBQWMsRUFBRztVQUMzQyxJQUFLQyxTQUFTLENBQUM5SSxJQUFJLEtBQUtnSixZQUFZLENBQUNoSixJQUFJLElBQUk4SSxTQUFTLENBQUM3SSxNQUFNLEtBQUsrSSxZQUFZLENBQUMvSSxNQUFNLEVBQUc7WUFDdEY4SSxXQUFXLEdBQUcsSUFBSTtZQUNsQkMsWUFBWSxDQUFDOUksTUFBTSxHQUFHLENBQUUsR0FBRzhJLFlBQVksQ0FBQzlJLE1BQU0sRUFBRSxHQUFHNEksU0FBUyxDQUFDNUksTUFBTSxDQUFFO1lBQ3JFO1VBQ0Y7UUFDRjtRQUNBLElBQUssQ0FBQzZJLFdBQVcsRUFBRztVQUNsQkYsY0FBYyxDQUFDaEUsSUFBSSxDQUFFaUUsU0FBVSxDQUFDO1FBQ2xDO01BQ0Y7TUFFQUQsY0FBYyxDQUFDSSxJQUFJLENBQUUsQ0FBRUMsQ0FBQyxFQUFFQyxDQUFDLEtBQU07UUFDL0IsSUFBS0QsQ0FBQyxDQUFDbEosSUFBSSxLQUFLbUosQ0FBQyxDQUFDbkosSUFBSSxFQUFHO1VBQ3ZCLE9BQU9rSixDQUFDLENBQUNsSixJQUFJLEdBQUdtSixDQUFDLENBQUNuSixJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUNqQztRQUNBLElBQUtrSixDQUFDLENBQUNqSixNQUFNLEtBQUtrSixDQUFDLENBQUNsSixNQUFNLEVBQUc7VUFDM0IsT0FBT2lKLENBQUMsQ0FBQ2pKLE1BQU0sR0FBR2tKLENBQUMsQ0FBQ2xKLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3JDO1FBQ0EsT0FBTyxDQUFDO01BQ1YsQ0FBRSxDQUFDO01BRUgsT0FBTzRJLGNBQWM7SUFDdkI7RUFDRjtFQUVBLE9BQU8vSSxhQUFhO0FBQ3RCLENBQUMsQ0FBRyxDQUFDIiwiaWdub3JlTGlzdCI6W119