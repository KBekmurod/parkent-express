'use client';

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, child =>
        React.cloneElement(child, { open, setOpen })
      )}
    </div>
  );
}

const DropdownMenuTrigger = ({ children, open, setOpen, className }) => {
  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn("inline-flex items-center", className)}
    >
      {children}
    </button>
  );
}

const DropdownMenuContent = ({ children, open, setOpen, className }) => {
  if (!open) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={cn(
          "absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
          className
        )}
      >
        <div className="py-1">{children}</div>
      </div>
    </>
  );
}

const DropdownMenuItem = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100",
        className
      )}
    >
      {children}
    </button>
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
