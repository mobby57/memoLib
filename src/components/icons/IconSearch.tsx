

export interface IconSearchProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function IconSearch({ 
  size = 24, 
  color = 'currentColor',
  ...props 
}: IconSearchProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        cx="11"
        cy="11"
        r="8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 21L16.65 16.65"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default IconSearch;
