"use client"

import { useState } from "react"

type User = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  _count: { deals: number; comments: number }
}

export default function AdminUsersPanel({
  users: initialUsers,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const [users, setUsers] = useState(initialUsers)
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  async function patch(id: string, body: object) {
    setSaving(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(null)
    if (res.ok) {
      const updated: User = await res.json()
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, ...updated } : x)))
    }
    return res
  }

  async function toggleRole(user: User) {
    const newRole = user.role === "admin" ? "partner" : "admin"
    await patch(user.id, { role: newRole })
  }

  async function submitReset() {
    setResetError("")
    setResetSuccess("")
    if (!newPassword || newPassword.length < 8) {
      setResetError("Password must be at least 8 characters")
      return
    }
    const res = await patch(resetTarget!.id, { newPassword })
    if (res.ok) {
      setResetSuccess("Password updated successfully.")
      setNewPassword("")
    } else {
      const data = await res.json()
      setResetError(data.error ?? "Failed to reset password")
    }
  }

  async function confirmDelete(user: User) {
    setSaving(user.id)
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
    setSaving(null)
    if (res.ok) {
      setUsers((u) => u.filter((x) => x.id !== user.id))
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left font-medium">User</th>
              <th className="px-5 py-3 text-left font-medium">Role</th>
              <th className="px-5 py-3 text-left font-medium">Deals</th>
              <th className="px-5 py-3 text-left font-medium">Joined</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-black/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{user.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${
                      user.role === "admin"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {user._count.deals} deal{user._count.deals !== 1 ? "s" : ""}
                  <span className="text-gray-400 ml-1">· {user._count.comments} comments</span>
                </td>
                <td className="px-5 py-4 text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggleRole(user)}
                      disabled={saving === user.id || user.id === currentUserId}
                      title={user.role === "admin" ? "Remove admin" : "Make admin"}
                      className="text-xs text-gray-500 hover:text-purple-600 border border-gray-200 hover:border-purple-300 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {user.role === "admin" ? "Remove admin" : "Make admin"}
                    </button>
                    <button
                      onClick={() => { setResetTarget(user); setResetError(""); setResetSuccess(""); setNewPassword("") }}
                      className="text-xs text-gray-500 hover:text-[#0071e3] border border-gray-200 hover:border-[#0071e3]/40 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Reset password
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="text-xs text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-300 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] shadow-xl border border-black/[0.07] w-full max-w-md p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-4">
              Set a new password for <strong>{resetTarget.name ?? resetTarget.email}</strong>.
            </p>
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setResetError(""); setResetSuccess("") }}
              className="w-full bg-black/[0.03] border border-black/[0.10] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]/50 mb-3"
              autoFocus
            />
            {resetError && <p className="text-sm text-red-600 mb-3">{resetError}</p>}
            {resetSuccess && <p className="text-sm text-green-600 mb-3">{resetSuccess}</p>}
            <div className="flex gap-2">
              <button
                onClick={submitReset}
                disabled={saving === resetTarget.id}
                className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1] disabled:opacity-40"
              >
                {saving === resetTarget.id ? "Saving…" : "Update Password"}
              </button>
              <button
                onClick={() => setResetTarget(null)}
                className="border border-black/[0.12] text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] shadow-xl border border-black/[0.07] w-full max-w-md p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Delete User</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete{" "}
              <strong>{deleteTarget.name ?? deleteTarget.email}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => confirmDelete(deleteTarget)}
                disabled={saving === deleteTarget.id}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40"
              >
                {saving === deleteTarget.id ? "Deleting…" : "Delete User"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="border border-black/[0.12] text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
