'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
    FaFacebook,
    FaInstagram,
    FaTiktok,
    FaTwitter,
    FaLinkedin,
    FaWhatsapp,
    FaThreads,
} from 'react-icons/fa6';
import { FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CongratulationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewResults: () => void;
    testTitle?: string;
    attemptId?: string;
}

export default function CongratulationsModal({
    isOpen,
    onClose,
    onViewResults,
    testTitle = 'English Test',
    attemptId,
}: CongratulationsModalProps) {
    const [copied, setCopied] = useState(false);

    // Share the specific result page if attemptId is present
    const shareUrl = typeof window !== 'undefined'
        ? (attemptId ? `${window.location.origin}/results/${attemptId}` : window.location.href)
        : '';

    const shareText = `I just finished the ${testTitle}! Check it out!`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = [
        {
            name: 'Facebook',
            icon: <FaFacebook className="w-6 h-6 text-[#1877F2]" />,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            bgColor: 'hover:bg-[#1877F2]/10',
        },
        {
            name: 'Twitter / X',
            icon: <FaTwitter className="w-6 h-6 text-black" />,
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            bgColor: 'hover:bg-black/10',
        },
        {
            name: 'LinkedIn',
            icon: <FaLinkedin className="w-6 h-6 text-[#0A66C2]" />,
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            bgColor: 'hover:bg-[#0A66C2]/10',
        },
        {
            name: 'WhatsApp',
            icon: <FaWhatsapp className="w-6 h-6 text-[#25D366]" />,
            url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
            bgColor: 'hover:bg-[#25D366]/10',
        },
        {
            name: 'Threads',
            icon: <FaThreads className="w-6 h-6 text-black" />,
            url: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
            bgColor: 'hover:bg-black/10',
        },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
            <div className="flex flex-col items-center text-center space-y-6 pt-2 pb-6">

                {/* Animated Success Icon */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-bounce">
                    <span className="text-4xl">🎉</span>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Congratulations!</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        You have successfully completed <strong>{testTitle}</strong>. Great job on taking the step to improve your skills!
                    </p>
                </div>

                <div className="w-full pt-6 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-600 mb-4">Share your achievement</p>

                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-3 rounded-full bg-gray-50 transition-colors ${link.bgColor} border border-gray-100`}
                                title={`Share on ${link.name}`}
                            >
                                {link.icon}
                            </a>
                        ))}

                        <button
                            onClick={() => {
                                handleCopyLink();
                                toast('Link copied for Instagram/TikTok!', { icon: '📸' });
                            }}
                            className="p-3 rounded-full bg-gray-50 transition-colors hover:bg-pink-500/10 border border-gray-100"
                            title="Share on Instagram"
                        >
                            <FaInstagram className="w-6 h-6 text-[#E4405F]" />
                        </button>

                        <button
                            onClick={() => {
                                handleCopyLink();
                                toast('Link copied for Instagram/TikTok!', { icon: '🎵' });
                            }}
                            className="p-3 rounded-full bg-gray-50 transition-colors hover:bg-black/10 border border-gray-100"
                            title="Share on TikTok"
                        >
                            <FaTiktok className="w-6 h-6 text-black" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 max-w-sm mx-auto bg-gray-50 p-2 rounded-lg border border-gray-200 mb-6">
                        <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 bg-transparent border-none text-sm text-gray-500 focus:ring-0 px-2 truncate outline-none"
                        />
                        <button
                            onClick={handleCopyLink}
                            className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-600"
                            title="Copy Link"
                        >
                            {copied ? <FiCheck className="w-4 h-4 text-green-600" /> : <FiCopy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex w-full gap-3 px-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onViewResults}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        View Results
                    </button>
                </div>
            </div>
        </Modal>
    );
}
