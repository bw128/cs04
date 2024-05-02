// Copyright 2021, University of Colorado Boulder

const execute = require('../common/execute');
const booleanPrompt = require('../common/booleanPrompt');

/**
 * Copy the history of a file or directory to a different repo.
 *
 * ### REQUIREMENT: `git filter-repo`############################################
 * ###
 * ### This process requires the command `git filter-repo`, which is recommended by the git documentation as an improvement
 * ### over `git filter-branch`, https://git-scm.com/docs/git-filter-branch#_warning. I used `git --exec-path` to see the
 * ### path for auxiliary git commands.
 * ###
 * ### On my mac it was `/Library/Developer/CommandLineTools/usr/libexec/git-core`
 * ### On my win it was `/C/Program\ Files/Git/mingw64/libexec/git-core`
 * ###
 * ### Installing `git filter-repo` on Windows consisted of these steps:
 * ### 1. Install python and confirm it is in the path and works from the command line
 * ### 2. Copy the raw contents of https://github.com/newren/git-filter-repo/blob/main/git-filter-repo into a file "git-filter-repo" in the --exec-path (it is easiest to write a file to you desktop and then click and drag the file into the admin-protected directory
 * ### 3. If your system uses "python" instead of "python3", change that in the 1st line of the file.
 * ### 4. Test using "git filter-repo", if it is installed correctly it will say something like: "No arguments specified"
 * ###
 * ### More instructions about installing are listed here:
 * ### https://github.com/newren/git-filter-repo#how-do-i-install-it
 * ##############################################################################
 *
 * USAGE:
 * node perennial/js/scripts/copy-history-to-different-repo source-path destination-repo
 *
 * EXAMPLE:
 * node perennial/js/scripts/copy-history-to-different-repo center-and-variability/js/common/view/QuestionBar.ts scenery-phet
 * node perennial/js/scripts/copy-history-to-different-repo counting-common/js/ number-suite-common
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
(async () => {
  const args = process.argv.slice(2);
  const sourceRepo = args[0].split('/')[0];
  const relativePath = args[0].split('/').slice(1).join('/');
  const targetRepo = args[1];
  console.log(`Copying ${relativePath} from ${sourceRepo} to ${targetRepo}`);

  // git log --oneline --follow -M --name-status -- js/ABSwitch.ts
  // const stdout = await execute( 'git', `log --oneline --follow -M --name-status -- ${relativePath}`.split( ' ' ), `./perennial/${sourceRepo}` );
  const gitlog = await execute('git', `log --oneline --follow -M --name-status -- ${relativePath}`.split(' '), `./${sourceRepo}`);
  const allFilenames = new Set();
  gitlog.split('\n').forEach(line => {
    if (line.length > 0 &&
    // Catch lines that start with an uppercase letter
    line[0].toUpperCase() === line[0] &&
    // Avoid lines that do not start with a letter.  Only letters have uppercase and lowercase
    line[0].toUpperCase() !== line[0].toLowerCase()) {
      const terms = line.split('\t');
      const filenamesFromTerm = terms.slice(1);
      filenamesFromTerm.forEach(filenameFromTerm => {
        allFilenames.add(filenameFromTerm);
      });
    }
  });
  const filenameArray = Array.from(allFilenames.values());
  console.log(filenameArray.join('\n'));

  // git clone https://github.com/phetsims/vegas.git vegas-backup
  const historyCopyRepo = `${sourceRepo}-history-copy`;
  await execute('git', `clone -b main --single-branch https://github.com/phetsims/${sourceRepo}.git ${historyCopyRepo}`.split(' '), '.');
  const filterArgs = ['filter-repo'];
  filenameArray.forEach(filename => {
    filterArgs.push('--path');
    filterArgs.push(filename);
  });
  console.log(filterArgs.join(' '));
  const filterResults = await execute('git', filterArgs, historyCopyRepo);
  console.log(filterResults);
  if (!(await booleanPrompt(`Please inspect the filtered repo ${historyCopyRepo} to make sure it is ready for 
  merging. It should include all detected files:\n\n${filenameArray.join('\n')}\nWant to merge into ${targetRepo}?`, false))) {
    console.log('Aborted');
    return;
  }
  await execute('git', `remote add ${historyCopyRepo} ../${historyCopyRepo}`.split(' '), `./${targetRepo}`);
  await execute('git', `fetch ${historyCopyRepo}`.split(' '), `./${targetRepo}`);
  await execute('git', `merge ${historyCopyRepo}/main --allow-unrelated`.split(' '), `./${targetRepo}`);
  await execute('git', `remote remove ${historyCopyRepo}`.split(' '), `./${targetRepo}`);
  const aboutToPush = await execute('git', 'diff --stat --cached origin/main'.split(' '), `./${targetRepo}`);
  console.log('About to push: ' + aboutToPush);
  const unpushedCommits = await execute('git', 'log origin/main..main'.split(' '), `./${targetRepo}`);
  console.log(unpushedCommits);
  console.log(`Merged into target repo ${targetRepo}. The remaining steps are manual:   
* Inspect the merged repo ${targetRepo} files and history and see if the result looks good.
* Delete the temporary cloned repo: rm -rf ${historyCopyRepo}
* Update the namespace and registry statement, if appropriate.
* Move the file to the desired directory.
* Type check, lint and test the new code.
* If the history, file, type checks and lint all seem good, git push the changes. (otherwise re-clone).
* Delete the copy in the prior directory. In the commit message, refer to an issue so there is a paper trail.
`);
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImJvb2xlYW5Qcm9tcHQiLCJhcmdzIiwicHJvY2VzcyIsImFyZ3YiLCJzbGljZSIsInNvdXJjZVJlcG8iLCJzcGxpdCIsInJlbGF0aXZlUGF0aCIsImpvaW4iLCJ0YXJnZXRSZXBvIiwiY29uc29sZSIsImxvZyIsImdpdGxvZyIsImFsbEZpbGVuYW1lcyIsIlNldCIsImZvckVhY2giLCJsaW5lIiwibGVuZ3RoIiwidG9VcHBlckNhc2UiLCJ0b0xvd2VyQ2FzZSIsInRlcm1zIiwiZmlsZW5hbWVzRnJvbVRlcm0iLCJmaWxlbmFtZUZyb21UZXJtIiwiYWRkIiwiZmlsZW5hbWVBcnJheSIsIkFycmF5IiwiZnJvbSIsInZhbHVlcyIsImhpc3RvcnlDb3B5UmVwbyIsImZpbHRlckFyZ3MiLCJmaWxlbmFtZSIsInB1c2giLCJmaWx0ZXJSZXN1bHRzIiwiYWJvdXRUb1B1c2giLCJ1bnB1c2hlZENvbW1pdHMiXSwic291cmNlcyI6WyJjb3B5LWhpc3RvcnktdG8tZGlmZmVyZW50LXJlcG8uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuLi9jb21tb24vZXhlY3V0ZScgKTtcclxuY29uc3QgYm9vbGVhblByb21wdCA9IHJlcXVpcmUoICcuLi9jb21tb24vYm9vbGVhblByb21wdCcgKTtcclxuXHJcbi8qKlxyXG4gKiBDb3B5IHRoZSBoaXN0b3J5IG9mIGEgZmlsZSBvciBkaXJlY3RvcnkgdG8gYSBkaWZmZXJlbnQgcmVwby5cclxuICpcclxuICogIyMjIFJFUVVJUkVNRU5UOiBgZ2l0IGZpbHRlci1yZXBvYCMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXHJcbiAqICMjI1xyXG4gKiAjIyMgVGhpcyBwcm9jZXNzIHJlcXVpcmVzIHRoZSBjb21tYW5kIGBnaXQgZmlsdGVyLXJlcG9gLCB3aGljaCBpcyByZWNvbW1lbmRlZCBieSB0aGUgZ2l0IGRvY3VtZW50YXRpb24gYXMgYW4gaW1wcm92ZW1lbnRcclxuICogIyMjIG92ZXIgYGdpdCBmaWx0ZXItYnJhbmNoYCwgaHR0cHM6Ly9naXQtc2NtLmNvbS9kb2NzL2dpdC1maWx0ZXItYnJhbmNoI193YXJuaW5nLiBJIHVzZWQgYGdpdCAtLWV4ZWMtcGF0aGAgdG8gc2VlIHRoZVxyXG4gKiAjIyMgcGF0aCBmb3IgYXV4aWxpYXJ5IGdpdCBjb21tYW5kcy5cclxuICogIyMjXHJcbiAqICMjIyBPbiBteSBtYWMgaXQgd2FzIGAvTGlicmFyeS9EZXZlbG9wZXIvQ29tbWFuZExpbmVUb29scy91c3IvbGliZXhlYy9naXQtY29yZWBcclxuICogIyMjIE9uIG15IHdpbiBpdCB3YXMgYC9DL1Byb2dyYW1cXCBGaWxlcy9HaXQvbWluZ3c2NC9saWJleGVjL2dpdC1jb3JlYFxyXG4gKiAjIyNcclxuICogIyMjIEluc3RhbGxpbmcgYGdpdCBmaWx0ZXItcmVwb2Agb24gV2luZG93cyBjb25zaXN0ZWQgb2YgdGhlc2Ugc3RlcHM6XHJcbiAqICMjIyAxLiBJbnN0YWxsIHB5dGhvbiBhbmQgY29uZmlybSBpdCBpcyBpbiB0aGUgcGF0aCBhbmQgd29ya3MgZnJvbSB0aGUgY29tbWFuZCBsaW5lXHJcbiAqICMjIyAyLiBDb3B5IHRoZSByYXcgY29udGVudHMgb2YgaHR0cHM6Ly9naXRodWIuY29tL25ld3Jlbi9naXQtZmlsdGVyLXJlcG8vYmxvYi9tYWluL2dpdC1maWx0ZXItcmVwbyBpbnRvIGEgZmlsZSBcImdpdC1maWx0ZXItcmVwb1wiIGluIHRoZSAtLWV4ZWMtcGF0aCAoaXQgaXMgZWFzaWVzdCB0byB3cml0ZSBhIGZpbGUgdG8geW91IGRlc2t0b3AgYW5kIHRoZW4gY2xpY2sgYW5kIGRyYWcgdGhlIGZpbGUgaW50byB0aGUgYWRtaW4tcHJvdGVjdGVkIGRpcmVjdG9yeVxyXG4gKiAjIyMgMy4gSWYgeW91ciBzeXN0ZW0gdXNlcyBcInB5dGhvblwiIGluc3RlYWQgb2YgXCJweXRob24zXCIsIGNoYW5nZSB0aGF0IGluIHRoZSAxc3QgbGluZSBvZiB0aGUgZmlsZS5cclxuICogIyMjIDQuIFRlc3QgdXNpbmcgXCJnaXQgZmlsdGVyLXJlcG9cIiwgaWYgaXQgaXMgaW5zdGFsbGVkIGNvcnJlY3RseSBpdCB3aWxsIHNheSBzb21ldGhpbmcgbGlrZTogXCJObyBhcmd1bWVudHMgc3BlY2lmaWVkXCJcclxuICogIyMjXHJcbiAqICMjIyBNb3JlIGluc3RydWN0aW9ucyBhYm91dCBpbnN0YWxsaW5nIGFyZSBsaXN0ZWQgaGVyZTpcclxuICogIyMjIGh0dHBzOi8vZ2l0aHViLmNvbS9uZXdyZW4vZ2l0LWZpbHRlci1yZXBvI2hvdy1kby1pLWluc3RhbGwtaXRcclxuICogIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXHJcbiAqXHJcbiAqIFVTQUdFOlxyXG4gKiBub2RlIHBlcmVubmlhbC9qcy9zY3JpcHRzL2NvcHktaGlzdG9yeS10by1kaWZmZXJlbnQtcmVwbyBzb3VyY2UtcGF0aCBkZXN0aW5hdGlvbi1yZXBvXHJcbiAqXHJcbiAqIEVYQU1QTEU6XHJcbiAqIG5vZGUgcGVyZW5uaWFsL2pzL3NjcmlwdHMvY29weS1oaXN0b3J5LXRvLWRpZmZlcmVudC1yZXBvIGNlbnRlci1hbmQtdmFyaWFiaWxpdHkvanMvY29tbW9uL3ZpZXcvUXVlc3Rpb25CYXIudHMgc2NlbmVyeS1waGV0XHJcbiAqIG5vZGUgcGVyZW5uaWFsL2pzL3NjcmlwdHMvY29weS1oaXN0b3J5LXRvLWRpZmZlcmVudC1yZXBvIGNvdW50aW5nLWNvbW1vbi9qcy8gbnVtYmVyLXN1aXRlLWNvbW1vblxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIENocmlzIEtsdXNlbmRvcmYgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG4oIGFzeW5jICgpID0+IHtcclxuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKCAyICk7XHJcblxyXG4gIGNvbnN0IHNvdXJjZVJlcG8gPSBhcmdzWyAwIF0uc3BsaXQoICcvJyApWyAwIF07XHJcbiAgY29uc3QgcmVsYXRpdmVQYXRoID0gYXJnc1sgMCBdLnNwbGl0KCAnLycgKS5zbGljZSggMSApLmpvaW4oICcvJyApO1xyXG5cclxuICBjb25zdCB0YXJnZXRSZXBvID0gYXJnc1sgMSBdO1xyXG5cclxuICBjb25zb2xlLmxvZyggYENvcHlpbmcgJHtyZWxhdGl2ZVBhdGh9IGZyb20gJHtzb3VyY2VSZXBvfSB0byAke3RhcmdldFJlcG99YCApO1xyXG5cclxuICAvLyBnaXQgbG9nIC0tb25lbGluZSAtLWZvbGxvdyAtTSAtLW5hbWUtc3RhdHVzIC0tIGpzL0FCU3dpdGNoLnRzXHJcbiAgLy8gY29uc3Qgc3Rkb3V0ID0gYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIGBsb2cgLS1vbmVsaW5lIC0tZm9sbG93IC1NIC0tbmFtZS1zdGF0dXMgLS0gJHtyZWxhdGl2ZVBhdGh9YC5zcGxpdCggJyAnICksIGAuL3BlcmVubmlhbC8ke3NvdXJjZVJlcG99YCApO1xyXG4gIGNvbnN0IGdpdGxvZyA9IGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBgbG9nIC0tb25lbGluZSAtLWZvbGxvdyAtTSAtLW5hbWUtc3RhdHVzIC0tICR7cmVsYXRpdmVQYXRofWAuc3BsaXQoICcgJyApLCBgLi8ke3NvdXJjZVJlcG99YCApO1xyXG5cclxuICBjb25zdCBhbGxGaWxlbmFtZXMgPSBuZXcgU2V0KCk7XHJcbiAgZ2l0bG9nLnNwbGl0KCAnXFxuJyApLmZvckVhY2goIGxpbmUgPT4ge1xyXG4gICAgaWYgKCBsaW5lLmxlbmd0aCA+IDAgJiZcclxuXHJcbiAgICAgICAgIC8vIENhdGNoIGxpbmVzIHRoYXQgc3RhcnQgd2l0aCBhbiB1cHBlcmNhc2UgbGV0dGVyXHJcbiAgICAgICAgIGxpbmVbIDAgXS50b1VwcGVyQ2FzZSgpID09PSBsaW5lWyAwIF0gJiZcclxuXHJcbiAgICAgICAgIC8vIEF2b2lkIGxpbmVzIHRoYXQgZG8gbm90IHN0YXJ0IHdpdGggYSBsZXR0ZXIuICBPbmx5IGxldHRlcnMgaGF2ZSB1cHBlcmNhc2UgYW5kIGxvd2VyY2FzZVxyXG4gICAgICAgICBsaW5lWyAwIF0udG9VcHBlckNhc2UoKSAhPT0gbGluZVsgMCBdLnRvTG93ZXJDYXNlKClcclxuICAgICkge1xyXG4gICAgICBjb25zdCB0ZXJtcyA9IGxpbmUuc3BsaXQoICdcXHQnICk7XHJcbiAgICAgIGNvbnN0IGZpbGVuYW1lc0Zyb21UZXJtID0gdGVybXMuc2xpY2UoIDEgKTtcclxuXHJcbiAgICAgIGZpbGVuYW1lc0Zyb21UZXJtLmZvckVhY2goIGZpbGVuYW1lRnJvbVRlcm0gPT4ge1xyXG4gICAgICAgIGFsbEZpbGVuYW1lcy5hZGQoIGZpbGVuYW1lRnJvbVRlcm0gKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgZmlsZW5hbWVBcnJheSA9IEFycmF5LmZyb20oIGFsbEZpbGVuYW1lcy52YWx1ZXMoKSApO1xyXG4gIGNvbnNvbGUubG9nKCBmaWxlbmFtZUFycmF5LmpvaW4oICdcXG4nICkgKTtcclxuXHJcbiAgLy8gZ2l0IGNsb25lIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWdhcy5naXQgdmVnYXMtYmFja3VwXHJcbiAgY29uc3QgaGlzdG9yeUNvcHlSZXBvID0gYCR7c291cmNlUmVwb30taGlzdG9yeS1jb3B5YDtcclxuICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgYGNsb25lIC1iIG1haW4gLS1zaW5nbGUtYnJhbmNoIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy8ke3NvdXJjZVJlcG99LmdpdCAke2hpc3RvcnlDb3B5UmVwb31gLnNwbGl0KCAnICcgKSwgJy4nICk7XHJcblxyXG4gIGNvbnN0IGZpbHRlckFyZ3MgPSBbICdmaWx0ZXItcmVwbycgXTtcclxuICBmaWxlbmFtZUFycmF5LmZvckVhY2goIGZpbGVuYW1lID0+IHtcclxuICAgIGZpbHRlckFyZ3MucHVzaCggJy0tcGF0aCcgKTtcclxuICAgIGZpbHRlckFyZ3MucHVzaCggZmlsZW5hbWUgKTtcclxuICB9ICk7XHJcbiAgY29uc29sZS5sb2coIGZpbHRlckFyZ3Muam9pbiggJyAnICkgKTtcclxuICBjb25zdCBmaWx0ZXJSZXN1bHRzID0gYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIGZpbHRlckFyZ3MsIGhpc3RvcnlDb3B5UmVwbyApO1xyXG5cclxuICBjb25zb2xlLmxvZyggZmlsdGVyUmVzdWx0cyApO1xyXG5cclxuICBpZiAoICFhd2FpdCBib29sZWFuUHJvbXB0KCBgUGxlYXNlIGluc3BlY3QgdGhlIGZpbHRlcmVkIHJlcG8gJHtoaXN0b3J5Q29weVJlcG99IHRvIG1ha2Ugc3VyZSBpdCBpcyByZWFkeSBmb3IgXHJcbiAgbWVyZ2luZy4gSXQgc2hvdWxkIGluY2x1ZGUgYWxsIGRldGVjdGVkIGZpbGVzOlxcblxcbiR7ZmlsZW5hbWVBcnJheS5qb2luKCAnXFxuJyApfVxcbldhbnQgdG8gbWVyZ2UgaW50byAke3RhcmdldFJlcG99P2AsIGZhbHNlICkgKSB7XHJcbiAgICBjb25zb2xlLmxvZyggJ0Fib3J0ZWQnICk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgYHJlbW90ZSBhZGQgJHtoaXN0b3J5Q29weVJlcG99IC4uLyR7aGlzdG9yeUNvcHlSZXBvfWAuc3BsaXQoICcgJyApLCBgLi8ke3RhcmdldFJlcG99YCApO1xyXG4gIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBgZmV0Y2ggJHtoaXN0b3J5Q29weVJlcG99YC5zcGxpdCggJyAnICksIGAuLyR7dGFyZ2V0UmVwb31gICk7XHJcbiAgYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIGBtZXJnZSAke2hpc3RvcnlDb3B5UmVwb30vbWFpbiAtLWFsbG93LXVucmVsYXRlZGAuc3BsaXQoICcgJyApLCBgLi8ke3RhcmdldFJlcG99YCApO1xyXG4gIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBgcmVtb3RlIHJlbW92ZSAke2hpc3RvcnlDb3B5UmVwb31gLnNwbGl0KCAnICcgKSwgYC4vJHt0YXJnZXRSZXBvfWAgKTtcclxuXHJcbiAgY29uc3QgYWJvdXRUb1B1c2ggPSBhd2FpdCBleGVjdXRlKCAnZ2l0JywgJ2RpZmYgLS1zdGF0IC0tY2FjaGVkIG9yaWdpbi9tYWluJy5zcGxpdCggJyAnICksIGAuLyR7dGFyZ2V0UmVwb31gICk7XHJcbiAgY29uc29sZS5sb2coICdBYm91dCB0byBwdXNoOiAnICsgYWJvdXRUb1B1c2ggKTtcclxuXHJcbiAgY29uc3QgdW5wdXNoZWRDb21taXRzID0gYXdhaXQgZXhlY3V0ZSggJ2dpdCcsICdsb2cgb3JpZ2luL21haW4uLm1haW4nLnNwbGl0KCAnICcgKSwgYC4vJHt0YXJnZXRSZXBvfWAgKTtcclxuICBjb25zb2xlLmxvZyggdW5wdXNoZWRDb21taXRzICk7XHJcblxyXG4gIGNvbnNvbGUubG9nKFxyXG4gICAgYE1lcmdlZCBpbnRvIHRhcmdldCByZXBvICR7dGFyZ2V0UmVwb30uIFRoZSByZW1haW5pbmcgc3RlcHMgYXJlIG1hbnVhbDogICBcclxuKiBJbnNwZWN0IHRoZSBtZXJnZWQgcmVwbyAke3RhcmdldFJlcG99IGZpbGVzIGFuZCBoaXN0b3J5IGFuZCBzZWUgaWYgdGhlIHJlc3VsdCBsb29rcyBnb29kLlxyXG4qIERlbGV0ZSB0aGUgdGVtcG9yYXJ5IGNsb25lZCByZXBvOiBybSAtcmYgJHtoaXN0b3J5Q29weVJlcG99XHJcbiogVXBkYXRlIHRoZSBuYW1lc3BhY2UgYW5kIHJlZ2lzdHJ5IHN0YXRlbWVudCwgaWYgYXBwcm9wcmlhdGUuXHJcbiogTW92ZSB0aGUgZmlsZSB0byB0aGUgZGVzaXJlZCBkaXJlY3RvcnkuXHJcbiogVHlwZSBjaGVjaywgbGludCBhbmQgdGVzdCB0aGUgbmV3IGNvZGUuXHJcbiogSWYgdGhlIGhpc3RvcnksIGZpbGUsIHR5cGUgY2hlY2tzIGFuZCBsaW50IGFsbCBzZWVtIGdvb2QsIGdpdCBwdXNoIHRoZSBjaGFuZ2VzLiAob3RoZXJ3aXNlIHJlLWNsb25lKS5cclxuKiBEZWxldGUgdGhlIGNvcHkgaW4gdGhlIHByaW9yIGRpcmVjdG9yeS4gSW4gdGhlIGNvbW1pdCBtZXNzYWdlLCByZWZlciB0byBhbiBpc3N1ZSBzbyB0aGVyZSBpcyBhIHBhcGVyIHRyYWlsLlxyXG5gICk7XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsbUJBQW9CLENBQUM7QUFDOUMsTUFBTUMsYUFBYSxHQUFHRCxPQUFPLENBQUUseUJBQTBCLENBQUM7O0FBRTFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFFLFlBQVk7RUFDWixNQUFNRSxJQUFJLEdBQUdDLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDQyxLQUFLLENBQUUsQ0FBRSxDQUFDO0VBRXBDLE1BQU1DLFVBQVUsR0FBR0osSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDSyxLQUFLLENBQUUsR0FBSSxDQUFDLENBQUUsQ0FBQyxDQUFFO0VBQzlDLE1BQU1DLFlBQVksR0FBR04sSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDSyxLQUFLLENBQUUsR0FBSSxDQUFDLENBQUNGLEtBQUssQ0FBRSxDQUFFLENBQUMsQ0FBQ0ksSUFBSSxDQUFFLEdBQUksQ0FBQztFQUVsRSxNQUFNQyxVQUFVLEdBQUdSLElBQUksQ0FBRSxDQUFDLENBQUU7RUFFNUJTLE9BQU8sQ0FBQ0MsR0FBRyxDQUFHLFdBQVVKLFlBQWEsU0FBUUYsVUFBVyxPQUFNSSxVQUFXLEVBQUUsQ0FBQzs7RUFFNUU7RUFDQTtFQUNBLE1BQU1H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