/* eslint-disable */
import asyncLoader from '../../phet-core/js/asyncLoader.js';
import base64SoundToByteArray from '../../tambo/js/base64SoundToByteArray.js';
import WrappedAudioBuffer from '../../tambo/js/WrappedAudioBuffer.js';
import phetAudioContext from '../../tambo/js/phetAudioContext.js';
const soundURI = 'data:audio/mpeg;base64,//tQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAE5AAzMzMzMzMzMzMzMzMzMzMzMzMzZmZmZmZmZmZmZmZmZmZmZmZmZmaZmZmZmZmZmZmZmZmZmZmZmZmZmczMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////8AAAA5TEFNRTMuOTlyAaUAAAAAAAAAABRAJAZmQgAAQAAABOTGvClKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAjxrv+ggLoZGTXh9oJQAa222FG3ASABBG51MY/j4AAB4AYI3/H3//Pqd/zv0Jp/8//zn3n6Mmf/J7f//8jf+fOeeggHA4RXkGh8XEwHAMHD4udyCYuhAALhgJqWJAEDGMYxvHlyAHxc9P76dP//T/Rm//p+v9tvb0Tzr1XyfnelP/3b0//5vo86Mlm0dHQrscccRQg5oSYpziaiB52oQCkxnR6LQisRCEMhluyeqEhIiWMiSvQjhwDTCtCPyDkNrP+UsBTNwVsJGSD/+1LEFoAQMWtluYaQEWGP7H+wYAR9IvpDLBawV8OWbG5oShmbiVnh8GAU6ZIjnetMKuOcpmaSndX80HuS7puaIKq/6lvM36lIJf8+Zm6CFA0t3fV/91IOhPJ1GCH13q//5o6DJl9/F3ErtwAGRlJ26tx4H5gV4lzzrIqy8jTNBZl1Hep3doI2/x6AMOljV5/M4clzeagOVs4SmnmZk2fTyahylhxZ1R7/1HlnhEe4KgF3SISoKnviYs9T8sp4Ku5ICsAAg3RwNdct5GVqea2W4P/7UsQHgAuZRzrtmE8JO4qkaa4M4MXAzUcoyYPSsZe/D4w5DUicEmE/ziQka1VaLTh0y8+qp/UtRMpQoli5jYCz6St//RjTOrPXlI/KJaZ2RHX6mMrJqxfqVjPM/K/thi6pyAAPlyOxkEr9tPgR2ldNwBRI0383ZJR5NmIAG2zBZOw1tKaJR6jzjIxgTlVLjBgJmawwRo8JXAUYCz1gr/q+aVWur8tO+j4iUe////6ii3UCwZHQhxd93nYdy9H1MjPwThY/VGgQQLo200aOkCDF//tSxA+CCwg1HK3lIQHXlCPo97AIw8D44EBOcB8oGBIND4gcCBc+IFHC7wwUOA+oMiAaH1PDCw+mxbydxPV3/zjbCnci8p/9nIJTQYSH5vktZIAEdHIA5HkiS4k11MYsCUFS8QSbEVhJUnQlFpKIJNQhJJrBKEZ8kiKoJIkqToSj5KJJ6hiCTXCUJUZJEl45Ek9TCUfQkkyuSSbzS72V1mVruLnhMeBUsHREPDQiPA0VOiJwdKuBlR5Fqtbk3f///t8FdSogAuxJp2uAWhIWFmv/+1LEBgPGHADHoIhgIAAANIAAAATcLVLFRWKCwsLCyxUVFVf6xVmLCws1YqKior////2RVn/+LCwtTEFNRTMuOTkuM1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
const soundByteArray = base64SoundToByteArray(phetAudioContext, soundURI);
const unlock = asyncLoader.createLock(soundURI);
const wrappedAudioBuffer = new WrappedAudioBuffer();

