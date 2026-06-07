// Home dashboard + Agenda

function StatCard({ icon, title, sub, onClick }) {
  return (
    <div className="tap" onClick={onClick} style={{
      flex: 1,
      background: "#242424",
      borderRadius: 16,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name={icon} size={16} color="var(--lime)" />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{title}</span>
      </div>
      <span style={{ fontWeight: 500, fontSize: 12, color: "#B2B2B2" }}>{sub}</span>
    </div>);

}

function EventCard({ title, date }) {
  return (
    <div style={{
      background: "#242424",
      borderRadius: 8,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="schedule" size={16} color="var(--lime)" />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: "24px" }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff", display: "inline-block", marginLeft: 4 }}></span>
        <span style={{ fontSize: 12, color: "#fff" }}>{date}</span>
      </div>
    </div>);

}

function SectionHeading({ icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Icon name={icon} size={20} color="var(--lime)" />
      <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{children}</span>
    </div>);

}

function Home({ onNavigate }) {
  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      {/* lime header */}
      <div style={{ background: "var(--lime)", flex: "0 0 auto" }}>
        <StatusBar dark />
        <div style={{ padding: "8px 24px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <img src="assets/eric.jpg" alt="Eric" style={{ width: 57, height: 57, borderRadius: "50%", objectFit: "cover", objectPosition: "center top" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontStyle: "italic", fontWeight: 700, fontSize: 20, color: "#000", lineHeight: 1.1 }}>Oi, Eric</div>
            <div style={{ fontWeight: 500, fontSize: 14, color: "#000", marginTop: 5 }}>Pronto para o dia de hoje?</div>
          </div>
          <button className="tap" onClick={() => onNavigate && onNavigate("alertas")} style={{ color: "#1A1A1A" }}>
            <Icon name="notifications" size={30} />
          </button>
        </div>
      </div>

      <div className="screen-scroll" style={{ padding: "24px 24px 8px", display: "flex", flexDirection: "column", gap: 28 }}>
        {/* quote */}
        <div style={{
          background: "#242424",
          border: "1px solid var(--lime)",
          borderRadius: 8,
          padding: "0 10px",
          textAlign: "center", height: "94px", width: "345px",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ fontStyle: "italic", fontWeight: 500, fontSize: 15, lineHeight: "21px", color: "var(--lime)", whiteSpace: "nowrap" }}>
            “Menos desculpa, mais suor. A consistência<br />de hoje é a vitória de amanhã.”
          </span>
        </div>

        {/* stat grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <StatCard icon="payments" title="Pagamento" sub="2 pendentes" onClick={() => onNavigate && onNavigate("financeiro")} />
            <StatCard icon="percent" title="Frequência" sub="85% este mês" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <StatCard icon="error" title="Avisos" sub="4 não lidos" onClick={() => onNavigate && onNavigate("alertas")} />
            <StatCard icon="calendar_today" title="Próx. Eventos" sub="4 esta semana" onClick={() => onNavigate && onNavigate("agenda")} />
          </div>
        </div>

        {/* next events */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionHeading icon="calendar_today">Próximos Eventos</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <EventCard title="Treino Oficial do Time" date="12/05/2026  - 14:45h" />
            <EventCard title="Treino Teórico" date="24/05/2026  - 14:45h" />
            <EventCard title="Feijoada beneficente" date="31/05/2026  - 14:45h" />
          </div>
        </div>
      </div>

      <BottomNav active="home" onNavigate={onNavigate} />
    </div>);

}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function Agenda({ onNavigate }) {
  const [monthIndex, setMonthIndex] = React.useState(5); // Junho
  const [weekStart, setWeekStart] = React.useState(16);
  const [active, setActive] = React.useState(2); // 18 Ter
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const dim = DAYS_IN_MONTH[monthIndex];
  const days = Array.from({ length: 7 }, (_, i) => ({ d: (weekStart - 1 + i) % dim + 1, w: WEEKDAYS[i] }));

  const shiftWeek = (dir) => {
    let ns = weekStart + dir * 7;
    let m = monthIndex;
    if (ns > dim) {ns -= dim;m = (m + 1) % 12;} else
    if (ns < 1) {m = (m + 11) % 12;ns += DAYS_IN_MONTH[m];}
    setMonthIndex(m);setWeekStart(ns);setPickerOpen(false);
  };

  const pickMonth = (m) => {setMonthIndex(m);setWeekStart(1);setActive(0);setPickerOpen(false);};

  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      <StatusBar light />
      {pickerOpen && <div onClick={() => setPickerOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 20 }}></div>}
      <div className="screen-scroll" style={{ paddingBottom: 8 }}>
        {/* month */}
        <div style={{ position: "relative", zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0 0" }}>
          <button className="tap" onClick={() => setPickerOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff" }}>
            <Icon name="calendar_today" size={20} color="var(--lime)" />
            <span style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>{MONTHS[monthIndex]}</span>
            <Icon name="chevron" size={20} color="var(--lime)" style={{ transform: pickerOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s var(--ease)" }} />
          </button>

          {pickerOpen &&
          <div className="enter-fade" style={{ position: "absolute", top: 52, width: 210, maxHeight: 256, overflowY: "auto", background: "#242424", border: "1px solid #737373", borderRadius: 12, padding: 6, boxShadow: "0 16px 40px rgba(0,0,0,0.55)" }}>
              {MONTHS.map((m, i) =>
            <button key={m} className="tap" onClick={() => pickMonth(i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", borderRadius: 8, background: i === monthIndex ? "rgba(199,239,102,0.14)" : "transparent", color: i === monthIndex ? "var(--lime)" : "#fff", fontSize: 14, fontWeight: i === monthIndex ? 700 : 500 }}>
                  {m}
                  {i === monthIndex && <Icon name="check" size={18} color="var(--lime)" />}
                </button>
            )}
            </div>
          }

          {/* date strip */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 18px" }}>
            <button className="tap" onClick={() => shiftWeek(-1)} style={{ display: "flex" }}><Icon name="double_left" size={24} color="var(--lime)" /></button>
            <div style={{ display: "flex", flex: 1, justifyContent: "space-between", padding: "0 6px" }}>
              {days.map((day, i) =>
              <button key={i} className="tap" onClick={() => setActive(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: 24 }}>
                  <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.3px", color: i === active ? "var(--lime)" : "#666" }}>{day.d}</span>
                  <span style={{ fontSize: 10, letterSpacing: "0.3px", color: i === active ? "var(--lime)" : "#666" }}>{day.w}</span>
                </button>
              )}
            </div>
            <button className="tap" onClick={() => shiftWeek(1)} style={{ display: "flex" }}><Icon name="double_right" size={24} color="var(--lime)" /></button>
          </div>
        </div>

        <div style={{ padding: "28px 24px 0", display: "flex", flexDirection: "column", gap: 28 }}>
          {/* total card */}
          <div style={{ background: "#242424", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="calendar_today" size={16} color="var(--lime)" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Total de eventos hoje</span>
            </div>
            <span style={{ fontWeight: 500, fontSize: 12, color: "#B2B2B2" }}>03 eventos</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionHeading icon="calendar_today">Hoje</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <EventCard title="Treino Oficial do Time" date="12/05/2026  - 14:45h" />
              <EventCard title="Treino Teórico" date="12/05/2026  - 15:45h" />
              <EventCard title="Feijoada beneficente" date="12/05/2026  - 16:45h" />
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="agenda" onNavigate={onNavigate} />
    </div>);

}

Object.assign(window, { Home, Agenda });