import { useState, useEffect } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("lifesaver_token");
  });
  const [user, setUser] = useState<{ id: string; email: string; userName: string } | null>(() => {
    const saved = localStorage.getItem("lifesaver_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [userName, setUserName] = useState<string>(() => {
    const savedUser = localStorage.getItem("lifesaver_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser).userName || "New User";
      } catch (_) {}
    }
    return localStorage.getItem("lifesaver_username") || "New User";
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    const savedUser = localStorage.getItem("lifesaver_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser).email || "";
      } catch (_) {}
    }
    return "";
  });
  const [profilePic, setProfilePic] = useState<string>(() => {
    const savedUser = localStorage.getItem("lifesaver_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser).profilePic || "";
      } catch (_) {}
    }
    return "";
  });

  const handleAuthSuccess = (newToken: string, authUser: { id: string; email: string; userName: string; profilePic?: string | null }) => {
    localStorage.setItem("lifesaver_token", newToken);
    localStorage.setItem("lifesaver_user", JSON.stringify(authUser));
    localStorage.setItem("lifesaver_username", authUser.userName);
    
    // Clear local mockup/caches
    localStorage.removeItem("lifesaver_tasks");
    localStorage.removeItem("lifesaver_goals");
    localStorage.removeItem("lifesaver_schedule");
    localStorage.removeItem("lifesaver_deleted_tasks");
    
    setToken(newToken);
    setUser(authUser as any);
    setUserName(authUser.userName);
    setUserEmail(authUser.email);
    setProfilePic(authUser.profilePic || "");
  };

  const handleLogout = () => {
    localStorage.removeItem("lifesaver_token");
    localStorage.removeItem("lifesaver_user");
    localStorage.removeItem("lifesaver_username");
    localStorage.removeItem("lifesaver_tasks");
    localStorage.removeItem("lifesaver_goals");
    localStorage.removeItem("lifesaver_schedule");
    localStorage.removeItem("lifesaver_deleted_tasks");
    
    setToken(null);
    setUser(null);
    setUserName("New User");
    setUserEmail("");
    setProfilePic("");
  };

  const handleUpdateProfile = async (name: string, email: string, picUrl: string) => {
    if (!token) return { success: false, message: "Not authenticated" };
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userName: name, email, profilePic: picUrl })
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, userName: data.userName, email: data.email, profilePic: data.profilePic };
        setUser(updatedUser as any);
        setUserName(data.userName);
        setUserEmail(data.email);
        setProfilePic(data.profilePic || "");
        localStorage.setItem("lifesaver_user", JSON.stringify(updatedUser));
        localStorage.setItem("lifesaver_username", data.userName);
        return { success: true, message: "Profile settings updated successfully!" };
      } else {
        return { success: false, message: data.error || "Failed to update profile settings." };
      }
    } catch (err) {
      console.error("Update profile error:", err);
      return { success: false, message: "Failed to connect to server." };
    }
  };

  // Capture Google OAuth callbacks from redirect query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlId = params.get("id");
    const urlEmail = params.get("email");
    const urlUserName = params.get("userName");
    const urlProfilePic = params.get("profilePic");

    if (urlToken && urlId && urlEmail && urlUserName) {
      handleAuthSuccess(urlToken, { 
        id: urlId, 
        email: urlEmail, 
        userName: urlUserName, 
        profilePic: urlProfilePic || "" 
      });
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Fetch Profile Info when token is available
  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      try {
        const profileRes = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const dbProfile = await profileRes.json();
          setUserName(dbProfile.userName);
          setUserEmail(dbProfile.email);
          setProfilePic(dbProfile.profilePic || "");
          const updatedUser = { ...user, userName: dbProfile.userName, email: dbProfile.email, profilePic: dbProfile.profilePic || "" };
          setUser(updatedUser as any);
          localStorage.setItem("lifesaver_user", JSON.stringify(updatedUser));
          localStorage.setItem("lifesaver_username", dbProfile.userName);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };

    loadProfile();
  }, [token]);

  return {
    token,
    setToken,
    user,
    setUser,
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    profilePic,
    setProfilePic,
    handleAuthSuccess,
    handleLogout,
    handleUpdateProfile
  };
}
