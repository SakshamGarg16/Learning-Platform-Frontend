import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    gradientHover?: boolean;
}

export function Card({ children, className = "", gradientHover = false, ...props }: CardProps) {
    return (
        <motion.div
            whileHover={gradientHover ? { y: -2, scale: 1.01 } : undefined}
            className={`
        relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md
        shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        transition-colors duration-300
        ${gradientHover ? 'hover:border-indigo-500/50 hover:bg-neutral-900/60' : ''}
        ${className}
      `}
            {...props}
        >
            {gradientHover && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}
            <div className="relative z-10 p-6">
                {children}
            </div>
        </motion.div>
    );
}