// safe way to unlock
let unlocked = false;
const safeUnlock = () => {
  if (!unlocked) {
    unlock();
    unlocked = true;
  }
};
const onDecodeSuccess = decodedAudio => {
  if (wrappedAudioBuffer.audioBufferProperty.value === null) {
    wrappedAudioBuffer.audioBufferProperty.set(decodedAudio);
    safeUnlock();
  }
};
const onDecodeError = decodeError => {
  console.warn('decode of audio data failed, using stubbed sound, error: ' + decodeError);
  wrappedAudioBuffer.audioBufferProperty.set(phetAudioContext.createBuffer(1, 1, phetAudioContext.sampleRate));
  safeUnlock();
};
const decodePromise = phetAudioContext.decodeAudioData(soundByteArray.buffer, onDecodeSuccess, onDecodeError);
if (decodePromise) {
  decodePromise.then(decodedAudio => {
    if (wrappedAudioBuffer.audioBufferProperty.value === null) {
      wrappedAudioBuffer.audioBufferProperty.set(decodedAudio);
      safeUnlock();
    }
  }).catch(e => {
    console.warn('promise rejection caught for audio decode, error = ' + e);
    safeUnlock();
  });
}
export default wrappedAudioBuffer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3luY0xvYWRlciIsImJhc2U2NFNvdW5kVG9CeXRlQXJyYXkiLCJXcmFwcGVkQXVkaW9CdWZmZXIiLCJwaGV0QXVkaW9Db250ZXh0Iiwic291bmRVUkkiLCJzb3VuZEJ5dGVBcnJheSIsInVubG9jayIsImNyZWF0ZUxvY2siLCJ3cmFwcGVkQXVkaW9CdWZmZXIiLCJ1bmxvY2tlZCIsInNhZmVVbmxvY2siLCJvbkRlY29kZVN1Y2Nlc3MiLCJkZWNvZGVkQXVkaW8iLCJhdWRpb0J1ZmZlclByb3BlcnR5IiwidmFsdWUiLCJzZXQiLCJvbkRlY29kZUVycm9yIiwiZGVjb2RlRXJyb3IiLCJjb25zb2xlIiwid2FybiIsImNyZWF0ZUJ1ZmZlciIsInNhbXBsZVJhdGUiLCJkZWNvZGVQcm9taXNlIiwiZGVjb2RlQXVkaW9EYXRhIiwiYnVmZmVyIiwidGhlbiIsImNhdGNoIiwiZSJdLCJzb3VyY2VzIjpbInJhZGlvQnV0dG9uVjJfbXAzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBhc3luY0xvYWRlciBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvYXN5bmNMb2FkZXIuanMnO1xyXG5pbXBvcnQgYmFzZTY0U291bmRUb0J5dGVBcnJheSBmcm9tICcuLi8uLi90YW1iby9qcy9iYXNlNjRTb3VuZFRvQnl0ZUFycmF5LmpzJztcclxuaW1wb3J0IFdyYXBwZWRBdWRpb0J1ZmZlciBmcm9tICcuLi8uLi90YW1iby9qcy9XcmFwcGVkQXVkaW9CdWZmZXIuanMnO1xyXG5pbXBvcnQgcGhldEF1ZGlvQ29udGV4dCBmcm9tICcuLi8uLi90YW1iby9qcy9waGV0QXVkaW9Db250ZXh0LmpzJztcclxuXHJcbmNvbnN0IHNvdW5kVVJJID0gJ2RhdGE6YXVkaW8vbXBlZztiYXNlNjQsLy90UXhBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVNXNW1id0FBQUE4QUFBQUZBQUFFNUFBek16TXpNek16TXpNek16TXpNek16TXpNelptWm1abVptWm1abVptWm1abVptWm1abVptYVptWm1abVptWm1abVptWm1abVptWm1abVptY3pNek16TXpNek16TXpNek16TXpNek16TXpNLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy84QUFBQTVURUZOUlRNdU9UbHlBYVVBQUFBQUFBQUFBQlJBSkFabVFnQUFRQUFBQk9UR3ZDbEtBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVAvN1VNUUFBQWp4cnYrZ2dMb1pHVFhoOW9KUUFhMjIyRkczQVNBQkJHNTFNWS9qNEFBQjRBWUkzL0gzLy9QcWQvenYwSnAvOC8vem4zbjZNbWYvSjdmLy84amYrZk9lZWdnSEE0UlhrR2g4WEV3SEFNSEQ0dWR5Q1l1aEFBTGhnSnFXSkFFREdNWXh2SGx5QUh4YzlQNzZkUC8vVC9SbS8vcCt2OXR2YjBUenIxWHlmbmVsUC8zYjAvLzV2bzg2TWxtMGRIUXJzY2NjUlFnNW9TWXB6aWFpQjUyb1FDa3huUjZMUWlzUkNFTWhsdXllcUVoSWlXTWlTdlFqaHdEVEN0Q1B5RGtOclArVXNCVE53VnNKR1NELysxTEVGb0FRTVd0bHVZYVFFV0dQN0grd1lBUjlJdnBETEJhd1Y4T1diRzVvU2htYmlWbmg4R0FVNlpJam5ldE1LdU9jcG1hU25kWDgwSHVTN3B1YUlLcS82bHZNMzZsSUpmOCtabTZDRkEwdDNmVi85MUlPaFBKMUdDSDEzcS8vNW82REpsOS9GM0VydHdBR1JsSjI2dHg0SDVnVjRsenpySXF5OGpUTkJabDFIZXAzZG9JMi94NkFNT2xqVjUvTTRjbHplYWdPVnM0U21ubVprMmZUeWFoeWxoeFoxUjcvMUhsbmhFZTRLZ0YzU0lTb0tudmlZczlUOHNwNEt1NUlDc0FBZzNSd05kY3Q1R1ZxZWEyVzRQLzdVc1FIZ0F1WlJ6cnRtRThKTzRxa2FhNE00TVhBelVjb3lZUFNzWmUvRDR3NURVaWNFbUUvemlRa2ExVmFMVGgweTgrcXAvVXRSTXBRb2xpNWpZQ3o2U3QvL1JqVE9yUFhsSS9LSmFaMlJIWDZtTXJKcXhmcVZqUE0vSy90aGk2cHlBQVBseU94a0VyOXRQZ1IybGROd0JSSTAzODNaSlI1Tm1JQUcyekJaT3cxdEthSlI2anpqSXhnVGxWTGpCZ0ptYXd3Um84SlhBVVlDejFnci9xK2FWV3VyOHRPK2o0aVVlLy8vLzZpaTNVQ3daSFFoeGQ5M25ZZHk5SDFNalB3VGhZL1ZHZ1FRTG8yMDBhT2tDREYvL3RTeEErQ0N3ZzFISzNsSVFIWGxDUG85N0FJdzhENDRFQk9jQjhvR0JJTkQ0Z2NDQmMrSUZIQzd3d1VPQStvTWlBYUgxUERDdytteGJ5ZHhQVjMvempiQ25jaThwLzluSUpUUVlTSDV2a3RaSUFFZEhJQTVIa2lTNGsxMU1Zc0NVRlM4UVNiRVZoSlVuUWxGcEtJSk5RaEpKckJLRVo4a2lLb0pJa3FUb1NqNUtKSjZoaUNUWENVSlVaSkVsNDVFazlUQ1VmUWtreXVTU2J6UzcyVjFtVnJ1TG5oTWVCVXNIUkVQRFFpUEEwVk9pSndkS3VCbFI1RnF0YmszZi8vL3Q4RmRTb2dBdXhKcDJ1QVdoSVdGbXYvKzFMRUJnUEdIQURIb0loZ0lBQUFOSUFBQUFUY0xWTEZSV0tDd3NMQ3l4VVZGVmY2eFZtTEN3czFZcUtpb3IvLy8vMlJWbi8rTEN3dFRFRk5SVE11T1RrdU0xVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlE9PSc7XHJcbmNvbnN0IHNvdW5kQnl0ZUFycmF5ID0gYmFzZTY0U291bmRUb0J5dGVBcnJheSggcGhldEF1ZGlvQ29udGV4dCwgc291bmRVUkkgKTtcclxuY29uc3QgdW5sb2NrID0gYXN5bmNMb2FkZXIuY3JlYXRlTG9jayggc291bmRVUkkgKTtcclxuY29uc3Qgd3JhcHBlZEF1ZGlvQnVmZmVyID0gbmV3IFdyYXBwZWRBdWRpb0J1ZmZlcigpO1xyXG5cclxuLy8gc2FmZSB3YXkgdG8gdW5sb2NrXHJcbmxldCB1bmxvY2tlZCA9IGZhbHNlO1xyXG5jb25zdCBzYWZlVW5sb2NrID0gKCkgPT4ge1xyXG4gIGlmICggIXVubG9ja2VkICkge1xyXG4gICAgdW5sb2NrKCk7XHJcbiAgICB1bmxvY2tlZCA9IHRydWU7XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3Qgb25EZWNvZGVTdWNjZXNzID0gZGVjb2RlZEF1ZGlvID0+IHtcclxuICBpZiAoIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnZhbHVlID09PSBudWxsICkge1xyXG4gICAgd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkuc2V0KCBkZWNvZGVkQXVkaW8gKTtcclxuICAgIHNhZmVVbmxvY2soKTtcclxuICB9XHJcbn07XHJcbmNvbnN0IG9uRGVjb2RlRXJyb3IgPSBkZWNvZGVFcnJvciA9PiB7XHJcbiAgY29uc29sZS53YXJuKCAnZGVjb2RlIG9mIGF1ZGlvIGRhdGEgZmFpbGVkLCB1c2luZyBzdHViYmVkIHNvdW5kLCBlcnJvcjogJyArIGRlY29kZUVycm9yICk7XHJcbiAgd3JhcHBlZEF1ZGlvQnVmZmVyLmF1ZGlvQnVmZmVyUHJvcGVydHkuc2V0KCBwaGV0QXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlciggMSwgMSwgcGhldEF1ZGlvQ29udGV4dC5zYW1wbGVSYXRlICkgKTtcclxuICBzYWZlVW5sb2NrKCk7XHJcbn07XHJcbmNvbnN0IGRlY29kZVByb21pc2UgPSBwaGV0QXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YSggc291bmRCeXRlQXJyYXkuYnVmZmVyLCBvbkRlY29kZVN1Y2Nlc3MsIG9uRGVjb2RlRXJyb3IgKTtcclxuaWYgKCBkZWNvZGVQcm9taXNlICkge1xyXG4gIGRlY29kZVByb21pc2VcclxuICAgIC50aGVuKCBkZWNvZGVkQXVkaW8gPT4ge1xyXG4gICAgICBpZiAoIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnZhbHVlID09PSBudWxsICkge1xyXG4gICAgICAgIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggZGVjb2RlZEF1ZGlvICk7XHJcbiAgICAgICAgc2FmZVVubG9jaygpO1xyXG4gICAgICB9XHJcbiAgICB9IClcclxuICAgIC5jYXRjaCggZSA9PiB7XHJcbiAgICAgIGNvbnNvbGUud2FybiggJ3Byb21pc2UgcmVqZWN0aW9uIGNhdWdodCBmb3IgYXVkaW8gZGVjb2RlLCBlcnJvciA9ICcgKyBlICk7XHJcbiAgICAgIHNhZmVVbmxvY2soKTtcclxuICAgIH0gKTtcclxufVxyXG5leHBvcnQgZGVmYXVsdCB3cmFwcGVkQXVkaW9CdWZmZXI7Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLE9BQU9BLFdBQVcsTUFBTSxtQ0FBbUM7QUFDM0QsT0FBT0Msc0JBQXNCLE1BQU0sMENBQTBDO0FBQzdFLE9BQU9DLGtCQUFrQixNQUFNLHNDQUFzQztBQUNyRSxPQUFPQyxnQkFBZ0IsTUFBTSxvQ0FBb0M7QUFFakUsTUFBTUMsUUFBUSxHQUFHLGlxREFBaXFEO0FBQ2xyRCxNQUFNQyxjQUFjLEdBQUdKLHNCQUFzQixDQUFFRSxnQkFBZ0IsRUFBRUMsUUFBUyxDQUFDO0FBQzNFLE1BQU1FLE1BQU0sR0FBR04sV0FBVyxDQUFDTyxVQUFVLENBQUVILFFBQVMsQ0FBQztBQUNqRCxNQUFNSSxrQkFBa0IsR0FBRyxJQUFJTixrQkFBa0IsQ0FBQyxDQUFDOztBQUVuRDtBQUNBLElBQUlPLFFBQVEsR0FBRyxLQUFLO0FBQ3BCLE1BQU1DLFVBQVUsR0FBR0EsQ0FBQSxLQUFNO0VBQ3ZCLElBQUssQ0FBQ0QsUUFBUSxFQUFHO0lBQ2ZILE1BQU0sQ0FBQyxDQUFDO0lBQ1JHLFFBQVEsR0FBRyxJQUFJO0VBQ2pCO0FBQ0YsQ0FBQztBQUVELE1BQU1FLGVBQWUsR0FBR0MsWUFBWSxJQUFJO0VBQ3RDLElBQUtKLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0MsS0FBSyxLQUFLLElBQUksRUFBRztJQUMzRE4sa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVILFlBQWEsQ0FBQztJQUMxREYsVUFBVSxDQUFDLENBQUM7RUFDZDtBQUNGLENBQUM7QUFDRCxNQUFNTSxhQUFhLEdBQUdDLFdBQVcsSUFBSTtFQUNuQ0MsT0FBTyxDQUFDQyxJQUFJLENBQUUsMkRBQTJELEdBQUdGLFdBQVksQ0FBQztFQUN6RlQsa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVaLGdCQUFnQixDQUFDaUIsWUFBWSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVqQixnQkFBZ0IsQ0FBQ2tCLFVBQVcsQ0FBRSxDQUFDO0VBQ2hIWCxVQUFVLENBQUMsQ0FBQztBQUNkLENBQUM7QUFDRCxNQUFNWSxhQUFhLEdBQUduQixnQkFBZ0IsQ0FBQ29CLGVBQWUsQ0FBRWxCLGNBQWMsQ0FBQ21CLE1BQU0sRUFBRWIsZUFBZSxFQUFFSyxhQUFjLENBQUM7QUFDL0csSUFBS00sYUFBYSxFQUFHO0VBQ25CQSxhQUFhLENBQ1ZHLElBQUksQ0FBRWIsWUFBWSxJQUFJO0lBQ3JCLElBQUtKLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0MsS0FBSyxLQUFLLElBQUksRUFBRztNQUMzRE4sa0JBQWtCLENBQUNLLG1CQUFtQixDQUFDRSxHQUFHLENBQUVILFlBQWEsQ0FBQztNQUMxREYsVUFBVSxDQUFDLENBQUM7SUFDZDtFQUNGLENBQUUsQ0FBQyxDQUNGZ0IsS0FBSyxDQUFFQyxDQUFDLElBQUk7SUFDWFQsT0FBTyxDQUFDQyxJQUFJLENBQUUscURBQXFELEdBQUdRLENBQUUsQ0FBQztJQUN6RWpCLFVBQVUsQ0FBQyxDQUFDO0VBQ2QsQ0FBRSxDQUFDO0FBQ1A7QUFDQSxlQUFlRixrQkFBa0IiLCJpZ25vcmVMaXN0IjpbXX0=