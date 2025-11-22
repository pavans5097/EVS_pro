import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddCrop from './pages/AddCrop';
import CropDetails from './pages/CropDetails';
import Market from './pages/Market';
import Planner from './pages/Planner';

// Using HashRouter to support static hosting (Netlify) without server-side rewrite config
const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-crop" element={<AddCrop />} />
          <Route path="/crop/:id" element={<CropDetails />} />
          <Route path="/market" element={<Market />} />
          <Route path="/planner" element={<Planner />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
