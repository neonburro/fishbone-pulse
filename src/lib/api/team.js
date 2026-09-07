import { supabase } from '../supabase'

/**
 * Wrapper for the `team-admin` Edge Function. supabase-js attaches the signed-in user's JWT.
 * The function answers 4xx with {error} — surface that as a real Error.
 */
async function teamAdmin(body) {
  const { data, error } = await supabase.functions.invoke('team-admin', { body })
  if (error) {
    // FunctionsHttpError carries the response; try to read {error} from it.
    let message = error.message || 'Team request failed'
    try {
      const ctx = error.context
      if (ctx && typeof ctx.json === 'function') {
        const payload = await ctx.json()
        if (payload?.error) message = payload.error
      }
    } catch {
      /* keep default message */
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

/** @returns {{ members: Array, requests: Array }} */
export async function listTeam() {
  const data = await teamAdmin({ action: 'list' })
  return { members: data?.members || [], requests: data?.requests || [] }
}

export async function inviteMember({ email, display_name, role }) {
  return teamAdmin({ action: 'invite', email: email.trim().toLowerCase(), display_name: display_name?.trim() || null, role, origin: window.location.origin })
}

export async function approveRequest(request_id, role) {
  return teamAdmin({ action: 'approve_request', request_id, role, origin: window.location.origin })
}

export async function declineRequest(request_id) {
  return teamAdmin({ action: 'decline_request', request_id })
}

export async function setMemberRole(user_id, role) {
  return teamAdmin({ action: 'set_role', user_id, role })
}

export async function removeMember(user_id, { delete_user = false } = {}) {
  return teamAdmin({ action: 'remove', user_id, delete_user })
}
