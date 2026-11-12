import { useSyncExternalStore } from 'react'
import { PUBLIC } from './i18nPublic'

const STORAGE_KEY = 'lang'
export const LANGS = ['it', 'en']
const LOCALES = { it: 'it-IT', en: 'en-GB' }

const dict = {
  en: {
    about: 'About', visitUs: 'Visit us', openingHours: 'Opening hours', today: 'Today', getDirections: 'Get directions', mapOf: 'Map of {address}',
    aboutLabel: 'About your business', aboutHint: 'A few sentences shown on your booking page.',
    gallery: 'Photo gallery', closeImage: 'Close image',
    reviews: 'Reviews', reviewCount: '{n} reviews', noReviews: 'No reviews yet. Be the first!', reviewsError: 'Reviews could not be loaded.',
    leaveReview: 'Leave a review', rating: 'Rating', yourName: 'Your name', comment: 'Comment', reviewingAs: 'Reviewing as',
    ratingRequired: 'Please choose a star rating.', reviewFailed: 'Could not send your review. Please try again.',
    reviewThanks: 'Thanks for your review!', submitReview: 'Submit review', sending: 'Sending…',
    galleryImages: 'Gallery image links', galleryImagesHint: 'One image link per line (up to 12). Shown at the top of your booking page.',
    step: 'Step {n} of 4',
    steps: ['Service', 'Day', 'Time', 'Details'],
    back: '← Back',
    min: 'min',
    serviceLabel: 'Service:',
    loadingServices: 'Loading services...',
    servicesError: 'Could not load services. Please try again.',
    noServices: 'No services available.',
    slotsError: 'Could not load slots',
    bookingFailed: 'Booking failed. Please try again.',
    slotTaken: 'That time was just taken. Please pick another one.',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    availableHint: 'Highlighted days have available times.',
    loadingSlots: 'Loading available slots...',
    noSlots: 'No available slots for this date.',
    fullName: 'Full name', bookingAs: 'Booking as',
    phone: 'Phone number',
    notes: 'Notes',
    optional: '(optional)',
    notesPlaceholder: 'Anything the barber should know?',
    nameRequired: 'Name is required.',
    nameTooLong: 'Name must be 100 characters or fewer.',
    phoneRequired: 'Phone is required.',
    phoneDigits: 'Phone must contain digits only.', phoneLength: 'Phone must have 6 to 15 digits.',
    confirmBooking: 'Request appointment',
    booking: 'Sending request...',
    approvalNote: 'This is a request. The shop will confirm your time shortly.',
    requestSent: 'Request sent!',
    waiting: 'Waiting for approval',
    willConfirm: '{shop} will confirm your appointment shortly.',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    price: 'Price',
    name: 'Name',
    addToCalendar: 'Add to calendar',
    messageOnWhatsApp: 'Message {shop} on WhatsApp',
    bookAnother: 'Book another',
    waMessage: 'Hi, this is {name}. I just booked {service} on {date} at {time}.',
    icsTitle: '{service} at {shop}',
    whatsapp: 'WhatsApp',
    call: 'Call',
    maps: 'Google Maps',
    loadingStore: 'Loading store…',
    unavailable: 'This business is currently unavailable.',
    storeNotFound: 'Store not found',
    noBusinessAt: 'No business exists at',
    language: 'Language',

    // nav / landing / misc
    login: 'Login', signup: 'Sign up', logout: 'Logout',
    loginTitle: 'Welcome back', signupTitle: 'Create your business page',
    loginSub: 'Log in to manage your appointments.', signupSub: 'Set up your booking page in a couple of minutes.',
    continueDemo: 'Continue', noAccount: 'New here?', haveAccount: 'Already have an account?',
    retry: 'Retry', searchBusinesses: 'Search by name or place…', checkingAvail: 'Checking availability…',
    closedDay: 'Closed or fully booked', timeoutError: 'This is taking longer than expected. Please try again.',
    bookingRef: 'Booking reference', phoneLabel: 'Phone', allBusinesses: 'All',
    loadingDashboard: 'Loading your dashboard…', admin: 'Admin', myArea: 'My Business', navHome: 'Find a business', openMenu: 'Open menu', closeMenu: 'Close menu',
    heroTitle: 'Book your next appointment in seconds',
    heroSub: 'Barbers and salons near you. Pick a service, a day and a time. Done.',
    bookNow: 'Book now',
    howTitle: 'How it works',
    how1t: 'Choose a service', how1d: 'Browse the shop\'s services with price and duration.',
    how2t: 'Pick a day and time', how2d: 'Only days with free slots are available.',
    how3t: 'Send your request', how3d: 'The shop confirms your appointment.',
    ownerCtaTitle: 'Own a barber shop or salon?', ownerCtaSub: 'Get your own booking page in minutes, with no setup fees.',
    ownerCtaBtn: 'Create your page',
    findBusiness: 'Find a business',
    findBusinessSub: 'Book appointments with local service providers.',
    loadBusinessesFailed: 'Failed to load businesses.',
    noBusinesses: 'No businesses yet — be the first to register!',
    notFoundText: 'Page not found.', backHome: 'Back to home',
    // client dashboard
    colShop: 'Shop', myBookings: 'My Bookings',
    lookUp: 'Look up', lookingUp: 'Looking up…',
    genericError: 'Something went wrong. Please try again.',
    cancelFailed: 'Failed to cancel appointment.',
    noAppointmentsHere: 'No appointments found at this store.',
    colService: 'Service', colStart: 'Start Time', colStatus: 'Status',
    colClient: 'Client', colTime: 'Time', colActions: 'Actions',
    colName: 'Name', colDuration: 'Duration (min)', colPrice: 'Price',
    status_PENDING: 'Pending', status_CONFIRMED: 'Confirmed', status_CANCELLED: 'Cancelled',
    cancel: 'Cancel', approve: 'Approve', edit: 'Edit', delete: 'Delete', save: 'Save', saving: 'Saving…', saved: 'Saved!',
    // owner dashboard
    ownerDashboard: 'Owner Dashboard',
    tabStore: 'Store', tabAppointments: 'Appointments', tabClients: 'Clients', tabServices: 'Services', tabHours: 'Hours', previewTitle: 'Preview', previewMobile: 'Mobile', previewDesktop: 'Desktop', previewOpen: 'Open live page', previewShow: 'Preview', previewClose: 'Close preview',
    clientsSearch: 'Search by name or phone', emptyClients: 'No clients yet. They appear here after their first booking.', colPhone: 'Phone', colVisits: 'Bookings', colLastVisit: 'Last booking', colLastService: 'Service', colNotes: 'Notes', clientsCount: '{n} clients', clientBookings: 'Bookings', bookingsOne: '{n} booking', bookingsMany: '{n} bookings',
    openNowUntil: 'Open now · until {time}', opensAtToday: 'Closed · opens today at {time}', closedAfter: 'Closed · closed at {time}', closedToday: 'Closed today', hoursOnDay: 'Open {open} to {close}', closedOnDay: 'Closed on this day',
    filterToday: 'Today', emptyToday: 'No appointments today.', filterPending: 'Pending', filterConfirmed: 'Confirmed', filterAll: 'All', filterCancelled: 'Cancelled',
    emptyPending: 'No pending appointments.', emptyConfirmed: 'No confirmed appointments.',
    emptyAll: 'No appointments yet.', noBookingsOnDay: 'No bookings on this day.', emptyCancelled: 'No cancelled appointments.',
    viewCalendar: 'Calendar', viewList: 'List',
    loadApptsFailed: 'Failed to load appointments.', approveFailed: 'Failed to approve appointment.',
    noConfirmedOnDay: 'No confirmed appointments on this day.',
    // hours
    operatingHours: 'Operating Hours',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    closed: 'Closed', open: 'Open', close: 'Close',
    loadHoursFailed: 'Failed to load operating hours.', saveHoursFailed: 'Failed to save hours.',
    hoursRequired: '{day}: open and close times are required when not closed.',
    hoursOrder: '{day}: open time must be before close time.',
    // services
    servicesTitle: 'Services', addService: 'Add Service', editService: 'Edit Service',
    noServicesYet: 'No services yet. Add one to get started.',
    confirmDeleteService: 'Delete this service?',
    loadServicesFailed: 'Failed to load services.', deleteServiceFailed: 'Failed to delete service.',
    durationMinutes: 'Duration (minutes)', priceLabel: 'Price ({symbol})',
    currency: 'Currency', currencyHint: 'Prices on your page are shown in this currency.',
    durationInvalid: 'Duration must be greater than 0.', priceInvalid: 'Price must be 0 or greater.',
    saveFailed: 'Failed to save. Please try again.',
    // store settings
    storeUrl: 'Your store URL', copyLink: 'Copy link', copied: 'Copied!',
    qrCode: 'QR code', scanToBook: 'Scan to book an appointment', printQr: 'Print', downloadQr: 'Save image', shareQr: 'Share', closeQr: 'Close',
    businessProfile: 'Business profile', businessName: 'Business name',
    address: 'Address', addressHint: 'Used for the Google Maps button.',
    whatsappNumber: 'WhatsApp number', whatsappHint: 'Local (05x) or international.',
    profileImageUrl: 'Profile image URL', profileImageHint: 'Link to a square image (logo or portrait).',
    coverImageUrl: 'Cover image URL', coverImageHint: 'Wide banner image shown at the top of your page.',
    defaultLanguage: 'Default language of your page',
    defaultLanguageHint: 'Customers see this language first. They can still switch it from the top bar.',
    langEn: 'English', langIt: 'Italiano',
    saveChanges: 'Save changes', profileSaved: 'Saved. Your public page is updated.',
    profileSaveFailed: 'Could not save. Check the fields and try again.',
    // onboarding
    setUpStore: 'Set up your store',
    onboardIntro: 'Choose a name for your business. We will create a unique booking link for you.',
    createStore: 'Create store', creating: 'Creating…',
    ...PUBLIC.en,
  },
  it: {
    about: 'Chi siamo', visitUs: 'Vieni a trovarci', openingHours: 'Orari di apertura', today: 'Oggi', getDirections: 'Indicazioni', mapOf: 'Mappa di {address}',
    aboutLabel: 'Descrizione dell’attività', aboutHint: 'Poche righe mostrate sulla tua pagina di prenotazione.',
    gallery: 'Galleria foto', closeImage: 'Chiudi immagine',
    reviews: 'Recensioni', reviewCount: '{n} recensioni', noReviews: 'Ancora nessuna recensione. Scrivi la prima!', reviewsError: 'Impossibile caricare le recensioni.',
    leaveReview: 'Lascia una recensione', rating: 'Valutazione', yourName: 'Il tuo nome', comment: 'Commento', reviewingAs: 'Recensisci come',
    ratingRequired: 'Scegli una valutazione a stelle.', reviewFailed: 'Impossibile inviare la recensione. Riprova.',
    reviewThanks: 'Grazie per la recensione!', submitReview: 'Invia recensione', sending: 'Invio…',
    galleryImages: 'Link immagini della galleria', galleryImagesHint: 'Un link per riga (max 12). Mostrate in cima alla tua pagina di prenotazione.',
    step: 'Passo {n} di 4',
    steps: ['Servizio', 'Giorno', 'Orario', 'Dati'],
    back: '← Indietro',
    min: 'min',
    serviceLabel: 'Servizio:',
    loadingServices: 'Caricamento servizi...',
    servicesError: 'Impossibile caricare i servizi. Riprova.',
    noServices: 'Nessun servizio disponibile.',
    slotsError: 'Impossibile caricare gli orari',
    bookingFailed: 'Prenotazione non riuscita. Riprova.',
    slotTaken: 'Quell\'orario è appena stato prenotato. Scegline un altro.',
    prevMonth: 'Mese precedente',
    nextMonth: 'Mese successivo',
    availableHint: 'I giorni evidenziati hanno orari disponibili.',
    loadingSlots: 'Caricamento orari disponibili...',
    noSlots: 'Nessun orario disponibile per questa data.',
    fullName: 'Nome e cognome', bookingAs: 'Prenoti come',
    phone: 'Numero di telefono',
    notes: 'Note',
    optional: '(facoltativo)',
    notesPlaceholder: 'Qualcosa che il barbiere deve sapere?',
    nameRequired: 'Il nome è obbligatorio.',
    nameTooLong: 'Il nome può avere al massimo 100 caratteri.',
    phoneRequired: 'Il telefono è obbligatorio.',
    phoneDigits: 'Il telefono deve contenere solo cifre.', phoneLength: 'Il telefono deve avere da 6 a 15 cifre.',
    confirmBooking: 'Richiedi appuntamento',
    booking: 'Invio richiesta...',
    approvalNote: 'Questa è una richiesta. L\'attività confermerà a breve il tuo orario.',
    requestSent: 'Richiesta inviata!',
    waiting: 'In attesa di conferma',
    willConfirm: '{shop} confermerà il tuo appuntamento a breve.',
    date: 'Data',
    time: 'Orario',
    duration: 'Durata',
    price: 'Prezzo',
    name: 'Nome',
    addToCalendar: 'Aggiungi al calendario',
    messageOnWhatsApp: 'Scrivi a {shop} su WhatsApp',
    bookAnother: 'Prenota ancora',
    waMessage: 'Ciao, sono {name}. Ho appena prenotato {service} il {date} alle {time}.',
    icsTitle: '{service} da {shop}',
    whatsapp: 'WhatsApp',
    call: 'Chiama',
    maps: 'Google Maps',
    loadingStore: 'Caricamento…',
    unavailable: 'Questa attività non è al momento disponibile.',
    storeNotFound: 'Negozio non trovato',
    noBusinessAt: 'Nessuna attività esiste su',
    language: 'Lingua',

    login: 'Accedi', signup: 'Registrati', logout: 'Esci',
    loginTitle: 'Bentornato', signupTitle: 'Crea la tua pagina di prenotazione',
    loginSub: 'Accedi per gestire i tuoi appuntamenti.', signupSub: 'Configura la tua pagina in pochi minuti.',
    continueDemo: 'Continua', noAccount: 'Nuovo qui?', haveAccount: 'Hai già un account?',
    retry: 'Riprova', searchBusinesses: 'Cerca per nome o zona…', checkingAvail: 'Verifica disponibilità…',
    closedDay: 'Chiuso o al completo', timeoutError: 'Sta richiedendo più tempo del previsto. Riprova.',
    bookingRef: 'Codice prenotazione', phoneLabel: 'Telefono', allBusinesses: 'Tutti',
    loadingDashboard: 'Caricamento della dashboard…', admin: 'Admin', myArea: 'La mia attività', navHome: 'Trova un\'attività', openMenu: 'Apri il menu', closeMenu: 'Chiudi il menu',
    heroTitle: 'Prenota il tuo prossimo appuntamento in pochi secondi',
    heroSub: 'Barbieri e saloni vicino a te. Scegli un servizio, un giorno e un orario. Fatto.',
    bookNow: 'Prenota ora',
    howTitle: 'Come funziona',
    how1t: 'Scegli un servizio', how1d: 'Sfoglia i servizi con prezzo e durata.',
    how2t: 'Scegli giorno e ora', how2d: 'Sono disponibili solo i giorni con orari liberi.',
    how3t: 'Invia la richiesta', how3d: 'L\'attività conferma il tuo appuntamento.',
    ownerCtaTitle: 'Hai un barbiere o un salone?', ownerCtaSub: 'Ottieni la tua pagina di prenotazione in pochi minuti, senza costi di attivazione.',
    ownerCtaBtn: 'Crea la tua pagina',
    findBusiness: 'Trova un\'attività',
    findBusinessSub: 'Prenota appuntamenti con professionisti della tua zona.',
    loadBusinessesFailed: 'Impossibile caricare le attività.',
    noBusinesses: 'Ancora nessuna attività — sii il primo a registrarti!',
    notFoundText: 'Pagina non trovata.', backHome: 'Torna alla home',
    colShop: 'Negozio', myBookings: 'Le mie prenotazioni',
    lookUp: 'Cerca', lookingUp: 'Ricerca…',
    genericError: 'Qualcosa è andato storto. Riprova.',
    cancelFailed: 'Impossibile annullare l\'appuntamento.',
    noAppointmentsHere: 'Nessun appuntamento trovato in questo negozio.',
    colService: 'Servizio', colStart: 'Inizio', colStatus: 'Stato',
    colClient: 'Cliente', colTime: 'Orario', colActions: 'Azioni',
    colName: 'Nome', colDuration: 'Durata (min)', colPrice: 'Prezzo',
    status_PENDING: 'In attesa', status_CONFIRMED: 'Confermato', status_CANCELLED: 'Annullato',
    cancel: 'Annulla', approve: 'Approva', edit: 'Modifica', delete: 'Elimina', save: 'Salva', saving: 'Salvataggio…', saved: 'Salvato!',
    ownerDashboard: 'Area titolare',
    tabStore: 'Negozio', tabAppointments: 'Appuntamenti', tabClients: 'Clienti', tabServices: 'Servizi', tabHours: 'Orari', previewTitle: 'Anteprima', previewMobile: 'Mobile', previewDesktop: 'Desktop', previewOpen: 'Apri pagina live', previewShow: 'Anteprima', previewClose: 'Chiudi anteprima',
    clientsSearch: 'Cerca per nome o telefono', emptyClients: 'Ancora nessun cliente. Appaiono qui dopo la prima prenotazione.', colPhone: 'Telefono', colVisits: 'Prenotazioni', colLastVisit: 'Ultima prenotazione', colLastService: 'Servizio', colNotes: 'Note', clientsCount: '{n} clienti', clientBookings: 'Prenotazioni', bookingsOne: '{n} prenotazione', bookingsMany: '{n} prenotazioni',
    openNowUntil: 'Aperto ora · fino alle {time}', opensAtToday: 'Chiuso · apre oggi alle {time}', closedAfter: 'Chiuso · ha chiuso alle {time}', closedToday: 'Chiuso oggi', hoursOnDay: 'Aperto dalle {open} alle {close}', closedOnDay: 'Chiuso in questo giorno',
    filterToday: 'Oggi', emptyToday: 'Nessun appuntamento oggi.', filterPending: 'In attesa', filterConfirmed: 'Confermati', filterAll: 'Tutti', filterCancelled: 'Annullati',
    emptyPending: 'Nessun appuntamento in attesa.', emptyConfirmed: 'Nessun appuntamento confermato.',
    emptyAll: 'Ancora nessun appuntamento.', noBookingsOnDay: 'Nessuna prenotazione in questo giorno.', emptyCancelled: 'Nessun appuntamento annullato.',
    viewCalendar: 'Calendario', viewList: 'Elenco',
    loadApptsFailed: 'Impossibile caricare gli appuntamenti.', approveFailed: 'Impossibile approvare l\'appuntamento.',
    noConfirmedOnDay: 'Nessun appuntamento confermato in questo giorno.',
    operatingHours: 'Orari di apertura',
    days: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
    closed: 'Chiuso', open: 'Apre', close: 'Chiude',
    loadHoursFailed: 'Impossibile caricare gli orari di apertura.', saveHoursFailed: 'Impossibile salvare gli orari.',
    hoursRequired: '{day}: orario di apertura e chiusura obbligatori se non è chiuso.',
    hoursOrder: '{day}: l\'apertura deve essere prima della chiusura.',
    servicesTitle: 'Servizi', addService: 'Aggiungi servizio', editService: 'Modifica servizio',
    noServicesYet: 'Ancora nessun servizio. Aggiungine uno per iniziare.',
    confirmDeleteService: 'Eliminare questo servizio?',
    loadServicesFailed: 'Impossibile caricare i servizi.', deleteServiceFailed: 'Impossibile eliminare il servizio.',
    durationMinutes: 'Durata (minuti)', priceLabel: 'Prezzo ({symbol})',
    currency: 'Valuta', currencyHint: 'I prezzi della tua pagina sono mostrati in questa valuta.',
    durationInvalid: 'La durata deve essere maggiore di 0.', priceInvalid: 'Il prezzo deve essere 0 o più.',
    saveFailed: 'Salvataggio non riuscito. Riprova.',
    storeUrl: 'Indirizzo del tuo negozio', copyLink: 'Copia link', copied: 'Copiato!',
    qrCode: 'Codice QR', scanToBook: 'Inquadra per prenotare un appuntamento', printQr: 'Stampa', downloadQr: 'Salva immagine', shareQr: 'Condividi', closeQr: 'Chiudi',
    businessProfile: 'Profilo attività', businessName: 'Nome attività',
    address: 'Indirizzo', addressHint: 'Usato per il pulsante Google Maps.',
    whatsappNumber: 'Numero WhatsApp', whatsappHint: 'Italiano (3xx) o internazionale.',
    profileImageUrl: 'URL immagine profilo', profileImageHint: 'Link a un\'immagine quadrata (logo o ritratto).',
    coverImageUrl: 'URL immagine di copertina', coverImageHint: 'Immagine larga mostrata in cima alla tua pagina.',
    defaultLanguage: 'Lingua predefinita della pagina',
    defaultLanguageHint: 'I clienti vedono prima questa lingua. Possono comunque cambiarla dalla barra in alto.',
    langEn: 'English', langIt: 'Italiano',
    saveChanges: 'Salva modifiche', profileSaved: 'Salvato. La tua pagina pubblica è aggiornata.',
    profileSaveFailed: 'Impossibile salvare. Controlla i campi e riprova.',
    setUpStore: 'Configura il tuo negozio',
    onboardIntro: 'Scegli il nome della tua attività. Creeremo per te un link di prenotazione univoco.',
    createStore: 'Crea negozio', creating: 'Creazione…',
    ...PUBLIC.it,
  },
}

