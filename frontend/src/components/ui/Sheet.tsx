import React from "react"

export function Sheet({ children, open, onOpenChange }: any) {
    if (!open) return null
    return <div className="fixed inset-0 z-50 bg-black/50">{children}</div>
}
export function SheetContent({ children, className }: any) { return <div className={`fixed right-0 top-0 bottom-0 w-96 bg-white p-6 shadow-xl overflow-y-auto ${className}`}>{children}</div> }
export function SheetHeader({ children, className }: any) { return <div className={className}>{children}</div> }
export function SheetTitle({ children, className }: any) { return <h2 className={className}>{children}</h2> }
export function SheetDescription({ children, className }: any) { return <p className={className}>{children}</p> }
export function SheetFooter({ children, className }: any) { return <div className={className}>{children}</div> }
