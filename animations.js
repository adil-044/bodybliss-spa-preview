/* PediNNails — premium scroll + interaction layer */
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ── Loader ── */
  const loader = document.querySelector(".loader");
  window.addEventListener("load", () => {
    setTimeout(() => {
      loader?.classList.add("is-done");
      ScrollTrigger.refresh();
    }, 400);
  });

  /* ── Lenis smooth scroll ── */
  let lenis;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);

    /* Lenis + ScrollTrigger pin compatibility */
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    ScrollTrigger.addEventListener("refresh", () => lenis.resize());

    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── Scroll progress ── */
  const progressBar = document.querySelector(".scroll-progress span");
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      if (progressBar) progressBar.style.width = `${self.progress * 100}%`;
    },
  });

  /* ── Nav scroll state ── */
  const nav = document.querySelector("[data-nav]");
  ScrollTrigger.create({
    start: 80,
    onUpdate: (self) => nav?.classList.toggle("is-scrolled", self.scroll() > 80),
  });

  /* ── Hero entrance ── */
  const heroTl = gsap.timeline({ delay: 0.5 });
  heroTl
    .to(".hero h1 .word", {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.08,
      ease: "power4.out",
    })
    .to(
      ".split-fade",
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.5"
    )
    .to(
      ".hero__frame",
      { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out" },
      "-=0.8"
    )
    .to(
      ".hero__float-card",
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.6"
    )
    .to(
      ".scroll-hint",
      { opacity: 1, duration: 0.6 },
      "-=0.3"
    );

  /* Hero parallax on scroll */
  gsap.to(".hero__frame img", {
    yPercent: 15,
    ease: "none",
    scrollTrigger: {
      trigger: "[data-hero]",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });

  gsap.to(".hero__orbs .orb-1", {
    y: 120,
    ease: "none",
    scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
  });

  /* ── Stat counters ── */
  document.querySelectorAll(".stat").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const strong = el.querySelector("strong");
    if (!strong) return;

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.8,
          ease: "power2.out",
          onUpdate: () => {
            const v = target % 1 !== 0 ? obj.val.toFixed(1) : Math.round(obj.val);
            strong.textContent = `${v}${suffix}`;
          },
        });
      },
    });
  });

  /* ── Horizontal services scroll (GSAP pin + scrub) ── */
  const hTrack = document.querySelector(".h-scroll__track");
  const hScroll = document.querySelector("[data-h-scroll]");
  if (hTrack && hScroll && window.innerWidth >= 768) {
    const getScroll = () => hTrack.scrollWidth - window.innerWidth + 80;
    gsap.to(hTrack, {
      x: () => -getScroll(),
      ease: "none",
      scrollTrigger: {
        trigger: "[data-pin-section]",
        start: "top top",
        end: () => `+=${getScroll()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  /* Drag for horizontal areas (mobile + desktop) */
  function enableDrag(container, trackSelector) {
    const containerEl = typeof container === "string" ? document.querySelector(container) : container;
    const track = containerEl?.querySelector(trackSelector);
    if (!containerEl || !track) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onDown = (e) => {
      isDown = true;
      containerEl.classList.add("is-dragging");
      startX = (e.pageX || e.touches?.[0]?.pageX) - containerEl.offsetLeft;
      scrollLeft = containerEl.scrollLeft || 0;
      // For transform-based track, store current x
      track._dragX = gsap.getProperty(track, "x") || 0;
      track._startX = (e.pageX || e.touches?.[0]?.pageX);
    };

    const onMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e.pageX || e.touches?.[0]?.pageX);
      const walk = (x - track._startX) * 1.2;
      const newX = track._dragX + walk;
      const minX = -(track.scrollWidth - window.innerWidth + 40);
      gsap.set(track, { x: Math.max(minX, Math.min(0, newX)) });
    };

    const onUp = () => {
      isDown = false;
      containerEl.classList.remove("is-dragging");
    };

    containerEl.addEventListener("mousedown", onDown);
    containerEl.addEventListener("mousemove", onMove);
    containerEl.addEventListener("mouseup", onUp);
    containerEl.addEventListener("mouseleave", onUp);
    containerEl.addEventListener("touchstart", onDown, { passive: true });
    containerEl.addEventListener("touchmove", onMove, { passive: false });
    containerEl.addEventListener("touchend", onUp);
  }

  enableDrag("[data-h-scroll]", ".h-scroll__track");
  enableDrag("[data-gallery-drag]", ".gallery-drag__track");

  /* Gallery horizontal scroll on wheel */
  const galleryDrag = document.querySelector("[data-gallery-drag]");
  const galleryTrack = document.querySelector(".gallery-drag__track");
  if (galleryDrag && galleryTrack) {
    galleryDrag.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          const current = gsap.getProperty(galleryTrack, "x") || 0;
          const minX = -(galleryTrack.scrollWidth - window.innerWidth + 40);
          const next = Math.max(minX, Math.min(0, current - e.deltaY * 0.8));
          gsap.to(galleryTrack, { x: next, duration: 0.5, ease: "power3.out" });
        }
      },
      { passive: false }
    );
  }

  /* ── About stack cards — GSAP pin (not CSS sticky) ── */
  const aboutSection = document.querySelector("[data-about-pin]");
  const aboutSticky = document.querySelector(".about-pin__sticky");
  const stackCards = gsap.utils.toArray(".stack-card");

  ScrollTrigger.matchMedia({
    "(min-width: 768px)": () => {
      if (!aboutSection || !aboutSticky || stackCards.length < 3) return;

      gsap.set(stackCards[0], { yPercent: 0, opacity: 1, scale: 1 });
      gsap.set(stackCards[1], { yPercent: 110, opacity: 0, scale: 0.96 });
      gsap.set(stackCards[2], { yPercent: 110, opacity: 0, scale: 0.96 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: aboutSection,
          pin: aboutSticky,
          pinSpacing: true,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 2.8)}`,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(stackCards[1], {
        yPercent: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power2.out",
      })
        .to(
          stackCards[0],
          { scale: 0.94, opacity: 0.35, duration: 0.55, ease: "power2.out" },
          "<0.35"
        )
        .to(stackCards[2], {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power2.out",
        })
        .to(
          stackCards[1],
          { scale: 0.94, opacity: 0.35, duration: 0.55, ease: "power2.out" },
          "<0.35"
        )
        .to({}, { duration: 0.35 });
    },

    "(max-width: 767px)": () => {
      gsap.set(stackCards, { clearProps: "all" });
      stackCards.forEach((card, i) => {
        gsap.from(card, {
          y: 36,
          opacity: 0,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
      });
    },
  });

  /* ── Reveal sections ── */
  gsap.utils.toArray(".pin-section__head, .gallery-section__head, .visit-copy, .reviews-section .title").forEach((el) => {
    gsap.from(el, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
    });
  });

  gsap.utils.toArray(".review-card").forEach((card, i) => {
    gsap.from(card, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      delay: i * 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 90%", toggleActions: "play none none none" },
    });
  });

  /* Book CTA reveal */
  gsap.to(".book-cta__bg", {
    scaleY: 1,
    ease: "power3.inOut",
    scrollTrigger: {
      trigger: "[data-book-cta]",
      start: "top 70%",
      end: "top 20%",
      scrub: 1,
    },
  });

  gsap.from(".book-cta__inner > *", {
    y: 40,
    opacity: 0,
    stagger: 0.12,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: {
      trigger: "[data-book-cta]",
      start: "top 60%",
      toggleActions: "play none none none",
    },
  });

  /* ── 3D tilt cards ── */
  if (finePointer && !reduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateY: x * 12,
          rotateX: -y * 12,
          transformPerspective: 800,
          duration: 0.4,
          ease: "power2.out",
        });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.5)",
        });
      });
    });
  }

  /* ── Custom cursor ── */
  if (finePointer && !reduced) {
    const cursor = document.querySelector(".cursor");
    const dot = document.querySelector(".cursor-dot");
    let mx = 0,
      my = 0,
      cx = 0,
      cy = 0;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot) {
        dot.style.left = `${mx}px`;
        dot.style.top = `${my}px`;
      }
    });

    const tick = () => {
      cx += (mx - cx) * 0.15;
      cy += (my - cy) * 0.15;
      if (cursor) {
        cursor.style.left = `${cx}px`;
        cursor.style.top = `${cy}px`;
      }
      requestAnimationFrame(tick);
    };
    tick();

    document.querySelectorAll("a, button, [data-magnetic]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor?.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor?.classList.remove("is-hover"));
    });
  }

  /* ── Magnetic buttons ── */
  if (finePointer && !reduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      });
    });
  }

  /* Refresh on resize */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
})();
