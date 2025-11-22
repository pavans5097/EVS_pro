import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crop, CropStatus, CropSuggestion } from '../types';
import { predictHarvestDate, getSmartCropSuggestions, getLocationNameFromCoords } from '../services/geminiService';
import { 
  Sprout, MapPin, Calendar, Ruler, Loader2, Sparkles, 
  ArrowRight, LocateFixed, CheckCircle2, Leaf, Calculator, AlertCircle
} from 'lucide-react';

const AddCrop: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'suggest'>('manual');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    area: '',
    location: '',
    sowingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
  });

  // UI States
  const [predicting, setPredicting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<CropSuggestion[]>([]);

  // --- Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Auto-predict harvest date when name or sowing date changes
  useEffect(() => {
    let active = true;
    
    const calculateHarvest = async () => {
        if (formData.name.length > 2 && formData.sowingDate) {
            setPredicting(true);
            // Use location if available, else default to general
            const loc = formData.location || "India";
            const date = await predictHarvestDate(formData.name, formData.sowingDate, loc);
            
            if (active && date) {
                setFormData(prev => ({ ...prev, expectedHarvestDate: date }));
            }
            if (active) setPredicting(false);
        } else {
             // Reset if name is cleared
             if(formData.name.length === 0 && active) {
                 setFormData(prev => ({ ...prev, expectedHarvestDate: '' }));
             }
        }
    };

    // Debounce to avoid too many calls while typing
    const debounce = setTimeout(() => {
        calculateHarvest();
    }, 500);

    return () => {
        clearTimeout(debounce);
        active = false;
    };
  }, [formData.name, formData.sowingDate, formData.location]);

  const handleAutoLocation = () => {
    if ('geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = await getLocationNameFromCoords(latitude, longitude);
        setFormData(prev => ({ ...prev, location: locationName }));
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

  const handleGetSuggestions = async () => {
    if (!formData.location) {
        alert("Please enter or detect a location first.");
        return;
    }
    setSuggesting(true);
    const results = await getSmartCropSuggestions(formData.location, formData.sowingDate);
    setSuggestions(results);
    setSuggesting(false);
  };

  const applySuggestion = (s: CropSuggestion) => {
    setFormData(prev => ({
        ...prev,
        name: s.cropName,
        variety: s.variety,
        expectedHarvestDate: '' // Trigger recalculation
    }));
    setMode('manual');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expectedHarvestDate) {
        alert("Calculating harvest date. Please wait a moment...");
        return;
    }

    const newCrop: Crop = {
      id: Date.now().toString(),
      name: formData.name,
      variety: formData.variety,
      area: Number(formData.area),
      location: formData.location,
      sowingDate: formData.sowingDate,
      expectedHarvestDate: formData.expectedHarvestDate,
      status: CropStatus.GROWING,
    };

    const stored = localStorage.getItem('crops');
    const crops = stored ? JSON.parse(stored) : [];
    crops.push(newCrop);
    localStorage.setItem('crops', JSON.stringify(crops));
    
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Register New Crop</h2>
        <p className="text-gray-500 mt-2">Track performance, get insights, and maximize yield.</p>
      </div>

      {/* Toggle Modes */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-xl inline-flex">
            <button 
                onClick={() => setMode('manual')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Manual Entry
            </button>
            <button 
                onClick={() => setMode('suggest')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'suggest' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Sparkles size={14} /> AI Recommendation
            </button>
        </div>
      </div>

      {mode === 'suggest' ? (
         <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-100 p-6 rounded-3xl">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                         <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-2 ml-1">Your Location</label>
                         <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                            <input 
                                name="location" 
                                value={formData.location}
                                onChange={handleChange} 
                                type="text" 
                                placeholder="e.g. Pune, Maharashtra" 
                                className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-transparent bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm text-gray-800 placeholder-gray-400 font-medium" 
                            />
                            <button 
                                type="button"
                                onClick={handleAutoLocation}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                                title="Detect Location"
                            >
                                {locating ? <Loader2 className="animate-spin" size={20}/> : <LocateFixed size={20} />}
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={handleGetSuggestions}
                        disabled={suggesting || !formData.location}
                        className="w-full md:w-auto bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                    >
                        {suggesting ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        Analyze & Suggest
                    </button>
                </div>
            </div>

            {suggestions.length > 0 && (
                <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                    {suggestions.map((s, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:border-purple-300 hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-purple-100 text-purple-800 px-3 py-1 rounded-bl-2xl text-xs font-bold">
                                Score: {s.suitabilityScore}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{s.cropName}</h3>
                            <p className="text-sm text-purple-600 font-medium mb-4">{s.variety}</p>
                            
                            <div className="space-y-3 mb-6">
                                <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600">
                                    <p className="line-clamp-3">{s.reason}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md">{s.estimatedYield}</span>
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{s.marketOutlook}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => applySuggestion(s)}
                                className="w-full py-3 rounded-xl border-2 border-purple-100 text-purple-700 font-bold hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all flex items-center justify-center gap-2"
                            >
                                Select This Crop
                            </button>
                        </div>
                    ))}
                </div>
            )}
         </div>
      ) : (
          /* Manual Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Crop Information</label>
                        <div className="space-y-4">
                            <div className="relative group">
                                <Sprout className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                                <input 
                                    required 
                                    name="name" 
                                    value={formData.name}
                                    onChange={handleChange} 
                                    type="text" 
                                    placeholder="Crop Name (e.g. Wheat)" 
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all font-medium" 
                                />
                            </div>
                            <div className="relative group">
                                <Leaf className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                                <input 
                                    name="variety" 
                                    value={formData.variety}
                                    onChange={handleChange} 
                                    type="text" 
                                    placeholder="Variety (Optional)" 
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all font-medium" 
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Location & Area</label>
                        <div className="space-y-4">
                             <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                                <input 
                                    required 
                                    name="location" 
                                    value={formData.location}
                                    onChange={handleChange} 
                                    type="text" 
                                    placeholder="City or District" 
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
                            <div className="relative group">
                                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                                <input 
                                    required 
                                    name="area" 
                                    value={formData.area}
                                    onChange={handleChange} 
                                    type="number" 
                                    step="0.1"
                                    placeholder="Total Area (Acres)" 
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all font-medium" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Timeline</label>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block ml-1">Sowing Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                                    <input 
                                        required 
                                        name="sowingDate" 
                                        value={formData.sowingDate}
                                        onChange={handleChange} 
                                        type="date" 
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all font-medium" 
                                    />
                                </div>
                            </div>
                            
                            {/* Auto-Calculated Harvest Date */}
                            <div>
                                <div className="flex justify-between items-center mb-1 ml-1">
                                    <label className="text-xs text-gray-400">Expected Harvest</label>
                                </div>
                                <div className={`relative p-4 rounded-2xl border transition-all ${
                                    predicting 
                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700' 
                                    : formData.expectedHarvestDate 
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-400'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        {predicting ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <Calculator size={20} />
                                        )}
                                        
                                        {predicting ? (
                                            <span className="font-medium">Calculating...</span>
                                        ) : formData.expectedHarvestDate ? (
                                            <div className="flex flex-col">
                                                <span className="text-xs opacity-70 font-bold uppercase tracking-wider">Predicted Date</span>
                                                <span className="text-lg font-bold">{formData.expectedHarvestDate}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm">Type crop name to calculate date</span>
                                        )}
                                    </div>
                                    
                                    {formData.expectedHarvestDate && !predicting && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <CheckCircle2 size={20} className="text-green-600" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 ml-1 flex items-start gap-1">
                                    <AlertCircle size={12} className="mt-0.5" />
                                    Auto-calculated based on crop type and sowing date.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 rounded-2xl p-6 border border-green-100 h-40 flex flex-col justify-center items-center text-center">
                         <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                            <CheckCircle2 className="text-green-600" size={24} />
                         </div>
                         <p className="text-green-800 font-medium text-sm">Ready to track!</p>
                         <p className="text-green-600 text-xs mt-1">We'll generate insights once you save.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
                <button 
                    type="submit" 
                    disabled={predicting || !formData.expectedHarvestDate}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {predicting ? 'Calculating Dates...' : 'Start Tracking'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </button>
            </div>
          </form>
      )}
    </div>
  );
};

export default AddCrop;