"use client";

import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image 
            src="/calibrate-logo.png" 
            alt="Calibrate HCM" 
            width={140} 
            height={40}
            className="h-10 w-auto"
          />
          <div className="border-l pl-3 border-border">
            <span className="text-muted-foreground text-sm font-medium">Partner Portal</span>
          </div>
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">Partners</Button>
          </Link>
          <Link href="/become-partner">
            <Button className="gap-2 bg-[#1A4B84] hover:bg-[#1A4B84]/90">
              <Users className="w-4 h-4" />
              Become a Partner
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
