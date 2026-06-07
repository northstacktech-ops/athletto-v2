// Splash + Onboarding screens

function Splash({ onDone }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    let anim;
    fetch("assets/athletto-splash.json")
      .then((r) => r.json())
      .then((data) => {
        if (!ref.current || typeof lottie === "undefined") return;
        anim = lottie.loadAnimation({
          container: ref.current,
          renderer: "svg",
          loop: false,
          autoplay: true,
          animationData: data,
        });
        anim.setSpeed(2 / 3); // 2s animation stretched to fill ~3s
      })
      .catch(() => {});
    const t = setTimeout(() => onDone && onDone(), 3000); // splash lasts exactly 3s
    return () => { clearTimeout(t); if (anim) anim.destroy(); };
  }, []);
  return (
    <div className="screen enter-fade" style={{ background: "var(--lime)" }}>
      <StatusBar dark />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div ref={ref} style={{ width: 680, height: 383, flex: "0 0 auto" }}></div>
      </div>
    </div>
  );
}

const ONB_SLIDES = [
  { image: "assets/onboarding-soccer.png", imgPos: "50% 32%" },
  { image: "assets/onboarding-volley.png", imgPos: "50% 14%" },
];

function Onboarding({ onDone }) {
  const [index, setIndex] = React.useState(0);
  const isLast = index === ONB_SLIDES.length - 1;
  const next = () => (isLast ? onDone && onDone() : setIndex((i) => i + 1));

  return (
    <div className="screen enter-fade" style={{ background: "#000", overflow: "hidden" }}>
      {/* sliding background track (foto desliza com parallax suave) */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: 0,
        display: "flex", width: "200%",
        transform: `translateX(${index * -50}%)`,
        transition: "transform 0.7s var(--ease)",
      }}>
        {ONB_SLIDES.map((s, i) => (
          <div key={i} style={{ width: "50%", height: "100%", overflow: "hidden" }}>
            <div style={{
              width: "100%", height: "100%",
              backgroundImage: `url(${s.image})`,
              backgroundPosition: s.imgPos,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              transform: i === index ? "scale(1)" : "scale(1.06)",
              transition: "transform 0.9s var(--ease)",
            }}></div>
          </div>
        ))}
      </div>

      {/* fixed gradient for legibility */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to top, #000 20%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.25) 100%)",
      }}></div>

      {/* fixed foreground content */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
        <StatusBar light />
        <div style={{ flex: 1 }}></div>
        <div style={{ padding: "0 0 50px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src="assets/logo.png" alt="Athletto" style={{ height: 44, width: "auto", marginBottom: 24 }} />
          <div style={{ padding: "0 40px", textAlign: "center" }}>
            <h2 style={{ fontWeight: 700, fontSize: 24, lineHeight: 1.25, color: "#fff" }}>
              Acompanhe seus <span style={{ color: "var(--lime)" }}>treinos</span> de forma prática
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.45, color: "#fff", marginTop: 18, maxWidth: 313, marginLeft: "auto", marginRight: "auto" }}>
              Treinos, mensalidades, calendário, e tudo que você precisa na palma da sua mão
            </p>
          </div>
          <div style={{ marginTop: 44, width: "100%", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="tap" onClick={onDone} style={{ fontSize: 14, color: "#fff" }}>Pular</button>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {ONB_SLIDES.map((_, i) => (
                <span key={i} onClick={() => setIndex(i)} style={{
                  height: 9,
                  width: i === index ? 26 : 9,
                  borderRadius: 999,
                  cursor: "pointer",
                  background: i === index ? "var(--lime)" : "rgba(217,217,217,0.5)",
                  transition: "width 0.5s var(--ease), background-color 0.4s var(--ease)",
                }}></span>
              ))}
            </div>
            <button className="tap" onClick={next} style={{ fontSize: 14, fontWeight: 700, color: "var(--lime)" }}>
              {isLast ? "Finalizar" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Splash, Onboarding });
