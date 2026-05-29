'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

interface PricingPlan {
    id: number;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    currency: string;
    perks: string[];
    isActive: boolean;
    isPopular: boolean;
    tierLevel: number;
}

export default function AdminPricingPage() {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
    const [formData, setFormData] = useState<Partial<PricingPlan>>({
        name: '',
        description: '',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'IDR',
        perks: [],
        isActive: true,
        isPopular: false,
        tierLevel: 0,
    });

    // Waitlist States
    const [activeTab, setActiveTab] = useState<'plans' | 'waitlist'>('plans');
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [fetchingWaitlist, setFetchingWaitlist] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        if (activeTab === 'waitlist') {
            fetchWaitlist();
        }
    }, [activeTab]);

    const fetchPlans = async () => {
        try {
            const response = await api.get('/pricing/admin');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const fetchWaitlist = async () => {
        setFetchingWaitlist(true);
        try {
            const response = await api.get('/admin/waitlist');
            setWaitlist(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Error fetching waitlist:', error);
            toast.error('Failed to load waitlist');
        } finally {
            setFetchingWaitlist(false);
        }
    };

    const handleDeleteWaitlist = async (id: number) => {
        if (!confirm('Are you sure you want to remove this entry from the waitlist?')) return;
        try {
            await api.delete(`/admin/waitlist/${id}`);
            toast.success('Removed from waitlist successfully');
            fetchWaitlist();
        } catch (error) {
            console.error('Error deleting waitlist entry:', error);
            toast.error('Failed to remove entry');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await api.put(`/pricing/${editingPlan.id}`, formData);
                toast.success('Plan updated successfully');
            } else {
                await api.post('/pricing', formData);
                toast.success('Plan created successfully');
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            toast.error('Failed to save plan');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await api.delete(`/pricing/${id}`);
            toast.success('Plan deleted successfully');
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            toast.error('Failed to delete plan');
        }
    };

    const openModal = (plan?: PricingPlan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData(plan);
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                description: '',
                priceMonthly: 0,
                priceYearly: 0,
                currency: 'IDR',
                perks: [],
                isActive: true,
                isPopular: false,
                tierLevel: plans.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    const handlePerkChange = (index: number, value: string) => {
        const newPerks = [...(formData.perks || [])];
        newPerks[index] = value;
        setFormData({ ...formData, perks: newPerks });
    };

    const addPerk = () => {
        setFormData({ ...formData, perks: [...(formData.perks || []), ''] });
    };

    const removePerk = (index: number) => {
        const newPerks = [...(formData.perks || [])];
        newPerks.splice(index, 1);
        setFormData({ ...formData, perks: newPerks });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            {/* Tab switch */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                <div className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`text-lg font-bold pb-2 border-b-2 transition-all ${
                            activeTab === 'plans'
                                ? 'border-[#08507f] text-[#08507f]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Pricing Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('waitlist')}
                        className={`text-lg font-bold pb-2 border-b-2 transition-all ${
                            activeTab === 'waitlist'
                                ? 'border-[#08507f] text-[#08507f]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Waitlist Signups
                    </button>
                </div>
                {activeTab === 'plans' && (
                    <Button onClick={() => openModal()} className="flex items-center gap-2 bg-[#08507f] hover:bg-[#064066] text-white border-none shadow-sm">
                        <Plus className="w-4 h-4" /> Add Plan
                    </Button>
                )}
            </div>

            {activeTab === 'plans' ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (Monthly/Yearly)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popular</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {plans.map((plan) => (
                                <tr key={plan.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                                        <div className="text-sm text-gray-500">{plan.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {plan.priceMonthly.toLocaleString()} / {plan.priceYearly.toLocaleString()} {plan.currency}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {plan.isPopular ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-gray-400" />}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(plan)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(plan.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {fetchingWaitlist ? (
                        <div className="p-12 text-center text-gray-500 animate-pulse font-medium">Loading waitlist entries...</div>
                    ) : waitlist.length === 0 ? (
                        <div className="p-16 text-center text-gray-400">
                            <p className="font-bold text-lg text-slate-700 mb-1">No one has joined the waitlist yet</p>
                            <p className="text-sm max-w-sm mx-auto leading-relaxed">Once users request access on the pricing page, their details will appear here.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {waitlist.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{entry.email}</div>
                                            {entry.displayName && (
                                                <div className="text-xs text-gray-500 font-medium">Name: {entry.displayName}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-bold bg-[#e8f4fd] text-[#08507f] rounded-full uppercase tracking-wider">
                                                {entry.planName || `Plan #${entry.planId}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {entry.userId ? (
                                                <span className="px-2.5 py-0.5 inline-flex text-[10px] font-bold tracking-wider leading-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                                    Registered Account
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 inline-flex text-[10px] font-bold tracking-wider leading-5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                                    Guest Visitor
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteWaitlist(entry.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Remove from waitlist"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <div className="h-6" />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlan ? 'Edit Plan' : 'New Plan'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Plan Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Textarea
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Monthly Price"
                            type="number"
                            value={formData.priceMonthly}
                            onChange={(e) => setFormData({ ...formData, priceMonthly: parseInt(e.target.value) })}
                            required
                        />
                        <Input
                            label="Yearly Price"
                            type="number"
                            value={formData.priceYearly}
                            onChange={(e) => setFormData({ ...formData, priceYearly: parseInt(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Active</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.isPopular}
                                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Popular</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Perks</label>
                        <div className="space-y-2">
                            {formData.perks?.map((perk, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={perk}
                                        onChange={(e) => handlePerkChange(index, e.target.value)}
                                        placeholder="Enter perk details"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePerk(index)}
                                        className="p-2 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <Button type="button" variant="secondary" size="sm" onClick={addPerk}>
                                <Plus className="w-4 h-4 mr-1" /> Add Perk
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingPlan ? 'Update Plan' : 'Create Plan'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
