import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CameraProcessing from './pages/CameraProcessing';
import ImageReview from './pages/ImageReview';
import Tigers from './pages/Tigers';
import TigerDetails from './pages/TigerDetails';
import MovementMap from './pages/MovementMap';
import Alerts from './pages/Alerts';
import LiveCameraFeeds from './pages/LiveCameraFeeds';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Default redirect to /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Main monitoring routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="live-feeds" element={<LiveCameraFeeds />} />
          <Route path="camera-processing" element={<CameraProcessing />} />
          <Route path="image-review" element={<ImageReview />} />
          <Route path="tigers" element={<Tigers />} />
          <Route path="tigers/:id" element={<TigerDetails />} />
          <Route path="movement" element={<MovementMap />} />
          <Route path="alerts" element={<Alerts />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
