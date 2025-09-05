"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthContext"
import { updateProfile, changePassword } from "@/actions/auth"

export default function ProfilePage() {
  const { user, loading, checkAuth } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile")
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    email: ""
  })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    // Don't redirect immediately if user is null - wait for loading to complete
    if (!loading && !user) {
      router.push("/login")
      return
    }
    
    // Set initial profile data when user is available
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email
      })
      setIsLoading(false)
    }
  }, [user, loading, router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsUpdating(true)

    try {
      const result = await updateProfile({ name: profileData.name })
      
      if (result) {
        setError(result)
      } else {
        setSuccess("Profile updated successfully!")
        // Refresh auth state to get updated user data
        await checkAuth()
      }
    } catch (err) {
      setError("Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setIsUpdating(true)

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      if (result) {
        setError(result)
      } else {
        setSuccess("Password changed successfully!")
        // Clear password form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      }
    } catch (err) {
      setError("Failed to change password")
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and security settings</p>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile Information
        </button>
        <button
          className={`tab-button ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          Change Password
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="profile-content">
        {activeTab === "profile" && (
          <form onSubmit={handleProfileUpdate} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
                disabled={isUpdating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={profileData.email}
                disabled
                className="disabled-input"
              />
              <small className="form-note">Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <input
                type="text"
                id="role"
                value={user?.role || ""}
                disabled
                className="disabled-input"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="submit-button"
            >
              {isUpdating ? "Updating..." : "Update Profile"}
            </button>
          </form>
        )}

        {activeTab === "password" && (
          <form onSubmit={handlePasswordChange} className="profile-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                disabled={isUpdating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={8}
                disabled={isUpdating}
              />
              <small className="form-note">Password must be at least 8 characters long</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                disabled={isUpdating}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="submit-button"
            >
              {isUpdating ? "Changing..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
