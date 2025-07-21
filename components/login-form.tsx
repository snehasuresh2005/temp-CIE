"use client"

import * as React from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { LoginSideCard } from "./login-sidecard";

// Inline Icons implementation
const Icons = {
  logo: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img 
      src="/logo.png" 
      alt="Logo" 
      className="h-16 w-auto"
      {...props}
    />
  ),
  spinner: Loader2
}

export function LoginForm() {
  const [email, setEmail] = React.useState("")  
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const { login } = useAuth()

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(email, password)
    if (!success) {
      setError("Invalid email or password")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background video full screen */}
      <video
        src="/login_background_animation.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
        style={{ pointerEvents: 'none', userSelect: 'none', opacity: 1 }}
      />
        {/* Split card layout */}
        <div className="w-full max-w-4xl z-10 flex flex-row rounded-2xl shadow-lg overflow-hidden bg-white">
        {/* Login form card */}
        <div className="basis-1/2 flex flex-col items-center justify-center p-0 bg-white">
          <Card className="bg-gray-50 shadow-none p-0 rounded-2xl w-full">
            <CardContent className="p-8 flex flex-col items-center">
              <Icons.logo className="h-28 w-auto" />
              <h1 className="text-3xl tracking-tight mb-2 mt-0" style={{ fontFamily: 'Gotham, Helvetica, Arial, sans-serif', fontWeight: 'normal' }}>Welcome back</h1>
              <p className="text-base text-muted-foreground mb-6">
                Enter your email to sign in to your account
              </p>
              <form onSubmit={onSubmit} className="space-y-6 w-full max-w-md">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        {/* Side illustration card */}
        <div className="hidden md:flex flex-col items-center justify-center basis-1/2">
          <LoginSideCard />
        </div>
      </div>
    </div>
  )
}
