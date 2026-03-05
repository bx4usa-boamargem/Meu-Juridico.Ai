import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FileText } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> { }
export function Table({ className, ...props }: TableProps) {
    return (
        <div className="w-full overflow-auto">
            <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
        </div>
    );
}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <thead ref={ref} className={cn("[&_tr]:border-b-2 [&_tr]:border-border-base bg-main", className)} {...props} />
    )
);
TableHeader.displayName = "TableHeader"

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn("border-b border-border-base transition-colors hover:bg-main data-[state=selected]:bg-main h-14", className)}
            {...props}
        />
    )
);
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn("h-12 px-4 text-left align-middle font-bold text-text-primary", className)}
            {...props}
        />
    )
);
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <td ref={ref} className={cn("px-4 py-2 align-middle", className)} {...props} />
    )
);
TableCell.displayName = "TableCell"

export const TableEmpty = () => (
    <TableRow>
        <TableCell colSpan={100} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center text-text-muted">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium text-text-primary">Nenhum documento encontrado</p>
            </div>
        </TableCell>
    </TableRow>
);

export const TableLoading = () => (
    <>
        {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
                <TableCell colSpan={100}>
                    <div className="h-4 w-full bg-border-base rounded animate-pulse" />
                </TableCell>
            </TableRow>
        ))}
    </>
);
