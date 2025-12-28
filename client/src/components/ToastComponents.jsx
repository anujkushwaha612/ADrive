import React from 'react';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner'; // or 'react-hot-toast' depending on your setup

// --- 1. Loading Toast ---
export const LoadingToast = ({
  message = "Uploading...",
  subMessage = "Please wait",
}) => (
  <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-neutral-900/90 backdrop-blur-sm shadow-lg">
    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />

    <div className="flex-1">
      <h3 className="text-sm font-medium text-white">{message}</h3>
      <p className="text-xs text-neutral-400 mt-0.5">{subMessage}</p>
    </div>
  </div>
);


// --- 2. Success Toast ---
export const SuccessToast = ({ title, message, t }) => (
  <div className="w-full flex items-start gap-3 px-4 py-3 rounded-lg border border-emerald-500/25 bg-neutral-900/90 backdrop-blur-sm shadow-lg">
    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />

    <div className="flex-1">
      <h3 className="text-sm font-medium text-emerald-100">{title}</h3>
      <p className="text-xs text-neutral-400 mt-1">{message}</p>
    </div>

    <button
      onClick={() => toast.dismiss(t)}
      className="text-neutral-400 hover:text-white transition"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);


// --- 3. Error Toast ---
export const ErrorToast = ({ title, message, t }) => (
  <div className="w-full flex items-start gap-3 px-4 py-3 rounded-lg border border-red-500/30 bg-neutral-900/90 backdrop-blur-sm shadow-lg">
    <XCircle className="w-5 h-5 text-red-400 mt-0.5" />

    <div className="flex-1">
      <h3 className="text-sm font-medium text-red-100">{title}</h3>
      <p className="text-xs text-neutral-400 mt-1">{message}</p>
    </div>

    <button
      onClick={() => toast.dismiss(t)}
      className="text-neutral-400 hover:text-white transition"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);
