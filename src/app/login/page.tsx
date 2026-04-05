"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError("Invalid email or password")
    } else {
      router.push("/")
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteCode }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }
    await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    router.push("/")
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Deal Tracker</h1>
        <p className="text-gray-500 text-sm mb-6">Real estate portfolio analysis</p>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`pb-2 px-4 text-sm font-medium ${tab === "login" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            onClick={() => { setTab("login"); setError("") }}
          >
            Sign In
          </button>
          <button
            className={`pb-2 px-4 text-sm font-medium ${tab === "register" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            onClick={() => { setTab("register"); setError("") }}
          >
            Create Account
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invite Code
                <span className="ml-1 text-xs text-gray-400 font-normal">(required to join)</span>
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className={inputCls}
                autoComplete="off"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
