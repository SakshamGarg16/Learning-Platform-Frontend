import React, { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, leftIcon, ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5">
                {label && (
                    <label className="text-sm font-medium text-neutral-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full rounded-xl border border-neutral-700 bg-neutral-900/50 px-4 py-2.5 text-sm text-white
              placeholder:text-neutral-500 
              focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
              transition-all duration-200
              ${leftIcon ? 'pl-10' : ''}
              ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs text-red-400 mt-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
