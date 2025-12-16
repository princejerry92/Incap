import React, { useState, useRef } from 'react';
import { Copy, Share2, QrCode, Check, Download, MessageCircle, Facebook, Twitter, RefreshCw } from 'lucide-react';

const ReferralCodeDisplay = ({ referralCode, userName, loading = false, showSpinner = false }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 bg-white/20 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-1" />
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-blue-200 rounded w-32 animate-pulse" />
            <div className="h-8 bg-blue-200 rounded w-16 animate-pulse" />
          </div>
          <div className="h-12 bg-white rounded-lg animate-pulse mb-3" />
          <div className="h-3 bg-blue-200 rounded w-48 animate-pulse" />
        </div>

        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2" />
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        <div className="mb-6">
          <div className="h-10 bg-purple-100 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-green-100 rounded-xl animate-pulse" />
          <div className="h-12 bg-blue-100 rounded-xl animate-pulse" />
          <div className="h-12 bg-sky-100 rounded-xl animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!referralCode) return null;

  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
  const shareMessage = `Join me on Blue Gold Investment! Use my referral code ${referralCode} to get started. ${referralUrl}`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Blue Gold Investment',
          text: shareMessage,
          url: referralUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    }
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(`Join me on Blue Gold Investment! Use my referral code ${referralCode}`)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on Blue Gold Investment! Use my referral code ${referralCode} ${referralUrl}`)}`;
    window.open(twitterUrl, '_blank');
  };

  const downloadQR = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `referral-qr-${referralCode}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 relative">
      {showSpinner && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-spin">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Loading data...</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Share Your Code</h3>
          <p className="text-xs sm:text-sm text-gray-600">Invite friends and earn points</p>
        </div>
      </div>

      {/* Referral Code Display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Your Referral Code</span>
          <button
            onClick={() => copyToClipboard(referralCode)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="font-mono text-2xl font-bold text-center text-gray-800 bg-white rounded-lg p-3 border-2 border-dashed border-blue-300">
          {referralCode}
        </div>

        <div className="mt-3 text-xs text-gray-600 text-center">
          Share this code with friends during signup
        </div>
      </div>

      {/* Referral URL */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
          />
          <button
            onClick={() => copyToClipboard(referralUrl)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-2 w-full p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all"
        >
          <QrCode className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-800">{showQR ? 'Hide' : 'Show'} QR Code</span>
        </button>

        {showQR && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
            <div ref={qrRef} className="flex justify-center mb-3">
              {/* QR Code will be generated here - for now showing placeholder */}
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <QrCode className="w-12 h-12 text-gray-400" />
                <span className="text-xs text-gray-500 ml-2">QR Code</span>
              </div>
            </div>
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </button>
          </div>
        )}
      </div>

      {/* Social Sharing */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share via
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareToWhatsApp}
            className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors border border-green-200"
          >
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">WhatsApp</span>
          </button>

          <button
            onClick={shareToFacebook}
            className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Facebook</span>
          </button>

          <button
            onClick={shareToTwitter}
            className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors border border-sky-200"
          >
            <Twitter className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-gray-700">Twitter</span>
          </button>

          {navigator.share && (
            <button
              onClick={shareViaWebShare}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">More</span>
            </button>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <h4 className="font-medium text-gray-800 mb-2">How it works:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Share your referral code or link with friends</li>
          <li>2. When they sign up and invest, you earn 10 points</li>
          <li>3. Redeem points for cash (1 point = ₦1,000)</li>
          <li>4. Build your downline network for more earnings</li>
        </ol>
      </div>
    </div>
  );
};

export default ReferralCodeDisplay;
