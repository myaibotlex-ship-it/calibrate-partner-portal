"use client";

import Link from "next/link";
import { Handshake } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">Calibrate HCM</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Calibrate HCM partners with industry-leading companies to deliver
              comprehensive HR, payroll, and technology solutions for businesses
              of all sizes.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Partner Directory
                </Link>
              </li>
              <li>
                <Link href="/become-partner" className="hover:text-foreground transition-colors">
                  Become a Partner
                </Link>
              </li>
              <li>
                <a href="https://calibratehcm.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Calibrate HCM
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:partners@calibratehcm.com" className="hover:text-foreground transition-colors">
                  partners@calibratehcm.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Calibrate HCM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
