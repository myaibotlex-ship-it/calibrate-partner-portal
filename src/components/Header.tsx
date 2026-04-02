"use client";

import Link from "next/link";
import { Users, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Handshake className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg">Calibrate HCM</span>
            <span className="text-muted-foreground text-sm block -mt-1">Partner Portal</span>
          </div>
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">Partners</Button>
          </Link>
          <Link href="/become-partner">
            <Button className="gap-2">
              <Users className="w-4 h-4" />
              Become a Partner
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
