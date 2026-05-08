<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

// Import CSS Leaflet
import 'leaflet/dist/leaflet.css'

// Refs untuk elemen peta dan instance Leaflet
const mapContainer = ref<HTMLElement | null>(null)
let map = null

// Pusatkan peta ke Universitas Indonesia
const center = [-6.3668871, 106.8284798]
const zoom = 15
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

function createColoredMarker(backgroundColor: string, iconClass: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
  position: relative;
  width: 32px;
  height: 44px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6)); /* Shadow with no blur */
">
  <svg viewBox="0 0 74 101" width="32" height="44" style="display: block;">
    <path
      d="M0 3C0 1.34314 1.34315 0 3 0H71C72.6569 0 74 1.34315 74 3V71C74 72.6569 72.6569 74 71 74H57.1598C56.127 74 55.1669 74.5312 54.6182 75.4061L39.5416 99.4472C38.3658 101.322 35.6342 101.322 34.4584 99.4472L19.3818 75.4061C18.8331 74.5312 17.873 74 16.8402 74H3C1.34315 74 0 72.6569 0 71V3Z"
      fill="${backgroundColor}"
      stroke="gray" /* Thin gray outline */
      stroke-width="2" /* Outline thickness */
    />
  </svg>
        <i class="${iconClass}" style="
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 22px;
          color: white;
          text-shadow: 0 0 1px black, 0 0 1px black;
        "></i>
      </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
  })
}

