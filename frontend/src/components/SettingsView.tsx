import React, { useState, useEffect } from "react";
import { User, Mail, CheckCircle, AlertCircle, Camera, Upload } from "lucide-react";

interface SettingsViewProps {
  darkCalmMode: boolean;
  userName: string;
  userEmail: string;
  profilePic: string;
  onLogout: () => void;
  onUpdateProfile: (name: string, email: string, pic: string) => Promise<{ success: boolean; message: string }>;
}

export default function SettingsView({
  darkCalmMode,
  userName,
  userEmail,
  profilePic,
  onLogout,
  onUpdateProfile
}: SettingsViewProps) {
  const [localName, setLocalName] = useState(userName);
  const [localEmail, setLocalEmail] = useState(userEmail);
  const [localProfilePic, setLocalProfilePic] = useState(profilePic || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync inputs with prop updates (e.g. on load)
  useEffect(() => {
    setLocalName(userName);
    setLocalEmail(userEmail);
    setLocalProfilePic(profilePic || "");
  }, [userName, userEmail, profilePic]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select a valid image file." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;
          
          if (img.width > img.height) {
            sWidth = img.height;
            sx = (img.width - img.height) / 2;
          } else {
            sHeight = img.width;
            sy = (img.height - img.width) / 2;
          }
          
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setLocalProfilePic(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localName.trim() || !localEmail.trim()) {
      setMessage({ type: "error", text: "Name and Email cannot be empty." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await onUpdateProfile(localName, localEmail, localProfilePic);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile details." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto text-left space-y-6 pt-4">
      <div className="flex flex-col space-y-1">
        <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">App Settings & Customization</h3>
        <p className="text-sm text-[#72749b]">Configure profile options, default task durations, or change client settings.</p>
      </div>

      <div className={`p-6 rounded-2xl border space-y-6 ${
        darkCalmMode ? "bg-[#181822]/90 text-white border-white/5" : "bg-white border-[#efecf6]"
      }`}>
        
        {/* User settings parameters */}
        <div className="space-y-4">
          <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white uppercase tracking-wider">User Identity</h4>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Avatar Selector Section */}
            <div className="space-y-4 border-b border-[#efecf6] dark:border-white/5 pb-6">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block font-bold">Profile Avatar</label>
              
              <div className="flex flex-wrap items-center gap-6">
                <div className="relative group shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-[#5054b1] shadow-sm">
                  <img 
                    src={localProfilePic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                    alt="Profile Avatar Preview" 
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <Camera className="w-5 h-5 text-white/90" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] text-[#72749b] font-medium">Choose a preset avatar:</span>
                    <span className="text-[11px] text-[#72749b] font-light">or</span>
                    <label className="text-[11px] text-[#5054b1] hover:text-[#373b97] dark:text-[#a0a5ff] dark:hover:text-[#c0c4ff] font-semibold cursor-pointer flex items-center gap-1 hover:underline">
                      <Upload className="w-3.5 h-3.5" />
                      Upload from device
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80"
                    ].map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLocalProfilePic(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                          localProfilePic === url ? "border-[#5054b1] scale-105 ring-2 ring-[#5054b1]/30" : "border-transparent"
                        }`}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block font-bold">Custom Avatar URL</span>
                <input 
                  type="text" 
                  value={localProfilePic}
                  onChange={(e) => setLocalProfilePic(e.target.value)}
                  placeholder="https://example.com/your-avatar.jpg"
                  className={`w-full px-4 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#5054b1]/50 ${
                    darkCalmMode 
                      ? "bg-white/5 border-white/10 text-white" 
                      : "bg-[#f5f2fb]/50 border-[#efecf6] text-[#1b1b21]"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block font-bold">Profile Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#72749b]" />
                  <input 
                    type="text" 
                    value={localName} 
                    onChange={(e) => setLocalName(e.target.value)} 
                    placeholder="Enter your name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#5054b1]/50 ${
                      darkCalmMode 
                        ? "bg-white/5 border-white/10 text-white" 
                        : "bg-[#f5f2fb]/50 border-[#efecf6] text-[#1b1b21]"
                    }`}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block font-bold">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#72749b]" />
                  <input 
                    type="email" 
                    value={localEmail} 
                    onChange={(e) => setLocalEmail(e.target.value)} 
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#5054b1]/50 ${
                      darkCalmMode 
                        ? "bg-white/5 border-white/10 text-white" 
                        : "bg-[#f5f2fb]/50 border-[#efecf6] text-[#1b1b21]"
                    }`}
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
                message.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                  : "bg-rose-500/10 border-rose-500/20 text-rose-500"
              }`}>
                {message.type === "success" ? <CheckCircle className="w-4.5 h-4.5 shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#5054b1] hover:bg-[#373b97] active:scale-95 disabled:opacity-50 text-white text-xs px-5 py-2.5 rounded-xl transition-all font-semibold"
              >
                {loading ? "Saving Changes..." : "Save Profile Changes"}
              </button>
              
              <button 
                type="button"
                onClick={onLogout}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs px-5 py-2.5 rounded-xl transition-all font-semibold"
              >
                Sign Out Account
              </button>
            </div>
          </form>
        </div>

        {/* Focus parameters defaults */}
        <div className="space-y-4 pt-6 border-t border-[#efecf6] dark:border-white/5">
          <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white uppercase tracking-wider">Focus Custom Parameters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Default Work Cycle Length</label>
              <select className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:bg-[#181822] dark:text-white">
                <option className="text-black" value="45">45 Minutes</option>
                <option className="text-black" value="60">60 Minutes</option>
                <option className="text-black" value="90">90 Minutes (Recommended)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Default Break Rest Length</label>
              <select className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:border-white/10 dark:bg-[#181822] dark:text-white">
                <option className="text-black" value="10">10 Minutes</option>
                <option className="text-black" value="15">15 Minutes (Recommended)</option>
                <option className="text-black" value="25">25 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Developer / reset control bounds */}
        <div className="space-y-4 pt-6 border-t border-rose-100 dark:border-rose-950/30">
          <h4 className="font-sans font-bold text-xs text-rose-500 uppercase tracking-wider">Experimental Recovery Actions</h4>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[#72749b]">Reset cached local tasks metadata to return to default initial mockups.</p>
            <button 
              onClick={() => {
                if (confirm("Reset current cached priority lists back to mock state?")) {
                  localStorage.removeItem("lifesaver_tasks");
                  localStorage.removeItem("lifesaver_goals");
                  localStorage.removeItem("lifesaver_schedule");
                  localStorage.removeItem("lifesaver_deleted_tasks");
                  window.location.reload();
                }
              }}
              className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs px-5 py-2 rounded-xl transition-all font-semibold font-sans dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
            >
              Reset System Data
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
