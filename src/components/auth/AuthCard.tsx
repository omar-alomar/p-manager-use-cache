// components/AuthCard.tsx

interface AuthCardProps {
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{title}</h1>
        {children}
        {footer && (
          <div className="auth-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}