// List Fakultas di UI
const faculties = [
  { name: 'Gedung Rektorat', coords: [-6.3668871, 106.8284798], type: 'gedung', description: 'Pusat administrasi utama Universitas Indonesia.' },
  { name: 'Gedung Balairung', coords: [-6.3680973, 106.829668], type: 'gedung', description: 'Gedung serbaguna yang sering digunakan untuk acara wisuda dan kegiatan akademik besar.' },
  { name: 'Gedung Balai Sidang', coords: [-6.369758, 106.8284664], type: 'gedung', description: 'Tempat penyelenggaraan seminar, konferensi, dan acara akademik lainnya di UI.' },
  { name: 'Masjid Ukhuwah Islamiyah (MUI)', coords: [-6.3658022, 106.8310627], type: 'masjid', description: 'Masjid utama Universitas Indonesia yang menjadi pusat kegiatan keagamaan.' },
  { name: 'Ruang Rapat Terapung', coords: [-6.365815, 106.830285], type: 'ruang', description: 'Ruang pertemuan unik di atas danau UI, sering digunakan untuk diskusi dan rapat penting.' },
  { name: 'Fakultas Ilmu Farmasi', coords: [-6.368359, 106.826044], type: 'university', description: 'Fakultas yang berfokus pada pendidikan dan penelitian di bidang farmasi.' },
  { name: 'Fakultas Kesehatan Masyarakat', coords: [-6.370768, 106.829274], type: 'university', description: 'Fakultas yang mendalami isu kesehatan masyarakat dan kebijakan kesehatan.' },
  { name: 'Fakultas Ilmu Matematika dan Ilmu Pengetahuan Alam', coords: [-6.369169, 106.826388], type: 'university', description: 'Fakultas yang membawahi program studi matematika dan sains dasar.' },
  { name: 'Fakultas Ilmu Keperawatan', coords: [-6.372784, 106.829209], type: 'university', description: 'Fakultas yang menyelenggarakan pendidikan di bidang keperawatan.' },
  { name: 'Fakultas Ekonomi', coords: [-6.360191, 106.82672], type: 'university', description: 'Fakultas dengan fokus pada ekonomi, manajemen, dan akuntansi.' },
  { name: 'Fakultas Teknik', coords: [-6.362078, 106.824006], type: 'university', description: 'Fakultas yang menaungi berbagai jurusan teknik.' },
  { name: 'Fakultas Ilmu Budaya', coords: [-6.363432, 106.827804], type: 'university', description: 'Fakultas yang mendalami studi budaya, bahasa, dan sastra.' },
  { name: 'Fakultas Ilmu Sosial dan Ilmu Politik', coords: [-6.362227, 106.829638], type: 'university', description: 'Fakultas dengan fokus pada ilmu sosial, politik, dan hubungan internasional.' },
  { name: 'Fakultas Psikologi', coords: [-6.363204, 106.830789], type: 'university', description: 'Fakultas yang mendalami studi psikologi dan perilaku manusia.' },
  { name: 'Fakultas Hukum', coords: [-6.364605, 106.831336], type: 'university', description: 'Fakultas yang menyelenggarakan pendidikan hukum dan kajian yuridis.' },
  { name: 'Pusat Administrasi Universitas Indonesia', coords: [-6.366892, 106.828485], type: 'gedung', description: 'Gedung utama untuk kegiatan administrasi UI.' },
  { name: 'Fakultas Kedokteran Gigi', coords: [-6.194571, 106.848242], type: 'university', description: 'Fakultas yang menyelenggarakan pendidikan dokter gigi.' },
  { name: 'Fakultas Kedokteran', coords: [-6.194928, 106.848854], type: 'university', description: 'Fakultas yang mendalami ilmu kedokteran dan kesehatan.' },
  { name: 'Fakultas Ilmu Komputer', coords: [-6.364461, 106.828796], type: 'university', description: 'Fakultas yang fokus pada ilmu komputer dan teknologi informasi.' },
  { name: 'Penerimaan Mahasiswa Baru', coords: [-6.369878, 106.828474], type: 'office', description: 'Kantor layanan untuk penerimaan mahasiswa baru UI.' },
  { name: 'Rumpun Kesehatan', coords: [-6.369228, 106.830636], type: 'gedung', description: 'Kompleks fakultas-fakultas rumpun ilmu kesehatan.' },
  { name: 'Career Development Centre', coords: [-6.365144, 106.823979], type: 'office', description: 'Pusat pengembangan karier mahasiswa dan alumni UI.' },
  { name: 'Radio Mahasiswa', coords: [-6.365757, 106.824059], type: 'community_centre', description: 'Stasiun radio mahasiswa Universitas Indonesia.' },
  { name: 'Information Technology Training Centre', coords: [-6.365597, 106.826366], type: 'gedung', description: 'Pusat pelatihan teknologi informasi di UI.' },
  { name: 'Bank Negara Indonesia', coords: [-6.365288, 106.82951], type: 'bank', description: 'Cabang Bank Negara Indonesia di dalam kampus UI.' },
  { name: 'Bank CIMB Niaga', coords: [-6.361321, 106.825401], type: 'bank', description: 'Cabang Bank CIMB Niaga di dalam kampus UI.' },
  { name: 'Bank Mandiri', coords: [-6.361433, 106.825433], type: 'bank', description: 'Cabang Bank Mandiri di lingkungan UI.' },
  { name: 'Bank Rakyat Indonesia', coords: [-6.363528, 106.831162], type: 'bank', description: 'Cabang Bank BRI di dalam kawasan kampus UI.' },
  { name: 'Layanan Hotspot JUITA dan Sistem Informasi', coords: [-6.367287, 106.828217], type: 'office', description: 'Layanan jaringan internet dan informasi kampus UI.' },
  { name: 'Gerbang Utama', coords: [-6.358901, 106.831248], type: 'entrance', description: 'Gerbang utama masuk ke kawasan Universitas Indonesia.' },
  { name: 'Program Vokasi', coords: [-6.369105, 106.820932], type: 'university', description: 'Program pendidikan vokasi Universitas Indonesia.' },
  { name: 'Masjid Universitas Indonesia', coords: [-6.366077, 106.831205], type: 'masjid', description: 'Masjid pusat Universitas Indonesia.' },
  { name: 'Pusat Kesehatan Mahasiswa', coords: [-6.37225, 106.82907], type: 'hospital', description: 'Fasilitas kesehatan untuk mahasiswa UI.' },
  { name: 'Kantin Asrama UI', coords: [-6.371595, 106.828843], type: 'restaurant', description: 'Kantin yang terletak di kawasan asrama mahasiswa UI.' },
  { name: 'Kantin FIK', coords: [-6.373514, 106.829125], type: 'restaurant', description: 'Kantin di lingkungan Fakultas Ilmu Keperawatan.' },
  { name: 'Kantin Teknik Sipil', coords: [-6.361671, 106.823999], type: 'restaurant', description: 'Tempat makan di sekitar jurusan Teknik Sipil UI.' },
  { name: 'Kantin Fakultas Teknik', coords: [-6.361608, 106.82472], type: 'restaurant', description: 'Kantin yang melayani mahasiswa Fakultas Teknik.' },
  { name: 'Kantin FIB', coords: [-6.363299, 106.827565], type: 'restaurant', description: 'Kantin Fakultas Ilmu Budaya UI.' },
  { name: 'Kantin Pusat', coords: [-6.365036, 106.82669], type: 'restaurant', description: 'Kantin utama yang melayani seluruh civitas akademika UI.' },
  { name: 'Kantin FH', coords: [-6.364664, 106.831459], type: 'restaurant', description: 'Kantin Fakultas Hukum Universitas Indonesia.' },
  { name: 'Kantin FEB', coords: [-6.360018, 106.826517], type: 'restaurant', description: 'Kantin Fakultas Ekonomi dan Bisnis UI.' },
  { name: 'Kantin FISIP', coords: [-6.36259, 106.829408], type: 'restaurant', description: 'Kantin Fakultas Ilmu Sosial dan Ilmu Politik UI.' },
  { name: 'Kantin Pusat Studi Jepang', coords: [-6.363406, 106.826765], type: 'restaurant', description: 'Kantin di sekitar Pusat Studi Jepang UI.' },
  { name: 'Lapangan FISIP UI', coords: [-6.362922, 106.828924], type: 'sports_complex', description: 'Lapangan olahraga di lingkungan FISIP UI.' },
  { name: 'Lapangan Sepakbola UI', coords: [-6.360278, 106.830301], type: 'sports_complex', description: 'Lapangan sepakbola utama Universitas Indonesia.' },
  { name: 'Lapangan Basket Asrama UI', coords: [-6.371708, 106.828321], type: 'sports_complex', description: 'Fasilitas basket yang tersedia di area asrama UI.' },
  { name: 'Lapangan Softball UI', coords: [-6.366122, 106.820703], type: 'sports_complex', description: 'Lapangan softball resmi Universitas Indonesia.' },
  { name: 'Lapangan Basket FEB', coords: [-6.360293, 106.826693], type: 'sports_complex', description: 'Lapangan basket di kawasan FEB UI.' },
  { name: 'GOR UI', coords: [-6.370215, 106.820229], type: 'sports_complex', description: 'Gedung Olahraga UI untuk berbagai kegiatan olahraga indoor.' },
  { name: 'Stasiun UI', coords: [-6.364702, 106.832686], type: 'station', description: 'Stasiun kereta yang melayani akses ke kampus UI.' },
  { name: 'Stasiun Pondok Cina', coords: [-6.359887, 106.835201], type: 'station', description: 'Stasiun kereta terdekat dari pintu masuk selatan UI.' },
  { name: 'Asrama UI', coords: [-6.372182, 106.828781], type: 'accommodation', description: 'Kompleks hunian mahasiswa Universitas Indonesia.' },
  { name: 'Asrama Mahasiswa Internasional', coords: [-6.370817, 106.829439], type: 'accommodation', description: 'Asrama khusus untuk mahasiswa internasional di UI.' },
  { name: 'Asrama Mahasiswa Putri', coords: [-6.371278, 106.828507], type: 'accommodation', description: 'Asrama untuk mahasiswi Universitas Indonesia.' },
  { name: 'Asrama Mahasiswa Putra', coords: [-6.371844, 106.828264], type: 'accommodation', description: 'Asrama untuk mahasiswa putra Universitas Indonesia.' },
  { name: 'Taman dan Danau UI', coords: [-6.361253, 106.829644], type: 'park', description: 'Taman dan danau sebagai tempat rekreasi dan relaksasi di UI.' },
  { name: 'Danau Kenanga', coords: [-6.366379, 106.830089], type: 'park', description: 'Salah satu danau utama di lingkungan kampus UI.' },
  { name: 'Perpustakaan Pusat Universitas Indonesia', coords: [-6.36715, 106.827442], type: 'library', description: 'Perpustakaan pusat terbesar di Universitas Indonesia.' },
  { name: 'Perpustakaan Pusat Universitas Indonesia (Crystal of Knowledge)', coords: [-6.365288, 106.83000], type: 'library', description: 'Perpustakaan pusat terbesar di Universitas Indonesia.' },
  { name: 'Gedung IASTH', coords: [-6.194231, 106.847769], type: 'gedung', description: 'Gedung IASTH yang digunakan untuk pelatihan dan riset kesehatan tropis.' },
  { name: 'Fakultas Ilmu Administrasi', coords: [-6.360664, 106.825404], type: 'university', description: 'Fakultas yang menyelenggarakan program studi administrasi.' },
  { name: 'Kantin FIA', coords: [-6.360564, 106.82536], type: 'restaurant', description: 'Kantin Fakultas Ilmu Administrasi UI.' },
]

