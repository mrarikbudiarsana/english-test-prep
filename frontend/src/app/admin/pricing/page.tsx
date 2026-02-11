'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import axios from 'axios';
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

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pricing/admin`);
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pricing/${editingPlan.id}`, formData);
                toast.success('Plan updated successfully');
            } else {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/pricing`, formData);
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
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/pricing/${id}`);
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pricing Plans Management</h1>
                <Button onClick={() => openModal()} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Plan
                </Button>
            </div>

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
