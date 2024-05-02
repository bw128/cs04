// Copyright 2021, University of Colorado Boulder

/**
 * Checks whether a git commit exists (locally) in a repo
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');

/**
 * Executes git commit
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} sha - The SHA of the commit
 * @returns {Promise.<boolean>}
 */
module.exports = async function (repo, sha) {
  const result = await execute('git', ['cat-file', '-e', sha], `../${repo}`, {
    errors: 'resolve'
  });
  if (result.code === 0) {
    return true;
  } else if (result.code === 1) {
    return false;
  } else {
    throw new Error(`Non-zero and non-one exit code from git cat-file: ${result}`);
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwic2hhIiwicmVzdWx0IiwiZXJyb3JzIiwiY29kZSIsIkVycm9yIl0sInNvdXJjZXMiOlsiZ2l0RG9lc0NvbW1pdEV4aXN0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDaGVja3Mgd2hldGhlciBhIGdpdCBjb21taXQgZXhpc3RzIChsb2NhbGx5KSBpbiBhIHJlcG9cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGVzIGdpdCBjb21taXRcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IHNoYSAtIFRoZSBTSEEgb2YgdGhlIGNvbW1pdFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCByZXBvLCBzaGEgKSB7XHJcblxyXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdjYXQtZmlsZScsICctZScsIHNoYSBdLCBgLi4vJHtyZXBvfWAsIHtcclxuICAgIGVycm9yczogJ3Jlc29sdmUnXHJcbiAgfSApO1xyXG5cclxuICBpZiAoIHJlc3VsdC5jb2RlID09PSAwICkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIGVsc2UgaWYgKCByZXN1bHQuY29kZSA9PT0gMSApIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBOb24temVybyBhbmQgbm9uLW9uZSBleGl0IGNvZGUgZnJvbSBnaXQgY2F0LWZpbGU6ICR7cmVzdWx0fWAgKTtcclxuICB9XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLE9BQU8sR0FBR0MsT0FBTyxDQUFFLFdBQVksQ0FBQzs7QUFFdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxNQUFNLENBQUNDLE9BQU8sR0FBRyxnQkFBZ0JDLElBQUksRUFBRUMsR0FBRyxFQUFHO0VBRTNDLE1BQU1DLE1BQU0sR0FBRyxNQUFNTixPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsVUFBVSxFQUFFLElBQUksRUFBRUssR0FBRyxDQUFFLEVBQUcsTUFBS0QsSUFBSyxFQUFDLEVBQUU7SUFDNUVHLE1BQU0sRUFBRTtFQUNWLENBQUUsQ0FBQztFQUVILElBQUtELE1BQU0sQ0FBQ0UsSUFBSSxLQUFLLENBQUMsRUFBRztJQUN2QixPQUFPLElBQUk7RUFDYixDQUFDLE1BQ0ksSUFBS0YsTUFBTSxDQUFDRSxJQUFJLEtBQUssQ0FBQyxFQUFHO0lBQzVCLE9BQU8sS0FBSztFQUNkLENBQUMsTUFDSTtJQUNILE1BQU0sSUFBSUMsS0FBSyxDQUFHLHFEQUFvREgsTUFBTyxFQUFFLENBQUM7RUFDbEY7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119