// Inisialisasi peta saat komponen dipasang
const typeStyles = {
  gedung: { color: '#F6C634', icon: 'ri-building-4-fill' },
  masjid: { color: '#3927DD', icon: 'ri-home-heart-fill' },
  ruang: { color: '#F6C634', icon: 'ri-door-fill' },
  money: { color: '#3927DD', icon: 'ri-bank-fill' },
  bus: { color: '#3927DD', icon: 'ri-bus-fill' },
  station: { color: '#4D41BA', icon: 'ri-train-line' },
  motorcycle: { color: '#4D41BA', icon: 'ri-motorbike-line' },
  motorcycle_parking: { color: '#4D41BA', icon: 'ri-motorbike-line' },
  hospital: { color: '#EE1F3A', icon: 'ri-hospital-line' },
  food: { color: '#37CF5F', icon: 'ri-restaurant-2-line' },
  university: { color: '#F6C634', icon: 'ri-school-fill' },
  tempat: { color: '#F6C634', icon: 'ri-map-pin-fill' },
  food_court: { color: '#832B83', icon: 'ri-restaurant-fill' },
  restaurant: { color: '#832B83', icon: 'ri-restaurant-line' },
  office: { color: '#832B83', icon: 'ri-building-line' },
  bus_station: { color: '#4D41BA', icon: 'ri-bus-2-line' },
  community_centre: { color: '#37CF5F', icon: 'ri-community-line' },
  bank: { color: '#3927DD', icon: 'ri-bank-fill' },
  theatre: { color: '#832B83', icon: 'ri-movie-2-fill' },
  pitch: { color: '#37CF5F', icon: 'ri-football-fill' },
  library: { color: '#4D41BA', icon: 'ri-book-3-fill' },
  parking: { color: '#3927DD', icon: 'ri-parking-box-fill' },
  place_of_worship: { color: '#3927DD', icon: 'ri-home-heart-fill' },
  sports_complex: { color: '#37CF5F', icon: 'ri-run-line' },
  park: { color: '#37CF5F', icon: 'ri-tree-fill' },
  accommodation: { color: '#832B83', icon: 'ri-hotel-fill' },
  entrance: { color: '#3927DD', icon: 'ri-door-open-fill' },
}

