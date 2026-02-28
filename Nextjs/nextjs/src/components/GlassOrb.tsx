import React from 'react';

export default function GlassOrb({
    className,
    style
}: {
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={`fixed rounded-full pointer-events-none animate-[floatOrb_20s_ease-in-out_infinite] ${className || ''}`}
            style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                ...style
            }}
        />
    );
}
