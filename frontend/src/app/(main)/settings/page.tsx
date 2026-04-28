'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import ImageUploader from '@/components/ui/ImageUploader';
import { HiUser, HiLockClosed } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
    const { user, updateUserProfile, updateUserPassword } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    // Password State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user?.displayName) {
            setDisplayName(user.displayName);
        }
        if (user?.photoUrl) {
            setPhotoUrl(user.photoUrl);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateUserProfile(displayName, photoUrl);
            toast.success(t('settings_save'));
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await updateUserPassword(password);
            toast.success(t('settings_update_pw'));
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error('Failed to update password. Please log out and log in again to verify your identity.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        {
            key: 'profile',
            label: t('settings_profile_tab'),
            icon: <HiUser className="w-5 h-5" />,
        },
        {
            key: 'security',
            label: t('settings_security_tab'),
            icon: <HiLockClosed className="w-5 h-5" />,
        },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('settings_title')}</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="bg-gray-50 px-6 pt-2"
                />

                <div className="p-6 md:p-8">
                    {activeTab === 'profile' && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('settings_profile_info')}</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">{t('settings_profile_pic')}</label>
                                    <ImageUploader
                                        onUpload={(url) => setPhotoUrl(url)}
                                        currentUrl={photoUrl}
                                    />
                                </div>
                                <Input
                                    label={t('settings_display_name')}
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder={t('settings_enter_name')}
                                />
                                <Input
                                    label={t('settings_email')}
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-gray-50 text-gray-500"
                                />
                                <div className="pt-2">
                                    <Button type="submit" loading={loading}>
                                        {t('settings_save')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('settings_change_pw')}</h2>
                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <Input
                                    type="password"
                                    label={t('settings_new_pw')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('settings_enter_pw')}
                                    minLength={6}
                                />
                                <Input
                                    type="password"
                                    label={t('settings_confirm_pw')}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('settings_confirm_pw_placeholder')}
                                    minLength={6}
                                />
                                <div className="pt-2">
                                    <Button type="submit" loading={loading} variant="primary">
                                        {t('settings_update_pw')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
