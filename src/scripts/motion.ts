/**
 * motion.ts — Motor de animaciones premium para Marketing Week 2026
 * - Lenis Smooth Scrolling (60/120Hz sin jitter)
 * - GSAP + ScrollTrigger sincronizado
 * - Parallax 3D multicapa en Hero (Fondo "26" + Marki Valle)
 * - 3D Mouse Tilt en la placa de Marki Valle
 * - Kinetic Typography & Word Masks en titulares
 * - Marquee reactivo a la velocidad del scroll
 * - Stagger reveal en tarjetas de Instagram y fixture
 */
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Verificar preferencia de reducción de movimiento
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Inicialización de Lenis
let lenis: Lenis | null = null;

if (!prefersReducedMotion) {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.8,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

// Navegación suave por anclas internas
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href && href !== '#' && href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target as HTMLElement, { offset: -70, duration: 1.2 });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });
});

// 1. Text Reveal cinético del Hero
function initHeroTextReveal() {
  const words = document.querySelectorAll('.hero__title-word');
  if (words.length > 0) {
    gsap.fromTo(
      words,
      { yPercent: 110, opacity: 0, rotateZ: 2 },
      {
        yPercent: 0,
        opacity: 1,
        rotateZ: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.16,
        delay: 0.15
      }
    );
  }

  const eyebrow = document.querySelector('.hero .eyebrow');
  const badge = document.querySelector('.hero .badge-rubberhose');
  const lead = document.querySelector('.hero .lead');
  const cta = document.querySelector('.hero__cta');
  const facts = document.querySelector('.hero__facts');

  if (eyebrow && badge) {
    gsap.fromTo(
      [eyebrow, badge],
      { y: -18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.05 }
    );
  }

  if (lead && cta && facts) {
    gsap.fromTo(
      [lead, cta, facts],
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.45 }
    );
  }
}

// 2. Parallax 3D Multicapa en el Hero
function initHeroParallax() {
  if (prefersReducedMotion) return;

  const hero = document.querySelector('.hero');
  const bgNum = document.querySelector('.hero-bg-num');
  const plate = document.querySelector('.plate');

  if (hero && bgNum) {
    gsap.to(bgNum, {
      yPercent: -35,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  if (hero && plate) {
    gsap.to(plate, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }
}

// 3. 3D Mouse Tilt en la placa de Marki Valle
function initPlateTilt() {
  const plate = document.querySelector('.plate') as HTMLElement;
  if (!plate || prefersReducedMotion) return;

  const img = plate.querySelector('.plate__img') as HTMLElement;
  const tag = plate.querySelector('.plate__tag') as HTMLElement;
  const back = plate.querySelector('.plate__back') as HTMLElement;

  let isHovered = false;

  plate.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  plate.addEventListener('mousemove', (e) => {
    if (!isHovered) return;
    const rect = plate.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 a 0.5
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(plate, {
      rotationY: normX * 18,
      rotationX: -normY * 18,
      transformPerspective: 800,
      ease: 'power2.out',
      duration: 0.35
    });

    if (img) {
      gsap.to(img, {
        x: normX * 12 + 16,
        y: normY * 12 - 10,
        ease: 'power2.out',
        duration: 0.35
      });
    }

    if (back) {
      gsap.to(back, {
        x: -normX * 8,
        y: -normY * 8,
        ease: 'power2.out',
        duration: 0.35
      });
    }

    if (tag) {
      gsap.to(tag, {
        x: normX * 22,
        y: normY * 22,
        scale: 1.08,
        ease: 'power2.out',
        duration: 0.25
      });
    }
  });

  plate.addEventListener('mouseleave', () => {
    isHovered = false;
    gsap.to(plate, {
      rotationY: 0,
      rotationX: 0,
      ease: 'elastic.out(1, 0.45)',
      duration: 0.9
    });

    if (img) gsap.to(img, { x: 16, y: -10, ease: 'power2.out', duration: 0.5 });
    if (back) gsap.to(back, { x: 0, y: 0, ease: 'power2.out', duration: 0.5 });
    if (tag) gsap.to(tag, { x: 0, y: 0, scale: 1, ease: 'power2.out', duration: 0.5 });
  });
}

// 4. Marquee acelerado por inercia de scroll
function initVelocityMarquee() {
  if (prefersReducedMotion) return;

  const track = document.getElementById('bandTrack');
  if (!track) return;

  let currentSkew = 0;

  ScrollTrigger.create({
    onUpdate: (self) => {
      const velocity = self.getVelocity();
      // Si el usuario scrollea rápido, añadimos un skew o aceleración visual temporal
      const targetSkew = Math.max(Math.min(velocity / 300, 6), -6);
      if (Math.abs(targetSkew - currentSkew) > 0.5) {
        currentSkew = targetSkew;
        gsap.to(track, {
          skewX: targetSkew,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    }
  });
}

// 5. Animación de revelado para títulos de sección (Kinetic Section Reveal)
function initSectionReveals() {
  if (prefersReducedMotion) return;

  const sectionHeadings = document.querySelectorAll('.sec .display, .sec-head .display');

  sectionHeadings.forEach((heading) => {
    gsap.fromTo(
      heading,
      { y: 36, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: heading,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  // Stagger en tarjetas del muro social de Instagram
  const socialCards = document.querySelectorAll('.social-card');
  if (socialCards.length > 0) {
    gsap.fromTo(
      socialCards,
      { y: 40, opacity: 0, scale: 0.96 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.75,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: '.social-grid',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }



  // Animación de la tarjeta del mapa con Marki Valle Explorador
  const explorerCard = document.querySelector('.map-explorer-card');
  if (explorerCard) {
    gsap.fromTo(
      explorerCard,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.map',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }
}

// Inicialización tras montaje del DOM
function initMotion() {
  initHeroTextReveal();
  initHeroParallax();
  initPlateTilt();
  initVelocityMarquee();
  initSectionReveals();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMotion);
} else {
  initMotion();
}
