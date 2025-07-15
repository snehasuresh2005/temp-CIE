"use client"

import * as React from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      {/* Left side with form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg space-y-10">
          <div className="flex flex-col items-center">
            <Icons.logo className="h-16 w-auto mb-6" />
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'black', fontWeight: 'bold', textAlign: 'center', WebkitTextStroke: 'unset', textShadow: 'unset', background: 'unset', boxShadow: 'unset', filter: 'unset', zIndex: 1, position: 'relative' }}>Welcome back</h1>
            <p className="text-base text-muted-foreground mt-3">
              Enter your email to sign in to your account
            </p>
          </div>
          
          <Card className="bg-gray-50 shadow-lg p-2">
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
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
                </div>
              </form>
            </CardContent>
          </Card>
          

        </div>
      </div>
      
      {/* Right side with image */}
      <div className="hidden lg:block relative w-1/2">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/login-bg.png)',
          }}
        />
      </div>
    </div>
  )
}
