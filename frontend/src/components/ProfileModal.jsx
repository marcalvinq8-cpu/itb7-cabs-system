import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User, Lock, Save } from 'lucide-react'
import api from '@/api/axios'
import { useAuth } from '@/hooks/useAuth'
import Modal from '@/components/ui/Modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import Badge from '@/components/ui/Badge'

export default function ProfileModal({ onClose }) {
  const { user, refreshUser } = useAuth()

  const [profile, setProfile] = useState({
    full_name:      user?.full_name      ?? '',
    age:            user?.age            ?? '',
    gender:         user?.gender         ?? '',
    address:        user?.address        ?? '',
    contact_number: user?.contact_number ?? '',
  })

  const [passwords, setPasswords] = useState({
    current_password:      '',
    password:              '',
    password_confirmation: '',
  })

  const setP  = (k, v) => setProfile(f => ({ ...f, [k]: v }))
  const setPw = (k, v) => setPasswords(f => ({ ...f, [k]: v }))

  const profileMutation = useMutation({
    mutationFn: data => api.put('/auth/profile', data),
    onSuccess: async () => {
      await refreshUser()
      toast.success('Profile updated.')
    },
    onError: err => {
      const errors = err.response?.data?.errors
      if (errors) toast.error(Object.values(errors).flat()[0])
      else toast.error(err.response?.data?.message || 'Failed to update profile.')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: data => api.put('/auth/password', data),
    onSuccess: () => {
      toast.success('Password changed.')
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to change password.'),
  })

  const handleProfileSave = () => {
    profileMutation.mutate({
      full_name:      profile.full_name,
      age:            profile.age ? Number(profile.age) : null,
      gender:         profile.gender  || null,
      address:        profile.address || null,
      contact_number: profile.contact_number || null,
    })
  }

  const handlePasswordSave = () => {
    if (passwords.password !== passwords.password_confirmation) {
      toast.error('New passwords do not match.')
      return
    }
    if (passwords.password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    passwordMutation.mutate(passwords)
  }

  return (
    <Modal title="My Profile" onClose={onClose} size="xl">
      <div className="space-y-5">
        {/* Identity banner */}
        <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
          <div className="w-12 h-12 rounded-full bg-[#C0392B] flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold">
              {user?.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-sm text-[#1C2833] truncate">{user?.email}</p>
          </div>
          <div className="ml-auto shrink-0">
            <Badge status={user?.role} />
          </div>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#1C2833]" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={profile.full_name} onChange={e => setP('full_name', e.target.value)} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age</Label>
                <Input
                  type="number" min={1} max={150}
                  value={profile.age}
                  onChange={e => setP('age', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <select
                  value={profile.gender}
                  onChange={e => setP('gender', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#E5E7E9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FADBD8] focus:border-[#C0392B] bg-white"
                >
                  <option value="">— Select —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Contact Number</Label>
              <Input
                value={profile.contact_number}
                onChange={e => setP('contact_number', e.target.value)}
                placeholder="09XX XXX XXXX"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Address</Label>
              <textarea
                rows={2}
                value={profile.address}
                onChange={e => setP('address', e.target.value)}
                placeholder="Brgy. Sala, Cabuyao, Laguna"
                className="mt-1 w-full rounded-lg border border-[#E5E7E9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FADBD8] focus:border-[#C0392B] resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button loading={profileMutation.isPending} onClick={handleProfileSave}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#1C2833]" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwords.current_password}
                onChange={e => setPw('current_password', e.target.value)}
                placeholder="Enter current password"
                className="mt-1"
              />
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwords.password}
                onChange={e => setPw('password', e.target.value)}
                placeholder="Min 8 characters"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwords.password_confirmation}
                onChange={e => setPw('password_confirmation', e.target.value)}
                placeholder="Repeat new password"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button loading={passwordMutation.isPending} onClick={handlePasswordSave}>
                <Lock className="h-4 w-4" /> Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Modal>
  )
}
