import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MarketPrice } from '../types';
import { getMarketData } from '../services/geminiService';
import { TrendingUp, TrendingDown, Minus, Loader2, Tag } from 'lucide-react';

const Market: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('crops');
    const location = stored ? JSON.parse(stored)[0]?.location || 'Maharashtra, India' : 'India';
    
    getMarketData(location).then(data => {
        setMarketData(data);
        if(data.length > 0) setSelectedCrop(data[0].crop);
        setLoading(false);
    });
  }, []);

  const activeData = marketData.find(m => m.crop === selectedCrop);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Crop Market Prices</h2>
            <p className="text-gray-500">Average wholesale prices (INR) and trends for crops in your region.</p>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100">
            <Loader2 className="animate-spin mb-4 text-green-600" size={48} />
            <p>Fetching latest crop prices...</p>
        </div>
      ) : (
        <>
            {/* Price Ticker Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {marketData.map((item) => (
                    <button 
                        key={item.crop}
                        onClick={() => setSelectedCrop(item.crop)}
                        className={`p-4 rounded-xl border text-left transition-all ${selectedCrop === item.crop ? 'bg-green-50 border-green-500 shadow-md ring-1 ring-green-200' : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'}`}
                    >
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 truncate">
                            <Tag size={10} /> {item.region}
                        </div>
                        <div className="font-bold text-gray-900 text-lg truncate mb-1">{item.crop}</div>
                        
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-green-700">₹{item.currentPrice}</span>
                            <span className="text-[10px] text-gray-400">/qt</span>
                        </div>
                        
                        <div className={`flex items-center gap-1 text-xs mt-2 font-medium ${item.trend === 'up' ? 'text-green-600' : item.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                            {item.trend === 'up' ? <TrendingUp size={12}/> : item.trend === 'down' ? <TrendingDown size={12}/> : <Minus size={12}/>}
                            <span className="capitalize">{item.trend} Trend</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Detailed Chart */}
            {activeData && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{activeData.crop} Price Trends</h3>
                            <p className="text-sm text-gray-500">6-Month Price History in {activeData.region}</p>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-bold text-gray-900">₹{activeData.currentPrice}</div>
                             <div className="text-sm text-gray-500">Current Avg. Price / Quintal</div>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activeData.history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} stroke="#9ca3af" />
                                <YAxis 
                                    tickFormatter={(value) => `₹${value}`}
                                    domain={['auto', 'auto']}
                                    tick={{fontSize: 12}} 
                                    stroke="#9ca3af"
                                />
                                <Tooltip 
                                    formatter={(value: number) => [`₹${value}`, 'Price/Quintal']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="#16a34a" 
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 bg-blue-50 p-3 rounded-xl text-center text-xs text-blue-800">
                        *Prices are indicative regional averages. Actual rates for your specific crops may vary.
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default Market;