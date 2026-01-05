/* Portfolio interactions: nav toggle, header shadow, typed hero, reveal, skills, contact, theme */
(function(){
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  const toastEl = document.getElementById('toast');

  // Mobile nav toggle
  if(navToggle && mainNav){
    navToggle.addEventListener('click', ()=>{
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // header shadow on scroll
  const onScroll = ()=>{
    if(window.scrollY > 20) header.classList.add('scrolled'); else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // Smooth scroll for internal links and active section highlighting
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
  const sections = document.querySelectorAll('section[id]');
  
  // Smooth scroll functionality
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if(href.length > 1 && href.startsWith('#')) {
        const target = document.querySelector(href);
        if(target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Close mobile nav if open
          if(mainNav && mainNav.classList.contains('open')) {
            mainNav.classList.remove('open');
            navToggle && navToggle.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });

  // Active section highlighting based on scroll position
  const highlightActiveSection = () => {
    let current = '';
    const scrollY = window.pageYOffset;
    const offset = 100; // Offset for header height
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - offset;
      const sectionHeight = section.offsetHeight;
      
      if(scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });
    
    // Update active nav link
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href').substring(1);
      if(href === current) {
        link.classList.add('active');
      }
    });
  };

  // Throttled scroll listener for performance
  let scrollTimeout;
  const onScrollThrottled = () => {
    if(scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      onScroll(); // existing header shadow function
      highlightActiveSection();
      scrollTimeout = null;
    }, 16); // ~60fps
  };

  window.addEventListener('scroll', onScrollThrottled, {passive: true});
  
  // Initial call to set active section on page load
  highlightActiveSection();

  // Simple typing effect (reduced pause for snappier UX)
  function typeLoop(el, words, typeSpeed=60, pause=1200){
    if(!el || !words || !words.length) return;
    let widx=0, ch=0, forward=true;
    const tick = ()=>{
      const word = words[widx];
      if(forward){
        ch++;
        el.textContent = word.slice(0,ch);
        if(ch===word.length){
          forward=false; setTimeout(tick,pause); return;
        }
      } else {
        ch--;
        el.textContent = word.slice(0,ch);
        if(ch===0){ forward=true; widx=(widx+1)%words.length; }
      }
      setTimeout(tick, forward?typeSpeed:Math.max(20,typeSpeed/2));
    };
    tick();
  }

  const typedEl = document.getElementById('typed');
  typeLoop(typedEl, ['DevOps Engineer','Cloud Platform Engineer','Kubernetes & Helm','Infrastructure as Code'], 60, 1200);

  // Build skill bars from data attributes
  document.querySelectorAll('.skill').forEach(s=>{
    const percent = s.dataset.percent || '70';
    const wrap = document.createElement('div'); wrap.className='bar-wrap';
    const bar = document.createElement('div'); bar.className='bar';
    wrap.appendChild(bar);
    const pct = document.createElement('div'); pct.className='percent'; pct.textContent=percent+'%';
    s.appendChild(wrap);
    s.appendChild(pct);
    // store desired percent
    s.__percent = parseInt(percent,10);
  });

  // Reveal observer (also animate skill bars)
  const observer = new IntersectionObserver((entries, obs)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('visible');
        // animate previous linear bars (legacy) if present
        if(e.target.classList.contains('skill')){
          const bar = e.target.querySelector('.bar');
          const pct = e.target.__percent || 0;
          if(bar) bar.style.width = pct + '%';
        }

        // animate new circular skill-cards
        if(e.target.classList && e.target.classList.contains('skills') || e.target.classList.contains('skills-grid')){
          document.querySelectorAll('.skill-card').forEach(sc=>{
            obs.observe(sc);
          });
        }

        if(e.target.classList && e.target.classList.contains('skill-card')){
          animateSkillCard(e.target);
        }

        // when revealing a container, animate inner skill children too
        e.target.querySelectorAll && e.target.querySelectorAll('.skill').forEach(s=>{
          const bar = s.querySelector('.bar'); if(bar) bar.style.width = (s.__percent||0) + '%';
        });

        obs.unobserve(e.target);
      }
    });
  },{threshold:0.12});

  // observe containers and cards
  document.querySelectorAll('.reveal, .card, .skill, .skills-grid').forEach(el=>observer.observe(el));

  // animate a skill card circular progress from 0 to data-percent
  function animateSkillCard(card){
    if(card.__animated) return; card.__animated = true;
    const pct = parseInt(card.dataset.percent||0,10);
    const circle = card.querySelector('.circle');
    const pctEl = card.querySelector('.pct');
    if(!circle || !pctEl) return;
    let start = 0; const duration = 800; const startTime = performance.now();
    function step(now){
      const t = Math.min(1, (now - startTime)/duration);
      const eased = easeOutCubic(t);
      const current = Math.round(eased * pct);
      // set conic gradient using current percent
      const deg = Math.round((current/100) * 360);
      circle.style.background = `conic-gradient(var(--brand) ${deg}deg, rgba(255,255,255,0.06) ${deg}deg)`;
      pctEl.textContent = current + '%';
      if(t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }

  // Contact form handling with EmailJS integration
  const form = document.getElementById('contact-form');
  const sendBtn = document.querySelector('.send-btn');
  
  // Initialize EmailJS with your public key
  emailjs.init('WO5SiPzVGTE0z-r_F');
  
  if(form){
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const company = document.getElementById('contact-company').value.trim();
      const msg = document.getElementById('contact-message').value.trim();
      
      if(!name||!email||!msg){ 
        showToast('Please fill in all required fields.', 3000); 
        return; 
      }
      
      // Start sending state
      sendBtn && sendBtn.classList.add('sending');
      sendBtn && (sendBtn.disabled = true);
      
      try {
        // Send email using EmailJS
        const templateParams = {
          from_name: name,
          from_email: email,
          company: company || 'Not specified',
          message: msg,
          to_name: 'Pushpendra Singh',
          to_email: 'pushpendrasingh9942@gmail.com'
        };
        
        const response = await emailjs.send(
          'service_dudb0ik',    // Your EmailJS service ID
          'template_gfp83v9',   // Your EmailJS template ID
          templateParams
        );
        
        if (response.status === 200) {
          // Success state
          sendBtn && sendBtn.classList.remove('sending');
          sendBtn && sendBtn.classList.add('sent');
          if(sendBtn) sendBtn.querySelector('.btn-text').textContent = 'Sent ✓';
          
          showToast('Message sent successfully! I\'ll get back to you within 24 hours.', 4000);
          form.reset();
          
          // Reset button after delay
          setTimeout(()=>{
            if(sendBtn){
              sendBtn.classList.remove('sent');
              sendBtn.querySelector('.btn-text').textContent = 'Send Message';
              sendBtn.disabled = false;
            }
          }, 3000);
        }
        
      } catch (error) {
        console.error('EmailJS Error:', error);
        
        // Error state
        sendBtn && sendBtn.classList.remove('sending');
        sendBtn && (sendBtn.disabled = false);
        
        let errorMessage = 'Failed to send message. Please try again or contact me directly.';
        if (error.status === 400) {
          errorMessage = 'Invalid email format. Please check your email address.';
        } else if (error.status === 402) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else if (error.text && error.text.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        }
        
        showToast(errorMessage, 5000);
      }
    });
  }

  // Clear form shortcut
  const clearBtn = document.getElementById('clear-form');
  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{
      form.reset(); document.querySelectorAll('.field').forEach(f=>f.classList.remove('filled')); showToast('Form cleared');
    });
  }

  // floating label support: mark .field.filled when inputs have value
  document.querySelectorAll('.field input, .field textarea').forEach(inp=>{
    const parent = inp.closest('.field');
    const update = ()=>{
      if(inp.value && inp.value.trim().length) parent.classList.add('filled'); else parent.classList.remove('filled');
    };
    inp.addEventListener('input', update);
    inp.addEventListener('blur', update);
    // initialize
    update();
  });

  // copy email button
  document.querySelectorAll('.copy-email').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const email = btn.dataset.email || btn.textContent.trim();
      try{ await navigator.clipboard.writeText(email); showToast('Email copied to clipboard'); }
      catch(e){ showToast('Copied: '+email); }
    });
  });

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if(saved) root.setAttribute('data-theme', saved);
  if(themeToggle){
    themeToggle.addEventListener('click', ()=>{
      const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = cur === 'light' ? 'dark' : 'light';
      if(next === 'light') root.setAttribute('data-theme','light'); else root.removeAttribute('data-theme');
      localStorage.setItem('theme', next);
      themeToggle.textContent = next === 'light' ? '☀️' : '🌙';
    });
  }

  // Highlights auto-rotator (cycles active highlight every few seconds; pauses on hover)
  (function(){
    const hl = document.querySelectorAll('.highlights li');
    if(!hl || hl.length === 0) return;
    let idx = 0, timer = null; const interval = 3000;
    function activate(i){ hl.forEach((el, n)=> el.classList.toggle('active', n===i)); }
    function start(){ timer = setInterval(()=>{ idx = (idx+1) % hl.length; activate(idx); }, interval); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    // set initial and start
    activate(0); start();
    const container = document.querySelector('.highlights');
    if(container){ container.addEventListener('mouseenter', stop); container.addEventListener('mouseleave', start); }
    // allow click to select a highlight
    hl.forEach((el,i)=> el.addEventListener('click', ()=>{ stop(); idx = i; activate(i); setTimeout(start, interval); }));
  })();

  // Skills mini-card rotator (cycles active skill; click/hover control)
  (function(){
    const cards = Array.from(document.querySelectorAll('.skill-mini'));
    if(cards.length === 0) return;
    let i = 0, t = null, delay = 3500;
    function setActive(idx){ cards.forEach((c,n)=> c.classList.toggle('active', n===idx)); }
    function start(){ t = setInterval(()=>{ i = (i+1)%cards.length; setActive(i); }, delay); }
    function stop(){ if(t){ clearInterval(t); t = null; } }
    // init
    setActive(0); start();
    const container = document.querySelector('.skills-cards');
    if(container){ container.addEventListener('mouseenter', stop); container.addEventListener('mouseleave', ()=>{ setTimeout(start, 500); }); }
    cards.forEach((c,idx)=>{
      c.addEventListener('click', ()=>{ stop(); i = idx; setActive(i); setTimeout(start, delay); });
      c.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); } });
    });
  })();

  // simple toast
  function showToast(msg,ms=2600){
    if(!toastEl) return alert(msg);
    toastEl.textContent = msg; toastEl.classList.add('show');
    setTimeout(()=>toastEl.classList.remove('show'), ms);
  }

  // simple project modal (accessible)
  const projectModal = document.getElementById('project-modal');
  const modalContent = projectModal && projectModal.querySelector('.modal-content');
  const modalClose = projectModal && projectModal.querySelector('.modal-close');
  function openProjectModal(title, html){
    if(!projectModal) return;
    projectModal.classList.add('open');
    projectModal.setAttribute('aria-hidden','false');
    modalContent.innerHTML = `<h3 style="margin-top:0">${title}</h3><div>${html}</div>`;
    modalClose && modalClose.focus();
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onModalKey);
  }
  function closeProjectModal(){
    if(!projectModal) return;
    projectModal.classList.remove('open');
    projectModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKey);
  }
  function onModalKey(e){ if(e.key === 'Escape') closeProjectModal(); }
  // wire up card links
  document.querySelectorAll('.card-link[data-project]').forEach(a=>{
    a.addEventListener('click',(ev)=>{
      ev.preventDefault();
      openProjectModal(a.dataset.project, a.dataset.desc || a.closest('.card')?.querySelector('p')?.innerHTML || '');
    });
  });
  if(modalClose) modalClose.addEventListener('click', closeProjectModal);
  projectModal && projectModal.querySelector('.modal-backdrop') && projectModal.querySelector('.modal-backdrop').addEventListener('click', closeProjectModal);

  // expose for debugging
  window.__showToast = showToast;
})();
