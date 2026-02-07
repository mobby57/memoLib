import React from 'react';

export const Select = ({ children }: any) => <div>{children}</div>;
export const SelectTrigger = ({ children, className }: any) => (
  <button className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
    {children}
  </button>
);
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;
export const SelectContent = ({ children }: any) => (
  <div className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-md">
    <div className="p-1">{children}</div>
  </div>
);
export const SelectItem = ({ children, className, ...props }: any) => (
  <div 
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`} 
    {...props}
  >
    {children}
  </div>
);
