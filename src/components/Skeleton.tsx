import { Fragment, ReactNode, HTMLAttributes } from "react"

export function Skeleton({
  short,
  inline,
  className = "",
  ...props
}: {
  short?: boolean
  inline?: boolean
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: short ? "15em" : undefined,
        display: inline ? "inline-block" : undefined,
      }}
      {...props}
    />
  )
}

export function SkeletonButton() {
  return <div className="skeleton skeleton-btn" />
}

export function SkeletonInput() {
  return <div className="skeleton skeleton-input" />
}

export function SkeletonList({
  amount,
  children,
}: {
  amount: number
  children: ReactNode
}) {
  return (
    <>
      {Array.from({ length: amount }).map((_, i) => (
        <Fragment key={i}>{children}</Fragment>
      ))}
    </>
  )
}
