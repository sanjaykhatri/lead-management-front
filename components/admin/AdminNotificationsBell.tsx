'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { usePusherNotifications } from '@/hooks/usePusher'
import { IconButton, Badge, Popper, Paper, ClickAwayListener, MenuList, Typography, Divider, Button, Box, CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'

interface Notification {
  id: string
  type: string
  data: any
  read_at: string | null
  created_at: string
}

const StyledPopper = styled(Popper)(({ theme }) => ({
  zIndex: 1300,
  minWidth: 360,
  marginTop: theme.spacing(1),
}))

export default function AdminNotificationsBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  // Handle real-time notifications
  const handleLeadAssigned = useCallback((data: any) => {
    const message = data.message || `New lead assigned: ${data.lead.name}`
    toast.success(message, { duration: 4000 })

    const newNotification: Notification = {
      id: `pusher-${Date.now()}-assigned`,
      type: 'lead_assigned',
      data: { message, lead_id: data.lead.id },
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    fetchUnreadCount()
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leadAssigned', { detail: data }))
    }
  }, [])

  const handleStatusUpdated = useCallback((data: any) => {
    const message = data.message || `Lead '${data.lead.name}' status changed`
    toast.success(message, { duration: 4000 })

    const newNotification: Notification = {
      id: `pusher-${Date.now()}-status`,
      type: 'lead_status_updated',
      data: { message, lead_id: data.lead.id },
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    fetchUnreadCount()
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leadStatusUpdated', { detail: data }))
    }
  }, [])

  const handleNoteCreated = useCallback((data: any) => {
    const message = data.message || `New note added to lead '${data.lead.name}'`
    toast.success(message, { duration: 4000 })

    const newNotification: Notification = {
      id: `pusher-${Date.now()}-note`,
      type: 'lead_note_created',
      data: { message, lead_id: data.lead.id },
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    fetchUnreadCount()
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leadNoteCreated', { detail: data }))
    }
  }, [])

  usePusherNotifications('admin', 'admin', 'lead.assigned', handleLeadAssigned, false)
  usePusherNotifications('admin', 'admin', 'lead.status.updated', handleStatusUpdated, false)
  usePusherNotifications('admin', 'admin', 'lead.note.created', handleNoteCreated, false)

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/admin/notifications/unread')
      setUnreadCount(response.data.count)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/notifications')
      setNotifications(response.data.data || response.data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/admin/notifications/${id}/read`)
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/admin/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setOpen(!open)
  }

  const handleClose = () => {
    setOpen(false)
    setAnchorEl(null)
  }

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Badge badgeContent={unreadCount} color="error">
          <i className="tabler-bell" />
        </Badge>
      </IconButton>
      <StyledPopper open={open} anchorEl={anchorEl} placement="bottom-end" disablePortal>
        <Paper sx={{ boxShadow: 4, maxHeight: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" fontWeight={600}>Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead}>Mark all read</Button>
            )}
          </Box>
          <Box sx={{ overflow: 'auto', maxHeight: 320 }}>
            {loading ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No notifications</Typography>
              </Box>
            ) : (
              <MenuList>
                {notifications.map((notification) => (
                  <Box
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read_at) {
                        markAsRead(notification.id)
                      }
                    }}
                    sx={{
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      bgcolor: notification.read_at ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <Typography variant="body2" fontWeight={notification.read_at ? 400 : 600}>
                      {notification.data?.message || 'New notification'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </MenuList>
            )}
          </Box>
        </Paper>
      </StyledPopper>
    </>
  )
}
