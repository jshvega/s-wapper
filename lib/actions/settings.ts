'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { NotificationPreferences } from '@/lib/types'

export async function updateNotificationPreferences(prefs: NotificationPreferences) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({
      notification_preferences: prefs,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('updateNotificationPreferences error:', error)
    return { error: 'Failed to save preferences.' }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function updatePhone(phone: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const digits = phone.replace(/\D/g, '')
  if (phone.trim() && digits.length < 7) {
    return { error: 'Please enter a valid phone number.' }
  }

  const normalized = phone.trim() || null

  const { error } = await supabase
    .from('profiles')
    .update({ phone: normalized, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error('updatePhone error:', error)
    return { error: 'Failed to update phone number.' }
  }

  revalidatePath('/settings')
  return { success: true }
}
