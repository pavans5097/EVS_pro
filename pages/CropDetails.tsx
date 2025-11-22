import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Crop, WeatherData, PestAlert, FertilizerRecommendation } from '../types';
import { getPestAlerts, getFertilizerRecommendations } from '../services/geminiService';
import WeatherWidget from '../components/WeatherWidget';
import { ArrowLeft, Bug, Sprout, Calendar, AlertOctagon, Loader2, CheckCircle, AlertTriangle, Leaf } from 'lucide-react';

const CropDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [crop, setCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(true);
  
  // AI Data States
  const [pestAlerts, setPestAlerts] = useState<PestAlert[]>([]);
  const [fertilizers, setFertilizers] = useState<FertilizerRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Mock Live Weather specific to this crop
  // In a real app, you would fetch weather by crop.location lat/long
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 24,
    humidity: 60,
    rainfall: 0,
    windSpeed: 10,
    condition: 'Sunny',
    location: 'Field'
  });

  useEffect(() => {
    const storedCrops = localStorage.getItem('crops');
    if (storedCrops) {
      const parsed = JSON.parse(storedCrops);
      const found = parsed.find((c: Crop) => c.id === id);
      if (found) {
        setCrop(found);
        // Simulate specific weather for this crop
        setWeather({
            temperature: 26,
            humidity: 72,
            rainfall: 5,
            windSpeed: 12,
            condition: 'Cloudy',
            location: found.location
        });
        fetchInsights(found);
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInsights = async (currentCrop: Crop) => {
    setAiLoading(true);
    try {
        // Fetch insights in parallel
        const [pests, ferts] = await Promise.all([
            getPestAlerts(currentCrop, weather),
            getFertilizerRecommendations(currentCrop)
        ]);
        setPestAlerts(pests);
        setFertilizers(ferts);
    } catch (e) {
        console.error(e);
    } finally {
        setAiLoading(false);
    }
  };

  // Timeline Calculations
  const calculateTimeline = () => {
      if (!crop) return { total: 0, elapsed: 0, percent: 0, daysLeft: 0 };
      const start = new Date(crop.sowingDate).getTime();
      const end = new Date(crop.expectedHarvestDate).getTime();
      const now = new Date().getTime();
      const total = Math.max(1, end - start);
      const elapsed = Math.max(0, now - start);
      const percent = Math.min(100, (elapsed / total) * 100);
      const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
      return { total, elapsed, percent, daysLeft };
  };

  if (loading || !crop) return <div className="flex justify-center items-center h-screen bg-gray-50"><Loader2 className="animate-spin text-green-600" size={48} /></div>;

  const timeline = calculateTimeline();

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-green-700 mb-6 transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Farm
      </button>

      {/* Hero Section / Crop Dashboard Header */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-green-50 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
            <div>
                <div className="flex items-center gap-3 mb-2">
                   <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide flex items-center gap-1">
                     <Leaf size={12} /> {crop.status}
                   </span>
                   <span className="text-gray-400 text-sm flex items-center gap-1">
                     <AlertOctagon size={14} /> {crop.area} Acres
                   </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{crop.name}</h1>
                <p className="text-gray-500 text-lg">{crop.variety || 'Standard Variety'} • {crop.location}</p>
            </div>
            
            {/* Days Remaining Circle */}
            <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                    <div className="text-sm text-gray-500 mb-1">Harvest In</div>
                    <div className="text-3xl font-bold text-gray-900">{timeline.daysLeft} Days</div>
                </div>
                <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        <path className="text-green-500 transition-all duration-1000 ease-out" strokeDasharray={`${timeline.percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xs font-bold text-green-600">{Math.round(timeline.percent)}%</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Visual Timeline */}
        <div className="mt-8 pt-8 border-t border-gray-100">
             <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                 <div className="flex flex-col items-start">
                     <span className="flex items-center gap-1"><Calendar size={14}/> Sown</span>
                     <span className="text-gray-900">{new Date(crop.sowingDate).toLocaleDateString()}</span>
                 </div>
                 <div className="flex flex-col items-end">
                     <span className="flex items-center gap-1"><Calendar size={14}/> Harvest</span>
                     <span className="text-gray-900">{new Date(crop.expectedHarvestDate).toLocaleDateString()}</span>
                 </div>
             </div>
             <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                 <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000" style={{ width: `${timeline.percent}%` }}></div>
             </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
         {/* Left Column: Weather & Stats */}
         <div className="space-y-6">
             <WeatherWidget weather={weather} />
             
             <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Sprout className="text-green-600"/> Growth Stats</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                        <span className="text-sm text-gray-600">Growth Stage</span>
                        <span className="font-semibold text-green-800">Vegetative</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                        <span className="text-sm text-gray-600">Water Req.</span>
                        <span className="font-semibold text-blue-800">Moderate</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                        <span className="text-sm text-gray-600">Health Score</span>
                        <span className="font-semibold text-amber-800">92/100</span>
                    </div>
                </div>
             </div>
         </div>

         {/* Right Column: AI Insights */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Fertilizer Section */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Leaf className="text-green-500 fill-green-100" /> Nutrient Management
                    </h3>
                    {aiLoading && <Loader2 className="animate-spin text-green-500" />}
                </div>
                
                {fertilizers.length > 0 ? (
                    <div className="relative border-l-2 border-green-100 ml-3 space-y-8 pb-2">
                        {fertilizers.map((item, idx) => (
                            <div key={idx} className="ml-6 relative">
                                <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-green-500 border-4 border-white shadow-sm"></span>
                                <div className="bg-gray-50 rounded-xl p-4 hover:bg-green-50 transition-colors border border-transparent hover:border-green-200">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                                        <span className="text-sm font-bold text-green-700 uppercase tracking-wider bg-white px-2 py-1 rounded border border-green-100">{item.stage}</span>
                                        <span className="text-sm font-semibold text-gray-900 flex items-center gap-1"><CheckCircle size={14} className="text-green-500"/> {item.quantity}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-lg mb-1">{item.fertilizer}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{item.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                   <p className="text-gray-500 italic">Generating fertilizer plan based on sowing date...</p>
                )}
            </div>

            {/* Pest & Disease Alerts */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Bug className="text-red-500 fill-red-100" /> Pest & Disease Forecast
                    </h3>
                    {aiLoading && <Loader2 className="animate-spin text-red-500" />}
                </div>

                {pestAlerts.length > 0 ? (
                    <div className="grid gap-4">
                        {pestAlerts.map((pest, idx) => (
                            <div key={idx} className={`group p-5 rounded-2xl border-l-4 shadow-sm bg-white transition-all hover:shadow-md ${pest.severity === 'High' ? 'border-red-500 bg-red-50/30' : pest.severity === 'Medium' ? 'border-yellow-500 bg-yellow-50/30' : 'border-blue-500 bg-blue-50/30'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-lg text-gray-900 group-hover:text-red-700 transition-colors">{pest.pestName}</h4>
                                    <span className={`text-xs uppercase px-3 py-1 rounded-full font-bold tracking-wide ${pest.severity === 'High' ? 'bg-red-100 text-red-700' : pest.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {pest.severity} Risk
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{pest.description}</p>
                                <div className="bg-white/80 p-3 rounded-xl text-sm text-gray-800 border border-gray-100">
                                    <strong className="block text-xs text-gray-500 uppercase mb-1">Recommended Action</strong>
                                    <div className="flex gap-2 items-start">
                                        <AlertTriangle size={16} className="mt-0.5 text-orange-500 flex-shrink-0" />
                                        {pest.prevention}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 bg-green-50 rounded-2xl text-center text-green-800 border border-green-100">
                        <CheckCircle size={32} className="mx-auto mb-3 text-green-600" />
                        <p className="font-medium">No significant pest risks detected.</p>
                        <p className="text-sm opacity-80">Current weather conditions are favorable.</p>
                    </div>
                )}
            </div>

         </div>
      </div>
    </div>
  );
};

export default CropDetails;