const listeners = new Set()

// Two scopes:
//  - global: landing page, dashboards, etc. Remembered under 'lang'.
//  - store:  a public store page. A visitor's choice is remembered per store ('lang:store:<slug>').
// Language on a store page = visitor's choice for that store > store's default > global/browser.
let scope = null // store slug while on a public store page

const validLang = v => (LANGS.includes(v) ? v : null)
const globalSaved = () => validLang(localStorage.getItem(STORAGE_KEY))
const storeKey = slug => `${STORAGE_KEY}:store:${slug}`

// Fallback when the visitor hasn't chosen: country from their IP (Italy -> Italian,
// anywhere else -> English). Cached after the first lookup; until it arrives, or if it
// fails (e.g. local dev), the browser language is used.
const GEO_KEY = 'geoLang'
const geoCached = () => validLang(localStorage.getItem(GEO_KEY))
const browserLang = () => ((navigator.language || '').toLowerCase().startsWith('it') ? 'it' : 'en')

function detect() {
  return globalSaved() || geoCached() || browserLang()
}

let storeDefaultNow = null

function reapply() {
  if (scope) {
    apply(validLang(localStorage.getItem(storeKey(scope))) || validLang(storeDefaultNow) || detect())
  } else {
    apply(detect())
  }
}

export function initGeoLang() {
  if (geoCached()) return
  fetch('/api/geo')
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      if (!d || !d.country) return
      localStorage.setItem(GEO_KEY, d.country === 'IT' ? 'it' : 'en')
      reapply()
    })
    .catch(() => {})
}

