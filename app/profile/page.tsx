import type { Metadata } from 'next'
import { AvatarProfilePage } from '@/components/avatar-profile/avatar-profile-page'

export const metadata: Metadata = { title: 'Personal account – LessonQuest' }

export default function ProfilePage() {
  return <AvatarProfilePage />
}
