

export interface IconMenuProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function IconMenu({ 
  size = 24, 
  color = 'currentColor',
  ...props 
}: IconMenuProps) {
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
        d="M3 12H21M3 6H21M3 18H21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default IconMenu;
