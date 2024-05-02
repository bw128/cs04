/* eslint-disable */
import asyncLoader from '../../phet-core/js/asyncLoader.js';
import base64SoundToByteArray from '../../tambo/js/base64SoundToByteArray.js';
import WrappedAudioBuffer from '../../tambo/js/WrappedAudioBuffer.js';
import phetAudioContext from '../../tambo/js/phetAudioContext.js';
const soundURI = 'data:audio/mpeg;base64,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';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3luY0xvYWRlciIsImJhc2U2NFNvdW5kVG9CeXRlQXJyYXkiLCJXcmFwcGVkQXVkaW9CdWZmZXIiLCJwaGV0QXVkaW9Db250ZXh0Iiwic291bmRVUkkiLCJzb3VuZEJ5dGVBcnJheSIsInVubG9jayIsImNyZWF0ZUxvY2siLCJ3cmFwcGVkQXVkaW9CdWZmZXIiLCJ1bmxvY2tlZCIsInNhZmVVbmxvY2siLCJvbkRlY29kZVN1Y2Nlc3MiLCJkZWNvZGVkQXVkaW8iLCJhdWRpb0J1ZmZlclByb3BlcnR5IiwidmFsdWUiLCJzZXQiLCJvbkRlY29kZUVycm9yIiwiZGVjb2RlRXJyb3IiLCJjb25zb2xlIiwid2FybiIsImNyZWF0ZUJ1ZmZlciIsInNhbXBsZVJhdGUiLCJkZWNvZGVQcm9taXNlIiwiZGVjb2RlQXVkaW9EYXRhIiwiYnVmZmVyIiwidGhlbiIsImNhdGNoIiwiZSJdLCJzb3VyY2VzIjpbImhvbGxvd1RodWRfbXAzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBhc3luY0xvYWRlciBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvYXN5bmNMb2FkZXIuanMnO1xyXG5pbXBvcnQgYmFzZTY0U291bmRUb0J5dGVBcnJheSBmcm9tICcuLi8uLi90YW1iby9qcy9iYXNlNjRTb3VuZFRvQnl0ZUFycmF5LmpzJztcclxuaW1wb3J0IFdyYXBwZWRBdWRpb0J1ZmZlciBmcm9tICcuLi8uLi90YW1iby9qcy9XcmFwcGVkQXVkaW9CdWZmZXIuanMnO1xyXG5pbXBvcnQgcGhldEF1ZGlvQ29udGV4dCBmcm9tICcuLi8uLi90YW1iby9qcy9waGV0QXVkaW9Db250ZXh0LmpzJztcclxuXHJcbmNvbnN0IHNvdW5kVVJJID0gJ2RhdGE6YXVkaW8vbXBlZztiYXNlNjQsLy90QXhBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVNXNW1id0FBQUE4QUFBQUxBQUFJa1FBWEZ4Y1hGeGNYRnhjdUxpNHVMaTR1TGk1RlJVVkZSVVZGUlVWZFhWMWRYVjFkWFYxMGRIUjBkSFIwZEhTTGk0dUxpNHVMaTR1aW9xS2lvcUtpb3FLNnVycTZ1cnE2dXJyUjBkSFIwZEhSMGRIbzZPam82T2pvNk9qLy8vLy8vLy8vLy84QUFBQThURUZOUlRNdU9UbHlBWllBQUFBQUFBQUFBQlE0SkFPSFFnQUFPQUFBQ0pGcXVtU2hBQUFBQUFELyswREVBQUFFMEFFUlZER0FBY21tN3ZjZkFBTUJxaUFBczdyd1FMZys4bzZIK280VU9Gd2ZIQStmLzhncjJmNGYvL0x2bklJZi8vWi80Z29FUnNXcjBYaUVRcUVZYUVZQXRWU0dnRXNMeEhqZ3RBRmNWVCtKY2Z3c0JPUzRtOEd4WXl6Q3lieHdDRnhPNUFURXd2bnlMbXhPR2FMbWZ4YzVFNXFYMEVDbXMwL055SGtITnp6bVo0Mlp2K204ek45Y3pSVVovOU5OMWw5MlRUNjFMWnpULzVvdE11SVVFT2FGOVZ6UlZ5b0lxeTJTTkp3Z2tQLzdRc1FFQUFuSWozTzg4d0F4UWhJcnRZU001TGdhQjBGak1sV3ExRFM1aG1uVERYemxVNklmTEVuZ2Iwb3RFeDhOUHliZEhXWHZudkpWRXFxdC83dmpSLy9yZFRneDRjRkhyQ2Y0aVRYWjlCRU9qcVFhV0FlamIvb0FFZnRyaktsaWNDYVMraHBLMUdBdGFYUzJ3R2toY0E0b1lFb2JQUytrcENBTnhUQkM5U2hTUS9NbGtxS3Q0ZDZKcFhyT1hPMGIzTnZlMDhvTHg0S21TeWdwZHdXZUZXU05DbFBlS3VXdlY3b0FNMXZHSnR5RndPQ2phUC83UXNRRmdBcFV0MU9zTUdYaFBSSG81UFlOSFBGYWE3ck9YZzdIOTBLaGNKcXRwRCtGYlU2VjlYR29sRkgveERXUU8yMGF0ZEl4SXJXbmljakk4dGFUak4vLzY5dHE0UEpYaWE0aWVJUkJ0SkNJSFI0cmV1VnlxYTljc0FCdEV0SXdPY2hBalFKazl5Q0graEJUSmtXR0IwWU1GYUEyUG5remFvRkFSUjJHZzcyOEJvNU5vUVVaTHFYczBhK1h0bXpBM2RiU0dIeEs0Z3VsZ3hmTnJHa1RZYWFMUGQ3eGRDMGJlMTBCb0h6NEloUVowQTIxbVAvN1FzUUZnZ3BJOXpyTW1LOUJSaEptMmFTWldLeHE4V2U4c1ZibSt6T29uRWJjZWkxc3MwVUJ1cGdWSWdtYzJ6a1V6dmY4bVZrTzV1TjhoU1RuVXRoaVRzb1dPL3RxMlZXVjdaZVVsN1VXMmpwTHEwZVJZeEsyNU8zbXNBUE1BTkdpVFVmREdLQ3FRY3FGSktzMWMrTXVTQm80T0RhQU9nS2ZObHhxbHhGUjZSbWpGcXRpN0J1N0xJUHBBWlpST29zejNwOFJtN1VmTUtBMFc5Y2xFU1ZzSXFLM2tCZ2xIWk1zTUZrTXJRSzE1R1NRWFkyQTR2LzdRc1FFZ0Ftb2owV3NKR2RoUXhJby9QU1pYQVhFUEtuMDFpMUtvMGtRQ2xBNkczd0FVcElWSXl5azlJWGJFcG82QnhBTHk1bTZNNU00YnR1a3ppYy9QRGd6anRkU0FZRTRveG9vUENnWGsxTDBCVlI3MmxzRXdCWFI0aDRpN2Y2eUFnUVFJaDdDZENvUUlzeFRiWnp6QWtOQ0lOQ1lqTGtQRXliSlk2ZFBkTzBMUmFaTm52cnpyVHN6bTN0UnAwdE9UNSswd0dyMUxjS21Wbkd2U2JFakdwT0ZXVk1FYnYvcEFVenUrVWMxcUFCZWNaSXM5Ly83UXNRR2dBa2NqenVzTU1NaEVJd2xkWVlNcVB3TWswY0dBK0VCTVJCNE9TdVVCSm1oSDRYQjFPMzExVzZqcTdHNVhkSHcxb3YybnBhVzhsNjdtcWp2b2wzbFdzRElRRnpMemxoaERLbEtMZ0FCR05JcHRKQjg3UEtpU3M3aHlwY29EVGtETEpDT2lKK0NFSW9OajZHQmEyb0ordG95bm1qSHVXUU1LeVFUSGlDMFRuWEp0LzJCT3VUME5WMi8vMi8vLzMrVkJVYnR0MUl5ZEM0RXRLNHFGaGNWQW8yQXBQV1NqRzlPck1zTEM0K1p6eXNscHYvN1FzUVJBQWRVZ3l0TUpFT0F0SW9rNVlHWkxBZzBtcXdaV1pOQnBCUnJ3cnRyLytqL2Q1bi8renIvLzBBRUl6L0tRRWhRRjhGV2MvZEZFNWJHNHRFSGpRL2tZTTlVdjhaS2tLZWRTSENJbUxxbm05UGIvK3IvMGJFQUFCcEl3bEIxT0JJNk9WTlRhbHVOTGJoRnowdEJyMDYzenNPSzUwOWVkVmczZi8vKy83ZFhvLy8vLys0QklCQnl0cUJvS0NNMGx3RjlQV1hUbzBpZElRM2R2Ly82K3pKNi8vLzlMLy8xS2dTeWxJNDI1QWdJRGlqRWp2LzdRTVF1QUFXZ1lTVk1CTWxBaUlIbXRKRUFEaEZvVWVxdTI2UVRXNGswT0s4Sy9rdi8vVC8vLy8vLy95d0FCRUxYVkF5aTFFakNBNENhUXJ4RDc5S243VW9KVWUwZmYvNzBiR3dORUpaM3MvOXFxZ0NpaUdJRUhZbkFHcm10TUNOM1JvczZHdCtoZnFBVm4vWXQzUi90Ni8xK3NGSXB5MlJ3YWlqTUxQSk1QSlVQVThxbzkzVmRSNy9SLy9wLy95WFZLLy8vL1hWbE51V0FBUUFBQVltUmdkS2lSb2tRbUdXaVNDUkU3LzlTQ05STVFVMUYvL3RDeEZhQUJKd0pNNlFZSURDVmdXUWs5SVFHTXk0NU9TNDFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxLy90Q3hJSUFCQkFGTGFHSVlEQ0hnQ1EwRVF3R3FxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcS8vdEN4TEdEdzF3ZzU2TVl4SEFBQURTQUFBQUVxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXEnO1xyXG5jb25zdCBzb3VuZEJ5dGVBcnJheSA9IGJhc2U2NFNvdW5kVG9CeXRlQXJyYXkoIHBoZXRBdWRpb0NvbnRleHQsIHNvdW5kVVJJICk7XHJcbmNvbnN0IHVubG9jayA9IGFzeW5jTG9hZGVyLmNyZWF0ZUxvY2soIHNvdW5kVVJJICk7XHJcbmNvbnN0IHdyYXBwZWRBdWRpb0J1ZmZlciA9IG5ldyBXcmFwcGVkQXVkaW9CdWZmZXIoKTtcclxuXHJcbi8vIHNhZmUgd2F5IHRvIHVubG9ja1xyXG5sZXQgdW5sb2NrZWQgPSBmYWxzZTtcclxuY29uc3Qgc2FmZVVubG9jayA9ICgpID0+IHtcclxuICBpZiAoICF1bmxvY2tlZCApIHtcclxuICAgIHVubG9jaygpO1xyXG4gICAgdW5sb2NrZWQgPSB0cnVlO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IG9uRGVjb2RlU3VjY2VzcyA9IGRlY29kZWRBdWRpbyA9PiB7XHJcbiAgaWYgKCB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS52YWx1ZSA9PT0gbnVsbCApIHtcclxuICAgIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggZGVjb2RlZEF1ZGlvICk7XHJcbiAgICBzYWZlVW5sb2NrKCk7XHJcbiAgfVxyXG59O1xyXG5jb25zdCBvbkRlY29kZUVycm9yID0gZGVjb2RlRXJyb3IgPT4ge1xyXG4gIGNvbnNvbGUud2FybiggJ2RlY29kZSBvZiBhdWRpbyBkYXRhIGZhaWxlZCwgdXNpbmcgc3R1YmJlZCBzb3VuZCwgZXJyb3I6ICcgKyBkZWNvZGVFcnJvciApO1xyXG4gIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggcGhldEF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIDEsIHBoZXRBdWRpb0NvbnRleHQuc2FtcGxlUmF0ZSApICk7XHJcbiAgc2FmZVVubG9jaygpO1xyXG59O1xyXG5jb25zdCBkZWNvZGVQcm9taXNlID0gcGhldEF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoIHNvdW5kQnl0ZUFycmF5LmJ1ZmZlciwgb25EZWNvZGVTdWNjZXNzLCBvbkRlY29kZUVycm9yICk7XHJcbmlmICggZGVjb2RlUHJvbWlzZSApIHtcclxuICBkZWNvZGVQcm9taXNlXHJcbiAgICAudGhlbiggZGVjb2RlZEF1ZGlvID0+IHtcclxuICAgICAgaWYgKCB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS52YWx1ZSA9PT0gbnVsbCApIHtcclxuICAgICAgICB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS5zZXQoIGRlY29kZWRBdWRpbyApO1xyXG4gICAgICAgIHNhZmVVbmxvY2soKTtcclxuICAgICAgfVxyXG4gICAgfSApXHJcbiAgICAuY2F0Y2goIGUgPT4ge1xyXG4gICAgICBjb25zb2xlLndhcm4oICdwcm9taXNlIHJlamVjdGlvbiBjYXVnaHQgZm9yIGF1ZGlvIGRlY29kZSwgZXJyb3IgPSAnICsgZSApO1xyXG4gICAgICBzYWZlVW5sb2NrKCk7XHJcbiAgICB9ICk7XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgd3JhcHBlZEF1ZGlvQnVmZmVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQSxPQUFPQSxXQUFXLE1BQU0sbUNBQW1DO0FBQzNELE9BQU9DLHNCQUFzQixNQUFNLDBDQUEwQztBQUM3RSxPQUFPQyxrQkFBa0IsTUFBTSxzQ0FBc0M7QUFDckUsT0FBT0MsZ0JBQWdCLE1BQU0sb0NBQW9DO0FBRWpFLE1BQU1DLFFBQVEsR0FBRyxxNEZBQXE0RjtBQUN0NUYsTUFBTUMsY0FBYyxHQUFHSixzQkFBc0IsQ0FBRUUsZ0JBQWdCLEVBQUVDLFFBQVMsQ0FBQztBQUMzRSxNQUFNRSxNQUFNLEdBQUdOLFdBQVcsQ0FBQ08sVUFBVSxDQUFFSCxRQUFTLENBQUM7QUFDakQsTUFBTUksa0JBQWtCLEdBQUcsSUFBSU4sa0JBQWtCLENBQUMsQ0FBQzs7QUFFbkQ7QUFDQSxJQUFJTyxRQUFRLEdBQUcsS0FBSztBQUNwQixNQUFNQyxVQUFVLEdBQUdBLENBQUEsS0FBTTtFQUN2QixJQUFLLENBQUNELFFBQVEsRUFBRztJQUNmSCxNQUFNLENBQUMsQ0FBQztJQUNSRyxRQUFRLEdBQUcsSUFBSTtFQUNqQjtBQUNGLENBQUM7QUFFRCxNQUFNRSxlQUFlLEdBQUdDLFlBQVksSUFBSTtFQUN0QyxJQUFLSixrQkFBa0IsQ0FBQ0ssbUJBQW1CLENBQUNDLEtBQUssS0FBSyxJQUFJLEVBQUc7SUFDM0ROLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0UsR0FBRyxDQUFFSCxZQUFhLENBQUM7SUFDMURGLFVBQVUsQ0FBQyxDQUFDO0VBQ2Q7QUFDRixDQUFDO0FBQ0QsTUFBTU0sYUFBYSxHQUFHQyxXQUFXLElBQUk7RUFDbkNDLE9BQU8sQ0FBQ0MsSUFBSSxDQUFFLDJEQUEyRCxHQUFHRixXQUFZLENBQUM7RUFDekZULGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0UsR0FBRyxDQUFFWixnQkFBZ0IsQ0FBQ2lCLFlBQVksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFakIsZ0JBQWdCLENBQUNrQixVQUFXLENBQUUsQ0FBQztFQUNoSFgsVUFBVSxDQUFDLENBQUM7QUFDZCxDQUFDO0FBQ0QsTUFBTVksYUFBYSxHQUFHbkIsZ0JBQWdCLENBQUNvQixlQUFlLENBQUVsQixjQUFjLENBQUNtQixNQUFNLEVBQUViLGVBQWUsRUFBRUssYUFBYyxDQUFDO0FBQy9HLElBQUtNLGFBQWEsRUFBRztFQUNuQkEsYUFBYSxDQUNWRyxJQUFJLENBQUViLFlBQVksSUFBSTtJQUNyQixJQUFLSixrQkFBa0IsQ0FBQ0ssbUJBQW1CLENBQUNDLEtBQUssS0FBSyxJQUFJLEVBQUc7TUFDM0ROLGtCQUFrQixDQUFDSyxtQkFBbUIsQ0FBQ0UsR0FBRyxDQUFFSCxZQUFhLENBQUM7TUFDMURGLFVBQVUsQ0FBQyxDQUFDO0lBQ2Q7RUFDRixDQUFFLENBQUMsQ0FDRmdCLEtBQUssQ0FBRUMsQ0FBQyxJQUFJO0lBQ1hULE9BQU8sQ0FBQ0MsSUFBSSxDQUFFLHFEQUFxRCxHQUFHUSxDQUFFLENBQUM7SUFDekVqQixVQUFVLENBQUMsQ0FBQztFQUNkLENBQUUsQ0FBQztBQUNQO0FBQ0EsZUFBZUYsa0JBQWtCIiwiaWdub3JlTGlzdCI6W119