// Default fallback style
const defaultStyle = { color: '#17E54E', icon: 'ri-map-pin-fill' }

onMounted(async () => {
  await nextTick()
  if (typeof window === 'undefined' || !mapContainer.value)
    return

  const L = await import('leaflet') // Import dynamically

  map = L.map(mapContainer.value).setView(center, zoom)

  L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    minZoom: 12,
    subdomains: ['a', 'b', 'c'],
  }).addTo(map)

  // Fix missing marker icons
  const markerIcon = new L.Icon({
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  faculties.forEach(faculty => {
    const { color, icon } = typeStyles[faculty.type] || defaultStyle

    const customIcon = createColoredMarker(color, icon)

    L.marker(faculty.coords, { icon: customIcon })
      .addTo(map)
      .bindPopup(`<h3 style="color:#333">${faculty.name}</h3><p>${faculty.description}</p>`)
  })
})
</script>

<template>
  <ClientOnly>
    <div class="map-container">
      <div
        ref="mapContainer"
        class="map"
      />
    </div>
  </ClientOnly>
</template>

<style scoped>
.map-container {
  position: relative;
  z-index: 0;

  /* Styles from .v-card */
  display: block;
  overflow: hidden;
  padding: 0;
  border-width: 0;
  border-style: solid;
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;

  /* Styles from .v-card--variant-elevated and .v-card--variant-flat */
  background: rgb(var(--v-theme-surface));
  block-size: 500px;
  box-shadow: 0 4px 10px 0 rgba(var(--v-shadow-key-umbra-color), var(--v-shadow-md-opacity)), 0 0 transparent, 0 0 transparent;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  inline-size: 100%;
  overflow-wrap: break-word;
  text-decoration: none;
  transition-duration: 0.28s;
  transition-property: box-shadow, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.map {
  block-size: 100%;
  inline-size: 100%;
  min-block-size: 400px;
}

.leaflet-popup-content h3 {
  color: #333 !important;
}
</style>
