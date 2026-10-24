// @ts-nocheck
/* eslint-disable */
// The prototype's logic class ("Mula Admin v3", docs/dashboard-admin-prototype), brought over verbatim and
// driven from AdminProvider. Edits from the original are marked `// ADMIN:`.
import React from "react";

// Minimal stand-in for the Claude Design runtime's DCLogic (setState + props); the provider wires both.
export class DCLogic {
  state: any = {};
  props: any = {};
  setState(_patch: any, _cb?: () => void) {}
  forceUpdate() {}
}

export class AdminLogic extends DCLogic {
  P = {
    wedding: { type: 'Wedding', host: 'Raden & Cilla', a: 'Raden', amp: '&', b: 'Cilla', greet: 'The wedding of', line: 'Dari mula, menuju selamanya.', tag: 'Your celebration is taking shape.', close: 'Sebab setiap selamanya, pernah bermula.', date: 'Saturday, 12 December 2026', dshort: '12 · 12 · 2026', day: '12', mon: 'Dec', city: 'Jakarta', days: 42, ready: 82, msd: ['20 Oct', '31 Oct', '14 Nov', '25 Nov', '5 Dec', '12 Dec', 'After'],
      events: [['Holy Matrimony', '10:00', '11:30', 'Gereja Santa Maria', 'Jl. Merdeka 21, Jakarta Pusat', 'Formal, soft tones', 'Everyone', 'An intimate ceremony with family and close friends.'], ['Reception', '18:00', '22:00', 'The Ballroom, Hotel Aurora', 'Jl. Jend. Sudirman 5, Jakarta', 'Black tie optional', 'Everyone', 'Dinner, toasts and the first dance.'], ['After Party', '22:30', '01:00', 'Rooftop Lounge, Level 30', 'Hotel Aurora, Jakarta', 'Cocktail', 'Invite only', 'For those who want the night to continue.']] },
    birthday: { type: '17th Birthday', host: 'Nadia turns 17', a: 'Nadia', amp: '', b: 'turns seventeen', greet: 'Celebrating', line: 'A new age. A new chapter.', tag: 'Seventeen is almost here.', close: 'Dari sini, cerita baru bermula.', date: 'Saturday, 21 November 2026', dshort: '21 · 11 · 2026', day: '21', mon: 'Nov', city: 'Bandung', days: 21, ready: 68, msd: ['15 Oct', '31 Oct', '7 Nov', '12 Nov', '17 Nov', '21 Nov', 'After'],
      events: [['Family Dinner', '17:00', '19:00', 'Rumah Makan Sunda Asri', 'Jl. Dago 120, Bandung', 'Smart casual', 'Family only', 'Dinner with the people who watched her grow.'], ['Sweet Seventeen', '19:30', '23:00', 'The Glasshouse', 'Jl. Riau 8, Bandung', 'Midnight blue', 'Everyone', 'Music, cake and the candle moment.']] },
    launch: { type: 'Product launch', host: 'Aurora Series One', a: 'Aurora', amp: '', b: 'Series One', greet: 'You are invited to the launch of', line: 'From here, a new story unfolds.', tag: 'Launch night is coming together.', close: 'Sebuah mula untuk cerita berikutnya.', date: 'Thursday, 3 December 2026', dshort: '03 · 12 · 2026', day: '03', mon: 'Dec', city: 'Jakarta', days: 33, ready: 74, msd: ['18 Oct', '31 Oct', '16 Nov', '24 Nov', '30 Nov', '3 Dec', 'After'],
      events: [['Press Preview', '15:00', '17:00', 'Aurora Flagship, Senopati', 'Jl. Senopati 44, Jakarta', 'Business', 'Invite only', 'Hands-on time for press and partners.'], ['Launch Night', '19:00', '22:00', 'Gudang Sarinah', 'Jl. Pancoran Timur 2, Jakarta', 'All black', 'Everyone', 'The reveal, live music and first orders.']] }
  };
  I = {
    arch: 'M4 17V10a6 6 0 0 1 12 0v7', guests: 'M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 17c.5-3 2.6-5 5.5-5s5 2 5.5 5M13 3.3a3 3 0 0 1 0 5.4M15 12c1.6.6 2.6 2.4 3 5', cal: 'M3.5 5.5h13v11h-13zM3.5 9h13M7 3v4M13 3v4', check: 'M4 10.5l3.5 3.5L16 6',
    inv: 'M3 5.5h14v10H3zM3 6l7 5 7-5', design: 'M10 3a7 7 0 1 0 0 14c1 0 1.5-.7 1.5-1.5 0-1.2-1-1.3-1-2.5 0-.8.7-1.5 1.5-1.5H14a3 3 0 0 0 3-3C17 5.6 13.9 3 10 3ZM6.5 10.5h.01M8 6.8h.01M12 6.8h.01', gift: 'M3.5 8h13v3h-13zM4.5 11h11v6h-11zM10 8v9M10 8C8 4 5 5 6.5 7.5M10 8c2-4 5-3 3.5-.5',
    spark: 'M10 2.5v3M10 14.5v3M2.5 10h3M14.5 10h3M5 5l2 2M13 13l2 2M15 5l-2 2M7 13l-2 2', qr: 'M3.5 3.5h5v5h-5zM11.5 3.5h5v5h-5zM3.5 11.5h5v5h-5zM12 12h1.5v1.5H12zM15 15h1.5v1.5H15zM15 12h1.5M12 15.5v1', live: 'M3 6h10v8H3zM13 9l4-2.5v7L13 11', heart: 'M10 16.5S3 12.5 3 7.8A3.3 3.3 0 0 1 10 6a3.3 3.3 0 0 1 7 1.8c0 4.7-7 8.7-7 8.7Z',
    team: 'M6.5 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM13.5 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 16c.4-2.6 2.1-4.5 4.5-4.5S10.6 13.4 11 16M9.5 12.4c.9-.6 2.2-.9 4-.9 2.4 0 4.1 1.9 4.5 4.5', plus: 'M10 4v12M4 10h12', card: 'M2.5 5.5h15v9h-15zM2.5 8.5h15M5.5 12h3',
    guide: 'M4 4.5c2.5-1 4.5-.5 6 1 1.5-1.5 3.5-2 6-1v11c-2.5-1-4.5-.5-6 1-1.5-1.5-3.5-2-6-1zM10 5.5v11', user: 'M10 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 17c.6-3 3-4.5 6-4.5s5.4 1.5 6 4.5', sun: 'M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4',
    moon: 'M16 12.5A6.5 6.5 0 0 1 7.5 4 6.5 6.5 0 1 0 16 12.5Z', search: 'M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM17 17l-3.5-3.5', bell: 'M5 13.5V9a5 5 0 0 1 10 0v4.5l1.5 1.5h-13ZM8.5 17.5h3', more: 'M4 6h12M4 10h12M4 14h12', ai: 'M10 2.5c.6 3.8 3.7 6.9 7.5 7.5-3.8.6-6.9 3.7-7.5 7.5-.6-3.8-3.7-6.9-7.5-7.5 3.8-.6 6.9-3.7 7.5-7.5Z', print: 'M5.5 7.5V3h9v4.5M5.5 14H3.5V8h13v6h-2M5.5 11.5h9V17h-9z', pkg: 'M10 2.5l7 3.5v8l-7 3.5-7-3.5V6zM3 6l7 3.5L17 6M10 9.5v8', globe: 'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM2.5 10h15M10 2.5c2 2.2 3 4.7 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.7-3-7.5s1-5.3 3-7.5Z'
  };
  pals = [{ n: 'Linen', bg: '#EFE8DC', fg: '#2A2724', ac: '#A69A89' }, { n: 'Nightfall', bg: '#1D1B19', fg: '#EDE6D8', ac: '#B8AB97' }, { n: 'Sage', bg: '#E2E5D9', fg: '#2F3A2E', ac: '#7D8C72' }, { n: 'Clay', bg: '#ECDDD1', fg: '#3B2A22', ac: '#A56C50' }, { n: 'Mist', bg: '#DFE2E5', fg: '#23282D', ac: '#7F8C98' }, { n: 'Ink', bg: '#232528', fg: '#F2F0EA', ac: '#C9C2B4' }];
  groups = [
    ['Prepare', [['home', 'Overview', 'arch'], ['guests', 'Guests', 'guests'], ['events', 'Schedule', 'cal'], ['todo', 'Tasks', 'check']]],
    ['Invitations', [['invitations', 'Invitations', 'inv'], ['design', 'Design', 'design'], ['gift', 'Gifts', 'gift'], ['print', 'Print', 'print']]],
    ['Event day', [['eventday', 'Event day', 'spark'], ['checkin', 'Check-in', 'qr'], ['live', 'Live stream', 'live'], ['memories', 'Memories', 'heart']]],
    ['Workspace', [['team', 'Team', 'team'], ['packages', 'Packages', 'pkg'], ['addons', 'Add-ons', 'plus'], ['billing', 'Purchases', 'card']]]];
  T = {
    en: { g: { Prepare: 'Prepare', Invitations: 'Invitations', 'Event day': 'Event day', Workspace: 'Workspace' }, t: { home: 'Overview', guests: 'Guests', events: 'Schedule', todo: 'Tasks', invitations: 'Invitations', invitation: 'Invitation editor', design: 'Design', gift: 'Gifts', print: 'Print', eventday: 'Event day', checkin: 'Check-in', live: 'Live stream', memories: 'Memories', team: 'Team', packages: 'Packages', addons: 'Add-ons', billing: 'Purchases', cart: 'Checkout', guide: 'Guide', account: 'Settings', terms: 'Terms & Conditions', system: 'Design language' }, today: 'Saturday, 31 October', gm: 'Good morning', ga: 'Good afternoon', ge: 'Good evening', days: 'days to go', ready: 'ready', prev: 'Preview invitation', cont: 'Continue setup', readiness: 'Event readiness', notes: 'Mula notes', search: 'Search guests, tasks…', more: 'More', out: 'Log out', light: 'Light', dark: 'Dark', auto: 'Auto' },
    id: { g: { Prepare: 'Persiapan', Invitations: 'Undangan', 'Event day': 'Hari acara', Workspace: 'Ruang kerja' }, t: { home: 'Ikhtisar', guests: 'Tamu', events: 'Jadwal', todo: 'Tugas', invitations: 'Undangan', invitation: 'Editor undangan', design: 'Desain', gift: 'Hadiah', print: 'Cetak', eventday: 'Hari acara', checkin: 'Check-in', live: 'Siaran langsung', memories: 'Kenangan', team: 'Tim', packages: 'Paket', addons: 'Tambahan', billing: 'Pembelian', cart: 'Pembayaran', guide: 'Panduan', account: 'Pengaturan', terms: 'Syarat & Ketentuan', system: 'Bahasa desain' }, today: 'Sabtu, 31 Oktober', gm: 'Selamat pagi', ga: 'Selamat siang', ge: 'Selamat malam', days: 'hari lagi', ready: 'siap', prev: 'Pratinjau undangan', cont: 'Lanjutkan persiapan', readiness: 'Kesiapan acara', notes: 'Catatan Mula', search: 'Cari tamu, tugas…', more: 'Lainnya', out: 'Keluar', light: 'Terang', dark: 'Gelap', auto: 'Otomatis' },
    ms: { g: { Prepare: 'Persediaan', Invitations: 'Jemputan', 'Event day': 'Hari majlis', Workspace: 'Ruang kerja' }, t: { home: 'Gambaran', guests: 'Tetamu', events: 'Jadual', todo: 'Tugasan', invitations: 'Jemputan', invitation: 'Editor jemputan', design: 'Reka bentuk', gift: 'Hadiah', print: 'Cetak', eventday: 'Hari majlis', checkin: 'Daftar masuk', live: 'Siaran langsung', memories: 'Kenangan', team: 'Pasukan', packages: 'Pakej', addons: 'Tambahan', billing: 'Pembelian', cart: 'Pembayaran', guide: 'Panduan', account: 'Tetapan', terms: 'Terma & Syarat', system: 'Bahasa reka bentuk' }, today: 'Sabtu, 31 Oktober', gm: 'Selamat pagi', ga: 'Selamat petang', ge: 'Selamat malam', days: 'hari lagi', ready: 'sedia', prev: 'Pratonton jemputan', cont: 'Teruskan persediaan', readiness: 'Kesediaan majlis', notes: 'Nota Mula', search: 'Cari tetamu, tugasan…', more: 'Lagi', out: 'Log keluar', light: 'Cerah', dark: 'Gelap', auto: 'Auto' }
  };
  LC = {
    wedding: { en: { greet: 'The wedding of', line: 'From a meeting, into meaning.', date: 'Saturday, 12 December 2026', close: 'Because every forever had a beginning.', tag: 'Your celebration is taking shape.' }, id: { greet: 'Pernikahan', line: 'Dari mula, menuju selamanya.', date: 'Sabtu, 12 Desember 2026', close: 'Sebab setiap selamanya, pernah bermula.', tag: 'Perayaanmu mulai terbentuk.' }, ms: { greet: 'Majlis Perkahwinan', line: 'Dari permulaan, menuju selamanya.', date: 'Sabtu, 12 Disember 2026', close: 'Kerana setiap selamanya, pernah bermula.', tag: 'Majlis anda mula terbentuk.' } },
    birthday: { en: { greet: 'Celebrating', line: 'A new age. A new chapter.', date: 'Saturday, 21 November 2026', close: 'From here, a new story unfolds.', tag: 'Seventeen is almost here.' }, id: { greet: 'Merayakan', line: 'Usia baru. Babak baru.', date: 'Sabtu, 21 November 2026', close: 'Dari sini, cerita baru bermula.', tag: 'Usia tujuh belas sudah dekat.' }, ms: { greet: 'Meraikan', line: 'Usia baharu. Bab baharu.', date: 'Sabtu, 21 November 2026', close: 'Dari sini, kisah baharu bermula.', tag: 'Tujuh belas hampir tiba.' } },
    launch: { en: { greet: 'You are invited to the launch of', line: 'From here, a new story unfolds.', date: 'Thursday, 3 December 2026', close: 'A beginning for what comes next.', tag: 'Launch night is coming together.' }, id: { greet: 'Anda diundang ke peluncuran', line: 'Dari sini, cerita baru bermula.', date: 'Kamis, 3 Desember 2026', close: 'Sebuah mula untuk cerita berikutnya.', tag: 'Malam peluncuran mulai terbentuk.' }, ms: { greet: 'Anda dijemput ke pelancaran', line: 'Dari sini, kisah baharu bermula.', date: 'Khamis, 3 Disember 2026', close: 'Satu permulaan untuk kisah seterusnya.', tag: 'Malam pelancaran semakin hampir.' } }
  };
  IC = {
    en: { open: 'Open invitation', dear: 'Dear', guest: 'guest', save: 'Save the date', days: 'days from today', join: 'Will you join us?', yes: 'I’ll be there', no: 'I can’t make it', gift: 'A gift, if you wish', wishes: 'Wishes', msg: 'With gratitude, we invite you to share the beginning of something we have waited a long time for.', cal: 'Add to calendar', map: 'Open map', seeyou: 'See you there.', missed: 'You’ll be missed.', reply: 'Kindly reply by 25 November', scan: 'Scan to reply' },
    id: { open: 'Buka undangan', dear: 'Kepada Yth.', guest: 'Tamu Undangan', save: 'Simpan tanggalnya', days: 'hari lagi', join: 'Apakah kamu akan hadir?', yes: 'Saya akan hadir', no: 'Maaf, tidak bisa hadir', gift: 'Tanda kasih', wishes: 'Ucapan & doa', msg: 'Dengan penuh syukur, kami mengundang Anda untuk menyaksikan awal dari sesuatu yang telah lama kami nantikan.', cal: 'Tambah ke kalender', map: 'Buka peta', seeyou: 'Sampai jumpa di sana.', missed: 'Kami akan merindukanmu.', reply: 'Mohon konfirmasi sebelum 25 November', scan: 'Pindai untuk konfirmasi' },
    ms: { open: 'Buka jemputan', dear: 'Kepada', guest: 'Tetamu', save: 'Tandakan tarikh', days: 'hari lagi', join: 'Adakah anda akan hadir?', yes: 'Saya akan hadir', no: 'Maaf, tidak dapat hadir', gift: 'Tanda kasih', wishes: 'Ucapan & doa', msg: 'Dengan penuh kesyukuran, kami menjemput anda untuk bersama meraikan permulaan yang telah lama kami nantikan.', cal: 'Tambah ke kalendar', map: 'Buka peta', seeyou: 'Jumpa di sana.', missed: 'Kami akan merindui anda.', reply: 'Sila sahkan kehadiran sebelum 25 November', scan: 'Imbas untuk sahkan' }
  };
  fmts = { A5: { w: 148, h: 210 }, A6: { w: 105, h: 148 }, Postcard: { w: 148, h: 100 }, Square: { w: 140, h: 140 } };
  titles = { home: 'Overview', guests: 'Guests', events: 'Schedule', todo: 'Tasks', invitations: 'Invitations', invitation: 'Invitation editor', design: 'Design', gift: 'Gifts', print: 'Print', eventday: 'Event day', checkin: 'Check-in', live: 'Live stream', memories: 'Memories', team: 'Team', packages: 'Packages', addons: 'Add-ons', cart: 'Checkout', billing: 'Purchases', guide: 'Guide', account: 'Settings', terms: 'Terms & Conditions', system: 'Design language' };
  pool = ['Andi Saputra', 'Citra Dewi', 'Bayu Nugroho', 'Intan Permata', 'Galih Pratama', 'Wulan Sari', 'Yoga Aditya', 'Nina Rahma', 'Arief Hidayat', 'Sinta Maharani', 'Dodi Kurnia', 'Mega Lestari'];
  state = {
    lang: 'en', pkg: 'onetime', curInv: 1, plang: 'id', itx: { en: {}, id: {}, ms: {} }, newInv: false, ni: { name: '', aud: 'Friends', lang: 'en' },
    invs: [{ id: 1, name: 'Family & friends', aud: 'Family, Friends', audN: 168, lang: 'id', design: 'Linen Vow', pal: 0, path: '', st: 'Published', views: 1204, replies: 152, tr: { id: 100, en: 100, ms: 40 } }],
    dmode: 'templates', cust: { tab: 'Layout', layout: 'Centered', frame: 'Arch', motion: 'Arch reveal', scale: 'Balanced', secs: [['Cover', 1], ['Opening', 1], ['Moments', 1], ['Gallery', 1], ['RSVP', 1], ['Gift', 1], ['Wishes', 1], ['Closing', 1]] }, replay: 0,
    giftTab: 'ways', regOpen: false, nr: { name: '', desc: '', price: '', qty: 1, url: '' },
    reg: [{ id: 1, name: 'Cast-iron Dutch oven', desc: 'For long Sunday dinners with everyone we love.', price: 4200000, qty: 1, got: 0, url: 'https://www.tokopedia.com/' }, { id: 2, name: 'Linen bedding set', desc: 'Queen size, in oat. Two sets so one is always fresh.', price: 1850000, qty: 2, got: 1, url: 'https://shopee.co.id/' }, { id: 3, name: 'A dinner on our honeymoon', desc: 'Contribute one evening in Ubud. We will send you a photo.', price: 500000, qty: 6, got: 4, url: '' }, { id: 4, name: 'Espresso machine', desc: 'Our mornings, slightly better.', price: 3600000, qty: 1, got: 1, url: 'https://shop.tiktok.com/' }, { id: 5, name: 'Dinnerware for twelve', desc: 'Stoneware plates and bowls for hosting family.', price: 2400000, qty: 1, got: 0, url: 'https://shopee.co.id/' }],
    ai: false, aiTask: 'copy', aiTone: 'Warm', aiBusy: false, aiShown: false, aiQ: '', celebKind: 'pub',
    ptab: 'cards', pfmt: 'A5', pside: 'Front', pInv: 1, lscope: 'all', printMode: 'invite',
    auth: false, authMode: 'login', pw: '', setSec: 'profile', flip: 0,
    page: 'home', theme: 'light', evt: 'wedding', events: null, seen: { home: 1 }, loading: false,
    sec: 'cover', invGreet: null, invLine: null, dq: '', dcat: 'All', design: 'Linen Vow', pal: 0, font: 'Editorial',
    gq: '', seg: 'all', gs: 'name', sel: {}, guestId: 1, guestOpen: false,
    gl: [['Sarah Wijaya', 'Friends', 'Attending', 3, 2, 'A1', '+62 811 2233 445'], ['Budi Santoso', 'Family', 'Attending', 3, 4, 'F1', '+62 812 8891 002'], ['Maya Anindita', 'Colleagues', 'Pending', 2, 1, '—', '+62 813 4400 128'], ['Reza Pratama', 'Friends', 'Not attending', 3, 1, '—', '+62 857 1200 933'], ['Dewi Lestari', 'Family', 'Attending', 3, 3, 'F2', '+62 815 6677 210'], ['Kevin Halim', 'VIP', 'Invited', 1, 2, 'V1', '+62 819 5501 774'], ['Ayu Puspita', 'Colleagues', 'Invited', 1, 2, '—', '—'], ['Hendra Gunawan', 'Family', 'Attending', 3, 2, 'F1', '+62 878 4410 065'], ['Lina Marlina', 'Friends', 'Pending', 2, 1, '—', '+62 852 9018 342'], ['Tommy Wijaya', 'VIP', 'Attending', 3, 2, 'V1', '+62 811 9087 611'], ['Rina Kusuma', 'Family', 'Attending', 3, 2, 'F2', '+62 813 7781 220'], ['Fikri Ramadhan', 'Colleagues', 'Pending', 2, 2, '—', '+62 821 4410 993']].map((r, i) => ({ id: i + 1, name: r[0], group: r[1], st: r[2], j: r[3], party: r[4], table: r[5], phone: r[6] })),
    gifts: [{ id: 1, type: 'Bank account', title: 'BCA · Raden Aditya', detail: 'Account number with copy button', copy: '8830 1122 45' }, { id: 2, type: 'Digital wallet', title: 'GoPay · Cilla Maharani', detail: 'Phone-linked wallet', copy: '0812 3456 7890' }, { id: 3, type: 'Physical gift', title: 'Send a gift to our home', detail: 'Address shown on the invitation', copy: 'Jl. Melati 8, Jakarta Selatan' }],
    addonsL: [{ id: 1, cat: 'Design', name: 'Premium themes', desc: 'Ten more editorial designs, for every kind of celebration.', p: 149000, st: 'Available' }, { id: 2, cat: 'Gallery', name: 'Gallery +24', desc: 'Room for more photos and one short film.', p: 79000, st: 'Available' }, { id: 3, cat: 'Web', name: 'Custom domain', desc: 'radencilla.com instead of a mula link.', p: 199000, st: 'Available' }, { id: 4, cat: 'Experience', name: 'Live streaming', desc: 'Let far-away family join the ceremony as it happens.', p: 129000, st: 'Purchased' }, { id: 5, cat: 'Guests', name: 'RSVP essentials', desc: 'Replies, plus-ones, reminders and a deadline.', p: 0, st: 'Included' }, { id: 6, cat: 'Event day', name: 'QR check-in', desc: 'Personal codes and usher scanning at the entrance.', p: 99000, st: 'Available' }, { id: 7, cat: 'Support', name: 'Personal concierge', desc: 'A real person helps you prepare, up to the day itself.', p: 249000, st: 'Available' }, { id: 8, cat: 'Sections', name: 'More moments', desc: 'Add extra days, dinners and gatherings to one invitation.', p: 59000, st: 'Available' }, { id: 9, cat: 'Guests', name: 'Guest list', desc: 'Up to 300 guests with groups, tables and notes.', p: 0, st: 'Included' }, { id: 100, cat: 'Package', name: 'Advanced Event upgrade', desc: 'The difference from your One-Time Event package.', p: 450000, st: 'Package' }],
    cartL: [], promo: '', disc: 0,
    txL: [{ id: 'TX-1042', date: '28 Sep 2026', desc: 'Live streaming', method: 'QRIS', amt: 129000, st: 'Paid' }, { id: 'TX-1038', date: '21 Sep 2026', desc: 'One-Time Event package', method: 'BCA transfer', amt: 349000, st: 'Paid' }, { id: 'TX-1031', date: '19 Sep 2026', desc: 'Gallery +24', method: 'Credit card', amt: 79000, st: 'Failed' }, { id: 'TX-1027', date: '12 Sep 2026', desc: 'Premium themes', method: 'GoPay', amt: 149000, st: 'Pending' }, { id: 'TX-1019', date: '02 Sep 2026', desc: 'Custom domain', method: 'QRIS', amt: 199000, st: 'Refunded' }],
    tq: '', tf: 'All', tx: null, txOpen: false,
    todosL: [['Choose design', 'Design', '1 Oct', 'Normal', 1], ['Complete invitation details', 'Invitation', '5 Oct', 'High', 1], ['Add event information', 'Schedule', '8 Oct', 'Normal', 1], ['Add guest list', 'Guests', '12 Oct', 'High', 1], ['Configure RSVP', 'Guests', '15 Oct', 'Normal', 1], ['Send invitations', 'Guests', '20 Oct', 'High', 1], ['Set up live stream', 'Event day', '25 Oct', 'Normal', 1], ['Upload gallery', 'Invitation', '3 Nov', 'High', 0, 'Soon'], ['Add gift information', 'Gift', '6 Nov', 'Normal', 0, 'Soon'], ['Assign tables', 'Guests', '20 Nov', 'Normal', 0, 'Later'], ['Brief your ushers', 'Event day', '5 Dec', 'Normal', 0, 'Later'], ['Print entrance QR', 'Event day', '8 Dec', 'Low', 0, 'Later']].map((t, i) => ({ id: i + 1, title: t[0], cat: t[1], due: t[2], pri: t[3], done: !!t[4], ph: t[5] || 'Soon' })),
    nt: '', np: 'Normal', tc: 'All', recent: ['Set up live stream', 'Send invitations', 'Configure RSVP'],
    ck: 'qr', qr: 'invite', qrSeed: 3, live: 'Scheduled', hq: '', hc: 'All', ha: 1,
    perms: { scan: true, lookup: true, seat: true, offline: false }, checked: 112, uq: '', sim: false, bars: [6, 14, 27, 33, 22, 10],
    feed: [{ n: 'Tommy Wijaya', t: 'Table V1', w: '18:42' }, { n: 'Dewi Lestari', t: 'Table F2', w: '18:40' }, { n: 'Hendra Gunawan', t: 'Table F1', w: '18:39' }, { n: 'Sarah Wijaya', t: 'Table A1', w: '18:37' }],
    notifL: [{ t: 'Sarah Wijaya confirmed attendance', w: '2 min ago', u: true }, { t: 'Cilla approved the invitation design', w: '2 hours ago', u: true }, { t: 'Your invitation was opened 14 times today', w: '5 hours ago', u: true }, { t: 'Payment completed for Live streaming', w: '28 Sep', u: false }, { t: 'Invitation published', w: '20 Oct', u: false }],
    notifOpen: false, searchOpen: false, sq: '', modalGuest: false, ng: { name: '', phone: '', group: 'Friends' }, moreOpen: false,
    previewOpen: false, dev: 'Mobile', persp: 'Guest', pvg: 0, opened: false, rsvp: '',
    obOpen: false, ob: 0, obType: 'Wedding', obNames: '', obDate: '', obVenue: '', obG: '', obGuests: [],
    toast: '', celebrate: false, dismissed: {},
    team: [['Aldo Prasetyo', 'Owner', 'aldo@example.com', 1]].map((m, i) => ({ id: i + 1, n: m[0], r: m[1], e: m[2], on: !!m[3] })), invite: '' // ADMIN: owner only; the API has no team yet
  };
  componentDidMount() {
    let th, pg; try { th = localStorage.getItem('mula-theme'); pg = localStorage.getItem('mula2-page'); } catch (e) {}
    if (!th) th = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.setState({ theme: th, evt: this.evtKey() }); // ADMIN: page comes from the route, not storage
    this.applyRoot(th);
    this._key = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.setState({ searchOpen: true }); } if (e.key === 'Escape') this.closeAll(); };
    window.addEventListener('keydown', this._key);
    try { const lg = localStorage.getItem('mula-lang'); if (lg && this.T[lg]) this.setState({ lang: lg }); } catch (e) {}
    this._mq = window.matchMedia('(prefers-color-scheme: dark)'); this._mqf = () => { if (this.state.theme === 'system') this.applyRoot('system'); }; if (this._mq.addEventListener) this._mq.addEventListener('change', this._mqf);
    setTimeout(() => this.countUp(), 60);
  }
  componentWillUnmount() { window.removeEventListener('keydown', this._key); clearInterval(this._sim); clearTimeout(this._t); }
  applyRoot(th) { const r = document.documentElement; if (th === 'system') th = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; r.dataset.theme = th; r.dataset.motion = this.props.motion === 'Calm' ? 'calm' : 'full'; }
  evtKey() { return { '17th Birthday': 'birthday', 'Product launch': 'launch' }[this.props.eventType] || 'wedding'; }
  fresh() { return this.props.dataState === 'Brand new'; }
  countUp() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm') return;
    document.querySelectorAll('[data-count]').forEach(el => {
      const tn = el.firstChild; if (!tn || tn.nodeType !== 3 || el.dataset.run === tn.nodeValue) return;
      const end = parseFloat(el.dataset.count); if (isNaN(end) || end <= 0) return;
      const fin = tn.nodeValue; el.dataset.run = fin; const t0 = performance.now();
      const step = t => { const k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 4); tn.nodeValue = k < 1 ? String(Math.round(end * e)) : fin; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  say = m => { this.setState({ toast: m }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: '' }), 2800); };
  idr = n => 'Rp ' + n.toLocaleString('id-ID');
  d = e => e.currentTarget.dataset;
  cls = s => ({ Attending: 'b-ok', Pending: 'b-wt', 'Not attending': 'b-no', Invited: 'b-in', Paid: 'b-ok', Failed: 'b-no', Refunded: 'b-mu' }[s] || 'b-mu');
  avc = n => ['#A69A89', '#8C9886', '#A38C84', '#8A96A0', '#A8936F'][[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % 5];
  ini = n => n.split(' ').map(w => w[0]).slice(0, 2).join('');
  evs() { return this.state.events || this.P[this.state.evt].events.map((e, i) => ({ id: i + 1, name: e[0], s: e[1], en: e[2], venue: e[3], addr: e[4], dress: e[5], vis: e[6], desc: e[7], open: false })); }
  setEvs(a) { this.setState({ events: a }); }
  // ADMIN: pages are routes; `route` (set by AdminProvider) maps a prototype page id to its URL.
  nav(pg) {
    const first = !this.state.seen[pg] && ['guests', 'design', 'billing', 'memories', 'eventday'].includes(pg);
    this.setState({ moreOpen: false, searchOpen: false, notifOpen: false, guestOpen: false, langMenu: false, profMenu: false, loading: first, seen: { ...this.state.seen, [pg]: 1 } });
    if (first) { clearTimeout(this._l); this._l = setTimeout(() => { this.setState({ loading: false }); setTimeout(() => this.countUp(), 80); }, 560); } else setTimeout(() => this.countUp(), 80);
    if (this.route) this.route(pg);
    window.scrollTo({ top: 0 });
  }
  go = e => this.nav(e.currentTarget.dataset.p);
  closeAll = () => this.setState({ moreOpen: false, notifOpen: false, searchOpen: false, modalGuest: false, guestOpen: false, txOpen: false, previewOpen: false, obOpen: false, celebrate: false, newInv: false, regOpen: false, ai: false, auth: false });
  tiltMove = e => { const el = e.currentTarget, r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, s = el.style; s.setProperty('--ry', ((x - .5) * 16).toFixed(2) + 'deg'); s.setProperty('--rx', ((.5 - y) * 11).toFixed(2) + 'deg'); s.setProperty('--mx', (x * 100).toFixed(1) + '%'); s.setProperty('--my', (y * 100).toFixed(1) + '%'); s.setProperty('--px', ((x - .5) * 24).toFixed(1) + 'px'); s.setProperty('--py', ((y - .5) * 18).toFixed(1) + 'px'); };
  tiltOut = e => { const s = e.currentTarget.style; ['--rx', '--ry', '--px', '--py'].forEach(k => s.setProperty(k, '0')); };
  publish = () => { this.setState({ celebrate: true, obOpen: false, celebKind: 'pub' }); clearTimeout(this._c); this._c = setTimeout(() => this.setState({ celebrate: false }), 3400); };
  toggleSim = () => {
    if (this.state.sim) { clearInterval(this._sim); this.setState({ sim: false }); return; }
    this.setState({ sim: true });
    this._sim = setInterval(() => {
      const S = this.state; if (S.checked >= (this.expected ?? 180)) { clearInterval(this._sim); this.setState({ sim: false }); this.say('Everyone expected has arrived.'); return; }
      const n = this.pool[Math.floor(Math.random() * this.pool.length)], c = S.checked + 1, m = 43 + Math.floor((c - (this.base0 ?? 112)) / 2);
      this.setState({ checked: Math.min(this.expected ?? 180, c), feed: [{ n, t: 'Table ' + ['A', 'B', 'F', 'V'][c % 4] + (1 + c % 6), w: (18 + Math.floor(m / 60)) + ':' + String(m % 60).padStart(2, '0') }, ...S.feed].slice(0, 6), bars: S.bars.map((b, i) => i === S.bars.length - 1 ? b + 1 : b) });
    }, 1200);
  };
  qrPath(seed) {
    let s = seed * 9301 + 49297, out = '';
    for (let y = 0; y < 29; y++) for (let x = 0; x < 29; x++) {
      s = (s * 9301 + 49297) % 233280; let on = s / 233280 > .52;
      const fx = x < 8 ? x : x > 20 ? x - 21 : -1, fy = y < 8 ? y : y > 20 ? y - 21 : -1;
      if (fx >= 0 && fy >= 0 && !(x > 20 && y > 20)) { on = (fx <= 6 && fy <= 6) && (fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4)); }
      if (on) out += 'M' + x + ' ' + y + 'h1v1h-1z';
    }
    return out;
  }
  addTask() { const S = this.state; if (!S.nt.trim()) return; this.setState({ todosL: [...S.todosL, { id: Date.now(), title: S.nt, cat: S.tc === 'All' ? 'Invitation' : S.tc, due: 'Soon', pri: S.np, done: false, ph: 'Soon' }], nt: '' }); this.say('Task added.'); }
  mv(arr, id, dir, set) { const a = arr.slice(), i = a.findIndex(x => x.id == id), j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set(a); }
  search(q) {
    const S = this.state; q = q.toLowerCase().trim();
    if (!q) return [{ t: 'Upload gallery', k: 'Task', go: 'todo' }, { t: 'Sarah Wijaya', k: 'Guest', go: 'guests' }, { t: 'Reception', k: 'Schedule', go: 'events' }, { t: 'Event day rehearsal', k: 'Page', go: 'eventday' }];
    const r = [];
    S.gl.forEach(g => g.name.toLowerCase().includes(q) && r.push({ t: g.name, k: 'Guest', go: 'guests' }));
    this.evs().forEach(e => e.name.toLowerCase().includes(q) && r.push({ t: e.name, k: 'Schedule', go: 'events' }));
    S.todosL.forEach(t => t.title.toLowerCase().includes(q) && r.push({ t: t.title, k: 'Task', go: 'todo' }));
    S.txL.forEach(t => (t.desc + t.id).toLowerCase().includes(q) && r.push({ t: t.desc + ' · ' + t.id, k: 'Payment', go: 'billing' }));
    Object.entries(this.titles).forEach(([k, v]) => v.toLowerCase().includes(q) && r.push({ t: v, k: 'Page', go: k }));
    ['Publish your first invitation', 'Import guests from a spreadsheet', 'Schedule a live stream', 'Check guests in with QR'].forEach(t => t.toLowerCase().includes(q) && r.push({ t, k: 'Guide', go: 'guide' }));
    return r.slice(0, 8);
  }
  obStep() {
    const i = this.state.ob;
    const st = [['Let’s begin', 'First, tell us what you’re celebrating.', 'Every milestone marks the start of something. Choose the one closest to yours.', 'choice'], ['Hosts', 'Whose celebration is this?', 'These names appear on the cover. You can change them anytime.', 'names'], ['Date', 'When does it begin?', 'Pick the main day. You can add more moments later.', 'date'], ['Place', 'Where will everyone gather?', 'A venue name is enough for now.', 'venue'], ['Design', 'Choose a look you love.', 'Your palette carries through every page of the invitation.', 'pal'], ['Guests', 'Who would you love to see there?', 'Add a few names now. Import the rest whenever you like.', 'guests'], ['Review', 'Here is your invitation so far.', 'Everything stays editable after you publish.', 'review'], ['Publish', 'Ready when you are.', 'Publishing creates your link. Guests only see it once you share it.', 'done']][i];
    const o = { n: i + 1, kick: st[0], h: st[1], p: st[2], cta: i === 7 ? 'Publish invitation' : i === 6 ? 'Looks right' : 'Continue' };
    ['choice', 'names', 'date', 'venue', 'pal', 'guests', 'review', 'done'].forEach(k => o[k] = st[3] === k);
    return o;
  }
  renderVals() {
    if (this._lastEvtProp !== this.props.eventType) { const first = this._lastEvtProp === undefined; this._lastEvtProp = this.props.eventType; if (!first) setTimeout(() => this.setState({ evt: this.evtKey(), events: null }), 0); }
    if (this._lastMotion !== this.props.motion) { this._lastMotion = this.props.motion; if (typeof document !== 'undefined') document.documentElement.dataset.motion = this.props.motion === 'Calm' ? 'calm' : 'full'; }
    const S = this.state, fresh = this.fresh(), e0 = this.P[S.evt] || this.P.wedding;
    const ev = { ...e0, greet: S.invGreet ?? e0.greet, line: S.invLine ?? e0.line, ready: fresh ? 12 : e0.ready, amp: !!e0.amp };
    const pal = this.pals[S.pal], fontF = { Editorial: 'var(--serif)', Modern: 'var(--sans)', Classic: "Georgia,'Times New Roman',serif" }[S.font];
    const pv = { bg: pal.bg, fg: pal.fg, ac: pal.ac, font: fontF, photo: `linear-gradient(165deg,color-mix(in oklab,${pal.ac} 45%,${pal.bg}),${pal.ac} 70%,color-mix(in oklab,${pal.ac} 70%,${pal.fg}))` };
    const p = {}; Object.keys(this.titles).forEach(k => p[k] = S.page === k && !S.loading);
    const go = this.go, I = this.I;
    const todoLeft = S.todosL.filter(t => !t.done).length;
    const nav = this.groups.map(g => ({ label: g[0], items: g[1].map(n => ({ id: n[0], label: n[1], ic: I[n[2]], on: (S.page === n[0] || (n[0] === 'addons' && S.page === 'cart')) ? 'on' : '', badge: n[0] === 'todo' && todoLeft ? todoLeft : '' })) }));
    const allNav = this.groups.flatMap(g => g[1]).concat([['guide', 'Guide'], ['account', 'Account'], ['terms', 'Terms'], ['system', 'Design language']]).map(n => ({ id: n[0], label: n[1] }));
    const bnav = [['home', 'Overview', 'arch'], ['guests', 'Guests', 'guests'], ['invitation', 'Invitation', 'inv'], ['todo', 'Tasks', 'check']].map(b => ({ id: b[0], n: b[1], ic: I[b[2]], on: S.page === b[0] ? 'on' : '', fn: go }));
    bnav.push({ id: 'more', n: 'More', ic: I.more, on: S.moreOpen ? 'on' : '', fn: () => this.setState({ moreOpen: true }) });
    const hr = new Date().getHours(), greeting = 'Saturday, 31 October · Good ' + (hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening') + ', Aldo';
    // readiness
    const partsRaw = fresh ? [['Invitation', 20, 'Choose a design to begin', 'invitation'], ['Guests', 0, 'No guests yet', 'guests'], ['Schedule', 0, 'Add your first moment', 'events'], ['Gift', 0, 'Optional', 'gift'], ['Check-in', 0, 'Later', 'checkin']]
      : [['Invitation', 90, 'Gallery is still empty', 'invitation'], ['Guests', 100, 'All 247 invited', 'guests'], ['RSVP', 83, '42 still to reply', 'guests'], ['Schedule', 100, '3 moments set', 'events'], ['Gift', 75, 'Add one more method', 'gift'], ['Seating', 70, '62 seats unassigned', 'guests'], ['Check-in', 60, 'Print entrance QR', 'checkin'], ['Live stream', 100, 'Scheduled for 10:00', 'live'], ['Final checks', 60, 'Opens 7 days before', 'todo']];
    const parts = partsRaw.map(x => ({ n: x[0], v: x[1], w: x[1] + '%', note: x[2], go: x[3] }));
    const t = ev.ready / 100, ang = Math.PI * t, arch = { dash: ev.ready + ' 100', x: (120 - 104 * Math.cos(ang)).toFixed(1), y: (124 - 104 * Math.sin(ang)).toFixed(1) };
    const notesAll = [{ id: 'remind', k: 'Next up', t: '18 guests opened your invitation but haven’t replied yet.', s: 'A gentle reminder on WhatsApp, with their personal link, usually does it.', a: 'Send reminder', cls: 'note lead' }, { id: 'unopened', k: 'Worth a look', t: '24 guests haven’t opened their invitation.', s: 'Most of them are colleagues. Check their numbers, or resend.', a: 'Review these guests', cls: 'note' }, { id: 'attention', k: ev.days + ' days to go', t: 'Three things still need your attention.', s: 'Upload your gallery · Add gift details · Assign 62 seats', a: 'Open tasks', cls: 'note' }];
    const notes = notesAll.filter(n => !S.dismissed[n.id]);
    const journey = [['Sent', 247, '20 Oct', 'done'], ['Opened', 223, '90% of guests', 'done'], ['Replied', 205, '83% of guests', 'done'], ['Reminder', 18, 'Scheduled 14 Nov', 'next'], ['Event day', 180, 'Expected', 'up'], ['Thank you', 180, 'After the event', 'up last']].map(j => ({ n: j[0], v: j[1], s: j[2], cls: 'jn ' + j[3] }));
    const pos = ['0%', '18%', '42%', '60%', '77%', '88%', '100%'], mlab = ['Invitations sent', 'Today', 'Reminder', 'RSVP closes', 'Final details', 'Event day', 'Memories'], mcls = ['done first', 'now', '', '', '', 'big', 'last'];
    const ms = mlab.map((l, i) => ({ l, d: ev.msd[i], x: pos[i], cls: 'ms ' + mcls[i] }));
    const recent = S.recent.slice(0, 4).map(r => ({ t: r }));
    const evList = this.evs();
    const schedule = evList.map(e => ({ ...e, time: e.s + ' – ' + e.en }));
    const activity = [['Cilla Maharani', 'approved the invitation design', '2 h ago'], ['Sarah Wijaya', 'confirmed attendance for 2', '2 min ago'], ['Rina Kusuma', 'added 12 guests to Family', 'Yesterday'], ['Sarah Lim', 'updated the reception run-of-show', 'Yesterday']].map(a => ({ n: a[0], i: this.ini(a[0]), c: this.avc(a[0]), w: a[1], t: a[2] }));
    const online = S.team.filter(m => m.on).map(m => ({ n: m.n, i: this.ini(m.n), c: this.avc(m.n) }));
    // guests
    const segDef = [['all', 'Everyone', 247], ['notopened', 'Haven’t opened', 24], ['noreply', 'Opened, no reply', 18], ['attending', 'Confirmed', 180], ['declined', 'Can’t make it', 25], ['vip', 'VIP', 14], ['plus', 'Bringing someone', 38], ['follow', 'Needs follow-up', 6]];
    const segs = segDef.map(s => ({ id: s[0], l: s[1], v: fresh ? 0 : s[2], on: S.seg === s[0] ? 'sgc on' : 'sgc' }));
    const segActs = { notopened: ['24 guests haven’t opened their invitation.', 'Resend to 24'], noreply: ['18 guests opened it but haven’t replied.', 'Remind 18 guests'], follow: ['6 guests are missing a phone number or need a decision.', 'Review together'], declined: ['25 guests can’t make it. They can still watch the live stream.', 'Send stream link'] };
    const sa = segActs[S.seg];
    const fseg = g => ({ all: 1, notopened: g.st === 'Invited', noreply: g.st === 'Pending', attending: g.st === 'Attending', declined: g.st === 'Not attending', vip: g.group === 'VIP', plus: g.party > 1, follow: g.phone === '—' || g.st === 'Pending' && g.group === 'Colleagues' }[S.seg]);
    const ord = { Attending: 0, Pending: 1, Invited: 2, 'Not attending': 3 };
    let gl = fresh ? [] : S.gl.filter(g => fseg(g) && (g.name + g.group).toLowerCase().includes(S.gq.toLowerCase()));
    gl = gl.slice().sort((a, b) => S.gs === 'status' ? ord[a.st] - ord[b.st] : String(a[S.gs]).localeCompare(String(b[S.gs])));
    const guests = gl.map(g => ({ ...g, cls: this.cls(g.st), chk: !!S.sel[g.id], i: this.ini(g.name), c: this.avc(g.name), j1: g.j >= 1 ? 'on' : '', j2: g.j >= 2 ? 'on' : '', j3: g.j >= 3 ? 'on' : '', plus: g.party > 1 ? '+' + (g.party - 1) : '—' }));
    const selCount = Object.values(S.sel).filter(Boolean).length;
    const gg = S.gl.find(g => g.id === S.guestId) || S.gl[0] || { id: 0, name: 'Guest', group: '—', st: 'Invited', j: 1, party: 1, table: '—', phone: '—' }; // ADMIN: empty guest list
    const gd = { ...gg, cls: this.cls(gg.st), i: this.ini(gg.name), c: this.avc(gg.name), plus: gg.party > 1 ? 'Party of ' + gg.party + ' (with plus-one)' : 'Just themselves', note: gg.group === 'VIP' ? 'Seat near the front. Vegetarian meal.' : '',
      jr: [['Invitation sent', 'WhatsApp · 20 Oct, 09:12', 1], ['Opened', '21 Oct, 19:40', gg.j >= 2], ['Replied', gg.st === 'Not attending' ? 'Can’t make it · 23 Oct' : 'Attending · 23 Oct', gg.j >= 3], ['Event day', ev.day + ' ' + ev.mon, 0]].map(x => ({ n: x[0], w: x[1], on: x[2] ? 'jn done' : 'jn up' })) };
    // invitation
    const secL = [['cover', 'Cover', 1], ['main', 'Main information', 1], ['story', 'Story', 1], ['events', 'Moments', 1], ['gallery', 'Gallery', 0], ['rsvp', 'RSVP', 1], ['wishes', 'Wishes', 1], ['gift', 'Gift', 0], ['live', 'Live stream', 1], ['music', 'Music', 1], ['closing', 'Closing', 1]];
    const secs = secL.map((s, i) => ({ id: s[0], n: s[1], no: String(i + 1).padStart(2, '0'), on: S.sec === s[0] ? 'sx on' : 'sx', c: s[2] ? 'var(--ok)' : 'var(--wt)' }));
    const sec = { cover: S.sec === 'cover', main: S.sec === 'main', gallery: S.sec === 'gallery', rsvp: S.sec === 'rsvp' }; sec.other = !(sec.cover || sec.main || sec.gallery || sec.rsvp);
    // design
    const dl = [['Linen Vow', 'Wedding', 'Minimal · Warm', 0, 'Ana & Ken'], ['Golden Hour', 'Anniversary', 'Elegant · Dark', 1, '50 Years'], ['Seventeen', '17th Birthday', 'Modern · Bold', 4, 'Nadia, 17'], ['Paper Margin', 'Editorial', 'Editorial · Serif', 0, 'A New Chapter'], ['First Light', 'Birthday', 'Warm · Playful', 3, 'Happy 30'], ['Signal', 'Product Launch', 'Modern · Mono', 5, 'Launch 26'], ['Quiet Ring', 'Wedding', 'Elegant · Botanical', 2, 'Raden & Cilla'], ['Studio Night', 'Brand', 'Brand · Dark', 1, 'Opening Night'], ['Gilded Seal', 'Wedding', 'Elegant · Cinematic', 0, 'Adrian & Isabella']];
    const designs = dl.filter(x => (S.dcat === 'All' || x[1] === S.dcat || x[2].includes(S.dcat)) && x[0].toLowerCase().includes(S.dq.toLowerCase())).map(x => { const pp = this.pals[x[3]]; return { name: x[0], cat: x[1], tags: x[2], mock: x[4], bg: pp.bg, fg: pp.fg, photo: `linear-gradient(165deg,color-mix(in oklab,${pp.ac} 45%,${pp.bg}),${pp.ac})`, cur: x[0] === S.design, pal: x[3] }; });
    // gifts / addons / cart
    const gifts = fresh ? [] : S.gifts;
    const inCart = id => S.cartL.some(c => c.id === id);
    const amap = a => { const avail = a.st === 'Available', inc = inCart(a.id); return { ...a, price: a.p ? this.idr(a.p) : 'Included', c: a.st === 'Purchased' ? 'b-ok' : a.st === 'Included' ? 'b-mu' : 'b-in', cta: inc ? 'In your cart' : 'Add', dis: inc, avail }; };
    const cart = S.cartL.map(c => { const a = S.addonsL.find(x => x.id === c.id); return { id: c.id, q: c.q, name: a.name, desc: a.desc, unit: this.idr(a.p), line: this.idr(a.p * c.q) }; });
    const sub = S.cartL.reduce((tt, c) => tt + S.addonsL.find(x => x.id === c.id).p * c.q, 0), dsc = Math.round(sub * S.disc);
    // tx
    const txs = S.txL.filter(x => (S.tf === 'All' || x.st === S.tf) && (x.id + x.desc).toLowerCase().includes(S.tq.toLowerCase())).map(x => ({ ...x, amt: this.idr(x.amt), cls: this.cls(x.st) }));
    const txSel = S.txL.find(x => x.id === S.tx) || S.txL[0] || { id: '—', date: '—', desc: 'No purchases yet', method: '—', amt: 0, st: 'Pending' }; // ADMIN: no purchases
    // todo
    const done = S.todosL.filter(x => x.done).length, total = S.todosL.length;
    const tmap = x => ({ ...x, cls: x.done ? 'tk done' : 'tk', ckc: x.done ? 'ck on' : 'ck', pc: x.pri === 'High' ? 'b-no' : x.pri === 'Low' ? 'b-mu' : 'b-in' });
    const tf = S.todosL.filter(x => S.tc === 'All' || x.cat === S.tc);
    const tPct = done / (total || 1), tAng = Math.PI * tPct; // ADMIN: no tasks yet
    const nextTask = S.todosL.find(x => !x.done);
    // qr / live
    const qrT = { invite: ['Scan to open the invitation', 'Opens the invitation on any phone. For printed cards and sharing.'], event: ['Scan for directions', 'Opens one moment with its map. For signage at the venue.'], checkin: ['Show this at the entrance', 'Personal to each guest. Ushers scan it to check them in.'] };
    const L = { 'Not configured': ['Nothing to show yet', 'Add a platform and a link to begin.', 'b-mu'], Scheduled: ['Starts ' + ev.day + ' ' + ev.mon + ', 10:00', 'Guests see a countdown on the invitation.', 'b-in'], Live: ['You are live', '214 people are watching right now.', 'b-no'], Ended: ['Thank you for joining', 'The recording stays on the invitation.', 'b-mu'] }[S.live];
    // guide
    const gl2 = [{ id: 1, cat: 'Getting started', t: 'Publish your first invitation', s: 'From a blank page to a shareable link.', steps: ['Open Invitation and check each section.', 'Preview it on a phone.', 'Select Publish.', 'Copy the link or download a QR code.'], go: 'invitation' }, { id: 2, cat: 'Guests', t: 'Import guests from a spreadsheet', s: 'Bring an existing list in one go.', steps: ['Open Guests and select Import.', 'Upload a CSV with name and phone.', 'Check the preview, then confirm.'], go: 'guests' }, { id: 3, cat: 'RSVP', t: 'Set an RSVP deadline', s: 'Decide when replies close.', steps: ['Open Invitation, then RSVP.', 'Pick a deadline.', 'Save your changes.'], go: 'invitation' }, { id: 4, cat: 'Event day', t: 'Check guests in with QR', s: 'Prepare your ushers for the day.', steps: ['Generate check-in codes in Check-in.', 'Add ushers and choose what they can see.', 'Test one scan before guests arrive.'], go: 'checkin' }, { id: 5, cat: 'Gift', t: 'Share gift details safely', s: 'Let guests copy in one tap.', steps: ['Open Gift.', 'Add a gift method.', 'Check how guests will see it.'], go: 'gift' }, { id: 6, cat: 'Event day', t: 'Schedule a live stream', s: 'Connect YouTube or Zoom.', steps: ['Open Live stream.', 'Paste your link.', 'Set a start time.'], go: 'live' }];
    const guides = gl2.filter(g => (S.hc === 'All' || g.cat === S.hc) && (g.t + g.s).toLowerCase().includes(S.hq.toLowerCase())).map(g => ({ ...g, sel: S.ha === g.id ? 'card lift on' : 'card lift' }));
    // usher
    const uq = S.uq.toLowerCase();
    const uguests = S.gl.filter(g => g.st === 'Attending' && (!uq || g.name.toLowerCase().includes(uq))).slice(0, 3);
    // preview
    const pvGuests = ['Sarah Wijaya', 'Budi Santoso & family', 'A guest without a name'];
    const host = S.persp === 'Host';
    // onboarding
    const obGreet = { Wedding: 'The wedding of', Birthday: 'Celebrating', '17th Birthday': 'Sweet seventeen', Anniversary: 'Celebrating the anniversary of', Engagement: 'The engagement of', 'Product launch': 'You are invited to the launch of', 'Private celebration': 'You are invited', Other: 'You are invited' }[S.obType];
    let obDateF = 'Choose a date'; if (S.obDate) { try { obDateF = new Date(S.obDate + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (x) {} }
    const wishes = [['Budi Santoso', 'Family', 'We watched you both grow up. Seeing you begin this together is the best news of the year.'], ['Sarah Wijaya', 'Friends', 'From the first coffee to forever. Counting down to the twelfth with you.'], ['Dewi Lestari', 'Family', 'Semoga menjadi keluarga yang penuh kasih dan saling menguatkan.'], ['Tommy Wijaya', 'VIP', 'Wishing you a lifetime of the kind of happiness you have brought everyone around you.'], ['Rina Kusuma', 'Family', 'Can’t wait to dance at the reception. Love you both.'], ['Hendra Gunawan', 'Family', 'Selamat menempuh hidup baru. Doa terbaik untuk kalian berdua.']].map(w => ({ n: w[0], g: w[1], t: w[2], i: this.ini(w[0]), c: this.avc(w[0]) }));
    const unread = S.notifL.filter(n => n.u).length;
    const R = {
      ev, pv, p, go, ic: I, nav, allNav, bnav, greeting, pageTitle: this.titles[S.page] || '', loading: S.loading,
      loadMsg: { guests: 'Gathering your guests…', design: 'Laying out designs…', billing: 'Fetching your payments…', memories: 'Collecting wishes…', eventday: 'Preparing event day…' }[S.page] || 'Preparing your workspace…',
      guideOn: S.page === 'guide' ? 'on' : '', accountOn: S.page === 'account' ? 'on' : '', thL: S.theme === 'light' ? 'on' : '', thD: S.theme === 'dark' ? 'on' : '',
      setLight: () => { this.setState({ theme: 'light' }); this.applyRoot('light'); try { localStorage.setItem('mula-theme', 'light'); } catch (x) {} },
      setDark: () => { this.setState({ theme: 'dark' }); this.applyRoot('dark'); try { localStorage.setItem('mula-theme', 'dark'); } catch (x) {} },
      toggleTheme: () => { const th = S.theme === 'dark' ? 'light' : 'dark'; this.setState({ theme: th }); this.applyRoot(th); try { localStorage.setItem('mula-theme', th); } catch (x) {} },
      themeIc: S.theme === 'dark' ? I.sun : I.moon,
      cycleEvt: () => { const k = ['wedding', 'birthday', 'launch'], n = k[(k.indexOf(S.evt) + 1) % 3]; this.setState({ evt: n, events: null, invGreet: null, invLine: null }); setTimeout(() => this.countUp(), 80); this.say('Switched to ' + this.P[n].host + '.'); },
      online, hasUnread: unread > 0, openSearch: () => this.setState({ searchOpen: true, sq: '' }), toggleNotif: () => this.setState({ notifOpen: !S.notifOpen }),
      freshHome: fresh, fullHome: !fresh, openOb: () => this.setState({ obOpen: true, ob: 0 }),
      openPreview: () => this.setState({ previewOpen: true, opened: false, rsvp: '' }), tiltMove: this.tiltMove, tiltOut: this.tiltOut,
      parts, arch, notes, noNotes: !notes.length,
      noteAct: e => { const id = this.d(e).v; if (id === 'remind') { this.setState({ dismissed: { ...S.dismissed, remind: 1 } }); this.say('Reminder sent to 18 guests.'); } else if (id === 'unopened') { this.setState({ seg: 'notopened' }); this.nav('guests'); } else this.nav('todo'); },
      noteLater: e => this.setState({ dismissed: { ...S.dismissed, [this.d(e).v]: 1 } }), resetNotes: () => this.setState({ dismissed: {} }),
      journey, ms, recent, schedule, activity,
      // guests
      segs, setSeg: e => this.setState({ seg: this.d(e).v }), hasSegAct: !!sa && !fresh, segMsg: sa ? sa[0] : '', segCta: sa ? sa[1] : '', segRun: () => this.say(S.seg === 'follow' ? 'Showing guests who need a follow-up.' : 'Sent. We’ll let you know as replies come in.'),
      gq: S.gq, setGq: e => this.setState({ gq: e.target.value }), setGs: e => this.setState({ gs: e.target.value }),
      guests, noGuests: !guests.length && !fresh, freshGuests: fresh, hasGuests: guests.length > 0, gCount: guests.length, hasSel: selCount > 0, selCount,
      selG: e => this.setState({ sel: { ...S.sel, [this.d(e).v]: e.target.checked } }), clearSel: () => this.setState({ sel: {} }),
      openG: e => this.setState({ guestId: +this.d(e).v, guestOpen: true }), gd, guestOpen: S.guestOpen, stOpts: ['Attending', 'Pending', 'Invited', 'Not attending'].map(s => ({ s, on: gg.st === s ? 'chip on' : 'chip' })),
      setGSt: e => { this.setState({ gl: S.gl.map(g => g.id === S.guestId ? { ...g, st: this.d(e).v, j: this.d(e).v === 'Attending' || this.d(e).v === 'Not attending' ? 3 : g.j } : g) }); this.say('RSVP updated for ' + gg.name.split(' ')[0] + '.'); },
      resend: () => this.say('Invitation sent again to ' + gg.name.split(' ')[0] + '.'), bulkResend: () => { this.setState({ sel: {} }); this.say('Invitations sent again.'); },
      bulkDel: () => { this.setState({ gl: S.gl.filter(g => !S.sel[g.id]), sel: {} }); this.say('Guests removed.'); },
      importG: () => this.say('Choose a CSV or Excel file to import.'), exportG: () => this.say('Your guest list is downloading.'),
      openAddGuest: () => this.setState({ modalGuest: true }), modalGuest: S.modalGuest, ng: S.ng,
      setNg: e => this.setState({ ng: { ...S.ng, [e.target.dataset.k]: e.target.value } }),
      addGuest: e => { e.preventDefault(); if (!S.ng.name.trim()) return; this.setState({ gl: [{ id: Date.now(), name: S.ng.name, group: S.ng.group, st: 'Invited', j: 1, party: 1, table: '—', phone: S.ng.phone || '—' }, ...S.gl], modalGuest: false, ng: { name: '', phone: '', group: 'Friends' } }); this.say(S.ng.name.split(' ')[0] + ' has been added to your guest list.'); },
      // invitation
      secs, sec, secName: (secL.find(s => s[0] === S.sec) || secL[0])[1], setSec: e => this.setState({ sec: this.d(e).v }),
      setGreet: e => this.setState({ invGreet: e.target.value }), setLine: e => this.setState({ invLine: e.target.value }),
      tg: e => { const b = e.currentTarget, on = b.classList.toggle('on'); b.setAttribute('aria-checked', on); },
      save: () => this.say('Your changes have been saved.'), failSave: () => this.say('We couldn’t save your changes. Check your connection and try again.'),
      toastGallery: () => this.say('Choose photos from your device.'), publish: this.publish,
      // design
      dq: S.dq, setDq: e => this.setState({ dq: e.target.value }), dcats: ['All', 'Wedding', 'Birthday', 'Anniversary', '17th Birthday', 'Brand', 'Product Launch', 'Minimal', 'Elegant', 'Editorial', 'Modern'].map(n => ({ n, on: S.dcat === n ? 'chip on' : 'chip' })),
      setDcat: e => this.setState({ dcat: this.d(e).v }), designs, noDesigns: !designs.length, designName: S.design,
      useDesign: e => { this.setState({ design: this.d(e).v, pal: +this.d(e).pal }); this.say('Your design has been updated.'); },
      palOpts: this.pals.slice(0, 4).map((x, i) => ({ i, n: x.n, bg: x.bg, ac: x.ac, on: S.pal === i ? 'outline:2px solid #EEE9DF;outline-offset:3px' : '' })), setPal: e => this.setState({ pal: +this.d(e).v }),
      obPalOpts: this.pals.slice(0, 4).map((x, i) => ({ i, n: x.n, bg: x.bg, ac: x.ac, on: S.pal === i ? 'outline:2px solid var(--ink);outline-offset:3px' : '' })),
      fonts: ['Editorial', 'Modern', 'Classic'].map(n => ({ n, on: S.font === n ? 'on' : '' })), setFont: e => this.setState({ font: this.d(e).v }),
      // events
      events: fresh ? [] : evList.map((x, i) => ({ ...x, time: x.s + ' – ' + x.en, vc: x.vis === 'Everyone' ? 'b-ok' : 'b-mu', no: String(i + 1).padStart(2, '0') })), noEvents: fresh || !evList.length,
      addEvent: () => { this.setEvs([...evList, { id: Date.now(), name: 'New moment', s: '19:00', en: '21:00', venue: 'Add a venue', addr: '', dress: 'Open', vis: 'Everyone', desc: '', open: true }]); this.say('A new moment was added. Fill in the details.'); },
      evEdit: e => this.setEvs(evList.map(x => x.id == this.d(e).v ? { ...x, open: !x.open } : x)),
      evDup: e => { const i = evList.findIndex(x => x.id == this.d(e).v), a = evList.slice(); a.splice(i + 1, 0, { ...evList[i], id: Date.now(), name: evList[i].name + ' (copy)', open: false }); this.setEvs(a); this.say('Moment duplicated.'); },
      evDel: e => { this.setEvs(evList.filter(x => x.id != this.d(e).v)); this.say('Moment removed.'); },
      evUp: e => this.mv(evList, this.d(e).v, -1, a => this.setEvs(a)), evDown: e => this.mv(evList, this.d(e).v, 1, a => this.setEvs(a)),
      evSave: e => { this.setEvs(evList.map(x => x.id == this.d(e).v ? { ...x, open: false } : x)); this.say('Moment saved.'); },
      // gift
      gifts, noGifts: !gifts.length, hasGifts: gifts.length > 0,
      addGift: () => { this.setState({ gifts: [...S.gifts, { id: Date.now(), type: 'Bank account', title: 'New gift method', detail: 'Add the details', copy: '0000 0000' }] }); this.say('Gift method added.'); },
      gDel: e => this.setState({ gifts: S.gifts.filter(x => x.id != this.d(e).v) }), gUp: e => this.mv(S.gifts, this.d(e).v, -1, a => this.setState({ gifts: a })), gDown: e => this.mv(S.gifts, this.d(e).v, 1, a => this.setState({ gifts: a })),
      copy: e => { try { navigator.clipboard.writeText(this.d(e).v); } catch (x) {} this.say('Copied to clipboard.'); },
      // addons / cart
      aoAvail: S.addonsL.filter(a => a.st === 'Available').map(amap), aoOwned: S.addonsL.filter(a => a.st !== 'Available').map(amap), cartCount: S.cartL.length,
      addCart: e => { this.setState({ cartL: [...S.cartL, { id: +this.d(e).v, q: 1 }] }); this.say('Added to your cart.'); },
      cart, cartEmpty: !cart.length, cartFull: cart.length > 0, subtotal: this.idr(sub), discount: dsc ? '− ' + this.idr(dsc) : '—', total: this.idr(sub - dsc),
      qPlus: e => this.setState({ cartL: S.cartL.map(c => c.id == this.d(e).v ? { ...c, q: c.q + 1 } : c) }),
      qMinus: e => this.setState({ cartL: S.cartL.map(c => c.id == this.d(e).v ? { ...c, q: c.q - 1 } : c).filter(c => c.q > 0) }),
      promo: S.promo, setPromo: e => this.setState({ promo: e.target.value }),
      applyPromo: () => S.promo.trim().toUpperCase() === 'MULA10' ? (this.setState({ disc: .1 }), this.say('Promo applied: 10% off.')) : this.say('That code doesn’t look right. Try MULA10.'),
      pay: () => { const items = cart.map(c => c.name).join(', '); this.setState({ cartL: [], disc: 0, txL: [{ id: 'TX-' + (1043 + S.txL.length), date: '31 Oct 2026', desc: items, method: 'QRIS', amt: sub - dsc, st: 'Paid' }, ...S.txL], addonsL: S.addonsL.map(a => S.cartL.some(c => c.id === a.id) ? { ...a, st: 'Purchased' } : a) }); this.nav('billing'); this.say('Payment completed. Your receipt is in Billing.'); },
      // billing
      tfs: ['All', 'Paid', 'Pending', 'Failed', 'Refunded'].map(n => ({ n, on: S.tf === n ? 'chip on' : 'chip' })), setTf: e => this.setState({ tf: this.d(e).v }), tq: S.tq, setTq: e => this.setState({ tq: e.target.value }), txs, noTx: !txs.length,
      tx: { ...txSel, amt: this.idr(txSel.amt), cls: this.cls(txSel.st) }, txOpen: S.txOpen, openTx: e => this.setState({ tx: this.d(e).v, txOpen: true }), dlInv: () => { this.setState({ txOpen: false }); this.say('Your invoice is downloading.'); },
      // tasks
      todoDone: done, todoTotal: total, todoLeft, tArch: { dash: Math.round(tPct * 100) + ' 100', x: (120 - 104 * Math.cos(tAng)).toFixed(1), y: (124 - 104 * Math.sin(tAng)).toFixed(1) },
      nextTask: nextTask ? nextTask.title : 'Nothing left. Enjoy the day.', tSoon: tf.filter(x => !x.done && x.ph === 'Soon').map(tmap), tLater: tf.filter(x => !x.done && x.ph === 'Later').map(tmap), tDone: tf.filter(x => x.done).map(tmap),
      tcats: ['All', 'Invitation', 'Design', 'Guests', 'Gift', 'Schedule', 'Event day'].map(n => ({ n, on: S.tc === n ? 'chip on' : 'chip' })), setTc: e => this.setState({ tc: this.d(e).v }),
      nt: S.nt, setNt: e => this.setState({ nt: e.target.value }), setNp: e => this.setState({ np: e.target.value }), ntKey: e => { if (e.key === 'Enter') this.addTask(); }, addTask: () => this.addTask(),
      togTask: e => { const id = this.d(e).v, tk = S.todosL.find(x => x.id == id), nowDone = !tk.done; this.setState({ todosL: S.todosL.map(x => x.id == id ? { ...x, done: nowDone } : x), recent: nowDone ? [tk.title, ...S.recent.filter(r => r !== tk.title)] : S.recent.filter(r => r !== tk.title) }); if (nowDone) this.say('Done. “' + tk.title + '” is now on your timeline.'); },
      delTask: e => this.setState({ todosL: S.todosL.filter(x => x.id != this.d(e).v) }),
      // event day
      checked: S.checked, expected: this.expected ?? 180, arrPct: (this.expected ?? 180) ? Math.round(S.checked / (this.expected ?? 180) * 100) + '%' : '0%', notYet: Math.max(0, (this.expected ?? 180) - S.checked), sim: S.sim, simOff: !S.sim, toggleSim: this.toggleSim, simLabel: S.sim ? 'Pause rehearsal' : 'Start rehearsal',
      bars: S.bars.map((b, i) => ({ h: Math.min(100, b * 2.6) + '%', l: ['17:30', '17:45', '18:00', '18:15', '18:30', '18:45'][i] })), feed: S.feed.map(f => ({ ...f, i: this.ini(f.n), c: this.avc(f.n) })),
      // check-in
      ckTabs: [['qr', 'QR codes'], ['ushers', 'Ushers']].map(x => ({ id: x[0], n: x[1], on: S.ck === x[0] ? 'on' : '' })), setCk: e => this.setState({ ck: this.d(e).v }), ckQr: S.ck === 'qr', ckUsh: S.ck === 'ushers',
      qrTabs: [['invite', 'Invitation'], ['event', 'Moment'], ['checkin', 'Check-in']].map(q => ({ id: q[0], n: q[1], on: S.qr === q[0] ? 'chip on' : 'chip' })),
      setQr: e => this.setState({ qr: this.d(e).v, qrSeed: { invite: 3, event: 7, checkin: 11 }[this.d(e).v] }), qrTitle: qrT[S.qr][0], qrHint: qrT[S.qr][1], qrPath: this.qrPath(S.qrSeed),
      qrDl: () => this.say('Your QR code is ready. Downloading PNG.'), qrPrint: () => this.say('Opening a print-ready sheet…'), qrRegen: () => { this.setState({ qrSeed: S.qrSeed + 1 }); this.say('New code created. Earlier codes no longer work.'); },
      ushers: [['Dimas Arya', 'Holy Matrimony · Reception', 'Lead'], ['Putri Ayu', 'Reception', 'Scanner'], ['Fajar Nugraha', 'After Party', 'Lookup only']].map(u => ({ n: u[0], ev: u[1], r: u[2], i: this.ini(u[0]), c: this.avc(u[0]) })),
      toastUsher: () => this.say('We’ll text them a private link to the usher view.'),
      perms: [['scan', 'QR scanning', 'Ushers scan guest codes to check them in.'], ['lookup', 'Guest lookup', 'Search by name when a code is missing.'], ['seat', 'Show seating', 'Display table numbers after check-in.'], ['offline', 'Offline mode', 'Keep checking in without signal. Syncs later.']].map(x => ({ n: x[1], d: x[2], k: x[0], on: S.perms[x[0]] ? 'tog on' : 'tog', ar: String(S.perms[x[0]]) })),
      togPerm: e => this.setState({ perms: { ...S.perms, [this.d(e).v]: !S.perms[this.d(e).v] } }),
      uq: S.uq, setUq: e => this.setState({ uq: e.target.value }), uguests, checkIn: e => { const g = S.gl.find(x => x.id == this.d(e).v); this.setState({ checked: Math.min(this.expected ?? 180, S.checked + 1) }); this.say((g ? g.name.split(' ')[0] : 'Guest') + ' is checked in. Table ' + (g ? g.table : '')); },
      // live
      liveStates: ['Not configured', 'Scheduled', 'Live', 'Ended'].map(n => ({ n, on: S.live === n ? 'on' : '' })), setLive: e => this.setState({ live: this.d(e).v }), live: S.live, liveCls: L[2], liveTitle: L[0], liveSub: L[1], isLive: S.live === 'Live',
      // memories / team
      wishes: fresh ? [] : wishes, noWishes: fresh, hasWishes: !fresh,
      team: S.team.map(m => ({ ...m, i: this.ini(m.n), c: this.avc(m.n), st: m.on ? 'Active now' : 'Invited' })), invite: S.invite, setInvite: e => this.setState({ invite: e.target.value }),
      sendInvite: () => { if (!S.invite.trim()) return; this.setState({ team: [...S.team, { id: Date.now(), n: S.invite.split('@')[0], r: 'Family', e: S.invite, on: false }], invite: '' }); this.say('Invitation to collaborate sent.'); },
      // guide
      hq: S.hq, setHq: e => this.setState({ hq: e.target.value }), hcats: ['All', 'Getting started', 'Guests', 'RSVP', 'Event day', 'Gift'].map(n => ({ n, on: S.hc === n ? 'chip on' : 'chip' })), setHc: e => this.setState({ hc: this.d(e).v }),
      guides, noGuides: !guides.length, ga: gl2.find(g => g.id === S.ha) || gl2[0], setHa: e => this.setState({ ha: +this.d(e).v }),
      terms: [['Using Mula', 'You may use Mula to create and manage invitations for personal and commercial celebrations. You are responsible for the content you publish.'], ['Your content', 'You own the photos, words and guest information you add. You allow Mula to show them to the guests you invite, and nowhere else.'], ['Guest privacy', 'Guest details are used only to deliver and manage your invitation. We never sell them, and you can delete them at any time.'], ['Payments and refunds', 'Add-ons are charged when you check out. Refund requests are reviewed within 7 days of purchase.'], ['After your event', 'Your invitation stays online as a keepsake for 12 months. You can download your memories or take it offline whenever you choose.'], ['Changes to these terms', 'We will tell you by email before any change takes effect.']].map((x, i) => ({ h: x[0], b: x[1], no: String(i + 1).padStart(2, '0') })),
      notifPrefs: [['New replies', 1], ['Daily summary', 1], ['Payment updates', 1], ['Tips from Mula', 0]].map(n => ({ n: n[0], on: n[1] ? 'tog on' : 'tog' })),
      swL: [['Ivory', '#F5F3EE'], ['Paper', '#FBFAF7'], ['Stone', '#ECE8E0'], ['Dot', '#A69A89'], ['Deep taupe', '#7A6E5E'], ['Ink', '#272523']].map(s => ({ n: s[0], c: s[1] })),
      swD: [['Night', '#12110F'], ['Surface', '#191816'], ['Raised', '#211F1D'], ['Dot', '#B8AB97'], ['Muted', '#A39B8E'], ['Ivory ink', '#EEE9DF']].map(s => ({ n: s[0], c: s[1] })),
      showToast: () => this.say('Your guest has been added.'),
      // overlays
      moreOpen: S.moreOpen, notifOpen: S.notifOpen, searchOpen: S.searchOpen, previewOpen: S.previewOpen, obOpen: S.obOpen, toast: S.toast, celebrate: S.celebrate,
      closeAll: this.closeAll, stop: e => e.stopPropagation(),
      notifs: S.notifL.map(n => ({ ...n, bg: n.u ? 'background:var(--bg2)' : '', dot: n.u ? 'var(--dot)' : 'transparent' })), readAll: () => this.setState({ notifL: S.notifL.map(n => ({ ...n, u: false })) }),
      sq: S.sq, setSq: e => this.setState({ sq: e.target.value }), sres: this.search(S.sq),
      devs: ['Mobile', 'Tablet', 'Desktop'].map(n => ({ n, on: S.dev === n ? 'on' : '' })), setDev: e => this.setState({ dev: this.d(e).v }), devCls: 'dev dev-' + S.dev[0].toLowerCase(),
      persps: ['Guest', 'Host'].map(n => ({ n, on: S.persp === n ? 'on' : '' })), setPersp: e => this.setState({ persp: this.d(e).v }), host,
      pvGuests: pvGuests.map((n, i) => ({ n, i })), setPvg: e => this.setState({ pvg: +e.target.value }), pvDear: S.pvg === 2 ? 'Dear guest,' : 'Dear ' + pvGuests[S.pvg] + ',',
      closed: !S.opened, opened: S.opened, openInv: () => this.setState({ opened: true }), reopen: () => this.setState({ opened: false, rsvp: '' }),
      rsvpOpen: !S.rsvp, rsvpYesDone: S.rsvp === 'yes', rsvpNoDone: S.rsvp === 'no', rsvpYes: () => this.setState({ rsvp: 'yes' }), rsvpNo: () => this.setState({ rsvp: 'no' }),
      pvEvents: evList, pvGifts: S.gifts.slice(0, 2), pvWishes: wishes.slice(0, 2), shareP: () => this.say('Preview link copied. It expires in 24 hours.'),
      ob: this.obStep(), obTicks: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ s: i <= S.ob ? 'transform:scaleX(1)' : 'transform:scaleX(0)' })),
      obTypes: ['Wedding', 'Birthday', '17th Birthday', 'Anniversary', 'Engagement', 'Product launch', 'Private celebration', 'Other'].map(n => ({ n, on: S.obType === n ? 'chip on' : 'chip' })), setObType: e => this.setState({ obType: this.d(e).v }),
      obNames: S.obNames, setObNames: e => this.setState({ obNames: e.target.value }), obDate: S.obDate, setObDate: e => this.setState({ obDate: e.target.value }), obVenue: S.obVenue, setObVenue: e => this.setState({ obVenue: e.target.value }),
      obG: S.obG, setObG: e => this.setState({ obG: e.target.value }), addObG: e => { e.preventDefault(); if (S.obG.trim()) this.setState({ obGuests: [...S.obGuests, S.obG.trim()], obG: '' }); }, obGuests: S.obGuests.map(n => ({ n })),
      obObj: { greet: obGreet, names: S.obNames || 'Your names', date: obDateF, venue: S.obVenue || 'Your venue', type: S.obType, guests: S.obGuests.length ? S.obGuests.length + ' guests added' : 'No guests yet', design: pal.n },
      obBack: () => S.ob ? this.setState({ ob: S.ob - 1 }) : this.setState({ obOpen: false }),
      obNext: () => S.ob >= 7 ? this.publish() : this.setState({ ob: S.ob + 1 })
    };
    try { return Object.assign(R, this.ext(S, R)); } catch (err) { console.warn('EXT ' + (err && err.message) + ' ' + String(err && err.stack).slice(0, 300)); return R; }
  }
  setTheme(th) { this.setState({ theme: th }); this.applyRoot(th); try { localStorage.setItem('mula-theme', th); } catch (x) {} }
  setLang(l) { this.setState({ lang: l, flip: this.state.flip + 1 }); try { localStorage.setItem('mula-lang', l); } catch (x) {} }
  store(u) { u = (u || '').toLowerCase(); return u.includes('shopee') ? 'Shopee' : u.includes('tokopedia') ? 'Tokopedia' : u.includes('tiktok') ? 'TikTok Shop' : u ? 'Online store' : 'Contribution'; }
  printNow(mode) {
    const f = this.fmts[this.state.pfmt]; this.setState({ printMode: mode });
    setTimeout(() => { let st = document.getElementById('mula-page'); if (!st) { st = document.createElement('style'); st.id = 'mula-page'; document.head.appendChild(st); } st.textContent = mode === 'invite' ? `@page{size:${f.w}mm ${f.h}mm;margin:0}` : '@page{size:A4 portrait;margin:14mm}'; try { window.print(); } catch (e) { this.say('Printing isn’t available here. Try opening the file in your browser.'); } }, 180);
  }
  csv(rows) {
    const head = ['Name', 'Group', 'Reply', 'Party', 'Table', 'Phone'], esc = v => '"' + String(v).replace(/"/g, '""') + '"';
    const body = [head].concat(rows.map(g => [g.name, g.group, g.st, g.party, g.table, g.phone])).map(r => r.map(esc).join(',')).join('\n');
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' })); a.download = 'mula-guest-list.csv'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {}
    this.say('Your guest list CSV is downloading.');
  }
  runAi(task) { this.setState({ aiTask: task || this.state.aiTask, aiBusy: true, aiShown: false }); clearTimeout(this._ai); this._ai = setTimeout(() => this.setState({ aiBusy: false, aiShown: true }), 1500); }
  aiOut(S, ev) {
    const host = ev.host, wed = S.evt === 'wedding';
    const tones = { Warm: wed ? ['Two stories, one beginning. Join us as we say yes to forever, surrounded by the people who made us who we are.', 'We would love you there when our next chapter begins. Come celebrate with us.'] : ['Come celebrate ' + host + ' with the people who matter most.', 'A new chapter begins, and it would not feel complete without you.'],
      Formal: wed ? ['Together with our families, we request the honour of your presence as we begin our life together.', host + ', with their families, invite you to celebrate their marriage.'] : ['You are cordially invited to celebrate ' + host + '.', 'We request the pleasure of your company on this occasion.'],
      Playful: wed ? ['We said yes. Now we need you to say yes too: dinner, dancing and very good cake.', 'Save your best outfit and your best dance moves for ' + ev.day + ' ' + ev.mon + '.'] : ['Clear your calendar, bring your best outfit. ' + host + ' is happening.', 'There will be cake. You should be there.'],
      Poetic: wed ? ['Every forever starts somewhere. Ours begins on ' + ev.day + ' ' + ev.mon + ', and we would love for you to be there.', 'From a meeting, into meaning. Walk with us into what comes next.'] : ['Every milestone marks the start of something. Be there when this one begins.', 'From here, a new story unfolds. We saved you a seat.'] };
    const lc = this.LC[S.evt];
    const o = {
      copy: { h: 'Opening lines in a ' + S.aiTone.toLowerCase() + ' tone', items: tones[S.aiTone].map(x => ({ h: S.aiTone, t: x, a: 'Use as tagline', k: 'use', v: x })) },
      translate: { h: 'Your tagline in three languages', items: [['English', lc.en.line], ['Bahasa Indonesia', lc.id.line], ['Bahasa Melayu', lc.ms.line]].map(x => ({ h: x[0], t: x[1], a: 'Copy', k: 'copy', v: x[1] })).concat([{ h: 'Keluarga di Kuala Lumpur', t: '15% of this invitation is still in Bahasa Indonesia. Mula AI can translate the rest into Bahasa Melayu for you to review.', a: 'Translate the rest', k: 'tr', v: '' }]) },
      followup: { h: 'A gentle follow-up for 18 guests', items: [{ h: 'Bahasa Indonesia · WhatsApp', t: 'Hai {nama}, kami ingin memastikan undangan kami sudah sampai. Kalau berkenan, kabari kami sebelum 25 November ya. Terima kasih! — ' + host, a: 'Send to 18 guests', k: 'send', v: '' }, { h: 'English · WhatsApp', t: 'Hi {name}, just making sure our invitation reached you. If you can, let us know by 25 November. Thank you! — ' + host, a: 'Send to 18 guests', k: 'send', v: '' }] },
      checklist: { h: 'Five things worth adding', items: [['Confirm final guest numbers with the venue', '27 Nov'], ['Send seating plan to ushers', '5 Dec'], ['Prepare thank-you message', '10 Dec'], ['Test live stream link with a family member', '9 Dec'], ['Print 4 entrance QR signs', '8 Dec']].map(x => ({ h: 'Due ' + x[1], t: x[0], a: '', k: '', v: '' })).concat([{ h: '', t: 'Add all five to your tasks, each with its date.', a: 'Add 5 tasks', k: 'tasks', v: '' }]) },
      readiness: { h: 'What to look at first', items: [{ h: 'Gallery', t: 'Invitations with a gallery are opened for longer. Adding 6 to 8 photos would bring Invitation to 100%.', a: 'Open gallery', k: 'go', v: 'invitation' }, { h: 'Seating', t: '62 confirmed guests have no table. Assigning them now gives ushers time to prepare.', a: 'Open guests', k: 'go', v: 'guests' }, { h: 'Malaysia invitation', t: 'Keluarga di Kuala Lumpur is still a draft. 27 guests are waiting for it.', a: 'Open invitations', k: 'go', v: 'invitations' }] },
      design: { h: 'Three small changes', items: [{ h: 'Frame', t: 'Your cover photo is portrait. The Arch frame keeps faces in view on every phone.', a: 'Apply arch frame', k: 'frame', v: 'Arch' }, { h: 'Type', t: 'Your names are short. The Grand scale gives the cover more presence.', a: 'Apply grand scale', k: 'scale', v: 'Grand' }, { h: 'Palette', t: 'The Sage palette suits the Kuala Lumpur garden venue.', a: 'Try Sage', k: 'pal', v: '2' }] } };
    return o[S.aiTask] || o.copy;
  }
  ext(S, R) {
    const L = this.T[S.lang] || this.T.en, I = this.I, go = this.go, fresh = this.fresh(), advanced = S.pkg === 'advanced';
    const lc = this.LC[S.evt] || this.LC.wedding, la = lc[S.lang], li = lc[S.plang], txl = S.itx[S.plang] || {}, ic = this.IC[S.plang];
    const ev = { ...R.ev, tag: la.tag, date: la.date, greet: txl.greet ?? li.greet, line: txl.line ?? li.line, close: li.close };
    const iv = { ...ic, date: li.date, dear: S.pvg === 2 ? ic.dear + ' ' + ic.guest + ',' : ic.dear + ' ' + ['Sarah Wijaya', 'Budi Santoso & family'][S.pvg] + ',' };
    const isOn = id => S.page === id || (id === 'invitations' && S.page === 'invitation') || (id === 'addons' && S.page === 'cart');
    const todoLeft = S.todosL.filter(t => !t.done).length;
    const nav = this.groups.map(g => ({ label: L.g[g[0]], items: g[1].map(n => ({ id: n[0], label: L.t[n[0]], ic: I[n[2]], on: isOn(n[0]) ? 'on' : '', badge: n[0] === 'todo' && todoLeft ? todoLeft : '' })) }));
    const bnav = [['home', 'arch'], ['guests', 'guests'], ['invitations', 'inv'], ['todo', 'check']].map(b => ({ id: b[0], n: L.t[b[0]], ic: I[b[1]], on: isOn(b[0]) ? 'on' : '', fn: go }));
    bnav.push({ id: 'more', n: L.more, ic: I.more, on: S.moreOpen ? 'on' : '', fn: () => this.setState({ moreOpen: true }) });
    const allNav = this.groups.flatMap(g => g[1]).map(n => ({ id: n[0], label: L.t[n[0]] })).concat([['guide', L.t.guide], ['account', L.t.account], ['terms', L.t.terms], ['system', L.t.system]].map(n => ({ id: n[0], label: n[1] })));
    const hr = new Date().getHours();
    const lname = { en: 'English', id: 'Bahasa Indonesia', ms: 'Bahasa Melayu' };
    const slug = this.slug || { wedding: 'raden-cilla', birthday: 'nadia17', launch: 'aurora-s1' }[S.evt]; // ADMIN: slug of the real event
    const grad = p => `linear-gradient(165deg,color-mix(in oklab,${p.ac} 45%,${p.bg}),${p.ac})`;
    const active = S.invs.filter(i => i.st !== 'Archived').length, limit = advanced ? 10 : 3;
    const invs = S.invs.map(i => { const pp = this.pals[i.pal]; return { ...i, langN: lname[i.lang], url: 'mula.id/' + slug + i.path, bg: pp.bg, fg: pp.fg, ac: pp.ac, photo: grad(pp), stc: i.st === 'Published' ? 'b-ok' : i.st === 'Draft' ? 'b-wt' : 'b-mu', cur: i.id === S.curInv, card: i.st === 'Archived' ? 'card lift' : 'card lift', op: i.st === 'Archived' ? 'opacity:.62' : '', pubL: i.st === 'Published' ? 'Unpublish' : 'Publish', archL: i.st === 'Archived' ? 'Restore' : 'Archive', trs: ['id', 'en', 'ms'].map(k => ({ k: k.toUpperCase(), v: i.tr[k], c: i.tr[k] === 100 ? 'var(--ok)' : i.tr[k] > 0 ? 'var(--wt)' : 'var(--line2)' })) }; });
    const ci = S.invs.find(i => i.id === S.curInv) || S.invs[0];
    const selInv = id => { const v = S.invs.find(i => i.id == id); if (v) this.setState({ curInv: v.id, pal: v.pal, plang: v.lang, design: v.design }); return v; };
    const setInvs = fn => this.setState({ invs: S.invs.map(i => fn(i) || i) });
    // custom design
    const cu0 = S.cust, setCu = o => this.setState({ cust: { ...S.cust, ...o } });
    const cu = { radius: { Arch: '999px 999px 12px 12px', Soft: '20px', 'Full bleed': '0', Circle: '50%' }[cu0.frame], ar: cu0.frame === 'Circle' ? '1/1' : '3/3.6', pw: cu0.frame === 'Full bleed' ? '100%' : '72%', align: cu0.layout === 'Editorial' ? 'left' : 'center', just: cu0.layout === 'Editorial' ? 'start' : 'center', full: cu0.layout === 'Full cover', std: cu0.layout !== 'Full cover', size: { Quiet: '28px', Balanced: '34px', Grand: '44px' }[cu0.scale], anim: cu0.motion === 'Still' ? '' : (cu0.motion === 'Arch reveal' ? (S.replay % 2 ? 'mA1' : 'mA2') : (S.replay % 2 ? 'mF1' : 'mF2')) };
    const ctabs = ['Layout', 'Type', 'Colour', 'Images', 'Sections', 'Motion'].map(n => ({ n, on: cu0.tab === n ? 'on' : '' }));
    const ct = {}; ['Layout', 'Type', 'Colour', 'Images', 'Sections', 'Motion'].forEach(n => ct[n.toLowerCase()] = cu0.tab === n);
    const opt = (k, arr) => arr.map(n => ({ n, k, on: cu0[k] === n ? 'chip on' : 'chip' }));
    // registry
    const reg = S.reg.map(r => ({ ...r, priceF: this.idr(r.price), store: this.store(r.url), pct: Math.round(r.got / r.qty * 100) + '%', claimed: r.got + ' of ' + r.qty + ' gifted', full: r.got >= r.qty, open: r.got < r.qty, tone: grad(this.pals[r.id % 4]) }));
    const regGot = S.reg.reduce((a, r) => a + r.got, 0), regQty = S.reg.reduce((a, r) => a + r.qty, 0);
    // packages
    const pkgs = [['free', 'Free', 'Rp 0', 'To try Mula with a small gathering.', ['1 invitation', 'Up to 50 guests', '3 designs', 'RSVP and wishes', 'mula.id link with the Mula mark']], ['onetime', 'One-Time Event', 'Rp 349.000', 'Everything one celebration needs.', ['3 invitations, each in its own language', 'Up to 300 guests', 'All designs and the custom studio', 'Gift registry and gift methods', 'QR codes and print-ready PDFs', 'Keepsake online for 12 months']], ['advanced', 'Advanced Event', 'Rp 799.000', 'For larger and multilingual celebrations.', ['Everything in One-Time Event', '10 invitations, all three languages', 'Up to 1,000 guests', 'Mula AI: writing, translation, follow-ups', 'Check-in, ushers and event day', 'A personal concierge']]].map(x => { const cur = S.pkg === x[0], below = x[0] === 'free' || (x[0] === 'onetime' && advanced); return { id: x[0], n: x[1], price: x[2], sub: x[3], items: x[4], cur, dark: x[0] === 'advanced', cta: cur ? 'Your package' : below ? 'Included' : 'Upgrade · Rp 450.000', dis: cur || below, style: x[0] === 'advanced' ? 'background:var(--ink);color:var(--onink);border-color:var(--ink)' : '' }; });
    const inCart = S.cartL.some(c => c.id === 100);
    const upgrade = () => { if (!inCart) this.setState({ cartL: [...S.cartL, { id: 100, q: 1 }] }); this.setState({ ai: false, newInv: false }); this.nav('cart'); };
    const usage = [['Invitations', active, limit], ['Guests', 247, advanced ? 1000 : 300], ['Gallery photos', 12, advanced ? 60 : 24]].map(u => ({ n: u[0], v: u[1] + ' of ' + u[2].toLocaleString('en'), w: Math.min(100, Math.round(u[1] / u[2] * 100)) + '%', c: u[1] >= u[2] ? 'var(--wt)' : 'var(--ink)' }));
    // print
    const pf = this.fmts[S.pfmt], land = pf.w > pf.h, pinv = S.invs.find(i => i.id == S.pInv) || S.invs[0], ppal = this.pals[pinv.pal], plc = lc[pinv.lang], pic = this.IC[pinv.lang];
    const pr = { ar: pf.w + '/' + pf.h, pw: land ? 'min(600px,100%)' : pf.w === pf.h ? 'min(460px,100%)' : 'min(420px,100%)', wmm: pf.w + 'mm', hmm: pf.h + 'mm', spec: S.pfmt + ' · ' + pf.w + ' × ' + pf.h + ' mm', land, port: !land, bg: ppal.bg, fg: ppal.fg, ac: ppal.ac, photo: grad(ppal), greet: plc.greet, line: plc.line, date: plc.date, reply: pic.reply, scan: pic.scan, url: 'mula.id/' + slug + pinv.path, front: S.pside === 'Front', back: S.pside === 'Back', inv: pinv.name, fs: S.pfmt === 'A6' ? '26px' : land ? '30px' : '38px' };
    const scopeRows = (S.lscope === 'filtered' ? S.gl.filter(g => g.st === 'Attending') : S.gl).slice().sort((a, b) => S.lscope === 'checkin' ? String(a.table).localeCompare(String(b.table)) : a.name.localeCompare(b.name));
    // settings
    const secs2 = [['profile', 'Profile'], ['language', 'Language'], ['appearance', 'Appearance'], ['notifications', 'Notifications'], ['security', 'Security'], ['purchases', 'Purchases'], ['referral', 'Referral']].map(x => ({ id: x[0], n: x[1], on: S.setSec === x[0] ? 'sx on' : 'sx' }));
    const authT = { login: ['Welcome back.', 'Sign in to continue preparing your celebration.', 'Sign in', 'Sebuah mula untuk cerita berikutnya.'], register: ['Let’s begin.', 'Create an account. Your first invitation is free.', 'Create account', 'Something meaningful begins here.'], forgot: ['Forgot your password?', 'Enter your email and we’ll send a link to choose a new one.', 'Send reset link', 'Dari sini, cerita baru bermula.'], sent: ['Check your inbox.', 'We sent a reset link to aldo@example.com. It works for 30 minutes.', 'Open the link', 'Dari sini, cerita baru bermula.'], reset: ['Choose a new password.', 'Use at least 8 characters. A short sentence works well.', 'Save new password', 'A beginning for what comes next.'], verify: ['Confirm your email.', 'We sent a 6-digit code to aldo@example.com.', 'Verify email', 'Satu perayaan, sebuah permulaan.'] }[S.authMode];
    const authO = { h: authT[0], p: authT[1], cta: authT[2], line: authT[3] };
    const am = {}; ['login', 'register', 'forgot', 'sent', 'reset', 'verify'].forEach(k => am[k] = S.authMode === k);
    const pwS = S.pw.length >= 12 ? 3 : S.pw.length >= 8 ? 2 : S.pw.length > 0 ? 1 : 0;
    const ao = this.aiOut(S, { ...ev, host: R.ev.host });
    return {
      L, ev, iv, nav, bnav, allNav, advanced, pageTitle: L.t[S.page] || this.titles[S.page] || '',
      greeting: L.today + ' · ' + (hr < 12 ? L.gm : hr < 18 ? L.ga : L.ge) + ', Aldo', flipCls: S.flip % 2 ? 'main fa' : (S.flip ? 'main fb' : 'main'),
      langs: [['en', 'EN'], ['id', 'ID'], ['ms', 'MS']].map(x => ({ id: x[0], n: x[1], on: S.lang === x[0] ? 'on' : '' })), setLangE: e => this.setLang(this.d(e).v),
      langRows: [['en', 'English'], ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu']].map(x => ({ id: x[0], n: x[1], on: S.lang === x[0] ? 'chip on' : 'chip' })),
      thL: S.theme === 'light' ? 'on' : '', thD: S.theme === 'dark' ? 'on' : '', thS: S.theme === 'system' ? 'on' : '',
      setLight: () => this.setTheme('light'), setDark: () => this.setTheme('dark'), setSystem: () => this.setTheme('system'),
      toggleTheme: () => this.setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'), themeIc: document.documentElement.dataset.theme === 'dark' ? I.sun : I.moon,
      themeOpts: [['light', 'Light', '#F5F3EE', '#272523'], ['dark', 'Dark', '#12110F', '#EEE9DF'], ['system', 'Match device', 'linear-gradient(90deg,#F5F3EE 50%,#12110F 50%)', '#A69A89']].map(x => ({ id: x[0], n: x[1], bg: x[2], fg: x[3], on: S.theme === x[0] ? 'outline:2px solid var(--ink);outline-offset:3px' : '' })), setThemeE: e => this.setTheme(this.d(e).v),
      exportG: () => { this.setState({ ptab: 'lists' }); this.nav('print'); },
      // invitations
      invs, invActive: active, invLimit: limit, atLimit: active >= limit, invMeter: Math.min(100, Math.round(active / limit * 100)) + '%', pkgName: advanced ? 'Advanced Event' : 'One-Time Event',
      editInv: e => { selInv(this.d(e).v); this.nav('invitation'); }, prevInv: e => { selInv(this.d(e).v); this.setState({ previewOpen: true, opened: false, rsvp: '' }); },
      dupInv: e => { if (active >= limit) { this.setState({ newInv: true }); return; } const v = S.invs.find(i => i.id == this.d(e).v); this.setState({ invs: [...S.invs, { ...v, id: Date.now(), name: v.name + ' (copy)', st: 'Draft', views: 0, replies: 0, path: v.path + '-2' }] }); this.say('Duplicated as a draft.'); },
      pubInv: e => { const id = this.d(e).v, v = S.invs.find(i => i.id == id); setInvs(i => i.id == id ? { ...i, st: v.st === 'Published' ? 'Draft' : 'Published' } : null); if (v.st !== 'Published') this.publish(); else this.say('“' + v.name + '” is no longer visible to guests.'); },
      archInv: e => { const id = this.d(e).v, v = S.invs.find(i => i.id == id); if (v.st === 'Archived' && active >= limit) { this.setState({ newInv: true }); return; } setInvs(i => i.id == id ? { ...i, st: v.st === 'Archived' ? 'Draft' : 'Archived' } : null); this.say(v.st === 'Archived' ? 'Restored as a draft.' : 'Archived. Its link now shows a gentle “this invitation has ended” page.'); },
      openNewInv: () => this.setState({ newInv: true, ni: { name: '', aud: 'Friends', lang: S.lang } }), newInv: S.newInv, ni: S.ni,
      setNi: e => this.setState({ ni: { ...S.ni, [e.target.dataset.k]: e.target.value } }),
      createInv: e => { e.preventDefault(); if (active >= limit || !S.ni.name.trim()) return; const id = Date.now(); this.setState({ invs: [...S.invs, { id, name: S.ni.name, aud: S.ni.aud, audN: 0, lang: S.ni.lang, design: S.design, pal: S.pal, path: '/' + S.ni.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16), st: 'Draft', views: 0, replies: 0, tr: { id: S.ni.lang === 'id' ? 100 : 0, en: S.ni.lang === 'en' ? 100 : 0, ms: S.ni.lang === 'ms' ? 100 : 0 } }], newInv: false, curInv: id, plang: S.ni.lang }); this.say('“' + S.ni.name + '” is ready as a draft.'); this.nav('invitation'); },
      ci: { ...ci, langN: lname[ci.lang], url: 'mula.id/' + slug + ci.path }, invOpts: S.invs.filter(i => i.st !== 'Archived').map(i => ({ id: i.id, n: i.name, sel: i.id === S.curInv })), setCurInv: e => selInv(e.target.value),
      plTabs: ['id', 'en', 'ms'].map(k => ({ k, n: lname[k], v: ci.tr[k] + '%', on: S.plang === k ? 'sx on' : 'sx', c: ci.tr[k] === 100 ? 'var(--ok)' : ci.tr[k] > 0 ? 'var(--wt)' : 'var(--line2)', primary: ci.lang === k ? ' · main' : '' })),
      setPlang: e => this.setState({ plang: this.d(e).v, flip: S.flip }), plangN: lname[S.plang], trMissing: ci.tr[S.plang] < 100, trPct: ci.tr[S.plang] + '%',
      translateAi: () => { if (!advanced) { this.setState({ ai: true, aiTask: 'translate', aiShown: false }); return; } setInvs(i => i.id === ci.id ? { ...i, tr: { id: 100, en: 100, ms: 100 } } : null); this.say('Translated. Review the ' + lname[S.plang] + ' version before publishing.'); },
      setGreet: e => this.setState({ itx: { ...S.itx, [S.plang]: { ...S.itx[S.plang], greet: e.target.value } } }), setLine: e => this.setState({ itx: { ...S.itx, [S.plang]: { ...S.itx[S.plang], line: e.target.value } } }),
      pvLangs: ['id', 'en', 'ms'].map(k => ({ k, n: k.toUpperCase(), on: S.plang === k ? 'on' : '' })), pvFlip: S.plang === 'en' ? 'gwrap stg fa' : S.plang === 'ms' ? 'gwrap stg fb' : 'gwrap stg',
      // design studio
      dTpl: S.dmode === 'templates', dCus: S.dmode === 'custom', dmodes: [['templates', 'Templates'], ['custom', 'Custom studio']].map(x => ({ id: x[0], n: x[1], on: S.dmode === x[0] ? 'on' : '' })), setDmode: e => this.setState({ dmode: this.d(e).v }),
      cu, cu0, ctabs, ct, setCtab: e => setCu({ tab: this.d(e).v }), layOpts: opt('layout', ['Centered', 'Editorial', 'Full cover']), frameOpts: opt('frame', ['Arch', 'Soft', 'Full bleed', 'Circle']), motOpts: opt('motion', ['Arch reveal', 'Gentle fade', 'Still']), scaleOpts: opt('scale', ['Quiet', 'Balanced', 'Grand']),
      setCuOpt: e => { setCu({ [this.d(e).k]: this.d(e).v }); this.setState({ replay: S.replay + 1 }); }, replay: () => this.setState({ replay: S.replay + 1 }),
      allPals: this.pals.map((x, i) => ({ i, n: x.n, bg: x.bg, ac: x.ac, fg: x.fg, on: S.pal === i ? 'outline:2px solid var(--ink);outline-offset:3px' : '' })),
      cSecs: cu0.secs.map((s, i) => ({ i, n: s[0], on: s[1] ? 'tog on' : 'tog', ar: String(!!s[1]) })), togSec: e => { const i = +this.d(e).v; setCu({ secs: cu0.secs.map((s, j) => j === i ? [s[0], s[1] ? 0 : 1] : s) }); },
      secUp: e => { const i = +this.d(e).v; if (i < 1) return; const a = cu0.secs.slice(); [a[i - 1], a[i]] = [a[i], a[i - 1]]; setCu({ secs: a }); },
      saveCustom: () => { this.setState({ design: 'Custom · ' + this.pals[S.pal].n, invs: S.invs.map(i => i.id === S.curInv ? { ...i, design: 'Custom · ' + this.pals[S.pal].n, pal: S.pal } : i) }); this.say('Your custom design is saved to “' + ci.name + '”.'); },
      // gifts
      gWays: S.giftTab === 'ways', gReg: S.giftTab === 'registry', gTabs: [['ways', 'Ways to give'], ['registry', 'Registry']].map(x => ({ id: x[0], n: x[1], on: S.giftTab === x[0] ? 'on' : '' })), setGTab: e => this.setState({ giftTab: this.d(e).v }),
      reg, noReg: fresh || !reg.length, hasReg: !fresh && reg.length > 0, regSum: regGot + ' of ' + regQty + ' gifts claimed', regOpen: S.regOpen, nr: S.nr, nrStore: this.store(S.nr.url),
      openReg: () => this.setState({ regOpen: true, nr: { name: '', desc: '', price: '', qty: 1, url: '' } }), setNr: e => this.setState({ nr: { ...S.nr, [e.target.dataset.k]: e.target.value } }),
      addReg: e => { e.preventDefault(); if (!S.nr.name.trim()) return; this.setState({ reg: [...S.reg, { id: Date.now(), name: S.nr.name, desc: S.nr.desc, price: +String(S.nr.price).replace(/\D/g, '') || 0, qty: Math.max(1, +S.nr.qty || 1), got: 0, url: S.nr.url }], regOpen: false }); this.say('Added to your registry.'); },
      delReg: e => this.setState({ reg: S.reg.filter(r => r.id != this.d(e).v) }), regUp: e => this.mv(S.reg, this.d(e).v, -1, a => this.setState({ reg: a })),
      gotReg: e => this.setState({ reg: S.reg.map(r => r.id == this.d(e).v ? { ...r, got: Math.min(r.qty, r.got + 1) } : r) }),
      // packages / purchases
      pkgs, upgrade, pickPkg: e => { const id = this.d(e).v; if (id === 'advanced') upgrade(); },
      aoAvail: R.aoAvail.filter(a => a.cat !== 'Package'), aoOwned: R.aoOwned.filter(a => a.cat !== 'Package'), usage, refCredit: 'Rp 150.000',
      pay: () => { const hasPkg = S.cartL.some(c => c.id === 100), items = S.cartL.map(c => S.addonsL.find(a => a.id === c.id).name).join(', '), sub = S.cartL.reduce((t, c) => t + S.addonsL.find(a => a.id === c.id).p * c.q, 0), tot = sub - Math.round(sub * S.disc);
        this.setState({ cartL: [], disc: 0, txL: [{ id: 'TX-' + (1043 + S.txL.length), date: '31 Oct 2026', desc: items, method: 'QRIS', amt: tot, st: 'Paid' }, ...S.txL], addonsL: S.addonsL.map(a => a.id !== 100 && S.cartL.some(c => c.id === a.id) ? { ...a, st: 'Purchased' } : a), pkg: hasPkg ? 'advanced' : S.pkg });
        this.nav('billing'); if (hasPkg) this.setState({ celebrate: true, celebKind: 'pkg' }); else this.say('Payment completed. Your receipt is in Purchases.'); },
      celebPub: S.celebKind !== 'pkg', celebPkg: S.celebKind === 'pkg', openAiFromCeleb: () => this.setState({ celebrate: false, ai: true, aiShown: false }),
      // print
      pr, ptabs: [['cards', 'Invitation cards'], ['lists', 'Guest lists']].map(x => ({ id: x[0], n: x[1], on: S.ptab === x[0] ? 'on' : '' })), setPtab: e => this.setState({ ptab: this.d(e).v }), pCards: S.ptab === 'cards', pLists: S.ptab === 'lists',
      pfmts: Object.keys(this.fmts).map(n => ({ n, on: S.pfmt === n ? 'on' : '' })), setPfmt: e => this.setState({ pfmt: this.d(e).v }), psides: ['Front', 'Back'].map(n => ({ n, on: S.pside === n ? 'on' : '' })), setPside: e => this.setState({ pside: this.d(e).v }),
      pInvOpts: S.invs.filter(i => i.st !== 'Archived').map(i => ({ id: i.id, n: i.name })), setPInv: e => this.setState({ pInv: +e.target.value }),
      lscopes: [['all', 'Full guest list', 'Everyone, A to Z'], ['filtered', 'Confirmed only', 'Guests who are coming'], ['checkin', 'Check-in sheet', 'By table, with a tick box']].map(x => ({ id: x[0], n: x[1], d: x[2], on: S.lscope === x[0] ? 'card lift on' : 'card lift', st: S.lscope === x[0] ? 'border-color:var(--ink)' : '' })), setLscope: e => this.setState({ lscope: this.d(e).v }),
      plRows: scopeRows.map(g => ({ ...g })), plCheck: S.lscope === 'checkin', plTitle: { all: 'Guest list', filtered: 'Confirmed guests', checkin: 'Check-in sheet' }[S.lscope], printInv: () => this.printNow('invite'), printList: () => this.printNow('list'), csvList: () => this.csv(scopeRows),
      pmInvite: S.printMode === 'invite', pmList: S.printMode === 'list', pvEvents2: this.evs(),
      // settings / referral / auth
      secs2, goSec: e => { const id = this.d(e).v; this.setState({ setSec: id }); const el = document.getElementById('set-' + id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); },
      refStats: [[12, 'Friends invited'], [5, 'Signed up'], [3, 'Celebrated with Mula']].map(x => ({ v: x[0], l: x[1] })),
      refHist: [['Maya Anindita', 'Published her wedding invitation', 'Rp 50.000', '12 Oct'], ['Kevin Halim', 'Signed up', '—', '4 Oct'], ['Dinda Pertiwi', 'Published a birthday invitation', 'Rp 50.000', '28 Sep'], ['Yusuf Rahman', 'Published a product launch', 'Rp 50.000', '15 Sep'], ['Lia Tan', 'Invited', '—', '10 Sep']].map(x => ({ n: x[0], s: x[1], r: x[2], d: x[3], i: this.ini(x[0]), c: this.avc(x[0]) })),
      copyRef: () => { try { navigator.clipboard.writeText('https://mula.id/r/aldo-7k2'); } catch (x) {} this.say('Your referral link is copied.'); },
      sessions: [['MacBook Air · Jakarta', 'This device'], ['iPhone 15 · Jakarta', '2 hours ago'], ['iPad · Bandung', '3 days ago']].map(x => ({ n: x[0], w: x[1] })),
      langMenu: !!S.langMenu, langMenuAr: String(!!S.langMenu), profMenu: !!S.profMenu, profAr: String(!!S.profMenu), langCode: S.lang.toUpperCase(),
      toggleLangMenu: () => this.setState({ langMenu: !S.langMenu, profMenu: false, notifOpen: false }), toggleProf: () => this.setState({ profMenu: !S.profMenu, langMenu: false, notifOpen: false }), closeMenus: () => this.setState({ langMenu: false, profMenu: false }),
      langRows2: [['en', 'English'], ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu']].map(x => ({ id: x[0], n: x[1], c: x[0].toUpperCase(), sel: S.lang === x[0], ar: String(S.lang === x[0]) })), pickLang: e => { this.setLang(this.d(e).v); this.setState({ langMenu: false }); },
      auth: S.auth, am, authT: authO, logout: () => { this.setState({ auth: true, authMode: 'login', pw: '', moreOpen: false, ai: false, profMenu: false }); this.say('You’ve been logged out.'); }, openAuth: e => this.setState({ auth: true, authMode: (e && e.currentTarget && e.currentTarget.dataset.v) || 'login', pw: '', moreOpen: false }), setAuth: e => this.setState({ authMode: this.d(e).v, pw: '' }),
      setPw: e => this.setState({ pw: e.target.value }), pwBars: [1, 2, 3].map(i => ({ c: i <= pwS ? (pwS === 1 ? 'var(--no)' : pwS === 2 ? 'var(--wt)' : 'var(--ok)') : 'var(--line)' })), pwLabel: ['', 'Too short', 'Good', 'Strong'][pwS],
      otpIn: e => { const n = e.target.nextElementSibling; if (e.target.value && n) n.focus(); },
      authGo: e => { e.preventDefault(); const m = S.authMode; if (m === 'login') { this.setState({ auth: false }); this.say('Welcome back, Aldo.'); } else if (m === 'register') this.setState({ authMode: 'verify' }); else if (m === 'forgot') this.setState({ authMode: 'sent' }); else if (m === 'sent') this.setState({ authMode: 'reset', pw: '' }); else if (m === 'reset') { this.setState({ authMode: 'login', pw: '' }); this.say('Password updated. Sign in with your new password.'); } else if (m === 'verify') { this.setState({ auth: false, obOpen: true, ob: 0 }); this.say('Email confirmed. Let’s begin.'); } },
      // AI
      aiOpen: S.ai, aiLocked: !advanced, aiFree: advanced, openAi: e => { const t = e && e.currentTarget && e.currentTarget.dataset.v; this.setState({ ai: true, aiShown: false, moreOpen: false }); if (t && advanced) this.runAi(t); else if (t) this.setState({ aiTask: t }); },
      aiTasks: [['copy', 'Write invitation copy', 'Taglines and opening lines'], ['translate', 'Translate', 'Indonesian, English, Malay'], ['followup', 'Follow up with guests', 'For the 18 who haven’t replied'], ['checklist', 'Build a checklist', 'What’s left, with dates'], ['readiness', 'Readiness review', 'What to fix first'], ['design', 'Design ideas', 'Frame, type and palette']].map(x => ({ id: x[0], n: x[1], d: x[2], on: S.aiTask === x[0] ? 'aitk on' : 'aitk' })),
      pickAi: e => this.runAi(this.d(e).v), aiBusy: S.aiBusy, aiShown: S.aiShown && !S.aiBusy, aiIdle: !S.aiShown && !S.aiBusy, ao, isCopy: S.aiTask === 'copy',
      tones: ['Warm', 'Formal', 'Playful', 'Poetic'].map(n => ({ n, on: S.aiTone === n ? 'chip on' : 'chip' })), setTone: e => { this.setState({ aiTone: this.d(e).v }); this.runAi('copy'); },
      aiQ: S.aiQ, setAiQ: e => this.setState({ aiQ: e.target.value }), askAi: e => { e.preventDefault(); const q = S.aiQ.toLowerCase(); this.runAi(q.includes('translat') || q.includes('terjemah') ? 'translate' : q.includes('remind') || q.includes('follow') ? 'followup' : q.includes('task') || q.includes('check') ? 'checklist' : q.includes('design') || q.includes('colour') ? 'design' : 'copy'); },
      aiAct: e => { const k = this.d(e).k, v = this.d(e).v; if (k === 'use') { this.setState({ itx: { ...S.itx, [S.plang]: { ...S.itx[S.plang], line: v } } }); this.say('New tagline added to “' + ci.name + '”.'); } else if (k === 'copy') { try { navigator.clipboard.writeText(v); } catch (x) {} this.say('Copied.'); } else if (k === 'tr') { this.setState({ invs: S.invs.map(i => i.id === 3 ? { ...i, tr: { id: 100, en: 100, ms: 100 } } : i) }); this.say('Bahasa Melayu version is ready to review.'); } else if (k === 'send') this.say('Sent to 18 guests. Replies will appear in Guests.'); else if (k === 'tasks') { const add = [['Confirm final guest numbers with the venue', '27 Nov'], ['Send seating plan to ushers', '5 Dec'], ['Prepare thank-you message', '10 Dec'], ['Test live stream link with a family member', '9 Dec'], ['Print 4 entrance QR signs', '8 Dec']].map((x, i) => ({ id: Date.now() + i, title: x[0], cat: 'Event day', due: x[1], pri: 'Normal', done: false, ph: 'Later' })); this.setState({ todosL: [...S.todosL, ...add] }); this.say('Five tasks added.'); } else if (k === 'go') { this.setState({ ai: false }); this.nav(v); } else if (k === 'frame' || k === 'scale') { this.setState({ cust: { ...S.cust, [k]: v }, dmode: 'custom', ai: false }); this.nav('design'); } else if (k === 'pal') { this.setState({ pal: +v }); this.say('Sage palette applied to the preview.'); } }
    };
  }
}
