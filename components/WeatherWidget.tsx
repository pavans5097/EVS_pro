import React from 'react';
import { WeatherData } from '../types';
import { Cloud, Droplets, Wind, MapPin, Sun, CloudRain, CloudLightning } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherData;
  compact?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, compact = false }) => {
  // Helper to pick icon and gradient
  const getWeatherVisuals = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return { icon: CloudRain, gradient: 'from-blue-500 to-blue-700' };
    if (c.includes('storm') || c.includes('thunder')) return { icon: CloudLightning, gradient: 'from-slate-700 to-slate-900' };
    if (c.includes('cloud')) return { icon: Cloud, gradient: 'from-blue-400 to-slate-500' };
    if (c.includes('sun') || c.includes('clear')) return { icon: Sun, gradient: 'from-orange-400 to-red-500' };
    return { icon: Cloud, gradient: 'from-blue-500 to-blue-600' };
  };

  const { icon: WeatherIcon, gradient } = getWeatherVisuals(weather.condition);

  if (compact) {
    return (
      <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <WeatherIcon size={24} className="animate-pulse-soft" />
            </div>
            <div>
               <div className="text-2xl font-bold">{weather.temperature}°C</div>
               <div className="text-xs opacity-90 capitalize">{weather.condition}</div>
            </div>
          </div>
          <div className="text-right text-xs opacity-80">
             <div><Droplets size={10} className="inline" /> {weather.humidity}%</div>
             <div><Wind size={10} className="inline" /> {weather.windSpeed} km/h</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-3xl p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]`}>
      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-black/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 opacity-80 text-sm font-medium mb-1">
            <MapPin size={16} /> {weather.location}
          </div>
          <div className="mt-2 flex items-center gap-4">
            <span className="text-6xl md:text-7xl font-bold tracking-tighter">{weather.temperature}°</span>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-medium capitalize">{weather.condition}</span>
              <span className="text-sm bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm inline-block w-fit">
                Feels like {weather.temperature + 2}°
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md animate-float border border-white/10 shadow-inner">
            <WeatherIcon size={64} className="drop-shadow-lg" />
        </div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-3 gap-4">
        <div className="bg-black/10 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-1 text-xs uppercase tracking-wider opacity-70 mb-1">
            <Droplets size={14} /> Humidity
          </div>
          <span className="font-bold text-lg">{weather.humidity}%</span>
        </div>
        <div className="bg-black/10 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-1 text-xs uppercase tracking-wider opacity-70 mb-1">
            <Wind size={14} /> Wind
          </div>
          <span className="font-bold text-lg">{weather.windSpeed} <span className="text-xs font-normal">km/h</span></span>
        </div>
        <div className="bg-black/10 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-1 text-xs uppercase tracking-wider opacity-70 mb-1">
             Rainfall
          </div>
          <span className="font-bold text-lg">{weather.rainfall} <span className="text-xs font-normal">mm</span></span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;