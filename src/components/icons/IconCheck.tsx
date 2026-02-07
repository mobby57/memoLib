

export interface IconCheckProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function IconCheck({ 
  size = 24, 
  color = 'currentColor',
  ...props 
}: IconCheckProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default IconCheck;
