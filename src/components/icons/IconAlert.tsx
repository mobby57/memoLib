

export interface IconAlertProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function IconAlert({ 
  size = 24, 
  color = 'currentColor',
  ...props 
}: IconAlertProps) {
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
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="16"
        r="0.5"
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
    </svg>
  );
}

export default IconAlert;
