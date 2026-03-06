import React from "react"

export function Select({ children, value, onValueChange }: any) {
    return <div onClick={() => { }}>{children}</div>
}
export function SelectTrigger({ children, className }: any) { return <button className={`border rounded p-2 ${className}`}>{children}</button> }
export function SelectValue({ placeholder }: any) { return <span>{placeholder}</span> }
export function SelectContent({ children }: any) { return <div className="bg-white border shadow-md p-2">{children}</div> }
export function SelectItem({ children, value }: any) { return <div className="p-2 hover:bg-gray-100">{children}</div> }
