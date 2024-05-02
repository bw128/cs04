// Copyright 2023, University of Colorado Boulder

/**
 * If your local repo does not have a remote branch, this script will grab it and set up tracking on it.
 * This script will start and end on the same, current branch the repo is on, but checkouts the `branch` param while
 * running.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

const execute = require('./execute');
const gitPull = require('./gitPull');
const getBranch = require('./getBranch');
const gitCheckout = require('./gitCheckout');

/**
 * If your local repo does not have a remote branch, this script will grab it and set up tracking on it.
 * This script will start and end on the same, current branch the repo is on, but checkouts the `branch` param while
 * running.
 *
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The branch name
 * @returns {Promise<void>}
 */
module.exports = async function createLocalBranchFromRemote(repo, branch) {
  const currentBranch = await getBranch(repo);
  await execute('git', ['checkout', '-b', branch, `origin/${branch}`], `../${repo}`);
  await gitPull(repo);
  if (branch !== '') {
    // otherwise it would fail
    await gitCheckout(repo, currentBranch);
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImdpdFB1bGwiLCJnZXRCcmFuY2giLCJnaXRDaGVja291dCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjcmVhdGVMb2NhbEJyYW5jaEZyb21SZW1vdGUiLCJyZXBvIiwiYnJhbmNoIiwiY3VycmVudEJyYW5jaCJdLCJzb3VyY2VzIjpbImNyZWF0ZUxvY2FsQnJhbmNoRnJvbVJlbW90ZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogSWYgeW91ciBsb2NhbCByZXBvIGRvZXMgbm90IGhhdmUgYSByZW1vdGUgYnJhbmNoLCB0aGlzIHNjcmlwdCB3aWxsIGdyYWIgaXQgYW5kIHNldCB1cCB0cmFja2luZyBvbiBpdC5cclxuICogVGhpcyBzY3JpcHQgd2lsbCBzdGFydCBhbmQgZW5kIG9uIHRoZSBzYW1lLCBjdXJyZW50IGJyYW5jaCB0aGUgcmVwbyBpcyBvbiwgYnV0IGNoZWNrb3V0cyB0aGUgYGJyYW5jaGAgcGFyYW0gd2hpbGVcclxuICogcnVubmluZy5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IGdpdFB1bGwgPSByZXF1aXJlKCAnLi9naXRQdWxsJyApO1xyXG5jb25zdCBnZXRCcmFuY2ggPSByZXF1aXJlKCAnLi9nZXRCcmFuY2gnICk7XHJcbmNvbnN0IGdpdENoZWNrb3V0ID0gcmVxdWlyZSggJy4vZ2l0Q2hlY2tvdXQnICk7XHJcblxyXG4vKipcclxuICogSWYgeW91ciBsb2NhbCByZXBvIGRvZXMgbm90IGhhdmUgYSByZW1vdGUgYnJhbmNoLCB0aGlzIHNjcmlwdCB3aWxsIGdyYWIgaXQgYW5kIHNldCB1cCB0cmFja2luZyBvbiBpdC5cclxuICogVGhpcyBzY3JpcHQgd2lsbCBzdGFydCBhbmQgZW5kIG9uIHRoZSBzYW1lLCBjdXJyZW50IGJyYW5jaCB0aGUgcmVwbyBpcyBvbiwgYnV0IGNoZWNrb3V0cyB0aGUgYGJyYW5jaGAgcGFyYW0gd2hpbGVcclxuICogcnVubmluZy5cclxuICpcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGJyYW5jaCAtIFRoZSBicmFuY2ggbmFtZVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gY3JlYXRlTG9jYWxCcmFuY2hGcm9tUmVtb3RlKCByZXBvLCBicmFuY2ggKSB7XHJcbiAgY29uc3QgY3VycmVudEJyYW5jaCA9IGF3YWl0IGdldEJyYW5jaCggcmVwbyApO1xyXG4gIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdjaGVja291dCcsICctYicsIGJyYW5jaCwgYG9yaWdpbi8ke2JyYW5jaH1gIF0sIGAuLi8ke3JlcG99YCApO1xyXG4gIGF3YWl0IGdpdFB1bGwoIHJlcG8gKTtcclxuXHJcbiAgaWYgKCBicmFuY2ggIT09ICcnICkgeyAvLyBvdGhlcndpc2UgaXQgd291bGQgZmFpbFxyXG4gICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG8sIGN1cnJlbnRCcmFuY2ggKTtcclxuICB9XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFdBQVksQ0FBQztBQUN0QyxNQUFNRSxTQUFTLEdBQUdGLE9BQU8sQ0FBRSxhQUFjLENBQUM7QUFDMUMsTUFBTUcsV0FBVyxHQUFHSCxPQUFPLENBQUUsZUFBZ0IsQ0FBQzs7QUFFOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBSSxNQUFNLENBQUNDLE9BQU8sR0FBRyxlQUFlQywyQkFBMkJBLENBQUVDLElBQUksRUFBRUMsTUFBTSxFQUFHO0VBQzFFLE1BQU1DLGFBQWEsR0FBRyxNQUFNUCxTQUFTLENBQUVLLElBQUssQ0FBQztFQUM3QyxNQUFNUixPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsVUFBVSxFQUFFLElBQUksRUFBRVMsTUFBTSxFQUFHLFVBQVNBLE1BQU8sRUFBQyxDQUFFLEVBQUcsTUFBS0QsSUFBSyxFQUFFLENBQUM7RUFDdEYsTUFBTU4sT0FBTyxDQUFFTSxJQUFLLENBQUM7RUFFckIsSUFBS0MsTUFBTSxLQUFLLEVBQUUsRUFBRztJQUFFO0lBQ3JCLE1BQU1MLFdBQVcsQ0FBRUksSUFBSSxFQUFFRSxhQUFjLENBQUM7RUFDMUM7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119