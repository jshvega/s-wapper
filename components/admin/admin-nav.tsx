'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/users', label: 'Users', exact: false },
  { href: '/admin/adjustments', label: 'Adjustments', exact: false },
  { href: '/admin/logs', label: 'Activity Logs', exact: false },
  { href: '/admin/bid-periods', label: 'Bid Periods', exact: false },
  { href: '/admin/launch-checklist', label: '✓ Launch', exact: false },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              active
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
