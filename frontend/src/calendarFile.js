function icsStamp(iso) {
  const [datePart, timePart = ''] = iso.replace(/[-:]/g, '').split('T')
  return `${datePart}T${timePart.substring(0, 6).padEnd(6, '0')}` // 20261105T140000 (floating local time)
}

export function buildIcsContent({ uid, title, start, end, location, description }) {
  const escape = text => (text || '').replace(/\\/g, '\\\\').replace(/[,;]/g, match => '\\' + match).replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${uid}@booking`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').substring(0, 15)}Z`,
    `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
    `SUMMARY:${escape(title)}`,
    location ? `LOCATION:${escape(location)}` : null,
    description ? `DESCRIPTION:${escape(description)}` : null,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

// iOS Safari ignores `download` on data: URLs, so the file is served from a Blob URL instead.
export function downloadIcsFile(content, fileName = 'appointment.ics') {
  const blobUrl = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
}
