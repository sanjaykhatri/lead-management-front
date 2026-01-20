// Next Imports
import { usePathname } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const pathname = usePathname()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {pathname?.startsWith('/admin') && (
          <>
            <MenuSection label='Admin' />
            <MenuItem href='/admin/dashboard' icon={<i className='tabler-layout-dashboard' />}>
              Dashboard
            </MenuItem>
            <MenuItem href='/admin/service-providers' icon={<i className='tabler-users' />}>
              Service Providers
            </MenuItem>
            <MenuItem href='/admin/locations' icon={<i className='tabler-map-pin' />}>
              Locations
            </MenuItem>
            <MenuItem href='/admin/plans' icon={<i className='tabler-crown' />}>
              Plans
            </MenuItem>
            <MenuItem href='/admin/analytics' icon={<i className='tabler-chart-bar' />}>
              Analytics
            </MenuItem>
            <MenuItem href='/admin/users' icon={<i className='tabler-shield' />}>
              Users
            </MenuItem>
            <MenuItem href='/admin/settings' icon={<i className='tabler-settings' />}>
              Settings
            </MenuItem>
          </>
        )}

        {pathname?.startsWith('/provider') && (
          <>
            <MenuSection label='Provider' />
            <MenuItem href='/provider/dashboard' icon={<i className='tabler-layout-board' />}>
              Dashboard
            </MenuItem>
            <MenuItem href='/provider/subscription' icon={<i className='tabler-credit-card' />}>
              Subscription
            </MenuItem>
            <MenuItem href='/provider/profile' icon={<i className='tabler-user' />}>
              Profile
            </MenuItem>
          </>
        )}

        {!pathname?.startsWith('/admin') && !pathname?.startsWith('/provider') && (
          <>
            <MenuSection label='App' />
            <MenuItem href='/' icon={<i className='tabler-smart-home' />}>
              Home
            </MenuItem>
          </>
        )}
      </Menu>
      {/* <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
