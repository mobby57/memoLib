

export interface IconCloseProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function IconClose({ 
  size = 24, 
  color = 'currentColor',
  ...props 
}: IconCloseProps) {
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
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default IconClose;
