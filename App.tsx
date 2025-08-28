
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Footer from './components/Footer';
import type { ImageInfo } from './types';
import { generateVirtualTryOnImage } from './services/geminiService';
import { LOADING_MESSAGES } from './constants';

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ImageInfo | null>(null);
  const [clothImage, setClothImage] = useState<ImageInfo | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  const fileToImageInfo = (file: File): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type, name: file.name });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePersonImageUpload = async (file: File | null) => {
    if (file) {
      const info = await fileToImageInfo(file);
      setPersonImage(info);
    } else {
      setPersonImage(null);
    }
  };

  const handleClothImageUpload = async (file: File | null) => {
    if (file) {
      const info = await fileToImageInfo(file);
      setClothImage(info);
    } else {
      setClothImage(null);
    }
  };
  
  const handleGenerate = useCallback(async () => {
    if (!personImage || !clothImage) {
      setError("Please upload both your photo and a clothing item photo.");
      return;
    }

    setIsLoading(true);
    setResultImage(null);
    setError(null);
    
    try {
      const generatedImage = await generateVirtualTryOnImage(personImage, clothImage);
      setResultImage(generatedImage);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate image. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [personImage, clothImage]);

  useEffect(() => {
    // FIX: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
    // NodeJS.Timeout is a Node.js specific type, while browser's setInterval returns a number.
    // ReturnType<typeof setInterval> correctly infers the return type in any JS environment.
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      let messageIndex = 0;
      interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[messageIndex]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col antialiased">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ImageUploader id="person-uploader" title="1. Your Photo" description="Upload a clear, front-facing photo of yourself." onImageUpload={handlePersonImageUpload} />
            <ImageUploader id="cloth-uploader" title="2. Clothing Item" description="Upload a photo of the clothing item, preferably on a plain background." onImageUpload={handleClothImageUpload} />
          </div>

          <div className="text-center mb-8">
            <button
              onClick={handleGenerate}
              disabled={!personImage || !clothImage || isLoading}
              className="px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-full shadow-lg shadow-blue-500/30 transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? 'Styling Your Look...' : 'Visualize My Style'}
            </button>
          </div>
          
          <ResultDisplay image={resultImage} isLoading={isLoading} loadingMessage={loadingMessage} error={error} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
