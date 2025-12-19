'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { AnnouncementDisplayModal } from '@/components/ui/AnnouncementDisplayModal'

interface Announcement {
  id: string
  title: string
  message: string
  image: string | null
  createdAt: string
}

export function AnnouncementListener() {
  const { socket } = useSocket()
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    if (!socket) return

    const handleAnnouncement = (data: { announcement: Announcement; timestamp: Date }) => {
      console.log('📢 Nuevo anuncio recibido:', data.announcement)
      setCurrentAnnouncement(data.announcement)
    }

    socket.on('announcement:new', handleAnnouncement)

    return () => {
      socket.off('announcement:new', handleAnnouncement)
    }
  }, [socket])

  return (
    <AnnouncementDisplayModal
      isOpen={!!currentAnnouncement}
      announcement={currentAnnouncement}
      onClose={() => setCurrentAnnouncement(null)}
    />
  )
}
