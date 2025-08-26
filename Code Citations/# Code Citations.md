# Code Citations

## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorder
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataav
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0)
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onst
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recorde
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/webm'
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/webm'
      });
      const url =
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/webm'
      });
      const url = URL.createObjectURL(blob);
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/webm'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/webm'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href
```


## License: unknown
https://github.com/ManoranjanJena24/multimediarecording/blob/fcc5a57e1ccf20936d6e0f1d5325eef0a43c188f/src/Components/RecordingComponent.js

```
;

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/webm'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
```

