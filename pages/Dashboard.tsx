import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crop, WeatherData } from '../types';
import WeatherWidget from '../components/WeatherWidget';
import { ArrowRight, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { getGeneralCropAdvice } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [weather, setWeather] = useState<WeatherData>({
    location: 'Home Farm',
    temperature: 24,
    humidity: 65,
    rainfall: 0,
    windSpeed: 12,
    condition: 'Partly Cloudy'
  });
  const [advice, setAdvice] = useState<Record<string, string>>({});

  useEffect(() => {
    const storedCrops = localStorage.getItem('crops');
    if (storedCrops) {
      const parsed = JSON.parse(storedCrops);
      setCrops(parsed);
      
      if (parsed.length > 0) {
        const firstCrop = parsed[0];
        setWeather(prev => ({ ...prev, location: firstCrop.location }));
        getGeneralCropAdvice(firstCrop, weather).then(tip => {
            setAdvice(prev => ({...prev, [firstCrop.id]: tip}));
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateDaysRemaining = (harvestDate: string) => {
    const today = new Date();
    const harvest = new Date(harvestDate);
    const diffTime = harvest.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getProgress = (sowing: string, harvest: string) => {
      const start = new Date(sowing).getTime();
      const end = new Date(harvest).getTime();
      const now = new Date().getTime();
      const total = end - start;
      const current = now - start;
      const percent = Math.min(100, Math.max(0, (current / total) * 100));
      return percent;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-800">My Farm Overview</h2>
            <p className="text-gray-500 mt-1">Monitor your crops, weather, and alerts in one place.</p>
        </div>
        <Link to="/add-crop" className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-green-200 hover:-translate-y-0.5">
            + Add New Crop
        </Link>
      </div>

      {/* Weather Summary */}
      <WeatherWidget weather={weather} />

      {/* Active Crops Grid */}
      <div>
        <h3 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
            Active Crops <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{crops.length}</span>
        </h3>
        {crops.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-green-500" size={32} />
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">No crops tracking yet</h4>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Start tracking your sowing dates, harvest goals, and get AI insights.</p>
            <Link to="/add-crop" className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors">
              Add Your First Crop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop, index) => {
              const percent = getProgress(crop.sowingDate, crop.expectedHarvestDate);
              const daysLeft = calculateDaysRemaining(crop.expectedHarvestDate);

              return (
              <Link 
                key={crop.id} 
                to={`/crop/${crop.id}`} 
                className="group bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Progress bar background hint */}
                <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-1000" style={{ width: `${percent}%` }}></div>

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{crop.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 font-medium">
                            <MapPin size={12} /> {crop.location}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${crop.status === 'Growing' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {crop.status}
                        </span>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Harvest Countdown</span>
                        <span className="font-semibold text-gray-800">{daysLeft} Days</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>

                {advice[crop.id] && (
                    <div className="bg-blue-50 p-3 rounded-xl text-sm text-blue-800 flex gap-2 items-start mb-4">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <p className="line-clamp-2 text-xs font-medium leading-relaxed">{advice[crop.id]}</p>
                    </div>
                )}

                <div className="flex items-center justify-between text-sm text-green-600 font-bold mt-auto">
                    View Dashboard <div className="bg-green-50 p-1 rounded-full group-hover:bg-green-600 group-hover:text-white transition-colors"><ArrowRight size={16} /></div>
                </div>
              </Link>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;