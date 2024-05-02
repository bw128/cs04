// Copyright 2021, University of Colorado Boulder

/**
 * A fast-running status check. NOTE: Only checks the local status, does NOT check the server. Use the full status for
 * that if needed.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('../common/execute');
const getActiveRepos = require('../common/getActiveRepos');
const gitRevParse = require('../common/gitRevParse');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
winston.default.transports.console.level = 'error';

// ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
const moveRight = ' \u001b[42G';
const red = '\u001b[31m';
const green = '\u001b[32m';
const reset = '\u001b[0m';
const repos = getActiveRepos();
const data = {};
const getStatus = async repo => {
  data[repo] = '';
  const symbolicRef = (await execute('git', ['symbolic-ref', '-q', 'HEAD'], `../${repo}`)).trim();
  const branch = symbolicRef.replace('refs/heads/', ''); // might be empty string
  const sha = await gitRevParse(repo, 'HEAD');
  const status = await execute('git', ['status', '--porcelain'], `../${repo}`);
  const track = branch ? (await execute('git', ['for-each-ref', '--format=%(push:track,nobracket)', symbolicRef], `../${repo}`)).trim() : '';
  let isGreen = false;
  if (branch) {
    isGreen = !status && branch === 'main' && !track.length;
    if (!isGreen || process.argv.includes('--all')) {
      data[repo] += `${repo}${moveRight}${isGreen ? green : red}${branch}${reset} ${track}\n`;
    }
  } else {
    // if no branch, print our SHA (detached head)
    data[repo] += `${repo}${moveRight}${red}${sha}${reset}\n`;
  }
  if (status) {
    if (!isGreen || process.argv.includes('--all')) {
      data[repo] += status + '\n';
    }
  }
};
(async () => {
  await Promise.all(repos.map(repo => getStatus(repo)));
  repos.forEach(repo => {
    process.stdout.write(data[repo]);
  });
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImdldEFjdGl2ZVJlcG9zIiwiZ2l0UmV2UGFyc2UiLCJ3aW5zdG9uIiwiZGVmYXVsdCIsInRyYW5zcG9ydHMiLCJjb25zb2xlIiwibGV2ZWwiLCJtb3ZlUmlnaHQiLCJyZWQiLCJncmVlbiIsInJlc2V0IiwicmVwb3MiLCJkYXRhIiwiZ2V0U3RhdHVzIiwicmVwbyIsInN5bWJvbGljUmVmIiwidHJpbSIsImJyYW5jaCIsInJlcGxhY2UiLCJzaGEiLCJzdGF0dXMiLCJ0cmFjayIsImlzR3JlZW4iLCJsZW5ndGgiLCJwcm9jZXNzIiwiYXJndiIsImluY2x1ZGVzIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImZvckVhY2giLCJzdGRvdXQiLCJ3cml0ZSJdLCJzb3VyY2VzIjpbInF1aWNrLXN0YXR1cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBmYXN0LXJ1bm5pbmcgc3RhdHVzIGNoZWNrLiBOT1RFOiBPbmx5IGNoZWNrcyB0aGUgbG9jYWwgc3RhdHVzLCBkb2VzIE5PVCBjaGVjayB0aGUgc2VydmVyLiBVc2UgdGhlIGZ1bGwgc3RhdHVzIGZvclxyXG4gKiB0aGF0IGlmIG5lZWRlZC5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL2V4ZWN1dGUnICk7XHJcbmNvbnN0IGdldEFjdGl2ZVJlcG9zID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRBY3RpdmVSZXBvcycgKTtcclxuY29uc3QgZ2l0UmV2UGFyc2UgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdFJldlBhcnNlJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcblxyXG53aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID0gJ2Vycm9yJztcclxuXHJcbi8vIEFOU0kgZXNjYXBlIHNlcXVlbmNlcyB0byBtb3ZlIHRvIHRoZSByaWdodCAoaW4gdGhlIHNhbWUgbGluZSkgb3IgdG8gYXBwbHkgb3IgcmVzZXQgY29sb3JzXHJcbmNvbnN0IG1vdmVSaWdodCA9ICcgXFx1MDAxYls0MkcnO1xyXG5jb25zdCByZWQgPSAnXFx1MDAxYlszMW0nO1xyXG5jb25zdCBncmVlbiA9ICdcXHUwMDFiWzMybSc7XHJcbmNvbnN0IHJlc2V0ID0gJ1xcdTAwMWJbMG0nO1xyXG5cclxuY29uc3QgcmVwb3MgPSBnZXRBY3RpdmVSZXBvcygpO1xyXG5jb25zdCBkYXRhID0ge307XHJcblxyXG5jb25zdCBnZXRTdGF0dXMgPSBhc3luYyByZXBvID0+IHtcclxuICBkYXRhWyByZXBvIF0gPSAnJztcclxuXHJcbiAgY29uc3Qgc3ltYm9saWNSZWYgPSAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdzeW1ib2xpYy1yZWYnLCAnLXEnLCAnSEVBRCcgXSwgYC4uLyR7cmVwb31gICkgKS50cmltKCk7XHJcbiAgY29uc3QgYnJhbmNoID0gc3ltYm9saWNSZWYucmVwbGFjZSggJ3JlZnMvaGVhZHMvJywgJycgKTsgLy8gbWlnaHQgYmUgZW1wdHkgc3RyaW5nXHJcbiAgY29uc3Qgc2hhID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHJlcG8sICdIRUFEJyApO1xyXG4gIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdzdGF0dXMnLCAnLS1wb3JjZWxhaW4nIF0sIGAuLi8ke3JlcG99YCApO1xyXG4gIGNvbnN0IHRyYWNrID0gYnJhbmNoID8gKCBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnZm9yLWVhY2gtcmVmJywgJy0tZm9ybWF0PSUocHVzaDp0cmFjayxub2JyYWNrZXQpJywgc3ltYm9saWNSZWYgXSwgYC4uLyR7cmVwb31gICkgKS50cmltKCkgOiAnJztcclxuXHJcbiAgbGV0IGlzR3JlZW4gPSBmYWxzZTtcclxuICBpZiAoIGJyYW5jaCApIHtcclxuICAgIGlzR3JlZW4gPSAhc3RhdHVzICYmIGJyYW5jaCA9PT0gJ21haW4nICYmICF0cmFjay5sZW5ndGg7XHJcblxyXG4gICAgaWYgKCAhaXNHcmVlbiB8fCBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoICctLWFsbCcgKSApIHtcclxuICAgICAgZGF0YVsgcmVwbyBdICs9IGAke3JlcG99JHttb3ZlUmlnaHR9JHtpc0dyZWVuID8gZ3JlZW4gOiByZWR9JHticmFuY2h9JHtyZXNldH0gJHt0cmFja31cXG5gO1xyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIC8vIGlmIG5vIGJyYW5jaCwgcHJpbnQgb3VyIFNIQSAoZGV0YWNoZWQgaGVhZClcclxuICAgIGRhdGFbIHJlcG8gXSArPSBgJHtyZXBvfSR7bW92ZVJpZ2h0fSR7cmVkfSR7c2hhfSR7cmVzZXR9XFxuYDtcclxuICB9XHJcblxyXG4gIGlmICggc3RhdHVzICkge1xyXG4gICAgaWYgKCAhaXNHcmVlbiB8fCBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoICctLWFsbCcgKSApIHtcclxuICAgICAgZGF0YVsgcmVwbyBdICs9IHN0YXR1cyArICdcXG4nO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbiggYXN5bmMgKCkgPT4ge1xyXG4gIGF3YWl0IFByb21pc2UuYWxsKCByZXBvcy5tYXAoIHJlcG8gPT4gZ2V0U3RhdHVzKCByZXBvICkgKSApO1xyXG4gIHJlcG9zLmZvckVhY2goIHJlcG8gPT4ge1xyXG4gICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoIGRhdGFbIHJlcG8gXSApO1xyXG4gIH0gKTtcclxufSApKCk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsbUJBQW9CLENBQUM7QUFDOUMsTUFBTUMsY0FBYyxHQUFHRCxPQUFPLENBQUUs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