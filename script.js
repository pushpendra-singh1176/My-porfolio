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

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(href.length>1 && href.startsWith('#')){
        const target = document.querySelector(href);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth',block:'start'});
          // close mobile nav
          if(mainNav.classList.contains('open')) mainNav.classList.remove('open');
        }
      }
    });
  });

  // Simple typing effect
  function typeLoop(el, words, typeSpeed=60, pause=1800){
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
  typeLoop(typedEl, ['DevOps Engineer','Cloud Platform Engineer','Kubernetes, Helm & ArgoCD','Infrastructure as Code'], 60, 1600);

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

  // Contact form handling — client-side UX: validation, send animation, reset
  const form = document.getElementById('contact-form');
  const sendBtn = document.querySelector('.send-btn');
  if(form){
    form.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const msg = document.getElementById('contact-message').value.trim();
      if(!name||!email||!msg){ showToast('Please complete the form.'); return; }
      // start sending state
      sendBtn && sendBtn.classList.add('sending');
      sendBtn && (sendBtn.disabled = true);
      // simulate network request
      setTimeout(()=>{
        sendBtn && sendBtn.classList.remove('sending');
        sendBtn && sendBtn.classList.add('sent');
        if(sendBtn) sendBtn.querySelector('.btn-text').textContent = 'Sent ✓';
        showToast('Message sent — thanks!');
        form.reset();
        // reset styles on fields
        document.querySelectorAll('.field').forEach(f=>f.classList.remove('filled'));
        // after a delay, restore button
        setTimeout(()=>{
          if(sendBtn){
            sendBtn.classList.remove('sent');
            sendBtn.querySelector('.btn-text').textContent = 'Send Message';
            sendBtn.disabled = false;
          }
        },2200);
      },1300);
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

  // simple toast
  function showToast(msg,ms=2600){
    if(!toastEl) return alert(msg);
    toastEl.textContent = msg; toastEl.classList.add('show');
    setTimeout(()=>toastEl.classList.remove('show'), ms);
  }

  // expose for debugging
  window.__showToast = showToast;
})();
