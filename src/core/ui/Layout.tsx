export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer lg:drawer-open h-screen">
      {/* Page content */}
      <div className="drawer-content flex h-full min-h-0 flex-col">
        {children}
      </div>
    </div>
  )
}
