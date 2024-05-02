"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// Copyright 2020-2022, University of Colorado Boulder

/**
 * NOTE: This is only for loading strings in the unbuilt mode.
 *
 * NOTE: This will check the query string value for ?locale directly. See initialize-globals.js for reference.
 *
 * Kicks off the loading of runtime strings very early in the unbuilt loading process, ideally so that it
 * doesn't block the loading of modules. This is because we need the string information to be loaded before we can
 * kick off the module process.
 *
 * It will fill up phet.chipper.strings with the needed values, for use by simulation code and in particular
 * getStringModule. It will then call window.phet.chipper.loadModules() once complete, to progress with the module
 * process.
 *
 * To function properly, phet.chipper.stringRepos will need to be defined before this executes (generally in the
 * initialization script, or in the dev .html).
 *
 * A string "key" is in the form of "NAMESPACE/key.from.strings.json"
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

(function () {
  // Namespace verification
  window.phet = window.phet || {};
  window.phet.chipper = window.phet.chipper || {};

  // Constructing the string map
  window.phet.chipper.strings = {};
  window.phet.chipper.stringMetadata = {};

  // Prefixes, ideally a better way of accessing localeInfo on startup would exist. We have localeInfo, however it's
  // in the form of a module, and we can't use that at this point.
  var rtlLocales = ['ae', 'ar', 'fa', 'iw', 'ur'];
  var localeQueryParam = new window.URLSearchParams(window.location.search).get('locale');
  var localesQueryParam = new window.URLSearchParams(window.location.search).get('locales');
  var remainingFilesToProcess = 0;
  var FALLBACK_LOCALE = 'en';

  /**
   * Takes the string-file object for a given locale/requirejsNamespace, and fills in the phet.chipper.strings inside
   * that locale with any recognized strings inside.
   *
   * @param {Object} stringObject - In general, an object where if it has a `value: {string}` key then it represents
   *                                a string key with a value, otherwise each level represents a grouping.
   * @param {string} requirejsNamespace - e.g. 'JOIST'
   * @param {string} locale
   */
  var processStringFile = function processStringFile(stringObject, requirejsNamespace, locale) {
    // See if we are in an RTL locale (lodash is unavailable at this point)
    var isRTL = false;
    rtlLocales.forEach(function (rtlLocale) {
      if (locale.startsWith(rtlLocale)) {
        isRTL = true;
      }
    });
    var stringKeyPrefix = "".concat(requirejsNamespace, "/");

    // Ensure a locale-specific sub-object
    phet.chipper.strings[locale] = phet.chipper.strings[locale] || {};
    var localeStringMap = phet.chipper.strings[locale];
    var recurse = function recurse(path, object) {
      Object.keys(object).forEach(function (key) {
        if (key === 'value') {
          var value = object.value;

          // Add directional marks
          if (value.length > 0) {
            value = "".concat(isRTL ? "\u202B" : "\u202A").concat(value, "\u202C");
          }
          var stringKey = "".concat(stringKeyPrefix).concat(path);
          localeStringMap[stringKey] = value;
          if (locale === FALLBACK_LOCALE && object.metadata) {
            phet.chipper.stringMetadata[stringKey] = object.metadata;
          }
        } else if (object[key] && _typeof(object[key]) === 'object') {
          recurse("".concat(path).concat(path.length ? '.' : '').concat(key), object[key]);
        }
      });
    };
    recurse('', stringObject);
  };

  /**
   * Load a conglomerate string file with many locales. Only used in locales=*
   */
  var processConglomerateStringFile = function processConglomerateStringFile(stringObject, requirejsNamespace) {
    var locales = Object.keys(stringObject);
    locales.forEach(function (locale) {
      // See if we are in an RTL locale (lodash is unavailable at this point)
      var isRTL = false;
      rtlLocales.forEach(function (rtlLocale) {
        if (locale.startsWith(rtlLocale)) {
          isRTL = true;
        }
      });
      var stringKeyPrefix = "".concat(requirejsNamespace, "/");

      // Ensure a locale-specific sub-object
      phet.chipper.strings[locale] = phet.chipper.strings[locale] || {};
      var localeStringMap = phet.chipper.strings[locale];
      var recurse = function recurse(path, object) {
        Object.keys(object).forEach(function (key) {
          if (key === 'value') {
            var value = object.value;

            // Add directional marks
            if (value.length > 0) {
              value = "".concat(isRTL ? "\u202B" : "\u202A").concat(value, "\u202C");
            }
            localeStringMap["".concat(stringKeyPrefix).concat(path)] = value;
          } else if (object[key] && _typeof(object[key]) === 'object') {
            recurse("".concat(path).concat(path.length ? '.' : '').concat(key), object[key]);
          }
        });
      };
      recurse('', stringObject[locale]);
    });
  };

  /**
   * Fires off a request for a JSON file, either in babel (for non-English) strings, or in the actual repo
   * (for English) strings, or for the unbuilt_en strings file. When it is loaded, it will try to parse the response
   * and then pass the object for processing.
   *
   * @param {string} path - Relative path to load JSON file from
   * @param {Function|null} callback
   */
  var requestJSONFile = function requestJSONFile(path, callback) {
    remainingFilesToProcess++;
    var request = new XMLHttpRequest();
    request.addEventListener('load', function () {
      if (request.status === 200) {
        var json;
        try {
          json = JSON.parse(request.responseText);
        } catch (e) {
          throw new Error("Could load file ".concat(path, ", perhaps that translation does not exist yet?"));
        }
        callback && callback(json);
      }
      if (--remainingFilesToProcess === 0) {
        finishProcessing();
      }
    });
    request.addEventListener('error', function () {
      if (!(localesQueryParam === '*')) {
        console.log("Could not load ".concat(path));
      }
      if (--remainingFilesToProcess === 0) {
        finishProcessing();
      }
    });
    request.open('GET', path, true);
    request.send();
  };

  // The callback to execute when all string files are processed.
  var finishProcessing = function finishProcessing() {
    // Progress with loading modules
    window.phet.chipper.loadModules();
  };
  var locales = [FALLBACK_LOCALE];
  if (localesQueryParam === '*') {
    locales = 'aa,ab,ae,af,ak,am,an,ar,ar_MA,ar_SA,as,av,ay,az,ba,be,bg,bh,bi,bm,bn,bo,br,bs,ca,ce,ch,co,cr,cs,cu,cv,cy,da,de,dv,dz,ee,el,en,en_CA,en_GB,eo,es,es_CO,es_CR,es_ES,es_MX,es_PE,et,eu,fa,ff,fi,fj,fo,fr,fu,fy,ga,gd,gl,gn,gu,gv,ha,hi,ho,hr,ht,hu,hy,hz,ia,ie,ig,ii,ik,in,io,is,it,iu,iw,ja,ji,jv,ka,kg,ki,kj,kk,kl,km,kn,ko,kr,ks,ku,ku_TR,kv,kw,ky,la,lb,lg,li,lk,ln,lo,lt,lu,lv,mg,mh,mi,mk,ml,mn,mo,mr,ms,mt,my,na,nb,nd,ne,ng,nl,nn,nr,nv,ny,oc,oj,om,or,os,pa,pi,pl,ps,pt,pt_BR,qu,rm,rn,ro,ru,rw,ry,sa,sc,sd,se,sg,sh,si,sk,sl,sm,sn,so,sq,sr,ss,st,su,sv,sw,ta,te,tg,th,ti,tk,tl,tn,to,tr,ts,tt,tw,ty,ug,uk,ur,uz,ve,vi,vo,wa,wo,xh,yo,za,zh_CN,zh_HK,zh_TW,zu'.split(',');
  } else {
    // Load other locales we might potentially need (keeping out duplicates)
    [localeQueryParam].concat(_toConsumableArray(localesQueryParam ? localesQueryParam.split(',') : [])).forEach(function (locale) {
      if (locale) {
        // e.g. 'zh_CN'
        if (!locales.includes(locale)) {
          locales.push(locale);
        }
        // e.g. 'zh'
        var shortLocale = locale.slice(0, 2);
        if (locale.length > 2 && !locales.includes(shortLocale)) {
          locales.push(shortLocale);
        }
      }
    });
  }

  // Check for phet.chipper.stringPath. This should be set to ADJUST the path to the strings directory, in cases
  // where we're running this case NOT from a repo's top level (e.g. sandbox.html)
  var getStringPath = function getStringPath(repo, locale) {
    return "".concat(phet.chipper.stringPath ? phet.chipper.stringPath : '', "../").concat(locale === FALLBACK_LOCALE ? '' : 'babel/').concat(repo, "/").concat(repo, "-strings_").concat(locale, ".json");
  };

  // See if our request for the sim-specific strings file works. If so, only then will we load the common repos files
  // for that locale.
  var ourRepo = phet.chipper.packageObject.name;
  var ourRequirejsNamespace;
  phet.chipper.stringRepos.forEach(function (data) {
    if (data.repo === ourRepo) {
      ourRequirejsNamespace = data.requirejsNamespace;
    }
  });

  // TODO https://github.com/phetsims/phet-io/issues/1877 Uncomment this to load the used string list
  // requestJSONFile( `../phet-io-sim-specific/repos/${ourRepo}/used-strings_en.json`, json => {
  //
  //   // Store for runtime usage
  //   phet.chipper.usedStringsEN = json;
  // } );

  if (localesQueryParam === '*') {
    // Load the conglomerate files
    requestJSONFile("../babel/_generated_development_strings/".concat(ourRepo, "_all.json"), function (json) {
      processConglomerateStringFile(json, ourRequirejsNamespace);
      phet.chipper.stringRepos.forEach(function (stringRepoData) {
        var repo = stringRepoData.repo;
        if (repo !== ourRepo) {
          requestJSONFile("../babel/_generated_development_strings/".concat(repo, "_all.json"), function (json) {
            processConglomerateStringFile(json, stringRepoData.requirejsNamespace);
          });
        }
      });
    });

    // Even though the English strings are included in the conglomerate file, load the english file directly so that
    // you can change _en strings without having to run 'grunt generate-unbuilt-strings' before seeing changes.
    requestJSONFile(getStringPath(ourRepo, 'en'), function (json) {
      processStringFile(json, ourRequirejsNamespace, 'en');
      phet.chipper.stringRepos.forEach(function (stringRepoData) {
        var repo = stringRepoData.repo;
        if (repo !== ourRepo) {
          requestJSONFile(getStringPath(repo, 'en'), function (json) {
            processStringFile(json, stringRepoData.requirejsNamespace, 'en');
          });
        }
      });
    });
  } else {
    // Load just the specified locales
    locales.forEach(function (locale) {
      requestJSONFile(getStringPath(ourRepo, locale), function (json) {
        processStringFile(json, ourRequirejsNamespace, locale);
        phet.chipper.stringRepos.forEach(function (stringRepoData) {
          var repo = stringRepoData.repo;
          if (repo !== ourRepo) {
            requestJSONFile(getStringPath(repo, locale), function (json) {
              processStringFile(json, stringRepoData.requirejsNamespace, locale);
            });
          }
        });
      });
    });
  }
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ3aW5kb3ciLCJwaGV0IiwiY2hpcHBlciIsInN0cmluZ3MiLCJzdHJpbmdNZXRhZGF0YSIsInJ0bExvY2FsZXMiLCJsb2NhbGVRdWVyeVBhcmFtIiwiVVJMU2VhcmNoUGFyYW1zIiwibG9jYXRpb24iLCJzZWFyY2giLCJnZXQiLCJsb2NhbGVzUXVlcnlQYXJhbSIsInJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzIiwiRkFMTEJBQ0tfTE9DQUxFIiwicHJvY2Vzc1N0cmluZ0ZpbGUiLCJzdHJpbmdPYmplY3QiLCJyZXF1aXJlanNOYW1lc3BhY2UiLCJsb2NhbGUiLCJpc1JUTCIsImZvckVhY2giLCJydGxMb2NhbGUiLCJzdGFydHNXaXRoIiwic3RyaW5nS2V5UHJlZml4IiwiY29uY2F0IiwibG9jYWxlU3RyaW5nTWFwIiwicmVjdXJzZSIsInBhdGgiLCJvYmplY3QiLCJPYmplY3QiLCJrZXlzIiwia2V5IiwidmFsdWUiLCJsZW5ndGgiLCJzdHJpbmdLZXkiLCJtZXRhZGF0YSIsIl90eXBlb2YiLCJwcm9jZXNzQ29uZ2xvbWVyYXRlU3RyaW5nRmlsZSIsImxvY2FsZXMiLCJyZXF1ZXN0SlNPTkZpbGUiLCJjYWxsYmFjayIsInJlcXVlc3QiLCJYTUxIdHRwUmVxdWVzdCIsImFkZEV2ZW50TGlzdGVuZXIiLCJzdGF0dXMiLCJqc29uIiwiSlNPTiIsInBhcnNlIiwicmVzcG9uc2VUZXh0IiwiZSIsIkVycm9yIiwiZmluaXNoUHJvY2Vzc2luZyIsImNvbnNvbGUiLCJsb2ciLCJvcGVuIiwic2VuZCIsImxvYWRNb2R1bGVzIiwic3BsaXQiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJpbmNsdWRlcyIsInB1c2giLCJzaG9ydExvY2FsZSIsInNsaWNlIiwiZ2V0U3RyaW5nUGF0aCIsInJlcG8iLCJzdHJpbmdQYXRoIiwib3VyUmVwbyIsInBhY2thZ2VPYmplY3QiLCJuYW1lIiwib3VyUmVxdWlyZWpzTmFtZXNwYWNlIiwic3RyaW5nUmVwb3MiLCJkYXRhIiwic3RyaW5nUmVwb0RhdGEiXSwic291cmNlcyI6WyJsb2FkLXVuYnVpbHQtc3RyaW5ncy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBOT1RFOiBUaGlzIGlzIG9ubHkgZm9yIGxvYWRpbmcgc3RyaW5ncyBpbiB0aGUgdW5idWlsdCBtb2RlLlxyXG4gKlxyXG4gKiBOT1RFOiBUaGlzIHdpbGwgY2hlY2sgdGhlIHF1ZXJ5IHN0cmluZyB2YWx1ZSBmb3IgP2xvY2FsZSBkaXJlY3RseS4gU2VlIGluaXRpYWxpemUtZ2xvYmFscy5qcyBmb3IgcmVmZXJlbmNlLlxyXG4gKlxyXG4gKiBLaWNrcyBvZmYgdGhlIGxvYWRpbmcgb2YgcnVudGltZSBzdHJpbmdzIHZlcnkgZWFybHkgaW4gdGhlIHVuYnVpbHQgbG9hZGluZyBwcm9jZXNzLCBpZGVhbGx5IHNvIHRoYXQgaXRcclxuICogZG9lc24ndCBibG9jayB0aGUgbG9hZGluZyBvZiBtb2R1bGVzLiBUaGlzIGlzIGJlY2F1c2Ugd2UgbmVlZCB0aGUgc3RyaW5nIGluZm9ybWF0aW9uIHRvIGJlIGxvYWRlZCBiZWZvcmUgd2UgY2FuXHJcbiAqIGtpY2sgb2ZmIHRoZSBtb2R1bGUgcHJvY2Vzcy5cclxuICpcclxuICogSXQgd2lsbCBmaWxsIHVwIHBoZXQuY2hpcHBlci5zdHJpbmdzIHdpdGggdGhlIG5lZWRlZCB2YWx1ZXMsIGZvciB1c2UgYnkgc2ltdWxhdGlvbiBjb2RlIGFuZCBpbiBwYXJ0aWN1bGFyXHJcbiAqIGdldFN0cmluZ01vZHVsZS4gSXQgd2lsbCB0aGVuIGNhbGwgd2luZG93LnBoZXQuY2hpcHBlci5sb2FkTW9kdWxlcygpIG9uY2UgY29tcGxldGUsIHRvIHByb2dyZXNzIHdpdGggdGhlIG1vZHVsZVxyXG4gKiBwcm9jZXNzLlxyXG4gKlxyXG4gKiBUbyBmdW5jdGlvbiBwcm9wZXJseSwgcGhldC5jaGlwcGVyLnN0cmluZ1JlcG9zIHdpbGwgbmVlZCB0byBiZSBkZWZpbmVkIGJlZm9yZSB0aGlzIGV4ZWN1dGVzIChnZW5lcmFsbHkgaW4gdGhlXHJcbiAqIGluaXRpYWxpemF0aW9uIHNjcmlwdCwgb3IgaW4gdGhlIGRldiAuaHRtbCkuXHJcbiAqXHJcbiAqIEEgc3RyaW5nIFwia2V5XCIgaXMgaW4gdGhlIGZvcm0gb2YgXCJOQU1FU1BBQ0Uva2V5LmZyb20uc3RyaW5ncy5qc29uXCJcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbiggKCkgPT4ge1xyXG4gIC8vIE5hbWVzcGFjZSB2ZXJpZmljYXRpb25cclxuICB3aW5kb3cucGhldCA9IHdpbmRvdy5waGV0IHx8IHt9O1xyXG4gIHdpbmRvdy5waGV0LmNoaXBwZXIgPSB3aW5kb3cucGhldC5jaGlwcGVyIHx8IHt9O1xyXG5cclxuICAvLyBDb25zdHJ1Y3RpbmcgdGhlIHN0cmluZyBtYXBcclxuICB3aW5kb3cucGhldC5jaGlwcGVyLnN0cmluZ3MgPSB7fTtcclxuICB3aW5kb3cucGhldC5jaGlwcGVyLnN0cmluZ01ldGFkYXRhID0ge307XHJcblxyXG4gIC8vIFByZWZpeGVzLCBpZGVhbGx5IGEgYmV0dGVyIHdheSBvZiBhY2Nlc3NpbmcgbG9jYWxlSW5mbyBvbiBzdGFydHVwIHdvdWxkIGV4aXN0LiBXZSBoYXZlIGxvY2FsZUluZm8sIGhvd2V2ZXIgaXQnc1xyXG4gIC8vIGluIHRoZSBmb3JtIG9mIGEgbW9kdWxlLCBhbmQgd2UgY2FuJ3QgdXNlIHRoYXQgYXQgdGhpcyBwb2ludC5cclxuICBjb25zdCBydGxMb2NhbGVzID0gWyAnYWUnLCAnYXInLCAnZmEnLCAnaXcnLCAndXInIF07XHJcblxyXG4gIGNvbnN0IGxvY2FsZVF1ZXJ5UGFyYW0gPSBuZXcgd2luZG93LlVSTFNlYXJjaFBhcmFtcyggd2luZG93LmxvY2F0aW9uLnNlYXJjaCApLmdldCggJ2xvY2FsZScgKTtcclxuICBjb25zdCBsb2NhbGVzUXVlcnlQYXJhbSA9IG5ldyB3aW5kb3cuVVJMU2VhcmNoUGFyYW1zKCB3aW5kb3cubG9jYXRpb24uc2VhcmNoICkuZ2V0KCAnbG9jYWxlcycgKTtcclxuXHJcbiAgbGV0IHJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzID0gMDtcclxuXHJcbiAgY29uc3QgRkFMTEJBQ0tfTE9DQUxFID0gJ2VuJztcclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgdGhlIHN0cmluZy1maWxlIG9iamVjdCBmb3IgYSBnaXZlbiBsb2NhbGUvcmVxdWlyZWpzTmFtZXNwYWNlLCBhbmQgZmlsbHMgaW4gdGhlIHBoZXQuY2hpcHBlci5zdHJpbmdzIGluc2lkZVxyXG4gICAqIHRoYXQgbG9jYWxlIHdpdGggYW55IHJlY29nbml6ZWQgc3RyaW5ncyBpbnNpZGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RyaW5nT2JqZWN0IC0gSW4gZ2VuZXJhbCwgYW4gb2JqZWN0IHdoZXJlIGlmIGl0IGhhcyBhIGB2YWx1ZToge3N0cmluZ31gIGtleSB0aGVuIGl0IHJlcHJlc2VudHNcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSBzdHJpbmcga2V5IHdpdGggYSB2YWx1ZSwgb3RoZXJ3aXNlIGVhY2ggbGV2ZWwgcmVwcmVzZW50cyBhIGdyb3VwaW5nLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1aXJlanNOYW1lc3BhY2UgLSBlLmcuICdKT0lTVCdcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbG9jYWxlXHJcbiAgICovXHJcbiAgY29uc3QgcHJvY2Vzc1N0cmluZ0ZpbGUgPSAoIHN0cmluZ09iamVjdCwgcmVxdWlyZWpzTmFtZXNwYWNlLCBsb2NhbGUgKSA9PiB7XHJcbiAgICAvLyBTZWUgaWYgd2UgYXJlIGluIGFuIFJUTCBsb2NhbGUgKGxvZGFzaCBpcyB1bmF2YWlsYWJsZSBhdCB0aGlzIHBvaW50KVxyXG4gICAgbGV0IGlzUlRMID0gZmFsc2U7XHJcbiAgICBydGxMb2NhbGVzLmZvckVhY2goIHJ0bExvY2FsZSA9PiB7XHJcbiAgICAgIGlmICggbG9jYWxlLnN0YXJ0c1dpdGgoIHJ0bExvY2FsZSApICkge1xyXG4gICAgICAgIGlzUlRMID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHN0cmluZ0tleVByZWZpeCA9IGAke3JlcXVpcmVqc05hbWVzcGFjZX0vYDtcclxuXHJcbiAgICAvLyBFbnN1cmUgYSBsb2NhbGUtc3BlY2lmaWMgc3ViLW9iamVjdFxyXG4gICAgcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdID0gcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdIHx8IHt9O1xyXG4gICAgY29uc3QgbG9jYWxlU3RyaW5nTWFwID0gcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdO1xyXG5cclxuICAgIGNvbnN0IHJlY3Vyc2UgPSAoIHBhdGgsIG9iamVjdCApID0+IHtcclxuICAgICAgT2JqZWN0LmtleXMoIG9iamVjdCApLmZvckVhY2goIGtleSA9PiB7XHJcbiAgICAgICAgaWYgKCBrZXkgPT09ICd2YWx1ZScgKSB7XHJcbiAgICAgICAgICBsZXQgdmFsdWUgPSBvYmplY3QudmFsdWU7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIGRpcmVjdGlvbmFsIG1hcmtzXHJcbiAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYCR7KCBpc1JUTCA/ICdcXHUyMDJiJyA6ICdcXHUyMDJhJyApfSR7dmFsdWV9XFx1MjAyY2A7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3Qgc3RyaW5nS2V5ID0gYCR7c3RyaW5nS2V5UHJlZml4fSR7cGF0aH1gO1xyXG5cclxuICAgICAgICAgIGxvY2FsZVN0cmluZ01hcFsgc3RyaW5nS2V5IF0gPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgICBpZiAoIGxvY2FsZSA9PT0gRkFMTEJBQ0tfTE9DQUxFICYmIG9iamVjdC5tZXRhZGF0YSApIHtcclxuICAgICAgICAgICAgcGhldC5jaGlwcGVyLnN0cmluZ01ldGFkYXRhWyBzdHJpbmdLZXkgXSA9IG9iamVjdC5tZXRhZGF0YTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIG9iamVjdFsga2V5IF0gJiYgdHlwZW9mIG9iamVjdFsga2V5IF0gPT09ICdvYmplY3QnICkge1xyXG4gICAgICAgICAgcmVjdXJzZSggYCR7cGF0aH0ke3BhdGgubGVuZ3RoID8gJy4nIDogJyd9JHtrZXl9YCwgb2JqZWN0WyBrZXkgXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfTtcclxuICAgIHJlY3Vyc2UoICcnLCBzdHJpbmdPYmplY3QgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBMb2FkIGEgY29uZ2xvbWVyYXRlIHN0cmluZyBmaWxlIHdpdGggbWFueSBsb2NhbGVzLiBPbmx5IHVzZWQgaW4gbG9jYWxlcz0qXHJcbiAgICovXHJcbiAgY29uc3QgcHJvY2Vzc0Nvbmdsb21lcmF0ZVN0cmluZ0ZpbGUgPSAoIHN0cmluZ09iamVjdCwgcmVxdWlyZWpzTmFtZXNwYWNlICkgPT4ge1xyXG5cclxuICAgIGNvbnN0IGxvY2FsZXMgPSBPYmplY3Qua2V5cyggc3RyaW5nT2JqZWN0ICk7XHJcblxyXG4gICAgbG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG5cclxuICAgICAgLy8gU2VlIGlmIHdlIGFyZSBpbiBhbiBSVEwgbG9jYWxlIChsb2Rhc2ggaXMgdW5hdmFpbGFibGUgYXQgdGhpcyBwb2ludClcclxuICAgICAgbGV0IGlzUlRMID0gZmFsc2U7XHJcbiAgICAgIHJ0bExvY2FsZXMuZm9yRWFjaCggcnRsTG9jYWxlID0+IHtcclxuICAgICAgICBpZiAoIGxvY2FsZS5zdGFydHNXaXRoKCBydGxMb2NhbGUgKSApIHtcclxuICAgICAgICAgIGlzUlRMID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnN0IHN0cmluZ0tleVByZWZpeCA9IGAke3JlcXVpcmVqc05hbWVzcGFjZX0vYDtcclxuXHJcbiAgICAgIC8vIEVuc3VyZSBhIGxvY2FsZS1zcGVjaWZpYyBzdWItb2JqZWN0XHJcbiAgICAgIHBoZXQuY2hpcHBlci5zdHJpbmdzWyBsb2NhbGUgXSA9IHBoZXQuY2hpcHBlci5zdHJpbmdzWyBsb2NhbGUgXSB8fCB7fTtcclxuICAgICAgY29uc3QgbG9jYWxlU3RyaW5nTWFwID0gcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdO1xyXG5cclxuICAgICAgY29uc3QgcmVjdXJzZSA9ICggcGF0aCwgb2JqZWN0ICkgPT4ge1xyXG4gICAgICAgIE9iamVjdC5rZXlzKCBvYmplY3QgKS5mb3JFYWNoKCBrZXkgPT4ge1xyXG4gICAgICAgICAgaWYgKCBrZXkgPT09ICd2YWx1ZScgKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IG9iamVjdC52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBkaXJlY3Rpb25hbCBtYXJrc1xyXG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWUgPSBgJHsoIGlzUlRMID8gJ1xcdTIwMmInIDogJ1xcdTIwMmEnICl9JHt2YWx1ZX1cXHUyMDJjYDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbG9jYWxlU3RyaW5nTWFwWyBgJHtzdHJpbmdLZXlQcmVmaXh9JHtwYXRofWAgXSA9IHZhbHVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIG9iamVjdFsga2V5IF0gJiYgdHlwZW9mIG9iamVjdFsga2V5IF0gPT09ICdvYmplY3QnICkge1xyXG4gICAgICAgICAgICByZWN1cnNlKCBgJHtwYXRofSR7cGF0aC5sZW5ndGggPyAnLicgOiAnJ30ke2tleX1gLCBvYmplY3RbIGtleSBdICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9O1xyXG4gICAgICByZWN1cnNlKCAnJywgc3RyaW5nT2JqZWN0WyBsb2NhbGUgXSApO1xyXG4gICAgfSApO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpcmVzIG9mZiBhIHJlcXVlc3QgZm9yIGEgSlNPTiBmaWxlLCBlaXRoZXIgaW4gYmFiZWwgKGZvciBub24tRW5nbGlzaCkgc3RyaW5ncywgb3IgaW4gdGhlIGFjdHVhbCByZXBvXHJcbiAgICogKGZvciBFbmdsaXNoKSBzdHJpbmdzLCBvciBmb3IgdGhlIHVuYnVpbHRfZW4gc3RyaW5ncyBmaWxlLiBXaGVuIGl0IGlzIGxvYWRlZCwgaXQgd2lsbCB0cnkgdG8gcGFyc2UgdGhlIHJlc3BvbnNlXHJcbiAgICogYW5kIHRoZW4gcGFzcyB0aGUgb2JqZWN0IGZvciBwcm9jZXNzaW5nLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBSZWxhdGl2ZSBwYXRoIHRvIGxvYWQgSlNPTiBmaWxlIGZyb21cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufG51bGx9IGNhbGxiYWNrXHJcbiAgICovXHJcbiAgY29uc3QgcmVxdWVzdEpTT05GaWxlID0gKCBwYXRoLCBjYWxsYmFjayApID0+IHtcclxuICAgIHJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzKys7XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsICgpID0+IHtcclxuICAgICAgaWYgKCByZXF1ZXN0LnN0YXR1cyA9PT0gMjAwICkge1xyXG4gICAgICAgIGxldCBqc29uO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZSggcmVxdWVzdC5yZXNwb25zZVRleHQgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBDb3VsZCBsb2FkIGZpbGUgJHtwYXRofSwgcGVyaGFwcyB0aGF0IHRyYW5zbGF0aW9uIGRvZXMgbm90IGV4aXN0IHlldD9gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCBqc29uICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAtLXJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzID09PSAwICkge1xyXG4gICAgICAgIGZpbmlzaFByb2Nlc3NpbmcoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgKCkgPT4ge1xyXG4gICAgICBpZiAoICEoIGxvY2FsZXNRdWVyeVBhcmFtID09PSAnKicgKSApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggYENvdWxkIG5vdCBsb2FkICR7cGF0aH1gICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAtLXJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzID09PSAwICkge1xyXG4gICAgICAgIGZpbmlzaFByb2Nlc3NpbmcoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIHJlcXVlc3Qub3BlbiggJ0dFVCcsIHBhdGgsIHRydWUgKTtcclxuICAgIHJlcXVlc3Quc2VuZCgpO1xyXG4gIH07XHJcblxyXG4gIC8vIFRoZSBjYWxsYmFjayB0byBleGVjdXRlIHdoZW4gYWxsIHN0cmluZyBmaWxlcyBhcmUgcHJvY2Vzc2VkLlxyXG4gIGNvbnN0IGZpbmlzaFByb2Nlc3NpbmcgPSAoKSA9PiB7XHJcblxyXG4gICAgLy8gUHJvZ3Jlc3Mgd2l0aCBsb2FkaW5nIG1vZHVsZXNcclxuICAgIHdpbmRvdy5waGV0LmNoaXBwZXIubG9hZE1vZHVsZXMoKTtcclxuICB9O1xyXG5cclxuICBsZXQgbG9jYWxlcyA9IFsgRkFMTEJBQ0tfTE9DQUxFIF07XHJcblxyXG4gIGlmICggbG9jYWxlc1F1ZXJ5UGFyYW0gPT09ICcqJyApIHtcclxuICAgIGxvY2FsZXMgPSAnYWEsYWIsYWUsYWYsYWssYW0sYW4sYXIsYXJfTUEsYXJfU0EsYXMsYXYsYXksYXosYmEsYmUsYmcsYmgsYmksYm0sYm4sYm8sYnIsYnMsY2EsY2UsY2gsY28sY3IsY3MsY3UsY3YsY3ksZGEsZGUsZHYsZHosZWUsZWwsZW4sZW5fQ0EsZW5fR0IsZW8sZXMsZXNfQ08sZXNfQ1IsZXNfRVMsZXNfTVgsZXNfUEUsZXQsZXUsZmEsZmYsZmksZmosZm8sZnIsZnUsZnksZ2EsZ2QsZ2wsZ24sZ3UsZ3YsaGEsaGksaG8saHIsaHQsaHUsaHksaHosaWEsaWUsaWcsaWksaWssaW4saW8saXMsaXQsaXUsaXcsamEsamksanYsa2Esa2csa2ksa2osa2ssa2wsa20sa24sa28sa3Isa3Msa3Usa3VfVFIsa3Ysa3csa3ksbGEsbGIsbGcsbGksbGssbG4sbG8sbHQsbHUsbHYsbWcsbWgsbWksbWssbWwsbW4sbW8sbXIsbXMsbXQsbXksbmEsbmIsbmQsbmUsbmcsbmwsbm4sbnIsbnYsbnksb2Msb2osb20sb3Isb3MscGEscGkscGwscHMscHQscHRfQlIscXUscm0scm4scm8scnUscncscnksc2Esc2Msc2Qsc2Usc2csc2gsc2ksc2ssc2wsc20sc24sc28sc3Esc3Isc3Msc3Qsc3Usc3Ysc3csdGEsdGUsdGcsdGgsdGksdGssdGwsdG4sdG8sdHIsdHMsdHQsdHcsdHksdWcsdWssdXIsdXosdmUsdmksdm8sd2Esd28seGgseW8semEsemhfQ04semhfSEssemhfVFcsenUnLnNwbGl0KCAnLCcgKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICAvLyBMb2FkIG90aGVyIGxvY2FsZXMgd2UgbWlnaHQgcG90ZW50aWFsbHkgbmVlZCAoa2VlcGluZyBvdXQgZHVwbGljYXRlcylcclxuICAgIFtcclxuICAgICAgbG9jYWxlUXVlcnlQYXJhbSxcclxuICAgICAgLi4uKCBsb2NhbGVzUXVlcnlQYXJhbSA/IGxvY2FsZXNRdWVyeVBhcmFtLnNwbGl0KCAnLCcgKSA6IFtdIClcclxuICAgIF0uZm9yRWFjaCggbG9jYWxlID0+IHtcclxuICAgICAgaWYgKCBsb2NhbGUgKSB7XHJcbiAgICAgICAgLy8gZS5nLiAnemhfQ04nXHJcbiAgICAgICAgaWYgKCAhbG9jYWxlcy5pbmNsdWRlcyggbG9jYWxlICkgKSB7XHJcbiAgICAgICAgICBsb2NhbGVzLnB1c2goIGxvY2FsZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBlLmcuICd6aCdcclxuICAgICAgICBjb25zdCBzaG9ydExvY2FsZSA9IGxvY2FsZS5zbGljZSggMCwgMiApO1xyXG4gICAgICAgIGlmICggbG9jYWxlLmxlbmd0aCA+IDIgJiYgIWxvY2FsZXMuaW5jbHVkZXMoIHNob3J0TG9jYWxlICkgKSB7XHJcbiAgICAgICAgICBsb2NhbGVzLnB1c2goIHNob3J0TG9jYWxlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvLyBDaGVjayBmb3IgcGhldC5jaGlwcGVyLnN0cmluZ1BhdGguIFRoaXMgc2hvdWxkIGJlIHNldCB0byBBREpVU1QgdGhlIHBhdGggdG8gdGhlIHN0cmluZ3MgZGlyZWN0b3J5LCBpbiBjYXNlc1xyXG4gIC8vIHdoZXJlIHdlJ3JlIHJ1bm5pbmcgdGhpcyBjYXNlIE5PVCBmcm9tIGEgcmVwbydzIHRvcCBsZXZlbCAoZS5nLiBzYW5kYm94Lmh0bWwpXHJcbiAgY29uc3QgZ2V0U3RyaW5nUGF0aCA9ICggcmVwbywgbG9jYWxlICkgPT4gYCR7cGhldC5jaGlwcGVyLnN0cmluZ1BhdGggPyBwaGV0LmNoaXBwZXIuc3RyaW5nUGF0aCA6ICcnfS4uLyR7bG9jYWxlID09PSBGQUxMQkFDS19MT0NBTEUgPyAnJyA6ICdiYWJlbC8nfSR7cmVwb30vJHtyZXBvfS1zdHJpbmdzXyR7bG9jYWxlfS5qc29uYDtcclxuXHJcbiAgLy8gU2VlIGlmIG91ciByZXF1ZXN0IGZvciB0aGUgc2ltLXNwZWNpZmljIHN0cmluZ3MgZmlsZSB3b3Jrcy4gSWYgc28sIG9ubHkgdGhlbiB3aWxsIHdlIGxvYWQgdGhlIGNvbW1vbiByZXBvcyBmaWxlc1xyXG4gIC8vIGZvciB0aGF0IGxvY2FsZS5cclxuICBjb25zdCBvdXJSZXBvID0gcGhldC5jaGlwcGVyLnBhY2thZ2VPYmplY3QubmFtZTtcclxuICBsZXQgb3VyUmVxdWlyZWpzTmFtZXNwYWNlO1xyXG4gIHBoZXQuY2hpcHBlci5zdHJpbmdSZXBvcy5mb3JFYWNoKCBkYXRhID0+IHtcclxuICAgIGlmICggZGF0YS5yZXBvID09PSBvdXJSZXBvICkge1xyXG4gICAgICBvdXJSZXF1aXJlanNOYW1lc3BhY2UgPSBkYXRhLnJlcXVpcmVqc05hbWVzcGFjZTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIFRPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vaXNzdWVzLzE4NzcgVW5jb21tZW50IHRoaXMgdG8gbG9hZCB0aGUgdXNlZCBzdHJpbmcgbGlzdFxyXG4gIC8vIHJlcXVlc3RKU09ORmlsZSggYC4uL3BoZXQtaW8tc2ltLXNwZWNpZmljL3JlcG9zLyR7b3VyUmVwb30vdXNlZC1zdHJpbmdzX2VuLmpzb25gLCBqc29uID0+IHtcclxuICAvL1xyXG4gIC8vICAgLy8gU3RvcmUgZm9yIHJ1bnRpbWUgdXNhZ2VcclxuICAvLyAgIHBoZXQuY2hpcHBlci51c2VkU3RyaW5nc0VOID0ganNvbjtcclxuICAvLyB9ICk7XHJcblxyXG4gIGlmICggbG9jYWxlc1F1ZXJ5UGFyYW0gPT09ICcqJyApIHtcclxuXHJcbiAgICAvLyBMb2FkIHRoZSBjb25nbG9tZXJhdGUgZmlsZXNcclxuICAgIHJlcXVlc3RKU09ORmlsZSggYC4uL2JhYmVsL19nZW5lcmF0ZWRfZGV2ZWxvcG1lbnRfc3RyaW5ncy8ke291clJlcG99X2FsbC5qc29uYCwganNvbiA9PiB7XHJcbiAgICAgIHByb2Nlc3NDb25nbG9tZXJhdGVTdHJpbmdGaWxlKCBqc29uLCBvdXJSZXF1aXJlanNOYW1lc3BhY2UgKTtcclxuICAgICAgcGhldC5jaGlwcGVyLnN0cmluZ1JlcG9zLmZvckVhY2goIHN0cmluZ1JlcG9EYXRhID0+IHtcclxuICAgICAgICBjb25zdCByZXBvID0gc3RyaW5nUmVwb0RhdGEucmVwbztcclxuICAgICAgICBpZiAoIHJlcG8gIT09IG91clJlcG8gKSB7XHJcbiAgICAgICAgICByZXF1ZXN0SlNPTkZpbGUoIGAuLi9iYWJlbC9fZ2VuZXJhdGVkX2RldmVsb3BtZW50X3N0cmluZ3MvJHtyZXBvfV9hbGwuanNvbmAsIGpzb24gPT4ge1xyXG4gICAgICAgICAgICBwcm9jZXNzQ29uZ2xvbWVyYXRlU3RyaW5nRmlsZSgganNvbiwgc3RyaW5nUmVwb0RhdGEucmVxdWlyZWpzTmFtZXNwYWNlICk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gRXZlbiB0aG91Z2ggdGhlIEVuZ2xpc2ggc3RyaW5ncyBhcmUgaW5jbHVkZWQgaW4gdGhlIGNvbmdsb21lcmF0ZSBmaWxlLCBsb2FkIHRoZSBlbmdsaXNoIGZpbGUgZGlyZWN0bHkgc28gdGhhdFxyXG4gICAgLy8geW91IGNhbiBjaGFuZ2UgX2VuIHN0cmluZ3Mgd2l0aG91dCBoYXZpbmcgdG8gcnVuICdncnVudCBnZW5lcmF0ZS11bmJ1aWx0LXN0cmluZ3MnIGJlZm9yZSBzZWVpbmcgY2hhbmdlcy5cclxuICAgIHJlcXVlc3RKU09ORmlsZSggZ2V0U3RyaW5nUGF0aCggb3VyUmVwbywgJ2VuJyApLCBqc29uID0+IHtcclxuICAgICAgcHJvY2Vzc1N0cmluZ0ZpbGUoIGpzb24sIG91clJlcXVpcmVqc05hbWVzcGFjZSwgJ2VuJyApO1xyXG4gICAgICBwaGV0LmNoaXBwZXIuc3RyaW5nUmVwb3MuZm9yRWFjaCggc3RyaW5nUmVwb0RhdGEgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJlcG8gPSBzdHJpbmdSZXBvRGF0YS5yZXBvO1xyXG4gICAgICAgIGlmICggcmVwbyAhPT0gb3VyUmVwbyApIHtcclxuICAgICAgICAgIHJlcXVlc3RKU09ORmlsZSggZ2V0U3RyaW5nUGF0aCggcmVwbywgJ2VuJyApLCBqc29uID0+IHtcclxuICAgICAgICAgICAgcHJvY2Vzc1N0cmluZ0ZpbGUoIGpzb24sIHN0cmluZ1JlcG9EYXRhLnJlcXVpcmVqc05hbWVzcGFjZSwgJ2VuJyApO1xyXG4gICAgICAgICAgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuXHJcbiAgICAvLyBMb2FkIGp1c3QgdGhlIHNwZWNpZmllZCBsb2NhbGVzXHJcbiAgICBsb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcbiAgICAgIHJlcXVlc3RKU09ORmlsZSggZ2V0U3RyaW5nUGF0aCggb3VyUmVwbywgbG9jYWxlICksIGpzb24gPT4ge1xyXG4gICAgICAgIHByb2Nlc3NTdHJpbmdGaWxlKCBqc29uLCBvdXJSZXF1aXJlanNOYW1lc3BhY2UsIGxvY2FsZSApO1xyXG4gICAgICAgIHBoZXQuY2hpcHBlci5zdHJpbmdSZXBvcy5mb3JFYWNoKCBzdHJpbmdSZXBvRGF0YSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZXBvID0gc3RyaW5nUmVwb0RhdGEucmVwbztcclxuICAgICAgICAgIGlmICggcmVwbyAhPT0gb3VyUmVwbyApIHtcclxuICAgICAgICAgICAgcmVxdWVzdEpTT05GaWxlKCBnZXRTdHJpbmdQYXRoKCByZXBvLCBsb2NhbGUgKSwganNvbiA9PiB7XHJcbiAgICAgICAgICAgICAgcHJvY2Vzc1N0cmluZ0ZpbGUoIGpzb24sIHN0cmluZ1JlcG9EYXRhLnJlcXVpcmVqc05hbWVzcGFjZSwgbG9jYWxlICk7XHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuICB9XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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