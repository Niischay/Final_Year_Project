import React, { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { uploadFaceData } from '../../api/adminService';

const FaceUpload = () => {
  const [registerNumber, setRegisterNumber] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // 1. Load Models on Mount
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load models", err);
        setMessage("Error loading AI models. Check public/models folder.");
      }
    };
    loadModels();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // Create a URL for preview
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
      setMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedImage || !registerNumber) {
      setMessage("Please select an image and enter a register number");
      return;
    }
    
    setLoading(true);
    setMessage("Processing image...");

    try {
      // 2. Convert image to HTML element
      const img = document.createElement('img');
      img.src = selectedImage;
      
      // Wait for image to load
      await new Promise(resolve => { img.onload = resolve });

      // 3. Detect Face
      const detection = await faceapi.detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No face detected in the image. Please try a clearer photo.");
      }

      // 4. Get the descriptor (array of 128 numbers)
      const faceDescriptor = Array.from(detection.descriptor);

      // 5. Send to Backend
      await uploadFaceData({
        registerNumber,
        faceEncoding: faceDescriptor
      });

      setMessage("Success! Student face data linked.");
      setRegisterNumber('');
      setSelectedImage(null);

    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to process/upload face data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Link Student Face Data</h3>
      
      {!modelsLoaded ? (
        <p>Loading AI Models...</p>
      ) : (
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Student Register Number</label>
            <input
              type="text"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              placeholder="e.g. 12345"
              required
            />
          </div>

          <div className="form-group">
            <label>Upload Photo</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
          </div>

          {selectedImage && (
            <div style={{ margin: '1rem 0' }}>
              <img src={selectedImage} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Process & Save'}
          </button>

          {message && (
            <p className={`error-message ${message.includes('Success') ? 'success' : ''}`} 
               style={message.includes('Success') ? {color: 'green', backgroundColor: '#e6fffa', borderColor: '#b2f5ea'} : {}}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default FaceUpload;