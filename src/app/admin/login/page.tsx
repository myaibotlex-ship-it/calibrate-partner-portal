"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle } from "lucide-react";

const ADMIN_PASSWORD = "Calibrate2026";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simple password check
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "authenticated");
      router.push("/admin");
    } else {
      setError("Invalid password");
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A4B84] to-[#3BB4C1] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Image 
            src="/calibrate-logo.png" 
            alt="Calibrate HCM" 
            width={180} 
            height={50}
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-900">Partner Portal Admin</h1>
          <p className="text-gray-600 text-sm mt-1">Enter your password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#1A4B84] hover:bg-[#1A4B84]/90"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-sm text-[#3BB4C1] hover:underline"
          >
            ← Back to Partner Portal
          </a>
        </div>
      </div>
    </div>
  );
}
