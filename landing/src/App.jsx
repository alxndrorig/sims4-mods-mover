import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Sparkles, ContactShadows, Stars } from '@react-three/drei';
import { ReactLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Download, ChevronDown, Rocket, Archive, ShieldCheck } from 'lucide-react';

import bg1 from './assets/bg1.png';
import bg2 from './assets/bg2.png';
import bg3 from './assets/bg3.png';
import bg4 from './assets/bg4.png';

gsap.registerPlugin(ScrollTrigger);

const Plumbob = () => {
  const groupRef = useRef();

  // Create custom geometry for true faceted look (Hexagonal bipyramid), with sharper proportions
  const geometry = useMemo(() => {
    const radius = 1.35; // Increased width
    const height = 3.0;
    const topCone = new THREE.ConeGeometry(radius, height, 6);
    topCone.translate(0, height / 2, 0);
    
    const bottomCone = new THREE.ConeGeometry(radius, height, 6);
    bottomCone.rotateX(Math.PI);
    bottomCone.translate(0, -height / 2, 0);

    const merged = [];
    
    // helper to extract vertices to non-indexed
    const extractToNonIndexed = (geo) => {
      const pos = geo.attributes.position;
      const idx = geo.index;
      for (let i = 0; i < idx.count; i++) {
        const v = idx.array[i];
        merged.push(pos.getX(v), pos.getY(v), pos.getZ(v));
      }
    };
    
    extractToNonIndexed(topCone);
    extractToNonIndexed(bottomCone);

    const nonIndexedGeo = new THREE.BufferGeometry();
    nonIndexedGeo.setAttribute('position', new THREE.Float32BufferAttribute(merged, 3));
    nonIndexedGeo.computeVertexNormals();
    
    return nonIndexedGeo;
  }, []);

  // Colored faces mapping for a sharp, crisp edge look
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff', // base is white, vertex colors dictate shade
      emissive: '#1a3a00',
      emissiveIntensity: 0.3,
      roughness: 0.1, // very shiny and smooth (not frosted)
      metalness: 0.5,
      vertexColors: true, 
    });

    const colors = [
      new THREE.Color('#a3e635'), // neon green
      new THREE.Color('#84cc16'), // mid lime green
      new THREE.Color('#d9f99d'), // intense light highlight (white-ish)
      new THREE.Color('#bef264'), // bright green
      new THREE.Color('#4d7c0f'), // dark green
      new THREE.Color('#3f6212'), // very dark green
      new THREE.Color('#65a30d'), // base green
    ];

    const count = geometry.attributes.position.count;
    const colorArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 3) {
      // Pick a deterministic pseudo-random shade of green from the palette for each face
      const pseudoRandom = Math.sin(i * 12.9898) * 43758.5453;
      const colorIndex = Math.abs(Math.floor(pseudoRandom * 100)) % colors.length;
      const color = colors[colorIndex];
      
      // Assign same color to all 3 vertices of the face for sharp low-poly look
      for (let v = 0; v < 3; v++) {
        colorArray[(i + v) * 3] = color.r;
        colorArray[(i + v) * 3 + 1] = color.g;
        colorArray[(i + v) * 3 + 2] = color.b;
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    return mat;
  }, [geometry]);

  useEffect(() => {
    // Scroll driven animation
    const ctx = gsap.context(() => {
      gsap.to(groupRef.current.rotation, {
        y: Math.PI * 6,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });
      gsap.to(groupRef.current.position, {
        y: -0.5, 
        z: -2,   
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Idle rotation and floating
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
      <group ref={groupRef} scale={[1.2, 1.2, 1.2]} position={[0, -0.2, 0]}>
        
        <mesh geometry={geometry} material={material} />
        
        {/* Inner glow radiating energy outward */}
        <pointLight color="#a3e635" intensity={4} distance={15} position={[0,0,0]} />
      </group>
    </Float>
  );
};

// Horizontal Scroll Layout & Plumbob Scene
const PlumbobScene = () => (
  <div className="fixed md:absolute inset-0 z-10 pointer-events-none h-screen md:h-full w-full overflow-hidden">
    <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <ambientLight intensity={1} color="#ffffff" />
      <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, 5, -10]} intensity={1.5} color="#bef264" />
      <Environment preset="city" />
      <Sparkles count={100} scale={20} size={2} color="#a3e635" speed={0.5} opacity={0.6} noise={0.5} />
      <Plumbob />
    </Canvas>
  </div>
);

const App = () => {
  const containerRef = useRef();

  useEffect(() => {
    // Initialization of GSAP matchMedia for responsive animations
    let mm = gsap.matchMedia();

    // Desktop: Horizontal Scroll
    mm.add("(min-width: 768px)", () => {
      const wrapper = document.querySelector('.horizontal-wrapper');
      const panels = gsap.utils.toArray('.horizontal-panel');
      const bgs = gsap.utils.toArray('.bg-crossfade-img');
      const totalPanels = panels.length;

      // Create a master timeline for the whole Horizontal scroll section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (totalPanels - 1),
          start: 'top top',
          end: () => '+=' + wrapper.offsetWidth,
        }
      });

      // 1) Pinned Horizontal Scroll
      tl.to(panels, {
        xPercent: -100 * (totalPanels - 1),
        ease: 'none',
        duration: totalPanels - 1 // the duration represents the relative chunks of the timeline
      }, 0);

      // 2) Crossfade Effect for Background Images explicitly mapped to the identical timeline
      if (bgs[1]) tl.to(bgs[1], { opacity: 1, ease: 'none', duration: 1 }, 0);
      if (bgs[2]) tl.to(bgs[2], { opacity: 1, ease: 'none', duration: 1 }, 1);
      if (bgs[3]) tl.to(bgs[3], { opacity: 1, ease: 'none', duration: 1 }, 2);
    });

    // Mobile: Vertical Scroll
    mm.add("(max-width: 767px)", () => {
      const panels = gsap.utils.toArray('.horizontal-panel');
      const bgs = gsap.utils.toArray('.bg-crossfade-img');

      panels.forEach((panel, i) => {
        if (i === 0) return; // background 1 is already visible

        gsap.to(bgs[i], {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            start: "top 60%", // Fade starts when the top of the panel is 60% down the screen
            end: "top 20%",   // Fades completely by the time the top is 20% down
            scrub: true,
          }
        });
      });
    });

    return () => mm.revert();
  }, []);

  const handleDownload = () => {
    const hostname = window.location.hostname;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let downloadUrl = 'https://github.com/OWNER/REPO/releases/latest/download/ModsMoverPortable.exe';
    if (hostname.endsWith('github.io') && pathParts.length > 0) {
      downloadUrl = `https://github.com/${hostname.split('.')[0]}/${pathParts[0]}/releases/latest/download/ModsMoverPortable.exe`;
    }
    if (downloadUrl.includes('OWNER/REPO')) {
      alert("Укажите OWNER/REPO в App.jsx, чтобы работала загрузка.");
    } else {
      window.location.href = downloadUrl;
    }
  };

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothTouch: true }}>
      <div className="relative font-sans text-slate-300 w-full overflow-x-hidden bg-black">
        
        {/* --- HORIZONTAL SCROLL CONTAINER --- */}
        <div ref={containerRef} className="w-full h-auto md:h-screen overflow-visible md:overflow-hidden relative">
          
          {/* --- LAYER 0: BACKGROUNDS --- */}
          <div className="fixed md:absolute inset-0 w-full h-screen md:h-full z-0 pointer-events-none">
            <div className="bg-crossfade-img absolute inset-0 bg-cover bg-center filter brightness-50" style={{ backgroundImage: `url(${bg1})`, opacity: 1, zIndex: 1 }}></div>
            <div className="bg-crossfade-img absolute inset-0 bg-cover bg-center filter brightness-50" style={{ backgroundImage: `url(${bg2})`, opacity: 0, zIndex: 2 }}></div>
            <div className="bg-crossfade-img absolute inset-0 bg-cover bg-center filter brightness-50" style={{ backgroundImage: `url(${bg3})`, opacity: 0, zIndex: 3 }}></div>
            <div className="bg-crossfade-img absolute inset-0 bg-cover bg-center filter brightness-50" style={{ backgroundImage: `url(${bg4})`, opacity: 0, zIndex: 4 }}></div>
          </div>

          {/* --- LAYER 1: PLUMBOB --- */}
          <PlumbobScene />

          {/* --- LAYER 2: TEXT/PANELS --- */}
          <div className="horizontal-wrapper relative flex flex-col md:flex-row w-full md:w-[400vw] h-auto md:h-full z-20 pointer-events-auto">
            
            {/* PANEL 1: HERO (Виллоу Крик) */}
            <section className="horizontal-panel w-full md:w-screen min-h-screen md:h-screen flex-shrink-0 relative flex items-center justify-center overflow-hidden">
              
              <div className="text-center relative px-4 w-full">
                <div className="absolute inset-x-0 mx-auto w-full h-[60vh] bg-dark-navy/60 blur-[40px] rounded-full z-[-1] pointer-events-none" />
                
                <h1 className="text-5xl md:text-8xl font-black text-white mb-4 md:mb-6 drop-shadow-2xl tracking-tight z-10 leading-tight">
                  Наведи порядок в <br />
                  <span className="neon-text-green text-neon-green-glow inline-block mt-2 md:mt-4">The Sims 4</span>
                </h1>
                
                <p className="inline-block text-lg md:text-3xl text-slate-200 drop-shadow-xl font-medium bg-dark-navy/80 px-6 md:px-10 py-3 md:py-4 mt-6 md:mt-8 rounded-[2rem] md:rounded-full backdrop-blur-md border border-white/10 z-10">
                  Один клик — и никакой рутины.
                </p>
              </div>
              
              <div className="absolute bottom-10 flex flex-col items-center text-sm font-medium tracking-widest uppercase text-white animate-bounce drop-shadow-lg z-10">
                <span>Крути колесико</span>
                <ChevronDown className="mt-2 text-neon-green" />
              </div>
            </section>

            {/* PANEL 2: FEATURES (Оазис Спрингс) */}
            <section className="horizontal-panel w-full md:w-screen min-h-screen md:h-screen flex-shrink-0 relative flex items-center justify-center overflow-hidden">
              
              <div className="max-w-7xl mx-auto w-full px-4 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center h-full overflow-y-auto pb-24 md:pb-20 pt-[15vh] md:pt-[25vh]">
                
                <div className="space-y-4 md:space-y-8 my-auto md:pr-8 mt-auto md:mt-auto">
                  <div className="glass-dark p-6 md:p-10 rounded-3xl md:rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 md:mb-4">
                      Технологии <span className="neon-text-green">будущего</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-300">
                      Рутинная установка модов осталась в прошлом. Мы создали инструмент, который всё делает за вас.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6 my-auto mb-auto md:mb-auto">
                  <div className="glass-dark p-5 md:p-6 rounded-2xl flex gap-4 md:gap-6 items-start backdrop-blur-md">
                    <div className="bg-neon-green/10 p-3 md:p-4 rounded-xl text-neon-green drop-shadow-[0_0_10px_rgba(132,204,22,0.8)] shrink-0">
                      <Rocket className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Кибер-сортировка</h3>
                      <p className="text-sm md:text-base text-slate-300">Алгоритм мгновенно определяет тип контента и раскладывает по папкам.</p>
                    </div>
                  </div>
                  <div className="glass-dark p-5 md:p-6 rounded-2xl flex gap-4 md:gap-6 items-start backdrop-blur-md">
                    <div className="bg-neon-green/10 p-3 md:p-4 rounded-xl text-neon-green drop-shadow-[0_0_10px_rgba(132,204,22,0.8)] shrink-0">
                      <Archive className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Авто-распаковка</h3>
                      <p className="text-sm md:text-base text-slate-300">Забудьте про извлечение из архивов — ModsMover сделает всё сам.</p>
                    </div>
                  </div>
                  <div className="glass-dark p-5 md:p-6 rounded-2xl flex gap-4 md:gap-6 items-start backdrop-blur-md">
                    <div className="bg-neon-green/10 p-3 md:p-4 rounded-xl text-neon-green drop-shadow-[0_0_10px_rgba(132,204,22,0.8)] shrink-0">
                      <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Блокировка дублей</h3>
                      <p className="text-sm md:text-base text-slate-300">Защищает игру от тормозов, блокируя повторную установку.</p>
                    </div>
                  </div>
                </div>
                
              </div>
            </section>

            {/* PANEL 3: HOW IT WORKS (Винденбург) */}
            <section className="horizontal-panel w-full md:w-screen min-h-screen md:h-screen flex-shrink-0 relative flex flex-col justify-center overflow-hidden">
              
              <div className="max-w-7xl mx-auto w-full px-4 md:px-12 h-full flex flex-col md:justify-center overflow-y-auto pb-24 md:pb-20 pt-[15vh] md:pt-[25vh]">
                <div className="text-center mb-8 md:mb-16 shrink-0">
                  <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-2 md:mb-4 drop-shadow-xl">
                    Путь к порядку <span className="neon-text-green">прост</span>
                  </h2>
                  <p className="text-lg md:text-2xl text-slate-200 drop-shadow-xl font-medium">Всего 3 шага — и ваша игра готова.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pb-10 md:pb-0">
                  {[
                    { num: "01", title: "Скачайте моды", text: "Сохраняйте паки откуда угодно (Patreon, TSR)." },
                    { num: "02", title: "Укажите папку", text: "ModsMover один раз запомнит ваши настройки." },
                    { num: "03", title: "Играйте", text: "Просто нажмите кнопку. Файлы разложатся за секунду!" },
                  ].map((step, i) => (
                    <div key={i} className="glass-dark p-6 md:p-10 rounded-3xl relative overflow-hidden group hover:border-neon-green/50 transition-colors backdrop-blur-md">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-neon-green text-black flex items-center justify-center font-black text-xl md:text-2xl mb-4 md:mb-6">{i+1}</div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-4">{step.title}</h3>
                      <p className="text-base md:text-lg text-slate-300">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* PANEL 4: FINAL CTA (Сан Мишуно) */}
            <section className="horizontal-panel w-full md:w-screen min-h-screen md:h-screen flex-shrink-0 relative flex flex-col items-center justify-center overflow-hidden">
              
              <div className="max-w-4xl mx-auto w-full px-4 flex flex-col h-full overflow-y-auto pb-24 md:pb-10 pt-[15vh]">
                <div className="glass-dark p-6 md:p-12 rounded-[2rem] text-center w-full border border-neon-green/20 relative overflow-hidden backdrop-blur-md shrink-0">
                  <div className="absolute inset-0 bg-neon-green/10 blur-3xl pointer-events-none"></div>
                  
                  <h2 className="text-3xl md:text-6xl font-black text-white mb-4 md:mb-6 relative z-10 drop-shadow-lg leading-tight">
                    Готовы <span className="neon-text-green">обновиться?</span>
                  </h2>
                  
                  <button onClick={handleDownload} className="relative z-10 group inline-flex items-center gap-3 md:gap-4 bg-neon-green hover:bg-[#94d925] text-slate-900 font-bold text-lg md:text-2xl px-8 py-4 md:px-12 md:py-6 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(163,230,53,0.4)]">
                    <Download className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-y-1 transition-transform" />
                    Скачать бесплатно
                  </button>
                </div>

                <div className="mt-8 md:mt-12 w-full space-y-3 md:space-y-4 shrink-0">
                  {[
                    { q: "Поддерживается ли пиратка?", a: "Да, работает на любых версиях игры с папкой Electronic Arts." },
                    { q: "Абсолютно бесплатно?", a: "Да, без рекламы и донатных стен. Инструмент от фанатов для фанатов." },
                    { q: "Безопасно?", a: "Приложение просто перемещает файлы в стандартные папки игры." }
                  ].map((faq, i) => (
                    <details key={i} className="glass-dark rounded-2xl group [&_summary::-webkit-details-marker]:hidden bg-dark-navy/90 border-white/5 backdrop-blur-md">
                      <summary className="cursor-pointer p-4 md:p-6 font-semibold text-base md:text-xl text-white flex justify-between items-center outline-none">
                        {faq.q}
                        <ChevronDown className="group-open:rotate-180 transition-transform text-neon-green shrink-0 ml-4" />
                      </summary>
                      <div className="p-4 md:p-6 pt-0 text-sm md:text-base text-slate-300 border-t border-white/5 mt-2">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>

                <footer className="mt-auto pt-8 md:pt-12 pb-6 text-slate-300 text-xs md:text-sm flex gap-4 md:gap-6 justify-center w-full drop-shadow-md shrink-0">
                  <span>&copy; 2026 ModsMover</span>
                  <a href="https://t.me/+fW2-EvOkkEQ4MGNi" target="_blank" rel="noopener noreferrer" className="hover:text-neon-green transition-colors font-medium">Telegram</a>
                  <a href="https://www.donationalerts.com/r/alxndrorig" target="_blank" rel="noopener noreferrer" className="hover:text-neon-green transition-colors font-medium">Донаты</a>
                </footer>
              </div>
            </section>

          </div>
        </div>
      </div>
    </ReactLenis>
  );
};

export default App;
