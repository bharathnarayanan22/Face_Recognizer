import React, { useState, useEffect, useRef } from 'react';

const FaceRecognition = () => {
  const [result, setResult] = useState('');
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = mediaStream;
      } catch (error) {
        console.error('Error accessing the camera:', error);
      }
    };

    startCamera();

    return () => {
      clearInterval(intervalRef.current);
      if (videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg');
    }
    return null;
  };

  const sendSnapshot = async () => {
    try {
      const imageData = takeSnapshot();
      console.log(imageData); 
      if (!imageData) return;
    
      const formData = new FormData();
      formData.append('File1', dataURItoBlob(imageData), 'snapshot.jpg');
    
      const response = await fetch('http://localhost:5000/check-face', {
        method: 'POST',
        body: formData,
      });
    
      const data = await response.json();
      displayResult(data.result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // Function to convert base64 to Blob
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  };

  const displayResult = (result) => {
    if (result.length > 0 && result[0]._label !== 'unknown') {
      setResult(`Detected face: ${result[0]._label}`);
    } else {
      setResult('No face detected or unknown face');
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(sendSnapshot, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay></video>
      <p>{result}</p>
    </div>
  );
};

export default FaceRecognition;
