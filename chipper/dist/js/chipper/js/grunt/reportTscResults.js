// Copyright 2021-2024, University of Colorado Boulder

/**
 * Reports the results of tsc() in a grunt context, failing if there are errors.
 * @author Sam Reid (PhET Interactive Simulations)
 */

module.exports = (results, grunt) => {
  if (results.stderr && results.stderr.length > 0 || results.code !== 0) {
    grunt.fail.fatal(`tsc failed with code: ${results.code}
stdout:
${results.stdout}

${results.stdout.split('\n').length - 1} problems found.

stderr:
${results.stderr}`);
  } else {
    grunt.log.ok(`tsc complete: ${results.time}ms`);
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwicmVzdWx0cyIsImdydW50Iiwic3RkZXJyIiwibGVuZ3RoIiwiY29kZSIsImZhaWwiLCJmYXRhbCIsInN0ZG91dCIsInNwbGl0IiwibG9nIiwib2siLCJ0aW1lIl0sInNvdXJjZXMiOlsicmVwb3J0VHNjUmVzdWx0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXBvcnRzIHRoZSByZXN1bHRzIG9mIHRzYygpIGluIGEgZ3J1bnQgY29udGV4dCwgZmFpbGluZyBpZiB0aGVyZSBhcmUgZXJyb3JzLlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCByZXN1bHRzLCBncnVudCApID0+IHtcclxuICBpZiAoICggcmVzdWx0cy5zdGRlcnIgJiYgcmVzdWx0cy5zdGRlcnIubGVuZ3RoID4gMCApIHx8IHJlc3VsdHMuY29kZSAhPT0gMCApIHtcclxuICAgIGdydW50LmZhaWwuZmF0YWwoIGB0c2MgZmFpbGVkIHdpdGggY29kZTogJHtyZXN1bHRzLmNvZGV9XHJcbnN0ZG91dDpcclxuJHtyZXN1bHRzLnN0ZG91dH1cclxuXHJcbiR7cmVzdWx0cy5zdGRvdXQuc3BsaXQoICdcXG4nICkubGVuZ3RoIC0gMX0gcHJvYmxlbXMgZm91bmQuXHJcblxyXG5zdGRlcnI6XHJcbiR7cmVzdWx0cy5zdGRlcnJ9YCApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGdydW50LmxvZy5vayggYHRzYyBjb21wbGV0ZTogJHtyZXN1bHRzLnRpbWV9bXNgICk7XHJcbiAgfVxyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUFBLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLENBQUVDLE9BQU8sRUFBRUMsS0FBSyxLQUFNO0VBQ3JDLElBQU9ELE9BQU8sQ0FBQ0UsTUFBTSxJQUFJRixPQUFPLENBQUNFLE1BQU0sQ0FBQ0MsTUFBTSxHQUFHLENBQUMsSUFBTUgsT0FBTyxDQUFDSSxJQUFJLEtBQUssQ0FBQyxFQUFHO0lBQzNFSCxLQUFLLENBQUNJLElBQUksQ0FBQ0MsS0FBSyxDQUFHLHlCQUF3Qk4sT0FBTyxDQUFDSSxJQUFLO0FBQzVEO0FBQ0EsRUFBRUosT0FBTyxDQUFDTyxNQUFPO0FBQ2pCO0FBQ0EsRUFBRVAsT0FBTyxDQUFDTyxNQUFNLENBQUNDLEtBQUssQ0FBRSxJQUFLLENBQUMsQ0FBQ0wsTUFBTSxHQUFHLENBQUU7QUFDMUM7QUFDQTtBQUNBLEVBQUVILE9BQU8sQ0FBQ0UsTUFBTyxFQUFFLENBQUM7RUFDbEIsQ0FBQyxNQUNJO0lBQ0hELEtBQUssQ0FBQ1EsR0FBRyxDQUFDQyxFQUFFLENBQUcsaUJBQWdCVixPQUFPLENBQUNXLElBQUssSUFBSSxDQUFDO0VBQ25EO0FBQ0YsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==