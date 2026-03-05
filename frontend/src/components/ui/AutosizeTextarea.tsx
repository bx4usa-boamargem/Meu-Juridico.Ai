import * as React from "react";

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

export interface AutosizeTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    maxHeight?: number;
    minRows?: number;
}

const AutosizeTextarea = React.forwardRef<HTMLTextAreaElement, AutosizeTextareaProps>(
    ({ className, maxHeight, minRows = 1, ...props }, ref) => {
        const internalRef = React.useRef<HTMLTextAreaElement>(null);

        // Combine refs
        React.useImperativeHandle(ref, () => internalRef.current!);

        const adjustHeight = React.useCallback(() => {
            const textarea = internalRef.current;
            if (textarea) {
                textarea.style.height = "auto";
                const newHeight = Math.min(
                    textarea.scrollHeight,
                    maxHeight || Infinity
                );
                textarea.style.height = `${newHeight}px`;
            }
        }, [maxHeight]);

        React.useEffect(() => {
            adjustHeight();

            // Handle window resize
            window.addEventListener("resize", adjustHeight);
            return () => window.removeEventListener("resize", adjustHeight);
        }, [adjustHeight, props.value]);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            adjustHeight();
            props.onChange?.(e);
        };

        return (
            <textarea
                {...props}
                ref={internalRef}
                onChange={handleChange}
                rows={props.rows || 1}
                className={cn(
                    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
                    className
                )}
            />
        );
    }
);

AutosizeTextarea.displayName = "AutosizeTextarea";

export { AutosizeTextarea };
