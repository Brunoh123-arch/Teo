import React from 'react';

export const Skeleton = ({ className, ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} {...props} />
  );
};
