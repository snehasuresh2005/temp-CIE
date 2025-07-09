import Image from "next/image"
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react"

interface GenButtonProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {}

// A small reusable button that shows the genAI icon and forwards any other props
export default function GenButton({ children, style, ...props }: GenButtonProps) {
  return (
    <button
      {...props}
      type={props.type || "button"}
      className={`inline-flex items-center justify-center h-10 w-10 rounded hover:opacity-80 transition-opacity ${props.className || ""}`.trim()}
    >
      {/* Use Next.js Image for optimization */}
      <Image src="/genAI_icon.jpg" alt="Generate AI" width={32} height={32} priority />
    </button>
  )
}
