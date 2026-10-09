'use client'

import { useCallback, useEffect, useState } from 'react'
import { avatarStorageKey, defaultAvatarProfile, parseAvatarProfile, type AvatarProfile } from './profile'

const avatarChangedEvent = 'corgi-avatar-changed'

export function useLocalAvatar() {
  const [profile, setProfile] = useState<AvatarProfile>(defaultAvatarProfile)
  const [saved, setSaved] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    const restore = () => {
      if (!active) return
      try {
        const stored = localStorage.getItem(avatarStorageKey)
        const next = parseAvatarProfile(stored)
        setProfile((current) => current.skinId === next.skinId ? current : next)
        setSaved(Boolean(stored))
      } catch { /* The game also works when storage is disabled. */ }
      setReady(true)
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === avatarStorageKey || event.key === null) restore()
    }
    queueMicrotask(restore)
    window.addEventListener('storage', onStorage)
    window.addEventListener(avatarChangedEvent, restore)
    return () => {
      active = false
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(avatarChangedEvent, restore)
    }
  }, [])
  const save = useCallback((next: AvatarProfile) => {
    setProfile(next)
    try {
      localStorage.setItem(avatarStorageKey, JSON.stringify(next))
      window.dispatchEvent(new Event(avatarChangedEvent))
      setSaved(true)
      return true
    } catch { setSaved(false); return false }
  }, [])
  return { profile, save, saved, ready }
}