let current = detect()

function apply(lang) {
  current = lang
  document.documentElement.lang = lang
  listeners.forEach(l => l())
}
apply(current)

// The nav toggle. On a store page it only affects that store.
export function setLang(lang) {
  if (!LANGS.includes(lang)) return
  localStorage.setItem(scope ? storeKey(scope) : STORAGE_KEY, lang)
  apply(lang)
}

// Called when a public store page has loaded its store.
export function enterStore(slug, storeDefault) {
  scope = slug
  storeDefaultNow = storeDefault
  reapply()
}

// Called when leaving the store page.
export function leaveStore() {
  scope = null
  storeDefaultNow = null
  reapply()
}

const subscribe = cb => { listeners.add(cb); return () => listeners.delete(cb) }

// Returns { lang, locale, t(key, vars), fmtDate(iso), fmtPrice(n), weekStart, weekdays }
export function useI18n() {
  const lang = useSyncExternalStore(subscribe, () => current)
  const locale = LOCALES[lang]
  const t = (key, vars = {}) => {
    const v = dict[lang][key]
    if (typeof v !== 'string') return v
    return v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
  }
  // iso: 'YYYY-MM-DD' -> localized, parsed as a local date (no timezone shift)
  const fmtDate = iso => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  }
  // Italian weeks start on Monday, English on Sunday
  const weekStart = lang === 'it' ? 1 : 0
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + ((i + weekStart) % 7)).toLocaleDateString(locale, { weekday: 'short' }))
  const fmtPrice = (n, currency) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'EUR' }).format(n)
  const currencySymbol = currency =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'EUR' })
      .formatToParts(0).find(p => p.type === 'currency')?.value ?? ''
  return { lang, locale, t, fmtDate, fmtPrice, currencySymbol, weekStart, weekdays }
}
