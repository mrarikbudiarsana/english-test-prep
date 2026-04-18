'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { examConfigs } from '@/config/examConfig';

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  perks: string[];
  isPopular: boolean;
}

const planOverrides = [
  { name: 'Free', description: 'Get started with TOEFL ITP', perks: ['2 free full TOEFL ITP tests/month', 'Basic score feedback (310-677)', 'Correct/Incorrect list', 'Community access'] },
  { name: 'ITP Starter', description: 'Analyze your performance', perks: ['10 full TOEFL ITP tests/month', 'Detailed structure and reading breakdown', 'Score progression charts', 'Correct answer key', 'WhatsApp Peer Group'] },
  { name: 'ITP Pro', description: 'Master all ITP sections', perks: ['Unlimited full TOEFL ITP tests', 'AI-powered answer explanations', 'Grammar and vocabulary deep dive', 'Skill weakness radar charts', 'Priority WhatsApp and email support'] },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  const examConfig = examConfigs.toefl_itp;
  const { theme } = examConfig;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/pricing');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.priceMonthly === 0) return;

    const nameLower = plan.name.toLowerCase();
    let planType: 'monthly' | 'quarterly' | 'yearly';
    if (nameLower.includes('yearly') || nameLower.includes('annual') || billingCycle === 'yearly') {
      planType = 'yearly';
    } else if (nameLower.includes('quarterly')) {
      planType = 'quarterly';
    } else {
      planType = 'monthly';
    }

    setCheckingOut(plan.id);
    try {
      const { data } = await api.post('/payments/create', { planType, examType: 'toefl_itp' });
      const snapToken: string = data.snapToken;

      if (!(window as any).snap) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL!;
          script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!);
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Midtrans Snap'));
          document.head.appendChild(script);
        });
      }

      (window as any).snap.pay(snapToken, {
        onSuccess: () => {
          toast.success('Payment successful!');
          window.location.href = '/payment/finish?transaction_status=settlement';
        },
        onPending: () => {
          toast('Payment pending. We will notify you once confirmed.');
          window.location.href = '/payment/finish?transaction_status=pending';
        },
        onError: () => {
          toast.error('Payment failed. Please try again.');
        },
        onClose: () => {
          toast('Checkout closed.');
        },
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to start checkout');
    } finally {
      setCheckingOut(null);
    }
  };

  const formatPriceParts = (amount: number, currency: string) => {
    if (amount === 0) return { symbol: '', value: 'Free' };
    
    // Indonesian formatting: Rp 990.000
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
    
    // Split symbol and value
    const match = formatted.match(/^([^\d\s\u00a0,.]+)\s*(.*)$/);
    if (match) {
      return { symbol: match[1], value: match[2] };
    }
    return { symbol: '', value: formatted };
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex flex-col justify-center items-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: theme.primary }} />
        <p className="text-slate-400 font-medium animate-pulse">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-[#020617] mb-6 sm:text-5xl tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed">
            Choose the plan that fits your TOEFL ITP preparation. <br className="hidden sm:block" />
            Upgrade or downgrade at any time.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm font-bold uppercase tracking-wider ${billingCycle === 'monthly' ? 'text-[#08507f]' : 'text-slate-400'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} 
              className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-sm"
              style={{ backgroundColor: billingCycle === 'yearly' ? theme.primary : '#cbd5e1' }}
              role="switch"
              aria-checked={billingCycle === 'yearly'}
            >
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-bold uppercase tracking-wider ${billingCycle === 'yearly' ? 'text-[#08507f]' : 'text-slate-400'}`}>
              Yearly <span className="text-emerald-600 ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            const override = planOverrides[index];
            const isPopular = plan.isPopular;
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const { symbol, value } = formatPriceParts(price, plan.currency);
            
            return (
              <div 
                key={plan.id} 
                className={cn(
                  "relative bg-white rounded-3xl p-8 flex flex-col transition-all duration-300 border h-full",
                  isPopular 
                    ? "border-[#08507f] shadow-2xl md:scale-105 z-10" 
                    : "border-slate-200 shadow-sm hover:shadow-md"
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-block bg-[#08507f] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-xl font-extrabold text-[#020617]">{override?.name ?? plan.name}</h3>
                  <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">{override?.description ?? plan.description}</p>
                </div>

                <div className="mb-8 flex items-baseline">
                  {symbol && <span className="text-xl font-bold text-slate-400 mr-1 self-start mt-1">{symbol}</span>}
                  <span className="text-5xl font-extrabold text-[#020617] tracking-tight">{value}</span>
                  <span className="text-slate-400 font-bold text-sm ml-2 self-end mb-1">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {(override?.perks ?? plan.perks).map((perk, i) => (
                    <li key={i} className="flex items-start group">
                      <div className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mr-3 mt-0.5 transition-colors",
                        isPopular ? "bg-[#e8f4fd] text-[#08507f]" : "bg-emerald-50 text-emerald-600"
                      )}>
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="text-slate-600 text-[14px] leading-tight font-medium group-hover:text-slate-900 transition-colors">{perk}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={cn(
                    "w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.98] mt-auto",
                    isPopular 
                      ? "bg-[#08507f] text-white shadow-lg hover:bg-[#064066] hover:shadow-xl" 
                      : "bg-[#e8f4fd] text-[#08507f] hover:bg-white hover:ring-2 hover:ring-[#08507f]/20"
                  )}
                  onClick={() => handleSubscribe(plan)}
                  disabled={checkingOut === plan.id}
                >
                  {checkingOut === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    plan.priceMonthly === 0 ? 'Get Started for Free' : 'Subscribe Now'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

