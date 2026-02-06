import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow hover:shadow-lg transition ${className}`}
    >
      {children}
    </div>
  );
}
