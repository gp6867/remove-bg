'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import ImageUploader from '@/components/ImageUploader';
import CreditsCard from '@/components/CreditsCard';
import PaymentModal from '@/components/PaymentModal';
import ProfileDropdown from '@/components/ProfileDropdown';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, updateCredits } = useAuth();
  const [activeTab, setActiveTab] = useState('remove-bg');
  const [showPayment, setShowPayment] = useState(false);

  const tabs = [
    { id: 'remove-bg', name: 'Remove Background', icon: '🎨', cost: '1 credit' },
    { id: 'upscale', name: 'Upscale Image', icon: '🔍', cost: '2-5 credits' },
    { id: 'enhance', name: 'Enhance', icon: '✨', cost: '1 credit' },
    { id: 'generate', name: 'AI Generate', icon: '🤖', cost: '5 credits' },
    { id: 'batch', name: 'Batch Process', icon: '⚡', cost: '1 credit/image' }, 
  ];

  const handleSuccess = (data: any) => {
    if (data.credits_remaining !== undefined) {
      updateCredits(data.credits_remaining);
    }
    toast.success('Processing complete!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Image Studio
            </h1>
            <div className="flex items-center gap-4">
              <CreditsCard />
              <button
                onClick={() => setShowPayment(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Buy Credits
              </button>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              <span className={`text-xs ${activeTab === tab.id ? 'text-purple-200' : 'text-gray-400'}`}>
                {tab.cost}
              </span>
            </button>
          ))}
        </div>

        {/* Upload Area - Result now shown inside ImageUploader itself */}
        <div className="card mb-8">
          <ImageUploader
            operationType={activeTab}
            onSuccess={handleSuccess}
          />
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
}
