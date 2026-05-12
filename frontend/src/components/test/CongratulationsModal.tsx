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
import { HiCheck, HiSparkles } from 'react-icons/hi';
import { HiClipboardCopy } from 'react-icons/hi';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

interface CongratulationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewResults: () => void;
    testTitle?: string;
    attemptId?: string;
    score?: number;
    isFreeTest?: boolean;
}

export default function CongratulationsModal({
    isOpen,
    onClose,
    onViewResults,
    testTitle = 'English Test',
    attemptId,
    score,
    isFreeTest = false,
}: CongratulationsModalProps) {
    const [copied, setCopied] = useState(false);
    const [copiedPromo, setCopiedPromo] = useState(false);
    const { t } = useLanguage();

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

    const handleCopyPromoCode = () => {
        navigator.clipboard.writeText('ITPARIK');
        setCopiedPromo(true);
        toast.success('Promo code ITPARIK copied!');
        setTimeout(() => setCopiedPromo(false), 2000);
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
            <div className="flex flex-col items-center text-center space-y-5 pt-2 pb-6">

                {/* Animated Success Icon */}
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mb-1 animate-bounce">
                    <span className="text-3xl">🎉</span>
                </div>

                <div className="space-y-1 px-4">
                    <h2 className="text-2xl font-extrabold text-slate-900">Congratulations!</h2>
                    {score != null ? (
                        <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed">
                            {(() => {
                                const text = t('congrats_celebration_score')
                                    .replace('{score}', String(score))
                                    .replace('{testTitle}', testTitle);
                                return text.split('**').map((part, index) => 
                                    index % 2 === 1 ? (
                                        <strong key={index} className="font-extrabold text-slate-800">
                                            {part}
                                        </strong>
                                    ) : (
                                        part
                                    )
                                );
                            })()}
                        </p>
                    ) : (
                        <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed">
                            You have successfully completed <strong>{testTitle}</strong>. Great job on taking the step to improve your skills!
                        </p>
                    )}
                </div>

                {/* ── YEC Discount Ticket stub (for completed free tests) ── */}
                {isFreeTest && (
                    <div className="relative overflow-hidden w-full max-w-sm rounded-2xl border-2 border-dashed border-orange-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 mt-4 flex flex-col items-center">
                        {/* Notch left */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-white border-r-2 border-dashed border-orange-200 rounded-r-full" />
                        {/* Notch right */}
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-white border-l-2 border-dashed border-orange-200 rounded-l-full" />

                        <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-xs sm:text-sm uppercase tracking-wider mb-1.5">
                            <HiSparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                            {t('congrats_yec_banner_title')}
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed max-w-[280px] mb-4">
                            {t('congrats_yec_banner_body')}
                        </p>

                        <div className="flex items-center gap-2 bg-white rounded-lg border border-orange-200 p-1 pl-4 shadow-sm">
                            <span className="font-mono font-black text-slate-800 tracking-wider text-base">
                                ITPARIK
                            </span>
                            <button
                                onClick={handleCopyPromoCode}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs transition-all shadow"
                            >
                                {copiedPromo ? (
                                    <>
                                        <HiCheck className="w-3.5 h-3.5 text-white" />
                                        {t('congrats_yec_copied')}
                                    </>
                                ) : (
                                    <>
                                        <HiClipboardCopy className="w-3.5 h-3.5 text-white" />
                                        {t('congrats_yec_copy_btn')}
                                    </>
                                )}
                            </button>
                        </div>
                        <a
                            href="https://yec.co.id"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 text-[10px] font-black text-orange-600 hover:underline tracking-widest uppercase"
                        >
                            yec.co.id →
                        </a>
                    </div>
                )}

                <div className="w-full pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Share your achievement</p>

                    <div className="flex flex-wrap justify-center gap-3 mb-5">
                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-2.5 rounded-full bg-slate-50 transition-colors ${link.bgColor} border border-slate-100`}
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
                            className="p-2.5 rounded-full bg-slate-50 transition-colors hover:bg-pink-500/10 border border-slate-100"
                            title="Share on Instagram"
                        >
                            <FaInstagram className="w-6 h-6 text-[#E4405F]" />
                        </button>

                        <button
                            onClick={() => {
                                handleCopyLink();
                                toast('Link copied for Instagram/TikTok!', { icon: '🎵' });
                            }}
                            className="p-2.5 rounded-full bg-slate-50 transition-colors hover:bg-black/10 border border-slate-100"
                            title="Share on TikTok"
                        >
                            <FaTiktok className="w-6 h-6 text-black" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 max-w-sm mx-auto bg-slate-50 p-2 rounded-lg border border-slate-200 mb-5">
                        <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 bg-transparent border-none text-xs text-slate-500 focus:ring-0 px-2 truncate outline-none"
                        />
                        <button
                            onClick={handleCopyLink}
                            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-600"
                            title="Copy Link"
                        >
                            {copied ? <FiCheck className="w-4 h-4 text-emerald-600" /> : <FiCopy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex w-full gap-3 px-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    >
                        Close
                    </button>
                    <button
                        onClick={onViewResults}
                        className="flex-1 px-4 py-2.5 bg-[#08507f] text-white font-bold rounded-lg hover:bg-[#063d61] transition-colors text-sm shadow"
                    >
                        View Results
                    </button>
                </div>
            </div>
        </Modal>
    );
}
