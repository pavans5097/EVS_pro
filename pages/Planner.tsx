import React, { useState } from 'react';
import { RotationPlan } from '../types';
import { getRotationAdvice, getLocationNameFromCoords } from '../services/geminiService';
import { RefreshCw, ArrowRight, CheckCircle, Loader2, Sprout, MapPin, Ruler, LocateFixed, History } from 'lucide-react';

const Planner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [plan, setPlan] = useState<RotationPlan | null>(null);
  const [form, setForm] = useState({
    prevCrop: '',
    plotSize: 10,
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await getRotationAdvice(form.prevCrop, form.plotSize, form.location);
    setPlan(result);
    setLoading(false);
  };

  const handleAutoLocation = () => {
    if ('geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = await getLocationNameFromCoords(latitude, longitude);
        setForm(prev => ({ ...prev, location: locationName }));
        setLocating(false);
      }, (error) => {
        console.error(error);
        setLocating(false);
        alert("Could not detect location. Please enter manually.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
       <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Crop Rotation Planner</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">Sustainable farming starts with smart planning. Use AI to determine the best crop sequence for your soil health.</p>
       </div>

       <div className="grid lg:grid-cols-12 gap-8">
           {/* Input Form */}
           <div className="lg:col-span-4">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-green-50 sticky top-8">
                  <div className="flex items-center gap-2 mb-8 text-green-700 font-bold text-lg">
                      <Sprout size={24} /> Field Parameters
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Previous Crop</label>
                          <div className="relative group">
                              <History className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                              <input 
                                required 
                                type="text" 
                                placeholder="e.g. Corn, Wheat"
                                value={form.prevCrop}
                                onChange={(e) => setForm({...form, prevCrop: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all font-medium"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Plot Size (Acres)</label>
                          <div className="relative group">
                              <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                              <input 
                                required 
                                type="number" 
                                value={form.plotSize}
                                onChange={(e) => setForm({...form, plotSize: Number(e.target.value)})}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all font-medium"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Location</label>
                          <div className="relative group">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                              <input 
                                required 
                                type="text" 
                                placeholder="Region or City"
                                value={form.location}
                                onChange={(e) => setForm({...form, location: e.target.value})}
                                className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all font-medium"
                              />
                               <button 
                                    type="button"
                                    onClick={handleAutoLocation}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                                    title="Detect Location"
                                >
                                    {locating ? <Loader2 className="animate-spin" size={20}/> : <LocateFixed size={20} />}
                                </button>
                          </div>
                      </div>

                      <button 
                        disabled={loading}
                        type="submit" 
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 hover:-translate-y-1 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : 'Generate Plan'}
                      </button>
                  </form>
              </div>
           </div>

           {/* Results */}
           <div className="lg:col-span-8">
              {plan ? (
                  <div className="space-y-6 animate-fade-in">
                      <div className="bg-green-50 rounded-3xl p-8 border border-green-100 mb-6 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl -mr-10 -mt-10"></div>
                          <h3 className="text-green-900 font-bold text-2xl mb-2 relative z-10">Recommended Rotation for {plan.currentCrop}</h3>
                          <p className="text-green-800 opacity-80 relative z-10">These crops will optimize soil nitrogen levels and break disease cycles.</p>
                      </div>

                      {plan.suggestedNextCrops.map((suggestion, idx) => (
                          <div key={idx} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-md border border-gray-100 hover:border-green-300 transition-all hover:shadow-lg group">
                               <div className="flex flex-col md:flex-row gap-6">
                                   <div className="flex-shrink-0 hidden md:flex flex-col items-center justify-center w-16">
                                       <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                           <ArrowRight size={24} />
                                       </div>
                                       <div className="h-full w-0.5 bg-gray-100 rounded-full"></div>
                                   </div>
                                   
                                   <div className="flex-1">
                                       <div className="flex items-start justify-between mb-4">
                                           <h3 className="text-2xl font-bold text-gray-900">{suggestion.cropName}</h3>
                                           <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-green-200">Recommended</span>
                                       </div>
                                       
                                       <p className="text-gray-600 mb-6 text-base leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100">{suggestion.reason}</p>
                                       
                                       <div>
                                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Key Benefits</h4>
                                           <div className="flex flex-wrap gap-3">
                                               {suggestion.benefits.map((b, i) => (
                                                   <span key={i} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm group-hover:border-green-200 transition-colors">
                                                       <CheckCircle size={16} className="text-green-500" /> {b}
                                                   </span>
                                               ))}
                                           </div>
                                       </div>
                                   </div>
                               </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-[3rem] p-8 bg-gray-50/50">
                      <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                        <RefreshCw size={48} className="text-green-200" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-600">Ready to Plan?</h3>
                      <p className="text-base max-w-xs text-center mt-2 text-gray-500">Enter your previous crop details to receive AI-powered rotation strategies.</p>
                  </div>
              )}
           </div>
       </div>
    </div>
  );
};

export default Planner;