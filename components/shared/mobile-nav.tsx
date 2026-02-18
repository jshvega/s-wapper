'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  List,
  MoreHorizontal,
  BookOpen,
  History,
  Settings,
  Users,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth'

const mainNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Market', icon: ShoppingBag },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/listings', label: 'Listings', icon: List },
]

const moreNavItems = [
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = moreNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute bottom-16 right-0 left-0 bg-white border-t rounded-t-xl shadow-lg p-3 safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">More</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {moreNavItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                      active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
            <div className="border-t mt-2 pt-2">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav aria-label="Mobile navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t safe-area-bottom">
        <div className="grid grid-cols-5 h-16 pb-[env(safe-area-inset-bottom)]">
          {mainNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
                  active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <item.icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-400')} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-label="More options"
            aria-expanded={moreOpen}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
              moreOpen || isMoreActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <MoreHorizontal className={cn('h-5 w-5', moreOpen || isMoreActive ? 'text-blue-600' : 'text-gray-400')} aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
