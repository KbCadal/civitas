<script lang="ts" setup>
import logo from '@images/beranda/ui-logo-white-makara.svg?raw'
</script>

<template>
  <footer class="app-footer">
    <div class="footer-top">
      <div class="footer-inner">
        <!-- Logo (SVG inline) -->
        <div class="footer-col footer-col--logo">
          <div class="logo-wrap">
            <div
              class="logo-img"
              style="display: inline-block; block-size: 150px; line-height: 0; max-block-size: 150px;"
              v-html="logo"
            />
          </div>
        </div>

        <!-- Center: Layanan Informasi -->
        <div class="footer-col footer-col--center">
          <div class="layanan">
            <div class="layanan-title">
              Layanan Informasi
            </div>
            <div class="layanan-sub">
              Universitas Indonesia
            </div>
          </div>
        </div>

        <!-- Right: Help Desk + Socials -->
        <div class="footer-col footer-col--contact">
          <div class="help-title">
            Help Desk
          </div>
          <div class="contact-list">
            <div class="contact-item">
              <VIcon icon="ri-phone-line" /> <span>021 1500 002</span>
            </div>
            <div class="contact-item">
              <VIcon icon="ri-whatsapp-line" /> <span>0815 1500 0002</span>
            </div>
            <div class="contact-item">
              <VIcon icon="ri-mail-line" /> <span>humas-ui@ui.ac.id</span>
            </div>
          </div>

          <div class="social-icons">
            <a
              class="social-btn"
              href="https://twitter.com/univ_indonesia"
              target="_blank"
              rel="noopener noreferrer"
            >
              <VIcon icon="ri-twitter-line" />
            </a>
            <a
              class="social-btn"
              href="https://www.linkedin.com/school/university-of-indonesia/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <VIcon icon="ri-linkedin-box-line" />
            </a>
            <a
              class="social-btn"
              href="https://www.youtube.com/channel/UCN7ilwf35POP97PVsweyDsw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <VIcon icon="ri-youtube-line" />
            </a>
            <a
              class="social-btn"
              href="https://www.instagram.com/univ_indonesia"
              target="_blank"
              rel="noopener noreferrer"
            >
              <VIcon icon="ri-instagram-line" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <!-- theme-colored background behind the rounded black copyright box -->
      <div class="footer-bottom-inner">
        <div class="copyright-box">
          2025 Hak Cipta, Universitas Indonesia
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
@use "@configured-variables" as variables;

/* Top row uses theme primary color */
.app-footer {
  color: rgb(var(--v-theme-on-primary));
}

.footer-top {
  background: rgb(var(--v-theme-primary));
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center; /* center vertically */
  justify-content: space-between;
  gap: 1.5rem;
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: variables.$layout-boxed-content-width;
  padding-block: 2rem;
  padding-inline: 1rem;
}

.footer-col {
  box-sizing: border-box;
}

.footer-col--logo {
  flex: 1 1 200px;
  order: 1;
  text-align: end;
}

.footer-col--center {
  display: flex;
  flex: 1 1 300px;
  align-items: center;
  justify-content: center;
  order: 2;
  text-align: center;
}

.footer-col--contact {
  flex: 1 1 260px;
  order: 3;
  text-align: start;
}
.logo-wrap { display: flex; justify-content: flex-end; }
.logo-img { display: block; inline-size: auto; margin-block: 0; margin-inline: 0; max-block-size: 150px; }
.layanan-title { font-size: 1.125rem; font-weight: 700; }
.layanan-sub { margin-block-start: 0.25rem; }
.help-title { font-weight: 700; }
.contact-list { margin-block-start: 0.75rem; }
.contact-item { display: flex; align-items: center; gap: 0.5rem; margin-block-end: 0.5rem; }
.social-icons { display: flex; gap: 0.5rem; margin-block-start: 1rem; }
.social-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background-color: rgb(var(--v-theme-on-primary)); block-size: 40px; color: rgb(var(--v-theme-primary)); inline-size: 40px; text-decoration: none; transition: background-color 0.18s ease, color 0.18s ease, transform 0.12s ease; }

/* make the icon inherit the button color so hover can swap both background and icon color */
.social-btn .v-icon,
.social-btn svg { color: inherit !important; fill: inherit !important; }

/* hover/focus effect: lighter tint of theme color, subtle lift, and icon scale for better contrast */
.social-btn:hover,
.social-btn:focus {
  /* fallback heavy color for older browsers */
  background: rgb(var(--v-theme-primary));

  /* preferred: mix theme color with white to create a lighter tint */
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 60%, rgb(var(--v-theme-on-primary)) 40%);
  box-shadow: 0 6px 14px color-mix(in srgb, rgb(var(--v-theme-primary)) 12%, transparent);

  /* give the icon a darker theme color for contrast against the lighter tint */
  color: rgb(var(--v-theme-primary));
  transform: translateY(-3px);
}

/* slightly scale the icon on hover so the change is visually clear */
.social-btn:hover .v-icon,
.social-btn:focus .v-icon {
  transform: scale(1.08);
}

/* footer-bottom: theme background with a centered black rounded copyright box on top */
.footer-bottom { background: rgb(var(--v-theme-primary)); }
.footer-bottom-inner { margin-block: 0; margin-inline: auto; max-inline-size: variables.$layout-boxed-content-width; padding-inline: 1rem; }
.copyright-box { background: #000; border-start-end-radius: 12px; border-start-start-radius: 12px; color: #fff; padding-block: 0.75rem; text-align: center; }

@media (max-width: 768px) {
  .footer-inner { flex-direction: column; align-items: center; padding: 1.25rem; }
  .footer-col--center { order: 2; inline-size: 100%; }
  .footer-col--contact { order: 3; inline-size: 100%; text-align: center; }
  .footer-col--logo { order: 1; inline-size: 100%; text-align: center; }
  .logo-img { margin-block: 0; margin-inline: auto; }
}
</style>
